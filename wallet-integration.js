// wallet-integration.js - 通用钱包集成脚本 (更新为I3 tokens术语，添加钱包选择功能)
// 在所有需要钱包功能的页面中使用

/**
 * 显示钱包选择模态框 - 新增功能
 */
function showWalletSelectionModal() {
  const modal = document.getElementById('walletModal');
  if (modal) {
    // 确保重置所有样式
    modal.style.transform = 'none';
    modal.style.transition = 'none';
    modal.style.display = 'flex';
   
    modal.classList.add('show');

    // === Filter wallet options by selected network ===
    try {
      const preferred = getPreferredNetwork?.();
      const isEvm = preferred?.kind === 'evm';

      // 你的按钮是 class="wallet-option"，onclick 分别是 connectMetaMaskWallet / connectWalletConnect / connectCoinbaseWallet / connectSolanaPhantom
      const items = modal.querySelectorAll('.wallet-option');

      items.forEach(el => {
        const onClick = (el.getAttribute('onclick') || '').toLowerCase();
        const isEvmWallet = /connectmetamaskwallet|connectwalletconnect|connectcoinbasewallet/.test(onClick);
        const isSolWallet = /connectsolanaphantom/.test(onClick);

        if ((isEvm && isEvmWallet) || (!isEvm && isSolWallet)) {
          el.style.display = 'flex';        // 保持原有布局
          el.classList.remove('disabled');
          el.style.pointerEvents = 'auto';
          el.style.opacity = '1';
        } else {
          el.style.display = 'none';        // 隐藏不匹配的钱包
          // 如果你想“置灰”而不是隐藏，可以用下面三行替代:
          // el.classList.add('disabled');
          // el.style.pointerEvents = 'none';
          // el.style.opacity = '0.5';
        }
      });
    } catch (e) {
      console.warn('filterWalletOptions failed:', e);
    }

  } else {
    console.error('Wallet modal not found in DOM');
  }
}

/**
 * 关闭钱包选择模态框
 */
function closeWalletModal() {
    const modal = document.getElementById('walletModal');
    if (modal) {
        // 立即移除show类，不使用动画
        modal.classList.remove('show');
        modal.style.display = 'none';
        // 确保重置所有可能的transform属性
        modal.style.transform = 'none';
        modal.style.transition = 'none';
    }
}

// === 工具函数 ===
// 等待 provider 返回非空账户（初次授权常见需要等几百毫秒）
async function waitForAccounts(provider, { totalMs = 15000, stepMs = 300 } = {}) {
  const deadline = Date.now() + totalMs;
  while (Date.now() < deadline) {
    try {
      const accts = await provider.request({ method: 'eth_accounts' });
      if (Array.isArray(accts) && accts[0]) return accts[0];
    } catch {}
    await new Promise(r => setTimeout(r, stepMs));
  }
  throw new Error('Timed out waiting for wallet accounts');
}

/**
 * 连接 MetaMask 钱包 - 从模态框调用
 */
// 1) MetaMask
// 1) MetaMask —— 先切链 → 再请求账户 → 等到账户 → 刷UI → 关弹窗
// 1) MetaMask —— Switch-first: 先切链 → 再请求账户 → 等到账户 → 刷UI → 关弹窗
async function connectMetaMaskWallet() {
  const preferred = getPreferredNetwork();
  if (!preferred || preferred.kind !== 'evm') {
    showNotification('Invalid network: Please choose an EVM network first.', 'error');
    return;
  }
  console.log('[Connect][MetaMask] start (switch-first)');

  try {
    // ① 取得 provider（尽量用已注入的）
    const provider = window.walletManager?.getMetaMaskProvider?.()
                  || window.walletManager?.ethereum
                  || window.ethereum;
    if (!provider || typeof provider.request !== 'function') {
      throw new Error('MetaMask provider not found');
    }

    // ② 先确保切到“用户选的链”（必要时添加链）
    await enforcePreferredEvmChain(provider);

    // ③ 再请求账户授权 + 等到账户（一次完成授权，避免第二次点击）
    await provider.request({ method: 'eth_requestAccounts' });
    const address = await waitForAccounts(provider);

    // ④ 写入状态 & 刷UI & 广播
    if (window.walletManager) {
      window.walletManager.walletType = 'metamask';
      window.walletManager.walletAddress = address;
      window.walletManager.isConnected = true;
      window.walletManager.saveToStorage?.();
      window.walletManager.updateUI?.();
      window.dispatchEvent(new CustomEvent('walletConnected', {
        detail: { address, credits: window.walletManager.credits || 0, isNewUser: !window.walletManager.getWalletData?.(address) }
      }));
    }

    // ⑤ 成功后再关你的白色弹窗
    const modal = document.getElementById('walletModal');
    if (modal) { modal.classList.remove('show'); modal.style.display = 'none'; }

    showNotification('MetaMask connected.', 'success');
    console.log('[Connect][MetaMask] success ->', address);
  } catch (e) {
    console.error('[Connect][MetaMask] error:', e);
    showNotification(e?.message || 'Failed to connect MetaMask', 'error');
  }
}


/**
 * 连接 Coinbase Wallet
 */
