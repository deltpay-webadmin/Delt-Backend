import React, { useState } from 'react';
import { toast } from 'sonner@2.0.3';
import {
  Settings, ChevronDown, Link2, Shield, Users, ClipboardList,
  Plus, Check, X, Eye, EyeOff, Lock, Unlock, UserCircle,
} from 'lucide-react';
import { useAppNavigate } from '../NavigationContext';

// ─── ROLE DEFINITIONS ───────────────────────────────────────────
const ROLES = [
  { id: 'super_admin', name: 'Super Admin', description: 'Full platform access. Company settings, financials, RBAC, all modules.', color: '#4318FF', userCount: 2, isSystem: true },
  { id: 'admin', name: 'Admin', description: 'Operational access across all modules. Cannot modify roles, billing, or company settings.', color: '#059669', userCount: 1, isSystem: true },
  { id: 'agent', name: 'Agent', description: 'Portfolio-scoped access. Sees only assigned merchants, leads, and own compensation.', color: '#f59e0b', userCount: 4, isSystem: true },
  { id: 'viewer', name: 'Viewer', description: 'Read-only access to assigned modules. Cannot create, edit, or delete records.', color: '#6b7280', userCount: 1, isSystem: false },
];

const PERMISSION_MODULES = [
  { section: 'Pipeline', modules: [
    { key: 'leads', name: 'Leads', actions: ['view', 'create', 'edit', 'delete', 'assign', 'export'] },
    { key: 'underwriting', name: 'Underwriting', actions: ['view', 'review', 'approve', 'decline', 'assign'] },
    { key: 'cost_calculator', name: 'Cost Calculator', actions: ['view', 'use'] },
    { key: 'analysis', name: 'Statement Analysis', actions: ['view', 'create', 'edit', 'export'] },
  ]},
  { section: 'Merchants', modules: [
    { key: 'merchants', name: 'All Merchants', actions: ['view', 'create', 'edit', 'delete', 'export'] },
    { key: 'residuals', name: 'Residuals', actions: ['view', 'upload', 'edit', 'verify_ic', 'export'] },
    { key: 'capital', name: 'Capital', actions: ['view', 'create', 'approve', 'fund', 'modify_terms', 'write_off'] },
    { key: 'health', name: 'Health & Retention', actions: ['view', 'create_action', 'resolve'] },
  ]},
  { section: 'Team', modules: [
    { key: 'agents', name: 'Agents', actions: ['view', 'create', 'edit', 'deactivate', 'view_all'] },
    { key: 'compensation', name: 'Compensation', actions: ['view', 'edit', 'view_all'] },
    { key: 'employees', name: 'Employees', actions: ['view', 'create', 'edit', 'deactivate'] },
    { key: 'payroll', name: 'Payroll', actions: ['view', 'run', 'approve', 'export'] },
  ]},
  { section: 'Intelligence', modules: [
    { key: 'lens_ai', name: 'Lens AI', actions: ['view', 'configure', 'export'] },
    { key: 'financials', name: 'Financials', actions: ['view', 'export', 'edit_projections'] },
  ]},
  { section: 'Settings', modules: [
    { key: 'general', name: 'General Settings', actions: ['view', 'edit'] },
    { key: 'integrations', name: 'Integration Health', actions: ['view', 'configure', 'disconnect'] },
    { key: 'roles', name: 'Roles & Permissions', actions: ['view', 'edit'] },
    { key: 'bundles', name: 'Bundles', actions: ['view', 'create', 'edit', 'delete'] },
    { key: 'billing', name: 'Platform Billing', actions: ['view', 'manage'] },
  ]},
];

const DEFAULT_PERMS: Record<string, any> = {
  super_admin: 'all',
  admin: { denied: ['roles.edit', 'billing.manage', 'general.edit', 'capital.write_off'] },
  agent: { allowed: ['leads.view', 'leads.create', 'leads.edit', 'underwriting.view', 'cost_calculator.view', 'cost_calculator.use', 'analysis.view', 'analysis.create', 'analysis.export', 'merchants.view', 'residuals.view', 'capital.view', 'health.view', 'agents.view', 'compensation.view', 'lens_ai.view'] },
  viewer: { allowed: ['leads.view', 'merchants.view', 'residuals.view', 'capital.view', 'health.view', 'financials.view', 'lens_ai.view'] },
};

