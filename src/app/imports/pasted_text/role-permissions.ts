import { useState, useMemo } from "react";

/*
  DELT — Settings & Roles/Permissions
  Full platform admin: General, Integrations, RBAC, Users, Bundles, Audit
  Super Admin sees everything, Agent sees own profile + notifications only
*/

// ─── FONTS ──────────────────────────────────────────────────────
(() => {
  const l = document.createElement("link");
  l.href = "https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=JetBrains+Mono:wght@400;500;600&display=swap";
  l.rel = "stylesheet";
  document.head.appendChild(l);
})();
const mono = "'JetBrains Mono', monospace";
const sans = "'DM Sans', system-ui, sans-serif";

// ─── ROLE DEFINITIONS ───────────────────────────────────────────
const ROLES = [
  { id: "super_admin", name: "Super Admin", description: "Full platform access. Company settings, financials, RBAC, all modules. Reserved for managing partners.", color: "#4945FF", userCount: 2, isSystem: true },
  { id: "admin", name: "Admin", description: "Operational access across all modules. Cannot modify roles, billing, or company settings.", color: "#059669", userCount: 1, isSystem: true },
  { id: "agent", name: "Agent", description: "Portfolio-scoped access. Sees only assigned merchants, leads, and own compensation. Cannot access team financials or platform settings.", color: "#f59e0b", userCount: 4, isSystem: true },
  { id: "viewer", name: "Viewer", description: "Read-only access to assigned modules. Cannot create, edit, or delete records. Useful for investors or advisors.", color: "#6b7280", userCount: 1, isSystem: false },
];

// ─── PERMISSION MODULES ─────────────────────────────────────────
const PERMISSION_MODULES = [
  {
    section: "Pipeline",
    modules: [
      { key: "leads", name: "Leads", actions: ["view", "create", "edit", "delete", "assign", "export"] },
      { key: "underwriting", name: "Underwriting", actions: ["view", "review", "approve", "decline", "assign"] },
      { key: "cost_calculator", name: "Cost Calculator", actions: ["view", "use"] },
      { key: "analysis", name: "Statement Analysis", actions: ["view", "create", "edit", "export"] },
    ],
  },
  {
    section: "Merchants",
    modules: [
      { key: "merchants", name: "All Merchants", actions: ["view", "create", "edit", "delete", "export"] },
      { key: "residuals", name: "Residuals", actions: ["view", "upload", "edit", "verify_ic", "export"] },
      { key: "capital", name: "Capital", actions: ["view", "create", "approve", "fund", "modify_terms", "write_off"] },
      { key: "health", name: "Health & Retention", actions: ["view", "create_action", "resolve"] },
    ],
  },
  {
    section: "Team",
    modules: [
      { key: "agents", name: "Agents", actions: ["view", "create", "edit", "deactivate", "view_all"] },
      { key: "compensation", name: "Compensation", actions: ["view", "edit", "view_all"] },
      { key: "employees", name: "Employees", actions: ["view", "create", "edit", "deactivate"] },
      { key: "payroll", name: "Payroll", actions: ["view", "run", "approve", "export"] },
    ],
  },
  {
    section: "Intelligence",
    modules: [
      { key: "lens_ai", name: "Lens AI", actions: ["view", "configure", "export"] },
      { key: "financials", name: "Financials", actions: ["view", "export", "edit_projections"] },
    ],
  },
  {
    section: "Settings",
    modules: [
      { key: "general", name: "General Settings", actions: ["view", "edit"] },
      { key: "integrations", name: "Integration Health", actions: ["view", "configure", "disconnect"] },
      { key: "roles", name: "Roles & Permissions", actions: ["view", "edit"] },
      { key: "bundles", name: "Bundles", actions: ["view", "create", "edit", "delete"] },
      { key: "billing", name: "Platform Billing", actions: ["view", "manage"] },
    ],
  },
];

const DEFAULT_PERMS = {
  super_admin: "all",
  admin: { denied: ["roles.edit", "billing.manage", "general.edit", "capital.write_off"] },
  agent: { allowed: ["leads.view", "leads.create", "leads.edit", "underwriting.view", "cost_calculator.view", "cost_calculator.use", "analysis.view", "analysis.create", "analysis.export", "merchants.view", "residuals.view", "capital.view", "health.view", "agents.view", "compensation.view", "lens_ai.view"] },
  viewer: { allowed: ["leads.view", "merchants.view", "residuals.view", "capital.view", "health.view", "financials.view", "lens_ai.view"] },
};

