import React, { useState } from 'react';
import {
  Plus,
  Search,
  Phone,
  Mail,
  Building2,
  TrendingUp,
  Calendar,
  ChevronRight,
  X,
  MessageSquare,
  CheckSquare,
  Clock,
  DollarSign,
  User,
  Users,
  MapPin,
  Star,
  AlertCircle,
  CheckCircle,
  FileText,
  AlertTriangle,
  Gift,
  Loader2,
  Circle,
  Smartphone,
  LayoutGrid,
  List,
  Send,
  Edit,
  Save,
  Package,
  ChevronDown,
  UserPlus,
  Truck,
} from 'lucide-react';

// ── Full pipeline stages ──
const ALL_STAGES = [
  'New',
  'Contacted',
  'Qualified',
  'Application Submitted',
  'Bank Verification',
  'Identity Verification',
  'Underwriting',
  'Docs & E-Sign',
  'Funded',
] as const;
type StageName = (typeof ALL_STAGES)[number];

const ONBOARDING_STAGES: StageName[] = ['Application Submitted', 'Bank Verification', 'Identity Verification', 'Underwriting', 'Docs & E-Sign', 'Funded'];

interface StepDetail {
  stage: StageName;
  completedAt: string | null;
}

interface Lead {
  id: string;
  businessName: string;
  industry: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  type: 'MCA' | 'Residual' | 'Leasing';
  source: string;
  monthlySales: string;
  amountRequested: string;
  score: number;
  status: 'New' | 'In Progress' | 'Won' | 'Lost';
  priority: 'High' | 'Medium' | 'Low';
  lastActivity: string;
  assignedAgent: string;
  stage: StageName;
  timeline: Array<{
    icon: React.ReactNode;
    title: string;
    description: string;
    user: string;
    timestamp: string;
  }>;
  notes: string;
  blocker?: string;
  stepDetails?: StepDetail[];
  referredBy?: string;
}

// ── Referral types ──
interface Referral {
  id: string;
  referringMerchant: string;
  referredBusiness: string;
  referralCode: string;
  date: string;
  status: 'Pending' | 'Contacted' | 'Converted' | 'Expired';
  rewardStatus: 'Pending' | 'Paid' | 'N/A';
  rewardAmount: string;
}

// ── Helpers ──
function isPostApplication(stage: StageName): boolean {
  const idx = ALL_STAGES.indexOf(stage);
  return idx >= 3; // Application Submitted or later
}

function stageIndex(stage: StageName): number {
  return ALL_STAGES.indexOf(stage);
}

function isQualifiedOrLater(stage: StageName): boolean {
  return ALL_STAGES.indexOf(stage) >= 2; // Qualified or later
}

// ── Bundle types from Settings ──
const BUNDLE_OPTIONS = [
  { id: 'welcome', name: 'Welcome Bundle', amount: 500 },
  { id: 'referrer', name: 'Referrer Reward', amount: 200 },
  { id: 'retention-light', name: 'Retention — Light', amount: 200 },
  { id: 'retention-medium', name: 'Retention — Medium', amount: 350 },
  { id: 'retention-full', name: 'Retention — Full', amount: 500 },
];

type BundleStatus = 'Not Assigned' | 'Credit Issued' | 'Order Placed' | 'Shipped' | 'Delivered';
const BUNDLE_STATUSES: BundleStatus[] = ['Not Assigned', 'Credit Issued', 'Order Placed', 'Shipped', 'Delivered'];

function bundleStatusCls(status: BundleStatus) {
  switch (status) {
    case 'Not Assigned': return 'bg-gray-100 text-gray-600';
    case 'Credit Issued': return 'bg-blue-50 text-blue-700';
    case 'Order Placed': return 'bg-amber-50 text-amber-700';
    case 'Shipped': return 'bg-violet-50 text-violet-700';
    case 'Delivered': return 'bg-emerald-50 text-emerald-700';
  }
}