// 3) Coinbase（CDP）—— 先拿地址 → 若有 provider 再切链与请求账户 → 刷UI → 关弹窗
async function connectCoinbaseWallet() {
  const preferred = getPreferredNetwork();
  if (!preferred || preferred.kind !== 'evm') {
    showNotification('Invalid network: Please choose an EVM network first.', 'error');
    return;
  }
  console.log('[Connect][CDP] start');

  try {
    if (!window.cdpConnect) throw new Error('CDP not ready. Check SDK loader.');

    // ① 二维码/授权，返回地址
    const { address } = await window.cdpConnect();
    if (!address) throw new Error('CDP returned empty address');

    // ② 若有 provider，补齐切链与账户授权（有些实现可能没有 provider，此步自动跳过）
    const provider = window.walletManager?.ethereum || window.ethereum;
    if (provider?.request) {
      try { await enforcePreferredEvmChain(provider); } catch (e) { console.warn('[CDP] switch chain skipped:', e); }
      try { await provider.request({ method: 'eth_requestAccounts' }); } catch {}
      try { await waitForAccounts(provider); } catch {}
    }

    // ③ 写入状态 & 刷UI & 广播
    if (window.walletManager) {
      window.walletManager.walletAddress = address;
      window.walletManager.isConnected = true;
      window.walletManager.walletType = 'coinbase';
      window.walletManager.saveToStorage?.();
      window.walletManager.updateUI?.();
      window.dispatchEvent(new CustomEvent('walletConnected', {
        detail: { address, credits: window.walletManager.credits || 0, isNewUser: !window.walletManager.getWalletData?.(address) }
      }));
    }

    // ④ 关你的白弹窗
    const modal = document.getElementById('walletModal');
    if (modal) { modal.classList.remove('show'); modal.style.display = 'none'; }

    const dropdown = document.getElementById('accountDropdown');
    if (dropdown) dropdown.classList.remove('show');

    showNotification('Coinbase (Base Smart Wallet) connected!', 'success');
  } catch (error) {
    console.error('[Connect][CDP] error:', error);
    showNotification(error?.message || 'Failed to connect Coinbase (CDP)', 'error');
  }
}


// 2) WalletConnect —— 先切链 → 请求账户 → 等到账户 → 刷UI → 关弹窗
// 2) WalletConnect —— 先关自家弹窗 → 发起连接(二维码) → 切链 → 要账户 → 等到账户 → 刷UI → 兜底再关
async function connectWalletConnect() {
  const preferred = getPreferredNetwork();
  if (!preferred || preferred.kind !== 'evm') {
    showNotification('Invalid network: Please choose an EVM network first.', 'error');
    try { openNetworkPickerModal?.(); } catch {}
    return;
  }
  console.log('[Connect][WalletConnect] start');

  // 小工具：安全关闭你自己的登录弹窗（白色那个）
  const safeCloseLoginModal = () => {
    try {
      if (typeof closeWalletModal === 'function') {
        closeWalletModal();
      } else {
        const m = document.getElementById('walletModal');
        if (m) { m.classList.remove('show'); m.style.display = 'none'; }
      }
      const dropdown = document.getElementById('accountDropdown');
      if (dropdown) dropdown.classList.remove('show');
    } catch {}
  };

  try {
    if (!window.walletManager) throw new Error('Wallet manager not available');

    // ✅ 先关你自己的白色登录弹窗，避免与 WalletConnect 的二维码弹窗重叠
    safeCloseLoginModal();

    // ① 发起 WalletConnect 连接（会弹出二维码）
    const result = await window.walletManager.connectWallet('walletconnect');
    if (!result?.success) {
      const msg = String(result?.error || 'WalletConnect failed');
      if (/connect\(\)\s*before\s*request\(\)/i.test(msg)) {
        console.warn('[WC] Ignored handshake noise:', msg);
      } else {
        throw new Error(msg);
      }
    }

    // ② 拿到 provider
    const provider = window.walletManager?.ethereum || window.ethereum;
    if (!provider) throw new Error('WalletConnect provider not found');

    // ③ 先切到你偏好的链（必要时添加链）
    try { await enforcePreferredEvmChain(provider); }
    catch (switchErr) {
      console.error('[WC] enforcePreferredEvmChain error:', switchErr);
      showNotification('Failed to switch network: ' + (switchErr?.message || switchErr), 'error');
    }

    // ④ 请求账户授权 + 等到账户（兜底保证有地址）
    try { await provider.request({ method: 'eth_requestAccounts' }); } catch {}
    let address = null;
    try { address = await waitForAccounts(provider); } catch {}

    // ⑤ 若 walletManager 尚未写入地址，则写入并刷新 UI & 广播事件
    if (address && window.walletManager && !window.walletManager.walletAddress) {
      window.walletManager.walletType = 'walletconnect';
      window.walletManager.walletAddress = address;
      window.walletManager.isConnected = true;
      window.walletManager.saveToStorage?.();
      window.walletManager.updateUI?.();
      window.dispatchEvent(new CustomEvent('walletConnected', {
        detail: { address, credits: window.walletManager.credits || 0, isNewUser: !window.walletManager.getWalletData?.(address) }
      }));
    } else {
      // 已有地址也刷新一次 UI
      try { window.walletManager?.updateUI?.(); } catch {}
    }

    // ⑥ 成功后兜底再关一次你的弹窗/下拉（幂等）
    safeCloseLoginModal();
    showNotification('WalletConnect connected.', 'success');

  } catch (error) {
    console.error('[Connect][WalletConnect] error:', error);
    const msg = String(error?.message || error || 'Failed to connect WalletConnect');
    showNotification(msg, 'error');

    // 失败也兜底关一次，避免界面卡在半开状态
    safeCloseLoginModal();
  }
}


    // 连接 Phantom (Solana)
// 4) Phantom (Solana)
async function connectSolanaPhantom() {
  const preferred = getPreferredNetwork();
  if (!preferred || preferred.kind !== 'solana') {
    showNotification('Invalid network: Please switch to Solana before using Phantom.', 'error');
    return;
  }
  console.log('Solana Phantom connection initiated');

  try {
    // ⚠️ 不要先关弹窗；保持手势先连接
    if (!window.walletManager) throw new Error('Wallet manager not available');
    const result = await window.walletManager.connectSolana('phantom');
    if (!result?.success) throw new Error(result?.error || 'Failed to connect Phantom');

    // 成功后再关你的白色弹窗
    const modal = document.getElementById('walletModal');
    if (modal) { modal.classList.remove('show'); modal.style.display = 'none'; }

    try { window.walletManager?.updateUI?.(); } catch {}
    const dropdown = document.getElementById('accountDropdown');
    if (dropdown) dropdown.classList.remove('show');
    showNotification('Phantom (Solana) connected!', 'success');
  } catch (e) {
    console.error('Phantom connection error:', e);
    showNotification(e?.message || 'Failed to connect Phantom', 'error');
  }
}


