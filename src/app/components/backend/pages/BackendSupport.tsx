import React, { useMemo, useState } from 'react';
import {
  LifeBuoy, Search, Plus, Clock, CheckCircle, AlertCircle, AlertTriangle,
  MessageSquare, Paperclip, User, Calendar, ChevronRight, Filter, Send,
  BookOpen, Phone, Mail, Tag, Activity, TrendingUp, TrendingDown,
  Inbox as InboxIcon, Star, Users, BarChart3, Zap, ArrowUpRight,
  CreditCard, DollarSign, Store, Settings as SettingsIcon, Shield,
  PlayCircle, RefreshCw,
} from 'lucide-react';

// ═══════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════

type TicketStatus = 'new' | 'open' | 'pending' | 'on_hold' | 'resolved' | 'closed';
type TicketPriority = 'urgent' | 'high' | 'normal' | 'low';
type TicketCategory =
  | 'funding'
  | 'deposits'
  | 'statements'
  | 'pricing'
  | 'terminal'
  | 'gateway'
  | 'pci'
  | 'chargeback'
  | 'underwriting'
  | 'onboarding'
  | 'account_change'
  | 'cancellation'
  | 'other';
type TicketChannel = 'email' | 'phone' | 'chat' | 'portal' | 'agent';

interface TicketNote {
  author: string;
  text: string;
  date: string;
  internal?: boolean;
}

interface Ticket {
  id: string;
  subject: string;
  merchant: string;
  merchantId: string;
  vertical: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  channel: TicketChannel;
  assignee: string;
  createdAt: string;
  updatedAt: string;
  firstResponseAt?: string;
  resolvedAt?: string;
  slaDueAt: string;
  hoursToSla: number;            // negative = breached
  tags: string[];
  description: string;
  notes: TicketNote[];
  attachments: number;
  csatScore?: 1 | 2 | 3 | 4 | 5;
  relatedDealId?: string;
}

interface KBArticle {
  id: string;
  title: string;
  category: TicketCategory;
  views: number;
  helpful: number;
  lastUpdated: string;
}

// ═══════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════

const statusConfig: Record<TicketStatus, { label: string; color: string; bg: string; dot: string }> = {
  new:      { label: 'New',       color: 'text-blue-700',    bg: 'bg-blue-50',    dot: 'bg-blue-500' },
  open:     { label: 'Open',      color: 'text-indigo-700',  bg: 'bg-indigo-50',  dot: 'bg-indigo-500' },
  pending:  { label: 'Pending',   color: 'text-amber-700',   bg: 'bg-amber-50',   dot: 'bg-amber-500' },
  on_hold:  { label: 'On Hold',   color: 'text-gray-700',    bg: 'bg-gray-100',   dot: 'bg-gray-400' },
  resolved: { label: 'Resolved',  color: 'text-emerald-700', bg: 'bg-emerald-50', dot: 'bg-emerald-500' },
  closed:   { label: 'Closed',    color: 'text-gray-500',    bg: 'bg-gray-50',    dot: 'bg-gray-300' },
};

const priorityConfig: Record<TicketPriority, { label: string; color: string; bg: string; ring: string }> = {
  urgent: { label: 'Urgent', color: 'text-red-700',    bg: 'bg-red-50',    ring: 'ring-red-200' },
  high:   { label: 'High',   color: 'text-orange-700', bg: 'bg-orange-50', ring: 'ring-orange-200' },
  normal: { label: 'Normal', color: 'text-blue-700',   bg: 'bg-blue-50',   ring: 'ring-blue-200' },
  low:    { label: 'Low',    color: 'text-gray-600',   bg: 'bg-gray-100',  ring: 'ring-gray-200' },
};

const categoryConfig: Record<TicketCategory, { label: string; icon: React.ElementType; bg: string; color: string }> = {
  funding:        { label: 'Funding',         icon: DollarSign,  bg: 'bg-emerald-50', color: 'text-emerald-700' },
  deposits:       { label: 'Deposits',        icon: DollarSign,  bg: 'bg-emerald-50', color: 'text-emerald-700' },
  statements:     { label: 'Statements',      icon: BarChart3,   bg: 'bg-blue-50',    color: 'text-blue-700' },
  pricing:        { label: 'Pricing & Fees',  icon: Tag,         bg: 'bg-amber-50',   color: 'text-amber-700' },
  terminal:       { label: 'Terminal / POS',  icon: CreditCard,  bg: 'bg-indigo-50',  color: 'text-indigo-700' },
  gateway:        { label: 'Gateway',         icon: Zap,         bg: 'bg-purple-50',  color: 'text-purple-700' },
  pci:            { label: 'PCI / Security',  icon: Shield,      bg: 'bg-red-50',     color: 'text-red-700' },
  chargeback:     { label: 'Chargeback',      icon: AlertCircle, bg: 'bg-red-50',     color: 'text-red-700' },
  underwriting:   { label: 'Underwriting',    icon: Users,       bg: 'bg-cyan-50',    color: 'text-cyan-700' },
  onboarding:     { label: 'Onboarding',      icon: PlayCircle,  bg: 'bg-teal-50',    color: 'text-teal-700' },
  account_change: { label: 'Account Change',  icon: SettingsIcon,bg: 'bg-slate-100',  color: 'text-slate-700' },
  cancellation:   { label: 'Cancellation',    icon: AlertTriangle,bg: 'bg-rose-50',   color: 'text-rose-700' },
  other:          { label: 'Other',           icon: InboxIcon,   bg: 'bg-gray-100',   color: 'text-gray-700' },
};

const channelConfig: Record<TicketChannel, { label: string; icon: React.ElementType }> = {
  email:  { label: 'Email',        icon: Mail },
  phone:  { label: 'Phone',        icon: Phone },
  chat:   { label: 'Live Chat',    icon: MessageSquare },
  portal: { label: 'Merchant Portal', icon: User },
  agent:  { label: 'Agent Submitted', icon: Users },
};

const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
const fmtDate = (s: string) => new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const fmtDateTime = (s: string) => new Date(s).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
const fmtPct = (n: number) => `${(n * 100).toFixed(1)}%`;
const fmtHrs = (h: number) => h < 0
  ? `${Math.abs(Math.round(h))}h overdue`
  : h < 1 ? `${Math.round(h * 60)}m left`
  : h < 24 ? `${Math.round(h)}h left`
  : `${Math.round(h / 24)}d left`;

// ═══════════════════════════════════════════════
// SAMPLE DATA — merchant-account-centric tickets
// ═══════════════════════════════════════════════

