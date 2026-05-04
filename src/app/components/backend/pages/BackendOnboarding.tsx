import React, { useMemo, useState } from 'react';
import { toast } from 'sonner@2.0.3';
import {
  ClipboardList,
  Clock,
  AlertTriangle,
  TrendingUp,
  Eye,
  Bell,
  X,
  ChevronRight,
  Circle,
  CheckCircle,
  Loader2,
  User,
  Smartphone,
  ArrowRight,
} from 'lucide-react';
import { useOnboarding, onboardingActions, type OnboardingApp, type SLAStatus, type OnbStep } from '../crmStore';
import { PageHeader, KpiCard } from '../shared';

// ── Local aliases (kept to minimize diff) ──
type StepName = OnbStep;

const STEPS: StepName[] = [
  'Application Submitted',
  'Bank Verification',
  'Identity Verification',
  'Underwriting',
  'Docs & E-Sign',
  'Funded',
];

const STEP_SHORT: Record<StepName, string> = {
  'Application Submitted': 'Application',
  'Bank Verification': 'Bank Verif.',
  'Identity Verification': 'ID Verif.',
  'Underwriting': 'Underwriting',
  'Docs & E-Sign': 'Docs & E-Sign',
  'Funded': 'Funded',
};

// ── Pipeline summary per step ──
const pipelineData: { step: StepName; count: number; avgTime: string; sla: SLAStatus }[] = [
  { step: 'Application Submitted', count: 8, avgTime: '2.1 hrs', sla: 'On Track' },
  { step: 'Bank Verification', count: 5, avgTime: '18 hrs', sla: 'On Track' },
  { step: 'Identity Verification', count: 4, avgTime: '14 hrs', sla: 'At Risk' },
  { step: 'Underwriting', count: 6, avgTime: '1.8 days', sla: 'On Track' },
  { step: 'Docs & E-Sign', count: 3, avgTime: '2.4 days', sla: 'At Risk' },
  { step: 'Funded', count: 12, avgTime: '—', sla: 'On Track' },
];

// Team members available for reassignment
const AGENTS = ['Marcus Johnson', 'Priya Patel', 'Jamal Foster', 'Devon Richards', 'Sarah Kim', 'Alex Rivera'];