// ─── USERS ──────────────────────────────────────────────────────
const USERS = [
  { id: 1, name: 'David Hazday', email: 'david@deltpay.com', role: 'super_admin', avatar: 'DH', status: 'active', lastActive: 'Just now', territories: ['Miami-Dade', 'Broward'], portfolioCount: 8, split: undefined as number | undefined, portfolioCap: undefined as number | undefined, monthlyVolume: undefined as number | undefined },
  { id: 2, name: 'Anshu', email: 'anshu@deltpay.com', role: 'super_admin', avatar: 'AN', status: 'active', lastActive: '2 hours ago', territories: [] as string[], portfolioCount: 0, split: undefined as number | undefined, portfolioCap: undefined as number | undefined, monthlyVolume: undefined as number | undefined },
  { id: 3, name: 'Patrick', email: 'patrick@deltpay.com', role: 'admin', avatar: 'PK', status: 'active', lastActive: '1 hour ago', territories: [] as string[], portfolioCount: 0, split: undefined as number | undefined, portfolioCap: undefined as number | undefined, monthlyVolume: undefined as number | undefined },
  { id: 4, name: 'Sarah Johnson', email: 'sarah@deltpay.com', role: 'agent', avatar: 'SJ', status: 'active', lastActive: '3 hours ago', split: 50, territories: ['Miami-Dade'], portfolioCount: 3, portfolioCap: 25, monthlyVolume: 131900 },
  { id: 5, name: 'Michael Chen', email: 'michael@deltpay.com', role: 'agent', avatar: 'MC', status: 'active', lastActive: '1 day ago', split: 50, territories: ['Broward', 'Palm Beach'], portfolioCount: 3, portfolioCap: 25, monthlyVolume: 187200 },
  { id: 6, name: 'James Miller', email: 'james@deltpay.com', role: 'agent', avatar: 'JM', status: 'active', lastActive: '5 hours ago', split: 50, territories: ['Miami-Dade'], portfolioCount: 2, portfolioCap: 25, monthlyVolume: 165700 },
  { id: 7, name: 'Lyndon', email: 'lyndon@deltpay.com', role: 'agent', avatar: 'LY', status: 'active', lastActive: '1 week ago', split: 40, territories: ['Outbound'], portfolioCount: 0, portfolioCap: 15, monthlyVolume: 0 },
  { id: 8, name: 'Jason', email: 'jason@deltpay.com', role: 'viewer', avatar: 'JS', status: 'active', lastActive: '3 days ago', territories: [] as string[], portfolioCount: 0, split: undefined as number | undefined, portfolioCap: undefined as number | undefined, monthlyVolume: undefined as number | undefined },
];

// ─── INTEGRATIONS ───────────────────────────────────────────────
const INTEGRATIONS = [
  { id: 'north', name: 'North (NAB)', category: 'Processor', status: 'connected', lastSync: 'Apr 14, 2026', health: 98, description: 'ISO payment processing, residual reports' },
  { id: 'ach', name: 'ACH.com', category: 'Payments', status: 'connected', lastSync: 'Apr 14, 2026', health: 100, description: 'Recurring ACH debits for MCA collections' },
  { id: 'plaid', name: 'Plaid', category: 'Underwriting', status: 'connected', lastSync: 'Apr 15, 2026', health: 95, description: 'Bank verification, transaction data, identity' },
  { id: 'sentilink', name: 'SentiLink', category: 'Underwriting', status: 'connected', lastSync: 'Apr 12, 2026', health: 100, description: 'Synthetic identity fraud detection' },
  { id: 'crs', name: 'CRS Credit', category: 'Underwriting', status: 'connected', lastSync: 'Apr 10, 2026', health: 92, description: 'Commercial credit reporting' },
  { id: 'ficoso', name: 'FiCoSo', category: 'Legal', status: 'connected', lastSync: 'Apr 14, 2026', health: 100, description: 'UCC filing and lien management' },
  { id: 'datamerch', name: 'DataMerch', category: 'Risk', status: 'connected', lastSync: 'Apr 14, 2026', health: 100, description: 'MCA industry default database' },
  { id: '10web', name: '10Web', category: 'Websites', status: 'connected', lastSync: 'Apr 13, 2026', health: 88, description: 'AI website builder — white-label merchant sites' },
  { id: 'qbo', name: 'QuickBooks Online', category: 'Accounting', status: 'connected', lastSync: 'Apr 15, 2026', health: 97, description: 'Chart of accounts, MCA journal entries' },
  { id: 'ollama', name: 'Ollama / Qwen', category: 'AI', status: 'connected', lastSync: 'Apr 15, 2026', health: 100, description: 'Local LLM for Lens AI intelligence layer' },
  { id: 'stripe', name: 'Stripe', category: 'Billing', status: 'disconnected', lastSync: '—', health: 0, description: 'Platform billing and subscription management' },
];

