require("dotenv").config();
const express = require("express");
const cors = require("cors");
const Stripe = require("stripe");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");

const app = express();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const JWT_SECRET = process.env.JWT_SECRET || "scholarai-dev-secret-change-in-prod";
const FREE_SEARCH_LIMIT = 1;

// ─── Database ─────────────────────────────────────────────────────────────────
const DB_PATH = path.join(__dirname, "db.json");
function readDB() {
  if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, JSON.stringify({ users: [] }, null, 2));
  return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
}
function writeDB(data) { fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2)); }
function findUser(email) { return readDB().users.find(u => u.email.toLowerCase() === email.toLowerCase()); }
function findUserById(id) { return readDB().users.find(u => u.id === id); }
function createUser(email, passwordHash) {
  const db = readDB();
  const user = { id: Date.now().toString(), email: email.toLowerCase(), passwordHash, isPro: false, stripeCustomerId: null, searchCount: 0, recentSearches: [], savedScholarships: [], scholarProfile: null, createdAt: new Date().toISOString() };
  db.users.push(user); writeDB(db); return user;
}
function updateUser(id, updates) {
  const db = readDB(); const idx = db.users.findIndex(u => u.id === id);
  if (idx !== -1) { db.users[idx] = { ...db.users[idx], ...updates }; writeDB(db); return db.users[idx]; }
  return null;
}
function safeUser(user) { const { passwordHash, ...safe } = user; return safe; }

// ─── Stripe webhook ───────────────────────────────────────────────────────────
app.post("/api/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;
  try {
    event = process.env.STRIPE_WEBHOOK_SECRET
      ? stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET)
      : JSON.parse(req.body.toString());
  } catch (err) { return res.status(400).send(`Webhook Error: ${err.message}`); }
  if (event.type === "checkout.session.completed") {
    const s = event.data.object; const email = s.customer_details?.email;
    if (email) { const user = findUser(email); if (user) updateUser(user.id, { isPro: true, stripeCustomerId: s.customer }); }
  }
  if (event.type === "customer.subscription.deleted") {
    const cid = event.data.object.customer;
    const user = readDB().users.find(u => u.stripeCustomerId === cid);
    if (user) updateUser(user.id, { isPro: false });
  }
  res.json({ received: true });
});

app.use(express.json());
app.use(cors({ 
  origin: (origin, callback) => {
    const allowed = [
      process.env.CLIENT_URL,
      "http://localhost:5173",
      "https://precious-intuition-production.up.railway.app",
      "https://www.kaloma.app",
      "https://kaloma.app"
    ].filter(Boolean).map(u => u.replace(/\/$/, ""));
    if (!origin || allowed.includes((origin || "").replace(/\/$/, ""))) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

// ─── Auth middleware ──────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return res.status(401).json({ error: "Not authenticated" });
  try { req.user = jwt.verify(auth.slice(7), JWT_SECRET); next(); }
  catch { res.status(401).json({ error: "Invalid or expired token. Please log in again." }); }
}

// ─── Auth routes ──────────────────────────────────────────────────────────────
app.post("/api/auth/signup", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password are required" });
  if (password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });
  if (findUser(email)) return res.status(409).json({ error: "An account with this email already exists" });
  const passwordHash = await bcrypt.hash(password, 10);
  const user = createUser(email, passwordHash);
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "30d" });
  res.json({ token, user: safeUser(user) });
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password are required" });
  const user = findUser(email);
  if (!user) return res.status(401).json({ error: "No account found with this email" });
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: "Incorrect password" });
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "30d" });
  res.json({ token, user: safeUser(user) });
});

app.get("/api/auth/me", requireAuth, (req, res) => {
  const user = findUserById(req.user.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ user: safeUser(user) });
});

// ─── Search ───────────────────────────────────────────────────────────────────
app.post("/api/search", requireAuth, async (req, res) => {
  const { type, university, region } = req.body;
  if (!university?.trim() && !region?.trim()) return res.status(400).json({ error: "Please enter at least a university or region." });
  const user = findUserById(req.user.id);
  if (!user.isPro && (user.searchCount || 0) >= FREE_SEARCH_LIMIT) {
    return res.status(403).json({ error: "FREE_LIMIT_REACHED", message: "Upgrade to Pro for unlimited searches." });
  }
  const prompt = `You are a scholarship discovery agent. Find 8 real, specific scholarships matching:
- Scholarship Type: ${type || "Any"}
- University: ${university || "Any"}
- Region/Country: ${region || "Worldwide"}
Return ONLY a valid JSON array (no markdown, no explanation):
[{"name":"...","institution":"...","amount":"$X,XXX","type":"Merit-Based","region":"Australia","description":"2-sentence description.","eligibility":"...","gpa":"3.5+","deadline":"Mar 31, 2026","opens":"Nov 1, 2025","url":"https://...","source":"..."}]
Make scholarships realistic and genuinely helpful. Return exactly 8.`;
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: "claude-sonnet-4-5", max_tokens: 4000, messages: [{ role: "user", content: prompt }] }),
    });
    if (!response.ok) { const err = await response.json(); return res.status(500).json({ error: `Anthropic error: ${JSON.stringify(err)}` }); }
    const data = await response.json();
    const text = data.content?.map(b => b.text || "").join("") || "";
    const scholarships = JSON.parse(text.replace(/```json|```/g, "").trim());
    const recentSearches = [{ id: Date.now().toString(), query: { type, university, region }, results: scholarships, searchedAt: new Date().toISOString() }, ...(user.recentSearches || [])].slice(0, 10);
    updateUser(user.id, { searchCount: (user.searchCount || 0) + 1, recentSearches });
    res.json({ scholarships });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Save / unsave scholarship ────────────────────────────────────────────────
