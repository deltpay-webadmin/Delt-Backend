import { useState, useMemo } from "react";

/*
  DELT — Interchange Verifier
  Built into the existing Residuals → Merchant → Interchange & Rates tab.
  Compares processor-reported IC rates against published Visa/MC schedules.
  Flags padding, misclassification, and downgrade abuse.
  
  Published rates update April & October each year.
*/

// ─── PUBLISHED INTERCHANGE REFERENCE ────────────────────────────
// Source: Visa USA & Mastercard US interchange schedules
// Current cycle: April 2026
const SCHEDULE = {
  version: "April 2026",
  effectiveDate: "April 18, 2026",
  nextUpdate: "October 2026",
  lastChecked: "2026-04-15",
};

// Reference rates keyed by the category names processors typically use
// on statements. Each entry has the published rate + txn fee, plus
// common "bucket" aliases processors use to obscure line items.
const PUBLISHED_RATES = {
  "Visa Credit — Qual": {
    network: "Visa",
    published: { rate: 1.51, txnFee: 0.10 },
    program: "CPS Retail / CPS Retail 2",
    aliases: ["VS CRD QUAL", "VISA QUAL", "CPS RETAIL"],
    notes: "Card present, swiped/dipped/tapped. Most common qualified bucket.",
    commonPadding: "Processors often blend Rewards 1 (1.65%) into this bucket at a higher blended rate",
  },
  "Visa Credit — Mid-Qual": {
    network: "Visa",
    published: { rate: 1.99, txnFee: 0.10 },
    program: "CPS Rewards 2 / EIRF",
    aliases: ["VS CRD MQUAL", "VISA MID", "EIRF CREDIT"],
    notes: "Rewards cards or keyed-in transactions. Wide range: 1.65%–2.30% depending on card tier.",
    range: { low: 1.65, high: 2.30 },
    commonPadding: "This is the #1 bucket for padding — it's a wide category and processors exploit the ambiguity",
  },
  "Visa Credit — Non-Qual": {
    network: "Visa",
    published: { rate: 2.70, txnFee: 0.10 },
    program: "Standard / Non-Qualified",
    aliases: ["VS CRD NQUAL", "VISA NON-QUAL", "VISA STD"],
    notes: "Catch-all downgrade bucket. If you see a lot of volume here, transactions are being downgraded.",
    commonPadding: "High non-qual volume usually means the processor isn't submitting proper data — ask why",
  },
  "Visa Debit — Regulated": {
    network: "Visa",
    published: { rate: 0.05, txnFee: 0.22 },
    program: "Regulated Debit (Durbin)",
    aliases: ["VS DBT REG", "VISA DEBIT REG", "DURBIN VISA"],
    notes: "Durbin-regulated debit. Rate is set by Federal Reserve, not Visa. Any variance here is pure padding.",
    commonPadding: "This rate is federally regulated — there is ZERO reason for variance. Any difference is markup.",
  },
  "Visa Debit — Exempt": {
    network: "Visa",
    published: { rate: 0.80, txnFee: 0.15 },
    program: "CPS Retail Debit (Exempt)",
    aliases: ["VS DBT EXEMPT", "VISA DEBIT UNREGULATED"],
    notes: "Small bank debit cards exempt from Durbin. Higher than regulated.",
    commonPadding: "Sometimes blended with regulated debit to inflate the 'average' debit rate",
  },
  "MC Credit — Qual": {
    network: "Mastercard",
    published: { rate: 1.58, txnFee: 0.10 },
    program: "Merit III / Core",
    aliases: ["MC CRD QUAL", "MC MERIT III", "MC CORE"],
    notes: "Card present, standard consumer credit. Core Value tier.",
    commonPadding: "Watch for World and World Elite cards being bucketed here at their higher actual rate but billed at a padded 'qualified' rate",
  },
  "MC Credit — Mid-Qual": {
    network: "Mastercard",
    published: { rate: 2.05, txnFee: 0.10 },
    program: "World / Enhanced Value",
    aliases: ["MC CRD MQUAL", "MC MID", "MC WORLD"],
    notes: "World and World Elite cards, or keyed transactions.",
    range: { low: 1.73, high: 2.40 },
    commonPadding: "Similar to Visa mid-qual — wide bucket, easy to pad",
  },
  "MC Debit — Regulated": {
    network: "Mastercard",
    published: { rate: 0.05, txnFee: 0.22 },
    program: "Regulated Debit (Durbin)",
    aliases: ["MC DBT REG", "MC DEBIT REG", "DURBIN MC"],
    notes: "Same Durbin regulation as Visa. Federally set rate.",
    commonPadding: "Identical to Visa regulated — any variance is pure markup.",
  },
  "Amex OptBlue": {
    network: "Amex",
    published: { rate: 2.30, txnFee: 0.10 },
    program: "OptBlue Tier 3",
    aliases: ["AMEX OPT", "AMEX OPTBLUE", "AX OPTBLUE"],
    notes: "Amex OptBlue for merchants under $1M/yr Amex volume. Rates vary by tier: 1.60%–3.30%.",
    range: { low: 1.60, high: 3.30 },
    commonPadding: "Amex has the widest tier spread — always verify which OptBlue tier the merchant qualifies for",
  },
  "Discover — Qual": {
    network: "Discover",
    published: { rate: 1.56, txnFee: 0.10 },
    program: "Consumer Credit Card Present",
    aliases: ["DISC QUAL", "DISCOVER QUAL"],
    notes: "Card present consumer Discover.",
    commonPadding: "Often lumped into a generic 'other networks' bucket at an inflated rate",
  },
};

