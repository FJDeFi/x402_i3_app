// Modern BSC Testnet connection guide with improved UI
class BSCNetworkGuide {
    constructor() {
        this.PREFERRED_CHAIN_ID = '0x38'; // BNB Mainnet
        this.FALLBACK_CHAIN_ID = '0x61';  // BSC Testnet
        
        this.NETWORK_CONFIGS = {
            mainnet: {
                chainId: '0x38',
                chainName: 'BNB Smart Chain',
                nativeCurrency: {
                    name: 'BNB',
                    symbol: 'BNB',
                    decimals: 18
                },
                rpcUrls: ['https://bsc-dataseed.binance.org/'],
                blockExplorerUrls: ['https://bscscan.com/']
            },
            testnet: {
                chainId: '0x61',
                chainName: 'BNB Smart Chain Testnet',
                nativeCurrency: {
                    name: 'BNB',
                    symbol: 'tBNB',
                    decimals: 18
                },
                rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545/'],
                blockExplorerUrls: ['https://testnet.bscscan.com/']
            }
        }
        this.initializeStyles();
        this.isConnecting = false;
    }

    isSupportedNetwork(chainId) {
        return chainId === this.PREFERRED_CHAIN_ID || chainId === this.FALLBACK_CHAIN_ID;
    }

    getNetworkType(chainId) {
        if (chainId === '0x38') return 'mainnet';
        if (chainId === '0x61') return 'testnet';
        return 'unknown';
    }

