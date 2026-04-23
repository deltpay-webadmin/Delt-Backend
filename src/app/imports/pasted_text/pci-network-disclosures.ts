import { useState } from "react";

const T = {
  bg: "#FAFBFC", surface: "#FFFFFF", surfaceAlt: "#F4F5F7",
  border: "#E2E5EA", text: "#1A1D26", textSec: "#5A5F72", textDim: "#8C91A3",
  indigo: "#4318FF", indigoSoft: "#EDE8FF",
  green: "#0FAF62", greenSoft: "#E6F7EF",
  amber: "#E8850C", amberSoft: "#FEF4E6",
  red: "#DC2E3A", redSoft: "#FDE8EA",
  cyan: "#0891B2", cyanSoft: "#E6F6FA",
};
const mono = "'JetBrains Mono','Fira Code',monospace";
const sans = "'DM Sans','Segoe UI',system-ui,sans-serif";

/* ── PCI & NETWORKS ── */
const PCI = [
  { title: "PCI DSS 4.0.1", subtitle: "All v4.0 future-dated requirements fully enforced as of 2026.", items: [
    { item: "SAQ type & completion", type: "track", detail: "Per merchant: SAQ A/A-EP/B/C/D, completion status, expiration. Non-compliant merchants get ~$99/mo fee via Global Payments." },
    { item: "Quarterly ASV scans", type: "alert", detail: "Every 90 days. Track last scan, pass/fail, vulnerabilities, remediation. Auto-alert 14 days before expiry." },
    { item: "Non-compliance fee tracking", type: "track", detail: "Flag merchants charged PCI fees. Create outreach trigger. Track fee activation/deactivation." },
    { item: "MFA enforcement", type: "audit", detail: "PCI 4.0 requires MFA for ALL cardholder data access (not just remote). Validate Delt systems + merchant configs." },
    { item: "EMV / contactless status", type: "track", detail: "Per merchant terminal capability. Non-EMV = liability shift on fraud. Flag for upgrade outreach." },
    { item: "PCI documentation export", type: "audit", detail: "One-click export: SAQ, scan history, remediation, EMV, fees. Ready for Global Payments or network audit." },
  ]},
  { title: "Visa VAMP", subtitle: "Consolidated monitoring program. Lower thresholds effective Jan 2026.", items: [
    { item: "Per-merchant fraud-to-sales ratio", type: "alert", detail: "Track against VAMP thresholds. Alert at 80% of trigger. Intervention before breach prevents fines." },
    { item: "Portfolio aggregate monitoring", type: "alert", detail: "Global Payments bears liability as sponsor. Track portfolio-wide ratio. You want to intervene before Global does." },
    { item: "Fine exposure calculator", type: "track", detail: "Project monthly fine if merchant breaches. Fines escalate by duration/severity." },
    { item: "Remediation plan tracking", type: "audit", detail: "15 calendar day acknowledgment window. Track: plan submitted, approved, actions taken, compliance restored." },
  ]},
  { title: "Mastercard ECM & BRAM", subtitle: "ECM: 1.5% CB ratio or 100+ chargebacks/month. BRAM: high-risk categories.", items: [
    { item: "ECM threshold monitoring", type: "alert", detail: "Alert at 80% of either trigger (100 CBs/month AND 1.5% ratio). Escalating monthly fines." },
    { item: "BRAM category tracking", type: "track", detail: "Flag merchants in BRAM-monitored MCCs at boarding." },
    { item: "Dual-network threshold comparison", type: "track", detail: "Side-by-side per merchant: current CB ratio vs Visa VAMP vs MC ECM, trend, projected breach date." },
  ]},
  { title: "MATCH / TMF", subtitle: "Terminated Merchant File — 5-year blacklist.", items: [
    { item: "Boarding-time check", type: "compliance", detail: "Check every principal against MATCH at boarding. Block if match found." },
    { item: "Periodic re-screening", type: "alert", detail: "Re-check quarterly or when risk signals fire." },
    { item: "Placement risk tracking", type: "track", detail: "If Delt terminates for fraud/CBs/PCI, Global may MATCH-list. Track terminations, reasons, placement status." },
  ]},
  { title: "Network mandate calendar", subtitle: "Upcoming Visa/MC rule changes.", items: [
    { item: "CE 3.0 compelling evidence", type: "track", detail: "Required data fields for fraud representment (IP, device ID, shipping match). Per merchant: do we have these?" },
    { item: "MC authentication requirements", type: "track", detail: "Track 3DS/SCA enablement per merchant. Flag legacy auth flows." },
    { item: "Mandate tracker", type: "alert", detail: "Calendar: effective date, network, impact, required changes, responsible person, status. Review monthly." },
  ]},
];

