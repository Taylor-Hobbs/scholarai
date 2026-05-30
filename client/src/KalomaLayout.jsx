import { useState, useEffect } from "react";
import { KLogo, MatchRing, TBadge, ProPill, UpgradeNudge, TYPE_COLORS } from "./atoms";

// ─── Constants ──────────────────────────────────────────────────────────────────
const SIDEBAR_W = 242;
const DRAWER_W = 288;
const HEADER_H = 52;
const BREAKPOINT = 960;
const FREE_LIMIT = 3;
const PRO_LIMIT = 5;

const STUDY_LEVELS = [
  "Undergraduate", "Graduate / Masters", "PhD / Doctoral",
  "High School", "Vocational / TAFE",
];

const QUICK_FILTER_TYPES = [
  { type: "Merit-Based", color: "#d4af37" },
  { type: "STEM / Engineering", color: "#34d399" },
  { type: "Research", color: "#a78bfa" },
  { type: "Government / National", color: "#f87171" },
];

// ─── Hook ───────────────────────────────────────────────────────────────────────
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < BREAKPOINT);
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < BREAKPOINT);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return isMobile;
}

// ─── SidebarBody ────────────────────────────────────────────────────────────────
function SidebarBody({
  isPro, user, recentSearches, activeRecent, onSelectRecent,
  onNewSearch, onUpgrade, onGoProfile, onLogout, reminders, mobile,
}) {
  const saved = user?.savedScholarships || [];

  const sectionLabel = {
    fontSize: 8, fontWeight: 700, textTransform: "uppercase",
    letterSpacing: "0.12em", color: "rgba(255,255,255,0.2)", marginBottom: 6,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Logo row */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "14px 13px", borderBottom: "1px solid rgba(255,255,255,0.06)",
        flexShrink: 0,
      }}>
        <KLogo size={24} />
        <span style={{
          fontFamily: "'Playfair Display', serif", fontWeight: 700,
          color: "white", fontSize: 15, letterSpacing: "-0.01em",
        }}>Kaloma</span>
        {isPro && !mobile && (
          <span style={{
            marginLeft: "auto", fontSize: 9, fontWeight: 800,
            padding: "2px 6px", borderRadius: 4,
            background: "rgba(212,175,55,0.15)", border: "1px solid rgba(212,175,55,0.3)",
            color: "#d4af37", letterSpacing: "0.06em",
          }}>PRO</span>
        )}
        {mobile && (
          <button onClick={mobile.onClose} style={{
            marginLeft: "auto", background: "none", border: "none",
            color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 18,
            padding: "0 4px", lineHeight: 1, minWidth: 36, minHeight: 36,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>✕</button>
        )}
      </div>

      {/* Scrollable area */}
      <div style={{ flex: 1, overflowY: "auto", padding: "10px 10px 0" }}>

        {/* New Search */}
        <button onClick={onNewSearch} style={{
          width: "100%", padding: "8px 12px", marginBottom: 14,
          borderRadius: 7, cursor: "pointer",
          background: "transparent",
          border: "1px dashed rgba(212,175,55,0.45)",
          color: "#d4af37", fontSize: 12, fontWeight: 600,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        }}>
          <span style={{ fontSize: 15, lineHeight: 1 }}>+</span> New Search
        </button>

        {/* Recents */}
        <div style={{ marginBottom: 14 }}>
          <div style={sectionLabel}>RECENTS</div>
          {recentSearches.length === 0
            ? <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", padding: "4px 2px" }}>No searches yet</div>
            : recentSearches.slice(0, 4).map((r, i) => (
              <button key={i} onClick={() => onSelectRecent(i)} style={{
                width: "100%", display: "flex", alignItems: "center", gap: 8,
                padding: "7px 8px", borderRadius: 7, cursor: "pointer",
                background: activeRecent === i ? "rgba(212,175,55,0.08)" : "transparent",
                border: "none", textAlign: "left",
              }}>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", flexShrink: 0 }}>◎</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 12, fontWeight: 600, color: "white",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}>{r.label}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>
                    {r.count} found · {r.date}
                  </div>
                </div>
                {activeRecent === i && (
                  <div style={{ width: 3, height: 3, borderRadius: "50%", background: "#d4af37", flexShrink: 0 }} />
                )}
              </button>
            ))
          }
        </div>

        {/* Saved */}
        <div style={{ marginBottom: 14 }}>
          <div style={sectionLabel}>SAVED</div>
          {saved.length === 0
            ? <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", padding: "4px 2px" }}>Nothing saved yet</div>
            : saved.slice(0, 2).map((s, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "7px 8px", borderRadius: 7,
              }}>
                <span style={{ color: "#d4af37", fontSize: 13, flexShrink: 0 }}>★</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 12, fontWeight: 600, color: "white",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}>{s.name}</div>
                  <div style={{
                    fontSize: 10, color: "rgba(212,175,55,0.7)",
                    fontFamily: "'Playfair Display', serif", fontWeight: 700,
                  }}>{s.amount}</div>
                </div>
              </div>
            ))
          }
        </div>

        {/* Reminders */}
        <div style={{ marginBottom: 14 }}>
          <div style={sectionLabel}>REMINDERS</div>
          {!isPro
            ? <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", padding: "4px 2px", display: "flex", alignItems: "center", gap: 5 }}>
                <ProPill /> Unlock with Pro
              </div>
            : reminders.length === 0
            ? <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", padding: "4px 2px" }}>No reminders set</div>
            : reminders.slice(0, 2).map((r, i) => {
                const daysLeft = Math.ceil((new Date(r.deadlineDate) - new Date()) / 86400000);
                const urgentColor = daysLeft <= 7 ? "#fbbf24" : "rgba(255,255,255,0.4)";
                return (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "7px 8px", borderRadius: 7,
                  }}>
                    <span style={{ fontSize: 12, flexShrink: 0 }}>🔔</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 12, fontWeight: 600, color: "white",
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                      }}>{r.scholarship?.name || "Reminder"}</div>
                      <div style={{ fontSize: 10, color: urgentColor }}>
                        {daysLeft > 0 ? `${daysLeft} days left` : "Past deadline"}
                      </div>
                    </div>
                  </div>
                );
              })
          }
        </div>

        {/* Quick Filters */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ ...sectionLabel, display: "flex", alignItems: "center", gap: 6 }}>
            QUICK FILTERS {!isPro && <ProPill />}
          </div>
          {QUICK_FILTER_TYPES.map(({ type, color }) => (
            <div key={type} style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "6px 8px", borderRadius: 7,
              opacity: isPro ? 1 : 0.38, cursor: isPro ? "pointer" : "default",
            }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: color, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>{type}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Plan footer */}
      <div style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "10px 10px 12px", flexShrink: 0,
      }}>
        {isPro ? (
          <div style={{
            padding: "10px 12px", borderRadius: 8,
            background: "rgba(212,175,55,0.06)",
            border: "1px solid rgba(212,175,55,0.22)",
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#d4af37", marginBottom: 2 }}>
              ✦ Pro Plan Active
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Unlimited · All features</div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 8 }}>
              Free Plan · {user?.searchCount || 0}/1 searches used
            </div>
            <button onClick={() => onUpgrade("monthly")} style={{
              width: "100%", padding: "8px 12px", borderRadius: 7, marginBottom: 4,
              background: "linear-gradient(135deg,#d4af37,#f5d060)",
              border: "none", color: "#0a0f1e", fontSize: 12, fontWeight: 700, cursor: "pointer",
            }}>Upgrade to Pro →</button>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", textAlign: "center" }}>
              $3.99/mo · Cancel anytime
            </div>
          </>
        )}
        {user && (
          <button onClick={onGoProfile} style={{
            width: "100%", marginTop: 8, padding: "6px",
            background: "none", border: "none",
            color: "rgba(255,255,255,0.25)", fontSize: 11,
            cursor: "pointer", borderRadius: 6,
          }}>👤 {user.email.split("@")[0]} · Profile</button>
        )}
      </div>
    </div>
  );
}