// ─── GENERAL SETTINGS ───────────────────────────────────────────
interface SettingsField {
  label: string; value: any; type: string; readonly?: boolean;
  description?: string; options?: string[];
}
interface SettingsSection {
  key: string; title: string; icon: string; fields: SettingsField[];
}

const GENERAL_SECTIONS: SettingsSection[] = [
  { key: 'company', title: 'Company Profile', icon: '🏢', fields: [
    { label: 'Company Name', value: 'Delt Pay LLC', type: 'text' },
    { label: 'Legal Entity', value: 'Delt Pay LLC', type: 'text' },
    { label: 'Registered Address', value: '1603 Capitol Ave Ste 415 #644712, Cheyenne, WY', type: 'text' },
    { label: 'Primary Phone', value: '(305) 799-1018', type: 'text' },
    { label: 'Primary Email', value: 'David@deltpay.com', type: 'text' },
    { label: 'Website', value: 'deltpay.com', type: 'text' },
    { label: 'Entity Type', value: 'LLC — S-Corp Election', type: 'text', readonly: true },
  ]},
  { key: 'branding', title: 'Brand & Appearance', icon: '🎨', fields: [
    { label: 'Primary Color', value: '#4318FF', type: 'color' },
    { label: 'Secondary Color', value: '#041e42', type: 'color' },
    { label: 'Heading Font', value: 'DM Sans', type: 'select', options: ['DM Sans', 'Inter', 'Outfit', 'Plus Jakarta Sans'] },
    { label: 'Mono Font', value: 'JetBrains Mono', type: 'select', options: ['JetBrains Mono', 'Fira Code', 'Source Code Pro'] },
    { label: 'White-Label Agent Portal', value: true, type: 'toggle' },
  ]},
  { key: 'notifications', title: 'Notifications', icon: '🔔', fields: [
    { label: 'New Lead Alert', value: true, type: 'toggle' },
    { label: 'Underwriting Status Change', value: true, type: 'toggle' },
    { label: 'Chargeback Filed (CRITICAL)', value: true, type: 'toggle', description: 'Notifies both agent AND super admin immediately' },
    { label: 'Interchange Verification Flag', value: true, type: 'toggle', description: 'Auto-verifies against published April/October schedule' },
    { label: 'Merchant Churn Risk', value: true, type: 'toggle' },
    { label: 'MCA Default Alert', value: true, type: 'toggle' },
    { label: 'NSF / Slow Pay Alert', value: true, type: 'toggle' },
    { label: 'Notification Channel', value: 'Email + SMS + In-App', type: 'select', options: ['Email Only', 'In-App Only', 'Email + In-App', 'Email + SMS + In-App'] },
  ]},
  { key: 'processing', title: 'Processing Defaults', icon: '💳', fields: [
    { label: 'Default Program', value: 'Cash Discount', type: 'select', options: ['Cash Discount', 'Flat Rate', 'Interchange Plus'] },
    { label: 'Default Service Fee (CD)', value: '3.99%', type: 'text' },
    { label: 'Interchange Schedule', value: 'April 2026', type: 'text', readonly: true },
    { label: 'Next Rate Update', value: 'October 2026', type: 'text', readonly: true },
    { label: 'Auto-Verify Interchange', value: true, type: 'toggle' },
    { label: 'Margin Floor', value: '0.50%', type: 'text' },
    { label: 'Agent Pricing Override', value: false, type: 'toggle', description: 'If off, agents cannot modify matrix-locked rates' },
  ]},
  { key: 'capital', title: 'Capital Defaults', icon: '🏦', fields: [
    { label: 'Cost of Capital', value: '12%', type: 'text' },
    { label: 'Default Factor Range', value: '1.25x – 1.45x', type: 'text' },
    { label: 'Max Position Size', value: '$50,000', type: 'text' },
    { label: 'Auto-Stack Detection', value: true, type: 'toggle' },
    { label: 'NSF Retry Attempts', value: '3', type: 'select', options: ['1', '2', '3', '4', '5'] },
    { label: 'Default ACH Schedule', value: 'Daily (Mon-Fri)', type: 'select', options: ['Daily (Mon-Fri)', 'Weekly', 'Bi-Weekly'] },
  ]},
  { key: 'data', title: 'Data & Privacy', icon: '🔒', fields: [
    { label: 'Data Retention Period', value: '7 years', type: 'select', options: ['3 years', '5 years', '7 years', '10 years', 'Indefinite'] },
    { label: 'GLBA Compliance Mode', value: true, type: 'toggle' },
    { label: 'FCRA Disclosure Enabled', value: true, type: 'toggle' },
    { label: 'Two-Factor Authentication', value: 'Required for Admin+', type: 'select', options: ['Disabled', 'Optional', 'Required for Admin+', 'Required for All'] },
    { label: 'Audit Log Retention', value: 'Indefinite', type: 'select', options: ['1 year', '3 years', '7 years', 'Indefinite'] },
  ]},
];

