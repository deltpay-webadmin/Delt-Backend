import React, { useState, useMemo } from 'react';
import { toast } from 'sonner@2.0.3';
import {
  Globe, Search, Plus, Eye, Edit3, ExternalLink, CheckCircle,
  Clock, AlertTriangle, X, BarChart3, TrendingUp, Users,
  Smartphone, Monitor, Palette, Layers, Zap, RefreshCw,
  ArrowUpRight, ArrowDownRight, ChevronRight, Copy, Link2,
  Settings, Trash2, MoreHorizontal, Store, ChevronDown,
} from 'lucide-react';

// ── Types ──
type SiteStatus = 'live' | 'building' | 'draft' | 'suspended';
type PlanTier = 'starter' | 'business' | 'premium';

interface Website {
  id: string;
  merchantId: string;
  merchant: string;
  domain: string;
  customDomain?: string;
  status: SiteStatus;
  plan: PlanTier;
  monthlyFee: number;
  template: string;
  createdDate: string;
  lastPublished?: string;
  pageViews30d: number;
  uniqueVisitors30d: number;
  conversionRate: number;
  mobileScore: number;
  seoScore: number;
  sslExpiry: string;
  agent: string;
  hasBooking: boolean;
  hasEcommerce: boolean;
  hasContactForm: boolean;
}