// ─── Result Card ─────────────────────────────────────────────────────────────────
function ResultCard({ s, expanded, onToggle, isPro, onSave, onEssay, onReminder, savedIds, reminderIds }) {
  const accent = TYPE_COLORS[s.type] || "#d4af37";
  const isSaved = savedIds?.has(`${s.name}||${s.institution}`);
  const hasReminder = reminderIds?.has(`${s.name}||${s.institution}`);

  return (
    <div onClick={onToggle} className="kaloma-card" style={{
      borderRadius: 10, marginBottom: 6,
      background: expanded ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
      border: `1px solid ${expanded ? `${accent}30` : "rgba(255,255,255,0.065)"}`,
      cursor: "pointer",
      transition: "background 0.15s, border-color 0.15s",
    }}>
      {/* Collapsed content */}
      <div style={{ padding: "11px 13px", display: "flex", gap: 10, alignItems: "flex-start" }}>
        {s.matchScore && <MatchRing score={s.matchScore} size={36} />}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Meta row */}
          <div style={{
            display: "flex", alignItems: "center", gap: 6, marginBottom: 5,
            flexWrap: "wrap",
          }}>
            <TBadge type={s.type} />
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>📍 {s.region}</span>
            {s.deadline && (
              <span style={{
                marginLeft: "auto", fontSize: 10,
                color: "rgba(239,68,68,0.65)", whiteSpace: "nowrap",
              }}>⏰ {s.deadline}</span>
            )}
          </div>
          {/* Name */}
          <div style={{
            fontFamily: "'Playfair Display', serif", fontSize: 13,
            fontWeight: 700, color: "white", lineHeight: 1.3, marginBottom: 5,
          }}>{s.name}</div>
          {/* Institution + amount */}
          <div style={{
            display: "flex", alignItems: "center",
            justifyContent: "space-between", gap: 8,
          }}>
            <span style={{
              fontSize: 10, color: "rgba(255,255,255,0.3)",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>{s.institution}</span>
            <span style={{
              fontFamily: "'Playfair Display', serif", fontSize: 14,
              fontWeight: 900, color: accent, flexShrink: 0,
            }}>{s.amount}</span>
          </div>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "10px 13px 12px" }}
          onClick={e => e.stopPropagation()}
        >
          {/* Match reason */}
          {s.matchReason && (
            <div style={{
              display: "flex", alignItems: "flex-start", gap: 6,
              padding: "7px 10px", marginBottom: 10,
              borderRadius: 7, background: "rgba(74,222,128,0.06)",
              border: "1px solid rgba(74,222,128,0.15)",
            }}>
              <span style={{ color: "#4ade80", fontSize: 11, marginTop: 1, flexShrink: 0 }}>✦</span>
              <span style={{ fontSize: 11, color: "rgba(74,222,128,0.9)", lineHeight: 1.5 }}>
                {s.matchReason}
              </span>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <a href={s.url} target="_blank" rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              style={{
                padding: "7px 14px", borderRadius: 7,
                background: accent, color: "#0a0f1e",
                fontSize: 12, fontWeight: 700, textDecoration: "none",
                whiteSpace: "nowrap", minHeight: 36,
                display: "flex", alignItems: "center",
              }}>Apply →</a>

            <button onClick={e => { e.stopPropagation(); onSave(s); }} style={{
              padding: "7px 12px", borderRadius: 7,
              background: isSaved ? "rgba(212,175,55,0.12)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${isSaved ? "rgba(212,175,55,0.35)" : "rgba(255,255,255,0.1)"}`,
              color: isSaved ? "#d4af37" : "rgba(255,255,255,0.5)",
              fontSize: 12, fontWeight: 600, cursor: "pointer",
              whiteSpace: "nowrap", minHeight: 36,
            }}>{isSaved ? "★ Saved" : "☆ Save"}</button>

            {isPro
              ? <button onClick={e => { e.stopPropagation(); onEssay(s); }} style={{
                  padding: "7px 12px", borderRadius: 7,
                  background: "rgba(212,175,55,0.08)",
                  border: "1px solid rgba(212,175,55,0.3)",
                  color: "#d4af37", fontSize: 12, fontWeight: 600, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 4, minHeight: 36,
                }}>✍ Essay</button>
              : <button onClick={e => { e.stopPropagation(); onEssay(s); }} style={{
                  padding: "7px 12px", borderRadius: 7,
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.3)", fontSize: 12, fontWeight: 600, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 5, minHeight: 36,
                }}>✍ Essay <ProPill /></button>
            }

            {isPro && (
              <button onClick={e => { e.stopPropagation(); onReminder(s); }} style={{
                padding: "7px 12px", borderRadius: 7,
                background: hasReminder ? "rgba(74,222,128,0.08)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${hasReminder ? "rgba(74,222,128,0.3)" : "rgba(255,255,255,0.1)"}`,
                color: hasReminder ? "#4ade80" : "rgba(255,255,255,0.4)",
                fontSize: 12, fontWeight: 600, cursor: "pointer", minHeight: 36,
              }}>🔔{hasReminder ? " Set" : ""}</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Search Form View ────────────────────────────────────────────────────────────
function SearchFormView({ onSearch, user, onShowAuth }) {
  const [form, setForm] = useState({ studyLevel: "", fieldOfStudy: "", nationality: "", university: "" });
  const [errors, setErrors] = useState({});

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: "" })); };

  const submit = () => {
    if (!user) return onShowAuth();
    const errs = {};
    if (!form.studyLevel) errs.studyLevel = "Required";
    if (!form.fieldOfStudy.trim()) errs.fieldOfStudy = "Required";
    if (!form.nationality.trim()) errs.nationality = "Required";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    onSearch({
      studyLevel: form.studyLevel,
      fieldOfStudy: form.fieldOfStudy,
      nationality: form.nationality,
      studyCountry: form.nationality,
      university: form.university,
    });
  };

  const inp = {
    width: "100%", padding: "11px 14px", borderRadius: 8, boxSizing: "border-box",
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
    color: "white", fontSize: 13, outline: "none", fontFamily: "inherit",
    transition: "border-color 0.2s",
  };
  const lbl = {
    display: "block", fontSize: 11, fontWeight: 700,
    textTransform: "uppercase", letterSpacing: "0.08em",
    color: "rgba(255,255,255,0.4)", marginBottom: 6,
  };

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: "28px 20px 24px" }}>
      <div style={{
        fontSize: 11, fontWeight: 700, textTransform: "uppercase",
        letterSpacing: "0.12em", color: "rgba(255,255,255,0.25)", marginBottom: 24,
      }}>TELL US ABOUT YOURSELF</div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={lbl}>Study Level <span style={{ color: "#d4af37" }}>*</span></label>
          <select value={form.studyLevel} onChange={e => set("studyLevel", e.target.value)}
            style={{ ...inp, appearance: "none" }}
            onFocus={e => e.target.style.borderColor = "rgba(212,175,55,0.5)"}
            onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}>
            <option value="">Select...</option>
            {STUDY_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          {errors.studyLevel && <p style={{ color: "#fca5a5", fontSize: 11, margin: "4px 0 0" }}>{errors.studyLevel}</p>}
        </div>

        <div>
          <label style={lbl}>Field of Study <span style={{ color: "#d4af37" }}>*</span></label>
          <input type="text" placeholder="e.g. Computer Science, Medicine, Law"
            value={form.fieldOfStudy} onChange={e => set("fieldOfStudy", e.target.value)}
            style={inp}
            onFocus={e => e.target.style.borderColor = "rgba(212,175,55,0.5)"}
            onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
            onKeyDown={e => e.key === "Enter" && submit()} />
          {errors.fieldOfStudy && <p style={{ color: "#fca5a5", fontSize: 11, margin: "4px 0 0" }}>{errors.fieldOfStudy}</p>}
        </div>

        <div>
          <label style={lbl}>Nationality <span style={{ color: "#d4af37" }}>*</span></label>
          <input type="text" placeholder="e.g. Australian, Indian, Nigerian"
            value={form.nationality} onChange={e => set("nationality", e.target.value)}
            style={inp}
            onFocus={e => e.target.style.borderColor = "rgba(212,175,55,0.5)"}
            onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
            onKeyDown={e => e.key === "Enter" && submit()} />
          {errors.nationality && <p style={{ color: "#fca5a5", fontSize: 11, margin: "4px 0 0" }}>{errors.nationality}</p>}
        </div>

        <div>
          <label style={lbl}>University</label>
          <input type="text" placeholder="e.g. University of Melbourne, MIT"
            value={form.university} onChange={e => set("university", e.target.value)}
            style={inp}
            onFocus={e => e.target.style.borderColor = "rgba(212,175,55,0.5)"}
            onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
            onKeyDown={e => e.key === "Enter" && submit()} />
        </div>
      </div>

      <button onClick={submit} style={{
        width: "100%", marginTop: 24, padding: "13px",
        borderRadius: 8, border: "none",
        background: "linear-gradient(135deg,#d4af37,#f5d060)",
        color: "#0a0f1e", fontSize: 14, fontWeight: 700, cursor: "pointer",
      }}>Find Scholarships →</button>

      <p style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 10 }}>
        {!user
          ? "Free account required · No credit card needed"
          : user.isPro
          ? "Unlimited searches · All results unlocked"
          : `${Math.max(0, 1 - (user.searchCount || 0))} free search remaining`}
      </p>
    </div>
  );
}

