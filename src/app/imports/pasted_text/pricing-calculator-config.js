import { useState, useCallback, useMemo } from "react";

/*
  DELT COST CALCULATOR v3
  Cash Discount-first with consultative selling layer.
  Qualify → Price → Pitch → Handle Objections
*/

// ─── PRICING MATRICES ───────────────────────────────────────────
const CASH_DISCOUNT_MATRIX = {
  "0-10k":    { low: { serviceFee: 3.99, monthlyFee: 49 }, medium: { serviceFee: 3.99, monthlyFee: 69 }, high: { serviceFee: 4.00, monthlyFee: 99 } },
  "10k-25k":  { low: { serviceFee: 3.99, monthlyFee: 49 }, medium: { serviceFee: 3.99, monthlyFee: 69 }, high: { serviceFee: 4.00, monthlyFee: 89 } },
  "25k-50k":  { low: { serviceFee: 3.99, monthlyFee: 39 }, medium: { serviceFee: 3.99, monthlyFee: 59 }, high: { serviceFee: 4.00, monthlyFee: 79 } },
  "50k-100k": { low: { serviceFee: 3.99, monthlyFee: 29 }, medium: { serviceFee: 3.99, monthlyFee: 49 }, high: { serviceFee: 4.00, monthlyFee: 69 } },
  "100k+":    { low: { serviceFee: 3.99, monthlyFee: 0 },  medium: { serviceFee: 3.99, monthlyFee: 29 }, high: { serviceFee: 4.00, monthlyFee: 49 } },
};

const FLAT_RATE_MATRIX = {
  "0-10k":    { low: { rate: 2.95, perTxn: 0.15 }, medium: { rate: 3.25, perTxn: 0.18 }, high: { rate: 3.65, perTxn: 0.22 } },
  "10k-25k":  { low: { rate: 2.75, perTxn: 0.12 }, medium: { rate: 3.05, perTxn: 0.15 }, high: { rate: 3.45, perTxn: 0.20 } },
  "25k-50k":  { low: { rate: 2.55, perTxn: 0.10 }, medium: { rate: 2.85, perTxn: 0.12 }, high: { rate: 3.25, perTxn: 0.18 } },
  "50k-100k": { low: { rate: 2.40, perTxn: 0.08 }, medium: { rate: 2.65, perTxn: 0.10 }, high: { rate: 3.05, perTxn: 0.15 } },
  "100k+":    { low: { rate: 2.25, perTxn: 0.06 }, medium: { rate: 2.50, perTxn: 0.08 }, high: { rate: 2.85, perTxn: 0.12 } },
};

const VOLUME_BANDS = [
  { key: "0-10k", label: "Under $10K", midpoint: 5000 },
  { key: "10k-25k", label: "$10K – $25K", midpoint: 17500 },
  { key: "25k-50k", label: "$25K – $50K", midpoint: 37500 },
  { key: "50k-100k", label: "$50K – $100K", midpoint: 75000 },
  { key: "100k+", label: "$100K+", midpoint: 150000 },
];

const RISK_TIERS = [
  { key: "low", label: "Low Risk", desc: "Retail, professional svcs, healthcare", color: "#22c55e", bg: "rgba(34,197,94,0.07)" },
  { key: "medium", label: "Medium Risk", desc: "Restaurants, e-comm, subscription", color: "#f59e0b", bg: "rgba(245,158,11,0.07)" },
  { key: "high", label: "High Risk", desc: "CBD, nutra, travel, high-chargeback", color: "#ef4444", bg: "rgba(239,68,68,0.07)" },
];

// ─── MERCHANT TYPES & RECEPTIVITY ───────────────────────────────
const MERCHANT_TYPES = [
  { key: "restaurant", label: "Restaurant / Bar", icon: "🍽️", cdScore: 92, cardRatioDefault: 65 },
  { key: "retail", label: "Retail Store", icon: "🏪", cdScore: 88, cardRatioDefault: 80 },
  { key: "auto", label: "Auto / Repair", icon: "🔧", cdScore: 95, cardRatioDefault: 55 },
  { key: "salon", label: "Salon / Spa", icon: "💈", cdScore: 85, cardRatioDefault: 75 },
  { key: "medical", label: "Medical / Dental", icon: "🏥", cdScore: 70, cardRatioDefault: 85 },
  { key: "professional", label: "Professional Svcs", icon: "💼", cdScore: 65, cardRatioDefault: 90 },
  { key: "ecommerce", label: "E-Commerce", icon: "🛒", cdScore: 20, cardRatioDefault: 98 },
  { key: "other", label: "Other", icon: "📦", cdScore: 75, cardRatioDefault: 70 },
];

const RECEPTIVITY_LEVELS = [
  { key: "eager", label: "Open to it", desc: "Already aware or interested", color: "#22c55e" },
  { key: "neutral", label: "Needs education", desc: "Hasn't heard of it or unsure", color: "#f59e0b" },
  { key: "resistant", label: "Pushback", desc: "Worried about customer reaction", color: "#ef4444" },
];

