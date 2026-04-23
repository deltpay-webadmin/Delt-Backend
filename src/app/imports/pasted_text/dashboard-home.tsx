import { useState, useEffect, useMemo } from "react";

/*
  DELT COMMAND CENTER — Dashboard Home
  The nerve center. Everything at a glance.
  Notifications are front and center, not buried.
*/

// ─── FONTS ──────────────────────────────────────────────────────
(() => {
  const l = document.createElement("link");
  l.href = "https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&family=JetBrains+Mono:wght@400;500;600;700&display=swap";
  l.rel = "stylesheet";
  document.head.appendChild(l);
})();
const mono = "'JetBrains Mono', monospace";
const sans = "'DM Sans', system-ui, sans-serif";

// ─── ALERTS / NOTIFICATIONS ─────────────────────────────────────
const ALERTS = [
  { id: 1, type: "chargeback", severity: "critical", time: "12m ago", title: "Chargeback — Bella Vista Restaurant", body: "Visa $487.00 · Reason 13.1 (Merch Not Received) · Deadline Apr 25", merchant: "Bella Vista Restaurant", agent: "Michael Chen", actions: ["Respond", "View"] },
  { id: 2, type: "chargeback", severity: "critical", time: "2h ago", title: "Chargeback — Metro Diner Group", body: "MC $215.30 · Reason 4837 (No Auth) · Deadline Apr 22", merchant: "Metro Diner Group", agent: "James Miller", actions: ["Respond", "View"] },
  { id: 3, type: "interchange", severity: "warning", time: "3h ago", title: "IC Padding — Sunrise Cafe", body: "Visa Qual +14bps ($19.95/mo · $239/yr est. overcharge)", merchant: "Sunrise Cafe & Bakery", agent: "Sarah Johnson", actions: ["Verify", "Flag North"] },
  { id: 4, type: "chargeback", severity: "warning", time: "5h ago", title: "CB Rate 0.72% — Harbor Marine", body: "3 chargebacks in 30 days. Exceeds 0.5% threshold. VDMP risk.", merchant: "Harbor Marine Supply", agent: "James Miller", actions: ["Risk Profile"] },
  { id: 5, type: "risk", severity: "warning", time: "1d ago", title: "Volume ↓28% — Green Leaf Landscaping", body: "$58.4K → $42.1K MoM. Lens flags attrition risk.", merchant: "Green Leaf Landscaping", agent: "Sarah Johnson", actions: ["Lens Report"] },
  { id: 6, type: "capital", severity: "critical", time: "4d ago", title: "NSF ×3 — Little Havana Barbershop", body: "3rd consecutive NSF on daily ACH ($68). Flagged Slow Pay.", merchant: "Little Havana Barbershop", agent: null, actions: ["Collection Status"] },
  { id: 7, type: "info", severity: "info", time: "3d ago", title: "April 2026 IC Schedule Published", body: "Visa L2 sunset. CEDP Product 3 mandatory. Re-verify portfolio.", actions: ["View Changes"] },
];

// ─── DASHBOARD DATA ─────────────────────────────────────────────
const PIPELINE = { leads: 8, newThisWeek: 2, inProgress: 5, won: 1, conversionRate: 12.5, avgTimeToFund: 5.2, uwQueue: 4, uwPending: 2 };
const MERCHANTS = { total: 8, active: 8, avgHealth: 78, churnRisk: 1, totalVolume: 522700, avgEffRate: 3.42, alertCount: 4 };
const CAPITAL = { deployed: 115000, outstanding: 72100, grossCollected: 82920, netAfterCOC: -42300, dailyACH: 861, defaultRate: 8.3, activDeals: 7, renewalPipeline: 4, fundomateSent: 5, fundomateComm: 9660 };
const RESIDUALS = { period: "March 2026", totalVolume: 522700, netRevenue: 11466.40, agentPayouts: 5733.20, deltRetained: 5733.20, merchants: 8 };
const TEAM = { agents: 4, topAgent: "Michael Chen", topAgentVol: 187200, totalCommissions: 5733.20 };

