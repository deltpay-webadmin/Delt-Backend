import React, { useState, useMemo } from 'react';
import {
  Send, Mail, MessageSquare, MousePointerClick, BarChart3, Zap,
  Search, Filter, ChevronDown, Plus, Eye, Clock, CheckCircle,
  AlertTriangle, TrendingUp, ArrowUpRight, ArrowDownRight, Users,
  RefreshCw, Play, Pause, Settings, Copy, ExternalLink, User,
  Calendar, Target, Activity, X, ChevronRight, Layers,
  Heart, GitMerge, ArrowRight, GripVertical, Trash2,
} from 'lucide-react';
import { Button, Tabs } from '../ui';

// ══════════════════════════════════════
// TYPES & MOCK DATA
// ══════════════════════════════════════

type Channel = 'email' | 'sms' | 'portal_cta';
type CampaignStatus = 'active' | 'completed' | 'draft' | 'paused';
type TriggerStatus = 'active' | 'paused' | 'draft';

interface Campaign {
  id: string;
  name: string;
  channel: Channel;
  template: string;
  segment: string;
  status: CampaignStatus;
  sentDate: string;
  agent: string;
  recipients: number;
  delivered: number;
  opened: number;
  clicked: number;
  responded: number;
  optedOut: number;
}

interface OutreachEvent {
  id: string;
  agent: string;
  merchant: string;
  channel: Channel;
  template: string;
  sentAt: string;
  status: 'delivered' | 'opened' | 'clicked' | 'responded' | 'bounced';
  responseSnippet?: string;
}

interface AutoTrigger {
  id: string;
  name: string;
  condition: string;
  conditionDetail: string;
  action: string;
  template: string;
  channel: Channel;
  status: TriggerStatus;
  firedCount: number;
  lastFired: string | null;
  conversionRate: number;
}

interface PortalCTA {
  id: string;
  name: string;
  placement: string;
  variant: string;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  convRate: number;
  status: 'live' | 'paused' | 'ab_test';
}

interface AgentActivity {
  agent: string;
  avatar: string;
  emailsSent: number;
  smsSent: number;
  responses: number;
  tasksCreated: number;
  followUpsCompleted: number;
  avgResponseTime: string;
  recentActions: { action: string; target: string; time: string; channel: Channel }[];
}

const CAMPAIGNS: Campaign[] = [
  { id: 'CMP-001', name: 'Q2 Renewal Push — Growth Tier', channel: 'email', template: 'Renewal Offer v2', segment: 'Growth tier, >80% repaid', status: 'active', sentDate: '2026-04-14', agent: 'Sarah M.', recipients: 47, delivered: 45, opened: 28, clicked: 14, responded: 8, optedOut: 1 },
  { id: 'CMP-002', name: 'CB Prevention Tips Blast', channel: 'email', template: 'Chargeback Prevention Guide', segment: 'CB rate > 0.5%', status: 'completed', sentDate: '2026-04-10', agent: 'Sarah M.', recipients: 23, delivered: 22, opened: 16, clicked: 9, responded: 5, optedOut: 0 },
  { id: 'CMP-003', name: 'Volume Drop Follow-Up', channel: 'sms', template: 'Volume Check-In SMS', segment: 'Volume drop > 20% MoM', status: 'active', sentDate: '2026-04-12', agent: 'Lyndon R.', recipients: 18, delivered: 18, opened: 18, clicked: 7, responded: 4, optedOut: 0 },
  { id: 'CMP-004', name: 'Spring Rate Review Promo', channel: 'portal_cta', template: 'Rate Review Banner A', segment: 'All active merchants', status: 'completed', sentDate: '2026-04-01', agent: 'System', recipients: 312, delivered: 312, opened: 245, clicked: 18, responded: 6, optedOut: 0 },
  { id: 'CMP-005', name: 'New Merchant Welcome Series', channel: 'email', template: 'Welcome Drip 1/3', segment: 'Onboarded < 30 days', status: 'active', sentDate: '2026-04-08', agent: 'System', recipients: 12, delivered: 12, opened: 10, clicked: 6, responded: 3, optedOut: 0 },
  { id: 'CMP-006', name: 'Equipment Upgrade Offer', channel: 'email', template: 'Lease Upgrade v1', segment: 'Terminal age > 3 yrs', status: 'draft', sentDate: '', agent: 'Sarah M.', recipients: 0, delivered: 0, opened: 0, clicked: 0, responded: 0, optedOut: 0 },
  { id: 'CMP-007', name: 'Stacking Alert Follow-Up', channel: 'sms', template: 'Stacking Warning SMS', segment: 'DataMerch stacking hits', status: 'paused', sentDate: '2026-04-05', agent: 'Sarah M.', recipients: 8, delivered: 7, opened: 7, clicked: 2, responded: 1, optedOut: 0 },
  { id: 'CMP-008', name: 'Residual Statement Notification', channel: 'email', template: 'Monthly Residual Statement', segment: 'All residual merchants', status: 'completed', sentDate: '2026-04-01', agent: 'System', recipients: 156, delivered: 152, opened: 98, clicked: 42, responded: 0, optedOut: 2 },
];

const OUTREACH_EVENTS: OutreachEvent[] = [
  { id: 'OE-001', agent: 'Sarah M.', merchant: 'Havana Bites Cafe', channel: 'email', template: 'Renewal Offer v2', sentAt: '2026-04-14 10:15', status: 'responded', responseSnippet: 'Yes, interested in renewal. Can we discuss terms?' },
  { id: 'OE-002', agent: 'Sarah M.', merchant: 'Coral Reef Auto Spa', channel: 'email', template: 'CB Prevention Guide', sentAt: '2026-04-14 10:18', status: 'opened' },
  { id: 'OE-003', agent: 'Lyndon R.', merchant: 'Doral Fresh Market', channel: 'sms', template: 'Volume Check-In', sentAt: '2026-04-14 09:30', status: 'responded', responseSnippet: 'Seasonal dip, expect pickup by May.' },
  { id: 'OE-004', agent: 'Lyndon R.', merchant: 'Midtown Taqueria', channel: 'sms', template: 'Volume Check-In', sentAt: '2026-04-13 14:22', status: 'delivered' },
  { id: 'OE-005', agent: 'Sarah M.', merchant: 'SoBe Cycle & Fitness', channel: 'email', template: 'Renewal Offer v2', sentAt: '2026-04-13 11:05', status: 'clicked' },
  { id: 'OE-006', agent: 'System', merchant: 'Hialeah Tire & Brake', channel: 'email', template: 'Chargeback Prevention Guide', sentAt: '2026-04-12 08:00', status: 'opened' },
  { id: 'OE-007', agent: 'System', merchant: 'Palmetto Bay Bakery', channel: 'portal_cta', template: 'Rate Review Banner', sentAt: '2026-04-11 12:00', status: 'clicked' },
  { id: 'OE-008', agent: 'Sarah M.', merchant: 'Kendall Pet Grooming', channel: 'email', template: 'Welcome Drip 1/3', sentAt: '2026-04-10 09:15', status: 'responded', responseSnippet: 'Thanks for the info! Quick question about statements...' },
  { id: 'OE-009', agent: 'System', merchant: 'Aventura Nail Lounge', channel: 'email', template: 'Monthly Residual Statement', sentAt: '2026-04-01 06:00', status: 'opened' },
  { id: 'OE-010', agent: 'Lyndon R.', merchant: 'Little Havana Barbershop', channel: 'sms', template: 'Volume Check-In', sentAt: '2026-04-12 15:45', status: 'bounced' },
];