// Network assessment fees (separate from interchange)
const NETWORK_FEES = {
  visa: { name: "Visa", assessment: 0.14, accessFee: 0.0195 },
  mastercard: { name: "Mastercard", assessment: 0.13, accessFee: 0.0195 },
  amex: { name: "Amex", assessment: 0.15, accessFee: 0.00 },
  discover: { name: "Discover", assessment: 0.13, accessFee: 0.0195 },
};

// ─── SAMPLE MERCHANT DATA (from screenshots) ───────────────────
const MERCHANT = {
  name: "Sunrise Cafe & Bakery",
  mid: "4485-7721-0093",
  mcc: "5812",
  category: "Food & Beverage",
  agent: "Sarah Johnson",
  agentSplit: 50,
  processor: "North / NAB",
  status: "Active",
  month: "March 2026",
  monthlyVolume: 37500,
  netRevenue: 795.00,
  effectiveRate: 3.42,
  avgTicket: 46.18,
  deltNet: 397.50,
  lensScore: 78,
  chargebackRate: 0.40,
};

const STATEMENT_LINES = [
  { category: "Visa Credit — Qual",     volume: 14250, pctTotal: 38.00, reportedRate: 1.65, reportedTxnFee: 0.10, icCost: 248.63, marginToMerchant: 238.72 },
  { category: "Visa Credit — Mid-Qual", volume: 3375,  pctTotal: 9.00,  reportedRate: 2.30, reportedTxnFee: 0.10, icCost: 81.00,  marginToMerchant: 34.43 },
  { category: "Visa Debit — Regulated", volume: 7500,  pctTotal: 20.00, reportedRate: 0.05, reportedTxnFee: 0.22, icCost: 19.51,  marginToMerchant: 236.99 },
  { category: "MC Credit — Qual",       volume: 8625,  pctTotal: 23.00, reportedRate: 1.73, reportedTxnFee: 0.10, icCost: 157.80, marginToMerchant: 137.18 },
  { category: "MC Debit — Regulated",   volume: 2250,  pctTotal: 6.00,  reportedRate: 0.05, reportedTxnFee: 0.22, icCost: 6.08,   marginToMerchant: 70.87 },
  { category: "Amex OptBlue",           volume: 1500,  pctTotal: 4.00,  reportedRate: 2.40, reportedTxnFee: 0.10, icCost: 37.50,  marginToMerchant: 13.80 },
];

const FEES = [
  { name: "Monthly Minimum",    amount: 25.00, type: "Fixed" },
  { name: "Statement Fee",      amount: 10.00, type: "Fixed" },
  { name: "PCI Compliance Fee", amount: 14.95, type: "Fixed" },
  { name: "Batch Settlement Fee", amount: 0.25, type: "Per Batch", note: "~30 batches/mo" },
  { name: "Gateway Fee",        amount: 0.03, type: "Per Txn" },
  { name: "Chargeback Fee",     amount: 25.00, type: "Per Incident" },
  { name: "Retrieval Fee",      amount: 15.00, type: "Per Incident" },
];

// ─── FONTS ──────────────────────────────────────────────────────
const fl = document.createElement("link");
fl.href = "https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=JetBrains+Mono:wght@400;500;600&display=swap";
fl.rel = "stylesheet";
document.head.appendChild(fl);
const mono = "'JetBrains Mono', monospace";
const sans = "'DM Sans', system-ui, sans-serif";

