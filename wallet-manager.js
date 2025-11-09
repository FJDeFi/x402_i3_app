// wallet-manager.js - MetaMask SDK wallet manager (I3 tokens / credits)
async function waitForAccounts(p, { totalMs = 15000, stepMs = 400 } = {}) {
  const t0 = Date.now();

  try { await p.request({ method: 'eth_requestAccounts' }); } catch (_) {}

  while (Date.now() - t0 < totalMs) {
    try {
      const accs = await p.request({ method: 'eth_accounts' });
      if (accs && accs.length) return accs;
    } catch (_) {}
    await new Promise(r => setTimeout(r, stepMs));
  }
  return [];
}

class WalletManager {
    constructor() {
        this.walletAddress = null;
        this.isConnected = false;
        this.credits = 0;
        this.totalEarned = 0;
        this.sdk = null;
        this.ethereum = null;
        this.isConnecting = false;

        this.walletType = null;
    	this.appKit = null;
		this.solana = null;         // window.solana (Phantom provider)
		this.solanaConn = null;     // window.SOL.Connection
		this.solanaAddress = null;  // base58 public key

        this.loadFromStorage();
        this.initializeSDK();
    }



	    // 只锁定 MetaMask 的 provider，避免多个钱包并存时被劫持
    getMetaMaskProvider() {
        const eth = window.ethereum;
        try {
            // 多注入场景（Chrome 会把所有 provider 放在 providers 数组里）
            if (eth && Array.isArray(eth.providers) && eth.providers.length) {
                const mm = eth.providers.find(p => p && p.isMetaMask);
                if (mm) return mm;
            }
            // MetaMask SDK provider（优先）
            if (this.sdk && typeof this.sdk.getProvider === 'function') {
                const p = this.sdk.getProvider();
                if (p && p.isMetaMask) return p;
            }
            // 单 provider 场景：确认是 MetaMask 再用
            if (eth && eth.isMetaMask) return eth;
        } catch (_) {}
        return null;
    }


	// ========== MetaMask 初始化 ==========
	async initializeSDK() {
		// Wait up to ~5s for MetaMaskSDK global to appear (if loaded via script tag)
		let attempts = 0;
		while (typeof MetaMaskSDK === 'undefined' && attempts < 50) {
			await new Promise(resolve => setTimeout(resolve, 100));
			attempts++;
		}

		try {
			if (typeof MetaMaskSDK !== 'undefined' && MetaMaskSDK.MetaMaskSDK) {
				this.sdk = new MetaMaskSDK.MetaMaskSDK({
					dappMetadata: {
						name: 'Intelligence Cubed',
						url: 'https://intelligencecubed.netlify.app',
						iconUrl: [
    						'https://intelligencecubed.netlify.app/png/i3-token-logo.png', // ← PNG 放第一个
    						'https://intelligencecubed.netlify.app/svg/i3-token-logo.svg'      // ← 可保留 SVG 作备选
  						]
					},
					useDeeplink: true,
					forceInjectProvider: true,
					enableAnalytics: false
				});
			}

			this.ethereum = this.getMetaMaskProvider();

			if (this.ethereum) {
    			this.setupEventListeners();
    			console.log('MetaMask initialized');
			} else {
    			console.warn('MetaMask provider not found (another wallet may be default)');
			}
		} catch (error) {
			console.error('Failed to initialize wallet provider:', error);
			this.ethereum = this.getMetaMaskProvider();
            if (this.ethereum) {
                this.setupEventListeners();
                console.log('MetaMask initialized (fallback)');
            }
		}
	}

    async initializeWalletConnect() {
        try {
            if (!window.appkit) {
                await new Promise(resolve => 
                    window.addEventListener('reownAppKitLoaded', resolve, { once: true })
                );
            }
            this.appKit = window.appkit;
            return !!this.appKit;
        } catch (e) {
            console.error('Failed to init AppKit:', e);
            return false;
        }
    }

	// 初始化 Solana Connection（只负责 RPC；provider 由钱包注入）
	initSolanaConnection(network = 'devnet', customRpc = '') {
	  try {
	    const { Connection, clusterApiUrl } = window.SOL || {};
	    if (!Connection) throw new Error('Solana web3.js not loaded');
	    const endpoint = customRpc || clusterApiUrl(network);
	    this.solanaConn = new Connection(endpoint, 'confirmed');
	    return true;
	  } catch (e) {
	    console.error('Failed to init Solana connection:', e);
	    return false;
	  }
	}