const AUTO_TRIGGERS: AutoTrigger[] = [
  { id: 'TRG-001', name: 'CB Rate Warning', condition: 'CB rate crosses 0.8%', conditionDetail: 'Merchant chargeback-to-transaction ratio exceeds 0.8% in trailing 30 days', action: 'Send chargeback prevention tips email', template: 'CB Prevention Guide', channel: 'email', status: 'active', firedCount: 14, lastFired: '2026-04-13', conversionRate: 0.42 },
  { id: 'TRG-002', name: 'Renewal Readiness', condition: 'MCA hits 80% repaid', conditionDetail: 'Advance balance reaches 80% of original funded amount', action: 'Send renewal offer email + create agent task', template: 'Renewal Offer v2', channel: 'email', status: 'active', firedCount: 31, lastFired: '2026-04-14', conversionRate: 0.58 },
  { id: 'TRG-003', name: 'Volume Drop Alert', condition: 'Volume drops 20% MoM', conditionDetail: 'Merchant processing volume decreases 20%+ month-over-month', action: 'Auto-create follow-up task for assigned agent', template: 'Volume Check-In SMS', channel: 'sms', status: 'active', firedCount: 22, lastFired: '2026-04-12', conversionRate: 0.36 },
  { id: 'TRG-004', name: 'New Merchant Welcome', condition: 'Merchant status → Active', conditionDetail: 'Merchant completes onboarding and first batch settles', action: 'Start 3-email welcome drip sequence', template: 'Welcome Drip 1/3', channel: 'email', status: 'active', firedCount: 12, lastFired: '2026-04-08', conversionRate: 0.67 },
  { id: 'TRG-005', name: 'Stacking Detection', condition: 'DataMerch stacking hit', conditionDetail: 'Merchant appears in DataMerch with new stacking position', action: 'Send stacking alert SMS + flag for review', template: 'Stacking Warning SMS', channel: 'sms', status: 'active', firedCount: 8, lastFired: '2026-04-05', conversionRate: 0.25 },
  { id: 'TRG-006', name: 'Equipment Lease Expiry', condition: 'Lease expires in 60 days', conditionDetail: 'Terminal/equipment lease approaching expiration', action: 'Send upgrade offer email', template: 'Lease Upgrade v1', channel: 'email', status: 'draft', firedCount: 0, lastFired: null, conversionRate: 0 },
  { id: 'TRG-007', name: 'Dormant Merchant Re-engage', condition: 'No processing 14+ days', conditionDetail: 'Active merchant has zero transaction volume for 14+ consecutive days', action: 'Send re-engagement email + create urgent task', template: 'Re-engagement Check', channel: 'email', status: 'paused', firedCount: 5, lastFired: '2026-03-28', conversionRate: 0.20 },
];

const PORTAL_CTAS: PortalCTA[] = [
  { id: 'CTA-001', name: 'Rate Review Banner', placement: 'Dashboard — top banner', variant: 'A (Blue)', impressions: 245, clicks: 18, conversions: 6, ctr: 0.0735, convRate: 0.333, status: 'ab_test' },
  { id: 'CTA-002', name: 'Rate Review Banner', placement: 'Dashboard — top banner', variant: 'B (Green)', impressions: 238, clicks: 24, conversions: 9, ctr: 0.1008, convRate: 0.375, status: 'ab_test' },
  { id: 'CTA-003', name: 'Renewal Prompt Card', placement: 'Dashboard — right sidebar', variant: 'Default', impressions: 189, clicks: 32, conversions: 14, ctr: 0.1693, convRate: 0.4375, status: 'live' },
  { id: 'CTA-004', name: 'Equipment Upgrade Tile', placement: 'Statements page — bottom', variant: 'Default', impressions: 112, clicks: 8, conversions: 2, ctr: 0.0714, convRate: 0.25, status: 'live' },
  { id: 'CTA-005', name: 'Refer a Business Card', placement: 'Dashboard — bottom', variant: 'Default', impressions: 305, clicks: 15, conversions: 3, ctr: 0.0492, convRate: 0.20, status: 'live' },
  { id: 'CTA-006', name: 'CB Prevention Tips Link', placement: 'Disputes page — inline', variant: 'Default', impressions: 67, clicks: 12, conversions: 5, ctr: 0.1791, convRate: 0.4167, status: 'live' },
];

const AGENT_ACTIVITY: AgentActivity[] = [
  {
    agent: 'Sarah M.', avatar: 'SM',
    emailsSent: 142, smsSent: 18, responses: 47, tasksCreated: 23, followUpsCompleted: 31, avgResponseTime: '2.4h',
    recentActions: [
      { action: 'Sent renewal offer', target: 'Havana Bites Cafe', time: '10:15 AM', channel: 'email' },
      { action: 'Received response', target: 'Kendall Pet Grooming', time: '9:48 AM', channel: 'email' },
      { action: 'Completed follow-up', target: 'Coral Reef Auto Spa', time: '9:30 AM', channel: 'email' },
      { action: 'Created task', target: 'SoBe Cycle & Fitness', time: 'Yesterday', channel: 'email' },
      { action: 'Sent CB prevention guide', target: 'Doral Fresh Market', time: 'Yesterday', channel: 'email' },
    ],
  },
  {
    agent: 'Lyndon R.', avatar: 'LR',
    emailsSent: 34, smsSent: 52, responses: 19, tasksCreated: 8, followUpsCompleted: 12, avgResponseTime: '5.1h',
    recentActions: [
      { action: 'Sent volume check-in', target: 'Doral Fresh Market', time: '9:30 AM', channel: 'sms' },
      { action: 'Received response', target: 'Doral Fresh Market', time: '10:02 AM', channel: 'sms' },
      { action: 'Sent volume check-in', target: 'Midtown Taqueria', time: 'Yesterday', channel: 'sms' },
      { action: 'Created task', target: 'Little Havana Barbershop', time: 'Yesterday', channel: 'sms' },
    ],
  },
  {
    agent: 'John D.', avatar: 'JD',
    emailsSent: 67, smsSent: 11, responses: 22, tasksCreated: 15, followUpsCompleted: 18, avgResponseTime: '3.8h',
    recentActions: [
      { action: 'Sent renewal offer', target: 'Wynwood Ink Studio', time: 'Yesterday', channel: 'email' },
      { action: 'Completed follow-up', target: 'Brickell Dry Cleaners', time: '2 days ago', channel: 'email' },
      { action: 'Created task', target: 'Aventura Nail Lounge', time: '2 days ago', channel: 'email' },
    ],
  },
];

// ── Template Previews ──
const TEMPLATE_PREVIEWS: Record<string, { subject: string; channel: 'email' | 'sms'; body: string }> = {
  'Renewal Offer v2': { subject: 'Your renewal is ready — improved terms inside', channel: 'email', body: `Hi {{merchant_name}},\n\nGreat news! You've repaid {{percent_repaid}}% of your advance, and you now qualify for a renewal with improved terms.\n\n• New advance amount: up to {{max_advance}}\n• Improved factor rate: {{new_factor}}\n• Same reliable daily payments\n\nReply to this email or call us at (800) 555-DELT to discuss your renewal options.\n\nBest,\n{{agent_name}}\nDelt Pay` },
  'Chargeback Prevention Guide': { subject: 'Your chargeback rate is climbing — here\'s how to fix it', channel: 'email', body: `Hi {{merchant_name}},\n\nWe noticed your chargeback rate has reached {{cb_rate}}%, which is approaching card network thresholds.\n\nHere are 5 steps to reduce chargebacks:\n1. Use clear billing descriptors\n2. Send transaction receipts immediately\n3. Respond to retrieval requests within 24 hours\n4. Implement 3D Secure for online transactions\n5. Maintain clear refund policies\n\nWe're here to help — reply to discuss a prevention strategy.\n\n{{agent_name}}\nDelt Pay` },
  'Volume Check-In SMS': { subject: '', channel: 'sms', body: `Hi {{merchant_name}}, this is {{agent_name}} from Delt Pay. We noticed your processing volume dropped {{drop_pct}}% last month. Everything ok? Let us know if there's anything we can help with. Reply STOP to opt out.` },
  'Welcome Drip 1/3': { subject: 'Welcome to Delt Pay — getting started', channel: 'email', body: `Welcome to Delt Pay, {{merchant_name}}!\n\nWe're excited to have you on board. Here's what to expect:\n\n✅ Your first settlement will arrive within 24-48 hours\n✅ Access your merchant portal at portal.deltpay.com\n✅ Your dedicated agent is {{agent_name}}\n\nWe'll send you tips over the next few days to help you get the most out of your account.\n\nWelcome aboard!\nThe Delt Pay Team` },
  'Lease Upgrade v1': { subject: 'Time to upgrade your terminal — special offer inside', channel: 'email', body: `Hi {{merchant_name}},\n\nYour current terminal has been serving you well, but newer models offer:\n\n• Faster transaction processing\n• Contactless/NFC payments\n• Built-in receipt printing\n• Enhanced security features\n\nAs a valued Delt Pay merchant, you qualify for a free upgrade. Reply to schedule your swap.\n\n{{agent_name}}\nDelt Pay` },
  'Stacking Warning SMS': { subject: '', channel: 'sms', body: `{{merchant_name}}, we noticed a new funding position on your account via DataMerch. Stacking can affect your business health. Please call {{agent_name}} at (800) 555-DELT to discuss. Reply STOP to opt out.` },
  'Monthly Residual Statement': { subject: 'Your April residual statement is ready', channel: 'email', body: `Hi {{merchant_name}},\n\nYour monthly residual statement for {{month}} is now available.\n\n• Total volume processed: {{volume}}\n• Residual earned: {{residual_amount}}\n• Net payout: {{net_payout}}\n\nView your full statement in the merchant portal.\n\nDelt Pay Accounting` },
  'Re-engagement Check': { subject: 'We miss you — is everything ok?', channel: 'email', body: `Hi {{merchant_name}},\n\nWe noticed you haven't processed any transactions in the last {{days_inactive}} days.\n\nIs everything alright? We're here to help if you're experiencing any issues with your terminal or account.\n\nPlease reply or call us at (800) 555-DELT.\n\n{{agent_name}}\nDelt Pay` },
};