    // Initialize modern styles
    initializeStyles() {
        if (document.getElementById('bsc-guide-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'bsc-guide-styles';
        style.textContent = `
            .bsc-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(4px);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
            }

            .bsc-modal-overlay.show {
                opacity: 1;
                visibility: visible;
            }

            .bsc-modal-content {
                background: white;
                border-radius: 16px;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
                width: 90%;
                max-width: 520px;
                max-height: 85vh;
                overflow-y: auto;
                animation: bscModalFadeIn 0.3s ease-out;
                position: relative;
            }

            @keyframes bscModalFadeIn {
                from {
                    opacity: 0;
                    transform: scale(0.9) translateY(-20px);
                }
                to {
                    opacity: 1;
                    transform: scale(1) translateY(0);
                }
            }

            .bsc-modal-header {
                padding: 24px 24px 16px;
                border-bottom: 1px solid #e5e7eb;
                position: relative;
            }

            .bsc-modal-close {
                position: absolute;
                top: 16px;
                right: 16px;
                background: #f9fafb;
                border: none;
                border-radius: 8px;
                width: 32px;
                height: 32px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 18px;
                color: #6b7280;
                transition: all 0.2s ease;
            }

            .bsc-modal-close:hover {
                background: #f3f4f6;
                color: #374151;
            }

            .bsc-modal-title {
                font-size: 1.5rem;
                font-weight: 700;
                color: #111827;
                margin: 0 32px 0 0;
                line-height: 1.3;
            }

            .bsc-modal-body {
                padding: 24px;
            }

            .bsc-icon-section {
                text-align: center;
                margin-bottom: 24px;
            }

            .bsc-icon {
                width: 64px;
                height: 64px;
                margin: 0 auto 16px;
                background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
                border-radius: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 28px;
                color: white;
            }

            .bsc-icon.error {
                background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            }

            .bsc-icon.success {
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            }

            .bsc-icon.warning {
                background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            }

            .bsc-description {
                font-size: 16px;
                color: #6b7280;
                line-height: 1.6;
                margin-bottom: 24px;
                text-align: center;
            }

            .bsc-info-card {
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 12px;
                padding: 20px;
                margin: 20px 0;
            }

            .bsc-info-card.highlight {
                background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
                border-color: #7dd3fc;
            }

            .bsc-info-card h4 {
                font-size: 16px;
                font-weight: 600;
                color: #1f2937;
                margin: 0 0 12px 0;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .bsc-info-card p {
                font-size: 14px;
                color: #6b7280;
                margin: 0;
                line-height: 1.5;
            }

            .bsc-info-card ul {
                margin: 12px 0 0 0;
                padding-left: 20px;
            }

            .bsc-info-card li {
                font-size: 14px;
                color: #6b7280;
                margin: 8px 0;
                line-height: 1.5;
            }

            .bsc-address-display {
                background: #f3f4f6;
                border: 1px solid #d1d5db;
                border-radius: 8px;
                padding: 12px 16px;
                font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
                font-size: 14px;
                color: #374151;
                margin: 12px 0;
                word-break: break-all;
            }

            .bsc-network-info {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 16px;
                margin: 20px 0;
            }

            .bsc-network-item {
                text-align: center;
            }

            .bsc-network-label {
                font-size: 12px;
                color: #6b7280;
                font-weight: 500;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 4px;
            }

            .bsc-network-value {
                font-size: 14px;
                font-weight: 600;
                color: #1f2937;
            }

            .bsc-network-value.current {
                color: #ef4444;
            }

            .bsc-network-value.required {
                color: #10b981;
            }

            .bsc-code-block {
                background: #1f2937;
                color: #f9fafb;
                border-radius: 8px;
                padding: 16px;
                font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
                font-size: 13px;
                line-height: 1.6;
                margin: 16px 0;
                overflow-x: auto;
            }

            .bsc-code-block .code-label {
                color: #fbbf24;
                font-weight: 600;
            }

            .bsc-benefits-list {
                display: grid;
                gap: 12px;
                margin: 20px 0;
            }

            .bsc-benefit-item {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px;
                background: white;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
            }

            .bsc-benefit-icon {
                width: 32px;
                height: 32px;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                flex-shrink: 0;
            }

            .bsc-benefit-icon.free {
                background: #dcfce7;
                color: #15803d;
            }

            .bsc-benefit-icon.fast {
                background: #dbeafe;
                color: #1d4ed8;
            }

            .bsc-benefit-icon.safe {
                background: #fef3c7;
                color: #d97706;
            }

            .bsc-benefit-text {
                font-size: 14px;
                color: #374151;
                font-weight: 500;
            }

            .bsc-actions {
                display: flex;
                flex-direction: column;
                gap: 12px;
                margin-top: 24px;
            }

            .bsc-actions.row {
                flex-direction: row;
                justify-content: center;
            }

            .bsc-btn {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                padding: 12px 24px;
                border: none;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
                text-decoration: none;
                min-height: 44px;
            }

            .bsc-btn:disabled {
                opacity: 0.6;
                cursor: not-allowed;
            }

            .bsc-btn-primary {
                background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
                color: white;
            }

            .bsc-btn-primary:hover:not(:disabled) {
                background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
                transform: translateY(-1px);
                box-shadow: 0 8px 24px rgba(139, 92, 246, 0.3);
            }

            .bsc-btn-success {
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                color: white;
            }

            .bsc-btn-success:hover:not(:disabled) {
                background: linear-gradient(135deg, #059669 0%, #047857 100%);
                transform: translateY(-1px);
                box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3);
            }

            .bsc-btn-warning {
                background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                color: white;
            }

            .bsc-btn-warning:hover:not(:disabled) {
                background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
                transform: translateY(-1px);
                box-shadow: 0 8px 24px rgba(245, 158, 11, 0.3);
            }

            .bsc-btn-secondary {
                background: white;
                color: #374151;
                border: 1px solid #d1d5db;
            }

            .bsc-btn-secondary:hover:not(:disabled) {
                background: #f9fafb;
                border-color: #8b5cf6;
                color: #8b5cf6;
            }

            .bsc-btn-external {
                background: #f97316;
                color: white;
            }

            .bsc-btn-external:hover:not(:disabled) {
                background: #ea580c;
                transform: translateY(-1px);
                box-shadow: 0 8px 24px rgba(249, 115, 22, 0.3);
            }

            .bsc-steps {
                margin: 24px 0;
            }

            .bsc-step {
                display: flex;
                gap: 16px;
                margin-bottom: 20px;
                padding-bottom: 20px;
                border-bottom: 1px solid #f3f4f6;
            }

            .bsc-step:last-child {
                border-bottom: none;
                margin-bottom: 0;
                padding-bottom: 0;
            }

            .bsc-step-number {
                width: 32px;
                height: 32px;
                background: #8b5cf6;
                color: white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 700;
                font-size: 14px;
                flex-shrink: 0;
            }

            .bsc-step-content h5 {
                font-size: 16px;
                font-weight: 600;
                color: #1f2937;
                margin: 0 0 8px 0;
            }

            .bsc-step-content p {
                font-size: 14px;
                color: #6b7280;
                margin: 0;
                line-height: 1.5;
            }

            .bsc-loading {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 16px;
                padding: 40px 20px;
            }

            .bsc-spinner {
                width: 40px;
                height: 40px;
                border: 4px solid #f3f4f6;
                border-top: 4px solid #8b5cf6;
                border-radius: 50%;
                animation: bscSpin 1s linear infinite;
            }

            @keyframes bscSpin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            .bsc-loading-text {
                font-size: 14px;
                color: #6b7280;
                font-weight: 500;
            }

            /* Mobile Responsive */
            @media (max-width: 640px) {
                .bsc-modal-content {
                    width: 95%;
                    max-width: none;
                    margin: 10px;
                }

                .bsc-modal-header {
                    padding: 20px 20px 12px;
                }

                .bsc-modal-body {
                    padding: 20px;
                }

                .bsc-network-info {
                    grid-template-columns: 1fr;
                    gap: 12px;
                }

                .bsc-actions.row {
                    flex-direction: column;
                }

                .bsc-btn {
                    padding: 14px 20px;
                }
            }
            
        .bsc-network-options {
            display: grid;
            gap: 20px;
            margin: 24px 0;
        }

        .bsc-network-card {
            border: 2px solid #e5e7eb;
            border-radius: 12px;
            padding: 20px;
            transition: all 0.3s ease;
            background: white;
        }

        .bsc-network-card.recommended {
            border-color: #8b5cf6;
            background: linear-gradient(135deg, #f8faff 0%, #f0f9ff 100%);
            box-shadow: 0 4px 12px rgba(139, 92, 246, 0.15);
        }

        .bsc-network-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
        }

        .bsc-network-header h4 {
            margin: 0;
            font-size: 18px;
            font-weight: 700;
            color: #1f2937;
        }

        .bsc-badge {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
        }

        .bsc-badge.recommended {
            background: #8b5cf6;
            color: white;
        }

        .bsc-badge.testnet {
            background: #f59e0b;
            color: white;
        }

        .bsc-network-details p {
            margin: 8px 0;
            font-size: 14px;
            color: #6b7280;
        }

        .bsc-network-card .bsc-btn {
            width: 100%;
            margin-top: 12px;
        }
        `;
        document.head.appendChild(style);
    }

    async connectWalletWithGuide() {
		if (this.isConnecting) { console.log('Connection already in progress...'); return; }
		this.isConnecting = true;
		try {
			const provider = window.walletManager?.getMetaMaskProvider?.();
			if (!provider) { this.showInstallMetaMaskGuide(); return; }
			// 1) 先申请站点授权（弹窗）
			let accounts = [];
			try {
				accounts = await provider.request({ method: 'eth_requestAccounts' });
			} catch (e) {
				if (e?.code === -32002) {
					// 已有请求在进行中，退回读取现有账户
					accounts = await provider.request({ method: 'eth_accounts' });
				} else if (e?.code === 4001) {
					this.showUserRejectedMessage();
					return;
				} else {
					throw e;
				}
			}
			if (!accounts?.length) { this.showSwitchToEthereumAccount(); return; }
			// 2) 确保主网/测试网已添加
			await this.ensureNetworksAdded();
			// 3) 判定当前链，必要时切到主网
			const currentChainId = await provider.request({ method: 'eth_chainId' });
			if (currentChainId !== this.PREFERRED_CHAIN_ID) {
				await this.switchToNetwork('mainnet'); // 内部已处理 4902 等
			}
			// 4) 成功反馈
			const finalChainId = await provider.request({ method: 'eth_chainId' });
			if (window.handleWalletConnect) await window.handleWalletConnect();
			this.showSuccessMessage(accounts[0], finalChainId);
			this.setupNetworkMonitoring();
		} catch (e) {
			this.handleConnectionError(e);
		} finally {
			this.isConnecting = false;
		}
	}

    // Show switch to Ethereum account guidance
    showSwitchToEthereumAccount() {
        this.showModal({
            title: 'Switch to Ethereum Account',
            icon: 'exchange',
            iconClass: 'warning',
            content: `
                <div class="bsc-description">
                    You're currently using a Solana account. To access BSC Testnet, 
                    please switch to an Ethereum account in MetaMask.
                </div>
                
                <div class="bsc-steps">
                    <div class="bsc-step">
                        <div class="bsc-step-number">1</div>
                        <div class="bsc-step-content">
                            <h5>Open MetaMask</h5>
                            <p>Click on your account name at the top</p>
                        </div>
                    </div>
                    <div class="bsc-step">
                        <div class="bsc-step-number">2</div>
                        <div class="bsc-step-content">
                            <h5>Select Ethereum Account</h5>
                            <p>Choose an account that supports Ethereum (not Solana)</p>
                        </div>
                    </div>
                    <div class="bsc-step">
                        <div class="bsc-step-number">3</div>
                        <div class="bsc-step-content">
                            <h5>Try Again</h5>
                            <p>Click the button below to continue setup</p>
                        </div>
                    </div>
                </div>

                <div class="bsc-info-card highlight">
                    <h4>📝 Note</h4>
                    <p>After switching accounts, we'll automatically guide you through connecting to BSC Testnet.</p>
                </div>
            `,
            actions: `
                <div class="bsc-actions">
                    <button class="bsc-btn bsc-btn-primary" onclick="bscGuide.connectWalletWithGuide()">
                        🔄 Try Again
                    </button>
                </div>
            `,
            showCloseBtn: true
        });
    }

    // Show MetaMask installation guide
    showInstallMetaMaskGuide() {
        this.showModal({
            title: 'Install MetaMask',
            icon: 'wallet',
            iconClass: 'primary',
            content: `
                <div class="bsc-description">
                    MetaMask is required to connect to our platform. It's a secure wallet that helps you manage your digital assets and interact with blockchain applications.
                </div>

                <div class="bsc-benefits-list">
                    <div class="bsc-benefit-item">
                        <div class="bsc-benefit-icon safe">🛡️</div>
                        <div class="bsc-benefit-text">Secure asset management</div>
                    </div>
                    <div class="bsc-benefit-item">
                        <div class="bsc-benefit-icon fast">⚡</div>
                        <div class="bsc-benefit-text">Easy blockchain interactions</div>
                    </div>
                    <div class="bsc-benefit-item">
                        <div class="bsc-benefit-icon free">💎</div>
                        <div class="bsc-benefit-text">Access to free test tokens</div>
                    </div>
                </div>

                <div class="bsc-info-card">
                    <h4>📱 Installation Steps</h4>
                    <p>1. Click the download button below<br>
                       2. Install the MetaMask browser extension<br>
                       3. Set up your wallet following their guide<br>
                       4. Return to this page and refresh</p>
                </div>
            `,
            actions: `
                <div class="bsc-actions">
                    <button class="bsc-btn bsc-btn-external" onclick="window.open('https://metamask.io/download/', '_blank')">
                        🦊 Download MetaMask
                    </button>
                    <button class="bsc-btn bsc-btn-secondary" onclick="location.reload()">
                        🔄 Refresh Page
                    </button>
                </div>
            `,
            showCloseBtn: true
        });
    }

    // Show network switch guidance
	showNetworkSelectionGuide(currentChainId) {
	    const currentNetworkName = this.getNetworkName(currentChainId);
	    
	    this.showModal({
	        title: 'Choose Your BNB Network',
	        icon: 'network',
	        iconClass: 'primary',
	        content: `
	            <div class="bsc-description">
	                You need to connect to a BNB Smart Chain network. We recommend using <strong>BNB Mainnet</strong> for the best experience.
	            </div>

	            <div class="bsc-network-info">
	                <div class="bsc-network-item">
	                    <div class="bsc-network-label">Current Network</div>
	                    <div class="bsc-network-value current">${currentNetworkName}</div>
	                </div>
	            </div>

	            <div class="bsc-network-options">
	                <div class="bsc-network-card recommended">
	                    <div class="bsc-network-header">
	                        <h4>🌟 BNB Mainnet (Recommended)</h4>
	                        <span class="bsc-badge recommended">Recommended</span>
	                    </div>
	                    <div class="bsc-network-details">
	                        <p>• Real BNB tokens and transactions</p>
	                        <p>• Full ecosystem access</p>
	                        <p>• Production-ready environment</p>
	                        <p>• Best performance and stability</p>
	                    </div>
	                    <button class="bsc-btn bsc-btn-primary" onclick="bscGuide.switchToNetwork('mainnet')">
	                        🚀 Connect to Mainnet
	                    </button>
	                </div>
	                
	                <div class="bsc-network-card">
	                    <div class="bsc-network-header">
	                        <h4>🧪 BSC Testnet</h4>
	                        <span class="bsc-badge testnet">For Testing</span>
	                    </div>
	                    <div class="bsc-network-details">
	                        <p>• Free test tokens (no real value)</p>
	                        <p>• Safe for testing and development</p>
	                        <p>• No real money required</p>
	                        <p>• Limited ecosystem access</p>
	                    </div>
	                    <button class="bsc-btn bsc-btn-secondary" onclick="bscGuide.switchToNetwork('testnet')">
	                        🧪 Use Testnet
	                    </button>
	                </div>
	            </div>

	            <div class="bsc-info-card">
	                <h4>💡 New to BNB Smart Chain?</h4>
	                <p>If you're new or don't have BNB tokens yet, you can start with <strong>Testnet</strong> to explore safely, then switch to <strong>Mainnet</strong> when you're ready.</p>
	            </div>
	        `,
	        showCloseBtn: true
	    });
	}

    async switchToNetwork(networkType) {
		const config = this.NETWORK_CONFIGS[networkType];
		if (!config) { console.error('Invalid network type:', networkType); return; }
		const provider = window.walletManager?.getMetaMaskProvider?.();
		if (!provider) throw new Error('MetaMask provider not found');
		try {
			this.showLoadingModal(`Switching to ${config.chainName}...`);
			await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: config.chainId }] });
			this.closeModal();
		} catch (e) {
			if (e?.code === 4902) {
				await provider.request({ method: 'wallet_addEthereumChain', params: [config] });
				await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: config.chainId }] });
				this.closeModal();
			} else if (e?.code === 4001) {
				this.showUserRejectedMessage();
			} else {
				this.showManualInstructions(networkType);
			}
		}
	}

    async addNetwork(networkType) {
        const config = this.NETWORK_CONFIGS[networkType];
        try {
            this.showLoadingModal(`Adding ${config.chainName} to MetaMask...`);
            
            const provider = window.walletManager?.getMetaMaskProvider?.();
            if (!provider) throw new Error("MetaMask provider not found");
            await provider.request({
                method: 'wallet_addEthereumChain',
                params: [config]
            });

            this.closeModal();
            setTimeout(() => {
                this.connectWalletWithGuide();
            }, 1000);

        } catch (error) {
            if (error.code === 4001) {
                this.showUserRejectedMessage();
            } else {
                this.showManualInstructions(networkType);
            }
        }
    }

	// 确保两个网络都已添加到 MetaMask
	async ensureNetworksAdded() {
		const provider = window.walletManager?.getMetaMaskProvider?.();
		if (!provider) throw new Error('MetaMask provider not found');
		// Mainnet
		try {
			await provider.request({ method: 'wallet_addEthereumChain', params: [this.NETWORK_CONFIGS.mainnet] });
		} catch (e) {
			if (e?.code !== 4902) console.debug('[ensure] mainnet add:', e?.message || e);
		}
		// Testnet
		try {
			await provider.request({ method: 'wallet_addEthereumChain', params: [this.NETWORK_CONFIGS.testnet] });
		} catch (e) {
			if (e?.code !== 4902) console.debug('[ensure] testnet add:', e?.message || e);
		}
	}

    // Auto switch network
    async attemptNetworkSwitch() {
	  try {
	    const provider = window.walletManager?.getMetaMaskProvider?.();
	    if (!provider) throw new Error('MetaMask provider not found');
	    this.showLoadingModal('Switching to BSC Testnet...');
	    await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: this.FALLBACK_CHAIN_ID }] });
	    this.closeModal();
	  } catch (e) {
	    if (e?.code === 4902) {
	      await this.addBSCTestnetNetwork();
	    } else if (e?.code === 4001) {
	      this.showUserRejectedMessage();
	    } else {
	      this.showManualInstructions();
	    }
	  }
	}
    // Add BSC Testnet
    async addBSCTestnetNetwork() {
	  try {
	    const provider = window.walletManager?.getMetaMaskProvider?.();
	    if (!provider) throw new Error('MetaMask provider not found');
	    this.showLoadingModal('Adding BSC Testnet to MetaMask...');
	    await provider.request({ method: 'wallet_addEthereumChain', params: [this.NETWORK_CONFIGS.testnet] });
	    this.closeModal();
	  } catch (e) {
	    if (e?.code === 4001) this.showUserRejectedMessage();
	    else this.showManualInstructions();
	  }
	}
    
    // Show manual setup instructions
    showManualInstructions() {
        this.showModal({
            title: 'Manual Network Setup',
            icon: 'settings',
            iconClass: 'primary',
            content: `
                <div class="bsc-description">
                    Follow these steps to manually add BSC Testnet to your MetaMask wallet.
                </div>

                <div class="bsc-steps">
                    <div class="bsc-step">
                        <div class="bsc-step-number">1</div>
                        <div class="bsc-step-content">
                            <h5>Open MetaMask Settings</h5>
                            <p>Click the MetaMask icon → Settings → Networks → Add Network</p>
                        </div>
                    </div>
                    <div class="bsc-step">
                        <div class="bsc-step-number">2</div>
                        <div class="bsc-step-content">
                            <h5>Enter Network Details</h5>
                            <p>Copy and paste the information below into the form</p>
                        </div>
                    </div>
                </div>

                <div class="bsc-code-block">
                    <div><span class="code-label">Network Name:</span> BSC Testnet</div>
                    <div><span class="code-label">RPC URL:</span> https://data-seed-prebsc-1-s1.binance.org:8545/</div>
                    <div><span class="code-label">Chain ID:</span> 97</div>
                    <div><span class="code-label">Symbol:</span> tBNB</div>
                    <div><span class="code-label">Block Explorer:</span> https://testnet.bscscan.com/</div>
                </div>

                <div class="bsc-info-card">
                    <h4>💡 Pro Tip</h4>
                    <p>You can copy each field individually by selecting the text above. After adding the network, MetaMask will automatically switch to it.</p>
                </div>
            `,
            actions: `
                <div class="bsc-actions">
                    <button class="bsc-btn bsc-btn-success" onclick="bscGuide.closeModal()">
                        ✅ I've Added the Network
                    </button>
                    <button class="bsc-btn bsc-btn-secondary" onclick="bscGuide.connectWalletWithGuide()">
                        🔄 Test Connection
                    </button>
                </div>
            `,
            showCloseBtn: true
        });
    }

    // Show user rejection message
    showUserRejectedMessage() {
        this.showModal({
            title: 'Permission Required',
            icon: 'shield',
            iconClass: 'warning',
            content: `
                <div class="bsc-description">
                    We need your permission to connect to BSC Testnet. This is completely safe and allows you to use our services for free.
                </div>

                <div class="bsc-info-card">
                    <h4>🔒 Why We Need Permission</h4>
                    <p>• To connect your wallet to our platform<br>
                       • To check your current network<br>
                       • To help you switch to BSC Testnet<br>
                       • To provide you with free test tokens</p>
                </div>

                <div class="bsc-info-card highlight">
                    <h4>🛡️ Your Security</h4>
                    <p>We cannot access your private keys or move your funds. We only request network switching permissions.</p>
                </div>
            `,
            actions: `
                <div class="bsc-actions">
                    <button class="bsc-btn bsc-btn-primary" onclick="bscGuide.connectWalletWithGuide()">
                        🔄 Try Again
                    </button>
                    <button class="bsc-btn bsc-btn-secondary" onclick="bscGuide.showManualInstructions()">
                        📖 Manual Setup
                    </button>
                </div>
            `,
            showCloseBtn: true
        });
    }

    // Show success message
	showSuccessMessage(address, chainId) {
	    const networkType = this.getNetworkType(chainId);
	    const config = this.NETWORK_CONFIGS[networkType];
	    const isMainnet = networkType === 'mainnet';
	    
	    this.showModal({
	        title: 'Connection Successful!',
	        icon: 'check',
	        iconClass: 'success',
	        content: `
	            <div class="bsc-description">
	                Your wallet has been successfully connected to ${config.chainName}. You're all set to start using our platform!
	            </div>

	            <div class="bsc-info-card highlight">
	                <h4>✅ Connection Details</h4>
	                <div class="bsc-network-info">
	                    <div class="bsc-network-item">
	                        <div class="bsc-network-label">Network</div>
	                        <div class="bsc-network-value required">${config.chainName}</div>
	                    </div>
	                    <div class="bsc-network-item">
	                        <div class="bsc-network-label">Status</div>
	                        <div class="bsc-network-value required">Connected</div>
	                    </div>
	                </div>
	                <div class="bsc-address-display">
	                    ${address.slice(0, 6)}...${address.slice(-4)}
	                </div>
	            </div>

	            <div class="bsc-benefits-list">
	                <div class="bsc-benefit-item">
	                    <div class="bsc-benefit-icon ${isMainnet ? 'fast' : 'free'}">
	                        ${isMainnet ? '🚀' : '🎉'}
	                    </div>
	                    <div class="bsc-benefit-text">
	                        ${isMainnet ? 'Full ecosystem access' : 'Ready to earn free test tokens'}
	                    </div>
	                </div>
	                <div class="bsc-benefit-item">
	                    <div class="bsc-benefit-icon fast">⚡</div>
	                    <div class="bsc-benefit-text">Fast and secure transactions</div>
	                </div>
	                <div class="bsc-benefit-item">
	                    <div class="bsc-benefit-icon safe">🌟</div>
	                    <div class="bsc-benefit-text">Platform features unlocked</div>
	                </div>
	            </div>

	            ${!isMainnet ? `
	                <div class="bsc-info-card">
	                    <h4>💡 Want the Full Experience?</h4>
	                    <p>You're currently on Testnet. <a href="#" onclick="bscGuide.switchToNetwork('mainnet')" style="color: #8b5cf6; font-weight: 600;">Switch to Mainnet</a> for access to real tokens and the complete ecosystem.</p>
	                </div>
	            ` : ''}
	        `,
	        actions: `
	            <div class="bsc-actions">
	                <button class="bsc-btn bsc-btn-success" onclick="bscGuide.closeModal()">
	                    🚀 Get Started
	                </button>
	                ${!isMainnet ? `
	                    <button class="bsc-btn bsc-btn-primary" onclick="bscGuide.switchToNetwork('mainnet')">
	                        🌟 Upgrade to Mainnet
	                    </button>
	                ` : ''}
	            </div>
	        `,
	        autoClose: isMainnet ? 3000 : null
	    });
	}


    // Network monitoring
    setupNetworkMonitoring() {
        if (window.ethereum) {
            window.ethereum.on('chainChanged', (chainId) => {
                if (!this.isSupportedNetwork(chainId)) {
                    this.showNetworkChangeWarning();
                }
            });
        }
    }

    showNetworkChangeWarning() {
        this.showModal({
            title: 'Network Changed',
            icon: 'warning',
            iconClass: 'warning',
            content: `
                <div class="bsc-description">
                    You've switched to a different network. Some features may not work properly until you return to BSC Testnet.
                </div>

                <div class="bsc-info-card">
                    <h4>⚠️ What This Means</h4>
                    <p>• Platform features may be limited<br>
                       • Transactions might fail<br>
                       • Your assets may not display correctly</p>
                </div>
            `,
            actions: `
                <div class="bsc-actions">
                    <button class="bsc-btn bsc-btn-warning" onclick="bscGuide.attemptNetworkSwitch()">
                        🔄 Return to BSC Testnet
                    </button>
                </div>
            `,
            showCloseBtn: true
        });
    }

    // Show loading modal
    showLoadingModal(message) {
        this.showModal({
            title: '',
            content: `
                <div class="bsc-loading">
                    <div class="bsc-spinner"></div>
                    <div class="bsc-loading-text">${message}</div>
                </div>
            `,
            showCloseBtn: false,
            actions: ''
        });
    }

    // Utility functions
    getNetworkName(chainId) {
        const networks = {
            '0x1': 'Ethereum Mainnet',
            '0x3': 'Ropsten Testnet',
            '0x4': 'Rinkeby Testnet',
            '0x5': 'Goerli Testnet',
            '0x38': 'BSC Mainnet',
            '0x61': 'BSC Testnet',
            '0x89': 'Polygon Mainnet',
            '0xa86a': 'Avalanche Mainnet'
        };
        return networks[chainId] || `Unknown Network (${chainId})`;
    }

    // Enhanced error handling
    handleConnectionError(error) {
        console.log('Connection error details:', error);
        
        // Check for specific error patterns that indicate Solana account
        const errorMessage = error.message || '';
        const isSolanaError = errorMessage.includes('eth_requestAccounts') || 
                             errorMessage.includes('MetaMask is not connected') ||
                             error.code === -32603 ||
                             errorMessage.includes('Please Finish connecting your wallet(entering login information in the extension)!');
        
        if (isSolanaError) {
            this.showSwitchToEthereumAccount();
            return;
        }
        
        if (error.code === 4001) {
            this.showUserRejectedMessage();
        } else {
            this.showModal({
                title: 'Connection Failed',
                icon: 'error',
                iconClass: 'error',
                content: `
                    <div class="bsc-description">
                        We encountered an issue while connecting to your wallet. This is usually temporary and can be resolved by trying again.
                    </div>

                    <div class="bsc-info-card">
                        <h4>🔧 Technical Details</h4>
                        <p>${errorMessage || 'Unknown connection error'}</p>
                    </div>

                    <div class="bsc-info-card">
                        <h4>💡 Common Solutions</h4>
                        <p>• Refresh the page and try again<br>
                           • Make sure MetaMask is unlocked<br>
                           • Check your internet connection<br>
                           • Try switching to an Ethereum account</p>
                    </div>
                `,
                actions: `
                    <div class="bsc-actions">
                        <button class="bsc-btn bsc-btn-primary" onclick="bscGuide.connectWalletWithGuide()">
                            🔄 Try Again
                        </button>
                        <button class="bsc-btn bsc-btn-secondary" onclick="location.reload()">
                            🔄 Refresh Page
                        </button>
                    </div>
                `,
                showCloseBtn: true
            });
        }
    }

    // Modal management
    showModal({ title, content, icon = '', iconClass = 'primary', actions = '', showCloseBtn = false, autoClose = null }) {
        // Remove existing modal
        this.closeModal();

        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.className = 'bsc-modal-overlay';
        overlay.id = 'bscGuideModal';

        // Build icon HTML
        const iconMap = {
            wallet: '🦊',
            network: '🌐',
            exchange: '🔄',
            settings: '⚙️',
            check: '✅',
            error: '❌',
            warning: '⚠️',
            shield: '🛡️'
        };

        const iconHTML = icon ? `
            <div class="bsc-icon-section">
                <div class="bsc-icon ${iconClass}">
                    ${iconMap[icon] || icon}
                </div>
            </div>
        ` : '';

        overlay.innerHTML = `
            <div class="bsc-modal-content">
                <div class="bsc-modal-header">
                    ${title ? `<h2 class="bsc-modal-title">${title}</h2>` : ''}
                    ${showCloseBtn ? '<button class="bsc-modal-close" onclick="bscGuide.closeModal()">×</button>' : ''}
                </div>
                <div class="bsc-modal-body">
                    ${iconHTML}
                    ${content}
                    ${actions}
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // Show modal with animation
        setTimeout(() => {
            overlay.classList.add('show');
        }, 10);

        // Auto close if specified
        if (autoClose) {
            setTimeout(() => this.closeModal(), autoClose);
        }

        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.closeModal();
            }
        });
    }

    closeModal() {
        const modal = document.getElementById('bscGuideModal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.remove();
            }, 300);
        }
    }
}

// Create global instance
const bscGuide = new BSCNetworkGuide();

// Update wallet connection function to use guide
function connectMetaMaskWallet() {
    if (typeof closeWalletModal === 'function') {
        closeWalletModal();
    }
    bscGuide.connectWalletWithGuide();
}

// Export for use in other scripts
if (typeof window !== 'undefined') {
    window.bscGuide = bscGuide;
    window.connectMetaMaskWallet = connectMetaMaskWallet;
}