import React, { useState, useCallback, useMemo } from 'react';
import {
  Calculator, RotateCcw, ChevronRight, ChevronDown, Lock,
  AlertTriangle, CheckCircle, TrendingUp, DollarSign, Users,
  Building2, ShoppingCart, Wrench, Scissors, Heart, Briefcase,
  Package, BarChart3, ArrowRight,
} from 'lucide-react';

// ─── PRICING MATRICES ───
const CASH_DISCOUNT_MATRIX: Record<string, Record<string, { serviceFee: number; monthlyFee: number }>> = {
  '0-10k':    { low: { serviceFee: 3.99, monthlyFee: 49 }, medium: { serviceFee: 3.99, monthlyFee: 69 }, high: { serviceFee: 4.00, monthlyFee: 99 } },
  '10k-25k':  { low: { serviceFee: 3.99, monthlyFee: 49 }, medium: { serviceFee: 3.99, monthlyFee: 69 }, high: { serviceFee: 4.00, monthlyFee: 89 } },
  '25k-50k':  { low: { serviceFee: 3.99, monthlyFee: 39 }, medium: { serviceFee: 3.99, monthlyFee: 59 }, high: { serviceFee: 4.00, monthlyFee: 79 } },
  '50k-100k': { low: { serviceFee: 3.99, monthlyFee: 29 }, medium: { serviceFee: 3.99, monthlyFee: 49 }, high: { serviceFee: 4.00, monthlyFee: 69 } },
  '100k+':    { low: { serviceFee: 3.99, monthlyFee: 0 },  medium: { serviceFee: 3.99, monthlyFee: 29 }, high: { serviceFee: 4.00, monthlyFee: 49 } },
};

const FLAT_RATE_MATRIX: Record<string, Record<string, { rate: number; perTxn: number }>> = {
  '0-10k':    { low: { rate: 2.95, perTxn: 0.15 }, medium: { rate: 3.25, perTxn: 0.18 }, high: { rate: 3.65, perTxn: 0.22 } },
  '10k-25k':  { low: { rate: 2.75, perTxn: 0.12 }, medium: { rate: 3.05, perTxn: 0.15 }, high: { rate: 3.45, perTxn: 0.20 } },
  '25k-50k':  { low: { rate: 2.55, perTxn: 0.10 }, medium: { rate: 2.85, perTxn: 0.12 }, high: { rate: 3.25, perTxn: 0.18 } },
  '50k-100k': { low: { rate: 2.40, perTxn: 0.08 }, medium: { rate: 2.65, perTxn: 0.10 }, high: { rate: 3.05, perTxn: 0.15 } },
  '100k+':    { low: { rate: 2.25, perTxn: 0.06 }, medium: { rate: 2.50, perTxn: 0.08 }, high: { rate: 2.85, perTxn: 0.12 } },
};

const VOLUME_BANDS = [
  { key: '0-10k', label: 'Under $10K', midpoint: 5000 },
  { key: '10k-25k', label: '$10K – $25K', midpoint: 17500 },
  { key: '25k-50k', label: '$25K – $50K', midpoint: 37500 },
  { key: '50k-100k', label: '$50K – $100K', midpoint: 75000 },
  { key: '100k+', label: '$100K+', midpoint: 150000 },
];

