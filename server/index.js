require("dotenv").config();
const express = require("express");
const cors = require("cors");
const Stripe = require("stripe");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");

const app = express();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const JWT_SECRET = process.env.JWT_SECRET || "kaloma-dev-secret-change-in-prod";
const FREE_SEARCH_LIMIT = 1;

// ─── Postgres ─────────────────────────────────────────────────────────────────
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("railway") ? { rejectUnauthorized: false } : false,
});

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      is_pro BOOLEAN DEFAULT FALSE,
      stripe_customer_id TEXT,
      search_count INTEGER DEFAULT 0,
      recent_searches JSONB DEFAULT '[]',
      saved_scholarships JSONB DEFAULT '[]',
      scholar_profile JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  console.log("DB ready");
}

async function findUser(email) {
  const { rows } = await pool.query("SELECT * FROM users WHERE LOWER(email) = LOWER($1)", [email]);
  return rows[0] || null;
}
async function findUserById(id) {
  const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
  return rows[0] || null;
}
async function createUser(email, passwordHash) {
  const id = Date.now().toString();
  const { rows } = await pool.query(
    "INSERT INTO users (id, email, password_hash) VALUES ($1, $2, $3) RETURNING *",
    [id, email.toLowerCase(), passwordHash]
  );
  return rows[0];
}
async function updateUser(id, updates) {
  const fields = [];
  const values = [];
  let i = 1;
  const map = {
    isPro: "is_pro", stripeCustomerId: "stripe_customer_id",
    searchCount: "search_count", recentSearches: "recent_searches",
    savedScholarships: "saved_scholarships", scholarProfile: "scholar_profile"
  };
  for (const [key, val] of Object.entries(updates)) {
    const col = map[key] || key;
    fields.push(`${col} = $${i++}`);
    values.push(typeof val === "object" && val !== null ? JSON.stringify(val) : val);
  }
  values.push(id);
  const { rows } = await pool.query(
    `UPDATE users SET ${fields.join(", ")} WHERE id = $${i} RETURNING *`,
    values
  );
  return rows[0] || null;
}
function safeUser(u) {
  if (!u) return null;
  return {
    id: u.id, email: u.email, isPro: u.is_pro,
    stripeCustomerId: u.stripe_customer_id,
    searchCount: u.search_count,
    recentSearches: u.recent_searches || [],
    savedScholarships: u.saved_scholarships || [],
    scholarProfile: u.scholar_profile,
    createdAt: u.created_at,
  };
}

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
    const s = event.data.object;
    const email = s.customer_details?.email;
    if (email) { const user = await findUser(email); if (user) await updateUser(user.id, { isPro: true, stripeCustomerId: s.customer }); }
  }
  if (event.type === "customer.subscription.deleted") {
    const cid = event.data.object.customer;
    const { rows } = await pool.query("SELECT * FROM users WHERE stripe_customer_id = $1", [cid]);
    if (rows[0]) await updateUser(rows[0].id, { isPro: false });
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

function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return res.status(401).json({ error: "Not authenticated" });
  try { req.user = jwt.verify(auth.slice(7), JWT_SECRET); next(); }
  catch { res.status(401).json({ error: "Invalid or expired token. Please log in again." }); }
}

app.post("/api/auth/signup", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password are required" });
  if (password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });
  if (await findUser(email)) return res.status(409).json({ error: "An account with this email already exists" });
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await createUser(email, passwordHash);
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "30d" });
  res.json({ token, user: safeUser(user) });
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password are required" });
  const user = await findUser(email);
  if (!user) return res.status(401).json({ error: "No account found with this email" });
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: "Incorrect password" });
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "30d" });
  res.json({ token, user: safeUser(user) });
});

app.get("/api/auth/me", requireAuth, async (req, res) => {
  const user = await findUserById(req.user.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ user: safeUser(user) });
});

