import React, { useState, useMemo } from 'react';
import { toast } from 'sonner@2.0.3';
import {
  CheckCircle, Circle, Clock, AlertTriangle, Plus, Search,
  Filter, ChevronDown, X, User, Store, Calendar, Flag,
  ArrowRight, Star, Trash2, Edit3, ChevronRight, Zap,
  CheckSquare, LayoutGrid, List, BarChart3,
  Target, Users, Bell, Briefcase, Shield,
} from 'lucide-react';

// ── Types ──
type Priority = 'critical' | 'high' | 'medium' | 'low';
type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'done';
type TaskCategory = 'compliance' | 'collections' | 'sales' | 'onboarding' | 'support' | 'internal';

interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  category: TaskCategory;
  assignee: string;
  merchant?: string;
  merchantId?: string;
  dealId?: string;
  dueDate: string;
  createdDate: string;
  createdBy: string;
  tags: string[];
  overdue: boolean;
}

const PRIORITY_CONFIG: Record<Priority, { color: string; bg: string; label: string; border: string }> = {
  critical: { color: 'text-red-700', bg: 'bg-red-50', label: 'Critical', border: 'border-l-red-500' },
  high: { color: 'text-amber-700', bg: 'bg-amber-50', label: 'High', border: 'border-l-amber-500' },
  medium: { color: 'text-blue-700', bg: 'bg-blue-50', label: 'Medium', border: 'border-l-blue-500' },
  low: { color: 'text-gray-500', bg: 'bg-gray-50', label: 'Low', border: 'border-l-gray-300' },
};

