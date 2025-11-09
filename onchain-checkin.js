// onchain-checkin.js — Unified EVM + Solana (hardened)
// 兼容字段：config.chainId 或 config.chainIdHex；config.checkInAbi 或 window.CHECKIN_ABI
// EVM：事件解析 + Firebase 同步；Solana：保留原统一版流程
// nextReward 显示：优先来自合约；缺省回退到 30

/* ------------------------ 通用通知 ------------------------ */
function safeNotify(msg, type = 'info', opts = {}) {
  try {
    if (typeof window.showNotification === 'function') {
      return window.showNotification(msg, type, opts);
    }
    let host = document.getElementById('i3-toast-host');
    if (!host) {
      host = document.createElement('div');
      host.id = 'i3-toast-host';
      host.style.cssText = 'position:fixed;top:24px;left:50%;transform:translateX(-50%);z-index:99999;display:flex;flex-direction:column;gap:12px;pointer-events:none;';
      document.body.appendChild(host);
    }
    const palette = { success: ['#10b981', '#ecfdf5'], error: ['#ef4444', '#fef2f2'], warning: ['#f59e0b', '#fffbeb'], info: ['#3b82f6', '#eff6ff'] };
    const [fg, bg] = palette[type] || palette.info;
    const el = document.createElement('div');
    el.style.cssText =
      `min-width:280px;max-width:640px;background:${bg};color:#111827;border-left:6px solid ${fg};` +
      'box-shadow:0 10px 25px rgba(0,0,0,.15);border-radius:12px;padding:14px 18px;font-size:14px;font-weight:600;pointer-events:auto;';
    el.textContent = msg;
    host.appendChild(el);
    setTimeout(()=>{ el.style.transition='opacity .25s, transform .25s'; el.style.opacity='0'; el.style.transform='translateY(-6px)'; setTimeout(()=>el.remove(),260); }, opts.duration || 2600);
  } catch (e) { (type==='error'?console.error:console.log)('[notify-fallback]', msg); }
}

/* ------------------------ Loading ------------------------ */
function setLoadingState(isLoading, message = 'Processing...') {
  const loading = document.getElementById('checkInLoading');
  const btn = document.getElementById('executeCheckInBtn');
  const loadingText = document.getElementById('loadingText');
  if (loading) loading.style.display = isLoading ? 'block' : 'none';
  if (btn) btn.style.display = isLoading ? 'none' : 'block';
  if (loadingText) loadingText.textContent = message;
}

/* ------------------------ UI 更新 ------------------------ */
function updateStatusUI(streak, totalCheckIns, nextReward, canCheckInToday) {
  const streakEl = document.getElementById('currentStreak');
  const totalEl  = document.getElementById('totalCheckIns');
  const rewardEl = document.getElementById('nextReward');
  const btn      = document.getElementById('executeCheckInBtn');

  if (streakEl) streakEl.textContent = String(streak ?? 0);
  if (totalEl)  totalEl.textContent  = String(totalCheckIns ?? 0);

  // 优先显示合约返回的 nextReward；没有则回退 30
  const rewardToShow = (nextReward == null || Number.isNaN(Number(nextReward))) ? 30 : Number(nextReward);
  if (rewardEl) rewardEl.textContent = String(rewardToShow);

  if (btn) {
    const can = !!canCheckInToday;
    btn.disabled    = !can;
    btn.textContent = can ? 'Daily Check-in' : 'Already Checked Today';
    btn.style.opacity = can ? '1' : '0.6';
    btn.style.cursor  = can ? 'pointer' : 'not-allowed';
  }
}

function isSolanaSelectedInUI() {
  const sel = document.getElementById('chainSelector');
  if (!sel) return false;
  const v = (sel.value || '').toString().trim().toUpperCase();
  return v === 'SOLANA' || v === 'SOLANA DEVNET' || v === 'SOL';
}

