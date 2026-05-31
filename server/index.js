require("dotenv").config();
const express = require("express");
const cors = require("cors");
const Stripe = require("stripe");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");
const cron = require("node-cron");

const app = express();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const JWT_SECRET = process.env.JWT_SECRET || "kaloma-dev-secret-change-in-prod";
const FREE_SEARCH_LIMIT = 1;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = "Kaloma <reminders@kaloma.app>";

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
      reminders JSONB DEFAULT '[]',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  // Add reminders column if upgrading existing DB
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reminders JSONB DEFAULT '[]'`);
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
    savedScholarships: "saved_scholarships", scholarProfile: "scholar_profile",
    reminders: "reminders"
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
    reminders: u.reminders || [],
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
  const isFree = !user.is_pro;
  const resultCount = isFree ? 3 : 16;
  const prompt = `You are a scholarship discovery agent. Find real, specific scholarships matching:
- Scholarship Type: ${type || "Any"}
- University: ${university || "Any"}
- Region/Country: ${region || "Worldwide"}
Return ONLY a valid JSON array (no markdown, no explanation):
[{"name":"...","institution":"...","amount":"$X,XXX","type":"Merit-Based","region":"Australia","description":"2-sentence description.","eligibility":"...","gpa":"3.5+","deadline":"Mar 31, 2026","opens":"Nov 1, 2025","url":"https://...","source":"..."}]
Make scholarships realistic and genuinely helpful. Return exactly ${resultCount} results.`;
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: "claude-sonnet-4-5", max_tokens: isFree ? 2500 : 8000, messages: [{ role: "user", content: prompt }] }),
    });
    if (!response.ok) { const err = await response.json(); return res.status(500).json({ error: `Anthropic error: ${JSON.stringify(err)}` }); }
    const data = await response.json();
    const text = data.content?.map(b => b.text || "").join("") || "";
    let scholarships = JSON.parse(text.replace(/```json|```/g, "").trim());

    if (!isFree) {
      // Merge with stored results from same university+region for pro users
      const pastMatches = (user.recent_searches || [])
        .filter(s => s.query &&
          s.query.university?.toLowerCase() === (university||"").toLowerCase() &&
          s.query.region?.toLowerCase() === (region||"").toLowerCase() &&
          s.results?.length)
        .flatMap(s => s.results || []);
      const seen = new Set(scholarships.map(s => `${s.name}||${s.institution}`));
      const extras = pastMatches.filter(s => !seen.has(`${s.name}||${s.institution}`));
      scholarships = [...scholarships, ...extras].slice(0, 24);
    }

    const recentSearches = [{ id: Date.now().toString(), query: { type, university, region }, results: scholarships, searchedAt: new Date().toISOString() }, ...(user.recent_searches || [])].slice(0, 20);
    await updateUser(user.id, { searchCount: (user.search_count || 0) + 1, recentSearches });
    const totalFound = isFree ? (Math.floor(Math.random() * 16) + 15) : scholarships.length;
    res.json({ scholarships, totalFound });
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

// ─── Search Chat Agent ────────────────────────────────────────────────────────
app.post("/api/chat", async (req, res) => {
  const { messages } = req.body;
  if (!Array.isArray(messages) || !messages.length) {
    return res.status(400).json({ error: "Messages required" });
  }

  const system = `You are Kaloma's scholarship search assistant. Your job is to gather a student's key details through friendly conversation so you can find their best scholarship matches.

Required fields to collect before searching:
1. studyLevel — must be exactly one of: "Undergraduate", "Graduate / Masters", "PhD / Doctoral", "High School", "Vocational / TAFE"
2. fieldOfStudy — e.g. "Computer Science", "Medicine", "Law"
3. nationality — their citizenship/passport country
4. studyCountry — the country they are currently studying in

Also collect if the user mentions them (optional):
- university, gpa, financialNeed (one of: "No financial need", "Some financial need", "Significant financial need", "Prefer not to say"), careerGoals, achievements, demographics

Conversation rules:
- Be warm and concise — max 2 short sentences per reply
- Ask only 1–2 questions at a time, never more
- Extract info intelligently from what the user says (e.g. "doing my PhD in ML" → studyLevel=PhD / Doctoral, fieldOfStudy=Machine Learning)
- Once you have all 4 required fields confirmed, set ready=true immediately

CRITICAL: Always respond with ONLY valid JSON, no other text, no markdown:
{"message":"your reply here","ready":false,"collected":{"studyLevel":"","fieldOfStudy":"","nationality":"","studyCountry":"","university":"","gpa":"","financialNeed":"","careerGoals":"","achievements":"","demographics":""}}

