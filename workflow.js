// Workflow Page JavaScript

const WORKFLOW_PRICING_DEFAULTS = (window.PricingUtils && window.PricingUtils.constants) || {
    currency: 'USDC',
    pricePerApiCallUsdc: 0.0008,
    gasEstimatePerCallUsdc: 0.00025,
    sharePurchaseMinUsdc: 1,
    sharePurchaseMaxUsdc: 20,
    dailyCheckInRewardUsdc: 0.01
};

function workflowFormatUsdc(value, options = {}) {
    if (window.PricingUtils && typeof window.PricingUtils.formatUsdcAmount === 'function') {
        return window.PricingUtils.formatUsdcAmount(value, options);
    }
    const num = Number(value || 0);
    const min = options.minimumFractionDigits ?? 4;
    const max = options.maximumFractionDigits ?? 6;
    return `${num.toFixed(Math.min(Math.max(min, 0), max))} USDC`;
}

function getWorkflowModelPricing(modelName) {
    const model = (typeof window.getModelData === 'function') ? window.getModelData(modelName) : null;
    if (window.PricingUtils && typeof window.PricingUtils.normalizeModelPricing === 'function') {
        return window.PricingUtils.normalizeModelPricing(model || {});
    }
    return {
        currency: WORKFLOW_PRICING_DEFAULTS.currency,
        pricePerCallUsdc: WORKFLOW_PRICING_DEFAULTS.pricePerApiCallUsdc,
        gasPerCallUsdc: WORKFLOW_PRICING_DEFAULTS.gasEstimatePerCallUsdc
    };
}

