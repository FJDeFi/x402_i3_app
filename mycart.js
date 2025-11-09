// 🛒 MyCart页面 - 购物车功能 (修复版 - 添加真正的支付验证)
console.log('🛒 加载 MyCart 页面...');

// 购物车数据存储
let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('📦 MyCart页面初始化');
    updateCartDisplay();
    updateCartSummary();
});

// 检查用户是否已连接钱包
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

// 验证用户是否有足够的I3 tokens
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

// 更新购物车显示
function updateCartDisplay() {
    const emptyCart = document.getElementById('emptyCart');
    const cartItems = document.getElementById('cartItems');
    const clearCartBtn = document.getElementById('clearCartBtn');
    
    if (getCartItems().length === 0) {
        emptyCart.style.display = 'block';
        cartItems.style.display = 'none';
        clearCartBtn.style.display = 'none';
    } else {
        emptyCart.style.display = 'none';
        cartItems.style.display = 'block';
        clearCartBtn.style.display = 'flex';
        populateCartTable();
    }
}

// 获取购物车商品
function getCartItems() {
    return JSON.parse(localStorage.getItem('cartItems')) || [];
}

// 保存购物车商品
function saveCartItems(items) {
    localStorage.setItem('cartItems', JSON.stringify(items));
}

// 添加商品到购物车
function addToCartStorage(modelName, tokenQuantity = 1, shareQuantity = 0) {
    const modelData = getModelData(modelName);
    if (!modelData) {
        console.error('⚠ 模型数据未找到:', modelName);
        return false;
    }

    let cartItems = getCartItems();
    const existingItem = cartItems.find(item => item.modelName === modelName);

    if (existingItem) {
        existingItem.tokenQuantity = (existingItem.tokenQuantity || 0) + tokenQuantity;
        existingItem.shareQuantity = (existingItem.shareQuantity || 0) + shareQuantity;
    } else {
        cartItems.push({
            modelName: modelName,
            tokenQuantity: tokenQuantity,
            shareQuantity: shareQuantity,
            addedAt: new Date().toISOString()
        });
    }

    saveCartItems(cartItems);
    console.log('✅ 商品已添加到购物车:', modelName, 'Tokens:', tokenQuantity, 'Shares:', shareQuantity);
    return true;
}

