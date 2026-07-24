/**
 * Delt Backend — Meta leads Google Sheet sync
 * ────────────────────────────────────────────
 * Pushes new rows from this sheet into the Delt Backend (Supabase)
 * via the `sheet-lead-sync` edge function. Safe to re-run: the server
 * deduplicates by lead ID, and synced rows are stamped in a
 * "Delt Synced" column so they're only sent once.
 *
 * SETUP — see integrations/meta-leads/README.md. Short version:
 *   1. In the Google Sheet: Extensions → Apps Script, paste this file.
 *   2. Fill in CONFIG below.
 *   3. Run `syncNewLeads` once (authorize when prompted) to backfill.
 *   4. Run `installTrigger` once — new rows then sync every 5 minutes.
 */

var CONFIG = {
  // Your Supabase project ref, e.g. https://abcd1234.supabase.co
  WEBHOOK_URL: 'https://YOUR-PROJECT-REF.supabase.co/functions/v1/sheet-lead-sync',
  // Must match the SHEET_SYNC_SECRET function secret in Supabase.
  SYNC_SECRET: 'PASTE-YOUR-SECRET-HERE',
  // Name of the tab holding Meta leads. Leave '' to use the first tab.
  SHEET_NAME: '',
  // Column stamped with a timestamp once a row has been pushed.
  SYNCED_HEADER: 'Delt Synced',
  // Batch size per request (server max is 500).
  BATCH_SIZE: 100,
};

/** Sync any rows that haven't been pushed yet. Run manually or via trigger. */
function syncNewLeads() {
  var sheet = CONFIG.SHEET_NAME
    ? SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME)
    : SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  if (!sheet) throw new Error('Sheet not found: ' + CONFIG.SHEET_NAME);

  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 2) return; // headers only

  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(String);

  // Find or create the synced-marker column.
  var syncedCol = headers.indexOf(CONFIG.SYNCED_HEADER) + 1;
  if (syncedCol === 0) {
    syncedCol = lastCol + 1;
    sheet.getRange(1, syncedCol).setValue(CONFIG.SYNCED_HEADER);
  }

  var data = sheet.getRange(2, 1, lastRow - 1, Math.max(lastCol, syncedCol)).getValues();
  var idCol = findIdColumn_(headers);

  var pending = []; // { rowIndex (1-based sheet row), lead }
  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    if (row[syncedCol - 1]) continue; // already synced
    if (row.join('') === '') continue; // blank row

    var fields = {};
    for (var c = 0; c < headers.length; c++) {
      if (headers[c] && headers[c] !== CONFIG.SYNCED_HEADER) fields[headers[c]] = row[c];
    }

    var externalId =
      idCol >= 0 && row[idCol] ? String(row[idCol]) : hashRow_(row);

    pending.push({ rowIndex: i + 2, lead: { external_id: externalId, fields: fields } });
  }

  if (pending.length === 0) return;

  for (var start = 0; start < pending.length; start += CONFIG.BATCH_SIZE) {
    var batch = pending.slice(start, start + CONFIG.BATCH_SIZE);
    var response = UrlFetchApp.fetch(CONFIG.WEBHOOK_URL, {
      method: 'post',
      contentType: 'application/json',
      headers: { 'x-sync-secret': CONFIG.SYNC_SECRET },
      payload: JSON.stringify({ leads: batch.map(function (p) { return p.lead; }) }),
      muteHttpExceptions: true,
    });

    var code = response.getResponseCode();
    if (code !== 200) {
      // Leave unmarked so the next run retries; surface the error in logs.
      throw new Error('Sync failed (HTTP ' + code + '): ' + response.getContentText());
    }

    var stamp = new Date();
    batch.forEach(function (p) {
      sheet.getRange(p.rowIndex, syncedCol).setValue(stamp);
    });

    var result = JSON.parse(response.getContentText());
    Logger.log('Batch: %s inserted, %s already in Delt', result.inserted, result.skipped);
  }
}

/** Re-send every row (server-side dedupe makes this safe). */
function fullResync() {
  var sheet = CONFIG.SHEET_NAME
    ? SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME)
    : SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
  var syncedCol = headers.indexOf(CONFIG.SYNCED_HEADER) + 1;
  if (syncedCol > 0 && sheet.getLastRow() > 1) {
    sheet.getRange(2, syncedCol, sheet.getLastRow() - 1, 1).clearContent();
  }
  syncNewLeads();
}

/** Install a time-driven trigger: sync every 5 minutes. Run once. */
function installTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'syncNewLeads') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('syncNewLeads').timeBased().everyMinutes(5).create();
}

// ── helpers ──

/** Locate the Meta lead ID column (headers: id / lead_id / leadgen_id). */
function findIdColumn_(headers) {
  var candidates = ['id', 'lead_id', 'leadgen_id', 'leadid'];
  for (var i = 0; i < headers.length; i++) {
    var h = String(headers[i]).toLowerCase().replace(/[^a-z0-9]/g, '');
    if (candidates.indexOf(h) !== -1) return i;
  }
  return -1;
}

/** Stable fallback ID when the sheet has no lead-id column. */
function hashRow_(row) {
  var digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.MD5,
    row.join(''),
    Utilities.Charset.UTF_8,
  );
  return 'sheet-' + digest
    .map(function (b) {
      var h = ((b + 256) % 256).toString(16);
      return h.length === 1 ? '0' + h : h;
    })
    .join('');
}
