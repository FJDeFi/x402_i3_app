// 🛒 MyCart页面 - 购物车功能 (修复版 - 添加真正的支付验证)
console.log('🛒 加载 MyCart 页面...');

// 获取模型数据
function getModelData(modelName) {
    if (typeof MODEL_DATA === 'undefined') {
        console.error('⚠️ MODEL_DATA not loaded');
        return null;
    }
    return MODEL_DATA[modelName] || null;
}

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
        tokens: userInfo.credits, // 使用 USDC 余额
        error: userInfo.isConnected ? null : 'Please connect your wallet first'
    };
}

// 验证用户是否有足够的 USDC 余额
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
        
        // 使用与modelverse一致的价格计算方式
        let tokenPricePerCall, sharePriceUsdc;
        if (window.PricingUtils && typeof window.PricingUtils.normalizeModelPricing === 'function') {
            const pricing = window.PricingUtils.normalizeModelPricing(modelData);
            tokenPricePerCall = pricing.pricePerCallUsdc;
            sharePriceUsdc = pricing.sharePriceUsdc;
        } else {
            // 回退方案
            const tokenPricePerK = Number(modelData.tokenPriceUsdc || modelData.tokenPrice || 0);
            tokenPricePerCall = tokenPricePerK / 1000;
            sharePriceUsdc = Number(modelData.sharePriceUsdc || (modelData.sharePrice ? modelData.sharePrice / 10 : 0));
        }
        
        // tokenQuantity 是实际的API调用次数，不是K
        const tokenSubtotal = (tokenPricePerCall * tokenQuantity).toFixed(6);
        const shareSubtotal = (sharePriceUsdc * shareQuantity).toFixed(6);

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
                    <div class="price-info">${tokenPricePerCall.toFixed(6)} USDC/call</div>
                    <div class="quantity-controls">
                        <button class="quantity-btn" onclick="updateTokenQuantity(${index}, ${tokenQuantity - 1})" ${tokenQuantity <= 0 ? 'disabled' : ''}>−</button>
                        <input type="number" class="quantity-input" value="${tokenQuantity}" min="0" max="999999" 
                               onchange="updateTokenQuantity(${index}, parseInt(this.value))" 
                               onkeypress="if(event.key==='Enter') updateTokenQuantity(${index}, parseInt(this.value))"
                               placeholder="API调用次数"
                               title="输入API调用次数（例如：2 = 2次调用）">
                        <button class="quantity-btn" onclick="updateTokenQuantity(${index}, ${tokenQuantity + 1})" ${tokenQuantity >= 999999 ? 'disabled' : ''}>+</button>
                    </div>
                    <div class="subtotal-small">Subtotal: ${tokenSubtotal} USDC (${tokenQuantity.toLocaleString()} API calls)</div>
                </div>
            </td>
            <td class="price-display">
                <div class="purchase-option">
                    <div class="price-info">${sharePriceUsdc.toFixed(6)} USDC</div>
                    <div class="quantity-controls">
                        <button class="quantity-btn" onclick="updateShareQuantity(${index}, ${shareQuantity - 1})" ${shareQuantity <= 0 ? 'disabled' : ''}>−</button>
                        <input type="number" class="quantity-input" value="${shareQuantity}" min="0" max="999" 
                               onchange="updateShareQuantity(${index}, parseInt(this.value))" 
                               onkeypress="if(event.key==='Enter') updateShareQuantity(${index}, parseInt(this.value))">
                        <button class="quantity-btn" onclick="updateShareQuantity(${index}, ${shareQuantity + 1})" ${shareQuantity >= 999 ? 'disabled' : ''}>+</button>
                    </div>
                    <div class="subtotal-small">Subtotal: ${shareSubtotal} USDC (${shareQuantity} shares)</div>
                </div>
            </td>
            <td class="total-subtotal">
                <div class="total-amount">${(parseFloat(tokenSubtotal) + parseFloat(shareSubtotal)).toFixed(6)} USDC</div>
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
            
            // 使用与modelverse一致的价格计算方式
            let tokenPricePerCall, sharePriceUsdc;
            if (window.PricingUtils && typeof window.PricingUtils.normalizeModelPricing === 'function') {
                const pricing = window.PricingUtils.normalizeModelPricing(modelData);
                tokenPricePerCall = pricing.pricePerCallUsdc;
                sharePriceUsdc = pricing.sharePriceUsdc;
            } else {
                // 回退方案
                const tokenPricePerK = Number(modelData.tokenPriceUsdc || modelData.tokenPrice || 0);
                tokenPricePerCall = tokenPricePerK / 1000;
                sharePriceUsdc = Number(modelData.sharePriceUsdc || (modelData.sharePrice ? modelData.sharePrice / 10 : 0));
            }
            
            const tokenSubtotal = tokenPricePerCall * tokenQuantity; // tokenQuantity是实际调用次数
            const shareSubtotal = sharePriceUsdc * shareQuantity;
            tokenPriceTotal += tokenSubtotal;
            sharePriceTotal += shareSubtotal;
            
            if (tokenQuantity > 0 || shareQuantity > 0) {
                orderItemsHtml += `
                    <div class="order-item">
                        <div class="order-item-name">${item.modelName}</div>
                        <div class="order-item-details">
                            ${tokenQuantity > 0 ? `${tokenQuantity.toLocaleString()} API calls (${tokenSubtotal.toFixed(6)} USDC)` : ''}
                            ${tokenQuantity > 0 && shareQuantity > 0 ? ' + ' : ''}
                            ${shareQuantity > 0 ? `${shareQuantity} shares (${shareSubtotal.toFixed(6)} USDC)` : ''}
                        </div>
                    </div>
                `;
            }
        }
    });

    const grandTotal = tokenPriceTotal + sharePriceTotal;

    // 更新弹窗内容
    document.getElementById('modalModels').textContent = modelCount;
    document.getElementById('modalTokens').textContent = totalTokenQuantity.toLocaleString() + ' API Calls';
    document.getElementById('modalShares').textContent = totalShareQuantity;
    document.getElementById('modalTotal').textContent = `${grandTotal.toFixed(6)} USDC`;
    document.getElementById('modalOrderItems').innerHTML = orderItemsHtml;

    // 显示弹窗
    document.getElementById('checkoutModal').style.display = 'flex';
}