app.post("/api/search", requireAuth, async (req, res) => {
  const { type, university, region } = req.body;
  if (!university?.trim() && !region?.trim()) return res.status(400).json({ error: "Please enter at least a university or region." });
  const user = await findUserById(req.user.id);
  if (!user.is_pro && (user.search_count || 0) >= FREE_SEARCH_LIMIT) {
    return res.status(403).json({ error: "FREE_LIMIT_REACHED", message: "Upgrade to Pro for unlimited searches." });
  }
  const prompt = `You are a scholarship discovery agent. Find 8 real, specific scholarships matching:
- Scholarship Type: ${type || "Any"}
- University: ${university || "Any"}
- Region/Country: ${region || "Worldwide"}
Return ONLY a valid JSON array (no markdown, no explanation):
[{"name":"...","institution":"...","amount":"$X,XXX","type":"Merit-Based","region":"Australia","description":"2-sentence description.","eligibility":"...","gpa":"3.5+","deadline":"Mar 31, 2026","opens":"Nov 1, 2025","url":"https://...","source":"..."}]
Make scholarships realistic and genuinely helpful. Return as many as possible up to 16, minimum 8.`;
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: "claude-sonnet-4-5", max_tokens: 8000, messages: [{ role: "user", content: prompt }] }),
    });
    if (!response.ok) { const err = await response.json(); return res.status(500).json({ error: `Anthropic error: ${JSON.stringify(err)}` }); }
    const data = await response.json();
    const text = data.content?.map(b => b.text || "").join("") || "";
    let scholarships = JSON.parse(text.replace(/```json|```/g, "").trim());
    
    // Merge with stored results from same university+region
    const pastMatches = (user.recent_searches || [])
      .filter(s => s.query && 
        s.query.university?.toLowerCase() === (university||"").toLowerCase() &&
        s.query.region?.toLowerCase() === (region||"").toLowerCase() &&
        s.results?.length)
      .flatMap(s => s.results || []);
    
    // Deduplicate by name+institution
    const seen = new Set(scholarships.map(s => `${s.name}||${s.institution}`));
    const extras = pastMatches.filter(s => !seen.has(`${s.name}||${s.institution}`));
    scholarships = [...scholarships, ...extras].slice(0, 24);
    
    const recentSearches = [{ id: Date.now().toString(), query: { type, university, region }, results: scholarships, searchedAt: new Date().toISOString() }, ...(user.recent_searches || [])].slice(0, 20);
    await updateUser(user.id, { searchCount: (user.search_count || 0) + 1, recentSearches });
    res.json({ scholarships });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/scholarships/save", requireAuth, async (req, res) => {
  const { scholarship } = req.body;
  if (!scholarship) return res.status(400).json({ error: "Scholarship data required" });
  const user = await findUserById(req.user.id);
  const saved = user.saved_scholarships || [];
  const exists = saved.find(s => s.name === scholarship.name && s.institution === scholarship.institution);
  const updatedSaved = exists
    ? saved.filter(s => !(s.name === scholarship.name && s.institution === scholarship.institution))
    : [{ ...scholarship, savedAt: new Date().toISOString() }, ...saved];
  await updateUser(user.id, { savedScholarships: updatedSaved });
  res.json({ saved: !exists, savedScholarships: updatedSaved });
});

app.get("/api/profile", requireAuth, async (req, res) => {
  const user = await findUserById(req.user.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ user: safeUser(user), recentSearches: user.recent_searches || [], savedScholarships: user.saved_scholarships || [], searchCount: user.search_count || 0, searchLimit: user.is_pro ? null : FREE_SEARCH_LIMIT });
});

app.post("/api/scholar-profile", requireAuth, async (req, res) => {
  const { scholarProfile } = req.body;
  if (!scholarProfile) return res.status(400).json({ error: "Profile data required" });
  const updated = await updateUser(req.user.id, { scholarProfile });
  res.json({ user: safeUser(updated) });
});