// ── Drip Sequences ──
interface DripStep { id: string; delay: string; delayDays: number; template: string; channel: Channel; }
interface DripSequence { id: string; name: string; trigger: string; status: 'active' | 'draft' | 'paused'; steps: DripStep[]; enrolled: number; completed: number; conversionRate: number; }

const DRIP_SEQUENCES: DripSequence[] = [
  {
    id: 'DRP-001', name: 'New Merchant Welcome Series', trigger: 'Merchant onboarded', status: 'active', enrolled: 48, completed: 36, conversionRate: 0.75,
    steps: [
      { id: 's1', delay: 'Immediately', delayDays: 0, template: 'Welcome Drip 1/3', channel: 'email' },
      { id: 's2', delay: '3 days later', delayDays: 3, template: 'Portal Tour Guide', channel: 'email' },
      { id: 's3', delay: '7 days later', delayDays: 7, template: 'First Month Check-In', channel: 'sms' },
    ],
  },
  {
    id: 'DRP-002', name: 'Renewal Nurture Sequence', trigger: 'MCA reaches 70% repaid', status: 'active', enrolled: 31, completed: 18, conversionRate: 0.58,
    steps: [
      { id: 's1', delay: 'Immediately', delayDays: 0, template: 'Renewal Teaser', channel: 'email' },
      { id: 's2', delay: '5 days later', delayDays: 5, template: 'Renewal Offer v2', channel: 'email' },
      { id: 's3', delay: '3 days later', delayDays: 8, template: 'Renewal Reminder SMS', channel: 'sms' },
      { id: 's4', delay: '7 days later', delayDays: 15, template: 'Final Renewal Push', channel: 'email' },
    ],
  },
  {
    id: 'DRP-003', name: 'CB Prevention Escalation', trigger: 'CB rate crosses 0.5%', status: 'active', enrolled: 14, completed: 9, conversionRate: 0.42,
    steps: [
      { id: 's1', delay: 'Immediately', delayDays: 0, template: 'Chargeback Prevention Guide', channel: 'email' },
      { id: 's2', delay: '3 days later', delayDays: 3, template: 'CB Check-In SMS', channel: 'sms' },
      { id: 's3', delay: '7 days later', delayDays: 7, template: 'CB Action Plan', channel: 'email' },
    ],
  },
  {
    id: 'DRP-004', name: 'Win-Back Dormant Merchants', trigger: 'No processing 14+ days', status: 'draft', enrolled: 0, completed: 0, conversionRate: 0,
    steps: [
      { id: 's1', delay: 'Immediately', delayDays: 0, template: 'Re-engagement Check', channel: 'email' },
      { id: 's2', delay: '3 days later', delayDays: 3, template: 'We Miss You SMS', channel: 'sms' },
      { id: 's3', delay: '5 days later', delayDays: 5, template: 'Special Offer', channel: 'email' },
      { id: 's4', delay: '7 days later', delayDays: 7, template: 'Final Check-In', channel: 'sms' },
    ],
  },
];

// ── Engagement → Health Score Impact ──
interface EngagementHealthImpact {
  merchant: string;
  engagementScore: number;
  healthScore: number;
  healthDelta: number;
  openRate: number;
  responseRate: number;
  lastEngaged: string;
  segment: string;
}

const ENGAGEMENT_HEALTH: EngagementHealthImpact[] = [
  { merchant: 'Havana Bites Cafe', engagementScore: 92, healthScore: 87, healthDelta: 5, openRate: 0.85, responseRate: 0.45, lastEngaged: '2026-04-14', segment: 'Growth' },
  { merchant: 'SoBe Cycle & Fitness', engagementScore: 78, healthScore: 74, healthDelta: 3, openRate: 0.72, responseRate: 0.28, lastEngaged: '2026-04-13', segment: 'Growth' },
  { merchant: 'Coral Reef Auto Spa', engagementScore: 65, healthScore: 68, healthDelta: 2, openRate: 0.60, responseRate: 0.15, lastEngaged: '2026-04-14', segment: 'Stable' },
  { merchant: 'Doral Fresh Market', engagementScore: 71, healthScore: 62, healthDelta: 4, openRate: 0.65, responseRate: 0.30, lastEngaged: '2026-04-14', segment: 'At Risk' },
  { merchant: 'Kendall Pet Grooming', engagementScore: 88, healthScore: 82, healthDelta: 6, openRate: 0.80, responseRate: 0.40, lastEngaged: '2026-04-10', segment: 'Growth' },
  { merchant: 'Midtown Taqueria', engagementScore: 25, healthScore: 45, healthDelta: -3, openRate: 0.20, responseRate: 0, lastEngaged: '2026-03-28', segment: 'At Risk' },
  { merchant: 'Little Havana Barbershop', engagementScore: 18, healthScore: 38, healthDelta: -5, openRate: 0.10, responseRate: 0, lastEngaged: '2026-03-15', segment: 'Critical' },
  { merchant: 'Palmetto Bay Bakery', engagementScore: 55, healthScore: 71, healthDelta: 1, openRate: 0.50, responseRate: 0.12, lastEngaged: '2026-04-11', segment: 'Stable' },
];

// ── Helpers ──
const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 });
const fmtPct = (n: number) => `${(n * 100).toFixed(1)}%`;
const fmtDate = (d: string) => d ? new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—';