/* ── STATE DISCLOSURES with actual required language ── */
const STATES = [
  { st: "CA", name: "California", status: "enforced", law: "SB 1235 + SB 362 (Jan 2026)", threshold: "$500k", aprReq: true, regReq: true, regBody: "DFPI",
    contractMod: true, contractNote: "State-specific addendum required. DFPI-formatted APR integrated into agreement. Cannot use 'factor rate' without simultaneous APR. Re-disclosure if pricing quoted during application.",
    disclosureItems: [
      "Total amount of funds provided to the recipient",
      "Total dollar cost of the financing (total of all payments minus amount funded)",
      "Term or estimated term of the financing",
      "Method, frequency, and amount of each payment",
      "A description of all other potential fees and charges not included in the finance charge",
      "Total repayment amount (total amount funded + total dollar cost)",
      "Estimated annual percentage rate (APR) — MANDATORY, calculated per DFPI regulations",
      "Prepayment policy: whether recipient may prepay and any associated costs or savings",
    ],
    notes: "SB 362 (2026): Prohibits presenting 'factor rate' or 'interest' without simultaneous compliant APR disclosure. APR must be re-disclosed if any rate/cost is quoted during application. DFPI has examination authority. Violations = UDAAP. Private right of action under UCL.",
    cofRestriction: "COJ ruled unconstitutional (1978). Rosenthal FDCPA extends consumer protections to small biz MCA debt (Jan 2025).",
    forumRestriction: "No mandatory forum override, but California courts have jurisdiction for CA merchants.",
  },
  { st: "NY", name: "New York", status: "enforced", law: "CFDL (2023) + FAIR Act (Feb 2026)", threshold: "$2.5M", aprReq: true, regReq: false, regBody: "DFS",
    contractMod: true, contractNote: "Broker compensation disclosure section required when agent/ISO involved. CFDL-formatted disclosures as integrated schedule. COJ exclusion must be present for out-of-state merchants.",
    disclosureItems: [
      "Total amount of funds provided",
      "Disbursement amount (after deduction of any fees withheld)",
      "Total finance charge (total repayment amount minus disbursement amount)",
      "Estimated annual percentage rate (APR) — MANDATORY",
      "Total repayment amount",
      "Payment amounts and frequency (or estimated payment amounts for variable payments)",
      "Description of all other potential fees or charges",
      "Prepayment penalties or charges, if any",
      "If a broker is involved: written disclosure of how and by whom the broker will be compensated",
    ],
    notes: "FAIR Act (Feb 17, 2026) expanded DFS enforcement. Any time a rate or finance charge is quoted during application, APR must be simultaneously stated. Provider must state APR whenever referencing cost during the application process, not just at closing.",
    cofRestriction: "COJ banned against out-of-state merchants (2019 reform, CPLR § 3218). Still permitted for in-state NY businesses.",
    forumRestriction: "No mandatory forum override, but most MCA litigation is litigated in NY regardless of contract terms.",
  },
  { st: "VA", name: "Virginia", status: "enforced", law: "HB 1027 / SB 1195", threshold: "$500k", aprReq: false, regReq: true, regBody: "State Corp Commission",
    contractMod: true, contractNote: "Most restrictive state. Mandatory VA jurisdiction (overrides FL forum clause). COJ prohibited in contract. SCC registration # must be displayed. 3-business-day review period before execution.",
    disclosureItems: [
      "Total amount of funds provided",
      "Total amount to be paid to the provider (purchased amount)",
      "Total dollar cost of the financing",
      "Manner, frequency, and amount of each payment",
      "A description of all other potential fees and charges",
      "Any costs or discounts associated with prepayment",
      "The amount of any fees for returned payments or late charges",
      "Whether the provider will sell, assign, or transfer the agreement to a third party",
      "Collateral requirements or security interests, if any",
    ],
    notes: "Unique 3-business-day review period before contract execution. AG has taken enforcement action under state consumer protection. No APR required but 9 disclosure items mandatory.",
    cofRestriction: "COJ provisions expressly prohibited in sales-based financing agreements.",
    forumRestriction: "All court actions must be brought in Virginia. Forum-selection clauses requiring actions outside VA are unenforceable.",
  },
  { st: "UT", name: "Utah", status: "enforced", law: "HB 198 — Sales-Based Financing Disclosure Act", threshold: "$1M", aprReq: false, regReq: true, regBody: "Dept of Commerce",
    contractMod: false,
    disclosureItems: [
      "Total amount of funds provided",
      "Total amount to be repaid (purchased amount)",
      "Estimated total cost of the financing",
      "Estimated annualized rate or cost",
      "Payment amounts and frequency",
      "Description of any fees not included in the estimated cost",
      "Description of prepayment policies",
      "Whether the contract includes a reconciliation provision",
      "Whether the contract includes a confession of judgment provision",
    ],
    notes: "Private right of action — businesses can sue without waiting for regulator. Licensing required with Dept of Commerce. Disclosure must state whether reconciliation and COJ provisions exist.",
    cofRestriction: "No explicit COJ ban, but disclosure must disclose whether COJ exists.",
    forumRestriction: "No mandatory forum override.",
  },
  { st: "CT", name: "Connecticut", status: "enforced", law: "SB 1032 (Jul 2024)", threshold: "$250k", aprReq: false, regReq: true, regBody: "Banking Dept",
    contractMod: false,
    disclosureItems: [
      "Total amount of funds provided",
      "Total finance charge",
      "Total repayment amount",
      "Manner, frequency, and amount of each payment",
      "All fees and charges",
      "Estimated term",
      "Prepayment terms",
    ],
    notes: "Distinct cost calculation for sales-based financing. Annual registration. Exempts 5 or fewer CT transactions/yr.",
    cofRestriction: "No explicit COJ ban in disclosure law.",
    forumRestriction: "No mandatory forum override.",
  },
  { st: "TX", name: "Texas", status: "enforced", law: "HB 700 (Sep 2025)", threshold: "No cap", aprReq: false, regReq: true, regBody: "OCCC",
    contractMod: false,
    disclosureItems: [
      "Total amount of funds provided",
      "Total finance charge",
      "Total repayment amount",
      "All potential fees",
      "Payment amounts and frequency",
      "Repayment terms",
    ],
    notes: "Registration required by Dec 31, 2026 (annual renewal Jan 31). No de minimis exemption. Largest new market.",
    cofRestriction: "TX generally does not permit COJ in most circumstances.",
    forumRestriction: "No mandatory forum override.",
  },
  { st: "MO", name: "Missouri", status: "enforced", law: "SB 1100", threshold: "$500k", aprReq: false, regReq: true, regBody: "Div of Finance",
    contractMod: false,
    disclosureItems: ["Total funded", "Total cost", "Total repayment", "Fees", "Payment amounts and frequency", "Prepayment terms"],
    notes: "Combined disclosure + licensing. Unlicensed provider contracts may be voidable.",
    cofRestriction: "No explicit COJ ban.", forumRestriction: "No mandatory forum override.",
  },
  { st: "LA", name: "Louisiana", status: "enforced", law: "Revenue-Based Financing Disclosure Act (2025)", threshold: "$500k", aprReq: false, regReq: false, regBody: "OFI",
    contractMod: false,
    disclosureItems: ["Annual cost metric", "Total repayment amount", "Payment frequency and amount"],
    notes: "No registration requirement. Bipartisan support.",
    cofRestriction: "No explicit COJ ban.", forumRestriction: "No mandatory forum override.",
  },
  { st: "MD", name: "Maryland", status: "enforced", law: "HB 1297 (2023)", threshold: "$2M", aprReq: true, regReq: false, regBody: "OFR",
    contractMod: false,
    disclosureItems: ["Total funded", "Total dollar cost", "Estimated APR — MANDATORY", "Total repayment", "Payment schedule", "Fees", "Prepayment terms"],
    notes: "Modeled on CA SB 1235. HB 1007 (2026 session) would expand further if signed.",
    cofRestriction: "No explicit COJ ban.", forumRestriction: "No mandatory forum override.",
  },
  { st: "FL", name: "Florida", status: "pending", law: "Pending legislation", threshold: "TBD", aprReq: false, regReq: false, regBody: "OFR",
    contractMod: false, disclosureItems: [],
    notes: "No enacted law. FDUTPA used against MCA providers. Critical for Delt — Miami-based merchants have no MCA-specific protections yet. Monitor sessions.",
    cofRestriction: "FL bans COJ entirely.", forumRestriction: "No mandatory override.",
  },
  { st: "NJ", name: "New Jersey", status: "pending", law: "S1760 (2026-2027)", threshold: "$500k", aprReq: true, regReq: false, regBody: "Commissioner of Banking",
    contractMod: false, disclosureItems: ["Mandatory APR via Reg Z methodology", "Broker fee disclosure", "Total funded", "Total repayment", "Payment terms"],
    notes: "Reintroduced Jan 2026. De minimis: 5 NJ deals/yr. Passed committee in prior session.",
    cofRestriction: "NJ prohibits COJ in business financing contracts (2020).", forumRestriction: "No mandatory override.",
  },
  { st: "IL", name: "Illinois", status: "pending", law: "Expected 2026-2027", threshold: "TBD", aprReq: false, regReq: false, regBody: "IDFPR",
    contractMod: false, disclosureItems: [],
    notes: "Consumer Fraud Act applied in commercial contexts. NAAG Working Group member.",
    cofRestriction: "IL allows COJ with procedural requirements.", forumRestriction: "No mandatory override.",
  },
];

