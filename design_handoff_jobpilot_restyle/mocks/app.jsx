const { useState } = React;

const NAV = ["Dashboard", "Jobs", "Applications", "Resume", "Career Profile", "Analytics", "Settings"];

const DIMENSIONS = [
  { label: "Required skills", value: 96 },
  { label: "Relevant experience", value: 92 },
  { label: "Preferred skills", value: 88 },
  { label: "Seniority", value: 95 },
  { label: "Industry / domain", value: 90 },
  { label: "Evidence strength", value: 97 },
];

const MATCHES = {
  strong: [
    { req: "Workflow automation at enterprise scale", why: "Led a company-wide Power Automate rollout replacing 40+ manual processes.", backed: "Power Automate rollout · verified" },
    { req: "API integration across internal systems", why: "Built and maintained REST integrations between the ERP and three internal tools.", backed: "API integration work · verified" },
  ],
  partial: [
    { req: "Enterprise software implementation", why: "Implemented one enterprise platform end-to-end; the role expects several.", backed: "ERP implementation · verified" },
  ],
  missing: [
    { req: "AWS production experience", why: "No production AWS work recorded in your Career Profile.", backed: null },
  ],
};

const TOP_JOBS = [
  { title: "AI Automation Engineer", company: "Acme Corp", location: "Remote", score: 94, rec: "apply" },
  { title: "Automation Platform Engineer", company: "Northwind Utilities", location: "Remote · US", score: 88, rec: "apply_stretch" },
  { title: "Integration Engineer", company: "Tenline Software", location: "Hybrid · Austin, TX", score: 72, rec: "maybe" },
];

const REC = {
  apply: { label: "Apply", cls: "solid" },
  apply_stretch: { label: "Apply — Stretch", cls: "outline" },
  maybe: { label: "Maybe", cls: "outline" },
  skip: { label: "Skip", cls: "muted" },
};

const RESUME = {
  summary: "Automation engineer with 6 years building workflow automation and system integrations across enterprise software teams.",
  skills: ["Power Automate", "API integration", "Workflow automation", "Enterprise software implementation", "Python", "REST"],
  experience: [
    { org: "Senior Automation Engineer · Meridian Systems · 2021–present", bullets: [
      { text: "Led a company-wide Power Automate rollout replacing 40+ manual processes.", verified: true, evidence: "Evidence: Power Automate rollout — cut invoice handling time 62%, verified against project records." },
      { text: "Built REST integrations connecting the ERP to three internal tools.", verified: true, evidence: "Evidence: API integration work — 4 integrations shipped, verified against commit history." },
      { text: "Owned AWS production deployment pipeline.", verified: false, evidence: "No AWS production evidence recorded. This claim can't be traced to a Career Profile entry — edit or remove it before finalizing." },
    ]},
    { org: "Automation Analyst · Beacon Corp · 2019–2021", bullets: [
      { text: "Implemented an enterprise ERP platform end-to-end for a 200-person org.", verified: true, evidence: "Evidence: ERP implementation — full rollout over 8 months, verified against reference letter." },
      { text: "Automated monthly reporting with Python, saving ~15 hours/month.", verified: true, evidence: "Evidence: reporting automation — verified against saved scripts and manager confirmation." },
    ]},
  ],
};

function Sidebar({ active, go }) {
  return (
    <aside className="side">
      <div className="brand"><img src="../assets/logo.png" alt="jobpilot" /></div>
      <nav className="nav">
        {NAV.map((n) => (
          <span key={n} className={"navitem" + (active === n || (active === "JobDetail" && n === "Jobs") ? " active" : "")} onClick={() => go(n)}>{n}</span>
        ))}
      </nav>
      <div className="side-foot">
        <div className="email">jordan.reyes@gmail.com</div>
        <button className="btn secondary" style={{ marginTop: 8, width: "100%", height: 30 }}>Sign out</button>
      </div>
    </aside>
  );
}

function Pill({ cls, marker, children }) {
  return (
    <span className={"pill " + cls}>
      {marker === "verified" && <span className="marker-f" style={{ background: cls === "solid" || cls === "ink" ? "currentColor" : "var(--graphite)" }} />}
      {marker === "unverified" && <span className="marker-h" style={{ borderColor: cls === "solid" || cls === "ink" ? "currentColor" : "var(--graphite)" }} />}
      {children}
    </span>
  );
}

