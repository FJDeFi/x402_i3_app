// Account Dropdown Module
// Provides: injectAccountDropdown(targetEl), toggleAccountDropdown()

(function(){
  const dropdownHtml = `
    <div class="account-dropdown">
      <button class="account-btn" onclick="toggleAccountDropdown()" id="accountBtn">
        <span id="accountBtnText">Login</span>
        <span id="usdcDisplay" style="display:none;margin-left:8px;font-size:12px;color:#ffffff;font-weight:600;opacity:0.98;text-shadow:0 1px 2px rgba(0,0,0,0.35);"></span>
      </button>
      <div class="dropdown-content" id="accountDropdown">
        <div id="walletSection" style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
          <button id="connectWalletBtn" onclick="showWalletSelectionModal()" style="width:100%;padding:8px 12px;background:linear-gradient(135deg,#8b5cf6,#7c3aed);color:white;border:none;border-radius:6px;font-size:13px;cursor:pointer;">Connect Wallet</button>
          <div id="walletInfo" style="display:none;margin-top:8px;font-size:12px;color:#6b7280;"></div>
        </div>
        <a href="myassets.html" class="dropdown-item">
          <img src="svg/myasset.svg" alt="My Assets" 
          style="width:16px;height:16px;object-fit:contain;" />
          My Assets
        </a>
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
    try { refreshWalletInfoUI(); } catch (_) {}
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