// 填充购物车表格
function populateCartTable() {
    const tableBody = document.getElementById('cartTableBody');
    const cartItems = getCartItems();

    if (!tableBody) {
        console.error('⚠ 未找到购物车表格');
        return;
    }

    tableBody.innerHTML = '';

    cartItems.forEach((item, index) => {
        const modelData = getModelData(item.modelName);
        if (!modelData) {
            console.warn('⚠️ 模型数据未找到:', item.modelName);
            return;
        }

        const modelName = item.modelName;
        const tokenQuantity = item.tokenQuantity || 0;
        const shareQuantity = item.shareQuantity || 0;
        
        const tokenSubtotal = (modelData.tokenPrice * tokenQuantity).toFixed(2);
        const shareSubtotal = (modelData.sharePrice * shareQuantity).toFixed(2);

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="model-info">
                    <div class="model-name">${modelName}</div>
                    <div class="model-details">Total Score: ${modelData.totalScore}% | Compatibility: ${modelData.compatibility}</div>
                </div>
            </td>
            <td>
                <div class="cart-category">${modelData.category}</div>
            </td>
            <td class="price-display">
                <div class="purchase-option">
                    <div class="price-info">${modelData.tokenPrice}/K<img src="svg/i3-token-logo.svg" class="token-logo" alt="i3"></div>
                    <div class="quantity-controls">
                        <button class="quantity-btn" onclick="updateTokenQuantity(${index}, ${tokenQuantity - 1})" ${tokenQuantity <= 0 ? 'disabled' : ''}>−</button>
                        <input type="number" class="quantity-input" value="${tokenQuantity}" min="0" max="999" 
                               onchange="updateTokenQuantity(${index}, parseInt(this.value))" 
                               onkeypress="if(event.key==='Enter') updateTokenQuantity(${index}, parseInt(this.value))">
                        <button class="quantity-btn" onclick="updateTokenQuantity(${index}, ${tokenQuantity + 1})" ${tokenQuantity >= 999 ? 'disabled' : ''}>+</button>
                    </div>
                    <div class="subtotal-small">Subtotal: ${tokenSubtotal}<img src="svg/i3-token-logo.svg" class="token-logo" alt="i3"></div>
                </div>
            </td>
            <td class="price-display">
                <div class="purchase-option">
                    <div class="price-info">${modelData.sharePrice}K<img src="svg/i3-token-logo.svg" class="token-logo" alt="i3"></div>
                    <div class="quantity-controls">
                        <button class="quantity-btn" onclick="updateShareQuantity(${index}, ${shareQuantity - 1})" ${shareQuantity <= 0 ? 'disabled' : ''}>−</button>
                        <input type="number" class="quantity-input" value="${shareQuantity}" min="0" max="999" 
                               onchange="updateShareQuantity(${index}, parseInt(this.value))" 
                               onkeypress="if(event.key==='Enter') updateShareQuantity(${index}, parseInt(this.value))">
                        <button class="quantity-btn" onclick="updateShareQuantity(${index}, ${shareQuantity + 1})" ${shareQuantity >= 999 ? 'disabled' : ''}>+</button>
                    </div>
                    <div class="subtotal-small">Subtotal: ${shareSubtotal}K<img src="svg/i3-token-logo.svg" class="token-logo" alt="i3"></div>
                </div>
            </td>
            <td class="total-subtotal">
                <div class="total-amount">${(parseFloat(tokenSubtotal) + parseFloat(shareSubtotal) * 1000).toFixed(2)}<img src="svg/i3-token-logo.svg" class="token-logo" alt="i3"></div>
            </td>
            <td>
                <button class="remove-btn" onclick="removeFromCart(${index})">Remove</button>
            </td>
        `;

        tableBody.appendChild(row);
    });

    updateCartSummary();
}

// 更新Token数量
function updateTokenQuantity(index, newQuantity) {
    if (newQuantity < 0 || newQuantity > 999) {
        alert('Token quantity must be between 0 and 999');
        return;
    }

    let cartItems = getCartItems();
    if (cartItems[index]) {
        cartItems[index].tokenQuantity = newQuantity;
        
        if (newQuantity === 0 && (cartItems[index].shareQuantity || 0) === 0) {
            cartItems.splice(index, 1);
        }
        
        saveCartItems(cartItems);
        updateCartDisplay();
        console.log('✅ Token数量已更新:', cartItems[index]?.modelName, '新数量:', newQuantity);
    }
}

// 更新Share数量
function updateShareQuantity(index, newQuantity) {
    if (newQuantity < 0 || newQuantity > 999) {
        alert('Share quantity must be between 0 and 999');
        return;
    }

    let cartItems = getCartItems();
    if (cartItems[index]) {
        cartItems[index].shareQuantity = newQuantity;
        
        if (newQuantity === 0 && (cartItems[index].tokenQuantity || 0) === 0) {
            cartItems.splice(index, 1);
        }
        
        saveCartItems(cartItems);
        updateCartDisplay();
        console.log('✅ Share数量已更新:', cartItems[index]?.modelName, '新数量:', newQuantity);
    }
}

// 从购物车移除商品
function removeFromCart(index) {
    let cartItems = getCartItems();
    const item = cartItems[index];
    
    if (confirm(`Remove "${item.modelName}" from your cart?`)) {
        cartItems.splice(index, 1);
        saveCartItems(cartItems);
        updateCartDisplay();
        console.log('✅ 商品已从购物车移除:', item.modelName);
    }
}

// 清空购物车
function clearCart() {
    if (confirm('Are you sure you want to clear your entire cart?')) {
        localStorage.removeItem('cartItems');
        updateCartDisplay();
        console.log('✅ 购物车已清空');
    }
}

// 更新购物车摘要
function updateCartSummary() {
    const cartItems = getCartItems();
    const cartCount = document.getElementById('cartCount');

    if (cartCount) {
        cartCount.textContent = `${cartItems.length} item${cartItems.length !== 1 ? 's' : ''}`;
    }
}

// 显示结账弹窗 - 先显示订单摘要，不进行验证
function showCheckoutModal() {
    const cartItems = getCartItems();
    if (cartItems.length === 0) {
        alert('Your cart is empty!');
        return;
    }

    // 计算总计和数量
    let tokenPriceTotal = 0;
    let sharePriceTotal = 0;
    let totalTokenQuantity = 0;
    let totalShareQuantity = 0;
    let modelCount = cartItems.length;
    let orderItemsHtml = '';

    cartItems.forEach(item => {
        const modelData = getModelData(item.modelName);
        if (modelData) {
            const tokenQuantity = item.tokenQuantity || 0;
            const shareQuantity = item.shareQuantity || 0;
            
            totalTokenQuantity += tokenQuantity;
            totalShareQuantity += shareQuantity;
            
            const tokenSubtotal = modelData.tokenPrice * tokenQuantity;
            const shareSubtotal = modelData.sharePrice * shareQuantity;
            tokenPriceTotal += tokenSubtotal;
            sharePriceTotal += shareSubtotal;
            
            if (tokenQuantity > 0 || shareQuantity > 0) {
                orderItemsHtml += `
                    <div class="order-item">
                        <div class="order-item-name">${item.modelName}</div>
                        <div class="order-item-details">
                            ${tokenQuantity > 0 ? `${tokenQuantity}K tokens` : ''}
                            ${tokenQuantity > 0 && shareQuantity > 0 ? ' + ' : ''}
                            ${shareQuantity > 0 ? `${shareQuantity} shares` : ''}
                        </div>
                    </div>
                `;
            }
        }
    });

    const grandTotal = tokenPriceTotal + (sharePriceTotal * 1000);

    // 更新弹窗内容
    document.getElementById('modalModels').textContent = modelCount;
    document.getElementById('modalTokens').textContent = totalTokenQuantity + 'K Tokens';
    document.getElementById('modalShares').textContent = totalShareQuantity;
    document.getElementById('modalTotal').innerHTML = `${grandTotal.toFixed(2)} <img src="svg/i3-token-logo.svg" class="token-logo" alt="i3">`;
    document.getElementById('modalOrderItems').innerHTML = orderItemsHtml;

    // 显示弹窗
    document.getElementById('checkoutModal').style.display = 'flex';
}

// 关闭结账弹窗
function closeCheckoutModal() {
    document.getElementById('checkoutModal').style.display = 'none';
    
    // 清除余额信息（如果有的话）
    const modalBody = document.querySelector('.modal-body');
    const balanceInfo = modalBody.querySelector('div[style*="Your I3 Token Balance"]');
    if (balanceInfo) {
        balanceInfo.remove();
    }
}

// 保存购买记录到My Assets
function savePurchaseToAssets(cartItems, orderSummary) {
    console.log('💾 Saving purchase to My Assets...');
    console.log('📦 Cart items to save:', cartItems);
    
    try {
        let myAssets = JSON.parse(localStorage.getItem('myAssets')) || {
            tokens: [],
            shares: [],
            history: []
        };
        
        const purchaseDate = new Date().toISOString();
        
        cartItems.forEach(item => {
            const modelData = getModelData(item.modelName);
            if (!modelData) {
                console.warn('⚠️ Model data not found for:', item.modelName);
                return;
            }
            
            console.log(`📄 Processing item: ${item.modelName}, Tokens: ${item.tokenQuantity}, Shares: ${item.shareQuantity}`);
            
            if (item.tokenQuantity > 0) {
                const existingTokenIndex = myAssets.tokens.findIndex(
                    token => token.modelName === item.modelName
                );
                
                if (existingTokenIndex >= 0) {
                    myAssets.tokens[existingTokenIndex].quantity += item.tokenQuantity;
                    myAssets.tokens[existingTokenIndex].lastPurchase = purchaseDate;
                    console.log(`✅ Updated existing token record for ${item.modelName}`);
                } else {
                    myAssets.tokens.push({
                        modelName: item.modelName,
                        category: modelData.category,
                        industry: modelData.industry,
                        quantity: item.tokenQuantity,
                        tokenPrice: modelData.tokenPrice,
                        purchaseDate: purchaseDate,
                        lastPurchase: purchaseDate
                    });
                    console.log(`✅ Created new token record for ${item.modelName}`);
                }
            }
            
            if (item.shareQuantity > 0) {
                const existingShareIndex = myAssets.shares.findIndex(
                    share => share.modelName === item.modelName
                );
                
                if (existingShareIndex >= 0) {
                    myAssets.shares[existingShareIndex].quantity += item.shareQuantity;
                    myAssets.shares[existingShareIndex].lastPurchase = purchaseDate;
                    console.log(`✅ Updated existing share record for ${item.modelName}`);
                } else {
                    myAssets.shares.push({
                        modelName: item.modelName,
                        category: modelData.category,
                        industry: modelData.industry,
                        quantity: item.shareQuantity,
                        sharePrice: modelData.sharePrice,
                        marketChange: modelData.change,
                        purchaseDate: purchaseDate,
                        lastPurchase: purchaseDate
                    });
                    console.log(`✅ Created new share record for ${item.modelName}`);
                }
            }
        });
        
        myAssets.history.push({
            orderId: 'ORD-' + Date.now(),
            purchaseDate: purchaseDate,
            models: cartItems.length,
            totalTokens: orderSummary.totalTokenQuantity,
            totalShares: orderSummary.totalShareQuantity,
            totalAmount: orderSummary.grandTotal,
            items: cartItems.map(item => ({
                modelName: item.modelName,
                tokenQuantity: item.tokenQuantity || 0,
                shareQuantity: item.shareQuantity || 0
            }))
        });
        
        localStorage.setItem('myAssets', JSON.stringify(myAssets));
        console.log('✅ Purchase saved to My Assets:', myAssets);
        
    } catch (error) {
        console.error('⚠ Error saving purchase to My Assets:', error);
    }
}

// 下单功能 - 在这里进行所有验证
function placeOrder() {
    const cartItems = getCartItems();
    
    // 1. 首先检查钱包连接状态
    const walletStatus = checkWalletConnection();
    if (!walletStatus.connected) {
        alert('⚠️ Please connect your MetaMask wallet first to proceed with payment.\n\nClick "Login" → "Connect Wallet"');
        return;
    }
    
    // 2. 计算总计和数量
    let tokenPriceTotal = 0;
    let sharePriceTotal = 0;
    let totalTokenQuantity = 0;
    let totalShareQuantity = 0;
    
    cartItems.forEach(item => {
        const modelData = getModelData(item.modelName);
        if (modelData) {
            const tokenQuantity = item.tokenQuantity || 0;
            const shareQuantity = item.shareQuantity || 0;
            
            totalTokenQuantity += tokenQuantity;
            totalShareQuantity += shareQuantity;
            
            tokenPriceTotal += modelData.tokenPrice * tokenQuantity;
            sharePriceTotal += modelData.sharePrice * shareQuantity;
        }
    });

    const grandTotal = tokenPriceTotal + (sharePriceTotal * 1000);
    
    // 3. 验证支付能力
    const paymentValidation = validatePayment(grandTotal);
    if (!paymentValidation.valid) {
        alert(`❌ Payment Failed!\n\n${paymentValidation.error}\n\n💡 Tip: Get more I3 tokens by doing daily check-ins (+30 I3 tokens per day)!\n\nTransaction cancelled.`);
        return;
    }
    
    // 4. 扣除I3 tokens
    const spendResult = window.walletManager.spendCredits(grandTotal, 'model_purchase');
    if (!spendResult.success) {
        alert(`❌ Payment Processing Failed!\n\n${spendResult.error}\n\nTransaction cancelled.`);
        return;
    }
    
    // 5. 保存购买记录到My Assets
    savePurchaseToAssets(cartItems, {
        totalTokenQuantity,
        totalShareQuantity,
        tokenPriceTotal,
        sharePriceTotal,
        grandTotal
    });
    
    // 6. 显示成功消息
    alert(`🎉 Order Placed Successfully!\n\n💳 Payment: ${grandTotal.toFixed(2)} I3 tokens\n📊 Models: ${cartItems.length}\n🎯 Tokens: ${totalTokenQuantity}K\n📈 Shares: ${totalShareQuantity}\n\n💰 Remaining Balance: ${spendResult.newBalance} I3 tokens\n\n✅ Your models have been added to your account.\nThank you for your purchase!`);
    
    // 7. 清空购物车
    localStorage.removeItem('cartItems');
    updateCartDisplay();
    
    // 8. 关闭弹窗
    closeCheckoutModal();
    
    // 9. 跳转到My Assets页面
    setTimeout(() => {
        console.log('📄 Redirecting to My Assets...');
        window.location.href = 'myassets.html';
    }, 1000);
}

// 点击弹窗外部关闭弹窗
document.addEventListener('click', function(event) {
    const modal = document.getElementById('checkoutModal');
    if (event.target === modal) {
        closeCheckoutModal();
    }
});

// ESC键关闭弹窗
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeCheckoutModal();
    }
});

// 从URL参数获取要添加的模型（用于从其他页面跳转）
function handleURLParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const addModel = urlParams.get('add');
    
    if (addModel) {
        const success = addToCartStorage(addModel, 1, 0);
        if (success) {
            updateCartDisplay();
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }
}

// 页面加载时处理URL参数
document.addEventListener('DOMContentLoaded', function() {
    handleURLParams();
});

// 导出函数供其他页面使用
window.addToCartFromOtherPage = addToCartStorage;
window.getCartItemCount = function() {
    return getCartItems().reduce((total, item) => total + item.quantity, 0);
};