// ─── OBJECTION PLAYBOOK ─────────────────────────────────────────
const OBJECTIONS = {
  customers_upset: {
    title: "\"My customers will be upset\"",
    reframe: "Reframe: it's not a surcharge — it's a discount for cash",
    talk: "\"You're not charging more for cards — you're offering a discount for paying cash. Your posted prices stay the same. Gas stations have done this for decades and nobody blinks. We'll handle all the signage and compliance so your customers see it as a perk, not a penalty.\"",
    data: "97% of consumers complete the transaction even after seeing the fee. Churn from cash discount programs is under 1% in retail and food service.",
  },
  lose_sales: {
    title: "\"I'll lose sales\"",
    reframe: "Reframe: your effective rate is 0% — reinvest that into growth",
    talk: "\"Right now you're paying $X,000/year in processing fees. That's money leaving your business. On cash discount, that goes to zero. You could put that into marketing, staff, inventory — things that actually drive sales. The fee is transparent, it's legal, and your competitors are already doing it.\"",
    data: "Average merchant saves $8,400/yr on cash discount. Less than 0.5% of merchants report measurable sales decline after 90 days.",
  },
  too_complicated: {
    title: "\"Sounds complicated\"",
    reframe: "Reframe: we handle everything — zero work for you",
    talk: "\"We program the terminal, provide the signage, and handle compliance. Your staff doesn't do anything different. The adjustment shows automatically on the receipt. It's genuinely plug-and-play — we've done this hundreds of times.\"",
    data: "Average onboarding takes 15 minutes. Terminal auto-applies the adjustment — no manual entry, no training required.",
  },
  is_it_legal: {
    title: "\"Is this legal?\"",
    reframe: "Reframe: it's a cash discount, not a surcharge — fully compliant",
    talk: "\"Cash discounting is legal in all 50 states. It's different from surcharging, which has restrictions. We structure the program as a service fee with a cash discount — the same model gas stations use. We handle all signage requirements and receipt language to keep you compliant.\"",
    data: "Legal in all 50 states. Visa, Mastercard, and Discover all permit properly structured cash discount programs. We handle compliance.",
  },
  customers_will_leave: {
    title: "\"Customers will go to my competitor\"",
    reframe: "Reframe: your competitor is probably already doing this",
    talk: "\"Honestly, a lot of your competitors are already on cash discount — they're just not advertising it. The businesses still paying 3-4% on every swipe are the ones falling behind. This is becoming the standard, not the exception. And the money you save can go toward actually competing — better service, better prices, better marketing.\"",
    data: "Cash discount adoption among SMBs has grown 340% since 2020. In food service and auto repair, over 40% of merchants now use some form of non-cash adjustment.",
  },
};

// ─── SELLING STRATEGY ENGINE ────────────────────────────────────
function getSellingStrategy(merchantType, receptivity, savings) {
  const mt = MERCHANT_TYPES.find(m => m.key === merchantType);
  if (!mt) return null;

  const cdScore = mt.cdScore;
  let approach, opener, keyObjections, closingMove;

  if (cdScore >= 85) {
    // High-fit verticals
    if (receptivity === "eager") {
      approach = "Confirm & Close";
      opener = `Lead with the savings number. "${mt.label} owners love this because it eliminates processing costs entirely. Based on your volume, you'd save roughly ${savings}/year."`;
      keyObjections = ["too_complicated"];
      closingMove = "Go straight to paperwork. They're ready — don't oversell. \"Let me get this set up for you. We can have you live this week.\"";
    } else if (receptivity === "neutral") {
      approach = "Educate & Anchor";
      opener = `Start with a question: "What are you currently paying in processing fees?" Let them say the number. Then: "What if that went to zero?" Pause. Let it land.`;
      keyObjections = ["customers_upset", "too_complicated"];
      closingMove = `Anchor to a peer: "Most ${mt.label.toLowerCase()} owners I work with switched within the first meeting once they saw the math. Want me to run your numbers?"`;
    } else {
      approach = "Empathize & Prove";
      opener = `Validate the concern first: "I get it — when I first heard about cash discount, I had the same reaction. But here's what changed my mind..." Then lead with the data.`;
      keyObjections = ["customers_upset", "lose_sales", "customers_will_leave"];
      closingMove = `Offer a trial frame: "Tell you what — try it for 60 days. If you don't like it, we switch you to flat rate, no penalty. But I've never had someone switch back."`;
    }
  } else if (cdScore >= 50) {
    // Medium-fit
    if (receptivity === "eager") {
      approach = "Validate & Structure";
      opener = `They're interested but this vertical has nuance. "Cash discount works great for your business — let me show you exactly how we structure it so it feels seamless for your clients."`;
      keyObjections = ["is_it_legal", "customers_upset"];
      closingMove = "Position the monthly fee as the \"all-in cost\" — compare it to what they're paying now. The delta sells itself.";
    } else if (receptivity === "neutral") {
      approach = "Numbers First";
      opener = `Lead with their statement. "I looked at your processing — you're paying X%. On cash discount, your effective rate goes to zero. The math is pretty hard to argue with."`;
      keyObjections = ["customers_upset", "is_it_legal", "too_complicated"];
      closingMove = `Side-by-side comparison: "Here's what you pay now, here's what you'd pay. The difference is ${savings}/year back in your pocket."`;
    } else {
      approach = "Flat Rate Bridge";
      opener = `Start with flat rate as the "safe" option, then introduce cash discount as the upgrade: "We can definitely do flat rate at X%. But honestly, most of my ${mt.label.toLowerCase()} clients end up on cash discount once they see the savings."`;
      keyObjections = ["customers_upset", "lose_sales", "is_it_legal", "customers_will_leave"];
      closingMove = "Offer flat rate as the fallback: \"We can start you on flat rate today and revisit cash discount in 90 days once you've seen how we operate. Sound fair?\"";
    }
  } else {
    // Low-fit (e-commerce etc)
    approach = "Flat Rate Default";
    opener = `Cash discount is tough for online-only merchants since all transactions are card. Lead with flat rate: "For e-commerce, we've got a clean flat rate at X% — no hidden fees, no surprises."`;
    keyObjections = [];
    closingMove = "Focus on the Delt ecosystem value — payments are the wedge, then layer in websites, Lens AI, and capital as the retention play.";
  }

  return { approach, opener, keyObjections, closingMove, cdScore };
}

const INTERCHANGE_EST = 1.80;
const AVG_TICKET_PRESETS = { "0-10k": 25, "10k-25k": 35, "25k-50k": 45, "50k-100k": 55, "100k+": 65 };

// ─── FONTS ──────────────────────────────────────────────────────
const fl = document.createElement("link");
fl.href = "https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=JetBrains+Mono:wght@400;500;600;700&display=swap";
fl.rel = "stylesheet";
document.head.appendChild(fl);
const mono = "'JetBrains Mono', monospace";