const STATUS_CONFIG: Record<SiteStatus, { color: string; bg: string; label: string }> = {
  live: { color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', label: 'Live' },
  building: { color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', label: 'Building' },
  draft: { color: 'text-gray-500', bg: 'bg-gray-50 border-gray-200', label: 'Draft' },
  suspended: { color: 'text-red-700', bg: 'bg-red-50 border-red-200', label: 'Suspended' },
};

const PLAN_CONFIG: Record<PlanTier, { color: string; bg: string; label: string; price: string }> = {
  starter: { color: 'text-gray-600', bg: 'bg-gray-50', label: 'Starter', price: '$29/mo' },
  business: { color: 'text-brand', bg: 'bg-indigo-50', label: 'Business', price: '$79/mo' },
  premium: { color: 'text-amber-700', bg: 'bg-amber-50', label: 'Premium', price: '$149/mo' },
};

const WEBSITES: Website[] = [
  { id: 'WS-001', merchantId: 'M-1002', merchant: 'TechStart Solutions', domain: 'techstartsolutions.deltsite.com', customDomain: 'www.techstartsolutions.com', status: 'live', plan: 'premium', monthlyFee: 149, template: 'SaaS Pro', createdDate: '2025-11-15', lastPublished: '2026-04-15', pageViews30d: 12840, uniqueVisitors30d: 4280, conversionRate: 3.2, mobileScore: 94, seoScore: 88, sslExpiry: '2027-03-15', agent: 'Michael Chen', hasBooking: true, hasEcommerce: false, hasContactForm: true },
  { id: 'WS-002', merchantId: 'M-1005', merchant: 'Bella Vista Restaurant', domain: 'bellavista.deltsite.com', customDomain: 'www.bellavistamiami.com', status: 'live', plan: 'business', monthlyFee: 79, template: 'Restaurant Elite', createdDate: '2026-01-10', lastPublished: '2026-04-12', pageViews30d: 8420, uniqueVisitors30d: 3150, conversionRate: 5.8, mobileScore: 91, seoScore: 76, sslExpiry: '2027-01-10', agent: 'Michael Chen', hasBooking: true, hasEcommerce: false, hasContactForm: true },
  { id: 'WS-003', merchantId: 'M-1003', merchant: 'Urban Fitness Center', domain: 'urbanfitness.deltsite.com', customDomain: 'www.urbanfitnesscenter.com', status: 'live', plan: 'business', monthlyFee: 79, template: 'Fitness Hub', createdDate: '2025-12-20', lastPublished: '2026-04-08', pageViews30d: 5630, uniqueVisitors30d: 2110, conversionRate: 4.1, mobileScore: 88, seoScore: 72, sslExpiry: '2026-12-20', agent: 'Sarah Johnson', hasBooking: true, hasEcommerce: true, hasContactForm: true },
  { id: 'WS-004', merchantId: 'M-1007', merchant: 'Brooklyn Vinyl Records', domain: 'brooklynvinyl.deltsite.com', status: 'building', plan: 'business', monthlyFee: 79, template: 'Retail Modern', createdDate: '2026-04-10', pageViews30d: 0, uniqueVisitors30d: 0, conversionRate: 0, mobileScore: 0, seoScore: 0, sslExpiry: '2027-04-10', agent: 'Sarah Kim', hasBooking: false, hasEcommerce: true, hasContactForm: true },
  { id: 'WS-005', merchantId: 'M-1008', merchant: 'Doral Fresh Market', domain: 'doralfresh.deltsite.com', status: 'draft', plan: 'starter', monthlyFee: 29, template: 'Local Business', createdDate: '2026-03-28', pageViews30d: 0, uniqueVisitors30d: 0, conversionRate: 0, mobileScore: 0, seoScore: 0, sslExpiry: '2027-03-28', agent: 'Marcus Johnson', hasBooking: false, hasEcommerce: false, hasContactForm: true },
  { id: 'WS-006', merchantId: 'M-1009', merchant: 'Harbor Marine Supply', domain: 'harbormarine.deltsite.com', customDomain: 'www.harbormarinesupply.com', status: 'live', plan: 'starter', monthlyFee: 29, template: 'Industrial Basic', createdDate: '2026-02-05', lastPublished: '2026-03-20', pageViews30d: 1240, uniqueVisitors30d: 680, conversionRate: 1.9, mobileScore: 78, seoScore: 65, sslExpiry: '2027-02-05', agent: 'James Miller', hasBooking: false, hasEcommerce: false, hasContactForm: true },
];

// ── Site Detail Panel ──
function SiteDetailPanel({ site, onClose }: { site: Website; onClose: () => void }) {
  const scfg = STATUS_CONFIG[site.status];
  const pcfg = PLAN_CONFIG[site.plan];
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex justify-end" onClick={onClose}>
      <div className="w-full max-w-xl bg-white shadow-xl flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div>
            <h3 className="text-sm font-bold text-gray-900">{site.merchant}</h3>
            <p className="text-[11px] text-gray-500 mt-0.5">{site.customDomain || site.domain}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X className="w-4 h-4 text-gray-400" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Status & Plan */}
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-semibold px-2 py-1 rounded border ${scfg.bg} ${scfg.color}`}>{scfg.label}</span>
            <span className={`text-[10px] font-semibold px-2 py-1 rounded ${pcfg.bg} ${pcfg.color}`}>{pcfg.label} — {pcfg.price}</span>
          </div>

          {/* URLs */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-[6px] border border-gray-200">
              <Globe className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="text-xs text-gray-600 flex-1 truncate">{site.domain}</span>
              <button onClick={() => { navigator.clipboard?.writeText(site.domain); toast.success('URL copied to clipboard'); }} className="p-1 hover:bg-gray-200 rounded"><Copy className="w-3 h-3 text-gray-400" /></button>
              <button onClick={() => { window.open(`https://${site.domain}`, '_blank'); toast.success('Opening site'); }} className="p-1 hover:bg-gray-200 rounded"><ExternalLink className="w-3 h-3 text-gray-400" /></button>
            </div>
            {site.customDomain && (
              <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-[6px] border border-emerald-200">
                <Link2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-xs text-emerald-700 flex-1 truncate">{site.customDomain}</span>
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
              </div>
            )}
          </div>

          {/* Analytics */}
          {site.status === 'live' && (
            <div>
              <h4 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Last 30 Days</h4>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Page Views', value: site.pageViews30d.toLocaleString(), icon: Eye },
                  { label: 'Unique Visitors', value: site.uniqueVisitors30d.toLocaleString(), icon: Users },
                  { label: 'Conversion Rate', value: `${site.conversionRate}%`, icon: TrendingUp },
                  { label: 'Mobile Score', value: `${site.mobileScore}/100`, icon: Smartphone },
                ].map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <div key={i} className="bg-white rounded-[6px] border border-gray-200 p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Icon className="w-3 h-3 text-gray-400" />
                        <span className="text-[10px] text-gray-500">{s.label}</span>
                      </div>
                      <p className="text-lg font-bold text-gray-900">{s.value}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SEO & SSL */}
          <div>
            <h4 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Health</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-white rounded-[6px] border border-gray-200">
                <span className="text-xs text-gray-600">SEO Score</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${site.seoScore >= 80 ? 'bg-emerald-500' : site.seoScore >= 60 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${site.seoScore}%` }} />
                  </div>
                  <span className="text-xs font-semibold text-gray-900">{site.seoScore}/100</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-white rounded-[6px] border border-gray-200">
                <span className="text-xs text-gray-600">SSL Certificate</span>
                <span className="text-xs font-medium text-emerald-600">Expires {site.sslExpiry}</span>
              </div>
            </div>
          </div>

          {/* Features */}
          <div>
            <h4 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Features</h4>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Online Booking', active: site.hasBooking },
                { label: 'E-Commerce', active: site.hasEcommerce },
                { label: 'Contact Form', active: site.hasContactForm },
              ].map((f, i) => (
                <span key={i} className={`text-[10px] font-medium px-2.5 py-1 rounded-full border ${f.active ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
                  {f.active ? <CheckCircle className="w-3 h-3 inline mr-1" /> : null}{f.label}
                </span>
              ))}
            </div>
          </div>

          {/* Meta */}
          <div className="text-[11px] text-gray-400 space-y-1">
            <p>Template: {site.template}</p>
            <p>Created: {site.createdDate}</p>
            {site.lastPublished && <p>Last published: {site.lastPublished}</p>}
            <p>Agent: {site.agent}</p>
          </div>
        </div>
        {/* Actions */}
        <div className="px-5 py-3 border-t border-gray-200 flex items-center gap-2">
          {site.status === 'live' && (
            <button onClick={() => toast.info(`Opening editor for ${site.merchant}…`)} className="flex items-center gap-1.5 px-4 py-2 bg-brand text-white text-xs font-medium rounded-[6px] hover:bg-brand-hover">
              <Edit3 className="w-3.5 h-3.5" /> Edit Site
            </button>
          )}
          {site.status === 'building' && (
            <button onClick={() => toast.info(`Resuming build for ${site.merchant}…`)} className="flex items-center gap-1.5 px-4 py-2 bg-brand text-white text-xs font-medium rounded-[6px] hover:bg-brand-hover">
              <Layers className="w-3.5 h-3.5" /> Continue Building
            </button>
          )}
          {site.status === 'draft' && (
            <button onClick={() => toast.info(`Starting build for ${site.merchant}…`)} className="flex items-center gap-1.5 px-4 py-2 bg-brand text-white text-xs font-medium rounded-[6px] hover:bg-brand-hover">
              <Zap className="w-3.5 h-3.5" /> Start Build
            </button>
          )}
          <button onClick={() => { window.open(`https://${site.domain}`, '_blank'); toast.success('Opening preview'); }} className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 text-gray-600 text-xs font-medium rounded-[6px] hover:bg-gray-50">
            <Eye className="w-3.5 h-3.5" /> Preview
          </button>
          <button onClick={() => toast.info('Opening domain settings…')} className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 text-gray-600 text-xs font-medium rounded-[6px] hover:bg-gray-50">
            <Settings className="w-3.5 h-3.5" /> Domain Settings
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main ──
export function BackendWebsites() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<SiteStatus | 'all'>('all');
  const [selectedSite, setSelectedSite] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return WEBSITES.filter(w => {
      if (statusFilter !== 'all' && w.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return w.merchant.toLowerCase().includes(q) || w.domain.toLowerCase().includes(q) || (w.customDomain || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [search, statusFilter]);

  const activeSite = WEBSITES.find(w => w.id === selectedSite);
  const liveSites = WEBSITES.filter(w => w.status === 'live').length;
  const totalMRR = WEBSITES.reduce((s, w) => s + w.monthlyFee, 0);
  const totalViews = WEBSITES.reduce((s, w) => s + w.pageViews30d, 0);
  const avgConversion = WEBSITES.filter(w => w.conversionRate > 0).reduce((s, w, _, a) => s + w.conversionRate / a.length, 0);

  return (
    <div className="px-6 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[8px] bg-gradient-to-br from-brand to-brand-light flex items-center justify-center shadow-sm">
            <Globe className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Websites</h1>
            <p className="text-sm text-gray-500">Manage merchant websites, domains, and analytics</p>
          </div>
        </div>
        <button onClick={() => toast.info('Opening new site builder…')} className="flex items-center gap-1.5 px-4 py-2 bg-brand text-white text-xs font-medium rounded-[6px] hover:bg-brand-hover">
          <Plus className="w-3.5 h-3.5" /> New Site
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Live Sites', value: liveSites, sub: `of ${WEBSITES.length} total`, color: 'border-t-emerald-500', icon: Globe },
          { label: 'Website MRR', value: `$${totalMRR.toLocaleString()}`, sub: `${WEBSITES.length} subscriptions`, color: 'border-t-brand', icon: BarChart3 },
          { label: 'Total Page Views', value: totalViews.toLocaleString(), sub: 'last 30 days', color: 'border-t-blue-500', icon: Eye },
          { label: 'Avg Conversion', value: `${avgConversion.toFixed(1)}%`, sub: 'across live sites', color: 'border-t-amber-500', icon: TrendingUp },
        ].map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className={`bg-white rounded-[8px] border border-gray-200 border-t-[3px] ${kpi.color} px-4 py-3`}>
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold">{kpi.label}</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{kpi.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-[8px] border border-gray-200 p-4 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search sites..."
            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-[6px] text-xs focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
        </div>
        <div className="flex items-center gap-1">
          {(['all', 'live', 'building', 'draft', 'suspended'] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1.5 rounded-[6px] text-[10px] font-semibold border whitespace-nowrap transition-colors ${
                statusFilter === s ? (s === 'all' ? 'bg-brand/5 text-brand border-brand/20' : `${STATUS_CONFIG[s].bg} ${STATUS_CONFIG[s].color}`) : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
              }`}>{s === 'all' ? 'All' : STATUS_CONFIG[s].label}</button>
          ))}
        </div>
      </div>

      {/* Site Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(site => {
          const scfg = STATUS_CONFIG[site.status];
          const pcfg = PLAN_CONFIG[site.plan];
          return (
            <div key={site.id} onClick={() => setSelectedSite(site.id)}
              className="bg-white rounded-[8px] border border-gray-200 overflow-hidden hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group">
              {/* Preview bar */}
              <div className={`h-32 relative flex items-center justify-center ${site.status === 'live' ? 'bg-gradient-to-br from-gray-100 to-gray-50' : 'bg-gray-50'}`}>
                {site.status === 'live' ? (
                  <div className="text-center">
                    <Monitor className="w-8 h-8 text-gray-300 mx-auto mb-1" />
                    <span className="text-[10px] text-gray-400">{site.customDomain || site.domain}</span>
                  </div>
                ) : site.status === 'building' ? (
                  <div className="text-center">
                    <Layers className="w-8 h-8 text-blue-300 mx-auto mb-1 animate-pulse" />
                    <span className="text-[10px] text-blue-400">In progress...</span>
                  </div>
                ) : (
                  <div className="text-center">
                    <Globe className="w-8 h-8 text-gray-200 mx-auto mb-1" />
                    <span className="text-[10px] text-gray-300">Not started</span>
                  </div>
                )}
                {/* Status badge */}
                <span className={`absolute top-3 right-3 text-[9px] font-semibold px-2 py-0.5 rounded-full border ${scfg.bg} ${scfg.color}`}>{scfg.label}</span>
              </div>
              {/* Info */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-xs font-bold text-gray-900 truncate">{site.merchant}</h3>
                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${pcfg.bg} ${pcfg.color}`}>{pcfg.label}</span>
                </div>
                <p className="text-[10px] text-gray-400 truncate mb-3">{site.customDomain || site.domain}</p>
                {site.status === 'live' ? (
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <p className="text-[9px] text-gray-400">Views</p>
                      <p className="text-xs font-semibold text-gray-900">{(site.pageViews30d / 1000).toFixed(1)}K</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-400">Visitors</p>
                      <p className="text-xs font-semibold text-gray-900">{(site.uniqueVisitors30d / 1000).toFixed(1)}K</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-400">Conv.</p>
                      <p className="text-xs font-semibold text-gray-900">{site.conversionRate}%</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-[10px] text-gray-400">
                    <Clock className="w-3 h-3" /> Created {site.createdDate}
                  </div>
                )}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <span className="text-[10px] text-gray-400">{site.agent}</span>
                  <span className="text-[10px] font-semibold text-gray-600">${site.monthlyFee}/mo</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="bg-white rounded-[8px] border border-gray-200 px-5 py-16 text-center">
          <Globe className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No websites match your filters</p>
        </div>
      )}

      {selectedSite && activeSite && <SiteDetailPanel site={activeSite} onClose={() => setSelectedSite(null)} />}
    </div>
  );
}
