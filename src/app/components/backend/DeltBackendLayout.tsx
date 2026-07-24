import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { NavigationContext } from './NavigationContext';
import { SyncIndicator } from './SyncIndicator';
import { BackendDashboard } from './pages/BackendDashboard';
import { BackendLeads } from './pages/BackendLeads';
import { BackendMerchants } from './pages/BackendMerchants';
import { BackendUnderwriting } from './pages/BackendUnderwriting';
import { BackendDeals } from './pages/BackendDeals';
import { BackendAgents } from './pages/BackendAgents';
import { BackendFinancials } from './pages/BackendFinancials';
import { BackendLensAI } from './pages/BackendLensAI';
import { BackendSettings } from './pages/BackendSettings';
import { MerchantDetail } from './pages/MerchantDetail';
import { UnderwritingDetail } from './pages/UnderwritingDetail';
import { DealDetail } from './pages/DealDetail';
import { AgentDashboard } from './pages/AgentDashboard';
import { AgentCommissions } from './pages/AgentCommissions';
import { BackendOnboarding } from './pages/BackendOnboarding';
import { BackendRetention } from './pages/BackendRetention';
import { BackendEmployees } from './pages/BackendEmployees';
import { BackendPayroll } from './pages/BackendPayroll';
import { BackendAnalysis } from './pages/BackendAnalysis';
import { BackendResiduals, AgentResiduals } from './pages/BackendResiduals';
import { BackendCapital } from './pages/BackendCapital';
import { HelpCenter } from './pages/HelpCenter';
import { TemplateEditor } from './pages/TemplateEditor';
import { MerchantResidualDetail } from './pages/MerchantResidualDetail';
import { BackendDisputes } from './pages/BackendDisputes';
import { BackendOutreach } from './pages/BackendOutreach';
import { BackendCompliance } from './pages/BackendCompliance';
import { BackendWorkspace } from './pages/BackendWorkspace';
import { BackendActivityTimeline } from './pages/BackendActivityTimeline';
import { BackendTasks } from './pages/BackendTasks';
import { BackendInbox } from './pages/BackendInbox';
import { BackendWebsites } from './pages/BackendWebsites';
import { BackendSubscriptions } from './pages/BackendSubscriptions';
import { BackendDocuments } from './pages/BackendDocuments';
import { BackendPayments } from './pages/BackendPayments';
import { BackendReports } from './pages/BackendReports';
import {
  LayoutDashboard,
  Users,
  Store,
  ClipboardCheck,
  Handshake,
  UserCircle,
  DollarSign,
  Sparkles,
  Settings,
  Search,
  Bell,
  ChevronDown,
  Menu,
  X,
  Banknote,
  HelpCircle,
  ArrowLeftRight,
  CreditCard,
  ShieldAlert,
  GitBranch,
  Brain,
  UsersRound,
  Heart,
  Link2,
  Shield,
  ShieldCheck,
  Wrench,
  Briefcase,
  Receipt,
  Plus,
  ChevronRight,
  Command,
  Home,
  FileText,
  Zap,
  Package,
  Send,
  Activity,
  CheckSquare,
  Inbox,
  Globe,
  Handshake as HandshakeIcon,
  PenTool,
  Wallet,
  BarChart3,
} from 'lucide-react';

// ── Types ──
type UserRole = 'admin' | 'agent';

interface NavSection {
  id: string;
  label: string;
  icon: React.ElementType;
  children: { label: string; path: string }[];
}