app.post("/api/scholarships/save", requireAuth, (req, res) => {
  const { scholarship } = req.body;
  if (!scholarship) return res.status(400).json({ error: "Scholarship data required" });
  const user = findUserById(req.user.id);
  const saved = user.savedScholarships || [];
  const exists = saved.find(s => s.name === scholarship.name && s.institution === scholarship.institution);
  const updatedSaved = exists
    ? saved.filter(s => !(s.name === scholarship.name && s.institution === scholarship.institution))
    : [{ ...scholarship, savedAt: new Date().toISOString() }, ...saved];
  updateUser(user.id, { savedScholarships: updatedSaved });
  res.json({ saved: !exists, savedScholarships: updatedSaved });
});

// ─── Get profile ──────────────────────────────────────────────────────────────
app.get("/api/profile", requireAuth, (req, res) => {
  const user = findUserById(req.user.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ user: safeUser(user), recentSearches: user.recentSearches || [], savedScholarships: user.savedScholarships || [], searchCount: user.searchCount || 0, searchLimit: user.isPro ? null : FREE_SEARCH_LIMIT });
});

// ─── Save scholar profile ─────────────────────────────────────────────────────
app.post("/api/scholar-profile", requireAuth, (req, res) => {
  const { scholarProfile } = req.body;
  if (!scholarProfile) return res.status(400).json({ error: "Profile data required" });
  const updated = updateUser(req.user.id, { scholarProfile });
  res.json({ user: safeUser(updated) });
});

// ─── Find Best Match ──────────────────────────────────────────────────────────
app.post("/api/match", requireAuth, async (req, res) => {
  const user = findUserById(req.user.id);
  if (!user.isPro) return res.status(403).json({ error: "PRO_REQUIRED", message: "Find Best Match is a Pro feature." });
  const p = req.body.scholarProfile || user.scholarProfile;
  if (!p) return res.status(400).json({ error: "Please complete your scholar profile first." });

  // Save the profile if submitted fresh
  if (req.body.scholarProfile) updateUser(user.id, { scholarProfile: p });

  const prompt = `You are an expert scholarship matching agent. Based on this student's profile, find 8 real scholarships they are most likely to qualify for and win.

STUDENT PROFILE:
- Study Level: ${p.studyLevel}
- Field of Study: ${p.fieldOfStudy}
- GPA / Academic Score: ${p.gpa || "Not specified"}
- Nationality: ${p.nationality}
- Country Studying In: ${p.studyCountry}
- University: ${p.university || "Not specified"}
- Financial Need: ${p.financialNeed}
- Extracurriculars / Achievements: ${p.achievements || "Not specified"}
- Career Goals: ${p.careerGoals || "Not specified"}
- Demographic Background: ${p.demographics || "Not specified"}

For each scholarship, analyse how well it matches this student and assign a matchScore (0-100).

Return ONLY a valid JSON array (no markdown):
[{
  "name":"...","institution":"...","amount":"$X,XXX","type":"Merit-Based","region":"Australia",
  "description":"2-sentence description.","eligibility":"...","gpa":"3.5+",
  "deadline":"Mar 31, 2026","opens":"Nov 1, 2025","url":"https://...","source":"...",
  "matchScore": 92,
  "matchReason": "One sentence explaining why this is a strong match for this specific student."
}]

Sort by matchScore descending. Be realistic — only 90+ for near-perfect fit. Return exactly 8.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: "claude-sonnet-4-5", max_tokens: 4000, messages: [{ role: "user", content: prompt }] }),
    });
    if (!response.ok) { const err = await response.json(); return res.status(500).json({ error: `Anthropic error: ${JSON.stringify(err)}` }); }
    const data = await response.json();
    const text = data.content?.map(b => b.text || "").join("") || "";
    const scholarships = JSON.parse(text.replace(/```json|```/g, "").trim());
    const recentSearches = [{ id: Date.now().toString(), query: { type: "✦ Best Match", university: p.university, region: p.studyCountry }, results: scholarships, searchedAt: new Date().toISOString(), isBestMatch: true }, ...(user.recentSearches || [])].slice(0, 10);
    updateUser(user.id, { recentSearches });
    res.json({ scholarships });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Stripe checkout ──────────────────────────────────────────────────────────
app.post("/api/create-checkout", requireAuth, async (req, res) => {
  const { plan } = req.body;
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const prices = { monthly: process.env.STRIPE_MONTHLY_PRICE_ID, annual: process.env.STRIPE_ANNUAL_PRICE_ID };
  try {
    const session = await stripe.checkout.sessions.create({ mode: "subscription", payment_method_types: ["card"], customer_email: req.user.email, line_items: [{ price: prices[plan] || prices.monthly, quantity: 1 }], success_url: `${clientUrl}/?session_id={CHECKOUT_SESSION_ID}&paid=true`, cancel_url: `${clientUrl}/`, allow_promotion_codes: true });
    res.json({ url: session.url });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Verify Stripe session ────────────────────────────────────────────────────
app.get("/api/verify-session/:sessionId", requireAuth, async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);
    const paid = session.payment_status === "paid" || session.status === "complete";
    if (paid) updateUser(req.user.id, { isPro: true, stripeCustomerId: session.customer });
    res.json({ paid, user: safeUser(findUserById(req.user.id)) });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.get("/health", (_, res) => res.json({ ok: true }));
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`ScholarAI server running on :${PORT}`));