// ─── USERS ──────────────────────────────────────────────────────
const USERS = [
  { id: 1, name: "David Hazday", email: "david@deltpay.com", role: "super_admin", avatar: "DH", status: "active", lastActive: "Just now", territories: ["Miami-Dade", "Broward"], portfolioCount: 8 },
  { id: 2, name: "Anshu", email: "anshu@deltpay.com", role: "super_admin", avatar: "AN", status: "active", lastActive: "2 hours ago", territories: [], portfolioCount: 0 },
  { id: 3, name: "Patrick", email: "patrick@deltpay.com", role: "admin", avatar: "PK", status: "active", lastActive: "1 hour ago", territories: [], portfolioCount: 0 },
  { id: 4, name: "Sarah Johnson", email: "sarah@deltpay.com", role: "agent", avatar: "SJ", status: "active", lastActive: "3 hours ago", split: 50, territories: ["Miami-Dade"], portfolioCount: 3, portfolioCap: 25, monthlyVolume: 131900 },
  { id: 5, name: "Michael Chen", email: "michael@deltpay.com", role: "agent", avatar: "MC", status: "active", lastActive: "1 day ago", split: 50, territories: ["Broward", "Palm Beach"], portfolioCount: 3, portfolioCap: 25, monthlyVolume: 187200 },
  { id: 6, name: "James Miller", email: "james@deltpay.com", role: "agent", avatar: "JM", status: "active", lastActive: "5 hours ago", split: 50, territories: ["Miami-Dade"], portfolioCount: 2, portfolioCap: 25, monthlyVolume: 165700 },
  { id: 7, name: "Lyndon", email: "lyndon@deltpay.com", role: "agent", avatar: "LY", status: "active", lastActive: "1 week ago", split: 40, territories: ["Outbound"], portfolioCount: 0, portfolioCap: 15, monthlyVolume: 0 },
  { id: 8, name: "Jason", email: "jason@deltpay.com", role: "viewer", avatar: "JS", status: "active", lastActive: "3 days ago", territories: [], portfolioCount: 0 },
];

// ─── INTEGRATIONS ───────────────────────────────────────────────
const INTEGRATIONS = [
  { id: "north", name: "North (NAB)", category: "Processor", status: "connected", lastSync: "Apr 14, 2026", health: 98, description: "ISO payment processing, residual reports" },
  { id: "ach", name: "ACH.com", category: "Payments", status: "connected", lastSync: "Apr 14, 2026", health: 100, description: "Recurring ACH debits for MCA collections" },
  { id: "plaid", name: "Plaid", category: "Underwriting", status: "connected", lastSync: "Apr 15, 2026", health: 95, description: "Bank verification, transaction data, identity" },
  { id: "sentilink", name: "SentiLink", category: "Underwriting", status: "connected", lastSync: "Apr 12, 2026", health: 100, description: "Synthetic identity fraud detection" },
  { id: "crs", name: "CRS Credit", category: "Underwriting", status: "connected", lastSync: "Apr 10, 2026", health: 92, description: "Commercial credit reporting" },
  { id: "ficoso", name: "FiCoSo", category: "Legal", status: "connected", lastSync: "Apr 14, 2026", health: 100, description: "UCC filing and lien management" },
  { id: "datamerch", name: "DataMerch", category: "Risk", status: "connected", lastSync: "Apr 14, 2026", health: 100, description: "MCA industry default database" },
  { id: "10web", name: "10Web", category: "Websites", status: "connected", lastSync: "Apr 13, 2026", health: 88, description: "AI website builder — white-label merchant sites" },
  { id: "qbo", name: "QuickBooks Online", category: "Accounting", status: "connected", lastSync: "Apr 15, 2026", health: 97, description: "Chart of accounts, MCA journal entries" },
  { id: "ollama", name: "Ollama / Qwen", category: "AI", status: "connected", lastSync: "Apr 15, 2026", health: 100, description: "Local LLM for Lens AI intelligence layer" },
  { id: "stripe", name: "Stripe", category: "Billing", status: "disconnected", lastSync: "—", health: 0, description: "Platform billing and subscription management" },
];

