/**
 * sheet-lead-sync — receives Meta lead rows pushed from the Google Sheet
 * (via the Apps Script in integrations/meta-leads/) and inserts them into
 * the `pipeline_leads` table, deduplicated by external_id.
 *
 * Auth: requests must send header `x-sync-secret` matching the
 * SHEET_SYNC_SECRET function secret. Fails closed if the secret is unset.
 *
 *   supabase secrets set SHEET_SYNC_SECRET=<long random string>
 *   supabase functions deploy sheet-lead-sync --no-verify-jwt
 *
 * Request body:
 *   { "leads": [ { "external_id": "...", "fields": { <header>: <value>, ... } } ] }
 *
 * `fields` keys are the sheet's column headers (any casing/spacing) — the
 * mapping below handles the standard Meta lead-ad export headers plus
 * common variants.
 */

import { createClient } from 'npm:@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-sync-secret',
};

interface IncomingLead {
  external_id?: string;
  fields?: Record<string, unknown>;
}

/** Normalize a sheet header for matching: lowercase, alphanumeric only. */
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

/** Pick the first matching field from a row by normalized header name. */
function pick(fields: Record<string, unknown>, names: string[]): string {
  const normalized = new Map(Object.entries(fields).map(([k, v]) => [norm(k), v]));
  for (const n of names) {
    const v = normalized.get(n);
    if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
  }
  return '';
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });
  if (req.method !== 'POST') return json(405, { error: 'POST only' });

  const secret = Deno.env.get('SHEET_SYNC_SECRET');
  if (!secret) return json(503, { error: 'SHEET_SYNC_SECRET is not configured' });
  if (req.headers.get('x-sync-secret') !== secret) return json(401, { error: 'Invalid sync secret' });

  let payload: { leads?: IncomingLead[] };
  try {
    payload = await req.json();
  } catch {
    return json(400, { error: 'Invalid JSON body' });
  }

  const incoming = (payload.leads ?? []).filter(
    (l): l is Required<IncomingLead> => Boolean(l?.external_id && l?.fields),
  );
  if (incoming.length === 0) return json(200, { inserted: 0, skipped: 0 });
  if (incoming.length > 500) return json(400, { error: 'Max 500 leads per request' });

  // Dedup within the batch, then against what's already in the table.
  const byId = new Map(incoming.map(l => [String(l.external_id), l]));
  const ids = [...byId.keys()];

  const { data: existing, error: selErr } = await supabase
    .from('pipeline_leads')
    .select('external_id')
    .in('external_id', ids);
  if (selErr) return json(500, { error: `Lookup failed: ${selErr.message}` });

  const known = new Set((existing ?? []).map(r => r.external_id));
  const fresh = ids.filter(id => !known.has(id));

  const now = new Date().toISOString();
  const rows = fresh.map(id => {
    const { fields } = byId.get(id)!;
    const contactName = pick(fields, ['fullname', 'name', 'contactname']);
    const businessName =
      pick(fields, ['businessname', 'companyname', 'company', 'business']) ||
      contactName ||
      'Meta Lead';
    const campaign = pick(fields, ['campaignname', 'campaign']);
    const adName = pick(fields, ['adname', 'ad']);
    const formName = pick(fields, ['formname', 'form']);
    const monthlySales = pick(fields, ['monthlysales', 'monthlyvolume', 'monthlyrevenue']);
    const createdTime = pick(fields, ['createdtime', 'created', 'date', 'timestamp']);

    const attribution = [
      campaign && `Campaign: ${campaign}`,
      adName && `Ad: ${adName}`,
      formName && `Form: ${formName}`,
      createdTime && `Submitted: ${createdTime}`,
    ]
      .filter(Boolean)
      .join(' · ');

    return {
      id: `lead-meta-${id.replace(/[^a-zA-Z0-9_-]/g, '')}`.slice(0, 60),
      external_id: id,
      business_name: businessName,
      industry: pick(fields, ['industry']) || 'General',
      contact_name: contactName,
      contact_email: pick(fields, ['email', 'emailaddress']),
      contact_phone: pick(fields, ['phonenumber', 'phone', 'mobile']),
      type: 'Processing',
      source: 'Meta Ads',
      monthly_sales: monthlySales ? `$${monthlySales.replace(/^\$/, '')}` : '',
      amount_requested: '',
      score: 50,
      status: 'New',
      priority: 'Medium',
      last_activity: 'just now',
      assigned_agent: 'Unassigned',
      stage: 'New',
      timeline: [
        {
          title: 'Lead imported',
          description: attribution || 'Imported from Meta leads Google Sheet',
          user: 'Meta Sync',
          timestamp: now,
        },
      ],
      notes: attribution,
    };
  });

  if (rows.length > 0) {
    const { error: insErr } = await supabase.from('pipeline_leads').insert(rows);
    if (insErr) return json(500, { error: `Insert failed: ${insErr.message}` });
  }

  return json(200, { inserted: rows.length, skipped: ids.length - rows.length });
});
