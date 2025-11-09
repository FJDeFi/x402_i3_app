// My Assets Page JavaScript - Updated for new data structure
console.log('📊 Loading My Assets page...');

// ========== DATA FUNCTIONS ==========

// Get purchased items from localStorage (new structure)
function getMyAssets() {
    try {
        const rawData = localStorage.getItem('myAssets');
        console.log('🔍 Raw myAssets data from localStorage:', rawData);
        
        const myAssets = JSON.parse(rawData) || {
            tokens: [],
            shares: [],
            history: []
        };
        
        console.log('📦 Parsed my assets from localStorage:', myAssets);
        console.log('📊 Tokens count:', myAssets.tokens.length);
        console.log('📊 Shares count:', myAssets.shares.length);
        console.log('📊 History count:', myAssets.history.length);
        
        // Log individual items for debugging
        if (myAssets.tokens.length > 0) {
            console.log('🪙 Token items:', myAssets.tokens);
        }
        if (myAssets.shares.length > 0) {
            console.log('📈 Share items:', myAssets.shares);
        }
        
        return myAssets;
    } catch (error) {
        console.error('❌ Error loading my assets:', error);
        return { tokens: [], shares: [], history: [] };
    }
}

// 获取用户的私人 workflows
function getMyWorkflows() {
    try {
        const workflows = JSON.parse(localStorage.getItem('myWorkflows')) || [];
        console.log('📋 Loaded user workflows:', workflows);
        return workflows;
    } catch (error) {
        console.error('⚠ Error loading workflows:', error);
        return [];
    }
}

// ========== CALCULATION FUNCTIONS ==========

// Calculate estimated uses for tokens (assuming 1 token = ~100 uses)
function calculateEstimatedUses(tokenQuantity) {
    return Math.floor(tokenQuantity * 100);
}

// Calculate pool ownership percentage (random for demo)
function calculatePoolOwnership(modelName, sharesOwned) {
    // In a real implementation, this would be calculated based on total shares in circulation
    const totalShares = Math.floor(Math.random() * 10000) + 1000; // Mock total shares
    const ownership = (sharesOwned / totalShares) * 100;
    return ownership.toFixed(2);
}

// Calculate total tokens owned and total i3 tokens spent
function calculateTokenStats() {
    const myAssets = getMyAssets();
    let totalTokensK = 0;
    let totalI3Spent = 0;
    
    myAssets.tokens.forEach(token => {
        totalTokensK += token.quantity;
        const modelData = getModelData(token.modelName);
        if (modelData) {
            totalI3Spent += modelData.tokenPrice * token.quantity;
        }
    });
    
    return { totalTokensK, totalI3Spent };
}

// Calculate total shares and profit/loss
function calculateShareStats() {
    const myAssets = getMyAssets();
    let totalShares = 0;
    let totalShareValue = 0;
    let totalShareCost = 0;
    
    myAssets.shares.forEach(share => {
        totalShares += share.quantity;
        const modelData = getModelData(share.modelName);
        if (modelData) {
            const currentValue = modelData.sharePrice * share.quantity;
            const purchaseValue = (modelData.sharePrice / (1 + modelData.change / 100)) * share.quantity; // Estimate purchase price
            totalShareValue += currentValue;
            totalShareCost += purchaseValue;
        }
    });
    
    const profitLoss = totalShareValue - totalShareCost;
    const profitLossPercent = totalShareCost > 0 ? (profitLoss / totalShareCost) * 100 : 0;
    
    return { totalShares, totalShareValue, profitLoss, profitLossPercent };
}

// ========== UPDATE DISPLAY FUNCTIONS ==========

// 更新 I3 Token 余额显示
function updateI3TokenBalance() {
    const i3BalanceElement = document.getElementById('i3TokenBalance');
    
    if (i3BalanceElement) {
        if (window.walletManager) {
            const userInfo = window.walletManager.getUserInfo();
            const balance = userInfo.isConnected ? userInfo.credits : 0;
            console.log('🧮 MyAssets balance render - using walletManager.credits:', balance);
            i3BalanceElement.innerHTML = `${balance} <img src="svg/i3-token-logo.svg" class="token-logo" alt="i3">`;
        } else {
            i3BalanceElement.innerHTML = `0 <img src="svg/i3-token-logo.svg" class="token-logo" alt="i3">`;
        }
    }
}