	/**
	 * 连接 Solana（目前支持 phantom）
	 * @param {'phantom'} kind
	 */
// 直接用这段替换你现在的 connectSolana()
	async connectSolana(kind = 'phantom') {
	  if (this.isConnecting) return { success: false, error: 'Connection already in progress' };
	  this.isConnecting = true;
	  try {
	    // 仅当后面要读取链上数据时才需要 RPC；保留你的写法
	    if (!this.initSolanaConnection('devnet')) {
	      throw new Error('Failed to initialize Solana connection');
	    }
	    if (kind !== 'phantom') {
	      throw new Error(`Unsupported Solana wallet: ${kind}`);
	    }
	    // ① 检测 Phantom 是否存在
	    const provider = window.solana;
	    if (!provider || !provider.isPhantom) {
	      // 更友好的提示 + 合理跳转
	      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
	      if (typeof showNotification === 'function') {
	        showNotification(
	          isMobile
	            ? 'Open this page inside the Phantom app to connect.'
	            : 'Phantom not detected. Opening download page in a new tab…',
	          isMobile ? 'error' : 'info'
	        );
	      }
	      // 移动端：引导到 Phantom 的 in-app browser（用户点"在 Phantom 中打开"）
	      if (isMobile) {
	        const target = `https://phantom.app/ul/browse/${encodeURIComponent(location.href)}`;
	        try { window.open(target, '_blank', 'noopener,noreferrer'); } catch (_) {}
	        return { success: false, error: 'Please open this site in the Phantom app browser.' };
	      }
	      // 桌面：打开扩展下载页（必须由用户点击触发，当前函数即来源于点击事件，可避免被拦截）
	      try { window.open('https://phantom.app/download', '_blank', 'noopener,noreferrer'); } catch (_) {}
	      return { success: false, error: 'Phantom not installed. Download page opened.' };
	    }
	    // ② 授权连接（会弹 Phantom 授权）
	    const res = await provider.connect();
	    const pubkey = res?.publicKey || provider.publicKey;
	    if (!pubkey) throw new Error('No public key returned from Phantom');
	    // ③ 同步本地会话（沿用你的统一 UI / 事件 / Firestore 流）
	    this.walletType = 'solana-phantom';
	    this.solana = provider;
	    this.solanaAddress = String(pubkey.toBase58());
	    this.walletAddress = this.solanaAddress;
	    this.isConnected = true;
	    // ④ 监听断开/账户变化
	    try {
	      provider.on?.('disconnect', () => this.disconnectWallet());
	      provider.on?.('accountChanged', (pk) => {
	        if (!pk) return this.disconnectWallet();
	        const next = String(pk.toBase58());
	        if (next !== this.solanaAddress) {
	          this.saveWalletSpecificData?.();
	          this.solanaAddress = next;
	          this.walletAddress = next;
	          this.loadWalletSpecificData?.();
	          this.saveToStorage?.();
	          this.updateUI?.();
			  try { window.setWalletTypeIcon && window.setWalletTypeIcon(null); } catch {}
	          window.dispatchEvent(new CustomEvent('walletConnected', {
	            detail: { address: this.walletAddress, credits: this.credits, isNewUser: !this.getWalletData?.(this.walletAddress) }
	          }));
	          try { window.onWalletConnected?.(this.walletAddress, 'solana', 'devnet'); } catch {}
	        }
	      });
	    } catch {}
	    // ⑤ （可选）读取余额做校验
	    try {
	      const { PublicKey } = window.SOL || {};
	      const lamports = await this.solanaConn.getBalance(new PublicKey(this.solanaAddress));
	      console.log('SOL balance (lamports):', lamports);
	    } catch (e) {
	      console.warn('Failed to fetch SOL balance:', e);
	    }
	    // ⑥ 与既有流程对齐
	    await this.fetchRemoteWalletDataIfAvailable?.();
	    this.loadWalletSpecificData?.();
	    this.saveToStorage?.();
	    this.updateUI?.();
	    window.dispatchEvent(new CustomEvent('walletConnected', {
	      detail: { address: this.walletAddress, credits: this.credits, isNewUser: !this.getWalletData?.(this.walletAddress) }
	    }));
		renderNetworkBadge(mapChainIdToDisplay(null, 'solana-phantom', 'devnet'));
	    try { window.onWalletConnected?.(this.walletAddress, 'solana', 'devnet'); } catch {}
	    return { success: true, address: this.walletAddress, credits: this.credits };
	  } catch (error) {
	    console.error('Solana connect error:', error);
	    return { success: false, error: error.message || String(error) };
	  } finally {
	    this.isConnecting = false;
	  }
	}

