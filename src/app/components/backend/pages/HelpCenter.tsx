import React, { useState } from 'react';
import { toast } from 'sonner@2.0.3';
import {
  Search,
  X,
  Rocket,
  FileText,
  BarChart3,
  DollarSign,
  Send,
  BookOpen,
  CreditCard,
  Brain,
  ChevronDown,
  MessageCircle,
  Ticket,
  HelpCircle,
  ArrowRight,
  GraduationCap,
  ClipboardList,
  Landmark,
} from 'lucide-react';

// ── Types ──
interface ArticleCard {
  icon: React.ElementType;
  title: string;
  description: string;
}

interface FAQItem {
  question: string;
  answer: string;
}

// ── Data ──
const gettingStarted: ArticleCard[] = [
  {
    icon: Rocket,
    title: 'Setting Up Your Merchant Account',
    description: 'Learn how to create your merchant profile, connect bank accounts, and configure payment preferences.',
  },
  {
    icon: Send,
    title: 'Submitting Your First MCA Application',
    description: 'A step-by-step walkthrough of the application process, required documents, and what to expect.',
  },
  {
    icon: BarChart3,
    title: 'Understanding Your Dashboard',
    description: 'Navigate your dashboard to monitor deal status, payment schedules, and key performance metrics.',
  },
];

const forAgents: ArticleCard[] = [
  {
    icon: DollarSign,
    title: 'How Commissions Work',
    description: 'Understand the commission structure, payout schedules, tiers, and how residuals factor into earnings.',
  },
  {
    icon: FileText,
    title: 'Submitting Applications',
    description: 'Best practices for submitting clean applications that move through underwriting quickly.',
  },
  {
    icon: BookOpen,
    title: 'Reading Your Residual Statement',
    description: 'Decode your monthly residual statement — line items, clawbacks, and portfolio performance.',
  },
];

const forMerchants: ArticleCard[] = [
  {
    icon: Landmark,
    title: 'How MCAs Work for the Company',
    description: 'Internal breakdown of MCA economics — factor rates, borrowing costs, profit splits, and how Delt generates revenue per deal.',
  },
  {
    icon: GraduationCap,
    title: 'Training Merchants on Products',
    description: 'Scripts, objection handling, and walkthrough guides for educating merchants on MCA, residuals, and leasing products.',
  },
  {
    icon: ClipboardList,
    title: 'Standard Operating Procedures',
    description: 'Step-by-step SOPs for deal intake, document collection, underwriting handoff, funding, and post-funding support.',
  },
];

const faqs: FAQItem[] = [
  {
    question: 'How long does underwriting take?',
    answer: 'Most applications are reviewed within 24–48 hours of submission. Complex deals involving higher amounts or additional documentation may take up to 72 hours. You can track real-time progress in the Pipeline under the Underwriting stage.',
  },
  {
    question: 'What happens when a merchant defaults on an MCA?',
    answer: 'When a merchant misses consecutive ACH payments, the system flags the deal as delinquent. The assigned agent is notified immediately. After 3 failed attempts, the deal enters collections status. Agents should proactively monitor the SLA alerts in the Pipeline and coordinate with the merchant before it reaches this stage.',
  },
  {
    question: 'How do I move a lead through the pipeline stages?',
    answer: 'Navigate to Pipeline → Leads and select the lead. In the detail panel, use the stage dropdown to advance the lead (e.g., from "Doc Collection" to "Underwriting"). Each stage has SLA timers — if a lead sits too long, you\'ll see a breach alert. You can also drag cards between columns in Kanban view.',
  },
  {
    question: 'How are residual commissions calculated?',
    answer: 'Residuals are calculated monthly based on the net processing volume of merchants in your portfolio. The standard rate is a percentage of the spread, paid on the 15th of each month for the prior month\'s activity. Clawbacks may apply if a merchant terminates within the first 6 months. View your full breakdown under Team → Commissions.',
  },
  {
    question: 'What is a factor rate and how does it differ from an interest rate?',
    answer: 'A factor rate is a fixed multiplier (e.g., 1.35) applied to the funded amount to determine total repayment. Unlike interest rates, factor rates don\'t compound — the cost is locked at funding. For example, a $100K advance at 1.35 means $135K total repayment. Understanding this distinction is critical when explaining costs to merchants.',
  },
];

// ── Sub-components ──
function SectionHeader({ title }: { title: string }) {
  return (
    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{title}</h2>
  );
}