/**
 * 钱包连接处理函数
 */
async function handleWalletConnect() {
    try {
        if (!window.walletManager) {
            showNotification('Wallet manager not loaded', 'error');
            return;
        }

        const result = await window.walletManager.connectWallet();
        if (result.success) {
            showNotification('Wallet connected successfully!', 'success');
            const dropdown = document.getElementById('accountDropdown');
            if (dropdown) {
                dropdown.classList.remove('show');
            }
        } else {
            showNotification(result.error, 'error');
        }
    } catch (error) {
        console.error('Wallet connection error:', error);
        showNotification('Failed to connect wallet', 'error');
    }
}

/**
 * 每日签到处理函数 - 支持 Admin 本地签到 + 普通用户链上签到
 */
async function handleDailyCheckin() {
    try {
        // 1. 检查钱包连接
        if (!window.walletManager || !window.walletManager.isConnected) {
            showNotification('Please connect your wallet first', 'error');
            return;
        }

        // 2. 判断是否为 Admin
        const isAdminUser = window.isAdmin && window.isAdmin();
        
        if (isAdminUser) {
            // Admin 用户 → 检查后执行本地签到
            if (!window.walletManager.canCheckinToday()) {
                showNotification('Already checked in today! Come back tomorrow.', 'error');
                return;
            }
            console.log('Admin user detected, executing local check-in');
            executeLocalCheckin();
        } else {
            // 普通用户 → 直接打开链上签到 Modal
            console.log('Regular user detected, opening on-chain check-in modal');
            
            if (typeof window.openOnChainCheckInModal === 'function') {
                // ⚠️ 关键修改：移除 await，不等待加载完成
                if (typeof window.loadUserCheckInStatus === 'function') {
                    window.loadUserCheckInStatus(); // 移除了 await
                }
                window.openOnChainCheckInModal();
            } else {
                console.error('On-chain check-in modal function not found');
                showNotification('Check-in feature not available', 'error');
            }
        }
    } catch (error) {
        console.error('Daily check-in error:', error);
        showNotification('Failed to process check-in: ' + error.message, 'error');
    }
}
/**
 * 执行本地签到(仅 Admin 用户)
 */
async function executeLocalCheckin() {
    try {
        const address = (window.walletManager.walletAddress || '').toLowerCase();

        // Firebase 同步(如果可用)
        if (window.firebaseDb) {
            const { doc, getDoc, setDoc, updateDoc, serverTimestamp } = 
                await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');

            const walletRef = doc(window.firebaseDb, 'wallets', address);
            const snap = await getDoc(walletRef);

            let remoteTotalCheckins = 0;
            let lastCheckinAt = null;
            
            if (snap.exists()) {
                const data = snap.data() || {};
                lastCheckinAt = data.lastCheckinAt || null;
                remoteTotalCheckins = Number(data.totalCheckins || 0);
            } else {
                await setDoc(walletRef, { 
                    address: address, 
                    createdAt: serverTimestamp(), 
                    totalCheckins: 0 
                }, { merge: true });
            }

            // 同步时间戳到本地
            if (lastCheckinAt && typeof lastCheckinAt.toMillis === 'function') {
                try { 
                    localStorage.setItem('last_checkin_at', String(lastCheckinAt.toMillis())); 
                } catch (_) {}
            }

            // 执行本地签到
            const result = window.walletManager.dailyCheckin();
            if (!result || !result.success) {
                showNotification(result?.error || 'Check-in failed', 'error');
                return;
            }

            // 同步到 Firestore
            try {
                await updateDoc(walletRef, {
                    lastCheckinAt: serverTimestamp(),
                    totalCheckins: remoteTotalCheckins + 1,
                    credits: window.walletManager.credits,
                    lastUpdated: serverTimestamp(),
                    lastCheckinType: 'local-admin'
                });
            } catch (e) {
                console.warn('Failed to sync to Firestore:', e);
            }

            showNotification(`Check-in successful! +${result.reward} I3 tokens`, 'success');
        } else {
            // Firebase 不可用时的降级处理
            const result = window.walletManager.dailyCheckin();
            if (result && result.success) {
                showNotification(`Check-in successful! +${result.reward} I3 tokens`, 'success');
            } else {
                showNotification(result?.error || 'Check-in failed', 'error');
            }
        }
    } catch (error) {
        console.error('Local check-in error:', error);
        showNotification('Check-in failed: ' + error.message, 'error');
    }
}

/**
 * 钱包断开连接处理函数
 */
function handleWalletDisconnect() {
    try {
        if (window.walletManager) {
            window.walletManager.disconnectWallet();
        }
    } catch (error) {
        console.error('Wallet disconnect error:', error);
        showNotification('Failed to disconnect wallet', 'error');
    }
}