const RISK_TIERS = [
  { key: 'low', label: 'Low Risk', desc: 'Retail, professional svcs, healthcare', color: '#22c55e', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-300' },
  { key: 'medium', label: 'Medium Risk', desc: 'Restaurants, e-comm, subscription', color: '#f59e0b', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-300' },
  { key: 'high', label: 'High Risk', desc: 'CBD, nutra, travel, high-chargeback', color: '#ef4444', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-300' },
];

const MERCHANT_TYPES = [
  { key: 'restaurant', label: 'Restaurant / Bar', icon: '🍽️', cdScore: 92, cardRatioDefault: 65 },
  { key: 'retail', label: 'Retail Store', icon: '🏪', cdScore: 88, cardRatioDefault: 80 },
  { key: 'auto', label: 'Auto / Repair', icon: '🔧', cdScore: 95, cardRatioDefault: 55 },
  { key: 'salon', label: 'Salon / Spa', icon: '💈', cdScore: 85, cardRatioDefault: 75 },
  { key: 'medical', label: 'Medical / Dental', icon: '🏥', cdScore: 70, cardRatioDefault: 85 },
  { key: 'professional', label: 'Professional Svcs', icon: '💼', cdScore: 65, cardRatioDefault: 90 },
  { key: 'ecommerce', label: 'E-Commerce', icon: '🛒', cdScore: 20, cardRatioDefault: 98 },
  { key: 'other', label: 'Other', icon: '📦', cdScore: 75, cardRatioDefault: 70 },
];

const RECEPTIVITY_LEVELS = [
  { key: 'eager', label: 'Open to it', desc: 'Already aware or interested', color: '#22c55e' },
  { key: 'neutral', label: 'Needs education', desc: "Hasn't heard of it or unsure", color: '#f59e0b' },
  { key: 'resistant', label: 'Pushback', desc: 'Worried about customer reaction', color: '#ef4444' },
];

const OBJECTIONS: Record<string, { title: string; reframe: string; talk: string; data: string }> = {
  customers_upset: {
    title: '"My customers will be upset"',
    reframe: "Reframe: it's not a surcharge — it's a discount for cash",
    talk: '"You\'re not charging more for cards — you\'re offering a discount for paying cash. Your posted prices stay the same. Gas stations have done this for decades and nobody blinks. We\'ll handle all the signage and compliance so your customers see it as a perk, not a penalty."',
    data: '97% of consumers complete the transaction even after seeing the fee. Churn from cash discount programs is under 1% in retail and food service.',
  },
  lose_sales: {
    title: '"I\'ll lose sales"',
    reframe: 'Reframe: your effective rate is 0% — reinvest that into growth',
    talk: '"Right now you\'re paying $X,000/year in processing fees. That\'s money leaving your business. On cash discount, that goes to zero. You could put that into marketing, staff, inventory — things that actually drive sales. The fee is transparent, it\'s legal, and your competitors are already doing it."',
    data: 'Average merchant saves $8,400/yr on cash discount. Less than 0.5% of merchants report measurable sales decline after 90 days.',
  },
  too_complicated: {
    title: '"Sounds complicated"',
    reframe: 'Reframe: we handle everything — zero work for you',
    talk: '"We program the terminal, provide the signage, and handle compliance. Your staff doesn\'t do anything different. The adjustment shows automatically on the receipt. It\'s genuinely plug-and-play — we\'ve done this hundreds of times."',
    data: 'Average onboarding takes 15 minutes. Terminal auto-applies the adjustment — no manual entry, no training required.',
  },
  is_it_legal: {
    title: '"Is this legal?"',
    reframe: "Reframe: it's a cash discount, not a surcharge — fully compliant",
    talk: '"Cash discounting is legal in all 50 states. It\'s different from surcharging, which has restrictions. We structure the program as a service fee with a cash discount — the same model gas stations use. We handle all signage requirements and receipt language to keep you compliant."',
    data: 'Legal in all 50 states. Visa, Mastercard, and Discover all permit properly structured cash discount programs. We handle compliance.',
  },
  customers_will_leave: {
    title: '"Customers will go to my competitor"',
    reframe: 'Reframe: your competitor is probably already doing this',
    talk: '"Honestly, a lot of your competitors are already on cash discount — they\'re just not advertising it. The businesses still paying 3-4% on every swipe are the ones falling behind. This is becoming the standard, not the exception."',
    data: 'Cash discount adoption among SMBs has grown 340% since 2020. In food service and auto repair, over 40% of merchants now use some form of non-cash adjustment.',
  },
};

// ─── ENGINE ───
function getSellingStrategy(merchantType: string, receptivity: string, savings: string) {
  const mt = MERCHANT_TYPES.find(m => m.key === merchantType);
  if (!mt) return null;
  const cdScore = mt.cdScore;
  let approach: string, opener: string, keyObjections: string[], closingMove: string;

  if (cdScore >= 85) {
    if (receptivity === 'eager') {
      approach = 'Confirm & Close';
      opener = `Lead with the savings number. "${mt.label} owners love this because it eliminates processing costs entirely. Based on your volume, you'd save roughly ${savings}/year."`;
      keyObjections = ['too_complicated'];
      closingMove = 'Go straight to paperwork. They\'re ready — don\'t oversell. "Let me get this set up for you. We can have you live this week."';
    } else if (receptivity === 'neutral') {
      approach = 'Educate & Anchor';
      opener = 'Start with a question: "What are you currently paying in processing fees?" Let them say the number. Then: "What if that went to zero?" Pause. Let it land.';
      keyObjections = ['customers_upset', 'too_complicated'];
      closingMove = `Anchor to a peer: "Most ${mt.label.toLowerCase()} owners I work with switched within the first meeting once they saw the math. Want me to run your numbers?"`;
    } else {
      approach = 'Empathize & Prove';
      opener = 'Validate the concern first: "I get it — when I first heard about cash discount, I had the same reaction. But here\'s what changed my mind..." Then lead with the data.';
      keyObjections = ['customers_upset', 'lose_sales', 'customers_will_leave'];
      closingMove = 'Offer a trial frame: "Tell you what — try it for 60 days. If you don\'t like it, we switch you to flat rate, no penalty. But I\'ve never had someone switch back."';
    }
  } else if (cdScore >= 50) {
    if (receptivity === 'eager') {
      approach = 'Validate & Structure';
      opener = `They're interested but this vertical has nuance. "Cash discount works great for your business — let me show you exactly how we structure it so it feels seamless for your clients."`;
      keyObjections = ['is_it_legal', 'customers_upset'];
      closingMove = 'Position the monthly fee as the "all-in cost" — compare it to what they\'re paying now. The delta sells itself.';
    } else if (receptivity === 'neutral') {
      approach = 'Numbers First';
      opener = 'Lead with their statement. "I looked at your processing — you\'re paying X%. On cash discount, your effective rate goes to zero. The math is pretty hard to argue with."';
      keyObjections = ['customers_upset', 'is_it_legal', 'too_complicated'];
      closingMove = `Side-by-side comparison: "Here's what you pay now, here's what you'd pay. The difference is ${savings}/year back in your pocket."`;
    } else {
      approach = 'Flat Rate Bridge';
      opener = `Start with flat rate as the "safe" option, then introduce cash discount as the upgrade: "We can definitely do flat rate at X%. But honestly, most of my ${mt.label.toLowerCase()} clients end up on cash discount once they see the savings."`;
      keyObjections = ['customers_upset', 'lose_sales', 'is_it_legal', 'customers_will_leave'];
      closingMove = 'Offer flat rate as the fallback: "We can start you on flat rate today and revisit cash discount in 90 days once you\'ve seen how we operate. Sound fair?"';
    }
  } else {
    approach = 'Flat Rate Default';
    opener = `Cash discount is tough for online-only merchants since all transactions are card. Lead with flat rate: "For e-commerce, we've got a clean flat rate at X% — no hidden fees, no surprises."`;
    keyObjections = [];
    closingMove = 'Focus on the Delt ecosystem value — payments are the wedge, then layer in websites, Lens AI, and capital as the retention play.';
  }

  return { approach, opener, keyObjections, closingMove, cdScore };
}

const INTERCHANGE_EST = 1.80;
const AVG_TICKET_PRESETS: Record<string, number> = { '0-10k': 25, '10k-25k': 35, '25k-50k': 45, '50k-100k': 55, '100k+': 65 };

// ─── HELPERS ───
const fmt = (n: number | null | undefined) => n != null ? '$' + Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 0 }) : '—';
const fmtSigned = (n: number | null | undefined) => n != null ? (n >= 0 ? '+' : '-') + '$' + Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 0 }) : '—';