// ─── Searching View ──────────────────────────────────────────────────────────────
function SearchingView({ loadingMsg }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "60px 20px", textAlign: "center",
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 14, marginBottom: 20,
        background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.2)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 20, animation: "spin 3s linear infinite",
      }}>◎</div>
      <h3 style={{
        fontFamily: "'Playfair Display', serif", fontSize: 20,
        fontWeight: 900, color: "white", margin: "0 0 8px",
      }}>Searching…</h3>
      <p style={{ fontSize: 13, color: "#d4af37", margin: 0, minHeight: 20 }}>{loadingMsg}</p>
    </div>
  );
}

// ─── Results View ────────────────────────────────────────────────────────────────
function ResultsView({
  results, totalFound, isPro, expandedCardId, onToggleCard,
  onSave, onEssay, onReminder, savedIds, reminderIds, onUpgrade,
}) {
  const limit = isPro ? PRO_LIMIT : FREE_LIMIT;
  const visibleResults = results.slice(0, limit);
  const extraResults = isPro ? results.slice(limit) : [];
  const hiddenCount = totalFound ? totalFound - limit : Math.max(0, results.length - limit);

  return (
    <div style={{ padding: "12px 14px" }}>
      {visibleResults.map((s, i) => (
        <ResultCard key={i} s={s}
          expanded={expandedCardId === i}
          onToggle={() => onToggleCard(i)}
          isPro={isPro} onSave={onSave} onEssay={onEssay} onReminder={onReminder}
          savedIds={savedIds} reminderIds={reminderIds}
        />
      ))}

      {!isPro && hiddenCount > 0 && (
        <UpgradeNudge hiddenCount={hiddenCount} onUpgrade={onUpgrade} />
      )}

      {extraResults.map((s, i) => (
        <ResultCard key={i + limit} s={s}
          expanded={expandedCardId === i + limit}
          onToggle={() => onToggleCard(i + limit)}
          isPro={isPro} onSave={onSave} onEssay={onEssay} onReminder={onReminder}
          savedIds={savedIds} reminderIds={reminderIds}
        />
      ))}
    </div>
  );
}