function Card({ card }: { card: ArticleCard }) {
  const Icon = card.icon;
  return (
    <div className="bg-white rounded-[8px] border border-gray-200 p-6 hover:border-brand/30 hover:shadow-[0_2px_12px_rgba(67,24,255,0.06)] transition-all group">
      <div className="w-10 h-10 bg-brand/[0.06] rounded-[8px] flex items-center justify-center mb-4 group-hover:bg-brand/10 transition-colors">
        <Icon className="w-5 h-5 text-brand" />
      </div>
      <h3 className="text-sm font-semibold text-gray-900 mb-1.5">{card.title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed mb-4">{card.description}</p>
      <button onClick={() => toast.info(`Opening "${card.title}"…`)} className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:text-brand-hover transition-colors group/link">
        Read
        <ArrowRight className="w-3.5 h-3.5 translate-x-0 group-hover/link:translate-x-0.5 transition-transform" />
      </button>
    </div>
  );
}

function FAQAccordion({ item, isOpen, onToggle }: { item: FAQItem; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border border-gray-200 rounded-[8px] overflow-hidden bg-white">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50/60 transition-colors"
      >
        <span className="text-sm font-medium text-gray-900 pr-4">{item.question}</span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && (
        <div className="px-6 pb-5 -mt-1">
          <p className="text-sm text-gray-600 leading-relaxed">{item.answer}</p>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════
// Main Component
// ════════════════════════════════════════
export function HelpCenter({ onClose }: { onClose: () => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenFAQ(prev => (prev === index ? null : index));
  };

  // Simple search filter
  const q = searchQuery.toLowerCase().trim();
  const filterCards = (cards: ArticleCard[]) =>
    q ? cards.filter(c => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)) : cards;
  const filterFAQs = (items: FAQItem[]) =>
    q ? items.filter(f => f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q)) : items;

  const filteredGettingStarted = filterCards(gettingStarted);
  const filteredForAgents = filterCards(forAgents);
  const filteredForMerchants = filterCards(forMerchants);
  const filteredFAQs = filterFAQs(faqs);
  const hasResults = filteredGettingStarted.length > 0 || filteredForAgents.length > 0 || filteredForMerchants.length > 0 || filteredFAQs.length > 0;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/25 backdrop-blur-[2px]" onClick={onClose} />
      <div className="absolute inset-y-0 right-0 w-full max-w-3xl bg-canvas-muted shadow-2xl flex flex-col">
        {/* ── Header ── */}
        <div className="bg-white border-b border-gray-200 px-8 pt-7 pb-6 shrink-0">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-brand/[0.08] rounded-[8px] flex items-center justify-center">
                <HelpCircle className="w-5 h-5 text-brand" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Help Center</h1>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-[6px] transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search articles, guides, and FAQs..."
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-[8px] text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-colors placeholder:text-gray-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-200 rounded transition-colors"
              >
                <X className="w-3.5 h-3.5 text-gray-400" />
              </button>
            )}
          </div>
        </div>

        {/* ── Scrollable Content ── */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-8 py-8 space-y-10">
            {!hasResults && q && (
              <div className="text-center py-16">
                <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Search className="w-7 h-7 text-gray-300" />
                </div>
                <p className="text-sm font-medium text-gray-900 mb-1">No results found</p>
                <p className="text-sm text-gray-500">Try a different search term or browse the sections below.</p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-4 text-sm font-medium text-brand hover:text-brand-hover"
                >
                  Clear search
                </button>
              </div>
            )}

            {/* Getting Started */}
            {filteredGettingStarted.length > 0 && (
              <section>
                <SectionHeader title="Getting Started" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                  {filteredGettingStarted.map(card => (
                    <Card key={card.title} card={card} />
                  ))}
                </div>
              </section>
            )}

            {/* For Agents */}
            {filteredForAgents.length > 0 && (
              <section>
                <SectionHeader title="For Agents" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                  {filteredForAgents.map(card => (
                    <Card key={card.title} card={card} />
                  ))}
                </div>
              </section>
            )}

            {/* For Merchants */}
            {filteredForMerchants.length > 0 && (
              <section>
                <SectionHeader title="Industry Knowledge & SOPs" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                  {filteredForMerchants.map(card => (
                    <Card key={card.title} card={card} />
                  ))}
                </div>
              </section>
            )}

            {/* FAQ */}
            {filteredFAQs.length > 0 && (
              <section>
                <SectionHeader title="Frequently Asked Questions" />
                <div className="space-y-2.5 mt-4">
                  {filteredFAQs.map((faq, i) => {
                    const originalIndex = faqs.indexOf(faq);
                    return (
                      <FAQAccordion
                        key={originalIndex}
                        item={faq}
                        isOpen={openFAQ === originalIndex}
                        onToggle={() => toggleFAQ(originalIndex)}
                      />
                    );
                  })}
                </div>
              </section>
            )}

            {/* Still need help? */}
            {!q && (
              <section>
                <div className="bg-white rounded-[8px] border border-gray-200 p-8 text-center">
                  <div className="w-12 h-12 bg-brand/[0.06] rounded-xl flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="w-6 h-6 text-brand" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1.5">Still need help?</h3>
                  <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
                    Can't find what you're looking for? Our support team is available Monday–Friday, 9 AM–6 PM EST.
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <button onClick={() => toast.success('Connecting you with support…')} className="px-5 py-2.5 bg-brand text-white text-sm font-semibold rounded-[6px] hover:bg-brand-hover transition-colors flex items-center gap-2">
                      <MessageCircle className="w-4 h-4" />
                      Contact Support
                    </button>
                    <button onClick={() => toast.info('Opening ticket form…')} className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-[6px] hover:bg-gray-50 transition-colors flex items-center gap-2">
                      <Ticket className="w-4 h-4" />
                      Submit a Ticket
                    </button>
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}