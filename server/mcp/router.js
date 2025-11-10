const express = require('express');
const { randomUUID } = require('crypto');
const fetch = require('node-fetch');
const PricingUtils = require('../../pricing.js');
const CONFIG = require('./config');
const store = require('./store');
const {
  selectModelForRequest,
  estimateWorkflowNodes
} = require('./auto-router');
const {
  createInvoice,
  build402Body,
  parsePaymentHeader,
  isExpired,
  verifySolanaUsdcTransfer
} = require('./payments');

const router = express.Router();

function resolveUserId(req) {
  return (
    req.body?.user_id ||
    req.headers['x-user-id'] ||
    (req.body?.wallet_address
      ? `wallet:${String(req.body.wallet_address).toLowerCase()}`
      : 'anonymous')
  );
}

const CHAT_COMPLETIONS_URL =
  process.env.CHAT_COMPLETIONS_URL || 'http://34.71.119.178:8000/chat/completions';
const CHAT_COMPLETIONS_API_KEY =
  process.env.CHAT_COMPLETIONS_API_KEY ||
  process.env.I3_API_KEY ||
  'ak_pxOhfZtDes9R6CUyPoOGZtnr61tGJOb2CBz-HHa_VDE';
const CHAT_COMPLETIONS_MAX_TOKENS = Number(process.env.CHAT_COMPLETIONS_MAX_TOKENS || 512);
const CHAT_COMPLETIONS_TEMPERATURE = Number(process.env.CHAT_COMPLETIONS_TEMPERATURE || 0.7);

function respondWith402(res, invoice, extras = {}) {
  res.set('X-Request-Id', invoice.request_id);
  return res.status(402).json(build402Body(invoice, extras));
}

function ensureAmount(entry, proof) {
  return Number(proof.amount || 0) + 1e-9 >= Number(entry.amount_usdc || 0);
}

function handleDuplicate(entry, proof, res) {
  const orphan = store.createOrphanPayment(entry, proof);
  return res.status(409).json({
    status: 'duplicate_payment',
    message:
      'Payment already recorded for this request; duplicate captured as orphan_payment',
    original_request_id: entry.request_id,
    orphan_request_id: orphan.request_id
  });
}

function handleExpired(entry, res, extras = {}) {
  store.markEntryStatus(entry.request_id, 'expired', {
    expired_at: new Date().toISOString()
  });
  const refreshed = createInvoice({
    type: entry.type,
    userId: entry.user_id,
    modelOrNode: entry.model_or_node,
    amount: entry.amount_usdc,
    description: entry.meta?.description || 'Payment required',
    tokensOrCalls: entry.tokens_or_calls,
    metadata: entry.meta || {}
  });
  return respondWith402(res, refreshed, {
    reason: 'timeout',
    message: 'Invoice expired. Issuing a new 402.',
    ...extras
  });
}

function sanitizePrompt(input) {
  if (typeof input === 'string') {
    return input.trim();
  }
  if (Array.isArray(input)) {
    return input.map((item) => sanitizePrompt(item)).filter(Boolean).join('\n\n');
  }
  if (input && typeof input === 'object') {
    if (typeof input.prompt === 'string') return input.prompt.trim();
    if (Array.isArray(input.messages)) {
      return sanitizePrompt(
        input.messages
          .map((msg) => (typeof msg?.content === 'string' ? msg.content : null))
          .filter(Boolean)
      );
    }
  }
  return '';
}

async function invokeChatCompletion({ prompt, modelId, metadata = {} }) {
  const cleanedPrompt = sanitizePrompt(prompt);
  if (!cleanedPrompt) {
    return {
      output: '',
      raw: null,
      usage: null,
      warning: 'Prompt is empty; skipping model invocation.'
    };
  }

  const targetModel =
    metadata?.auto_router?.model?.id ||
    metadata?.model_name ||
    modelId ||
    'I3-Generic-Foundation-LLM';

  const requestBody = {
    model: targetModel,
    messages: [
      {
        role: 'system',
        content: `You are ${targetModel}. Respond as the model would, staying concise and helpful.`
      },
      {
        role: 'user',
        content: cleanedPrompt
      }
    ],
    max_tokens: CHAT_COMPLETIONS_MAX_TOKENS,
    temperature: CHAT_COMPLETIONS_TEMPERATURE,
    stream: false
  };

  try {
    const response = await fetch(CHAT_COMPLETIONS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'I3-API-Key': CHAT_COMPLETIONS_API_KEY
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(
        `Model service responded with ${response.status}: ${errorText || response.statusText}`
      );
    }

    const data = await response.json();
    const text =
      data?.choices?.[0]?.message?.content ||
      data?.data?.choices?.[0]?.message?.content ||
      data?.output ||
      data?.result ||
      '';
    const usage =
      data?.usage ||
      data?.choices?.[0]?.usage ||
      data?.data?.usage ||
      null;

    return {
      output: text,
      raw: data,
      usage,
      model: targetModel
    };
  } catch (error) {
    return {
      output: '',
      raw: null,
      usage: null,
      error: error.message
    };
  }
}