	async connectWalletConnect() {
	  console.log('Starting AppKit connection...');
	  if (this.isConnecting) return { success: false, error: 'Connection already in progress' };
	  this.isConnecting = true;

	  try {
	    // 1) 准备 AppKit
	    const ready = await this.initializeWalletConnect();
	    if (!ready) throw new Error('AppKit not initialized');
	    const modal = this.appKit || window.appkit;
	    if (!modal) throw new Error('AppKit instance missing');

	    // 2) 拿到 EIP-1193 provider（订阅 + 轮询 + 稳开弹窗）
	    const provider = await new Promise((resolve, reject) => {
	      let timeoutId;
	      let pollId;
	      let reopened = false;

	      const done = (p) => {
	        if (!p) return;
	        try { clearTimeout(timeoutId); } catch {}
	        try { clearInterval(pollId); } catch {}
	        try { off?.(); } catch {}
	        resolve(p);
	      };

	      // 订阅状态
	      const off = modal.subscribeProviders?.((state) => {
	        try {
	          const p =
	            state?.eip155 ||
	            state?.['eip155'] ||
	            state?.providers?.eip155 ||
	            state?.provider || null;
	          if (p) done(p);
	        } catch (e) {
	          console.warn('[providers cb error]', e);
	        }
	      });

	      // 轮询兜底
	      const tryGrab = async () => {
	        try {
	          if (typeof modal.getProvider === 'function') {
	            let p = null;
	            try { p = await modal.getProvider('eip155'); } catch {}
	            if (!p) { try { p = await modal.getProvider({ namespace: 'eip155' }); } catch {} }
	            if (p) return done(p);
	          }
	          const s = (typeof modal.getState === 'function' ? modal.getState() : (modal.state || {}));
	          const p3 = s?.eip155 || s?.['eip155'] || s?.providers?.eip155 || s?.provider || null;
	          if (p3) return done(p3);
	        } catch {}
	      };
	      pollId = setInterval(tryGrab, 400);
	      tryGrab();

	      // 稳开弹窗：立刻开 + 500ms 再开一次兜底
	      queueMicrotask(() => {
	        try { modal.open?.({ view: 'Connect', namespace: 'eip155' }); }
	        catch { modal.open?.(); }
	      });
	      setTimeout(() => {
	        if (!reopened) {
	          reopened = true;
	          try { modal.open?.({ view: 'Connect', namespace: 'eip155' }); }
	          catch { modal.open?.(); }
	        }
	      }, 500);

	      // 超时
	      timeoutId = setTimeout(() => {
	        try { clearInterval(pollId); off?.(); } catch {}
	        reject(new Error('Timeout waiting for wallet'));
	      }, 60_000);
	    });

	    // 3) （可选）有的环境需要先显式 connect，一旦报错不当致命处理
	    if (typeof provider.connect === 'function') {
	      try { await provider.connect(); }
	      catch (e) { console.debug('[WC] provider.connect() skipped:', e?.message || e); }
	    }

	    // 4) 关键：等待账户真正就绪（解决"第一次扫码回来没反应"）
	    const accounts = await waitForAccounts(provider, { totalMs: 15000, stepMs: 400 });
	    if (!accounts.length) throw new Error('Wallet connected but no accounts are ready yet');

	    // 5) 成功后只更新一次状态（去掉你原文件里重复的第二套更新）
	    this.walletType = 'walletconnect';
	    this.ethereum = provider;
	    this.walletAddress = accounts[0];
	    this.isConnected = true;

		try {
			if (typeof window.enforcePreferredEvmChain === 'function') {
				await window.enforcePreferredEvmChain(provider);
			}
		} catch (e) {
			console.warn('[WC] enforcePreferredEvmChain failed:', e);
		}

	    // 监听器
	    this.setupAppKitListeners?.(provider);

	    // 关闭弹窗（先关 reown，再关你自己的白色登录框）
	    try { modal?.close?.(); } catch {}
	    try { window.closeWalletModal?.(); } catch {}

	    // 6) 同步远端 & 刷新 UI
	    await this.fetchRemoteWalletDataIfAvailable?.();
	    this.loadWalletSpecificData?.();
	    this.saveToStorage?.();
	    this.updateUI?.();

	    // 7) 广播事件
	    window.dispatchEvent(new CustomEvent('walletConnected', {
	      detail: {
	        address: this.walletAddress,
	        credits: this.credits,
	        isNewUser: !this.getWalletData?.(this.walletAddress)
	      }
	    }));

	    return { success: true, address: this.walletAddress, credits: this.credits };
	  } catch (error) {
	    console.error('AppKit connection error:', error);
	    return { success: false, error: error.message || String(error) };
	  } finally {
	    this.isConnecting = false;
	  }
	}


    setupAppKitListeners(provider) {
        if (!provider) return;

        provider.on?.('accountsChanged', (accounts) => {
            if (!accounts?.length) {
                this.disconnectWallet();
                return;
            }
            
            const nextAddress = accounts[0];
            if (nextAddress !== this.walletAddress) {
                if (this.walletAddress) {
                    this.saveWalletSpecificData();
                }
                this.walletAddress = nextAddress;
                this.loadWalletSpecificData();
                this.saveToStorage();
                this.updateUI();
                
                window.dispatchEvent(new CustomEvent('walletConnected', {
                    detail: { 
                        address: this.walletAddress, 
                        credits: this.credits, 
                        isNewUser: !this.getWalletData(this.walletAddress) 
                    }
                }));
            }
        });

        provider.on?.('chainChanged', (chainId) => {
            console.log('Chain changed to:', chainId);
            try {
              const info = mapChainIdToDisplay(chainId, this.walletType);
              renderNetworkBadge(info);
            } catch (e) {}
        });

        provider.on?.('disconnect', () => {
            console.log('AppKit disconnected');
            this.disconnectWallet();
        });
    }


