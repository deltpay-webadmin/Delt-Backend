/**
 * Operations route metadata.
 *
 * Single source of truth for the new operations modules. Sidebar
 * grouping in `DeltBackendLayout` continues to drive the visible
 * sidebar; this metadata is consumed by the new operations pages and
 * the command palette to keep new surfaces discoverable.
 */

export type OperationsModuleId =
  | 'mca'
  | 'merchant_services'
  | 'ai_billing'
  | 'reporting'
  | 'audit';

export interface OperationsRoute {
  module: OperationsModuleId;
  label: string;
  path: string;
  description: string;
  /** Pages added in this expansion are flagged for command-palette badging. */
  isNew?: boolean;
}

export const OPERATIONS_ROUTES: OperationsRoute[] = [
  // MCA
  { module: 'mca', label: 'MCA Pipeline', path: '/mca/pipeline', description: 'Lifecycle dashboard: originate → fund → collect.', isNew: true },
  { module: 'mca', label: 'Funding Queue', path: '/mca/funding', description: 'Signed deals awaiting wire / in-flight wires.', isNew: true },
  { module: 'mca', label: 'Syndication', path: '/mca/syndication', description: 'Syndicator positions, capital deployed, returns.', isNew: true },
  { module: 'mca', label: 'Collections', path: '/mca/collections', description: 'Past-due cases, recovery, charge-off.', isNew: true },
  { module: 'mca', label: 'Referral Partners', path: '/mca/referrals', description: 'ISO / broker submissions and commissions.', isNew: true },

  // Merchant Services
  { module: 'merchant_services', label: 'Payout Runs', path: '/ms/payouts', description: 'Monthly residual payout cycle for agents.', isNew: true },
  { module: 'merchant_services', label: 'Chargebacks', path: '/ms/chargebacks', description: 'Dispute case workflow with deadlines.', isNew: true },
  { module: 'merchant_services', label: 'Terminals', path: '/ms/terminals', description: 'Terminal inventory + parameter management.', isNew: true },

  // AI / Websites billing
  { module: 'ai_billing', label: 'AI Usage', path: '/ai/usage', description: 'Per-merchant usage events across AI products.', isNew: true },
  { module: 'ai_billing', label: 'Billing Events', path: '/ai/billing', description: 'Invoices and billing event stream.', isNew: true },

  // Reporting (cross-module)
  { module: 'reporting', label: 'Operations Reports', path: '/reports/operations', description: 'MCA, Merchant Services, AI consolidated reporting.', isNew: true },
];

export function routesForModule(moduleId: OperationsModuleId): OperationsRoute[] {
  return OPERATIONS_ROUTES.filter((r) => r.module === moduleId);
}