// 关闭结账弹窗
function closeCheckoutModal() {
    document.getElementById('checkoutModal').style.display = 'none';
    
    // 清除余额信息（如果有的话）
    const modalBody = document.querySelector('.modal-body');
    const balanceInfo = modalBody.querySelector('div[style*="Your USDC Balance"]');
    if (balanceInfo) {
        balanceInfo.remove();
    }
}

// 保存购买记录到My Assets
function savePurchaseToAssets(cartItems, resultSummary) {
    console.log('💾 Saving purchase to My Assets...');
    console.log('📦 Cart items to save:', cartItems);
    
    try {
        const purchaseDate = new Date().toISOString();
        const myAssets = JSON.parse(localStorage.getItem('myAssets')) || { tokens: [], shares: [], history: [] };
        if (!Array.isArray(myAssets.tokens)) myAssets.tokens = [];
        if (!Array.isArray(myAssets.shares)) myAssets.shares = [];
        if (!Array.isArray(myAssets.history)) myAssets.history = [];

        const receipts = Array.isArray(resultSummary?.receipts) ? resultSummary.receipts : [];

        receipts.forEach(({ type, order, receipt }) => {
            if (type === 'token') {
                // 处理Token购买
                const existingToken = myAssets.tokens.find(token => token.modelName === order.modelName);
                if (existingToken) {
                    existingToken.quantity += order.quantity;
                    existingToken.totalSpent = Number((existingToken.totalSpent + order.amount).toFixed(6));
                    existingToken.lastUpdated = purchaseDate;
                } else {
                    const modelData = getModelData(order.modelName);
                    myAssets.tokens.push({
                        modelName: order.modelName,
                        quantity: order.quantity, // 实际API调用次数
                        pricePerCall: order.pricePerCall,
                        totalSpent: order.amount,
                        category: modelData?.category || 'AI Research',
                        acquiredAt: purchaseDate,
                        lastUpdated: purchaseDate
                    });
                }

                myAssets.history.push({
                    type: 'token_purchase',
                    modelName: order.modelName,
                    quantity: order.quantity,
                    amount_usdc: order.amount,
                    tx_signature: receipt.tx_signature,
                    purchasedAt: purchaseDate
                });
            } else {
                // 处理Share购买
                const existingShare = myAssets.shares.find(share => share.modelName === order.modelName);
                if (existingShare) {
                    existingShare.quantity += order.quantity;
                    existingShare.totalInvested = Number((existingShare.totalInvested + receipt.amount_usdc).toFixed(6));
                    existingShare.lastUpdated = purchaseDate;
                } else {
                    myAssets.shares.push({
                        modelName: order.modelName,
                        quantity: order.quantity,
                        pricePerShare: order.pricePerShare,
                        totalInvested: receipt.amount_usdc,
                        acquiredAt: purchaseDate,
                        lastUpdated: purchaseDate
                    });
                }

                myAssets.history.push({
                    type: 'share_purchase',
                    modelName: order.modelName,
                    quantity: order.quantity,
                    amount_usdc: receipt.amount_usdc,
                    tx_signature: receipt.tx_signature,
                    purchasedAt: purchaseDate
                });
            }
        });

        localStorage.setItem('myAssets', JSON.stringify(myAssets));
        console.log('✅ Share purchase saved to My Assets:', myAssets);
    } catch (error) {
        console.error('⚠ Error saving purchase to My Assets:', error);
    }
}