	// ========== 统一连接入口（MetaMask 默认） ==========
	async connectWallet(walletType = 'metamask') {
		if (walletType === 'coinbase') {
    		return this.connectCoinbaseWallet();
    	}
		if (walletType === 'walletconnect') {
        	return this.connectWalletConnect();
    	}
		if (this.isConnecting) {
			return { success: false, error: 'Connection already in progress. Please approve MetaMask.' };
		}
		this.isConnecting = true;
		try {
			// Ensure provider (do not reset SDK unless missing)
            if (!this.ethereum) {
                this.ethereum = this.getMetaMaskProvider();
                if (!this.ethereum) {
                    throw new Error('No MetaMask provider available. Please install/enable MetaMask.');
                }
            }

			// Give provider a brief moment to settle after init
			await new Promise(resolve => setTimeout(resolve, 150));

			// First try to read existing accounts (handles cases where another flow already requested access)
			let accounts = await this.ethereum.request({ method: 'eth_accounts' }).catch(() => []);
			if (!accounts || accounts.length === 0) {
				const timeoutPromise = new Promise((_, reject) => {
					setTimeout(() => reject(new Error('Connection timeout after 10 seconds')), 10000);
				});
				const connectPromise = this.ethereum.request({ method: 'eth_requestAccounts' });
				accounts = await Promise.race([connectPromise, timeoutPromise]);
			}

			if (accounts && accounts.length > 0) {
				this.walletAddress = accounts[0];
				this.isConnected = true;
				this.walletType = 'metamask';

				try {
					if (typeof window.enforcePreferredEvmChain === 'function') {
						await window.enforcePreferredEvmChain(this.ethereum);
					}
				} catch (e) {
					console.warn('[MM] enforcePreferredEvmChain failed:', e);
				}

				// Always try to hydrate from Firestore so server-side credit changes are reflected
				await this.fetchRemoteWalletDataIfAvailable();
				this.loadWalletSpecificData();
				this.saveToStorage();
				this.updateUI();

				console.log('Wallet connected:', this.walletAddress, 'Credits:', this.credits);

				window.dispatchEvent(new CustomEvent('walletConnected', {
					detail: {
						address: this.walletAddress,
						credits: this.credits,
						// Flag new user based on prior local archive (after remote hydrate, check again)
						isNewUser: !this.getWalletData(this.walletAddress)
					}
				}));

				return {
					success: true,
					address: this.walletAddress,
					credits: this.credits
				};
			}

			throw new Error('No accounts returned from MetaMask');
		} catch (error) {
			console.error('Wallet connection failed:', error);
			// If a request is already pending or popup blocked, try to read granted accounts
			if (error && (error.code === -32002 || error.code === 'RESOURCE_BUSY')) {
				try {
					const accounts = await this.ethereum.request({ method: 'eth_accounts' });
					if (accounts && accounts.length > 0) {
						this.walletAddress = accounts[0];
						this.isConnected = true;
						await this.fetchRemoteWalletDataIfAvailable();
						this.loadWalletSpecificData();
						this.saveToStorage();
						this.updateUI();
						window.dispatchEvent(new CustomEvent('walletConnected', {
							detail: { address: this.walletAddress, credits: this.credits, isNewUser: !this.getWalletData(this.walletAddress) }
						}));
						return { success: true, address: this.walletAddress, credits: this.credits };
					}
				} catch (_) {}
			}
			if (error && error.code === 4001) {
				// Retry once after a short delay
				try {
					await new Promise(resolve => setTimeout(resolve, 800));
					const accounts = await this.ethereum.request({ method: 'eth_accounts' });
					if (accounts && accounts.length > 0) {
						this.walletAddress = accounts[0];
						this.isConnected = true;
						const hadLocalArchive = !!this.getWalletData(this.walletAddress);
						if (!hadLocalArchive) {
							await this.fetchRemoteWalletDataIfAvailable();
						}
						this.loadWalletSpecificData();
						this.saveToStorage();
						this.updateUI();
						window.dispatchEvent(new CustomEvent('walletConnected', {
							detail: { address: this.walletAddress, credits: this.credits, isNewUser: !hadLocalArchive }
						}));
						return { success: true, address: this.walletAddress, credits: this.credits };
					}
				} catch (_) {}
				return { success: false, error: 'Connection cancelled by user' };
			}
			return { success: false, error: error.message };
		} finally {
			this.isConnecting = false;
		}
	}

disconnectWallet() {
	    if (this.walletAddress) {
	        this.saveWalletSpecificData?.();
	    }
	    // AppKit 断开连接方式（原样保留）
	    if (this.walletType === 'walletconnect') {
	        try {
	            // 方式1：通过 AppKit 实例断开
	            if (this.appKit?.adapter?.connectionControllerClient) {
	                this.appKit.adapter.connectionControllerClient.disconnect();
	            }
	            
	            // 方式2：或者通过保存的 provider 断开
	            if (this.ethereum && typeof this.ethereum.disconnect === 'function') {
	                this.ethereum.disconnect();
	            }
	        } catch (error) {
	            console.warn('Error disconnecting AppKit:', error);
	        }
	        
	        // 清理 AppKit 相关属性
	        this.appKit = null;
	    }
	    // === 新增：Solana（Phantom 等）相关清理 ===
	    try {
	        // 只有当当前钱包类型是 solana* 且 provider 存在并支持 disconnect 时才调用
	        if (this.walletType?.startsWith?.('solana') && this.solana && typeof this.solana.disconnect === 'function') {
	            this.solana.disconnect();
	        }
	    } catch (e) {
	        console.warn('Error disconnecting Solana provider:', e);
	    }
	    // 不论是否成功调用 disconnect，都将本地引用置空
	    this.solana = null;
	    this.solanaConn = null;
	    this.solanaAddress = null;
	    // 统一清理所有钱包类型的通用属性（原样保留）
	    this.walletAddress = null;
	    this.isConnected = false;
	    this.walletType = null;
	    this.credits = 0;
	    this.totalEarned = 0;
	    this.ethereum = null; // 移到这里，所有钱包类型都清理
	    // Clear current session data (do not delete per-wallet archives)
	    try {
	        localStorage.removeItem('wallet_connected');
	        localStorage.removeItem('wallet_type');
	        localStorage.removeItem('user_credits');
	        localStorage.removeItem('total_earned');
	    } catch (_) {}
	    this.updateUI?.();
	    window.dispatchEvent(new CustomEvent('walletDisconnected'));
	    console.log('Wallet disconnected');
	}