/**
 * 显示通知消息
 * @param {string} message - 通知消息
 * @param {string} type - 通知类型 ('success' 或 'error')
 */
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 8px;
        color: white;
        font-size: 14px;
        z-index: 10000;
        background: ${type === 'success' ? '#10b981' : '#ef4444'};
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transition: all 0.3s ease;
        transform: translateX(100%);
        opacity: 0;
    `;
    document.body.appendChild(notification);

    // 动画显示
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
        notification.style.opacity = '1';
    }, 10);

    // 自动消失
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

/**
 * 初始化钱包UI状态
 */
function initializeWalletUI() {
    try {
        if (window.walletManager) {
            const userInfo = window.walletManager.getUserInfo();
            if (userInfo.isConnected) {
                updateWalletUI(userInfo.address, userInfo.credits);
                updateConnectButton(true);
            } else {
                resetWalletUI();
                updateConnectButton(false);
            }

            updateCheckinButton();

            // 初始化时渲染首选网络徽章
            try {
                const preferred = getPreferredNetwork?.();
                if (preferred) renderNetworkBadge(preferred);
            } catch (e) {
                console.error('Failed to render preferred network badge:', e);
            }
        }
    } catch (error) {
        console.error('Error initializing wallet UI:', error);
    }
}

/**
 * 更新钱包UI显示 - 更新为I3 tokens术语
 * @param {string} address - 钱包地址
 * @param {number} credits - I3 tokens数量
 */
function updateWalletUI(address, credits) {
    const accountBtnText = document.getElementById('accountBtnText');
    const creditsDisplay = document.getElementById('creditsDisplay');

    if (accountBtnText && address) {
        // 已连接：显示截断的钱包地址
        accountBtnText.textContent = `${address.slice(0, 6)}...${address.slice(-4)}`;
    } else if (accountBtnText) {
        // 未连接：显示 Login
        accountBtnText.textContent = 'Login';
    }

    setWalletTypeIcon(window.walletManager?.walletType || null);

    if (creditsDisplay && address && typeof credits === 'number') {
        // 已连接：显示并更新 I3 tokens
        creditsDisplay.style.display = 'inline';
        const rounded = (Math.round((Number(credits) || 0) * 1000) / 1000).toFixed(3);
        creditsDisplay.textContent = `${rounded} I3 tokens`;
    } else if (creditsDisplay) {
        // 未连接：隐藏 token
        creditsDisplay.style.display = 'none';
    }
}


/**
 * 重置钱包UI到未连接状态
 */
function resetWalletUI() {
    const accountBtnText = document.getElementById('accountBtnText');
    const creditsDisplay = document.getElementById('creditsDisplay');
    
    if (accountBtnText) {
        accountBtnText.textContent = 'Login';
    }
    setWalletTypeIcon(null);
    
    if (creditsDisplay) {
      creditsDisplay.style.display = 'none';
    }

}

/**
 * 在账号按钮文本(#accountBtnText)右侧显示当前钱包的小图标
 * 会自动创建 <img id="walletTypeIcon">，并根据 walletType 切换 src/alt
 * @param {string|null} walletType - 'metamask' | 'walletconnect' | 'coinbase' | 'solana-phantom' | null
 */
function setWalletTypeIcon(walletType) {
    const textEl = document.getElementById('accountBtnText');
    if (!textEl) return;

    // 确保有图标元素
    let iconEl = document.getElementById('walletTypeIcon');
    if (!iconEl) {
        iconEl = document.createElement('img');
        iconEl.id = 'walletTypeIcon';
        // 插到地址文本后面
        if (textEl.parentNode) {
            textEl.parentNode.insertBefore(iconEl, textEl.nextSibling);
        }
    }

    // 本地 SVG 映射（把路径替换成你项目里已存在的 svg 资源路径）
    const ICONS = {
        metamask:        'svg/metamask.svg',
        walletconnect:   'svg/walletconnect.svg',
        coinbase:        'svg/coinbase.svg',
        'solana-phantom':'svg/phantom.svg'
    };

    // 根据类型设置
    const key = (walletType || '').toLowerCase();
    if (ICONS[key]) {
        iconEl.src = ICONS[key];
        iconEl.alt = key;
        iconEl.title = key === 'solana-phantom' ? 'Phantom (Solana)' : key.charAt(0).toUpperCase() + key.slice(1);
        iconEl.style.display = 'inline-block';
    } else {
        // 未连接或未知类型 -> 隐藏
        iconEl.removeAttribute('src');
        iconEl.removeAttribute('alt');
        iconEl.style.display = 'none';
    }
}


/**
 * 更新连接按钮状态 - 修改为显示钱包选择模态框
 * @param {boolean} isConnected - 是否已连接
 */
function updateConnectButton(isConnected) {
    const connectBtn = document.getElementById('connectWalletBtn');
    if (connectBtn) {
        if (isConnected) {
            connectBtn.textContent = 'Disconnect Wallet';
            connectBtn.onclick = handleWalletDisconnect;
            connectBtn.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
        } else {
            connectBtn.textContent = 'Connect Wallet';
            connectBtn.onclick = showWalletSelectionModal; // 修改为显示钱包选择模态框
            connectBtn.style.background = 'linear-gradient(135deg, #8b5cf6, #7c3aed)';
        }
    }
}

/**
 * 更新签到按钮状态 - 更新为I3 tokens术语
 */
function updateCheckinButton() {
    const checkinBtn = document.getElementById('checkinBtn');
    if (!checkinBtn || !window.walletManager) return;
    
    const userInfo = window.walletManager.getUserInfo();
    
    // 🔑 强制检查：明确的 Admin 判断
    const isAdminUser = (
        typeof window.isAdmin === 'function' && 
        window.currentUser && 
        window.currentUser.email && 
        window.isAdmin() === true
    );
    
    console.log('updateCheckinButton called:', { 
        isConnected: userInfo.isConnected, 
        isAdminUser 
    });
    
    if (userInfo.isConnected) {
        if (isAdminUser) {
            // Admin 逻辑
            const canCheckin = window.walletManager.canCheckinToday();
            checkinBtn.textContent = canCheckin ? 'Daily Check-in' : 'Already Checked-in Today';
            checkinBtn.disabled = !canCheckin;
            checkinBtn.style.opacity = canCheckin ? '1' : '0.6';
            checkinBtn.style.cursor = canCheckin ? 'pointer' : 'not-allowed';
            checkinBtn.style.background = 'linear-gradient(135deg, #8b5cf6, #7c3aed)';
            checkinBtn.style.color = '#ffffff';
        } else {
            // 🔑 非 Admin：强制覆盖所有样式
            checkinBtn.textContent = 'Daily Check-in';
            checkinBtn.disabled = false;
            checkinBtn.style.opacity = '1';
            checkinBtn.style.cursor = 'pointer';
            checkinBtn.style.background = 'linear-gradient(135deg, #8b5cf6, #7c3aed)';
            checkinBtn.style.color = '#ffffff';
        }
    } else {
        // 未连接
        checkinBtn.textContent = 'Daily Check-in';
        checkinBtn.disabled = true;
        checkinBtn.style.opacity = '0.4';
        checkinBtn.style.background = '#f3f4f6';
        checkinBtn.style.color = '#9ca3af';
        checkinBtn.style.cursor = 'not-allowed';
    }
}

/**
 * 检查钱包管理器是否可用
 */
function checkWalletManager() {
    let attempts = 0;
    const maxAttempts = 50;
    
    const checkInterval = setInterval(() => {
        attempts++;
        
        if (window.walletManager) {
            clearInterval(checkInterval);
            initializeWalletUI();
            console.log('Wallet manager found and UI initialized');
        } else if (attempts >= maxAttempts) {
            clearInterval(checkInterval);
            console.warn('Wallet manager not found after maximum attempts');
        }
    }, 100);
}

// 钱包事件监听器 - 更新为I3 tokens术语
window.addEventListener('walletConnected', function(event) {
    console.log('Wallet connected event received:', event.detail);
    const { address, credits, isNewUser } = event.detail;
    
    updateWalletUI(address, credits);
    updateConnectButton(true);
    updateCheckinButton();
    
    // Persist wallet linkage to Firestore after Firebase is ready
    const writeWalletLinkage = () => {
        try {
            if (typeof window.onWalletConnected !== 'function') return;
            const mm = window.walletManager?.getMetaMaskProvider?.();
			if (mm && typeof mm.request === 'function') {
			  mm.request({ method: 'eth_chainId' }).then((cid) => {
			    const networkName = mapChainIdToName(cid);
                const info = mapChainIdToDisplay(cid, window.walletManager?.walletType);
                renderNetworkBadge(info);
			    window.onWalletConnected(address, cid, networkName);
			  }).catch(() => window.onWalletConnected(address));
			} else {
			  window.onWalletConnected(address);
			}
        } catch (e) {
            console.warn('Failed to write wallet linkage to Firestore:', e);
        }
    };
    if (window.firebaseDb) {
        writeWalletLinkage();
    } else {
        const onReady = () => { window.removeEventListener('firebaseReady', onReady); writeWalletLinkage(); };
        window.addEventListener('firebaseReady', onReady);
    }

    // Optional: Attempt Firebase login automatically if allowed via setting
    try {
        const autoGoogle = (localStorage.getItem('autoGoogleOnWalletConnect') || 'off') === 'on';
        if (autoGoogle && window.firebaseAuth && !window.firebaseAuth.currentUser && typeof window.handleGoogleSignIn === 'function') {
            window.handleGoogleSignIn('auto');
        }
    } catch (e) {
        console.warn('Skipping Firebase auto-login after wallet connect:', e);
    }
    
    if (isNewUser) {
        showNotification('Welcome! You can earn 30 I3 tokens daily by checking in!', 'success');
    }
});

// Helper: map EVM chainId to human-readable name
function mapChainIdToName(chainId) {
    const map = {
        '0x1': 'Ethereum Mainnet',
        '0x5': 'Goerli Testnet',
        '0x38': 'BSC Mainnet',
        '0x61': 'BSC Testnet',
        '0x89': 'Polygon Mainnet'
    };
    return map[chainId] || chainId || null;
}

window.addEventListener('walletDisconnected', function() {
    console.log('Wallet disconnected event received');
    resetWalletUI();
    updateConnectButton(false);
    updateCheckinButton();
    renderNetworkBadge({ name: getPreferredNetwork().name, icon: getPreferredNetwork().icon });
    showNotification('Wallet disconnected', 'success');
});

window.addEventListener('dailyCheckinSuccess', function(event) {
    console.log('Daily checkin success event received:', event.detail);
    const { reward, newBalance, totalCheckins } = event.detail;
    
    // 更新I3 tokens显示
    const creditsDisplay = document.getElementById('creditsDisplay');
    if (creditsDisplay) {
        const rounded = (Math.round((Number(newBalance) || 0) * 1000) / 1000).toFixed(3);
        creditsDisplay.textContent = `${rounded} I3 tokens`;
    }
    
    updateCheckinButton();
    
    // 显示更详细的成功信息
    showNotification(`Check-in #${totalCheckins} complete! +${reward} I3 tokens earned`, 'success');
});

