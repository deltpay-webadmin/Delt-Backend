import React, { useMemo, useState, useEffect, useRef } from 'react';
import { toast } from 'sonner@2.0.3';
import {
  ArrowLeft,
  Building2,
  ChevronDown,
  ChevronRight,
  Check,
  X,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  FileText,
  Printer,
} from 'lucide-react';
import { useAppNavigate } from '../NavigationContext';
import { useUnderwriting, underwritingActions, type UWApplication, type UWStage } from '../crmStore';
import {
  scorePlaid,
  scoreCrs,
  scoreDataMerch,
  computeComposite,
  tierFromComposite,
  evaluateDisqualifiers,
  stressTest,
  defaultScoreInputs,
  WEIGHTS,
  type PlaidInputs,
  type CrsInputs,
  type DataMerchInputs,
  type RevenueTrend,
  type DepositConcentration,
} from '../underwritingScore';

// ══════════════════════════════════════════════════════════════
// Helpers
// ══════════════════════════════════════════════════════════════
const fmt$ = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

const tierStyle: Record<string, { bg: string; text: string; ring: string }> = {
  'Tier 1': { bg: 'bg-emerald-500', text: 'text-emerald-700', ring: 'ring-emerald-500' },
  'Tier 2': { bg: 'bg-lime-500', text: 'text-lime-700', ring: 'ring-lime-500' },
  'Tier 3': { bg: 'bg-amber-500', text: 'text-amber-700', ring: 'ring-amber-500' },
  'Tier 4': { bg: 'bg-red-500', text: 'text-red-700', ring: 'ring-red-500' },
  Decline: { bg: 'bg-gray-400', text: 'text-gray-600', ring: 'ring-gray-400' },
};

function tierLabelFrom(tier: 1 | 2 | 3 | 4 | 'decline'): string {
  return tier === 'decline' ? 'Decline' : `Tier ${tier}`;
}