// ── Admin sidebar sections (Gusto-style expandable) ──
const adminSections: NavSection[] = [
  {
    id: 'pipeline',
    label: 'Pipeline',
    icon: GitBranch,
    children: [
      { label: 'Leads', path: '/leads' },
      { label: 'Underwriting', path: '/underwriting' },
      { label: 'Analysis', path: '/analysis' },
    ],
  },
  {
    id: 'merchants',
    label: 'Merchants',
    icon: Store,
    children: [
      { label: 'All Merchants', path: '/merchants' },
      { label: 'Residuals', path: '/residuals' },
      { label: 'Capital', path: '/capital' },
      { label: 'Health & Retention', path: '/retention' },
    ],
  },
  {
    id: 'disputes',
    label: 'Disputes',
    icon: ShieldAlert,
    children: [
      { label: 'Dispute Center', path: '/disputes' },
    ],
  },
  {
    id: 'outreach',
    label: 'Outreach',
    icon: Send,
    children: [
      { label: 'Campaigns', path: '/outreach' },
    ],
  },
  {
    id: 'team',
    label: 'Team',
    icon: UsersRound,
    children: [
      { label: 'Agents', path: '/agents' },
      { label: 'Employees', path: '/employees' },
      { label: 'Payroll', path: '/payroll' },
    ],
  },
  {
    id: 'intelligence',
    label: 'Intelligence',
    icon: Brain,
    children: [
      { label: 'Lens AI', path: '/lens-ai' },
      { label: 'Financials', path: '/financials' },
      { label: 'Reports', path: '/reports' },
    ],
  },
  {
    id: 'products',
    label: 'Products',
    icon: Globe,
    children: [
      { label: 'Websites', path: '/websites' },
      { label: 'Subscriptions', path: '/subscriptions' },
    ],
  },
  {
    id: 'compliance',
    label: 'Compliance',
    icon: ShieldCheck,
    children: [
      { label: 'Compliance Hub', path: '/compliance' },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    children: [
      { label: 'General', path: '/settings' },
      { label: 'Integration Health', path: '/settings/integrations' },
      { label: 'Roles & Permissions', path: '/settings/roles' },
      { label: 'Bundles', path: '/settings/bundles' },
    ],
  },
];

// ── Agent sidebar (flat, no expand) ──
const agentItems = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'My Merchants', path: '/merchants', icon: Store },
  { label: 'My Leads', path: '/leads', icon: Users },
  { label: 'Commissions', path: '/commissions', icon: Banknote },
];

// ── Which section owns a path? ──
function sectionForPath(path: string): string | null {
  for (const s of adminSections) {
    if (s.children.some(c => path === c.path || path.startsWith(c.path + '/'))) return s.id;
  }
  // Additional mappings for detail pages
  if (path.startsWith('/inbox') || path.startsWith('/activity-timeline') || path.startsWith('/tasks')) return 'crm';
  if (path.startsWith('/leads') || path.startsWith('/underwriting') || path.startsWith('/onboarding') || path.startsWith('/analysis')) return 'pipeline';
  if (path.startsWith('/merchants') || path.startsWith('/residuals') || path.startsWith('/capital') || path.startsWith('/retention') || path.startsWith('/documents') || path.startsWith('/payments')) return 'merchants';
  if (path.startsWith('/disputes')) return 'disputes';
  if (path.startsWith('/outreach')) return 'outreach';
  if (path.startsWith('/agents') || path.startsWith('/employees') || path.startsWith('/payroll') || path.startsWith('/commissions')) return 'team';
  if (path.startsWith('/lens-ai') || path.startsWith('/financials') || path.startsWith('/reports')) return 'intelligence';
  if (path.startsWith('/compliance')) return 'compliance';
  if (path.startsWith('/settings')) return 'settings';
  return null;
}

// ── Breadcrumb helpers ──
function getBreadcrumbs(path: string): { label: string; path: string }[] {
  const crumbs: { label: string; path: string }[] = [{ label: 'Home', path: '/' }];
  if (path === '/') return crumbs;
  if (path.startsWith('/merchants/')) {
    const id = path.split('/')[2];
    crumbs.push({ label: 'Merchants', path: '/merchants' });
    crumbs.push({ label: id ? `Merchant #${id}` : 'Detail', path });
  } else if (path.startsWith('/underwriting/')) {
    const id = path.split('/')[2];
    crumbs.push({ label: 'Underwriting', path: '/underwriting' });
    crumbs.push({ label: id ? `Case #${id}` : 'Detail', path });
  } else if (path.startsWith('/deals/')) {
    const id = path.split('/')[2];
    crumbs.push({ label: 'Deals', path: '/deals' });
    crumbs.push({ label: id ? `Deal #${id}` : 'Detail', path });
  }
  return crumbs;
}

function isDeepPage(path: string): boolean {
  return path.startsWith('/merchants/') || path.startsWith('/underwriting/') || path.startsWith('/deals/');
}

// ── Command Palette Data ──
interface CommandItem {
  label: string;
  path: string;
  group: string;
  icon: React.ElementType;
  keywords?: string;
}

