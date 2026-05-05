import React, { useState } from 'react';
import {
  ArrowLeft, Mail, MessageSquare, Save, Eye, Undo2, Redo2, Copy,
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  Image, Link, Type, Palette, Layout, Smartphone, Monitor,
  ChevronDown, Trash2, Plus, Code, Sparkles, GripVertical,
  CheckCircle, X, Settings, Send,
} from 'lucide-react';
import { useAppNavigate } from '../NavigationContext';

// ── Template library by product + channel ──
type TemplateChannel = 'email' | 'text';
type TemplateProduct = 'payments' | 'capital' | 'website' | 'general';

interface Template {
  id: string;
  name: string;
  desc: string;
  channel: TemplateChannel;
  product: TemplateProduct;
  subject?: string;
  body: string;
  lastEdited: string;
  status: 'active' | 'draft';
}

const allTemplates: Template[] = [
  // Payments emails
  { id: 'tpl-001', name: 'Processing Rate Review', desc: 'Notify merchant of potential rate optimization', channel: 'email', product: 'payments', subject: 'Your processing rates could be lower, {{merchant_name}}', body: `<p>Hi {{contact_name}},</p>\n<p>We've analyzed your recent processing activity and identified an opportunity to <strong>reduce your effective rate by up to {{savings_percent}}%</strong>.</p>\n<p>Your current monthly volume of <strong>{{monthly_volume}}</strong> qualifies you for our optimized pricing tier.</p>\n<p>Here's what we found:</p>\n<ul>\n<li>Current effective rate: {{current_rate}}%</li>\n<li>Proposed rate: {{proposed_rate}}%</li>\n<li>Estimated monthly savings: <strong>{{monthly_savings}}</strong></li>\n</ul>\n<p>Would you like to schedule a quick call to discuss? Click below to pick a time that works.</p>\n<p><a href="{{booking_link}}" style="background:#4318FF;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">Schedule a Call</a></p>\n<p>Best,<br/>{{agent_name}}<br/>Delt Pay</p>`, lastEdited: 'Apr 8, 2026', status: 'active' },
  { id: 'tpl-002', name: 'Upgrade Plan Offer', desc: 'Promote Growth or Custom plan upgrade', channel: 'email', product: 'payments', subject: 'Unlock premium features for {{merchant_name}}', body: `<p>Hi {{contact_name}},</p>\n<p>You've been making great use of your current plan. Based on your growth, upgrading to our <strong>{{recommended_plan}} plan</strong> could save you even more.</p>\n<p>Benefits include:</p>\n<ul>\n<li>Lower per-transaction fees</li>\n<li>Priority support</li>\n<li>Advanced analytics dashboard</li>\n</ul>\n<p><a href="{{upgrade_link}}" style="background:#4318FF;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">View Upgrade Options</a></p>\n<p>Best,<br/>{{agent_name}}</p>`, lastEdited: 'Apr 5, 2026', status: 'active' },
  { id: 'tpl-003', name: 'New Feature Announcement', desc: 'Announce new processing features available', channel: 'email', product: 'payments', subject: 'New: {{feature_name}} is now available', body: `<p>Hi {{contact_name}},</p>\n<p>We're excited to announce a new feature for your Delt Pay processing account: <strong>{{feature_name}}</strong>.</p>\n<p>{{feature_description}}</p>\n<p><a href="{{feature_link}}" style="background:#4318FF;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">Learn More</a></p>`, lastEdited: 'Apr 2, 2026', status: 'active' },
  // Payments texts
  { id: 'tpl-004', name: 'Processing Rate Review', desc: 'SMS about rate review opportunity', channel: 'text', product: 'payments', body: `Hi {{contact_name}}, this is {{agent_name}} from Delt Pay. We've identified potential savings of {{monthly_savings}}/mo on your processing. Want to hear more? Reply YES or call us at {{phone}}.`, lastEdited: 'Apr 7, 2026', status: 'active' },
  { id: 'tpl-005', name: 'Upgrade Plan Offer', desc: 'Text-based plan upgrade prompt', channel: 'text', product: 'payments', body: `{{contact_name}}, you qualify for our {{recommended_plan}} plan with lower rates and premium features. Reply UPGRADE or visit {{upgrade_link}} to learn more. - {{agent_name}}, Delt Pay`, lastEdited: 'Apr 4, 2026', status: 'active' },
  { id: 'tpl-006', name: 'New Feature Announcement', desc: 'Quick text about new features', channel: 'text', product: 'payments', body: `Hi {{contact_name}}! Delt Pay just launched {{feature_name}}. Check it out: {{feature_link}} - {{agent_name}}`, lastEdited: 'Apr 1, 2026', status: 'active' },
  // Capital emails
  { id: 'tpl-007', name: 'Pre-Approval Notice', desc: 'Notify merchant of pre-approved capital amount', channel: 'email', product: 'capital', subject: 'You\'re pre-approved for up to {{approved_amount}}', body: `<p>Hi {{contact_name}},</p>\n<p>Great news! Based on your processing history, <strong>{{merchant_name}}</strong> has been pre-approved for a merchant cash advance of up to <strong>{{approved_amount}}</strong>.</p>\n<p>Key terms:</p>\n<ul>\n<li>Factor rate: {{factor_rate}}</li>\n<li>Daily payment: {{daily_payment}}</li>\n<li>Term: {{term}}</li>\n</ul>\n<p><a href="{{apply_link}}" style="background:#4318FF;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">Apply Now</a></p>`, lastEdited: 'Apr 6, 2026', status: 'active' },
  { id: 'tpl-008', name: 'Renewal Offer', desc: 'Offer renewal on existing MCA', channel: 'email', product: 'capital', subject: 'Renew your funding with improved terms', body: `<p>Hi {{contact_name}},</p>\n<p>Your current advance is {{percent_paid}}% paid off. You're eligible to renew with improved terms.</p>\n<p><a href="{{renew_link}}" style="background:#4318FF;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">View Renewal Options</a></p>`, lastEdited: 'Apr 3, 2026', status: 'active' },
  // Capital texts
  { id: 'tpl-009', name: 'Pre-Approval Notice', desc: 'SMS pre-approval notification', channel: 'text', product: 'capital', body: `{{contact_name}}, {{merchant_name}} is pre-approved for up to {{approved_amount}} in funding. Reply INFO for details or call {{phone}}. - {{agent_name}}, Delt Pay`, lastEdited: 'Apr 5, 2026', status: 'active' },
  { id: 'tpl-010', name: 'Renewal Offer', desc: 'Text-based renewal prompt', channel: 'text', product: 'capital', body: `Hi {{contact_name}}, your MCA is {{percent_paid}}% paid! You qualify for a renewal with better terms. Reply RENEW or call {{phone}}. - Delt Pay`, lastEdited: 'Apr 2, 2026', status: 'active' },
  // Website emails
  { id: 'tpl-011', name: 'Site Performance Report', desc: 'Monthly site performance summary', channel: 'email', product: 'website', subject: 'Your website performance report for {{month}}', body: `<p>Hi {{contact_name}},</p>\n<p>Here's your monthly website performance summary:</p>\n<ul>\n<li>Visitors: {{visitors}}</li>\n<li>Page Views: {{page_views}}</li>\n<li>Avg Session: {{avg_session}}</li>\n<li>Bounce Rate: {{bounce_rate}}</li>\n</ul>\n<p><a href="{{dashboard_link}}" style="background:#4318FF;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">View Full Report</a></p>`, lastEdited: 'Apr 9, 2026', status: 'active' },
  { id: 'tpl-012', name: 'SEO Tips', desc: 'SEO recommendations for merchant site', channel: 'email', product: 'website', subject: 'SEO tips to boost {{merchant_name}}\'s traffic', body: `<p>Hi {{contact_name}},</p>\n<p>We've identified a few quick SEO wins for your website:</p>\n<ol>\n<li>{{seo_tip_1}}</li>\n<li>{{seo_tip_2}}</li>\n<li>{{seo_tip_3}}</li>\n</ol>\n<p><a href="{{seo_link}}" style="background:#4318FF;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">See All Recommendations</a></p>`, lastEdited: 'Apr 7, 2026', status: 'active' },
  // Website texts
  { id: 'tpl-013', name: 'Site Performance Report', desc: 'SMS with site performance highlights', channel: 'text', product: 'website', body: `Hi {{contact_name}}, your site had {{visitors}} visitors this month (+{{growth}}%). View full report: {{report_link}} - Delt Pay`, lastEdited: 'Apr 8, 2026', status: 'active' },
];

