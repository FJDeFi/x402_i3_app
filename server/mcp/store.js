const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');
const CONFIG = require('./config');

const STORE_FILE = CONFIG.billing.storeFile;

function ensureStoreFile() {
  const dir = path.dirname(STORE_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(STORE_FILE)) {
    fs.writeFileSync(STORE_FILE, JSON.stringify({ entries: [] }, null, 2));
  }
}

function loadState() {
  ensureStoreFile();
  try {
    const raw = fs.readFileSync(STORE_FILE, 'utf-8');
    const data = JSON.parse(raw);
    if (!data || !Array.isArray(data.entries)) {
      return { entries: [] };
    }
    return data;
  } catch (err) {
    console.warn('[billing-store] failed to load store, resetting', err);
    return { entries: [] };
  }
}

const state = loadState();
const byRequestId = new Map();
for (const entry of state.entries) {
  if (entry.request_id) {
    byRequestId.set(entry.request_id, entry);
  }
}

function persist() {
  fs.writeFileSync(STORE_FILE, JSON.stringify(state, null, 2));
}

function createEntry(data) {
  const nowIso = new Date().toISOString();
  const entry = {
    id: randomUUID(),
    status: 'pending_payment',
    created_at: nowIso,
    updated_at: nowIso,
    meta: {},
    ...data
  };
  state.entries.push(entry);
  if (entry.request_id) {
    byRequestId.set(entry.request_id, entry);
  }
  persist();
  return entry;
}

function updateEntryByRequestId(requestId, patch) {
  if (!requestId) return null;
  const entry = byRequestId.get(requestId);
  if (!entry) return null;
  Object.assign(entry, patch, { updated_at: new Date().toISOString() });
  persist();
  return entry;
}

function getEntryByRequestId(requestId) {
  if (!requestId) return null;
  return byRequestId.get(requestId) || null;
}

function listEntriesByUser(userId) {
  return state.entries.filter((entry) => entry.user_id === userId);
}

function markEntryStatus(requestId, status, extras = {}) {
  return updateEntryByRequestId(requestId, {
    status,
    ...extras
  });
}

function createOrphanPayment(originalEntry, proof) {
  const orphan = createEntry({
    type: 'orphan_payment',
    request_id: randomUUID(),
    user_id: originalEntry?.user_id || 'unknown',
    amount_usdc: Number(proof.amount || 0),
    status: 'flagged_orphan',
    tx_signature: proof.tx,
    model_or_node: originalEntry?.model_or_node || null,
    tokens_or_calls: originalEntry?.tokens_or_calls || null,
    meta: {
      linked_request_id: originalEntry?.request_id || null,
      reason: 'duplicate_payment'
    }
  });
  return orphan;
}

module.exports = {
  createEntry,
  updateEntryByRequestId,
  getEntryByRequestId,
  listEntriesByUser,
  markEntryStatus,
  createOrphanPayment
};
