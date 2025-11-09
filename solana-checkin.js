// solana-checkin.js — Anchor-lite：不依赖 @coral-xyz/anchor
// 保持你的既有逻辑，onSuccess 由 onchain-checkin.js 注入的回调里完成：UI 刷新 + dailyCheckin

import { SOLANA, isSolanaSelected, solanaEndpoint, solanaExplorerTx } from './chains.js';
import { connect as connectWallet } from './solana-wallet.js';

const CHECKIN_METHOD = 'checkin';
const USER_PDA_NAME  = 'user_pda';

/* -------------------- 轻量依赖 -------------------- */
async function loadWeb3() {
  // 先用官方打包好的“浏览器 ESM”构建，天然不依赖 Node Buffer
  try {
    return await import('https://unpkg.com/@solana/web3.js@1.95.3/lib/index.browser.esm.js');
  } catch (e1) {
    // 兜底 1：jsDelivr
    try {
      return await import('https://cdn.jsdelivr.net/npm/@solana/web3.js@1.95.3/lib/index.browser.esm.js');
    } catch (e2) {
      // 兜底 2：esm.sh（保留你的原写法）
      return await import('https://esm.sh/@solana/web3.js@1.95.3?bundle');
    }
  }
}

/* -------------------------------------------------------------------------- */
/* ★ PATCH A: 原始 RPC simulate 辅助（跨 web3 版本；一定能拿到 err/logs）          */
/* -------------------------------------------------------------------------- */
function __u8ToB64(u8) {
  let s = '';
  for (let i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]);
  return btoa(s);
}
function __txToBase64(tx) {
  if (typeof tx.serialize === 'function') {
    const u8 = tx.serialize({ requireAllSignatures: false, verifySignatures: false });
    return __u8ToB64(u8);
  }
  if (typeof tx.toBuffer === 'function') {
    return __u8ToB64(new Uint8Array(tx.toBuffer()));
  }
  if (typeof tx.toUint8Array === 'function') {
    return __u8ToB64(tx.toUint8Array());
  }
  throw new Error('Unknown tx type: cannot serialize to base64.');
}

async function simulateRaw(connection, tx, {
  commitment = 'confirmed',
  sigVerify = false,             // 不做签名校验（和钱包一致）
  replaceRecentBlockhash = false // ❗不允许节点替换 blockhash，保证同一 message
} = {}) {
  const b64 = __txToBase64(tx);

  const endpoint =
    connection.rpcEndpoint ||
    connection._rpcEndpoint ||
    connection._rpcAddress ||
    (connection?._rpcClient && connection._rpcClient._rpcEndpoint);
  if (!endpoint) throw new Error('Cannot resolve RPC endpoint from connection');

  const payload = {
    jsonrpc: '2.0',
    id: Date.now(),
    method: 'simulateTransaction',
    params: [
      b64,
      {
        encoding: 'base64',
        commitment,
        sigVerify,
        replaceRecentBlockhash // false：不要让节点在模拟里改 message
      }
    ]
  };

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload)
  }).then(r => r.json());

  if (res.error) {
    const e = new Error(`RPC error: ${res.error.message || 'simulateTransaction failed'}`);
    e.rpc = res;
    throw e;
  }
  return res.result; // { value: { err, logs, ... } }
}



/* -------------------------------------------------------------------------- */
/* 发送辅助：统一 commitment='confirmed'；签名前做“同一条 tx”的预演（不拦截 Phantom）*/
/* -------------------------------------------------------------------------- */
// ---- Phantom preflight with devnet-friendly blockhash & small catch-up delay ----
async function signAndSendFresh(tx, connection, walletPk, web3) {
  // 用 processed 拿 hash（更快可见度），并等待 ~1.2s 让别的 RPC 追上
  const COMMIT_FOR_HASH = 'processed';
  const CONFIRM_COMMIT  = 'confirmed';

  // A) feePayer + blockhash
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash(COMMIT_FOR_HASH);
  try { tx.feePayer = walletPk; } catch {}
  tx.recentBlockhash = blockhash;

  // ⬅️ 关键：给 Phantom 所在的 RPC 一点追块时间，避免“blockhash not found/预演取不到上下文”
  await new Promise(r => setTimeout(r, 1200)); // 1.2s 一般就够，必要可改到 1500–2000ms

  let signature;

  if (typeof window.solana?.signAndSendTransaction === 'function') {
    // 让 Phantom 自己做 preflight（黄条来源），但此时它大概率已经追上刚才的 blockhash
    const resp = await window.solana.signAndSendTransaction(tx, {
      preflightCommitment: 'processed', // 放宽预演承诺，进一步降低误报
      skipPreflight: false
    });
    signature = resp?.signature || resp;
  } else {
    if (!window.solana?.signTransaction) throw new Error('Phantom wallet not available');
    const signed = await window.solana.signTransaction(tx);
    signature = await connection.sendRawTransaction(signed.serialize(), {
      skipPreflight: false,
      preflightCommitment: 'processed'
    });
  }

  // 链上最终确认仍用 confirmed（或你习惯的 finalized）
  await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, CONFIRM_COMMIT);
  return signature;
}