// Sample workflow data using real models from model-data.js
const workflows = [
    {
        id: 1,
        name: "AI Safety & Watermarking Pipeline",
        description: "Comprehensive AI safety workflow combining watermarking detection, safety evaluation, and content authenticity verification using state-of-the-art models.",
        category: "AI Safety",
        models: [
            { name: "AI-Text-Detector-Examiner", price: 9.8, tokens: 2 },
            { name: "SafeKey-Safety-Reasoner", price: 5.3, tokens: 1 },
            { name: "Invisible-Watermark-Remover", price: 9.5, tokens: 3 },
            { name: "Context-Watermarker", price: 5.0, tokens: 1 }
        ],
        totalPrice: 29.6,
        modelCount: 4,
        popularity: 95,
        createdAt: "2024-01-15"
    },
    {
        id: 2,
        name: "Content Generation & Analysis Suite",
        description: "Advanced content generation workflow with multimodal capabilities, including text generation, image processing, and creative content creation.",
        category: "Content Generation",
        models: [
            { name: "NVIDIA-Cosmos-World-Model", price: 9.8, tokens: 4 },
            { name: "SurfGen-3D-Shape-Generator", price: 6.8, tokens: 2 },
            { name: "InfoGAN-Disentangled-Representation", price: 7.4, tokens: 2 },
            { name: "TPU-GAN-Temporal-Point-Cloud", price: 6.8, tokens: 2 }
        ],
        totalPrice: 30.8,
        modelCount: 4,
        popularity: 88,
        createdAt: "2024-01-20"
    },
    {
        id: 3,
        name: "Medical AI Diagnosis Pipeline",
        description: "Comprehensive medical diagnosis workflow using advanced imaging analysis, clinical AI, and medical diagnosis models for healthcare applications.",
        category: "Healthcare",
        models: [
            { name: "Multi-Scale-PET-GCN", price: 7.4, tokens: 2 },
            { name: "Alzheimer-Hierarchical-Graph-PET", price: 9.5, tokens: 3 },
            { name: "Multi-Size-PET-Graph-CNN", price: 8.0, tokens: 2 },
            { name: "Unified-MRI-Neural-Operator", price: 3.8, tokens: 1 }
        ],
        totalPrice: 28.7,
        modelCount: 4,
        popularity: 92,
        createdAt: "2024-01-18"
    },
    {
        id: 4,
        name: "Computer Vision & Analysis Suite",
        description: "Advanced computer vision workflow combining multiple vision models for comprehensive image analysis, recognition, and processing.",
        category: "Computer Vision",
        models: [
            { name: "Activation-Sparsity-Shape-Bias-CNN", price: 9.8, tokens: 3 },
            { name: "Gabor-Wavelet-Image-Processor", price: 4.1, tokens: 1 },
            { name: "Bayesian-V1-Texture-Segmenter", price: 9.2, tokens: 2 },
            { name: "V1-Integration-Blackboard", price: 4.7, tokens: 1 }
        ],
        totalPrice: 27.8,
        modelCount: 4,
        popularity: 87,
        createdAt: "2024-01-22"
    },
    {
        id: 5,
        name: "Blockchain & Web3 AI Integration",
        description: "Innovative blockchain AI workflow combining smart contract development, game agents, and decentralized AI applications.",
        category: "Web3/Blockchain",
        models: [
            { name: "GameFi-Embodied-AI-Agent", price: 6.2, tokens: 2 },
            { name: "Smart-Contract-LLM-Pipeline", price: 4.1, tokens: 1 },
            { name: "PoL-Proof-of-Learning-Blockchain", price: 3.5, tokens: 1 },
            { name: "GameFi-Embodied-AI-Agents", price: 3.2, tokens: 1 }
        ],
        totalPrice: 17.0,
        modelCount: 4,
        popularity: 90,
        createdAt: "2024-01-25"
    },
    {
        id: 6,
        name: "Environmental & Climate AI Analysis",
        description: "Comprehensive environmental analysis workflow using advanced AI models for climate prediction, water resource management, and environmental monitoring.",
        category: "Environmental AI",
        models: [
            { name: "Graph-Runoff-GNN-River-Basins", price: 9.8, tokens: 3 },
            { name: "SoilMoist-Diff-SMAP-Imputation", price: 6.2, tokens: 2 },
            { name: "WADE-RL-Water-Adaptive-Decision", price: 4.1, tokens: 1 },
            { name: "Hydro-PINO-Physics-Informed", price: 6.8, tokens: 2 }
        ],
        totalPrice: 26.9,
        modelCount: 4,
        popularity: 94,
        createdAt: "2024-01-28"
    },
    {
        id: 7,
        name: "Security & Red Teaming Framework",
        description: "Advanced security assessment workflow using red teaming models, vulnerability detection, and AI security evaluation tools.",
        category: "Security",
        models: [
            { name: "Weak-to-Strong-Jailbreak", price: 8.3, tokens: 2 },
            { name: "ReLeak-Privacy-Attacker", price: 7.4, tokens: 2 },
            { name: "AgentVigil-Red-Team-Fuzzer", price: 5.9, tokens: 1 },
            { name: "AgentVigil-Black-Box-Red-Team", price: 5.9, tokens: 1 }
        ],
        totalPrice: 27.5,
        modelCount: 4,
        popularity: 89,
        createdAt: "2024-02-01"
    },
    {
        id: 8,
        name: "Graph Neural Networks & Analytics",
        description: "Advanced graph neural network workflow for complex relational data processing, network analysis, and knowledge graph applications.",
        category: "Graph Analytics",
        models: [
            { name: "Multi-Semantic-Metapath", price: 3.5, tokens: 1 },
            { name: "GVR-Graph-Valued-Regression", price: 9.5, tokens: 3 },
            { name: "STVG-Spatial-Temporal-Varying-Graphs", price: 4.7, tokens: 1 },
            { name: "Multi-Semantic-Metapath-MSM", price: 9.5, tokens: 3 }
        ],
        totalPrice: 27.2,
        modelCount: 4,
        popularity: 91,
        createdAt: "2024-02-05"
    },
    {
        id: 9,
        name: "Model Optimization & Training Suite",
        description: "Comprehensive model optimization workflow using advanced training techniques, hyperparameter optimization, and model efficiency tools.",
        category: "Model Optimization",
        models: [
            { name: "Hierarchical-Bayesian-Inference", price: 7.4, tokens: 2 },
            { name: "Normative-Causal-Inference", price: 5.6, tokens: 1 },
            { name: "BDP-Rank-Bayesian-Decision-Process", price: 8.9, tokens: 2 },
            { name: "BPTF-Bayesian-Tensor-Factorization", price: 4.4, tokens: 1 }
        ],
        totalPrice: 26.3,
        modelCount: 4,
        popularity: 93,
        createdAt: "2024-02-10"
    },
    {
        id: 10,
        name: "Advanced Research & Development",
        description: "Cutting-edge research workflow combining multiple AI research models for advanced experimentation and development.",
        category: "AI Research",
        models: [
            { name: "Intuitor-Self-Certainty-Learner", price: 8.3, tokens: 2 },
            { name: "Best-of-N-Self-Certainty", price: 5.3, tokens: 1 },
            { name: "Permute-and-Flip-Decoder", price: 8.9, tokens: 3 },
            { name: "Intuitor-Internal-Feedback-RLIF", price: 9.8, tokens: 3 }
        ],
        totalPrice: 32.3,
        modelCount: 4,
        popularity: 96,
        createdAt: "2024-02-15"
    }
];

enrichWorkflowPricing(workflows);

function enrichWorkflowPricing(workflowList) {
    workflowList.forEach(workflow => {
        let computeCost = 0;
        let gasCost = 0;
        workflow.models = (workflow.models || []).map(node => {
            const calls = Math.max(Number(node.tokens || node.calls || 1), 1);
            const pricing = getWorkflowModelPricing(node.name);
            const pricePerCall = Number(pricing.pricePerCallUsdc || WORKFLOW_PRICING_DEFAULTS.pricePerApiCallUsdc);
            const gasPerCall = Number(pricing.gasPerCallUsdc || WORKFLOW_PRICING_DEFAULTS.gasEstimatePerCallUsdc);
            const nodeComputeCost = calls * pricePerCall;
            const nodeGasCost = calls * gasPerCall;
            computeCost += nodeComputeCost;
            gasCost += nodeGasCost;
            return {
                ...node,
                calls,
                tokens: calls,
                price: Number(pricePerCall.toFixed(6)),
                pricePerCallUsdc: pricePerCall,
                gasPerCallUsdc: gasPerCall,
                computeCostUsdc: Number(nodeComputeCost.toFixed(6)),
                gasCostUsdc: Number(nodeGasCost.toFixed(6)),
                totalCostUsdc: Number((nodeComputeCost + nodeGasCost).toFixed(6))
            };
        });
        workflow.totalComputeCostUsdc = Number(computeCost.toFixed(6));
        workflow.totalGasCostUsdc = Number(gasCost.toFixed(6));
        workflow.totalPriceUsdc = Number((computeCost + gasCost).toFixed(6));
        workflow.totalPrice = workflow.totalPriceUsdc; // legacy compatibility
    });
}