// 下单功能 - 支持tokens和shares购买
function placeOrder() {
    const cartItems = getCartItems();
    if (!cartItems.length) {
        alert('🛒 Your cart is empty.');
        return;
    }

    // 准备Token订单
    const tokenOrders = cartItems
        .filter(item => (item.tokenQuantity || 0) > 0)
        .map(item => {
            const model = getModelData(item.modelName);
            if (!model) return null;
            const quantity = Number(item.tokenQuantity || 0); // 实际API调用次数
            
            // 使用与modelverse一致的价格计算
            let pricePerCall;
            if (window.PricingUtils && typeof window.PricingUtils.normalizeModelPricing === 'function') {
                const pricing = window.PricingUtils.normalizeModelPricing(model);
                pricePerCall = pricing.pricePerCallUsdc;
            } else {
                const pricePerK = Number(model.tokenPriceUsdc || model.tokenPrice || 0);
                pricePerCall = pricePerK / 1000;
            }
            
            return {
                modelName: item.modelName,
                quantity, // 实际调用次数
                amount: Number((pricePerCall * quantity).toFixed(6)),
                pricePerCall
            };
        })
        .filter(Boolean);

    // 准备Share订单
    const shareOrders = cartItems
        .filter(item => (item.shareQuantity || 0) > 0)
        .map(item => {
            const model = getModelData(item.modelName);
            if (!model) return null;
            const quantity = Number(item.shareQuantity || 0);
            const pricePerShare = Number(model.sharePriceUsdc || model.sharePrice || 0);
            return {
                modelName: item.modelName,
                quantity,
                amount: Number((pricePerShare * quantity).toFixed(2)),
                pricePerShare
            };
        })
        .filter(Boolean);

    if (!tokenOrders.length && !shareOrders.length) {
        alert('⚠️ 购物车中没有有效的商品。');
        return;
    }

    (async () => {
        const receipts = [];
        
        // 处理Token购买
        for (const order of tokenOrders) {
            MCPClient.logStatus('invoice', `准备购买 ${order.modelName} API调用`, {
                description: `${order.quantity}K calls × ${order.pricePerK} USDC`
            });
            const response = await MCPClient.purchaseShare({
                share_id: order.modelName + '_tokens',
                amount_usdc: order.amount
            }, {
                onInvoice(invoice) {
                    MCPClient.logStatus('invoice', `Token 402: ${invoice.description || order.modelName}`, {
                        amount: invoice.amount_usdc,
                        memo: invoice.memo || invoice.request_id
                    });
                },
                onPayment(invoice, tx) {
                    MCPClient.logStatus('payment', '已完成 Token 支付', {
                        amount: invoice.amount_usdc,
                        memo: invoice.memo || invoice.request_id,
                        tx
                    });
                }
            });

            if (response.status !== 'ok') {
                alert('❌ Token 购买取消或失败，订单中止。');
                return;
            }

            receipts.push({ type: 'token', order, receipt: response.result });
        }

        // 处理Share购买
        for (const order of shareOrders) {
            MCPClient.logStatus('invoice', `准备购买 ${order.modelName} 份额`, {
                description: `${order.quantity} × ${order.pricePerShare} USDC`
            });
            const response = await MCPClient.purchaseShare({
                share_id: order.modelName,
                amount_usdc: order.amount
            }, {
                onInvoice(invoice) {
                    MCPClient.logStatus('invoice', `Share 402: ${invoice.description || order.modelName}`, {
                        amount: invoice.amount_usdc,
                        memo: invoice.memo || invoice.request_id
                    });
                },
                onPayment(invoice, tx) {
                    MCPClient.logStatus('payment', '已完成 Share 支付', {
                        amount: invoice.amount_usdc,
                        memo: invoice.memo || invoice.request_id,
                        tx
                    });
                }
            });

            if (response.status !== 'ok') {
                alert('❌ Share 购买取消或失败，订单中止。');
                return;
            }

            receipts.push({ type: 'share', order, receipt: response.result });
        }

        savePurchaseToAssets(cartItems, { receipts });

        // 显示交易链接
        const allTxSignatures = receipts.map(r => r.receipt?.tx_signature || r.receipt?.signature).filter(Boolean);
        if (allTxSignatures.length > 0) {
            allTxSignatures.forEach((signature, index) => {
                const receipt = receipts[index];
                const explorerUrl = `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
                showPurchaseSuccessToast(signature, receipt.order, explorerUrl);
            });
        }

        const tokenCount = tokenOrders.length;
        const shareCount = shareOrders.length;
        let message = '🎉 购买完成！\n\n';
        if (tokenCount > 0) message += `✅ Tokens: ${tokenCount} 个模型\n`;
        if (shareCount > 0) message += `✅ Shares: ${shareCount} 个模型\n`;
        message += '\n📋 查看交易详情请点击右下角通知';
        
        alert(message);

        localStorage.removeItem('cartItems');
        updateCartDisplay();
        closeCheckoutModal();
        setTimeout(() => {
            window.location.href = 'myassets.html';
        }, 1500);
    })();
}

// 显示购买成功通知
function showPurchaseSuccessToast(signature, order, explorerUrl) {
    try {
        const toastId = `purchase-toast-${Date.now()}`;
        const toast = document.createElement('div');
        toast.id = toastId;
        toast.className = 'purchase-success-toast';
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            padding: 20px 24px;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(16, 185, 129, 0.3);
            z-index: 10000;
            max-width: 400px;
            animation: slideInRight 0.3s ease-out;
        `;
        
        const amount = order.amount ? `${order.amount.toFixed(6)} USDC` : 'N/A';
        const quantity = order.quantity ? `${order.quantity.toLocaleString()} API calls` : `${order.quantity} shares`;
        
        toast.innerHTML = `
            <button onclick="this.parentElement.remove()" style="position:absolute;top:8px;right:8px;background:rgba(255,255,255,0.2);border:none;color:white;border-radius:50%;width:24px;height:24px;cursor:pointer;font-size:16px;line-height:1;">×</button>
            <h4 style="margin:0 0 8px 0;font-size:16px;font-weight:600;">🎉 购买成功！</h4>
            <p style="margin:0 0 4px 0;font-size:14px;opacity:0.95;"><strong>${order.modelName}</strong></p>
            <p style="margin:0 0 4px 0;font-size:13px;opacity:0.9;">数量: ${quantity}</p>
            <p style="margin:0 0 12px 0;font-size:13px;opacity:0.9;">金额: ${amount}</p>
            <a href="${explorerUrl}" target="_blank" rel="noopener noreferrer" 
               style="display:inline-block;background:rgba(255,255,255,0.2);color:white;padding:8px 16px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:600;transition:all 0.2s;"
               onmouseover="this.style.background='rgba(255,255,255,0.3)'"
               onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                📋 查看交易详情 →
            </a>
        `;
        
        document.body.appendChild(toast);
        
        // 10秒后自动关闭
        setTimeout(() => {
            try { toast.remove(); } catch (_) {}
        }, 10000);
    } catch (err) {
        console.warn('Failed to show purchase success toast', err);
    }
}

// 添加动画
if (!document.getElementById('purchase-toast-animation')) {
    const style = document.createElement('style');
    style.id = 'purchase-toast-animation';
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);
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