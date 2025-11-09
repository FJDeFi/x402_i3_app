// Account Dropdown Module
// Provides: injectAccountDropdown(targetEl), toggleAccountDropdown()

(function(){
  const dropdownHtml = `
    <div class="account-dropdown">
      <button class="account-btn" onclick="toggleAccountDropdown()" id="accountBtn">
        <span id="accountBtnText">Login</span>
        <span id="creditsDisplay" style="display:none;margin-left:8px;font-size:12px;color:#ffffff;font-weight:600;opacity:0.98;text-shadow:0 1px 2px rgba(0,0,0,0.35);"></span>
      </button>
      <div class="dropdown-content" id="accountDropdown">
        <div id="walletSection" style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
          <button id="connectWalletBtn" onclick="showWalletSelectionModal()" style="width:100%;padding:8px 12px;background:linear-gradient(135deg,#8b5cf6,#7c3aed);color:white;border:none;border-radius:6px;font-size:13px;cursor:pointer;margin-bottom:8px;">Connect Wallet</button>
          <button id="checkinBtn" onclick="handleDailyCheckin()" style="width:100%;padding:8px 12px;background:#10b981;color:white;border:none;border-radius:6px;font-size:13px;cursor:pointer;">Daily Check-in</button>
          <div id="checkinStatus" style="display:none;margin-top:8px;font-size:12px;color:#6b7280;">
            Check in to earn 30 I3 Tokens.
          </div>
          <div id="walletInfo" style="display:none;margin-top:8px;font-size:12px;color:#6b7280;"></div>
        </div>
        <div id="googleAuthSection" style="padding:12px 0;border-bottom:1px solid #e5e7eb;">
          <button id="googleSignInBtn" onclick="handleGoogleSignIn && handleGoogleSignIn()" style="width:100%;padding:8px 12px;background:#ffffff;color:#374151;border:1px solid #d1d5db;border-radius:6px;font-size:13px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;">
            <img src="svg/google.svg" alt="Google" style="width:16px;height:16px;object-fit:contain;" />
            <span>Sign in with Google</span>
          </button>
          <div id="googleSignInStatus" style="margin-top:8px;font-size:12px;color:#6b7280;"></div>
          <button id="logoutBtn" onclick="handleGoogleLogout && handleGoogleLogout()" style="width:100%;padding:8px 12px;background:linear-gradient(135deg,#ef4444,#dc2626);color:white;border:none;border-radius:6px;font-size:13px;cursor:pointer;margin-top:8px;display:none;">Log out of Google</button>
        </div>
        <a href="myassets.html" class="dropdown-item">
          <img src="svg/myasset.svg" alt="My Assets" 
          style="width:16px;height:16px;object-fit:contain;" />
          My Assets
        </a>
        <!-- ✅ 社交任务模块 -->
        <div class="dropdown-section tasks-section" id="socialTasksSection" style="display: none;">
          <div class="tasks-header">
            <h3>
              <img src="svg/gift.svg" alt="Gift" class="icon-inline" />
              Earn More Tokens
            </h3>
          </div>
          
          <!-- Follow X Task -->
          <div class="task-item" id="taskFollowX">
            <div class="task-info">
              <div class="task-icon">
                <img src="svg/x.svg" alt="X" />
              </div>

              <div class="task-details">
                <div class="task-title">Follow @I3_Cubed on X</div>
                <div class="task-reward">
                  <img src="svg/i3-token-logo.svg" class="task-reward-icon" alt="i3">
                  <span>+20 Tokens</span>
                </div>
              </div>
            </div>
            <button class="task-button" id="btnFollowX" onclick="openFollowXModal()">
              Follow
            </button>
          </div>

          <!-- Join Telegram Task -->
          <div class="task-item" id="taskJoinTG">
            <div class="task-info">
              <div class="task-icon">
                <img src="svg/telegram.svg" alt="Telegram" />
              </div>
              <div class="task-details">
                <div class="task-title">Join our TG Group</div>
                <div class="task-reward">
                  <img src="svg/i3-token-logo.svg" class="task-reward-icon" alt="i3">
                  <span>+20 Tokens</span>
                </div>
              </div>
            </div>
            <button class="task-button" id="btnJoinTG" onclick="handleJoinTelegram()">
              Join
            </button>
          </div>
        </div>
      
      </div>
    </div>`;

  function toggleAccountDropdown() {
    let dropdown = document.getElementById('accountDropdown');
    if (!dropdown) {
      try {
        const mount = document.querySelector('#accountDropdownMount');
        if (mount) {
          injectAccountDropdown(mount);
          dropdown = document.getElementById('accountDropdown');
        }
      } catch (_) {}
    }
    if (dropdown) dropdown.classList.toggle('show');
  }

  function injectAccountDropdown(targetEl){
    const container = (typeof targetEl === 'string') ? document.querySelector(targetEl) : targetEl;
    if (!container) return false;
    container.innerHTML = dropdownHtml;
    try { console.log('✅ Account dropdown injected'); } catch(_){}
    // After injection, ensure Google auth bindings exist and UI is wired
    try { ensureGoogleAuthBindings(); } catch (_) {}
    try { refreshWalletInfoUI(); } catch (_) {}

    // ✅ 新增：触发社交任务初始化
    try {
        if (typeof window.initializeSocialTasks === 'function') {
            setTimeout(() => {
                window.initializeSocialTasks();
            }, 200);
        }
    } catch (_) {}
    return true;
  }

  // Global close handlers
  document.addEventListener('click', function(event) {
    const dropdown = document.getElementById('accountDropdown');
    const accountBtn = document.querySelector('.account-btn');
    if (dropdown && accountBtn && !accountBtn.contains(event.target) && !dropdown.contains(event.target)) {
      dropdown.classList.remove('show');
    }
  });
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
      const dropdown = document.getElementById('accountDropdown');
      if (dropdown && dropdown.classList.contains('show')) dropdown.classList.remove('show');
    }
  });

  window.injectAccountDropdown = injectAccountDropdown;
  window.toggleAccountDropdown = toggleAccountDropdown;
  
  // ============ Google Auth fallback & UI wiring (module-driven) ============
  async function initFirebaseIfNeeded(){
    if (window.firebaseApp && window.firebaseAuth) return;
    const firebaseConfig = {
      apiKey: "AIzaSyCYdWqXjUfNbUAMWlcm8neZQGTBTA63pfM",
      authDomain: "i3-testnet.firebaseapp.com",
      projectId: "i3-testnet",
      storageBucket: "i3-testnet.firebasestorage.app",
      messagingSenderId: "892139814159",
      appId: "1:892139814159:web:4df8548eef1d9bd9a1927a",
      measurementId: "G-KCDG3D1FCC"
    };
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js');
    const { getAuth } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js');
    const { getFirestore, initializeFirestore } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    let db; try { db = initializeFirestore(app, {}, 'i3-testnet'); } catch(e){ db = getFirestore(app); }
    Object.assign(window, { firebaseApp: app, firebaseAuth: auth, firebaseDb: db });
  }

  function updateAuthUI(user){
    const status = document.getElementById('googleSignInStatus');
    // Do not override wallet-driven button text if wallet is connected
    const t = document.getElementById('accountBtnText');
    if (t && !(window.walletManager && window.walletManager.isConnected)) {
      t.textContent = user ? (user.displayName || user.email || 'Account') : 'Login';
    }
    const signInBtn = document.getElementById('googleSignInBtn');
    if (signInBtn) signInBtn.style.display = user ? 'none' : 'flex';
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.style.display = user ? 'block' : 'none';
  }

  async function ensureGoogleAuthBindings(){
    // If page already provided bindings, do not override
    if (typeof window.handleGoogleSignIn === 'function' && typeof window.handleGoogleLogout === 'function') {
      return;
    }
    await initFirebaseIfNeeded();
    // Auth state listener (bind once)
    if (!window._accountDropdownAuthBound) {
      try {
        const { onAuthStateChanged } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js');
        onAuthStateChanged(window.firebaseAuth, (user) => updateAuthUI(user));
        window._accountDropdownAuthBound = true;
      } catch (e) { console.warn('Auth state bind failed:', e); }
    }
    // Global handlers
    window.handleGoogleSignIn = async function(){
      try {
        await initFirebaseIfNeeded();
        const { GoogleAuthProvider, signInWithPopup } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js');
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        const res = await signInWithPopup(window.firebaseAuth, provider);
        updateAuthUI(res && res.user ? res.user : null);
      } catch (e) { console.warn('Google sign-in failed:', e); }
    };
    window.handleGoogleLogout = async function(){
      try {
        await initFirebaseIfNeeded();
        const { signOut } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js');
        await signOut(window.firebaseAuth);
        updateAuthUI(null);
      } catch (e) { console.warn('Google logout failed:', e); }
    };
  }

  // ============ Wallet info (address + chainId) rendering ============
  function formatAddressShort(address){
    if (!address || typeof address !== 'string') return '';
    const trimmed = address.trim();
    if (trimmed.length <= 12) return trimmed;
    return `${trimmed.slice(0, 6)}...${trimmed.slice(-4)}`;
  }

  async function getCurrentChainId(){
    try {
      if (window.ethereum && typeof window.ethereum.request === 'function') {
        const cid = await window.ethereum.request({ method: 'eth_chainId' });
        return cid || null;
      }
    } catch (_) {}
    return null;
  }

  async function refreshWalletInfoUI(){
    const infoEl = document.getElementById('walletInfo');
    if (!infoEl) return;
    const wm = window.walletManager;
    if (wm && wm.isConnected && wm.walletAddress) {
      const chainId = await getCurrentChainId();
      const shortAddr = formatAddressShort(wm.walletAddress);
      infoEl.style.display = 'block';
      infoEl.textContent = `Connected Wallet：${shortAddr}`;
    } else {
      infoEl.style.display = 'none';
      infoEl.textContent = '';
    }
  }

  try {
    window.addEventListener('walletConnected', refreshWalletInfoUI);
    window.addEventListener('walletUpdated', refreshWalletInfoUI);
    window.addEventListener('walletDisconnected', refreshWalletInfoUI);
    // Also attempt initial render on DOM ready
    document.addEventListener('DOMContentLoaded', function(){
      try { refreshWalletInfoUI(); } catch (_) {}
    });
  } catch (_) {}
})();