	// Persist per-wallet archive
	saveWalletSpecificData() {
		if (!this.walletAddress) return;
		try {
			const walletKey = `wallet_data_${this.walletAddress.toLowerCase()}`;
			const walletData = {
				address: this.walletAddress,
				credits: this.credits,
				totalEarned: this.totalEarned || 0,
				lastCheckin: localStorage.getItem('last_checkin'),
				lastCheckinAt: localStorage.getItem('last_checkin_at'),
				totalCheckins: parseInt(localStorage.getItem('total_checkins') || '0'),
				transactions: JSON.parse(localStorage.getItem('credit_transactions') || '[]'),
				lastSaved: new Date().toISOString()
			};
			localStorage.setItem(walletKey, JSON.stringify(walletData));
			console.log(`💾 Saved data for wallet ${this.walletAddress}:`, walletData);
		} catch (error) {
			console.error('Error saving wallet-specific data:', error);
		}
	}

	// Load per-wallet archive into session
	loadWalletSpecificData() {
		if (!this.walletAddress) {
			console.warn('⚠️ No wallet address available for loading data');
			return;
		}

		try {
			const walletData = this.getWalletData(this.walletAddress);
			if (walletData) {
				console.log('📦 Local per-wallet archive found:', walletData);
				this.credits = walletData.credits || 0;
				this.totalEarned = walletData.totalEarned || 0;

				if (walletData.lastCheckin) {
					localStorage.setItem('last_checkin', walletData.lastCheckin);
				} else {
					localStorage.removeItem('last_checkin');
				}

				// Restore precise timestamp if present in local archive
				if (walletData.lastCheckinAt) {
					localStorage.setItem('last_checkin_at', String(walletData.lastCheckinAt));
				} else {
					localStorage.removeItem('last_checkin_at');
				}

				if (typeof walletData.totalCheckins === 'number') {
					localStorage.setItem('total_checkins', walletData.totalCheckins.toString());
				} else {
					localStorage.removeItem('total_checkins');
				}

				if (walletData.transactions && Array.isArray(walletData.transactions)) {
					localStorage.setItem('credit_transactions', JSON.stringify(walletData.transactions));
				} else {
					localStorage.removeItem('credit_transactions');
				}

				console.log(`📦 Loaded data for wallet ${this.walletAddress}:`, {
					credits: this.credits,
					totalEarned: this.totalEarned,
					lastCheckin: walletData.lastCheckin,
					totalCheckins: walletData.totalCheckins
				});
			} else {
				// No local archive - initialize local zero state, then attempt to hydrate from Firestore if available
				this.credits = 0;
				this.totalEarned = 0;
				localStorage.removeItem('last_checkin');
				localStorage.removeItem('total_checkins');
				localStorage.removeItem('credit_transactions');
				console.log(`🆕 No local data for wallet ${this.walletAddress}. Checking Firebase for existing record...`);
			}
		} catch (error) {
			console.error('Error loading wallet-specific data:', error);
			this.credits = 0;
			this.totalEarned = 0;
		}
	}

	// Attempt to fetch existing wallet record from Firestore and hydrate local/session state
	async fetchRemoteWalletDataIfAvailable() {
		if (!this.walletAddress) return;
		try {
			if (!window.firebaseDb) return;
			const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
			const addrLower = (this.walletAddress || '').toLowerCase();
			let walletRef = doc(window.firebaseDb, 'wallets', addrLower);
			let snap = await getDoc(walletRef);
			if (!snap.exists()) {
				walletRef = doc(window.firebaseDb, 'wallets', this.walletAddress);
				snap = await getDoc(walletRef);
			}
			if (snap.exists()) {
				const data = snap.data() || {};
				console.log('🌐 Firestore wallet snapshot:', data);
				console.log('🔁 Updating credits from local', this.credits, '→ remote', Number(data.credits || 0));
				// ===== PATCH W2 (replace the assignment line) =====
				const remote = Number(data.credits ?? 0);
				// 远端如果为 0，不要把本地刚签到的 30 覆盖掉；只在远端更大时采用远端
				if (Number.isFinite(remote) && remote > this.credits) {
  					this.credits = remote;
				}

				// totalEarned is not tracked in server; keep local aggregation if any
				if (data.lastCheckinAt && typeof data.lastCheckinAt.toMillis === 'function') {
					try { localStorage.setItem('last_checkin_at', String(data.lastCheckinAt.toMillis())); } catch (_) {}
				}
				if (typeof data.totalCheckins === 'number') {
					try { localStorage.setItem('total_checkins', String(data.totalCheckins)); } catch (_) {}
				}
				this.saveToStorage();
				this.updateUI();
				try {
					window.dispatchEvent(new CustomEvent('walletUpdated', {
						detail: { address: this.walletAddress, credits: this.credits }
					}));
				} catch (_) {}
				console.log(`📡 Loaded wallet data from Firestore for ${this.walletAddress}:`, { credits: this.credits });
			} else {
				console.log(`📭 No existing Firestore record for wallet ${this.walletAddress}`);
			}
		} catch (e) {
			console.warn('Failed to fetch remote wallet data:', e);
		}
	}