// Current user's assets (from myAssets localStorage)
let userAssets = {};

// Helper: get current wallet credits (USDC balance)
function getWalletCredits() {
    try {
        if (window.walletManager && typeof window.walletManager.getUserInfo === 'function') {
            const info = window.walletManager.getUserInfo();
            return Number(info && info.credits ? info.credits : 0);
        }
    } catch (_) {}
    return 0;
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    loadUserAssets();
    displayWorkflows(workflows);
    console.log('✅ Workflow page loaded');
});

// Load user assets from localStorage
function loadUserAssets() {
    try {
        const myAssets = JSON.parse(localStorage.getItem('myAssets')) || { tokens: [], shares: [] };
        
        // Convert tokens array to object format
        userAssets = {};
        myAssets.tokens.forEach(token => {
            userAssets[token.modelName] = token.quantity;
        });
        
        console.log('📦 Loaded user assets:', userAssets);
    } catch (error) {
        console.error('❌ Error loading user assets:', error);
        userAssets = {};
    }
}

// 检查用户是否已连接钱包 - 复制自mycart.js
function checkWalletConnection() {
    if (!window.walletManager) {
        return { connected: false, error: 'Wallet manager not loaded' };
    }
    
    const userInfo = window.walletManager.getUserInfo();
    return {
        connected: userInfo.isConnected,
        address: userInfo.address,
        tokens: userInfo.credits, // 统一使用 USDC 余额
        error: userInfo.isConnected ? null : 'Please connect your wallet first'
    };
}

// 验证用户是否有足够的 USDC 余额 - 复制自mycart.js
function validatePayment(totalCost) {
    const walletStatus = checkWalletConnection();
    
    if (!walletStatus.connected) {
        return {
            valid: false,
            error: walletStatus.error,
            required: totalCost,
            available: 0
        };
    }
    
    if (walletStatus.tokens < totalCost) {
        return {
            valid: false,
            error: `Insufficient USDC balance. You need ${totalCost} USDC but only have ${walletStatus.tokens} USDC.`,
            required: totalCost,
            available: walletStatus.tokens
        };
    }
    
    return {
        valid: true,
        available: walletStatus.tokens,
        required: totalCost
    };
}

// Display workflows
function displayWorkflows(workflowsToShow) {
    const grid = document.getElementById('workflowGrid');
    grid.innerHTML = '';

    if (workflowsToShow.length === 0) {
        grid.innerHTML = '<div class="loading">No workflows found</div>';
        return;
    }

    workflowsToShow.forEach(workflow => {
        const card = createWorkflowCard(workflow);
        grid.appendChild(card);
    });
}

// Create workflow card with enhanced features
function createWorkflowCard(workflow) {
    const card = document.createElement('div');
    card.className = 'workflow-card';
    
    card.innerHTML = `
        <div class="workflow-header-section">
            <div>
                <h3 class="workflow-title">${workflow.name}</h3>
                <div class="workflow-stats">
                    <span class="stat-item">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                        </svg>
                        ${workflow.popularity}% popular
                    </span>
                    <span class="stat-item">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                            <path d="m2 17 10 5 10-5"/>
                            <path d="m2 12 10 5 10-5"/>
                        </svg>
                        ${workflow.modelCount} models
                    </span>
                </div>
            </div>
        </div>
        
        <div class="workflow-description">${workflow.description}</div>
        
        <div class="workflow-metrics">
            <div class="metric-item">
                <span class="metric-label">Compute Cost</span>
                <span class="metric-value price">${workflowFormatUsdc(workflow.totalComputeCostUsdc, { minimumFractionDigits: 4, maximumFractionDigits: 6 })}</span>
            </div>
            <div class="metric-item">
                <span class="metric-label">Estimated Gas</span>
                <span class="metric-value price">${workflowFormatUsdc(workflow.totalGasCostUsdc, { minimumFractionDigits: 5, maximumFractionDigits: 6 })}</span>
            </div>
            <div class="metric-item">
                <span class="metric-label">Total (x402)</span>
                <span class="metric-value price">${workflowFormatUsdc(workflow.totalPriceUsdc, { minimumFractionDigits: 4, maximumFractionDigits: 6 })}</span>
            </div>
        </div>
        
        <div class="workflow-actions">
            <button class="action-btn details" onclick="showWorkflowDetails(${workflow.id})">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="m21 21-4.35-4.35"/>
                </svg>
                Details
            </button>
            <button class="action-btn try-now" onclick="tryWorkflow(${workflow.id})">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="5,3 19,12 5,21"/>
                </svg>
                Pay with x402
            </button>
        </div>
    `;
    
    return card;
}