const channelIcon: Record<Channel, { icon: React.ElementType; label: string; bg: string; text: string }> = {
  email: { icon: Mail, label: 'Email', bg: 'bg-blue-50', text: 'text-blue-700' },
  sms: { icon: MessageSquare, label: 'SMS', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  portal_cta: { icon: MousePointerClick, label: 'Portal CTA', bg: 'bg-purple-50', text: 'text-purple-700' },
};

const statusConfig: Record<CampaignStatus, { label: string; bg: string; text: string; dot: string }> = {
  active: { label: 'Active', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  completed: { label: 'Completed', bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
  draft: { label: 'Draft', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  paused: { label: 'Paused', bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
};

const eventStatusConfig: Record<string, { label: string; color: string }> = {
  delivered: { label: 'Delivered', color: 'text-gray-500' },
  opened: { label: 'Opened', color: 'text-blue-600' },
  clicked: { label: 'Clicked', color: 'text-purple-600' },
  responded: { label: 'Responded', color: 'text-emerald-600' },
  bounced: { label: 'Bounced', color: 'text-red-600' },
};

// ══════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════
export function BackendOutreach() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'bulk' | 'triggers' | 'drips' | 'portal' | 'activity'>('dashboard');
  const [search, setSearch] = useState('');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [agentFilter, setAgentFilter] = useState<string>('all');
  const [bulkSegment, setBulkSegment] = useState('');
  const [bulkTemplate, setBulkTemplate] = useState('');
  const [bulkChannel, setBulkChannel] = useState<Channel>('email');
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<string | null>(null);
  const [editingDrip, setEditingDrip] = useState<string | null>(null);

  // ── Aggregate metrics ──
  const metrics = useMemo(() => {
    const activeCampaigns = CAMPAIGNS.filter(c => c.status !== 'draft');
    const totalSent = activeCampaigns.reduce((s, c) => s + c.delivered, 0);
    const totalOpened = activeCampaigns.reduce((s, c) => s + c.opened, 0);
    const totalClicked = activeCampaigns.reduce((s, c) => s + c.clicked, 0);
    const totalResponded = activeCampaigns.reduce((s, c) => s + c.responded, 0);
    const totalOptOut = activeCampaigns.reduce((s, c) => s + c.optedOut, 0);

    const byChannel: Record<Channel, { sent: number; opened: number; clicked: number; responded: number }> = {
      email: { sent: 0, opened: 0, clicked: 0, responded: 0 },
      sms: { sent: 0, opened: 0, clicked: 0, responded: 0 },
      portal_cta: { sent: 0, opened: 0, clicked: 0, responded: 0 },
    };
    activeCampaigns.forEach(c => {
      byChannel[c.channel].sent += c.delivered;
      byChannel[c.channel].opened += c.opened;
      byChannel[c.channel].clicked += c.clicked;
      byChannel[c.channel].responded += c.responded;
    });

    return {
      totalSent, totalOpened, totalClicked, totalResponded, totalOptOut,
      openRate: totalSent > 0 ? totalOpened / totalSent : 0,
      clickRate: totalSent > 0 ? totalClicked / totalSent : 0,
      responseRate: totalSent > 0 ? totalResponded / totalSent : 0,
      byChannel,
    };
  }, []);

  const filteredCampaigns = useMemo(() => {
    let list = CAMPAIGNS;
    if (channelFilter !== 'all') list = list.filter(c => c.channel === channelFilter);
    if (agentFilter !== 'all') list = list.filter(c => c.agent === agentFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c => c.name.toLowerCase().includes(q) || c.template.toLowerCase().includes(q) || c.segment.toLowerCase().includes(q));
    }
    return list;
  }, [channelFilter, agentFilter, search]);

  const tabs = [
    { key: 'dashboard' as const, label: 'Campaign Dashboard', icon: BarChart3 },
    { key: 'bulk' as const, label: 'Bulk Send', icon: Send },
    { key: 'triggers' as const, label: 'Automation Rules', icon: Zap, badge: AUTO_TRIGGERS.filter(t => t.status === 'active').length },
    { key: 'drips' as const, label: 'Drip Sequences', icon: GitMerge, badge: DRIP_SEQUENCES.filter(d => d.status === 'active').length },
    { key: 'portal' as const, label: 'Portal CTAs', icon: MousePointerClick },
    { key: 'activity' as const, label: 'Agent Activity', icon: Activity },
  ];

  const segments = [
    { label: 'Growth tier, CB rate > 0.5%', count: 23 },
    { label: 'MCA > 80% repaid', count: 31 },
    { label: 'Volume drop > 20% MoM', count: 18 },
    { label: 'Onboarded < 30 days', count: 12 },
    { label: 'Terminal age > 3 yrs', count: 47 },
    { label: 'Dormant 14+ days', count: 5 },
    { label: 'All active merchants', count: 312 },
  ];

  const templates = [
    'Renewal Offer v2', 'Chargeback Prevention Guide', 'Volume Check-In SMS',
    'Welcome Drip 1/3', 'Lease Upgrade v1', 'Stacking Warning SMS',
    'Monthly Residual Statement', 'Re-engagement Check',
  ];

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-[1440px] mx-auto px-6 py-6 space-y-5">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Outreach</h1>
            <p className="text-sm text-gray-500 mt-0.5">Campaign management, automated outreach & engagement analytics</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="flex items-center gap-1.5 text-emerald-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {AUTO_TRIGGERS.filter(t => t.status === 'active').length} automations live
              </span>
            </div>
            <Button icon={<Plus />}>New Campaign</Button>
          </div>
        </div>

        {/* ── Top KPIs ── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Total Sent', value: metrics.totalSent.toLocaleString(), accent: 'border-t-brand', sub: `${CAMPAIGNS.filter(c => c.status !== 'draft').length} campaigns` },
            { label: 'Open Rate', value: fmtPct(metrics.openRate), accent: 'border-t-blue-500', sub: `${metrics.totalOpened.toLocaleString()} opened` },
            { label: 'Click Rate', value: fmtPct(metrics.clickRate), accent: 'border-t-purple-500', sub: `${metrics.totalClicked.toLocaleString()} clicks` },
            { label: 'Response Rate', value: fmtPct(metrics.responseRate), accent: 'border-t-emerald-500', sub: `${metrics.totalResponded} responses` },
            { label: 'Opt-Out', value: metrics.totalOptOut.toString(), accent: 'border-t-red-500', sub: `${metrics.totalSent > 0 ? fmtPct(metrics.totalOptOut / metrics.totalSent) : '0%'} rate` },
          ].map((kpi, i) => (
            <div key={i} className={`bg-white rounded-[8px] border border-gray-200 border-t-2 ${kpi.accent} p-4`}>
              <p className="text-[11px] text-gray-500 uppercase tracking-wide font-medium mb-1.5">{kpi.label}</p>
              <p className="text-xl font-bold text-gray-900 leading-none">{kpi.value}</p>
              <p className="text-xs text-gray-400 mt-1.5">{kpi.sub}</p>
            </div>
          ))}
        </div>

        {/* ── Tab Nav ── */}
        <Tabs
          active={activeTab}
          onChange={setActiveTab}
          tabs={tabs.map(t => ({ id: t.key, label: t.label, icon: <t.icon />, count: t.badge }))}
        />

        {/* ════════════════════════════════════════ */}
        {/* CAMPAIGN DASHBOARD TAB                  */}
        {/* ════════════════════════════════════════ */}
        {activeTab === 'dashboard' && (
          <div className="space-y-5">
            {/* Channel Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(['email', 'sms', 'portal_cta'] as Channel[]).map(ch => {
                const c = channelIcon[ch];
                const data = metrics.byChannel[ch];
                const Icon = c.icon;
                return (
                  <div key={ch} className="bg-white rounded-[8px] border border-gray-200 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`w-8 h-8 rounded-[8px] ${c.bg} flex items-center justify-center`}>
                        <Icon className={`w-4 h-4 ${c.text}`} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{c.label}</p>
                        <p className="text-[10px] text-gray-400">{data.sent.toLocaleString()} delivered</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center py-2 bg-gray-50 rounded-[8px]">
                        <p className="text-xs font-bold text-gray-900">{data.sent > 0 ? fmtPct(data.opened / data.sent) : '—'}</p>
                        <p className="text-[9px] text-gray-400">Open</p>
                      </div>
                      <div className="text-center py-2 bg-gray-50 rounded-[8px]">
                        <p className="text-xs font-bold text-gray-900">{data.sent > 0 ? fmtPct(data.clicked / data.sent) : '—'}</p>
                        <p className="text-[9px] text-gray-400">Click</p>
                      </div>
                      <div className="text-center py-2 bg-gray-50 rounded-[8px]">
                        <p className="text-xs font-bold text-gray-900">{data.sent > 0 ? fmtPct(data.responded / data.sent) : '—'}</p>
                        <p className="text-[9px] text-gray-400">Response</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search campaigns, templates, segments..."
                  className="w-full pl-8 pr-3 py-[7px] bg-white border border-gray-200 rounded-[8px] text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
              </div>
              <div className="flex items-center gap-1.5">
                {['all', 'email', 'sms', 'portal_cta'].map(ch => (
                  <button key={ch} onClick={() => setChannelFilter(ch)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-[8px] transition-colors ${
                      channelFilter === ch ? 'bg-brand text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}>
                    {ch === 'all' ? 'All' : channelIcon[ch as Channel].label}
                  </button>
                ))}
              </div>
              <select value={agentFilter} onChange={e => setAgentFilter(e.target.value)}
                className="px-3 py-[7px] bg-white border border-gray-200 rounded-[8px] text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand/20">
                <option value="all">All Agents</option>
                <option value="Sarah M.">Sarah M.</option>
                <option value="Lyndon R.">Lyndon R.</option>
                <option value="John D.">John D.</option>
                <option value="System">System</option>
              </select>
            </div>

            {/* Campaign Table */}
            <div className="bg-white rounded-[8px] border border-gray-200">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px]">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <Th className="pl-5">Campaign</Th>
                      <Th>Channel</Th>
                      <Th>Segment</Th>
                      <Th>Status</Th>
                      <Th>Sent</Th>
                      <Th>Open Rate</Th>
                      <Th>Click Rate</Th>
                      <Th>Response</Th>
                      <Th className="pr-5">Agent</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCampaigns.map(c => {
                      const ch = channelIcon[c.channel];
                      const st = statusConfig[c.status];
                      const ChIcon = ch.icon;
                      return (
                        <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                          <td className="pl-5 py-2.5">
                            <p className="text-sm font-medium text-gray-900">{c.name}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">{c.template} &bull; {c.sentDate ? fmtDate(c.sentDate) : 'Not sent'}</p>
                          </td>
                          <td className="py-2.5">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${ch.bg} ${ch.text}`}>
                              <ChIcon className="w-3 h-3" />{ch.label}
                            </span>
                          </td>
                          <td className="py-2.5 text-xs text-gray-600 max-w-[160px] truncate">{c.segment}</td>
                          <td className="py-2.5">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold ${st.bg} ${st.text}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />{st.label}
                            </span>
                          </td>
                          <td className="py-2.5 text-sm tabular-nums text-gray-900 font-medium">{c.delivered > 0 ? c.delivered.toLocaleString() : '—'}</td>
                          <td className="py-2.5 text-sm tabular-nums font-medium">
                            {c.delivered > 0 ? (
                              <span className={c.opened / c.delivered > 0.5 ? 'text-emerald-600' : c.opened / c.delivered > 0.3 ? 'text-amber-600' : 'text-red-600'}>
                                {fmtPct(c.opened / c.delivered)}
                              </span>
                            ) : '—'}
                          </td>
                          <td className="py-2.5 text-sm tabular-nums font-medium">
                            {c.delivered > 0 ? (
                              <span className={c.clicked / c.delivered > 0.2 ? 'text-emerald-600' : c.clicked / c.delivered > 0.1 ? 'text-amber-600' : 'text-gray-500'}>
                                {fmtPct(c.clicked / c.delivered)}
                              </span>
                            ) : '—'}
                          </td>
                          <td className="py-2.5 text-sm tabular-nums font-medium">
                            {c.responded > 0 ? <span className="text-emerald-600">{c.responded}</span> : <span className="text-gray-400">0</span>}
                          </td>
                          <td className="pr-5 py-2.5 text-xs text-gray-600">{c.agent}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Outreach Events */}
            <div className="bg-white rounded-[8px] border border-gray-200">
              <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-900">Recent Outreach History</h3>
                <span className="text-[10px] text-gray-400 ml-auto">Last 10 events</span>
              </div>
              <div className="divide-y divide-gray-50">
                {OUTREACH_EVENTS.map(ev => {
                  const ch = channelIcon[ev.channel];
                  const st = eventStatusConfig[ev.status];
                  const ChIcon = ch.icon;
                  return (
                    <div key={ev.id} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50/50">
                      <div className={`w-7 h-7 rounded-full ${ch.bg} flex items-center justify-center shrink-0`}>
                        <ChIcon className={`w-3.5 h-3.5 ${ch.text}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-gray-900 font-medium truncate">{ev.merchant}</p>
                          <span className={`text-[10px] font-semibold ${st.color}`}>{st.label}</span>
                        </div>
                        <p className="text-[10px] text-gray-400 truncate">{ev.template} &bull; {ev.agent} &bull; {ev.sentAt}</p>
                        {ev.responseSnippet && (
                          <p className="text-xs text-emerald-700 bg-emerald-50 rounded px-2 py-1 mt-1 truncate">"{ev.responseSnippet}"</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════ */}
        {/* BULK SEND TAB                           */}
        {/* ════════════════════════════════════════ */}
        {activeTab === 'bulk' && (
          <div className="space-y-5">
            <div className="bg-gradient-to-r from-brand-50 to-purple-50 rounded-[8px] border border-brand-200 p-4 flex items-start gap-3">
              <Layers className="w-5 h-5 text-brand mt-0.5 shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-gray-900">Segmented Bulk Campaigns</h3>
                <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                  Select a merchant segment, choose a template, pick a channel, and send to all matching merchants at once.
                  Track delivery and engagement per merchant in the campaign view.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Builder */}
              <div className="lg:col-span-2 bg-white rounded-[8px] border border-gray-200">
                <div className="px-5 py-3.5 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900">Build Campaign</h3>
                </div>
                <div className="px-5 py-5 space-y-5">
                  {/* Step 1: Segment */}
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold mb-2 block">1. Select Merchant Segment</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {segments.map((seg, i) => (
                        <button key={i} onClick={() => setBulkSegment(seg.label)}
                          className={`text-left px-3 py-2.5 rounded-[8px] border transition-all ${
                            bulkSegment === seg.label
                              ? 'border-brand bg-brand/5 ring-1 ring-brand/20'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}>
                          <p className="text-sm text-gray-900 font-medium">{seg.label}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{seg.count} merchants</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Step 2: Template */}
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold mb-2 block">2. Choose Template</label>
                    <div className="flex items-center gap-2">
                      <select value={bulkTemplate} onChange={e => setBulkTemplate(e.target.value)}
                        className="flex-1 px-3 py-2.5 bg-white border border-gray-200 rounded-[8px] text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand">
                        <option value="">Select a template...</option>
                        {templates.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      {bulkTemplate && TEMPLATE_PREVIEWS[bulkTemplate] && (
                        <button onClick={() => setPreviewTemplate(bulkTemplate)} className="px-3 py-2.5 border border-gray-200 rounded-[8px] text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-1.5 shrink-0">
                          <Eye className="w-4 h-4" /> Preview
                        </button>
                      )}
                    </div>
                    {/* Inline Template Preview */}
                    {bulkTemplate && TEMPLATE_PREVIEWS[bulkTemplate] && (
                      <div className="mt-3 border border-gray-200 rounded-[8px] overflow-hidden">
                        <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {TEMPLATE_PREVIEWS[bulkTemplate].channel === 'email' ? <Mail className="w-3.5 h-3.5 text-blue-600" /> : <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />}
                            <span className="text-xs font-semibold text-gray-700">{bulkTemplate}</span>
                          </div>
                          <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${TEMPLATE_PREVIEWS[bulkTemplate].channel === 'email' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'}`}>
                            {TEMPLATE_PREVIEWS[bulkTemplate].channel === 'email' ? 'Email' : 'SMS'}
                          </span>
                        </div>
                        {TEMPLATE_PREVIEWS[bulkTemplate].subject && (
                          <div className="px-3 py-2 border-b border-gray-100 bg-white">
                            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Subject</p>
                            <p className="text-sm text-gray-900 font-medium">{TEMPLATE_PREVIEWS[bulkTemplate].subject}</p>
                          </div>
                        )}
                        <div className="px-3 py-3 bg-white max-h-[180px] overflow-y-auto">
                          <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{TEMPLATE_PREVIEWS[bulkTemplate].body}</pre>
                        </div>
                        <div className="px-3 py-2 bg-gray-50 border-t border-gray-100">
                          <p className="text-[9px] text-gray-400">Merge fields like {'{{merchant_name}}'} will be auto-populated per recipient</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Step 3: Channel */}
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold mb-2 block">3. Channel</label>
                    <div className="flex items-center gap-2">
                      {(['email', 'sms'] as Channel[]).map(ch => {
                        const c = channelIcon[ch];
                        const Icon = c.icon;
                        return (
                          <button key={ch} onClick={() => setBulkChannel(ch)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-[8px] border text-sm font-medium transition-all ${
                              bulkChannel === ch
                                ? 'border-brand bg-brand/5 text-brand ring-1 ring-brand/20'
                                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}>
                            <Icon className="w-4 h-4" />{c.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Send Button */}
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      {bulkSegment && (
                        <p className="text-xs text-gray-500">
                          Sending to <span className="font-bold text-gray-900">{segments.find(s => s.label === bulkSegment)?.count || 0}</span> merchants
                          {bulkTemplate && <> using <span className="font-semibold text-brand">{bulkTemplate}</span></>}
                        </p>
                      )}
                    </div>
                    <Button
                      size="lg"
                      icon={<Send />}
                      onClick={() => bulkSegment && bulkTemplate && setShowBulkConfirm(true)}
                      disabled={!bulkSegment || !bulkTemplate}
                    >
                      Send Campaign
                    </Button>
                  </div>
                </div>
              </div>

              {/* Recent Campaigns Sidebar */}
              <div className="bg-white rounded-[8px] border border-gray-200">
                <div className="px-5 py-3.5 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900">Recent Campaigns</h3>
                </div>
                <div className="divide-y divide-gray-50">
                  {CAMPAIGNS.filter(c => c.status !== 'draft').slice(0, 6).map(c => {
                    const st = statusConfig[c.status];
                    return (
                      <div key={c.id} className="px-5 py-3">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-gray-900 truncate pr-2">{c.name}</p>
                          <span className={`shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold ${st.bg} ${st.text}`}>
                            <span className={`w-1 h-1 rounded-full ${st.dot}`} />{st.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-gray-400">
                          <span>{c.delivered} sent</span>
                          <span>{c.delivered > 0 ? fmtPct(c.opened / c.delivered) : '—'} open</span>
                          <span>{c.responded} responses</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════ */}
        {/* AUTOMATION RULES TAB                    */}
        {/* ════════════════════════════════════════ */}
        {activeTab === 'triggers' && (
          <div className="space-y-5">
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-[8px] border border-amber-200 p-4 flex items-start gap-3">
              <Zap className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-gray-900">Triggered Outreach Automation</h3>
                <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                  Rules engine: set conditions that auto-fire outreach when merchant metrics cross thresholds.
                  This is where the CRM starts working <strong>for</strong> you instead of you working the CRM.
                </p>
              </div>
              <Button size="sm" icon={<Plus />} className="ml-auto shrink-0">New Rule</Button>
            </div>

            {/* Trigger KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white rounded-[8px] border border-gray-200 border-t-2 border-t-emerald-500 p-4">
                <p className="text-[11px] text-gray-500 uppercase tracking-wide font-medium mb-1">Active Rules</p>
                <p className="text-xl font-bold text-gray-900">{AUTO_TRIGGERS.filter(t => t.status === 'active').length}</p>
              </div>
              <div className="bg-white rounded-[8px] border border-gray-200 border-t-2 border-t-brand p-4">
                <p className="text-[11px] text-gray-500 uppercase tracking-wide font-medium mb-1">Total Fired</p>
                <p className="text-xl font-bold text-gray-900">{AUTO_TRIGGERS.reduce((s, t) => s + t.firedCount, 0)}</p>
              </div>
              <div className="bg-white rounded-[8px] border border-gray-200 border-t-2 border-t-purple-500 p-4">
                <p className="text-[11px] text-gray-500 uppercase tracking-wide font-medium mb-1">Avg Conversion</p>
                <p className="text-xl font-bold text-gray-900">{fmtPct(AUTO_TRIGGERS.filter(t => t.firedCount > 0).reduce((s, t) => s + t.conversionRate, 0) / AUTO_TRIGGERS.filter(t => t.firedCount > 0).length)}</p>
              </div>
              <div className="bg-white rounded-[8px] border border-gray-200 border-t-2 border-t-amber-500 p-4">
                <p className="text-[11px] text-gray-500 uppercase tracking-wide font-medium mb-1">Paused / Draft</p>
                <p className="text-xl font-bold text-gray-900">{AUTO_TRIGGERS.filter(t => t.status !== 'active').length}</p>
              </div>
            </div>

            {/* Rules Cards */}
            <div className="space-y-3">
              {AUTO_TRIGGERS.map(trigger => {
                const ch = channelIcon[trigger.channel];
                const ChIcon = ch.icon;
                const isActive = trigger.status === 'active';
                const isPaused = trigger.status === 'paused';
                return (
                  <div key={trigger.id} className={`bg-white rounded-[8px] border ${isActive ? 'border-gray-200' : isPaused ? 'border-red-200' : 'border-dashed border-gray-300'} p-5`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2.5 mb-2">
                          <Zap className={`w-4 h-4 ${isActive ? 'text-amber-500' : 'text-gray-400'}`} />
                          <h4 className="text-sm font-bold text-gray-900">{trigger.name}</h4>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            isActive ? 'bg-emerald-50 text-emerald-700' : isPaused ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {trigger.status.charAt(0).toUpperCase() + trigger.status.slice(1)}
                          </span>
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold ${ch.bg} ${ch.text}`}>
                            <ChIcon className="w-3 h-3" />{ch.label}
                          </span>
                        </div>
                        <div className="flex items-start gap-6 ml-6.5 text-xs">
                          <div>
                            <p className="text-gray-400 uppercase text-[9px] tracking-wide font-bold mb-1">When</p>
                            <p className="text-gray-700 font-medium">{trigger.condition}</p>
                            <p className="text-gray-400 text-[10px] mt-0.5">{trigger.conditionDetail}</p>
                          </div>
                          <div className="shrink-0">
                            <p className="text-gray-400 uppercase text-[9px] tracking-wide font-bold mb-1">Then</p>
                            <p className="text-gray-700 font-medium">{trigger.action}</p>
                            <p className="text-gray-400 text-[10px] mt-0.5">Template: {trigger.template}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-4">
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900 tabular-nums">{trigger.firedCount}</p>
                          <p className="text-[9px] text-gray-400">times fired</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-bold tabular-nums ${trigger.conversionRate >= 0.5 ? 'text-emerald-600' : trigger.conversionRate > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                            {trigger.firedCount > 0 ? fmtPct(trigger.conversionRate) : '—'}
                          </p>
                          <p className="text-[9px] text-gray-400">conversion</p>
                        </div>
                        <button className={`p-2 rounded-[8px] border transition-colors ${
                          isActive ? 'border-gray-200 text-gray-500 hover:bg-gray-50' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                        }`}>
                          {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    {trigger.lastFired && (
                      <p className="text-[10px] text-gray-400 mt-2 ml-6.5">Last fired: {fmtDate(trigger.lastFired)}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════ */}
        {/* DRIP SEQUENCES TAB                      */}
        {/* ════════════════════════════════════════ */}
        {activeTab === 'drips' && (
          <div className="space-y-5">
            <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-[8px] border border-cyan-200 p-4 flex items-start gap-3">
              <GitMerge className="w-5 h-5 text-cyan-600 mt-0.5 shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-gray-900">Drip Sequence Builder</h3>
                <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                  Create multi-step automated campaigns that nurture merchants over time. Each sequence is triggered by a condition and sends messages at defined intervals.
                </p>
              </div>
              <Button size="sm" icon={<Plus />} className="ml-auto shrink-0">New Sequence</Button>
            </div>

            {/* Drip KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white rounded-[8px] border border-gray-200 border-t-2 border-t-cyan-500 p-4">
                <p className="text-[11px] text-gray-500 uppercase tracking-wide font-medium mb-1">Active Sequences</p>
                <p className="text-xl font-bold text-gray-900">{DRIP_SEQUENCES.filter(d => d.status === 'active').length}</p>
              </div>
              <div className="bg-white rounded-[8px] border border-gray-200 border-t-2 border-t-brand p-4">
                <p className="text-[11px] text-gray-500 uppercase tracking-wide font-medium mb-1">Currently Enrolled</p>
                <p className="text-xl font-bold text-gray-900">{DRIP_SEQUENCES.reduce((s, d) => s + d.enrolled, 0)}</p>
              </div>
              <div className="bg-white rounded-[8px] border border-gray-200 border-t-2 border-t-emerald-500 p-4">
                <p className="text-[11px] text-gray-500 uppercase tracking-wide font-medium mb-1">Completed</p>
                <p className="text-xl font-bold text-gray-900">{DRIP_SEQUENCES.reduce((s, d) => s + d.completed, 0)}</p>
              </div>
              <div className="bg-white rounded-[8px] border border-gray-200 border-t-2 border-t-purple-500 p-4">
                <p className="text-[11px] text-gray-500 uppercase tracking-wide font-medium mb-1">Avg Conversion</p>
                <p className="text-xl font-bold text-gray-900">{fmtPct(DRIP_SEQUENCES.filter(d => d.enrolled > 0).reduce((s, d) => s + d.conversionRate, 0) / Math.max(DRIP_SEQUENCES.filter(d => d.enrolled > 0).length, 1))}</p>
              </div>
            </div>

            {/* Sequence Cards */}
            <div className="space-y-4">
              {DRIP_SEQUENCES.map(drip => {
                const isExpanded = editingDrip === drip.id;
                const isActive = drip.status === 'active';
                return (
                  <div key={drip.id} className={`bg-white rounded-[8px] border ${isActive ? 'border-gray-200' : 'border-dashed border-gray-300'}`}>
                    {/* Header */}
                    <div className="px-5 py-4 flex items-center justify-between cursor-pointer" onClick={() => setEditingDrip(isExpanded ? null : drip.id)}>
                      <div className="flex items-center gap-3">
                        <GitMerge className={`w-5 h-5 ${isActive ? 'text-cyan-500' : 'text-gray-400'}`} />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-gray-900">{drip.name}</h4>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              isActive ? 'bg-emerald-50 text-emerald-700' : drip.status === 'paused' ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-500'
                            }`}>{drip.status.charAt(0).toUpperCase() + drip.status.slice(1)}</span>
                            <span className="text-[10px] text-gray-400">{drip.steps.length} steps</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">Trigger: {drip.trigger}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-5">
                        <div className="text-center"><p className="text-lg font-bold text-gray-900 tabular-nums">{drip.enrolled}</p><p className="text-[9px] text-gray-400">Enrolled</p></div>
                        <div className="text-center"><p className="text-lg font-bold text-emerald-600 tabular-nums">{drip.completed}</p><p className="text-[9px] text-gray-400">Completed</p></div>
                        <div className="text-center"><p className={`text-lg font-bold tabular-nums ${drip.conversionRate >= 0.5 ? 'text-emerald-600' : drip.conversionRate > 0 ? 'text-amber-600' : 'text-gray-400'}`}>{drip.enrolled > 0 ? fmtPct(drip.conversionRate) : '—'}</p><p className="text-[9px] text-gray-400">Conv Rate</p></div>
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </div>
                    </div>

                    {/* Expanded: Step Builder */}
                    {isExpanded && (
                      <div className="px-5 pb-5 border-t border-gray-100 pt-4">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-3">Sequence Steps</p>
                        <div className="space-y-0">
                          {drip.steps.map((step, idx) => {
                            const ch = channelIcon[step.channel];
                            const StepIcon = ch.icon;
                            const preview = TEMPLATE_PREVIEWS[step.template];
                            return (
                              <div key={step.id}>
                                {/* Connector Line */}
                                {idx > 0 && (
                                  <div className="flex items-center gap-3 ml-5 py-1">
                                    <div className="w-px h-6 bg-gray-200" />
                                    <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                                      <Clock className="w-3 h-3" /> Wait {step.delay}
                                    </div>
                                  </div>
                                )}
                                {/* Step Card */}
                                <div className="flex items-start gap-3">
                                  <div className={`w-10 h-10 rounded-full ${ch.bg} flex items-center justify-center shrink-0 mt-1`}>
                                    <StepIcon className={`w-4 h-4 ${ch.text}`} />
                                  </div>
                                  <div className="flex-1 border border-gray-200 rounded-[8px] overflow-hidden">
                                    <div className="px-3 py-2.5 bg-gray-50 flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-gray-900">Step {idx + 1}</span>
                                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${ch.bg} ${ch.text}`}>{ch.label}</span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <button className="p-1 hover:bg-gray-200 rounded"><GripVertical className="w-3 h-3 text-gray-400" /></button>
                                        <button className="p-1 hover:bg-red-50 rounded"><Trash2 className="w-3 h-3 text-gray-400 hover:text-red-500" /></button>
                                      </div>
                                    </div>
                                    <div className="px-3 py-2.5">
                                      <p className="text-sm font-medium text-gray-900">{step.template}</p>
                                      {preview && (
                                        <div className="mt-2 bg-gray-50 rounded px-2.5 py-2 text-xs text-gray-600 max-h-[80px] overflow-hidden relative">
                                          {preview.subject && <p className="font-medium text-gray-800 mb-1">Subject: {preview.subject}</p>}
                                          <p className="line-clamp-2 whitespace-pre-wrap">{preview.body.substring(0, 150)}...</p>
                                          <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-gray-50 to-transparent" />
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <button className="mt-3 ml-13 text-sm text-brand hover:underline font-medium flex items-center gap-1.5">
                          <Plus className="w-3.5 h-3.5" /> Add Step
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════ */}
        {/* PORTAL CTA TAB                          */}
        {/* ════════════════════════════════════════ */}
        {activeTab === 'portal' && (
          <div className="space-y-5">
            <div className="bg-gradient-to-r from-purple-50 to-brand-50 rounded-[8px] border border-purple-200 p-4 flex items-start gap-3">
              <MousePointerClick className="w-5 h-5 text-purple-600 mt-0.5 shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-gray-900">Portal CTA Performance</h3>
                <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                  Portfolio-level analytics for all merchant portal prompts. See which CTAs convert, which merchants engage, and A/B test different copy and placement.
                </p>
              </div>
            </div>

            {/* CTA KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white rounded-[8px] border border-gray-200 border-t-2 border-t-purple-500 p-4">
                <p className="text-[11px] text-gray-500 uppercase tracking-wide font-medium mb-1">Total Impressions</p>
                <p className="text-xl font-bold text-gray-900 tabular-nums">{PORTAL_CTAS.reduce((s, c) => s + c.impressions, 0).toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-[8px] border border-gray-200 border-t-2 border-t-brand p-4">
                <p className="text-[11px] text-gray-500 uppercase tracking-wide font-medium mb-1">Total Clicks</p>
                <p className="text-xl font-bold text-gray-900 tabular-nums">{PORTAL_CTAS.reduce((s, c) => s + c.clicks, 0)}</p>
              </div>
              <div className="bg-white rounded-[8px] border border-gray-200 border-t-2 border-t-emerald-500 p-4">
                <p className="text-[11px] text-gray-500 uppercase tracking-wide font-medium mb-1">Conversions</p>
                <p className="text-xl font-bold text-gray-900 tabular-nums">{PORTAL_CTAS.reduce((s, c) => s + c.conversions, 0)}</p>
              </div>
              <div className="bg-white rounded-[8px] border border-gray-200 border-t-2 border-t-amber-500 p-4">
                <p className="text-[11px] text-gray-500 uppercase tracking-wide font-medium mb-1">Avg CTR</p>
                <p className="text-xl font-bold text-gray-900 tabular-nums">{fmtPct(PORTAL_CTAS.reduce((s, c) => s + c.clicks, 0) / PORTAL_CTAS.reduce((s, c) => s + c.impressions, 0))}</p>
              </div>
            </div>

            {/* CTA Table */}
            <div className="bg-white rounded-[8px] border border-gray-200">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <Th className="pl-5">CTA Name</Th>
                      <Th>Placement</Th>
                      <Th>Variant</Th>
                      <Th>Impressions</Th>
                      <Th>Clicks</Th>
                      <Th>CTR</Th>
                      <Th>Conversions</Th>
                      <Th>Conv Rate</Th>
                      <Th className="pr-5">Status</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {PORTAL_CTAS.sort((a, b) => b.ctr - a.ctr).map(cta => (
                      <tr key={cta.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <td className="pl-5 py-2.5 text-sm font-medium text-gray-900">{cta.name}</td>
                        <td className="py-2.5 text-xs text-gray-600">{cta.placement}</td>
                        <td className="py-2.5">
                          <span className={`text-xs font-semibold ${cta.variant.includes('B') ? 'text-emerald-600' : cta.variant.includes('A') ? 'text-blue-600' : 'text-gray-600'}`}>
                            {cta.variant}
                          </span>
                        </td>
                        <td className="py-2.5 text-sm tabular-nums text-gray-900">{cta.impressions.toLocaleString()}</td>
                        <td className="py-2.5 text-sm tabular-nums text-gray-900">{cta.clicks}</td>
                        <td className="py-2.5">
                          <span className={`text-sm tabular-nums font-medium ${cta.ctr >= 0.15 ? 'text-emerald-600' : cta.ctr >= 0.08 ? 'text-amber-600' : 'text-red-600'}`}>
                            {fmtPct(cta.ctr)}
                          </span>
                        </td>
                        <td className="py-2.5 text-sm tabular-nums font-medium text-emerald-600">{cta.conversions}</td>
                        <td className="py-2.5 text-sm tabular-nums font-medium">
                          <span className={cta.convRate >= 0.4 ? 'text-emerald-600' : 'text-amber-600'}>{fmtPct(cta.convRate)}</span>
                        </td>
                        <td className="pr-5 py-2.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            cta.status === 'live' ? 'bg-emerald-50 text-emerald-700' : cta.status === 'ab_test' ? 'bg-purple-50 text-purple-700' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {cta.status === 'ab_test' ? 'A/B Test' : cta.status.charAt(0).toUpperCase() + cta.status.slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* A/B Test Highlight */}
            {(() => {
              const varA = PORTAL_CTAS.find(c => c.variant.includes('A'));
              const varB = PORTAL_CTAS.find(c => c.variant.includes('B'));
              if (!varA || !varB) return null;
              const winner = varB.ctr > varA.ctr ? 'B' : 'A';
              const lift = Math.abs(varB.ctr - varA.ctr) / varA.ctr;
              return (
                <div className="bg-white rounded-[8px] border border-purple-200 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="w-4 h-4 text-purple-600" />
                    <h3 className="text-sm font-semibold text-gray-900">A/B Test: Rate Review Banner</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700">Running</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`rounded-[8px] border p-4 ${winner === 'A' ? 'border-emerald-300 bg-emerald-50/30' : 'border-gray-200'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-blue-600">Variant A (Blue)</span>
                        {winner === 'A' && <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">Winner</span>}
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div><p className="text-lg font-bold text-gray-900">{varA.impressions}</p><p className="text-[9px] text-gray-400">Impressions</p></div>
                        <div><p className="text-lg font-bold text-gray-900">{fmtPct(varA.ctr)}</p><p className="text-[9px] text-gray-400">CTR</p></div>
                        <div><p className="text-lg font-bold text-gray-900">{fmtPct(varA.convRate)}</p><p className="text-[9px] text-gray-400">Conv Rate</p></div>
                      </div>
                    </div>
                    <div className={`rounded-[8px] border p-4 ${winner === 'B' ? 'border-emerald-300 bg-emerald-50/30' : 'border-gray-200'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-emerald-600">Variant B (Green)</span>
                        {winner === 'B' && <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">Winner ↑{fmtPct(lift)} lift</span>}
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div><p className="text-lg font-bold text-gray-900">{varB.impressions}</p><p className="text-[9px] text-gray-400">Impressions</p></div>
                        <div><p className="text-lg font-bold text-gray-900">{fmtPct(varB.ctr)}</p><p className="text-[9px] text-gray-400">CTR</p></div>
                        <div><p className="text-lg font-bold text-gray-900">{fmtPct(varB.convRate)}</p><p className="text-[9px] text-gray-400">Conv Rate</p></div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ════════════════════════════════════════ */}
        {/* AGENT ACTIVITY TAB                      */}
        {/* ════════════════════════════════════════ */}
        {activeTab === 'activity' && (
          <div className="space-y-5">
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-[8px] border border-blue-200 p-4 flex items-start gap-3">
              <Users className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-gray-900">Agent Activity Feed</h3>
                <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                  Per-agent accountability view: all outreach sent, responses received, tasks created, and follow-ups completed.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {AGENT_ACTIVITY.map(agent => (
                <div key={agent.agent} className="bg-white rounded-[8px] border border-gray-200">
                  <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center">
                        <span className="text-sm font-bold text-brand">{agent.avatar}</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{agent.agent}</p>
                        <p className="text-[10px] text-gray-400">Avg response time: {agent.avgResponseTime}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {[
                        { label: 'Emails', value: agent.emailsSent, color: 'text-blue-600' },
                        { label: 'SMS', value: agent.smsSent, color: 'text-emerald-600' },
                        { label: 'Responses', value: agent.responses, color: 'text-purple-600' },
                        { label: 'Tasks', value: agent.tasksCreated, color: 'text-amber-600' },
                        { label: 'Follow-Ups', value: agent.followUpsCompleted, color: 'text-brand' },
                      ].map((m, i) => (
                        <div key={i} className="text-center">
                          <p className={`text-lg font-bold tabular-nums ${m.color}`}>{m.value}</p>
                          <p className="text-[9px] text-gray-400">{m.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="px-5 py-3">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-2">Recent Activity</p>
                    <div className="space-y-2">
                      {agent.recentActions.map((a, i) => {
                        const ch = channelIcon[a.channel];
                        const ChIcon = ch.icon;
                        return (
                          <div key={i} className="flex items-center gap-2.5 text-xs">
                            <ChIcon className={`w-3 h-3 ${ch.text} shrink-0`} />
                            <span className="text-gray-700">{a.action}</span>
                            <span className="text-gray-400">→</span>
                            <span className="text-gray-900 font-medium">{a.target}</span>
                            <span className="text-gray-400 ml-auto shrink-0">{a.time}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">
            {CAMPAIGNS.length} campaigns — {OUTREACH_EVENTS.length} outreach events — {AUTO_TRIGGERS.filter(t => t.status === 'active').length} active automations
          </p>
          <p className="text-xs text-gray-400"><span className="text-brand font-bold">delt</span>pay.com</p>
        </div>
      </div>

      {/* ═══ Template Preview Modal ═══ */}
      {previewTemplate && TEMPLATE_PREVIEWS[previewTemplate] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setPreviewTemplate(null)} />
          <div className="relative bg-white rounded-[8px] shadow-2xl border border-gray-200 w-full max-w-lg mx-4">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {TEMPLATE_PREVIEWS[previewTemplate].channel === 'email' ? <Mail className="w-4 h-4 text-blue-600" /> : <MessageSquare className="w-4 h-4 text-emerald-600" />}
                <h3 className="text-sm font-bold text-gray-900">{previewTemplate}</h3>
                <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${TEMPLATE_PREVIEWS[previewTemplate].channel === 'email' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'}`}>
                  {TEMPLATE_PREVIEWS[previewTemplate].channel === 'email' ? 'Email' : 'SMS'}
                </span>
              </div>
              <button onClick={() => setPreviewTemplate(null)} className="p-1 hover:bg-gray-100 rounded"><X className="w-4 h-4 text-gray-400" /></button>
            </div>
            {TEMPLATE_PREVIEWS[previewTemplate].subject && (
              <div className="px-5 py-3 border-b border-gray-100">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Subject Line</p>
                <p className="text-sm font-medium text-gray-900">{TEMPLATE_PREVIEWS[previewTemplate].subject}</p>
              </div>
            )}
            <div className="px-5 py-4 max-h-[400px] overflow-y-auto">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{TEMPLATE_PREVIEWS[previewTemplate].body}</pre>
            </div>
            <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 rounded-b-[8px] flex items-center justify-between">
              <p className="text-[10px] text-gray-400">Merge fields (e.g. {'{{merchant_name}}'}) auto-populated per recipient</p>
              <Button size="sm" onClick={() => setPreviewTemplate(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Bulk Send Confirmation Modal ═══ */}
      {showBulkConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowBulkConfirm(false)} />
          <div className="relative bg-white rounded-[8px] shadow-2xl border border-gray-200 w-full max-w-md mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center">
                <Send className="w-5 h-5 text-brand" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Confirm Send</h3>
                <p className="text-xs text-gray-500">This will send immediately</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-[8px] p-3 space-y-2 mb-5 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Segment:</span><span className="font-medium text-gray-900">{bulkSegment}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Template:</span><span className="font-medium text-gray-900">{bulkTemplate}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Channel:</span><span className="font-medium text-gray-900">{channelIcon[bulkChannel].label}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Recipients:</span><span className="font-bold text-brand">{segments.find(s => s.label === bulkSegment)?.count || 0} merchants</span></div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="secondary" onClick={() => setShowBulkConfirm(false)} className="flex-1">Cancel</Button>
              <Button onClick={() => setShowBulkConfirm(false)} icon={<Send />} className="flex-1">Send Now</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════
// SUB-COMPONENTS
// ══════════════════════════════════════
function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`py-2.5 px-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wide text-left ${className}`}>
      {children}
    </th>
  );
}