// ── Merge Tags ──
const mergeTags = [
  { tag: '{{merchant_name}}', label: 'Merchant Name' },
  { tag: '{{contact_name}}', label: 'Contact Name' },
  { tag: '{{agent_name}}', label: 'Agent Name' },
  { tag: '{{monthly_volume}}', label: 'Monthly Volume' },
  { tag: '{{monthly_savings}}', label: 'Monthly Savings' },
  { tag: '{{savings_percent}}', label: 'Savings %' },
  { tag: '{{current_rate}}', label: 'Current Rate' },
  { tag: '{{proposed_rate}}', label: 'Proposed Rate' },
  { tag: '{{booking_link}}', label: 'Booking Link' },
  { tag: '{{approved_amount}}', label: 'Approved Amount' },
  { tag: '{{factor_rate}}', label: 'Factor Rate' },
  { tag: '{{phone}}', label: 'Phone Number' },
];

// Color presets for email design
const colorPresets = [
  { name: 'Indigo', primary: '#4318FF', bg: '#F8F9FF' },
  { name: 'Emerald', primary: '#059669', bg: '#F0FDF4' },
  { name: 'Slate', primary: '#334155', bg: '#F8FAFC' },
  { name: 'Rose', primary: '#E11D48', bg: '#FFF1F2' },
  { name: 'Amber', primary: '#D97706', bg: '#FFFBEB' },
];