const STATUS_CONFIG: Record<TaskStatus, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  todo: { icon: Circle, color: 'text-gray-400', bg: 'bg-gray-50 border-gray-200', label: 'To Do' },
  in_progress: { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', label: 'In Progress' },
  blocked: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50 border-red-200', label: 'Blocked' },
  done: { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', label: 'Done' },
};

const CATEGORY_CONFIG: Record<TaskCategory, { color: string; bg: string; icon: React.ElementType }> = {
  compliance: { color: 'text-purple-700', bg: 'bg-purple-50', icon: Shield },
  collections: { color: 'text-red-700', bg: 'bg-red-50', icon: AlertTriangle },
  sales: { color: 'text-emerald-700', bg: 'bg-emerald-50', icon: Target },
  onboarding: { color: 'text-blue-700', bg: 'bg-blue-50', icon: Briefcase },
  support: { color: 'text-amber-700', bg: 'bg-amber-50', icon: Bell },
  internal: { color: 'text-gray-600', bg: 'bg-gray-100', icon: Zap },
};

const TASKS: Task[] = [
  { id: 'T-001', title: 'Issue VAMP intervention notice — Coral Reef Auto Spa', description: 'Fraud-to-sales at 0.82%. VAMP trigger is 0.9%. Must issue intervention notice and draft remediation plan before breach.', status: 'todo', priority: 'critical', category: 'compliance', assignee: 'James Miller', merchant: 'Coral Reef Auto Spa', merchantId: 'M-1004', dueDate: '2026-04-17', createdDate: '2026-04-17', createdBy: 'System', tags: ['VAMP', 'card networks', 'auto-generated'], overdue: true },
  { id: 'T-002', title: 'Schedule ASV scans — 3 merchants overdue', description: 'Havana Bites, Coral Reef Auto Spa, and 1 other have ASV scans expiring within 48 hours. Non-compliance fees will activate.', status: 'todo', priority: 'critical', category: 'compliance', assignee: 'Sarah Kim', dueDate: '2026-04-18', createdDate: '2026-04-16', createdBy: 'System', tags: ['PCI', 'ASV', 'auto-generated'], overdue: false },
  { id: 'T-003', title: 'Generate broker compensation disclosure — Brooklyn Vinyl', description: 'NY CFDL requires broker compensation disclosure when ISO/agent involved. Deal blocked from funding until generated and delivered.', status: 'in_progress', priority: 'critical', category: 'compliance', assignee: 'Sarah Kim', merchant: 'Brooklyn Vinyl Records', merchantId: 'M-1002', dealId: 'DL-2026-0415', dueDate: '2026-04-18', createdDate: '2026-04-16', createdBy: 'System', tags: ['NY CFDL', 'disclosure', 'blocking'], overdue: false },
  { id: 'T-004', title: 'Send adverse action notice — Doral Fresh Market', description: 'CRS credit report influenced partial decline on renewal. FCRA requires adverse action notice within 30 days.', status: 'todo', priority: 'high', category: 'compliance', assignee: 'Marcus Johnson', merchant: 'Doral Fresh Market', dueDate: '2026-04-19', createdDate: '2026-04-14', createdBy: 'System', tags: ['FCRA', 'adverse action'], overdue: false },
  { id: 'T-005', title: 'Follow up — Richmond Auto Detailing funding', description: 'VA 3-day review period expires Apr 22. Collect signed disclosure acknowledgment and fund.', status: 'in_progress', priority: 'high', category: 'sales', assignee: 'Marcus Johnson', merchant: 'Richmond Auto Detailing', merchantId: 'M-1003', dealId: 'DL-2026-0416', dueDate: '2026-04-22', createdDate: '2026-04-17', createdBy: 'Marcus Johnson', tags: ['VA review', 'funding'], overdue: false },
  { id: 'T-006', title: 'Collection call — Little Havana Barbershop', description: '3 consecutive NSFs. Status: Slow Pay. Need to discuss modified payment plan or ACH amount reduction.', status: 'todo', priority: 'high', category: 'collections', assignee: 'Marcus Johnson', merchant: 'Little Havana Barbershop', dueDate: '2026-04-18', createdDate: '2026-04-13', createdBy: 'System', tags: ['NSF', 'slow pay', 'ACH'], overdue: false },
  { id: 'T-007', title: 'Reconcile CRS credit pulls — March', description: 'Monthly credit pull count vs billing reconciliation. Due by Apr 21.', status: 'todo', priority: 'medium', category: 'internal', assignee: 'Sarah Kim', dueDate: '2026-04-21', createdDate: '2026-04-01', createdBy: 'System', tags: ['CRS', 'vendor', 'monthly'], overdue: false },
  { id: 'T-008', title: 'Draft ECM remediation plan — Midtown Taqueria', description: 'MC chargeback ratio at 1.17% (threshold 1.5%), 87 CBs (threshold 100). Climbing. Draft plan before breach.', status: 'todo', priority: 'medium', category: 'compliance', assignee: 'James Miller', merchant: 'Midtown Taqueria', merchantId: 'M-1005', dueDate: '2026-04-22', createdDate: '2026-04-15', createdBy: 'System', tags: ['ECM', 'Mastercard', 'chargeback'], overdue: false },
  { id: 'T-009', title: 'Review stacking flag — Brooklyn Vinyl Records', description: 'DataMerch flagged 1 existing position: Rapid Capital $28k. Review and document stacking decision.', status: 'in_progress', priority: 'medium', category: 'onboarding', assignee: 'Sarah Kim', merchant: 'Brooklyn Vinyl Records', merchantId: 'M-1002', dealId: 'DL-2026-0415', dueDate: '2026-04-18', createdDate: '2026-04-16', createdBy: 'System', tags: ['DataMerch', 'stacking'], overdue: false },
  { id: 'T-010', title: 'Present renewal offer — Havana Bites Cafe', description: 'Merchant at 73% repaid. Auto-generated renewal: $50K at 1.36x. Schedule call to present.', status: 'todo', priority: 'medium', category: 'sales', assignee: 'Marcus Johnson', merchant: 'Havana Bites Cafe', merchantId: 'M-1001', dealId: 'DL-2026-0412', dueDate: '2026-04-21', createdDate: '2026-04-15', createdBy: 'System', tags: ['renewal', 'auto-generated'], overdue: false },
  { id: 'T-011', title: 'MATCH re-screen Q2 batch', description: 'Quarterly MATCH/TMF re-screening for 127 active merchants. Batch job ready.', status: 'todo', priority: 'medium', category: 'compliance', assignee: 'Sarah Kim', dueDate: '2026-04-23', createdDate: '2026-04-10', createdBy: 'System', tags: ['MATCH', 'quarterly', 'batch'], overdue: false },
  { id: 'T-012', title: 'Report 2 defaults to DataMerch', description: 'Report default data back to DataMerch consortium per agreement. 2 defaults pending submission.', status: 'todo', priority: 'low', category: 'compliance', assignee: 'Sarah Kim', dueDate: '2026-04-23', createdDate: '2026-04-10', createdBy: 'System', tags: ['DataMerch', 'vendor'], overdue: false },
  { id: 'T-013', title: 'Plaid security questionnaire renewal', description: 'Annual Plaid vendor security questionnaire due May 5. Begin preparation.', status: 'todo', priority: 'low', category: 'compliance', assignee: 'Sarah Kim', dueDate: '2026-05-05', createdDate: '2026-04-01', createdBy: 'System', tags: ['Plaid', 'vendor', 'annual'], overdue: false },
  { id: 'T-014', title: 'Create NJ S1760 impact assessment', description: 'NJ bill passed committee. If enacted: APR via Reg Z for NJ merchants. Prepare impact analysis and contract modification plan.', status: 'todo', priority: 'low', category: 'compliance', assignee: 'Marcus Johnson', dueDate: '2026-04-30', createdDate: '2026-04-15', createdBy: 'System', tags: ['regulatory', 'NJ', 'proactive'], overdue: false },
  { id: 'T-015', title: 'PCI SAQ follow-up — Midtown Taqueria', description: 'Confirmed scan completed Mar 15 — PASS. Close task.', status: 'done', priority: 'medium', category: 'compliance', assignee: 'Sarah Kim', merchant: 'Midtown Taqueria', merchantId: 'M-1005', dueDate: '2026-04-13', createdDate: '2026-04-01', createdBy: 'Sarah Kim', tags: ['PCI'], overdue: false },
];

// ── New Task Modal ──
function NewTaskModal({ onClose, onCreate }: { onClose: () => void; onCreate: (task: Task) => void }) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [category, setCategory] = useState<TaskCategory>('sales');
  const [assignee, setAssignee] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');

  const handleCreate = () => {
    if (!title.trim()) {
      toast.error('Task title is required');
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    const task: Task = {
      id: `T-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      title: title.trim(),
      description: description.trim(),
      status: 'todo',
      priority,
      category,
      assignee: assignee || 'Unassigned',
      dueDate: dueDate || today,
      createdDate: today,
      createdBy: 'You',
      tags: [],
      overdue: false,
    };
    onCreate(task);
    toast.success('Task created');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-[8px] shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h3 className="text-sm font-bold text-gray-900">Create Task</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X className="w-4 h-4 text-gray-400" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Task title..."
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-[6px] text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Details..."
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-[6px] text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Priority</label>
              <div className="flex gap-1">
                {(['critical', 'high', 'medium', 'low'] as Priority[]).map(p => (
                  <button key={p} onClick={() => setPriority(p)}
                    className={`px-2.5 py-1.5 rounded-[6px] text-[10px] font-semibold border transition-colors ${
                      priority === p ? `${PRIORITY_CONFIG[p].bg} ${PRIORITY_CONFIG[p].color} border-current` : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'
                    }`}>{PRIORITY_CONFIG[p].label}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value as TaskCategory)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-[6px] text-xs focus:outline-none focus:ring-2 focus:ring-brand/20">
                {Object.entries(CATEGORY_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{k.charAt(0).toUpperCase() + k.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Assignee</label>
              <select value={assignee} onChange={e => setAssignee(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-[6px] text-xs focus:outline-none focus:ring-2 focus:ring-brand/20">
                <option value="">Select...</option>
                <option>Marcus Johnson</option>
                <option>Sarah Kim</option>
                <option>James Miller</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Due Date</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-[6px] text-xs focus:outline-none focus:ring-2 focus:ring-brand/20" />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Merchant (optional)</label>
            <input placeholder="Search merchant..." className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-[6px] text-sm focus:outline-none focus:ring-2 focus:ring-brand/20" />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-200 bg-gray-50 rounded-b-[8px]">
          <button onClick={onClose} className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-[6px]">Cancel</button>
          <button onClick={handleCreate} className="px-4 py-2 bg-brand text-white text-xs font-medium rounded-[6px] hover:bg-brand-hover">Create Task</button>
        </div>
      </div>
    </div>
  );
}

// ── Main ──
export function BackendTasks() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<TaskCategory | 'all'>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'board'>('list');
  const [showModal, setShowModal] = useState(false);
  const [tasks, setTasks] = useState(TASKS);

  const filtered = useMemo(() => {
    return tasks.filter(t => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
      if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
      if (assigneeFilter && t.assignee !== assigneeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || (t.merchant || '').toLowerCase().includes(q) || t.assignee.toLowerCase().includes(q);
      }
      return true;
    });
  }, [tasks, search, statusFilter, priorityFilter, categoryFilter, assigneeFilter]);

  const toggleStatus = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: t.status === 'done' ? 'todo' : 'done' } : t));
  };

  const statusCounts = useMemo(() => {
    const c: Record<string, number> = { todo: 0, in_progress: 0, blocked: 0, done: 0 };
    tasks.forEach(t => c[t.status]++);
    return c;
  }, [tasks]);

  const assignees = useMemo(() => [...new Set(tasks.map(t => t.assignee))].sort(), [tasks]);
  const overdueTasks = tasks.filter(t => t.overdue && t.status !== 'done');

  return (
    <div className="px-6 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[8px] bg-gradient-to-br from-brand to-brand-light flex items-center justify-center shadow-sm">
            <CheckSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
            <p className="text-sm text-gray-500">{tasks.filter(t => t.status !== 'done').length} open &middot; {overdueTasks.length} overdue &middot; {statusCounts.done} completed</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-[6px] p-0.5">
            <button onClick={() => setView('list')} className={`p-1.5 rounded-[4px] ${view === 'list' ? 'bg-white shadow-sm' : ''}`}><List className="w-3.5 h-3.5 text-gray-600" /></button>
            <button onClick={() => setView('board')} className={`p-1.5 rounded-[4px] ${view === 'board' ? 'bg-white shadow-sm' : ''}`}><LayoutGrid className="w-3.5 h-3.5 text-gray-600" /></button>
          </div>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand text-white text-xs font-medium rounded-[6px] hover:bg-brand-hover">
            <Plus className="w-3.5 h-3.5" /> New Task
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-4 gap-3">
        {([
          { label: 'To Do', count: statusCounts.todo, color: 'border-t-gray-400', icon: Circle },
          { label: 'In Progress', count: statusCounts.in_progress, color: 'border-t-blue-500', icon: Clock },
          { label: 'Blocked', count: statusCounts.blocked, color: 'border-t-red-500', icon: AlertTriangle },
          { label: 'Completed', count: statusCounts.done, color: 'border-t-emerald-500', icon: CheckCircle },
        ]).map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className={`bg-white rounded-[8px] border border-gray-200 border-t-[3px] ${s.color} px-4 py-3`}>
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold">{s.label}</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{s.count}</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-[8px] border border-gray-200 p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks..."
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-[6px] text-xs focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
          </div>
          {/* Status filters */}
          <div className="flex items-center gap-1">
            {(['all', 'todo', 'in_progress', 'blocked', 'done'] as const).map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1.5 rounded-[6px] text-[10px] font-semibold border whitespace-nowrap transition-colors ${
                  statusFilter === s ? 'bg-brand/5 text-brand border-brand/20' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                }`}>{s === 'all' ? 'All' : STATUS_CONFIG[s].label}</button>
            ))}
          </div>
          {/* Priority */}
          <div className="flex items-center gap-1">
            {(['all', 'critical', 'high', 'medium', 'low'] as const).map(p => (
              <button key={p} onClick={() => setPriorityFilter(p)}
                className={`px-2.5 py-1.5 rounded-[6px] text-[10px] font-semibold border whitespace-nowrap transition-colors ${
                  priorityFilter === p ? (p === 'all' ? 'bg-brand/5 text-brand border-brand/20' : `${PRIORITY_CONFIG[p].bg} ${PRIORITY_CONFIG[p].color} border-current`) : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                }`}>{p === 'all' ? 'Any priority' : PRIORITY_CONFIG[p].label}</button>
            ))}
          </div>
          {/* Assignee */}
          {assigneeFilter && (
            <button onClick={() => setAssigneeFilter(null)} className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 text-brand border border-indigo-200 rounded-[6px] text-[10px] font-semibold">
              <User className="w-3 h-3" />{assigneeFilter} <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Board View */}
      {view === 'board' ? (
        <div className="grid grid-cols-4 gap-4">
          {(['todo', 'in_progress', 'blocked', 'done'] as TaskStatus[]).map(status => {
            const cfg = STATUS_CONFIG[status];
            const Icon = cfg.icon;
            const statusTasks = filtered.filter(t => t.status === status);
            return (
              <div key={status} className="min-h-[300px]">
                <div className={`flex items-center gap-2 mb-3 px-3 py-2 rounded-[6px] border ${cfg.bg}`}>
                  <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                  <span className="text-xs font-bold text-gray-900">{cfg.label}</span>
                  <span className="ml-auto text-[10px] font-mono text-gray-400">{statusTasks.length}</span>
                </div>
                <div className="space-y-2">
                  {statusTasks.map(task => {
                    const pcfg = PRIORITY_CONFIG[task.priority];
                    const ccfg = CATEGORY_CONFIG[task.category];
                    const CatIcon = ccfg.icon;
                    return (
                      <div key={task.id} className={`bg-white rounded-[8px] border border-gray-200 border-l-[3px] ${pcfg.border} p-3 hover:shadow-sm transition-all`}>
                        <div className="flex items-start gap-2 mb-2">
                          <button onClick={() => toggleStatus(task.id)} className="mt-0.5 shrink-0">
                            {task.status === 'done'
                              ? <CheckCircle className="w-4 h-4 text-emerald-500" />
                              : <Circle className="w-4 h-4 text-gray-300 hover:text-brand" />}
                          </button>
                          <h4 className={`text-xs font-semibold leading-snug ${task.status === 'done' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{task.title}</h4>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap ml-6">
                          <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${ccfg.bg} ${ccfg.color}`}>{task.category}</span>
                          {task.overdue && task.status !== 'done' && <span className="text-[9px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">OVERDUE</span>}
                        </div>
                        <div className="flex items-center justify-between mt-2 ml-6">
                          <span className="text-[10px] text-gray-400 flex items-center gap-1"><User className="w-2.5 h-2.5" />{task.assignee.split(' ')[0]}</span>
                          <span className={`text-[10px] font-mono ${task.overdue && task.status !== 'done' ? 'text-red-600' : 'text-gray-400'}`}>{task.dueDate.replace('2026-', '')}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-[8px] border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 flex items-center gap-4 text-[10px] text-gray-500 uppercase tracking-wide font-semibold border-b border-gray-200">
            <span className="w-6"></span>
            <span className="flex-1">Task</span>
            <span className="w-20">Priority</span>
            <span className="w-24">Category</span>
            <span className="w-28">Assignee</span>
            <span className="w-32">Merchant</span>
            <span className="w-20">Due</span>
            <span className="w-20">Status</span>
          </div>
          {filtered.map(task => {
            const pcfg = PRIORITY_CONFIG[task.priority];
            const scfg = STATUS_CONFIG[task.status];
            const ccfg = CATEGORY_CONFIG[task.category];
            const SIcon = scfg.icon;
            return (
              <div key={task.id} className={`px-4 py-3 flex items-center gap-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50 transition-colors ${task.overdue && task.status !== 'done' ? 'bg-red-50/20' : ''}`}>
                <button onClick={() => toggleStatus(task.id)} className="w-6 shrink-0">
                  {task.status === 'done'
                    ? <CheckCircle className="w-4 h-4 text-emerald-500" />
                    : <Circle className="w-4 h-4 text-gray-300 hover:text-brand transition-colors" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-gray-400">{task.id}</span>
                    {task.dealId && <span className="text-[9px] font-mono text-brand bg-indigo-50 px-1.5 py-0.5 rounded">{task.dealId}</span>}
                    {task.overdue && task.status !== 'done' && <span className="text-[9px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">OVERDUE</span>}
                  </div>
                  <h4 className={`text-xs font-semibold mt-0.5 truncate ${task.status === 'done' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{task.title}</h4>
                  <div className="flex items-center gap-1 mt-1 flex-wrap">
                    {task.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="text-[9px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{tag}</span>
                    ))}
                  </div>
                </div>
                <span className={`w-20 shrink-0 text-[10px] font-semibold px-2 py-1 rounded text-center ${pcfg.bg} ${pcfg.color}`}>{pcfg.label}</span>
                <span className={`w-24 shrink-0 text-[10px] font-semibold px-2 py-1 rounded ${ccfg.bg} ${ccfg.color}`}>{task.category}</span>
                <button onClick={() => setAssigneeFilter(task.assignee)} className="w-28 shrink-0 text-[10px] text-gray-600 hover:text-brand truncate text-left">{task.assignee}</button>
                <span className="w-32 shrink-0 text-[10px] text-gray-500 truncate">{task.merchant || '—'}</span>
                <span className={`w-20 shrink-0 text-[10px] font-mono ${task.overdue && task.status !== 'done' ? 'text-red-600 font-bold' : 'text-gray-500'}`}>{task.dueDate.replace('2026-', '')}</span>
                <span className={`w-20 shrink-0 flex items-center gap-1 text-[10px] font-semibold ${scfg.color}`}>
                  <SIcon className="w-3 h-3" />{scfg.label}
                </span>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="px-5 py-16 text-center">
              <CheckSquare className="w-8 h-8 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-400">No tasks match your filters</p>
            </div>
          )}
        </div>
      )}

      {showModal && <NewTaskModal onClose={() => setShowModal(false)} onCreate={(task) => setTasks(prev => [task, ...prev])} />}
    </div>
  );
}