/* ------------------------ Solana 成功后（本地刷新） ------------------------ */
function applySolanaPostSuccessUI({ reward = 30 } = {}) {
  const btn = document.getElementById('executeCheckInBtn');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Already Checked Today';
    btn.classList?.add?.('opacity-60', 'pointer-events-none');
  }
  const toInt = (el) => parseInt((el?.textContent || '0').replace(/\D+/g, ''), 10) || 0;
  const streakEl = document.getElementById('currentStreak');
  const totalEl  = document.getElementById('totalCheckIns');
  if (streakEl) streakEl.textContent = String(toInt(streakEl) + 1);
  if (totalEl)  totalEl.textContent  = String(toInt(totalEl) + 1);

  try {
    const getNum = (k) => Number(localStorage.getItem(k) || '0');
    const setNum = (k, v) => localStorage.setItem(k, String(v));
    const newCredits = getNum('user_credits') + reward;
    setNum('user_credits', newCredits);
    setNum('total_earned', getNum('total_earned') + reward);
    setNum('total_checkins', getNum('total_checkins') + 1);

    const arr = JSON.parse(localStorage.getItem('credit_transactions') || '[]');
    arr.unshift({ type:'checkin', chain:'solana-devnet', amount:reward, ts:Date.now() });
    localStorage.setItem('credit_transactions', JSON.stringify(arr.slice(0, 200)));

    const totalCreditsEl = document.getElementById('totalCredits');
    if (totalCreditsEl) totalCreditsEl.textContent = String(newCredits);

    const today = new Date().toISOString().slice(0,10);
    localStorage.setItem('checkin_status_SOLANA', JSON.stringify({ date: today }));
  } catch {}
}

/* ------------------------ EVM 工具 ------------------------ */
function normalizeChainIdHex(config) {
  // 兼容 config.chainId 或 config.chainIdHex，保证返回 0x.. 字符串
  let hex = config?.chainIdHex || config?.chainId;
  if (!hex) return null;
  if (typeof hex === 'number') hex = '0x' + hex.toString(16);
  if (typeof hex === 'string' && !hex.startsWith('0x')) {
    // 尝试把十进制字符串转 hex
    const n = Number(hex);
    if (!Number.isNaN(n)) hex = '0x' + n.toString(16);
  }
  return hex;
}

function getEvmAbi(config) {
  return config?.checkInAbi || window.CHECKIN_ABI;
}

async function switchToChain(targetHex) {
  if (!window.ethereum) {
    safeNotify('No EVM wallet detected', 'error');
    return false;
  }
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: targetHex }],
    });
    return true;
  } catch (e) {
    if (e.code === 4902 && typeof window.getEvmAddChainParams === 'function') {
      try {
        const params = window.getEvmAddChainParams(targetHex);
        await window.ethereum.request({ method: 'wallet_addEthereumChain', params: [params] });
        return true;
      } catch (e2) {
        console.error('Add chain failed', e2);
      }
    }
    console.error('Switch chain failed', e);
    return false;
  }
}

async function checkBNBBalanceViaProvider(provider, address, minBalance = '0.00004') {
  const bal = await provider.getBalance(address);
  const minWei = ethers.utils.parseEther(minBalance);
  return { ok: bal.gte(minWei), balance: ethers.utils.formatEther(bal), min: minBalance };
}