// Check missing tokens for a workflow
function checkMissingTokens(workflow) {
    const missing = [];
    
    workflow.models.forEach(model => {
        const userTokens = userAssets[model.name] || 0;
        if (userTokens < model.tokens) {
            missing.push({
                name: model.name,
                required: model.tokens,
                current: userTokens,
                price: model.price,
                cost: model.price * model.tokens
            });
        }
    });
    
    return missing;
}

// Show token purchase modal - 先显示购买界面，验证留到placeOrder
function showTokenPurchaseModal(workflow, missingTokens) {
    const modal = document.getElementById('tokenPurchaseModal');
    const tokenList = document.getElementById('tokenList');
    const totalCostElement = document.getElementById('totalCost');
    
    // Clear previous content
    tokenList.innerHTML = '';
    
    // Calculate total cost
    const totalCost = missingTokens.reduce((sum, token) => sum + token.cost, 0);
    
    // Add token items
    missingTokens.forEach(token => {
        const tokenItem = document.createElement('div');
        tokenItem.className = 'token-item';
        tokenItem.innerHTML = `
            <div class="token-info-left">
                <div class="token-name">${token.name}</div>
                <div class="token-details">${token.required}K tokens needed (you have ${token.current}K)</div>
            </div>
            <div class="token-price">${workflowFormatUsdc(token.cost, { minimumFractionDigits: 4, maximumFractionDigits: 6 })}</div>
        `;
        tokenList.appendChild(tokenItem);
    });
    
    totalCostElement.textContent = workflowFormatUsdc(totalCost, { minimumFractionDigits: 4, maximumFractionDigits: 6 });
    
    // Store workflow data for later use
    modal.dataset.workflowId = workflow.id;
    
    // Show modal
    modal.classList.add('show');
}

// Hide token purchase modal
function hideTokenPurchaseModal() {
    const modal = document.getElementById('tokenPurchaseModal');
    modal.classList.remove('show');
}

// 修复后的placeOrder函数 - 在这里进行所有验证
async function placeOrder() {
    const modal = document.getElementById('tokenPurchaseModal');
    const workflowId = parseInt(modal.dataset.workflowId);
    const workflow = workflows.find(w => w.id === workflowId);
    
    if (!workflow) return;
    
    // 1. 首先检查钱包连接状态
    const walletStatus = checkWalletConnection();
    if (!walletStatus.connected) {
        alert('⚠️ Please connect your MetaMask wallet first to proceed with payment.\n\nClick "Login" → "Connect Wallet"');
        return;
    }
    
    // 2. 计算缺失tokens的总成本
    const missingTokens = checkMissingTokens(workflow);
    const totalCost = missingTokens.reduce((sum, token) => sum + token.cost, 0);
    const requestId = generateWorkflowPaymentRequestId();
    
    // 3. 验证支付能力
    const paymentValidation = validatePayment(totalCost);
    if (!paymentValidation.valid) {
        alert(`❌ Payment Failed!\n\n${paymentValidation.error}\n\n💡 Tip: Daily check-in grants +0.01 USDC.\n\nTransaction cancelled.`);
        return;
    }
    
    // 4. 402 付款流程（Phantom）
    let paymentResult;
    try {
        paymentResult = await settleWorkflowInvoice(totalCost, workflow, requestId);
    } catch (error) {
        alert(`❌ Payment Processing Failed!\n\n${error?.message || error}\n\nTransaction cancelled.`);
        return;
    }
    if (!paymentResult || !paymentResult.success) {
        // 用户取消或失败已在 settleWorkflowInvoice 中记录
        return;
    }
    
    // 5. 扣减本地账户余额
    const spendResult = window.walletManager.spendCredits(totalCost, 'workflow_tokens_purchase');
    if (!spendResult.success) {
        alert(`⚠️ Payment settled on-chain, but failed to update local credits: ${spendResult.error}`);
    }
    
    // 6. 更新用户资产 (添加购买的tokens)
    missingTokens.forEach(token => {
        userAssets[token.name] = (userAssets[token.name] || 0) + token.required;
    });
    
    // 7. 保存到localStorage
    updateUserAssetsInStorage();
    
    // 8. 显示成功消息
    alert(`🎉 Purchase Successful!\n\n💳 Payment: ${totalCost.toFixed(6)} USDC\n📊 Workflow: ${workflow.name}\n🎯 Models: ${workflow.modelCount}`);
    
    // 9. Hide modal
    hideTokenPurchaseModal();
    
    // 10. Refresh workflow display
    displayWorkflows(workflows);
    
    // 11. 标记该工作流已预付费
    workflow.prepaid = true;
    workflow.prepaidAt = new Date().toISOString();
    workflow.prepaidAmountUsdc = Number(totalCost.toFixed(6));
    workflow.prepaidModels = (workflow.models || []).map(m => m.name);
    workflow.lastPaymentTx = paymentResult.signature || null;
    workflow.lastPaymentExplorer = paymentResult.explorer || null;
    workflow.lastPaymentAt = workflow.prepaidAt;
    workflow.lastPaymentMemo = requestId;
    
    if (window.MCPClient && typeof window.MCPClient.logStatus === 'function') {
        window.MCPClient.logStatus('payment', 'Workflow payment settled', {
            amount: totalCost.toFixed(6),
            memo: requestId,
            tx: workflow.lastPaymentTx,
            explorer: paymentResult.explorer
        });
    }
    showWorkflowExplorerToast(workflow.lastPaymentTx, totalCost, paymentResult.explorer);
    
    offerCanvasNavigation(workflow);
}