When all 4 required fields are collected, respond with ready=true and all collected fields filled in:
{"message":"Perfect, I have everything I need — searching now!","ready":true,"collected":{"studyLevel":"PhD / Doctoral","fieldOfStudy":"Machine Learning","nationality":"Australian","studyCountry":"Australia","university":"","gpa":"","financialNeed":"","careerGoals":"","achievements":"","demographics":""}}`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 400, system, messages }),
    });
    if (!response.ok) return res.status(500).json({ error: "AI error" });
    const data = await response.json();
    const text = data.content?.map(b => b.text || "").join("").trim() || "";
    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    res.json({ message: parsed.message || "Tell me about yourself.", ready: !!parsed.ready, profile: parsed.ready ? parsed.collected : null });
  } catch (e) {
    res.json({ message: "Tell me about yourself — what are you studying and where are you from?", ready: false, profile: null });
  }
});

app.post("/api/match", requireAuth, async (req, res) => {
  const user = await findUserById(req.user.id);
  if (!user.is_pro && (user.search_count || 0) >= FREE_SEARCH_LIMIT) {
    return res.status(403).json({ error: "FREE_LIMIT_REACHED", message: "Upgrade to Pro for unlimited searches." });
  }
  const p = req.body.scholarProfile || user.scholar_profile;
  if (!p) return res.status(400).json({ error: "Please complete your scholar profile first." });
  if (req.body.scholarProfile) await updateUser(user.id, { scholarProfile: p });

  const isFree = !user.is_pro;
  const resultCount = isFree ? 3 : 16;
  const prompt = `You are an expert scholarship matching agent. Based on this student's profile, find real scholarships they are most likely to qualify for and win.

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
Sort by matchScore descending. Be realistic. Return exactly ${resultCount} results.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: "claude-sonnet-4-5", max_tokens: isFree ? 2500 : 8000, messages: [{ role: "user", content: prompt }] }),
    });
    if (!response.ok) { const err = await response.json(); return res.status(500).json({ error: `Anthropic error: ${JSON.stringify(err)}` }); }
    const data = await response.json();
    const text = data.content?.map(b => b.text || "").join("") || "";
    const scholarships = JSON.parse(text.replace(/```json|```/g, "").trim());
    const recentSearches = [{ id: Date.now().toString(), query: { type: "✦ Best Match", university: p.university, region: p.studyCountry }, results: scholarships, searchedAt: new Date().toISOString(), isBestMatch: true }, ...(user.recent_searches || [])].slice(0, 10);
    await updateUser(user.id, { searchCount: (user.search_count || 0) + 1, recentSearches });
    const totalFound = isFree ? (Math.floor(Math.random() * 16) + 15) : scholarships.length;
    res.json({ scholarships, totalFound });
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

  const prompt = `You are a university writing tutor helping a student draft a scholarship application essay. Your task is to write a first-person essay that reads as though written by an educated, reflective student — not by an AI.

SCHOLARSHIP CONTEXT:
- Name: ${scholarship.name}
- Institution: ${scholarship.institution}
- Amount: ${scholarship.amount}
- Type: ${scholarship.type}
- Eligibility: ${scholarship.eligibility || "Not specified"}

ESSAY PROMPT:
"${essayPrompt}"

STUDENT PROFILE:
${background ? `Personal context provided by student: ${background}` : "No additional context provided."}
${profile.studyLevel ? `Study level: ${profile.studyLevel}` : ""}
${profile.fieldOfStudy ? `Field of study: ${profile.fieldOfStudy}` : ""}
${profile.university ? `University: ${profile.university}` : ""}
${profile.nationality ? `Nationality: ${profile.nationality}` : ""}
${profile.gpa ? `Academic performance: ${profile.gpa}` : ""}
${profile.achievements ? `Achievements and activities: ${profile.achievements}` : ""}
${profile.careerGoals ? `Career goals: ${profile.careerGoals}` : ""}
${profile.financialNeed ? `Financial situation: ${profile.financialNeed}` : ""}

STRICT WRITING RULES — follow every one of these without exception:

STRUCTURE:
- 450 to 550 words. No more, no less.
- Four to five paragraphs with no headings or subheadings
- No bullet points, no numbered lists anywhere in the essay
- No title. Begin with the first word of the opening sentence.

VOICE AND STYLE:
- Write in a measured, confident academic register — the voice of a thoughtful undergraduate or postgraduate student
- Use varied sentence lengths. Mix short declarative sentences with longer complex ones. Avoid a rhythm that feels generated.
- Every paragraph should have a distinct purpose: context, motivation, evidence of capability, fit with the scholarship, forward vision
- Ground abstract statements in concrete specifics. Replace "I am passionate about X" with a moment, observation, or decision that shows that passion
- The opening sentence must not begin with "I". Start with a scene, an observation, a question, or a specific moment.

THINGS THAT WILL MAKE THIS ESSAY FAIL — never do any of these:
- Do not use em dashes (—) or en dashes (–) anywhere
- Do not use the phrase "I am passionate about"
- Do not use the phrase "I have always been"
- Do not use the phrase "Throughout my journey"
- Do not use the phrase "In conclusion"
- Do not use the phrase "I am excited to"
- Do not use the phrase "delve into"
- Do not use the phrase "foster a love of"
- Do not use the word "multifaceted"
- Do not use the word "leverage" in a non-physical sense
- Do not use the word "empower" or "empowering"
- Do not use the word "transformative"
- Do not use the word "pivotal"
- Do not use the word "testament"
- Do not use the phrase "not only... but also"
- Do not use rhetorical questions as paragraph openers
- Do not end the essay with a sentence that restates your desire to receive the scholarship

WHAT MAKES THIS ESSAY PASS AI DETECTION:
- Slight imperfections in phrasing are acceptable and preferred over polished uniformity
- It is fine to begin a sentence with "And" or "But" once, as a real writer would
- Include at least one sentence that is noticeably shorter than those around it
- The essay should feel slightly uneven in a natural way, not metronomically structured

Write the essay now. Output only the essay text, nothing else.`;

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

