/**
 * Audit & compliance primitives shared by every operations module.
 *
 * Every record that drives money movement (funding, payouts, residuals,
 * chargebacks, terminal config) must reference these so we can satisfy
 * SOC2 / card-brand evidence requirements without adding ad-hoc fields.
 */

export interface AuditMeta {
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export interface StatusHistoryEntry<TStatus extends string = string> {
  status: TStatus;
  at: string;
  by: string;
  note?: string;
}

export interface ImmutableEvent {
  id: string;
  occurredAt: string;
  actor: string;
  type: string;
  subjectType: string;
  subjectId: string;
  payload: Record<string, unknown>;
}

export interface ActivityNote {
  id: string;
  body: string;
  author: string;
  at: string;
}

export type Owner = {
  userId: string;
  name: string;
  role: 'underwriter' | 'agent' | 'collector' | 'ops' | 'finance' | 'compliance';
};

export const nowIso = () => new Date().toISOString();
