// wallet-manager.js - 正确使用MetaMask SDK的钱包管理系统 (更新为I3 tokens术语，修复数据持久化)

class WalletManager {
    constructor() {
        this.walletAddress = null;
        this.isConnected = false;
        this.credits = 0; // 内部仍使用credits变量，但含义是I3 tokens
        this.sdk = null;
        this.ethereum = null;
        
        this.loadFromStorage();
        this.initializeSDK();
    }

    async initializeSDK() {
        let attempts = 0;
        while (typeof MetaMaskSDK === 'undefined' && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (typeof MetaMaskSDK === 'undefined') {
            console.error('MetaMask SDK failed to load after 5 seconds');
            if (typeof window.ethereum !== 'undefined') {
                this.ethereum = window.ethereum;
                this.setupEventListeners();
                console.log('Fallback to native MetaMask API');
            }
            return;
        }

        try {
            this.sdk = new MetaMaskSDK.MetaMaskSDK({
                dappMetadata: {
                    name: "Intelligence Cubed",
                    url: window.location.origin,
                    iconUrl: "https://metamask.io/icons/icon-192x192.png"
                },
                useDeeplink: true,
                forceInjectProvider: true,
                enableAnalytics: false
            });

            this.ethereum = this.sdk.getProvider();
            
            if (!this.ethereum && typeof window.ethereum !== 'undefined') {
                this.ethereum = window.ethereum;
                console.log('Using native MetaMask as fallback');
            }
            
            this.setupEventListeners();
            console.log('MetaMask SDK initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize MetaMask SDK:', error);
            
            if (typeof window.ethereum !== 'undefined') {
                this.ethereum = window.ethereum;
                this.setupEventListeners();
                console.log('Fallback to native MetaMask API');
            }
        }
    }

    async connectWallet() {
        try {
            if (this.sdk) {
                try {
                    await this.sdk.terminate();
                    
                    this.sdk = new MetaMaskSDK.MetaMaskSDK({
                        dappMetadata: {
                            name: "Intelligence Cubed",
                            url: window.location.origin,
                            iconUrl: "https://metamask.io/icons/icon-192x192.png"
                        },
                        useDeeplink: true,
                        forceInjectProvider: true,
                        enableAnalytics: false
                    });
                    
                    this.ethereum = this.sdk.getProvider();
                    console.log('SDK reset and reinitialized');
                } catch (e) {
                    console.log('SDK reset failed, continuing with existing instance');
                }
            }

            if (!this.ethereum) {
                if (this.sdk) {
                    this.ethereum = this.sdk.getProvider();
                }
                if (!this.ethereum && typeof window.ethereum !== 'undefined') {
                    this.ethereum = window.ethereum;
                }
                
                if (!this.ethereum) {
                    throw new Error('No MetaMask provider available. Please install MetaMask.');
                }
            }

            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Connection timeout after 10 seconds')), 10000);
            });

            const connectPromise = this.ethereum.request({
                method: 'eth_requestAccounts'
            });

            const accounts = await Promise.race([connectPromise, timeoutPromise]);

            if (accounts && accounts.length > 0) {
                this.walletAddress = accounts[0];
                this.isConnected = true;

                // 先加载该钱包的历史数据，再保存当前状态
                const isNewUser = !this.getWalletData(this.walletAddress);
                this.loadWalletSpecificData();

                this.saveToStorage();
                this.updateUI();

                console.log('Wallet connected:', this.walletAddress, 'Credits:', this.credits);
                
                window.dispatchEvent(new CustomEvent('walletConnected', {
                    detail: {
                        address: this.walletAddress,
                        credits: this.credits,
                        isNewUser: isNewUser
                    }
                }));

                return {
                    success: true,
                    address: this.walletAddress,
                    credits: this.credits
                };
            } else {
                throw new Error('No accounts returned from MetaMask');
            }

        } catch (error) {
            console.error('Wallet connection failed:', error);
            
            if (error.code === 4001) {
                return {
                    success: false,
                    error: 'Connection cancelled by user'
                };
            }
            
            return {
                success: false,
                error: error.message
            };
        }
    }

    disconnectWallet() {
        // 保存当前钱包数据到特定地址的存储中
        if (this.walletAddress) {
            this.saveWalletSpecificData();
        }

        this.walletAddress = null;
        this.isConnected = false;
        this.credits = 0;
        this.totalEarned = 0;

        // 只清除当前会话数据，不删除历史数据
        localStorage.removeItem('wallet_connected');
        localStorage.removeItem('user_credits');
        localStorage.removeItem('total_earned');

        this.updateUI();
        window.dispatchEvent(new CustomEvent('walletDisconnected'));
        console.log('Wallet disconnected');
    }

    // 保存钱包特定数据
    saveWalletSpecificData() {
        if (!this.walletAddress) return;
        
        try {
            const walletKey = `wallet_data_${this.walletAddress.toLowerCase()}`;
            const walletData = {
                address: this.walletAddress,
                credits: this.credits,
                totalEarned: this.totalEarned || 0,
                lastCheckin: localStorage.getItem('last_checkin'),
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

    // 加载钱包特定数据
    loadWalletSpecificData() {
        if (!this.walletAddress) {
            console.warn('⚠️ No wallet address available for loading data');
            return;
        }
        
        try {
            const walletData = this.getWalletData(this.walletAddress);
            if (walletData) {
                this.credits = walletData.credits || 0;
                this.totalEarned = walletData.totalEarned || 0;
                
                // 恢复签到和交易记录
                if (walletData.lastCheckin) {
                    localStorage.setItem('last_checkin', walletData.lastCheckin);
                }
                if (walletData.totalCheckins) {
                    localStorage.setItem('total_checkins', walletData.totalCheckins.toString());
                }
                if (walletData.transactions && Array.isArray(walletData.transactions)) {
                    localStorage.setItem('credit_transactions', JSON.stringify(walletData.transactions));
                }
                
                console.log(`📦 Loaded data for wallet ${this.walletAddress}:`, {
                    credits: this.credits,
                    totalEarned: this.totalEarned,
                    lastCheckin: walletData.lastCheckin,
                    totalCheckins: walletData.totalCheckins
                });
            } else {
                // 新钱包，初始化为0
                this.credits = 0;
                this.totalEarned = 0;
                
                // 清除可能存在的旧签到记录
                localStorage.removeItem('last_checkin');
                localStorage.removeItem('total_checkins');
                localStorage.removeItem('credit_transactions');
                
                console.log(`🆕 New wallet detected: ${this.walletAddress}, initialized with 0 I3 tokens`);
            }
        } catch (error) {
            console.error('Error loading wallet-specific data:', error);
            this.credits = 0;
            this.totalEarned = 0;
        }
    }

    // 获取特定钱包的数据
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

// 每日签到 - 修复时区问题
    dailyCheckin() {
        if (!this.isConnected) {
            return {
                success: false,
                error: 'Please connect your wallet first'
            };
        }

        // 使用用户本地时区获取今天的日期
        const now = new Date();
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const lastCheckin = localStorage.getItem('last_checkin');
        
        console.log('Today (local timezone):', today);
        console.log('Last checkin:', lastCheckin);
        
        if (lastCheckin === today) {
            return {
                success: false,
                error: 'Already checked in today! Come back tomorrow.'
            };
        }

        // 发放30个I3 tokens
        const DAILY_REWARD = 30;
        this.credits += DAILY_REWARD;
        this.totalEarned = (this.totalEarned || 0) + DAILY_REWARD;

        const totalCheckins = parseInt(localStorage.getItem('total_checkins') || '0') + 1;
        localStorage.setItem('last_checkin', today);
        localStorage.setItem('total_checkins', totalCheckins.toString());

        this.saveToStorage();
        this.saveWalletSpecificData(); // 立即保存到钱包特定存储
        this.updateUI();

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
        // 使用相同的本地时区日期逻辑
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
                // 立即加载该钱包的特定数据
                this.loadWalletSpecificData();
                console.log(`🔄 Restored wallet session: ${this.walletAddress} with ${this.credits} I3 tokens`);
            }
        } catch (error) {
            console.error('Error loading wallet data:', error);
        }
    }

    saveToStorage() {
        try {
            if (this.isConnected) {
                localStorage.setItem('wallet_connected', this.walletAddress);
                localStorage.setItem('user_credits', this.credits.toString());
                localStorage.setItem('total_earned', (this.totalEarned || 0).toString());
                
                // 同时保存到钱包特定存储
                this.saveWalletSpecificData();
            }
        } catch (error) {
            console.error('Error saving wallet data:', error);
        }
    }

    // 消费I3 tokens - 更新术语和错误消息
    spendCredits(amount, reason = 'model_usage') {
        if (!this.isConnected) {
            return {
                success: false,
                error: 'Please connect your wallet first'
            };
        }

        if (amount <= 0) {
            return {
                success: false,
                error: 'Invalid amount'
            };
        }

        if (this.credits < amount) {
            return {
                success: false,
                error: `Insufficient I3 tokens. You need ${amount} I3 tokens but only have ${this.credits} I3 tokens.`,
                required: amount,
                available: this.credits
            };
        }

        this.credits -= amount;
        this.saveToStorage();
        this.updateUI();

        this.recordTransaction(-amount, reason);

        window.dispatchEvent(new CustomEvent('creditsSpent', {
            detail: {
                amount: amount,
                newBalance: this.credits,
                reason: reason
            }
        }));

        return {
            success: true,
            spent: amount,
            newBalance: this.credits
        };
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
            
            // 同时保存到钱包特定存储
            if (this.walletAddress) {
                this.saveWalletSpecificData();
            }
        } catch (error) {
            console.error('Error recording transaction:', error);
        }
    }

    getCheckinStatus() {
        const lastCheckin = localStorage.getItem('last_checkin');
        const totalCheckins = parseInt(localStorage.getItem('total_checkins') || '0');
        
        return {
            canCheckin: this.canCheckinToday(),
            lastCheckin: lastCheckin,
            totalCheckins: totalCheckins
        };
    }

    getUserInfo() {
        return {
            isConnected: this.isConnected,
            address: this.walletAddress,
            credits: this.credits, // 内部是credits，但含义是I3 tokens
            totalEarned: this.totalEarned || 0,
            checkinStatus: this.getCheckinStatus()
        };
    }

    setupEventListeners() {
        if (this.ethereum) {
            this.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length === 0) {
                    this.disconnectWallet();
                } else if (accounts[0] !== this.walletAddress) {
                    // 保存当前钱包数据
                    if (this.walletAddress) {
                        this.saveWalletSpecificData();
                    }
                    
                    // 切换到新钱包
                    this.walletAddress = accounts[0];
                    this.isConnected = true;
                    this.loadWalletSpecificData();
                    this.saveToStorage();
                    this.updateUI();
                    
                    console.log(`Switched to wallet: ${this.walletAddress}`);
                }
            });

            this.ethereum.on('chainChanged', () => {
                window.location.reload();
            });
        }
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
	      const canCheckin = this.canCheckinToday();
	      checkinBtn.textContent = canCheckin ? 'Daily Check-in' : 'Already Checked-in Today';
	      checkinBtn.disabled = !canCheckin;
	      checkinBtn.style.opacity   = canCheckin ? '1' : '0.6';
	      checkinBtn.style.background = 'linear-gradient(135deg, #8b5cf6, #7c3aed)';
	      checkinBtn.style.color     = '#ffffff';
	      checkinBtn.style.border    = '1px solid #e5e7eb';
	      checkinBtn.style.cursor    = canCheckin ? 'pointer' : 'not-allowed';
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
	      checkinBtn.style.opacity   = '0.4';
	      checkinBtn.style.background = '#f3f4f6';
	      checkinBtn.style.color     = '#9ca3af';
	      checkinBtn.style.border    = '1px solid #e5e7eb';
	      checkinBtn.style.cursor    = 'not-allowed';
	    }
	    if (checkinStatus) checkinStatus.style.display = 'none';
	  }
	}
}

// 创建全局钱包管理器实例
window.walletManager = new WalletManager();

// 页面加载完成后初始化UI
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        if (window.walletManager) {
            window.walletManager.updateUI();
        }
    }, 1000);
});

console.log('MetaMask SDK Wallet Manager loaded successfully');