// ══════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════
export function BackendCostCalculator() {
  const [step, setStep] = useState(1);
  const [program, setProgram] = useState('cash_discount');
  const [volumeBand, setVolumeBand] = useState<string | null>(null);
  const [riskTier, setRiskTier] = useState<string | null>(null);
  const [merchantType, setMerchantType] = useState<string | null>(null);
  const [receptivity, setReceptivity] = useState<string | null>(null);
  const [avgTicket, setAvgTicket] = useState('');
  const [currentRate, setCurrentRate] = useState('');
  const [merchantName, setMerchantName] = useState('');
  const [cardRatio, setCardRatio] = useState('');
  const [expandedObj, setExpandedObj] = useState<string | null>(null);

  const isCashDiscount = program === 'cash_discount';
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

  const savingsStr = merchantSavings != null ? '$' + Math.abs(merchantSavings).toLocaleString('en-US', { maximumFractionDigits: 0 }) : '$X,XXX';

  const strategy = useMemo(() => {
    if (!merchantType || !receptivity) return null;
    return getSellingStrategy(merchantType, receptivity, savingsStr);
  }, [merchantType, receptivity, savingsStr]);

  const reset = useCallback(() => {
    setStep(1); setProgram('cash_discount'); setVolumeBand(null); setRiskTier(null);
    setMerchantType(null); setReceptivity(null); setAvgTicket(''); setCurrentRate('');
    setMerchantName(''); setCardRatio(''); setExpandedObj(null);
  }, []);

  const canAdvanceTo2 = merchantType && receptivity && volumeBand && riskTier;
  const cdScore = mtData ? mtData.cdScore : 0;
  const cdScoreColor = cdScore >= 80 ? 'text-emerald-600' : cdScore >= 50 ? 'text-amber-600' : 'text-red-600';
  const cdScoreBarColor = cdScore >= 80 ? 'bg-emerald-500' : cdScore >= 50 ? 'bg-amber-500' : 'bg-red-500';
  const cdScoreLabel = cdScore >= 80 ? 'High Fit' : cdScore >= 50 ? 'Moderate Fit' : 'Low Fit — Consider Flat Rate';

  const steps = [
    { n: 1, label: 'Qualify' },
    { n: 2, label: 'Price' },
    { n: 3, label: 'Playbook' },
  ];

  return (
    <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Cost Calculator</h2>
          </div>
          <button onClick={reset} className="px-3.5 py-2 border border-gray-200 rounded-[6px] text-sm text-gray-500 bg-white hover:bg-gray-50 inline-flex items-center gap-2 font-medium transition-colors">
            <RotateCcw className="w-3.5 h-3.5" /> Start Over
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex gap-1 bg-gray-100 rounded-[8px] p-1">
          {steps.map(s => {
            const isActive = step === s.n;
            const isDone = step > s.n;
            const canClick = s.n <= step || (s.n === 2 && canAdvanceTo2) || (s.n === 3 && canAdvanceTo2);
            return (
              <button
                key={s.n}
                onClick={() => canClick && setStep(s.n)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[6px] text-sm font-medium transition-all ${
                  isActive ? 'bg-white shadow-sm text-gray-900' : isDone ? 'text-emerald-600' : 'text-gray-400'
                } ${canClick ? 'cursor-pointer' : 'cursor-default opacity-40'}`}
              >
                <span className={`w-5.5 h-5.5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                  isActive ? 'bg-brand text-white' : isDone ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-200 text-gray-400'
                }`} style={{ width: 22, height: 22 }}>
                  {isDone ? '✓' : s.n}
                </span>
                {s.label}
              </button>
            );
          })}
        </div>

        {/* ═══ STEP 1: QUALIFY ═══ */}
        {step === 1 && (
          <div className="space-y-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left */}
              <div className="space-y-5">
                {/* Merchant Name */}
                <FieldGroup label="Merchant Name">
                  <input
                    type="text" value={merchantName} onChange={e => setMerchantName(e.target.value)}
                    placeholder="e.g. Mario's Pizzeria"
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-[8px] text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                  />
                </FieldGroup>

                {/* Business Type */}
                <FieldGroup label="Business Type">
                  <div className="grid grid-cols-4 gap-2">
                    {MERCHANT_TYPES.map(mt => (
                      <button
                        key={mt.key}
                        onClick={() => { setMerchantType(mt.key); setCardRatio(''); }}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-[8px] border transition-all text-center ${
                          merchantType === mt.key
                            ? 'border-brand bg-indigo-50/50'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <span className="text-lg">{mt.icon}</span>
                        <span className="text-[11px] font-medium text-gray-600 leading-tight">{mt.label}</span>
                      </button>
                    ))}
                  </div>
                </FieldGroup>

                {/* Volume Band */}
                <FieldGroup label="Monthly Card Volume">
                  <div className="flex flex-wrap gap-2">
                    {VOLUME_BANDS.map(band => (
                      <button
                        key={band.key}
                        onClick={() => setVolumeBand(band.key)}
                        className={`px-3 py-1.5 rounded-[6px] text-xs font-medium font-mono transition-all ${
                          volumeBand === band.key
                            ? 'bg-brand text-white'
                            : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}
                      >
                        {band.label}
                      </button>
                    ))}
                  </div>
                </FieldGroup>

                {/* Risk */}
                <FieldGroup label="Risk Category">
                  <div className="space-y-1.5">
                    {RISK_TIERS.map(tier => {
                      const active = riskTier === tier.key;
                      return (
                        <button
                          key={tier.key}
                          onClick={() => setRiskTier(tier.key)}
                          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-[8px] border transition-all text-left ${
                            active ? `${tier.bg} ${tier.border}` : 'border-gray-200 bg-white hover:bg-gray-50'
                          }`}
                        >
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: tier.color, boxShadow: active ? `0 0 8px ${tier.color}40` : 'none' }} />
                          <div>
                            <p className={`text-sm font-semibold ${active ? tier.text : 'text-gray-700'}`}>{tier.label}</p>
                            <p className="text-[11px] text-gray-500">{tier.desc}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </FieldGroup>
              </div>

              {/* Right */}
              <div className="space-y-5">
                {/* Receptivity */}
                <FieldGroup label="Cash Discount Receptivity" hint="How did the merchant respond when you brought up cash discount?">
                  <div className="space-y-2">
                    {RECEPTIVITY_LEVELS.map(r => {
                      const active = receptivity === r.key;
                      return (
                        <button
                          key={r.key}
                          onClick={() => setReceptivity(r.key)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-[8px] border transition-all text-left ${
                            active ? 'border-brand bg-indigo-50/30' : 'border-gray-200 bg-white hover:bg-gray-50'
                          }`}
                        >
                          <span className="w-3 h-3 rounded-full shrink-0" style={{ background: r.color, boxShadow: active ? `0 0 10px ${r.color}50` : 'none' }} />
                          <div>
                            <p className={`text-sm font-semibold ${active ? 'text-gray-900' : 'text-gray-600'}`}>{r.label}</p>
                            <p className="text-[11px] text-gray-500">{r.desc}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </FieldGroup>

                {/* CD Fit Score */}
                {merchantType && (
                  <div className="bg-white border border-gray-200 rounded-[8px] p-4">
                    <div className="flex justify-between items-center mb-2.5">
                      <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Cash Discount Fit</span>
                      <span className={`text-lg font-bold font-mono ${cdScoreColor}`}>{cdScore}/100</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2">
                      <div className={`h-full rounded-full ${cdScoreBarColor}`} style={{ width: `${cdScore}%`, transition: 'width 0.4s ease' }} />
                    </div>
                    <p className={`text-xs font-semibold ${cdScoreColor}`}>{cdScoreLabel}</p>
                    {cdScore < 50 && (
                      <p className="text-[11px] text-gray-500 mt-2 p-2 bg-red-50 rounded-[6px] leading-relaxed">
                        This vertical is tough for cash discount — most transactions are card-not-present. The playbook will default to flat rate with a cash discount upsell path.
                      </p>
                    )}
                  </div>
                )}

                {/* Overrides */}
                <FieldGroup label="Optional Overrides">
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="text-[10px] text-gray-500 uppercase tracking-wide font-medium mb-1 block">Avg Ticket $</label>
                      <input type="number" value={avgTicket} onChange={e => setAvgTicket(e.target.value)}
                        placeholder={bandData ? `~$${AVG_TICKET_PRESETS[bandData.key]}` : '—'}
                        className="w-full px-2.5 py-2 bg-white border border-gray-200 rounded-[6px] text-sm font-mono text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] text-gray-500 uppercase tracking-wide font-medium mb-1 block">Current Rate %</label>
                      <input type="number" step="0.01" value={currentRate} onChange={e => setCurrentRate(e.target.value)}
                        placeholder="e.g. 3.50"
                        className="w-full px-2.5 py-2 bg-white border border-gray-200 rounded-[6px] text-sm font-mono text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] text-gray-500 uppercase tracking-wide font-medium mb-1 block">Card %</label>
                      <input type="number" value={cardRatio} onChange={e => setCardRatio(e.target.value)}
                        placeholder={mtData ? `~${mtData.cardRatioDefault}%` : '70'}
                        className="w-full px-2.5 py-2 bg-white border border-gray-200 rounded-[6px] text-sm font-mono text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                      />
                    </div>
                  </div>
                </FieldGroup>
              </div>
            </div>

            {canAdvanceTo2 && (
              <div className="flex justify-end pt-5 border-t border-gray-100 mt-6">
                <button onClick={() => setStep(2)} className="delt-btn-primary">
                  Continue to Pricing <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* ═══ STEP 2: PRICE ═══ */}
        {step === 2 && canAdvanceTo2 && (
          <div className="space-y-5">
            {/* Program Toggle */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setProgram('cash_discount')}
                className={`relative flex items-center gap-3 p-4 rounded-[8px] border text-left transition-all ${
                  isCashDiscount ? 'border-brand bg-indigo-50/30' : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
              >
                <span className="text-xl">💰</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">Cash Discount</p>
                  <p className="text-[11px] text-gray-500">0% effective rate — fee to card customers</p>
                </div>
                {isCashDiscount && (
                  <span className="absolute top-2 right-2.5 text-[9px] font-bold tracking-wide text-brand bg-indigo-100 px-2 py-0.5 rounded">RECOMMENDED</span>
                )}
              </button>
              <button
                onClick={() => setProgram('flat_rate')}
                className={`flex items-center gap-3 p-4 rounded-[8px] border text-left transition-all ${
                  !isCashDiscount ? 'border-gray-400 bg-gray-50' : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
              >
                <span className="text-xl">📊</span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Flat Rate</p>
                  <p className="text-[11px] text-gray-500">Traditional — merchant absorbs cost</p>
                </div>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5">
              {/* Pricing Output */}
              <div className="space-y-4">
                <div className="bg-white border border-gray-200 rounded-[8px] p-6 text-center">
                  {merchantName && <p className="text-lg font-semibold text-gray-900 mb-1">{merchantName}</p>}
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-[11px] text-gray-500 font-medium mb-5">
                    <span className="w-2 h-2 rounded-full" style={{ background: riskData?.color }} />
                    {riskData?.label} · {bandData?.label}/mo
                  </div>

                  {isCashDiscount ? (
                    <div className="flex items-center justify-center gap-0">
                      <div className="flex-1 px-4">
                        <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Merchant Effective Rate</p>
                        <p className="text-5xl font-bold text-emerald-600 font-mono leading-none">0.00<span className="text-xl opacity-60 ml-0.5">%</span></p>
                        <p className="text-[9px] text-gray-400 uppercase tracking-wide mt-2">processing cost eliminated</p>
                      </div>
                      <div className="w-px h-16 bg-gray-200" />
                      <div className="flex-1 px-4">
                        <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Service Fee to Card Customers</p>
                        <p className="text-5xl font-bold text-gray-900 font-mono leading-none">{cdPricing?.serviceFee.toFixed(2)}<span className="text-xl text-brand ml-0.5">%</span></p>
                        <p className="text-[9px] text-gray-400 uppercase tracking-wide mt-2">non-cash adjustment</p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-6xl font-bold text-gray-900 font-mono leading-none">{frPricing?.rate.toFixed(2)}<span className="text-2xl text-brand ml-0.5">%</span></p>
                      <p className="text-sm text-gray-500 font-mono mt-2">+ ${frPricing?.perTxn.toFixed(2)} per transaction</p>
                    </div>
                  )}

                  {isCashDiscount && cdPricing && cdPricing.monthlyFee > 0 && (
                    <p className="inline-block mt-4 text-xs font-mono text-gray-500 bg-gray-100 px-3 py-1 rounded-[6px]">${cdPricing.monthlyFee}/mo program fee</p>
                  )}

                  <div className="flex items-center justify-center gap-1.5 mt-4 text-[10px] text-brand font-medium">
                    <Lock className="w-3 h-3" /> Matrix-locked — no discretionary adjustments
                  </div>
                </div>

                {/* Savings */}
                {merchantSavings != null && (
                  <div className={`border rounded-[8px] p-4 ${merchantSavings > 0 ? 'border-emerald-200 bg-emerald-50/50' : 'border-red-200 bg-red-50/50'}`}>
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Merchant Saves</p>
                    <p className={`text-2xl font-bold font-mono ${merchantSavings > 0 ? 'text-emerald-600' : 'text-red-600'}`}>{fmtSigned(merchantSavings)}/yr</p>
                  </div>
                )}
              </div>

              {/* Delt Economics Sidebar */}
              <div className="bg-gray-50 border border-gray-200 rounded-[8px] p-4 space-y-3 h-fit">
                <div className="flex items-center gap-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand" /> Delt Economics <span className="text-gray-400 font-normal normal-case text-[9px]">(internal)</span>
                </div>

                {isCashDiscount ? (
                  <div className="space-y-2">
                    <EconRow label="Spread Revenue" value={cdAnnual ? fmt(cdAnnual.feeRevenue - cdAnnual.interchangeCost) : '—'} />
                    <EconRow label="Program Fees" value={cdAnnual ? fmt(cdAnnual.monthlyFees) : '—'} />
                    <EconRow label="Total Revenue" value={cdAnnual ? fmt(cdAnnual.grossRevenue) : '—'} accent />
                    <EconRow label="Annual Margin" value={cdAnnual ? fmt(cdAnnual.margin) : '—'} color="text-emerald-600"
                      sub={cdAnnual ? `${((cdAnnual.margin / cdAnnual.grossRevenue) * 100).toFixed(1)}%` : undefined} />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <EconRow label="Annual Revenue" value={frAnnual ? fmt(frAnnual.grossRevenue) : '—'} accent />
                    <EconRow label="Annual Margin" value={frAnnual ? fmt(frAnnual.margin) : '—'} color="text-emerald-600"
                      sub={frAnnual ? `${((frAnnual.margin / frAnnual.grossRevenue) * 100).toFixed(1)}%` : undefined} />
                  </div>
                )}

                {cdAnnual && frAnnual && (
                  <div className="bg-indigo-50 rounded-[6px] p-3 mt-2">
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">CD vs Flat Rate Margin</p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold font-mono text-emerald-600">{fmt(cdAnnual.margin)}</span>
                      <span className="text-[11px] text-gray-400">vs</span>
                      <span className="text-sm font-bold font-mono text-gray-500">{fmt(frAnnual.margin)}</span>
                    </div>
                    <p className="text-[11px] mt-1.5 font-medium">
                      {cdAnnual.margin > frAnnual.margin
                        ? <span className="text-emerald-600">CD wins by {fmt(cdAnnual.margin - frAnnual.margin)}/yr</span>
                        : <span className="text-amber-600">Flat rate wins by {fmt(frAnnual.margin - cdAnnual.margin)}/yr</span>}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between pt-5 border-t border-gray-100">
              <button onClick={() => setStep(1)} className="px-4 py-2 border border-gray-200 rounded-[6px] text-sm text-gray-500 bg-white hover:bg-gray-50 font-medium">← Back</button>
              <button onClick={() => setStep(3)} className="delt-btn-primary">
                View Playbook <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ═══ STEP 3: PLAYBOOK ═══ */}
        {step === 3 && strategy && (
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between bg-indigo-50/50 border border-indigo-100 rounded-[8px] p-5">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{strategy.approach}</h2>
                <p className="delt-page-subtitle">
                  {merchantName || mtData?.label} · {RECEPTIVITY_LEVELS.find(r => r.key === receptivity)?.label} · CD Fit: {cdScore}/100
                </p>
              </div>
              <span className="text-[11px] font-semibold text-brand bg-indigo-100 px-3 py-1.5 rounded-[6px] whitespace-nowrap">
                {isCashDiscount ? 'Cash Discount' : 'Flat Rate'} · {bandData?.label}/mo
              </span>
            </div>

            {/* Opening Move */}
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <span className="w-6 h-6 rounded-full bg-indigo-100 text-brand flex items-center justify-center text-xs font-bold font-mono">1</span>
                <span className="text-sm font-semibold text-gray-700">Opening Move</span>
              </div>
              <div className="bg-white border border-gray-200 rounded-[8px] p-4">
                <p className="text-sm text-gray-700 leading-relaxed">{strategy.opener}</p>
              </div>
            </div>

            {/* Objections */}
            {strategy.keyObjections.length > 0 && (
              <div>
                <div className="flex items-center gap-2.5 mb-3">
                  <span className="w-6 h-6 rounded-full bg-indigo-100 text-brand flex items-center justify-center text-xs font-bold font-mono">2</span>
                  <span className="text-sm font-semibold text-gray-700">Handle These Objections</span>
                  <span className="text-[11px] text-gray-400">Most likely for this merchant profile</span>
                </div>
                <div className="space-y-2">
                  {/* Primary objections */}
                  {strategy.keyObjections.map(objKey => {
                    const obj = OBJECTIONS[objKey];
                    if (!obj) return null;
                    const isOpen = expandedObj === objKey;
                    return (
                      <div key={objKey} className={`border rounded-[8px] overflow-hidden transition-colors ${isOpen ? 'border-brand/20' : 'border-gray-200'}`}>
                        <button onClick={() => setExpandedObj(isOpen ? null : objKey)} className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 text-left transition-colors">
                          <span className="text-sm font-semibold text-gray-800">{obj.title}</span>
                          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isOpen && (
                          <div className="px-4 pb-4 space-y-3 bg-white">
                            <p className="text-xs font-semibold text-brand italic">{obj.reframe}</p>
                            <div>
                              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">What to say:</p>
                              <div className="text-sm text-gray-700 leading-relaxed p-3 bg-indigo-50/50 rounded-[6px] border-l-3 border-brand" style={{ borderLeft: '3px solid #4318FF' }}>
                                {obj.talk}
                              </div>
                            </div>
                            <div className="flex items-start gap-2 text-xs text-gray-500 leading-relaxed">
                              <BarChart3 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-gray-400" />
                              {obj.data}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {/* Secondary objections */}
                  {Object.keys(OBJECTIONS).filter(k => !strategy.keyObjections.includes(k)).map(objKey => {
                    const obj = OBJECTIONS[objKey];
                    const isOpen = expandedObj === objKey;
                    return (
                      <div key={objKey} className={`border rounded-[8px] overflow-hidden opacity-60 transition-colors ${isOpen ? 'border-brand/15 opacity-100' : 'border-gray-100'}`}>
                        <button onClick={() => setExpandedObj(isOpen ? null : objKey)} className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 text-left transition-colors">
                          <span className="text-sm font-medium text-gray-600">{obj.title}</span>
                          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isOpen && (
                          <div className="px-4 pb-4 space-y-3 bg-white">
                            <p className="text-xs font-semibold text-brand italic">{obj.reframe}</p>
                            <div>
                              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">What to say:</p>
                              <div className="text-sm text-gray-700 leading-relaxed p-3 bg-indigo-50/50 rounded-[6px]" style={{ borderLeft: '3px solid #4318FF' }}>
                                {obj.talk}
                              </div>
                            </div>
                            <div className="flex items-start gap-2 text-xs text-gray-500 leading-relaxed">
                              <BarChart3 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-gray-400" />
                              {obj.data}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Closing Move */}
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold font-mono">
                  {strategy.keyObjections.length > 0 ? '3' : '2'}
                </span>
                <span className="text-sm font-semibold text-gray-700">Closing Move</span>
              </div>
              <div className="bg-emerald-50/50 border border-emerald-200 rounded-[8px] p-4">
                <p className="text-sm text-gray-700 leading-relaxed">{strategy.closingMove}</p>
              </div>
            </div>

            {/* Quick Reference */}
            {merchantSavings != null && (
              <div className="bg-white border border-gray-200 rounded-[8px] p-4">
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-3">Quick Reference Numbers</p>
                <div className="grid grid-cols-4 gap-3">
                  <QRItem label="Merchant Saves" value={`${fmtSigned(merchantSavings)}/yr`} color="text-emerald-600" />
                  <QRItem label="Current Rate" value={`${parseFloat(currentRate).toFixed(2)}%`} />
                  <QRItem label="New Rate" value={isCashDiscount ? '0.00%' : `${frPricing?.rate.toFixed(2)}%`} color="text-emerald-600" />
                  <QRItem label="Delt Margin" value={`${isCashDiscount ? fmt(cdAnnual?.margin) : fmt(frAnnual?.margin)}/yr`} />
                </div>
              </div>
            )}

            <div className="flex justify-start pt-5 border-t border-gray-100">
              <button onClick={() => setStep(2)} className="px-4 py-2 border border-gray-200 rounded-[6px] text-sm text-gray-500 bg-white hover:bg-gray-50 font-medium">← Back to Pricing</button>
            </div>
          </div>
        )}
    </div>
  );
}

// ── Sub-components ──

function FieldGroup({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
      {hint && <p className="text-xs text-gray-400 -mt-1">{hint}</p>}
      {children}
    </div>
  );
}

function EconRow({ label, value, color, sub, accent }: { label: string; value: string; color?: string; sub?: string; accent?: boolean }) {
  return (
    <div className={`flex flex-wrap justify-between items-baseline ${accent ? 'border-t border-gray-200 pt-2.5 mt-1' : ''}`}>
      <span className="text-[11px] text-gray-500">{label}</span>
      <span className={`text-sm font-bold font-mono ${color || (accent ? 'text-gray-900' : 'text-gray-600')}`}>{value}</span>
      {sub && <span className="w-full text-right text-[10px] text-gray-400 font-mono">{sub}</span>}
    </div>
  );
}

function QRItem({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-base font-bold font-mono ${color || 'text-gray-900'}`}>{value}</p>
    </div>
  );
}