// ─── AUDIT LOG ──────────────────────────────────────────────────
const AUDIT_LOG = [
  { time: 'Apr 15, 2:34 PM', user: 'David Hazday', action: 'Updated processing defaults — margin floor set to 0.50%', module: 'Settings' },
  { time: 'Apr 15, 1:12 PM', user: 'David Hazday', action: 'Verified interchange for Sunrise Cafe — flagged Visa Qual +14bps', module: 'Residuals' },
  { time: 'Apr 14, 4:45 PM', user: 'Patrick', action: 'Uploaded March 2026 residual report — 8 merchants processed', module: 'Residuals' },
  { time: 'Apr 14, 11:20 AM', user: 'Michael Chen', action: 'Created new lead: TechForward Solutions', module: 'Pipeline' },
  { time: 'Apr 13, 3:15 PM', user: 'David Hazday', action: 'Approved MCA UW-2026-0145: Urban Wellness Spa — $150K at 1.36x', module: 'Capital' },
  { time: 'Apr 12, 9:00 AM', user: 'Sarah Johnson', action: 'Moved Coastal Construction to Bank Verification stage', module: 'Pipeline' },
  { time: 'Apr 11, 2:30 PM', user: 'David Hazday', action: 'Changed James Miller commission split from 45% → 50%', module: 'Team' },
  { time: 'Apr 10, 10:45 AM', user: 'David Hazday', action: 'Connected CRS Credit integration — health check passed 92%', module: 'Settings' },
];

type SettingsTab = 'general' | 'integrations' | 'roles' | 'users' | 'audit';