// ─── GENERAL SETTINGS ───────────────────────────────────────────
const GENERAL_SECTIONS = [
  {
    key: "company", title: "Company Profile", icon: "🏢",
    fields: [
      { label: "Company Name", value: "Delt Pay LLC", type: "text" },
      { label: "Legal Entity", value: "Delt Pay LLC", type: "text" },
      { label: "Registered Address", value: "1603 Capitol Ave Ste 415 #644712, Cheyenne, WY", type: "text" },
      { label: "Primary Phone", value: "(305) 799-1018", type: "text" },
      { label: "Primary Email", value: "David@deltpay.com", type: "text" },
      { label: "Website", value: "deltpay.com", type: "text" },
      { label: "Entity Type", value: "LLC — S-Corp Election", type: "text", readonly: true },
    ],
  },
  {
    key: "branding", title: "Brand & Appearance", icon: "🎨",
    fields: [
      { label: "Primary Color", value: "#4945FF", type: "color" },
      { label: "Secondary Color", value: "#041e42", type: "color" },
      { label: "Heading Font", value: "DM Sans", type: "select", options: ["DM Sans", "Inter", "Outfit", "Plus Jakarta Sans"] },
      { label: "Mono Font", value: "JetBrains Mono", type: "select", options: ["JetBrains Mono", "Fira Code", "Source Code Pro"] },
      { label: "White-Label Agent Portal", value: true, type: "toggle" },
    ],
  },
  {
    key: "notifications", title: "Notifications", icon: "🔔",
    fields: [
      { label: "New Lead Alert", value: true, type: "toggle" },
      { label: "Underwriting Status Change", value: true, type: "toggle" },
      { label: "Chargeback Filed (CRITICAL)", value: true, type: "toggle", description: "Notifies both agent AND super admin immediately" },
      { label: "Chargeback Rate Threshold (0.5%)", value: true, type: "toggle" },
      { label: "Interchange Verification Flag", value: true, type: "toggle", description: "Auto-verifies against published April/October schedule" },
      { label: "Merchant Churn Risk", value: true, type: "toggle" },
      { label: "MCA Default Alert", value: true, type: "toggle" },
      { label: "NSF / Slow Pay Alert", value: true, type: "toggle" },
      { label: "Residual Report Uploaded", value: true, type: "toggle" },
      { label: "Daily Collection Summary", value: true, type: "toggle" },
      { label: "Interchange Rate Change (Apr/Oct)", value: true, type: "toggle" },
      { label: "Agent Commission Paid", value: false, type: "toggle" },
      { label: "Notification Channel", value: "Email + SMS + In-App", type: "select", options: ["Email Only", "In-App Only", "Email + In-App", "Email + SMS + In-App"] },
    ],
  },
  {
    key: "processing", title: "Processing Defaults", icon: "💳",
    fields: [
      { label: "Default Program", value: "Cash Discount", type: "select", options: ["Cash Discount", "Flat Rate", "Interchange Plus"] },
      { label: "Default Service Fee (CD)", value: "3.99%", type: "text" },
      { label: "Interchange Schedule", value: "April 2026", type: "text", readonly: true },
      { label: "Next Rate Update", value: "October 2026", type: "text", readonly: true },
      { label: "Auto-Verify Interchange", value: true, type: "toggle" },
      { label: "Margin Floor", value: "0.50%", type: "text" },
      { label: "Agent Pricing Override", value: false, type: "toggle", description: "If off, agents cannot modify matrix-locked rates" },
    ],
  },
  {
    key: "capital", title: "Capital Defaults", icon: "🏦",
    fields: [
      { label: "Cost of Capital", value: "12%", type: "text" },
      { label: "Default Factor Range", value: "1.25x – 1.45x", type: "text" },
      { label: "Max Position Size", value: "$50,000", type: "text" },
      { label: "Max Portfolio Concentration", value: "15%", type: "text" },
      { label: "Auto-Stack Detection", value: true, type: "toggle" },
      { label: "NSF Retry Attempts", value: "3", type: "select", options: ["1", "2", "3", "4", "5"] },
      { label: "Default ACH Schedule", value: "Daily (Mon-Fri)", type: "select", options: ["Daily (Mon-Fri)", "Weekly", "Bi-Weekly"] },
      { label: "Slow Pay Threshold (days)", value: "5", type: "text" },
    ],
  },
  {
    key: "data", title: "Data & Privacy", icon: "🔒",
    fields: [
      { label: "Data Retention Period", value: "7 years", type: "select", options: ["3 years", "5 years", "7 years", "10 years", "Indefinite"] },
      { label: "GLBA Compliance Mode", value: true, type: "toggle" },
      { label: "FCRA Disclosure Enabled", value: true, type: "toggle" },
      { label: "Biometric Data Collection (Plaid)", value: true, type: "toggle" },
      { label: "Auto-Purge Declined Apps", value: "90 days", type: "select", options: ["30 days", "60 days", "90 days", "180 days", "Never"] },
      { label: "Audit Log Retention", value: "Indefinite", type: "select", options: ["1 year", "3 years", "7 years", "Indefinite"] },
      { label: "Two-Factor Authentication", value: "Required for Admin+", type: "select", options: ["Disabled", "Optional", "Required for Admin+", "Required for All"] },
    ],
  },
];

// ─── AUDIT LOG ──────────────────────────────────────────────────
const AUDIT_LOG = [
  { time: "Apr 15, 2:34 PM", user: "David Hazday", action: "Updated processing defaults — margin floor set to 0.50%", module: "Settings" },
  { time: "Apr 15, 1:12 PM", user: "David Hazday", action: "Verified interchange for Sunrise Cafe — flagged Visa Qual +14bps", module: "Residuals" },
  { time: "Apr 14, 4:45 PM", user: "Patrick", action: "Uploaded March 2026 residual report — 8 merchants processed", module: "Residuals" },
  { time: "Apr 14, 11:20 AM", user: "Michael Chen", action: "Created new lead: TechForward Solutions", module: "Pipeline" },
  { time: "Apr 13, 3:15 PM", user: "David Hazday", action: "Approved MCA UW-2026-0145: Urban Wellness Spa — $150K at 1.36x", module: "Capital" },
  { time: "Apr 12, 9:00 AM", user: "Sarah Johnson", action: "Moved Coastal Construction to Bank Verification stage", module: "Pipeline" },
  { time: "Apr 11, 2:30 PM", user: "David Hazday", action: "Changed James Miller commission split from 45% → 50%", module: "Team" },
  { time: "Apr 10, 10:45 AM", user: "David Hazday", action: "Connected CRS Credit integration — health check passed 92%", module: "Settings" },
];