// ══════════════════════════════════════════════════════════════
// Small field components
// ══════════════════════════════════════════════════════════════
function NumField({
  label, value, onChange, step = 1, min, suffix, impact,
}: {
  label: string; value: number; onChange: (n: number) => void;
  step?: number; min?: number; suffix?: string; impact?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs text-gray-600">{label}</label>
        {impact && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-brand-50 text-brand">{impact}</span>}
      </div>
      <div className="relative">
        <input
          type="number"
          value={Number.isFinite(value) ? value : ''}
          step={step}
          min={min}
          onChange={e => onChange(parseFloat(e.target.value))}
          className="w-full px-2.5 py-1.5 border border-gray-200 rounded-[8px] text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
        />
        {suffix && <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">{suffix}</span>}
      </div>
    </div>
  );
}

function SelectField<T extends string>({
  label, value, options, onChange,
}: { label: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div>
      <label className="block text-xs text-gray-600 mb-1">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value as T)}
        className="w-full px-2.5 py-1.5 border border-gray-200 rounded-[8px] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function BoolField({ label, value, onChange }: { label: string; value: boolean; onChange: (b: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-1">
      <label className="text-xs text-gray-600">{label}</label>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative w-9 h-5 rounded-full transition-colors ${value ? 'bg-red-500' : 'bg-gray-200'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${value ? 'translate-x-4' : ''}`} />
      </button>
    </div>
  );
}

function Section({
  title, open, onToggle, children, score,
}: { title: string; open: boolean; onToggle: () => void; children: React.ReactNode; score?: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-[8px] overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50">
        <div className="flex items-center gap-2">
          {open ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
          <span className="text-sm font-semibold text-gray-900">{title}</span>
        </div>
        {score}
      </button>
      {open && <div className="px-4 pb-4 pt-1 border-t border-gray-100">{children}</div>}
    </div>
  );
}

function ScoreBar({ label, raw, weightPct, color }: { label: string; raw: number; weightPct: number; color: string }) {
  const weighted = (raw * weightPct) / 100;
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-gray-600">{label} <span className="text-gray-400">({weightPct}%)</span></span>
        <span className="font-semibold text-gray-900 tabular-nums">{raw}/100 → {weighted.toFixed(1)}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${raw}%` }} />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// Main
// ══════════════════════════════════════════════════════════════
export function UnderwritingDetail() {
  const { navigate, currentPage } = useAppNavigate();
  const allApps = useUnderwriting();

  const appIdFromUrl = currentPage.startsWith('/underwriting/') ? currentPage.split('/underwriting/')[1] : '';
  const app: UWApplication | undefined = useMemo(
    () => allApps.find(a => a.id === appIdFromUrl) || allApps[0],
    [allApps, appIdFromUrl],
  );

  // Seed defaults from the application's headline figures.
  const seeded = useMemo(
    () => defaultScoreInputs({
      monthlyRevenue: app?.monthlyRevenue,
      avgDailyBalance: app?.avgDailyBalance,
      fico: app?.creditScore,
      existingPositions: app?.existingPositions,
    }),
    [app?.id], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const [plaid, setPlaid] = useState<PlaidInputs>(app?.plaidInputs ?? seeded.plaid);
  const [crs, setCrs] = useState<CrsInputs>(app?.crsInputs ?? seeded.crs);
  const [dm, setDm] = useState<DataMerchInputs>(app?.dataMerchInputs ?? seeded.dataMerch);
  const [requested, setRequested] = useState<number>(app?.requestedAmount ?? 50000);
  const [proposedAdvance, setProposedAdvance] = useState<number>(app?.requestedAmount ?? 50000);

  const [openPlaid, setOpenPlaid] = useState(true);
  const [openCrs, setOpenCrs] = useState(false);
  const [openDm, setOpenDm] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [declineOpen, setDeclineOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [approving, setApproving] = useState(false);

  // Reload local editor state when navigating to a different application.
  const loadedId = useRef<string | undefined>(app?.id);
  useEffect(() => {
    if (app && app.id !== loadedId.current) {
      loadedId.current = app.id;
      const s = defaultScoreInputs({
        monthlyRevenue: app.monthlyRevenue,
        avgDailyBalance: app.avgDailyBalance,
        fico: app.creditScore,
        existingPositions: app.existingPositions,
      });
      setPlaid(app.plaidInputs ?? s.plaid);
      setCrs(app.crsInputs ?? s.crs);
      setDm(app.dataMerchInputs ?? s.dataMerch);
      setRequested(app.requestedAmount ?? 50000);
      setProposedAdvance(app.requestedAmount ?? 50000);
    }
  }, [app]);

  // ── Live scoring (pure engine) ──
  const result = useMemo(() => {
    const inputs = { plaid, crs, dataMerch: dm };
    const p = scorePlaid(plaid);
    const c = scoreCrs(crs);
    const d = scoreDataMerch(dm);
    const composite = computeComposite(p.total, c.total, d.total);
    const dq = evaluateDisqualifiers(inputs);
    const terms = dq.length > 0 ? tierFromComposite(0) : tierFromComposite(composite);
    return { p, c, d, composite, dq, terms };
  }, [plaid, crs, dm]);

  const factorMid = result.terms.factorMin > 0 ? (result.terms.factorMin + result.terms.factorMax) / 2 : 1.4;
  const stress = useMemo(() => stressTest({
    advanceAmount: proposedAdvance,
    factorRate: factorMid,
    termDays: 252,
    avgDailyRevenue: (plaid.monthlyRevenue || 0) / 21,
    avgDailyBalance: plaid.avgDailyBalance,
    tier: result.terms.tier,
  }), [proposedAdvance, factorMid, plaid.monthlyRevenue, plaid.avgDailyBalance, result.terms.tier]);

  const tierLabel = tierLabelFrom(result.terms.tier);
  const ts = tierStyle[tierLabel] ?? tierStyle.Decline;

  const canApprove =
    !!app &&
    result.dq.length === 0 &&
    result.terms.tier !== 'decline' &&
    (result.terms.tier as number) <= 3 &&
    stress.passes;

  // ── Persistence ──
  const saveDraft = (silent = false) => {
    if (!app) return;
    underwritingActions.updateInputs(app.id, {
      plaidInputs: plaid,
      crsInputs: crs,
      dataMerchInputs: dm,
      requestedAmount: requested,
    });
    if (!silent) toast.success('Draft saved');
  };

  // Autosave on input change (debounced).
  const firstRun = useRef(true);
  useEffect(() => {
    if (!app) return;
    if (firstRun.current) { firstRun.current = false; return; }
    const t = setTimeout(() => saveDraft(true), 700);
    return () => clearTimeout(t);
  }, [plaid, crs, dm, requested]); // eslint-disable-line react-hooks/exhaustive-deps

  const moveToReview = () => {
    if (!app) return;
    saveDraft(true);
    underwritingActions.setStage(app.id, 'Committee');
    toast.success('Moved to Review');
  };

  const confirmApprove = async () => {
    if (!app || approving) return;
    setApproving(true);
    saveDraft(true);
    const dealId = await underwritingActions.approve(app.id);
    setApproving(false);
    setApproveOpen(false);
    if (dealId) {
      toast.success(`Approved — Capital deal ${dealId} created`, { description: `${fmt$(requested)} funded.` });
      navigate(`/capital`);
    } else {
      toast.error('Approve failed — see console.');
    }
  };

  const confirmDecline = () => {
    if (!app) return;
    underwritingActions.decline(app.id, declineReason.trim() || undefined);
    setDeclineOpen(false);
    toast.error(`${app.businessName} declined`);
    navigate('/underwriting');
  };

  if (!app) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-3">No application found.</p>
          <button onClick={() => navigate('/underwriting')} className="text-sm text-brand hover:underline">← Back to pipeline</button>
        </div>
      </div>
    );
  }

  const stageDone = app.stage === 'Approved' || app.stage === 'Declined';

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="max-w-[1440px] mx-auto px-6 py-5 pb-28">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/underwriting')} className="p-1.5 hover:bg-gray-100 rounded-[8px]">
              <ArrowLeft className="w-4 h-4 text-gray-500" />
            </button>
            <div className="w-10 h-10 rounded-[8px] bg-brand-50 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-brand" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{app.businessName}</h1>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span className="font-mono">{app.applicationId}</span>
                <span>·</span>
                <span>{app.industry}</span>
                <span>·</span>
                <span>Stage: {app.stage}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* ── LEFT: Inputs ── */}
          <div className="lg:col-span-7 space-y-4">
            <Section
              title="Plaid Cash Flow Inputs"
              open={openPlaid}
              onToggle={() => setOpenPlaid(o => !o)}
              score={<span className="text-xs font-semibold text-brand">{result.p.total}/100</span>}
            >
              <div className="grid grid-cols-2 gap-3 pt-2">
                <NumField label="Avg Daily Balance" value={plaid.avgDailyBalance} step={500} min={0} suffix="$"
                  impact={`${result.p.components[0].points}/20`}
                  onChange={n => setPlaid({ ...plaid, avgDailyBalance: n })} />
                <NumField label="Min Daily Balance" value={plaid.minDailyBalance} step={500} suffix="$"
                  impact={`${result.p.components[1].points}/10`}
                  onChange={n => setPlaid({ ...plaid, minDailyBalance: n })} />
                <NumField label="Monthly Revenue (avg 3mo)" value={plaid.monthlyRevenue} step={1000} min={0} suffix="$"
                  onChange={n => setPlaid({ ...plaid, monthlyRevenue: n })} />
                <NumField label="Revenue σ (stddev/mean)" value={plaid.revenueStdDevPct} step={0.05} min={0} suffix="0–1"
                  impact={`${result.p.components[3].points}/15`}
                  onChange={n => setPlaid({ ...plaid, revenueStdDevPct: n })} />
                <NumField label="NSF count (90d)" value={plaid.nsfCount90d} step={1} min={0}
                  impact={`${result.p.components[2].points}/20`}
                  onChange={n => setPlaid({ ...plaid, nsfCount90d: n })} />
                <NumField label="Days since last NSF" value={plaid.daysSinceLastNsf} step={1} min={0}
                  impact={`${result.p.components[6].points}/10`}
                  onChange={n => setPlaid({ ...plaid, daysSinceLastNsf: n })} />
                <NumField label="Revenue change 3mo" value={plaid.revenueChange3moPct} step={0.05} suffix="±%"
                  onChange={n => setPlaid({ ...plaid, revenueChange3moPct: n })} />
                <SelectField<RevenueTrend> label="Revenue trend" value={plaid.revenueTrend}
                  options={[{ value: 'growing', label: 'Growing' }, { value: 'flat', label: 'Flat' }, { value: 'declining', label: 'Declining' }]}
                  onChange={v => setPlaid({ ...plaid, revenueTrend: v })} />
                <SelectField<DepositConcentration> label="Deposit concentration" value={plaid.depositConcentration}
                  options={[{ value: 'diversified', label: 'Diversified' }, { value: 'moderate', label: 'Moderate' }, { value: 'concentrated', label: 'Concentrated' }]}
                  onChange={v => setPlaid({ ...plaid, depositConcentration: v })} />
              </div>
            </Section>

            <Section
              title="CRS Credit Inputs"
              open={openCrs}
              onToggle={() => setOpenCrs(o => !o)}
              score={<span className="text-xs font-semibold text-brand">{result.c.total}/100</span>}
            >
              <div className="grid grid-cols-2 gap-3 pt-2">
                <NumField label="Personal FICO" value={crs.fico} step={5} min={300}
                  impact={`${result.c.components[0].points}/40`}
                  onChange={n => setCrs({ ...crs, fico: n })} />
                <NumField label="Business Credit (optional)" value={crs.businessCreditScore ?? 0} step={5} min={0}
                  onChange={n => setCrs({ ...crs, businessCreditScore: n || undefined })} />
                <NumField label="Derogatory marks" value={crs.derogatoryMarks} step={1} min={0}
                  impact={`${result.c.components[2].points}/15`}
                  onChange={n => setCrs({ ...crs, derogatoryMarks: n })} />
                <NumField label="Credit utilization" value={crs.creditUtilizationPct} step={0.05} min={0} suffix="0–1"
                  impact={`${result.c.components[3].points}/10`}
                  onChange={n => setCrs({ ...crs, creditUtilizationPct: n })} />
                <NumField label="Time in file (yrs)" value={crs.timeInFileYears} step={0.5} min={0}
                  impact={`${result.c.components[4].points}/10`}
                  onChange={n => setCrs({ ...crs, timeInFileYears: n })} />
                <div className="flex items-end pb-1">
                  <div className="w-full">
                    <BoolField label="Active bankruptcy" value={crs.activeBankruptcy} onChange={b => setCrs({ ...crs, activeBankruptcy: b })} />
                  </div>
                </div>
              </div>
            </Section>

            <Section
              title="DataMerch MCA Inputs"
              open={openDm}
              onToggle={() => setOpenDm(o => !o)}
              score={<span className="text-xs font-semibold text-brand">{result.d.total}/100</span>}
            >
              <div className="grid grid-cols-2 gap-3 pt-2">
                <NumField label="Prior MCA positions" value={dm.priorPositions} step={1} min={0}
                  impact={`${result.d.components[0].points}/25`}
                  onChange={n => setDm({ ...dm, priorPositions: n })} />
                <NumField label="Prior defaults" value={dm.priorDefaults} step={1} min={0}
                  impact={`${result.d.components[1].points}/30`}
                  onChange={n => setDm({ ...dm, priorDefaults: n })} />
                <NumField label="Current open positions" value={dm.currentOpenPositions} step={1} min={0}
                  impact={`${result.d.components[2].points}/20`}
                  onChange={n => setDm({ ...dm, currentOpenPositions: n })} />
                <NumField label="Early payoffs" value={dm.earlyPayoffs} step={1} min={0}
                  impact={`${result.d.components[4].points}/10`}
                  onChange={n => setDm({ ...dm, earlyPayoffs: n })} />
                <SelectField<string> label="Our position seniority" value={String(dm.positionSeniority)}
                  options={[{ value: '1', label: '1st (senior)' }, { value: '2', label: '2nd' }, { value: '3', label: '3rd' }, { value: '4', label: '4th+' }]}
                  onChange={v => setDm({ ...dm, positionSeniority: Number(v) as 1 | 2 | 3 | 4 })} />
              </div>
            </Section>

            <div className="bg-white border border-gray-200 rounded-[8px] p-4">
              <NumField label="Requested Amount" value={requested} step={5000} min={0} suffix="$"
                onChange={n => setRequested(n)} />
            </div>
          </div>

          {/* ── RIGHT: Score panel (sticky) ── */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-4 space-y-4">
              {/* Composite + tier */}
              <div className="bg-white border border-gray-200 rounded-[8px] p-5">
                <div className="flex items-center gap-4">
                  <div className={`w-20 h-20 rounded-full ring-4 ${ts.ring} flex flex-col items-center justify-center`}>
                    <span className="text-2xl font-bold text-gray-900 tabular-nums">{result.composite}</span>
                    <span className="text-[9px] text-gray-400 uppercase">/ 100</span>
                  </div>
                  <div>
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold text-white ${ts.bg}`}>{tierLabel}</span>
                    <p className="text-xs text-gray-500 mt-1.5">{result.terms.label}</p>
                  </div>
                </div>
                <div className="mt-5 space-y-3">
                  <ScoreBar label="Plaid Cash Flow" raw={result.p.total} weightPct={WEIGHTS.plaid * 100} color="bg-brand-500" />
                  <ScoreBar label="CRS Credit" raw={result.c.total} weightPct={WEIGHTS.crs * 100} color="bg-violet-500" />
                  <ScoreBar label="DataMerch MCA" raw={result.d.total} weightPct={WEIGHTS.dataMerch * 100} color="bg-cyan-500" />
                </div>
              </div>

              {/* Recommended terms */}
              {result.terms.tier !== 'decline' && (
                <div className="bg-white border border-gray-200 rounded-[8px] p-4">
                  <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-3">Recommended Terms</h3>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase">Factor</p>
                      <p className="text-sm font-bold text-gray-900">{result.terms.factorMin.toFixed(2)}–{result.terms.factorMax.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase">Holdback</p>
                      <p className="text-sm font-bold text-gray-900">{result.terms.holdbackMinPct}–{result.terms.holdbackMaxPct}%</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase">Max Advance</p>
                      <p className="text-sm font-bold text-gray-900">{fmt$(plaid.monthlyRevenue * result.terms.maxAdvancePctOfMonthlyRevenue)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Disqualifiers */}
              {result.dq.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-[8px] p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldAlert className="w-4 h-4 text-red-600" />
                    <span className="text-xs font-bold text-red-700 uppercase tracking-wide">Hard Disqualifiers</span>
                  </div>
                  <ul className="space-y-1.5">
                    {result.dq.map(d => (
                      <li key={d.code} className="flex items-start gap-1.5 text-xs text-red-700">
                        <X className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                        <span><strong>{d.label}:</strong> {d.reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Stress test */}
              <div className="bg-white border border-gray-200 rounded-[8px] p-4">
                <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-3">Income-to-Holdback Stress Test</h3>
                <NumField label="Proposed advance $" value={proposedAdvance} step={5000} min={0} suffix="$"
                  onChange={n => setProposedAdvance(n)} />
                <div className={`mt-3 flex items-center gap-2 px-3 py-2 rounded-[8px] ${stress.passes ? 'bg-emerald-50' : 'bg-red-50'}`}>
                  {stress.passes ? <ShieldCheck className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-red-600" />}
                  <span className={`text-xs font-bold ${stress.passes ? 'text-emerald-700' : 'text-red-700'}`}>
                    {stress.passes ? 'PASSES' : 'FAILS'}
                  </span>
                  <span className="text-[11px] text-gray-500 ml-auto tabular-nums">
                    Daily debit {fmt$(stress.dailyDebit)} · {(stress.pctOfDailyRevenue * 100).toFixed(1)}% of rev
                  </span>
                </div>
                {stress.flags.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {stress.flags.map((f, i) => <li key={i} className="text-[11px] text-red-600">• {f}</li>)}
                  </ul>
                )}
                {!stress.passes && stress.suggestedMaxAdvance > 0 && (
                  <p className="mt-2 text-[11px] text-gray-500">
                    Suggested max advance: <strong>{fmt$(stress.suggestedMaxAdvance)}</strong> · or extend term to ~{stress.suggestedMinTermDays} days.
                  </p>
                )}
              </div>

              {/* One-page summary */}
              <div className="bg-white border border-gray-200 rounded-[8px] overflow-hidden">
                <button onClick={() => setShowSummary(s => !s)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-semibold text-gray-900">One-Page Summary</span>
                  </div>
                  {showSummary ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                </button>
                {showSummary && (
                  <div className="px-4 pb-4 pt-1 border-t border-gray-100 text-xs text-gray-700 space-y-1.5">
                    <div className="flex justify-between"><span className="text-gray-400">Merchant</span><span className="font-medium">{app.businessName}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Application</span><span className="font-mono">{app.applicationId}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Composite</span><span className="font-bold">{result.composite}/100 ({tierLabel})</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Plaid / CRS / DM</span><span className="tabular-nums">{result.p.total} / {result.c.total} / {result.d.total}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Requested</span><span>{fmt$(requested)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Factor / Holdback</span><span>{result.terms.factorMin.toFixed(2)}–{result.terms.factorMax.toFixed(2)} / {result.terms.holdbackMinPct}–{result.terms.holdbackMaxPct}%</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Stress test</span><span className={stress.passes ? 'text-emerald-600 font-semibold' : 'text-red-600 font-semibold'}>{stress.passes ? 'Pass' : 'Fail'}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Disqualifiers</span><span>{result.dq.length === 0 ? 'None' : result.dq.map(d => d.code).join(', ')}</span></div>
                    <button onClick={() => window.print()} className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-brand hover:underline">
                      <Printer className="w-3 h-3" /> Print / screenshot
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Action bar ── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 z-30">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-3">
          <div className="text-xs text-gray-500">
            Composite <strong className="text-gray-900">{result.composite}</strong> · <span className={ts.text}>{tierLabel}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => saveDraft()} className="px-3 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-[8px] hover:bg-gray-50">
              Save Draft
            </button>
            {!stageDone && (
              <button onClick={moveToReview} className="px-3 py-2 text-sm font-medium text-brand border border-brand-200 rounded-[8px] hover:bg-brand-50">
                Move to Review
              </button>
            )}
            {!stageDone && (
              <button onClick={() => setDeclineOpen(true)} className="px-3 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-[8px] hover:bg-red-50">
                Decline
              </button>
            )}
            {!stageDone && (
              <button
                onClick={() => setApproveOpen(true)}
                disabled={!canApprove}
                title={canApprove ? '' : 'Requires Tier ≤ 3, no disqualifiers, passing stress test'}
                className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-[8px] hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" /> Approve &amp; Fund
              </button>
            )}
            {stageDone && (
              <span className={`px-3 py-2 text-sm font-semibold rounded-[8px] ${app.stage === 'Approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                {app.stage}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Approve confirmation modal */}
      {approveOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setApproveOpen(false)}>
          <div className="bg-white rounded-[8px] shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-900">Approve &amp; Fund</h3>
              <p className="text-xs text-gray-500 mt-0.5">A Capital deal will be created from this application.</p>
            </div>
            <div className="px-5 py-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Merchant</span><span className="font-medium">{app.businessName}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Funded amount</span><span className="font-medium">{fmt$(requested)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Factor</span><span className="font-medium">{factorMid.toFixed(4)}x</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Total owed</span><span className="font-medium">{fmt$(Math.round(requested * factorMid))}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Holdback</span><span className="font-medium">{Math.round((result.terms.holdbackMinPct + result.terms.holdbackMaxPct) / 2)}%</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Tier</span><span className="font-medium">{tierLabel}</span></div>
            </div>
            <div className="px-5 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button onClick={() => setApproveOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-[8px]">Cancel</button>
              <button onClick={confirmApprove} disabled={approving}
                className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-[8px] hover:bg-emerald-700 disabled:opacity-50">
                {approving ? 'Funding…' : 'Confirm & Create Deal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decline modal */}
      {declineOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setDeclineOpen(false)}>
          <div className="bg-white rounded-[8px] shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-900">Decline Application</h3>
            </div>
            <div className="px-5 py-4">
              <label className="block text-xs font-medium text-gray-600 mb-1">Reason</label>
              <textarea value={declineReason} onChange={e => setDeclineReason(e.target.value)} rows={3} placeholder="Why is this being declined?"
                className="w-full px-3 py-2 border border-gray-200 rounded-[8px] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
            </div>
            <div className="px-5 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button onClick={() => setDeclineOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-[8px]">Cancel</button>
              <button onClick={confirmDecline} className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-[8px] hover:bg-red-700">Confirm Decline</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UnderwritingDetail;
