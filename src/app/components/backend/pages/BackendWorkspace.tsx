import React, { useState, useMemo } from 'react';
import {
  Mail, MessageSquare, Phone, Search, CheckCircle, Circle, Clock,
  AlertTriangle, Star, Edit3, ChevronRight, User, Store,
  Calendar, Flag, Zap, Shield, CreditCard, Send, FileText,
  DollarSign, XCircle, Eye, Activity, CheckSquare, Inbox,
  ArrowRight, Plus, Filter, Bell, RefreshCw, Banknote,
  ChevronDown, GitBranch, Heart, AlertCircle,
} from 'lucide-react';

// ═══════════════════════════════════════════
// ── SHARED TYPES & HELPERS ──
// ═══════════════════════════════════════════

const fmtDate = (d: string) => {
  const dt = new Date(d + 'T12:00:00');
  const now = new Date('2026-04-20T12:00:00');
  const diff = Math.floor((now.getTime() - dt.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff}d ago`;
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const fmtTime = (t: string) => t;

// ═══════════════════════════════════════════
// ── INBOX DATA ──
// ═══════════════════════════════════════════

type ChannelType = 'email' | 'sms' | 'call';

interface InboxThread {
  id: string;
  merchant: string;
  merchantInitials: string;
  contact: string;
  channel: ChannelType;
  subject: string;
  preview: string;
  time: string;
  unread: boolean;
  messageCount: number;
  starred: boolean;
}

const CHANNEL_CONFIG: Record<ChannelType, { icon: React.ElementType; color: string; bg: string }> = {
  email: { icon: Mail, color: 'text-blue-600', bg: 'bg-blue-50' },
  sms: { icon: MessageSquare, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  call: { icon: Phone, color: 'text-purple-600', bg: 'bg-purple-50' },
};

const INBOX_THREADS: InboxThread[] = [
  { id: 'th-1', merchant: 'Brooklyn Vinyl Records', merchantInitials: 'BV', contact: 'David Park', channel: 'email', subject: 'Broker compensation section', preview: 'Question about broker compensation section...', time: '10:30', unread: true, messageCount: 4, starred: false },
  { id: 'th-2', merchant: 'Coral Reef Auto Spa', merchantInitials: 'CA', contact: 'Carlos Mendez', channel: 'email', subject: '3DS cost question', preview: '3DS cost question — $200/mo, is that normal?', time: '09:20', unread: true, messageCount: 3, starred: false },
  { id: 'th-3', merchant: 'Havana Bites Cafe', merchantInitials: 'HB', contact: 'Maria Gonzalez', channel: 'sms', subject: 'Renewal offer', preview: 'Excited about the renewal offer.', time: '14:15', unread: false, messageCount: 5, starred: true },
  { id: 'th-4', merchant: 'SoBe Cycle & Fitness', merchantInitials: 'SC', contact: 'Carlos Mendez', channel: 'call', subject: 'Payment adjustment', preview: 'Voicemail — Requesting daily payment adjustment due to seasonal dip.', time: 'Apr 18', unread: false, messageCount: 1, starred: false },
  { id: 'th-5', merchant: 'Metro Diner Group', merchantInitials: 'MD', contact: 'James Park', channel: 'email', subject: 'Website updates', preview: 'Could you add a catering menu page to our site?', time: 'Apr 17', unread: false, messageCount: 2, starred: false },
];

// ═══════════════════════════════════════════
// ── ACTIVITY DATA ──
// ═══════════════════════════════════════════

type ActivityType = 'call' | 'email' | 'sms' | 'status_change' | 'deal' | 'payment' | 'task' | 'document' | 'alert' | 'system';

interface ActivityEvent {
  id: string;
  timestamp: string;
  time: string;
  type: ActivityType;
  title: string;
  description: string;
  user: string;
  merchant?: string;
}

const ACTIVITY_CONFIG: Record<ActivityType, { icon: React.ElementType; color: string; bg: string }> = {
  call: { icon: Phone, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  email: { icon: Mail, color: 'text-blue-600', bg: 'bg-blue-50' },
  sms: { icon: MessageSquare, color: 'text-purple-600', bg: 'bg-purple-50' },
  status_change: { icon: GitBranch, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  deal: { icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  payment: { icon: Banknote, color: 'text-blue-600', bg: 'bg-blue-50' },
  task: { icon: CheckSquare, color: 'text-amber-600', bg: 'bg-amber-50' },
  document: { icon: FileText, color: 'text-gray-600', bg: 'bg-gray-100' },
  alert: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
  system: { icon: Zap, color: 'text-gray-500', bg: 'bg-gray-100' },
};

const ACTIVITIES: ActivityEvent[] = [
  { id: 'a-1', timestamp: '2026-04-20', time: 'Today 09:42', type: 'alert', title: 'VAMP threshold warning — Coral Reef Auto Spa', description: 'Fraud-to-sales at 0.82%, approaching 0.9% trigger', user: 'System' },
  { id: 'a-2', timestamp: '2026-04-20', time: 'Today 09:15', type: 'call', title: 'Outbound call — Richmond Auto Detailing', description: 'VA 3-day review confirmed. Funding Apr 22.', user: 'Marcus Johnson' },
  { id: 'a-3', timestamp: '2026-04-20', time: 'Today 08:55', type: 'document', title: 'VA disclosure package generated — DL-2026-0416', description: 'All 9 required items. 3-business-day review initiated.', user: 'System' },
  { id: 'a-4', timestamp: '2026-04-19', time: 'Yesterday 16:30', type: 'deal', title: 'Deal approved — Havana Bites Cafe', description: '$45K MCA at 1.32x factor. Ready for funding.', user: 'Michael Torres' },
  { id: 'a-5', timestamp: '2026-04-19', time: 'Yesterday 14:20', type: 'payment', title: 'NSF return — Little Havana Barbershop', description: '3rd consecutive NSF. Account flagged as Slow Pay.', user: 'System' },
  { id: 'a-6', timestamp: '2026-04-19', time: 'Yesterday 11:00', type: 'status_change', title: 'Lead stage: Qualified → Submitted', description: 'Brooklyn Vinyl Records submitted full application.', user: 'Sarah Kim' },
  { id: 'a-7', timestamp: '2026-04-18', time: 'Apr 18 15:45', type: 'email', title: 'Renewal offer sent — SoBe Cycle & Fitness', description: '$100K renewal at 1.28x. 63% of current position repaid.', user: 'James Miller' },
  { id: 'a-8', timestamp: '2026-04-18', time: 'Apr 18 10:30', type: 'task', title: 'Task completed — ASV scan scheduled', description: 'Quarterly PCI ASV scan for 12 merchants scheduled with vendor.', user: 'Sarah Kim' },
  { id: 'a-9', timestamp: '2026-04-17', time: 'Apr 17 09:00', type: 'system', title: 'Daily collections processed', description: '$1,103 collected across 6 active accounts. 1 NSF returned.', user: 'System' },
  { id: 'a-10', timestamp: '2026-04-17', time: 'Apr 17 08:00', type: 'sms', title: 'SMS campaign delivered — Renewal Eligible', description: '8 merchants received renewal eligibility notification.', user: 'System' },
];

// ═══════════════════════════════════════════
// ── TASKS DATA ──
// ═══════════════════════════════════════════

type Priority = 'critical' | 'high' | 'medium' | 'low';
type TaskStatus = 'todo' | 'in_progress' | 'done';

interface Task {
  id: string;
  title: string;
  merchant?: string;
  context: string;
  priority: Priority;
  status: TaskStatus;
  assignee: string;
  dueDate: string;
  overdue: boolean;
}

const PRIORITY_CONFIG: Record<Priority, { color: string; bg: string; label: string }> = {
  critical: { color: 'text-red-700', bg: 'bg-red-50 border-red-200', label: 'Critical' },
  high: { color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', label: 'High' },
  medium: { color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', label: 'Medium' },
  low: { color: 'text-gray-500', bg: 'bg-gray-50 border-gray-200', label: 'Low' },
};

const TASKS: Task[] = [
  { id: 't-1', title: 'Issue VAMP intervention notice', merchant: 'Coral Reef', context: 'compliance', priority: 'critical', status: 'todo', assignee: 'James Miller', dueDate: '2026-04-17', overdue: true },
  { id: 't-2', title: 'Schedule ASV scans — 3 merchants overdue', context: 'compliance', priority: 'critical', status: 'todo', assignee: 'Sarah Kim', dueDate: '2026-04-18', overdue: true },
  { id: 't-3', title: 'Generate broker compensation disclosure', merchant: 'Brooklyn Vinyl Records', context: 'NY CFDL', priority: 'critical', status: 'todo', assignee: 'Sarah Kim', dueDate: '2026-04-18', overdue: true },
  { id: 't-4', title: 'Send adverse action notice', merchant: 'Doral Fresh Market', context: 'FCRA', priority: 'high', status: 'todo', assignee: 'Marcus Johnson', dueDate: '2026-04-19', overdue: true },
  { id: 't-5', title: 'Collection call', merchant: 'Little Havana Barbershop', context: 'NSF', priority: 'high', status: 'todo', assignee: 'Marcus Johnson', dueDate: '2026-04-18', overdue: true },
  { id: 't-6', title: 'Follow up — Richmond Auto Detailing funding', context: 'VA review', priority: 'high', status: 'in_progress', assignee: 'Marcus Johnson', dueDate: '2026-04-22', overdue: false },
  { id: 't-7', title: 'Reconcile CRS credit pulls — March', context: 'vendor', priority: 'medium', status: 'todo', assignee: 'Sarah Kim', dueDate: '2026-04-21', overdue: false },
  { id: 't-8', title: 'Prepare weekly pipeline report', context: 'operations', priority: 'medium', status: 'todo', assignee: 'Marcus Johnson', dueDate: '2026-04-21', overdue: false },
  { id: 't-9', title: 'Review Havana Bites funding package', context: 'funding', priority: 'high', status: 'in_progress', assignee: 'Michael Torres', dueDate: '2026-04-20', overdue: false },
  { id: 't-10', title: 'Update compliance calendar Q2', context: 'compliance', priority: 'low', status: 'todo', assignee: 'Sarah Kim', dueDate: '2026-04-25', overdue: false },
];

// ═══════════════════════════════════════════
// ── WORKSPACE PAGE ──
// ═══════════════════════════════════════════

export function BackendWorkspace() {
  const [activePanel, setActivePanel] = useState<'inbox' | 'activity' | 'tasks'>('inbox');
  const [inboxSearch, setInboxSearch] = useState('');
  const [activitySearch, setActivitySearch] = useState('');
  const [taskFilter, setTaskFilter] = useState<'all' | 'overdue' | 'today' | 'mine'>('all');

  const unreadCount = INBOX_THREADS.filter(t => t.unread).length;
  const overdueCount = TASKS.filter(t => t.overdue && t.status !== 'done').length;
  const openTaskCount = TASKS.filter(t => t.status !== 'done').length;
  const activeDeals = 6;

  const filteredInbox = INBOX_THREADS.filter(t => {
    if (!inboxSearch) return true;
    const q = inboxSearch.toLowerCase();
    return t.merchant.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q) || t.contact.toLowerCase().includes(q);
  });

  const filteredActivities = ACTIVITIES.filter(a => {
    if (!activitySearch) return true;
    const q = activitySearch.toLowerCase();
    return a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q) || a.user.toLowerCase().includes(q);
  });

  const filteredTasks = TASKS.filter(t => {
    if (t.status === 'done') return false;
    if (taskFilter === 'overdue') return t.overdue;
    if (taskFilter === 'today') return t.dueDate === '2026-04-20' || t.overdue;
    return true;
  });

  return (
    <div className="px-6 py-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[8px] bg-gradient-to-br from-[#4318FF] to-[#7B61FF] flex items-center justify-center shadow-sm">
            <Inbox className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Workspace</h1>
            <p className="text-sm text-gray-500">Inbox, activity, and tasks — all in one place</p>
          </div>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Unread messages', value: unreadCount, color: unreadCount > 0 ? 'text-[#4318FF]' : 'text-gray-900', accent: 'border-t-[#4318FF]' },
          { label: 'Open tasks', value: openTaskCount, color: 'text-gray-900', accent: 'border-t-amber-500' },
          { label: 'Overdue', value: overdueCount, color: overdueCount > 0 ? 'text-red-600' : 'text-gray-900', accent: overdueCount > 0 ? 'border-t-red-500' : 'border-t-gray-300' },
          { label: 'Active deals', value: activeDeals, color: 'text-gray-900', accent: 'border-t-emerald-500' },
        ].map((kpi, i) => (
          <div key={i} className={`bg-white rounded-[8px] border border-gray-200 border-t-[3px] ${kpi.accent} px-4 py-3`}>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold mb-1">{kpi.label}</p>
            <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Panel Tabs */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-[8px] p-1 w-fit mb-4">
        {([
          { key: 'inbox' as const, label: 'Inbox', icon: Mail, badge: unreadCount > 0 ? unreadCount : undefined },
          { key: 'activity' as const, label: 'Activity', icon: Activity, badge: undefined },
          { key: 'tasks' as const, label: 'Tasks', icon: CheckSquare, badge: overdueCount > 0 ? overdueCount : undefined },
        ]).map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.key} onClick={() => setActivePanel(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-[6px] text-xs font-medium transition-all ${
                activePanel === tab.key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}>
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
              {tab.badge && <span className="ml-1 px-1.5 py-0.5 bg-red-100 text-red-700 text-[9px] font-bold rounded-full">{tab.badge}</span>}
            </button>
          );
        })}
      </div>

      {/* ── INBOX PANEL ── */}
      {activePanel === 'inbox' && (
        <div className="flex-1 bg-white rounded-[8px] border border-gray-200 overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={inboxSearch} onChange={e => setInboxSearch(e.target.value)} placeholder="Search conversations..."
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-[6px] text-xs focus:outline-none focus:ring-2 focus:ring-[#4318FF]/20" />
            </div>
            <button className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 border border-gray-200 rounded-[6px] hover:bg-gray-50">
              <Plus className="w-3.5 h-3.5" /> Compose
            </button>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {filteredInbox.map(thread => {
              const ch = CHANNEL_CONFIG[thread.channel];
              const ChIcon = ch.icon;
              return (
                <div key={thread.id} className={`px-4 py-3 flex items-start gap-3 hover:bg-gray-50/50 cursor-pointer transition-colors ${thread.unread ? 'bg-[#4318FF]/[0.02]' : ''}`}>
                  {thread.unread && <div className="w-2 h-2 rounded-full bg-[#4318FF] mt-2 shrink-0" />}
                  {!thread.unread && <div className="w-2 h-2 shrink-0" />}
                  <div className={`w-9 h-9 rounded-full ${ch.bg} flex items-center justify-center shrink-0`}>
                    <span className={`text-[10px] font-bold ${ch.color}`}>{thread.merchantInitials}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h4 className={`text-xs ${thread.unread ? 'font-bold text-gray-900' : 'font-medium text-gray-700'} truncate`}>{thread.merchant}</h4>
                      <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">{thread.time}</span>
                    </div>
                    <p className={`text-[11px] ${thread.unread ? 'font-semibold text-gray-700' : 'text-gray-500'} truncate`}>{thread.preview}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-gray-400">{thread.contact}</span>
                      <span className="text-[10px] text-gray-300">&middot;</span>
                      <span className="text-[10px] text-gray-400">{thread.messageCount} messages</span>
                      <ChIcon className={`w-3 h-3 ${ch.color} ml-auto`} />
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredInbox.length === 0 && (
              <div className="py-16 text-center">
                <Inbox className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No conversations match your search</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── ACTIVITY PANEL ── */}
      {activePanel === 'activity' && (
        <div className="flex-1 bg-white rounded-[8px] border border-gray-200 overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={activitySearch} onChange={e => setActivitySearch(e.target.value)} placeholder="Search activity..."
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-[6px] text-xs focus:outline-none focus:ring-2 focus:ring-[#4318FF]/20" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredActivities.map((event, i) => {
              const cfg = ACTIVITY_CONFIG[event.type];
              const Icon = cfg.icon;
              const showDateHeader = i === 0 || filteredActivities[i - 1].timestamp !== event.timestamp;
              return (
                <React.Fragment key={event.id}>
                  {showDateHeader && (
                    <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                      <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">{fmtDate(event.timestamp)}</span>
                    </div>
                  )}
                  <div className="px-4 py-3 flex items-start gap-3 hover:bg-gray-50/50 transition-colors border-b border-gray-50">
                    <div className={`w-7 h-7 rounded-full ${cfg.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                      <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold text-gray-900">{event.title}</h4>
                      <p className="text-[11px] text-gray-500 mt-0.5">{event.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-gray-400">{event.time}</span>
                        <span className="text-[10px] text-gray-300">&middot;</span>
                        <span className="text-[10px] text-gray-400">{event.user}</span>
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
            {filteredActivities.length === 0 && (
              <div className="py-16 text-center">
                <Activity className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No activity matches your search</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TASKS PANEL ── */}
      {activePanel === 'tasks' && (
        <div className="flex-1 bg-white rounded-[8px] border border-gray-200 overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-3">
            <div className="flex items-center gap-1">
              {(['all', 'overdue', 'today'] as const).map(f => (
                <button key={f} onClick={() => setTaskFilter(f)}
                  className={`px-2.5 py-1.5 rounded-[6px] text-[10px] font-semibold border whitespace-nowrap transition-colors ${
                    taskFilter === f ? (f === 'overdue' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-[#4318FF]/5 text-[#4318FF] border-[#4318FF]/20') : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                  }`}>
                  {f === 'all' ? 'All Open' : f === 'overdue' ? `Overdue (${overdueCount})` : 'Due Today'}
                </button>
              ))}
            </div>
            <div className="ml-auto">
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#4318FF] bg-[#4318FF]/5 rounded-[6px] hover:bg-[#4318FF]/10">
                <Plus className="w-3.5 h-3.5" /> Add Task
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {filteredTasks.map(task => {
              const pcfg = PRIORITY_CONFIG[task.priority];
              return (
                <div key={task.id} className={`px-4 py-3 flex items-start gap-3 hover:bg-gray-50/50 transition-colors ${task.overdue ? 'bg-red-50/20' : ''}`}>
                  <button className="mt-0.5 shrink-0">
                    {task.status === 'in_progress' ? (
                      <div className="w-4 h-4 rounded-full border-2 border-[#4318FF] flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-[#4318FF]" />
                      </div>
                    ) : (
                      <Circle className="w-4 h-4 text-gray-300" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="text-xs font-semibold text-gray-900">{task.title}</h4>
                      {task.merchant && <span className="text-[10px] text-gray-500">— {task.merchant}</span>}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border ${pcfg.bg} ${pcfg.color}`}>{pcfg.label}</span>
                      <span className="text-[10px] text-gray-400">{task.assignee}</span>
                      <span className="text-[10px] text-gray-300">&middot;</span>
                      <span className="text-[10px] text-gray-400">{task.context}</span>
                      <span className="text-[10px] text-gray-300">&middot;</span>
                      <span className={`text-[10px] font-medium ${task.overdue ? 'text-red-600' : 'text-gray-500'}`}>
                        due {fmtDate(task.dueDate)}{task.overdue && ' (overdue)'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredTasks.length === 0 && (
              <div className="py-16 text-center">
                <CheckCircle className="w-8 h-8 text-emerald-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">All caught up!</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