// ─── VERIFICATION ENGINE ────────────────────────────────────────
function verifyLine(line) {
  const ref = PUBLISHED_RATES[line.category];
  if (!ref) return { status: "unknown", message: "No reference rate found" };

  const pub = ref.published;
  const reportedBps = line.reportedRate * 100; // convert to basis points
  const publishedBps = pub.rate * 100;
  const diffBps = reportedBps - publishedBps;
  const diffTxnFee = ((line.reportedTxnFee || 0) - (pub.txnFee || 0)) * 100; // in cents

  // Calculate dollar impact of the variance
  const avgTicket = MERCHANT.avgTicket;
  const estTxns = Math.round(line.volume / avgTicket);
  const ratePadding = line.volume * (diffBps / 10000);
  const txnPadding = estTxns * (line.reportedTxnFee - pub.txnFee);
  const totalPadding = ratePadding + txnPadding;
  const annualImpact = totalPadding * 12;

  // Check if within acceptable range for categories with wide bands
  const hasRange = ref.range;
  const withinRange = hasRange && line.reportedRate >= hasRange.low && line.reportedRate <= hasRange.high;

  let status, severity, message;

  if (diffBps === 0 && diffTxnFee === 0) {
    status = "verified";
    severity = 0;
    message = "Exact match to published rate";
  } else if (diffBps <= 2 && diffTxnFee <= 0) {
    status = "verified";
    severity = 0;
    message = "Within rounding tolerance";
  } else if (hasRange && withinRange) {
    if (diffBps <= 10) {
      status = "acceptable";
      severity = 1;
      message = `Within published range (${hasRange.low}%–${hasRange.high}%). Reported rate is ${diffBps} bps above base.`;
    } else {
      status = "review";
      severity = 2;
      message = `Within range but ${diffBps} bps above base rate. Request card-level detail to verify.`;
    }
  } else if (diffBps > 0 && diffBps <= 5) {
    status = "review";
    severity = 1;
    message = `${diffBps} bps above published. Minor — could be assessment pass-through or rounding.`;
  } else if (diffBps > 5 && diffBps <= 15) {
    status = "flag";
    severity = 2;
    message = `${diffBps} bps above published rate. Likely padding. Request line-item interchange detail from North.`;
  } else if (diffBps > 15) {
    status = "alert";
    severity: 3;
    message = `${diffBps} bps above published — significant overcharge. Escalate to North immediately.`;
  } else if (diffBps < 0) {
    status = "verified";
    severity = 0;
    message = `${Math.abs(diffBps)} bps below published. Favorable.`;
  } else {
    status = "review";
    severity = 1;
    message = "Unable to determine — review manually";
  }

  // Special handling for regulated debit
  if (line.category.includes("Regulated")) {
    if (diffBps > 0 || diffTxnFee > 0) {
      status = "alert";
      severity = 3;
      message = `Regulated debit rate is federally set. ANY variance is pure markup. Reported: ${line.reportedRate}% + $${line.reportedTxnFee} vs Published: ${pub.rate}% + $${pub.txnFee.toFixed(2)}`;
    }
  }

  return {
    status,
    severity,
    message,
    publishedRate: pub.rate,
    publishedTxnFee: pub.txnFee,
    diffBps,
    diffTxnFee,
    ratePadding: Math.max(ratePadding, 0),
    txnPadding: Math.max(txnPadding, 0),
    totalPadding: Math.max(totalPadding, 0),
    annualImpact: Math.max(annualImpact, 0),
    estTxns,
    commonPadding: ref.commonPadding,
    program: ref.program,
    notes: ref.notes,
    hasRange: !!hasRange,
    range: hasRange,
  };
}

