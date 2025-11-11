const { randomUUID } = require('crypto');
const CONFIG = require('./config');
const { verifySolanaUsdcTransfer } = require('./solana-verifier');
const store = require('./store');

function createInvoice({
  type,
  userId,
  modelOrNode,
  amount,
  description,
  tokensOrCalls,
  metadata = {}
}) {
  const numericAmount = Number.isFinite(amount)
    ? amount
    : Number(amount || 0);
  const normalizedAmount = Number(numericAmount.toFixed(6));
  const requestId = randomUUID();
  const nonce = randomUUID();
  const expiresAt = new Date(
    Date.now() + CONFIG.payments.expiresInSeconds * 1000
  ).toISOString();
  const entry = store.createEntry({
    type,
    user_id: userId,
    request_id: requestId,
    nonce,
    amount_usdc: normalizedAmount,
    model_or_node: modelOrNode,
    tokens_or_calls: tokensOrCalls,
    expires_at: expiresAt,
    meta: {
      ...metadata,
      description
    }
  });
  return entry;
}

function build402Body(entry, extras = {}) {
  const response = {
    status: 'payment_required',
    request_id: entry.request_id,
    nonce: entry.nonce,
    amount_usdc: entry.amount_usdc,
    currency: 'USDC',
    recipient: CONFIG.payments.recipient,
    network: CONFIG.payments.network,
    mint: CONFIG.payments.mint,
    expires_at: entry.expires_at,
    memo: entry.request_id,
    description: entry.meta?.description,
    decimals: CONFIG.payments.decimals,
    payment_url: CONFIG.payments.paymentUrl || null,
    rpc_endpoint: CONFIG.payments.rpcUrl,
    explorer_base_url: CONFIG.payments.explorerBaseUrl,
    failure_modes: {
      timeout: 'Invoice expired, request a new 402',
      underpaid: 'Amount less than invoice, please top-up or downgrade',
      duplicate: 'Duplicate payment detected, flagged as orphan_payment'
    },
    ...extras
  };
  if (!response.payment_url) {
    delete response.payment_url;
  }
  return response;
}

function parsePaymentHeader(header) {
  if (!header || typeof header !== 'string') return null;
  const trimmed = header.trim();
  
  // 检查是否是 prepaid credits 支付
  if (trimmed.toLowerCase().startsWith('prepaid')) {
    const parts = trimmed.split(/\s+/).slice(1).join(' ').split(';').map(p => p.trim()).filter(Boolean);
    const data = {};
    for (const part of parts) {
      const [key, value] = part.split('=');
      if (!key || typeof value === 'undefined') continue;
      data[key.trim().toLowerCase()] = value.trim();
    }
    return {
      isPrepaid: true,
      network: CONFIG.payments.network,
      tx: 'PREPAID_CREDITS',
      amount: 0,
      nonce: data.nonce || null,
      model: data.model || null,
      remaining: data.remaining ? Number(data.remaining) : 0,
      memo: 'PREPAID'
    };
  }
  
  // 原有的 x402 支付逻辑
  if (!trimmed.toLowerCase().startsWith('x402')) return null;
  const [, ...rest] = trimmed.split(/\s+/);
  const paramsString = rest.join(' ');
  const parts = paramsString
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean);
  const data = {};
  for (const part of parts) {
    const [key, value] = part.split('=');
    if (!key || typeof value === 'undefined') continue;
    const normalizedKey = key.trim().toLowerCase();
    data[normalizedKey] = value.trim();
  }
  if (!data.tx) {
    const txPart = parts.find((p) => p.startsWith('tx='));
    if (txPart) {
      data.tx = txPart.slice(3);
    }
  }
  if (!data.tx || !data.amount || !data.nonce) {
    return null;
  }
  return {
    isPrepaid: false,
    network: rest[0] || CONFIG.payments.network,
    tx: data.tx,
    amount: Number(data.amount),
    nonce: data.nonce,
    memo: data.memo || null
  };
}

function isExpired(entry) {
  if (!entry?.expires_at) return false;
  return Date.now() > Date.parse(entry.expires_at);
}

module.exports = {
  createInvoice,
  build402Body,
  parsePaymentHeader,
  isExpired,
  verifySolanaUsdcTransfer
};