/* ------------------------ 状态读取（Solana 早退；EVM 读取合约） ------------------------ */
async function loadUserCheckInStatus() {
  try {
    const inSol =
      (typeof isSolanaSelectedInUI === 'function' && isSolanaSelectedInUI()) ||
      (typeof window.isSolanaSelected === 'function' && window.isSolanaSelected());
    if (inSol) {
      console.log('[checkin] Solana selected - skip EVM status load');
      return;
    }

    if (!window.walletManager || !window.walletManager.isConnected) {
      console.warn('Wallet not connected, skip status load');
      return;
    }

    const addr = window.walletManager.walletAddress;
    const sel = document.getElementById('chainSelector');
    const selectedChain = sel ? sel.value : 'BSC';
    const config = window.getContractConfig?.(selectedChain);
    if (!config) {
      console.error('No EVM config for chain:', selectedChain);
      updateStatusUI(0, 0, 30, false);
      return;
    }
    const abi = getEvmAbi(config);
    const rpc = config.rpcUrl;
    if (!abi || !rpc || !config.checkInAddress) {
      console.warn('EVM config incomplete', config);
      updateStatusUI(0, 0, 30, false);
      return;
    }
    if (typeof ethers === 'undefined') {
      console.error('Ethers not loaded');
      updateStatusUI(0, 0, 30, false);
      return;
    }

    const provider = new ethers.providers.JsonRpcProvider(rpc);
    const contract = new ethers.Contract(config.checkInAddress, abi, provider);
    const status = await contract.getUserStatus(addr);

    // 结构：[lastDay, streak, totalCredits, availableCredits, nextReward, canCheckInToday]
    const streak        = Number(status[1]?.toString?.() ?? 0);
    const totalCredits  = Number(status[2]?.toString?.() ?? 0);
    const nextReward    = Number(status[4]?.toString?.() ?? 30);
    const canCheckToday = Boolean(status[5]);

    updateStatusUI(streak, totalCredits, nextReward, canCheckToday);
  } catch (err) {
    console.error('Failed to load status:', err);
    updateStatusUI(0, 0, 30, false);
  }
}

/* ------------------------ 防重入锁 ------------------------ */
if (typeof window.__i3_checkin_busy === 'undefined') {
  window.__i3_checkin_busy = false;
}
function setBusy(busy) {
  window.__i3_checkin_busy = !!busy;
  const btn = document.getElementById('executeCheckInBtn');
  if (btn) {
    btn.disabled = busy;
    if (busy) btn.classList?.add?.('opacity-60','pointer-events-none');
    else btn.classList?.remove?.('opacity-60','pointer-events-none');
  }
}