window.addEventListener('creditsSpent', function(event) {
    console.log('Credits spent event received:', event.detail);
    const { amount, newBalance, reason } = event.detail;
    
    // 更新I3 tokens显示
    const creditsDisplay = document.getElementById('creditsDisplay');
    if (creditsDisplay) {
        const rounded = (Math.round((Number(newBalance) || 0) * 1000) / 1000).toFixed(3);
        creditsDisplay.textContent = `${rounded} I3 tokens`;
    }
    
    showNotification(`Spent ${amount} I3 tokens for ${reason}`, 'success');
});

// ESC 键关闭模态框
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const modal = document.getElementById('walletModal');
        if (modal && modal.classList.contains('show')) {
            closeWalletModal();
        }
    }
});

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('Wallet integration script loaded');
    checkWalletManager();
    // Cross-page reconcile: if Firebase is ready and wallet connected, hydrate from Firestore
    try {
        if (window.walletManager && window.walletManager.isConnected && typeof window.walletManager.fetchRemoteWalletDataIfAvailable === 'function') {
            if (window.firebaseDb) {
                window.walletManager.fetchRemoteWalletDataIfAvailable();
            } else {
                window.addEventListener('firebaseReady', () => {
                    if (window.walletManager && window.walletManager.isConnected) {
                        window.walletManager.fetchRemoteWalletDataIfAvailable();
                    }
                });
            }
        }
    } catch (e) { console.warn('Cross-page reconcile skipped:', e); }
});