// ─── Deadline Reminders ───────────────────────────────────────────────────────

// Try to parse a deadline string into a JS Date
function parseDeadline(deadlineStr) {
  if (!deadlineStr) return null;
  const s = deadlineStr.trim();

  // Already a clean date: "Mar 31, 2026" or "31 Mar 2026" or "2026-03-31"
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d;

  // "Mar 2026" → last day of that month
  const monthYear = s.match(/^([A-Za-z]+)\s+(\d{4})$/);
  if (monthYear) {
    const parsed = new Date(`${monthYear[1]} 1, ${monthYear[2]}`);
    if (!isNaN(parsed.getTime())) {
      parsed.setMonth(parsed.getMonth() + 1, 0); // last day of month
      return parsed;
    }
  }

  return null; // Rolling, TBD, etc
}

// Send an email via Resend
async function sendEmail({ to, subject, html }) {
  if (!RESEND_API_KEY) { console.warn("RESEND_API_KEY not set — skipping email"); return; }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${RESEND_API_KEY}` },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  });
  if (!res.ok) { const err = await res.json(); console.error("Resend error:", err); }
}

// Email template
function reminderEmailHtml({ scholarship, daysUntil, deadlineStr }) {
  const urgency = daysUntil === 1 ? "⚠️ Last chance" : daysUntil === 7 ? "📅 One week left" : "🔔 Reminder";
  const urgencyColor = daysUntil === 1 ? "#f87171" : daysUntil === 7 ? "#fbbf24" : "#d4af37";
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#060b18;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px">
    <div style="text-align:center;margin-bottom:32px">
      <div style="width:48px;height:48px;border-radius:14px;background:linear-gradient(135deg,#d4af37,#f5d060);display:inline-flex;align-items:center;justify-content:center;font-size:22px;font-weight:900;color:#0a0f1e;font-family:Georgia,serif">K</div>
      <div style="margin-top:10px;font-size:13px;color:#d4af37;letter-spacing:0.1em;text-transform:uppercase;font-weight:700">Kaloma · Scholarship Reminder</div>
    </div>

    <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(212,175,55,0.3);border-radius:20px;padding:28px;margin-bottom:24px">
      <div style="display:inline-block;padding:5px 12px;border-radius:20px;background:rgba(212,175,55,0.15);border:1px solid ${urgencyColor}40;color:${urgencyColor};font-size:12px;font-weight:700;margin-bottom:16px">${urgency}</div>
      <h2 style="margin:0 0 6px;font-size:22px;font-weight:900;color:white;line-height:1.3">${scholarship.name}</h2>
      <p style="margin:0 0 16px;font-size:14px;color:rgba(255,255,255,0.5)">${scholarship.institution}</p>
      <div style="font-size:28px;font-weight:900;color:#d4af37;margin-bottom:20px">${scholarship.amount}</div>

      <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:16px;margin-bottom:20px">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:rgba(255,255,255,0.3);margin-bottom:6px">Deadline</div>
        <div style="font-size:16px;font-weight:700;color:${urgencyColor}">${deadlineStr}</div>
        <div style="font-size:13px;color:rgba(255,255,255,0.4);margin-top:4px">${daysUntil === 1 ? "Due tomorrow" : `${daysUntil} days remaining`}</div>
      </div>

      <a href="${scholarship.url}" style="display:block;text-align:center;padding:14px;border-radius:12px;background:linear-gradient(135deg,#d4af37,#f5d060);color:#0a0f1e;font-size:15px;font-weight:700;text-decoration:none">Apply Now →</a>
    </div>

    <p style="font-size:12px;color:rgba(255,255,255,0.2);text-align:center;line-height:1.6">
      You're receiving this because you set a reminder on <a href="https://kaloma.app" style="color:#d4af37">kaloma.app</a>.<br>
      Always verify deadline details on the institution's official website.
    </p>
  </div>
</body>
</html>`;
}