app.post("/api/match", requireAuth, async (req, res) => {
  const user = await findUserById(req.user.id);
  if (!user.is_pro && (user.search_count || 0) >= FREE_SEARCH_LIMIT) {
    return res.status(403).json({ error: "FREE_LIMIT_REACHED", message: "Upgrade to Pro for unlimited searches." });
  }
  const p = req.body.scholarProfile || user.scholar_profile;
  if (!p) return res.status(400).json({ error: "Please complete your scholar profile first." });
  if (req.body.scholarProfile) await updateUser(user.id, { scholarProfile: p });

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
[{"name":"...","institution":"...","amount":"$X,XXX","type":"Merit-Based","region":"Australia","description":"2-sentence description.","eligibility":"...","gpa":"3.5+","deadline":"Mar 31, 2026","opens":"Nov 1, 2025","url":"https://...","source":"...","matchScore":92,"matchReason":"One sentence explaining why this is a strong match for this specific student."}]
Sort by matchScore descending. Be realistic. Return as many as possible up to 16, minimum 8.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: "claude-sonnet-4-5", max_tokens: 8000, messages: [{ role: "user", content: prompt }] }),
    });
    if (!response.ok) { const err = await response.json(); return res.status(500).json({ error: `Anthropic error: ${JSON.stringify(err)}` }); }
    const data = await response.json();
    const text = data.content?.map(b => b.text || "").join("") || "";
    const scholarships = JSON.parse(text.replace(/```json|```/g, "").trim());
    const recentSearches = [{ id: Date.now().toString(), query: { type: "✦ Best Match", university: p.university, region: p.studyCountry }, results: scholarships, searchedAt: new Date().toISOString(), isBestMatch: true }, ...(user.recent_searches || [])].slice(0, 10);
    await updateUser(user.id, { recentSearches });
    res.json({ scholarships });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/create-checkout", requireAuth, async (req, res) => {
  const { plan } = req.body;
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const prices = { monthly: process.env.STRIPE_MONTHLY_PRICE_ID, annual: process.env.STRIPE_ANNUAL_PRICE_ID };
  try {
    const session = await stripe.checkout.sessions.create({ mode: "subscription", payment_method_types: ["card"], customer_email: req.user.email, line_items: [{ price: prices[plan] || prices.monthly, quantity: 1 }], success_url: `${clientUrl}/?session_id={CHECKOUT_SESSION_ID}&paid=true`, cancel_url: `${clientUrl}/`, allow_promotion_codes: true });
    res.json({ url: session.url });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/api/verify-session/:sessionId", requireAuth, async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);
    const paid = session.payment_status === "paid" || session.status === "complete";
    if (paid) await updateUser(req.user.id, { isPro: true, stripeCustomerId: session.customer });
    res.json({ paid, user: safeUser(await findUserById(req.user.id)) });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// ─── Essay Assistant ──────────────────────────────────────────────────────────
app.post("/api/essay", requireAuth, async (req, res) => {
  const user = await findUserById(req.user.id);
  if (!user.is_pro) return res.status(403).json({ error: "PRO_REQUIRED", message: "Essay Assistant is a Pro feature." });

  const { scholarship, essayPrompt, background } = req.body;
  if (!scholarship || !essayPrompt) return res.status(400).json({ error: "Scholarship and essay prompt are required." });

  const profile = user.scholar_profile || {};

  const prompt = `You are an expert scholarship application writer. Write a compelling, authentic scholarship essay for this student.

SCHOLARSHIP:
- Name: ${scholarship.name}
- Institution: ${scholarship.institution}
- Amount: ${scholarship.amount}
- Type: ${scholarship.type}
- Eligibility: ${scholarship.eligibility || "Not specified"}

ESSAY PROMPT:
"${essayPrompt}"

STUDENT BACKGROUND:
${background ? background : "Not provided"}
${profile.studyLevel ? `- Study Level: ${profile.studyLevel}` : ""}
${profile.fieldOfStudy ? `- Field of Study: ${profile.fieldOfStudy}` : ""}
${profile.university ? `- University: ${profile.university}` : ""}
${profile.nationality ? `- Nationality: ${profile.nationality}` : ""}
${profile.achievements ? `- Achievements: ${profile.achievements}` : ""}
${profile.careerGoals ? `- Career Goals: ${profile.careerGoals}` : ""}

INSTRUCTIONS:
- Write 400-600 words, in first person
- Open with a compelling hook, not "I am applying for..."
- Weave in specific details from the student's background
- Connect their goals directly to what this scholarship funds
- End with a strong, forward-looking closing statement
- Sound authentic, not corporate or AI-generated
- Do not include a title or heading, just the essay body

Write the essay now:`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: "claude-sonnet-4-5", max_tokens: 2000, messages: [{ role: "user", content: prompt }] }),
    });
    if (!response.ok) { const err = await response.json(); return res.status(500).json({ error: `Anthropic error: ${JSON.stringify(err)}` }); }
    const data = await response.json();
    const essay = data.content?.map(b => b.text || "").join("") || "";
    res.json({ essay });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/health", (_, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3001;
initDB().then(() => app.listen(PORT, () => console.log(`Kaloma server running on :${PORT}`)));