// 页面可见性变化时重新检查状态
document.addEventListener('visibilitychange', function() {
    if (!document.hidden && window.walletManager) {
        setTimeout(() => {
            initializeWalletUI();
        }, 500);
    }
});

// 导出函数到全局作用域
window.handleWalletConnect = handleWalletConnect;
window.handleDailyCheckin = handleDailyCheckin;
window.executeLocalCheckin = executeLocalCheckin;
window.handleWalletDisconnect = handleWalletDisconnect;
window.showNotification = showNotification;
window.initializeWalletUI = initializeWalletUI;
window.showWalletSelectionModal = showWalletSelectionModal;
window.closeWalletModal = closeWalletModal;
window.connectMetaMaskWallet = connectMetaMaskWallet;
window.connectCoinbaseWallet = connectCoinbaseWallet; 
window.connectWalletConnect = connectWalletConnect;
window.connectSolanaPhantom = connectSolanaPhantom;


console.log('✅ Wallet integration functions loaded successfully');


function getAddChainParams(preferred) {
  const MAP = {
    '0x1':    { chainName:'Ethereum Mainnet', rpcUrls:['https://rpc.ankr.com/eth'] },
    '0x38':   { chainName:'BNB Smart Chain',  rpcUrls:['https://bsc-dataseed.binance.org'] },
    '0x2105': { chainName:'Base',             rpcUrls:['https://mainnet.base.org'] },
    '0xa4b1': { chainName:'Arbitrum One',     rpcUrls:['https://arb1.arbitrum.io/rpc'] },
    '0x144':  { chainName:'ZKsync Era',       rpcUrls:['https://mainnet.era.zksync.io'] },
    '0x44d':   { chainName:'Polygon zkEVM',    rpcUrls:['https://zkevm-rpc.com'] },
    '0xa':    { chainName:'Optimism',         rpcUrls:['https://mainnet.optimism.io'] },
    '0xcc':   { chainName:'opBNB', rpcUrls:['https://opbnb-mainnet-rpc.bnbchain.org'] },
  };
  const base = MAP[preferred.chainId] || { chainName: preferred.name, rpcUrls: [] };
  return { chainId: preferred.chainId, chainName: base.chainName, rpcUrls: base.rpcUrls, nativeCurrency:{name:'ETH',symbol:'ETH',decimals:18} };
}

console.log('✅ Unified wallet connection function loaded');

// === Network badge helpers ===
function mapChainIdToDisplay(chainId, walletType, solanaNetworkHint) {
  const CHAINS = {
    '0x1':     { name:'Ethereum',      icon:'svg/chains/ethereum.svg' },
    '0x38':    { name:'BNB Chain',     icon:'svg/chains/bnb.svg' },
    '0x61':    { name:'BSC Testnet',   icon:'svg/chains/bnb.svg' },
    '0x44d':   { name:'Polygon zkEVM', icon:'svg/chains/polygon-zkevm.svg' },
    '0xa':     { name:'Optimism',      icon:'svg/chains/optimism.svg' },
    '0xa4b1':  { name:'Arbitrum One',  icon:'svg/chains/arbitrum.svg' },
    '0x2105':  { name:'Base',          icon:'svg/chains/base.svg' },
    '0x144':   { name:'ZKsync Era',    icon:'svg/chains/zksync.svg' },
    '0xcc':    { name:'opBNB', icon:'svg/chains/opbnb.svg' },
  };
  // Solana（用 walletType + network hint）
  if ((walletType || '').startsWith('solana')) {
    const net = (solanaNetworkHint || 'devnet').toLowerCase();
    return { name: `Solana ${net[0].toUpperCase()+net.slice(1)}`, icon:'svg/chains/solana.svg' };
  }
  return CHAINS[chainId] || null; // 未匹配则不显示
}

function renderNetworkBadge(info) {
  const badge = document.getElementById('networkBadge');
  if (!badge) return;

  // 没有链信息时隐藏
  if (!info) {
    badge.style.display = 'none';
    return;
  }

  const { name, icon } = info;
  const iconEl = badge.querySelector('.network-badge__icon');
  const textEl = badge.querySelector('.network-badge__text');

  if (textEl) textEl.textContent = name;

  if (iconEl && icon) {
    // 先预加载图标，避免出现破图闪烁
    const img = new Image();
    img.onload = () => {
      iconEl.src = icon;
      iconEl.alt = name;
      badge.style.display = 'inline-flex';
    };
    img.onerror = () => {
      // 图标加载失败也至少显示徽章
      badge.style.display = 'inline-flex';
    };
    img.src = icon;
  } else {
    badge.style.display = 'inline-flex';
  }

  badge.style.cursor = 'pointer';

  // 点击徽章时打开网络选择器
  badge.onclick = () => {
    try {
      openNetworkPickerModal();
    } catch (e) {
      console.error(e);
    }
  };
}