// ─── Header ──────────────────────────────────────────────────────────────────────
function Header({ phase, results, totalFound, isPro, searchContext, onHamburger, isMobile, user, onUpgrade }) {
  const isResults = phase === "results";

  return (
    <div style={{
      height: HEADER_H, display: "flex", alignItems: "center",
      padding: "0 16px", flexShrink: 0, gap: 10,
      borderBottom: "1px solid rgba(255,255,255,0.06)",
      background: "#05101e",
    }}>
      {/* Mobile hamburger */}
      {isMobile && (
        <button onClick={onHamburger} style={{
          background: "none", border: "none", color: "rgba(255,255,255,0.6)",
          cursor: "pointer", fontSize: 18, padding: 0,
          minWidth: 36, minHeight: 36,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>☰</button>
      )}

      {/* Mobile: centred logo */}
      {isMobile && (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <KLogo size={20} />
          <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, color: "white", fontSize: 14 }}>
            Kaloma
          </span>
        </div>
      )}

      {/* Desktop: results meta */}
      {!isMobile && isResults && (
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 2 }}>
            Match complete{searchContext ? ` · ${searchContext}` : ""}
          </div>
          <div style={{
            fontFamily: "'Playfair Display', serif", fontSize: 16,
            fontWeight: 900, color: "white", lineHeight: 1,
          }}>{totalFound ?? results.length} results found</div>
        </div>
      )}

      {/* Desktop: search form heading */}
      {!isMobile && !isResults && (
        <div style={{ flex: 1 }}>
          <span style={{
            fontFamily: "'Playfair Display', serif", fontSize: 16,
            fontWeight: 700, color: "white",
          }}>{phase === "searching" ? "Searching…" : "New Search"}</span>
        </div>
      )}

      {/* Right side chips */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: isMobile ? 0 : "auto" }}>
        {isResults && (
          <span style={{
            fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20,
            background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)",
            color: "#4ade80", whiteSpace: "nowrap",
          }}>✓ AI Matched</span>
        )}
        {isResults && isPro && !isMobile && (
          <>
            <button style={{
              padding: "5px 10px", borderRadius: 7,
              background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.25)",
              color: "#d4af37", fontSize: 11, fontWeight: 600, cursor: "pointer",
            }}>✍ Essay</button>
            <button style={{
              padding: "5px 10px", borderRadius: 7,
              background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.25)",
              color: "#d4af37", fontSize: 11, fontWeight: 600, cursor: "pointer",
            }}>✦ Best Match</button>
          </>
        )}
        {isMobile && !user?.isPro && (
          <button onClick={() => onUpgrade("monthly")} style={{
            padding: "5px 10px", borderRadius: 7,
            background: "linear-gradient(135deg,#d4af37,#f5d060)",
            border: "none", color: "#0a0f1e", fontSize: 11, fontWeight: 700, cursor: "pointer",
          }}>Upgrade</button>
        )}
        {isMobile && user?.isPro && (
          <span style={{
            fontSize: 11, fontWeight: 700, padding: "4px 8px", borderRadius: 6,
            background: "rgba(212,175,55,0.12)", border: "1px solid rgba(212,175,55,0.25)",
            color: "#d4af37",
          }}>✦ Pro</span>
        )}
      </div>
    </div>
  );
}

