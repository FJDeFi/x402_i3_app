// Workflow Page JavaScript

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

// Current user's assets (from myAssets localStorage)
let userAssets = {};

// Helper: get current wallet credits (I3 balance)
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
        tokens: userInfo.credits, // 这里是I3 tokens余额
        error: userInfo.isConnected ? null : 'Please connect your wallet first'
    };
}

// 验证用户是否有足够的I3 tokens - 复制自mycart.js
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
            error: `Insufficient I3 tokens. You need ${totalCost} I3 tokens but only have ${walletStatus.tokens} I3 tokens.`,
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
    
    // Readiness based on wallet credits vs total workflow price
    const hasSufficientCredits = getWalletCredits() >= Number(workflow.totalPrice || 0);
    
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
                <span class="metric-label">Price Per 1K Tokens (i3)</span>
                <span class="metric-value price">${workflow.totalPrice.toFixed(3)}</span>
            </div>
            <div class="metric-item">
                <span class="metric-label">Models</span>
                <span class="metric-value models">${workflow.modelCount}</span>
            </div>
            <div class="metric-item ${hasSufficientCredits ? 'status-ok' : 'status-warning'}">
                <span class="metric-label">Token Status</span>
                <span class="metric-value status">
                    ${hasSufficientCredits ? '✅ Ready' : '⚠️ Need Tokens'}
                </span>
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
            <button class="action-btn try-now ${hasSufficientCredits ? '' : 'disabled'}" onclick="tryWorkflow(${workflow.id})">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="5,3 19,12 5,21"/>
                </svg>
                ${hasSufficientCredits ? 'Try Now' : 'Buy Tokens'}
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
            <div class="token-price">${token.cost.toFixed(3)} i3</div>
        `;
        tokenList.appendChild(tokenItem);
    });
    
    totalCostElement.textContent = `${totalCost.toFixed(3)} i3`;
    
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
function placeOrder() {
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
    
    // 3. 验证支付能力
    const paymentValidation = validatePayment(totalCost);
    if (!paymentValidation.valid) {
        alert(`❌ Payment Failed!\n\n${paymentValidation.error}\n\n💡 Tip: Get more I3 tokens by doing daily check-ins (+30 I3 tokens per day)!\n\nTransaction cancelled.`);
        return;
    }
    
    // 4. 扣除I3 tokens
    const spendResult = window.walletManager.spendCredits(totalCost, 'workflow_tokens_purchase');
    if (!spendResult.success) {
        alert(`❌ Payment Processing Failed!\n\n${spendResult.error}\n\nTransaction cancelled.`);
        return;
    }
    
    // 5. 更新用户资产 (添加购买的tokens)
    missingTokens.forEach(token => {
        userAssets[token.name] = (userAssets[token.name] || 0) + token.required;
    });
    
    // 6. 保存到localStorage
    updateUserAssetsInStorage();
    
    // 7. 显示成功消息
    alert(`🎉 Tokens Purchase Successful!\n\n💳 Payment: ${totalCost.toFixed(3)} I3 tokens\n📊 Workflow: ${workflow.name}\n🎯 Models: ${workflow.modelCount}\n\n💰 Remaining Balance: ${spendResult.newBalance} I3 tokens\n\n✅ Tokens have been added to your account.\nThank you for your purchase!`);
    
    // 8. Hide modal
    hideTokenPurchaseModal();
    
    // 9. Refresh workflow display
    displayWorkflows(workflows);
    
    // 10. Load workflow to canvas
    loadWorkflowToCanvas(workflow);
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
                        <div class="model-detail-value">${model.price} i3/1K tokens</div>
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
                    <div class="summary-stat-value price">${workflow.totalPrice.toFixed(3)} i3</div>
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
    
    // New rule: allow run if credits >= total price
    const walletStatus = checkWalletConnection();
    if (!walletStatus.connected) {
        alert('⚠️ Please connect your MetaMask wallet first to run workflows.\n\nClick "Login" → "Connect Wallet"');
        return;
    }

    const credits = getWalletCredits();
    if (credits < Number(workflow.totalPrice || 0)) {
        alert(`⚠️ Need Tokens\n\nRequired: ${Number(workflow.totalPrice || 0).toFixed(3)} I3\nAvailable: ${credits.toFixed(3)} I3\n\nTip: Do daily check-ins (+30 I3) or add funds.`);
        return;
    }

    loadWorkflowToCanvas(workflow);
}

// Load workflow to canvas
function loadWorkflowToCanvas(workflow) {
    // Save workflow data to localStorage
    const workflowData = {
        id: workflow.id,
        name: workflow.name,
        description: workflow.description,
        models: workflow.models,
        totalPrice: workflow.totalPrice,
        modelCount: workflow.modelCount,
        status: 'ready',
        createdAt: new Date().toISOString()
    };
    
    localStorage.setItem('selectedWorkflow', JSON.stringify(workflowData));
    
    // Also save to currentWorkflow for index.html compatibility
    const currentWorkflow = {
        name: workflow.name,
        description: workflow.description,
        status: 'running',
        createdAt: new Date().toISOString()
    };
    localStorage.setItem('currentWorkflow', JSON.stringify(currentWorkflow));
    
    // Redirect to canvas page
    window.location.href = 'canvas.html';
}

// Export functions for global access
window.filterWorkflows = filterWorkflows;
window.showWorkflowDetails = showWorkflowDetails;
window.hideWorkflowDetailsModal = hideWorkflowDetailsModal;
window.tryWorkflow = tryWorkflow;
window.hideTokenPurchaseModal = hideTokenPurchaseModal;
window.placeOrder = placeOrder;