// Revenue trend (last 6 months)
const REVENUE_TREND = [
  { month: "Oct", net: 6820, vol: 285000 },
  { month: "Nov", net: 7450, vol: 318000 },
  { month: "Dec", net: 8100, vol: 355000 },
  { month: "Jan", net: 9200, vol: 412000 },
  { month: "Feb", net: 10100, vol: 468000 },
  { month: "Mar", net: 11466, vol: 522700 },
];
const maxRev = Math.max(...REVENUE_TREND.map(r => r.net));

// Top merchants by volume
const TOP_MERCHANTS = [
  { name: "TechStart Solutions", vol: 125000, net: 2750, health: 92, alerts: 0 },
  { name: "Metro Diner Group", vol: 89200, net: 1961, health: 68, alerts: 1 },
  { name: "Harbor Marine Supply", vol: 76500, net: 1683, health: 55, alerts: 2 },
  { name: "Bella Vista Restaurant", vol: 68900, net: 1515, health: 61, alerts: 1 },
  { name: "Urban Fitness Center", vol: 52300, net: 1150, health: 85, alerts: 0 },
];

// ─── COMPONENT ──────────────────────────────────────────────────
export default function Dashboard() {
  const [now, setNow] = useState(new Date());
  const [expandedAlert, setExpandedAlert] = useState(null);
  const [alertFilter, setAlertFilter] = useState("all");

  const criticalCount = ALERTS.filter(a => a.severity === "critical").length;
  const warningCount = ALERTS.filter(a => a.severity === "warning").length;

  const filteredAlerts = alertFilter === "all" ? ALERTS : ALERTS.filter(a => a.type === alertFilter);

  const greeting = (() => {
    const h = now.getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  const TYPE_STYLE = {
    chargeback: { icon: "⚡", color: "#ef4444", bg: "#fef2f2" },
    interchange: { icon: "⊞", color: "#f97316", bg: "#fff7ed" },
    risk: { icon: "△", color: "#f59e0b", bg: "#fffbeb" },
    capital: { icon: "⬦", color: "#8b5cf6", bg: "#f5f3ff" },
    info: { icon: "◉", color: "#6b7280", bg: "#f9fafb" },
  };

  return (
    <div style={S.root}>
      {/* ═══ HEADER ═══ */}
      <div style={S.header}>
        <div>
          <h1 style={S.greeting}>{greeting}, David</h1>
          <p style={S.dateline}>
            {now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            <span style={S.datelineSep}>·</span>
            <span style={S.datelineAccent}>{MERCHANTS.total} merchants</span>
            <span style={S.datelineSep}>·</span>
            <span style={S.datelineAccent}>${(MERCHANTS.totalVolume / 1000).toFixed(0)}K processed this period</span>
          </p>
        </div>
        <div style={S.headerRight}>
          <button style={S.refreshBtn}>↻ Refresh Data</button>
        </div>
      </div>

      {/* ═══ CRITICAL ALERT STRIP ═══ */}
      {criticalCount > 0 && (
        <div style={S.critStrip}>
          <div style={S.critStripLeft}>
            <div style={S.critStripPulse}>
              <div style={S.critStripDot} />
            </div>
            <div>
              <div style={S.critStripTitle}>{criticalCount} critical alert{criticalCount > 1 ? "s" : ""}</div>
              <div style={S.critStripSub}>
                {ALERTS.filter(a => a.severity === "critical").map(a => a.merchant || a.title).filter(Boolean).join(" · ")}
              </div>
            </div>
          </div>
          <div style={S.critStripBadge}>{criticalCount}</div>
        </div>
      )}

      {/* ═══ MAIN GRID: Metrics Left + Alerts Right ═══ */}
      <div style={S.mainGrid}>
        {/* ─── LEFT: Metrics ─── */}
        <div style={S.metricsCol}>

          {/* Revenue KPIs */}
          <div style={S.kpiSection}>
            <div style={S.kpiSectionTitle}>Revenue & Processing</div>
            <div style={S.kpiGrid4}>
              <BigKPI label="Net Revenue" value={`$${RESIDUALS.netRevenue.toLocaleString()}`} sub={RESIDUALS.period} color="#059669" />
              <BigKPI label="Total Volume" value={`$${(RESIDUALS.totalVolume / 1000).toFixed(0)}K`} sub={`${MERCHANTS.total} merchants`} />
              <BigKPI label="Delt Retained" value={`$${RESIDUALS.deltRetained.toLocaleString()}`} sub="After agent splits" color="#4945FF" />
              <BigKPI label="Agent Payouts" value={`$${RESIDUALS.agentPayouts.toLocaleString()}`} sub={`${TEAM.agents} agents`} color="#f59e0b" />
            </div>
          </div>

          {/* Revenue Trend Chart */}
          <div style={S.chartCard}>
            <div style={S.chartHeader}>
              <span style={S.chartTitle}>Revenue Trend</span>
              <span style={S.chartSub}>Last 6 months · Net revenue</span>
            </div>
            <div style={S.chartArea}>
              <div style={S.chartBars}>
                {REVENUE_TREND.map((r, i) => {
                  const pct = (r.net / maxRev) * 100;
                  const isCurrent = i === REVENUE_TREND.length - 1;
                  return (
                    <div key={i} style={S.chartBarCol}>
                      <div style={S.chartBarVal}>${(r.net / 1000).toFixed(1)}K</div>
                      <div style={S.chartBarTrack}>
                        <div style={{
                          ...S.chartBarFill,
                          height: `${pct}%`,
                          background: isCurrent ? "#4945FF" : "#e0e0e8",
                          borderRadius: 4,
                        }} />
                      </div>
                      <div style={{ ...S.chartBarLabel, ...(isCurrent ? { color: "#4945FF", fontWeight: 700 } : {}) }}>{r.month}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Two-Column: Pipeline + Capital */}
          <div style={S.dualGrid}>
            {/* Pipeline */}
            <div style={S.moduleCard}>
              <div style={S.moduleHeader}>
                <span style={S.moduleIcon}>📋</span>
                <span style={S.moduleTitle}>Pipeline</span>
                <span style={S.moduleLink}>View →</span>
              </div>
              <div style={S.moduleKPIs}>
                <MiniKPI label="Leads" value={PIPELINE.leads} />
                <MiniKPI label="New" value={PIPELINE.newThisWeek} accent />
                <MiniKPI label="In Progress" value={PIPELINE.inProgress} />
                <MiniKPI label="Won" value={PIPELINE.won} color="#059669" />
              </div>
              <div style={S.moduleDivider} />
              <div style={S.moduleKPIs}>
                <MiniKPI label="Conversion" value={`${PIPELINE.conversionRate}%`} />
                <MiniKPI label="Avg Fund Time" value={`${PIPELINE.avgTimeToFund}d`} />
                <MiniKPI label="UW Queue" value={PIPELINE.uwQueue} />
                <MiniKPI label="UW Pending" value={PIPELINE.uwPending} color="#f59e0b" />
              </div>
            </div>

            {/* Capital */}
            <div style={S.moduleCard}>
              <div style={S.moduleHeader}>
                <span style={S.moduleIcon}>🏦</span>
                <span style={S.moduleTitle}>Capital</span>
                <span style={S.moduleLink}>View →</span>
              </div>
              <div style={S.moduleKPIs}>
                <MiniKPI label="Deployed" value={`$${(CAPITAL.deployed / 1000).toFixed(0)}K`} />
                <MiniKPI label="Outstanding" value={`$${(CAPITAL.outstanding / 1000).toFixed(0)}K`} />
                <MiniKPI label="Collected" value={`$${(CAPITAL.grossCollected / 1000).toFixed(0)}K`} color="#059669" />
                <MiniKPI label="Daily ACH" value={`$${CAPITAL.dailyACH}`} />
              </div>
              <div style={S.moduleDivider} />
              <div style={S.moduleKPIs}>
                <MiniKPI label="Default Rate" value={`${CAPITAL.defaultRate}%`} color={CAPITAL.defaultRate > 5 ? "#ef4444" : "#059669"} />
                <MiniKPI label="Active Deals" value={CAPITAL.activDeals} />
                <MiniKPI label="Renewals" value={CAPITAL.renewalPipeline} />
                <MiniKPI label="Fundomate" value={`$${(CAPITAL.fundomateComm / 1000).toFixed(1)}K`} color="#4945FF" />
              </div>
            </div>
          </div>

          {/* Top Merchants */}
          <div style={S.merchantTable}>
            <div style={S.merchantTableHeader}>
              <span style={S.chartTitle}>Top Merchants by Volume</span>
              <span style={S.moduleLink}>All Merchants →</span>
            </div>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>MERCHANT</th>
                  <th style={S.th}>VOLUME</th>
                  <th style={S.th}>NET REV</th>
                  <th style={S.th}>HEALTH</th>
                  <th style={S.th}>ALERTS</th>
                </tr>
              </thead>
              <tbody>
                {TOP_MERCHANTS.map((m, i) => (
                  <tr key={i} style={S.tr}>
                    <td style={{ ...S.td, fontWeight: 600, color: "#111827" }}>{m.name}</td>
                    <td style={{ ...S.td, fontFamily: mono }}>${(m.vol / 1000).toFixed(0)}K</td>
                    <td style={{ ...S.td, fontFamily: mono, color: "#059669" }}>${m.net.toLocaleString()}</td>
                    <td style={S.td}>
                      <div style={S.healthCell}>
                        <div style={S.healthBar}>
                          <div style={{ ...S.healthFill, width: `${m.health}%`, background: m.health >= 80 ? "#059669" : m.health >= 60 ? "#f59e0b" : "#ef4444" }} />
                        </div>
                        <span style={{ ...S.healthVal, color: m.health >= 80 ? "#059669" : m.health >= 60 ? "#f59e0b" : "#ef4444" }}>{m.health}</span>
                      </div>
                    </td>
                    <td style={S.td}>
                      {m.alerts > 0 ? (
                        <span style={S.alertCountBadge}>{m.alerts}</span>
                      ) : (
                        <span style={S.cleanBadge}>Clean</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ─── RIGHT: Alert Feed ─── */}
        <div style={S.alertCol}>
          <div style={S.alertColHeader}>
            <div style={S.alertColTitle}>
              Alerts
              <span style={S.alertColBadge}>{ALERTS.length}</span>
            </div>
            <div style={S.alertFilters}>
              {["all", "chargeback", "interchange", "risk"].map(f => (
                <button key={f} onClick={() => setAlertFilter(f)}
                  style={{ ...S.alertFilterBtn, ...(alertFilter === f ? S.alertFilterBtnActive : {}) }}>
                  {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div style={S.alertFeed}>
            {filteredAlerts.map(a => {
              const ts = TYPE_STYLE[a.type] || TYPE_STYLE.info;
              const isCrit = a.severity === "critical";
              const isExp = expandedAlert === a.id;
              return (
                <div key={a.id}
                  onClick={() => setExpandedAlert(isExp ? null : a.id)}
                  style={{
                    ...S.alertCard,
                    borderLeftColor: ts.color,
                    background: isCrit ? "#fef2f2" : "#fff",
                    cursor: "pointer",
                  }}>
                  <div style={S.alertCardTop}>
                    <div style={S.alertCardIcon}>
                      <span style={{ ...S.alertIconCircle, background: ts.bg, color: ts.color }}>{ts.icon}</span>
                    </div>
                    <div style={S.alertCardBody}>
                      <div style={S.alertCardHeader}>
                        {isCrit && <span style={S.alertCritDot} />}
                        <span style={S.alertCardTime}>{a.time}</span>
                      </div>
                      <div style={S.alertCardTitle}>{a.title}</div>
                      <div style={S.alertCardDesc}>{a.body}</div>
                    </div>
                  </div>
                  {isExp && (
                    <div style={S.alertCardExpanded}>
                      {a.merchant && <div style={S.alertMeta}>📍 {a.merchant}{a.agent ? ` · 👤 ${a.agent}` : ""}</div>}
                      <div style={S.alertActions}>
                        {a.actions.map((act, ai) => (
                          <button key={ai} style={ai === 0 ? S.alertActionPrimary : S.alertActionSecondary}>{act}</button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Team snapshot at bottom of alert rail */}
          <div style={S.teamSnap}>
            <div style={S.teamSnapTitle}>Team Snapshot</div>
            <div style={S.teamSnapGrid}>
              {[
                { name: "Sarah Johnson", vol: "$131.9K", merchants: 3, color: "#059669" },
                { name: "Michael Chen", vol: "$187.2K", merchants: 3, color: "#4945FF" },
                { name: "James Miller", vol: "$165.7K", merchants: 2, color: "#f59e0b" },
                { name: "Lyndon", vol: "$0", merchants: 0, color: "#6b7280" },
              ].map((a, i) => (
                <div key={i} style={S.teamSnapCard}>
                  <div style={{ ...S.teamSnapDot, background: a.color }} />
                  <div style={S.teamSnapInfo}>
                    <div style={S.teamSnapName}>{a.name}</div>
                    <div style={S.teamSnapStats}>
                      <span style={S.teamSnapVal}>{a.vol}</span>
                      <span style={S.teamSnapSep}>·</span>
                      <span>{a.merchants} merchant{a.merchants !== 1 ? "s" : ""}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SUB COMPONENTS ─────────────────────────────────────────────
function BigKPI({ label, value, sub, color }) {
  return (
    <div style={S.bigKPI}>
      <div style={S.bigKPILabel}>{label}</div>
      <div style={{ ...S.bigKPIValue, color: color || "#111827" }}>{value}</div>
      {sub && <div style={S.bigKPISub}>{sub}</div>}
    </div>
  );
}

function MiniKPI({ label, value, color, accent }) {
  return (
    <div style={S.miniKPI}>
      <div style={S.miniKPILabel}>{label}</div>
      <div style={{ ...S.miniKPIValue, color: color || "#111827", ...(accent ? { color: "#4945FF" } : {}) }}>{value}</div>
    </div>
  );
}

// ─── STYLES ─────────────────────────────────────────────────────
const S = {
  root: { fontFamily: sans, background: "#f6f6f9", color: "#111827", minHeight: "100vh", padding: "24px 28px" },

  // Header
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  greeting: { fontSize: 28, fontWeight: 800, margin: 0, color: "#111827", letterSpacing: "-0.03em" },
  dateline: { fontSize: 13, color: "#9ca3af", marginTop: 4 },
  datelineSep: { margin: "0 8px", color: "#d1d5db" },
  datelineAccent: { color: "#6b7280", fontWeight: 500 },
  headerRight: { display: "flex", gap: 10 },
  refreshBtn: { background: "#4945FF", border: "none", color: "#fff", fontSize: 13, fontWeight: 600, padding: "10px 22px", borderRadius: 10, cursor: "pointer", fontFamily: sans },

  // Critical strip
  critStrip: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "14px 20px", marginBottom: 20,
    background: "#fef2f2", border: "1px solid rgba(239,68,68,0.2)",
    borderRadius: 14,
  },
  critStripLeft: { display: "flex", alignItems: "center", gap: 14 },
  critStripPulse: { position: "relative", width: 12, height: 12 },
  critStripDot: { width: 12, height: 12, borderRadius: "50%", background: "#ef4444", animation: "pulse 2s infinite" },
  critStripTitle: { fontSize: 14, fontWeight: 700, color: "#ef4444" },
  critStripSub: { fontSize: 12, color: "#92400e", marginTop: 2 },
  critStripBadge: {
    width: 32, height: 32, borderRadius: "50%",
    background: "#ef4444", color: "#fff",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 14, fontWeight: 800, fontFamily: mono,
    boxShadow: "0 2px 8px rgba(239,68,68,0.35)",
  },

  // Main grid
  mainGrid: { display: "grid", gridTemplateColumns: "1fr 360px", gap: 20, alignItems: "start" },

  // Left: metrics
  metricsCol: { display: "flex", flexDirection: "column", gap: 16 },

  kpiSection: {},
  kpiSectionTitle: { fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#9ca3af", marginBottom: 10 },
  kpiGrid4: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 },
  bigKPI: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "18px 20px" },
  bigKPILabel: { fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 },
  bigKPIValue: { fontSize: 24, fontWeight: 800, fontFamily: mono, letterSpacing: "-0.03em" },
  bigKPISub: { fontSize: 11, color: "#9ca3af", marginTop: 4 },

  // Chart
  chartCard: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "20px 24px" },
  chartHeader: { display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 },
  chartTitle: { fontSize: 15, fontWeight: 700, color: "#111827" },
  chartSub: { fontSize: 11, color: "#9ca3af" },
  chartArea: { height: 160 },
  chartBars: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", height: "100%", gap: 8 },
  chartBarCol: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", gap: 6 },
  chartBarVal: { fontSize: 10, fontWeight: 600, fontFamily: mono, color: "#6b7280" },
  chartBarTrack: { flex: 1, width: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end" },
  chartBarFill: { width: "100%", transition: "height 0.5s ease", minHeight: 4 },
  chartBarLabel: { fontSize: 11, color: "#9ca3af", fontWeight: 500 },

  // Dual grid
  dualGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  moduleCard: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "18px 20px" },
  moduleHeader: { display: "flex", alignItems: "center", gap: 8, marginBottom: 14 },
  moduleIcon: { fontSize: 16 },
  moduleTitle: { fontSize: 14, fontWeight: 700, flex: 1 },
  moduleLink: { fontSize: 11, color: "#4945FF", fontWeight: 600, cursor: "pointer" },
  moduleKPIs: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 },
  moduleDivider: { height: 1, background: "#f3f4f6", margin: "10px 0" },
  miniKPI: {},
  miniKPILabel: { fontSize: 10, fontWeight: 500, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 3 },
  miniKPIValue: { fontSize: 16, fontWeight: 700, fontFamily: mono, letterSpacing: "-0.02em" },

  // Top merchants
  merchantTable: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "18px 0", overflow: "hidden" },
  merchantTableHeader: { display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "0 20px", marginBottom: 12 },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "#9ca3af", padding: "8px 20px", textAlign: "left", borderBottom: "1px solid #e5e7eb" },
  tr: { borderBottom: "1px solid #f3f4f6" },
  td: { fontSize: 13, padding: "12px 20px", color: "#374151" },
  healthCell: { display: "flex", alignItems: "center", gap: 8 },
  healthBar: { width: 48, height: 5, background: "#f3f4f6", borderRadius: 3, overflow: "hidden" },
  healthFill: { height: "100%", borderRadius: 3 },
  healthVal: { fontSize: 12, fontWeight: 700, fontFamily: mono, minWidth: 22 },
  alertCountBadge: {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    minWidth: 20, height: 20, borderRadius: 10,
    background: "#ef4444", color: "#fff",
    fontSize: 11, fontWeight: 700, fontFamily: mono,
    padding: "0 6px",
  },
  cleanBadge: { fontSize: 11, color: "#059669", fontWeight: 600 },

  // Right: alert column
  alertCol: { display: "flex", flexDirection: "column", gap: 0, position: "sticky", top: 24, maxHeight: "calc(100vh - 48px)", overflow: "hidden" },
  alertColHeader: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: "14px 14px 0 0", padding: "16px 18px 12px" },
  alertColTitle: { fontSize: 16, fontWeight: 800, display: "flex", alignItems: "center", gap: 8, marginBottom: 10 },
  alertColBadge: {
    minWidth: 22, height: 22, borderRadius: 11,
    background: "#ef4444", color: "#fff",
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    fontSize: 11, fontWeight: 700, fontFamily: mono, padding: "0 6px",
  },
  alertFilters: { display: "flex", gap: 4 },
  alertFilterBtn: { padding: "4px 10px", borderRadius: 6, border: "1px solid #e5e7eb", background: "#fff", fontSize: 11, fontWeight: 500, color: "#6b7280", cursor: "pointer", fontFamily: sans },
  alertFilterBtnActive: { background: "#111827", borderColor: "#111827", color: "#fff" },

  alertFeed: { flex: 1, overflowY: "auto", background: "#fff", borderLeft: "1px solid #e5e7eb", borderRight: "1px solid #e5e7eb", padding: "0" },

  alertCard: { padding: "14px 18px", borderBottom: "1px solid #f3f4f6", borderLeft: "3px solid", transition: "background 0.1s" },
  alertCardTop: { display: "flex", gap: 10 },
  alertCardIcon: { flexShrink: 0, marginTop: 2 },
  alertIconCircle: { width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700 },
  alertCardBody: { flex: 1, minWidth: 0 },
  alertCardHeader: { display: "flex", alignItems: "center", gap: 6, marginBottom: 3 },
  alertCritDot: { width: 7, height: 7, borderRadius: "50%", background: "#ef4444", animation: "pulse 2s infinite" },
  alertCardTime: { fontSize: 10, color: "#9ca3af", fontFamily: mono, fontWeight: 500 },
  alertCardTitle: { fontSize: 13, fontWeight: 700, color: "#111827", lineHeight: 1.3 },
  alertCardDesc: { fontSize: 11, color: "#6b7280", lineHeight: 1.4, marginTop: 3 },

  alertCardExpanded: { marginTop: 10, paddingTop: 10, borderTop: "1px solid #e5e7eb" },
  alertMeta: { fontSize: 11, color: "#6b7280", marginBottom: 8 },
  alertActions: { display: "flex", gap: 6 },
  alertActionPrimary: { background: "#4945FF", color: "#fff", border: "none", padding: "6px 14px", borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: sans },
  alertActionSecondary: { background: "#f3f4f6", color: "#374151", border: "none", padding: "6px 14px", borderRadius: 7, fontSize: 11, fontWeight: 500, cursor: "pointer", fontFamily: sans },

  // Team snapshot
  teamSnap: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: "0 0 14px 14px", padding: "14px 18px" },
  teamSnapTitle: { fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#9ca3af", marginBottom: 10 },
  teamSnapGrid: { display: "flex", flexDirection: "column", gap: 8 },
  teamSnapCard: { display: "flex", alignItems: "center", gap: 10 },
  teamSnapDot: { width: 8, height: 8, borderRadius: "50%", flexShrink: 0 },
  teamSnapInfo: { flex: 1 },
  teamSnapName: { fontSize: 12, fontWeight: 600, color: "#111827" },
  teamSnapStats: { fontSize: 11, color: "#9ca3af", display: "flex", alignItems: "center", gap: 4 },
  teamSnapVal: { fontFamily: mono, fontWeight: 600, color: "#374151" },
  teamSnapSep: { color: "#d1d5db" },
};

// Add pulse animation
const style = document.createElement("style");
style.textContent = `@keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.2); } }`;
document.head.appendChild(style);