// Legacy seed kept here as reference only (store now owns the source of truth).
const _legacySeed: OnboardingApp[] = [
  {
    id: 'ONB-001',
    merchantName: 'Sunrise Bakery LLC',
    agent: 'Marcus Johnson',
    currentStep: 'Bank Verification',
    currentStepIndex: 1,
    timeInStep: '22 hrs',
    timeInStepHours: 22,
    slaTarget: '24 hrs',
    slaStatus: 'At Risk',
    submittedDate: 'Apr 7, 2026',
    blocker: 'Awaiting Plaid link — merchant has not connected bank account',
    steps: [
      { step: 'Application Submitted', completedAt: 'Apr 7, 10:30 AM', slaTarget: '—' },
      { step: 'Bank Verification', completedAt: null, slaTarget: '24 hrs' },
      { step: 'Identity Verification', completedAt: null, slaTarget: '24 hrs' },
      { step: 'Underwriting', completedAt: null, slaTarget: '48 hrs' },
      { step: 'Docs & E-Sign', completedAt: null, slaTarget: '72 hrs' },
      { step: 'Funded', completedAt: null, slaTarget: '24 hrs' },
    ],
  },
  {
    id: 'ONB-002',
    merchantName: 'Peak Construction Co',
    agent: 'Priya Patel',
    currentStep: 'Underwriting',
    currentStepIndex: 3,
    timeInStep: '3.2 days',
    timeInStepHours: 76.8,
    slaTarget: '48 hrs',
    slaStatus: 'Breached',
    submittedDate: 'Apr 2, 2026',
    blocker: 'Missing tax return — requested from merchant twice, no response',
    steps: [
      { step: 'Application Submitted', completedAt: 'Apr 2, 9:15 AM', slaTarget: '—' },
      { step: 'Bank Verification', completedAt: 'Apr 2, 3:40 PM', slaTarget: '24 hrs' },
      { step: 'Identity Verification', completedAt: 'Apr 3, 11:20 AM', slaTarget: '24 hrs' },
      { step: 'Underwriting', completedAt: null, slaTarget: '48 hrs' },
      { step: 'Docs & E-Sign', completedAt: null, slaTarget: '72 hrs' },
      { step: 'Funded', completedAt: null, slaTarget: '24 hrs' },
    ],
  },
  {
    id: 'ONB-003',
    merchantName: 'Coastal Seafood Inc',
    agent: 'Jamal Foster',
    currentStep: 'Docs & E-Sign',
    currentStepIndex: 4,
    timeInStep: '1.5 days',
    timeInStepHours: 36,
    slaTarget: '72 hrs',
    slaStatus: 'On Track',
    submittedDate: 'Apr 4, 2026',
    blocker: 'E-sign link sent — awaiting merchant signature on funding agreement',
    steps: [
      { step: 'Application Submitted', completedAt: 'Apr 4, 2:10 PM', slaTarget: '—' },
      { step: 'Bank Verification', completedAt: 'Apr 4, 6:30 PM', slaTarget: '24 hrs' },
      { step: 'Identity Verification', completedAt: 'Apr 5, 8:45 AM', slaTarget: '24 hrs' },
      { step: 'Underwriting', completedAt: 'Apr 6, 10:00 AM', slaTarget: '48 hrs' },
      { step: 'Docs & E-Sign', completedAt: null, slaTarget: '72 hrs' },
      { step: 'Funded', completedAt: null, slaTarget: '24 hrs' },
    ],
  },
  {
    id: 'ONB-004',
    merchantName: 'Metro Diner Group',
    agent: 'Marcus Johnson',
    currentStep: 'Identity Verification',
    currentStepIndex: 2,
    timeInStep: '26 hrs',
    timeInStepHours: 26,
    slaTarget: '24 hrs',
    slaStatus: 'Breached',
    submittedDate: 'Apr 6, 2026',
    blocker: 'ID photo blurry — re-upload requested via SMS',
    steps: [
      { step: 'Application Submitted', completedAt: 'Apr 6, 11:00 AM', slaTarget: '—' },
      { step: 'Bank Verification', completedAt: 'Apr 6, 5:15 PM', slaTarget: '24 hrs' },
      { step: 'Identity Verification', completedAt: null, slaTarget: '24 hrs' },
      { step: 'Underwriting', completedAt: null, slaTarget: '48 hrs' },
      { step: 'Docs & E-Sign', completedAt: null, slaTarget: '72 hrs' },
      { step: 'Funded', completedAt: null, slaTarget: '24 hrs' },
    ],
  },
  {
    id: 'ONB-005',
    merchantName: 'Bright Auto Sales',
    agent: 'Devon Richards',
    currentStep: 'Application Submitted',
    currentStepIndex: 0,
    timeInStep: '4 hrs',
    timeInStepHours: 4,
    slaTarget: '—',
    slaStatus: 'On Track',
    submittedDate: 'Apr 9, 2026',
    blocker: 'Application under initial review — all fields complete',
    steps: [
      { step: 'Application Submitted', completedAt: null, slaTarget: '—' },
      { step: 'Bank Verification', completedAt: null, slaTarget: '24 hrs' },
      { step: 'Identity Verification', completedAt: null, slaTarget: '24 hrs' },
      { step: 'Underwriting', completedAt: null, slaTarget: '48 hrs' },
      { step: 'Docs & E-Sign', completedAt: null, slaTarget: '72 hrs' },
      { step: 'Funded', completedAt: null, slaTarget: '24 hrs' },
    ],
  },
  {
    id: 'ONB-006',
    merchantName: 'Lakeside Catering',
    agent: 'Sarah Kim',
    currentStep: 'Bank Verification',
    currentStepIndex: 1,
    timeInStep: '12 hrs',
    timeInStepHours: 12,
    slaTarget: '24 hrs',
    slaStatus: 'On Track',
    submittedDate: 'Apr 8, 2026',
    blocker: 'Plaid connected — awaiting 3-day transaction pull to complete',
    steps: [
      { step: 'Application Submitted', completedAt: 'Apr 8, 9:00 AM', slaTarget: '—' },
      { step: 'Bank Verification', completedAt: null, slaTarget: '24 hrs' },
      { step: 'Identity Verification', completedAt: null, slaTarget: '24 hrs' },
      { step: 'Underwriting', completedAt: null, slaTarget: '48 hrs' },
      { step: 'Docs & E-Sign', completedAt: null, slaTarget: '72 hrs' },
      { step: 'Funded', completedAt: null, slaTarget: '24 hrs' },
    ],
  },
];

