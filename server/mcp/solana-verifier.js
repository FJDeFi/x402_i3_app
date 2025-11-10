const { Connection } = require('@solana/web3.js');
const CONFIG = require('./config');

const DEFAULT_RPC = 'https://api.devnet.solana.com';
let sharedConnection = null;

function getConnection() {
  if (!sharedConnection) {
    const rpcEndpoint = CONFIG.payments.rpcUrl || DEFAULT_RPC;
    sharedConnection = new Connection(rpcEndpoint, 'confirmed');
  }
  return sharedConnection;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeAddress(value) {
  return typeof value === 'string' ? value.toLowerCase() : '';
}

function buildExplorerUrl(signature) {
  const base = CONFIG.payments.explorerBaseUrl;
  if (!base) {
    return `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
  }
  if (base.includes('{tx}')) {
    return base.replace('{tx}', signature);
  }
  const [path, query] = base.split('?');
  if (query) {
    return `${path.replace(/\/$/, '')}/${signature}?${query}`;
  }
  return `${base.replace(/\/$/, '')}/${signature}`;
}

function toBaseUnits(amount, decimals) {
  const value = typeof amount === 'string' ? amount : String(amount);
  const [wholeRaw, fracRaw = ''] = value.split('.');
  const whole = wholeRaw.length ? wholeRaw : '0';
  const fraction = fracRaw.padEnd(decimals, '0').slice(0, decimals);
  const digits = `${whole}${fraction}`;
  if (!/^\d+$/.test(digits)) {
    throw new Error(`Invalid amount "${amount}" for conversion`);
  }
  return BigInt(digits);
}

async function fetchParsedTransaction(signature, { attempts = 6, delayMs = 500 } = {}) {
  const conn = getConnection();
  for (let i = 0; i < attempts; i += 1) {
    const tx = await conn.getParsedTransaction(signature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0
    });
    if (tx) return tx;
    await sleep(delayMs);
  }
  return null;
}

async function verifySolanaUsdcTransfer({
  signature,
  amount,
  mint,
  recipient,
  decimals,
  memo,
  expectedWallet
}) {
  const parsedTx = await fetchParsedTransaction(signature);
  if (!parsedTx) {
    return {
      ok: false,
      code: 'tx_not_found',
      message: 'Transaction not found on Solana RPC (confirmed commitment).'
    };
  }

  if (parsedTx.meta?.err) {
    return {
      ok: false,
      code: 'tx_failed',
      message: 'On-chain transaction failed.',
      details: parsedTx.meta.err
    };
  }

  let memoMatched = memo ? false : null;
  if (memo) {
    const memoIx = (parsedTx.transaction?.message?.instructions || []).find((ix) => {
      if (!ix) return false;
      if (ix.program === 'spl-memo' && ix.parsed?.info?.memo) {
        return ix.parsed.info.memo === memo;
      }
      if (ix.programId === 'Memo111111111111111111111111111111111111111') {
        return ix.parsed?.info?.memo === memo;
      }
      return false;
    });
    if (memoIx) {
      memoMatched = true;
    } else {
      console.warn('[solana-verifier] memo mismatch', { expected: memo, signature });
      memoMatched = false;
    }
  }

  const postBalances = parsedTx.meta?.postTokenBalances || [];
  const preBalances = parsedTx.meta?.preTokenBalances || [];
  const recipientLower = normalizeAddress(recipient);

  const postRecipient = postBalances.find(
    (b) => b?.mint === mint && normalizeAddress(b.owner) === recipientLower
  );
  const preRecipient = preBalances.find(
    (b) => b?.mint === mint && normalizeAddress(b.owner) === recipientLower
  );

  if (!postRecipient) {
    return {
      ok: false,
      code: 'recipient_account_missing',
      message: 'Recipient token account not present in transaction balance changes.'
    };
  }

  const after = BigInt(postRecipient.uiTokenAmount?.amount || '0');
  const before = BigInt(preRecipient?.uiTokenAmount?.amount || '0');
  const transferred = after - before;
  const required = toBaseUnits(amount, decimals);

  if (transferred < required) {
    return {
      ok: false,
      code: 'insufficient_amount',
      message: 'Transferred amount below invoice requirement.',
      details: {
        transferred: transferred.toString(),
        required: required.toString()
      }
    };
  }

  let payerAddress = null;
  const accountKeys = parsedTx.transaction?.message?.accountKeys || [];
  if (accountKeys.length) {
    const key0 = accountKeys[0];
    if (key0?.pubkey?.toBase58) {
      payerAddress = key0.pubkey.toBase58();
    } else if (typeof key0?.pubkey === 'string') {
      payerAddress = key0.pubkey;
    } else if (typeof key0 === 'string') {
      payerAddress = key0;
    }
  }

  if (expectedWallet && payerAddress) {
    if (normalizeAddress(expectedWallet) !== normalizeAddress(payerAddress)) {
      return {
        ok: false,
        code: 'payer_mismatch',
        message: 'Transaction sent from unexpected wallet.',
        details: {
          expected: expectedWallet,
          actual: payerAddress
        }
      };
    }
  }

  return {
    ok: true,
    payer: payerAddress,
    amountRaw: transferred.toString(),
    slot: parsedTx.slot,
    blockTime: parsedTx.blockTime || null,
    explorerUrl: buildExplorerUrl(signature),
    memoMatched
  };
}

module.exports = {
  getConnection,
  toBaseUnits,
  verifySolanaUsdcTransfer
};