function Dashboard({ go }) {
  const counts = [
    { n: 12, label: "New opportunities" },
    { n: 3, label: "Strong matches" },
    { n: 2, label: "Ready to apply" },
    { n: 5, label: "Applied" },
    { n: 1, label: "Interviews" },
  ];
  return (
    <div>
      <h1 className="page">Dashboard</h1>
      <p className="sub">A live snapshot of your job search.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginTop: 28 }}>
        {counts.map((c) => (
          <div key={c.label} className="panel" style={{ padding: "18px 16px" }}>
            <div className="mono" style={{ fontSize: 32, fontWeight: 500, lineHeight: 1 }}>{c.n}</div>
            <div style={{ fontSize: 13, color: "var(--slate)", marginTop: 8 }}>{c.label}</div>
          </div>
        ))}
      </div>
      <h2 style={{ fontSize: 16, fontWeight: 500, margin: "40px 0 14px" }}>Top opportunities</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {TOP_JOBS.map((j, i) => (
          <div key={i} className="panel" style={{ padding: "16px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: i === 0 ? "pointer" : "default" }} onClick={() => i === 0 && go("JobDetail")}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 500 }}>{j.title}</div>
              <div style={{ fontSize: 13.5, color: "var(--slate)", marginTop: 3 }}>{j.company} · {j.location}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <Pill cls={REC[j.rec].cls}>{REC[j.rec].label}</Pill>
              <span className="mono" style={{ fontSize: 28, fontWeight: 500 }}>{j.score}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const JOBS = [
  { title: "FinTech Integration Engineer", company: "Successions", location: "US", salary: "$10 – $500,000", type: "Onsite", score: 81 },
  { title: "Workflow Builder", company: "Nscale", location: "Seattle, WA", salary: "$180,000 – $250,000", type: "Remote", score: 76 },
  { title: "AI Automation Engineer", company: "Acme Corp", location: "Remote", salary: "$130,000 – $160,000", type: "Remote", score: 94 },
];

function Jobs({ go }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24 }}>
        <div>
          <h1 className="page">Jobs</h1>
          <p className="sub">Paste a job description to extract structured fields.</p>
        </div>
        <div style={{ display: "flex", gap: 10, flex: "0 0 auto" }}>
          <button className="btn secondary">Discover jobs</button>
          <button className="btn primary">Analyze a job</button>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 28 }}>
        {JOBS.map((j, i) => (
          <div key={i} className="panel" style={{ padding: "16px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, cursor: "pointer" }} onClick={() => go("JobDetail")}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 500 }}>{j.title} <span style={{ color: "var(--slate)", fontWeight: 400 }}>· {j.company}</span></div>
              <div style={{ fontSize: 13.5, color: "var(--slate)", marginTop: 3 }}>{j.location} · <span className="mono">{j.salary}</span></div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16, flex: "0 0 auto" }}>
              <Pill cls="outline">{j.type}</Pill>
              <span className="mono" style={{ fontSize: 28, fontWeight: 500, minWidth: 40, textAlign: "right" }}>{j.score}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MatchGroup({ title, items }) {
  if (!items.length) return null;
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>{title}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((m, i) => (
          <div key={i} className="panel" style={{ padding: "12px 14px" }}>
            <div style={{ fontSize: 14, fontWeight: 500 }}>{m.req}</div>
            <div style={{ fontSize: 13.5, color: "var(--slate)", marginTop: 4, lineHeight: 1.5 }}>{m.why}</div>
            {m.backed && <div style={{ fontSize: 12, color: "var(--slate)", marginTop: 6, display: "flex", alignItems: "center", gap: 6 }}><span className="marker-f" style={{ width: 7, height: 7 }} />Backed by: {m.backed.replace(" · verified", "")}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

function JobDetail({ go }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button className="disclose" style={{ marginBottom: 18 }} onClick={() => go("Jobs")}>← Back to jobs</button>
      <h1 className="page">AI Automation Engineer</h1>
      <p className="sub">Acme Corp · Remote · <span className="mono">$130k–$160k</span></p>

      <div className="panel" style={{ padding: 24, marginTop: 28 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24 }}>
          <div style={{ maxWidth: "60ch" }}>
            <div style={{ fontSize: 16, fontWeight: 500 }}>Match</div>
            <p style={{ fontSize: 14.5, color: "var(--graphite)", lineHeight: 1.55, margin: "8px 0 0" }}>
              Strong fit on workflow automation and API integration. One gap: no AWS production experience.
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, flex: "0 0 auto" }}>
            <div style={{ textAlign: "right" }}>
              <div className="mono" style={{ fontSize: 40, fontWeight: 500, lineHeight: 1 }}>94<span style={{ fontSize: 20, color: "var(--slate)" }}>%</span></div>
              <div style={{ fontSize: 12, color: "var(--slate)", marginTop: 4 }}>overall (weighted)</div>
            </div>
            <Pill cls="solid">Apply</Pill>
          </div>
        </div>

        <div style={{ marginTop: 20, display: "flex", gap: 12 }}>
          <button className="btn primary" onClick={() => go("Resume")}>Generate resume</button>
          <button className="btn secondary">Re-analyze match</button>
        </div>

        <hr className="hr" style={{ margin: "20px 0" }} />
        <button className="disclose" onClick={() => setOpen(!open)}>{open ? "Hide breakdown" : "View breakdown"}</button>

        {open && (
          <div style={{ marginTop: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Breakdown</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", columnGap: 32 }}>
              {DIMENSIONS.map((d) => (
                <div key={d.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "9px 0", borderBottom: "1px solid var(--hairline)" }}>
                  <span style={{ fontSize: 13.5, color: "var(--slate)" }}>{d.label}</span>
                  <span className="mono" style={{ fontSize: 14, fontWeight: 500 }}>{d.value}%</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 24 }}>
              <MatchGroup title="Strong" items={MATCHES.strong} />
              <MatchGroup title="Partial" items={MATCHES.partial} />
              <MatchGroup title="Missing" items={MATCHES.missing} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ResumeReview() {
  const flat = RESUME.experience.flatMap((g) => g.bullets);
  const initial = flat.map((b) => b.verified);
  const [checks, setChecks] = useState(initial);
  const [openIdx, setOpenIdx] = useState(null);
  let idx = -1;
  const total = flat.length;
  const verifiedCount = checks.filter(Boolean).length;
  const allVerified = verifiedCount === total;

  return (
    <div>
      <h1 className="page">Resume review</h1>
      <p className="sub">Truth Guard · every claim traces to real evidence before you finalize.</p>

      <div className="panel" style={{ padding: "14px 18px", marginTop: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 14, color: "var(--slate)" }}>
          <span className="mono" style={{ color: "var(--graphite)", fontWeight: 500 }}>{verifiedCount}</span> of <span className="mono" style={{ color: "var(--graphite)", fontWeight: 500 }}>{total}</span> claims verified
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {!allVerified && <span style={{ fontSize: 13, color: "var(--slate)" }}>Finalize is blocked until every claim is checked.</span>}
          <button className="btn primary" disabled={!allVerified}>Finalize</button>
        </div>
      </div>

      <div className="panel" style={{ padding: 28, marginTop: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--slate)", marginBottom: 6 }}>Summary</div>
        <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.6, maxWidth: "72ch" }}>{RESUME.summary}</p>

        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--slate)", margin: "24px 0 8px" }}>Skills</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {RESUME.skills.map((s) => <Pill key={s} cls="outline">{s}</Pill>)}
        </div>

        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--slate)", margin: "24px 0 8px" }}>Experience</div>
        {RESUME.experience.map((g, gi) => (
          <div key={gi} style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 8 }}>{g.org}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {g.bullets.map((b) => {
                idx += 1;
                const i = idx;
                const checked = checks[i];
                return (
                  <div key={i} style={{ borderBottom: "1px solid var(--hairline)", padding: "12px 0" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                      <span className={checked ? "marker-f" : "marker-h"} style={{ marginTop: 6 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14.5, lineHeight: 1.5, color: checked ? "var(--graphite)" : "var(--slate)" }}>{b.text}</div>
                        <div style={{ display: "flex", gap: 16, marginTop: 8, alignItems: "center" }}>
                          <button className="disclose" style={{ fontSize: 13 }} onClick={() => setOpenIdx(openIdx === i ? null : i)}>
                            {openIdx === i ? "Hide evidence" : "Why is this here?"}
                          </button>
                          <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: "var(--slate)", cursor: "pointer" }}>
                            <span onClick={() => setChecks(checks.map((c, k) => k === i ? !c : c))} style={{ display: "inline-flex", width: 16, height: 16, borderRadius: 4, border: "1px solid " + (checked ? "var(--cobalt)" : "var(--hairline)"), background: checked ? "var(--cobalt)" : "var(--white)", alignItems: "center", justifyContent: "center" }}>
                              {checked && <svg width="10" height="10" viewBox="0 0 12 12"><path d="M2.5 6.2 5 8.6 9.5 3.5" stroke="#fff" strokeWidth="1.7" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                            </span>
                            I've verified this claim
                          </label>
                        </div>
                        {openIdx === i && (
                          <div className="panel" style={{ background: "var(--paper)", padding: "12px 14px", marginTop: 10, fontSize: 13.5, color: "var(--graphite)", lineHeight: 1.55, maxWidth: "72ch" }}>
                            {b.evidence}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function App() {
  const initialRoute = new URLSearchParams(location.search).get("screen") || "Dashboard";
  const [route, setRoute] = useState(initialRoute);
  const go = (r) => setRoute(r);
  let screen;
  if (route === "Dashboard") screen = <Dashboard go={go} />;
  else if (route === "Jobs") screen = <Jobs go={go} />;
  else if (route === "JobDetail") screen = <JobDetail go={go} />;
  else if (route === "Resume") screen = <ResumeReview />;
  else screen = <Dashboard go={go} />;
  return (
    <div className="app">
      <Sidebar active={route} go={go} />
      <main className="main">{screen}</main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