const allCommands: CommandItem[] = [
  { label: 'Dashboard', path: '/', group: 'Navigation', icon: Home },
  { label: 'Workspace', path: '/workspace', group: 'Navigation', icon: Inbox, keywords: 'inbox email sms call messages tasks activity timeline' },
  { label: 'Leads', path: '/leads', group: 'Pipeline', icon: Users, keywords: 'sales pipeline' },
  { label: 'Underwriting', path: '/underwriting', group: 'Pipeline', icon: ClipboardCheck },
  { label: 'Analysis', path: '/analysis', group: 'Pipeline', icon: FileText, keywords: 'deal analysis review cost calculator' },
  { label: 'All Merchants', path: '/merchants', group: 'Merchants', icon: Store },
  { label: 'Residuals', path: '/residuals', group: 'Merchants', icon: Receipt },
  { label: 'Capital', path: '/capital', group: 'Merchants', icon: Banknote },
  { label: 'Health & Retention', path: '/retention', group: 'Merchants', icon: Heart },
  { label: 'Dispute Center', path: '/disputes', group: 'Disputes', icon: ShieldAlert, keywords: 'chargeback representment evidence' },
  { label: 'Outreach Campaigns', path: '/outreach', group: 'Outreach', icon: Send, keywords: 'email sms campaign automation bulk send' },
  { label: 'Agents', path: '/agents', group: 'Team', icon: UserCircle },
  { label: 'Employees', path: '/employees', group: 'Team', icon: Briefcase },
  { label: 'Payroll', path: '/payroll', group: 'Team', icon: Receipt },
  { label: 'Lens AI', path: '/lens-ai', group: 'Intelligence', icon: Sparkles, keywords: 'ai analysis' },
  { label: 'Financials', path: '/financials', group: 'Intelligence', icon: DollarSign, keywords: 'revenue profit' },
  { label: 'Reports', path: '/reports', group: 'Intelligence', icon: BarChart3, keywords: 'data visualization' },
  { label: 'Compliance Hub', path: '/compliance', group: 'Compliance', icon: ShieldCheck, keywords: 'compliance rules' },
  { label: 'Websites', path: '/websites', group: 'Products', icon: Globe, keywords: 'sites domain builder analytics' },
  { label: 'Subscriptions', path: '/subscriptions', group: 'Products', icon: CreditCard, keywords: 'billing plans MRR SaaS' },
  { label: 'Integration Health', path: '/settings/integrations', group: 'Settings', icon: Link2 },
  { label: 'Roles & Permissions', path: '/settings/roles', group: 'Settings', icon: Shield },
  { label: 'Bundles', path: '/settings/bundles', group: 'Settings', icon: Package },
  { label: 'General Settings', path: '/settings', group: 'Settings', icon: Wrench },
];

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrator',
  manager: 'Manager',
  agent: 'Sales Agent',
  employee: 'Employee',
};