	getWalletData(address) {
		if (!address) return null;
		try {
			const walletKey = `wallet_data_${address.toLowerCase()}`;
			const data = localStorage.getItem(walletKey);
			return data ? JSON.parse(data) : null;
		} catch (error) {
			console.error('Error getting wallet data:', error);
			return null;
		}
	}

	// Daily check-in with 24h gating support via local last_checkin_at
	dailyCheckin(options = {}) {
		const skipLocalGate = !!options.skipLocalGate;
		if (!this.isConnected) {
			return { success: false, error: 'Please connect your wallet first' };
		}

		if (!skipLocalGate) {
			const nowMs = Date.now();
			const lastCheckinAtMs = parseInt(localStorage.getItem('last_checkin_at') || '0', 10);
			if (lastCheckinAtMs > 0) {
				const DAY_MS = 24 * 60 * 60 * 1000;
				if (nowMs - lastCheckinAtMs < DAY_MS) {
					return { success: false, error: 'Already checked in recently. Please try again later.' };
				}
			} else {
				// Fallback to date-based gate for legacy data
				const now = new Date();
				const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
				const lastCheckin = localStorage.getItem('last_checkin');
				if (lastCheckin === today) {
					return { success: false, error: 'Already checked in today! Come back tomorrow.' };
				}
			}
		}

		const DAILY_REWARD = 30;
		this.credits += DAILY_REWARD;
		this.totalEarned = (this.totalEarned || 0) + DAILY_REWARD;

		const totalCheckins = parseInt(localStorage.getItem('total_checkins') || '0') + 1;
		// Maintain legacy date-based key alongside timestamp for backward compatibility
		try {
			const nowForLegacy = new Date();
			const today = `${nowForLegacy.getFullYear()}-${String(nowForLegacy.getMonth() + 1).padStart(2, '0')}-${String(nowForLegacy.getDate()).padStart(2, '0')}`;
			localStorage.setItem('last_checkin', today);
		} catch (_) {}
		try { localStorage.setItem('last_checkin_at', String(Date.now())); } catch (_) {}
		localStorage.setItem('total_checkins', totalCheckins.toString());

		this.saveToStorage();
		this.saveWalletSpecificData();
		this.updateUI();
		// ===== PATCH W3: persist to Firestore after local update =====
		try {
 	 		const lastMs  = parseInt(localStorage.getItem('last_checkin_at') || String(Date.now()), 10);
  			const totalChk = parseInt(localStorage.getItem('total_checkins') || '0', 10);

  			__i3_saveRemoteWalletData(window.firebaseDb, this.walletAddress, {
    		credits: this.credits,
    		totalCheckins: totalChk,
    		lastCheckinAtMs: lastMs
  		}).catch(e => console.warn('[dailyCheckin] remote persist failed:', e));
		} catch (e) {
  		console.warn('[dailyCheckin] remote persist try-block failed:', e);
		}


		this.recordTransaction(DAILY_REWARD, 'daily_checkin');

		window.dispatchEvent(new CustomEvent('dailyCheckinSuccess', {
			detail: {
				reward: DAILY_REWARD,
				newBalance: this.credits,
				totalCheckins: totalCheckins
			}
		}));

		console.log(`Daily checkin successful! Earned ${DAILY_REWARD} I3 tokens.`);

		return {
			success: true,
			reward: DAILY_REWARD,
			newBalance: this.credits,
			totalCheckins: totalCheckins
		};
	}

	canCheckinToday() {
		// Prefer Firestore-hydrated timestamp for a precise 24h window
		const lastCheckinAtMs = parseInt(localStorage.getItem('last_checkin_at') || '0', 10);
		if (!Number.isNaN(lastCheckinAtMs) && lastCheckinAtMs > 0) {
			const DAY_MS = 24 * 60 * 60 * 1000;
			return (Date.now() - lastCheckinAtMs) >= DAY_MS;
		}
		// Fallback to legacy date-based gating if timestamp missing
		const now = new Date();
		const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
		const lastCheckin = localStorage.getItem('last_checkin');
		return lastCheckin !== today;
	}