// Update user assets in localStorage
function updateUserAssetsInStorage() {
    try {
        const myAssets = JSON.parse(localStorage.getItem('myAssets')) || { tokens: [], shares: [] };
        
        // Update tokens with proper structure for My Assets
        myAssets.tokens = Object.entries(userAssets).map(([modelName, quantity]) => {
            const modelData = getModelData(modelName);
            return {
                modelName,
                quantity,
                category: modelData ? modelData.category : 'AI Research',
                industry: modelData ? modelData.industry : 'Technology',
                tokenPrice: modelData ? modelData.tokenPrice : 0,
                sharePrice: modelData ? modelData.sharePrice : 0,
                change: modelData ? modelData.change : 0,
                rating: modelData ? modelData.rating : 0,
                usage: modelData ? modelData.usage : 0,
                compatibility: modelData ? modelData.compatibility : 0,
                totalScore: modelData ? modelData.totalScore : 0,
                purchaseDate: new Date().toISOString(),
                lastPurchase: new Date().toISOString()
            };
        });
        
        localStorage.setItem('myAssets', JSON.stringify(myAssets));
        console.log('💾 Updated user assets in localStorage');
    } catch (error) {
        console.error('❌ Error updating user assets:', error);
    }
}

// Filter workflows with enhanced functionality
function filterWorkflows() {
    const searchTerm = document.getElementById('workflowSearch').value.toLowerCase();
    const categoryFilter = document.getElementById('categoryFilter').value;
    const sortFilter = document.getElementById('sortFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;
    
    let filtered = workflows.filter(workflow => {
        const matchesSearch = workflow.name.toLowerCase().includes(searchTerm) || 
                            workflow.description.toLowerCase().includes(searchTerm);
        const matchesCategory = !categoryFilter || workflow.category === categoryFilter;
        
        // Status filter (Ready/Need Tokens) based on credits vs total price
        let matchesStatus = true;
        if (statusFilter) {
            const hasSufficientCredits = getWalletCredits() >= Number(workflow.totalPrice || 0);
            if (statusFilter === 'ready' && !hasSufficientCredits) matchesStatus = false;
            if (statusFilter === 'need-tokens' && hasSufficientCredits) matchesStatus = false;
        }
        
        return matchesSearch && matchesCategory && matchesStatus;
    });
    
    // Sort workflows
    switch(sortFilter) {
        case 'popular':
            filtered.sort((a, b) => b.popularity - a.popularity);
            break;
        case 'recent':
            filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            break;
        case 'price-low':
            filtered.sort((a, b) => a.totalPrice - b.totalPrice);
            break;
        case 'price-high':
            filtered.sort((a, b) => b.totalPrice - a.totalPrice);
            break;
        case 'name':
            filtered.sort((a, b) => a.name.localeCompare(b.name));
            break;
    }
    
    displayWorkflows(filtered);
}

// Show workflow details with enhanced information
function showWorkflowDetails(workflowId) {
    const workflow = workflows.find(w => w.id === workflowId);
    if (!workflow) return;
    
    const hasSufficientCredits = getWalletCredits() >= Number(workflow.totalPrice || 0);
    
    // Update modal title
    document.getElementById('workflowDetailsTitle').textContent = workflow.name;
    
    // Build detailed content
    let content = `
        <div class="workflow-details-section">
            <h3>Overview</h3>
            <p>${workflow.description}</p>
        </div>
        
        <div class="workflow-details-section">
            <h3>Models (${workflow.modelCount})</h3>
            <div class="workflow-models-list">
    `;
    
    workflow.models.forEach(model => {
        const userTokens = userAssets[model.name] || 0;
        const modelReady = hasSufficientCredits || (userTokens >= model.tokens);
        const status = modelReady ? 'ready' : 'need-tokens';
        const statusText = modelReady ? 'Ready' : 'Need Tokens';
        const statusIcon = modelReady ? '✅' : '⚠️';
        const modelData = getModelData(model.name);
        
        content += `
            <div class="workflow-model-item ${status}">
                <div class="model-item-header">
                    <div class="model-name">${model.name}</div>
                    <div class="model-status ${status}">
                        ${statusIcon} ${statusText}
                    </div>
                </div>
                <div class="model-details">
                    <div class="model-detail-item">
                        <div class="model-detail-label">Price</div>
                        <div class="model-detail-value">${workflowFormatUsdc(model.price, { minimumFractionDigits: 4, maximumFractionDigits: 6 })} / call</div>
                    </div>
                    <div class="model-detail-item">
                        <div class="model-detail-label">Required Tokens</div>
                        <div class="model-detail-value">${model.tokens}K tokens</div>
                    </div>
                    <div class="model-detail-item">
                        <div class="model-detail-label">Your Tokens</div>
                        <div class="model-detail-value">${userTokens}K tokens</div>
                    </div>
                    <div class="model-detail-item">
                        <div class="model-detail-label">Category</div>
                        <div class="model-detail-value">${modelData ? modelData.category : 'N/A'}</div>
                    </div>
                </div>
        `;
        
        if (modelData) {
            content += `
                <div class="model-details" style="margin-top: 12px;">
                    <div class="model-detail-item">
                        <div class="model-detail-label">Purpose</div>
                        <div class="model-detail-value">${modelData.purpose}</div>
                    </div>
                    <div class="model-detail-item">
                        <div class="model-detail-label">Use Case</div>
                        <div class="model-detail-value">${modelData.useCase}</div>
                    </div>
                    <div class="model-detail-item">
                        <div class="model-detail-label">Industry</div>
                        <div class="model-detail-value">${modelData.industry}</div>
                    </div>
                    <div class="model-detail-item">
                        <div class="model-detail-label">Rating</div>
                        <div class="model-detail-value rating">${modelData.ratingFormatted} ${modelData.starsHtml}</div>
                    </div>
                </div>
            `;
        }
        
        content += `
            </div>
        </div>
        `;
    });
    
    content += `
            </div>
        </div>
        
        <div class="workflow-summary">
            <h4>Workflow Summary</h4>
            <div class="summary-stats">
                <div class="summary-stat">
                    <div class="summary-stat-label">Total Price</div>
                    <div class="summary-stat-value price">${workflowFormatUsdc(workflow.totalPriceUsdc, { minimumFractionDigits: 4, maximumFractionDigits: 6 })}</div>
                </div>
                <div class="summary-stat">
                    <div class="summary-stat-label">Status</div>
                    <div class="summary-stat-value status ${hasSufficientCredits ? 'ready' : 'need-tokens'}">
                        ${hasSufficientCredits ? '✅ Ready to Run' : '⚠️ Need Tokens'}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Update modal content
    document.getElementById('workflowDetailsContent').innerHTML = content;
    
    // Show modal
    document.getElementById('workflowDetailsModal').classList.add('show');
}

// Hide workflow details modal
function hideWorkflowDetailsModal() {
    document.getElementById('workflowDetailsModal').classList.remove('show');
}

// Try workflow with token checking
function tryWorkflow(workflowId) {
    const workflow = workflows.find(w => w.id === workflowId);
    if (!workflow) return;

    const missingTokens = checkMissingTokens(workflow);
    if (missingTokens.length) {
        showTokenPurchaseModal(workflow, missingTokens);
        return;
    }

    loadWorkflowToCanvas(workflow);
}

// Load workflow to canvas
function loadWorkflowToCanvas(workflow) {
    // Get user prompt if exists
    const userPrompt = localStorage.getItem('workflowUserPrompt');
    
    // Save workflow data to localStorage
    const workflowData = {
        id: workflow.id,
        name: workflow.name,
        description: workflow.description,
        models: workflow.models,
        totalPrice: workflow.totalPrice,
        modelCount: workflow.modelCount,
        prepaid: !!workflow.prepaid,
        prepaidAt: workflow.prepaidAt || null,
        prepaidAmountUsdc: workflow.prepaidAmountUsdc || null,
        prepaidModels: workflow.prepaidModels || null,
        lastPaymentTx: workflow.lastPaymentTx || null,
        lastPaymentExplorer: workflow.lastPaymentExplorer || null,
        lastPaymentAt: workflow.lastPaymentAt || null,
        lastPaymentMemo: workflow.lastPaymentMemo || null,
        userPrompt: userPrompt || null,
        status: 'ready',
        createdAt: new Date().toISOString()
    };
    
    localStorage.setItem('selectedWorkflow', JSON.stringify(workflowData));
    
    // Also save to currentWorkflow for index.html compatibility
    const currentWorkflow = {
        name: workflow.name,
        description: workflow.description,
        status: 'running',
        createdAt: new Date().toISOString(),
        prepaid: !!workflow.prepaid,
        prepaidAt: workflow.prepaidAt || null,
        prepaidAmountUsdc: workflow.prepaidAmountUsdc || null,
        prepaidModels: workflow.prepaidModels || null,
        lastPaymentTx: workflow.lastPaymentTx || null,
        lastPaymentExplorer: workflow.lastPaymentExplorer || null,
        lastPaymentAt: workflow.lastPaymentAt || null,
        lastPaymentMemo: workflow.lastPaymentMemo || null,
        userPrompt: userPrompt || null
    };
    localStorage.setItem('currentWorkflow', JSON.stringify(currentWorkflow));
    
    // Clear the prompt after using it
    localStorage.removeItem('workflowUserPrompt');
    
    // Redirect to canvas page
    window.location.href = 'canvas.html';
}

// Prepare workflow execution with user input
function prepareWorkflowExecution() {
    const input = document.getElementById('workflowPromptInput');
    const prompt = input ? input.value.trim() : '';
    
    if (!prompt) {
        alert('Please enter a prompt or question to process with the workflow.');
        if (input) input.focus();
        return;
    }
    
    // Store the prompt for use in workflow execution
    localStorage.setItem('workflowUserPrompt', prompt);
    
    // Scroll to top to show workflows
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Keep the input value until workflow is selected
    // Don't clear immediately - user might want to modify it
    
    // Show a visual indicator that prompt is ready
    showPromptReadyIndicator(prompt);
}

// Show indicator that user prompt is ready
function showPromptReadyIndicator(prompt) {
    // Remove any existing indicator
    const existing = document.querySelector('.prompt-ready-indicator');
    if (existing) existing.remove();
    
    // Create new indicator
    const indicator = document.createElement('div');
    indicator.className = 'prompt-ready-indicator';
    indicator.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 12l2 2 4-4"/>
                <circle cx="12" cy="12" r="10"/>
            </svg>
            <div style="flex: 1;">
                <div style="font-weight: 600; color: #10b981; margin-bottom: 4px;">Prompt Ready</div>
                <div style="font-size: 13px; color: #6b7280; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${prompt}</div>
            </div>
            <button onclick="clearWorkflowPrompt()" style="padding: 6px 12px; border: 1px solid #e5e7eb; border-radius: 8px; background: #fff; color: #6b7280; cursor: pointer; font-size: 13px;">Clear</button>
        </div>
    `;
    
    // Insert after search section
    const searchSection = document.querySelector('.search-filter-section');
    if (searchSection) {
        searchSection.insertAdjacentElement('afterend', indicator);
    }
}

// Clear workflow prompt
function clearWorkflowPrompt() {
    localStorage.removeItem('workflowUserPrompt');
    const indicator = document.querySelector('.prompt-ready-indicator');
    if (indicator) indicator.remove();
    
    // Clear input field
    const input = document.getElementById('workflowPromptInput');
    if (input) input.value = '';
}

// Check if prompt exists on page load and show indicator
document.addEventListener('DOMContentLoaded', function() {
    // Ensure input section is always visible
    const inputSection = document.querySelector('.workflow-input-section');
    if (inputSection) {
        inputSection.style.display = 'block';
        inputSection.style.visibility = 'visible';
    }
    
    const savedPrompt = localStorage.getItem('workflowUserPrompt');
    if (savedPrompt) {
        showPromptReadyIndicator(savedPrompt);
        // Restore saved prompt to input
        const input = document.getElementById('workflowPromptInput');
        if (input) {
            input.value = savedPrompt;
        }
    }
    
    // Add Enter key support for input
    const input = document.getElementById('workflowPromptInput');
    if (input) {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                prepareWorkflowExecution();
            }
        });
    }
});