// ─── MAIN COMPONENT ─────────────────────────────────────────────
export default function CostCalculator() {
  const [step, setStep] = useState(1); // 1=qualify, 2=price, 3=playbook
  const [program, setProgram] = useState("cash_discount");
  const [volumeBand, setVolumeBand] = useState(null);
  const [riskTier, setRiskTier] = useState(null);
  const [merchantType, setMerchantType] = useState(null);
  const [receptivity, setReceptivity] = useState(null);
  const [avgTicket, setAvgTicket] = useState("");
  const [currentRate, setCurrentRate] = useState("");
  const [merchantName, setMerchantName] = useState("");
  const [cardRatio, setCardRatio] = useState("");
  const [expandedObj, setExpandedObj] = useState(null);

  const isCashDiscount = program === "cash_discount";
  const bandData = VOLUME_BANDS.find(b => b.key === volumeBand);
  const riskData = RISK_TIERS.find(r => r.key === riskTier);
  const mtData = MERCHANT_TYPES.find(m => m.key === merchantType);

  const effectiveCardRatio = parseFloat(cardRatio) || (mtData ? mtData.cardRatioDefault : 70);
  const ratio = Math.min(Math.max(effectiveCardRatio, 0), 100) / 100;
  const ticket = parseFloat(avgTicket) || (bandData ? AVG_TICKET_PRESETS[bandData.key] : 40);
  const monthlyVol = bandData ? bandData.midpoint : 0;
  const monthlyTxns = ticket > 0 ? Math.round(monthlyVol / ticket) : 0;
  const cardVol = monthlyVol * ratio;

  const cdPricing = volumeBand && riskTier ? CASH_DISCOUNT_MATRIX[volumeBand][riskTier] : null;
  const frPricing = volumeBand && riskTier ? FLAT_RATE_MATRIX[volumeBand][riskTier] : null;

  const cdAnnual = useMemo(() => {
    if (!cdPricing) return null;
    const feeRevenue = cardVol * (cdPricing.serviceFee / 100) * 12;
    const interchangeCost = cardVol * (INTERCHANGE_EST / 100) * 12;
    const monthlyFees = cdPricing.monthlyFee * 12;
    return { grossRevenue: feeRevenue + monthlyFees, margin: feeRevenue - interchangeCost + monthlyFees, feeRevenue, interchangeCost, monthlyFees };
  }, [cdPricing, cardVol]);

  const frAnnual = useMemo(() => {
    if (!frPricing) return null;
    const rateRev = (monthlyVol * (frPricing.rate / 100)) * 12;
    const txnRev = (monthlyTxns * frPricing.perTxn) * 12;
    const interchangeCost = (monthlyVol * (INTERCHANGE_EST / 100)) * 12;
    return { grossRevenue: rateRev + txnRev, margin: rateRev + txnRev - interchangeCost };
  }, [frPricing, monthlyVol, monthlyTxns]);

  const merchantSavings = useMemo(() => {
    const cr = parseFloat(currentRate);
    if (!cr || !monthlyVol) return null;
    const curr = monthlyVol * 12 * (cr / 100);
    if (isCashDiscount) return curr - (cdPricing ? cdPricing.monthlyFee * 12 : 0);
    return curr - (frPricing ? (monthlyVol * 12 * (frPricing.rate / 100)) + (monthlyTxns * 12 * frPricing.perTxn) : 0);
  }, [currentRate, isCashDiscount, cdPricing, frPricing, monthlyVol, monthlyTxns]);

  const savingsStr = merchantSavings != null ? "$" + Math.abs(merchantSavings).toLocaleString("en-US", { maximumFractionDigits: 0 }) : "$X,XXX";

  const strategy = useMemo(() => {
    if (!merchantType || !receptivity) return null;
    return getSellingStrategy(merchantType, receptivity, savingsStr);
  }, [merchantType, receptivity, savingsStr]);

  const reset = useCallback(() => {
    setStep(1); setProgram("cash_discount"); setVolumeBand(null); setRiskTier(null);
    setMerchantType(null); setReceptivity(null); setAvgTicket(""); setCurrentRate("");
    setMerchantName(""); setCardRatio(""); setExpandedObj(null);
  }, []);

  const fmt = (n) => n != null ? "$" + Math.abs(n).toLocaleString("en-US", { maximumFractionDigits: 0 }) : "—";
  const fmtSigned = (n) => n != null ? (n >= 0 ? "+" : "-") + "$" + Math.abs(n).toLocaleString("en-US", { maximumFractionDigits: 0 }) : "—";

  const canAdvanceTo2 = merchantType && receptivity && volumeBand && riskTier;
  const canAdvanceTo3 = canAdvanceTo2;

  // ── CD Score gauge ──
  const cdScore = mtData ? mtData.cdScore : 0;
  const cdScoreColor = cdScore >= 80 ? "#22c55e" : cdScore >= 50 ? "#f59e0b" : "#ef4444";
  const cdScoreLabel = cdScore >= 80 ? "High Fit" : cdScore >= 50 ? "Moderate Fit" : "Low Fit — Consider Flat Rate";

  return (
    <div style={S.root}>
      {/* HEADER */}
      <div style={S.header}>
        <div style={S.headerLeft}>
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="#4945FF" />
            <path d="M9 10h5v12H9V10zm9 4h5v8h-5v-8z" fill="#fff" />
          </svg>
          <div>
            <h1 style={S.title}>Cost Calculator</h1>
            <p style={S.subtitle}>Qualify → Price → Sell</p>
          </div>
        </div>
        <button onClick={reset} style={S.resetBtn}>Start Over</button>
      </div>

      {/* STEP INDICATOR */}
      <div style={S.steps}>
        {[
          { n: 1, label: "Qualify" },
          { n: 2, label: "Price" },
          { n: 3, label: "Playbook" },
        ].map(s => (
          <button key={s.n} onClick={() => { if (s.n <= 2 || canAdvanceTo3) setStep(s.n); }}
            style={{ ...S.stepBtn, ...(step === s.n ? S.stepBtnActive : {}), ...(step > s.n ? S.stepBtnDone : {}), cursor: (s.n <= step || (s.n === 2 && canAdvanceTo2) || (s.n === 3 && canAdvanceTo3)) ? "pointer" : "default", opacity: (s.n > step && !canAdvanceTo2) ? 0.35 : 1 }}>
            <span style={{ ...S.stepNum, ...(step === s.n ? S.stepNumActive : {}), ...(step > s.n ? S.stepNumDone : {}) }}>{step > s.n ? "✓" : s.n}</span>
            {s.label}
          </button>
        ))}
      </div>

      {/* ═══════════ STEP 1: QUALIFY ═══════════ */}
      {step === 1 && (
        <div style={S.stepContent}>
          <div style={S.qualifyGrid}>
            {/* Left col: merchant info */}
            <div style={S.qualCol}>
              <div style={S.fieldGroup}>
                <label style={S.label}>Merchant Name</label>
                <input type="text" value={merchantName} onChange={e => setMerchantName(e.target.value)}
                  placeholder="e.g. Mario's Pizzeria" style={S.textInput} />
              </div>

              <div style={S.fieldGroup}>
                <label style={S.label}>Business Type</label>
                <div style={S.typeGrid}>
                  {MERCHANT_TYPES.map(mt => (
                    <button key={mt.key} onClick={() => { setMerchantType(mt.key); setCardRatio(""); }}
                      style={{ ...S.typeCard, ...(merchantType === mt.key ? S.typeCardActive : {}) }}>
                      <span style={S.typeIcon}>{mt.icon}</span>
                      <span style={S.typeLabel}>{mt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div style={S.fieldGroup}>
                <label style={S.label}>Monthly Card Volume</label>
                <div style={S.chipRow}>
                  {VOLUME_BANDS.map(band => (
                    <button key={band.key} onClick={() => setVolumeBand(band.key)}
                      style={{ ...S.chip, ...(volumeBand === band.key ? S.chipActive : {}) }}>
                      {band.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={S.fieldGroup}>
                <label style={S.label}>Risk Category</label>
                <div style={S.riskCards}>
                  {RISK_TIERS.map(tier => {
                    const active = riskTier === tier.key;
                    return (
                      <button key={tier.key} onClick={() => setRiskTier(tier.key)}
                        style={{ ...S.riskCard, borderColor: active ? tier.color : "transparent", background: active ? tier.bg : "rgba(255,255,255,0.02)" }}>
                        <span style={{ ...S.dot, background: tier.color, boxShadow: active ? `0 0 8px ${tier.color}40` : "none" }} />
                        <div>
                          <div style={{ ...S.riskLabel, color: active ? tier.color : "#9ca3af" }}>{tier.label}</div>
                          <div style={S.riskDesc}>{tier.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right col: receptivity + overrides */}
            <div style={S.qualCol}>
              <div style={S.fieldGroup}>
                <label style={S.label}>Cash Discount Receptivity</label>
                <p style={S.fieldHint}>How did the merchant respond when you brought up cash discount?</p>
                <div style={S.receptCards}>
                  {RECEPTIVITY_LEVELS.map(r => {
                    const active = receptivity === r.key;
                    return (
                      <button key={r.key} onClick={() => setReceptivity(r.key)}
                        style={{ ...S.receptCard, borderColor: active ? r.color : "transparent", background: active ? `${r.color}10` : "rgba(255,255,255,0.02)" }}>
                        <div style={{ ...S.receptDot, background: r.color, boxShadow: active ? `0 0 10px ${r.color}50` : "none" }} />
                        <div>
                          <div style={{ ...S.receptLabel, color: active ? r.color : "#9ca3af" }}>{r.label}</div>
                          <div style={S.receptDesc}>{r.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* CD Fit Score */}
              {merchantType && (
                <div style={S.fitCard}>
                  <div style={S.fitHeader}>
                    <span style={S.fitTitle}>Cash Discount Fit</span>
                    <span style={{ ...S.fitScore, color: cdScoreColor }}>{cdScore}/100</span>
                  </div>
                  <div style={S.fitBar}>
                    <div style={{ ...S.fitFill, width: `${cdScore}%`, background: cdScoreColor }} />
                  </div>
                  <div style={{ ...S.fitLabel, color: cdScoreColor }}>{cdScoreLabel}</div>
                  {cdScore < 50 && (
                    <div style={S.fitWarn}>This vertical is tough for cash discount — most transactions are card-not-present. The playbook will default to flat rate with a cash discount upsell path.</div>
                  )}
                </div>
              )}

              <div style={S.fieldGroup}>
                <label style={S.label}>Optional Overrides</label>
                <div style={S.optRow}>
                  <div style={{ flex: 1 }}>
                    <label style={S.labelSm}>Avg Ticket $</label>
                    <input type="number" value={avgTicket} onChange={e => setAvgTicket(e.target.value)}
                      placeholder={bandData ? `~$${AVG_TICKET_PRESETS[bandData.key]}` : "—"} style={S.smInput} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={S.labelSm}>Current Rate %</label>
                    <input type="number" step="0.01" value={currentRate} onChange={e => setCurrentRate(e.target.value)}
                      placeholder="e.g. 3.50" style={S.smInput} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={S.labelSm}>Card %</label>
                    <input type="number" value={cardRatio} onChange={e => setCardRatio(e.target.value)}
                      placeholder={mtData ? `~${mtData.cardRatioDefault}%` : "70"} style={S.smInput} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {canAdvanceTo2 && (
            <div style={S.advanceBar}>
              <button onClick={() => setStep(2)} style={S.advanceBtn}>
                Continue to Pricing →
              </button>
            </div>
          )}
        </div>
      )}

      {/* ═══════════ STEP 2: PRICE ═══════════ */}
      {step === 2 && canAdvanceTo2 && (
        <div style={S.stepContent}>
          {/* Program toggle */}
          <div style={S.programToggle}>
            <button onClick={() => setProgram("cash_discount")}
              style={{ ...S.progBtn, ...(isCashDiscount ? S.progBtnActive : {}) }}>
              <span style={S.progIcon}>💰</span>
              <div style={{ flex: 1 }}>
                <div style={S.progLabel}>Cash Discount</div>
                <div style={S.progDesc}>0% effective rate — fee to card customers</div>
              </div>
              {isCashDiscount && <span style={S.recommended}>RECOMMENDED</span>}
            </button>
            <button onClick={() => setProgram("flat_rate")}
              style={{ ...S.progBtn, ...(!isCashDiscount ? S.progBtnActiveFR : {}) }}>
              <span style={S.progIcon}>📊</span>
              <div style={{ flex: 1 }}>
                <div style={S.progLabel}>Flat Rate</div>
                <div style={S.progDesc}>Traditional — merchant absorbs cost</div>
              </div>
            </button>
          </div>

          <div style={S.priceGrid}>
            {/* Pricing output */}
            <div style={S.priceMain}>
              {isCashDiscount ? (
                <div style={S.rateLockup}>
                  {merchantName && <div style={S.merchantTag}>{merchantName}</div>}
                  <div style={S.tierBadge}>
                    <span style={{ ...S.tierDot, background: riskData?.color }} />{riskData?.label} · {bandData?.label}/mo
                  </div>
                  <div style={S.heroRow}>
                    <div style={S.heroBlock}>
                      <div style={S.heroLabel}>Merchant Effective Rate</div>
                      <div style={S.heroZero}><span style={S.zeroNum}>0.00</span><span style={S.zeroPct}>%</span></div>
                      <div style={S.heroSub}>processing cost eliminated</div>
                    </div>
                    <div style={S.heroDivider} />
                    <div style={S.heroBlock}>
                      <div style={S.heroLabel}>Service Fee to Card Customers</div>
                      <div style={S.heroFee}><span style={S.feeNum}>{cdPricing?.serviceFee.toFixed(2)}</span><span style={S.feePct}>%</span></div>
                      <div style={S.heroSub}>non-cash adjustment</div>
                    </div>
                  </div>
                  {cdPricing?.monthlyFee > 0 && <div style={S.monthlyTag}>${cdPricing.monthlyFee}/mo program fee</div>}
                  <div style={S.lockMsg}>
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ marginRight: 5 }}>
                      <rect x="3" y="7" width="10" height="7" rx="2" stroke="#4945FF" strokeWidth="1.5" fill="none" />
                      <path d="M5 7V5a3 3 0 016 0v2" stroke="#4945FF" strokeWidth="1.5" fill="none" />
                    </svg>
                    Matrix-locked — no discretionary adjustments
                  </div>
                </div>
              ) : (
                <div style={S.rateLockup}>
                  {merchantName && <div style={S.merchantTag}>{merchantName}</div>}
                  <div style={S.tierBadge}>
                    <span style={{ ...S.tierDot, background: riskData?.color }} />{riskData?.label} · {bandData?.label}/mo
                  </div>
                  <div style={S.bigRate}><span style={S.bigRateNum}>{frPricing?.rate.toFixed(2)}</span><span style={S.bigRatePct}>%</span></div>
                  <div style={S.perTxn}>+ ${frPricing?.perTxn.toFixed(2)} per transaction</div>
                  <div style={S.lockMsg}>
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ marginRight: 5 }}>
                      <rect x="3" y="7" width="10" height="7" rx="2" stroke="#4945FF" strokeWidth="1.5" fill="none" />
                      <path d="M5 7V5a3 3 0 016 0v2" stroke="#4945FF" strokeWidth="1.5" fill="none" />
                    </svg>
                    Matrix-locked
                  </div>
                </div>
              )}

              {/* Savings */}
              {merchantSavings != null && (
                <div style={{ ...S.savingsBar, borderColor: merchantSavings > 0 ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.2)", background: merchantSavings > 0 ? "rgba(34,197,94,0.05)" : "rgba(239,68,68,0.04)" }}>
                  <div style={S.savingsLabel}>Merchant Saves</div>
                  <div style={{ ...S.savingsVal, color: merchantSavings > 0 ? "#22c55e" : "#ef4444" }}>{fmtSigned(merchantSavings)}/yr</div>
                </div>
              )}
            </div>

            {/* Delt economics sidebar */}
            <div style={S.econSidebar}>
              <div style={S.econHeader}><span style={S.econDot} />Delt Economics<span style={S.econNote}>(internal)</span></div>
              {isCashDiscount ? (
                <div style={S.econStack}>
                  <EconRow label="Spread Revenue" value={cdAnnual ? fmt(cdAnnual.feeRevenue - cdAnnual.interchangeCost) : "—"} />
                  <EconRow label="Program Fees" value={cdAnnual ? fmt(cdAnnual.monthlyFees) : "—"} />
                  <EconRow label="Total Revenue" value={cdAnnual ? fmt(cdAnnual.grossRevenue) : "—"} accent />
                  <EconRow label="Annual Margin" value={cdAnnual ? fmt(cdAnnual.margin) : "—"} color="#22c55e"
                    sub={cdAnnual ? `${((cdAnnual.margin / cdAnnual.grossRevenue) * 100).toFixed(1)}%` : null} />
                </div>
              ) : (
                <div style={S.econStack}>
                  <EconRow label="Annual Revenue" value={frAnnual ? fmt(frAnnual.grossRevenue) : "—"} accent />
                  <EconRow label="Annual Margin" value={frAnnual ? fmt(frAnnual.margin) : "—"} color="#22c55e"
                    sub={frAnnual ? `${((frAnnual.margin / frAnnual.grossRevenue) * 100).toFixed(1)}%` : null} />
                </div>
              )}
              {/* CD vs FR comparison */}
              {cdAnnual && frAnnual && (
                <div style={S.compMini}>
                  <div style={S.compMiniLabel}>CD vs Flat Rate Margin</div>
                  <div style={S.compMiniRow}>
                    <span style={{ color: "#22c55e", fontFamily: mono, fontWeight: 600, fontSize: 14 }}>{fmt(cdAnnual.margin)}</span>
                    <span style={{ color: "#3f3f46", fontSize: 11 }}>vs</span>
                    <span style={{ color: "#71717a", fontFamily: mono, fontWeight: 600, fontSize: 14 }}>{fmt(frAnnual.margin)}</span>
                  </div>
                  <div style={S.compMiniDelta}>
                    {cdAnnual.margin > frAnnual.margin
                      ? <span style={{ color: "#22c55e" }}>CD wins by {fmt(cdAnnual.margin - frAnnual.margin)}/yr</span>
                      : <span style={{ color: "#f59e0b" }}>Flat rate wins by {fmt(frAnnual.margin - cdAnnual.margin)}/yr</span>}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={S.advanceBar}>
            <button onClick={() => setStep(1)} style={S.backBtn}>← Back</button>
            <button onClick={() => setStep(3)} style={S.advanceBtn}>View Playbook →</button>
          </div>
        </div>
      )}

      {/* ═══════════ STEP 3: PLAYBOOK ═══════════ */}
      {step === 3 && strategy && (
        <div style={S.stepContent}>
          <div style={S.playbookHeader}>
            <div>
              <div style={S.playbookTitle}>{strategy.approach}</div>
              <div style={S.playbookMeta}>
                {merchantName || mtData?.label} · {RECEPTIVITY_LEVELS.find(r => r.key === receptivity)?.label} · CD Fit: {cdScore}/100
              </div>
            </div>
            <div style={S.playbookBadge}>
              {isCashDiscount ? "Cash Discount" : "Flat Rate"} · {bandData?.label}/mo
            </div>
          </div>

          {/* Opener */}
          <div style={S.playbookSection}>
            <div style={S.pbSectionHeader}>
              <span style={S.pbNum}>1</span>
              Opening Move
            </div>
            <div style={S.pbCard}>
              <p style={S.pbText}>{strategy.opener}</p>
            </div>
          </div>

          {/* Objection handling */}
          {strategy.keyObjections.length > 0 && (
            <div style={S.playbookSection}>
              <div style={S.pbSectionHeader}>
                <span style={S.pbNum}>2</span>
                Handle These Objections
                <span style={S.pbNote}>Most likely for this merchant profile</span>
              </div>
              <div style={S.objStack}>
                {strategy.keyObjections.map(objKey => {
                  const obj = OBJECTIONS[objKey];
                  const isOpen = expandedObj === objKey;
                  return (
                    <div key={objKey} style={{ ...S.objCard, borderColor: isOpen ? "rgba(73,69,255,0.2)" : "rgba(255,255,255,0.05)" }}>
                      <button onClick={() => setExpandedObj(isOpen ? null : objKey)} style={S.objHeader}>
                        <div style={S.objTitle}>{obj.title}</div>
                        <span style={{ ...S.objChevron, transform: isOpen ? "rotate(180deg)" : "rotate(0)" }}>▾</span>
                      </button>
                      {isOpen && (
                        <div style={S.objBody}>
                          <div style={S.objReframe}>{obj.reframe}</div>
                          <div style={S.objTalkLabel}>What to say:</div>
                          <div style={S.objTalk}>{obj.talk}</div>
                          <div style={S.objData}>
                            <span style={S.objDataIcon}>📊</span>
                            {obj.data}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {/* Show remaining objections collapsed */}
                {Object.keys(OBJECTIONS).filter(k => !strategy.keyObjections.includes(k)).map(objKey => {
                  const obj = OBJECTIONS[objKey];
                  const isOpen = expandedObj === objKey;
                  return (
                    <div key={objKey} style={{ ...S.objCard, opacity: 0.6, borderColor: isOpen ? "rgba(73,69,255,0.15)" : "rgba(255,255,255,0.03)" }}>
                      <button onClick={() => setExpandedObj(isOpen ? null : objKey)} style={S.objHeader}>
                        <div style={S.objTitle}>{obj.title}</div>
                        <span style={{ ...S.objChevron, transform: isOpen ? "rotate(180deg)" : "rotate(0)" }}>▾</span>
                      </button>
                      {isOpen && (
                        <div style={S.objBody}>
                          <div style={S.objReframe}>{obj.reframe}</div>
                          <div style={S.objTalkLabel}>What to say:</div>
                          <div style={S.objTalk}>{obj.talk}</div>
                          <div style={S.objData}><span style={S.objDataIcon}>📊</span>{obj.data}</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Close */}
          <div style={S.playbookSection}>
            <div style={S.pbSectionHeader}>
              <span style={S.pbNum}>{strategy.keyObjections.length > 0 ? "3" : "2"}</span>
              Closing Move
            </div>
            <div style={{ ...S.pbCard, borderColor: "rgba(34,197,94,0.15)", background: "rgba(34,197,94,0.04)" }}>
              <p style={S.pbText}>{strategy.closingMove}</p>
            </div>
          </div>

          {/* Quick reference */}
          {merchantSavings != null && (
            <div style={S.quickRef}>
              <div style={S.qrTitle}>Quick Reference Numbers</div>
              <div style={S.qrRow}>
                <div style={S.qrItem}><div style={S.qrLabel}>Merchant Saves</div><div style={{ ...S.qrVal, color: "#22c55e" }}>{fmtSigned(merchantSavings)}/yr</div></div>
                <div style={S.qrItem}><div style={S.qrLabel}>Current Rate</div><div style={S.qrVal}>{parseFloat(currentRate).toFixed(2)}%</div></div>
                <div style={S.qrItem}><div style={S.qrLabel}>New Rate</div><div style={{ ...S.qrVal, color: "#22c55e" }}>{isCashDiscount ? "0.00%" : `${frPricing?.rate.toFixed(2)}%`}</div></div>
                <div style={S.qrItem}><div style={S.qrLabel}>Delt Margin</div><div style={S.qrVal}>{isCashDiscount ? fmt(cdAnnual?.margin) : fmt(frAnnual?.margin)}/yr</div></div>
              </div>
            </div>
          )}

          <div style={S.advanceBar}>
            <button onClick={() => setStep(2)} style={S.backBtn}>← Back to Pricing</button>
          </div>
        </div>
      )}
    </div>
  );
}

function EconRow({ label, value, color, sub, accent }) {
  return (
    <div style={{ ...S.econRow, ...(accent ? { borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 10, marginTop: 4 } : {}) }}>
      <div style={S.econRowLabel}>{label}</div>
      <div style={{ ...S.econRowVal, color: color || (accent ? "#fff" : "#a1a1aa") }}>{value}</div>
      {sub && <div style={S.econRowSub}>{sub}</div>}
    </div>
  );
}

// ─── STYLES ─────────────────────────────────────────────────────
const S = {
  root: { fontFamily: "'DM Sans', system-ui, sans-serif", background: "#08080d", color: "#e4e4e7", minHeight: "100vh", padding: "24px 28px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  headerLeft: { display: "flex", alignItems: "center", gap: 12 },
  title: { fontSize: 20, fontWeight: 700, margin: 0, letterSpacing: "-0.02em", color: "#fff" },
  subtitle: { fontSize: 12, color: "#52525b", margin: "2px 0 0", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.02em" },
  resetBtn: { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#71717a", fontSize: 12, fontFamily: "'DM Sans', sans-serif", padding: "6px 14px", borderRadius: 8, cursor: "pointer" },

  steps: { display: "flex", gap: 4, marginBottom: 24, background: "rgba(255,255,255,0.02)", borderRadius: 10, padding: 4 },
  stepBtn: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px 16px", borderRadius: 8, border: "none", background: "transparent", color: "#52525b", fontSize: 13, fontWeight: 500, fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s" },
  stepBtnActive: { background: "rgba(73,69,255,0.1)", color: "#fff" },
  stepBtnDone: { color: "#22c55e" },
  stepNum: { width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, background: "rgba(255,255,255,0.05)", color: "#52525b", fontFamily: "'JetBrains Mono', monospace" },
  stepNumActive: { background: "#4945FF", color: "#fff" },
  stepNumDone: { background: "rgba(34,197,94,0.15)", color: "#22c55e" },

  stepContent: {},

  // Qualify
  qualifyGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 },
  qualCol: { display: "flex", flexDirection: "column", gap: 20 },
  fieldGroup: { display: "flex", flexDirection: "column", gap: 8 },
  label: { fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#52525b" },
  labelSm: { fontSize: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", color: "#3f3f46", marginBottom: 5, display: "block" },
  fieldHint: { fontSize: 12, color: "#3f3f46", margin: "-4px 0 0", lineHeight: 1.4 },
  textInput: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "10px 14px", fontSize: 14, color: "#fff", fontFamily: "'DM Sans', sans-serif", outline: "none", width: "100%", boxSizing: "border-box" },
  smInput: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "8px 10px", fontSize: 13, color: "#fff", fontFamily: "'JetBrains Mono', monospace", outline: "none", width: "100%", boxSizing: "border-box" },

  typeGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 },
  typeCard: { display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "12px 8px", borderRadius: 10, border: "1.5px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s" },
  typeCardActive: { borderColor: "#4945FF", background: "rgba(73,69,255,0.08)" },
  typeIcon: { fontSize: 20 },
  typeLabel: { fontSize: 11, fontWeight: 500, color: "#9ca3af", textAlign: "center", lineHeight: 1.2 },

  chipRow: { display: "flex", flexWrap: "wrap", gap: 6 },
  chip: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "7px 13px", fontSize: 12, color: "#71717a", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", transition: "all 0.15s" },
  chipActive: { background: "rgba(73,69,255,0.1)", borderColor: "#4945FF", color: "#fff", fontWeight: 500 },

  riskCards: { display: "flex", flexDirection: "column", gap: 4 },
  riskCard: { display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 10, border: "1.5px solid transparent", cursor: "pointer", transition: "all 0.15s", textAlign: "left", fontFamily: "'DM Sans', sans-serif" },
  dot: { width: 9, height: 9, borderRadius: "50%", flexShrink: 0 },
  riskLabel: { fontSize: 13, fontWeight: 600 },
  riskDesc: { fontSize: 10, color: "#3f3f46", marginTop: 1 },

  receptCards: { display: "flex", flexDirection: "column", gap: 6 },
  receptCard: { display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 12, border: "1.5px solid transparent", cursor: "pointer", transition: "all 0.15s", textAlign: "left", fontFamily: "'DM Sans', sans-serif" },
  receptDot: { width: 12, height: 12, borderRadius: "50%", flexShrink: 0 },
  receptLabel: { fontSize: 14, fontWeight: 600 },
  receptDesc: { fontSize: 11, color: "#52525b", marginTop: 2 },

  fitCard: { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "16px 18px" },
  fitHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  fitTitle: { fontSize: 12, fontWeight: 600, color: "#71717a", textTransform: "uppercase", letterSpacing: "0.04em" },
  fitScore: { fontSize: 18, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" },
  fitBar: { height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden", marginBottom: 8 },
  fitFill: { height: "100%", borderRadius: 3, transition: "width 0.4s ease" },
  fitLabel: { fontSize: 12, fontWeight: 600 },
  fitWarn: { fontSize: 11, color: "#71717a", marginTop: 8, lineHeight: 1.5, padding: "8px 10px", background: "rgba(239,68,68,0.05)", borderRadius: 6 },

  optRow: { display: "flex", gap: 8 },

  advanceBar: { display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.04)" },
  advanceBtn: { background: "#4945FF", border: "none", color: "#fff", fontSize: 14, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", padding: "12px 28px", borderRadius: 10, cursor: "pointer", transition: "all 0.15s" },
  backBtn: { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#71717a", fontSize: 13, fontFamily: "'DM Sans', sans-serif", padding: "10px 20px", borderRadius: 10, cursor: "pointer" },

  // Price step
  programToggle: { display: "flex", gap: 8, marginBottom: 20 },
  progBtn: { flex: 1, display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 12, border: "1.5px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)", cursor: "pointer", textAlign: "left", fontFamily: "'DM Sans', sans-serif", position: "relative", transition: "all 0.15s" },
  progBtnActive: { borderColor: "#4945FF", background: "rgba(73,69,255,0.06)" },
  progBtnActiveFR: { borderColor: "rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.04)" },
  progIcon: { fontSize: 20 },
  progLabel: { fontSize: 13, fontWeight: 600, color: "#fff" },
  progDesc: { fontSize: 10, color: "#52525b", marginTop: 1 },
  recommended: { position: "absolute", top: 8, right: 10, fontSize: 8, fontWeight: 700, letterSpacing: "0.08em", color: "#4945FF", background: "rgba(73,69,255,0.12)", padding: "2px 7px", borderRadius: 4 },

  priceGrid: { display: "grid", gridTemplateColumns: "1fr 280px", gap: 20 },
  priceMain: { display: "flex", flexDirection: "column", gap: 16 },

  rateLockup: { textAlign: "center", padding: "24px 20px", background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14 },
  merchantTag: { fontSize: 17, fontWeight: 600, color: "#fff", marginBottom: 6 },
  tierBadge: { display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 500, color: "#52525b", background: "rgba(255,255,255,0.04)", padding: "4px 12px", borderRadius: 20, marginBottom: 16 },
  tierDot: { width: 7, height: 7, borderRadius: "50%", display: "inline-block" },
  heroRow: { display: "flex", alignItems: "center", justifyContent: "center", gap: 0, margin: "8px 0" },
  heroBlock: { flex: 1, padding: "0 16px" },
  heroDivider: { width: 1, height: 60, background: "rgba(255,255,255,0.06)" },
  heroLabel: { fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#52525b", marginBottom: 8 },
  heroZero: { display: "flex", alignItems: "baseline", justifyContent: "center", gap: 2 },
  zeroNum: { fontSize: 48, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: "#22c55e", letterSpacing: "-0.04em", lineHeight: 1 },
  zeroPct: { fontSize: 20, fontWeight: 400, color: "#22c55e", opacity: 0.6, marginLeft: 2 },
  heroFee: { display: "flex", alignItems: "baseline", justifyContent: "center", gap: 2 },
  feeNum: { fontSize: 48, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: "#fff", letterSpacing: "-0.04em", lineHeight: 1 },
  feePct: { fontSize: 20, fontWeight: 400, color: "#4945FF", marginLeft: 2 },
  heroSub: { fontSize: 9, color: "#3f3f46", marginTop: 6, textTransform: "uppercase", letterSpacing: "0.04em" },
  monthlyTag: { display: "inline-block", fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: "#71717a", background: "rgba(255,255,255,0.03)", padding: "4px 10px", borderRadius: 6, marginTop: 12 },
  lockMsg: { display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#4945FF", marginTop: 12, fontWeight: 500, opacity: 0.7 },
  bigRate: { display: "flex", alignItems: "baseline", justifyContent: "center", gap: 2, margin: "8px 0" },
  bigRateNum: { fontSize: 56, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: "#fff", letterSpacing: "-0.04em", lineHeight: 1 },
  bigRatePct: { fontSize: 22, fontWeight: 400, color: "#4945FF", marginLeft: 2 },
  perTxn: { fontSize: 13, color: "#52525b", fontFamily: "'JetBrains Mono', monospace" },

  savingsBar: { border: "1px solid", borderRadius: 10, padding: "14px 18px" },
  savingsLabel: { fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "#52525b", marginBottom: 4 },
  savingsVal: { fontSize: 22, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "-0.02em" },

  // Economics sidebar
  econSidebar: { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14 },
  econHeader: { display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "#52525b" },
  econDot: { width: 5, height: 5, borderRadius: "50%", background: "#4945FF" },
  econNote: { fontWeight: 400, fontSize: 9, color: "#3f3f46", textTransform: "none", letterSpacing: 0, marginLeft: 4 },
  econStack: { display: "flex", flexDirection: "column", gap: 8 },
  econRow: { display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "baseline" },
  econRowLabel: { fontSize: 11, color: "#52525b" },
  econRowVal: { fontSize: 15, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: "#a1a1aa" },
  econRowSub: { width: "100%", textAlign: "right", fontSize: 10, color: "#3f3f46", fontFamily: "'JetBrains Mono', monospace", marginTop: 1 },

  compMini: { background: "rgba(73,69,255,0.04)", borderRadius: 8, padding: "12px 14px", marginTop: 4 },
  compMiniLabel: { fontSize: 10, fontWeight: 500, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 },
  compMiniRow: { display: "flex", alignItems: "center", gap: 8 },
  compMiniDelta: { fontSize: 11, marginTop: 6, fontWeight: 500 },

  // Playbook
  playbookHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, padding: "20px 24px", background: "rgba(73,69,255,0.04)", border: "1px solid rgba(73,69,255,0.1)", borderRadius: 14 },
  playbookTitle: { fontSize: 22, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" },
  playbookMeta: { fontSize: 12, color: "#71717a", marginTop: 4 },
  playbookBadge: { fontSize: 11, fontWeight: 600, color: "#a5a3ff", background: "rgba(73,69,255,0.1)", padding: "6px 12px", borderRadius: 8, whiteSpace: "nowrap" },

  playbookSection: { marginBottom: 24 },
  pbSectionHeader: { display: "flex", alignItems: "center", gap: 10, marginBottom: 12, fontSize: 14, fontWeight: 600, color: "#9ca3af" },
  pbNum: { width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, background: "rgba(73,69,255,0.12)", color: "#a5a3ff", fontFamily: "'JetBrains Mono', monospace" },
  pbNote: { fontSize: 11, fontWeight: 400, color: "#3f3f46", marginLeft: 4 },
  pbCard: { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "18px 22px" },
  pbText: { fontSize: 14, color: "#d4d4d8", lineHeight: 1.65, margin: 0 },

  objStack: { display: "flex", flexDirection: "column", gap: 6 },
  objCard: { border: "1px solid rgba(255,255,255,0.05)", borderRadius: 10, overflow: "hidden", transition: "border-color 0.15s" },
  objHeader: { width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", background: "rgba(255,255,255,0.02)", border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", textAlign: "left" },
  objTitle: { fontSize: 14, fontWeight: 600, color: "#d4d4d8" },
  objChevron: { fontSize: 14, color: "#52525b", transition: "transform 0.2s" },
  objBody: { padding: "0 18px 18px", display: "flex", flexDirection: "column", gap: 12 },
  objReframe: { fontSize: 12, fontWeight: 600, color: "#a5a3ff", fontStyle: "italic" },
  objTalkLabel: { fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "#52525b" },
  objTalk: { fontSize: 13, color: "#d4d4d8", lineHeight: 1.6, padding: "12px 16px", background: "rgba(73,69,255,0.04)", borderRadius: 8, borderLeft: "3px solid #4945FF" },
  objData: { fontSize: 12, color: "#71717a", lineHeight: 1.5, display: "flex", alignItems: "flex-start", gap: 8 },
  objDataIcon: { flexShrink: 0, marginTop: 1 },

  quickRef: { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "16px 20px", marginTop: 8 },
  qrTitle: { fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "#52525b", marginBottom: 12 },
  qrRow: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 },
  qrItem: {},
  qrLabel: { fontSize: 10, color: "#3f3f46", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" },
  qrVal: { fontSize: 16, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: "#fff" },
};