router.post('/models.invoke', async (req, res) => {
  try {
    const userId = resolveUserId(req);
    const paymentProof = parsePaymentHeader(req.headers['x-payment']);
    const requestId = req.headers['x-request-id'] || req.body?.request_id;
    const walletAddress =
      req.body?.wallet_address ||
      req.headers['x-wallet-address'] ||
      req.body?.walletAddress ||
      null;

    if (!paymentProof) {
      const selection = selectModelForRequest(req.body || {});
      const amount =
        selection.model.pricing.pricePerCallUsdc +
        selection.model.pricing.gasPerCallUsdc;
      const invoice = createInvoice({
        type: 'infer',
        userId,
        modelOrNode: selection.model.id,
        amount,
        description: `Invoke ${selection.model.id}`,
        tokensOrCalls: 1,
        metadata: {
          auto_router: selection,
          wallet_address: walletAddress,
          prompt: sanitizePrompt(req.body?.prompt),
          model_name: selection.model.id
        }
      });
      return respondWith402(res, invoice, {
        auto_router: selection
      });
    }

    if (!requestId) {
      return res.status(400).json({
        status: 'missing_request_id',
        message: 'Please include X-Request-Id when submitting payment proof.'
      });
    }

    const entry = store.getEntryByRequestId(requestId);
    if (!entry) {
      return res.status(404).json({
        status: 'unknown_request',
        message: 'Request not recognized; initiate a new invocation.'
      });
    }

    if (entry.status === 'completed') {
      return res.json({
        status: 'ok',
        request_id: entry.request_id,
        model_id: entry.model_or_node,
        amount_usdc: entry.amount_usdc,
        tx_signature: entry.tx_signature,
        settled_at: entry.completed_at,
        result: entry.meta?.result || null
      });
    }

    if (entry.tx_signature && entry.tx_signature !== paymentProof.tx) {
      return handleDuplicate(entry, paymentProof, res);
    }

    if (paymentProof.nonce !== entry.nonce) {
      return res.status(409).json({
        status: 'nonce_mismatch',
        message: 'Nonce mismatch. Request a fresh 402.'
      });
    }

    if (isExpired(entry)) {
      return handleExpired(entry, res, {
        auto_router: entry.meta?.auto_router
      });
    }

    if (!ensureAmount(entry, paymentProof)) {
      return res.status(402).json({
        status: 'underpaid',
        required_amount: entry.amount_usdc,
        paid_amount: paymentProof.amount,
        message: 'Amount paid is below invoice requirement.'
      });
    }

    const verification = await verifySolanaUsdcTransfer({
      signature: paymentProof.tx,
      amount: entry.amount_usdc,
      mint: CONFIG.payments.mint,
      recipient: CONFIG.payments.recipient,
      decimals: CONFIG.payments.decimals,
      memo: entry.request_id,
      expectedWallet: entry.meta?.wallet_address || walletAddress || null
    });

    if (!verification.ok) {
      return res.status(402).json({
        status: 'payment_verification_failed',
        code: verification.code,
        message: verification.message,
        details: verification.details || null
      });
    }

    const paidAt = new Date().toISOString();
    const baseMeta = {
      ...entry.meta,
      wallet_address: entry.meta?.wallet_address || walletAddress || null,
      verification
    };

    store.markEntryStatus(entry.request_id, 'paid', {
      tx_signature: paymentProof.tx,
      paid_at: paidAt,
      meta: baseMeta
    });

    const storedPrompt = entry.meta?.prompt || sanitizePrompt(req.body?.prompt);
    const inference = await invokeChatCompletion({
      prompt: storedPrompt,
      modelId: entry.model_or_node,
      metadata: entry.meta || {}
    });

    const result = {
      output:
        inference.output ||
        (inference.error
          ? `⚠️ Model invocation failed: ${inference.error}`
          : `No output returned by ${entry.model_or_node}.`),
      usage: inference.usage || {
        calls: 1,
        amount_usdc: entry.amount_usdc
      },
      model: inference.model || entry.model_or_node,
      raw: inference.raw || null,
      error: inference.error || null,
      warning: inference.warning || null
    };

    const completedAt = new Date().toISOString();

    store.markEntryStatus(entry.request_id, 'completed', {
      completed_at: completedAt,
      meta: {
        ...baseMeta,
        prompt: storedPrompt,
        result
      }
    });

    return res.json({
      status: 'ok',
      request_id: entry.request_id,
      model_id: entry.model_or_node,
      amount_usdc: entry.amount_usdc,
      tx_signature: paymentProof.tx,
      settled_at: completedAt,
      explorer: verification.explorerUrl,
      payer_wallet: verification.payer,
      result
    });
  } catch (err) {
    console.error('[mcp/models.invoke]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

const workflowSessions = new Map();

function getWorkflowSession(sessionId) {
  return workflowSessions.get(sessionId) || null;
}

function createWorkflowSession(userId, payload, walletAddress) {
  const nodes = estimateWorkflowNodes(payload);
  console.log('[mcp/workflow.execute] workflow nodes', nodes);
  if (!nodes.length) {
    throw new Error('Workflow request must include at least one node.');
  }
  const sessionId = randomUUID();
  const session = {
    sessionId,
    userId,
    walletAddress: walletAddress || null,
    nodes,
    workflow: {
      id: payload.workflow_id || sessionId,
      name: payload.workflow_name || 'Custom workflow'
    },
    currentIndex: 0,
    createdAt: new Date().toISOString()
  };
  workflowSessions.set(sessionId, session);
  return session;
}

function issueWorkflowInvoice(session) {
  const node = session.nodes[session.currentIndex];
  const invoice = createInvoice({
    type: 'workflow',
    userId: session.userId,
    modelOrNode: node.name,
    amount: node.totalCost,
    description: `Workflow node ${node.name}`,
    tokensOrCalls: node.calls,
    metadata: {
      session_id: session.sessionId,
      node_index: session.currentIndex,
      wallet_address: session.walletAddress || null
    }
  });
  return { invoice, node };
}

router.post('/workflow/execute', async (req, res) => {
  try {
    const userId = resolveUserId(req);
    const walletAddress =
      req.body?.wallet_address ||
      req.headers['x-wallet-address'] ||
      req.body?.walletAddress ||
      null;
    const paymentHeaderRaw = req.headers['x-payment'];
    if (paymentHeaderRaw) {
      console.log('[mcp/workflow.execute] received X-PAYMENT header:', paymentHeaderRaw);
    } else {
      console.log('[mcp/workflow.execute] no X-PAYMENT header on request');
    }
    const paymentProof = parsePaymentHeader(paymentHeaderRaw);
    const sessionId =
      req.headers['x-workflow-session'] || req.body?.session_id || null;
    let session = sessionId ? getWorkflowSession(sessionId) : null;

    if (!session) {
      try {
        session = createWorkflowSession(userId, req.body || {}, walletAddress);
      } catch (creationError) {
        return res.status(400).json({
          status: 'invalid_workflow',
          message: creationError.message
        });
      }
    }

    const currentNode = session.nodes[session.currentIndex];
    if (!paymentProof) {
      const { invoice, node } = issueWorkflowInvoice(session);
      res.set('X-Workflow-Session', session.sessionId);
      return respondWith402(res, invoice, {
        workflow: session.workflow,
        node: {
          index: session.currentIndex,
          name: node.name,
          calls: node.calls,
          total_cost: node.totalCost
        },
        progress: {
          completed: session.currentIndex,
          total_nodes: session.nodes.length,
          status: '402→Pay→200'
        }
      });
    }

    const requestId = req.headers['x-request-id'] || req.body?.request_id;
    if (!requestId) {
      return res.status(400).json({
        status: 'missing_request_id',
        message: 'Include X-Request-Id when submitting payment proof.'
      });
    }

    const entry = store.getEntryByRequestId(requestId);
    if (!entry) {
      return res.status(404).json({
        status: 'unknown_request',
        message: 'Workflow invoice not found.'
      });
    }

    if (!session && entry?.meta?.session_id) {
      session = getWorkflowSession(entry.meta.session_id);
    }

    if (!session) {
      const payload = req.body || {};
      const fallbackNodes = estimateWorkflowNodes(payload);
      const fallbackSessionId = entry?.meta?.session_id || randomUUID();
      session = {
        sessionId: fallbackSessionId,
        userId,
        walletAddress: entry?.meta?.wallet_address || walletAddress || null,
        nodes: fallbackNodes,
        workflow: {
          id: payload.workflow_id || fallbackSessionId,
          name: payload.workflow_name || 'Custom workflow'
        },
        currentIndex: Number(entry?.meta?.node_index ?? 0),
        createdAt: new Date().toISOString()
      };
      workflowSessions.set(session.sessionId, session);
    }

    if (entry.tx_signature && entry.tx_signature !== paymentProof.tx) {
      return handleDuplicate(entry, paymentProof, res);
    }

    if (paymentProof.nonce !== entry.nonce) {
      return res.status(409).json({
        status: 'nonce_mismatch',
        message: 'Nonce mismatch for workflow invoice.'
      });
    }

    if (isExpired(entry)) {
      return handleExpired(entry, res, {
        workflow: session.workflow
      });
    }

    if (!ensureAmount(entry, paymentProof)) {
      return res.status(402).json({
        status: 'underpaid',
        required_amount: entry.amount_usdc,
        paid_amount: paymentProof.amount,
        message: 'Payment is below workflow node requirement.'
      });
    }

    const verification = await verifySolanaUsdcTransfer({
      signature: paymentProof.tx,
      amount: entry.amount_usdc,
      mint: CONFIG.payments.mint,
      recipient: CONFIG.payments.recipient,
      decimals: CONFIG.payments.decimals,
      memo: entry.request_id,
      expectedWallet:
        entry.meta?.wallet_address || session.walletAddress || walletAddress || null
    });

    if (!verification.ok) {
      return res.status(402).json({
        status: 'payment_verification_failed',
        code: verification.code,
        message: verification.message,
        details: verification.details || null
      });
    }

    const paidAt = new Date().toISOString();
    const baseMeta = {
      ...entry.meta,
      wallet_address: entry.meta?.wallet_address || session.walletAddress || walletAddress || null,
      verification
    };

    store.markEntryStatus(entry.request_id, 'paid', {
      tx_signature: paymentProof.tx,
      paid_at: paidAt,
      meta: baseMeta
    });

    const nodeResult = {
      node_index: session.currentIndex,
      node_name: currentNode.name,
      tx_signature: paymentProof.tx,
      amount_usdc: entry.amount_usdc,
      explorer: verification.explorerUrl,
      payer_wallet: verification.payer
    };

    store.markEntryStatus(entry.request_id, 'completed', {
      completed_at: new Date().toISOString(),
      meta: {
        ...baseMeta,
        node_result: nodeResult
      }
    });

    session.currentIndex += 1;

    if (session.currentIndex < session.nodes.length) {
      const { invoice, node } = issueWorkflowInvoice(session);
      res.set('X-Workflow-Session', session.sessionId);
      return respondWith402(res, invoice, {
        workflow: session.workflow,
        previous_node: nodeResult,
        node: {
          index: session.currentIndex,
          name: node.name,
          calls: node.calls,
          total_cost: node.totalCost
        },
        progress: {
          completed: session.currentIndex,
          total_nodes: session.nodes.length,
          status: '402→Pay→200'
        }
      });
    }

    workflowSessions.delete(session.sessionId);
    res.set('X-Workflow-Session', session.sessionId);
    return res.json({
      status: 'ok',
      workflow: session.workflow,
      settled_at: new Date().toISOString(),
      final_node: nodeResult
    });
  } catch (err) {
    console.error('[mcp/workflow.execute]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/share/buy', async (req, res) => {
  try {
    const userId = resolveUserId(req);
    const paymentProof = parsePaymentHeader(req.headers['x-payment']);
    const requestId = req.headers['x-request-id'] || req.body?.request_id;
    const shareId = req.body?.share_id;
    const amount = Number(req.body?.amount_usdc);
    const walletAddress =
      req.body?.wallet_address ||
      req.headers['x-wallet-address'] ||
      req.body?.walletAddress ||
      null;

    if (!shareId) {
      return res.status(400).json({
        status: 'missing_share_id',
        message: 'share_id is required.'
      });
    }

    if (!Number.isFinite(amount) || amount < 1 || amount > 20) {
      return res.status(400).json({
        status: 'invalid_amount',
        message: 'Share purchase must be between 1 and 20 USDC.'
      });
    }

    if (!paymentProof) {
      const invoice = createInvoice({
        type: 'share',
        userId,
        modelOrNode: shareId,
        amount,
        description: `Purchase share ${shareId}`,
        tokensOrCalls: 1,
        metadata: {
          share_id: shareId,
          wallet_address: walletAddress
        }
      });
      return respondWith402(res, invoice, {
        share_id: shareId,
        amount_requested: amount
      });
    }

    if (!requestId) {
      return res.status(400).json({
        status: 'missing_request_id',
        message: 'Provide X-Request-Id with payment proof.'
      });
    }

    const entry = store.getEntryByRequestId(requestId);
    if (!entry) {
      return res.status(404).json({
        status: 'unknown_request',
        message: 'Share purchase invoice not found.'
      });
    }

    if (entry.tx_signature && entry.tx_signature !== paymentProof.tx) {
      return handleDuplicate(entry, paymentProof, res);
    }

    if (paymentProof.nonce !== entry.nonce) {
      return res.status(409).json({
        status: 'nonce_mismatch',
        message: 'Nonce mismatch for share purchase.'
      });
    }

    if (isExpired(entry)) {
      return handleExpired(entry, res, { share_id: shareId });
    }

    if (!ensureAmount(entry, paymentProof)) {
      return res.status(402).json({
        status: 'underpaid',
        required_amount: entry.amount_usdc,
        paid_amount: paymentProof.amount,
        message: 'Amount paid is below share price.'
      });
    }

    const timestamp = new Date().toISOString();
    const verification = await verifySolanaUsdcTransfer({
      signature: paymentProof.tx,
      amount: entry.amount_usdc,
      mint: CONFIG.payments.mint,
      recipient: CONFIG.payments.recipient,
      decimals: CONFIG.payments.decimals,
      memo: entry.request_id,
      expectedWallet: entry.meta?.wallet_address || walletAddress || null
    });

    if (!verification.ok) {
      return res.status(402).json({
        status: 'payment_verification_failed',
        code: verification.code,
        message: verification.message,
        details: verification.details || null
      });
    }

    const baseMeta = {
      ...entry.meta,
      wallet_address: entry.meta?.wallet_address || walletAddress || null,
      verification
    };

    store.markEntryStatus(entry.request_id, 'paid', {
      tx_signature: paymentProof.tx,
      paid_at: timestamp,
      meta: baseMeta
    });
    store.markEntryStatus(entry.request_id, 'completed', {
      completed_at: timestamp,
      meta: {
        ...baseMeta,
        share_id: shareId
      }
    });

    return res.json({
      status: 'ok',
      request_id: entry.request_id,
      share_id: shareId,
      amount_usdc: entry.amount_usdc,
      tx_signature: paymentProof.tx,
      settled_at: timestamp,
      explorer: verification.explorerUrl,
      payer_wallet: verification.payer
    });
  } catch (err) {
    console.error('[mcp/share.buy]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

const DAILY_REWARD = PricingUtils.constants.dailyCheckInRewardUsdc;

router.post('/checkin/claim', (req, res) => {
  try {
    const userId = resolveUserId(req);
    const walletAddress = req.body?.wallet_address;
    if (!walletAddress) {
      return res.status(400).json({
        status: 'missing_wallet',
        message: 'wallet_address is required.'
      });
    }

    const todayKey = new Date().toISOString().slice(0, 10);
    const existing = store
      .listEntriesByUser(userId)
      .find(
        (entry) =>
          entry.type === 'checkin' &&
          entry.status === 'completed' &&
          entry.meta?.day_key === todayKey
      );
    if (existing) {
      return res.status(429).json({
        status: 'checkin_limit',
        message: 'Daily check-in already claimed.',
        tx_signature: existing.tx_signature,
        last_claimed: existing.meta?.day_key
      });
    }

    const txSignature = `simulated_tx_${randomUUID()}`;
    const entry = store.createEntry({
      type: 'checkin',
      user_id: userId,
      request_id: randomUUID(),
      amount_usdc: Number(DAILY_REWARD.toFixed(6)),
      status: 'completed',
      tx_signature: txSignature,
      model_or_node: 'daily_checkin',
      tokens_or_calls: 1,
      meta: {
        wallet_address: walletAddress,
        day_key: todayKey
      }
    });

    return res.json({
      status: 'ok',
      tx_signature: txSignature,
      amount_usdc: entry.amount_usdc,
      explorer: `${CONFIG.payments.explorerBaseUrl}/${txSignature}?cluster=devnet`
    });
  } catch (err) {
    console.error('[mcp/checkin.claim]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