/* ------------------------ 主执行入口 ------------------------ */
async function executeOnChainCheckIn() {
  if (window.__i3_checkin_busy) {
    console.warn('[checkin] duplicate click ignored');
    return;
  }
  setBusy(true);

  try {
    if (!window.walletManager || !window.walletManager.isConnected) {
      (window.showNotification || safeNotify)('Please connect your wallet first', 'error');
      return;
    }

    // 钱包类型 vs 目标链类型守卫
    {
      const wt = String(window.walletManager?.walletType || '').toLowerCase();
      const walletKind = wt.includes('solana') ? 'solana' : 'evm';
      const sel = document.getElementById('chainSelector');
      const v = String(sel?.value || '').toLowerCase();
      const targetKind = /(solana|^sol\b)/.test(v) ? 'solana' : 'evm';
      if (walletKind !== targetKind) {
        const notify = (window.showNotification || safeNotify);
        if (walletKind === 'evm' && targetKind === 'solana') {
          notify('You are using an EVM wallet. Please switch to a Solana wallet (e.g., Phantom).', 'error');
          try { typeof showWalletSelectionModal === 'function' && showWalletSelectionModal(); } catch {}
        } else if (walletKind === 'solana' && targetKind === 'evm') {
          notify('You are using a Solana wallet. Please connect an EVM wallet (MetaMask / WalletConnect / Coinbase).', 'error');
          try { typeof showWalletSelectionModal === 'function' && showWalletSelectionModal(); } catch {}
        }
        return;
      }
    }

    // 分流：Solana
    const inSol =
      (typeof isSolanaSelectedInUI === 'function' && isSolanaSelectedInUI()) ||
      (typeof window.isSolanaSelected === 'function' && window.isSolanaSelected());
    if (inSol) {
      try { window.openSolanaCheckinModal?.(); } catch {}
      const ui = {
        onStatus:  (m)   => console.log('[solana] status:', m),
        onError:   (err) => (window.showNotification || safeNotify)(`Solana check-in failed: ${err?.message || err}`, 'error'),
        onSuccess: async ({ txSig, url }) => {
          (window.showNotification || safeNotify)('Solana check-in successful!', 'success');
          const a = document.getElementById('txExplorerLink');
          if (a && url) { a.href = url; a.textContent = 'View on Solana Explorer'; }
          applySolanaPostSuccessUI({ reward: 30 });
          window.walletManager?.updateUI?.();
        }
      };
      if (typeof window.executeSolanaCheckin === 'function') {
        await window.executeSolanaCheckin(ui);
      } else {
        (window.showNotification || safeNotify)('Solana module not loaded', 'error');
      }
      return;
    }

    // EVM 流程
    if (typeof ethers === 'undefined') {
      (window.showNotification || safeNotify)('Ethers not loaded', 'error');
      return;
    }

    const sel = document.getElementById('chainSelector');
    const selectedChain = sel ? sel.value : 'BSC';
    const config = window.getContractConfig?.(selectedChain);
    const abi    = getEvmAbi(config);
    const rpc    = config?.rpcUrl;
    const addr   = config?.checkInAddress;
    const chainHex = normalizeChainIdHex(config);

    if (!config || !abi || !rpc || !addr || !chainHex) {
      (window.showNotification || safeNotify)('Invalid EVM chain config', 'error');
      console.warn('[EVM config]', { hasAbi: !!abi, rpc, addr, chainHex, config });
      return;
    }

    // 提示切链
    try {
      const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
      if (currentChainId?.toLowerCase() !== chainHex.toLowerCase()) {
        const alertBox = document.createElement('div');
        alertBox.style.cssText = `
          position: fixed; top: 20px; right: 20px; background: #10b981; color: white;
          padding: 20px 30px; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.3);
          z-index: 10001; font-size: 16px; font-weight: bold; max-width: 400px; animation: slideIn .3s ease;`;
        alertBox.innerHTML = `<div style="display:flex;align-items:center;gap:12px;">
          <span style="font-size:24px;">🔄</span>
          <div><div style="margin-bottom:5px;">Switching Network</div>
          <div style="font-size:13px;opacity:.9;">To <strong>${config.chainName || chainHex}</strong></div></div></div>`;
        if (!document.getElementById('slideInAnimation')) {
          const style = document.createElement('style');
          style.id = 'slideInAnimation';
          style.textContent = `@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`;
          document.head.appendChild(style);
        }
        document.body.appendChild(alertBox);
        setTimeout(()=>{ alertBox.style.animation='slideIn .3s ease reverse'; setTimeout(()=>alertBox.remove(),300); }, 1600);
        await new Promise(r=>setTimeout(r, 600));
      }
    } catch {}

    setLoadingState(true, 'Switching network...');
    const ok = await switchToChain(chainHex);
    if (!ok) { setLoadingState(false); (window.showNotification || safeNotify)('Failed to switch network', 'error'); return; }

    // 余额检查（保守阈值）
    setLoadingState(true, 'Checking balance...');
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer   = provider.getSigner();
    const userAddr = await signer.getAddress();
    const bal = await checkBNBBalanceViaProvider(provider, userAddr, '0.00004');
    if (!bal.ok) {
      setLoadingState(false);
      (window.showNotification || safeNotify)(`Insufficient BNB: ${bal.balance} (need ≥ ${bal.min})`, 'warning');
      try { typeof closeOnChainCheckInModal === 'function' && closeOnChainCheckInModal(); } catch {}
      try { typeof showInsufficientBalanceModal === 'function' && showInsufficientBalanceModal(bal.balance, bal.min); } catch {}
      return;
    }

    // Gas 估算（非强制）
    try {
      const contractRO = new ethers.Contract(addr, abi, signer);
      const gasEstimate = await contractRO.estimateGas.checkIn({ value: 0 });
      console.log('[gas estimate] checkIn =', gasEstimate.toString());
    } catch (e) { console.warn('Gas estimation failed (non-critical):', e?.message || e); }

    // 发送交易
    const contract = new ethers.Contract(addr, abi, signer);
    (window.showNotification || safeNotify)('Please confirm in your wallet...', 'info');
    const tx = await contract.checkIn({ value: ethers.utils.parseEther('0') });

    const link = document.getElementById('txExplorerLink');
    if (link && config.explorerBase) {
      link.href = `${config.explorerBase}/tx/${tx.hash}`;
      link.textContent = 'View on Explorer';
    }

    setLoadingState(true, 'Waiting for confirmation...');
    const receipt = await tx.wait();

    // 解析事件（CheckedIn） → credits & streak
    let earnedCredits = 0;
    let streakDays = 0;
    try {
      for (const log of receipt.logs) {
        try {
          const parsed = contract.interface.parseLog(log);
          if (parsed?.name === 'CheckedIn') {
            earnedCredits = Number(parsed.args?.credits ?? 0);
            streakDays    = Number(parsed.args?.streak ?? 0);
            break;
          }
        } catch {}
      }
    } catch {}

    // Firebase 同步（保留你原逻辑）
    try {
      await (async function updateFirebaseAfterOnChainCheckIn(credits, txHash, streak) {
        if (!window.firebaseDb || !window.walletManager) { console.warn('Firebase or wallet manager not available'); return; }
        const address = window.walletManager.walletAddress.toLowerCase();
        const { doc, updateDoc, setDoc, getDoc, serverTimestamp, increment } =
          await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
        const walletRef = doc(window.firebaseDb, 'wallets', address);
        const snap = await getDoc(walletRef);
        if (!snap.exists()) {
          await setDoc(walletRef, {
            address, credits: credits, lastCheckinAt: serverTimestamp(), totalCheckins: 1,
            currentStreak: streak, lastCheckinTx: txHash, lastCheckinType: 'on-chain',
            createdAt: serverTimestamp(), lastUpdated: serverTimestamp()
          });
        } else {
          await updateDoc(walletRef, {
            credits: increment(credits), lastCheckinAt: serverTimestamp(), totalCheckins: increment(1),
            currentStreak: streak, lastCheckinTx: txHash, lastCheckinType: 'on-chain',
            lastUpdated: serverTimestamp()
          });
        }
        if (window.walletManager) {
          window.walletManager.credits = (window.walletManager.credits || 0) + credits;
          window.walletManager.saveToStorage?.();
        }
      })(earnedCredits, receipt.transactionHash, streakDays);
    } catch (e) {
      console.warn('Firebase update failed (non-critical):', e);
    }

    setLoadingState(false);
    (window.showNotification || safeNotify)(`Check-in successful! +${earnedCredits || 30} credits`, 'success');
    window.walletManager?.updateUI?.();
    setTimeout(()=>loadUserCheckInStatus(), 800);
  } catch (err) {
    setLoadingState(false);
    console.error('executeOnChainCheckIn failed:', err);
    (window.showNotification || safeNotify)(err?.message || String(err), 'error');
  } finally {
    setTimeout(() => setBusy(false), 800);
  }
}