async function loadIdl() {
  const r = await fetch(SOLANA.idlPath, { cache: 'no-cache' });
  if (!r.ok) throw new Error(`Failed to load IDL from ${SOLANA.idlPath}`);
  return await r.json();
}

/* -------------------- 工具：discriminator / 错误解码 -------------------- */
async function ixDisc(name) {
  const enc = new TextEncoder();
  const data = enc.encode(`global:${name}`);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return new Uint8Array(hash).slice(0, 8);
}
function decodeAnchorErr(logs = [], idl) {
  const line = (logs || []).find(l => /Error Code:/i.test(l));
  if (!line) return null;
  const name = (line.match(/Error Code:\s*([A-Za-z0-9_]+)/i) || [])[1];
  const hex  = (line.match(/Error Number:\s*(0x[0-9a-fA-F]+)/i) || [])[1];
  const code = hex ? parseInt(hex, 16) : undefined;
  const found = (idl?.errors || []).find(e => e.code === code || e.name === name);
  return found ? { code: found.code, name: found.name, msg: found.msg } : { code, name };
}

/* -------------------- IDL→账户映射（含 PDA/别名/sysvars） -------------------- */
function deriveAccountsFromIdl(ixDef, web3, walletPk, programId) {
  const {
    PublicKey, SystemProgram,
    SYSVAR_RENT_PUBKEY, SYSVAR_CLOCK_PUBKEY, SYSVAR_INSTRUCTIONS_PUBKEY
  } = web3;
  const accounts = {};
  const eq = (a,b)=>String(a||'').toLowerCase()===String(b||'').toLowerCase();

  for (const acc of ixDef.accounts) {
    const n = String(acc.name || '');

    if (acc.isSigner) { accounts[n] = walletPk; continue; }
    if (['authority','owner','user','payer','signer','wallet'].some(k=>eq(n,k))) {
      accounts[n]=walletPk; continue;
    }

    if (eq(n,'systemProgram') || eq(n,'system_program') || eq(n,'system')) {
      accounts[n] = SystemProgram.programId; continue;
    }
    if (eq(n,'rent') || eq(n,'rentSysvar') || eq(n,'sysvarRent')) {
      if (SYSVAR_RENT_PUBKEY) accounts[n] = SYSVAR_RENT_PUBKEY; continue;
    }
    if (eq(n,'clock') || eq(n,'clockSysvar') || eq(n,'sysvarClock')) {
      if (SYSVAR_CLOCK_PUBKEY) accounts[n] = SYSVAR_CLOCK_PUBKEY; continue;
    }
    if (eq(n,'instructions') || eq(n,'sysvarInstructions') || eq(n,'instructionsSysvar')) {
      if (SYSVAR_INSTRUCTIONS_PUBKEY) accounts[n] = SYSVAR_INSTRUCTIONS_PUBKEY; continue;
    }

    if (acc.pda?.seeds?.length) {
      const seeds = acc.pda.seeds.map(s=>{
        if (s.kind==='const') return Buffer.from(s.value,'utf8');
        if (s.kind==='account' && ['authority','owner','user','payer','signer','wallet'].some(k=>eq(s.path,k))) {
          return walletPk.toBuffer();
        }
        throw new Error(`Unsupported PDA seed for "${n}": ${JSON.stringify(s)}`);
      });
      const [pda] = PublicKey.findProgramAddressSync(seeds, new PublicKey(programId));
      accounts[n]=pda; continue;
    }

    if (acc.isOptional) continue;

    console.warn('[unmapped account]', acc);
    throw new Error(`Cannot map account "${n}" from IDL – please wire it manually.`);
  }
  return accounts;
}