	loadFromStorage() {
		try {
			const savedWallet = localStorage.getItem('wallet_connected');
			if (savedWallet) {
				this.walletAddress = savedWallet;
				this.isConnected = true;
				this.walletType = localStorage.getItem('wallet_type') || 'metamask';
				this.loadWalletSpecificData();
				console.log(`🔄 Restored wallet session: ${this.walletAddress} with ${this.credits} I3 tokens`);
				// Immediately reconcile with Firestore so server-side credit changes reflect after refresh
				try {
					if (typeof this.fetchRemoteWalletDataIfAvailable === 'function') {
						this.fetchRemoteWalletDataIfAvailable().then(() => {
							console.log('🔁 Reconciled with Firestore after restore. Credits now:', this.credits);
							this.loadWalletSpecificData();
							this.saveToStorage();
							this.updateUI();
							try { window.dispatchEvent(new CustomEvent('walletUpdated', { detail: { address: this.walletAddress, credits: this.credits } })); } catch (_) {}
						});
					}
				} catch (e) { console.warn('Post-restore reconcile skipped:', e); }
			}
		} catch (error) {
			console.error('Error loading wallet data:', error);
		}
	}

	saveToStorage() {
		try {
			if (this.isConnected) {
				localStorage.setItem('wallet_connected', this.walletAddress);
				localStorage.setItem('wallet_type', this.walletType || 'metamask'); 
				localStorage.setItem('user_credits', this.credits.toString());
				localStorage.setItem('total_earned', (this.totalEarned || 0).toString());
				this.saveWalletSpecificData();
			}
		} catch (error) {
			console.error('Error saving wallet data:', error);
		}
	}

	spendCredits(amount, reason = 'model_usage') {
		if (!this.isConnected) {
			return { success: false, error: 'Please connect your wallet first' };
		}
		if (amount <= 0) {
			return { success: false, error: 'Invalid amount' };
		}

		// Allow negative balance; caller may prompt user to top up
		this.credits -= amount;
		this.saveToStorage();
		this.updateUI();
		this.recordTransaction(-amount, reason);

		window.dispatchEvent(new CustomEvent('creditsSpent', {
			detail: { amount: amount, newBalance: this.credits, reason: reason }
		}));

		// Fire an event when credits drop to zero or below so UIs can prompt top-up
		if (this.credits <= 0) {
			try {
				window.dispatchEvent(new CustomEvent('creditsLow', { detail: { newBalance: this.credits } }));
			} catch (_) {}
		}

		return { success: true, spent: amount, newBalance: this.credits };
	}

	recordTransaction(amount, reason) {
		try {
			const transactions = JSON.parse(localStorage.getItem('credit_transactions') || '[]');
			transactions.push({
				amount: amount,
				reason: reason,
				timestamp: new Date().toISOString(),
				balance: this.credits
			});
			const recentTransactions = transactions.slice(-100);
			localStorage.setItem('credit_transactions', JSON.stringify(recentTransactions));
			if (this.walletAddress) {
				this.saveWalletSpecificData();
			}
		} catch (error) {
			console.error('Error recording transaction:', error);
		}
	}

	getCheckinStatus() {
		const lastCheckin = localStorage.getItem('last_checkin');
		const lastCheckinAt = localStorage.getItem('last_checkin_at');
		const totalCheckins = parseInt(localStorage.getItem('total_checkins') || '0');
		return {
			canCheckin: this.canCheckinToday(),
			lastCheckin: lastCheckin,
			lastCheckinAt: lastCheckinAt ? Number(lastCheckinAt) : null,
			totalCheckins: totalCheckins
		};
	}

	getUserInfo() {
		return {
			isConnected: this.isConnected,
			address: this.walletAddress,
			credits: this.credits,
			totalEarned: this.totalEarned || 0,
			checkinStatus: this.getCheckinStatus()
		};
	}

	setupEventListeners() {
		if (!this.ethereum || typeof this.ethereum.on !== 'function') return;

		this.ethereum.on('accountsChanged', (accounts) => {
			if (!accounts || accounts.length === 0) {
				this.disconnectWallet();
				return;
			}
			const nextAddress = accounts[0];
			if (nextAddress !== this.walletAddress) {
				if (this.walletAddress) {
					this.saveWalletSpecificData();
				}
				this.walletAddress = nextAddress;
				this.isConnected = true;
				this.loadWalletSpecificData();
				this.saveToStorage();
				this.updateUI();
				console.log(`Switched to wallet: ${this.walletAddress}`);
				// Dispatch walletConnected so other modules can react (UI, Firebase sync)
				try {
					const isNewUser = !this.getWalletData(this.walletAddress);
					window.dispatchEvent(new CustomEvent('walletConnected', {
						detail: { address: this.walletAddress, credits: this.credits, isNewUser: isNewUser }
					}));
				} catch (_) {}
			}
		});

		this.ethereum.on('chainChanged', (newCid) => {
  			try {
    			const info = mapChainIdToDisplay(newCid, this.walletType);
    			renderNetworkBadge(info);
  			} catch (e) {}
		});

	}