// ─── Bottom Prompt Bar ───────────────────────────────────────────────────────────
function BottomPromptBar({ onNewSearch, isMobile }) {
  const [text, setText] = useState("");

  const submit = () => { onNewSearch(); setText(""); };

  if (isMobile) {
    return (
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        padding: "10px 14px 16px",
        background: "rgba(6,11,24,0.96)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "8px 14px", borderRadius: 14,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}>
          <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 14 }}>◎</span>
          <input type="text" placeholder="New search…"
            value={text} onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === "Enter" && submit()}
            style={{ flex: 1, background: "none", border: "none", outline: "none", color: "white", fontSize: 13 }} />
          <button onClick={submit} style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "linear-gradient(135deg,#d4af37,#f5d060)",
            border: "none", color: "#0a0f1e", fontSize: 15,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>↑</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      padding: "10px 16px 14px",
      background: "#060b18", borderTop: "1px solid rgba(255,255,255,0.06)", flexShrink: 0,
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "10px 16px", borderRadius: 10,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}>
        <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 15, flexShrink: 0 }}>◎</span>
        <input type="text" placeholder="e.g. 'PhD funding in Europe for ML research…'"
          value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === "Enter" && submit()}
          style={{ flex: 1, background: "none", border: "none", outline: "none", color: "white", fontSize: 13 }} />
        <button onClick={submit} style={{
          padding: "7px 16px", borderRadius: 8,
          background: "linear-gradient(135deg,#d4af37,#f5d060)",
          border: "none", color: "#0a0f1e", fontSize: 12, fontWeight: 700,
          cursor: "pointer", flexShrink: 0,
        }}>Search</button>
      </div>
    </div>
  );
}

