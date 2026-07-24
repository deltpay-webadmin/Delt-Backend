# Meta Leads → Google Sheet → Delt Backend

Meta lead ads land in your Google Sheet; this integration pushes each new row into the Delt Backend `pipeline_leads` table in Supabase automatically, deduplicated so nothing imports twice. Imported leads appear live in the Leads pipeline (source **"Meta Ads"**, stage **New**, unassigned) in both the admin and agent views.

```
Meta lead ad → Google Sheet → Apps Script (every 5 min) → sheet-lead-sync edge function → Supabase leads table → CRM (realtime)
```

## Deployment status

Already live on the **Delt Pay Database** project (`ytemrmpnwmzqeradbeoa`):

- ✅ `sheet-lead-sync` edge function deployed: `https://ytemrmpnwmzqeradbeoa.supabase.co/functions/v1/sheet-lead-sync`
- ✅ `pipeline_leads` table with unique `external_id` (dedupe) applied
- ⬜ `SHEET_SYNC_SECRET` — must be set before the function accepts anything (step 1)
- ⬜ Apps Script installed in the Google Sheet (step 2)

## One-time setup (~10 minutes)

### 1. Set the sync secret in Supabase

Generate a long random string (e.g. `openssl rand -hex 32`) and set it as a function secret:

- Dashboard: **Edge Functions → sheet-lead-sync → Secrets** → add `SHEET_SYNC_SECRET`
- Or CLI: `supabase secrets set SHEET_SYNC_SECRET=<value>`

The function rejects every request until this is set.

### 2. Install the Apps Script in the Google Sheet

1. Open the Meta leads sheet → **Extensions → Apps Script**.
2. Paste the contents of [`Code.gs`](./Code.gs) into the editor.
3. Fill in `CONFIG` at the top:
   - `WEBHOOK_URL` — already filled in (`https://ytemrmpnwmzqeradbeoa.supabase.co/functions/v1/sheet-lead-sync`)
   - `SYNC_SECRET` — the same value from step 1
   - `SHEET_NAME` — the tab name, or leave `''` for the first tab
4. Run **`syncNewLeads`** once from the toolbar. Authorize when prompted. This backfills every existing row.
5. Run **`installTrigger`** once. New rows now sync automatically every 5 minutes.

## How it behaves

- **Dedup**: each row's Meta lead ID (`id` / `lead_id` column, or a content hash if the sheet has no ID column) becomes `external_id` in Supabase. Rows already imported are skipped server-side, and synced rows get a timestamp in a **"Delt Synced"** column so they're not re-sent.
- **Column mapping** is forgiving — standard Meta export headers work as-is: `full_name`, `email`, `phone_number`, `company_name`, `campaign_name`, `ad_name`, `form_name`, `created_time`. Extra columns are ignored; campaign/ad/form attribution lands in the lead's notes and timeline.
- **Failures retry**: if a push fails, rows stay unstamped and the next 5-minute run retries them.
- **`fullResync()`** clears the synced stamps and re-sends everything — safe, because the server dedupes.

## Security notes

- The function fails closed: no `SHEET_SYNC_SECRET` configured → all requests rejected.
- The secret travels in the `x-sync-secret` header over HTTPS and lives only in Supabase secrets and the Apps Script (not in this repo).
- The function uses the service-role key internally; it never touches the browser.
