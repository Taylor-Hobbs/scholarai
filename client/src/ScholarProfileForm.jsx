import { useState } from "react";

export const STEPS = [
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

export function ScholarProfileForm({ existing, onSubmit, onCancel, loading }) {
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