// silence unused warning
void _legacySeed;

const avgTimeToFunded = 6.3; // days
const completionRate = 78;

function slaDot(status: SLAStatus) {
  switch (status) {
    case 'On Track': return 'bg-emerald-500';
    case 'At Risk': return 'bg-amber-500';
    case 'Breached': return 'bg-red-500';
  }
}

function slaBadgeCls(status: SLAStatus) {
  switch (status) {
    case 'On Track': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'At Risk': return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'Breached': return 'bg-red-50 text-red-600 border-red-200';
  }
}

function stepBadgeCls(step: StepName) {
  switch (step) {
    case 'Application Submitted': return 'bg-gray-100 text-gray-700 border-gray-200';
    case 'Bank Verification': return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'Identity Verification': return 'bg-violet-50 text-violet-700 border-violet-200';
    case 'Underwriting': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'Docs & E-Sign': return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'Funded': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }
}

const pipelineStepColors: Record<StepName, string> = {
  'Application Submitted': 'bg-gray-50 border-gray-200',
  'Bank Verification': 'bg-blue-50 border-blue-200',
  'Identity Verification': 'bg-violet-50 border-violet-200',
  'Underwriting': 'bg-indigo-50 border-indigo-200',
  'Docs & E-Sign': 'bg-amber-50 border-amber-200',
  'Funded': 'bg-emerald-50 border-emerald-200',
};