// Update overview cards with detailed information
function updateOverview() {
    const myAssets = getMyAssets();
    const tokenStats = calculateTokenStats();
    const shareStats = calculateShareStats();
    
    // Update Total Token Value card with detailed info
    const totalTokenValueK = tokenStats.totalI3Spent.toFixed(2); // Keep original value, just add K suffix
    document.getElementById('totalTokenValue').innerHTML = `
        ${tokenStats.totalTokensK}K tokens
        <small>Value: ${totalTokenValueK}K <img src="svg/i3-token-logo.svg" class="token-logo" alt="i3"></small>
    `;
    
    // Update Total Share Value card with detailed info
    const shareChangeClass = shareStats.profitLoss >= 0 ? 'positive' : 'negative';
    const shareChangeSymbol = shareStats.profitLoss >= 0 ? '+' : '';
    const totalShareValueK = shareStats.totalShareValue.toFixed(2); // Keep original value, just add K suffix
    
    document.getElementById('totalShareValue').innerHTML = `
        ${shareStats.totalShares} shares
        <small>Value: ${totalShareValueK}K <img src="svg/i3-token-logo.svg" class="token-logo" alt="i3"></small>
    `;
    // Remove share change display
    document.getElementById('totalShareChange').style.display = 'none';
    
    // Remove token change display (tokens don't fluctuate like shares)
    document.getElementById('totalTokenChange').style.display = 'none';
    
    // Update I3 Token balance
    updateI3TokenBalance();
}

// Update tokens display (removed trade and sell buttons)
function updateTokensDisplay() {
    const myAssets = getMyAssets();
    const tokensTableBody = document.getElementById('tokensTableBody');
    const emptyTokens = document.getElementById('emptyTokens');
    const tokensTable = document.getElementById('tokensTable');
    
    if (myAssets.tokens.length === 0) {
        emptyTokens.style.display = 'block';
        tokensTable.style.display = 'none';
        return;
    }
    
    emptyTokens.style.display = 'none';
    tokensTable.style.display = 'block';
    
    tokensTableBody.innerHTML = '';
    
    myAssets.tokens.forEach(token => {
        const modelData = getModelData(token.modelName);
        if (!modelData) return;
        
        const estimatedUses = calculateEstimatedUses(token.quantity);
        const totalValue = modelData.tokenPrice * token.quantity;
        
        const totalValueK = totalValue.toFixed(2); // Keep original value, just add K suffix
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="model-info">
                    <div class="model-name">${token.modelName}</div>
                </div>
            </td>
            <td><span class="category">${token.category}</span></td>
            <td><strong>${token.quantity}K</strong></td>
            <td><span class="estimated-uses">${estimatedUses.toLocaleString()} uses</span></td>
            <td>${modelData.tokenPrice.toFixed(2)} <img src="svg/i3-token-logo.svg" class="token-logo" alt="i3"></td>
            <td><strong>${totalValueK}K <img src="svg/i3-token-logo.svg" class="token-logo" alt="i3"></strong></td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn use-btn" onclick="useTokens('${token.modelName}')">Use</button>
                </div>
            </td>
        `;
        tokensTableBody.appendChild(row);
    });
}

// Update shares display
function updateSharesDisplay() {
    const myAssets = getMyAssets();
    const sharesTableBody = document.getElementById('sharesTableBody');
    const emptyShares = document.getElementById('emptyShares');
    const sharesTable = document.getElementById('sharesTable');
    
    if (myAssets.shares.length === 0) {
        emptyShares.style.display = 'block';
        sharesTable.style.display = 'none';
        return;
    }
    
    emptyShares.style.display = 'none';
    sharesTable.style.display = 'block';
    
    sharesTableBody.innerHTML = '';
    
    myAssets.shares.forEach(share => {
        const modelData = getModelData(share.modelName);
        if (!modelData) return;
        
        const poolOwnership = calculatePoolOwnership(share.modelName, share.quantity);
        const totalValue = modelData.sharePrice * share.quantity;
        const changeClass = modelData.change >= 0 ? 'positive' : 'negative';
        const changeSymbol = modelData.change >= 0 ? '+' : '';
        
        const totalValueK = totalValue.toFixed(2); // Keep original value, just add K suffix
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="model-info">
                    <div class="model-name">${share.modelName}</div>
                </div>
            </td>
            <td><span class="category">${share.category}</span></td>
            <td><strong>${share.quantity}</strong></td>
            <td>${modelData.sharePrice.toFixed(2)}K <img src="svg/i3-token-logo.svg" class="token-logo" alt="i3"></td>
            <td><span class="market-change ${changeClass}">${changeSymbol}${modelData.change.toFixed(2)}%</span></td>
            <td><span class="pool-ownership">${poolOwnership}%</span></td>
            <td><strong>${totalValueK}K <img src="svg/i3-token-logo.svg" class="token-logo" alt="i3"></strong></td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn use-btn" onclick="useShares('${share.modelName}')">Use</button>
                    <button class="action-btn trade-btn" onclick="tradeShares('${share.modelName}')">Trade</button>
                    <button class="action-btn sell-btn" onclick="sellShares('${share.modelName}')">Sell</button>
                </div>
            </td>
        `;
        sharesTableBody.appendChild(row);
    });
}

