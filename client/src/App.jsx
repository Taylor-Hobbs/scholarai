import { useState, useEffect, useRef } from "react";

const SCHOLARSHIP_TYPES = ["Merit-Based","Need-Based","Athletic","STEM / Engineering","Arts & Humanities","Graduate / Postgraduate","Undergraduate","International Students","Women in STEM","Minority / Diversity","Community Service","Research","Government / National"];
const AGENT_SOURCES = [
  { name:"Universities", icon:"🎓", task:"Scanning institutional databases" },
  { name:"Governments",  icon:"🏛️", task:"Checking national programs" },
  { name:"Foundations",  icon:"💎", task:"Mining private endowments" },
  { name:"NGOs",         icon:"🌍", task:"Aggregating nonprofit awards" },
  { name:"Industry",     icon:"⚙️", task:"Sourcing corporate grants" },
  { name:"Research",     icon:"🔬", task:"Finding research fellowships" },
];
const LOADING_MSGS = ["Deploying 6 AI agents worldwide...","Scanning university endowments...","Mining government databases...","Aggregating private foundations...","Cross-referencing eligibility...","Ranking by match score..."];
const MATCH_MSGS = ["Analysing your academic profile...","Matching against 10,000+ scholarships...","Scoring eligibility fit...","Ranking by win probability...","Personalising your results...","Finalising your match report..."];
const TYPE_COLORS = { "Merit-Based":"#d4af37","Need-Based":"#60a5fa","STEM / Engineering":"#34d399","Research":"#a78bfa","Government / National":"#f87171","International Students":"#fb923c","Graduate / Postgraduate":"#e879f9","Women in STEM":"#f472b6" };
const FREE_LIMIT = 3;
const API_BASE = import.meta.env.VITE_API_URL || "https://scholarai-production-3cd2.up.railway.app";

function api(path, options = {}) {
  const token = localStorage.getItem("kaloma_token");
  return fetch(`${API_BASE}${path}`, { ...options, headers: { "Content-Type":"application/json", ...(token ? { Authorization:`Bearer ${token}` } : {}), ...options.headers } });
}