const TICKETS: Ticket[] = [
  {
    id: 'SUP-2026-0142',
    subject: 'Missing batch deposit for 5/11 — $12,847.20',
    merchant: 'Havana Bites Cafe', merchantId: 'MID-001', vertical: 'Restaurant',
    contactName: 'Maria Reyes', contactEmail: 'maria@havanabites.com', contactPhone: '(305) 555-0142',
    category: 'deposits', priority: 'urgent', status: 'open', channel: 'phone',
    assignee: 'Sarah M.',
    createdAt: '2026-05-12T09:14:00', updatedAt: '2026-05-13T13:22:00',
    firstResponseAt: '2026-05-12T09:48:00',
    slaDueAt: '2026-05-13T17:00:00', hoursToSla: 1.5,
    tags: ['ACH', 'TSYS', 'funding-hold'],
    description: "Merchant reports the batch from 5/11 totaling $12,847.20 hasn't hit their operating account. ACH trace requested from TSYS — awaiting response. Possible Reg E hold flagged on three transactions over $500.",
    notes: [
      { author: 'Sarah M.', text: 'Pulled batch from TSYS portal — shows funded, but bank shows nothing posted. ACH trace #ACH-77291 submitted.', date: '2026-05-12T09:48:00' },
      { author: 'System', text: 'SLA reminder: 4 hours to first-response breach.', date: '2026-05-12T10:00:00', internal: true },
      { author: 'Sarah M.', text: 'Called merchant — confirmed routing/DDA on file matches. Escalated to TSYS funding desk (ref #FN-44823).', date: '2026-05-13T11:10:00' },
    ],
    attachments: 3,
    relatedDealId: 'DEAL-001',
  },
  {
    id: 'SUP-2026-0141',
    subject: 'Statement shows wrong qualified rate (2.95% vs contracted 1.79%)',
    merchant: 'Coral Reef Auto Spa', merchantId: 'MID-002', vertical: 'Auto Services',
    contactName: 'Diego Alvarez', contactEmail: 'diego@coralreefauto.com',
    category: 'pricing', priority: 'high', status: 'pending', channel: 'email',
    assignee: 'John D.',
    createdAt: '2026-05-11T15:33:00', updatedAt: '2026-05-13T10:05:00',
    firstResponseAt: '2026-05-11T16:01:00',
    slaDueAt: '2026-05-14T17:00:00', hoursToSla: 27,
    tags: ['pricing', 'statement-audit', 'IC+'],
    description: 'April statement shows qualified Visa CP rate at 2.95% — contract was IC+0.30%. Looks like the rate adjustment from the bundle change on 3/15 was not pushed to TSYS.',
    notes: [
      { author: 'John D.', text: 'Confirmed in CRM — bundle changed on 3/15 but rate file change ticket to TSYS never went through. Submitting correction + April rebate.', date: '2026-05-11T16:01:00' },
      { author: 'John D.', text: 'TSYS reprocessing approved. Rebate of $312.40 will appear on May statement. Awaiting written confirmation.', date: '2026-05-13T10:05:00' },
    ],
    attachments: 2,
  },
  {
    id: 'SUP-2026-0140',
    subject: 'Terminal Ingenico Lane/3000 offline — cant accept cards',
    merchant: 'SoBe Cycle & Fitness', merchantId: 'MID-004', vertical: 'Health & Fitness',
    contactName: 'Aaron Lin', contactEmail: 'aaron@sobecycle.com', contactPhone: '(305) 555-7811',
    category: 'terminal', priority: 'urgent', status: 'open', channel: 'phone',
    assignee: 'Tech Support',
    createdAt: '2026-05-13T08:02:00', updatedAt: '2026-05-13T13:45:00',
    firstResponseAt: '2026-05-13T08:11:00',
    slaDueAt: '2026-05-13T16:02:00', hoursToSla: 0.5,
    tags: ['terminal-down', 'Ingenico', 'hardware'],
    description: 'Terminal showing "Comms Failed" on every swipe. Tried reboot, re-key — same. They are losing sales right now.',
    notes: [
      { author: 'Tech Support', text: 'Walked merchant through full TDL push & reboot — no joy. Likely modem chip. Dispatching replacement, FedEx overnight.', date: '2026-05-13T08:11:00' },
      { author: 'Tech Support', text: 'Replacement terminal shipped, tracking #FX-882. Set up manual key-entry on iPhone gateway for tonight.', date: '2026-05-13T12:30:00' },
    ],
    attachments: 1,
  },
  {
    id: 'SUP-2026-0139',
    subject: 'PCI non-compliance fee charged — already SAQ-A completed',
    merchant: 'Doral Fresh Market', merchantId: 'MID-006', vertical: 'Grocery',
    contactName: 'Patricia Gomez', contactEmail: 'patricia@doralfresh.com',
    category: 'pci', priority: 'high', status: 'open', channel: 'email',
    assignee: 'Sarah M.',
    createdAt: '2026-05-10T11:20:00', updatedAt: '2026-05-13T09:12:00',
    firstResponseAt: '2026-05-10T13:14:00',
    slaDueAt: '2026-05-14T17:00:00', hoursToSla: 27.5,
    tags: ['PCI', 'SecurityMetrics', 'refund-due'],
    description: 'Statement shows $39.95 PCI non-compliance fee. Merchant completed SAQ-A on 4/22 via SecurityMetrics portal — has confirmation email.',
    notes: [
      { author: 'Sarah M.', text: 'Confirmed in SM portal — SAQ-A complete, scan passed. Fee posted in error. Filing rebate ticket with TSYS.', date: '2026-05-10T13:14:00' },
      { author: 'System', text: 'Rebate request RBT-9921 submitted to TSYS.', date: '2026-05-11T09:00:00', internal: true },
    ],
    attachments: 2,
  },
  {
    id: 'SUP-2026-0138',
    subject: 'Underwriting hold — need updated bank statements (60 days)',
    merchant: 'Midtown Taqueria', merchantId: 'FDM-001', vertical: 'Restaurant',
    contactName: 'Carlos Mendez', contactEmail: 'carlos@midtowntaqueria.com',
    category: 'underwriting', priority: 'high', status: 'pending', channel: 'agent',
    assignee: 'UW Team',
    createdAt: '2026-05-09T14:00:00', updatedAt: '2026-05-12T16:30:00',
    firstResponseAt: '2026-05-09T14:45:00',
    slaDueAt: '2026-05-14T17:00:00', hoursToSla: 27,
    tags: ['UW-hold', 'docs-requested'],
    description: 'New MID flagged for additional review — high-risk MCC. UW requesting last 60 days of bank statements plus signed processing history attestation.',
    notes: [
      { author: 'UW Team', text: 'Sent doc request to merchant via secure upload link. Awaiting response.', date: '2026-05-09T14:45:00' },
      { author: 'UW Team', text: 'Merchant uploaded 30 days only. Re-requested second month.', date: '2026-05-12T16:30:00' },
    ],
    attachments: 4,
    relatedDealId: 'DEAL-014',
  },
  {
    id: 'SUP-2026-0137',
    subject: 'Refund request — duplicate $245 charge on 5/8',
    merchant: 'Kendall Pet Grooming', merchantId: 'FDM-002', vertical: 'Personal Services',
    contactName: 'Lisa Park', contactEmail: 'lisa@kendallpet.com',
    category: 'deposits', priority: 'normal', status: 'resolved', channel: 'chat',
    assignee: 'Sarah M.',
    createdAt: '2026-05-08T10:15:00', updatedAt: '2026-05-09T11:42:00',
    firstResponseAt: '2026-05-08T10:28:00',
    resolvedAt: '2026-05-09T11:42:00',
    slaDueAt: '2026-05-09T17:00:00', hoursToSla: 0,
    tags: ['refund-processed', 'duplicate'],
    description: 'Customer charged twice for grooming on 5/8. Merchant requesting void of second auth.',
    notes: [
      { author: 'Sarah M.', text: 'Confirmed in gateway — two identical $245 auths 30 sec apart. Voided the duplicate. Funds will reverse in 3-5 business days.', date: '2026-05-08T10:28:00' },
      { author: 'Sarah M.', text: 'Merchant confirmed customer notified. Closing.', date: '2026-05-09T11:42:00' },
    ],
    attachments: 1,
    csatScore: 5,
  },
  {
    id: 'SUP-2026-0136',
    subject: 'Gateway API returning 502 — Authorize.Net integration',
    merchant: 'Wynwood Ink Studio', merchantId: 'MID-003', vertical: 'Retail',
    contactName: 'Jordan Cruz', contactEmail: 'dev@wynwoodink.com',
    category: 'gateway', priority: 'high', status: 'open', channel: 'email',
    assignee: 'Tech Support',
    createdAt: '2026-05-13T07:30:00', updatedAt: '2026-05-13T13:00:00',
    firstResponseAt: '2026-05-13T07:55:00',
    slaDueAt: '2026-05-14T07:30:00', hoursToSla: 17,
    tags: ['Authorize.Net', 'API', 'integration'],
    description: 'Their online checkout has been failing intermittently since last deploy. Logs show 502 from gateway on ~10% of requests.',
    notes: [
      { author: 'Tech Support', text: 'Checked AN status page — partial degradation in us-east-2. Confirmed on their side. Sent advisory + retry logic recommendation.', date: '2026-05-13T07:55:00' },
      { author: 'Tech Support', text: 'AN ETA on full recovery: 16:00 ET. Monitoring.', date: '2026-05-13T13:00:00' },
    ],
    attachments: 2,
  },
  {
    id: 'SUP-2026-0135',
    subject: 'Statement enrollment — paperless not honored',
    merchant: 'Brickell Dry Cleaners', merchantId: 'MID-007', vertical: 'Services',
    contactName: 'Tony Russo', contactEmail: 'tony@brickelldry.com',
    category: 'statements', priority: 'low', status: 'pending', channel: 'portal',
    assignee: 'Sarah M.',
    createdAt: '2026-05-07T16:22:00', updatedAt: '2026-05-12T09:00:00',
    firstResponseAt: '2026-05-08T08:14:00',
    slaDueAt: '2026-05-15T17:00:00', hoursToSla: 51,
    tags: ['paperless', 'statement-delivery'],
    description: 'Enrolled in paperless on 4/2 but still receiving paper statements + $4.95 paper fee.',
    notes: [
      { author: 'Sarah M.', text: 'Verified enrollment in CRM. TSYS profile still flagged paper — fixed in TSYS portal. Will refund 2 months of paper fees ($9.90).', date: '2026-05-08T08:14:00' },
    ],
    attachments: 0,
  },
  {
    id: 'SUP-2026-0134',
    subject: 'Cancellation request — sold business, new owner has own MSP',
    merchant: 'Aventura Nail Lounge', merchantId: 'FDM-003', vertical: 'Personal Services',
    contactName: 'Renee Kim', contactEmail: 'renee@aventuranail.com',
    category: 'cancellation', priority: 'normal', status: 'open', channel: 'email',
    assignee: 'Retention',
    createdAt: '2026-05-06T13:00:00', updatedAt: '2026-05-13T10:00:00',
    firstResponseAt: '2026-05-06T14:30:00',
    slaDueAt: '2026-05-16T17:00:00', hoursToSla: 75,
    tags: ['cancellation', 'retention-attempt', 'ETF-waived'],
    description: 'Owner sold the salon to new owner effective 6/1. Requesting account closure & equipment return instructions.',
    notes: [
      { author: 'Retention', text: 'Retention call attempted — owner firm. Confirmed closure effective 5/31. ETF waived per CSR discretion (long-time merchant, 4yrs).', date: '2026-05-06T14:30:00' },
      { author: 'Retention', text: 'Equipment return label sent. Final statement scheduled 6/15.', date: '2026-05-13T10:00:00' },
    ],
    attachments: 1,
  },
  {
    id: 'SUP-2026-0133',
    subject: 'DBA name change — needs update on statements & terminal',
    merchant: 'Hialeah Tire & Brake', merchantId: 'FDM-004', vertical: 'Auto Services',
    contactName: 'Roberto Diaz', contactEmail: 'roberto@hialeahtire.com',
    category: 'account_change', priority: 'normal', status: 'open', channel: 'email',
    assignee: 'Sarah M.',
    createdAt: '2026-05-05T11:00:00', updatedAt: '2026-05-13T09:30:00',
    firstResponseAt: '2026-05-05T11:45:00',
    slaDueAt: '2026-05-15T17:00:00', hoursToSla: 51,
    tags: ['DBA-change', 'docs-needed'],
    description: 'Legally changed DBA from "Hialeah Tire" to "Hialeah Tire & Brake". Needs to flow to statements, terminal descriptor, and gateway.',
    notes: [
      { author: 'Sarah M.', text: 'Requested updated DBA filing + EIN letter. Will submit MPA addendum to TSYS once received.', date: '2026-05-05T11:45:00' },
      { author: 'Sarah M.', text: 'Documents received. Submitted change request to TSYS — ref CHG-7711. 5-7 days to flow through.', date: '2026-05-12T15:20:00' },
    ],
    attachments: 3,
  },
  {
    id: 'SUP-2026-0132',
    subject: 'Onboarding stuck — boarding form missing signature page',
    merchant: 'Palmetto Bay Bakery', merchantId: 'FDM-005', vertical: 'Restaurant',
    contactName: 'Sofia Bianchi', contactEmail: 'sofia@palmettobakery.com',
    category: 'onboarding', priority: 'high', status: 'pending', channel: 'agent',
    assignee: 'Onboarding',
    createdAt: '2026-05-04T09:00:00', updatedAt: '2026-05-11T14:00:00',
    firstResponseAt: '2026-05-04T09:30:00',
    slaDueAt: '2026-05-14T17:00:00', hoursToSla: 27,
    tags: ['onboarding', 'signature-missing'],
    description: "MPA submitted but signature page truncated by merchant's scanner. Need re-sign before submission to TSYS.",
    notes: [
      { author: 'Onboarding', text: 'Sent DocuSign envelope. Awaiting completion.', date: '2026-05-04T09:30:00' },
      { author: 'Onboarding', text: 'Reminder #2 sent.', date: '2026-05-08T10:00:00' },
      { author: 'Onboarding', text: 'Owner travelling — back 5/13. Will sign tomorrow per phone call.', date: '2026-05-11T14:00:00' },
    ],
    attachments: 2,
    relatedDealId: 'DEAL-018',
  },
  {
    id: 'SUP-2026-0131',
    subject: 'Chargeback notification not received via email',
    merchant: 'Little Havana Barbershop', merchantId: 'MID-005', vertical: 'Personal Services',
    contactName: 'Manny Reyes', contactEmail: 'manny@littlehavana.com',
    category: 'chargeback', priority: 'normal', status: 'resolved', channel: 'phone',
    assignee: 'Sarah M.',
    createdAt: '2026-05-02T15:00:00', updatedAt: '2026-05-04T11:00:00',
    firstResponseAt: '2026-05-02T15:20:00',
    resolvedAt: '2026-05-04T11:00:00',
    slaDueAt: '2026-05-03T17:00:00', hoursToSla: 0,
    tags: ['email-prefs', 'CB-notifications'],
    description: 'Got chargeback letter via mail but never the email — wants to make sure email alerts are on.',
    notes: [
      { author: 'Sarah M.', text: 'Email was bouncing to old address. Updated to new on file + verified delivery with test alert.', date: '2026-05-02T15:20:00' },
      { author: 'Sarah M.', text: 'Confirmed email received. Closing.', date: '2026-05-04T11:00:00' },
    ],
    attachments: 0,
    csatScore: 4,
  },
  {
    id: 'SUP-2026-0130',
    subject: 'Reserve release inquiry — $4,200 held since 4/1',
    merchant: 'Doral Fresh Market', merchantId: 'MID-006', vertical: 'Grocery',
    contactName: 'Patricia Gomez', contactEmail: 'patricia@doralfresh.com',
    category: 'funding', priority: 'high', status: 'on_hold', channel: 'email',
    assignee: 'Risk Team',
    createdAt: '2026-05-01T08:00:00', updatedAt: '2026-05-13T08:30:00',
    firstResponseAt: '2026-05-01T10:30:00',
    slaDueAt: '2026-05-31T17:00:00', hoursToSla: 432,
    tags: ['reserve', 'risk-review', '30-day-rolling'],
    description: '30-day rolling reserve applied 4/1 due to elevated CB ratio. Merchant asking when funds release & how reserve is calculated.',
    notes: [
      { author: 'Sarah M.', text: 'Escalated to Risk Team. CB ratio currently 1.2% — needs to be <0.8% for 60 consecutive days before release review.', date: '2026-05-01T10:30:00' },
      { author: 'Risk Team', text: 'Sent merchant the reserve schedule + how to reduce CBs. Reviewing again 6/1.', date: '2026-05-04T14:00:00' },
      { author: 'Risk Team', text: 'Latest CB ratio: 0.9%. Trending right direction. Holding until 6/1 review.', date: '2026-05-13T08:30:00' },
    ],
    attachments: 2,
  },
  {
    id: 'SUP-2026-0129',
    subject: 'Request: add second location under same MID',
    merchant: 'Havana Bites Cafe', merchantId: 'MID-001', vertical: 'Restaurant',
    contactName: 'Maria Reyes', contactEmail: 'maria@havanabites.com',
    category: 'account_change', priority: 'normal', status: 'closed', channel: 'email',
    assignee: 'Sarah M.',
    createdAt: '2026-04-28T13:00:00', updatedAt: '2026-05-05T10:00:00',
    firstResponseAt: '2026-04-28T14:00:00',
    resolvedAt: '2026-05-05T10:00:00',
    slaDueAt: '2026-05-05T17:00:00', hoursToSla: 0,
    tags: ['new-location', 'corporate-hierarchy'],
    description: 'Opening second location — wants reporting consolidated under existing corp hierarchy.',
    notes: [
      { author: 'Sarah M.', text: 'Set up second MID under same corp DBA. Hierarchy reporting live.', date: '2026-05-05T10:00:00' },
    ],
    attachments: 3,
    csatScore: 5,
  },
];

