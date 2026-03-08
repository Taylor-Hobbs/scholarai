# ScholarAI — Full-Stack Setup Guide

## Stack
- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **AI**: Anthropic Claude (claude-sonnet-4-5)
- **Payments**: Stripe Subscriptions (monthly + annual)

---

## 1. Clone & Install

```bash
# Server
cd server
npm install

# Client
cd ../client
npm install
```

---

## 2. Stripe Setup (5 minutes)

1. Go to https://dashboard.stripe.com
2. Create two **recurring prices** (Products → Add product):
   - **ScholarAI Monthly** → $9.99/month → copy the `price_xxx` ID
   - **ScholarAI Annual** → $79/year → copy the `price_xxx` ID
3. Copy your **Secret Key** from Developers → API Keys

---

## 3. Environment Variables

```bash
cp server/.env.example server/.env
```

Fill in `server/.env`:
```
ANTHROPIC_API_KEY=sk-ant-...
STRIPE_SECRET_KEY=sk_test_...        # use sk_test_ while testing
STRIPE_MONTHLY_PRICE_ID=price_...
STRIPE_ANNUAL_PRICE_ID=price_...
CLIENT_URL=http://localhost:5173
PORT=3001
```

---

## 4. Run Locally

```bash
# Terminal 1 — Backend
cd server
node index.js
# → Server running on :3001

# Terminal 2 — Frontend
cd client
npm run dev
# → http://localhost:5173
```

---

## 5. Test Stripe Payments

Use Stripe test card: `4242 4242 4242 4242` · Any future date · Any CVC

After payment, you'll be redirected back with `?session_id=xxx&paid=true`.
The app verifies with the backend and stores `scholar_paid=true` in localStorage.

---

## 6. Deploy to Production

### Option A: Railway (recommended, ~$5/mo)
```bash
# Install Railway CLI
npm install -g @railway/cli
railway login
railway init
railway up
```
Set environment variables in Railway dashboard.

### Option B: Render
- Backend: New Web Service → connect repo → set env vars
- Frontend: New Static Site → build command: `npm run build` → publish dir: `dist`
- Set `CLIENT_URL` in backend env to your frontend URL

### Option C: Vercel (frontend) + Railway (backend)
```bash
cd client && npm run build
# Deploy dist/ to Vercel
```

---

## 7. Go Live Checklist

- [ ] Switch `STRIPE_SECRET_KEY` from `sk_test_` to `sk_live_`
- [ ] Update `CLIENT_URL` to production domain
- [ ] Add Stripe webhook for subscription cancellation (optional for MVP)
- [ ] Set up custom domain
- [ ] Add Google Analytics or Posthog

---

## Monetisation Flow

```
User searches → sees 3 free results → blur gate appears
→ clicks "$9.99/mo" or "$79/yr"
→ Stripe Checkout (hosted, PCI compliant)
→ redirect back to app with session_id
→ backend verifies payment
→ localStorage marks user as paid
→ all 8 results unlock instantly
```

**Unit Economics at $9.99/mo:**
- API cost per search: ~$0.006 (single Claude call)
- 50 searches/month per user: ~$0.30 total API cost
- Gross margin: ~97%

---

## Folder Structure

```
scholarai/
├── client/               # React + Vite frontend
│   ├── src/
│   │   ├── App.jsx       # Main app (search, blur gate, results)
│   │   └── index.css     # Tailwind + custom animations
│   ├── index.html
│   └── vite.config.js
│
└── server/               # Express backend
    ├── index.js          # API routes (search, Stripe checkout, verify)
    └── .env.example      # Environment template
```