async function enforcePreferredEvmChain(provider) {
  const preferred = getPreferredNetwork();
  if (!preferred || preferred.kind !== 'evm' || !provider || typeof provider.request !== 'function') return;
  try {
    const current = await provider.request({ method: 'eth_chainId' });
    if (current.toLowerCase() !== preferred.chainId.toLowerCase()) {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: preferred.chainId }]
      });
    }
  } catch (e) {
    if (e.code === 4902) {
      // 链还没加，先加再切
      await provider.request({
        method: 'wallet_addEthereumChain',
        params: [getAddChainParams(preferred)]
      });
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: preferred.chainId }]
      });
    } else {
      throw e;
    }
  }
}

function openNetworkPickerModal() {
  // 如果已存在，做成 toggle
  const exists = document.getElementById('networkModal');
  if (exists) {
    exists.classList.toggle('show');
    return;
  }

  // 关闭时移除节点
  function close() {
    const m = document.getElementById('networkModal');
    if (!m) return;
    m.classList.remove('show');
    setTimeout(() => { try { m.remove(); } catch {} }, 250);
  }

  // 1) 遮罩
  const modal = document.createElement('div');
  modal.id = 'networkModal';
  modal.className = 'network-modal'; // 独立类名，避免和钱包模态冲突
  modal.addEventListener('click', (e) => { if (e.target === modal) close(); });

  // 2) 面板
  const panel = document.createElement('div');
  panel.className = 'network-modal-content';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');

  // 3) 头部
  const header = document.createElement('div');
  header.className = 'network-modal-header';
  header.innerHTML = `
    <div class="network-modal-title">Select a Network</div>
    <button class="network-close-btn" aria-label="Close">✕</button>
  `;
  header.querySelector('.network-close-btn').onclick = () => close();

  // 4) 列表
  const list = document.createElement('div');
  list.style.display = 'flex';
  list.style.flexDirection = 'column';
  list.style.gap = '12px';

  const order = ['bnb','opbnb','ethereum','base','arbitrum','zksync','polygon-zkevm','optimism','solana'];

  // ✅ 和 Login 保持一致的结构：wallet-option + wallet-icon-wrap + wallet-info/wallet-name
const makeRow = (net) => {
  const row = document.createElement('div');
  row.className = 'wallet-option available';

  // ✅ 检查是否支持签到
  const supportsCheckIn = (net.key === 'bnb' || net.key === 'opbnb' || net.key === 'solana');
  
  row.innerHTML = `
    <span class="wallet-icon-wrap">
      <img src="${net.icon}" alt="${net.name}">
    </span>
    <div class="wallet-info">
      <div class="wallet-name">
        ${net.name}
        ${supportsCheckIn ? '<span style="margin-left: 6px; font-size: 11px; background: #10b981; color: white; padding: 2px 6px; border-radius: 4px; font-weight: 600;">✓ Recommended</span>' : ''}
      </div>
    </div>
  `;

  // ✅ 改为异步：点选后立即切链（若已连接）
  row.onclick = async () => {
    try {
      // 1) 先写入首选网络 & 立刻刷新左上角徽章
      setPreferredNetwork(net.key);
      renderNetworkBadge({ name: net.name, icon: net.icon });

      // 2) 如果当前已连接：EVM 直接切链；Solana 给提示
      const isConnected = !!(window.walletManager?.isConnected);
      if (isConnected) {
        if (net.kind === 'evm') {
          const provider =
            window.walletManager?.getMetaMaskProvider?.() ||
            window.walletManager?.ethereum ||
            window.ethereum;

          if (provider?.request) {
            // 复用你已有的切链助手：内部会判断当前链 & 处理 4902 add+switch
            await enforcePreferredEvmChain(provider);
          } else {
            throw new Error('No EVM provider available');
          }
        } else if (net.kind === 'solana') {
          // 目前已连的是 EVM 钱包时，提示使用 Solana 钱包
          window.showNotification?.(
            'Please connect with a Solana wallet (e.g., Phantom) to use Solana.',
            'info'
          );
        }
      }
    } catch (e) {
      console.error('[NetworkPicker] switch failed:', e);
      window.showNotification?.(e?.message || 'Failed to switch network', 'error');
    } finally {
      // 不论成功/失败都关闭弹窗
      close();
    }
  };

  return row;
};

  order.forEach(k => { const n = I3_NETWORKS[k]; if (n) list.appendChild(makeRow(n)); });

  // 5) 页脚
  const footer = document.createElement('div');
  footer.className = 'network-modal-footer';
  footer.innerHTML = `
  <div style="margin-bottom: 12px; padding: 10px; background: #fef3c7; border-radius: 8px; border: 1px solid #fcd34d;">
    <p style="font-size: 13px; color: #92400e; margin: 0; text-align: center;">
      ℹ️ Daily check-in is currently only supported on <strong>BNB Chain</strong>,<strong>opBNB</strong> and <strong>Solana Devnet</strong>. Other chains are coming soon!
    </p>
  </div>
  <div style="text-align: center; color: #6b7280; font-size: 13px;">
    By Intelligence Cubed
  </div>
  `;

  // 6) 组装
  panel.appendChild(header);
  panel.appendChild(list);
  panel.appendChild(footer);
  modal.appendChild(panel);
  document.body.appendChild(modal);

  // 展示
  requestAnimationFrame(() => modal.classList.add('show'));
}