// Knowledge base
const KB_ARTICLES: KBArticle[] = [
  { id: 'KB-001', title: 'How to trace a missing batch deposit',        category: 'deposits',       views: 482, helpful: 156, lastUpdated: '2026-04-22' },
  { id: 'KB-002', title: 'PCI compliance: SAQ-A walkthrough',           category: 'pci',            views: 391, helpful: 142, lastUpdated: '2026-03-15' },
  { id: 'KB-003', title: 'Reading your monthly statement (IC+ pricing)',category: 'statements',     views: 367, helpful: 121, lastUpdated: '2026-04-01' },
  { id: 'KB-004', title: 'Reserve accounts: how & when funds release',  category: 'funding',        views: 312, helpful: 99,  lastUpdated: '2026-02-18' },
  { id: 'KB-005', title: 'Ingenico Lane/3000 troubleshooting',          category: 'terminal',       views: 287, helpful: 134, lastUpdated: '2026-04-08' },
  { id: 'KB-006', title: 'Authorize.Net integration — common errors',   category: 'gateway',        views: 246, helpful: 88,  lastUpdated: '2026-03-30' },
  { id: 'KB-007', title: 'Updating DBA / business name on file',        category: 'account_change', views: 198, helpful: 71,  lastUpdated: '2026-01-25' },
  { id: 'KB-008', title: 'Chargeback notifications — email setup',      category: 'chargeback',     views: 174, helpful: 64,  lastUpdated: '2026-04-12' },
  { id: 'KB-009', title: 'Cancellation policy + ETF schedule',          category: 'cancellation',   views: 152, helpful: 51,  lastUpdated: '2026-02-02' },
  { id: 'KB-010', title: 'High-risk MCC onboarding checklist',          category: 'underwriting',   views: 134, helpful: 47,  lastUpdated: '2026-03-19' },
];