/* -------------------- 生成 keys（启发式修正 signer/writable） -------------------- */
function toKeys(ixDef, accounts) {
  const lower = s=>String(s||'').toLowerCase();
  return ixDef.accounts
    .filter(a=>accounts[a.name])
    .map(a=>{
      const name = lower(a.name);
      let isSigner   = !!a.isSigner;
      let isWritable = !!a.isMut;
      if (['authority','owner','user','payer','signer','wallet'].includes(name)) isSigner = true;
      if (name.endsWith('_pda') || name.includes('pda')) isWritable = true;
      return { pubkey: accounts[a.name], isSigner, isWritable };
    });
}

/* -------------------- 辅助：在 IDL 里寻找“初始化 user_pda”的指令 -------------------- */
function findInitIxForUser(idl) {
  const cand = (idl.instructions || []).filter(ix => {
    const hasUser = (ix.accounts || []).some(a => a.name?.toLowerCase?.() === USER_PDA_NAME);
    const isInit  = /init/i.test(ix.name) || /initialize/i.test(ix.name);
    return hasUser && isInit;
  });
  return cand[0] || null;
}

/* -------------------- 构造任意 IDL 指令 -------------------- */
async function buildIxFromIxDef(ixDef, web3, walletPk, programId) {
  const accountsMap = deriveAccountsFromIdl(ixDef, web3, walletPk, programId);
  console.log(`[build ${ixDef.name}] accountsMap`, Object.fromEntries(Object.entries(accountsMap).map(([k,v])=>[k, v.toString()])));
  const keys = toKeys(ixDef, accountsMap);
  console.table(keys.map(k => ({ pubkey:k.pubkey.toString(), isSigner:k.isSigner, isWritable:k.isWritable })));
  const data = await ixDisc(ixDef.name);
  return { keys, data };
}

// === Solana 弹窗 UI 刷新（用本地统计刷新 Current Streak / Total Check-ins）===
function refreshSolanaModalStats() {
  const getN = (k) => Number(localStorage.getItem(k) || 0);

  const streak = getN('current_streak');   // dailyCheckin 会维护
  const total  = getN('total_checkins');   // dailyCheckin 会维护
  const reward = 30;                       // 你当前的固定奖励

  const streakEl = document.getElementById('currentStreak');
  const totalEl  = document.getElementById('totalCheckIns');
  const rewardEl = document.getElementById('nextReward');

  if (streakEl) streakEl.textContent = `${streak} days`;
  if (totalEl)  totalEl.textContent  = total;
  if (rewardEl) rewardEl.textContent = `${reward}`;
}

/* -------------------- 保护 -------------------- */
function ensureSolanaSelected() {
  if (!isSolanaSelected()) throw new Error('Current chain is not Solana. Switch chain first.');
}

/* -------------------- UI -------------------- */
export async function openCheckinModal() {
  // ✅ 每次打开弹窗先复位，一次性保险不会沿用上次成功后的 true
  window.__i3_sol_success_fired = false;

  ensureSolanaSelected();
  document.getElementById('checkin-modal')?.classList?.remove('hidden');
  try { refreshSolanaModalStats(); } catch {}
  // （可选）根据本地标记预置按钮为“已签到”，减少困惑
  try {
    const s = JSON.parse(localStorage.getItem('checkin_status_SOLANA') || 'null');
    const today = new Date().toISOString().slice(0, 10);
    if (s?.checked && s?.date === today) {
      const btn = document.getElementById('executeCheckInBtn');
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Already Checked In Today';
        btn.style.opacity = '0.6';
        btn.style.cursor  = 'not-allowed';
      }
    }
  } catch {}
}