// Export functions for global access
window.filterWorkflows = filterWorkflows;
window.showWorkflowDetails = showWorkflowDetails;
window.hideWorkflowDetailsModal = hideWorkflowDetailsModal;
window.tryWorkflow = tryWorkflow;
window.hideTokenPurchaseModal = hideTokenPurchaseModal;
window.prepareWorkflowExecution = prepareWorkflowExecution;
window.clearWorkflowPrompt = clearWorkflowPrompt;

function generateWorkflowPaymentRequestId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return 'wf-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function generateWorkflowPaymentNonce() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return 'wf-nonce-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

async function settleWorkflowInvoice(totalCost, workflow, requestId) {
    const client = window.MCPClient;
    if (!client || typeof client.settleInvoice !== 'function') {
        throw new Error('402 payment client unavailable. Please ensure MCP client is loaded.');
    }

    const normalizedAmount = Number(totalCost.toFixed(6));
    const appConfig = window.APP_CONFIG || {};
    const sol = appConfig.solana || {};
    if (!sol.merchantAddress || !sol.usdcMint || !sol.rpcEndpoint) {
        throw new Error('Solana payment configuration is incomplete.');
    }
    const decimals = Number(sol.usdcDecimals || 6);
    const explorerBase =
        (appConfig.mcp && appConfig.mcp.receiptExplorerBaseUrl) ||
        `https://explorer.solana.com/tx?cluster=${encodeURIComponent(sol.cluster || 'devnet')}`;

    const invoice = {
        status: 'payment_required',
        request_id: requestId,
        nonce: generateWorkflowPaymentNonce(),
        amount_usdc: normalizedAmount,
        currency: 'USDC',
        recipient: sol.merchantAddress,
        mint: sol.usdcMint,
        decimals,
        memo: requestId,
        description: `Workflow token purchase: ${workflow.name}`,
        rpc_endpoint: sol.rpcEndpoint,
        explorer_base_url: explorerBase
    };

    const logStatus =
        client && typeof client.logStatus === 'function'
            ? client.logStatus.bind(client)
            : null;

    logStatus?.('invoice', `Workflow payment request: ${workflow.name}`, {
        amount: normalizedAmount.toFixed(6),
        memo: requestId,
        description: 'Processing workflow checkout'
    });

    try {
        const signature = await client.settleInvoice(invoice);
        if (!signature) {
            logStatus?.('cancel', 'Workflow payment cancelled by user', {
                amount: normalizedAmount.toFixed(6),
                memo: requestId
            });
            return { success: false, cancelled: true };
        }

        let explorerUrl = `https://explorer.solana.com/tx/${encodeURIComponent(
            signature
        )}?cluster=${encodeURIComponent(sol.cluster || 'devnet')}`;
        if (invoice.explorer_base_url) {
            if (invoice.explorer_base_url.includes('?')) {
                const [prefix, query] = invoice.explorer_base_url.split('?');
                explorerUrl = `${prefix.replace(/\/$/, '')}/${encodeURIComponent(
                    signature
                )}?${query}`;
            } else {
                explorerUrl = `${invoice.explorer_base_url.replace(/\/$/, '')}/${encodeURIComponent(
                    signature
                )}`;
            }
        }

        return {
            success: true,
            signature,
            explorer: explorerUrl
        };
    } catch (error) {
        logStatus?.('cancel', `Workflow payment failed: ${error?.message || error}`, {
            amount: normalizedAmount.toFixed(6),
            memo: requestId
        });
        throw error;
    }
}