// ════════════════════════════════
// Main Component
// ════════════════════════════════
export function BackendOnboarding() {
  const applications = useOnboarding();
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [agentFilter, setAgentFilter] = useState<string>('All');
  const [slaFilter, setSlaFilter] = useState<string>('All');

  const selectedApp = applications.find(a => a.id === selectedAppId) || null;

  const filteredApps = useMemo(() => {
    return applications.filter(a => {
      if (agentFilter !== 'All' && a.agent !== agentFilter) return false;
      if (slaFilter !== 'All' && a.slaStatus !== slaFilter) return false;
      return true;
    });
  }, [applications, agentFilter, slaFilter]);

  const activeApps = applications.filter(a => a.currentStep !== 'Funded').length;
  const slaBreaches = applications.filter(a => a.slaStatus === 'Breached').length;

  // Derive pipeline data from live state
  const livePipelineData = useMemo(() => {
    const steps: StepName[] = ['Application Submitted', 'Bank Verification', 'Identity Verification', 'Underwriting', 'Docs & E-Sign', 'Funded'];
    return steps.map(step => {
      const inStep = applications.filter(a => a.currentStep === step);
      const avgHours = inStep.length > 0 ? inStep.reduce((s, a) => s + a.timeInStepHours, 0) / inStep.length : 0;
      const worstSla: SLAStatus = inStep.some(a => a.slaStatus === 'Breached')
        ? 'Breached'
        : inStep.some(a => a.slaStatus === 'At Risk')
        ? 'At Risk'
        : 'On Track';
      const avgTime =
        step === 'Funded'
          ? '—'
          : avgHours === 0
          ? '—'
          : avgHours >= 24
          ? `${(avgHours / 24).toFixed(1)} days`
          : `${avgHours.toFixed(1)} hrs`;
      return { step, count: inStep.length, avgTime, sla: worstSla };
    });
  }, [applications]);

  const handleNudge = (id: string, name: string) => {
    onboardingActions.nudge(id);
    toast.success(`Nudge sent to ${name}`, { description: 'Automated reminder email + SMS queued.' });
  };

  const handleAdvance = (id: string, name: string) => {
    onboardingActions.advance(id);
    toast.success(`${name} advanced`, { description: 'Moved to the next onboarding step.' });
  };

  return (
    <div className="px-6 py-6 space-y-5 bg-canvas min-h-full">
      <PageHeader
        title="Onboarding Tracker"
        icon={ClipboardList}
        subtitle="Monitor application progress and step-level SLAs"
      />

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          icon={ClipboardList}
          label="Active Applications"
          value={activeApps}
          sub={`${applications.length} total in pipeline`}
          tone="brand"
        />
        <KpiCard
          icon={Clock}
          label="Avg Time to Funded"
          value={`${avgTimeToFunded}d`}
          sub="From submission to funded"
          tone="blue"
        />
        <KpiCard
          icon={AlertTriangle}
          label="SLA Breaches"
          value={slaBreaches}
          sub={slaBreaches > 0 ? 'Action required' : 'All clear'}
          tone={slaBreaches > 0 ? 'red' : 'emerald'}
        />
        <KpiCard
          icon={TrendingUp}
          label="Completion Rate"
          value={`${completionRate}%`}
          sub="Applications reaching funded"
          tone="emerald"
        />
      </div>

      {/* Pipeline Visual */}
      <div className="bg-white rounded-[8px] border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Pipeline Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {livePipelineData.map((p, i) => (
            <div key={p.step} className={`relative rounded-[8px] border p-4 ${pipelineStepColors[p.step]}`}>
              {/* Connector arrow (hidden on first) */}
              {i > 0 && (
                <div className="hidden lg:block absolute -left-3 top-1/2 -translate-y-1/2">
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </div>
              )}
              <p className="text-xs text-gray-500 mb-1 truncate">{STEP_SHORT[p.step]}</p>
              <p className="text-2xl font-bold text-gray-900">{p.count}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[11px] text-gray-500">{p.avgTime}</span>
                <div className={`w-2.5 h-2.5 rounded-full ${slaDot(p.sla)}`} title={p.sla} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={agentFilter}
          onChange={e => setAgentFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-[6px] bg-white"
        >
          <option value="All">All agents</option>
          {AGENTS.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <select
          value={slaFilter}
          onChange={e => setSlaFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-[6px] bg-white"
        >
          <option value="All">All SLA statuses</option>
          <option value="On Track">On Track</option>
          <option value="At Risk">At Risk</option>
          <option value="Breached">Breached</option>
        </select>
        <span className="text-xs text-gray-500 ml-auto">
          Showing {filteredApps.length} of {applications.length}
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[8px] border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Merchant Name</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Assigned Agent</th>
                <th className="text-center px-4 py-3 text-xs text-gray-500 font-medium">Current Step</th>
                <th className="text-right px-4 py-3 text-xs text-gray-500 font-medium">Time in Step</th>
                <th className="text-right px-4 py-3 text-xs text-gray-500 font-medium">SLA Target</th>
                <th className="text-center px-4 py-3 text-xs text-gray-500 font-medium">SLA Status</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Submitted</th>
                <th className="text-center px-4 py-3 text-xs text-gray-500 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredApps.map(app => {
                const breached = app.slaStatus === 'Breached';
                return (
                  <tr
                    key={app.id}
                    onClick={() => setSelectedAppId(app.id)}
                    className={`transition-colors cursor-pointer ${
                      breached
                        ? 'border-l-[3px] border-l-red-500 bg-red-50/30 hover:bg-red-50/50'
                        : 'hover:bg-gray-50/50'
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{app.merchantName}</p>
                        <p className="text-xs text-gray-500">{app.id}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{app.agent}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2.5 py-1 text-xs font-medium border rounded-md ${stepBadgeCls(app.currentStep)}`}>
                        {STEP_SHORT[app.currentStep]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">{app.timeInStep}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{app.slaTarget}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium border rounded-md ${slaBadgeCls(app.slaStatus)}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${slaDot(app.slaStatus)}`} />
                        {app.slaStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{app.submittedDate}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedAppId(app.id)}
                          className="p-1.5 hover:bg-indigo-50 rounded-md text-gray-400 hover:text-indigo-600 transition-colors"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleNudge(app.id, app.merchantName)}
                          className="p-1.5 hover:bg-amber-50 rounded-md text-gray-400 hover:text-amber-600 transition-colors relative"
                          title="Nudge merchant"
                        >
                          <Bell className="w-4 h-4" />
                          {(app.nudges || 0) > 0 && (
                            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-amber-500 text-white text-[10px] rounded-full flex items-center justify-center">
                              {app.nudges}
                            </span>
                          )}
                        </button>
                        {app.currentStep !== 'Funded' && (
                          <button
                            onClick={() => handleAdvance(app.id, app.merchantName)}
                            className="p-1.5 hover:bg-emerald-50 rounded-md text-gray-400 hover:text-emerald-600 transition-colors"
                            title="Advance to next step"
                          >
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-out Detail Panel */}
      {selectedApp && (
        <SlideOutPanel app={selectedApp} onClose={() => setSelectedAppId(null)} />
      )}
    </div>
  );
}


// ── Slide-out Panel ──
function SlideOutPanel({ app, onClose }: { app: OnboardingApp; onClose: () => void }) {
  const applicantStepNum = app.currentStepIndex + 1;
  const [reassignOpen, setReassignOpen] = useState(false);

  const sendReminder = () => {
    onboardingActions.nudge(app.id);
    toast.success(`Reminder sent to ${app.merchantName}`, {
      description: 'Email + SMS reminder dispatched to the merchant contact.',
    });
  };

  const reassign = (agent: string) => {
    if (agent === app.agent) {
      setReassignOpen(false);
      return;
    }
    onboardingActions.reassign(app.id, agent);
    setReassignOpen(false);
    toast.success(`Reassigned to ${agent}`, {
      description: `${app.merchantName} moved from ${app.agent}.`,
    });
  };

  const advanceStep = () => {
    onboardingActions.advance(app.id);
    toast.success(`${app.merchantName} advanced`, { description: 'Moved to the next onboarding step.' });
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />

      {/* Panel */}
      <div className="fixed top-0 right-0 w-full max-w-lg h-full bg-white border-l border-gray-200 shadow-xl z-50 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{app.merchantName}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{app.id} &middot; Agent: {app.agent}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Step-by-step progress */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Application Progress</h3>
            <div className="space-y-0">
              {app.steps.map((step, i) => {
                const isCompleted = step.completedAt !== null;
                const isCurrent = i === app.currentStepIndex && !isCompleted;
                const isFuture = i > app.currentStepIndex;

                return (
                  <div key={step.step} className="flex gap-3">
                    {/* Timeline connector */}
                    <div className="flex flex-col items-center">
                      {isCompleted ? (
                        <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                        </div>
                      ) : isCurrent ? (
                        <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                          <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                          <Circle className="w-3.5 h-3.5 text-gray-300" />
                        </div>
                      )}
                      {/* Vertical line */}
                      {i < app.steps.length - 1 && (
                        <div className={`w-0.5 flex-1 min-h-[24px] ${isCompleted ? 'bg-emerald-200' : 'bg-gray-200'}`} />
                      )}
                    </div>

                    {/* Content */}
                    <div className={`pb-5 ${i === app.steps.length - 1 ? 'pb-0' : ''}`}>
                      <p className={`text-sm font-medium ${isFuture ? 'text-gray-400' : isCurrent ? 'text-indigo-700' : 'text-gray-900'}`}>
                        {step.step}
                      </p>
                      {isCompleted && (
                        <p className="text-xs text-gray-500 mt-0.5">Completed {step.completedAt}</p>
                      )}
                      {isCurrent && (
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-xs text-indigo-600 font-medium">In Progress</span>
                          <span className="text-xs text-gray-400">&middot;</span>
                          <span className="text-xs text-gray-500">{app.timeInStep} / {step.slaTarget} SLA</span>
                        </div>
                      )}
                      {isFuture && step.slaTarget !== '—' && (
                        <p className="text-xs text-gray-400 mt-0.5">SLA: {step.slaTarget}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Blocker */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Current Blocker</h3>
            <div className={`rounded-[8px] border p-4 ${
              app.slaStatus === 'Breached'
                ? 'bg-red-50 border-red-200'
                : app.slaStatus === 'At Risk'
                ? 'bg-amber-50 border-amber-200'
                : 'bg-blue-50 border-blue-200'
            }`}>
              <div className="flex items-start gap-3">
                <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${
                  app.slaStatus === 'Breached' ? 'text-red-500' : app.slaStatus === 'At Risk' ? 'text-amber-500' : 'text-blue-500'
                }`} />
                <div>
                  <p className={`text-sm font-medium ${
                    app.slaStatus === 'Breached' ? 'text-red-700' : app.slaStatus === 'At Risk' ? 'text-amber-700' : 'text-blue-700'
                  }`}>
                    {app.blocker}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium border rounded-md ${slaBadgeCls(app.slaStatus)}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${slaDot(app.slaStatus)}`} />
                      {app.slaStatus}
                    </span>
                    <span className="text-xs text-gray-500">{app.timeInStep} in current step</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Merchant-facing Preview */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Merchant-Facing View</h3>
            <div className="rounded-[8px] border border-gray-200 overflow-hidden">
              {/* Mock phone-like header */}
              <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-5 py-4">
                <div className="flex items-center gap-2 mb-3">
                  <Smartphone className="w-4 h-4 text-indigo-200" />
                  <span className="text-xs text-indigo-200 font-medium">What the applicant sees</span>
                </div>
                <p className="text-white text-sm font-semibold">
                  Step {applicantStepNum} of {STEPS.length}: {app.currentStep}
                </p>
                <p className="text-indigo-200 text-xs mt-1">
                  Estimated {app.currentStepIndex < 3 ? '24hrs' : app.currentStepIndex < 5 ? '48hrs' : '24hrs'} remaining
                </p>
              </div>

              {/* Progress dots */}
              <div className="px-5 py-4 bg-gray-50">
                <div className="flex items-center gap-1.5 mb-3">
                  {STEPS.map((s, i) => (
                    <div key={s} className="flex-1 flex flex-col items-center">
                      <div className={`w-full h-1.5 rounded-full ${
                        i < app.currentStepIndex
                          ? 'bg-emerald-500'
                          : i === app.currentStepIndex
                          ? 'bg-indigo-500'
                          : 'bg-gray-200'
                      }`} />
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Complete</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-indigo-500" />
                    <span>Current</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-gray-200" />
                    <span>Upcoming</span>
                  </div>
                </div>
              </div>

              {/* Action prompt */}
              <div className="px-5 py-4 border-t border-gray-200">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Action needed from you</p>
                    <p className="text-xs text-gray-500 mt-0.5">{app.blocker.split('—')[0].trim()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Nudge history */}
          {(app.nudges || 0) > 0 && (
            <div className="rounded-[8px] border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              <div className="flex items-center gap-2">
                <Bell className="w-3.5 h-3.5" />
                <span className="font-medium">{app.nudges} nudge{app.nudges === 1 ? '' : 's'} sent</span>
                {app.lastNudge && <span className="text-amber-600">· last: {app.lastNudge}</span>}
              </div>
            </div>
          )}

          {/* Quick actions */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <button
                onClick={sendReminder}
                className="flex-1 px-4 py-2.5 text-sm font-medium bg-indigo-600 text-white rounded-[6px] hover:bg-indigo-700 transition-colors"
              >
                Send Reminder
              </button>
              <button
                onClick={() => setReassignOpen(v => !v)}
                className="flex-1 px-4 py-2.5 text-sm font-medium border border-gray-200 text-gray-700 rounded-[6px] hover:bg-gray-50 transition-colors"
              >
                Reassign Agent
              </button>
            </div>
            {reassignOpen && (
              <div className="rounded-[6px] border border-gray-200 bg-white p-2 space-y-1">
                <p className="text-xs text-gray-500 px-2 py-1">Select a new agent</p>
                {AGENTS.map(agent => (
                  <button
                    key={agent}
                    onClick={() => reassign(agent)}
                    className={`w-full text-left px-3 py-2 text-sm rounded-[4px] transition-colors ${
                      agent === app.agent
                        ? 'bg-indigo-50 text-indigo-700 font-medium'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    {agent}
                    {agent === app.agent && <span className="text-xs text-indigo-500 ml-2">(current)</span>}
                  </button>
                ))}
              </div>
            )}
            {app.currentStep !== 'Funded' && (
              <button
                onClick={advanceStep}
                className="w-full px-4 py-2.5 text-sm font-medium border border-emerald-200 bg-emerald-50 text-emerald-700 rounded-[6px] hover:bg-emerald-100 transition-colors flex items-center justify-center gap-1.5"
              >
                <ArrowRight className="w-4 h-4" />
                Advance to Next Step
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