// Set a reminder
app.post("/api/reminders", requireAuth, async (req, res) => {
  const user = await findUserById(req.user.id);
  if (!user.is_pro) return res.status(403).json({ error: "PRO_REQUIRED", message: "Reminders are a Pro feature." });

  const { scholarship, deadlineStr, deadlineDate } = req.body;
  if (!scholarship) return res.status(400).json({ error: "Scholarship data required." });

  // Parse deadline — prefer explicit deadlineDate, fall back to parsing scholarships deadline field
  let parsedDate = deadlineDate ? new Date(deadlineDate) : parseDeadline(scholarship.deadline);
  const needsManualDate = !parsedDate || isNaN(parsedDate.getTime());

  if (needsManualDate && !deadlineDate) {
    return res.status(422).json({ error: "NEEDS_DATE", message: "Could not parse deadline. Please enter the date manually." });
  }

  const reminders = user.reminders || [];
  const id = `${scholarship.name}||${scholarship.institution}`;
  const existing = reminders.find(r => r.id === id);
  if (existing) return res.status(409).json({ error: "Reminder already set for this scholarship." });

  const reminder = {
    id,
    scholarship,
    deadlineDate: parsedDate.toISOString(),
    deadlineStr: deadlineStr || scholarship.deadline,
    createdAt: new Date().toISOString(),
    sentDays: [], // track which reminder emails have been sent (30, 7, 1)
  };

  const updated = await updateUser(user.id, { reminders: [...reminders, reminder] });
  res.json({ reminder, reminders: updated.reminders });
});

// Delete a reminder
app.delete("/api/reminders/:id", requireAuth, async (req, res) => {
  const user = await findUserById(req.user.id);
  const reminders = (user.reminders || []).filter(r => r.id !== decodeURIComponent(req.params.id));
  const updated = await updateUser(user.id, { reminders });
  res.json({ reminders: updated.reminders });
});

// List reminders
app.get("/api/reminders", requireAuth, async (req, res) => {
  const user = await findUserById(req.user.id);
  res.json({ reminders: user.reminders || [] });
});

// ─── Daily reminder cron (runs at 8am AEST = 10pm UTC) ───────────────────────
async function runReminderJob() {
  console.log("[cron] Running deadline reminder job...");
  const now = new Date();

  try {
    const { rows: users } = await pool.query(
      "SELECT * FROM users WHERE is_pro = TRUE AND reminders IS NOT NULL AND jsonb_array_length(reminders) > 0"
    );

    let sent = 0;
    for (const user of users) {
      const reminders = user.reminders || [];
      let updated = false;

      for (const reminder of reminders) {
        const deadline = new Date(reminder.deadlineDate);
        const msLeft = deadline.getTime() - now.getTime();
        const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));

        for (const triggerDay of [30, 7, 1]) {
          if (daysLeft === triggerDay && !(reminder.sentDays || []).includes(triggerDay)) {
            await sendEmail({
              to: user.email,
              subject: `${triggerDay === 1 ? "⚠️ Last day" : `${triggerDay} days left`} — ${reminder.scholarship.name}`,
              html: reminderEmailHtml({ scholarship: reminder.scholarship, daysUntil: triggerDay, deadlineStr: reminder.deadlineStr }),
            });
            reminder.sentDays = [...(reminder.sentDays || []), triggerDay];
            updated = true;
            sent++;
            console.log(`[cron] Sent ${triggerDay}d reminder to ${user.email} for "${reminder.scholarship.name}"`);
          }
        }

        // Remove reminders that are more than 2 days past deadline
        if (daysLeft < -2) {
          const idx = reminders.indexOf(reminder);
          reminders.splice(idx, 1);
          updated = true;
        }
      }

      if (updated) {
        await pool.query("UPDATE users SET reminders = $1 WHERE id = $2", [JSON.stringify(reminders), user.id]);
      }
    }
    console.log(`[cron] Done — ${sent} emails sent`);
  } catch (e) {
    console.error("[cron] Error:", e.message);
  }
}

// 10pm UTC daily = 8am AEST
cron.schedule("0 22 * * *", runReminderJob);

app.get("/health", (_, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3001;
initDB().then(() => app.listen(PORT, () => console.log(`Kaloma server running on :${PORT}`)));