// ════════════════════════════════════════
// Main Layout
// ════════════════════════════════════════
export function DeltBackendLayout() {
  const { profile, signOut } = useAuth();
  const profileRole = profile?.role ?? 'agent';
  // Admins/managers get the full backend view and may switch to the agent
  // view; agents/employees are locked to the agent view.
  const canSwitchView = profileRole === 'admin' || profileRole === 'manager';
  const [currentPage, setCurrentPage] = useState('/');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>(canSwitchView ? 'admin' : 'agent');
  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false);
  const [cmdQuery, setCmdQuery] = useState('');
  const [helpCenterOpen, setHelpCenterOpen] = useState(false);

  // Track which sidebar sections are expanded
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // Auto-expand the section that contains the current page
  useEffect(() => {
    const sec = sectionForPath(currentPage);
    if (sec) {
      setExpandedSections(prev => {
        const next = new Set(prev);
        next.add(sec);
        return next;
      });
    }
  }, [currentPage]);

  // ── Command palette keyboard shortcut ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdPaletteOpen(prev => !prev);
        setCmdQuery('');
      }
      if (e.key === 'Escape') setCmdPaletteOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const filteredCommands = useMemo(() => {
    if (!cmdQuery) return allCommands;
    const q = cmdQuery.toLowerCase();
    return allCommands.filter(c =>
      c.label.toLowerCase().includes(q) ||
      c.group.toLowerCase().includes(q) ||
      (c.keywords && c.keywords.toLowerCase().includes(q))
    );
  }, [cmdQuery]);

  const cmdGroups = useMemo(() => {
    const map = new Map<string, CommandItem[]>();
    filteredCommands.forEach(c => {
      if (!map.has(c.group)) map.set(c.group, []);
      map.get(c.group)!.push(c);
    });
    return map;
  }, [filteredCommands]);

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    setIsMobileMenuOpen(false);
  };

  const toggleSection = (id: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleRole = () => {
    setUserRole(r => (r === 'admin' ? 'agent' : 'admin'));
    setCurrentPage('/');
    setIsUserMenuOpen(false);
  };

  const isActivePath = (path: string) => {
    if (path === '/') return currentPage === '/';
    if (path === '/settings') return currentPage === '/settings';
    return currentPage === path || currentPage.startsWith(path + '/');
  };

  // ── Render page content ──
  const renderPage = () => {
    if (userRole === 'agent') {
      if (currentPage.startsWith('/templates/')) return <TemplateEditor />;
      if (currentPage.startsWith('/merchants/')) return <MerchantDetail />;
      switch (currentPage) {
        case '/': return <AgentDashboard />;
        case '/merchants': return <BackendMerchants />;
        case '/leads': return <BackendLeads />;
        case '/commissions': return <AgentCommissions />;
        case '/my-residuals': return <AgentResiduals />;
        case '/support': return (
          <div className="px-6 py-6 space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Support</h1>
            <div className="bg-white rounded-[8px] border border-gray-200 p-6">
              <div className="max-w-lg">
                <p className="text-sm text-gray-600 mb-4">Need help? Contact the operations team or submit a support ticket.</p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-[6px]">
                    <HelpCircle className="w-5 h-5 text-indigo-600" />
                    <div><p className="text-sm font-medium text-gray-900">Email Support</p><p className="text-xs text-gray-500">support@deltpay.com</p></div>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-[6px]">
                    <HelpCircle className="w-5 h-5 text-indigo-600" />
                    <div><p className="text-sm font-medium text-gray-900">Phone</p><p className="text-xs text-gray-500">(800) 555-DELT</p></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
        default: return <AgentDashboard />;
      }
    }

    // Admin routes
    if (currentPage.startsWith('/templates/')) return <TemplateEditor />;
    if (currentPage.startsWith('/merchants/')) return <MerchantDetail />;
    if (currentPage.startsWith('/underwriting/')) return <UnderwritingDetail />;
    if (currentPage.startsWith('/deals/')) return <DealDetail />;
    if (currentPage.startsWith('/residuals/')) return <MerchantResidualDetail />;
    switch (currentPage) {
      case '/': return <BackendDashboard />;
      case '/leads': return <BackendLeads />;
      case '/onboarding': return <BackendOnboarding />;
      case '/merchants': return <BackendMerchants />;
      case '/retention': return <BackendRetention />;
      case '/underwriting': return <BackendUnderwriting />;
      case '/deals': return <BackendDeals />;
      case '/agents': return <BackendAgents />;
      case '/financials': return <BackendFinancials />;
      case '/lens-ai': return <BackendLensAI />;
      case '/settings': return <BackendSettings />;
      case '/settings/integrations': return <BackendSettings />;
      case '/settings/roles': return <BackendSettings />;
      case '/settings/bundles': return <BackendSettings />;
      case '/employees': return <BackendEmployees />;
      case '/payroll': return <BackendPayroll />;
      case '/analysis': return <BackendAnalysis />;
      case '/residuals': return <BackendResiduals />;
      case '/capital': return <BackendCapital />;
      case '/disputes': return <BackendDisputes />;
      case '/outreach': return <BackendOutreach />;
      case '/compliance': return <BackendCompliance />;
      case '/activity-timeline': return <BackendActivityTimeline />;
      case '/tasks': return <BackendTasks />;
      case '/inbox': return <BackendInbox />;
      case '/workspace': return <BackendWorkspace />;
      case '/websites': return <BackendWebsites />;
      case '/subscriptions': return <BackendSubscriptions />;
      case '/documents': return <BackendDocuments />;
      case '/payments': return <BackendPayments />;
      case '/reports': return <BackendReports />;
      default: return <BackendDashboard />;
    }
  };

  const user = {
    name: profile?.name ?? 'User',
    initials: profile?.initials ?? 'U',
    email: profile?.email ?? '',
    role: ROLE_LABELS[profileRole] ?? profileRole,
  };

  return (
    <NavigationContext.Provider value={{ navigate: handleNavigate, currentPage }}>
      <div className="flex h-screen bg-canvas font-sans">

        {/* ═══ Left Sidebar ═══ */}
        <aside className="hidden lg:flex flex-col w-[220px] bg-white border-r border-gray-200 shrink-0">
          {/* Logo */}
          <div className="px-5 h-14 flex items-center shrink-0">
            <button
              onClick={() => handleNavigate('/')}
              className="flex items-center gap-2.5 group"
            >
              <div className="w-7 h-7 bg-brand rounded-[6px] flex items-center justify-center">
                <span className="text-white text-xs font-bold">D</span>
              </div>
              <span className="text-[15px] font-bold text-gray-900 group-hover:text-brand transition-colors">
                Delt
              </span>
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto px-3 pb-3">
            {/* Home / Dashboard */}
            <button
              onClick={() => handleNavigate('/')}
              className={`w-full flex items-center gap-2.5 px-3 py-[7px] rounded-[6px] text-[13px] transition-colors mb-0.5 ${
                currentPage === '/'
                  ? 'text-brand bg-brand/[0.06] font-semibold'
                  : 'text-gray-700 hover:bg-gray-50 font-medium'
              }`}
            >
              <Home className="w-[16px] h-[16px]" />
              Home
            </button>

            {/* Workspace — direct button (mobile) */}
            {userRole === 'admin' && (
              <button
                onClick={() => handleNavigate('/workspace')}
                className={`w-full flex items-center gap-2.5 px-3 py-[7px] rounded-[6px] text-[13px] transition-colors mb-0.5 ${
                  currentPage === '/workspace'
                    ? 'text-brand bg-brand/[0.06] font-semibold'
                    : 'text-gray-700 hover:bg-gray-50 font-medium'
                }`}
              >
                <Inbox className="w-[16px] h-[16px]" />
                Workspace
              </button>
            )}

            {userRole === 'agent' ? (
              /* Agent flat nav */
              agentItems.filter(i => i.path !== '/').map(item => {
                const Icon = item.icon;
                const active = isActivePath(item.path);
                return (
                  <button
                    key={item.path}
                    onClick={() => handleNavigate(item.path)}
                    className={`w-full flex items-center gap-2.5 px-3 py-[7px] rounded-[6px] text-[13px] transition-colors mb-0.5 ${
                      active
                        ? 'text-brand bg-brand/[0.06] font-semibold'
                        : 'text-gray-700 hover:bg-gray-50 font-medium'
                    }`}
                  >
                    <Icon className="w-[16px] h-[16px]" />
                    {item.label}
                  </button>
                );
              })
            ) : (
              /* Admin expandable sections */
              adminSections.map(section => {
                const Icon = section.icon;
                const isExpanded = expandedSections.has(section.id);
                const hasActiveChild = section.children.some(c => isActivePath(c.path));

                return (
                  <div key={section.id} className="mt-0.5">
                    <button
                      onClick={() => toggleSection(section.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-[7px] rounded-[6px] text-[13px] transition-colors ${
                        hasActiveChild && !isExpanded
                          ? 'text-brand bg-brand/[0.06] font-semibold'
                          : hasActiveChild
                            ? 'text-brand font-semibold'
                            : 'text-gray-700 hover:bg-gray-50 font-medium'
                      }`}
                    >
                      <Icon className="w-[16px] h-[16px]" />
                      <span className="flex-1 text-left">{section.label}</span>
                      <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
                    </button>

                    {/* Sub-items */}
                    {isExpanded && (
                      <div className="ml-[18px] pl-[14px] border-l border-gray-100 mt-0.5 mb-1">
                        {section.children.map(child => {
                          const active = isActivePath(child.path);
                          return (
                            <button
                              key={child.path}
                              onClick={() => handleNavigate(child.path)}
                              className={`w-full text-left px-2.5 py-[6px] rounded-[6px] text-[13px] transition-colors block ${
                                active
                                  ? 'text-brand bg-brand/[0.06] font-semibold'
                                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50 font-normal'
                              }`}
                            >
                              {child.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </nav>

          {/* Sidebar bottom */}
          <div className="border-t border-gray-100 px-3 py-3 space-y-0.5">
            <button
              onClick={() => setHelpCenterOpen(true)}
              className="w-full flex items-center gap-2.5 px-3 py-[7px] rounded-[6px] text-[13px] text-gray-500 hover:text-gray-900 hover:bg-gray-50 font-medium transition-colors"
            >
              <HelpCircle className="w-[16px] h-[16px]" />
              Help & Support
            </button>
          </div>

          {/* User card at bottom */}
          <div className="border-t border-gray-100 px-3 py-3">
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="w-full flex items-center gap-2.5 px-2 py-2 rounded-[6px] hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center shrink-0">
                  <span className="text-brand text-xs font-semibold">{user.initials}</span>
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-[13px] font-semibold text-gray-900 truncate leading-tight">{user.name}</p>
                  <p className="text-[11px] text-gray-400 truncate leading-tight mt-0.5">{user.role}</p>
                </div>
              </button>

              {isUserMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)} />
                  <div className="absolute left-0 bottom-full mb-2 w-52 bg-white rounded-[8px] shadow-lg border border-gray-200 py-1 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-[13px] font-semibold text-gray-900">{user.name}</p>
                      <p className="text-[11px] text-gray-500">{user.email}</p>
                    </div>
                    <button className="w-full px-4 py-2 text-left text-[13px] text-gray-700 hover:bg-gray-50">Profile Settings</button>
                    {canSwitchView && (
                      <button
                        onClick={toggleRole}
                        className="w-full px-4 py-2 text-left text-[13px] text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <ArrowLeftRight className="w-3.5 h-3.5" />
                        Switch to {userRole === 'admin' ? 'Agent' : 'Admin'} View
                      </button>
                    )}
                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button
                        onClick={() => void signOut()}
                        className="w-full px-4 py-2 text-left text-[13px] text-red-600 hover:bg-red-50"
                      >
                        Log Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </aside>

        {/* ══ Right side: top bar + content ═══ */}
        <div className="flex flex-col flex-1 overflow-hidden">

          {/* ── Slim Top Bar ── */}
          <header className="bg-white border-b border-gray-200 shrink-0 z-30">
            <div className="flex items-center h-14 px-4 lg:px-6">
              {/* Mobile hamburger */}
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-[6px] mr-3"
              >
                <Menu className="w-5 h-5 text-gray-700" />
              </button>

              {/* Mobile logo */}
              <button
                onClick={() => handleNavigate('/')}
                className="lg:hidden flex items-center gap-2 mr-auto"
              >
                <div className="w-7 h-7 bg-brand rounded-[6px] flex items-center justify-center">
                  <span className="text-white text-xs font-bold">D</span>
                </div>
                <span className="text-[15px] font-bold text-gray-900">Delt</span>
              </button>

              {/* Search */}
              <div className="hidden md:block relative w-72 lg:ml-0 ml-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  onClick={() => setCmdPaletteOpen(true)}
                  readOnly
                  className="w-full pl-9 pr-16 py-[7px] bg-gray-50 border border-gray-200 rounded-[8px] text-[13px] focus:outline-none cursor-pointer hover:border-gray-300 transition-colors"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[11px] text-gray-400 pointer-events-none">
                  <kbd className="bg-gray-100 border border-gray-200 rounded px-1 py-px">&#8984;</kbd>
                  <kbd className="bg-gray-100 border border-gray-200 rounded px-1 py-px">K</kbd>
                </div>
              </div>

              {/* Right actions */}
              <div className="flex items-center gap-1 ml-auto">
                {/* Sync status */}
                <div className="mr-1">
                  <SyncIndicator />
                </div>

                {/* Role Toggle (admins/managers only) */}
                {canSwitchView && (
                  <button
                    onClick={toggleRole}
                    className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded-[6px] border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
                    title="Switch view"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                    {userRole === 'admin' ? 'Agent' : 'Admin'}
                  </button>
                )}

                {/* Notifications */}
                <button className="relative p-2 hover:bg-gray-100 rounded-[8px] transition-colors">
                  <Bell className="w-[18px] h-[18px] text-gray-500" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                </button>

                {/* Mobile search */}
                <button
                  onClick={() => setCmdPaletteOpen(true)}
                  className="md:hidden p-2 hover:bg-gray-100 rounded-[8px] transition-colors"
                >
                  <Search className="w-[18px] h-[18px] text-gray-500" />
                </button>
              </div>
            </div>
          </header>

          {/* ── Breadcrumbs ── */}
          {isDeepPage(currentPage) && (
            <div className="bg-white border-b border-gray-200 px-6 py-2.5 shrink-0">
              <nav className="flex items-center gap-1.5 text-[13px]">
                {getBreadcrumbs(currentPage).map((crumb, i, arr) => (
                  <React.Fragment key={crumb.path}>
                    {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
                    {i < arr.length - 1 ? (
                      <button
                        onClick={() => handleNavigate(crumb.path)}
                        className="text-gray-500 hover:text-brand transition-colors"
                      >
                        {i === 0 ? <Home className="w-4 h-4" /> : crumb.label}
                      </button>
                    ) : (
                      <span className="text-gray-900 font-medium">{crumb.label}</span>
                    )}
                  </React.Fragment>
                ))}
              </nav>
            </div>
          )}

          {/* ── Content ── */}
          <main className="flex-1 overflow-y-auto">
            {renderPage()}
          </main>
        </div>

        {/* ═══ Mobile Sidebar Overlay ═══ */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="fixed inset-0 bg-black/40" onClick={() => setIsMobileMenuOpen(false)} />
            <aside className="fixed left-0 top-0 bottom-0 w-[260px] bg-white flex flex-col shadow-xl">
              <div className="flex items-center justify-between px-5 h-14 border-b border-gray-100 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 bg-brand rounded-[6px] flex items-center justify-center">
                    <span className="text-white text-xs font-bold">D</span>
                  </div>
                  <span className="text-[15px] font-bold text-gray-900">Delt</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 hover:bg-gray-100 rounded-[6px]">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto px-3 pt-3 pb-3">
                {/* Home */}
                <button
                  onClick={() => handleNavigate('/')}
                  className={`w-full flex items-center gap-2.5 px-3 py-[7px] rounded-[6px] text-[13px] transition-colors mb-0.5 ${
                    currentPage === '/'
                      ? 'text-brand bg-brand/[0.06] font-semibold'
                      : 'text-gray-700 hover:bg-gray-50 font-medium'
                  }`}
                >
                  <Home className="w-[16px] h-[16px]" />
                  Home
                </button>

                {/* Workspace — direct button (mobile) */}
                {userRole === 'admin' && (
                  <button
                    onClick={() => handleNavigate('/workspace')}
                    className={`w-full flex items-center gap-2.5 px-3 py-[7px] rounded-[6px] text-[13px] transition-colors mb-0.5 ${
                      currentPage === '/workspace'
                        ? 'text-brand bg-brand/[0.06] font-semibold'
                        : 'text-gray-700 hover:bg-gray-50 font-medium'
                    }`}
                  >
                    <Inbox className="w-[16px] h-[16px]" />
                    Workspace
                  </button>
                )}

                {userRole === 'agent' ? (
                  agentItems.filter(i => i.path !== '/').map(item => {
                    const Icon = item.icon;
                    const active = isActivePath(item.path);
                    return (
                      <button
                        key={item.path}
                        onClick={() => handleNavigate(item.path)}
                        className={`w-full flex items-center gap-2.5 px-3 py-[7px] rounded-[6px] text-[13px] transition-colors mb-0.5 ${
                          active
                            ? 'text-brand bg-brand/[0.06] font-semibold'
                            : 'text-gray-700 hover:bg-gray-50 font-medium'
                        }`}
                      >
                        <Icon className="w-[16px] h-[16px]" />
                        {item.label}
                      </button>
                    );
                  })
                ) : (
                  adminSections.map(section => {
                    const Icon = section.icon;
                    const isExpanded = expandedSections.has(section.id);
                    const hasActiveChild = section.children.some(c => isActivePath(c.path));
                    return (
                      <div key={section.id} className="mt-0.5">
                        <button
                          onClick={() => toggleSection(section.id)}
                          className={`w-full flex items-center gap-2.5 px-3 py-[7px] rounded-[6px] text-[13px] transition-colors ${
                            hasActiveChild && !isExpanded
                              ? 'text-brand bg-brand/[0.06] font-semibold'
                              : hasActiveChild
                                ? 'text-brand font-semibold'
                                : 'text-gray-700 hover:bg-gray-50 font-medium'
                          }`}
                        >
                          <Icon className="w-[16px] h-[16px]" />
                          <span className="flex-1 text-left">{section.label}</span>
                          <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
                        </button>
                        {isExpanded && (
                          <div className="ml-[18px] pl-[14px] border-l border-gray-100 mt-0.5 mb-1">
                            {section.children.map(child => {
                              const active = isActivePath(child.path);
                              return (
                                <button
                                  key={child.path}
                                  onClick={() => handleNavigate(child.path)}
                                  className={`w-full text-left px-2.5 py-[6px] rounded-[6px] text-[13px] transition-colors block ${
                                    active
                                      ? 'text-brand bg-brand/[0.06] font-semibold'
                                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50 font-normal'
                                  }`}
                                >
                                  {child.label}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </nav>

              {/* Mobile sidebar bottom */}
              <div className="border-t border-gray-100 px-3 py-3">
                <div className="flex items-center gap-2.5 px-2 py-2">
                  <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center shrink-0">
                    <span className="text-brand text-xs font-semibold">{user.initials}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-gray-900 truncate">{user.name}</p>
                    <p className="text-[11px] text-gray-400 truncate">{user.role}</p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}

        {/* ═══ Command Palette ═══ */}
        {cmdPaletteOpen && (
          <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh]">
            <div className="absolute inset-0 bg-black/40" onClick={() => setCmdPaletteOpen(false)} />
            <div className="relative w-full max-w-lg bg-white rounded-[12px] shadow-2xl border border-gray-200 overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
                <Search className="w-5 h-5 text-gray-400 shrink-0" />
                <input
                  autoFocus
                  type="text"
                  value={cmdQuery}
                  onChange={e => setCmdQuery(e.target.value)}
                  placeholder="Type a command or search..."
                  className="flex-1 text-[13px] text-gray-900 placeholder-gray-400 outline-none bg-transparent"
                />
                <kbd className="text-[10px] text-gray-400 bg-gray-100 border border-gray-200 rounded px-1.5 py-0.5">ESC</kbd>
              </div>
              <div className="max-h-[50vh] overflow-y-auto py-2">
                {filteredCommands.length === 0 ? (
                  <div className="px-4 py-8 text-center text-[13px] text-gray-400">No results found</div>
                ) : (
                  Array.from(cmdGroups.entries()).map(([group, items]) => (
                    <div key={group}>
                      <p className="px-4 pt-3 pb-1 text-[10px] text-gray-400 uppercase tracking-wider font-semibold">{group}</p>
                      {items.map(item => {
                        const CmdIcon = item.icon;
                        return (
                          <button
                            key={item.path}
                            onClick={() => { handleNavigate(item.path); setCmdPaletteOpen(false); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-gray-700 hover:bg-brand/5 hover:text-brand transition-colors"
                          >
                            <CmdIcon className="w-4 h-4 text-gray-400" />
                            <span className="flex-1 text-left">{item.label}</span>
                            <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                          </button>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>
              <div className="border-t border-gray-200 px-4 py-2 flex items-center gap-4 text-[10px] text-gray-400">
                <span className="flex items-center gap-1"><kbd className="bg-gray-100 border border-gray-200 rounded px-1">&#8593;&#8595;</kbd> Navigate</span>
                <span className="flex items-center gap-1"><kbd className="bg-gray-100 border border-gray-200 rounded px-1">&#8629;</kbd> Open</span>
                <span className="flex items-center gap-1"><kbd className="bg-gray-100 border border-gray-200 rounded px-1">esc</kbd> Close</span>
              </div>
            </div>
          </div>
        )}

        {/* ═══ Help Center Modal ═══ */}
        {helpCenterOpen && (
          <HelpCenter onClose={() => setHelpCenterOpen(false)} />
        )}
      </div>
    </NavigationContext.Provider>
  );
}

// ── Placeholder page for new sections ──
function PlaceholderPage({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="px-6 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
      </div>
      <div className="bg-white rounded-[8px] border border-gray-200 p-12 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
          <Settings className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Coming Soon</h3>
        <p className="text-sm text-gray-500 max-w-sm">
          This section is under development. You'll be able to manage {title.toLowerCase()} here.
        </p>
      </div>
    </div>
  );
}