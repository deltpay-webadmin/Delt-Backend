import React, { useState, useMemo } from 'react';
import {
  Mail, MessageSquare, Phone, Search, Plus, X, Send,
  ChevronRight, User, Store, Clock, CheckCircle, AlertTriangle,
  Paperclip, Star, StarOff, Archive, Reply, Forward,
  Edit3, Filter, ArrowRight, Eye, MoreHorizontal,
  Inbox, ChevronDown, Circle, ExternalLink, Calendar,
  Mic, PhoneOff, PhoneIncoming, PhoneOutgoing, FileText,
} from 'lucide-react';
import { useThreads, inboxActions, type InboxChannel as ChannelType, type InboxThreadStatus as ThreadStatus, type InboxMessage as Message, type InboxThread as Thread } from '../crmStore';

// Types are imported from crmStore.

const CHANNEL_CONFIG: Record<ChannelType, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  email: { icon: Mail, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', label: 'Email' },
  sms: { icon: MessageSquare, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200', label: 'SMS' },
  call: { icon: Phone, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', label: 'Call' },
  note: { icon: Edit3, color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200', label: 'Note' },
};


// ── Compose Modal ──
function ComposeModal({ onClose, onSend }: { onClose: () => void; onSend: (input: { channel: 'email' | 'sms'; to: string; subject?: string; body: string }) => void }) {
  const [channel, setChannel] = useState<'email' | 'sms'>('email');
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const canSend = to.trim().length > 0 && body.trim().length > 0;
  const handleSend = () => {
    if (!canSend) return;
    onSend({ channel, to: to.trim(), subject: subject.trim() || undefined, body: body.trim() });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-[8px] shadow-xl w-full max-w-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-bold text-gray-900">New Message</h3>
            <div className="flex bg-gray-100 rounded-[6px] p-0.5">
              {(['email', 'sms'] as const).map(c => {
                const cfg = CHANNEL_CONFIG[c];
                const Icon = cfg.icon;
                return (
                  <button key={c} onClick={() => setChannel(c)}
                    className={`flex items-center gap-1 px-3 py-1 rounded-[4px] text-xs font-medium transition-all ${
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
              className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-[6px] text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
          </div>
          {channel === 'email' && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-16 shrink-0">Subject:</span>
              <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject line..."
                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-[6px] text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
            </div>
          )}
          <textarea value={body} onChange={e => setBody(e.target.value)} rows={channel === 'email' ? 10 : 4}
            placeholder={channel === 'email' ? 'Write your email...' : 'Write your message...'}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-[6px] text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand resize-none" />
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-200 bg-gray-50 rounded-b-[8px]">
          <div className="flex items-center gap-2">
            <button className="p-1.5 hover:bg-gray-100 rounded"><Paperclip className="w-4 h-4 text-gray-400" /></button>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-[6px]">Cancel</button>
            <button onClick={handleSend} disabled={!canSend} className="flex items-center gap-1.5 px-4 py-2 bg-brand text-white text-xs font-medium rounded-[6px] hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed">
              <Send className="w-3.5 h-3.5" /> Send
            </button>
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
  const threads = useThreads();

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

  const toggleStar = (id: string) => inboxActions.toggleStar(id);

  const openThread = (id: string) => {
    setSelectedThread(id);
    inboxActions.markRead(id);
  };

  const sendReply = () => {
    if (!selectedThread || !replyText.trim()) return;
    inboxActions.reply(selectedThread, replyText.trim());
    setReplyText('');
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
        <button onClick={() => setShowCompose(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-brand text-white text-xs font-medium rounded-[6px] hover:bg-brand-hover">
          <Plus className="w-3.5 h-3.5" /> Compose
        </button>
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
                className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-[6px] text-xs focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
            </div>
            <div className="flex items-center gap-1 flex-wrap">
              {(['all', 'unread', 'starred'] as const).map(s => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={`px-2 py-1 rounded-[4px] text-[10px] font-semibold border transition-colors ${
                    statusFilter === s ? 'bg-brand/5 text-brand border-brand/20' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                  }`}>{s === 'all' ? `All (${threads.length})` : s === 'unread' ? `Unread (${unreadCount})` : `Starred (${starredCount})`}</button>
              ))}
              <div className="border-l border-gray-200 pl-1 ml-1 flex gap-1">
                {(['all', 'email', 'sms', 'call'] as const).map(c => {
                  if (c === 'all') return (
                    <button key={c} onClick={() => setChannelFilter('all')}
                      className={`px-2 py-1 rounded-[4px] text-[10px] font-semibold border transition-colors ${channelFilter === 'all' ? 'bg-brand/5 text-brand border-brand/20' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}>All</button>
                  );
                  const cfg = CHANNEL_CONFIG[c];
                  const Icon = cfg.icon;
                  return (
                    <button key={c} onClick={() => setChannelFilter(channelFilter === c ? 'all' : c)}
                      className={`flex items-center gap-1 px-2 py-1 rounded-[4px] text-[10px] font-semibold border transition-colors ${
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
                        {thread.dealId && <span className="text-[8px] font-mono text-brand bg-indigo-50 px-1 py-0.5 rounded">{thread.dealId}</span>}
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
                  {activeThread.dealId && <span className="text-[9px] font-mono text-brand bg-indigo-50 px-1.5 py-0.5 rounded">{activeThread.dealId}</span>}
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
                <button onClick={() => { inboxActions.archive(activeThread.id); setSelectedThread(null); }} className="p-1.5 hover:bg-gray-100 rounded" title="Archive"><Archive className="w-4 h-4 text-gray-400" /></button>
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
                            <button key={i} className="flex items-center gap-1 px-2 py-1 bg-gray-50 rounded-[4px] text-[10px] text-gray-600 hover:bg-gray-100 border border-gray-200">
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
                    className="w-full pl-4 pr-20 py-2.5 bg-white border border-gray-200 rounded-[6px] text-xs focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                    onKeyDown={e => { if (e.key === 'Enter') sendReply(); }} />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button className="p-1 hover:bg-gray-100 rounded" title="Attach"><Paperclip className="w-3.5 h-3.5 text-gray-400" /></button>
                    <button onClick={sendReply} disabled={!replyText.trim()}
                      className={`p-1.5 rounded-[4px] transition-all ${replyText.trim() ? 'bg-brand hover:bg-brand-hover' : 'bg-gray-200 cursor-not-allowed'}`}
                      title="Send reply">
                      <Send className="w-3 h-3 text-white" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <button
                  onClick={() => {
                    if (!replyText.trim()) return;
                    inboxActions.reply(activeThread.id, `[Call log] ${replyText.trim()}`);
                    setReplyText('');
                  }}
                  className="text-[10px] text-gray-500 hover:text-brand flex items-center gap-1"
                  title="Append message as call log"
                ><Phone className="w-3 h-3" /> Log call</button>
                <button
                  onClick={() => {
                    if (!replyText.trim()) return;
                    inboxActions.reply(activeThread.id, `[Note] ${replyText.trim()}`);
                    setReplyText('');
                  }}
                  className="text-[10px] text-gray-500 hover:text-brand flex items-center gap-1"
                  title="Append message as internal note"
                ><Edit3 className="w-3 h-3" /> Add note</button>
                <button
                  onClick={() => inboxActions.setStatus(activeThread.id, 'unread')}
                  className="text-[10px] text-gray-500 hover:text-brand flex items-center gap-1"
                  title="Mark unread to follow up"
                ><Calendar className="w-3 h-3" /> Mark unread</button>
              </div>
            </div>
          </div>
        )}

        {/* Empty state when no thread selected */}
        {!selectedThread && filtered.length > 0 && (
          <div className="hidden" />
        )}
      </div>

      {showCompose && (
        <ComposeModal
          onClose={() => setShowCompose(false)}
          onSend={(input) => {
            const thread = inboxActions.compose(input);
            setSelectedThread(thread.id);
          }}
        />
      )}
    </div>
  );
}
