import React, { useState, useMemo } from 'react';
import {
  Mail, MessageSquare, Phone, Search, Plus, X, Send,
  ChevronRight, User, Store, Clock, CheckCircle, AlertTriangle,
  Paperclip, Star, StarOff, Archive, Reply, Forward,
  Edit3, Filter, ArrowRight, Eye, MoreHorizontal,
  Inbox, ChevronDown, Circle, ExternalLink, Calendar,
  Mic, PhoneOff, PhoneIncoming, PhoneOutgoing,
} from 'lucide-react';
import { Button } from '../ui';

// ── Types ──
type ChannelType = 'email' | 'sms' | 'call' | 'note';
type ThreadStatus = 'unread' | 'read' | 'replied' | 'archived';

interface Message {
  id: string;
  direction: 'inbound' | 'outbound';
  channel: ChannelType;
  from: string;
  to: string;
  subject?: string;
  body: string;
  timestamp: string;
  attachments?: string[];
}

interface Thread {
  id: string;
  merchant: string;
  merchantId: string;
  contact: string;
  contactEmail?: string;
  contactPhone?: string;
  channel: ChannelType;
  status: ThreadStatus;
  starred: boolean;
  lastMessage: string;
  lastTimestamp: string;
  messageCount: number;
  agent: string;
  dealId?: string;
  messages: Message[];
}