/* -------------------- 执行签到（自动初始化） -------------------- */
export async function executeCheckin(ui={}) {
  ensureSolanaSelected();
  const { onStatus, onError, onSuccess } = ui;

  try {
    // 1) 钱包 & 依赖
    const walletAddr  = await connectWallet();
    onStatus?.(`Wallet: ${walletAddr}`);

    const idl  = await loadIdl();
    const web3 = await loadWeb3();
    const { Connection, PublicKey, Transaction, TransactionInstruction } = web3;

    const connection   = new Connection(solanaEndpoint(), 'confirmed');
    const programId    = new PublicKey(SOLANA.programId);
    const walletPubkey = new PublicKey(walletAddr);

    // 2) 取 checkin 指令 & 映射账户
    const checkinIxDef = idl.instructions.find(i => i.name === CHECKIN_METHOD)
                      || idl.instructions.find(i => i.name?.toLowerCase?.() === CHECKIN_METHOD);
    if (!checkinIxDef) throw new Error(`No instruction "${CHECKIN_METHOD}" found in IDL`);

    const checkinAccounts = deriveAccountsFromIdl(checkinIxDef, web3, walletPubkey, programId);
    console.log('[accountsMap]', Object.fromEntries(Object.entries(checkinAccounts).map(([k,v])=>[k, v.toString()])));

    // 3) 若 user_pda 未初始化 → 自动 init
    const userPda = checkinAccounts[USER_PDA_NAME];
    const accInfo = await connection.getAccountInfo(userPda);
    if (!accInfo) {
      onStatus?.('User account not initialized. Running init…');
      const initDef = findInitIxForUser(idl);
      if (!initDef) throw new Error(`Account "${USER_PDA_NAME}" not initialized and no init instruction found in IDL`);
      const { keys: initKeys, data: initData } = await buildIxFromIxDef(initDef, web3, walletPubkey, programId);
      const initIx = new TransactionInstruction({ programId, keys: initKeys, data: initData });
      const initTx = new Transaction().add(initIx);
      const initSig = await signAndSendFresh(initTx, connection, walletPubkey, web3);
      console.log('[init] done:', initSig, solanaExplorerTx(initSig));
    }

    // 4) 执行 checkin
    const keys = toKeys(checkinIxDef, checkinAccounts);
    console.table(keys.map(k => ({ pubkey:k.pubkey.toString(), isSigner:k.isSigner, isWritable:k.isWritable })));
    const data = await ixDisc(checkinIxDef.name);

    const ix = new TransactionInstruction({ programId, keys, data });
    const tx = new Transaction().add(ix);

    onStatus?.('Sending transaction...');
    const sig = await signAndSendFresh(tx, connection, walletPubkey, web3);
    onStatus?.('Confirming...');

/* ---------------------------------------------------------------------- */
/* ★ PATCH C: 成功路径“一次性保险” + 统一记账 + 立刻落 UI（仅此一处）         */
/* ---------------------------------------------------------------------- */
if (window.__i3_sol_success_fired) {
  console.warn('[solana] success path already handled (skip duplicate).');
  const url = solanaExplorerTx(sig);
  onSuccess?.({ txSig: sig, url });
  return { txSig: sig, url };
}
window.__i3_sol_success_fired = true;

// 1) ✅ 统一记账（只在这里调一次；要 await）
try {
  await window.walletManager?.dailyCheckin?.({ skipLocalGate: true });
} catch (e) {
  console.warn('[solana-checkin] dailyCheckin failed:', e);
}

// 2) ✅ 本地落“今天已签”标记 + 按钮立刻变灰
try {
  localStorage.setItem(
    'checkin_status_SOLANA',
    JSON.stringify({ checked: true, date: new Date().toISOString().slice(0,10) })
  );
  const btn = document.getElementById('executeCheckInBtn');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Already Checked In Today';
    btn.style.opacity = '0.6';
    btn.style.cursor  = 'not-allowed';
  }
  // 广播给其它页（可选）
  window.dispatchEvent(new CustomEvent('i3:checkin-updated', { detail: { chain: 'SOLANA' }}));
} catch (e) {
  console.warn('[solana] mark checked-in locally failed:', e);
}

try { refreshSolanaModalStats(); } catch {}
// 3) ✅ 刷新右上角等 UI
window.walletManager?.updateUI?.();


    // 5) 链上日志（调试）
    try {
      const rec = await connection.getTransaction(sig, { commitment:'confirmed', maxSupportedTransactionVersion:0 });
      if (rec?.meta?.logMessages) {
        console.log('[on-chain logs]\n' + rec.meta.logMessages.join('\n'));
        const dec = decodeAnchorErr(rec.meta.logMessages, idl);
        if (dec) console.warn('[anchor-error@chain]', dec);
      }
    } catch (_) {}

    const url = solanaExplorerTx(sig);
    onSuccess?.({ txSig: sig, url }); // 这行只做 UI 成功提示（不要再本地 +30）
    return { txSig: sig, url };
  } catch (err) {
    console.error(err);
    onError?.(err);
    throw err;
  }
}

/* -------------------- 暴露全局 -------------------- */
window.openSolanaCheckinModal = openCheckinModal;
window.executeSolanaCheckin   = (hooks) => executeCheckin(hooks);