// ─── COMPONENT ──────────────────────────────────────────────────
export default function Settings() {
  const [tab, setTab] = useState("general");
  const [expandedSection, setExpandedSection] = useState("company");
  const [expandedRole, setExpandedRole] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [viewAs, setViewAs] = useState("super_admin");

  const isAgent = viewAs === "agent";
  const tabs = isAgent
    ? [{ key: "general", label: "My Profile", icon: "👤" }, { key: "notifications", label: "Notifications", icon: "🔔" }]
    : [
      { key: "general", label: "General", icon: "⚙" },
      { key: "integrations", label: "Integration Health", icon: "⊞" },
      { key: "roles", label: "Roles & Permissions", icon: "🔐" },
      { key: "users", label: "User Management", icon: "👥" },
      { key: "audit", label: "Audit Log", icon: "📋" },
    ];

  return (
    <div style={S.root}>
      <div style={S.pageHeader}>
        <div>
          <h1 style={S.pageTitle}>Settings</h1>
          <p style={S.pageSub}>{isAgent ? "Manage your profile and preferences" : "Platform configuration, access control, and integrations"}</p>
        </div>
        <div style={S.viewToggle}>
          <button onClick={() => setViewAs("super_admin")} style={{ ...S.viewBtn, ...(viewAs === "super_admin" ? S.viewBtnActive : {}) }}>Super Admin</button>
          <button onClick={() => setViewAs("agent")} style={{ ...S.viewBtn, ...(viewAs === "agent" ? S.viewBtnAgent : {}) }}>Agent View</button>
        </div>
      </div>

      <div style={S.tabBar}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ ...S.tab, ...(tab === t.key ? S.tabActive : {}) }}>
            <span style={{ fontSize: 14 }}>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {/* ═══ GENERAL SETTINGS ═══ */}
      {tab === "general" && !isAgent && (
        <div style={S.content}>
          {GENERAL_SECTIONS.map(section => {
            const open = expandedSection === section.key;
            return (
              <div key={section.key} style={{ ...S.accordion, ...(open ? S.accordionOpen : {}) }}>
                <button onClick={() => setExpandedSection(open ? null : section.key)} style={S.accHeader}>
                  <span style={S.accLeft}><span style={{ fontSize: 18 }}>{section.icon}</span><span style={S.accTitle}>{section.title}</span></span>
                  <span style={{ ...S.chev, transform: open ? "rotate(180deg)" : "rotate(0)" }}>▾</span>
                </button>
                {open && (
                  <div style={S.accBody}>
                    {section.fields.map((f, i) => (
                      <div key={i} style={S.fieldRow}>
                        <div style={S.fieldLeft}>
                          <div style={S.fieldLabel}>{f.label}</div>
                          {f.description && <div style={S.fieldDesc}>{f.description}</div>}
                        </div>
                        <div style={S.fieldRight}>
                          {f.type === "toggle" ? (
                            <div style={{ ...S.toggle, ...(f.value ? S.toggleOn : {}) }}>
                              <div style={{ ...S.toggleDot, ...(f.value ? S.toggleDotOn : {}) }} />
                            </div>
                          ) : f.type === "color" ? (
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <div style={{ width: 28, height: 28, borderRadius: 6, background: f.value, border: "1px solid #e5e7eb" }} />
                              <span style={{ fontFamily: mono, fontSize: 13, color: "#374151" }}>{f.value}</span>
                            </div>
                          ) : f.type === "select" ? (
                            <select style={S.select} defaultValue={f.value}>
                              {f.options.map(o => <option key={o}>{o}</option>)}
                            </select>
                          ) : (
                            <input type="text" defaultValue={f.value} readOnly={f.readonly} style={{ ...S.input, ...(f.readonly ? S.inputRO : {}) }} />
                          )}
                        </div>
                      </div>
                    ))}
                    <div style={S.accFooter}><button style={S.saveBtn}>Save Changes</button></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ AGENT PROFILE ═══ */}
      {tab === "general" && isAgent && (
        <div style={S.content}>
          <div style={S.agentCard}>
            <div style={S.agentCardHeader}>
              <div style={S.agentAvatar}>SJ</div>
              <div>
                <h2 style={S.agentName}>Sarah Johnson</h2>
                <p style={S.agentEmail}>sarah@deltpay.com</p>
                <span style={{ ...S.roleBadge, background: "rgba(245,158,11,0.1)", color: "#f59e0b", borderColor: "rgba(245,158,11,0.3)" }}>Agent</span>
              </div>
            </div>
            <div style={S.agentGrid}>
              {[
                { l: "Portfolio", v: "3 merchants" }, { l: "Monthly Volume", v: "$131,900" },
                { l: "Commission Split", v: "50%" }, { l: "Territories", v: "Miami-Dade" },
                { l: "Portfolio Cap", v: "25 merchants" }, { l: "Status", v: "Active", c: "#059669" },
              ].map((s, i) => (
                <div key={i} style={S.agentStatBox}>
                  <div style={S.agentStatLabel}>{s.l}</div>
                  <div style={{ ...S.agentStatVal, color: s.c || "#111827" }}>{s.v}</div>
                </div>
              ))}
            </div>
            <div style={S.agentNote}>Contact your administrator to update split rate, territory, or portfolio cap.</div>
          </div>
        </div>
      )}

      {/* ═══ INTEGRATIONS ═══ */}
      {tab === "integrations" && (
        <div style={S.content}>
          <div style={S.intGrid}>
            {INTEGRATIONS.map(int => (
              <div key={int.id} style={{ ...S.intCard, ...(int.status === "disconnected" ? S.intCardOff : {}) }}>
                <div style={S.intCardTop}>
                  <div>
                    <div style={S.intName}>{int.name}</div>
                    <span style={S.intCat}>{int.category}</span>
                  </div>
                  <span style={{ ...S.intStatus, color: int.status === "connected" ? "#059669" : "#ef4444" }}>● {int.status === "connected" ? "Connected" : "Disconnected"}</span>
                </div>
                <p style={S.intDesc}>{int.description}</p>
                {int.status === "connected" && (
                  <div style={S.intMeta}>
                    <div style={S.intHealthWrap}>
                      <div style={S.intHealthTrack}><div style={{ ...S.intHealthFill, width: `${int.health}%`, background: int.health >= 95 ? "#059669" : int.health >= 80 ? "#f59e0b" : "#ef4444" }} /></div>
                      <span style={{ fontSize: 11, fontFamily: mono, fontWeight: 600, color: "#374151" }}>{int.health}%</span>
                    </div>
                    <span style={{ fontSize: 11, color: "#9ca3af" }}>Synced: {int.lastSync}</span>
                  </div>
                )}
                <div style={S.intActions}>
                  {int.status === "connected"
                    ? <><button style={S.intBtn}>Configure</button><button style={S.intBtnDanger}>Disconnect</button></>
                    : <button style={S.intBtnConnect}>Connect</button>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ ROLES & PERMISSIONS ═══ */}
      {tab === "roles" && (
        <div style={S.content}>
          <div style={S.sectionRow}>
            <div><h2 style={S.sectionTitle}>Roles</h2><p style={S.sectionSub}>System roles define baseline access. Permissions enforced across all modules.</p></div>
            <button style={S.primaryBtn}>+ Custom Role</button>
          </div>
          <div style={S.rolesStack}>
            {ROLES.map(role => {
              const open = expandedRole === role.id;
              return (
                <div key={role.id} style={{ ...S.roleCard, borderColor: open ? role.color : "#e5e7eb" }}>
                  <button onClick={() => setExpandedRole(open ? null : role.id)} style={S.roleHeader}>
                    <div style={S.roleLeft}>
                      <div style={{ ...S.roleIcon, background: `${role.color}15`, color: role.color }}>{role.name.charAt(0)}</div>
                      <div>
                        <div style={S.roleName}>{role.name}</div>
                        <div style={S.roleDesc}>{role.description}</div>
                      </div>
                    </div>
                    <div style={S.roleRight}>
                      <span style={S.roleCount}>{role.userCount} user{role.userCount !== 1 ? "s" : ""}</span>
                      {role.isSystem && <span style={S.sysBadge}>System</span>}
                      <span style={{ ...S.chev, transform: open ? "rotate(180deg)" : "rotate(0)" }}>▾</span>
                    </div>
                  </button>
                  {open && (
                    <div style={S.permBody}>
                      {PERMISSION_MODULES.map(section => (
                        <div key={section.section} style={S.permSection}>
                          <div style={S.permSectionTitle}>{section.section}</div>
                          {section.modules.map(mod => {
                            const isFull = role.id === "super_admin";
                            const denied = DEFAULT_PERMS[role.id]?.denied || [];
                            const allowed = DEFAULT_PERMS[role.id]?.allowed || [];
                            return (
                              <div key={mod.key} style={S.permRow}>
                                <div style={S.permModName}>{mod.name}</div>
                                <div style={S.permPills}>
                                  {mod.actions.map(action => {
                                    const pk = `${mod.key}.${action}`;
                                    let ok;
                                    if (isFull) ok = true;
                                    else if (denied.length) ok = !denied.includes(pk);
                                    else ok = allowed.includes(pk);
                                    return <span key={action} style={{ ...S.pill, ...(ok ? S.pillOk : S.pillNo) }}>{action}</span>;
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ USER MANAGEMENT ═══ */}
      {tab === "users" && (
        <div style={S.content}>
          <div style={S.sectionRow}>
            <div><h2 style={S.sectionTitle}>Users & Access</h2><p style={S.sectionSub}>{USERS.length} users across {ROLES.length} roles</p></div>
            <button style={S.primaryBtn}>+ Invite User</button>
          </div>
          <div style={S.tableWrap}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>USER</th><th style={S.th}>ROLE</th><th style={S.th}>STATUS</th>
                  <th style={S.th}>TERRITORIES</th><th style={S.th}>PORTFOLIO</th><th style={S.th}>LAST ACTIVE</th><th style={S.th}></th>
                </tr>
              </thead>
              <tbody>
                {USERS.map(user => {
                  const role = ROLES.find(r => r.id === user.role);
                  const sel = selectedUser === user.id;
                  return [
                    <tr key={user.id} style={{ ...S.tr, background: sel ? "#f9fafb" : "#fff", cursor: "pointer" }} onClick={() => setSelectedUser(sel ? null : user.id)}>
                      <td style={S.td}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ ...S.avatar, background: `${role.color}12`, color: role.color }}>{user.avatar}</div>
                          <div><div style={{ fontSize: 13, fontWeight: 600 }}>{user.name}</div><div style={{ fontSize: 11, color: "#9ca3af" }}>{user.email}</div></div>
                        </div>
                      </td>
                      <td style={S.td}><span style={{ ...S.roleBadge, background: `${role.color}12`, color: role.color, borderColor: `${role.color}30` }}>{role.name}</span></td>
                      <td style={S.td}><span style={{ ...S.statusDot, background: user.status === "active" ? "#059669" : "#ef4444" }} />{user.status}</td>
                      <td style={{ ...S.td, fontFamily: mono, fontSize: 12 }}>{user.territories?.join(", ") || "—"}</td>
                      <td style={{ ...S.td, fontFamily: mono }}>{user.portfolioCount || "—"}</td>
                      <td style={{ ...S.td, fontSize: 12, color: "#6b7280" }}>{user.lastActive}</td>
                      <td style={S.td}><span style={{ fontSize: 12, color: "#9ca3af" }}>{sel ? "▴" : "▾"}</span></td>
                    </tr>,
                    sel && (
                      <tr key={`${user.id}-detail`}>
                        <td colSpan={7} style={{ padding: 0, background: "#f9fafb" }}>
                          <div style={S.userDetail}>
                            <div style={S.detailGrid}>
                              <div>
                                <h4 style={S.detailH}>Access & Role</h4>
                                <DRow l="Role" v={role.name} />
                                <DRow l="Two-Factor" v="Enabled" c="#059669" />
                                <DRow l="API Access" v={user.role === "super_admin" ? "Full" : "None"} />
                              </div>
                              {user.role === "agent" && (
                                <div>
                                  <h4 style={S.detailH}>Agent Configuration</h4>
                                  <DRow l="Commission Split" v={`${user.split}%`} c="#4945FF" bold />
                                  <DRow l="Portfolio Cap" v={`${user.portfolioCap} merchants`} />
                                  <DRow l="Monthly Volume" v={user.monthlyVolume ? `$${user.monthlyVolume.toLocaleString()}` : "—"} />
                                  <DRow l="Territories" v={user.territories.join(", ")} />
                                  <DRow l="Can Override Pricing" v="No" c="#ef4444" />
                                  <DRow l="Capital Referrals" v="Fundomate Only" />
                                </div>
                              )}
                              <div>
                                <h4 style={S.detailH}>Actions</h4>
                                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                  <button style={S.actionBtn}>Edit Profile</button>
                                  <button style={S.actionBtn}>Change Role</button>
                                  {user.role === "agent" && <button style={S.actionBtn}>Edit Split</button>}
                                  {user.role === "agent" && <button style={S.actionBtn}>Reassign Portfolio</button>}
                                  <button style={S.actionBtn}>Reset Password</button>
                                  <button style={S.actionBtnDanger}>Deactivate</button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ),
                  ];
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ AUDIT LOG ═══ */}
      {tab === "audit" && (
        <div style={S.content}>
          <h2 style={S.sectionTitle}>Audit Log</h2>
          <p style={{ ...S.sectionSub, marginBottom: 16 }}>All administrative actions logged with user, timestamp, and IP.</p>
          <div style={S.auditWrap}>
            {AUDIT_LOG.map((log, i) => (
              <div key={i} style={S.auditRow}>
                <div style={S.auditTime}>{log.time}</div>
                <div style={S.auditBody}><strong>{log.user}</strong> {log.action}</div>
                <span style={S.auditMod}>{log.module}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── HELPERS ────────────────────────────────────────────────────
function DRow({ l, v, c, bold }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 13 }}>
      <span style={{ color: "#6b7280" }}>{l}</span>
      <span style={{ fontWeight: bold ? 700 : 500, fontFamily: mono, fontSize: 12, color: c || "#111827" }}>{v}</span>
    </div>
  );
}

// ─── STYLES ─────────────────────────────────────────────────────
const S = {
  root: { fontFamily: sans, background: "#fff", color: "#111827", minHeight: "100vh", padding: "24px 32px", maxWidth: 1280, margin: "0 auto" },

  pageHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 },
  pageTitle: { fontSize: 28, fontWeight: 700, margin: 0 },
  pageSub: { fontSize: 14, color: "#6b7280", marginTop: 4 },
  viewToggle: { display: "flex", background: "#f3f4f6", borderRadius: 10, padding: 3 },
  viewBtn: { padding: "7px 16px", borderRadius: 8, border: "none", background: "transparent", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: sans, color: "#6b7280" },
  viewBtnActive: { background: "#4945FF", color: "#fff" },
  viewBtnAgent: { background: "#f59e0b", color: "#fff" },

  tabBar: { display: "flex", gap: 0, borderBottom: "1px solid #e5e7eb", marginBottom: 28 },
  tab: { display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", fontSize: 13, fontWeight: 500, color: "#6b7280", border: "none", borderBottom: "2px solid transparent", background: "none", cursor: "pointer", fontFamily: sans },
  tabActive: { color: "#4945FF", borderBottomColor: "#4945FF", fontWeight: 600 },

  content: {},
  sectionRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 700, margin: 0 },
  sectionSub: { fontSize: 13, color: "#9ca3af", marginTop: 2 },
  primaryBtn: { background: "#4945FF", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: sans },

  // Accordion
  accordion: { border: "1px solid #e5e7eb", borderRadius: 12, marginBottom: 8, overflow: "hidden" },
  accordionOpen: { borderColor: "#4945FF" },
  accHeader: { width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", background: "#fff", border: "none", cursor: "pointer", fontFamily: sans },
  accLeft: { display: "flex", alignItems: "center", gap: 12 },
  accTitle: { fontSize: 15, fontWeight: 600, color: "#111827" },
  chev: { fontSize: 14, color: "#9ca3af", transition: "transform 0.2s" },
  accBody: { padding: "0 20px 20px" },
  accFooter: { display: "flex", justifyContent: "flex-end", paddingTop: 16, marginTop: 8, borderTop: "1px solid #f3f4f6" },
  saveBtn: { background: "#4945FF", color: "#fff", border: "none", padding: "10px 24px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: sans },

  fieldRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px solid #f3f4f6" },
  fieldLeft: { flex: 1 },
  fieldLabel: { fontSize: 13, fontWeight: 500, color: "#374151" },
  fieldDesc: { fontSize: 11, color: "#9ca3af", marginTop: 2 },
  fieldRight: { width: 280, display: "flex", justifyContent: "flex-end" },
  input: { width: "100%", padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13, fontFamily: mono, color: "#111827", outline: "none" },
  inputRO: { background: "#f9fafb", color: "#6b7280" },
  select: { width: "100%", padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13, fontFamily: sans, color: "#111827", outline: "none", cursor: "pointer" },
  toggle: { width: 44, height: 24, borderRadius: 12, background: "#e5e7eb", position: "relative", cursor: "pointer", transition: "background 0.2s" },
  toggleOn: { background: "#4945FF" },
  toggleDot: { width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: 3, transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.15)" },
  toggleDotOn: { left: 23 },

  // Integrations
  intGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 12 },
  intCard: { border: "1px solid #e5e7eb", borderRadius: 12, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 10 },
  intCardOff: { opacity: 0.5, borderStyle: "dashed" },
  intCardTop: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  intName: { fontSize: 14, fontWeight: 600 },
  intCat: { fontSize: 11, color: "#9ca3af", fontWeight: 500 },
  intStatus: { fontSize: 11, fontWeight: 600 },
  intDesc: { fontSize: 12, color: "#6b7280", lineHeight: 1.4, margin: 0 },
  intMeta: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  intHealthWrap: { display: "flex", alignItems: "center", gap: 8, flex: 1 },
  intHealthTrack: { flex: 1, height: 5, background: "#f3f4f6", borderRadius: 3, overflow: "hidden" },
  intHealthFill: { height: "100%", borderRadius: 3 },
  intActions: { display: "flex", gap: 8, marginTop: 4 },
  intBtn: { fontSize: 12, fontWeight: 500, color: "#4945FF", background: "rgba(73,69,255,0.06)", border: "1px solid rgba(73,69,255,0.15)", padding: "5px 12px", borderRadius: 6, cursor: "pointer", fontFamily: sans },
  intBtnDanger: { fontSize: 12, fontWeight: 500, color: "#ef4444", background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.15)", padding: "5px 12px", borderRadius: 6, cursor: "pointer", fontFamily: sans },
  intBtnConnect: { fontSize: 12, fontWeight: 600, color: "#fff", background: "#4945FF", border: "none", padding: "6px 16px", borderRadius: 6, cursor: "pointer", fontFamily: sans },

  // Roles
  rolesStack: { display: "flex", flexDirection: "column", gap: 10 },
  roleCard: { border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden", transition: "border-color 0.15s" },
  roleHeader: { width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", background: "#fff", border: "none", cursor: "pointer", fontFamily: sans, textAlign: "left" },
  roleLeft: { display: "flex", alignItems: "center", gap: 14 },
  roleIcon: { width: 40, height: 40, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, fontFamily: mono },
  roleName: { fontSize: 15, fontWeight: 700, color: "#111827" },
  roleDesc: { fontSize: 12, color: "#6b7280", marginTop: 2, maxWidth: 500 },
  roleRight: { display: "flex", alignItems: "center", gap: 12 },
  roleCount: { fontSize: 12, fontWeight: 500, color: "#6b7280", fontFamily: mono },
  sysBadge: { fontSize: 10, fontWeight: 600, color: "#4945FF", background: "rgba(73,69,255,0.08)", padding: "2px 8px", borderRadius: 4 },
  roleBadge: { fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 6, border: "1px solid", display: "inline-block" },

  permBody: { padding: "0 20px 20px", borderTop: "1px solid #f3f4f6" },
  permSection: { marginTop: 14 },
  permSectionTitle: { fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#9ca3af", marginBottom: 8, paddingBottom: 6, borderBottom: "1px solid #f3f4f6" },
  permRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0" },
  permModName: { fontSize: 13, fontWeight: 500, color: "#374151", minWidth: 160 },
  permPills: { display: "flex", gap: 4, flexWrap: "wrap" },
  pill: { fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 4, textTransform: "uppercase", letterSpacing: "0.03em" },
  pillOk: { color: "#059669", background: "rgba(5,150,105,0.08)" },
  pillNo: { color: "#d1d5db", background: "#f9fafb", textDecoration: "line-through" },

  // Users
  tableWrap: { border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "#6b7280", padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #e5e7eb", background: "#f9fafb" },
  tr: { borderBottom: "1px solid #f3f4f6" },
  td: { fontSize: 13, padding: "14px 16px", color: "#374151" },
  avatar: { width: 34, height: 34, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, fontFamily: mono },
  statusDot: { width: 7, height: 7, borderRadius: "50%", display: "inline-block", marginRight: 6 },
  userDetail: { padding: "20px 24px" },
  detailGrid: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24 },
  detailH: { fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#6b7280", margin: "0 0 12px", paddingBottom: 8, borderBottom: "1px solid #e5e7eb" },
  actionBtn: { background: "#fff", border: "1px solid #e5e7eb", color: "#374151", fontSize: 12, fontWeight: 500, padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontFamily: sans, textAlign: "left" },
  actionBtnDanger: { background: "#fff", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", fontSize: 12, fontWeight: 500, padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontFamily: sans, textAlign: "left" },

  // Agent profile
  agentCard: { border: "1px solid #e5e7eb", borderRadius: 12, padding: "28px 32px" },
  agentCardHeader: { display: "flex", alignItems: "center", gap: 16, marginBottom: 24, paddingBottom: 20, borderBottom: "1px solid #f3f4f6" },
  agentAvatar: { width: 56, height: 56, borderRadius: 14, background: "rgba(245,158,11,0.12)", color: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, fontFamily: mono },
  agentName: { fontSize: 22, fontWeight: 700, margin: 0 },
  agentEmail: { fontSize: 13, color: "#6b7280", marginTop: 2, marginBottom: 8 },
  agentGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 },
  agentStatBox: { background: "#f9fafb", borderRadius: 10, padding: "14px 18px" },
  agentStatLabel: { fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "#9ca3af", marginBottom: 4 },
  agentStatVal: { fontSize: 16, fontWeight: 700, fontFamily: mono },
  agentNote: { marginTop: 20, padding: "12px 16px", background: "rgba(73,69,255,0.04)", border: "1px solid rgba(73,69,255,0.1)", borderRadius: 8, fontSize: 12, color: "#6b7280" },

  // Audit
  auditWrap: { border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" },
  auditRow: { display: "flex", alignItems: "center", gap: 16, padding: "14px 20px", borderBottom: "1px solid #f3f4f6" },
  auditTime: { fontSize: 12, fontFamily: mono, color: "#9ca3af", minWidth: 140, flexShrink: 0 },
  auditBody: { flex: 1, fontSize: 13, color: "#374151" },
  auditMod: { fontSize: 11, fontWeight: 500, color: "#4945FF", background: "rgba(73,69,255,0.06)", padding: "2px 10px", borderRadius: 4, flexShrink: 0 },
};