// ─── KalomaLayout ────────────────────────────────────────────────────────────────
export default function KalomaLayout({
  user, phase, results, totalFound, savedIds, reminderIds,
  recentSearches, reminders, loadingMsg, searchContext,
  onSearch, onSave, onEssay, onReminder, onUpgrade,
  onNewSearch, onShowAuth, onGoProfile, onLogout,
}) {
  const isMobile = useIsMobile();
  const isPro = user?.isPro;
  const [expandedCardId, setExpandedCardId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeRecent, setActiveRecent] = useState(-1);

  useEffect(() => { if (!isMobile) setDrawerOpen(false); }, [isMobile]);
  useEffect(() => { setExpandedCardId(null); }, [phase]);

  const toggleCard = id => setExpandedCardId(prev => prev === id ? null : id);

  const sidebarProps = {
    isPro, user,
    recentSearches: recentSearches || [],
    activeRecent,
    onSelectRecent: i => setActiveRecent(i),
    onNewSearch,
    onUpgrade,
    onGoProfile,
    onLogout,
    reminders: reminders || [],
  };

  return (
    <div style={{
      display: "flex", height: "100vh", overflow: "hidden",
      background: "#060b18", position: "fixed", inset: 0,
    }}>
      {/* Desktop sidebar */}
      {!isMobile && (
        <div style={{
          width: SIDEBAR_W, flexShrink: 0,
          background: "#05101e",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          display: "flex", flexDirection: "column",
        }}>
          <SidebarBody {...sidebarProps} />
        </div>
      )}

      {/* Main column */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, position: "relative" }}>
        <Header
          phase={phase} results={results} totalFound={totalFound}
          isPro={isPro} searchContext={searchContext}
          onHamburger={() => setDrawerOpen(true)}
          isMobile={isMobile} user={user} onUpgrade={onUpgrade}
        />

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: "auto", paddingBottom: isMobile ? 72 : 0 }}>
          {phase === "idle" && (
            <SearchFormView onSearch={onSearch} user={user} onShowAuth={onShowAuth} />
          )}
          {phase === "searching" && (
            <SearchingView loadingMsg={loadingMsg} />
          )}
          {phase === "results" && (
            <ResultsView
              results={results} totalFound={totalFound}
              isPro={isPro} expandedCardId={expandedCardId}
              onToggleCard={toggleCard}
              onSave={onSave} onEssay={onEssay} onReminder={onReminder}
              savedIds={savedIds} reminderIds={reminderIds}
              onUpgrade={onUpgrade}
            />
          )}
        </div>

        <BottomPromptBar onNewSearch={onNewSearch} isMobile={isMobile} />
      </div>

      {/* Mobile drawer */}
      {isMobile && drawerOpen && (
        <>
          <div onClick={() => setDrawerOpen(false)} style={{
            position: "fixed", inset: 0, zIndex: 40,
            background: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(3px)",
          }} />
          <div style={{
            position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 41,
            width: DRAWER_W, background: "#05101e",
            borderRight: "1px solid rgba(255,255,255,0.06)",
            display: "flex", flexDirection: "column",
            animation: "slideInLeft 200ms ease-out",
          }}>
            <SidebarBody {...sidebarProps} mobile={{ onClose: () => setDrawerOpen(false) }} />
          </div>
        </>
      )}
    </div>
  );
}