/* ── VENDORS ── */
const VENDORS = [
  { id: "global", name: "Global Payments", role: "Processor / Sponsor", color: T.indigo, obligations: [
    { item: "ISO registration renewal", type: "deadline", detail: "Annual $5k fee. Renew with Visa/MC through Global. Track date." },
    { item: "Merchant boarding standards", type: "compliance", detail: "KYC, business verification, prohibited MCCs, volume projections." },
    { item: "Reserve account monitoring", type: "track", detail: "Rolling reserves on high-risk merchants. Track balance, hold %, release schedule." },
    { item: "CB ratio reporting", type: "alert", detail: "Global reports to Visa/MC. They bear liability if portfolio triggers VAMP/ECM." },
    { item: "PCI validation", type: "audit", detail: "Global requires merchant PCI compliance. Non-compliance fees flow through Delt." },
    { item: "Settlement SLAs", type: "track", detail: "Settlement timing, next-day eligibility, holds from risk dept." },
    { item: "Processing agreement", type: "deadline", detail: "Contract term, volume commitments, rate schedule, renewal windows." },
  ]},
  { id: "plaid", name: "Plaid", role: "Banking / Identity / CRA", color: T.green, obligations: [
    { item: "Permissible purpose", type: "compliance", detail: "Documented per product per merchant (Auth, Transactions, IDV, CRA, Screening, Monitor)." },
    { item: "Consent flows", type: "compliance", detail: "Plaid Link completion with proper consent. Store records." },
    { item: "Biometric retention (IDV)", type: "deadline", detail: "BIPA-style schedules. Track merchants with IDV, destruction dates." },
    { item: "Security questionnaire", type: "deadline", detail: "Annual renewal. Track last/next dates." },
    { item: "Data minimization", type: "compliance", detail: "Only access data needed for stated purpose. Audit calls vs purpose." },
    { item: "FCRA (CRA product)", type: "compliance", detail: "Adverse action notices required when CRA data influences decline." },
  ]},
  { id: "crs", name: "CRS Credit", role: "Credit / Lien Search", color: T.amber, obligations: [
    { item: "Permissible purpose per pull", type: "audit", detail: "Log merchant, date, purpose code, analyst. Retain 5+ years." },
    { item: "Adverse action notices", type: "generate", detail: "Auto-generate within 30 days when report influences decline." },
    { item: "Dispute handling", type: "compliance", detail: "FCRA: investigate within 30 days. Track disputes and resolution." },
    { item: "Pull reconciliation", type: "track", detail: "Monthly count vs billing. Flag anomalies." },
  ]},
  { id: "datamerch", name: "DataMerch", role: "Stacking Detection", color: T.red, obligations: [
    { item: "Default reporting", type: "compliance", detail: "Report Delt defaults back to consortium. Track confirmation." },
    { item: "Usage restrictions", type: "compliance", detail: "Underwriting/monitoring only. No external sharing or marketing." },
    { item: "Alert response SLA", type: "track", detail: "Track who reviewed, action taken, outcome on stack flags." },
    { item: "Sync freshness", type: "track", detail: "Alert if > 48hr stale. Stale = missed stacking alerts." },
  ]},
];