// ─── COMPONENT ──────────────────────────────────────────────────
export default function InterchangeVerifier() {
  const [activeTab, setActiveTab] = useState("interchange");
  const [verifyMode, setVerifyMode] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);
  const [showSchedule, setShowSchedule] = useState(false);

  const verifications = useMemo(() => {
    return STATEMENT_LINES.map(line => ({
      ...line,
      verification: verifyLine(line),
    }));
  }, []);

  const totalPadding = useMemo(() => verifications.reduce((sum, v) => sum + v.verification.totalPadding, 0), [verifications]);
  const annualPadding = totalPadding * 12;
  const flagCount = verifications.filter(v => ["flag", "alert", "review"].includes(v.verification.status)).length;
  const alertCount = verifications.filter(v => v.verification.status === "alert").length;

  const blendedIC = 1.47;
  const effectiveRate = 3.42;
  const grossSpread = effectiveRate - blendedIC;

  const statusIcon = (status) => {
    switch (status) {
      case "verified": return "✓";
      case "acceptable": return "~";
      case "review": return "?";
      case "flag": return "⚑";
      case "alert": return "✕";
      default: return "—";
    }
  };
  const statusColor = (status) => {
    switch (status) {
      case "verified": return "#22c55e";
      case "acceptable": return "#22c55e";
      case "review": return "#f59e0b";
      case "flag": return "#f97316";
      case "alert": return "#ef4444";
      default: return "#6b7280";
    }
  };

  const tabs = [
    { key: "residual", label: "Residual Detail", icon: "$" },
    { key: "interchange", label: "Interchange & Rates", icon: "⊞" },
    { key: "equipment", label: "Equipment & Terminals", icon: "⊟" },
    { key: "chargebacks", label: "Chargebacks & Risk", icon: "◇" },
    { key: "batch", label: "Batch History", icon: "⊞" },
  ];

  return (
    <div style={S.root}>
      {/* ─── BREADCRUMB ─── */}
      <div style={S.breadcrumb}>
        <span style={S.breadLink}>Residuals</span>
        <span style={S.breadSep}>›</span>
        <span style={S.breadCurrent}>{MERCHANT.name}</span>
      </div>
      <div style={S.backLink}>← Back to Residuals</div>

      {/* ─── MERCHANT HEADER ─── */}
      <div style={S.merchantHeader}>
        <div style={S.merchantLeft}>
          <h1 style={S.merchantName}>{MERCHANT.name}</h1>
          <span style={S.badge}>{MERCHANT.category}</span>
          <span style={S.statusBadge}>● Active</span>
        </div>
        <div style={S.merchantActions}>
          <button style={S.editBtn}>✎ Edit</button>
          <button style={S.exportBtn}>↓ Export Statement</button>
        </div>
      </div>
      <div style={S.merchantMeta}>
        MID: {MERCHANT.mid} &nbsp;&nbsp; MCC: {MERCHANT.mcc} &nbsp;&nbsp; Agent: <strong>{MERCHANT.agent}</strong> ({MERCHANT.agentSplit}% split) &nbsp;&nbsp; Processor: <strong>{MERCHANT.processor}</strong>
      </div>

      {/* ─── KPI CARDS ─── */}
      <div style={S.kpiRow}>
        <KPI label="Monthly Volume" value={`$${MERCHANT.monthlyVolume.toLocaleString()}`} change="↗ 12.3%" positive sub="vs. last month" />
        <KPI label="Net Revenue" value={`$${MERCHANT.netRevenue.toFixed(2)}`} change="↗ 15.3%" positive sub="Delt + Agent" />
        <KPI label="Effective Rate" value={`${MERCHANT.effectiveRate}%`} sub={`Avg ticket $${MERCHANT.avgTicket}`} />
        <KPI label="Delt Net" value={`$${MERCHANT.deltNet.toFixed(2)}`} sub="50% after agent split" />
        <div style={S.kpiCard}>
          <div style={S.kpiLabel}>Lens Health Score</div>
          <div style={S.lensScore}>
            <svg width="52" height="52" viewBox="0 0 52 52">
              <circle cx="26" cy="26" r="22" fill="none" stroke="#e5e7eb" strokeWidth="4" />
              <circle cx="26" cy="26" r="22" fill="none" stroke="#22c55e" strokeWidth="4"
                strokeDasharray={`${(MERCHANT.lensScore / 100) * 138.2} 138.2`}
                strokeLinecap="round" transform="rotate(-90 26 26)" />
              <text x="26" y="30" textAnchor="middle" style={{ fontSize: 16, fontWeight: 700, fontFamily: mono, fill: "#111827" }}>{MERCHANT.lensScore}</text>
            </svg>
          </div>
          <div style={S.kpiSub}>Out of 100 · Good</div>
        </div>
        <KPI label="Chargeback Rate" value={`${MERCHANT.chargebackRate}%`} sub="Industry avg: 0.6%" />
      </div>

      {/* ─── TABS ─── */}
      <div style={S.tabBar}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            style={{ ...S.tab, ...(activeTab === t.key ? S.tabActive : {}) }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ─── INTERCHANGE & RATES CONTENT ─── */}
      {activeTab === "interchange" && (
        <div style={S.content}>
          {/* TABLE HEADER + VERIFY TOGGLE */}
          <div style={S.sectionHeader}>
            <div>
              <h2 style={S.sectionTitle}>Interchange Breakdown by Card Type</h2>
              <p style={S.sectionSub}>{MERCHANT.month} · ${MERCHANT.monthlyVolume.toLocaleString()} total volume</p>
            </div>
            <button onClick={() => setVerifyMode(!verifyMode)}
              style={{ ...S.verifyToggle, ...(verifyMode ? S.verifyToggleActive : {}) }}>
              <span style={S.verifyIcon}>{verifyMode ? "🔍" : "🛡️"}</span>
              {verifyMode ? "Verification ON" : "Verify Interchange"}
            </button>
          </div>

          {/* VERIFICATION SUMMARY BANNER */}
          {verifyMode && (
            <div style={{
              ...S.verifyBanner,
              borderColor: alertCount > 0 ? "rgba(239,68,68,0.25)" : flagCount > 0 ? "rgba(249,115,22,0.2)" : "rgba(34,197,94,0.2)",
              background: alertCount > 0 ? "rgba(239,68,68,0.04)" : flagCount > 0 ? "rgba(249,115,22,0.03)" : "rgba(34,197,94,0.03)",
            }}>
              <div style={S.verifyBannerTop}>
                <div style={S.verifyBannerLeft}>
                  <div style={{ ...S.verifyBannerIcon, color: alertCount > 0 ? "#ef4444" : flagCount > 0 ? "#f97316" : "#22c55e" }}>
                    {alertCount > 0 ? "⚠" : flagCount > 0 ? "⚑" : "✓"}
                  </div>
                  <div>
                    <div style={S.verifyBannerTitle}>
                      {alertCount > 0 ? `${alertCount} alert${alertCount > 1 ? "s" : ""} — potential interchange padding detected`
                        : flagCount > 0 ? `${flagCount} item${flagCount > 1 ? "s" : ""} need review`
                        : "All interchange rates verified"}
                    </div>
                    <div style={S.verifyBannerSub}>
                      Compared against published {SCHEDULE.version} Visa/MC/Amex schedule · Last updated {SCHEDULE.lastChecked}
                    </div>
                  </div>
                </div>
                {totalPadding > 0 && (
                  <div style={S.paddingCallout}>
                    <div style={S.paddingLabel}>Est. Monthly Overcharge</div>
                    <div style={S.paddingVal}>${totalPadding.toFixed(2)}</div>
                    <div style={S.paddingAnnual}>${annualPadding.toFixed(0)}/yr</div>
                  </div>
                )}
              </div>
              <div style={S.verifyBannerActions}>
                <button onClick={() => setShowSchedule(!showSchedule)} style={S.bannerBtn}>
                  {showSchedule ? "Hide" : "View"} Published Rates
                </button>
                <div style={S.scheduleNote}>
                  Next rate update: <strong>{SCHEDULE.nextUpdate}</strong> · Set a reminder to re-verify after each April & October cycle
                </div>
              </div>
            </div>
          )}

          {/* PUBLISHED RATES REFERENCE */}
          {verifyMode && showSchedule && (
            <div style={S.schedulePanel}>
              <div style={S.schedulePanelHeader}>
                <h3 style={S.schedulePanelTitle}>Published Interchange Reference — {SCHEDULE.version}</h3>
                <div style={S.schedulePanelSub}>Source: Visa USA & Mastercard US fee schedules · Effective {SCHEDULE.effectiveDate}</div>
              </div>
              <div style={S.scheduleGrid}>
                {Object.entries(PUBLISHED_RATES).map(([cat, ref]) => (
                  <div key={cat} style={S.scheduleCard}>
                    <div style={S.scheduleCardHeader}>
                      <span style={{ ...S.networkDot, background: ref.network === "Visa" ? "#1a1f71" : ref.network === "Mastercard" ? "#eb001b" : ref.network === "Amex" ? "#006fcf" : "#ff6000" }} />
                      <span style={S.scheduleCardName}>{cat}</span>
                    </div>
                    <div style={S.scheduleCardRate}>
                      {ref.published.rate}% + ${ref.published.txnFee.toFixed(2)}
                    </div>
                    {ref.range && (
                      <div style={S.scheduleCardRange}>Range: {ref.range.low}% – {ref.range.high}%</div>
                    )}
                    <div style={S.scheduleCardProgram}>{ref.program}</div>
                    <div style={S.scheduleCardNotes}>{ref.notes}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MAIN TABLE */}
          <div style={S.tableWrap}>
            <table style={S.table}>
              <thead>
                <tr>
                  {verifyMode && <th style={{ ...S.th, width: 40 }}>STATUS</th>}
                  <th style={S.th}>CARD CATEGORY</th>
                  <th style={S.th}>VOLUME</th>
                  <th style={S.th}>% OF TOTAL</th>
                  <th style={S.th}>INTERCHANGE RATE</th>
                  {verifyMode && <th style={S.th}>PUBLISHED RATE</th>}
                  {verifyMode && <th style={S.th}>VARIANCE</th>}
                  <th style={S.th}>IC COST</th>
                  <th style={S.th}>MARGIN TO MERCHANT</th>
                </tr>
              </thead>
              <tbody>
                {verifications.map((line, i) => {
                  const v = line.verification;
                  const isExpanded = expandedRow === i;
                  return (
                    <Fragment key={i}>
                      <tr style={{ ...S.tr, cursor: verifyMode ? "pointer" : "default" }}
                        onClick={() => verifyMode && setExpandedRow(isExpanded ? null : i)}>
                        {verifyMode && (
                          <td style={S.td}>
                            <span style={{ ...S.statusBubble, background: `${statusColor(v.status)}18`, color: statusColor(v.status), borderColor: `${statusColor(v.status)}30` }}>
                              {statusIcon(v.status)}
                            </span>
                          </td>
                        )}
                        <td style={{ ...S.td, fontWeight: 500, color: "#111827" }}>{line.category}</td>
                        <td style={{ ...S.td, fontFamily: mono }}>${line.volume.toLocaleString()}</td>
                        <td style={{ ...S.td, fontFamily: mono }}>{line.pctTotal.toFixed(2)}%</td>
                        <td style={{ ...S.td, fontFamily: mono }}>{line.reportedRate.toFixed(2)}% + ${line.reportedTxnFee.toFixed(2)}</td>
                        {verifyMode && (
                          <td style={{ ...S.td, fontFamily: mono, color: "#6b7280" }}>
                            {v.publishedRate.toFixed(2)}% + ${v.publishedTxnFee.toFixed(2)}
                          </td>
                        )}
                        {verifyMode && (
                          <td style={{ ...S.td, fontFamily: mono, fontWeight: 600, color: v.diffBps > 5 ? "#ef4444" : v.diffBps > 0 ? "#f59e0b" : "#22c55e" }}>
                            {v.diffBps > 0 ? `+${v.diffBps}` : v.diffBps} bps
                          </td>
                        )}
                        <td style={{ ...S.td, fontFamily: mono, color: "#ef4444" }}>${line.icCost.toFixed(2)}</td>
                        <td style={{ ...S.td, fontFamily: mono, color: "#059669", fontWeight: 600 }}>${line.marginToMerchant.toFixed(2)}</td>
                      </tr>
                      {/* EXPANDED DETAIL ROW */}
                      {verifyMode && isExpanded && (
                        <tr>
                          <td colSpan={9} style={S.expandedCell}>
                            <div style={S.expandedContent}>
                              <div style={S.expandedGrid}>
                                <div style={S.expandedCol}>
                                  <div style={S.expandedLabel}>Verification</div>
                                  <div style={{ ...S.expandedStatus, color: statusColor(v.status) }}>
                                    {statusIcon(v.status)} {v.status.charAt(0).toUpperCase() + v.status.slice(1)}
                                  </div>
                                  <p style={S.expandedMsg}>{v.message}</p>
                                </div>
                                <div style={S.expandedCol}>
                                  <div style={S.expandedLabel}>Published Program</div>
                                  <div style={S.expandedVal}>{v.program}</div>
                                  {v.hasRange && (
                                    <div style={S.expandedRange}>Valid range: {v.range.low}% – {v.range.high}%</div>
                                  )}
                                  <div style={S.expandedNotes}>{v.notes}</div>
                                </div>
                                <div style={S.expandedCol}>
                                  <div style={S.expandedLabel}>Dollar Impact</div>
                                  <div style={S.expandedImpact}>
                                    <div style={S.impactRow}>
                                      <span>Rate padding:</span>
                                      <span style={{ color: v.ratePadding > 0 ? "#ef4444" : "#22c55e", fontFamily: mono }}>${v.ratePadding.toFixed(2)}/mo</span>
                                    </div>
                                    <div style={S.impactRow}>
                                      <span>Txn fee padding:</span>
                                      <span style={{ color: v.txnPadding > 0 ? "#ef4444" : "#22c55e", fontFamily: mono }}>${v.txnPadding.toFixed(2)}/mo</span>
                                    </div>
                                    <div style={{ ...S.impactRow, borderTop: "1px solid #e5e7eb", paddingTop: 6, marginTop: 4, fontWeight: 600 }}>
                                      <span>Annual impact:</span>
                                      <span style={{ color: v.annualImpact > 0 ? "#ef4444" : "#22c55e", fontFamily: mono }}>${v.annualImpact.toFixed(0)}/yr</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              {v.commonPadding && (
                                <div style={S.paddingWarning}>
                                  <span style={S.paddingWarningIcon}>💡</span>
                                  <div>
                                    <strong>Common padding tactic:</strong> {v.commonPadding}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
                {/* TOTALS */}
                <tr style={S.totalRow}>
                  {verifyMode && <td style={S.td} />}
                  <td style={{ ...S.td, fontWeight: 700, color: "#111827" }}>Total</td>
                  <td style={{ ...S.td, fontFamily: mono, fontWeight: 700 }}>${MERCHANT.monthlyVolume.toLocaleString()}</td>
                  <td style={{ ...S.td, fontFamily: mono, fontWeight: 700 }}>100%</td>
                  <td style={S.td} />
                  {verifyMode && <td style={S.td} />}
                  {verifyMode && (
                    <td style={{ ...S.td, fontFamily: mono, fontWeight: 700, color: totalPadding > 0 ? "#ef4444" : "#22c55e" }}>
                      {totalPadding > 0 ? `$${totalPadding.toFixed(2)}/mo` : "Clean"}
                    </td>
                  )}
                  <td style={{ ...S.td, fontFamily: mono, fontWeight: 700, color: "#ef4444" }}>$550.52</td>
                  <td style={{ ...S.td, fontFamily: mono, fontWeight: 700, color: "#059669" }}>$731.98</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* BOTTOM PANELS */}
          <div style={S.bottomGrid}>
            {/* Fee Schedule */}
            <div style={S.bottomCard}>
              <h3 style={S.bottomTitle}>Fee Schedule</h3>
              <p style={S.bottomSub}>Monthly recurring + per-transaction fees</p>
              <table style={{ ...S.table, marginTop: 12 }}>
                <thead>
                  <tr>
                    <th style={S.th}>FEE</th>
                    <th style={S.th}>AMOUNT</th>
                    <th style={S.th}>TYPE</th>
                  </tr>
                </thead>
                <tbody>
                  {FEES.map((fee, i) => (
                    <tr key={i} style={S.tr}>
                      <td style={{ ...S.td, fontWeight: 500 }}>{fee.name}</td>
                      <td style={{ ...S.td, fontFamily: mono }}>${fee.amount.toFixed(2)}</td>
                      <td style={S.td}>
                        <span style={S.typeBadge}>{fee.type}</span>
                        {fee.note && <span style={S.feeNote}>{fee.note}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Rate Analysis */}
            <div style={{ ...S.bottomCard, borderColor: verifyMode ? "rgba(73,69,255,0.15)" : "#e5e7eb" }}>
              <h3 style={S.bottomTitle}>Rate Analysis</h3>
              <p style={S.bottomSub}>Merchant pricing vs actual cost basis</p>
              <div style={S.rateAnalysis}>
                <RateBar label="Merchant Effective Rate" value={3.42} maxVal={4} color="#6b7280" />
                <RateBar label="Blended IC + Assessments" value={1.47} maxVal={4} color="#ef4444" />
                <RateBar label="Gross Margin (Spread)" value={1.95} maxVal={4} color="#22c55e" />
                <RateBar label="Net Margin After Agent" value={1.06} maxVal={4} color="#4945FF" />
              </div>

              {verifyMode && totalPadding > 0 && (
                <div style={S.rateVerifyNote}>
                  <div style={S.rateVerifyIcon}>⚠</div>
                  <div>
                    <div style={S.rateVerifyTitle}>IC cost may include ~${totalPadding.toFixed(2)}/mo in padding</div>
                    <div style={S.rateVerifyText}>
                      If interchange is padded, your true blended IC is lower than reported, which means your actual margin is higher —
                      but that delta is going to North, not to Delt. Estimated annual leakage: <strong style={{ color: "#ef4444" }}>${annualPadding.toFixed(0)}/yr</strong>.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── FRAGMENT POLYFILL ──────────────────────────────────────────
function Fragment({ children }) {
  return children;
}

// ─── SUB COMPONENTS ─────────────────────────────────────────────
function KPI({ label, value, change, positive, sub }) {
  return (
    <div style={S.kpiCard}>
      <div style={S.kpiLabel}>{label}</div>
      <div style={S.kpiRow2}>
        <span style={S.kpiValue}>{value}</span>
        {change && <span style={{ ...S.kpiChange, color: positive ? "#059669" : "#ef4444" }}>{change}</span>}
      </div>
      {sub && <div style={S.kpiSub}>{sub}</div>}
    </div>
  );
}

function RateBar({ label, value, maxVal, color }) {
  return (
    <div style={S.rateBarWrap}>
      <div style={S.rateBarHeader}>
        <span style={S.rateBarLabel}>{label}</span>
        <span style={{ ...S.rateBarVal, color }}>{value.toFixed(2)}%</span>
      </div>
      <div style={S.rateBarTrack}>
        <div style={{ ...S.rateBarFill, width: `${(value / maxVal) * 100}%`, background: color }} />
      </div>
    </div>
  );
}

// ─── STYLES ─────────────────────────────────────────────────────
const S = {
  root: { fontFamily: sans, background: "#fff", color: "#111827", minHeight: "100vh", padding: "24px 32px", maxWidth: 1280, margin: "0 auto" },

  breadcrumb: { display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#6b7280", marginBottom: 4 },
  breadLink: { color: "#4945FF", fontWeight: 500, cursor: "pointer" },
  breadSep: { color: "#d1d5db" },
  breadCurrent: { color: "#6b7280" },
  backLink: { fontSize: 13, color: "#4945FF", cursor: "pointer", marginBottom: 20, fontWeight: 500 },

  merchantHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  merchantLeft: { display: "flex", alignItems: "center", gap: 12 },
  merchantName: { fontSize: 26, fontWeight: 700, margin: 0, color: "#111827" },
  badge: { fontSize: 12, fontWeight: 500, color: "#6b7280", background: "#f3f4f6", padding: "4px 10px", borderRadius: 6 },
  statusBadge: { fontSize: 12, fontWeight: 500, color: "#059669" },
  merchantActions: { display: "flex", gap: 10 },
  editBtn: { background: "#fff", border: "1px solid #e5e7eb", color: "#374151", fontSize: 13, fontWeight: 500, padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontFamily: sans },
  exportBtn: { background: "#4945FF", border: "none", color: "#fff", fontSize: 13, fontWeight: 600, padding: "8px 20px", borderRadius: 8, cursor: "pointer", fontFamily: sans },
  merchantMeta: { fontSize: 13, color: "#6b7280", marginBottom: 24 },

  kpiRow: { display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12, marginBottom: 28 },
  kpiCard: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px 18px" },
  kpiLabel: { fontSize: 12, color: "#6b7280", fontWeight: 500, marginBottom: 8 },
  kpiRow2: { display: "flex", alignItems: "baseline", gap: 8 },
  kpiValue: { fontSize: 24, fontWeight: 700, color: "#111827", fontFamily: mono, letterSpacing: "-0.02em" },
  kpiChange: { fontSize: 12, fontWeight: 600 },
  kpiSub: { fontSize: 11, color: "#9ca3af", marginTop: 4 },
  lensScore: { display: "flex", justifyContent: "center", margin: "4px 0" },

  tabBar: { display: "flex", gap: 0, borderBottom: "1px solid #e5e7eb", marginBottom: 24 },
  tab: { padding: "10px 20px", fontSize: 14, fontWeight: 500, color: "#6b7280", border: "none", borderBottom: "2px solid transparent", background: "none", cursor: "pointer", fontFamily: sans },
  tabActive: { color: "#4945FF", borderBottomColor: "#4945FF", fontWeight: 600 },

  content: {},

  sectionHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 700, margin: 0, color: "#111827" },
  sectionSub: { fontSize: 13, color: "#9ca3af", marginTop: 2 },

  verifyToggle: { display: "flex", alignItems: "center", gap: 8, padding: "8px 18px", borderRadius: 10, border: "1.5px solid #e5e7eb", background: "#fff", fontSize: 13, fontWeight: 600, fontFamily: sans, cursor: "pointer", color: "#374151", transition: "all 0.15s" },
  verifyToggleActive: { borderColor: "#4945FF", background: "rgba(73,69,255,0.04)", color: "#4945FF" },
  verifyIcon: { fontSize: 16 },

  // Verify banner
  verifyBanner: { border: "1px solid", borderRadius: 12, padding: "16px 20px", marginBottom: 20 },
  verifyBannerTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  verifyBannerLeft: { display: "flex", gap: 12, alignItems: "flex-start" },
  verifyBannerIcon: { fontSize: 22, marginTop: 1 },
  verifyBannerTitle: { fontSize: 14, fontWeight: 600, color: "#111827" },
  verifyBannerSub: { fontSize: 12, color: "#6b7280", marginTop: 3 },
  paddingCallout: { textAlign: "right", flexShrink: 0 },
  paddingLabel: { fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "#6b7280" },
  paddingVal: { fontSize: 24, fontWeight: 700, fontFamily: mono, color: "#ef4444", letterSpacing: "-0.02em" },
  paddingAnnual: { fontSize: 12, color: "#ef4444", fontFamily: mono, fontWeight: 600 },
  verifyBannerActions: { display: "flex", alignItems: "center", gap: 16, marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(0,0,0,0.06)" },
  bannerBtn: { fontSize: 12, fontWeight: 600, color: "#4945FF", background: "rgba(73,69,255,0.06)", border: "1px solid rgba(73,69,255,0.15)", padding: "5px 14px", borderRadius: 6, cursor: "pointer", fontFamily: sans },
  scheduleNote: { fontSize: 12, color: "#6b7280" },

  // Published rates panel
  schedulePanel: { background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 12, padding: "20px 24px", marginBottom: 20 },
  schedulePanelHeader: { marginBottom: 16 },
  schedulePanelTitle: { fontSize: 15, fontWeight: 700, margin: 0, color: "#111827" },
  schedulePanelSub: { fontSize: 12, color: "#9ca3af", marginTop: 3 },
  scheduleGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 10 },
  scheduleCard: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "12px 14px" },
  scheduleCardHeader: { display: "flex", alignItems: "center", gap: 8, marginBottom: 6 },
  networkDot: { width: 8, height: 8, borderRadius: "50%", flexShrink: 0 },
  scheduleCardName: { fontSize: 13, fontWeight: 600, color: "#111827" },
  scheduleCardRate: { fontSize: 16, fontWeight: 700, fontFamily: mono, color: "#111827", marginBottom: 4 },
  scheduleCardRange: { fontSize: 11, color: "#f59e0b", fontWeight: 500, marginBottom: 4 },
  scheduleCardProgram: { fontSize: 11, color: "#4945FF", fontWeight: 500, marginBottom: 4 },
  scheduleCardNotes: { fontSize: 11, color: "#6b7280", lineHeight: 1.4 },

  // Table
  tableWrap: { border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden", marginBottom: 24 },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "#6b7280", padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #e5e7eb", background: "#f9fafb" },
  tr: { borderBottom: "1px solid #f3f4f6" },
  td: { fontSize: 13, padding: "14px 16px", color: "#374151" },
  totalRow: { background: "#f9fafb", borderTop: "2px solid #e5e7eb" },

  statusBubble: { display: "inline-flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, borderRadius: "50%", fontSize: 12, fontWeight: 700, border: "1px solid" },

  // Expanded row
  expandedCell: { padding: 0, background: "#f9fafb" },
  expandedContent: { padding: "16px 20px" },
  expandedGrid: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginBottom: 12 },
  expandedCol: {},
  expandedLabel: { fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "#6b7280", marginBottom: 6 },
  expandedStatus: { fontSize: 14, fontWeight: 700, marginBottom: 6 },
  expandedMsg: { fontSize: 12, color: "#374151", lineHeight: 1.5, margin: 0 },
  expandedVal: { fontSize: 13, fontWeight: 600, color: "#111827", marginBottom: 4 },
  expandedRange: { fontSize: 11, color: "#f59e0b", fontWeight: 500, marginBottom: 4 },
  expandedNotes: { fontSize: 11, color: "#6b7280", lineHeight: 1.4 },
  expandedImpact: { display: "flex", flexDirection: "column", gap: 4 },
  impactRow: { display: "flex", justifyContent: "space-between", fontSize: 12, color: "#374151" },

  paddingWarning: { display: "flex", gap: 10, padding: "12px 16px", background: "rgba(73,69,255,0.04)", border: "1px solid rgba(73,69,255,0.1)", borderRadius: 8, fontSize: 12, color: "#374151", lineHeight: 1.5 },
  paddingWarningIcon: { flexShrink: 0, marginTop: 1 },

  // Bottom panels
  bottomGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 },
  bottomCard: { border: "1px solid #e5e7eb", borderRadius: 12, padding: "20px 24px" },
  bottomTitle: { fontSize: 16, fontWeight: 700, margin: 0, color: "#111827" },
  bottomSub: { fontSize: 13, color: "#9ca3af", margin: "2px 0 0" },
  typeBadge: { fontSize: 11, fontWeight: 500, color: "#4945FF", background: "rgba(73,69,255,0.08)", padding: "2px 8px", borderRadius: 4 },
  feeNote: { fontSize: 11, color: "#9ca3af", marginLeft: 8 },

  rateAnalysis: { display: "flex", flexDirection: "column", gap: 14, marginTop: 16 },
  rateBarWrap: {},
  rateBarHeader: { display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 },
  rateBarLabel: { fontSize: 13, fontWeight: 500, color: "#374151" },
  rateBarVal: { fontSize: 15, fontWeight: 700, fontFamily: mono },
  rateBarTrack: { height: 8, background: "#f3f4f6", borderRadius: 4, overflow: "hidden" },
  rateBarFill: { height: "100%", borderRadius: 4, transition: "width 0.4s ease" },

  rateVerifyNote: { display: "flex", gap: 10, marginTop: 16, padding: "12px 14px", background: "rgba(249,115,22,0.04)", border: "1px solid rgba(249,115,22,0.15)", borderRadius: 8 },
  rateVerifyIcon: { fontSize: 16, flexShrink: 0 },
  rateVerifyTitle: { fontSize: 13, fontWeight: 600, color: "#111827", marginBottom: 4 },
  rateVerifyText: { fontSize: 12, color: "#6b7280", lineHeight: 1.5 },
};