	updateUI() {
		const accountBtnText = document.getElementById('accountBtnText');
		const creditsDisplay  = document.getElementById('creditsDisplay');
		const connectBtn      = document.getElementById('connectWalletBtn');
		const checkinBtn      = document.getElementById('checkinBtn');
		const checkinStatus   = document.getElementById('checkinStatus');
		// 右侧钱包类型小图标
		if (typeof window.setWalletTypeIcon === 'function') {
			window.setWalletTypeIcon(this.walletType || null);
		}
		if (this.isConnected && this.walletAddress) {
			// 已连接 —— 按钮显示地址
			if (accountBtnText) {
				accountBtnText.textContent =
					`${this.walletAddress.slice(0, 6)}...${this.walletAddress.slice(-4)}`;
			}
			// 已连接 —— 显示并更新 I3 tokens
			if (creditsDisplay) {
				creditsDisplay.style.display = 'inline';
				const rounded = (Math.round((Number(this.credits) || 0) * 1000) / 1000).toFixed(3);
				creditsDisplay.textContent = `${rounded} I3 tokens`;
			}
			// Connect/Disconnect 按钮
			if (connectBtn) {
				connectBtn.textContent = 'Disconnect Wallet';
				connectBtn.removeAttribute('onclick');
				connectBtn.onclick = () => this.disconnectWallet();
			}
			// Daily Check-in 状态
			if (checkinBtn) {
				// 检查是否是 Admin 用户
				const isAdminUser = (
					typeof window.isAdmin === 'function' && 
					window.currentUser && 
					window.currentUser.email && 
					window.isAdmin() === true
				);
				
				if (isAdminUser) {
					// Admin: 使用本地状态检查
					const canCheckin = this.canCheckinToday();
					checkinBtn.textContent = canCheckin ? 'Daily Check-in' : 'Already Checked-in Today';
					checkinBtn.disabled = !canCheckin;
					checkinBtn.style.opacity = canCheckin ? '1' : '0.6';
					checkinBtn.style.cursor = canCheckin ? 'pointer' : 'not-allowed';
				} else {
					// 非 Admin: 始终显示可点击状态
					checkinBtn.textContent = 'Daily Check-in';
					checkinBtn.disabled = false;
					checkinBtn.style.opacity = '1';
					checkinBtn.style.cursor = 'pointer';
				}
				
				checkinBtn.style.background = 'linear-gradient(135deg, #8b5cf6, #7c3aed)';
				checkinBtn.style.color = '#ffffff';
				checkinBtn.style.border = '1px solid #e5e7eb';
			}
			if (checkinStatus) checkinStatus.style.display = 'block';
		} else {
			// 未连接 —— 只显示 Login，隐藏 I3 tokens
			if (accountBtnText) {
				accountBtnText.textContent = 'Login';
			}
			if (creditsDisplay) {
				creditsDisplay.style.display = 'none';
			}
			// Connect/Disconnect 按钮
			if (connectBtn) {
				connectBtn.textContent = 'Connect Wallet';
				connectBtn.removeAttribute('onclick');
				connectBtn.setAttribute('onclick', 'showWalletSelectionModal()');
			}
			// Daily Check-in 置灰
			if (checkinBtn) {
				checkinBtn.textContent = 'Daily Check-in';
				checkinBtn.disabled = true;
				checkinBtn.style.opacity = '0.4';
				checkinBtn.style.background = '#f3f4f6';
				checkinBtn.style.color = '#9ca3af';
				checkinBtn.style.border = '1px solid #e5e7eb';
				checkinBtn.style.cursor = 'not-allowed';
			}
			if (checkinStatus) checkinStatus.style.display = 'none';
		}
	}

}

// ===== PATCH W1: save remote wallet data to Firestore (TOP-LEVEL, OUTSIDE ANY CLASS) =====
async function __i3_saveRemoteWalletData(db, address, { credits, totalCheckins, lastCheckinAtMs } = {}) {
  try {
    if (!db || !address) return;
    const isEvm = /^0x/i.test(address);                       // EVM 小写化；Solana 保持原样
    const docId = isEvm ? address.toLowerCase() : address;

    const { doc, setDoc, serverTimestamp } =
      await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');

    const ref = doc(db, 'wallets', docId);
    const payload = { lastUpdated: serverTimestamp() };

    if (Number.isFinite(credits)) {
      payload.credits = Number(credits);
    }
    if (Number.isFinite(totalCheckins)) {
      payload.totalCheckins = Number(totalCheckins);
    }
    if (Number.isFinite(lastCheckinAtMs)) {
      payload.lastCheckinAt = new Date(lastCheckinAtMs);
    }

    await setDoc(ref, payload, { merge: true });
  } catch (e) {
    console.warn('[__i3_saveRemoteWalletData] failed:', e);
  }
}
// 让其他脚本（如 solana-checkin.js）可调用
window.__i3_saveRemoteWalletData = __i3_saveRemoteWalletData;

// Create global instance
window.walletManager = new WalletManager();

// Initialize UI after page load
document.addEventListener('DOMContentLoaded', function() {
	setTimeout(() => {
		if (window.walletManager) {
			window.walletManager.updateUI();
		}
	}, 1000);
});

console.log('MetaMask SDK Wallet Manager loaded successfully');