// ═══════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════

type TabKey = 'inbox' | 'workflow' | 'sla' | 'kb' | 'analytics';

export function BackendSupport() {
  const [activeTab, setActiveTab] = useState<TabKey>('inbox');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all' | 'active'>('active');
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<TicketCategory | 'all'>('all');
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);

  const filtered = useMemo(() => {
    return TICKETS.filter(t => {
      if (statusFilter === 'active' && (t.status === 'resolved' || t.status === 'closed')) return false;
      if (statusFilter !== 'all' && statusFilter !== 'active' && t.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
      if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const blob = `${t.id} ${t.subject} ${t.merchant} ${t.contactName} ${t.contactEmail} ${t.tags.join(' ')} ${t.description}`.toLowerCase();
        if (!blob.includes(q)) return false;
      }
      return true;
    });
  }, [search, statusFilter, priorityFilter, categoryFilter]);

  const active = useMemo(() => TICKETS.filter(t => t.status !== 'resolved' && t.status !== 'closed'), []);
  const breached = useMemo(() => active.filter(t => t.hoursToSla < 0), [active]);
  const dueSoon = useMemo(() => active.filter(t => t.hoursToSla >= 0 && t.hoursToSla <= 4), [active]);
  const onTrack = useMemo(() => active.filter(t => t.hoursToSla > 4), [active]);

  const analytics = useMemo(() => {
    const resolved = TICKETS.filter(t => t.resolvedAt);
    const csatScores = TICKETS.filter(t => t.csatScore).map(t => t.csatScore as number);
    const avgCsat = csatScores.length ? csatScores.reduce((a, b) => a + b, 0) / csatScores.length : 0;

    // first response time (hours) where firstResponseAt exists
    const frts = TICKETS.filter(t => t.firstResponseAt).map(t => (new Date(t.firstResponseAt!).getTime() - new Date(t.createdAt).getTime()) / 36e5);
    const avgFrt = frts.length ? frts.reduce((a, b) => a + b, 0) / frts.length : 0;

    // resolution time
    const rts = resolved.map(t => (new Date(t.resolvedAt!).getTime() - new Date(t.createdAt).getTime()) / 36e5);
    const avgRt = rts.length ? rts.reduce((a, b) => a + b, 0) / rts.length : 0;

    const byCategory: Record<string, number> = {};
    TICKETS.forEach(t => { byCategory[t.category] = (byCategory[t.category] || 0) + 1; });

    const byAssignee: Record<string, { open: number; resolved: number }> = {};
    TICKETS.forEach(t => {
      if (!byAssignee[t.assignee]) byAssignee[t.assignee] = { open: 0, resolved: 0 };
      if (t.status === 'resolved' || t.status === 'closed') byAssignee[t.assignee].resolved++;
      else byAssignee[t.assignee].open++;
    });

    return {
      total: TICKETS.length,
      open: active.length,
      resolved: resolved.length,
      breached: breached.length,
      avgCsat, avgFrt, avgRt,
      byCategory, byAssignee,
      slaCompliance: active.length ? (active.length - breached.length) / active.length : 1,
    };
  }, [active, breached]);

  const tabs: { key: TabKey; label: string; badge?: number }[] = [
    { key: 'inbox',     label: 'Ticket Inbox',  badge: active.length },
    { key: 'workflow',  label: 'Workflow',      badge: active.length },
    { key: 'sla',       label: 'SLA Tracking',  badge: breached.length || undefined },
    { key: 'kb',        label: 'Knowledge Base' },
    { key: 'analytics', label: 'Analytics' },
  ];

  const selected = TICKETS.find(t => t.id === selectedTicket) || null;

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-[1440px] mx-auto px-6 py-6 space-y-5">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Support Hub</h1>
            <p className="text-sm text-gray-500 mt-0.5">Merchant account ticket tracking, SLAs &amp; knowledge base</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span>Zendesk · Email · Phone · Chat</span>
              <span className="flex items-center gap-1.5 text-emerald-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            </div>
            <button
              onClick={() => setComposerOpen(true)}
              className="px-4 py-2 bg-brand text-white text-sm font-medium rounded-[6px] hover:bg-brand-hover transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> New Ticket
            </button>
          </div>
        </div>

        {/* ── Urgency Summary Strip ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SummaryCard
            label="SLA Breached"
            value={breached.length.toString()}
            sub={`${fmtPct(1 - analytics.slaCompliance)} of active`}
            accent="border-t-red-500"
          />
          <SummaryCard
            label="Due Within 4h"
            value={dueSoon.length.toString()}
            sub="Needs response soon"
            accent="border-t-amber-500"
          />
          <SummaryCard
            label="On Track"
            value={onTrack.length.toString()}
            sub="Active tickets"
            accent="border-t-emerald-500"
          />
          <SummaryCard
            label="Avg CSAT (30d)"
            value={analytics.avgCsat ? analytics.avgCsat.toFixed(2) : '—'}
            sub={`${TICKETS.filter(t => t.csatScore).length} responses`}
            accent="border-t-brand"
          />
        </div>

        {/* ── Tab Nav ── */}
        <div className="border-b border-gray-200">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-[1px] flex items-center gap-2 whitespace-nowrap ${
                  activeTab === t.key ? 'text-brand border-brand' : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                {t.label}
                {t.badge !== undefined && (
                  <span className={`text-[10px] tabular-nums px-1.5 py-px rounded-full ${
                    activeTab === t.key ? 'bg-brand/10 text-brand' : 'bg-gray-100 text-gray-500'
                  }`}>{t.badge}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ════════════════════════════════════════ */}
        {/* INBOX TAB                                */}
        {/* ════════════════════════════════════════ */}
        {activeTab === 'inbox' && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[260px] max-w-md">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search tickets, merchants, tags…"
                  className="w-full pl-8 pr-3 py-[7px] bg-white border border-gray-200 rounded-[6px] text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                />
              </div>

              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as TicketStatus | 'all' | 'active')}
                className="px-3 py-[7px] bg-white border border-gray-200 rounded-[6px] text-sm focus:outline-none focus:border-brand"
              >
                <option value="active">Active</option>
                <option value="all">All Statuses</option>
                {Object.entries(statusConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>

              <select
                value={priorityFilter}
                onChange={e => setPriorityFilter(e.target.value as TicketPriority | 'all')}
                className="px-3 py-[7px] bg-white border border-gray-200 rounded-[6px] text-sm focus:outline-none focus:border-brand"
              >
                <option value="all">All Priorities</option>
                {Object.entries(priorityConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>

              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value as TicketCategory | 'all')}
                className="px-3 py-[7px] bg-white border border-gray-200 rounded-[6px] text-sm focus:outline-none focus:border-brand"
              >
                <option value="all">All Categories</option>
                {Object.entries(categoryConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>

              <button
                onClick={() => { setSearch(''); setStatusFilter('active'); setPriorityFilter('all'); setCategoryFilter('all'); }}
                className="px-2.5 py-[7px] text-xs text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-[6px] flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Reset
              </button>
            </div>

            {/* Ticket Table */}
            <div className="bg-white border border-gray-200 rounded-[8px] overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <Th className="pl-5">Priority</Th>
                    <Th>Ticket</Th>
                    <Th>Subject</Th>
                    <Th>Merchant</Th>
                    <Th>Category</Th>
                    <Th>Status</Th>
                    <Th>Assignee</Th>
                    <Th>SLA</Th>
                    <Th>Updated</Th>
                    <Th className="pr-5"></Th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(t => {
                    const sc = statusConfig[t.status];
                    const pc = priorityConfig[t.priority];
                    const cc = categoryConfig[t.category];
                    const Cicon = cc.icon;
                    const Chicon = channelConfig[t.channel].icon;
                    const isOpenRow = selectedTicket === t.id;
                    const slaColor = t.hoursToSla < 0 ? 'text-red-600' : t.hoursToSla <= 4 ? 'text-amber-600' : 'text-emerald-600';
                    return (
                      <React.Fragment key={t.id}>
                        <tr
                          onClick={() => setSelectedTicket(isOpenRow ? null : t.id)}
                          className={`border-b border-gray-100 cursor-pointer transition-colors ${isOpenRow ? 'bg-indigo-50/40' : 'hover:bg-gray-50/80'}`}
                        >
                          <td className="pl-5 py-3">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${pc.bg} ${pc.color}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${pc.color.replace('text-', 'bg-')} ${t.priority === 'urgent' ? 'animate-pulse' : ''}`} />
                              {pc.label.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3">
                            <p className="text-sm font-semibold text-gray-900">{t.id}</p>
                            <p className="text-[10px] text-gray-400 flex items-center gap-1">
                              <Chicon className="w-3 h-3" />{channelConfig[t.channel].label}
                            </p>
                          </td>
                          <td className="py-3 max-w-[280px]">
                            <p className="text-sm font-medium text-gray-900 truncate">{t.subject}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {t.attachments > 0 && (
                                <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                                  <Paperclip className="w-2.5 h-2.5" />{t.attachments}
                                </span>
                              )}
                              <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                                <MessageSquare className="w-2.5 h-2.5" />{t.notes.length}
                              </span>
                              {t.tags.slice(0, 2).map(tag => (
                                <span key={tag} className="text-[9px] text-gray-500 bg-gray-100 px-1.5 py-px rounded">{tag}</span>
                              ))}
                            </div>
                          </td>
                          <td className="py-3">
                            <p className="text-sm font-medium text-gray-900">{t.merchant}</p>
                            <p className="text-[10px] text-gray-400">{t.merchantId} · {t.vertical}</p>
                          </td>
                          <td className="py-3">
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${cc.bg} ${cc.color}`}>
                              <Cicon className="w-3 h-3" />
                              {cc.label}
                            </span>
                          </td>
                          <td className="py-3">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${sc.bg} ${sc.color}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />{sc.label}
                            </span>
                          </td>
                          <td className="py-3 text-xs text-gray-600">{t.assignee}</td>
                          <td className="py-3">
                            <p className={`text-xs font-semibold tabular-nums ${slaColor}`}>{fmtHrs(t.hoursToSla)}</p>
                          </td>
                          <td className="py-3 text-[11px] text-gray-500 tabular-nums">{fmtDate(t.updatedAt)}</td>
                          <td className="pr-5 py-3 text-right">
                            <ChevronRight className={`w-3.5 h-3.5 text-gray-300 inline-block transition-transform ${isOpenRow ? 'rotate-90' : ''}`} />
                          </td>
                        </tr>

                        {/* Expanded row */}
                        {isOpenRow && (
                          <tr>
                            <td colSpan={10} className="bg-gray-50 border-b border-gray-200 px-5 py-5">
                              <TicketDetail ticket={t} />
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-sm text-gray-400">
                        No tickets match the current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════ */}
        {/* WORKFLOW (Kanban) TAB                    */}
        {/* ════════════════════════════════════════ */}
        {activeTab === 'workflow' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            {(['new', 'open', 'pending', 'on_hold', 'resolved'] as TicketStatus[]).map(stage => {
              const stageTickets = TICKETS.filter(t => t.status === stage);
              const sc = statusConfig[stage];
              return (
                <div key={stage} className="bg-white rounded-[8px] border border-gray-200 overflow-hidden">
                  <div className={`px-3 py-2.5 border-b border-gray-100 ${sc.bg}`}>
                    <div className="flex items-center justify-between">
                      <p className={`text-[11px] font-bold uppercase tracking-wide ${sc.color}`}>{sc.label}</p>
                      <span className={`text-[10px] font-bold tabular-nums px-1.5 py-px rounded-full ${sc.bg} ${sc.color}`}>{stageTickets.length}</span>
                    </div>
                  </div>
                  <div className="p-2 space-y-2 min-h-[120px] max-h-[480px] overflow-y-auto">
                    {stageTickets.map(t => {
                      const pc = priorityConfig[t.priority];
                      const cc = categoryConfig[t.category];
                      const Cicon = cc.icon;
                      return (
                        <div
                          key={t.id}
                          onClick={() => { setActiveTab('inbox'); setSelectedTicket(t.id); setStatusFilter('all'); }}
                          className={`rounded-[6px] border p-2.5 cursor-pointer hover:shadow-sm transition-all ${
                            t.priority === 'urgent' ? 'border-red-200 bg-red-50/30' : 'border-gray-200 hover:border-brand/30'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-[10px] font-bold text-gray-500">{t.id}</p>
                            <span className={`text-[9px] font-bold px-1 py-px rounded ${pc.bg} ${pc.color}`}>{pc.label.toUpperCase()}</span>
                          </div>
                          <p className="text-xs font-semibold text-gray-900 line-clamp-2 leading-snug mb-1.5">{t.subject}</p>
                          <p className="text-[10px] text-gray-500 truncate">{t.merchant}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className={`inline-flex items-center gap-1 px-1.5 py-px rounded text-[9px] font-semibold ${cc.bg} ${cc.color}`}>
                              <Cicon className="w-2.5 h-2.5" />
                              {cc.label}
                            </span>
                            <span className={`text-[9px] font-bold tabular-nums ${t.hoursToSla < 0 ? 'text-red-600' : t.hoursToSla <= 4 ? 'text-amber-600' : 'text-gray-400'}`}>
                              {fmtHrs(t.hoursToSla)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    {stageTickets.length === 0 && (
                      <p className="text-[10px] text-gray-400 text-center py-4">Empty</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ════════════════════════════════════════ */}
        {/* SLA TRACKING TAB                         */}
        {/* ════════════════════════════════════════ */}
        {activeTab === 'sla' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <KpiCard label="SLA Compliance" value={fmtPct(analytics.slaCompliance)} sub={`${active.length - breached.length}/${active.length} active`} accent="emerald" />
              <KpiCard label="Avg First Response" value={`${analytics.avgFrt.toFixed(1)} h`} sub="Target: 4h" accent="indigo" />
              <KpiCard label="Avg Resolution" value={`${analytics.avgRt.toFixed(1)} h`} sub="Target: 24h" accent="blue" />
              <KpiCard label="Breached Now" value={breached.length.toString()} sub="Across all priorities" accent="red" />
            </div>

            <div className="bg-white rounded-[8px] border border-gray-200">
              <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-semibold text-gray-900">SLA Tracking — Response Deadlines</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <Th className="pl-5">Ticket</Th>
                      <Th>Merchant</Th>
                      <Th>Priority</Th>
                      <Th>SLA Due</Th>
                      <Th>Time Remaining</Th>
                      <Th>Assignee</Th>
                      <Th className="pr-5">SLA Status</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {active
                      .slice()
                      .sort((a, b) => a.hoursToSla - b.hoursToSla)
                      .map(t => {
                        const pc = priorityConfig[t.priority];
                        const slaStatus = t.hoursToSla < 0 ? 'BREACHED' : t.hoursToSla <= 4 ? 'AT RISK' : 'ON TRACK';
                        const slaColor = t.hoursToSla < 0
                          ? 'text-red-700 bg-red-50'
                          : t.hoursToSla <= 4
                            ? 'text-amber-700 bg-amber-50'
                            : 'text-emerald-700 bg-emerald-50';
                        const barColor = t.hoursToSla < 0
                          ? 'bg-red-500'
                          : t.hoursToSla <= 4
                            ? 'bg-amber-500'
                            : 'bg-emerald-500';
                        const slaTotalH = 72;
                        const pct = Math.max(0, Math.min(100, ((slaTotalH - Math.max(0, t.hoursToSla)) / slaTotalH) * 100));
                        return (
                          <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50/50 cursor-pointer" onClick={() => { setActiveTab('inbox'); setSelectedTicket(t.id); setStatusFilter('all'); }}>
                            <td className="pl-5 py-2.5">
                              <p className="text-sm font-semibold text-gray-900">{t.id}</p>
                              <p className="text-[10px] text-gray-400 max-w-[220px] truncate">{t.subject}</p>
                            </td>
                            <td className="py-2.5 text-sm text-gray-700">{t.merchant}</td>
                            <td className="py-2.5">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${pc.bg} ${pc.color}`}>{pc.label}</span>
                            </td>
                            <td className="py-2.5 text-xs tabular-nums text-gray-600">{fmtDateTime(t.slaDueAt)}</td>
                            <td className="py-2.5">
                              <div className="flex items-center gap-2">
                                <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                                </div>
                                <span className={`text-xs font-bold tabular-nums ${t.hoursToSla < 0 ? 'text-red-600' : t.hoursToSla <= 4 ? 'text-amber-600' : 'text-gray-600'}`}>
                                  {fmtHrs(t.hoursToSla)}
                                </span>
                              </div>
                            </td>
                            <td className="py-2.5 text-xs text-gray-600">{t.assignee}</td>
                            <td className="pr-5 py-2.5">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${slaColor}`}>{slaStatus}</span>
                            </td>
                          </tr>
                        );
                      })}
                    {active.length === 0 && (
                      <tr><td colSpan={7} className="py-12 text-center text-sm text-gray-400">No active tickets.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════ */}
        {/* KNOWLEDGE BASE TAB                       */}
        {/* ════════════════════════════════════════ */}
        {activeTab === 'kb' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  placeholder="Search knowledge base…"
                  className="w-full pl-8 pr-3 py-[7px] bg-white border border-gray-200 rounded-[6px] text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                />
              </div>
              <button className="px-3 py-[7px] text-xs font-medium bg-white border border-gray-200 rounded-[6px] hover:bg-gray-50 flex items-center gap-1.5 text-gray-700">
                <Plus className="w-3.5 h-3.5" /> New Article
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {KB_ARTICLES.map(a => {
                const cc = categoryConfig[a.category];
                const Cicon = cc.icon;
                return (
                  <div key={a.id} className="bg-white rounded-[8px] border border-gray-200 p-4 hover:border-brand/30 hover:shadow-sm transition-all cursor-pointer">
                    <div className="flex items-start justify-between mb-2">
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${cc.bg} ${cc.color}`}>
                        <Cicon className="w-3 h-3" />{cc.label}
                      </span>
                      <span className="text-[10px] text-gray-400">{a.id}</span>
                    </div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-3 leading-snug">{a.title}</h4>
                    <div className="flex items-center justify-between text-[11px] text-gray-500">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{a.views}</span>
                        <span className="flex items-center gap-1 text-emerald-600"><CheckCircle className="w-3 h-3" />{a.helpful}</span>
                      </div>
                      <span>Updated {fmtDate(a.lastUpdated)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════ */}
        {/* ANALYTICS TAB                            */}
        {/* ════════════════════════════════════════ */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <KpiCard label="Total Tickets" value={analytics.total.toString()} sub={`${analytics.open} active, ${analytics.resolved} resolved`} accent="indigo" />
              <KpiCard label="SLA Compliance" value={fmtPct(analytics.slaCompliance)} sub={`${breached.length} breached`} accent={analytics.slaCompliance >= 0.9 ? 'emerald' : 'amber'} />
              <KpiCard label="Avg First Response" value={`${analytics.avgFrt.toFixed(1)} h`} sub="Target: 4h" accent="blue" />
              <KpiCard label="Avg Resolution" value={`${analytics.avgRt.toFixed(1)} h`} sub="Target: 24h" accent="indigo" />
              <KpiCard label="CSAT" value={analytics.avgCsat ? `${analytics.avgCsat.toFixed(2)} / 5` : '—'} sub={`${TICKETS.filter(t => t.csatScore).length} responses`} accent={analytics.avgCsat >= 4 ? 'emerald' : 'amber'} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Tickets by category */}
              <div className="bg-white rounded-[8px] border border-gray-200">
                <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-brand" />
                  <h3 className="text-sm font-semibold text-gray-900">Tickets by Category</h3>
                </div>
                <div className="px-5 py-4 space-y-2.5">
                  {Object.entries(analytics.byCategory)
                    .sort((a, b) => b[1] - a[1])
                    .map(([cat, count]) => {
                      const cc = categoryConfig[cat as TicketCategory];
                      const Cicon = cc.icon;
                      const pct = (count / analytics.total) * 100;
                      return (
                        <div key={cat}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="flex items-center gap-1.5 text-xs text-gray-700">
                              <Cicon className="w-3.5 h-3.5 text-gray-400" />
                              {cc.label}
                            </span>
                            <span className="text-xs font-semibold text-gray-900 tabular-nums">{count}</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-brand rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Tickets by assignee */}
              <div className="bg-white rounded-[8px] border border-gray-200">
                <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
                  <Users className="w-4 h-4 text-brand" />
                  <h3 className="text-sm font-semibold text-gray-900">Workload by Assignee</h3>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/60">
                      <Th className="pl-5">Assignee</Th>
                      <Th>Open</Th>
                      <Th>Resolved</Th>
                      <Th className="pr-5">Load</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(analytics.byAssignee)
                      .sort((a, b) => b[1].open - a[1].open)
                      .map(([name, c]) => {
                        const total = c.open + c.resolved;
                        return (
                          <tr key={name} className="border-b border-gray-50">
                            <td className="pl-5 py-2.5 text-sm text-gray-900 font-medium">{name}</td>
                            <td className="py-2.5 text-sm font-semibold tabular-nums text-gray-900">{c.open}</td>
                            <td className="py-2.5 text-sm tabular-nums text-emerald-600">{c.resolved}</td>
                            <td className="pr-5 py-2.5">
                              <div className="flex items-center gap-2">
                                <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-brand rounded-full" style={{ width: `${total ? (c.open / total) * 100 : 0}%` }} />
                                </div>
                                <span className="text-[11px] text-gray-500 tabular-nums">{total}</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent CSAT scores */}
            <div className="bg-white rounded-[8px] border border-gray-200">
              <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-semibold text-gray-900">Recent Customer Satisfaction</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {TICKETS.filter(t => t.csatScore).map(t => (
                  <div key={t.id} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{t.merchant}</p>
                      <p className="text-[11px] text-gray-500">{t.id} · {t.subject}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map(n => (
                        <Star key={n} className={`w-3.5 h-3.5 ${n <= (t.csatScore || 0) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                      ))}
                    </div>
                  </div>
                ))}
                {TICKETS.filter(t => t.csatScore).length === 0 && (
                  <p className="px-5 py-8 text-center text-sm text-gray-400">No CSAT responses yet.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── New Ticket Composer ─── */}
      {composerOpen && (
        <NewTicketComposer onClose={() => setComposerOpen(false)} />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════
// TICKET DETAIL (expanded row)
// ═══════════════════════════════════════════════

function TicketDetail({ ticket }: { ticket: Ticket }) {
  const cc = categoryConfig[ticket.category];
  const sc = statusConfig[ticket.status];
  const pc = priorityConfig[ticket.priority];
  const Ch = channelConfig[ticket.channel].icon;
  const [reply, setReply] = useState('');
  const [internalNote, setInternalNote] = useState(false);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* LEFT: Description + conversation thread */}
      <div className="lg:col-span-2 space-y-4">
        {/* Description */}
        <div className="bg-white rounded-[6px] border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold">Description</p>
            <span className="text-[10px] text-gray-400 flex items-center gap-1"><Ch className="w-3 h-3" />{channelConfig[ticket.channel].label}</span>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
          {ticket.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-gray-100">
              {ticket.tags.map(t => (
                <span key={t} className="text-[10px] text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">{t}</span>
              ))}
            </div>
          )}
        </div>

        {/* Conversation */}
        <div className="bg-white rounded-[6px] border border-gray-200">
          <p className="px-4 pt-3 pb-2 text-[10px] text-gray-500 uppercase tracking-wide font-semibold border-b border-gray-100">
            Conversation &amp; Internal Notes ({ticket.notes.length})
          </p>
          <div className="divide-y divide-gray-100 max-h-[280px] overflow-y-auto">
            {ticket.notes.length === 0 ? (
              <p className="px-4 py-6 text-center text-xs text-gray-400 italic">No conversation yet.</p>
            ) : ticket.notes.map((n, i) => (
              <div key={i} className={`px-4 py-3 ${n.internal ? 'bg-amber-50/50' : ''}`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-brand/10 text-brand text-[10px] font-bold flex items-center justify-center">
                      {n.author.split(' ').map(s => s[0]).join('').slice(0, 2)}
                    </div>
                    <span className="text-xs font-semibold text-gray-900">{n.author}</span>
                    {n.internal && <span className="text-[9px] font-bold text-amber-700 bg-amber-100 px-1.5 py-px rounded">INTERNAL</span>}
                  </div>
                  <span className="text-[10px] text-gray-400">{fmtDateTime(n.date)}</span>
                </div>
                <p className="text-xs text-gray-700 leading-relaxed pl-8">{n.text}</p>
              </div>
            ))}
          </div>

          {/* Reply box */}
          <div className="border-t border-gray-100 p-3">
            <textarea
              value={reply}
              onChange={e => setReply(e.target.value)}
              placeholder={internalNote ? 'Add an internal note (not visible to merchant)…' : 'Reply to merchant…'}
              rows={3}
              className={`w-full px-3 py-2 border rounded-[6px] text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand ${
                internalNote ? 'bg-amber-50/50 border-amber-200' : 'bg-white border-gray-200'
              }`}
            />
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-[11px] text-gray-600 cursor-pointer">
                  <input type="checkbox" checked={internalNote} onChange={e => setInternalNote(e.target.checked)} className="rounded text-brand focus:ring-brand" />
                  Internal note
                </label>
                <button className="text-[11px] text-gray-500 hover:text-gray-900 flex items-center gap-1">
                  <Paperclip className="w-3 h-3" /> Attach
                </button>
              </div>
              <button
                disabled={!reply.trim()}
                className="px-3 py-1.5 bg-brand text-white text-xs font-medium rounded-[6px] hover:bg-brand-hover disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <Send className="w-3 h-3" /> Send
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: Properties + contact + actions */}
      <div className="space-y-4">
        {/* Status / Priority quick edit */}
        <div className="bg-white rounded-[6px] border border-gray-200 p-4 space-y-3">
          <p className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold">Properties</p>
          <DetailRow label="Status" value={
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${sc.bg} ${sc.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />{sc.label}
            </span>
          } />
          <DetailRow label="Priority" value={
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${pc.bg} ${pc.color}`}>{pc.label}</span>
          } />
          <DetailRow label="Category" value={
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${cc.bg} ${cc.color}`}>{cc.label}</span>
          } />
          <DetailRow label="Assignee" value={<span className="text-xs font-medium text-gray-900">{ticket.assignee}</span>} />
          <DetailRow label="Created" value={<span className="text-xs text-gray-700">{fmtDateTime(ticket.createdAt)}</span>} />
          <DetailRow label="Updated" value={<span className="text-xs text-gray-700">{fmtDateTime(ticket.updatedAt)}</span>} />
          <DetailRow label="SLA Due" value={
            <span className={`text-xs font-semibold tabular-nums ${ticket.hoursToSla < 0 ? 'text-red-600' : ticket.hoursToSla <= 4 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {fmtDateTime(ticket.slaDueAt)}
            </span>
          } />
        </div>

        {/* Merchant card */}
        <div className="bg-white rounded-[6px] border border-gray-200 p-4">
          <p className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold mb-3">Merchant</p>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-[8px] bg-indigo-50 flex items-center justify-center shrink-0">
              <Store className="w-5 h-5 text-brand" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{ticket.merchant}</p>
              <p className="text-[11px] text-gray-500">{ticket.merchantId} · {ticket.vertical}</p>
              <a href="#" className="text-[11px] text-brand hover:underline inline-flex items-center gap-0.5 mt-1">
                View merchant <ArrowUpRight className="w-3 h-3" />
              </a>
            </div>
          </div>
          <div className="border-t border-gray-100 mt-3 pt-3 space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] text-gray-600">
              <User className="w-3 h-3 text-gray-400" />{ticket.contactName}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-gray-600">
              <Mail className="w-3 h-3 text-gray-400" />{ticket.contactEmail}
            </div>
            {ticket.contactPhone && (
              <div className="flex items-center gap-1.5 text-[11px] text-gray-600">
                <Phone className="w-3 h-3 text-gray-400" />{ticket.contactPhone}
              </div>
            )}
          </div>
          {ticket.relatedDealId && (
            <div className="border-t border-gray-100 mt-3 pt-3">
              <p className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold mb-1">Related Deal</p>
              <a href="#" className="text-xs text-brand hover:underline inline-flex items-center gap-0.5">
                {ticket.relatedDealId} <ArrowUpRight className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-[6px] border border-gray-200 p-3 space-y-1">
          <p className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold px-1 pb-1">Quick Actions</p>
          <ActionBtn icon={CheckCircle} label="Mark Resolved" />
          <ActionBtn icon={User} label="Reassign" />
          <ActionBtn icon={Tag} label="Add Tags" />
          <ActionBtn icon={AlertCircle} label="Escalate" danger />
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// NEW TICKET COMPOSER (modal)
// ═══════════════════════════════════════════════

function NewTicketComposer({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white rounded-[12px] shadow-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LifeBuoy className="w-5 h-5 text-brand" />
            <h3 className="text-base font-semibold text-gray-900">New Support Ticket</h3>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-[6px] text-gray-400">
            ✕
          </button>
        </div>
        <div className="px-5 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <FormGroup label="Merchant">
            <input className="w-full px-3 py-2 border border-gray-200 rounded-[6px] text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" placeholder="Search merchant by name or MID…" />
          </FormGroup>
          <div className="grid grid-cols-2 gap-3">
            <FormGroup label="Category">
              <select className="w-full px-3 py-2 border border-gray-200 rounded-[6px] text-sm focus:outline-none focus:border-brand">
                {Object.entries(categoryConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </FormGroup>
            <FormGroup label="Priority">
              <select className="w-full px-3 py-2 border border-gray-200 rounded-[6px] text-sm focus:outline-none focus:border-brand">
                {Object.entries(priorityConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </FormGroup>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormGroup label="Channel">
              <select className="w-full px-3 py-2 border border-gray-200 rounded-[6px] text-sm focus:outline-none focus:border-brand">
                {Object.entries(channelConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </FormGroup>
            <FormGroup label="Assignee">
              <select className="w-full px-3 py-2 border border-gray-200 rounded-[6px] text-sm focus:outline-none focus:border-brand">
                <option>Sarah M.</option>
                <option>John D.</option>
                <option>Tech Support</option>
                <option>Risk Team</option>
                <option>UW Team</option>
                <option>Retention</option>
                <option>Unassigned</option>
              </select>
            </FormGroup>
          </div>
          <FormGroup label="Subject">
            <input className="w-full px-3 py-2 border border-gray-200 rounded-[6px] text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" placeholder="Short summary of the issue" />
          </FormGroup>
          <FormGroup label="Description">
            <textarea rows={5} className="w-full px-3 py-2 border border-gray-200 rounded-[6px] text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" placeholder="Detailed description, steps to reproduce, what was tried…" />
          </FormGroup>
          <FormGroup label="Tags">
            <input className="w-full px-3 py-2 border border-gray-200 rounded-[6px] text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" placeholder="comma,separated,tags" />
          </FormGroup>
        </div>
        <div className="px-5 py-3 border-t border-gray-200 flex items-center justify-end gap-2 bg-gray-50">
          <button onClick={onClose} className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-[6px]">Cancel</button>
          <button className="px-4 py-1.5 bg-brand text-white text-sm font-medium rounded-[6px] hover:bg-brand-hover flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Create Ticket
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════

function Th({ children, className = '' }: { children?: React.ReactNode; className?: string }) {
  return (
    <th className={`py-2.5 px-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wide text-left ${className}`}>
      {children}
    </th>
  );
}

function SummaryCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent: string }) {
  return (
    <div className={`bg-white rounded-[8px] border border-gray-200 border-t-2 ${accent} p-4`}>
      <p className="text-[11px] text-gray-500 uppercase tracking-wide font-medium mb-1.5">{label}</p>
      <div className="flex items-end justify-between">
        <p className="text-xl font-bold text-gray-900 leading-none">{value}</p>
        {sub && <p className="text-xs text-gray-400">{sub}</p>}
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent: string }) {
  const accentMap: Record<string, string> = {
    indigo: 'border-t-brand', emerald: 'border-t-emerald-500', amber: 'border-t-amber-500',
    red: 'border-t-red-500', blue: 'border-t-blue-500',
  };
  return (
    <div className={`bg-white rounded-[8px] border border-gray-200 border-t-2 ${accentMap[accent] || ''} p-4`}>
      <p className="text-[11px] text-gray-500 uppercase tracking-wide font-medium mb-1.5">{label}</p>
      <p className="text-xl font-bold text-gray-900 leading-none">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1.5">{sub}</p>}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[11px] text-gray-500">{label}</span>
      {value}
    </div>
  );
}

function ActionBtn({ icon: Icon, label, danger = false }: { icon: React.ElementType; label: string; danger?: boolean }) {
  return (
    <button className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[6px] text-xs font-medium transition-colors ${
      danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-50'
    }`}>
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}

function FormGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wide mb-1.5">{label}</label>
      {children}
    </div>
  );
}