/* ── CONTRACT HEALTH (renamed from recharacterization) ── */
const HEALTH_FACTORS = [
  { id: "f1", title: "Reconciliation provision", safe: "Genuine & available regardless of default", mid: "Exists but blocked by default provisions", risk: "Illusory or absent",
    detail: "Can the merchant actually adjust payments when revenue drops? If reconciliation is blocked whenever the merchant is in 'default' (missed payment, covenant breach), courts call it illusory.", caselaw: "J.P.R. Mechanical (2025); AFK v. Haven (2024)" },
  { id: "f2", title: "Fixed term", safe: "No term — payments tied to revenue %", mid: "No stated term but calculable from fixed daily amount", risk: "Stated maturity or fixed schedule",
    detail: "If total owed / daily payment = a calculable number of days, courts treat it as a fixed term loan.", caselaw: "AFK v. Haven (2024); J.P.R. Mechanical at *8" },
  { id: "f3", title: "Business failure risk", safe: "Funder bears loss if merchant closes", mid: "Limited recourse (security interest only)", risk: "Absolute repayment regardless of failure",
    detail: "In a real receivables purchase, the buyer loses money if the business fails. If repayment is guaranteed no matter what, it's a loan.", caselaw: "In re McKenzie (2024); In re IVF Orlando (2025)" },
  { id: "f4", title: "Personal guarantee", safe: "No personal guarantee", mid: "Limited (performance only, not payment)", risk: "Full guarantee of repayment",
    detail: "If the owner must cover shortfalls from personal funds, the funder doesn't bear real risk.", caselaw: "FTC v. RCG Advances (2023); In re Anadrill (2026)" },
  { id: "f5", title: "Identified receivables", safe: "Specific receivables identified", mid: "General category ('card receipts')", risk: "No identification — just fixed daily payment",
    detail: "In a real sale, the buyer acquires identifiable revenue streams. No identification = 'significant indicator of a loan.'", caselaw: "J.P.R. Mechanical at *9 (citing Fleetwood v. Ram Cap)" },
  { id: "f6", title: "UCC / security interest", safe: "No UCC or only on purchased receivables", mid: "UCC on all accounts receivable", risk: "Blanket lien on all assets + equipment",
    detail: "A security interest beyond the purchased receivables looks like secured lending, not a purchase.", caselaw: "FTC v. RCG Advances (2023); In re Anadrill at *5" },
];

/* ── DOCUMENT STORAGE CATEGORIES ── */
const DOC_CATEGORIES = [
  { cat: "Contracts & templates", docs: ["Base MCA agreement (current version)", "Virginia state addendum", "California state addendum", "New York state addendum", "Disclosure templates by state (CA, NY, VA, UT, CT, TX, MO, LA, MD)", "Personal guarantee (limited performance)", "ACH authorization form"] },
  { cat: "Registrations & licenses", docs: ["Global Payments ISO registration (Visa)", "Global Payments ISO registration (Mastercard)", "Virginia SCC registration", "Utah Dept of Commerce license", "Connecticut Banking Dept registration", "Texas OCCC registration (due Dec 31, 2026)", "Missouri Div of Finance license"] },
  { cat: "Vendor agreements", docs: ["Global Payments processing agreement", "Plaid data processing agreement", "Plaid vendor security questionnaire (completed)", "CRS Credit service agreement", "DataMerch consortium membership agreement", "FiCoSo UCC filing service agreement", "ACH.com origination agreement"] },
  { cat: "Policies & plans", docs: ["GLBA written information security plan", "Privacy policy (Plaid-compliant, CCPA/GLBA)", "Data breach incident response plan", "Biometric data retention & destruction schedule", "UDAAP marketing review documentation", "BSA/AML KYC policy"] },
  { cat: "Regulatory references", docs: ["Visa Core Rules (current edition)", "Mastercard Security Rules & Procedures", "PCI DSS 4.0.1 standard", "Nacha Operating Rules (ACH)", "NY CFDL final regulations (DFS)", "CA SB 362 + DFPI implementing regs", "VA HB 1027 full text", "Pullman & Comley recharacterization analysis (Feb 2026)"] },
];

/* ── RESEARCH LIBRARY ── */
const RESEARCH = [
  { topic: "MCA legal structure", sources: ["Pullman & Comley — 'When Is a Merchant Cash Advance Really a Loan?' (Feb 2026)", "Fleetwood Services v. Ram Capital Funding (2d Cir. 2023)", "In re J.P.R. Mechanical Inc. (Bankr. S.D.N.Y. May 2025)", "In re IVF Orlando, Inc. (Bankr. M.D. Fla. Oct 2025)", "In re Anadrill Directional Services (Bankr. S.D. Tex. Jan 2026)", "In re Butler Trucking LLC (Bankr. N.D. Ohio Jul 2025)", "Platinum Rapid Funding — personal guarantee mirror rule", "Colonial Funding — guarantor obligations scope"] },
  { topic: "State disclosure laws", sources: ["Onyx IQ — State-by-State Disclosure Map (updated 2026)", "Credible Law — MCA Laws by State (2026 Legal Guide)", "Venable LLP — State Commercial Financing Disclosure Laws (Mar 2026)", "DLA Piper — State Disclosure & Registration Overview (2023)", "Buchalter — CA SB 362 Analysis (Feb 2026)", "Grant Phillips Law — NY CFDL Final Rules Analysis", "Mayer Brown — Virginia HB 1027 Analysis"] },
  { topic: "Federal regulation", sources: ["CFPB — State Disclosure Laws Non-Preemption Determination (CA, NY, UT, VA)", "FTC Section 5 — Commercial financing enforcement posture", "Dodd-Frank Section 1071 — Small business data collection (compliance deadline pushed to Jan 2028)", "Dilendorf Law — Regulatory Risks for ISOs in Payment Processing (Mar 2026)"] },
  { topic: "Card network compliance", sources: ["Visa Core Rules and Product/Service Rules (Oct 2025 edition)", "Mastercard Security Rules & Procedures Merchant Edition (Feb 2026)", "Decta — How Visa/MC Ensure Compliance: 2026 Changes", "PCI DSS 4.0.1 — PCI SSC official documentation"] },
  { topic: "Confession of judgment", sources: ["NY CPLR § 3218 — 2019 reform (ban on out-of-state COJ)", "Bloomberg 2018 investigation — 25,000+ COJ filings in NY", "NJ COJ ban in business financing (2020)", "CA COJ unconstitutional (1978)", "VA HB 1027 — express COJ prohibition in sales-based financing", "State-by-state COJ status tracker"] },
];