// 更新 workflows 显示
function updateWorkflowsDisplay() {
    const myWorkflows = getMyWorkflows();
    const workflowsTableBody = document.getElementById('workflowsTableBody');
    const emptyWorkflows = document.getElementById('emptyWorkflows');
    const workflowsTable = document.getElementById('workflowsTable');
    
    if (myWorkflows.length === 0) {
        emptyWorkflows.style.display = 'block';
        workflowsTable.style.display = 'none';
        return;
    }
    
    emptyWorkflows.style.display = 'none';
    workflowsTable.style.display = 'block';
    
    workflowsTableBody.innerHTML = '';
    
    myWorkflows.forEach(workflow => {
        const createdDate = new Date(workflow.createdAt).toLocaleDateString();
        const modifiedDate = new Date(workflow.lastModified).toLocaleDateString();
        // 优化模型显示 - 限制长度并添加省略号
        let modelsUsed = 'None';
        if (workflow.models && workflow.models.length > 0) {
            const modelsList = workflow.models.join(', ');
            if (modelsList.length > 15) {
                modelsUsed = modelsList.substring(0, 15) + '...';
            } else {
                modelsUsed = modelsList;
            }
            // 添加模型数量提示
            if (workflow.models.length > 1) {
                modelsUsed += ` (${workflow.models.length} models)`;
            }
        }
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="model-info">
                    <div class="model-name">${workflow.name}</div>
                    <div class="model-details">${workflow.description || 'No description'}</div>
                </div>
            </td>
            <td><span class="workflow-models" title="${workflow.models ? workflow.models.join(', ') : 'None'}">${modelsUsed}</span></td>
            <td>${createdDate}</td>
            <td>${modifiedDate}</td>
            <td><span class="workflow-status ${workflow.status || 'draft'}">${workflow.status || 'Draft'}</span></td>
            <td><span class="privacy-badge">Private</span></td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn use-btn" onclick="editWorkflow('${workflow.id}')">Edit</button>
                    <button class="action-btn trade-btn" onclick="runWorkflow('${workflow.id}')">Run</button>
                    <button class="action-btn sell-btn" onclick="deleteWorkflow('${workflow.id}')">Delete</button>
                </div>
            </td>
        `;
        workflowsTableBody.appendChild(row);
    });
}

// ========== USER INTERACTION FUNCTIONS ==========

// Tab switching functionality
function showTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(tabName + 'Tab').classList.add('active');
    
    // 根据不同标签页更新对应数据
    if (tabName === 'workflows') {
        updateWorkflowsDisplay();
    }
    
    console.log(`📋 Switched to ${tabName} tab`);
}

// ========== ACTION FUNCTIONS - TOKENS ==========

// Action functions for tokens
function useTokens(modelName) {
    const confirmed = confirm(`Are you sure you want to use tokens for ${modelName}?`);
    if (confirmed) {
        // Set current model and redirect to index.html for usage
        const modelData = getModelData(modelName);
        if (modelData) {
            localStorage.setItem('currentModel', JSON.stringify({
                name: modelName,
                category: modelData.category,
                industry: modelData.industry,
                purpose: modelData.purpose,
                useCase: modelData.useCase
            }));
            
            // Set auto router off and create running workflow
            localStorage.setItem('autoRouter', 'off');
            localStorage.setItem('currentWorkflow', JSON.stringify({
                name: modelName,
                status: 'running',
                startedAt: new Date().toISOString()
            }));
            
            // Redirect to index.html
            window.location.href = 'index.html?tryModel=' + encodeURIComponent(modelName);
        } else {
            alert(`❌ Model data not found for ${modelName}`);
        }
    }
}

// ========== ACTION FUNCTIONS - SHARES ==========

// Action functions for shares
function useShares(modelName) {
    const confirmed = confirm(`Are you sure you want to use shares for ${modelName}?`);
    if (confirmed) {
        alert(`✅ Using shares for ${modelName}. Accessing premium features...`);
        // In a real implementation, this would unlock premium features
    }
}

function tradeShares(modelName) {
    const confirmed = confirm(`Are you sure you want to trade shares for ${modelName}?`);
    if (confirmed) {
        alert(`📊 Trading shares for ${modelName}. Opening trading interface...`);
        // In a real implementation, this would open a trading interface
    }
}

function sellShares(modelName) {
    const confirmed = confirm(`Are you sure you want to sell shares for ${modelName}?`);
    if (confirmed) {
        alert(`💰 Selling shares for ${modelName}. Processing sale...`);
        // In a real implementation, this would process the sale
        updateSharesDisplay();
        updateOverview();
    }
}

// ========== ACTION FUNCTIONS - WORKFLOWS ==========

// Workflow 操作函数
function editWorkflow(workflowId) {
    localStorage.setItem('editWorkflowId', workflowId);
    window.location.href = 'canvas.html?edit=' + encodeURIComponent(workflowId);
}

function runWorkflow(workflowId) {
    const confirmed = confirm(`Are you sure you want to run this workflow?`);
    if (confirmed) {
        localStorage.setItem('runWorkflowId', workflowId);
        window.location.href = 'index.html?workflow=' + encodeURIComponent(workflowId);
    }
}

function deleteWorkflow(workflowId) {
    const confirmed = confirm(`Are you sure you want to delete this workflow? This action cannot be undone.`);
    if (confirmed) {
        let workflows = getMyWorkflows();
        workflows = workflows.filter(w => w.id !== workflowId);
        localStorage.setItem('myWorkflows', JSON.stringify(workflows));
        updateWorkflowsDisplay();
        console.log('🗑️ Workflow deleted:', workflowId);
    }
}

// ========== UTILITY FUNCTIONS ==========

// Clear all assets function (for testing purposes)
function clearAllAssets() {
    const confirmed = confirm('⚠️ Are you sure you want to clear ALL assets? This action cannot be undone and is for testing purposes only.');
    if (confirmed) {
        try {
            // Clear myAssets from localStorage
            localStorage.removeItem('myAssets');
            
            // Also clear cart items if they exist
            localStorage.removeItem('cartItems');
            
            // Clear any other related data
            localStorage.removeItem('currentModel');
            localStorage.removeItem('currentWorkflow');
            
            console.log('🗑️ All assets cleared successfully');
            
            // Show success message
            alert('✅ All assets have been cleared successfully!');
            
            // Refresh the page to show empty state
            window.location.reload();
        } catch (error) {
            console.error('❌ Error clearing assets:', error);
            alert('❌ Error clearing assets. Please try again.');
        }
    }
}

// ========== INITIALIZATION ==========

// Initialize page with enhanced debugging
document.addEventListener('DOMContentLoaded', function() {
    console.log('📊 Initializing My Assets page...');
    console.log('🔍 Checking dependencies:');
    console.log('- MODEL_DATA:', typeof MODEL_DATA !== 'undefined' ? '✅ Available' : '❌ Missing');
    console.log('- getModelData:', typeof getModelData === 'function' ? '✅ Available' : '❌ Missing');
    
    const myAssets = getMyAssets();
    console.log('📦 My Assets data:', myAssets);
    
    // If wallet session exists, refresh from Firestore once so backend edits reflect
    try {
        if (window.walletManager && window.walletManager.isConnected && typeof window.walletManager.fetchRemoteWalletDataIfAvailable === 'function') {
            window.walletManager.fetchRemoteWalletDataIfAvailable().then(() => {
                updateOverview();
            });
        }
    } catch (e) { console.warn('Remote hydrate skipped:', e); }

    // Update all displays
    updateOverview();
    updateTokensDisplay();
    updateSharesDisplay();
    updateWorkflowsDisplay(); 
    
    console.log('✅ My Assets page loaded successfully');

    // Also listen for wallet events to refresh balance
    window.addEventListener('walletConnected', () => {
        console.log('🔔 walletConnected received on MyAssets');
        updateOverview();
    });
    window.addEventListener('walletUpdated', () => {
        console.log('🔔 walletUpdated received on MyAssets');
        updateOverview();
    });

    // After a short delay, fetch Firestore wallet doc and log/align credits
    setTimeout(async () => {
        try {
            if (window.firebaseDb && window.walletManager && window.walletManager.walletAddress) {
                const address = (window.walletManager.walletAddress || '').toLowerCase();
                const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
                let ref = doc(window.firebaseDb, 'wallets', address);
                let snap = await getDoc(ref);
                if (!snap.exists()) {
                    ref = doc(window.firebaseDb, 'wallets', window.walletManager.walletAddress);
                    snap = await getDoc(ref);
                }
                if (snap.exists()) {
                    const data = snap.data() || {};
                    const remoteCredits = Number(data.credits || 0);
                    const localCredits = Number(window.walletManager.credits || 0);
                    console.log('📡 Firestore credits:', remoteCredits, '| Local credits:', localCredits);
                    if (remoteCredits !== localCredits) {
                        window.walletManager.credits = remoteCredits;
                        try { window.walletManager.saveToStorage(); } catch (_) {}
                        updateOverview();
                        try { window.dispatchEvent(new CustomEvent('walletUpdated', { detail: { address: window.walletManager.walletAddress, credits: remoteCredits } })); } catch (_) {}
                    }
                } else {
                    console.log('📭 No wallet doc found in Firestore for current address');
                }
            }
        } catch (e) {
            console.warn('⚠️ Firestore credit fetch on MyAssets failed:', e);
        }
    }, 300);
});

// React to wallet updates
window.addEventListener('walletUpdated', () => {
    updateOverview();
});