
export const TYPE_COLORS = {
  "Merit-Based": "#d4af37",
  "STEM / Engineering": "#34d399",
  "Research": "#a78bfa",
  "Government / National": "#f87171",
  "Need-Based": "#60a5fa",
  "International Students": "#fb923c",
  "Graduate / Postgraduate": "#e879f9",
  "Women in STEM": "#f472b6",
  "Arts & Humanities": "#f59e0b",
  "Community Service": "#22d3ee",
  "Minority / Diversity": "#a3e635",
  "Athletic": "#f87171",
};

export function KLogo({ size = 24 }) {
  return (
    <div style={{
      width: size, height: size, flexShrink: 0,
      borderRadius: Math.round(size * 0.3),
      background: "linear-gradient(135deg,#d4af37,#f5d060)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: Math.round(size * 0.52), fontWeight: 900,
      color: "#0a0f1e", fontFamily: "'Playfair Display', serif",
    }}>K</div>
  );
}

export function MatchRing({ score, size = 36 }) {
  const color = score >= 85 ? "#4ade80" : score >= 70 ? "#d4af37" : "#fb923c";
  const r = size / 2 - 3.5;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const c = size / 2;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)", display: "block" }}>
        <circle cx={c} cy={c} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
        <circle cx={c} cy={c} r={r} fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ fontSize: Math.round(size * 0.27), fontWeight: 800, color, lineHeight: 1 }}>{score}</span>
      </div>
    </div>
  );
}

export function TBadge({ type }) {
  const color = TYPE_COLORS[type] || "#d4af37";
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, whiteSpace: "nowrap",
      padding: "2px 7px", borderRadius: 20,
      background: `${color}18`, color, border: `1px solid ${color}30`,
    }}>{type}</span>
  );
}

export function ProPill() {
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, letterSpacing: "0.04em",
      padding: "1px 5px", borderRadius: 4,
      background: "rgba(212,175,55,0.12)",
      border: "1px solid rgba(212,175,55,0.25)",
      color: "#d4af37",
    }}>PRO</span>
  );
}

export function UpgradeNudge({ hiddenCount, onUpgrade }) {
  return (
    <div style={{
      margin: "4px 0 8px",
      padding: "14px 16px", borderRadius: 10,
      background: "rgba(212,175,55,0.05)",
      border: "1px solid rgba(212,175,55,0.2)",
    }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: "white", marginBottom: 3 }}>
        {hiddenCount} more scholarships found
      </div>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginBottom: 10, lineHeight: 1.5 }}>
        Unlock Essay Assistant · full match scores · deadline reminders
      </div>
      <button onClick={() => onUpgrade("monthly")} style={{
        width: "100%", padding: "9px", borderRadius: 8,
        background: "linear-gradient(135deg,#d4af37,#f5d060)",
        border: "none", color: "#0a0f1e", fontSize: 13, fontWeight: 700, cursor: "pointer",
      }}>See all — $3.99/mo</button>
    </div>
  );
}