/* ── SELF-AUDIT ── */
const AUDIT_ITEMS = [
  { category: "PCI DSS", items: [
    { q: "All merchants have SAQ type assigned", f: "a1" }, { q: "ASV scans on schedule", f: "a2" }, { q: "Non-compliance fees tracked", f: "a3" }, { q: "MFA enforced", f: "a4" }, { q: "EMV status tracked", f: "a5" },
  ]},
  { category: "Card networks", items: [
    { q: "VAMP thresholds monitored per merchant", f: "b1" }, { q: "ECM monitoring active", f: "b2" }, { q: "MATCH check at boarding + periodic", f: "b3" }, { q: "Mandate calendar maintained", f: "b4" }, { q: "CE 3.0 data available", f: "b5" },
  ]},
  { category: "Contract health", items: [
    { q: "Reconciliation genuine & available regardless of default", f: "c1" }, { q: "No fixed term in contract", f: "c2" }, { q: "Business failure risk on purchaser", f: "c3" }, { q: "Guarantee limited to performance", f: "c4" }, { q: "Receivables specifically identified", f: "c5" }, { q: "UCC limited to receivables only", f: "c6" },
  ]},
  { category: "State disclosures", items: [
    { q: "Merchant state identified at intake", f: "d1" }, { q: "Correct template auto-selected", f: "d2" }, { q: "Delivery timestamped + acknowledged", f: "d3" }, { q: "Renewal re-disclosure triggers active", f: "d4" }, { q: "State registrations current (TX, UT, VA, CT, MO)", f: "d5" }, { q: "Broker compensation disclosed (NY, CA)", f: "d6" },
  ]},
  { category: "Federal", items: [
    { q: "FCRA adverse action notices on declines", f: "e1" }, { q: "OFAC screening at boarding", f: "e2" }, { q: "KYC verification tracked", f: "e3" }, { q: "UDAAP marketing review documented", f: "e4" },
  ]},
  { category: "Data & privacy", items: [
    { q: "GLBA security plan current", f: "f1" }, { q: "CCPA request workflow exists", f: "f2" }, { q: "Vendor DPAs current", f: "f3" }, { q: "Breach response plan reviewed < 12mo", f: "f4" }, { q: "Biometric retention schedule documented", f: "f5" },
  ]},
  { category: "Vendors", items: [
    { q: "Global Payments registration tracked", f: "g1" }, { q: "Global reserves monitored", f: "g2" }, { q: "Plaid permissible purpose logged", f: "g3" }, { q: "Plaid security questionnaire current", f: "g4" }, { q: "CRS pulls reconciled monthly", f: "g5" }, { q: "DataMerch defaults reported", f: "g6" }, { q: "DataMerch sync < 48hr", f: "g7" },
  ]},
  { category: "ACH / Nacha", items: [
    { q: "Authorization on file for every debit", f: "h1" }, { q: "Return rate vs Nacha limits", f: "h2" }, { q: "R10/R07 flagged, no re-presentment", f: "h3" }, { q: "WEB fraud detection documented", f: "h4" },
  ]},
];

/* ── COMPONENT ── */
const Tag = ({ type }) => {
  const m = { deadline: [T.redSoft, T.red], alert: [T.amberSoft, T.amber], compliance: [T.cyanSoft, T.cyan], track: [T.surfaceAlt, T.textSec], audit: [T.greenSoft, T.green], generate: [T.indigoSoft, T.indigo] };
  const [bg, fg] = m[type] || [T.surfaceAlt, T.textDim];
  return <span style={{ fontSize: 9, fontFamily: mono, padding: "2px 6px", borderRadius: 3, background: bg, color: fg }}>{type}</span>;
};

const Card = ({ children, s }) => <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "12px 14px", marginBottom: 5, ...s }}>{children}</div>;