function showWorkflowExplorerToast(signature, amount, explorerUrlOverride) {
    try {
        if (!signature) return;
        const existing = document.getElementById('workflow-payment-toast');
        if (existing) existing.remove();
        const toast = document.createElement('div');
        toast.id = 'workflow-payment-toast';
        toast.className = 'workflow-payment-toast';
        const explorerUrl = explorerUrlOverride || `https://explorer.solana.com/tx/${encodeURIComponent(signature)}?cluster=devnet`;
        toast.innerHTML = `
            <button class="workflow-payment-toast__close" aria-label="Dismiss">×</button>
            <h4>Workflow Payment Settled</h4>
            <p>Amount: <strong>${Number(amount).toFixed(6)} USDC</strong></p>
            <a href="${explorerUrl}" target="_blank" rel="noopener noreferrer">View on Solana Explorer →</a>
        `;
        const close = toast.querySelector('.workflow-payment-toast__close');
        if (close) close.addEventListener('click', () => toast.remove());
        document.body.appendChild(toast);
        setTimeout(() => {
            try { toast.remove(); } catch (_) {}
        }, 12000);
    } catch (err) {
        console.warn('Failed to show explorer toast', err);
    }
}

function offerCanvasNavigation(workflow) {
    try {
        const existing = document.getElementById('workflow-run-modal');
        if (existing) existing.remove();
        const modal = document.createElement('div');
        modal.id = 'workflow-run-modal';
        modal.className = 'workflow-run-modal';
        
        // Build explorer link section if transaction data is available
        let explorerSection = '';
        if (workflow.lastPaymentTx && workflow.lastPaymentExplorer) {
            const shortTx = `${workflow.lastPaymentTx.slice(0, 8)}...${workflow.lastPaymentTx.slice(-8)}`;
            explorerSection = `
                <div class="workflow-run-modal__explorer">
                    <p style="margin: 12px 0 8px; font-size: 13px; color: #94a3b8;">
                        <strong>Payment Transaction:</strong>
                    </p>
                    <a href="${workflow.lastPaymentExplorer}" 
                       target="_blank" 
                       rel="noopener noreferrer"
                       class="workflow-run-modal__solscan-link"
                       title="View on Solana Explorer">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 6px;">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                            <polyline points="15 3 21 3 21 9"/>
                            <line x1="10" y1="14" x2="21" y2="3"/>
                        </svg>
                        ${shortTx}
                    </a>
                    <p style="margin: 8px 0 0; font-size: 12px; color: #64748b;">
                        ${workflow.prepaidAmountUsdc ? `Amount: ${workflow.prepaidAmountUsdc.toFixed(6)} USDC` : ''}
                    </p>
                </div>
            `;
        }
        
        modal.innerHTML = `
            <div class="workflow-run-modal__content">
                <button class="workflow-run-modal__close" aria-label="Close">×</button>
                <h3>Workflow Ready</h3>
                <p>Your workflow <strong>${workflow.name}</strong> is paid and ready to execute.</p>
                ${explorerSection}
                <p style="margin-top: 16px;">Would you like to open it on the canvas to review or run the pipeline now?</p>
                <div class="workflow-run-modal__actions">
                    <button type="button" class="workflow-run-modal__later">Maybe Later</button>
                    <button type="button" class="workflow-run-modal__open">Open Canvas</button>
                </div>
            </div>
        `;
        const close = () => modal.remove();
        modal.querySelector('.workflow-run-modal__close').addEventListener('click', close);
        modal.querySelector('.workflow-run-modal__later').addEventListener('click', close);
        modal.querySelector('.workflow-run-modal__open').addEventListener('click', () => {
            try { loadWorkflowToCanvas(workflow); }
            finally { close(); }
        });
        document.body.appendChild(modal);
    } catch (err) {
        console.warn('Failed to show canvas navigation modal', err);
        loadWorkflowToCanvas(workflow);
    }
}