// ── Welcome Bundle Section ──
function WelcomeBundleSection({ lead }: { lead: Lead }) {
  const [assigned, setAssigned] = useState<{ bundleName: string; amount: number; dateIssued: string; expiration: string; status: BundleStatus } | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleAssign = (bundle: typeof BUNDLE_OPTIONS[0]) => {
    const now = new Date();
    const exp = new Date(now);
    exp.setDate(exp.getDate() + 30);
    setAssigned({
      bundleName: bundle.name,
      amount: bundle.amount,
      dateIssued: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      expiration: exp.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: 'Credit Issued',
    });
    setDropdownOpen(false);
  };

  const cycleStatus = () => {
    if (!assigned) return;
    const idx = BUNDLE_STATUSES.indexOf(assigned.status);
    const next = BUNDLE_STATUSES[Math.min(idx + 1, BUNDLE_STATUSES.length - 1)];
    setAssigned({ ...assigned, status: next });
  };

  return (
    <div className="px-6 py-5 border-b border-gray-200">
      <div className="flex items-center gap-2 mb-3">
        <Package className="w-4 h-4 text-brand" />
        <p className="text-xs text-gray-500 font-medium">Welcome Bundle</p>
      </div>

      {lead.referredBy && (
        <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 rounded-[6px] border border-indigo-200 mb-3">
          <UserPlus className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          <p className="text-xs text-indigo-700">
            <span className="font-medium">Referred by:</span> {lead.referredBy}
          </p>
        </div>
      )}

      {!assigned ? (
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-3.5 py-2 bg-brand text-white text-xs font-medium rounded-[6px] hover:bg-brand-hover transition-colors"
          >
            <Gift className="w-3.5 h-3.5" />
            Assign Bundle
            <ChevronDown className="w-3.5 h-3.5 ml-1" />
          </button>
          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
              <div className="absolute left-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-[8px] shadow-lg py-1 w-64">
                <p className="px-3 py-1.5 text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Select Bundle</p>
                {BUNDLE_OPTIONS.map(b => (
                  <button
                    key={b.id}
                    onClick={() => handleAssign(b)}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <span>{b.name}</span>
                    <span className="text-xs font-semibold text-gray-900">${b.amount}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-[8px] p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">{assigned.bundleName}</p>
              <p className="text-xs text-gray-500 mt-0.5">${assigned.amount.toLocaleString()} credit</p>
            </div>
            <button
              onClick={cycleStatus}
              className={`px-2.5 py-1 rounded-full text-xs font-medium ${bundleStatusCls(assigned.status)} cursor-pointer hover:opacity-80 transition-opacity`}
              title="Click to advance status"
            >
              {assigned.status}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-gray-400 mb-0.5">Date Issued</p>
              <p className="text-gray-700 font-medium">{assigned.dateIssued}</p>
            </div>
            <div>
              <p className="text-gray-400 mb-0.5">Expires</p>
              <p className="text-gray-700 font-medium">{assigned.expiration}</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-1">
              {BUNDLE_STATUSES.filter(s => s !== 'Not Assigned').map((s, i) => {
                const currentIdx = BUNDLE_STATUSES.indexOf(assigned.status);
                const thisIdx = BUNDLE_STATUSES.indexOf(s);
                const isComplete = thisIdx <= currentIdx;
                const icons: Record<string, React.ReactNode> = {
                  'Credit Issued': <DollarSign className="w-3 h-3" />,
                  'Order Placed': <Package className="w-3 h-3" />,
                  'Shipped': <Truck className="w-3 h-3" />,
                  'Delivered': <CheckCircle className="w-3 h-3" />,
                };
                return (
                  <React.Fragment key={s}>
                    <div className="flex flex-col items-center flex-1">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isComplete ? 'bg-brand text-white' : 'bg-gray-100 text-gray-400'}`}>
                        {icons[s]}
                      </div>
                      <p className={`text-[9px] mt-1 text-center leading-tight ${isComplete ? 'text-brand font-medium' : 'text-gray-400'}`}>
                        {s === 'Credit Issued' ? 'Issued' : s === 'Order Placed' ? 'Ordered' : s}
                      </p>
                    </div>
                    {i < 3 && (
                      <div className={`h-0.5 w-4 shrink-0 rounded-full ${thisIdx < currentIdx ? 'bg-brand' : 'bg-gray-200'}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Stat Card ──
interface StatCardProps {
  label: string;
  value: string;
  trend?: { value: string; isPositive: boolean };
  icon?: React.ReactNode;
  variant?: 'default' | 'red';
}

function StatCard({ label, value, trend, icon, variant = 'default' }: StatCardProps) {
  const isRed = variant === 'red';
  return (
    <div className={`bg-white rounded-[8px] border p-5 ${isRed ? 'border-red-200' : 'border-gray-200'}`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-gray-600">{label}</p>
        {icon && <div className={isRed ? 'text-red-400' : 'text-gray-400'}>{icon}</div>}
      </div>
      <div className="flex items-baseline gap-2">
        <p className={`text-2xl font-bold ${isRed ? 'text-red-600' : 'text-gray-900'}`}>{value}</p>
        {trend && (
          <span className={`flex items-center text-sm font-medium ${trend.isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
            {trend.isPositive ? <TrendingUp className="w-4 h-4 mr-1" /> : null}
            {trend.value}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Stage Progress (updated for full journey) ──
function StageProgress({ stage, stepDetails }: { stage: StageName; stepDetails?: StepDetail[] }) {
  const currentIdx = stageIndex(stage);

  // Short labels for compact display
  const shortLabels: Record<StageName, string> = {
    'New': 'New',
    'Contacted': 'Contact',
    'Qualified': 'Qualify',
    'Application Submitted': 'App Sub',
    'Bank Verification': 'Bank',
    'Identity Verification': 'ID',
    'Underwriting': 'UW',
    'Docs & E-Sign': 'Docs',
    'Funded': 'Funded',
  };

  return (
    <div className="mb-6">
      <p className="text-xs text-gray-500 mb-3">Pipeline Stage</p>
      <div className="flex items-center gap-1">
        {ALL_STAGES.map((s, index) => {
          const isComplete = index < currentIdx || (index === currentIdx && s === 'Funded');
          const isCurrent = index === currentIdx && s !== 'Funded';

          return (
            <React.Fragment key={s}>
              <div className="flex flex-col items-center flex-1 min-w-0">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold ${
                    isComplete
                      ? 'bg-emerald-600 text-white'
                      : isCurrent
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {isComplete ? (
                    <CheckCircle className="w-3.5 h-3.5" />
                  ) : isCurrent ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    index + 1
                  )}
                </div>
                <p className="text-[10px] text-gray-600 mt-1 text-center leading-tight truncate w-full">{shortLabels[s]}</p>
              </div>
              {index < ALL_STAGES.length - 1 && (
                <div
                  className={`h-0.5 w-3 flex-shrink-0 rounded-full ${
                    index < currentIdx ? 'bg-emerald-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

// ── Lead Detail Panel ──
function LeadDetailPanel({ lead, onClose }: { lead: Lead | null; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'activity' | 'notes' | 'tasks'>('activity');
  if (!lead) return null;

  const postApp = isPostApplication(lead.stage);
  const currentIdx = stageIndex(lead.stage);
  // For merchant-facing preview, count only onboarding steps
  const onboardingIdx = ONBOARDING_STAGES.indexOf(lead.stage);
  const onboardingStepNum = onboardingIdx >= 0 ? onboardingIdx + 1 : null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New': return 'bg-blue-50 text-blue-700';
      case 'In Progress': return 'bg-amber-50 text-amber-700';
      case 'Won': return 'bg-emerald-50 text-emerald-700';
      case 'Lost': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-50 text-red-700';
      case 'Medium': return 'bg-amber-50 text-amber-700';
      case 'Low': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="fixed inset-0 z-50 lg:pl-64">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-2xl bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 mb-2">{lead.businessName}</h2>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>{lead.status}</span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getPriorityColor(lead.priority)}`}>{lead.priority} Priority</span>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-md transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-gray-600"><User className="w-4 h-4" /><span>{lead.contactName}</span></div>
            <div className="flex items-center gap-2 text-gray-600"><Phone className="w-4 h-4" /><span>{lead.contactPhone}</span></div>
            <div className="flex items-center gap-2 text-gray-600"><Mail className="w-4 h-4" /><span className="truncate">{lead.contactEmail}</span></div>
            <div className="flex items-center gap-2 text-gray-600"><Building2 className="w-4 h-4" /><span>{lead.industry}</span></div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
          <div className="grid grid-cols-3 gap-4">
            <div><p className="text-xs text-gray-500 mb-1">Monthly Sales</p><p className="text-lg font-bold text-gray-900">{lead.monthlySales}</p></div>
            <div><p className="text-xs text-gray-500 mb-1">Amount Requested</p><p className="text-lg font-bold text-gray-900">{lead.amountRequested}</p></div>
            <div><p className="text-xs text-gray-500 mb-1">Lead Score</p><div className="flex items-center gap-2"><p className="text-lg font-bold text-gray-900">{lead.score}/100</p><Star className="w-4 h-4 text-amber-500 fill-amber-500" /></div></div>
          </div>
        </div>

        {/* Stage Progress */}
        <div className="px-6 py-5 border-b border-gray-200">
          <StageProgress stage={lead.stage} stepDetails={lead.stepDetails} />
        </div>

        {/* Welcome Bundle — visible at Qualified stage or later */}
        {isQualifiedOrLater(lead.stage) && (
          <WelcomeBundleSection lead={lead} />
        )}

        {/* Post-Application: Step Progress + Blocker + Merchant Preview */}
        {postApp && lead.stepDetails && (
          <div className="px-6 py-5 border-b border-gray-200 space-y-5">
            {/* Step-by-step progress */}
            <div>
              <p className="text-xs text-gray-500 mb-3 font-medium">Onboarding Progress</p>
              <div className="space-y-0">
                {lead.stepDetails.map((step, i) => {
                  const isCompleted = step.completedAt !== null;
                  const thisStageIdx = ALL_STAGES.indexOf(step.stage);
                  const isCurrent = thisStageIdx === currentIdx && !isCompleted;
                  const isFuture = thisStageIdx > currentIdx;

                  return (
                    <div key={step.stage} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        {isCompleted ? (
                          <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          </div>
                        ) : isCurrent ? (
                          <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                            <Loader2 className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                            <Circle className="w-3 h-3 text-gray-300" />
                          </div>
                        )}
                        {i < lead.stepDetails!.length - 1 && (
                          <div className={`w-0.5 flex-1 min-h-[18px] ${isCompleted ? 'bg-emerald-200' : 'bg-gray-200'}`} />
                        )}
                      </div>
                      <div className="pb-3">
                        <p className={`text-sm ${isFuture ? 'text-gray-400' : isCurrent ? 'text-indigo-700 font-medium' : 'text-gray-900 font-medium'}`}>{step.stage}</p>
                        {isCompleted && <p className="text-[11px] text-gray-500">{step.completedAt}</p>}
                        {isCurrent && <p className="text-[11px] text-indigo-600">In progress</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Blocker */}
            {lead.blocker && (
              <div className="rounded-[8px] border p-3 bg-amber-50 border-amber-200">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" />
                  <div>
                    <p className="text-xs font-medium text-gray-800">Blocking: {lead.blocker}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Merchant-facing preview line */}
            {onboardingStepNum !== null && (
              <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 rounded-[6px] border border-indigo-200">
                <Smartphone className="w-4 h-4 text-indigo-500 shrink-0" />
                <p className="text-xs text-indigo-700">
                  <span className="font-medium">Applicant sees:</span> Step {onboardingStepNum} of {ONBOARDING_STAGES.length}
                  {lead.stage !== 'Funded' && ` — ${lead.stage} — Estimated ${stageIndex(lead.stage) < 6 ? '24' : '48'}hrs`}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex px-6">
            {(['activity', 'notes', 'tasks'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  {tab === 'activity' && <Clock className="w-4 h-4" />}
                  {tab === 'notes' && <MessageSquare className="w-4 h-4" />}
                  {tab === 'tasks' && <CheckSquare className="w-4 h-4" />}
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {activeTab === 'activity' && (
            <div className="space-y-4">
              {lead.timeline.map((item, index) => (
                <div key={index} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">{item.icon}</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{item.title}</p>
                    <p className="text-xs text-gray-600 mt-1">{item.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-gray-500">{item.user}</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">{item.timestamp}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{lead.notes}</p>
                    <p className="text-xs text-gray-500 mt-2">Added by {lead.assignedAgent} • 2 days ago</p>
                  </div>
                </div>
              </div>
              <textarea placeholder="Add a new note..." className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none" rows={4} />
              <button className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors">Add Note</button>
            </div>
          )}
          {activeTab === 'tasks' && (
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-white border border-gray-200 rounded-lg">
                <input type="checkbox" className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 rounded" />
                <div className="flex-1"><p className="text-sm font-medium text-gray-900">Follow up call scheduled</p><p className="text-xs text-gray-500 mt-1">Due tomorrow at 2:00 PM</p></div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-white border border-gray-200 rounded-lg">
                <input type="checkbox" className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 rounded" defaultChecked />
                <div className="flex-1"><p className="text-sm font-medium text-gray-500 line-through">Request bank statements</p><p className="text-xs text-gray-500 mt-1">Completed yesterday</p></div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-white border border-gray-200 rounded-lg">
                <input type="checkbox" className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 rounded" />
                <div className="flex-1"><p className="text-sm font-medium text-gray-900">Send proposal to client</p><p className="text-xs text-gray-500 mt-1">Due in 3 days</p></div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="bg-white border-t border-gray-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <button className="flex-1 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-[6px] hover:bg-indigo-700 transition-colors">Next Stage</button>
            <button className="flex-1 px-4 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-[6px] hover:bg-emerald-700 transition-colors">Submit Application</button>
            <button className="px-4 py-2.5 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-[6px] hover:bg-gray-50 transition-colors">Mark Lost</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Referrals Tab ──
function ReferralsTab() {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [rewardAmount, setRewardAmount] = useState('100');
  const [freeMonths, setFreeMonths] = useState('1');
  const [planTier, setPlanTier] = useState('Growth');

  const referrals: Referral[] = [
    { id: 'REF-001', referringMerchant: 'Metro Diner Group', referredBusiness: 'Valley Pizza Co', referralCode: 'METRO-2024A', date: 'Mar 28, 2026', status: 'Converted', rewardStatus: 'Paid', rewardAmount: '$100' },
    { id: 'REF-002', referringMerchant: 'Coastal Seafood Inc', referredBusiness: 'Harbor Fish Market', referralCode: 'COAST-7X91', date: 'Apr 2, 2026', status: 'Contacted', rewardStatus: 'Pending', rewardAmount: '$100' },
    { id: 'REF-003', referringMerchant: 'Bright Auto Sales', referredBusiness: 'Sunrise Auto Body', referralCode: 'BRIGHT-KQ33', date: 'Apr 5, 2026', status: 'Pending', rewardStatus: 'Pending', rewardAmount: '$100' },
    { id: 'REF-004', referringMerchant: 'Lakeside Catering', referredBusiness: 'Greenfield Events LLC', referralCode: 'LAKE-PP82', date: 'Feb 15, 2026', status: 'Expired', rewardStatus: 'N/A', rewardAmount: '—' },
  ];

  const refStatusCls = (s: string) => {
    switch (s) {
      case 'Pending': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Contacted': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Converted': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Expired': return 'bg-gray-100 text-gray-500 border-gray-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const rewardCls = (s: string) => {
    switch (s) {
      case 'Paid': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Pending': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-gray-100 text-gray-500 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Referral Offer Card */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-[8px] p-6 text-white">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
            <Gift className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold">Refer a Business</h3>
            <p className="text-indigo-200 text-sm mt-1">For every successful referral that gets funded, both parties receive:</p>
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <span className="px-3 py-1.5 bg-white/20 rounded-[6px] text-sm font-medium">${rewardAmount} Account Credit</span>
              <span className="text-indigo-300">+</span>
              <span className="px-3 py-1.5 bg-white/20 rounded-[6px] text-sm font-medium">{freeMonths} Month{Number(freeMonths) > 1 ? 's' : ''} Free {planTier}</span>
            </div>
          </div>
          <button onClick={() => setEditModalOpen(true)} className="px-4 py-2 bg-white text-indigo-700 text-sm font-semibold rounded-[6px] hover:bg-indigo-50 transition-colors shrink-0 flex items-center gap-1.5">
            <Edit className="w-3.5 h-3.5" /> Edit Offer
          </button>
        </div>
      </div>

      {/* Referrals Table */}
      <div className="bg-white rounded-[8px] border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">Referral Activity</h3>
          <p className="text-xs text-gray-500 mt-0.5">{referrals.length} referrals &middot; 1 converted this month</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-5 py-3 text-xs text-gray-500 font-medium">Referring Merchant</th>
                <th className="text-left px-5 py-3 text-xs text-gray-500 font-medium">Referred Business</th>
                <th className="text-left px-5 py-3 text-xs text-gray-500 font-medium">Referral Code</th>
                <th className="text-left px-5 py-3 text-xs text-gray-500 font-medium">Date</th>
                <th className="text-center px-5 py-3 text-xs text-gray-500 font-medium">Status</th>
                <th className="text-center px-5 py-3 text-xs text-gray-500 font-medium">Reward Status</th>
                <th className="text-right px-5 py-3 text-xs text-gray-500 font-medium">Reward Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {referrals.map(r => (
                <tr key={r.id} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3 font-medium text-gray-900">{r.referringMerchant}</td>
                  <td className="px-5 py-3 text-gray-700">{r.referredBusiness}</td>
                  <td className="px-5 py-3"><code className="text-xs bg-gray-100 px-2 py-0.5 rounded">{r.referralCode}</code></td>
                  <td className="px-5 py-3 text-gray-500 text-xs">{r.date}</td>
                  <td className="px-5 py-3 text-center">
                    <span className={`inline-flex px-2.5 py-1 text-xs font-medium border rounded-md ${refStatusCls(r.status)}`}>{r.status}</span>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className={`inline-flex px-2.5 py-1 text-xs font-medium border rounded-md ${rewardCls(r.rewardStatus)}`}>{r.rewardStatus}</span>
                  </td>
                  <td className="px-5 py-3 text-right font-medium text-gray-900">{r.rewardAmount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Referral Offer Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setEditModalOpen(false)} />
          <div className="relative bg-white rounded-[8px] shadow-2xl border border-gray-200 p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">Edit Referral Offer</h3>
              <button onClick={() => setEditModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-[6px]"><X className="w-4 h-4 text-gray-500" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Reward Amount ($)</label>
                <input type="number" value={rewardAmount} onChange={e => setRewardAmount(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-[8px] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Free Months</label>
                <input type="number" value={freeMonths} onChange={e => setFreeMonths(e.target.value)} min="1" max="12" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-[8px] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Plan Tier</label>
                <select value={planTier} onChange={e => setPlanTier(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-[8px] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500">
                  <option>Starter</option><option>Growth</option><option>Pro</option><option>Enterprise</option>
                </select>
              </div>
              <div className="bg-indigo-50 rounded-[6px] p-3">
                <p className="text-xs text-indigo-700"><span className="font-medium">Preview:</span> Refer a business &rarr; ${rewardAmount} credit + {freeMonths} month{Number(freeMonths) > 1 ? 's' : ''} free {planTier}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-5">
              <button onClick={() => setEditModalOpen(false)} className="flex-1 px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-[6px] hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"><Save className="w-4 h-4" /> Save Changes</button>
              <button onClick={() => setEditModalOpen(false)} className="px-4 py-2.5 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-[6px] hover:bg-gray-50 transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════
// Main Component
// ════════════════════════════════
export function BackendLeads() {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mainTab, setMainTab] = useState<'leads' | 'referrals'>('leads');
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');


  const leads: Lead[] = [
    {
      id: 'lead-001',
      businessName: 'Green Valley Auto Repair',
      industry: 'Automotive',
      contactName: 'Robert Martinez',
      contactEmail: 'robert@greenvalleyauto.com',
      contactPhone: '(555) 123-4567',
      type: 'MCA',
      source: 'Website Inquiry',
      monthlySales: '$45,000',
      amountRequested: '$75,000',
      score: 82,
      status: 'In Progress',
      priority: 'High',
      lastActivity: '2 hours ago',
      assignedAgent: 'Sarah Johnson',
      stage: 'Qualified',
      timeline: [
        { icon: <Phone className="w-4 h-4 text-indigo-600" />, title: 'Follow-up call completed', description: 'Discussed terms and pricing structure', user: 'Sarah Johnson', timestamp: '2 hours ago' },
        { icon: <FileText className="w-4 h-4 text-indigo-600" />, title: 'Bank statements received', description: '6 months of statements uploaded', user: 'System', timestamp: '1 day ago' },
        { icon: <Mail className="w-4 h-4 text-indigo-600" />, title: 'Initial email sent', description: 'Introduced Delt Pay services', user: 'Sarah Johnson', timestamp: '3 days ago' },
      ],
      notes: 'Strong financials. Owner is motivated and ready to move forward. Prefers daily payment option. Consider offering 1.15 factor rate.',
      referredBy: 'Metro Diner Group',
    },
    {
      id: 'lead-002',
      businessName: 'Urban Wellness Spa',
      industry: 'Health & Wellness',
      contactName: 'Jennifer Lee',
      contactEmail: 'jlee@urbanwellness.com',
      contactPhone: '(555) 234-5678',
      type: 'Leasing',
      source: 'Referral Partner',
      monthlySales: '$62,000',
      amountRequested: '$120,000',
      score: 91,
      status: 'In Progress',
      priority: 'High',
      lastActivity: '4 hours ago',
      assignedAgent: 'Michael Chen',
      stage: 'Underwriting',
      blocker: 'Missing tax return — requested from merchant twice, no response',
      stepDetails: [
        { stage: 'Application Submitted', completedAt: 'Apr 1, 9:00 AM' },
        { stage: 'Bank Verification', completedAt: 'Apr 1, 4:30 PM' },
        { stage: 'Identity Verification', completedAt: 'Apr 2, 10:20 AM' },
        { stage: 'Underwriting', completedAt: null },
        { stage: 'Docs & E-Sign', completedAt: null },
        { stage: 'Funded', completedAt: null },
      ],
      timeline: [
        { icon: <FileText className="w-4 h-4 text-indigo-600" />, title: 'Tax return requested (2nd)', description: 'Emailed and SMS reminder sent', user: 'Michael Chen', timestamp: '1 day ago' },
        { icon: <CheckCircle className="w-4 h-4 text-emerald-600" />, title: 'ID verified', description: 'Identity verification passed', user: 'System', timestamp: 'Apr 2' },
        { icon: <Phone className="w-4 h-4 text-indigo-600" />, title: 'Discovery call', description: 'Discussed equipment needs and financing', user: 'Michael Chen', timestamp: '2 days ago' },
      ],
      notes: 'Excellent credit profile. Looking to lease new spa equipment worth $120K. Stuck waiting on tax docs.',
      referredBy: 'Coastal Seafood Inc',
    },
    {
      id: 'lead-003',
      businessName: 'Lakeside Bistro',
      industry: 'Food & Beverage',
      contactName: 'David Thompson',
      contactEmail: 'david@lakesidebistro.com',
      contactPhone: '(555) 345-6789',
      type: 'MCA',
      source: 'Cold Outreach',
      monthlySales: '$28,000',
      amountRequested: '$50,000',
      score: 58,
      status: 'New',
      priority: 'Medium',
      lastActivity: '1 day ago',
      assignedAgent: 'Sarah Johnson',
      stage: 'New',
      timeline: [
        { icon: <User className="w-4 h-4 text-indigo-600" />, title: 'Lead created', description: 'Added to pipeline from cold outreach', user: 'Sarah Johnson', timestamp: '1 day ago' },
      ],
      notes: 'Initial contact made. Waiting for callback to schedule discovery call.',
    },
    {
      id: 'lead-004',
      businessName: 'TechStart Solutions',
      industry: 'Technology',
      contactName: 'Amanda Rodriguez',
      contactEmail: 'arodriguez@techstart.io',
      contactPhone: '(555) 456-7890',
      type: 'Residual',
      source: 'LinkedIn',
      monthlySales: '$180,000',
      amountRequested: '$250,000',
      score: 95,
      status: 'Won',
      priority: 'High',
      lastActivity: '3 days ago',
      assignedAgent: 'James Miller',
      stage: 'Funded',
      stepDetails: [
        { stage: 'Application Submitted', completedAt: 'Mar 20, 11:00 AM' },
        { stage: 'Bank Verification', completedAt: 'Mar 20, 5:45 PM' },
        { stage: 'Identity Verification', completedAt: 'Mar 21, 9:30 AM' },
        { stage: 'Underwriting', completedAt: 'Mar 22, 2:00 PM' },
        { stage: 'Docs & E-Sign', completedAt: 'Mar 24, 10:15 AM' },
        { stage: 'Funded', completedAt: 'Mar 25, 9:00 AM' },
      ],
      timeline: [
        { icon: <CheckCircle className="w-4 h-4 text-emerald-600" />, title: 'Deal funded', description: 'Funds disbursed — $250K', user: 'System', timestamp: 'Mar 25' },
        { icon: <FileText className="w-4 h-4 text-indigo-600" />, title: 'Docs signed', description: 'E-sign completed by merchant', user: 'System', timestamp: 'Mar 24' },
      ],
      notes: 'Excellent deal closed. Strong residual opportunity with their payment volume.',
    },
    {
      id: 'lead-005',
      businessName: 'Coastal Construction LLC',
      industry: 'Construction',
      contactName: 'Mark Stevens',
      contactEmail: 'mstevens@coastalconstruction.com',
      contactPhone: '(555) 567-8901',
      type: 'MCA',
      source: 'Trade Show',
      monthlySales: '$95,000',
      amountRequested: '$150,000',
      score: 72,
      status: 'In Progress',
      priority: 'Medium',
      lastActivity: '6 hours ago',
      assignedAgent: 'Michael Chen',
      stage: 'Bank Verification',
      blocker: 'Awaiting Plaid link — merchant has not connected bank account',
      stepDetails: [
        { stage: 'Application Submitted', completedAt: 'Apr 8, 10:30 AM' },
        { stage: 'Bank Verification', completedAt: null },
        { stage: 'Identity Verification', completedAt: null },
        { stage: 'Underwriting', completedAt: null },
        { stage: 'Docs & E-Sign', completedAt: null },
        { stage: 'Funded', completedAt: null },
      ],
      timeline: [
        { icon: <Phone className="w-4 h-4 text-indigo-600" />, title: 'Plaid link SMS sent', description: 'Reminded merchant to connect bank', user: 'Michael Chen', timestamp: '6 hours ago' },
        { icon: <User className="w-4 h-4 text-indigo-600" />, title: 'Met at trade show', description: 'Collected business card and initial interest', user: 'Michael Chen', timestamp: '4 days ago' },
      ],
      notes: 'Seasonal business. Needs capital for equipment purchase. Awaiting bank connection.',
    },
    {
      id: 'lead-006',
      businessName: 'Metro Pet Care',
      industry: 'Pet Services',
      contactName: 'Lisa Parker',
      contactEmail: 'lisa@metropetcare.com',
      contactPhone: '(555) 678-9012',
      type: 'MCA',
      source: 'Referral Partner',
      monthlySales: '$38,000',
      amountRequested: '$60,000',
      score: 45,
      status: 'Lost',
      priority: 'Low',
      lastActivity: '2 weeks ago',
      assignedAgent: 'Sarah Johnson',
      stage: 'Qualified',
      timeline: [
        { icon: <AlertCircle className="w-4 h-4 text-red-600" />, title: 'Lead marked lost', description: 'Credit score too low for approval', user: 'Sarah Johnson', timestamp: '2 weeks ago' },
        { icon: <Phone className="w-4 h-4 text-indigo-600" />, title: 'Qualification call', description: 'Identified credit issues', user: 'Sarah Johnson', timestamp: '3 weeks ago' },
      ],
      notes: 'Credit score below 620. Recommended to reapply in 6 months after improving credit.',
    },
    {
      id: 'lead-007',
      businessName: 'Pinnacle Dental Group',
      industry: 'Healthcare',
      contactName: 'Dr. Sarah Mills',
      contactEmail: 'smills@pinnacledental.com',
      contactPhone: '(555) 789-0123',
      type: 'MCA',
      source: 'Website Inquiry',
      monthlySales: '$110,000',
      amountRequested: '$200,000',
      score: 88,
      status: 'In Progress',
      priority: 'High',
      lastActivity: '1 day ago',
      assignedAgent: 'James Miller',
      stage: 'Docs & E-Sign',
      blocker: 'E-sign link sent — awaiting merchant signature on funding agreement',
      stepDetails: [
        { stage: 'Application Submitted', completedAt: 'Apr 3, 2:10 PM' },
        { stage: 'Bank Verification', completedAt: 'Apr 3, 6:30 PM' },
        { stage: 'Identity Verification', completedAt: 'Apr 4, 8:45 AM' },
        { stage: 'Underwriting', completedAt: 'Apr 6, 10:00 AM' },
        { stage: 'Docs & E-Sign', completedAt: null },
        { stage: 'Funded', completedAt: null },
      ],
      timeline: [
        { icon: <Mail className="w-4 h-4 text-indigo-600" />, title: 'E-sign link emailed', description: 'Funding agreement sent for signature', user: 'System', timestamp: '1 day ago' },
        { icon: <CheckCircle className="w-4 h-4 text-emerald-600" />, title: 'Underwriting approved', description: '$200K approved at 1.25 factor', user: 'System', timestamp: 'Apr 6' },
      ],
      notes: 'Strong dental practice. Underwriting approved quickly. Awaiting final signature.',
    },
    {
      id: 'lead-008',
      businessName: 'Summit Freight Services',
      industry: 'Logistics',
      contactName: 'Carlos Reyes',
      contactEmail: 'creyes@summitfreight.com',
      contactPhone: '(555) 890-1234',
      type: 'MCA',
      source: 'Cold Outreach',
      monthlySales: '$72,000',
      amountRequested: '$100,000',
      score: 67,
      status: 'In Progress',
      priority: 'Medium',
      lastActivity: '12 hours ago',
      assignedAgent: 'Sarah Johnson',
      stage: 'Identity Verification',
      blocker: 'ID photo blurry — re-upload requested via SMS',
      stepDetails: [
        { stage: 'Application Submitted', completedAt: 'Apr 6, 11:00 AM' },
        { stage: 'Bank Verification', completedAt: 'Apr 6, 5:15 PM' },
        { stage: 'Identity Verification', completedAt: null },
        { stage: 'Underwriting', completedAt: null },
        { stage: 'Docs & E-Sign', completedAt: null },
        { stage: 'Funded', completedAt: null },
      ],
      timeline: [
        { icon: <Phone className="w-4 h-4 text-indigo-600" />, title: 'SMS sent for ID re-upload', description: 'Photo too blurry for verification', user: 'System', timestamp: '12 hours ago' },
        { icon: <CheckCircle className="w-4 h-4 text-emerald-600" />, title: 'Bank verified via Plaid', description: 'Bank account connected successfully', user: 'System', timestamp: 'Apr 6' },
      ],
      notes: 'Freight company with steady revenue. Stuck on ID verification — blurry photo.',
    },
  ];

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'MCA': return 'bg-indigo-50 text-indigo-700';
      case 'Residual': return 'bg-purple-50 text-purple-700';
      case 'Leasing': return 'bg-emerald-50 text-emerald-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New': return 'bg-blue-50 text-blue-700';
      case 'In Progress': return 'bg-amber-50 text-amber-700';
      case 'Won': return 'bg-emerald-50 text-emerald-700';
      case 'Lost': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50';
    if (score >= 60) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  const totalLeads = leads.length;
  const newLeads = leads.filter(l => l.status === 'New').length;
  const inProgressLeads = leads.filter(l => l.status === 'In Progress').length;
  const wonLeads = leads.filter(l => l.status === 'Won').length;
  const conversionRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : '0.0';
  const avgTimeToFunded = 5.2;

  const stageBadgeCls = (stage: StageName) => {
    if (isPostApplication(stage)) {
      switch (stage) {
        case 'Application Submitted': return 'bg-gray-100 text-gray-700 border-gray-200';
        case 'Bank Verification': return 'bg-blue-50 text-blue-700 border-blue-200';
        case 'Identity Verification': return 'bg-violet-50 text-violet-700 border-violet-200';
        case 'Underwriting': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
        case 'Docs & E-Sign': return 'bg-amber-50 text-amber-700 border-amber-200';
        case 'Funded': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      }
    }
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  return (
    <div className="h-full flex flex-col bg-canvas">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sales Leads</h1>
            <p className="text-sm text-gray-600 mt-1">{totalLeads} total leads in pipeline</p>
          </div>
          <button className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-[6px] hover:bg-indigo-700 transition-colors flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Lead
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="px-6 pt-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <StatCard label="Total Leads" value={totalLeads.toString()} icon={<Users className="w-5 h-5" />} />
          <StatCard label="New" value={newLeads.toString()} trend={{ value: '+2 this week', isPositive: true }} icon={<Star className="w-5 h-5" />} />
          <StatCard label="In Progress" value={inProgressLeads.toString()} icon={<Clock className="w-5 h-5" />} />
          <StatCard label="Won" value={wonLeads.toString()} trend={{ value: '+1 this week', isPositive: true }} icon={<CheckCircle className="w-5 h-5" />} />
          <StatCard label="Conversion Rate" value={`${conversionRate}%`} icon={<TrendingUp className="w-5 h-5" />} />
          <StatCard label="Avg Time to Funded" value={`${avgTimeToFunded} days`} icon={<Calendar className="w-5 h-5" />} />
        </div>

        {/* Tabs: Leads / Referrals */}
        <div className="flex items-center gap-1 border-b border-gray-200 mb-6">
          <button
            onClick={() => setMainTab('leads')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              mainTab === 'leads' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Leads Pipeline
          </button>
          <button
            onClick={() => setMainTab('referrals')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              mainTab === 'referrals' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Referrals
          </button>
        </div>
      </div>

      {mainTab === 'referrals' ? (
        <div className="px-6 pb-6 flex-1 overflow-y-auto">
          <ReferralsTab />
        </div>
      ) : (
        <div className="px-6 pb-6 flex-1 overflow-y-auto space-y-6">
          {/* Filter Bar */}
          <div className="bg-white rounded-[8px] border border-gray-200 p-4">
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by business name, contact, or industry..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <select className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                <option>All Status</option><option>New</option><option>In Progress</option><option>Won</option><option>Lost</option>
              </select>
              <select className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                <option>All Types</option><option>MCA</option><option>Residual</option><option>Leasing</option>
              </select>
              <select className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                <option>All Stages</option>
                {ALL_STAGES.map(s => <option key={s}>{s}</option>)}
              </select>
              <select className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                <option>All Agents</option><option>Sarah Johnson</option><option>Michael Chen</option><option>James Miller</option>
              </select>
              {/* View Mode Toggle */}
              <div className="flex items-center bg-gray-100 rounded-lg p-0.5 shrink-0">
                <button onClick={() => setViewMode('table')} className={`p-2 rounded-md transition-colors ${viewMode === 'table' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`} title="Table view"><List className="w-4 h-4" /></button>
                <button onClick={() => setViewMode('kanban')} className={`p-2 rounded-md transition-colors ${viewMode === 'kanban' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`} title="Kanban view"><LayoutGrid className="w-4 h-4" /></button>
              </div>
            </div>
          </div>

          {/* Kanban Board View */}
          {viewMode === 'kanban' ? (
            <div className="flex gap-4 overflow-x-auto pb-4">
              {ALL_STAGES.map(stage => {
                const stageLeads = leads.filter(l => l.stage === stage);
                return (
                  <div key={stage} className="flex-shrink-0 w-72">
                    <div className="bg-gray-100 rounded-t-[8px] px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">{stage}</h3>
                        <span className="text-[10px] bg-white text-gray-500 rounded-full px-2 py-0.5 font-medium">{stageLeads.length}</span>
                      </div>

                    </div>
                    <div className="bg-gray-50 rounded-b-[8px] p-2 min-h-[200px] space-y-2">
                      {stageLeads.length === 0 ? (
                        <div className="text-center py-8 text-xs text-gray-400">No leads</div>
                      ) : stageLeads.map(lead => {
                        return (
                          <button
                            key={lead.id}
                            onClick={() => setSelectedLead(lead)}
                            className="w-full text-left bg-white rounded-[8px] border border-gray-200 p-3 hover:shadow-md transition-all"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <p className="text-sm font-semibold text-gray-900 leading-tight">{lead.businessName}</p>
                              <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${getScoreColor(lead.score)}`}>{lead.score}</span>
                            </div>
                            <p className="text-xs text-gray-500 mb-2">{lead.contactName}</p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${getTypeColor(lead.type)}`}>{lead.type}</span>
                            </div>
                            {lead.blocker && (
                              <p className="text-[10px] text-red-600 mt-2 line-clamp-1">{lead.blocker}</p>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
          /* Leads Table */
          <div className="bg-white rounded-[8px] border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Business</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Contact</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Type</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Stage</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Score</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Status</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Last Activity</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {leads.map(lead => {
                    return (
                      <tr
                        key={lead.id}
                        onClick={() => setSelectedLead(lead)}
                        className="transition-colors cursor-pointer hover:bg-gray-50"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                              <Building2 className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{lead.businessName}</p>
                              <p className="text-xs text-gray-500">{lead.industry}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm text-gray-900">{lead.contactName}</p>
                          <p className="text-xs text-gray-500">{lead.contactPhone}</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getTypeColor(lead.type)}`}>{lead.type}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex px-2.5 py-1 text-xs font-medium border rounded-md ${stageBadgeCls(lead.stage)}`}>
                            {lead.stage}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-block px-2.5 py-1 rounded-md text-sm font-bold ${getScoreColor(lead.score)}`}>{lead.score}</span>
                        </td>
                        <td className="px-5 py-4">
                          <select
                            value={lead.status}
                            onChange={e => { e.stopPropagation(); }}
                            className={`px-2.5 py-1 rounded-full text-xs font-medium border-0 focus:ring-2 focus:ring-indigo-500 ${getStatusColor(lead.status)}`}
                            onClick={e => e.stopPropagation()}
                          >
                            <option value="New">New</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Won">Won</option>
                            <option value="Lost">Lost</option>
                          </select>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="w-4 h-4" />
                            {lead.lastActivity}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <button onClick={() => setSelectedLead(lead)} className="p-2 hover:bg-gray-100 rounded-md transition-colors">
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          )}
        </div>
      )}

      {/* Lead Detail Panel */}
      {selectedLead && <LeadDetailPanel lead={selectedLead} onClose={() => setSelectedLead(null)} />}
    </div>
  );
}