// ===== Preferred Network (pre-connect) =====
const I3_NETWORKS = {
  ethereum: { kind:'evm', key:'ethereum', name:'Ethereum', icon:'svg/chains/ethereum.svg', chainId:'0x1' },
  bnb:      { kind:'evm', key:'bnb',      name:'BNB Chain', icon:'svg/chains/bnb.svg',      chainId:'0x38' },
  base:     { kind:'evm', key:'base',     name:'Base',      icon:'svg/chains/base.svg',     chainId:'0x2105' },
  arbitrum: { kind:'evm', key:'arbitrum', name:'Arbitrum One', icon:'svg/chains/arbitrum.svg', chainId:'0xa4b1' },
  zksync:   { kind:'evm', key:'zksync',   name:'ZKsync Era',   icon:'svg/chains/zksync.svg',   chainId:'0x144' },
  'polygon-zkevm': { kind:'evm', key:'polygon-zkevm', name:'Polygon zkEVM', icon:'svg/chains/polygon-zkevm.svg', chainId:'0x44d' },
  optimism: { kind:'evm', key:'optimism', name:'Optimism', icon:'svg/chains/optimism.svg', chainId:'0xa' },
  opbnb: { kind:'evm', key:'opbnb', name:'opBNB', icon:'svg/chains/opbnb.svg', chainId:'0xcc' },
  solana:   { kind:'solana', key:'solana', name:'Solana (Devnet)', icon:'svg/chains/solana.svg', network:'devnet' },
};

function getPreferredNetwork() {
  try {
    const raw = localStorage.getItem('i3_preferred_network');
    const data = raw ? JSON.parse(raw) : null;
    if (data && I3_NETWORKS[data.key]) return I3_NETWORKS[data.key];
  } catch {}
  return I3_NETWORKS.bnb; // 默认 BNB
}

function setPreferredNetwork(key) {
  const n = I3_NETWORKS[key] || I3_NETWORKS.ethereum;
  localStorage.setItem('i3_preferred_network', JSON.stringify({ key: n.key }));
  // 刷新徽章
  renderNetworkBadge({ name: n.name, icon: n.icon });
}

document.addEventListener('DOMContentLoaded', () => {
  const n = getPreferredNetwork();
  // 未连接也显示徽章
  renderNetworkBadge({ name: n.name, icon: n.icon });
  // 点击徽章 -> 打开网络选择面板
  const badge = document.getElementById('networkBadge');
  if (badge) badge.addEventListener('click', openNetworkPickerModal);
});

// ===== 链上签到 Modal 控制函数 =====
function openOnChainCheckInModal() {
    const modal = document.getElementById('onChainCheckInModal');
    if (!modal) {
        console.error('On-chain check-in modal not found');
        return;
    }
    
    // 检查钱包连接
    if (!window.walletManager || !window.walletManager.isConnected) {
        showNotification('Please connect your wallet first', 'error');
        return;
    }
    
    modal.style.display = 'flex';
        // —— 插入开始：打开时根据本地状态初始化 UI —— 
		try {
		  const btn = document.getElementById('executeCheckInBtn');
		  const streakEl = document.getElementById('currentStreak');
		  const totalEl  = document.getElementById('totalCheckIns');
		  const rewardEl = document.getElementById('nextReward');
		  // 固定显示 30
		  if (rewardEl) rewardEl.textContent = '30';
		  // 从本地数据回填数字（与 walletManager/dailyCheckin 写入的 key 对齐）
		  const totalChk = parseInt(localStorage.getItem('total_checkins') || '0', 10);
		  if (totalEl) totalEl.textContent = String(totalChk);
		  // streak 采用同一 id（若你有单独累计，也可从 localStorage 读取自有 key）
		  // 先不做复杂计算：若今天已签，则至少显示 >=1；否则保持现值或 0
		  const lastMs = parseInt(localStorage.getItem('last_checkin_at') || '0', 10);
		  const DAY_MS = 24 * 60 * 60 * 1000;
		  const checkedToday = lastMs > 0 && (Date.now() - lastMs) < DAY_MS;
		  if (checkedToday) {
		    if (btn) {
		      btn.disabled = true;
		      btn.textContent = 'Already Checked Today';
		      btn.classList?.add?.('opacity-60', 'pointer-events-none');
		    }
		  } else {
		    if (btn) {
		      btn.disabled = false;
		      btn.textContent = 'Daily Check-in';
		      btn.classList?.remove?.('opacity-60', 'pointer-events-none');
		    }
		  }
		  // 兼容你在 Solana 成功后写入的"今日已签"标志（双保险）
		  try {
		    const mark = JSON.parse(localStorage.getItem('checkin_status_SOLANA') || 'null');
		    if (mark && mark.date === new Date().toISOString().slice(0,10) && btn) {
		      btn.disabled = true;
		      btn.textContent = 'Already Checked Today';
		      btn.classList?.add?.('opacity-60', 'pointer-events-none');
		    }
		  } catch (_) {}
		} catch (e) {
		  console.warn('[modal init] Failed to init gate from local storage:', e);
		}
		// —— 插入结束 —— 
    modal.classList.add('show');
}

function closeOnChainCheckInModal() {
    const modal = document.getElementById('onChainCheckInModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }
}

async function executeOnChainCheckIn() {
    const chainSelector = document.getElementById('chainSelector');
    const selectedChain = chainSelector ? chainSelector.value : 'BSC';
    const loadingDiv = document.getElementById('checkInLoading');
    const btn = document.getElementById('executeCheckInBtn');
    
    try {
        // 显示加载状态
        if (loadingDiv) loadingDiv.style.display = 'block';
        if (btn) btn.disabled = true;
        
        // 这里添加你的链上签到逻辑
        // 暂时使用本地签到作为示例
        handleDailyCheckin();
        
        // 成功后关闭 Modal
        setTimeout(() => {
            closeOnChainCheckInModal();
        }, 1500);
        
    } catch (error) {
        console.error('On-chain check-in error:', error);
        showNotification('On-chain check-in failed: ' + error.message, 'error');
    } finally {
        if (loadingDiv) loadingDiv.style.display = 'none';
        if (btn) btn.disabled = false;
    }
}

// 导出到全局
window.openOnChainCheckInModal = openOnChainCheckInModal;
window.closeOnChainCheckInModal = closeOnChainCheckInModal;
window.executeOnChainCheckIn = executeOnChainCheckIn;

console.log('✅ On-chain check-in modal functions loaded');