export function TemplateEditor() {
  const { navigate, currentPage } = useAppNavigate();

  // Parse template ID and return path from URL
  const urlParts = currentPage.split('/');
  const templateId = urlParts[2] || 'tpl-001';
  const returnPath = decodeURIComponent(urlParts[3] || '/merchants');

  const [selectedTemplateId, setSelectedTemplateId] = useState(templateId);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [sidebarTab, setSidebarTab] = useState<'templates' | 'design' | 'merge'>('templates');
  const [channelFilter, setChannelFilter] = useState<'all' | 'email' | 'text'>('all');
  const [productFilter, setProductFilter] = useState<'all' | TemplateProduct>('all');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [selectedColorPreset, setSelectedColorPreset] = useState(0);

  const selectedTemplate = allTemplates.find(t => t.id === selectedTemplateId) || allTemplates[0];

  // Editable fields
  const [editSubject, setEditSubject] = useState(selectedTemplate.subject || '');
  const [editBody, setEditBody] = useState(selectedTemplate.body);

  const handleSelectTemplate = (t: Template) => {
    setSelectedTemplateId(t.id);
    setEditSubject(t.subject || '');
    setEditBody(t.body);
    setHasUnsavedChanges(false);
  };

  const handleSave = () => {
    setHasUnsavedChanges(false);
    setShowSaveToast(true);
    setTimeout(() => setShowSaveToast(false), 2500);
  };

  const insertMergeTag = (tag: string) => {
    setEditBody(prev => prev + tag);
    setHasUnsavedChanges(true);
  };

  const filteredTemplates = allTemplates.filter(t => {
    if (channelFilter !== 'all' && t.channel !== channelFilter) return false;
    if (productFilter !== 'all' && t.product !== productFilter) return false;
    return true;
  });

  // Render preview with resolved merge tags (mock data)
  const resolvePreview = (html: string) => {
    return html
      .replace(/\{\{merchant_name\}\}/g, 'Sunrise Cafe & Bakery')
      .replace(/\{\{contact_name\}\}/g, 'John Smith')
      .replace(/\{\{agent_name\}\}/g, 'Sarah Johnson')
      .replace(/\{\{monthly_volume\}\}/g, '$37,500')
      .replace(/\{\{monthly_savings\}\}/g, '$312')
      .replace(/\{\{savings_percent\}\}/g, '0.18')
      .replace(/\{\{current_rate\}\}/g, '3.2')
      .replace(/\{\{proposed_rate\}\}/g, '2.85')
      .replace(/\{\{booking_link\}\}/g, '#')
      .replace(/\{\{approved_amount\}\}/g, '$75,000')
      .replace(/\{\{factor_rate\}\}/g, '1.35')
      .replace(/\{\{daily_payment\}\}/g, '$420')
      .replace(/\{\{term\}\}/g, '8 months')
      .replace(/\{\{phone\}\}/g, '(800) 555-DELT')
      .replace(/\{\{percent_paid\}\}/g, '65')
      .replace(/\{\{recommended_plan\}\}/g, 'Growth')
      .replace(/\{\{upgrade_link\}\}/g, '#')
      .replace(/\{\{feature_name\}\}/g, 'Tap to Pay')
      .replace(/\{\{feature_description\}\}/g, 'Accept contactless payments directly on your phone.')
      .replace(/\{\{feature_link\}\}/g, '#')
      .replace(/\{\{visitors\}\}/g, '2,847')
      .replace(/\{\{page_views\}\}/g, '8,234')
      .replace(/\{\{avg_session\}\}/g, '2m 34s')
      .replace(/\{\{bounce_rate\}\}/g, '42%')
      .replace(/\{\{growth\}\}/g, '12')
      .replace(/\{\{month\}\}/g, 'March 2026')
      .replace(/\{\{dashboard_link\}\}/g, '#')
      .replace(/\{\{apply_link\}\}/g, '#')
      .replace(/\{\{renew_link\}\}/g, '#')
      .replace(/\{\{report_link\}\}/g, '#')
      .replace(/\{\{seo_link\}\}/g, '#')
      .replace(/\{\{seo_tip_1\}\}/g, 'Add alt text to all images')
      .replace(/\{\{seo_tip_2\}\}/g, 'Improve page load speed')
      .replace(/\{\{seo_tip_3\}\}/g, 'Add a blog section');
  };

  const productLabel = (p: TemplateProduct) =>
    p === 'payments' ? 'Payments' : p === 'capital' ? 'Capital' : p === 'website' ? 'Website' : 'General';

  const productColor = (p: TemplateProduct) =>
    p === 'payments' ? 'bg-indigo-50 text-indigo-700' : p === 'capital' ? 'bg-emerald-50 text-emerald-700' : p === 'website' ? 'bg-sky-50 text-sky-700' : 'bg-gray-100 text-gray-600';

  return (
    <div className="h-full flex flex-col bg-canvas">
      {/* ── Top Bar ── */}
      <div className="bg-white border-b border-gray-200 px-5 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(returnPath)}
            className="p-1.5 hover:bg-gray-100 rounded-[6px] transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </button>
          <div className="w-px h-6 bg-gray-200" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold text-gray-900">{selectedTemplate.name}</h1>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${selectedTemplate.channel === 'email' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}`}>
                {selectedTemplate.channel === 'email' ? 'Email' : 'Text'}
              </span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${productColor(selectedTemplate.product)}`}>
                {productLabel(selectedTemplate.product)}
              </span>
              {hasUnsavedChanges && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-600">Unsaved</span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{selectedTemplate.desc}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-gray-100 rounded-[6px] transition-colors text-gray-500" title="Undo">
            <Undo2 className="w-4 h-4" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-[6px] transition-colors text-gray-500" title="Redo">
            <Redo2 className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-gray-200 mx-1" />
          <button className="p-2 hover:bg-gray-100 rounded-[6px] transition-colors text-gray-500" title="Duplicate Template">
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate(returnPath)}
            className="px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-[6px] hover:bg-gray-50 transition-colors"
          >
            Discard
          </button>
          <button
            onClick={handleSave}
            className="delt-btn-primary"
          >
            <Save className="w-3.5 h-3.5" />
            Save Template
          </button>
        </div>
      </div>

      {/* ── Main Area ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* ── Left Sidebar: Template Library ── */}
        <div className="w-72 bg-white border-r border-gray-200 flex flex-col shrink-0">
          {/* Sidebar Tabs */}
          <div className="flex border-b border-gray-200">
            {([
              { id: 'templates' as const, label: 'Templates', icon: <Layout className="w-3.5 h-3.5" /> },
              { id: 'design' as const, label: 'Design', icon: <Palette className="w-3.5 h-3.5" /> },
              { id: 'merge' as const, label: 'Tags', icon: <Code className="w-3.5 h-3.5" /> },
            ]).map(tab => (
              <button
                key={tab.id}
                onClick={() => setSidebarTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors border-b-2 ${
                  sidebarTab === tab.id
                    ? 'text-brand border-brand'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto">
            {sidebarTab === 'templates' && (
              <div>
                {/* Filters */}
                <div className="px-3 py-3 border-b border-gray-100 space-y-2">
                  <div className="flex gap-1">
                    {(['all', 'email', 'text'] as const).map(ch => (
                      <button
                        key={ch}
                        onClick={() => setChannelFilter(ch)}
                        className={`flex-1 py-1 text-[11px] font-medium rounded-[4px] transition-colors ${
                          channelFilter === ch ? 'bg-brand text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {ch === 'all' ? 'All' : ch === 'email' ? 'Email' : 'Text'}
                      </button>
                    ))}
                  </div>
                  <select
                    value={productFilter}
                    onChange={e => setProductFilter(e.target.value as any)}
                    className="w-full text-xs border border-gray-200 rounded-[6px] px-2 py-1.5 text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand/20"
                  >
                    <option value="all">All Products</option>
                    <option value="payments">Payments</option>
                    <option value="capital">Capital</option>
                    <option value="website">Website</option>
                  </select>
                </div>

                {/* Template List */}
                <div className="p-2 space-y-1">
                  {filteredTemplates.map(t => (
                    <button
                      key={t.id}
                      onClick={() => handleSelectTemplate(t)}
                      className={`w-full text-left px-3 py-2.5 rounded-[6px] transition-colors ${
                        selectedTemplateId === t.id
                          ? 'bg-brand/5 border border-brand/20'
                          : 'hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className={`text-xs font-medium truncate ${selectedTemplateId === t.id ? 'text-brand' : 'text-gray-900'}`}>
                            {t.name}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-0.5 truncate">{t.desc}</p>
                        </div>
                        {t.channel === 'email' ? (
                          <Mail className="w-3 h-3 text-blue-400 shrink-0 mt-0.5" />
                        ) : (
                          <MessageSquare className="w-3 h-3 text-green-400 shrink-0 mt-0.5" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`px-1 py-0.5 rounded text-[9px] font-medium ${productColor(t.product)}`}>
                          {productLabel(t.product)}
                        </span>
                        <span className="text-[9px] text-gray-400">{t.lastEdited}</span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Create New */}
                <div className="px-3 py-3 border-t border-gray-100">
                  <button className="w-full py-2 text-xs text-brand font-medium border border-dashed border-brand/30 rounded-[6px] hover:bg-brand/5 transition-colors flex items-center justify-center gap-1.5">
                    <Plus className="w-3.5 h-3.5" />
                    Create New Template
                  </button>
                </div>
              </div>
            )}

            {sidebarTab === 'design' && (
              <div className="p-4 space-y-5">
                {selectedTemplate.channel === 'email' ? (
                  <>
                    {/* Color Scheme */}
                    <div>
                      <label className="text-xs font-semibold text-gray-900 block mb-2">Color Scheme</label>
                      <div className="grid grid-cols-5 gap-2">
                        {colorPresets.map((preset, i) => (
                          <button
                            key={preset.name}
                            onClick={() => setSelectedColorPreset(i)}
                            className={`flex flex-col items-center gap-1 p-2 rounded-[6px] border transition-colors ${
                              selectedColorPreset === i ? 'border-brand bg-brand/5' : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="w-5 h-5 rounded-full" style={{ backgroundColor: preset.primary }} />
                            <span className="text-[9px] text-gray-500">{preset.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Button Style */}
                    <div>
                      <label className="text-xs font-semibold text-gray-900 block mb-2">Button Style</label>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          {['Rounded', 'Pill', 'Square'].map(style => (
                            <button
                              key={style}
                              className={`flex-1 py-1.5 text-[11px] font-medium border rounded-[4px] transition-colors ${
                                style === 'Rounded' ? 'bg-brand/5 border-brand/20 text-brand' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                              }`}
                            >
                              {style}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Font */}
                    <div>
                      <label className="text-xs font-semibold text-gray-900 block mb-2">Font Family</label>
                      <select className="w-full text-xs border border-gray-200 rounded-[6px] px-2 py-1.5 text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand/20">
                        <option>DM Sans (Default)</option>
                        <option>Inter</option>
                        <option>Arial</option>
                        <option>Georgia</option>
                        <option>Helvetica</option>
                      </select>
                    </div>

                    {/* Header Image */}
                    <div>
                      <label className="text-xs font-semibold text-gray-900 block mb-2">Header Image</label>
                      <div className="border border-dashed border-gray-300 rounded-[6px] p-4 flex flex-col items-center text-center">
                        <Image className="w-5 h-5 text-gray-400 mb-1" />
                        <span className="text-[11px] text-gray-500">Drop an image or click to upload</span>
                        <span className="text-[10px] text-gray-400 mt-0.5">600px wide recommended</span>
                      </div>
                    </div>

                    {/* Layout */}
                    <div>
                      <label className="text-xs font-semibold text-gray-900 block mb-2">Layout</label>
                      <div className="grid grid-cols-2 gap-2">
                        {['Single Column', 'Two Column'].map(layout => (
                          <button
                            key={layout}
                            className={`py-2 text-[11px] font-medium border rounded-[6px] transition-colors ${
                              layout === 'Single Column' ? 'bg-brand/5 border-brand/20 text-brand' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                            }`}
                          >
                            {layout}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Footer */}
                    <div>
                      <label className="text-xs font-semibold text-gray-900 block mb-2">Footer Text</label>
                      <textarea
                        defaultValue="Delt Pay | 123 Business Ave, Suite 100 | Unsubscribe"
                        className="w-full text-xs border border-gray-200 rounded-[6px] px-2 py-1.5 text-gray-600 resize-none h-16 focus:outline-none focus:ring-2 focus:ring-brand/20"
                      />
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-xs text-gray-500">Text messages use plain text formatting.</p>
                    <p className="text-[10px] text-gray-400 mt-1">Design options are available for email templates.</p>
                  </div>
                )}
              </div>
            )}

            {sidebarTab === 'merge' && (
              <div className="p-3">
                <p className="text-[11px] text-gray-500 mb-3">Click a tag to insert it at the end of your template body.</p>
                <div className="space-y-1">
                  {mergeTags.map(mt => (
                    <button
                      key={mt.tag}
                      onClick={() => insertMergeTag(mt.tag)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-[6px] hover:bg-gray-50 transition-colors group"
                    >
                      <div className="text-left">
                        <p className="text-xs font-medium text-gray-700">{mt.label}</p>
                        <code className="text-[10px] text-gray-400 font-mono">{mt.tag}</code>
                      </div>
                      <Plus className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Center: Editor + Preview ── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Editor Toolbar */}
          {selectedTemplate.channel === 'email' && (
            <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-1 shrink-0">
              <ToolBtn icon={<Bold className="w-3.5 h-3.5" />} label="Bold" />
              <ToolBtn icon={<Italic className="w-3.5 h-3.5" />} label="Italic" />
              <ToolBtn icon={<Underline className="w-3.5 h-3.5" />} label="Underline" />
              <div className="w-px h-5 bg-gray-200 mx-1" />
              <ToolBtn icon={<AlignLeft className="w-3.5 h-3.5" />} label="Align Left" active />
              <ToolBtn icon={<AlignCenter className="w-3.5 h-3.5" />} label="Align Center" />
              <ToolBtn icon={<AlignRight className="w-3.5 h-3.5" />} label="Align Right" />
              <div className="w-px h-5 bg-gray-200 mx-1" />
              <ToolBtn icon={<Link className="w-3.5 h-3.5" />} label="Insert Link" />
              <ToolBtn icon={<Image className="w-3.5 h-3.5" />} label="Insert Image" />
              <ToolBtn icon={<Type className="w-3.5 h-3.5" />} label="Heading" />
              <div className="w-px h-5 bg-gray-200 mx-1" />
              <button className="flex items-center gap-1 px-2 py-1 text-[11px] text-gray-600 hover:bg-gray-100 rounded-[4px] transition-colors">
                <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                AI Assist
              </button>
              <div className="flex-1" />
              {/* Preview Mode Toggle */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-[6px] p-0.5">
                <button
                  onClick={() => setPreviewMode('desktop')}
                  className={`p-1.5 rounded-[4px] transition-colors ${previewMode === 'desktop' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'}`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setPreviewMode('mobile')}
                  className={`p-1.5 rounded-[4px] transition-colors ${previewMode === 'mobile' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'}`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Split Editor + Preview */}
          <div className="flex-1 flex overflow-hidden">
            {/* Editor Panel */}
            <div className="flex-1 overflow-y-auto border-r border-gray-200 bg-white">
              <div className="p-5 space-y-4">
                {selectedTemplate.channel === 'email' && (
                  <div>
                    <label className="text-xs text-gray-500 font-medium block mb-1">Subject Line</label>
                    <input
                      value={editSubject}
                      onChange={e => { setEditSubject(e.target.value); setHasUnsavedChanges(true); }}
                      className="w-full px-3 py-2 border border-gray-200 rounded-[6px] text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                      placeholder="Enter email subject..."
                    />
                  </div>
                )}
                <div>
                  <label className="text-xs text-gray-500 font-medium block mb-1">
                    {selectedTemplate.channel === 'email' ? 'Email Body (HTML)' : 'Message Body'}
                  </label>
                  <textarea
                    value={editBody}
                    onChange={e => { setEditBody(e.target.value); setHasUnsavedChanges(true); }}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-[6px] text-sm text-gray-700 font-mono resize-none focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                    style={{ minHeight: selectedTemplate.channel === 'email' ? '400px' : '200px' }}
                    spellCheck={false}
                  />
                </div>
                {/* Merge Tag Quick Insert */}
                <div>
                  <label className="text-xs text-gray-500 font-medium block mb-2">Quick Insert Merge Tags</label>
                  <div className="flex flex-wrap gap-1.5">
                    {mergeTags.slice(0, 8).map(mt => (
                      <button
                        key={mt.tag}
                        onClick={() => insertMergeTag(mt.tag)}
                        className="px-2 py-1 text-[10px] font-mono text-purple-700 bg-purple-50 rounded-[4px] hover:bg-purple-100 transition-colors"
                      >
                        {mt.tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Preview Panel */}
            <div className="flex-1 overflow-y-auto bg-gray-50 p-5 flex justify-center">
              <div
                className={`transition-all ${
                  previewMode === 'mobile' ? 'w-[375px]' : 'w-full max-w-[600px]'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-gray-500 font-medium flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5" />
                    Live Preview
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {previewMode === 'mobile' ? '375px' : '600px'} wide
                  </span>
                </div>

                {selectedTemplate.channel === 'email' ? (
                  <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                    {/* Email Header */}
                    <div className="px-5 py-4 border-b border-gray-100" style={{ backgroundColor: colorPresets[selectedColorPreset].bg }}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: colorPresets[selectedColorPreset].primary }}>
                          D
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-900">Delt Pay</p>
                          <p className="text-[10px] text-gray-400">noreply@deltpay.com</p>
                        </div>
                      </div>
                      <p className="text-sm font-medium text-gray-900">
                        {resolvePreview(editSubject)}
                      </p>
                    </div>
                    {/* Email Body */}
                    <div
                      className="px-5 py-5 text-sm text-gray-700 leading-relaxed [&_a]:text-white [&_a]:no-underline [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1 [&_li]:text-sm [&_p]:mb-3"
                      dangerouslySetInnerHTML={{ __html: resolvePreview(editBody) }}
                    />
                    {/* Email Footer */}
                    <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 text-center">
                      <p className="text-[10px] text-gray-400">Delt Pay | 123 Business Ave, Suite 100</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        <a href="#" className="!text-gray-400 underline">Unsubscribe</a> | <a href="#" className="!text-gray-400 underline">Preferences</a>
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Text Message Preview */
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                      <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-white text-xs font-bold">D</div>
                      <div>
                        <p className="text-xs font-medium text-gray-900">Delt Pay</p>
                        <p className="text-[10px] text-gray-400">(800) 555-DELT</p>
                      </div>
                    </div>
                    <div className="flex justify-start">
                      <div className="max-w-[85%] bg-gray-100 rounded-2xl rounded-tl-md px-4 py-3">
                        <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                          {resolvePreview(editBody)}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-1.5 text-right">Just now</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Toast */}
      {showSaveToast && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50 animate-[slideUp_0.3s_ease-out]">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-medium">Template saved successfully</span>
        </div>
      )}
    </div>
  );
}

// ── Toolbar Button ──
function ToolBtn({ icon, label, active }: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <button
      title={label}
      className={`p-1.5 rounded-[4px] transition-colors ${active ? 'bg-gray-200 text-gray-900' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`}
    >
      {icon}
    </button>
  );
}