// ─── COMPONENT ──────────────────────────────────────────────────
export function BackendSettings() {
  const { currentPage, navigate } = useAppNavigate();

  // Derive initial tab from current route
  const initialTab: SettingsTab = currentPage === '/settings/integrations' ? 'integrations'
    : currentPage === '/settings/roles' ? 'roles'
    : currentPage === '/settings/bundles' ? 'general'
    : 'general';

  const [tab, setTab] = useState<SettingsTab>(initialTab);
  const [expandedSection, setExpandedSection] = useState<string | null>('company');
  const [expandedRole, setExpandedRole] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);

  const tabs: { key: SettingsTab; label: string; icon: React.ElementType }[] = [
    { key: 'general', label: 'General', icon: Settings },
    { key: 'integrations', label: 'Integrations', icon: Link2 },
    { key: 'roles', label: 'Roles & Permissions', icon: Shield },
    { key: 'users', label: 'User Management', icon: Users },
    { key: 'audit', label: 'Audit Log', icon: ClipboardList },
  ];

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-[1280px] mx-auto px-6 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Platform configuration, access control, and integrations</p>
        </div>

        {/* Tab Bar */}
        <div className="border-b border-gray-200 mb-6">
          <div className="flex gap-0">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-[1px] flex items-center gap-1.5 ${
                  tab === t.key
                    ? 'text-brand border-brand'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                <t.icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ═══ GENERAL ═══ */}
        {tab === 'general' && (
          <div className="space-y-2">
            {GENERAL_SECTIONS.map(section => {
              const open = expandedSection === section.key;
              return (
                <div key={section.key} className={`border rounded-[8px] overflow-hidden transition-colors ${open ? 'border-brand' : 'border-gray-200'}`}>
                  <button
                    onClick={() => setExpandedSection(open ? null : section.key)}
                    className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-gray-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{section.icon}</span>
                      <span className="text-sm font-semibold text-gray-900">{section.title}</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
                  </button>
                  {open && (
                    <div className="px-5 pb-5 bg-white">
                      {section.fields.map((f, i) => (
                        <div key={i} className="flex items-center justify-between py-3.5 border-b border-gray-100 last:border-0">
                          <div className="flex-1">
                            <p className="text-sm text-gray-700 font-medium">{f.label}</p>
                            {f.description && <p className="text-[11px] text-gray-400 mt-0.5">{f.description}</p>}
                          </div>
                          <div className="w-[280px] flex justify-end">
                            {f.type === 'toggle' ? (
                              <Toggle value={f.value} />
                            ) : f.type === 'color' ? (
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-[6px] border border-gray-200" style={{ background: f.value }} />
                                <span className="text-sm font-mono text-gray-600">{f.value}</span>
                              </div>
                            ) : f.type === 'select' ? (
                              <select defaultValue={f.value} className="w-full px-3 py-2 border border-gray-200 rounded-[6px] text-sm text-gray-900 bg-white focus:outline-none focus:border-brand">
                                {f.options?.map(o => <option key={o}>{o}</option>)}
                              </select>
                            ) : (
                              <input
                                type="text"
                                defaultValue={f.value}
                                readOnly={f.readonly}
                                className={`w-full px-3 py-2 border border-gray-200 rounded-[6px] text-sm font-mono text-gray-900 focus:outline-none focus:border-brand ${f.readonly ? 'bg-gray-50 text-gray-500' : 'bg-white'}`}
                              />
                            )}
                          </div>
                        </div>
                      ))}
                      <div className="flex justify-end pt-4 mt-2 border-t border-gray-100">
                        <button onClick={() => toast.success(`${section.title} settings saved`)} className="px-5 py-2 bg-brand text-white rounded-[6px] text-sm font-semibold hover:bg-brand-hover transition-colors">Save Changes</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ═══ INTEGRATIONS ═══ */}
        {tab === 'integrations' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {INTEGRATIONS.map(int => (
              <div key={int.id} className={`border rounded-[8px] p-5 flex flex-col gap-2.5 ${int.status === 'disconnected' ? 'border-dashed border-gray-300 opacity-60' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{int.name}</p>
                    <p className="text-[11px] text-gray-400 font-medium">{int.category}</p>
                  </div>
                  <span className={`text-[11px] font-semibold ${int.status === 'connected' ? 'text-emerald-600' : 'text-red-500'}`}>
                    ● {int.status === 'connected' ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{int.description}</p>
                {int.status === 'connected' && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${int.health >= 95 ? 'bg-emerald-500' : int.health >= 80 ? 'bg-amber-500' : 'bg-red-500'}`}
                          style={{ width: `${int.health}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-mono font-semibold text-gray-600">{int.health}%</span>
                    </div>
                    <span className="text-[11px] text-gray-400 ml-3">Synced: {int.lastSync}</span>
                  </div>
                )}
                <div className="flex gap-2 mt-1">
                  {int.status === 'connected' ? (
                    <>
                      <button onClick={() => toast.info(`Configuring ${int.name} integration`)} className="px-3 py-1.5 text-[11px] font-medium text-brand bg-brand/5 border border-brand/15 rounded-[6px] hover:bg-brand/10 transition-colors">Configure</button>
                      <button onClick={() => toast.success(`${int.name} disconnected`)} className="px-3 py-1.5 text-[11px] font-medium text-red-500 bg-red-50/50 border border-red-200/40 rounded-[6px] hover:bg-red-50 transition-colors">Disconnect</button>
                    </>
                  ) : (
                    <button onClick={() => toast.success(`${int.name} connected`)} className="px-4 py-1.5 text-[11px] font-semibold text-white bg-brand rounded-[6px] hover:bg-brand-hover transition-colors">Connect</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ═══ ROLES & PERMISSIONS ═══ */}
        {tab === 'roles' && (
          <div>
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Roles</h2>
                <p className="text-sm text-gray-400 mt-0.5">System roles define baseline access. Permissions enforced across all modules.</p>
              </div>
              <button onClick={() => toast.success('New custom role created — configure its permissions below')} className="px-4 py-2 bg-brand text-white rounded-[6px] text-sm font-semibold hover:bg-brand-hover inline-flex items-center gap-1.5 transition-colors">
                <Plus className="w-4 h-4" /> Custom Role
              </button>
            </div>
            <div className="space-y-2.5">
              {ROLES.map(role => {
                const open = expandedRole === role.id;
                return (
                  <div key={role.id} className={`border rounded-[8px] overflow-hidden transition-colors ${open ? 'border-brand' : 'border-gray-200'}`}>
                    <button
                      onClick={() => setExpandedRole(open ? null : role.id)}
                      className="w-full flex items-center justify-between px-5 py-4 bg-white text-left"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-[8px] flex items-center justify-center text-sm font-bold font-mono" style={{ background: `${role.color}12`, color: role.color }}>
                          {role.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{role.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5 max-w-[500px]">{role.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-gray-500">{role.userCount} user{role.userCount !== 1 ? 's' : ''}</span>
                        {role.isSystem && <span className="text-[10px] font-semibold text-brand bg-brand/8 px-2 py-0.5 rounded">System</span>}
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
                      </div>
                    </button>
                    {open && (
                      <div className="px-5 pb-5 border-t border-gray-100 bg-white">
                        {PERMISSION_MODULES.map(section => (
                          <div key={section.section} className="mt-4">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 pb-1.5 border-b border-gray-100">{section.section}</p>
                            {section.modules.map(mod => {
                              const isFull = role.id === 'super_admin';
                              const denied = DEFAULT_PERMS[role.id]?.denied || [];
                              const allowed = DEFAULT_PERMS[role.id]?.allowed || [];
                              return (
                                <div key={mod.key} className="flex items-center justify-between py-1.5">
                                  <span className="text-sm text-gray-700 font-medium min-w-[160px]">{mod.name}</span>
                                  <div className="flex gap-1 flex-wrap">
                                    {mod.actions.map(action => {
                                      const pk = `${mod.key}.${action}`;
                                      let ok: boolean;
                                      if (isFull) ok = true;
                                      else if (denied.length) ok = !denied.includes(pk);
                                      else ok = allowed.includes(pk);
                                      return (
                                        <span
                                          key={action}
                                          className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wide ${
                                            ok ? 'text-emerald-600 bg-emerald-500/8' : 'text-gray-300 bg-gray-50 line-through'
                                          }`}
                                        >
                                          {action}
                                        </span>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ USER MANAGEMENT ═══ */}
        {tab === 'users' && (
          <div>
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Users & Access</h2>
                <p className="text-sm text-gray-400 mt-0.5">{USERS.length} users across {ROLES.length} roles</p>
              </div>
              <button onClick={() => toast.success('Invitation sent — the user will receive an email to join')} className="px-4 py-2 bg-brand text-white rounded-[6px] text-sm font-semibold hover:bg-brand-hover inline-flex items-center gap-1.5 transition-colors">
                <Plus className="w-4 h-4" /> Invite User
              </button>
            </div>
            <div className="border border-gray-200 rounded-[8px] overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {['User', 'Role', 'Status', 'Territories', 'Portfolio', 'Last Active', ''].map(h => (
                      <th key={h} className="px-4 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {USERS.map(user => {
                    const role = ROLES.find(r => r.id === user.role)!;
                    const sel = selectedUser === user.id;
                    return (
                      <React.Fragment key={user.id}>
                        <tr
                          onClick={() => setSelectedUser(sel ? null : user.id)}
                          className={`border-b border-gray-50 cursor-pointer transition-colors ${sel ? 'bg-gray-50' : 'hover:bg-gray-50/50'}`}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-[8px] flex items-center justify-center text-xs font-bold font-mono" style={{ background: `${role.color}12`, color: role.color }}>
                                {user.avatar}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                                <p className="text-[11px] text-gray-400">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-[6px] border" style={{ background: `${role.color}10`, color: role.color, borderColor: `${role.color}25` }}>
                              {role.name}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <span className={`w-[7px] h-[7px] rounded-full ${user.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                              <span className="text-sm text-gray-600">{user.status}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs font-mono text-gray-600">{user.territories?.join(', ') || '—'}</td>
                          <td className="px-4 py-3 text-sm font-mono text-gray-600">{user.portfolioCount || '—'}</td>
                          <td className="px-4 py-3 text-xs text-gray-500">{user.lastActive}</td>
                          <td className="px-4 py-3 text-xs text-gray-400">{sel ? '▴' : '▾'}</td>
                        </tr>
                        {sel && (
                          <tr>
                            <td colSpan={7} className="px-0 py-0 bg-gray-50">
                              <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                  <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3 pb-2 border-b border-gray-200">Access & Role</h4>
                                  <DRow l="Role" v={role.name} />
                                  <DRow l="Two-Factor" v="Enabled" c="text-emerald-600" />
                                  <DRow l="API Access" v={user.role === 'super_admin' ? 'Full' : 'None'} />
                                </div>
                                {user.role === 'agent' && (
                                  <div>
                                    <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3 pb-2 border-b border-gray-200">Agent Configuration</h4>
                                    <DRow l="Commission Split" v={`${user.split}%`} c="text-brand" bold />
                                    <DRow l="Portfolio Cap" v={`${user.portfolioCap} merchants`} />
                                    <DRow l="Monthly Volume" v={user.monthlyVolume ? `$${user.monthlyVolume.toLocaleString()}` : '—'} />
                                    <DRow l="Territories" v={user.territories.join(', ')} />
                                    <DRow l="Can Override Pricing" v="No" c="text-red-500" />
                                  </div>
                                )}
                                <div>
                                  <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3 pb-2 border-b border-gray-200">Actions</h4>
                                  <div className="flex flex-col gap-1.5">
                                    {['Edit Profile', 'Change Role', ...(user.role === 'agent' ? ['Edit Split', 'Reassign Portfolio'] : []), 'Reset Password'].map(a => (
                                      <button key={a} onClick={() => toast.info(`${a} — ${user.name}`)} className="text-left px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-[6px] hover:bg-gray-50 transition-colors">{a}</button>
                                    ))}
                                    <button onClick={() => toast.success(`${user.name} deactivated`)} className="text-left px-3 py-2 text-xs font-medium text-red-500 bg-white border border-red-200/40 rounded-[6px] hover:bg-red-50 transition-colors">Deactivate</button>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ═══ AUDIT LOG ═══ */}
        {tab === 'audit' && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Audit Log</h2>
            <p className="text-sm text-gray-400 mb-4">All administrative actions logged with user, timestamp, and IP.</p>
            <div className="border border-gray-200 rounded-[8px] overflow-hidden">
              {AUDIT_LOG.map((log, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-3.5 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                  <span className="text-xs font-mono text-gray-400 min-w-[140px] shrink-0">{log.time}</span>
                  <p className="flex-1 text-sm text-gray-700"><span className="font-semibold">{log.user}</span> {log.action}</p>
                  <span className="text-[11px] font-medium text-brand bg-brand/5 px-2.5 py-0.5 rounded shrink-0">{log.module}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SUB-COMPONENTS ─────────────────────────────────────────────
function Toggle({ value }: { value: boolean }) {
  const [on, setOn] = useState(value);
  return (
    <button
      onClick={() => setOn(!on)}
      className={`relative w-11 h-6 rounded-full transition-colors ${on ? 'bg-brand' : 'bg-gray-200'}`}
    >
      <div className={`absolute top-[3px] w-[18px] h-[18px] rounded-full bg-white shadow transition-all ${on ? 'left-[23px]' : 'left-[3px]'}`} />
    </button>
  );
}

function DRow({ l, v, c, bold }: { l: string; v: string; c?: string; bold?: boolean }) {
  return (
    <div className="flex justify-between py-1.5 text-sm">
      <span className="text-gray-500">{l}</span>
      <span className={`font-mono text-xs ${bold ? 'font-bold' : 'font-medium'} ${c || 'text-gray-900'}`}>{v}</span>
    </div>
  );
}