const CHANNEL_CONFIG: Record<ChannelType, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  email: { icon: Mail, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', label: 'Email' },
  sms: { icon: MessageSquare, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200', label: 'SMS' },
  call: { icon: Phone, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', label: 'Call' },
  note: { icon: Edit3, color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200', label: 'Note' },
};

// ── Mock Threads ──
const THREADS: Thread[] = [
  {
    id: 'th-1', merchant: 'Brooklyn Vinyl Records', merchantId: 'M-1002', contact: 'David Park', contactEmail: 'david@brooklynvinyl.com', contactPhone: '(718) 555-0198',
    channel: 'email', status: 'unread', starred: true, lastMessage: 'Hi Sarah, I received the disclosure documents but I have a question about the broker compensation section...', lastTimestamp: '2026-04-17 10:30', messageCount: 4, agent: 'Sarah Kim', dealId: 'DL-2026-0415',
    messages: [
      { id: 'm1a', direction: 'outbound', channel: 'email', from: 'Sarah Kim <sarah@deltpay.com>', to: 'david@brooklynvinyl.com', subject: 'NY CFDL Disclosure Package — Brooklyn Vinyl Records', body: 'Hi David,\n\nAttached is your Commercial Finance Disclosure as required by New York law. Please review all 9 items carefully.\n\nKey points:\n- Total funds provided: $62,000\n- Estimated APR: 42.8%\n- Daily payment: $285\n- Total repayment: $88,040\n\nPlease sign and return the acknowledgment at your earliest convenience.\n\nBest,\nSarah Kim\nDelt Pay', timestamp: '2026-04-16 15:10', attachments: ['NY_CFDL_Disclosure_DL-2026-0415.pdf', 'Acknowledgment_Form.pdf'] },
      { id: 'm1b', direction: 'inbound', channel: 'email', from: 'david@brooklynvinyl.com', to: 'sarah@deltpay.com', subject: 'Re: NY CFDL Disclosure Package — Brooklyn Vinyl Records', body: 'Hi Sarah,\n\nThank you for sending this over. I\'ve reviewed most of it. Two questions:\n\n1. The estimated APR seems high — is that typical for this type of financing?\n2. I don\'t see the broker compensation disclosure. I thought that was required in NY?\n\nThanks,\nDavid', timestamp: '2026-04-16 16:45' },
      { id: 'm1c', direction: 'outbound', channel: 'email', from: 'Sarah Kim <sarah@deltpay.com>', to: 'david@brooklynvinyl.com', subject: 'Re: Re: NY CFDL Disclosure Package — Brooklyn Vinyl Records', body: 'Hi David,\n\nGreat questions.\n\n1. The estimated APR is required by NY law to be disclosed — it converts the factor rate (1.42) into an annualized percentage. The actual dollar cost of financing is $26,040.\n\n2. You\'re correct — the broker compensation disclosure is a separate document. I\'m generating it now and will send it over by end of day tomorrow.\n\nPlease don\'t sign the acknowledgment until you\'ve received both documents.\n\nBest,\nSarah', timestamp: '2026-04-16 17:20' },
      { id: 'm1d', direction: 'inbound', channel: 'email', from: 'david@brooklynvinyl.com', to: 'sarah@deltpay.com', subject: 'Re: Re: Re: NY CFDL Disclosure Package — Brooklyn Vinyl Records', body: 'Hi Sarah, I received the disclosure documents but I have a question about the broker compensation section. Specifically, does the $3,100 commission include all fees, or are there additional charges I should know about?\n\nAlso, once I sign everything, how quickly can the funds be deposited?\n\nThanks,\nDavid', timestamp: '2026-04-17 10:30' },
    ],
  },
  {
    id: 'th-2', merchant: 'Havana Bites Cafe', merchantId: 'M-1001', contact: 'Maria Gonzalez', contactEmail: 'maria@havanabites.com', contactPhone: '(305) 555-0142',
    channel: 'sms', status: 'read', starred: false, lastMessage: 'Great, thank you for the update! We are excited about the renewal offer.', lastTimestamp: '2026-04-16 14:15', messageCount: 5, agent: 'Marcus Johnson',
    messages: [
      { id: 'm2a', direction: 'outbound', channel: 'sms', from: 'Delt Pay', to: '(305) 555-0142', body: 'Hi Maria! This is Marcus from Delt Pay. Your funding of $45,000 has been deposited. Daily payments of $145 begin tomorrow. Questions? Reply here or call (305) 555-0100.', timestamp: '2026-04-14 10:30' },
      { id: 'm2b', direction: 'inbound', channel: 'sms', from: '(305) 555-0142', to: 'Delt Pay', body: 'Thank you Marcus!! I see the deposit. 🙏 Quick question — if we have a slow day can we adjust the payment?', timestamp: '2026-04-14 11:15' },
      { id: 'm2c', direction: 'outbound', channel: 'sms', from: 'Delt Pay', to: '(305) 555-0142', body: 'Great to hear! Yes, your agreement includes a reconciliation provision. If your daily receipts drop significantly you can request an adjustment. Just reach out and we\'ll review.', timestamp: '2026-04-14 11:30' },
      { id: 'm2d', direction: 'outbound', channel: 'sms', from: 'Delt Pay', to: '(305) 555-0142', body: 'Hi Maria! Just a heads up — you\'ve repaid 73% of your advance. You\'re pre-qualified for a renewal of up to $50K. Want me to send over the details?', timestamp: '2026-04-15 09:15' },
      { id: 'm2e', direction: 'inbound', channel: 'sms', from: '(305) 555-0142', to: 'Delt Pay', body: 'Great, thank you for the update! We are excited about the renewal offer.', timestamp: '2026-04-16 14:15' },
    ],
  },
  {
    id: 'th-3', merchant: 'Midtown Taqueria', merchantId: 'M-1005', contact: 'Roberto Fuentes', contactEmail: 'roberto@midtowntaq.com', contactPhone: '(212) 555-0167',
    channel: 'call', status: 'read', starred: false, lastMessage: 'Inbound call — 12m 05s. Owner asked about chargeback on Mar 28. Explained dispute process.', lastTimestamp: '2026-04-14 16:45', messageCount: 3, agent: 'Marcus Johnson',
    messages: [
      { id: 'm3a', direction: 'outbound', channel: 'call', from: 'Marcus Johnson', to: '(212) 555-0167', body: 'Called to introduce Delt\'s dispute management service. Owner interested. Explained process for MC chargebacks and timeline. Scheduled follow-up for next week.', timestamp: '2026-04-10 10:30' },
      { id: 'm3b', direction: 'outbound', channel: 'email', from: 'Marcus Johnson <marcus@deltpay.com>', to: 'roberto@midtowntaq.com', subject: 'Chargeback Management — Next Steps', body: 'Hi Roberto,\n\nGreat speaking with you. As discussed, here\'s how our dispute management works:\n\n1. We monitor your chargebacks in real-time\n2. When a CB comes in, we draft the response with compelling evidence\n3. We file within the deadline\n\nYour current MC CB ratio is 1.17% — below the 1.5% ECM threshold, but climbing. We\'ll keep an eye on it.\n\nBest,\nMarcus', timestamp: '2026-04-10 11:00' },
      { id: 'm3c', direction: 'inbound', channel: 'call', from: '(212) 555-0167', to: 'Marcus Johnson', body: 'Inbound call — 12m 05s. Owner asked about chargeback on Mar 28 transaction ($315). Customer claims food not delivered, but merchant has DoorDash delivery confirmation. Explained how to compile compelling evidence. Will follow up with documentation request email.', timestamp: '2026-04-14 16:45' },
    ],
  },
  {
    id: 'th-4', merchant: 'Richmond Auto Detailing', merchantId: 'M-1003', contact: 'James Richardson', contactEmail: 'james@richmondauto.com', contactPhone: '(804) 555-0134',
    channel: 'call', status: 'read', starred: true, lastMessage: 'Called re: VA 3-day review period. Merchant confirms receipt of disclosure. Funding Apr 22.', lastTimestamp: '2026-04-17 09:15', messageCount: 2, agent: 'Marcus Johnson', dealId: 'DL-2026-0416',
    messages: [
      { id: 'm4a', direction: 'outbound', channel: 'email', from: 'Marcus Johnson <marcus@deltpay.com>', to: 'james@richmondauto.com', subject: 'VA Disclosure Package — Richmond Auto Detailing', body: 'Hi James,\n\nAttached is your Virginia commercial financing disclosure as required by HB 1027.\n\nIMPORTANT: Virginia law requires a 3-business-day review period before we can proceed with funding. This means we cannot fund before April 22, 2026.\n\nPlease review the attached documents carefully. I\'ll call you tomorrow to answer any questions.\n\nBest,\nMarcus Johnson\nDelt Pay', timestamp: '2026-04-17 08:55', attachments: ['VA_Disclosure_DL-2026-0416.pdf', 'VA_Addendum.pdf'] },
      { id: 'm4b', direction: 'outbound', channel: 'call', from: 'Marcus Johnson', to: '(804) 555-0134', body: 'Called re: VA 3-day review period. Merchant confirms receipt of disclosure. Understands cannot fund before Apr 22. No questions at this time. Will call back on Apr 22 to collect signature and initiate funding.', timestamp: '2026-04-17 09:15' },
    ],
  },
  {
    id: 'th-5', merchant: 'Coral Reef Auto Spa', merchantId: 'M-1004', contact: 'Carlos Mendez', contactEmail: 'carlos@coralreefauto.com', contactPhone: '(954) 555-0189',
    channel: 'email', status: 'unread', starred: false, lastMessage: 'I spoke with my web developer. He says enabling 3DS will cost about $200/mo. Is that normal?', lastTimestamp: '2026-04-16 09:20', messageCount: 3, agent: 'James Miller',
    messages: [
      { id: 'm5a', direction: 'outbound', channel: 'call', from: 'James Miller', to: '(954) 555-0189', body: 'Called about rising chargeback rate. 3 recent CBs from single card-not-present customer. Recommended enabling 3DS for online bookings. Owner will discuss with web developer.', timestamp: '2026-04-10 09:30' },
      { id: 'm5b', direction: 'outbound', channel: 'email', from: 'James Miller <james.m@deltpay.com>', to: 'carlos@coralreefauto.com', subject: 'Chargeback Prevention — 3DS Recommendation', body: 'Hi Carlos,\n\nFollowing up on our call. Your fraud-to-sales ratio is 0.82% — getting close to Visa\'s VAMP threshold of 0.9%. We need to act quickly.\n\nHere\'s what I recommend:\n1. Enable 3D Secure for all card-not-present transactions\n2. Block the specific card that\'s been causing issues\n3. Add AVS matching for online bookings\n\nIf we don\'t get below the threshold, Visa can impose fines starting at $25,000/month.\n\nPlease let me know what your developer says.\n\nBest,\nJames', timestamp: '2026-04-12 10:00' },
      { id: 'm5c', direction: 'inbound', channel: 'email', from: 'carlos@coralreefauto.com', to: 'james.m@deltpay.com', subject: 'Re: Chargeback Prevention — 3DS Recommendation', body: 'James,\n\nI spoke with my web developer. He says enabling 3DS will cost about $200/mo. Is that normal? Also, he mentioned something about liability shift — can you explain that?\n\nWe definitely don\'t want those fines.\n\nCarlos', timestamp: '2026-04-16 09:20' },
    ],
  },
  {
    id: 'th-6', merchant: 'Little Havana Barbershop', merchantId: 'M-1006', contact: 'Tony Ramirez', contactEmail: 'tony@littlehavanabarber.com', contactPhone: '(305) 555-0156',
    channel: 'call', status: 'read', starred: false, lastMessage: 'No answer — left voicemail regarding 3 consecutive NSFs and payment plan options.', lastTimestamp: '2026-04-15 14:00', messageCount: 2, agent: 'Marcus Johnson',
    messages: [
      { id: 'm6a', direction: 'outbound', channel: 'sms', from: 'Delt Pay', to: '(305) 555-0156', body: 'Hi Tony, this is Marcus from Delt Pay. We noticed your last 3 ACH payments didn\'t go through. Please call me at (305) 555-0100 so we can discuss options. Thank you.', timestamp: '2026-04-14 10:00' },
      { id: 'm6b', direction: 'outbound', channel: 'call', from: 'Marcus Johnson', to: '(305) 555-0156', body: 'No answer — left voicemail regarding 3 consecutive NSFs and payment plan options. Mentioned we can discuss reducing daily amount or switching to weekly. Asked to call back by EOD Friday.', timestamp: '2026-04-15 14:00' },
    ],
  },
];

// ── Compose Modal ──
function ComposeModal({ onClose }: { onClose: () => void }) {
  const [channel, setChannel] = useState<'email' | 'sms'>('email');
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-[8px] shadow-xl w-full max-w-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-bold text-gray-900">New Message</h3>
            <div className="flex bg-gray-100 rounded-[8px] p-0.5">
              {(['email', 'sms'] as const).map(c => {
                const cfg = CHANNEL_CONFIG[c];
                const Icon = cfg.icon;
                return (
                  <button key={c} onClick={() => setChannel(c)}
                    className={`flex items-center gap-1 px-3 py-1 rounded-[8px] text-xs font-medium transition-all ${
                      channel === c ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                    }`}><Icon className="w-3 h-3" />{cfg.label}</button>
                );
              })}
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X className="w-4 h-4 text-gray-400" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-16 shrink-0">To:</span>
            <input value={to} onChange={e => setTo(e.target.value)} placeholder={channel === 'email' ? 'email@merchant.com' : 'Phone number'}
              className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-[8px] text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
          </div>
          {channel === 'email' && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-16 shrink-0">Subject:</span>
              <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject line..."
                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-[8px] text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
            </div>
          )}
          <textarea value={body} onChange={e => setBody(e.target.value)} rows={channel === 'email' ? 10 : 4}
            placeholder={channel === 'email' ? 'Write your email...' : 'Write your message...'}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-[8px] text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand resize-none" />
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-200 bg-gray-50 rounded-b-[8px]">
          <div className="flex items-center gap-2">
            <button className="p-1.5 hover:bg-gray-100 rounded"><Paperclip className="w-4 h-4 text-gray-400" /></button>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-[8px]">Cancel</button>
            <Button size="sm" icon={<Send />} onClick={onClose}>Send</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main ──
export function BackendInbox() {
  const [search, setSearch] = useState('');
  const [channelFilter, setChannelFilter] = useState<ChannelType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unread' | 'starred'>('all');
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [threads, setThreads] = useState(THREADS);

  const filtered = useMemo(() => {
    return threads.filter(t => {
      if (channelFilter !== 'all' && t.channel !== channelFilter) return false;
      if (statusFilter === 'unread' && t.status !== 'unread') return false;
      if (statusFilter === 'starred' && !t.starred) return false;
      if (search) {
        const q = search.toLowerCase();
        return t.merchant.toLowerCase().includes(q) || t.contact.toLowerCase().includes(q) || t.lastMessage.toLowerCase().includes(q) || t.agent.toLowerCase().includes(q);
      }
      return true;
    });
  }, [threads, search, channelFilter, statusFilter]);

  const activeThread = threads.find(t => t.id === selectedThread);
  const unreadCount = threads.filter(t => t.status === 'unread').length;
  const starredCount = threads.filter(t => t.starred).length;

  const toggleStar = (id: string) => {
    setThreads(prev => prev.map(t => t.id === id ? { ...t, starred: !t.starred } : t));
  };

  const openThread = (id: string) => {
    setSelectedThread(id);
    setThreads(prev => prev.map(t => t.id === id && t.status === 'unread' ? { ...t, status: 'read' as ThreadStatus } : t));
  };

  return (
    <div className="px-6 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[8px] bg-gradient-to-br from-brand to-brand-light flex items-center justify-center shadow-sm">
            <Inbox className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inbox</h1>
            <p className="text-sm text-gray-500">{unreadCount} unread &middot; {threads.length} conversations across all merchants</p>
          </div>
        </div>
        <Button size="sm" icon={<Plus />} onClick={() => setShowCompose(true)}>Compose</Button>
      </div>

      {/* Split view */}
      <div className="bg-white rounded-[8px] border border-gray-200 flex" style={{ minHeight: 'calc(100vh - 200px)' }}>
        {/* Thread list */}
        <div className={`${selectedThread ? 'w-[380px] border-r border-gray-200' : 'flex-1'} flex flex-col shrink-0`}>
          {/* Filters */}
          <div className="px-3 py-3 border-b border-gray-200 space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search conversations..."
                className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-[8px] text-xs focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
            </div>
            <div className="flex items-center gap-1 flex-wrap">
              {(['all', 'unread', 'starred'] as const).map(s => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={`px-2 py-1 rounded-[8px] text-[10px] font-semibold border transition-colors ${
                    statusFilter === s ? 'bg-brand/5 text-brand border-brand/20' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                  }`}>{s === 'all' ? `All (${threads.length})` : s === 'unread' ? `Unread (${unreadCount})` : `Starred (${starredCount})`}</button>
              ))}
              <div className="border-l border-gray-200 pl-1 ml-1 flex gap-1">
                {(['all', 'email', 'sms', 'call'] as const).map(c => {
                  if (c === 'all') return (
                    <button key={c} onClick={() => setChannelFilter('all')}
                      className={`px-2 py-1 rounded-[8px] text-[10px] font-semibold border transition-colors ${channelFilter === 'all' ? 'bg-brand/5 text-brand border-brand/20' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}>All</button>
                  );
                  const cfg = CHANNEL_CONFIG[c];
                  const Icon = cfg.icon;
                  return (
                    <button key={c} onClick={() => setChannelFilter(channelFilter === c ? 'all' : c)}
                      className={`flex items-center gap-1 px-2 py-1 rounded-[8px] text-[10px] font-semibold border transition-colors ${
                        channelFilter === c ? `${cfg.bg} ${cfg.color}` : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                      }`}><Icon className="w-3 h-3" /></button>
                  );
                })}
              </div>
            </div>
          </div>
          {/* Thread items */}
          <div className="flex-1 overflow-y-auto">
            {filtered.map(thread => {
              const cfg = CHANNEL_CONFIG[thread.channel];
              const Icon = cfg.icon;
              const isActive = selectedThread === thread.id;
              const isUnread = thread.status === 'unread';
              return (
                <div key={thread.id} onClick={() => openThread(thread.id)}
                  className={`px-3 py-3 border-b border-gray-100 cursor-pointer transition-colors ${
                    isActive ? 'bg-brand/5 border-l-2 border-l-brand' : isUnread ? 'bg-blue-50/30 hover:bg-gray-50' : 'hover:bg-gray-50'
                  }`}>
                  <div className="flex items-start gap-2.5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 border ${cfg.bg}`}>
                      <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className={`text-xs truncate ${isUnread ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>{thread.merchant}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[10px] text-gray-400">{thread.lastTimestamp.split(' ')[1]}</span>
                          {thread.starred && <Star className="w-3 h-3 text-amber-500 fill-amber-500" />}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] text-gray-500">{thread.contact}</span>
                        {thread.dealId && <span className="text-[8px] font-mono text-brand bg-brand-50 px-1 py-0.5 rounded">{thread.dealId}</span>}
                      </div>
                      <p className={`text-[11px] truncate ${isUnread ? 'text-gray-700' : 'text-gray-400'}`}>{thread.lastMessage}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] text-gray-400">{thread.agent}</span>
                        <span className="text-[9px] text-gray-300">&middot;</span>
                        <span className="text-[9px] text-gray-400">{thread.messageCount} messages</span>
                        {isUnread && <span className="w-1.5 h-1.5 rounded-full bg-brand shrink-0" />}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="px-5 py-16 text-center">
                <Inbox className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-400">No conversations match your filters</p>
              </div>
            )}
          </div>
        </div>

        {/* Message detail */}
        {selectedThread && activeThread && (
          <div className="flex-1 flex flex-col">
            {/* Thread header */}
            <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="text-sm font-bold text-gray-900">{activeThread.merchant}</h3>
                  <span className="text-[10px] font-mono text-gray-400">{activeThread.merchantId}</span>
                  {activeThread.dealId && <span className="text-[9px] font-mono text-brand bg-brand-50 px-1.5 py-0.5 rounded">{activeThread.dealId}</span>}
                </div>
                <div className="flex items-center gap-3 text-[11px] text-gray-500">
                  <span className="flex items-center gap-1"><User className="w-3 h-3" />{activeThread.contact}</span>
                  {activeThread.contactEmail && <span>{activeThread.contactEmail}</span>}
                  {activeThread.contactPhone && <span>{activeThread.contactPhone}</span>}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => toggleStar(activeThread.id)} className="p-1.5 hover:bg-gray-100 rounded">
                  {activeThread.starred ? <Star className="w-4 h-4 text-amber-500 fill-amber-500" /> : <StarOff className="w-4 h-4 text-gray-400" />}
                </button>
                <button className="p-1.5 hover:bg-gray-100 rounded"><Archive className="w-4 h-4 text-gray-400" /></button>
                <button onClick={() => setSelectedThread(null)} className="p-1.5 hover:bg-gray-100 rounded lg:hidden"><X className="w-4 h-4 text-gray-400" /></button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {activeThread.messages.map(msg => {
                const msgCfg = CHANNEL_CONFIG[msg.channel];
                const MsgIcon = msgCfg.icon;
                const isOutbound = msg.direction === 'outbound';
                return (
                  <div key={msg.id} className={`${isOutbound ? '' : ''}`}>
                    <div className={`rounded-[8px] border p-4 ${isOutbound ? 'bg-white border-gray-200' : 'bg-blue-50/40 border-blue-200/50'}`}>
                      {/* Message header */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isOutbound ? 'bg-brand/10' : 'bg-gray-100'}`}>
                            {isOutbound ? <Send className="w-3 h-3 text-brand" /> : <MsgIcon className={`w-3 h-3 ${msgCfg.color}`} />}
                          </div>
                          <span className="text-xs font-semibold text-gray-900">{msg.from}</span>
                          <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border ${msgCfg.bg} ${msgCfg.color}`}>
                            {msg.channel === 'call' ? (isOutbound ? 'Outbound call' : 'Inbound call') : msg.channel.toUpperCase()}
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-400 font-mono">{msg.timestamp}</span>
                      </div>
                      {/* Subject */}
                      {msg.subject && <p className="text-xs font-semibold text-gray-700 mb-2">{msg.subject}</p>}
                      {/* Body */}
                      <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">{msg.body}</p>
                      {/* Attachments */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mt-3 pt-2 border-t border-gray-100 flex items-center gap-2 flex-wrap">
                          <Paperclip className="w-3 h-3 text-gray-400 shrink-0" />
                          {msg.attachments.map((a, i) => (
                            <button key={i} className="flex items-center gap-1 px-2 py-1 bg-gray-50 rounded-[8px] text-[10px] text-gray-600 hover:bg-gray-100 border border-gray-200">
                              <FileText className="w-3 h-3 text-gray-400" />{a}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Reply bar */}
            <div className="px-5 py-3 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <input value={replyText} onChange={e => setReplyText(e.target.value)}
                    placeholder={`Reply to ${activeThread.contact}...`}
                    className="w-full pl-4 pr-20 py-2.5 bg-white border border-gray-200 rounded-[8px] text-xs focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                    onKeyDown={e => { if (e.key === 'Enter') setReplyText(''); }} />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button className="p-1 hover:bg-gray-100 rounded"><Paperclip className="w-3.5 h-3.5 text-gray-400" /></button>
                    <button onClick={() => setReplyText('')}
                      className={`p-1.5 rounded-[8px] transition-all ${replyText.trim() ? 'bg-brand hover:bg-brand-hover' : 'bg-gray-200'}`}>
                      <Send className="w-3 h-3 text-white" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <button className="text-[10px] text-gray-500 hover:text-brand flex items-center gap-1"><Phone className="w-3 h-3" /> Log call</button>
                <button className="text-[10px] text-gray-500 hover:text-brand flex items-center gap-1"><Edit3 className="w-3 h-3" /> Add note</button>
                <button className="text-[10px] text-gray-500 hover:text-brand flex items-center gap-1"><Calendar className="w-3 h-3" /> Schedule follow-up</button>
              </div>
            </div>
          </div>
        )}

        {/* Empty state when no thread selected */}
        {!selectedThread && filtered.length > 0 && (
          <div className="hidden" />
        )}
      </div>

      {showCompose && <ComposeModal onClose={() => setShowCompose(false)} />}
    </div>
  );
}