/* ------------------------ 事件绑定 ------------------------ */
(function bindOnce() {
  if (window.__i3_checkin_listener_bound) return;
  window.__i3_checkin_listener_bound = true;

  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('executeCheckInBtn');
    btn && btn.addEventListener('click', executeOnChainCheckIn, { passive: true });

    const refreshBtn = document.getElementById('refreshStatusBtn');
    refreshBtn && refreshBtn.addEventListener('click', loadUserCheckInStatus);

    const sel = document.getElementById('chainSelector');
    if (sel) {
      sel.addEventListener('change', (e) => {
        const v = (e.target.value || '').toUpperCase();
        if      (v === 'SOLANA') window.setCurrentChain?.('solana');
        else if (v === 'OPBNB')  window.setCurrentChain?.('opbnb');
        else                     window.setCurrentChain?.('bsc');
        loadUserCheckInStatus();
      });
      const v0 = (sel.value || '').toUpperCase();
      if      (v0 === 'SOLANA') window.setCurrentChain?.('solana');
      else if (v0 === 'OPBNB')  window.setCurrentChain?.('opbnb');
      else                      window.setCurrentChain?.('bsc');
    }
  });
})();

/* ------------------------ 导出 ------------------------ */
window.executeOnChainCheckIn   = executeOnChainCheckIn;
window.loadUserCheckInStatus   = loadUserCheckInStatus;
window.updateStatusUI          = updateStatusUI;
window.applySolanaPostSuccessUI = applySolanaPostSuccessUI;

console.log('✅ Unified On-chain check-in module loaded (EVM + Solana)');
