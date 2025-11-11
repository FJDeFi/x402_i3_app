(function () {
  const MCP_NAMESPACE = 'mcp';
  const DEFAULT_BASE_URL = 'http://localhost:3000';
  const CONFIGURED_BASE_URL =
    (window.APP_CONFIG && (window.APP_CONFIG.mcpBaseUrl || window.APP_CONFIG?.mcp?.baseUrl)) ||
    DEFAULT_BASE_URL;
  const MCP_BASE_URL = CONFIGURED_BASE_URL.replace(/\/$/, '');
  const APP_SETTINGS = window.APP_CONFIG || {};
  const SOLANA_SETTINGS = APP_SETTINGS.solana || {};
  const DEFAULT_SOLANA_RPC = SOLANA_SETTINGS.rpcEndpoint || 'https://api.devnet.solana.com';
  const DEFAULT_SOLANA_DECIMALS = Number(SOLANA_SETTINGS.usdcDecimals || 6);
  const MEMO_PROGRAM_ID = 'MemoSq4gqABAXKb96SFy5gQvt2apZKvEXsPQQMwM8g';

  let cachedWeb3 = null;
  let explorerToastStylesInjected = false;

  function injectExplorerToastStyles() {
    if (explorerToastStylesInjected) return;
    const style = document.createElement('style');
    style.textContent = `
      .mcp-explorer-toast {
        position: fixed;
        right: 24px;
        bottom: 24px;
        width: 360px;
        max-width: calc(100% - 32px);
        background: rgba(17, 24, 39, 0.92);
        color: #fff;
        border-radius: 16px;
        box-shadow: 0 20px 45px rgba(15, 23, 42, 0.45);
        padding: 18px 20px;
        font-family: 'Inter', sans-serif;
        font-size: 13px;
        line-height: 1.5;
        z-index: 100000;
        animation: mcp-toast-in 0.25s ease-out;
      }
      .mcp-explorer-toast h4 {
        margin: 0 0 8px;
        font-size: 15px;
        font-weight: 600;
      }
      .mcp-explorer-toast a {
        color: #38bdf8;
        font-weight: 600;
        text-decoration: none;
      }
      .mcp-explorer-toast a:hover {
        text-decoration: underline;
      }
      .mcp-explorer-toast button {
        position: absolute;
        top: 12px;
        right: 14px;
        cursor: pointer;
        border: none;
        background: transparent;
        color: rgba(255,255,255,0.7);
        font-size: 14px;
      }
      .mcp-explorer-toast button:hover {
        color: #fff;
      }
      @keyframes mcp-toast-in {
        from { transform: translateY(12px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    explorerToastStylesInjected = true;
  }

  function showExplorerToast({ url, title, subtitle }) {
    if (!url) return;
    injectExplorerToastStyles();
    const toast = document.createElement('div');
    toast.className = 'mcp-explorer-toast';
    toast.innerHTML = `
      <button aria-label="Dismiss explorer link">✕</button>
      <h4>${title || 'Payment Settled'}</h4>
      <div>${subtitle || 'View the on-chain transaction:'}</div>
      <div style="margin-top: 10px;">
        <a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>
      </div>
    `;
    const close = toast.querySelector('button');
    const remove = () => {
      toast.remove();
    };
    close.addEventListener('click', remove);
    setTimeout(remove, 15000);
    document.body.appendChild(toast);
  }

  function detectPhantomProvider() {
    if (window.walletManager?.solana) {
      return window.walletManager.solana;
    }
    if (window.solana?.isPhantom) {
      return window.solana;
    }
    if (window.phantom?.solana?.isPhantom) {
      return window.phantom.solana;
    }
    return null;
  }

  function detectWalletAddress() {
    const provider = detectPhantomProvider();
    if (provider?.publicKey?.toBase58) {
      return provider.publicKey.toBase58();
    }
    if (provider?.publicKey?.toString) {
      return provider.publicKey.toString();
    }
    if (window.walletManager?.walletAddress) {
      return window.walletManager.walletAddress;
    }
    return null;
  }

  async function ensurePhantomConnected() {
    const provider = detectPhantomProvider();
    if (!provider) {
      throw new Error('Phantom wallet not detected. Please install or enable the extension.');
    }
    if (!provider.publicKey) {
      const response = await provider.connect();
      const connectedKey = response?.publicKey || provider.publicKey;
      if (!connectedKey) {
        throw new Error('Wallet connection did not return a public key.');
      }
    }
    const address =
      provider.publicKey?.toBase58?.() ||
      provider.publicKey?.toString?.() ||
      null;
    if (!address) {
      throw new Error('Unable to resolve connected wallet address.');
    }
    return { provider, address };
  }

  async function loadSolanaWeb3() {
    if (cachedWeb3) return cachedWeb3;
    const sources = [
      'https://unpkg.com/@solana/web3.js@1.95.3/lib/index.browser.esm.js',
      'https://cdn.jsdelivr.net/npm/@solana/web3.js@1.95.3/lib/index.browser.esm.js',
      'https://esm.sh/@solana/web3.js@1.95.3?bundle'
    ];
    let lastError = null;
    for (const src of sources) {
      try {
        cachedWeb3 = await import(/* @vite-ignore */ src);
        return cachedWeb3;
      } catch (err) {
        lastError = err;
      }
    }
    throw lastError || new Error('Failed to load @solana/web3.js');
  }

  function amountToBaseUnits(amount, decimals = DEFAULT_SOLANA_DECIMALS) {
    const fixed = Number(amount).toFixed(decimals);
    const [whole, fraction = ''] = fixed.split('.');
    const digits = `${whole}${fraction}`.replace(/^(-?)0+(?=\d)/, '$1');
    if (!/^-?\d+$/.test(digits)) {
      throw new Error(`Invalid amount "${amount}"`);
    }
    return BigInt(digits);
  }

  function toLittleEndianBytes(value, byteCount) {
    let n = BigInt(value);
    const bytes = new Uint8Array(byteCount);
    for (let i = 0; i < byteCount; i += 1) {
      bytes[i] = Number(n & 0xffn);
      n >>= 8n;
    }
    return bytes;
  }

  function getAssociatedTokenAddressSync(mint, owner, web3, ids) {
    const seeds = [
      owner.toBuffer(),
      ids.TOKEN_PROGRAM_ID_BYTES,
      mint.toBuffer()
    ];
    return web3.PublicKey.findProgramAddressSync(seeds, ids.ASSOCIATED_TOKEN_PROGRAM_ID)[0];
  }

  function createAssociatedTokenAccountInstruction(payer, ata, owner, mint, web3, ids) {
    const keys = [
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: ata, isSigner: false, isWritable: true },
      { pubkey: owner, isSigner: false, isWritable: false },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: web3.SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: ids.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: ids.SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false }
    ];
    return new web3.TransactionInstruction({
      programId: ids.ASSOCIATED_TOKEN_PROGRAM_ID,
      keys,
      data: Uint8Array.of(0)
    });
  }

  function createTransferInstruction(source, destination, owner, amountRaw, web3, ids) {
    const data = new Uint8Array(9);
    data[0] = 3; // Transfer instruction discriminator
    data.set(toLittleEndianBytes(amountRaw, 8), 1);
    const keys = [
      { pubkey: source, isSigner: false, isWritable: true },
      { pubkey: destination, isSigner: false, isWritable: true },
      { pubkey: owner, isSigner: true, isWritable: false }
    ];
    return new web3.TransactionInstruction({
      programId: ids.TOKEN_PROGRAM_ID,
      keys,
      data
    });
  }

  let PROGRAM_IDS = null;

  function ensureProgramIds(web3) {
    if (PROGRAM_IDS) return PROGRAM_IDS;
    const tokenProgram = new web3.PublicKey(
      'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
    );
    const associatedProgram = new web3.PublicKey(
      'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'
    );
    const sysvarRent = new web3.PublicKey(
      'SysvarRent111111111111111111111111111111111'
    );
    PROGRAM_IDS = {
      TOKEN_PROGRAM_ID: tokenProgram,
      ASSOCIATED_TOKEN_PROGRAM_ID: associatedProgram,
      SYSVAR_RENT_PUBKEY: sysvarRent,
      TOKEN_PROGRAM_ID_BYTES: tokenProgram.toBuffer()
    };
    return PROGRAM_IDS;
  }

  function uuid() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  function emit(event, detail) {
    try {
      window.dispatchEvent(new CustomEvent(`${MCP_NAMESPACE}:${event}`, { detail }));
    } catch (_) {
      // noop
    }
  }

  function ensurePanel() {
    let panel = document.getElementById('mcp-status-panel');
    if (panel) return panel;
    panel = document.createElement('div');
    panel.id = 'mcp-status-panel';
    panel.innerHTML = `
      <style>
        #mcp-status-panel { position: fixed; right: 24px; bottom: 24px; width: 320px; max-height: 50vh; overflow-y: auto; background: rgba(17, 24, 39, 0.92); color: #fff; border-radius: 16px; box-shadow: 0 20px 45px rgba(15, 23, 42, 0.45); padding: 18px 20px; font-family: 'Inter', sans-serif; font-size: 13px; line-height: 1.45; z-index: 99999; display: none; }
        #mcp-status-panel.show { display: block; }
        #mcp-status-panel h4 { margin: 0 0 10px; font-size: 15px; font-weight: 600; }
        #mcp-status-panel .mcp-close { position: absolute; top: 12px; right: 14px; cursor: pointer; border: none; background: transparent; color: rgba(255,255,255,0.6); font-size: 14px; }
        #mcp-status-panel .mcp-close:hover { color: #fff; }
        #mcp-status-panel .mcp-log { margin: 0; padding: 0; list-style: none; }
        #mcp-status-panel .mcp-log li { padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.08); }
        #mcp-status-panel .mcp-log li:last-child { border-bottom: none; }
        #mcp-status-panel .mcp-pill { display: inline-flex; align-items: center; gap: 6px; border-radius: 999px; padding: 3px 9px; font-size: 11px; font-weight: 600; letter-spacing: 0.2px; }
        #mcp-status-panel .pill-invoice { background: rgba(59, 130, 246, 0.18); color: #bfdbfe; }
        #mcp-status-panel .pill-pay { background: rgba(16, 185, 129, 0.18); color: #bbf7d0; }
        #mcp-status-panel .pill-result { background: rgba(244, 114, 182, 0.18); color: #fbcfe8; }
        #mcp-status-panel .pill-cancel { background: rgba(248, 113, 113, 0.18); color: #fecaca; }
        #mcp-status-panel .mcp-log small { display: block; margin-top: 3px; color: rgba(255,255,255,0.65); }
      </style>
      <button class="mcp-close" aria-label="Close">✕</button>
      <h4>402 Payment Progress</h4>
      <ul class="mcp-log"></ul>
    `;
    panel.querySelector('.mcp-close').addEventListener('click', () => {
      panel.classList.remove('show');
    });
    document.body.appendChild(panel);
    return panel;
  }

  function logStatus(kind, text, meta = {}) {
    const panel = ensurePanel();
    const list = panel.querySelector('.mcp-log');
    const li = document.createElement('li');
    const pillClass = {
      invoice: 'pill-invoice',
      payment: 'pill-pay',
      result: 'pill-result',
      cancel: 'pill-cancel'
    }[kind] || 'pill-invoice';
    const title = {
      invoice: '402 Invoice',
      payment: 'Paid',
      result: 'Result',
      cancel: 'Cancelled'
    }[kind] || 'Update';
    const lines = [];
    if (meta.amount) lines.push(`Amount: ${meta.amount} USDC`);
    if (meta.memo) lines.push(`Memo: ${meta.memo}`);
    if (meta.tx) {
      const explorer =
        meta.explorer ||
        `https://explorer.solana.com/tx/${encodeURIComponent(meta.tx)}?cluster=devnet`;
      const short = `${meta.tx.slice(0, 4)}…${meta.tx.slice(-4)}`;
      lines.push(
        `Tx: <a href="${explorer}" target="_blank" rel="noopener noreferrer">${short}</a>`
      );
    }
    if (meta.node) lines.push(`Node: ${meta.node}`);
    if (meta.description) lines.push(meta.description);
    li.innerHTML = `
      <span class="mcp-pill ${pillClass}">${title}</span>
      <div>${text}</div>
      ${lines.length ? `<small>${lines.join(' • ')}</small>` : ''}
    `;
    list.appendChild(li);
    panel.classList.add('show');
    panel.scrollTop = panel.scrollHeight;
  }

  async function settleInvoice(invoice) {
    try {
      console.log('[MCPClient] settleInvoice start', invoice);
      const { provider, address } = await ensurePhantomConnected();
      const web3 = await loadSolanaWeb3();
      const {
        Connection,
        PublicKey,
        Transaction,
        MemoProgram,
        TransactionInstruction
      } = web3;

      const ids = ensureProgramIds(web3);

      const rpcEndpoint = invoice.rpc_endpoint || DEFAULT_SOLANA_RPC;
      const connection = new Connection(rpcEndpoint, 'confirmed');

      const payerPubkey = new PublicKey(address);
      const recipientRaw = (invoice.recipient ?? '').toString().trim();
      const mintRaw = (invoice.mint ?? '').toString().trim();
      console.log('[MCPClient] invoice addresses', { recipientRaw, mintRaw });
      if (!recipientRaw) {
        throw new Error('Invoice missing recipient address.');
      }
      if (!mintRaw) {
        throw new Error('Invoice missing mint address.');
      }
      const recipientPubkey = new PublicKey(recipientRaw);
      const mintPubkey = new PublicKey(mintRaw);
      const decimals = Number(invoice.decimals ?? DEFAULT_SOLANA_DECIMALS);
      const amountRaw = amountToBaseUnits(invoice.amount_usdc, decimals);

      const payerAta = getAssociatedTokenAddressSync(mintPubkey, payerPubkey, web3, ids);

      const payerAccountInfo = await connection.getAccountInfo(payerAta);
      if (!payerAccountInfo) {
        throw new Error('USDC associated token account not found in wallet.');
      }

      const recipientAta = getAssociatedTokenAddressSync(mintPubkey, recipientPubkey, web3, ids);

      const tx = new Transaction();

      const recipientAccountInfo = await connection.getAccountInfo(recipientAta);
      if (!recipientAccountInfo) {
        tx.add(
          createAssociatedTokenAccountInstruction(
            payerPubkey,
            recipientAta,
            recipientPubkey,
            mintPubkey,
            web3,
            ids
          )
        );
      }

      tx.add(
        createTransferInstruction(
          payerAta,
          recipientAta,
          payerPubkey,
          amountRaw,
          web3,
          ids
        )
      );

      if (invoice.memo) {
        console.warn('[MCPClient] memo instruction skipped (frontend helper unavailable)');
      }

      tx.feePayer = payerPubkey;
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
      tx.recentBlockhash = blockhash;
      tx.lastValidBlockHeight = lastValidBlockHeight;

      let signature;
      try {
        if (typeof provider.sendTransaction === 'function') {
          signature = await provider.sendTransaction(tx, connection, { skipPreflight: false });
        } else {
          const signed = await provider.signTransaction(tx);
          signature = await connection.sendRawTransaction(signed.serialize());
        }
      } catch (sendErr) {
        console.error('[MCPClient] Phantom send failed, falling back to raw send', sendErr);
        const signed = await provider.signTransaction(tx);
        signature = await connection.sendRawTransaction(signed.serialize());
      }

      await connection.confirmTransaction(
        {
          blockhash,
          lastValidBlockHeight,
          signature
        },
        'confirmed'
      );

      logStatus('payment', 'Payment settled on Solana. Retrying request…', {
      amount: invoice.amount_usdc,
      memo: invoice.memo,
        tx: signature
      });
      emit('payment', { invoice, tx: signature });
      return signature;
    } catch (error) {
      console.error('[MCPClient] settleInvoice error', error);
      if (error?.logs) {
        console.error('[MCPClient] transaction logs', error.logs);
      }
      if (error?.code === 4001 || /user rejected/i.test(String(error?.message || '').toLowerCase())) {
        logStatus('cancel', 'User cancelled wallet payment', {
          amount: invoice.amount_usdc,
          memo: invoice.memo
        });
        return null;
      }
      console.error('[MCPClient] payment error', error);
      throw error;
    }
  }

  async function request(path, body, opts = {}) {
    const fullEndpoint = path.startsWith('http')
      ? path
      : `${MCP_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
    console.log('[MCPClient] request start', fullEndpoint, body);
    const baseHeaders = { 'Content-Type': 'application/json' };
    let sessionHeaders = { ...(opts.headers || {}) };
    let paymentHeaders = {};
    const history = [];
    const payload = { ...(body || {}) };
    let walletAddress = detectWalletAddress();
    if (walletAddress) {
      baseHeaders['X-Wallet-Address'] = walletAddress;
      if (!payload.wallet_address) {
        payload.wallet_address = walletAddress;
      }
    }

    while (true) {
      if (walletAddress && payload.wallet_address !== walletAddress) {
        payload.wallet_address = walletAddress;
      }
      const payloadJson = JSON.stringify(payload);
      const headers = { ...baseHeaders, ...sessionHeaders, ...paymentHeaders };
      console.log('[MCPClient] issuing fetch', fullEndpoint, { headers });
      const response = await fetch(fullEndpoint, {
        method: 'POST',
        headers,
        body: payloadJson
      });
      console.log('[MCPClient] response status', response.status, fullEndpoint);
      paymentHeaders = {};

      const session = response.headers.get('X-Workflow-Session');
      if (session) {
        sessionHeaders['X-Workflow-Session'] = session;
      }

      if (response.status === 402) {
        const invoice = await response.json();
        console.log('[MCPClient] received 402 invoice', invoice);
        if (invoice.status && invoice.status !== 'payment_required') {
          const reason = invoice.message || invoice.status || 'Payment required';
          logStatus('cancel', reason, {
            amount: invoice.amount_usdc,
            memo: invoice.memo
          });
          return {
            status: 'invoice_error',
            invoice,
            history: [...history, { type: 'invoice_error', invoice }]
          };
        }
        history.push({ type: 'invoice', invoice });
        logStatus('invoice', invoice.description || 'Payment required', {
          amount: invoice.amount_usdc,
          memo: invoice.memo
        });
        emit('invoice', { endpoint: fullEndpoint, invoice });
        if (typeof opts.onInvoice === 'function') {
          try { await opts.onInvoice(invoice); } catch (_) {}
        }
        if (opts.autoPay === false) {
          return { status: 'invoice', invoice, history, headers: sessionHeaders };
        }
        let tx;
        try {
          tx = opts.paymentProvider
          ? await opts.paymentProvider(invoice)
            : await settleInvoice(invoice);
        } catch (paymentError) {
          history.push({ type: 'payment_error', invoice, error: paymentError });
          logStatus('cancel', `Payment failed: ${paymentError?.message || 'Payment error'}`, {
            amount: invoice.amount_usdc,
            memo: invoice.memo
          });
          emit('payment:error', { endpoint: fullEndpoint, invoice, error: paymentError });
          throw paymentError;
        }
        if (!tx) {
          return { status: 'cancelled', invoice, history };
        }
        history.push({ type: 'payment', invoice, tx });
        if (typeof opts.onPayment === 'function') {
          try { await opts.onPayment(invoice, tx); } catch (_) {}
        }
        emit('payment:settled', { endpoint: fullEndpoint, invoice, tx });
        walletAddress = detectWalletAddress() || walletAddress;
        if (walletAddress) {
          baseHeaders['X-Wallet-Address'] = walletAddress;
        }
        const memoPart = invoice.memo ? `; memo=${invoice.memo}` : '';
        paymentHeaders = {
          'X-Request-Id': invoice.request_id,
          'X-PAYMENT': `x402 tx=${tx}; amount=${invoice.amount_usdc}; nonce=${invoice.nonce}${memoPart}`
        };
        continue;
      }

      const result = await response.json();
      console.log('[MCPClient] final result', result);
      history.push({ type: 'result', result });
      if (typeof opts.onResult === 'function') {
        try { await opts.onResult(result); } catch (_) {}
      }
      emit('result', { endpoint: fullEndpoint, result });
      logStatus('result', 'Call completed', {});
      try {
        const explorerUrl =
          result?.final_node?.explorer ||
          result?.explorer ||
          result?.receipt?.explorer ||
          result?.meta?.verification?.explorerUrl;
        if (explorerUrl) {
          showExplorerToast({
            url: explorerUrl,
            title: 'On-chain Transaction',
            subtitle: 'Click to view in Solana Explorer.'
          });
        }
      } catch (toastError) {
        console.warn('[MCPClient] failed to display explorer toast', toastError);
      }
      return { status: 'ok', result, history };
    }
  }

  async function invokeModel({ prompt, modelName, metadata } = {}) {
    const body = {
      prompt,
      model: modelName,
      metadata: metadata || {}
    };
    return request('/mcp/models.invoke', body, {});
  }

  async function executeWorkflow(payload, hooks = {}) {
    return request('/mcp/workflow/execute', payload, {
      onInvoice: hooks.onInvoice,
      onPayment: hooks.onPayment,
      onResult: hooks.onResult
    });
  }

  async function purchaseShare(payload, hooks = {}) {
    return request('/mcp/share/buy', payload, {
      onInvoice: hooks.onInvoice,
      onPayment: hooks.onPayment,
      onResult: hooks.onResult
    });
  }

  async function claimCheckin(payload, hooks = {}) {
    const res = await fetch(`${MCP_BASE_URL}/mcp/checkin/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (res.ok) {
      logStatus('result', 'Check-in successful', {
        amount: data.amount_usdc,
        tx: data.tx_signature
      });
      if (typeof hooks.onResult === 'function') {
        try { await hooks.onResult(data); } catch (_) {}
      }
      emit('result', { endpoint: 'checkin', result: data });
      return { status: 'ok', result: data };
    }
    emit('error', { endpoint: 'checkin', error: data });
    return { status: 'error', error: data };
  }

  window.MCPClient = {
    baseUrl: MCP_BASE_URL,
    request,
    invokeModel,
    executeWorkflow,
    settleInvoice,
    purchaseShare,
    claimCheckin,
    logStatus
  };
})();