export default function ComplianceHub() {
  const [tab, setTab] = useState("pci");
  const [vendorId, setVendorId] = useState("global");
  const [stateFilter, setStateFilter] = useState("all");
  const [expandedState, setExpandedState] = useState(null);
  const [auditState, setAuditState] = useState({});
  const [healthState, setHealthState] = useState({});

  const vendor = VENDORS.find(v => v.id === vendorId);
  const filteredStates = stateFilter === "all" ? STATES : STATES.filter(s => s.status === stateFilter);

  const totalAudit = AUDIT_ITEMS.reduce((s, c) => s + c.items.length, 0);
  const pass = Object.values(auditState).filter(v => v === "pass").length;
  const fail = Object.values(auditState).filter(v => v === "fail").length;
  const na = Object.values(auditState).filter(v => v === "na").length;
  const pct = (pass + fail) > 0 ? Math.round((pass / (pass + fail)) * 100) : 0;

  const hAssessed = Object.keys(healthState).length;
  const hRisk = Object.values(healthState).filter(v => v === "risk").length;
  const hSafe = Object.values(healthState).filter(v => v === "safe").length;
  const hMid = Object.values(healthState).filter(v => v === "mid").length;
  const hLevel = hAssessed < 3 ? "---" : hRisk >= 3 ? "High risk" : (hRisk >= 2 || (hRisk >= 1 && hMid >= 2)) ? "Elevated" : "Defensible";
  const hColor = hLevel.includes("High") ? T.red : hLevel === "Elevated" ? T.amber : hLevel === "Defensible" ? T.green : T.textDim;

  const TABS = [
    { id: "pci", label: "PCI & networks" },
    { id: "states", label: "State disclosures" },
    { id: "health", label: "Contract health" },
    { id: "vendors", label: "Vendors" },
    { id: "docs", label: "Documents" },
    { id: "research", label: "Research" },
    { id: "audit", label: "Self-audit" },
  ];

  return (
    <div style={{ background: T.bg, minHeight: "100vh", fontFamily: sans, color: T.text }}>
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: "18px 24px 0" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <div style={{ width: 22, height: 22, borderRadius: 5, background: `linear-gradient(135deg, ${T.indigo}, #7B61FF)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: "#fff", fontFamily: mono }}>D</div>
            <span style={{ fontSize: 10, fontWeight: 700, color: T.textDim, fontFamily: mono, letterSpacing: "0.05em" }}>DELT PAY — COMPLIANCE HUB</span>
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 800, margin: "6px 0 3px", letterSpacing: "-0.02em" }}>Compliance</h1>
          <p style={{ fontSize: 11, color: T.textSec, margin: "0 0 12px", lineHeight: 1.5, maxWidth: 580 }}>
            One-stop shop: PCI & card networks, state disclosure laws with required language, contract health assessment,
            vendor obligations, document storage, research library, and self-audit.
          </p>
          <div style={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                padding: "7px 12px", fontSize: 10, fontWeight: 600, fontFamily: mono,
                background: tab === t.id ? T.indigoSoft : "transparent",
                color: tab === t.id ? T.indigo : T.textDim,
                border: "none", cursor: "pointer", borderRadius: 5,
              }}>{t.label}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "14px 24px 50px" }}>

        {/* ═══ PCI & NETWORKS ═══ */}
        {tab === "pci" && PCI.map((sec, si) => (
          <div key={si} style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{sec.title}</div>
              <div style={{ fontSize: 10, color: T.textDim }}>{sec.subtitle}</div>
            </div>
            {sec.items.map((it, ii) => (
              <Card key={ii}><div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                <span style={{ fontSize: 11, fontWeight: 700 }}>{it.item}</span><Tag type={it.type} />
              </div><p style={{ fontSize: 10, color: T.textSec, lineHeight: 1.5, margin: 0 }}>{it.detail}</p></Card>
            ))}
          </div>
        ))}

        {/* ═══ STATE DISCLOSURES ═══ */}
        {tab === "states" && (
          <div>
            <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
              {["all", "enforced", "pending"].map(f => (
                <button key={f} onClick={() => setStateFilter(f)} style={{
                  padding: "4px 10px", borderRadius: 4, fontSize: 10, fontWeight: 600, fontFamily: mono, cursor: "pointer",
                  border: `1px solid ${stateFilter === f ? T.indigo + "40" : T.border}`,
                  background: stateFilter === f ? T.indigoSoft : T.surface,
                  color: stateFilter === f ? T.indigo : T.textSec,
                }}>{f === "all" ? `All (${STATES.length})` : f === "enforced" ? `Enforced (${STATES.filter(s => s.status === "enforced").length})` : `Pending (${STATES.filter(s => s.status === "pending").length})`}</button>
              ))}
            </div>
            {filteredStates.map(s => {
              const isExpanded = expandedState === s.st;
              return (
                <Card key={s.st} s={{ cursor: "pointer" }}>
                  <div onClick={() => setExpandedState(isExpanded ? null : s.st)}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 14, fontWeight: 800, fontFamily: mono, color: T.indigo, width: 24 }}>{s.st}</span>
                      <span style={{ fontSize: 12, fontWeight: 700 }}>{s.name}</span>
                      <span style={{ fontSize: 8, fontFamily: mono, padding: "2px 5px", borderRadius: 3, background: s.status === "enforced" ? T.greenSoft : T.amberSoft, color: s.status === "enforced" ? T.green : T.amber }}>{s.status}</span>
                      {s.aprReq && <span style={{ fontSize: 8, fontFamily: mono, padding: "2px 5px", borderRadius: 3, background: T.redSoft, color: T.red }}>APR req</span>}
                      {s.regReq && <span style={{ fontSize: 8, fontFamily: mono, padding: "2px 5px", borderRadius: 3, background: T.cyanSoft, color: T.cyan }}>registration</span>}
                      {s.contractMod && <span style={{ fontSize: 8, fontFamily: mono, padding: "2px 5px", borderRadius: 3, background: T.indigoSoft, color: T.indigo }}>contract addendum</span>}
                      <span style={{ marginLeft: "auto", fontSize: 10, color: T.textDim }}>{isExpanded ? "\u25B2" : "\u25BC"}</span>
                    </div>
                    <div style={{ display: "flex", gap: 16, fontSize: 10, color: T.textSec }}>
                      <span><span style={{ color: T.textDim }}>Law:</span> {s.law}</span>
                      <span><span style={{ color: T.textDim }}>Threshold:</span> {s.threshold}</span>
                      <span><span style={{ color: T.textDim }}>Regulator:</span> {s.regBody}</span>
                    </div>
                  </div>
                  {isExpanded && (
                    <div style={{ marginTop: 10, borderTop: `1px solid ${T.border}`, paddingTop: 10 }}>
                      {s.contractMod && (
                        <div style={{ padding: 10, borderRadius: 6, background: T.indigoSoft, marginBottom: 8 }}>
                          <div style={{ fontSize: 9, fontFamily: mono, fontWeight: 700, color: T.indigo, marginBottom: 3 }}>Contract modification required</div>
                          <p style={{ fontSize: 10, color: T.textSec, lineHeight: 1.5, margin: 0 }}>{s.contractNote}</p>
                        </div>
                      )}
                      {s.disclosureItems.length > 0 && (
                        <div style={{ marginBottom: 8 }}>
                          <div style={{ fontSize: 9, fontFamily: mono, fontWeight: 700, color: T.green, marginBottom: 4 }}>Required disclosure items</div>
                          {s.disclosureItems.map((d, di) => (
                            <div key={di} style={{ display: "flex", gap: 6, marginBottom: 3, paddingLeft: 4 }}>
                              <span style={{ color: T.green, fontSize: 8, marginTop: 3, flexShrink: 0 }}>{"\u2713"}</span>
                              <span style={{ fontSize: 10, color: T.textSec, lineHeight: 1.4 }}>{d}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <p style={{ fontSize: 10, color: T.textSec, lineHeight: 1.5, margin: "0 0 6px" }}>{s.notes}</p>
                      <div style={{ display: "flex", gap: 16, fontSize: 9, color: T.textDim }}>
                        <span><span style={{ fontWeight: 700 }}>COJ:</span> {s.cofRestriction}</span>
                      </div>
                      <div style={{ fontSize: 9, color: T.textDim, marginTop: 2 }}>
                        <span style={{ fontWeight: 700 }}>Forum:</span> {s.forumRestriction}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
            <div style={{ marginTop: 10, padding: 10, borderRadius: 6, background: T.amberSoft, border: `1px solid ${T.amber}25` }}>
              <p style={{ fontSize: 10, color: T.textSec, lineHeight: 1.5, margin: 0 }}><span style={{ fontWeight: 700, color: T.amber }}>MCAs are not loans.</span> These are commercial financing disclosure laws, not usury regulations. Usury applies only if a court reclassifies the contract (see Contract Health tab). ~35-40 states have no MCA-specific laws. CRM: identify merchant operating state at intake, auto-select template, generate with deal terms, deliver, capture timestamped acknowledgment, retain 4+ years.</p>
            </div>
          </div>
        )}

        {/* ═══ CONTRACT HEALTH ═══ */}
        {tab === "health" && (
          <div>
            <div style={{ padding: 10, borderRadius: 6, background: T.surfaceAlt, marginBottom: 12 }}>
              <p style={{ fontSize: 11, color: T.textSec, lineHeight: 1.55, margin: 0 }}>
                <span style={{ fontWeight: 700 }}>What is this?</span> Courts can look at an MCA contract and decide it's actually a loan in disguise.
                If that happens, usury laws apply (your factor rate becomes a 150-300%+ APR), the contract can be voided, and in bankruptcy, payments you already collected can be clawed back.
                These six factors are what courts use to make that decision. Run this against every deal at underwriting and retroactively against existing deals.
              </p>
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              {[
                { label: "Assessed", val: `${hAssessed}/6`, color: T.textSec, bg: T.surfaceAlt },
                { label: "Risk factors", val: hRisk, color: T.red, bg: hRisk > 0 ? T.redSoft : T.surfaceAlt },
                { label: "Safe factors", val: hSafe, color: T.green, bg: hSafe > 0 ? T.greenSoft : T.surfaceAlt },
                { label: "Assessment", val: hLevel, color: hColor, bg: hLevel.includes("High") ? T.redSoft : hLevel === "Elevated" ? T.amberSoft : hLevel === "Defensible" ? T.greenSoft : T.surfaceAlt },
              ].map((m, i) => (
                <div key={i} style={{ flex: 1, padding: "8px 10px", borderRadius: 6, background: m.bg }}>
                  <div style={{ fontSize: 8, fontFamily: mono, color: T.textDim, marginBottom: 2 }}>{m.label}</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: m.color }}>{m.val}</div>
                </div>
              ))}
            </div>
            {HEALTH_FACTORS.map(f => (
              <Card key={f.id}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 3 }}>{f.title}</div>
                <p style={{ fontSize: 10, color: T.textSec, lineHeight: 1.5, margin: "0 0 3px" }}>{f.detail}</p>
                <div style={{ fontSize: 9, fontFamily: mono, color: T.textDim, marginBottom: 6 }}>{f.caselaw}</div>
                <div style={{ display: "flex", gap: 3 }}>
                  {[["safe", f.safe], ["mid", f.mid], ["risk", f.risk]].map(([lv, lb]) => (
                    <button key={lv} onClick={() => setHealthState(p => ({ ...p, [f.id]: p[f.id] === lv ? undefined : lv }))} style={{
                      padding: "3px 8px", borderRadius: 4, fontSize: 9, fontWeight: 600, cursor: "pointer", fontFamily: sans,
                      border: `1px solid ${healthState[f.id] === lv ? (lv === "safe" ? T.green : lv === "risk" ? T.red : T.amber) + "50" : T.border}`,
                      background: healthState[f.id] === lv ? (lv === "safe" ? T.greenSoft : lv === "risk" ? T.redSoft : T.amberSoft) : T.surface,
                      color: healthState[f.id] === lv ? (lv === "safe" ? T.green : lv === "risk" ? T.red : T.amber) : T.textDim,
                    }}>{lb}</button>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* ═══ VENDORS ═══ */}
        {tab === "vendors" && (
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ width: 150, flexShrink: 0 }}>
              {VENDORS.map(v => (
                <button key={v.id} onClick={() => setVendorId(v.id)} style={{
                  display: "block", width: "100%", padding: "8px 9px", borderRadius: 6, marginBottom: 2,
                  background: vendorId === v.id ? T.surface : "transparent",
                  border: vendorId === v.id ? `1px solid ${T.border}` : "1px solid transparent",
                  cursor: "pointer", textAlign: "left", fontFamily: sans,
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: vendorId === v.id ? T.text : T.textSec }}>{v.name}</div>
                  <div style={{ fontSize: 9, color: T.textDim }}>{v.role}</div>
                </button>
              ))}
            </div>
            {vendor && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <Card s={{ marginBottom: 8 }}><div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 4, background: vendor.color }} />
                  <span style={{ fontSize: 14, fontWeight: 700 }}>{vendor.name}</span>
                  <span style={{ fontSize: 10, fontFamily: mono, color: T.textDim }}>{vendor.role}</span>
                </div></Card>
                {vendor.obligations.map((ob, i) => (
                  <Card key={i}><div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                    <span style={{ fontSize: 11, fontWeight: 700 }}>{ob.item}</span><Tag type={ob.type} />
                  </div><p style={{ fontSize: 10, color: T.textSec, lineHeight: 1.5, margin: 0 }}>{ob.detail}</p></Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ DOCUMENTS ═══ */}
        {tab === "docs" && (
          <div>
            <p style={{ fontSize: 11, color: T.textSec, lineHeight: 1.5, marginBottom: 12 }}>Central repository for all compliance documents. In the CRM, each item links to the actual file in SharePoint/document vault with version tracking, upload date, and expiration alerts.</p>
            {DOC_CATEGORIES.map((cat, ci) => (
              <div key={ci} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, fontFamily: mono, color: T.indigo, letterSpacing: "0.04em", marginBottom: 6 }}>{cat.cat}</div>
                {cat.docs.map((d, di) => (
                  <div key={di} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 5, marginBottom: 2 }}>
                    <span style={{ fontSize: 10, color: T.textSec }}>{d}</span>
                    <span style={{ marginLeft: "auto", fontSize: 8, fontFamily: mono, color: T.textDim, background: T.surfaceAlt, padding: "1px 5px", borderRadius: 2 }}>upload</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* ═══ RESEARCH ═══ */}
        {tab === "research" && (
          <div>
            <p style={{ fontSize: 11, color: T.textSec, lineHeight: 1.5, marginBottom: 12 }}>Reference library of case law, regulatory guidance, and analysis. In the CRM, each source links to the full document with highlights, notes, and relevance tags.</p>
            {RESEARCH.map((r, ri) => (
              <div key={ri} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, fontFamily: mono, color: T.indigo, letterSpacing: "0.04em", marginBottom: 6 }}>{r.topic}</div>
                {r.sources.map((s, si) => (
                  <div key={si} style={{ display: "flex", gap: 6, padding: "5px 10px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 5, marginBottom: 2 }}>
                    <span style={{ fontSize: 10, color: T.textSec, lineHeight: 1.4 }}>{s}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* ═══ SELF-AUDIT ═══ */}
        {tab === "audit" && (
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              {[
                { label: "Total", val: totalAudit, bg: T.surfaceAlt, color: T.text },
                { label: "Pass", val: pass, bg: T.greenSoft, color: T.green },
                { label: "Fail", val: fail, bg: T.redSoft, color: T.red },
                { label: "Score", val: (pass + fail) > 0 ? `${pct}%` : "\u2014", bg: pct >= 80 ? T.greenSoft : pct >= 50 ? T.amberSoft : (pass + fail) > 0 ? T.redSoft : T.surfaceAlt, color: pct >= 80 ? T.green : pct >= 50 ? T.amber : (pass + fail) > 0 ? T.red : T.textDim },
              ].map((m, i) => (
                <div key={i} style={{ flex: 1, padding: "8px 10px", borderRadius: 6, background: m.bg }}>
                  <div style={{ fontSize: 8, fontFamily: mono, color: T.textDim, marginBottom: 2 }}>{m.label}</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: m.color }}>{m.val}</div>
                </div>
              ))}
            </div>
            {AUDIT_ITEMS.map((cat, ci) => (
              <div key={ci} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 9, fontWeight: 700, fontFamily: mono, color: T.indigo, marginBottom: 4 }}>{cat.category}</div>
                {cat.items.map((item, ii) => {
                  const st = auditState[item.f];
                  return (
                    <div key={ii} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 8px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 4, marginBottom: 2 }}>
                      <span style={{ flex: 1, fontSize: 10, color: st === "pass" ? T.green : st === "fail" ? T.red : T.textSec }}>{item.q}</span>
                      <div style={{ display: "flex", gap: 2 }}>
                        {["pass", "fail", "na"].map(v => (
                          <button key={v} onClick={() => setAuditState(p => ({ ...p, [item.f]: p[item.f] === v ? undefined : v }))} style={{
                            padding: "2px 6px", borderRadius: 3, fontSize: 8, fontWeight: 700, fontFamily: mono, cursor: "pointer",
                            border: `1px solid ${st === v ? (v === "pass" ? T.green : v === "fail" ? T.red : T.textDim) + "50" : T.border}`,
                            background: st === v ? (v === "pass" ? T.greenSoft : v === "fail" ? T.redSoft : T.surfaceAlt) : T.surface,
                            color: st === v ? (v === "pass" ? T.green : v === "fail" ? T.red : T.textDim) : T.textDim,
                          }}>{v === "na" ? "N/A" : v}</button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}