// ─── Auth Modal ───────────────────────────────────────────────────────────────
function AuthModal({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false); const [error, setError] = useState("");
  const inp = { width:"100%", padding:"12px 16px", borderRadius:10, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)", color:"white", fontSize:14, outline:"none", boxSizing:"border-box" };
  const submit = async () => {
    setError(""); if (!email||!password) return setError("Please fill in all fields");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/${mode}`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({email,password}) });
      const data = await res.json(); if (!res.ok) throw new Error(data.error);
      localStorage.setItem("kaloma_token", data.token); onAuth(data.user);
    } catch(e) { setError(e.message); } finally { setLoading(false); }
  };
  return (
    <div style={{ position:"fixed",inset:0,zIndex:1000,background:"rgba(0,0,0,0.85)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",padding:24 }}>
      <div style={{ background:"linear-gradient(135deg,#0d1829,#0a1220)",border:"1px solid rgba(212,175,55,0.2)",borderRadius:24,padding:40,width:"100%",maxWidth:420,boxShadow:"0 24px 80px rgba(0,0,0,0.6)" }}>
        <div style={{ textAlign:"center",marginBottom:32 }}>
          <div style={{ width:48,height:48,borderRadius:14,margin:"0 auto 12px",background:"linear-gradient(135deg,#d4af37,#f5d060)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:900,color:"#0a0f1e",fontFamily:"'Playfair Display',serif" }}>K</div>
          <h2 style={{ margin:0,fontFamily:"'Playfair Display',serif",fontSize:24,fontWeight:900,color:"white" }}>{mode==="login"?"Welcome back":"Create account"}</h2>
          <p style={{ margin:"6px 0 0",fontSize:13,color:"rgba(255,255,255,0.4)" }}>{mode==="login"?"Sign in to continue":"Discover funding opportunities worldwide"}</p>
        </div>
        <div style={{ display:"flex",flexDirection:"column",gap:12,marginBottom:16 }}>
          <input type="email" placeholder="Email address" value={email} onChange={e=>setEmail(e.target.value)} style={inp} onFocus={e=>e.target.style.borderColor="rgba(212,175,55,0.5)"} onBlur={e=>e.target.style.borderColor="rgba(255,255,255,0.12)"} onKeyDown={e=>e.key==="Enter"&&submit()} />
          <input type="password" placeholder="Password (min 6 characters)" value={password} onChange={e=>setPassword(e.target.value)} style={inp} onFocus={e=>e.target.style.borderColor="rgba(212,175,55,0.5)"} onBlur={e=>e.target.style.borderColor="rgba(255,255,255,0.12)"} onKeyDown={e=>e.key==="Enter"&&submit()} />
        </div>
        {error && <div style={{ background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.25)",color:"#fca5a5",padding:"10px 14px",borderRadius:10,fontSize:13,marginBottom:16 }}>{error}</div>}
        <button onClick={submit} disabled={loading} style={{ width:"100%",padding:13,borderRadius:12,border:"none",cursor:"pointer",background:"linear-gradient(135deg,#d4af37,#f5d060)",color:"#0a0f1e",fontSize:15,fontWeight:700,opacity:loading?0.7:1 }}>{loading?"Please wait...":mode==="login"?"Sign In":"Create Account"}</button>
        <p style={{ textAlign:"center",marginTop:20,fontSize:13,color:"rgba(255,255,255,0.35)" }}>
          {mode==="login"?"Don't have an account? ":"Already have an account? "}
          <button onClick={()=>{setMode(mode==="login"?"signup":"login");setError("");}} style={{ background:"none",border:"none",color:"#d4af37",cursor:"pointer",fontWeight:600,fontSize:13 }}>{mode==="login"?"Sign up free":"Sign in"}</button>
        </p>
      </div>
    </div>
  );
}

// ─── Upgrade Modal ────────────────────────────────────────────────────────────
function UpgradeModal({ onUpgrade, onClose, loading, reason }) {
  return (
    <div style={{ position:"fixed",inset:0,zIndex:1000,background:"rgba(0,0,0,0.85)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",padding:24 }}>
      <div style={{ background:"linear-gradient(135deg,#0d1829,#0a1220)",border:"1px solid rgba(212,175,55,0.3)",borderRadius:24,padding:40,width:"100%",maxWidth:440,textAlign:"center" }}>
        <div style={{ fontSize:40,marginBottom:16 }}>🔒</div>
        <h2 style={{ fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:900,color:"white",margin:"0 0 10px" }}>{reason==="search_limit"?"Free search used":"Upgrade to Pro"}</h2>
        <p style={{ fontSize:14,color:"rgba(255,255,255,0.5)",lineHeight:1.7,margin:"0 auto 28px",maxWidth:320 }}>
          {reason==="search_limit" ? "Your free search has been used. Upgrade for unlimited searches, all results, and AI match scoring." : "Unlock unlimited searches, all results, Find Best Match, and AI-written essays."}
        </p>
        <div style={{ display:"flex",gap:12,marginBottom:16 }}>
          <button onClick={()=>onUpgrade("monthly")} disabled={loading} style={{ flex:1,padding:14,borderRadius:12,border:"none",cursor:"pointer",background:"linear-gradient(135deg,#d4af37,#f5d060)",color:"#0a0f1e",fontSize:15,fontWeight:700,opacity:loading?0.7:1 }}>{loading?"...":"$3.99 / month"}</button>
          <button onClick={()=>onUpgrade("annual")} disabled={loading} style={{ flex:1,padding:14,borderRadius:12,cursor:"pointer",background:"rgba(212,175,55,0.1)",border:"1px solid rgba(212,175,55,0.4)",color:"#d4af37",fontSize:14,fontWeight:700,opacity:loading?0.7:1 }}>{loading?"...":"$8.99 / year  (save 25%)"}</button>
        </div>
        <button onClick={onClose} style={{ background:"none",border:"none",color:"rgba(255,255,255,0.3)",cursor:"pointer",fontSize:13 }}>Maybe later</button>
      </div>
    </div>
  );
}

// ─── Agent Card ───────────────────────────────────────────────────────────────
function AgentCard({ agent, index }) {
  const [mounted, setMounted] = useState(false);
  const isError = index === 3;
  useEffect(() => { const t = setTimeout(()=>setMounted(true),index*120); return ()=>clearTimeout(t); }, []);
  const c = isError?"#ef4444":"#4ade80";
  return (
    <div className="rounded-xl p-4" style={{ opacity:mounted?1:0,transform:mounted?"translateY(0)":"translateY(16px)",transition:"all 0.5s ease",background:"rgba(255,255,255,0.03)",border:`1px solid ${isError?"rgba(239,68,68,0.25)":"rgba(212,175,55,0.2)"}` }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div style={{ width:32,height:32,borderRadius:8,background:"rgba(212,175,55,0.1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16 }}>{agent.icon}</div>
          <div><div className="text-sm font-semibold text-white">{agent.name}</div><div className="text-xs" style={{ color:"rgba(255,255,255,0.35)" }}>{agent.task}</div></div>
        </div>
        <div className="flex items-center gap-1.5">
          <div style={{ width:6,height:6,borderRadius:"50%",background:c,boxShadow:`0 0 6px ${c}` }} />
          <span className="text-xs font-semibold" style={{ color:c }}>{isError?"Failed":"Live"}</span>
        </div>
      </div>
      <div className="rounded-lg" style={{ background:"rgba(0,0,0,0.4)" }}>
        <div className="flex items-center gap-1.5 px-3 py-1.5" style={{ borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
          {["#ff5f57","#febc2e","#28c840"].map((col,i)=><div key={i} style={{ width:6,height:6,borderRadius:"50%",background:col,opacity:0.7 }} />)}
          <div className="ml-2 flex-1 h-2 rounded-sm" style={{ background:"rgba(255,255,255,0.07)" }}>
            {!isError&&<div style={{ width:"72%",height:"100%",borderRadius:2,background:"linear-gradient(90deg,#d4af37,#f5d060)" }} />}
          </div>
        </div>
        <div className="p-3 h-12 flex flex-col gap-1 justify-center">
          {isError ? <div className="text-xs" style={{ color:"#ef4444" }}>⚠ HTTP 503 — Unavailable</div>
            : <><div className="text-xs" style={{ color:"#4ade80" }}>✓ Connected · Scanning...</div><div className="text-xs" style={{ color:"rgba(255,255,255,0.25)" }}>Found {32+index*11} candidates</div></>}
        </div>
      </div>
    </div>
  );
}

// ─── Match Score Ring ─────────────────────────────────────────────────────────
function MatchRing({ score }) {
  const color = score >= 85 ? "#4ade80" : score >= 70 ? "#d4af37" : score >= 55 ? "#fb923c" : "#f87171";
  const r = 20; const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div style={{ position:"relative",width:56,height:56,flexShrink:0 }}>
      <svg width="56" height="56" style={{ transform:"rotate(-90deg)" }}>
        <circle cx="28" cy="28" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
        <circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="4" strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" style={{ transition:"stroke-dasharray 1s ease" }} />
      </svg>
      <div style={{ position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column" }}>
        <span style={{ fontSize:12,fontWeight:800,color,lineHeight:1 }}>{score}</span>
        <span style={{ fontSize:8,color:"rgba(255,255,255,0.4)",lineHeight:1,marginTop:1 }}>%</span>
      </div>
    </div>
  );
}

// ─── Essay Modal ──────────────────────────────────────────────────────────────
function EssayModal({ scholarship, userProfile, onClose }) {
  const [essayPrompt, setEssayPrompt] = useState("");
  const [background, setBackground] = useState("");
  const [essay, setEssay] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const progressRef = useRef(null);

  const PROGRESS_STEPS = [
    { pct: 8,  msg: "Reading the scholarship requirements..." },
    { pct: 18, msg: "Reviewing your academic profile..." },
    { pct: 30, msg: "Drafting the opening paragraph..." },
    { pct: 45, msg: "Building your narrative arc..." },
    { pct: 58, msg: "Weaving in your achievements..." },
    { pct: 70, msg: "Connecting your goals to the scholarship..." },
    { pct: 82, msg: "Refining the closing statement..." },
    { pct: 90, msg: "Checking for AI phrases and patterns..." },
    { pct: 95, msg: "Final polish..." },
  ];

  const generate = async () => {
    if (!essayPrompt.trim()) return setError("Please paste the essay prompt.");
    setError(""); setLoading(true); setEssay(""); setProgress(0);
    let stepIdx = 0;
    const tick = () => {
      if (stepIdx < PROGRESS_STEPS.length) {
        const { pct, msg } = PROGRESS_STEPS[stepIdx++];
        setProgress(pct); setProgressMsg(msg);
        const delay = stepIdx < 3 ? 600 : stepIdx < 6 ? 900 : 1400;
        progressRef.current = setTimeout(tick, delay);
      }
    };
    progressRef.current = setTimeout(tick, 300);
    try {
      const res = await api("/api/essay", { method: "POST", body: JSON.stringify({ scholarship, essayPrompt, background }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error);
      clearTimeout(progressRef.current);
      setProgress(100); setProgressMsg("Essay complete.");
      await new Promise(r => setTimeout(r, 600));
      setEssay(data.essay);
    } catch (e) { clearTimeout(progressRef.current); setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => () => clearTimeout(progressRef.current), []);
  const copy = () => { navigator.clipboard.writeText(essay); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const inp = { width: "100%", padding: "12px 16px", borderRadius: 10, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "white", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit", resize: "vertical" };
  const accent = TYPE_COLORS[scholarship.type] || "#d4af37";

  return (
    <div style={{ position:"fixed",inset:0,zIndex:1000,background:"rgba(0,0,0,0.92)",backdropFilter:"blur(10px)",display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"16px",overflowY:"auto" }}>
      <div style={{ background:"linear-gradient(135deg,#0d1829,#0a1220)",border:"1px solid rgba(212,175,55,0.2)",borderRadius:24,padding:"28px 24px",width:"100%",maxWidth:620,marginTop:8 }}>
        <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:20 }}>
          <div style={{ flex:1,minWidth:0,paddingRight:12 }}>
            <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:6 }}>
              <span style={{ fontSize:16 }}>✍</span>
              <span style={{ fontSize:11,fontWeight:700,color:"#d4af37",textTransform:"uppercase",letterSpacing:"0.1em" }}>Essay Assistant</span>
            </div>
            <h2 style={{ margin:0,fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:900,color:"white",lineHeight:1.3,wordBreak:"break-word" }}>{scholarship.name}</h2>
            <p style={{ margin:"4px 0 0",fontSize:12,color:"rgba(255,255,255,0.4)" }}>{scholarship.institution} · <span style={{ color:accent }}>{scholarship.amount}</span></p>
          </div>
          {!loading && <button onClick={onClose} style={{ background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.5)",width:32,height:32,minWidth:32,borderRadius:8,cursor:"pointer",fontSize:16,flexShrink:0 }}>✕</button>}
        </div>

        {loading && (
          <div style={{ padding:"24px 0 16px",textAlign:"center" }}>
            <div style={{ width:64,height:64,borderRadius:20,background:"rgba(212,175,55,0.08)",border:"1px solid rgba(212,175,55,0.2)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",fontSize:28,animation:"pulse-dot 2s ease-in-out infinite" }}>✍</div>
            <h3 style={{ fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:900,color:"white",margin:"0 0 8px" }}>Writing your essay</h3>
            <p style={{ fontSize:13,color:"#d4af37",margin:"0 0 28px",minHeight:20 }}>{progressMsg}</p>
            <div style={{ background:"rgba(255,255,255,0.06)",borderRadius:100,height:6,overflow:"hidden",marginBottom:10 }}>
              <div style={{ height:"100%",borderRadius:100,background:progress===100?"linear-gradient(90deg,#4ade80,#22d3a0)":"linear-gradient(90deg,#d4af37,#f5d060)",width:`${progress}%`,transition:"width 0.8s cubic-bezier(0.4,0,0.2,1)" }} />
            </div>
            <div style={{ display:"flex",justifyContent:"space-between",fontSize:10,color:"rgba(255,255,255,0.25)" }}>
              <span>Analysing</span>
              <span style={{ color:progress>=50?"rgba(255,255,255,0.4)":"rgba(255,255,255,0.2)" }}>Drafting</span>
              <span style={{ color:progress>=88?"rgba(255,255,255,0.4)":"rgba(255,255,255,0.2)" }}>Refining</span>
              <span style={{ color:progress===100?"#4ade80":"rgba(255,255,255,0.2)" }}>Done</span>
            </div>
            <p style={{ fontSize:11,color:"rgba(255,255,255,0.2)",marginTop:24 }}>About 15 seconds · Please don't close this window</p>
          </div>
        )}

        {!loading && !essay && (
          <>
            <div style={{ marginBottom:14 }}>
              <label style={{ display:"block",fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",color:"rgba(255,255,255,0.4)",marginBottom:8 }}>Essay Prompt <span style={{ color:"#d4af37" }}>*</span></label>
              <textarea value={essayPrompt} onChange={e=>setEssayPrompt(e.target.value)} placeholder='Paste the essay question here...' rows={3} style={inp} onFocus={e=>e.target.style.borderColor="rgba(212,175,55,0.5)"} onBlur={e=>e.target.style.borderColor="rgba(255,255,255,0.12)"} />
            </div>
            <div style={{ marginBottom:18 }}>
              <label style={{ display:"block",fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",color:"rgba(255,255,255,0.4)",marginBottom:8 }}>Your Background <span style={{ color:"rgba(255,255,255,0.25)",fontWeight:400 }}>(optional)</span></label>
              <textarea value={background} onChange={e=>setBackground(e.target.value)} placeholder="Any specific experiences, achievements, or context to include..." rows={3} style={inp} onFocus={e=>e.target.style.borderColor="rgba(212,175,55,0.5)"} onBlur={e=>e.target.style.borderColor="rgba(255,255,255,0.12)"} />
            </div>
            {error && <div style={{ background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.2)",color:"#fca5a5",padding:"10px 14px",borderRadius:10,fontSize:13,marginBottom:14 }}>{error}</div>}
            <button onClick={generate} style={{ width:"100%",padding:14,borderRadius:12,border:"none",cursor:"pointer",background:"linear-gradient(135deg,#d4af37,#f5d060)",color:"#0a0f1e",fontSize:15,fontWeight:700 }}>✍ Generate Essay Draft</button>
            <p style={{ textAlign:"center",fontSize:11,color:"rgba(255,255,255,0.2)",marginTop:10 }}>Academic writing style · Passes most AI detectors · ~15 seconds</p>
          </>
        )}

        {!loading && essay && (
          <>
            <div style={{ background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:14,padding:20,marginBottom:14 }}>
              <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14 }}>
                <span style={{ fontSize:11,fontWeight:700,color:"#4ade80",textTransform:"uppercase",letterSpacing:"0.08em" }}>✓ Draft Complete</span>
                <span style={{ fontSize:11,color:"rgba(255,255,255,0.3)" }}>{essay.trim().split(/\s+/).length} words</span>
              </div>
              <p style={{ color:"rgba(255,255,255,0.82)",fontSize:14,lineHeight:1.85,whiteSpace:"pre-wrap",margin:0,fontFamily:"Georgia, serif" }}>{essay}</p>
            </div>
            <div style={{ display:"flex",gap:10,marginBottom:10 }}>
              <button onClick={copy} style={{ flex:1,padding:13,borderRadius:12,border:copied?"1px solid rgba(74,222,128,0.4)":"none",cursor:"pointer",background:copied?"rgba(74,222,128,0.15)":"linear-gradient(135deg,#d4af37,#f5d060)",color:copied?"#4ade80":"#0a0f1e",fontSize:14,fontWeight:700 }}>{copied?"✓ Copied":"Copy Essay"}</button>
              <button onClick={()=>{setEssay("");setProgress(0);}} style={{ flex:1,padding:13,borderRadius:12,cursor:"pointer",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.6)",fontSize:14,fontWeight:600 }}>↺ Regenerate</button>
            </div>
            <p style={{ textAlign:"center",fontSize:11,color:"rgba(255,255,255,0.2)",lineHeight:1.6 }}>First draft — review carefully and adjust to your own voice before submitting.</p>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Reminder Modal ───────────────────────────────────────────────────────────
function ReminderModal({ scholarship, onClose, onSave, existingReminder }) {
  const [dateVal, setDateVal] = useState(() => {
    if (existingReminder) return existingReminder.deadlineDate.slice(0, 10);
    // Try to pre-fill from scholarship deadline
    if (scholarship.deadline) {
      const d = new Date(scholarship.deadline);
      if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
      // "Mar 31, 2026" style
      const parsed = new Date(scholarship.deadline);
      if (!isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
    }
    return "";
  });
  const [needsManual, setNeedsManual] = useState(!dateVal);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    if (!dateVal) return setError("Please enter the deadline date.");
    setLoading(true); setError("");
    try {
      const res = await api("/api/reminders", {
        method: "POST",
        body: JSON.stringify({ scholarship, deadlineDate: dateVal, deadlineStr: scholarship.deadline || dateVal }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error);
      onSave(data.reminders);
      onClose();
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const accent = TYPE_COLORS[scholarship.type] || "#d4af37";
  const daysUntil = dateVal ? Math.ceil((new Date(dateVal) - new Date()) / (1000 * 60 * 60 * 24)) : null;

  return (
    <div style={{ position:"fixed",inset:0,zIndex:1100,background:"rgba(0,0,0,0.88)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",padding:24 }}>
      <div style={{ background:"linear-gradient(135deg,#0d1829,#0a1220)",border:"1px solid rgba(212,175,55,0.2)",borderRadius:20,padding:32,width:"100%",maxWidth:440,position:"relative" }}>
        <button onClick={onClose} style={{ position:"absolute",top:14,right:14,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.5)",width:30,height:30,borderRadius:7,cursor:"pointer",fontSize:15 }}>✕</button>

        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:11,fontWeight:700,color:"#d4af37",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8 }}>🔔 Set Deadline Reminder</div>
          <h3 style={{ fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:900,color:"white",margin:"0 0 4px",lineHeight:1.3,paddingRight:32 }}>{scholarship.name}</h3>
          <p style={{ fontSize:13,color:"rgba(255,255,255,0.4)",margin:0 }}>{scholarship.institution}</p>
        </div>

        {scholarship.deadline && (
          <div style={{ background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,padding:"10px 14px",marginBottom:16,fontSize:13 }}>
            <span style={{ color:"rgba(255,255,255,0.4)" }}>Scholarship deadline: </span>
            <span style={{ color:"white",fontWeight:600 }}>{scholarship.deadline}</span>
            {needsManual && <div style={{ color:"#fbbf24",fontSize:11,marginTop:4 }}>⚠ Couldn't parse this date automatically — please enter it below.</div>}
          </div>
        )}

        <div style={{ marginBottom:16 }}>
          <label style={{ display:"block",fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",color:"rgba(255,255,255,0.4)",marginBottom:8 }}>
            Deadline Date <span style={{ color:"#d4af37" }}>*</span>
          </label>
          <input
            type="date"
            value={dateVal}
            onChange={e => setDateVal(e.target.value)}
            style={{ width:"100%",padding:"12px 14px",borderRadius:10,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",color:"white",fontSize:14,outline:"none",boxSizing:"border-box",colorScheme:"dark" }}
            onFocus={e=>e.target.style.borderColor="rgba(212,175,55,0.5)"}
            onBlur={e=>e.target.style.borderColor="rgba(255,255,255,0.12)"}
          />
          {daysUntil !== null && daysUntil > 0 && (
            <p style={{ fontSize:12,color:daysUntil<=7?"#fbbf24":daysUntil<=30?"#d4af37":"rgba(255,255,255,0.4)",marginTop:6 }}>
              {daysUntil === 1 ? "⚠ Due tomorrow" : `${daysUntil} days from now`}
            </p>
          )}
          {daysUntil !== null && daysUntil <= 0 && (
            <p style={{ fontSize:12,color:"#f87171",marginTop:6 }}>⚠ This date is in the past</p>
          )}
        </div>

        <div style={{ background:"rgba(212,175,55,0.05)",border:"1px solid rgba(212,175,55,0.15)",borderRadius:10,padding:"10px 14px",marginBottom:18,fontSize:12,color:"rgba(255,255,255,0.4)",lineHeight:1.6 }}>
          You'll receive email reminders <strong style={{color:"rgba(255,255,255,0.7)"}}>30 days, 7 days, and 1 day</strong> before this deadline.
        </div>

        {error && <div style={{ background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.2)",color:"#fca5a5",padding:"10px 14px",borderRadius:10,fontSize:13,marginBottom:14 }}>{error}</div>}

        <button onClick={save} disabled={loading || !dateVal || daysUntil <= 0} style={{ width:"100%",padding:13,borderRadius:12,border:"none",cursor:loading||!dateVal||daysUntil<=0?"not-allowed":"pointer",background:"linear-gradient(135deg,#d4af37,#f5d060)",color:"#0a0f1e",fontSize:14,fontWeight:700,opacity:loading||!dateVal||daysUntil<=0?0.6:1 }}>
          {loading ? "Setting reminder..." : "🔔 Set Reminder"}
        </button>
      </div>
    </div>
  );
}

// ─── Share Button ─────────────────────────────────────────────────────────────
function ShareButton({ scholarship }) {
  const [copied, setCopied] = useState(false);
  const share = (e) => {
    e.stopPropagation();
    const slug = encodeURIComponent(btoa(JSON.stringify(scholarship)));
    const url = `${window.location.origin}/?s=${slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={share} title="Copy shareable link" style={{ display:"flex",alignItems:"center",gap:5,padding:"6px 10px",borderRadius:8,fontSize:12,fontWeight:500,cursor:"pointer",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",color:copied?"#4ade80":"rgba(255,255,255,0.3)",transition:"all 0.2s" }}>
      {copied ? "✓ Copied" : "🔗 Share"}
    </button>
  );
}

// ─── Deeplink Modal ───────────────────────────────────────────────────────────
function DeeplinkModal({ scholarship, onClose, onSave, savedIds, onEssay, isPro, onUpgrade }) {
  const accent = TYPE_COLORS[scholarship.type] || "#d4af37";
  const isSaved = savedIds?.has(`${scholarship.name}||${scholarship.institution}`);
  return (
    <div style={{ position:"fixed",inset:0,zIndex:1000,background:"rgba(0,0,0,0.88)",backdropFilter:"blur(10px)",display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"16px",overflowY:"auto" }}>
      <div style={{ background:"linear-gradient(135deg,#0d1829,#0a1220)",border:`1px solid ${accent}30`,borderRadius:24,padding:"28px 24px",width:"100%",maxWidth:540,position:"relative",marginTop:8 }}>
        <div style={{ position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,transparent,${accent},transparent)`,borderRadius:"24px 24px 0 0" }} />
        <button onClick={onClose} style={{ position:"absolute",top:14,right:14,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.5)",width:32,height:32,borderRadius:8,cursor:"pointer",fontSize:16 }}>✕</button>
        <div style={{ marginBottom:18,paddingRight:40 }}>
          <div style={{ display:"flex",flexWrap:"wrap",gap:6,marginBottom:12 }}>
            <span style={{ fontSize:11,fontWeight:700,padding:"4px 10px",borderRadius:20,background:`${accent}15`,color:accent,border:`1px solid ${accent}30` }}>{scholarship.type}</span>
            <span style={{ fontSize:11,padding:"4px 10px",borderRadius:20,background:"rgba(255,255,255,0.05)",color:"rgba(255,255,255,0.45)",border:"1px solid rgba(255,255,255,0.1)" }}>📍 {scholarship.region}</span>
            {scholarship.deadline && <span style={{ fontSize:11,padding:"4px 10px",borderRadius:20,background:"rgba(239,68,68,0.1)",color:"#fca5a5",border:"1px solid rgba(239,68,68,0.2)" }}>⏰ {scholarship.deadline}</span>}
          </div>
          <h2 style={{ fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:900,color:"white",margin:"0 0 6px",lineHeight:1.3 }}>{scholarship.name}</h2>
          <p style={{ fontSize:13,color:"rgba(255,255,255,0.45)",margin:"0 0 12px" }}>{scholarship.institution}</p>
          <div style={{ fontSize:28,fontWeight:900,color:accent,marginBottom:12 }}>{scholarship.amount} <span style={{ fontSize:13,fontWeight:400,color:"rgba(255,255,255,0.3)" }}>per year</span></div>
          <p style={{ fontSize:13,color:"rgba(255,255,255,0.55)",lineHeight:1.7,margin:"0 0 16px" }}>{scholarship.description}</p>
        </div>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16 }}>
          {[{label:"Eligibility",val:scholarship.eligibility},{label:"GPA Required",val:scholarship.gpa},{label:"Opens",val:scholarship.opens},{label:"Source",val:scholarship.source}].map(item=>(
            <div key={item.label}><div style={{ fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",color:"rgba(255,255,255,0.25)",marginBottom:3 }}>{item.label}</div><div style={{ fontSize:13,fontWeight:500,color:"white" }}>{item.val||"—"}</div></div>
          ))}
        </div>
        <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
          <a href={scholarship.url} target="_blank" rel="noopener noreferrer" style={{ display:"block",textAlign:"center",padding:"13px",borderRadius:12,background:accent,color:"#0a0f1e",fontSize:14,fontWeight:700,textDecoration:"none" }}>Apply Now →</a>
          <div style={{ display:"flex",gap:10 }}>
            <button onClick={()=>onSave(scholarship)} style={{ flex:1,padding:11,borderRadius:12,cursor:"pointer",background:isSaved?"rgba(212,175,55,0.15)":"rgba(255,255,255,0.05)",border:`1px solid ${isSaved?"rgba(212,175,55,0.4)":"rgba(255,255,255,0.1)"}`,color:isSaved?"#d4af37":"rgba(255,255,255,0.5)",fontSize:13,fontWeight:600 }}>{isSaved?"★ Saved":"☆ Save"}</button>
            {isPro
              ? <button onClick={()=>onEssay(scholarship)} style={{ flex:1,padding:11,borderRadius:12,cursor:"pointer",background:"rgba(212,175,55,0.1)",border:"1px solid rgba(212,175,55,0.3)",color:"#d4af37",fontSize:13,fontWeight:600 }}>✍ Draft Essay</button>
              : <button onClick={()=>onUpgrade("monthly")} style={{ flex:1,padding:11,borderRadius:12,cursor:"pointer",background:"rgba(212,175,55,0.08)",border:"1px solid rgba(212,175,55,0.2)",color:"#d4af37",fontSize:13,fontWeight:600 }}>✍ Essay — Upgrade</button>
            }
          </div>
        </div>
        {!isPro && (
          <div style={{ marginTop:14,padding:"12px 14px",borderRadius:10,background:"rgba(212,175,55,0.05)",border:"1px solid rgba(212,175,55,0.15)" }}>
            <p style={{ fontSize:12,color:"rgba(255,255,255,0.4)",lineHeight:1.6,margin:0 }}>
              <strong style={{color:"#d4af37"}}>✍ Essay Assistant</strong> — paste this scholarship's essay prompt and get an AI-written first draft tailored to your background. Available with <button onClick={()=>onUpgrade("monthly")} style={{background:"none",border:"none",color:"#d4af37",cursor:"pointer",fontSize:12,fontWeight:700,padding:0,textDecoration:"underline"}}>Pro ($3.99/mo)</button>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Scholarship Card ─────────────────────────────────────────────────────────
function ScholarshipCard({ s, index, savedIds, onSave, showMatch, onEssay, isPro, onReminder, reminderIds }) {
  const [expanded, setExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [saving, setSaving] = useState(false);
  const accent = TYPE_COLORS[s.type] || "#d4af37";
  const isSaved = savedIds?.has(`${s.name}||${s.institution}`);
  const hasReminder = reminderIds?.has(`${s.name}||${s.institution}`);
  useEffect(() => { const t = setTimeout(()=>setMounted(true),index*80); return ()=>clearTimeout(t); }, []);
  const handleSave = async (e) => { e.stopPropagation(); setSaving(true); await onSave(s); setSaving(false); };
  const handleEssay = (e) => { e.stopPropagation(); onEssay(s); };
  const handleReminder = (e) => { e.stopPropagation(); onReminder && onReminder(s); };
  return (
    <div onClick={()=>setExpanded(!expanded)} className="rounded-2xl border cursor-pointer overflow-hidden"
      style={{ opacity:mounted?1:0,transform:mounted?"translateY(0)":"translateY(24px)",transition:"all 0.5s ease",background:expanded?"rgba(255,255,255,0.05)":"rgba(255,255,255,0.03)",borderColor:expanded?`${accent}40`:"rgba(255,255,255,0.07)",boxShadow:expanded?`0 0 40px ${accent}12`:"none" }}>
      <div className="p-4 sm:p-6">
        <div className="flex items-start gap-3">
          {showMatch && s.matchScore && <MatchRing score={s.matchScore} />}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-1.5 mb-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background:`${accent}15`,color:accent,border:`1px solid ${accent}30` }}>{s.type}</span>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background:"rgba(255,255,255,0.05)",color:"rgba(255,255,255,0.45)",border:"1px solid rgba(255,255,255,0.1)" }}>📍 {s.region}</span>
              {s.deadline&&<span className="text-xs px-2 py-0.5 rounded-full" style={{ background:"rgba(239,68,68,0.1)",color:"#fca5a5",border:"1px solid rgba(239,68,68,0.2)" }}>⏰ {s.deadline}</span>}
            </div>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-display text-base sm:text-lg font-bold text-white mb-0.5 leading-tight">{s.name}</h3>
                <p className="text-xs sm:text-sm" style={{ color:"rgba(255,255,255,0.4)" }}>{s.institution}</p>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <div className="font-display text-xl sm:text-2xl font-black" style={{ color:accent }}>{s.amount}</div>
                <button onClick={handleSave} disabled={saving} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold"
                  style={{ background:isSaved?"rgba(212,175,55,0.2)":"rgba(255,255,255,0.06)",border:`1px solid ${isSaved?"rgba(212,175,55,0.4)":"rgba(255,255,255,0.1)"}`,color:isSaved?"#d4af37":"rgba(255,255,255,0.5)",cursor:"pointer",whiteSpace:"nowrap" }}>
                  {saving?"...":(isSaved?"★ Saved":"☆ Save")}
                </button>
              </div>
            </div>
            <p className="text-xs sm:text-sm mt-2 leading-relaxed" style={{ color:"rgba(255,255,255,0.5)" }}>{s.description}</p>
            {showMatch && s.matchReason && (
              <div className="mt-2 px-3 py-2 rounded-lg flex items-start gap-2" style={{ background:"rgba(74,222,128,0.06)",border:"1px solid rgba(74,222,128,0.15)" }}>
                <span style={{ fontSize:11,marginTop:1 }}>✦</span>
                <p className="text-xs leading-relaxed" style={{ color:"rgba(74,222,128,0.9)" }}>{s.matchReason}</p>
              </div>
            )}
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1" style={{ color:accent }}>
            <span className="text-xs font-semibold">{expanded?"Hide details":"View details & apply"}</span>
            <span className="text-xs" style={{ display:"inline-block",transform:expanded?"rotate(180deg)":"none",transition:"transform 0.3s" }}>▼</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShareButton scholarship={s} />
            {onReminder && isPro && (
              <button onClick={handleReminder} title={hasReminder ? "Reminder set" : "Set deadline reminder"} style={{ display:"flex",alignItems:"center",gap:4,padding:"6px 10px",borderRadius:8,fontSize:11,fontWeight:600,cursor:"pointer",background:hasReminder?"rgba(74,222,128,0.1)":"rgba(255,255,255,0.04)",border:`1px solid ${hasReminder?"rgba(74,222,128,0.3)":"rgba(255,255,255,0.08)"}`,color:hasReminder?"#4ade80":"rgba(255,255,255,0.3)",whiteSpace:"nowrap" }}>
                {hasReminder ? "🔔 Set" : "🔔"}
              </button>
            )}
            {onEssay && (
              isPro ? (
                <button onClick={handleEssay} style={{ display:"flex",alignItems:"center",gap:5,padding:"6px 10px",borderRadius:8,fontSize:11,fontWeight:600,cursor:"pointer",background:"rgba(212,175,55,0.12)",border:"1px solid rgba(212,175,55,0.3)",color:"#d4af37",whiteSpace:"nowrap" }}>✍ Draft Essay</button>
              ) : (
                <button onClick={handleEssay} style={{ display:"flex",alignItems:"center",gap:5,padding:"6px 10px",borderRadius:8,fontSize:11,fontWeight:600,cursor:"pointer",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.35)",whiteSpace:"nowrap" }}>✍ Essay <span style={{ fontSize:9,padding:"1px 4px",borderRadius:4,background:"rgba(212,175,55,0.15)",color:"#d4af37",fontWeight:700 }}>Pro</span></button>
              )
            )}
          </div>
        </div>
      </div>
      {expanded && (
        <div className="px-4 sm:px-6 pb-5 pt-2" style={{ borderTop:"1px solid rgba(255,255,255,0.06)" }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {[{label:"Eligibility",val:s.eligibility},{label:"GPA Required",val:s.gpa},{label:"Opens",val:s.opens},{label:"Source",val:s.source}].map(item=>(
              <div key={item.label}><div className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color:"rgba(255,255,255,0.25)" }}>{item.label}</div><div className="text-sm font-medium text-white">{item.val||"—"}</div></div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <a href={s.url} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold hover:opacity-80 transition-opacity" style={{ background:accent,color:"#0a0f1e" }}>Apply Now →</a>
            {onEssay && isPro && (
              <button onClick={handleEssay} style={{ display:"inline-flex",alignItems:"center",gap:6,padding:"10px 16px",borderRadius:12,fontSize:13,fontWeight:700,cursor:"pointer",background:"rgba(212,175,55,0.1)",border:"1px solid rgba(212,175,55,0.3)",color:"#d4af37" }}>✍ Draft Application Essay</button>
            )}
            {onEssay && !isPro && (
              <button onClick={handleEssay} style={{ display:"inline-flex",alignItems:"center",gap:6,padding:"10px 16px",borderRadius:12,fontSize:13,fontWeight:600,cursor:"pointer",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.4)" }}>
                ✍ AI Essay Draft <span style={{ fontSize:11,padding:"2px 6px",borderRadius:5,background:"rgba(212,175,55,0.15)",color:"#d4af37",marginLeft:2,fontWeight:700 }}>Pro</span>
              </button>
            )}
          </div>
          {onEssay && !isPro && (
            <p className="text-xs mt-3 leading-relaxed" style={{ color:"rgba(255,255,255,0.3)" }}>
              ✍ <strong style={{color:"rgba(255,255,255,0.5)"}}>Essay Assistant</strong> — paste the scholarship's essay prompt and get a tailored first draft written around your background. <button onClick={e=>{e.stopPropagation();handleEssay(e);}} style={{background:"none",border:"none",color:"#d4af37",cursor:"pointer",fontSize:12,fontWeight:600,padding:0}}>Unlock with Pro →</button>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Blur Gate ────────────────────────────────────────────────────────────────
function BlurGate({ onUpgrade, loading, topScholarship }) {
  const accent = topScholarship ? (TYPE_COLORS[topScholarship.type] || "#d4af37") : "#d4af37";
  return (
    <div className="mt-4">
      {topScholarship && (
        <div style={{ borderRadius:"16px 16px 0 0",overflow:"hidden",border:"1px solid rgba(212,175,55,0.3)",borderBottom:"none",background:"rgba(255,255,255,0.04)",padding:"16px 20px",position:"relative" }}>
          <div style={{ position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${accent},transparent)` }} />
          <div style={{ fontSize:11,fontWeight:700,color:"#d4af37",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8 }}>✦ Best Result — Locked</div>
          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",gap:12 }}>
            <div style={{ flex:1,filter:"blur(5px)",userSelect:"none",pointerEvents:"none" }}>
              <div style={{ fontSize:15,fontWeight:700,color:"white",marginBottom:2 }}>{topScholarship.name}</div>
              <div style={{ fontSize:12,color:"rgba(255,255,255,0.4)" }}>{topScholarship.institution}</div>
              {topScholarship.matchScore && <div style={{ fontSize:12,color:"#4ade80",marginTop:3,fontWeight:600 }}>{topScholarship.matchScore}% match</div>}
            </div>
            <div style={{ fontSize:22,fontWeight:900,color:accent,filter:"blur(5px)",userSelect:"none",pointerEvents:"none",flexShrink:0 }}>{topScholarship.amount}</div>
          </div>
        </div>
      )}
      <div className="relative rounded-2xl overflow-hidden" style={{ border:"1px solid rgba(212,175,55,0.25)",borderRadius:topScholarship?"0 0 16px 16px":16 }}>
        <div className="absolute inset-0 z-10" style={{ background:"linear-gradient(to bottom,rgba(6,11,24,0) 0%,rgba(6,11,24,0.7) 35%,rgba(6,11,24,0.98) 65%)",pointerEvents:"none" }} />
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-end pb-8 px-4 text-center">
          <div style={{ width:44,height:44,borderRadius:"50%",background:"rgba(212,175,55,0.15)",border:"1px solid rgba(212,175,55,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,marginBottom:12 }}>🔒</div>
          <h3 className="font-display text-xl font-bold text-white mb-2">More scholarships found</h3>
          <p className="text-sm mb-2 max-w-xs" style={{ color:"rgba(255,255,255,0.5)" }}>Unlock all results, unlimited searches, and the <strong style={{color:"#d4af37"}}>✍ Essay Assistant</strong>.</p>
          <p className="text-xs mb-4" style={{ color:"rgba(255,255,255,0.3)" }}>One win could pay for years of access.</p>
          <div style={{ display:"flex",gap:10,marginBottom:12,width:"100%",maxWidth:280 }}>
            <button onClick={()=>onUpgrade("monthly")} disabled={loading} style={{ flex:1,padding:"11px 8px",borderRadius:10,border:"none",cursor:"pointer",background:"linear-gradient(135deg,#d4af37,#f5d060)",color:"#0a0f1e",fontSize:13,fontWeight:700,opacity:loading?0.7:1 }}>{loading?"...":"$3.99 / mo"}</button>
            <button onClick={()=>onUpgrade("annual")} disabled={loading} style={{ flex:1,padding:"11px 8px",borderRadius:10,cursor:"pointer",background:"rgba(212,175,55,0.1)",border:"1px solid rgba(212,175,55,0.4)",color:"#d4af37",fontSize:13,fontWeight:700,opacity:loading?0.7:1 }}>{loading?"...":"$8.99 / yr"}</button>
          </div>
          <p className="text-xs" style={{ color:"rgba(255,255,255,0.2)" }}>Cancel anytime · Secure via Stripe</p>
        </div>
        <div className="p-4 flex flex-col gap-3" style={{ pointerEvents:"none" }}>
          {[1,2,3].map(i=>(
            <div key={i} className="rounded-xl p-4" style={{ background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",filter:"blur(3px)" }}>
              <div className="flex justify-between items-start mb-3">
                <div><div style={{ height:10,width:80,borderRadius:4,background:"rgba(212,175,55,0.3)",marginBottom:8 }} /><div style={{ height:16,width:160,borderRadius:4,background:"rgba(255,255,255,0.15)",marginBottom:4 }} /><div style={{ height:10,width:120,borderRadius:4,background:"rgba(255,255,255,0.08)" }} /></div>
                <div style={{ height:24,width:64,borderRadius:6,background:"rgba(212,175,55,0.25)" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Scholar Profile Questionnaire ───────────────────────────────────────────
const STEPS = [
  { id:"academic", label:"Academic", icon:"🎓", title:"Academic Background", fields:[
    { key:"studyLevel", label:"Study Level", type:"select", required:true, options:["Undergraduate","Graduate / Masters","PhD / Doctoral","High School","Vocational / TAFE"] },
    { key:"fieldOfStudy", label:"Field of Study", type:"text", required:true, placeholder:"e.g. Computer Science, Medicine, Law" },
    { key:"university", label:"University (if enrolled)", type:"text", placeholder:"e.g. Monash University, University of Melbourne" },
    { key:"gpa", label:"GPA / Academic Score", type:"text", placeholder:"e.g. 3.8 / 4.0  or  85 WAM  or  Distinction average" },
  ]},
  { id:"personal", label:"Personal", icon:"🌍", title:"Personal Details", fields:[
    { key:"nationality", label:"Nationality / Citizenship", type:"text", required:true, placeholder:"e.g. Australian, Indian, Nigerian" },
    { key:"studyCountry", label:"Country You're Studying In", type:"text", required:true, placeholder:"e.g. Australia, United States, UK" },
    { key:"financialNeed", label:"Financial Need", type:"select", required:true, options:["No financial need","Some financial need","Significant financial need","Prefer not to say"] },
    { key:"demographics", label:"Demographic Background (optional)", type:"text", placeholder:"e.g. First-generation student, Indigenous, Women in STEM, LGBTQ+" },
  ]},
  { id:"goals", label:"Goals", icon:"✦", title:"Achievements & Goals", fields:[
    { key:"achievements", label:"Extracurriculars & Achievements", type:"textarea", placeholder:"e.g. Debate captain, published research, community volunteer, startup founder..." },
    { key:"careerGoals", label:"Career Goals", type:"textarea", placeholder:"e.g. Become a climate scientist, found a tech startup, practice international law..." },
  ]},
];

function ScholarProfileForm({ existing, onSubmit, onCancel, loading }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(existing || {});
  const [errors, setErrors] = useState({});
  const currentStep = STEPS[step];
  const set = (key, val) => { setForm(f=>({...f,[key]:val})); setErrors(e=>({...e,[key]:""})); };
  const validate = () => {
    const errs = {};
    currentStep.fields.forEach(f => { if (f.required && !form[f.key]?.trim()) errs[f.key] = "This field is required"; });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };
  const next = () => { if (validate()) setStep(s=>s+1); };
  const back = () => setStep(s=>s-1);
  const submit = () => { if (validate()) onSubmit(form); };
  const inp = (extra={}) => ({ width:"100%",padding:"12px 16px",borderRadius:10,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",color:"white",fontSize:14,outline:"none",boxSizing:"border-box",...extra });
  return (
    <div>
      <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:28,flexWrap:"wrap" }}>
        {STEPS.map((s,i) => (
          <div key={s.id} style={{ display:"flex",alignItems:"center",gap:6 }}>
            <div style={{ width:30,height:30,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,flexShrink:0,
              background:i<step?"rgba(74,222,128,0.2)":i===step?"rgba(212,175,55,0.2)":"rgba(255,255,255,0.05)",
              border:`2px solid ${i<step?"#4ade80":i===step?"#d4af37":"rgba(255,255,255,0.1)"}`,
              color:i<step?"#4ade80":i===step?"#d4af37":"rgba(255,255,255,0.3)" }}>
              {i<step?"✓":s.icon}
            </div>
            <span style={{ fontSize:12,fontWeight:600,color:i===step?"#d4af37":"rgba(255,255,255,0.3)" }} className="hidden sm:inline">{s.label}</span>
            {i<STEPS.length-1 && <div style={{ width:20,height:1,background:i<step?"rgba(74,222,128,0.4)":"rgba(255,255,255,0.1)",marginLeft:2 }} />}
          </div>
        ))}
      </div>
      <h3 className="font-display text-xl font-bold text-white mb-5">{currentStep.title}</h3>
      <div className="flex flex-col gap-4">
        {currentStep.fields.map(field => (
          <div key={field.key}>
            <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color:"rgba(255,255,255,0.4)" }}>
              {field.label}{field.required&&<span style={{ color:"#d4af37" }}> *</span>}
            </label>
            {field.type==="select" ? (
              <select value={form[field.key]||""} onChange={e=>set(field.key,e.target.value)} style={{ ...inp(),appearance:"none" }}>
                <option value="">Select...</option>
                {field.options.map(o=><option key={o} value={o}>{o}</option>)}
              </select>
            ) : field.type==="textarea" ? (
              <textarea value={form[field.key]||""} onChange={e=>set(field.key,e.target.value)} placeholder={field.placeholder} rows={3} style={{ ...inp(),resize:"vertical",fontFamily:"inherit" }} />
            ) : (
              <input type="text" value={form[field.key]||""} onChange={e=>set(field.key,e.target.value)} placeholder={field.placeholder} style={inp()} onFocus={e=>e.target.style.borderColor="rgba(212,175,55,0.5)"} onBlur={e=>e.target.style.borderColor="rgba(255,255,255,0.12)"} />
            )}
            {errors[field.key] && <p style={{ color:"#fca5a5",fontSize:12,marginTop:4 }}>{errors[field.key]}</p>}
          </div>
        ))}
      </div>
      <div className="flex gap-3 mt-7">
        {step > 0 && <button onClick={back} style={{ flex:1,padding:12,borderRadius:12,border:"1px solid rgba(255,255,255,0.15)",background:"transparent",color:"rgba(255,255,255,0.5)",fontSize:14,fontWeight:600,cursor:"pointer" }}>← Back</button>}
        {onCancel && step===0 && <button onClick={onCancel} style={{ flex:1,padding:12,borderRadius:12,border:"1px solid rgba(255,255,255,0.1)",background:"transparent",color:"rgba(255,255,255,0.4)",fontSize:14,cursor:"pointer" }}>Cancel</button>}
        {step < STEPS.length-1
          ? <button onClick={next} style={{ flex:2,padding:12,borderRadius:12,border:"none",background:"linear-gradient(135deg,#d4af37,#f5d060)",color:"#0a0f1e",fontSize:14,fontWeight:700,cursor:"pointer" }}>Continue →</button>
          : <button onClick={submit} disabled={loading} style={{ flex:2,padding:12,borderRadius:12,border:"none",background:"linear-gradient(135deg,#d4af37,#f5d060)",color:"#0a0f1e",fontSize:15,fontWeight:700,cursor:"pointer",opacity:loading?0.7:1 }}>{loading?"Finding your matches...":"✦ Find My Best Matches"}</button>
        }
      </div>
    </div>
  );
}

// ─── Profile Page ─────────────────────────────────────────────────────────────
function ProfilePage({ user, onBack, onUpgrade, stripeLoading, onUserUpdate }) {
  const [tab, setTab] = useState("discover");
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savedIds, setSavedIds] = useState(new Set());
  const [matchPhase, setMatchPhase] = useState("idle");
  const [matchResults, setMatchResults] = useState([]);
  const [matchError, setMatchError] = useState("");
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchMsg, setMatchMsg] = useState("");
  const [essayTarget, setEssayTarget] = useState(null);
  const [reminderScholarship, setReminderScholarship] = useState(null);
  const [reminders, setReminders] = useState([]);
  const [reminderIds, setReminderIds] = useState(new Set());
  const msgIdx = useRef(0); const intervalRef = useRef(null);

  useEffect(() => {
    api("/api/profile").then(r=>r.json()).then(data => {
      setProfile(data);
      setSavedIds(new Set((data.savedScholarships||[]).map(s=>`${s.name}||${s.institution}`)));
      setLoading(false);
    });
    if (user.isPro) {
      api("/api/reminders").then(r=>r.json()).then(data => {
        setReminders(data.reminders || []);
        setReminderIds(new Set((data.reminders||[]).map(r => r.id)));
      });
    }
  }, []);

  const handleSave = async (scholarship) => {
    const res = await api("/api/scholarships/save",{ method:"POST",body:JSON.stringify({scholarship}) });
    const data = await res.json();
    setSavedIds(new Set((data.savedScholarships||[]).map(s=>`${s.name}||${s.institution}`)));
    setProfile(p=>({...p,savedScholarships:data.savedScholarships}));
    if (onUserUpdate) onUserUpdate({ savedScholarships: data.savedScholarships });
  };

  const runMatch = async (scholarProfile) => {
    setMatchLoading(true); setMatchError("");
    setMatchPhase("searching"); setMatchMsg(MATCH_MSGS[0]);
    msgIdx.current=0;
    intervalRef.current = setInterval(()=>{ msgIdx.current=(msgIdx.current+1)%MATCH_MSGS.length; setMatchMsg(MATCH_MSGS[msgIdx.current]); },2000);
    try {
      const res = await api("/api/match",{ method:"POST",body:JSON.stringify({scholarProfile}) });
      const data = await res.json();
      if (!res.ok) { if (data.error==="PRO_REQUIRED") { setMatchPhase("idle"); onUpgrade&&onUpgrade("monthly"); return; } throw new Error(data.error||data.message); }
      setMatchResults(data.scholarships||[]);
      setMatchPhase("results");
    } catch(e) { setMatchError(e.message); setMatchPhase("form"); }
    finally { clearInterval(intervalRef.current); setMatchLoading(false); }
  };

  // ── Mobile-friendly tabs ──────────────────────────────────────────────────
  const tabStyle = (t) => ({
    flex:1, padding:"10px 6px", borderRadius:8, fontSize:12, fontWeight:600,
    cursor:"pointer", border:"none", textAlign:"center",
    background:tab===t?"rgba(212,175,55,0.15)":"transparent",
    color:tab===t?"#d4af37":"rgba(255,255,255,0.4)",
    borderBottom:tab===t?"2px solid #d4af37":"2px solid transparent",
    whiteSpace:"nowrap",
  });

  return (
    <div className="animate-fade-up">
      {essayTarget && <EssayModal scholarship={essayTarget} userProfile={user?.scholarProfile} onClose={()=>setEssayTarget(null)} />}
      {reminderScholarship && <ReminderModal scholarship={reminderScholarship} onClose={()=>setReminderScholarship(null)} onSave={r=>{setReminders(r);setReminderIds(new Set(r.map(x=>x.id)));}} />}
      <div className="flex items-center justify-between mb-6">
        <div>
          <button onClick={onBack} style={{ background:"none",border:"none",color:"rgba(255,255,255,0.4)",cursor:"pointer",fontSize:13,marginBottom:6,padding:0 }}>← Back</button>
          <h2 className="font-display text-2xl sm:text-3xl font-black text-white" style={{ letterSpacing:"-0.02em" }}>My Profile</h2>
          <p className="text-xs sm:text-sm mt-1" style={{ color:"rgba(255,255,255,0.4)" }}>{user.email}</p>
        </div>
        {user.isPro
          ? <div className="px-3 py-1.5 rounded-xl text-xs font-bold" style={{ background:"rgba(212,175,55,0.1)",border:"1px solid rgba(212,175,55,0.3)",color:"#d4af37" }}>✦ Pro</div>
          : <button onClick={()=>onUpgrade("monthly")} disabled={stripeLoading} className="gold-btn px-3 py-2 rounded-xl text-xs font-bold">Upgrade</button>}
      </div>

      {!loading && profile && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label:"Searches", value:profile.searchCount, sub:user.isPro?"Unlimited":`of ${profile.searchLimit}` },
            { label:"Saved", value:profile.savedScholarships?.length||0, sub:"scholarships" },
            { label:"Plan", value:user.isPro?"Pro ✦":"Free", sub:user.isPro?"Unlocked":"1 search" },
          ].map(stat=>(
            <div key={stat.label} className="rounded-xl p-3 sm:p-5" style={{ background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)" }}>
              <div className="font-display text-2xl sm:text-3xl font-black mb-0.5" style={{ color:"#d4af37" }}>{stat.value}</div>
              <div className="text-xs sm:text-sm font-semibold text-white">{stat.label}</div>
              <div className="text-xs" style={{ color:"rgba(255,255,255,0.35)" }}>{stat.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs — full width on mobile, no text wrapping */}
      <div style={{ display:"flex",gap:4,marginBottom:20,padding:4,borderRadius:12,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)" }}>
        <button style={tabStyle("searches")} onClick={()=>setTab("searches")}>🕐 Searches</button>
        <button style={tabStyle("saved")} onClick={()=>setTab("saved")}>★ Saved</button>
        <button style={tabStyle("reminders")} onClick={()=>setTab("reminders")}>🔔 {reminders.length > 0 ? `Reminders (${reminders.length})` : "Reminders"}</button>
        <button style={tabStyle("discover")} onClick={()=>{setTab("discover");if(matchPhase==="idle"&&!profile?.user?.scholarProfile)setMatchPhase("form");}}>✦ Best Match</button>
      </div>

      {loading ? <div style={{ color:"rgba(255,255,255,0.3)",fontSize:14,padding:"40px 0",textAlign:"center" }}>Loading...</div> : (
        <>
          {tab==="searches" && (
            !profile.recentSearches?.length
              ? <div className="rounded-2xl p-10 text-center" style={{ background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)" }}><div style={{ fontSize:32,marginBottom:12 }}>🔍</div><p style={{ color:"rgba(255,255,255,0.3)",fontSize:14 }}>No searches yet.</p></div>
              : <div className="flex flex-col gap-4">
                  {profile.recentSearches.map((search,i)=>(
                    <div key={i} className="rounded-2xl p-4 sm:p-5" style={{ background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)" }}>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {search.isBestMatch && <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background:"rgba(212,175,55,0.15)",color:"#d4af37",border:"1px solid rgba(212,175,55,0.3)" }}>✦ Best Match</span>}
                            {search.query.type&&!search.isBestMatch&&<span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background:"rgba(212,175,55,0.1)",color:"#d4af37" }}>{search.query.type}</span>}
                            {search.query.university&&<span className="text-xs px-2 py-0.5 rounded-full" style={{ background:"rgba(255,255,255,0.07)",color:"rgba(255,255,255,0.5)" }}>🎓 {search.query.university}</span>}
                            {search.query.region&&<span className="text-xs px-2 py-0.5 rounded-full" style={{ background:"rgba(255,255,255,0.07)",color:"rgba(255,255,255,0.5)" }}>📍 {search.query.region}</span>}
                          </div>
                          <p className="text-xs" style={{ color:"rgba(255,255,255,0.25)" }}>{new Date(search.searchedAt).toLocaleDateString("en-AU",{day:"numeric",month:"short",year:"numeric"})}</p>
                        </div>
                        <div className="text-xs font-semibold px-2 py-1 rounded-full shrink-0" style={{ background:"rgba(74,222,128,0.1)",color:"#4ade80",border:"1px solid rgba(74,222,128,0.2)" }}>{search.results?.length||0} results</div>
                      </div>
                      <div className="flex flex-col gap-2 mt-2">
                        {(search.results||[]).slice(0,3).map((s,j)=>(
                          <div key={j} className="flex items-center justify-between rounded-xl px-3 py-2" style={{ background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.05)" }}>
                            <div className="min-w-0 flex-1 pr-2"><div className="text-sm font-semibold text-white truncate">{s.name}</div><div className="text-xs truncate" style={{ color:"rgba(255,255,255,0.35)" }}>{s.institution}</div></div>
                            <div className="flex items-center gap-2 shrink-0">
                              {s.matchScore&&<span className="text-xs font-bold" style={{ color:"#4ade80" }}>{s.matchScore}%</span>}
                              <span className="font-display text-sm font-bold" style={{ color:TYPE_COLORS[s.type]||"#d4af37" }}>{s.amount}</span>
                            </div>
                          </div>
                        ))}
                        {(search.results||[]).length>3&&<p className="text-xs text-center mt-1" style={{ color:"rgba(255,255,255,0.25)" }}>+{search.results.length-3} more</p>}
                      </div>
                    </div>
                  ))}
                </div>
          )}

          {tab==="saved" && (
            !profile.savedScholarships?.length
              ? <div className="rounded-2xl p-10 text-center" style={{ background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)" }}><div style={{ fontSize:32,marginBottom:12 }}>★</div><p style={{ color:"rgba(255,255,255,0.3)",fontSize:14 }}>No saved scholarships yet.</p></div>
              : <div className="flex flex-col gap-4">{profile.savedScholarships.map((s,i)=><ScholarshipCard key={i} s={s} index={i} savedIds={savedIds} onSave={handleSave} showMatch={!!s.matchScore} onEssay={s=>{if(!user.isPro){onUpgrade&&onUpgrade("monthly");}else{setEssayTarget(s);}}} isPro={user.isPro} onReminder={s=>setReminderScholarship(s)} reminderIds={reminderIds} />)}</div>
          )}

          {tab==="reminders" && (
            <div>
              {!user.isPro ? (
                <div className="rounded-2xl p-8 text-center" style={{ background:"rgba(212,175,55,0.05)",border:"1px solid rgba(212,175,55,0.2)" }}>
                  <div style={{ fontSize:28,marginBottom:10 }}>🔔</div>
                  <h3 className="font-display text-xl font-bold text-white mb-2">Pro Feature</h3>
                  <p className="text-sm mb-5" style={{ color:"rgba(255,255,255,0.45)",maxWidth:300,margin:"0 auto 16px" }}>Get email reminders 30, 7, and 1 day before scholarship deadlines.</p>
                  <button onClick={()=>onUpgrade("monthly")} disabled={stripeLoading} className="gold-btn px-6 py-3 rounded-xl text-sm font-bold">Upgrade to Pro</button>
                </div>
              ) : !reminders.length ? (
                <div className="rounded-2xl p-10 text-center" style={{ background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ fontSize:32,marginBottom:12 }}>🔔</div>
                  <p className="font-bold text-white mb-2">No reminders set yet</p>
                  <p style={{ color:"rgba(255,255,255,0.3)",fontSize:13 }}>Click the 🔔 button on any scholarship to set a deadline reminder.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {reminders.sort((a,b)=>new Date(a.deadlineDate)-new Date(b.deadlineDate)).map((reminder, i) => {
                    const deadline = new Date(reminder.deadlineDate);
                    const daysLeft = Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24));
                    const urgencyColor = daysLeft <= 1 ? "#f87171" : daysLeft <= 7 ? "#fbbf24" : daysLeft <= 30 ? "#d4af37" : "rgba(255,255,255,0.5)";
                    const isPast = daysLeft < 0;
                    return (
                      <div key={i} className="rounded-2xl p-4 sm:p-5" style={{ background:"rgba(255,255,255,0.03)",border:`1px solid ${isPast?"rgba(255,255,255,0.05)":"rgba(212,175,55,0.15)"}`,opacity:isPast?0.5:1 }}>
                        <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12 }}>
                          <div style={{ flex:1,minWidth:0 }}>
                            <div style={{ fontSize:11,fontWeight:700,color:urgencyColor,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4 }}>
                              {isPast ? "Passed" : daysLeft === 1 ? "⚠ Due tomorrow" : daysLeft <= 7 ? `⏰ ${daysLeft} days left` : daysLeft <= 30 ? `📅 ${daysLeft} days left` : `🔔 ${daysLeft} days`}
                            </div>
                            <div className="text-sm font-bold text-white mb-0.5 truncate">{reminder.scholarship.name}</div>
                            <div className="text-xs truncate" style={{ color:"rgba(255,255,255,0.4)" }}>{reminder.scholarship.institution}</div>
                            <div className="text-xs mt-2" style={{ color:"rgba(255,255,255,0.3)" }}>
                              Deadline: <span style={{ color:"white",fontWeight:600 }}>{reminder.deadlineStr}</span>
                            </div>
                            <div className="flex gap-1.5 mt-2 flex-wrap">
                              {[30,7,1].map(d => (
                                <span key={d} style={{ fontSize:10,padding:"2px 7px",borderRadius:10,background:(reminder.sentDays||[]).includes(d)?"rgba(74,222,128,0.15)":"rgba(255,255,255,0.05)",border:`1px solid ${(reminder.sentDays||[]).includes(d)?"rgba(74,222,128,0.3)":"rgba(255,255,255,0.08)"}`,color:(reminder.sentDays||[]).includes(d)?"#4ade80":"rgba(255,255,255,0.3)" }}>
                                  {(reminder.sentDays||[]).includes(d) ? `✓ ${d}d sent` : `${d}d`}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div style={{ display:"flex",flexDirection:"column",gap:6,shrink:0,alignItems:"flex-end" }}>
                            <div className="font-display text-lg font-black" style={{ color:TYPE_COLORS[reminder.scholarship.type]||"#d4af37" }}>{reminder.scholarship.amount}</div>
                            <button onClick={async()=>{
                              const res = await api(`/api/reminders/${encodeURIComponent(reminder.id)}`,{method:"DELETE"});
                              const data = await res.json();
                              setReminders(data.reminders);
                              setReminderIds(new Set(data.reminders.map(r=>r.id)));
                            }} style={{ fontSize:11,padding:"4px 10px",borderRadius:7,cursor:"pointer",background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",color:"rgba(239,68,68,0.7)",fontWeight:600 }}>Remove</button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {tab==="discover" && (
            <div>
              {!user.isPro && (
                <div className="rounded-2xl p-6 sm:p-8 text-center mb-6" style={{ background:"rgba(212,175,55,0.05)",border:"1px solid rgba(212,175,55,0.2)" }}>
                  <div style={{ fontSize:28,marginBottom:10 }}>✦</div>
                  <h3 className="font-display text-xl font-bold text-white mb-2">Pro Feature</h3>
                  <p className="text-sm mb-5" style={{ color:"rgba(255,255,255,0.45)",maxWidth:300,margin:"0 auto 16px" }}>AI ranks scholarships by your personal win probability.</p>
                  <button onClick={()=>onUpgrade("monthly")} disabled={stripeLoading} className="gold-btn px-6 py-3 rounded-xl text-sm font-bold">{stripeLoading?"...":"Upgrade to Pro"}</button>
                </div>
              )}
              {user.isPro && matchPhase==="idle" && (
                <div className="rounded-2xl p-6 sm:p-8" style={{ background:"rgba(212,175,55,0.04)",border:"1px solid rgba(212,175,55,0.15)" }}>
                  <div style={{ fontSize:28,marginBottom:12 }}>✦</div>
                  <h3 className="font-display text-2xl font-bold text-white mb-2">Find Your Best Match</h3>
                  <p className="text-sm mb-5" style={{ color:"rgba(255,255,255,0.5)",lineHeight:1.7 }}>Tell us about yourself and our AI will rank scholarships by how likely you are to qualify and win.</p>
                  <div style={{ display:"flex",gap:10,flexWrap:"wrap" }}>
                    <button onClick={()=>setMatchPhase("form")} className="gold-btn px-5 py-3 rounded-xl text-sm font-bold">Get Started →</button>
                    {profile?.user?.scholarProfile && (
                      <button onClick={()=>runMatch(profile.user.scholarProfile)} style={{ background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",color:"rgba(255,255,255,0.6)",padding:"12px 16px",borderRadius:12,fontSize:13,cursor:"pointer",fontWeight:600 }}>Re-run saved profile</button>
                    )}
                  </div>
                </div>
              )}
              {user.isPro && matchPhase==="form" && (
                <div className="rounded-2xl p-5 sm:p-8" style={{ background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.08)" }}>
                  {matchError && <div style={{ background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.2)",color:"#fca5a5",padding:"10px 14px",borderRadius:10,fontSize:13,marginBottom:18 }}>{matchError}</div>}
                  <ScholarProfileForm existing={profile?.user?.scholarProfile} onSubmit={runMatch} onCancel={()=>setMatchPhase("idle")} loading={matchLoading} />
                </div>
              )}
              {user.isPro && matchPhase==="searching" && (
                <div className="text-center py-12">
                  <div style={{ width:56,height:56,borderRadius:18,background:"rgba(212,175,55,0.1)",border:"1px solid rgba(212,175,55,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,margin:"0 auto 20px",animation:"spin 3s linear infinite" }}>✦</div>
                  <h3 className="font-display text-2xl font-black text-white mb-2">Analysing Your Profile</h3>
                  <p className="text-sm font-medium mb-6" style={{ color:"#d4af37" }}>{matchMsg}</p>
                  <div className="grid grid-cols-2 gap-2 max-w-xs mx-auto">
                    {AGENT_SOURCES.map((a,i)=><div key={i} className="rounded-xl px-3 py-2.5 flex items-center gap-2" style={{ background:"rgba(255,255,255,0.03)",border:"1px solid rgba(212,175,55,0.1)" }}><span>{a.icon}</span><span className="text-xs" style={{ color:"rgba(255,255,255,0.5)" }}>{a.name}</span><div style={{ marginLeft:"auto",width:5,height:5,borderRadius:"50%",background:"#4ade80",animation:"pulse-dot 1.5s infinite" }} /></div>)}
                  </div>
                </div>
              )}
              {user.isPro && matchPhase==="results" && (
                <div>
                  <div className="flex items-start justify-between mb-5 gap-3">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color:"#d4af37" }}>✦ Best Match Results</div>
                      <h3 className="font-display text-xl sm:text-2xl font-black text-white">Your Top {matchResults.length}</h3>
                      <p className="text-xs sm:text-sm mt-1" style={{ color:"rgba(255,255,255,0.4)" }}>Ranked by match score · AI analysed</p>
                    </div>
                    <button onClick={()=>setMatchPhase("form")} style={{ background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.5)",padding:"8px 12px",borderRadius:10,fontSize:12,cursor:"pointer",fontWeight:600,shrink:0,whiteSpace:"nowrap" }}>↻ Refine</button>
                  </div>
                  <div className="flex gap-3 mb-5 flex-wrap">
                    {[["90–100","#4ade80","Exceptional"],["70–89","#d4af37","Strong"],["55–69","#fb923c","Good"],["<55","#f87171","Partial"]].map(([range,color,label])=>(
                      <div key={range} className="flex items-center gap-1.5"><div style={{ width:8,height:8,borderRadius:"50%",background:color }} /><span className="text-xs" style={{ color:"rgba(255,255,255,0.4)" }}><span style={{ color:"white",fontWeight:600 }}>{range}</span> {label}</span></div>
                    ))}
                  </div>
                  <div className="flex flex-col gap-4">
                    {matchResults.map((s,i)=><ScholarshipCard key={i} s={s} index={i} savedIds={savedIds} onSave={handleSave} showMatch={true} onEssay={s=>setEssayTarget(s)} isPro={user.isPro} onReminder={s=>setReminderScholarship(s)} reminderIds={reminderIds} />)}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState("");
  const [page, setPage] = useState("home");
  const [type, setType] = useState(""); const [university, setUniversity] = useState(""); const [region, setRegion] = useState("");
  const [phase, setPhase] = useState("idle");
  const [loadingMsg, setLoadingMsg] = useState("");
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const [stripeLoading, setStripeLoading] = useState(false);
  const [savedIds, setSavedIds] = useState(new Set());
  const [essayScholarship, setEssayScholarship] = useState(null);
  const [deeplinkedScholarship, setDeeplinkedScholarship] = useState(null);
  const [reminderScholarship, setReminderScholarship] = useState(null);
  const [reminderIds, setReminderIds] = useState(new Set());
  const intervalRef = useRef(null); const msgIdx = useRef(0);

  useEffect(() => {
    const token = localStorage.getItem("kaloma_token");
    if (token) {
      api("/api/auth/me").then(r=>r.json()).then(data => {
        if (data.user) {
          setUser(data.user);
          setSavedIds(new Set((data.user.savedScholarships||[]).map(s=>`${s.name}||${s.institution}`)));
          if (data.user.isPro) {
            api("/api/reminders").then(r=>r.json()).then(d => {
              setReminderIds(new Set((d.reminders||[]).map(r=>r.id)));
            }).catch(()=>{});
          }
        }
        else localStorage.removeItem("kaloma_token");
      }).catch(()=>localStorage.removeItem("kaloma_token")).finally(()=>setAuthReady(true));
    } else setAuthReady(true);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get("s");
    if (slug) {
      try { const scholarship = JSON.parse(atob(decodeURIComponent(slug))); setDeeplinkedScholarship(scholarship); window.history.replaceState({}, "", "/"); } catch {}
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    if (sessionId && params.get("paid")==="true") {
      api(`/api/verify-session/${sessionId}`).then(r=>r.json()).then(data => { if (data.user) setUser(data.user); window.history.replaceState({},"","/"); }).catch(console.error);
    }
  }, []);

  const handleAuth = (u) => { setUser(u); setShowAuth(false); };
  const logout = () => { localStorage.removeItem("kaloma_token"); setUser(null); setPhase("idle"); setResults([]); setPage("home"); };

  const handleSave = async (scholarship) => {
    if (!user) return setShowAuth(true);
    const res = await api("/api/scholarships/save",{ method:"POST",body:JSON.stringify({scholarship}) });
    const data = await res.json();
    setSavedIds(new Set((data.savedScholarships||[]).map(s=>`${s.name}||${s.institution}`)));
    setUser(u=>({...u,savedScholarships:data.savedScholarships}));
  };

  const search = async () => {
    if (!user) return setShowAuth(true);
    if (!university.trim()&&!region.trim()) return setError("Please enter at least a university or region.");
    setError(""); setPhase("searching"); setResults([]);
    msgIdx.current=0; setLoadingMsg(LOADING_MSGS[0]);
    intervalRef.current = setInterval(()=>{ msgIdx.current=(msgIdx.current+1)%LOADING_MSGS.length; setLoadingMsg(LOADING_MSGS[msgIdx.current]); },1800);
    try {
      const res = await api("/api/search",{ method:"POST",body:JSON.stringify({type,university,region}) });
      const data = await res.json();
      if (!res.ok) {
        if (data.error==="FREE_LIMIT_REACHED") { setUpgradeReason("search_limit"); setShowUpgrade(true); setPhase("idle"); return; }
        throw new Error(data.error||data.message);
      }
      setResults(data.scholarships||[]);
      setUser(u=>({...u,searchCount:(u.searchCount||0)+1}));
    } catch(e) { setError(e.message); }
    finally { clearInterval(intervalRef.current); setPhase(p=>p==="searching"?"results":p); }
  };

  const handleUpgrade = async (plan) => {
    if (!user) return setShowAuth(true);
    setStripeLoading(true); setShowUpgrade(false);
    try {
      const res = await api("/api/create-checkout",{ method:"POST",body:JSON.stringify({plan}) });
      const data = await res.json();
      if (data.url) window.location.href = data.url; else throw new Error(data.error);
    } catch(e) { alert("Payment error: "+e.message); }
    finally { setStripeLoading(false); }
  };

  const reset = () => { setPhase("idle"); setResults([]); setError(""); };

  if (!authReady) return <div style={{ minHeight:"100vh",background:"linear-gradient(135deg,#060b18,#0a1628)",display:"flex",alignItems:"center",justifyContent:"center" }}><div style={{ color:"rgba(255,255,255,0.3)",fontSize:14 }}>Loading...</div></div>;

  return (
    <div className="min-h-screen" style={{ background:"linear-gradient(135deg,#060b18 0%,#0a1628 50%,#060d1f 100%)" }}>
      {showAuth && <AuthModal onAuth={handleAuth} />}
      {showUpgrade && <UpgradeModal onUpgrade={handleUpgrade} onClose={()=>setShowUpgrade(false)} loading={stripeLoading} reason={upgradeReason} />}
      {essayScholarship && <EssayModal scholarship={essayScholarship} userProfile={user?.scholarProfile} onClose={()=>setEssayScholarship(null)} />}
      {deeplinkedScholarship && <DeeplinkModal scholarship={deeplinkedScholarship} onClose={()=>setDeeplinkedScholarship(null)} onSave={handleSave} savedIds={savedIds} onEssay={s=>{setDeeplinkedScholarship(null);if(!user?.isPro){setUpgradeReason("general");setShowUpgrade(true);}else{setEssayScholarship(s);}}} isPro={user?.isPro} onUpgrade={handleUpgrade} />}
      {reminderScholarship && <ReminderModal scholarship={reminderScholarship} onClose={()=>setReminderScholarship(null)} onSave={r=>{setReminderIds(new Set(r.map(x=>x.id)));}} />}

      {/* ── Nav ── */}
      <nav style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 16px",borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
        {/* Logo */}
        <a href="/" style={{ display:"flex",alignItems:"center",gap:10,cursor:"pointer",textDecoration:"none" }}>
          <div style={{ width:34,height:34,borderRadius:10,background:"linear-gradient(135deg,#d4af37,#f5d060)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,fontWeight:900,color:"#0a0f1e",fontFamily:"'Playfair Display',serif",flexShrink:0 }}>K</div>
          <div style={{ fontFamily:"'Playfair Display',serif",fontWeight:700,color:"white",fontSize:16,letterSpacing:"-0.02em" }}>Kaloma</div>
        </a>

        {/* Right side */}
        <div style={{ display:"flex",alignItems:"center",gap:8 }}>
          {user ? (
            <>
              {/* Profile button — compact on mobile */}
              <button onClick={()=>setPage(page==="profile"?"home":"profile")}
                style={{ display:"flex",alignItems:"center",gap:6,background:page==="profile"?"rgba(212,175,55,0.1)":"rgba(255,255,255,0.05)",border:`1px solid ${page==="profile"?"rgba(212,175,55,0.3)":"rgba(255,255,255,0.08)"}`,color:page==="profile"?"#d4af37":"rgba(255,255,255,0.5)",padding:"7px 10px",borderRadius:9,cursor:"pointer",fontSize:13,fontWeight:500 }}>
                <span>👤</span>
                {/* Show email username on sm+, hide on mobile */}
                <span style={{ maxWidth:80,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }} className="hidden sm:inline">{user.email.split("@")[0]}</span>
                {user.isPro && <span style={{ fontSize:9,fontWeight:800,color:"#d4af37",background:"rgba(212,175,55,0.2)",border:"1px solid rgba(212,175,55,0.35)",borderRadius:4,padding:"1px 4px",letterSpacing:"0.04em" }}>PRO</span>}
              </button>

              {/* Upgrade — show on mobile only if not pro */}
              {!user.isPro && (
                <button onClick={()=>{setUpgradeReason("general");setShowUpgrade(true);}} disabled={stripeLoading}
                  className="gold-btn rounded-lg text-xs font-bold"
                  style={{ padding:"7px 10px" }}>
                  Upgrade
                </button>
              )}

              {/* Sign out — icon only on mobile */}
              <button onClick={logout}
                style={{ background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",color:"rgba(255,255,255,0.3)",padding:"7px 10px",borderRadius:9,cursor:"pointer",fontSize:12 }}>
                <span className="hidden sm:inline">Sign out</span>
                <span className="sm:hidden">✕</span>
              </button>
            </>
          ) : (
            <>
              <button onClick={()=>setShowAuth(true)} style={{ background:"none",border:"1px solid rgba(255,255,255,0.15)",color:"rgba(255,255,255,0.6)",padding:"7px 14px",borderRadius:9,cursor:"pointer",fontSize:13,fontWeight:500 }}>Sign in</button>
              <button onClick={()=>setShowAuth(true)} className="gold-btn px-3 py-2 rounded-lg text-xs font-bold">Get Started</button>
            </>
          )}
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {page==="profile"&&user && (
          <ProfilePage user={user} onBack={()=>setPage("home")} onUpgrade={handleUpgrade} stripeLoading={stripeLoading} onUserUpdate={(updates)=>setUser(u=>({...u,...updates}))} />
        )}

        {page==="home" && (
          <>
            {phase==="idle" && (
              <div className="animate-fade-up">
                <div className="text-center mb-10 sm:mb-14">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 text-xs font-semibold tracking-widest uppercase" style={{ background:"rgba(212,175,55,0.08)",border:"1px solid rgba(212,175,55,0.2)",color:"#d4af37" }}>✦ &nbsp;6 agents · 40+ sources · worldwide</div>
                  <h1 className="font-display font-black text-white mb-4 leading-none" style={{ fontSize:"clamp(32px,7vw,68px)",letterSpacing:"-0.03em" }}>Discover your funding<br /><span className="shimmer-text">the world over.</span></h1>
                  <p className="text-sm sm:text-base max-w-lg mx-auto leading-relaxed" style={{ color:"rgba(255,255,255,0.45)" }}>AI agents scan universities, governments, foundations and industry bodies — surfacing opportunities matched precisely to you.</p>
                </div>
                <div className="rounded-2xl p-4 sm:p-8 glass-card">
                  {error&&<div className="mb-4 rounded-xl px-4 py-3 text-sm" style={{ background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.2)",color:"#fca5a5" }}>{error}</div>}
                  {user&&!user.isPro&&(user.searchCount||0)>=1&&(
                    <div className="mb-5 rounded-xl px-4 py-3 text-sm" style={{ background:"rgba(212,175,55,0.08)",border:"1px solid rgba(212,175,55,0.2)",color:"#d4af37" }}>
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <span>⚠ Free search used. Upgrade for unlimited.</span>
                        <button onClick={()=>{setUpgradeReason("search_limit");setShowUpgrade(true);}} style={{ background:"linear-gradient(135deg,#d4af37,#f5d060)",border:"none",color:"#0a0f1e",padding:"5px 12px",borderRadius:7,fontSize:12,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap" }}>Upgrade</button>
                      </div>
                    </div>
                  )}
                  <ScholarProfileForm
                    initial={user?.scholarProfile||{}}
                    loading={phase==="searching"}
                    onSubmit={p=>{
                      if (!user) return setShowAuth(true);
                      setError(""); setPhase("searching"); setResults([]);
                      msgIdx.current=0; setLoadingMsg(MATCH_MSGS[0]);
                      intervalRef.current = setInterval(()=>{ msgIdx.current=(msgIdx.current+1)%MATCH_MSGS.length; setLoadingMsg(MATCH_MSGS[msgIdx.current]); },1800);
                      api("/api/match",{ method:"POST",body:JSON.stringify({scholarProfile:p}) })
                        .then(r=>r.json())
                        .then(data=>{
                          if (data.error==="FREE_LIMIT_REACHED"||data.error==="PRO_REQUIRED") { setUpgradeReason("search_limit"); setShowUpgrade(true); setPhase("idle"); return; }
                          if (!data.scholarships) throw new Error(data.error||data.message||"No results");
                          setResults(data.scholarships);
                          setUser(u=>({...u,searchCount:(u.searchCount||0)+1,scholarProfile:p}));
                        })
                        .catch(e=>{ setError(e.message); })
                        .finally(()=>{ clearInterval(intervalRef.current); setPhase(p=>p==="searching"?"results":p); });
                    }}
                  />
                  <p className="text-center text-xs mt-4" style={{ color:"rgba(255,255,255,0.2)" }}>
                    {user ? (user.isPro?"Unlimited searches · All results unlocked":`${1-(user.searchCount||0)} free search remaining`) : "Free account required · No credit card needed"}
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
                  {[
                    { icon:"✦",title:"AI-Matched Results",desc:"Our AI ranks scholarships by your personal profile and win probability." },
                    { icon:"🌍",title:"40+ Global Sources",desc:"Universities, governments, foundations and industry bodies worldwide." },
                    { icon:"★",title:"Save & Track",desc:"Bookmark scholarships and revisit your match history anytime." },
                  ].map(f=>(
                    <div key={f.title} className="rounded-2xl p-4 sm:p-5" style={{ background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)" }}>
                      <div style={{ fontSize:22,marginBottom:8 }}>{f.icon}</div>
                      <div className="text-sm font-bold text-white mb-1">{f.title}</div>
                      <div className="text-xs leading-relaxed" style={{ color:"rgba(255,255,255,0.35)" }}>{f.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {phase==="searching" && (
              <div className="animate-fade-up">
                <div className="text-center mb-8">
                  <div style={{ width:52,height:52,borderRadius:14,background:"rgba(212,175,55,0.1)",border:"1px solid rgba(212,175,55,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,margin:"0 auto 16px",animation:"spin 3s linear infinite" }}>◎</div>
                  <h2 className="font-display text-2xl font-black text-white mb-2">Agents Deployed</h2>
                  <p className="text-sm font-medium" style={{ color:"#d4af37" }}>{loadingMsg}</p>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color:"rgba(255,255,255,0.35)" }}>Active Agents ({AGENT_SOURCES.length})</h3>
                  <div className="flex items-center gap-2"><div style={{ width:5,height:5,borderRadius:"50%",background:"#d4af37",animation:"pulse-dot 1.5s infinite" }} /><span className="text-xs font-semibold" style={{ color:"#d4af37" }}>Searching in parallel</span></div>
                </div>
                <div className="grid grid-cols-2 gap-3">{AGENT_SOURCES.map((a,i)=><AgentCard key={i} agent={a} index={i} />)}</div>
              </div>
            )}

            {phase==="results" && (
              <div className="animate-fade-up">
                {error
                  ? <div className="rounded-2xl p-6 text-sm" style={{ background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",color:"#fca5a5" }}>{error}</div>
                  : <>
                      <div className="flex items-start justify-between mb-6 gap-3">
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color:"#d4af37" }}>Match complete</div>
                          <h2 className="font-display text-2xl sm:text-3xl font-black text-white" style={{ letterSpacing:"-0.02em" }}>{results.length} Matched</h2>
                          <p className="text-xs sm:text-sm mt-1" style={{ color:"rgba(255,255,255,0.35)" }}>{[type,university,region].filter(Boolean).join(" · ")||"Worldwide"}</p>
                        </div>
                        <div className="text-xs font-bold px-3 py-1.5 rounded-xl shrink-0" style={{ background:"rgba(74,222,128,0.1)",border:"1px solid rgba(74,222,128,0.2)",color:"#4ade80" }}>✓ AI Verified</div>
                      </div>
                      <div className="flex flex-col gap-4">{results.slice(0,FREE_LIMIT).map((s,i)=><ScholarshipCard key={i} s={s} index={i} savedIds={savedIds} onSave={handleSave} showMatch={true} onEssay={s=>{if(!user?.isPro){setUpgradeReason("general");setShowUpgrade(true);}else{setEssayScholarship(s);}}} isPro={user?.isPro} onReminder={s=>{if(!user?.isPro){setUpgradeReason("general");setShowUpgrade(true);}else{setReminderScholarship(s);}}} reminderIds={reminderIds} />)}</div>
                      {!user?.isPro&&results.length>FREE_LIMIT ? <BlurGate onUpgrade={handleUpgrade} loading={stripeLoading} topScholarship={results[FREE_LIMIT]} />
                        : results.slice(FREE_LIMIT).map((s,i)=><div key={i+FREE_LIMIT} className="mt-4"><ScholarshipCard s={s} index={i+FREE_LIMIT} savedIds={savedIds} onSave={handleSave} showMatch={true} onEssay={s=>setEssayScholarship(s)} isPro={user?.isPro} onReminder={s=>setReminderScholarship(s)} reminderIds={reminderIds} /></div>)}
                      <div className="mt-8 rounded-2xl p-5 text-center" style={{ background:"rgba(212,175,55,0.05)",border:"1px solid rgba(212,175,55,0.15)" }}>
                        <p className="text-xs mb-4 leading-relaxed" style={{ color:"rgba(255,255,255,0.3)" }}>Always verify scholarship details on the institution's official website. Deadlines and amounts are subject to change.</p>
                        <button onClick={reset} className="gold-btn px-6 py-2.5 rounded-xl text-sm font-bold">◎ New Search</button>
                      </div>
                    </>}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
