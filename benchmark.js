// 🏆 Benchmark页面 - 使用 model-data.js 统一数据源

console.log('🚀 加载 Benchmark 页面...');

// 当前激活的标签页
let currentTab = 'model';

// 分页配置
const PAGINATION_CONFIG = {
    modelBenchmark: {
        currentPage: 1,
        itemsPerPage: 15, // 从 10 改为 15
        totalItems: 0,
        totalPages: 0
    },
    peerBenchmark: {
        currentPage: 1,
        itemsPerPage: 15, // 增加每页显示的模型数量
        totalItems: 0,
        totalPages: 0
    }
};

// 添加加载状态指示器
function showLoadingState() {
    const tableBody = document.getElementById('benchmarkTableBody');
    if (tableBody) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="10" style="text-align: center; padding: 40px; color: #6b7280;">
                    <div style="display: inline-block; margin-right: 10px;">⏳</div>
                    Loading model data...
                </td>
            </tr>
        `;
    }
}

// 标签页切换功能
function switchTab(tabName) {
    currentTab = tabName;
    
    // 更新标签页按钮状态
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // 切换表格显示
    const modelTable = document.getElementById('modelBenchmarkTable');
    const peerTable = document.getElementById('peerBenchmarkTable');
    
    if (tabName === 'model') {
        modelTable.style.display = 'block';
        peerTable.style.display = 'none';
        loadModelBenchmark();
    } else {
        modelTable.style.display = 'none';
        peerTable.style.display = 'block';
        loadPeerBenchmark();
    }
}

// 加载模型基准测试数据
function loadModelBenchmark() {
    if (typeof MODEL_STATS === 'undefined') {
        console.error('❌ model-data.js 未正确加载');
        return;
    }
    
    const allModels = getTopModelsByScore(100);
    PAGINATION_CONFIG.modelBenchmark.totalItems = allModels.length;
    PAGINATION_CONFIG.modelBenchmark.totalPages = Math.ceil(allModels.length / PAGINATION_CONFIG.modelBenchmark.itemsPerPage);
    
    console.log(`🏆 模型基准测试：共 ${allModels.length} 个模型，${PAGINATION_CONFIG.modelBenchmark.totalPages} 页`);
    
    displayModelBenchmarkPage(1);
    setupTooltips();
}

// 显示模型基准测试指定页面
function displayModelBenchmarkPage(page) {
    PAGINATION_CONFIG.modelBenchmark.currentPage = page;
    
    const allModels = getTopModelsByScore(100);
    const startIndex = (page - 1) * PAGINATION_CONFIG.modelBenchmark.itemsPerPage;
    const endIndex = startIndex + PAGINATION_CONFIG.modelBenchmark.itemsPerPage;
    const pageModels = allModels.slice(startIndex, endIndex);
    
    populateBenchmarkTable(pageModels);
    addPagination('modelBenchmark');
}

// 加载同行基准测试数据
function loadPeerBenchmark() {
    if (typeof MODEL_STATS === 'undefined') {
        console.error('❌ model-data.js 未正确加载');
        return;
    }
    
    const allPeerModels = generatePeerBenchmarkData();
    PAGINATION_CONFIG.peerBenchmark.totalItems = allPeerModels.length;
    PAGINATION_CONFIG.peerBenchmark.totalPages = Math.ceil(allPeerModels.length / PAGINATION_CONFIG.peerBenchmark.itemsPerPage);
    
    console.log(`🏆 同行基准测试：共 ${allPeerModels.length} 个模型，${PAGINATION_CONFIG.peerBenchmark.totalPages} 页`);
    
    displayPeerBenchmarkPage(1);
    setupPeerTooltips();
}

// 显示同行基准测试指定页面
function displayPeerBenchmarkPage(page) {
    PAGINATION_CONFIG.peerBenchmark.currentPage = page;
    
    const allPeerModels = generatePeerBenchmarkData();
    const startIndex = (page - 1) * PAGINATION_CONFIG.peerBenchmark.itemsPerPage;
    const endIndex = startIndex + PAGINATION_CONFIG.peerBenchmark.itemsPerPage;
    const pageModels = allPeerModels.slice(startIndex, endIndex);
    
    populatePeerBenchmarkTable(pageModels);
    addPagination('peerBenchmark');
}

// 清理所有顶部翻页控件
function cleanupTopPagination() {
    // 移除所有在表格上方的分页控件
    const allPaginationContainers = document.querySelectorAll('.pagination-container');
    allPaginationContainers.forEach(container => {
        const modelTable = document.getElementById('modelBenchmarkTable');
        const peerTable = document.getElementById('peerBenchmarkTable');
        
        // 如果分页控件在表格上方，则删除
        if (modelTable && container.compareDocumentPosition(modelTable) & Node.DOCUMENT_POSITION_PRECEDING) {
            container.remove();
        }
        if (peerTable && container.compareDocumentPosition(peerTable) & Node.DOCUMENT_POSITION_PRECEDING) {
            container.remove();
        }
    });
}

// 添加分页控件
function addPagination(type) {
    const config = PAGINATION_CONFIG[type];
    if (!config) return;
    
    // 首先清理所有顶部翻页
    cleanupTopPagination();
    
    // 移除现有的分页控件（包括顶部和底部的）
    const existingPagination = document.querySelector(`#${type}Pagination`);
    if (existingPagination) {
        existingPagination.remove();
    }
    
    // 创建分页容器
    const paginationContainer = document.createElement('div');
    paginationContainer.id = `${type}Pagination`;
    paginationContainer.className = 'pagination-container';
    
    // 计算显示的页码
    const startPage = Math.max(1, config.currentPage - 2);
    const endPage = Math.min(config.totalPages, config.currentPage + 2);
    
    // 构建分页HTML
    let paginationHTML = '<div class="pagination-controls">';
    
    // 上一页按钮
    if (config.currentPage > 1) {
        paginationHTML += `<button class="page-btn" onclick="goToPage('${type}', ${config.currentPage - 1})">Previous</button>`;
    }
    
    // 页码按钮
    for (let i = startPage; i <= endPage; i++) {
        const isActive = i === config.currentPage;
        paginationHTML += `<button class="page-btn ${isActive ? 'active' : ''}" onclick="goToPage('${type}', ${i})">${i}</button>`;
    }
    
    // 下一页按钮
    if (config.currentPage < config.totalPages) {
        paginationHTML += `<button class="page-btn" onclick="goToPage('${type}', ${config.currentPage + 1})">Next</button>`;
    }
    
    paginationHTML += '</div>';
    
    // 页面信息
    paginationHTML += `<div class="page-info">Page ${config.currentPage} of ${config.totalPages} (${config.totalItems} items)</div>`;
    
    paginationContainer.innerHTML = paginationHTML;
    
    // 根据类型找到对应的表格元素
    let tableElement;
    if (type === 'modelBenchmark') {
        tableElement = document.getElementById('modelBenchmarkTable');
    } else if (type === 'peerBenchmark') {
        tableElement = document.getElementById('peerBenchmarkTable');
    }
    
    // 对于所有类型，都放在表格后面（页面底部）
    if (tableElement) {
        // 在表格后面插入分页控件
        tableElement.parentNode.insertBefore(paginationContainer, tableElement.nextSibling);
    }
}

// 跳转到指定页面
function goToPage(type, page) {
    if (type === 'modelBenchmark') {
        displayModelBenchmarkPage(page);
    } else if (type === 'peerBenchmark') {
        displayPeerBenchmarkPage(page);
    }
}

// 生成同行基准测试数据
function generatePeerBenchmarkData() {
    console.log('Generating Peer Benchmark data...');
    
    if (!MODEL_DATA) {
        console.error('MODEL_DATA not loaded');
        return [];
    }
    
    // 从 MODEL_DATA 中选择更多模型（增加到 50 个）
    const modelEntries = Object.entries(MODEL_DATA).slice(0, 50);
    console.log('Selected models:', modelEntries.length);
    
    const peerData = modelEntries.map(([modelName, modelData], index) => {
        // 生成随机指标，更匀称的分数范围
        const verticalIndex = Math.floor(Math.random() * 20) + 10; // 10-29 (更匀称)
        const pwcScore = Math.floor(Math.random() * 20) + 10; // 10-29 (更匀称)
        const economicValue = Math.floor(Math.random() * 20) + 10; // 10-29 (更匀称)
        const lateralCompValue = Math.floor(Math.random() * 20) + 10; // 10-29 (更匀称)
        
        // 确保总分不超过 100，更匀称的分布
        const totalScore = Math.min(verticalIndex + pwcScore + economicValue + lateralCompValue, 100);
        
        const rating = (Math.random() * 2 + 3).toFixed(1); // 3.0-5.0
        const usage = Math.floor(Math.random() * 10000) + 100;
        const lateralComp = ['Outstanding', 'Superior', 'Very Good', 'Good'][Math.floor(Math.random() * 4)];
        
        return {
            id: index + 1,
            name: modelName,
            category: modelData.category || 'AI Research',
            industry: modelData.industry || 'AI Research',
            rating: parseFloat(rating),
            usage: usage,
            verticalIndex: verticalIndex,
            pwcScore: pwcScore,
            economicValue: economicValue,
            lateralComp: lateralComp,
            totalScore: totalScore
        };
    });
    
    // 按总分排序
    peerData.sort((a, b) => b.totalScore - a.totalScore);
    
    console.log('Generated Peer Benchmark data:', peerData.length, 'models');
    return peerData;
}

// 填充同行基准测试表格
function populatePeerBenchmarkTable(models) {
    console.log('Populating Peer Benchmark table with', models.length, 'models');
    
    const tableBody = document.getElementById('peerBenchmarkTableBody');
    if (!tableBody) {
        console.error('Peer benchmark table body not found');
        return;
    }
    
    if (!models || models.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="11" style="text-align: center; padding: 20px; color: #6b7280;">No data available</td></tr>';
        return;
    }
    
    tableBody.innerHTML = models.map(model => `
        <tr>
            <td class="model-name model-name-clickable" onclick="showModelCard('${model.name}')" style="cursor: pointer; color: #8b5cf6;">${model.name}</td>
            <td class="category">${model.category}</td>
            <td class="industry">${model.industry}</td>
            <td class="rating">${model.rating}</td>
            <td class="usage">${model.usage.toLocaleString()}</td>
            <td class="vertical-index">${model.verticalIndex}</td>
            <td class="pwc-score">${model.pwcScore}</td>
            <td class="economic-value">${model.economicValue}</td>
            <td class="lateral-comp">${model.lateralComp}</td>
            <td class="total-score">${model.totalScore}</td>
            <td class="actions">
                <button class="action-btn try" onclick="tryModel('${model.name}')">
                    Try
                </button>
                <button class="action-btn add-to-cart" onclick="addToCart('${model.name}')">
                    Add to Cart
                </button>
            </td>
        </tr>
    `).join('');
    
    console.log('Peer Benchmark table populated successfully');
}

// 设置同行基准测试工具提示 - 已在 HTML 中直接添加
function setupPeerTooltips() {
    // 工具提示已在 HTML 中直接实现
    console.log('Peer Benchmark tooltips already set up in HTML');
}

// 显示表头工具提示
function showHeaderTooltip(event, title, content) {
    // 移除现有的工具提示
    hideHeaderTooltip();
    
    // 创建工具提示元素
    const tooltip = document.createElement('div');
    tooltip.id = 'headerTooltip';
    tooltip.style.cssText = `
        position: absolute;
        background: #1f2937;
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        font-size: 12px;
        line-height: 1.4;
        max-width: 300px;
        z-index: 1000;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.2s ease;
    `;
    
    tooltip.innerHTML = `
        <div style="font-weight: 600; margin-bottom: 8px;">${title}</div>
        <div>${content}</div>
        <div style="position: absolute; top: 100%; left: 50%; transform: translateX(-50%); border: 6px solid transparent; border-top-color: #1f2937;"></div>
    `;
    
    // 添加到页面
    document.body.appendChild(tooltip);
    
    // 定位工具提示
    const rect = event.target.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    
    let left = rect.left + rect.width / 2 - tooltipRect.width / 2;
    let top = rect.bottom + 10;
    
    // 确保工具提示不超出视窗
    if (left < 10) left = 10;
    if (left + tooltipRect.width > window.innerWidth - 10) {
        left = window.innerWidth - tooltipRect.width - 10;
    }
    if (top + tooltipRect.height > window.innerHeight - 10) {
        top = rect.top - tooltipRect.height - 10;
    }
    
    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
    
    // 显示工具提示
    setTimeout(() => {
        tooltip.style.opacity = '1';
    }, 10);
}

// 隐藏表头工具提示
function hideHeaderTooltip() {
    const tooltip = document.getElementById('headerTooltip');
    if (tooltip) {
        tooltip.remove();
    }
}

// 获取工具提示文本
function getTooltipText(metric) {
    const tooltips = {
        'VERTICAL INDEX': 'Domain-specific performance benchmark measuring how well the model performs within its specialized field (0-100 scale). Higher scores indicate superior performance compared to other models in the same domain.',
        'PWC SCORE': 'Peer-Workflow Compatibility score measuring how well this model integrates with other models in multi-model pipelines (0-100%). Higher scores indicate better compatibility for downstream composition and collaborative workflows.',
        'ECONOMIC VALUE': 'Inferred economic worth based on lateral comparison and collaborative performance within the ecosystem. Calculated using market pricing, usage patterns, and peer evaluation metrics.',
        'LATERAL COMP.': 'Lateral Comparison: Qualitative assessment of the model\'s performance relative to peer models in the same category. Ratings include Outstanding, Superior, Very Good, and Good based on comparative analysis.'
    };
    return tooltips[metric] || '';
}

// 显示同行详情
function showPeerDetails(modelName) {
    alert(`Peer Benchmark Details for ${modelName}\n\nThis feature shows detailed peer comparison metrics and analysis for the selected model.`);
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Benchmark 页面初始化开始...');
    
    // 清理所有顶部翻页
    cleanupTopPagination();
    
    // 初始化当前标签页
    currentTab = 'model';
    
    // 加载模型基准测试数据
    loadModelBenchmark();
    
    console.log('✅ Benchmark 页面初始化完成');

// ========== Model Card Functions ==========
// 从 modelverse.js 移植过来的函数

// Donut Chart 绘制函数
function drawDonutChart(percent = 0) {
    console.log('drawDonutChart called with percent:', percent);
    const canvas = document.getElementById('shareChart');
    if (!canvas) {
        console.error('Canvas element not found!');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    const DPR = window.devicePixelRatio || 1;
    
    const size = 180;
    canvas.width = size * DPR;
    canvas.height = size * DPR;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    const purchased = Math.max(0, Math.min(100, Number(percent)||0));
    const cx = size/2, cy = size/2;
    const outerR = size*0.40, innerR = size*0.30;
    const trackR = (outerR + innerR)/2;
    const start = -Math.PI/2;
    const end = start + (purchased/100)*Math.PI*2;
    const gap = 0.02;

    ctx.clearRect(0,0,size,size);
    ctx.lineWidth = outerR - innerR;
    ctx.lineCap = 'round';

    // Purchased
    ctx.strokeStyle = '#8b7cf6';
    ctx.beginPath();
    ctx.arc(cx, cy, trackR, start, end);
    ctx.stroke();

    // Gap
    ctx.strokeStyle = '#f3f4f6';
    ctx.beginPath();
    ctx.arc(cx, cy, trackR, end, end+gap);
    ctx.stroke();

    // Remaining
    ctx.strokeStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(cx, cy, trackR, end+gap, start + Math.PI*2);
    ctx.stroke();

    // Inner cutout
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(cx, cy, innerR, 0, Math.PI*2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    // Center text
    ctx.fillStyle = '#1f2937';
    ctx.font = '700 13px Inter, system-ui, Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${purchased.toFixed(1)}%`, cx, cy);
}

// 显示 Model Card 函数
function showModelCard(modelName, signOverride) {
    if (typeof getModelData !== 'function') {
        alert('Error: model-data.js 未正确加载');
        return;
    }
    const data = getModelData(modelName);
    if (!data) {
        alert('Model data not found for: ' + modelName);
        return;
    }

    const modal = document.getElementById('modelCartModal');
    if (!modal) {
        alert('缺少模态框 HTML，请插入模态框片段。');
        return;
    }
    const $ = (sel) => modal.querySelector(sel);

    const titleEl    = $('#modelCartTitle');
    const purposeEl  = $('#modelPurpose');
    const useCaseEl  = $('#modelUseCase');
    const categoryEl = $('#modelCategory');
    const industryEl = $('#modelIndustry');
    const priceEl    = $('#modelPrice');
    const changeEl   = $('#modelChange');
    const ratingEl   = $('#modelRating');

    if (titleEl)    titleEl.textContent = `${modelName} Details`;
    if (purposeEl)  purposeEl.textContent  = data.purpose || '—';
    if (useCaseEl)  useCaseEl.textContent  = data.useCase || '—';
    if (categoryEl) categoryEl.textContent = data.category || '—';
    if (industryEl) industryEl.textContent = data.industry || '—';
    if (priceEl) {
        priceEl.innerHTML = `${data.tokenPrice} <img src="svg/i3-token-logo.svg" alt="I³" style="width: 16px; height: 16px; vertical-align: middle; margin-left: 4px;">`;
    }

    // fix market change sign
    let changeVal = Number(data.change);
    if (Number.isFinite(changeVal) && signOverride) {
        changeVal = Math.abs(changeVal) * (signOverride > 0 ? 1 : -1);
    }
    if (changeEl) {
        const sign = changeVal > 0 ? '+' : (changeVal < 0 ? '−' : '');
        changeEl.textContent = `${sign}${Math.abs(changeVal).toFixed(2)}%`;
    }

    if (ratingEl)  ratingEl.textContent = `${data.ratingFormatted}/5`;

    // Show modal
    modal.classList.add('active');
    modal.style.display = 'flex';
    document.body.classList.add('mvpro-lock');

    // Donut chart value
    let purchased = Number(data.purchasedPercent);
    if (!Number.isFinite(purchased) || purchased <= 0) {
        purchased = 10 + Math.random() * 25;
    } else {
        purchased = Math.min(35, purchased);
    }
    
    setTimeout(() => {
        drawDonutChart(purchased);
    }, 200);
}

// 关闭 Modal 函数
function closeModal() {
    const modal = document.getElementById('modelCartModal');
    if (!modal) return;
    modal.classList.remove('active');
    modal.style.display = 'none';
    document.body.classList.remove('mvpro-lock');
}

// 事件监听器
window.addEventListener('click', function(e) {
    const modal = document.getElementById('modelCartModal');
    if (e.target === modal) closeModal();
});

window.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeModal();
});

// 导出函数
window.closeModal = closeModal;
window.showModelCard = showModelCard;
window.drawDonutChart = drawDonutChart;
});

function populateBenchmarkTable(models) {
    const tableBody = document.getElementById('benchmarkTableBody');
    if (!tableBody) {
        console.error('❌ 未找到基准表格tbody (#benchmarkTableBody)');
        return;
    }
    
    console.log('✅ 找到表格tbody，开始填充数据...');
    console.log('📊 HTML表头列数: 10列 (MODEL, CATEGORY, INDUSTRY, PRICE PER 1K TOKENS, PRICE PER SHARE, MARKET CHANGE, USAGE, COMPATIBILITY, TOTAL SCORE, ACTION)');
    
    // 清空现有内容
    tableBody.innerHTML = '';
    
    // 性能优化：减少批次大小，提高响应性
    const batchSize = 10;
    let currentIndex = 0;
    
    function renderBatch() {
        const endIndex = Math.min(currentIndex + batchSize, models.length);
        
        for (let i = currentIndex; i < endIndex; i++) {
            const model = models[i];
            
            // 调试：输出前3个模型的数据到控制台
            if (i < 3) {
                console.log(`🔧 模型 ${i + 1}:`, {
                    name: model.name,
                    category: model.category,
                    industry: model.industry,
                    tokenPrice: model.tokenPrice,
                    sharePrice: model.sharePrice
                });
            }
            
            const row = document.createElement('tr');
            
            // MODEL, CATEGORY, INDUSTRY, PRICE PER 1K TOKENS, PRICE PER SHARE, MARKET CHANGE, USAGE, COMPATIBILITY, TOTAL SCORE, ACTION十列
            const cells = [
                `<td class="model-name model-name-clickable" onclick="showModelCard('${model.name}')" style="cursor: pointer; color: #8b5cf6;">${model.name}</td>`,        // 1. MODEL// 1. MODEL
                `<td class="category">${model.category}</td>`,      // 2. CATEGORY
                `<td class="industry">${model.industry}</td>`,      // 3. INDUSTRY
                `<td class="api-price">${model.tokenPrice}<img src="svg/i3-token-logo.svg" class="token-icon" alt="i3"></td>`,   // 4. PRICE PER 1K TOKENS
                `<td class="api-price">${model.sharePrice}K<img src="svg/i3-token-logo.svg" class="token-icon" alt="i3"></td>`,  // 5. PRICE PER SHARE
                `<td class="daily-delta ${model.change >= 0 ? 'positive' : 'negative'}">${model.change >= 0 ? '+' : ''}${model.change.toFixed(2)}%</td>`, // 6. MARKET CHANGE
                `<td class="usage-score">${model.usage.toLocaleString()}</td>`,  // 7. USAGE
                `<td class="compatibility-score">${model.compatibility}</td>`,   // 8. COMPATIBILITY
                `<td class="total-score">${model.totalScore}%</td>`,   // 9. TOTAL SCORE
                `<td class="action-cell">
                    <button class="try-btn" onclick="tryModel('${model.name}')">Try</button>
                    <button class="add-cart-btn" onclick="addToCart('${model.name}')">Add to Cart</button>
                </td>`   // 10. ACTION
            ];
            
            row.innerHTML = cells.join('');
            
            // 调试：输出前3个模型的HTML结构
            if (i < 3) {
                console.log(`🔧 模型 ${i + 1} HTML结构:`, row.innerHTML);
            }
            
            // 验证列数
            if (i === 0) {
                console.log(`🔍 第一行实际列数: ${cells.length} 列`);
            }
            
            tableBody.appendChild(row);
        }
        
        currentIndex = endIndex;
        
        // 如果还有更多数据，继续渲染下一批
        if (currentIndex < models.length) {
            requestAnimationFrame(renderBatch);
        } else {
            console.log(`✅ 成功填充 ${models.length} 个模型到基准表格`);
        }
    }
    
    // 开始渲染
    renderBatch();
}

// 设置工具提示
function setupTooltips() {
    // 为所有带有 data-tooltip 的元素设置工具提示
    const tooltipElements = document.querySelectorAll('[data-tooltip]');
    console.log(`🔧 设置 ${tooltipElements.length} 个工具提示`);
    
    tooltipElements.forEach(element => {
        element.addEventListener('mouseenter', showTooltip);
        element.addEventListener('mouseleave', hideTooltip);
    });
}

function showTooltip(event) {
    const element = event.target;
    const tooltipText = element.getAttribute('data-tooltip');
    
    if (!tooltipText) return;
    
    // 创建工具提示元素
    const tooltip = document.createElement('div');
    tooltip.className = 'custom-tooltip';
    tooltip.innerHTML = tooltipText;
    
    // 添加到页面
    document.body.appendChild(tooltip);
    
    // 定位工具提示
    const rect = element.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    
    // 计算位置（在元素右上角）
    let left = rect.right + 10;
    let top = rect.top - 10;
    
    // 确保工具提示不超出视窗
    if (left + tooltipRect.width > window.innerWidth) {
        left = rect.left - tooltipRect.width - 10;
    }
    
    if (top < 0) {
        top = rect.bottom + 10;
    }
    
    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
    tooltip.style.opacity = '1';
    
    // 存储引用以便清理
    element._tooltip = tooltip;
}

function hideTooltip(event) {
    const element = event.target;
    if (element._tooltip) {
        document.body.removeChild(element._tooltip);
        element._tooltip = null;
    }
}

function viewModel(modelName) {
    const modelData = getModelData(modelName);
    if (modelData) {
        alert(`Model: ${modelName}\nPurpose: ${modelData.purpose}\nUse Case: ${modelData.useCase}\nPrice: $${modelData.tokenPrice} per 1K tokens`);
    }
}

// Try Model 功能 - 跳转到 index.html 并设置模型
function tryModel(modelName) {
    const modelData = getModelData(modelName);
    if (modelData) {
        // 更新按钮状态
        const button = event.target;
        const originalText = button.textContent;
        button.textContent = 'Trying...';
        button.disabled = true;
        button.style.opacity = '0.7';
        
        // 设置 localStorage 中的模型信息
        localStorage.setItem('currentModel', JSON.stringify({
            name: modelName,
            category: modelData.category,
            industry: modelData.industry,
            purpose: modelData.purpose,
            useCase: modelData.useCase
            // ▲ 不要把任何 API key 放这里(见下面安全提醒)
        }));
        
        // 设置强制模型选择
        localStorage.setItem('forcedModel', modelName);
        console.log('🔧 Set forcedModel from benchmark Try button:', modelName);
        
        // 设置路由状态为关闭
        localStorage.setItem('autoRouter', 'off');
        
        // 新增:写入"正在运行"的工作流,让index.html 能显示 Running.
        localStorage.setItem('currentWorkflow', JSON.stringify({
            name: modelName,
            status: 'running',
            startedAt: new Date().toISOString()
        }));
        
        // 跳转到 index.html
        setTimeout(() => {
            window.location.href = 'index.html?model=' + encodeURIComponent(modelName);
        }, 1000);
    } else {
        alert('❌ Model data not found. Please try again.');
    }
}

// Add to Cart 功能
function addToCart(modelName) {
    const modelData = getModelData(modelName);
    if (modelData) {
        // 添加到购物车并跳转 (默认添加1个token)
        const success = addToCartStorage(modelName, 1, 0);
        if (success) {
            // 更新按钮状态
            const button = event.target;
            button.textContent = 'Added ✓';
            button.style.background = '#10b981';
            button.disabled = true;
            
            // 1秒后跳转到购物车页面
            setTimeout(() => {
                window.location.href = 'mycart.html';
            }, 1000);
        } else {
            alert('❌ Failed to add to cart. Please try again.');
        }
    } else {
        alert('❌ Model data not found. Please try again.');
    }
}

// 添加商品到购物车存储
function addToCartStorage(modelName, tokenQuantity = 1, shareQuantity = 0) {
    try {
        const modelData = getModelData(modelName);
        if (!modelData) return false;

        let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
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

        localStorage.setItem('cartItems', JSON.stringify(cartItems));
        console.log('✅ 商品已添加到购物车:', modelName, 'Tokens:', tokenQuantity, 'Shares:', shareQuantity);
        return true;
    } catch (error) {
        console.error('❌ 添加到购物车失败:', error);
        return false;
    }
}

// 导出函数供全局使用
window.switchTab = switchTab;
window.loadModelBenchmark = loadModelBenchmark;
window.loadPeerBenchmark = loadPeerBenchmark;
window.displayModelBenchmarkPage = displayModelBenchmarkPage;
window.displayPeerBenchmarkPage = displayPeerBenchmarkPage;
window.goToPage = goToPage;
window.showPeerDetails = showPeerDetails;
window.showHeaderTooltip = showHeaderTooltip;
window.hideHeaderTooltip = hideHeaderTooltip;
window.addToCart = addToCart;
window.getTooltipText = getTooltipText;

console.log('✅ Benchmark 页面功能已加载完成');

// 全局变量存储原始数据和筛选状态
let originalModelsData = [];
let currentFilters = {
    search: '',
    score: '',
    usage: '',
    sort: 'total-score'
};

// 搜索筛选功能
function filterBenchmarkTable() {
    const searchInput = document.querySelector('.search-input');
    currentFilters.search = searchInput.value.toLowerCase();
    applyAllFilters();
}

// 按分数筛选
function filterByScore(scoreRange) {
    currentFilters.score = scoreRange;
    applyAllFilters();
}

// 按使用量筛选
function filterByUsage(usageLevel) {
    currentFilters.usage = usageLevel;
    applyAllFilters();
}

// 排序功能
function sortBenchmarkTable(sortBy) {
    currentFilters.sort = sortBy;
    applyAllFilters();
}

// 应用所有筛选条件
function applyAllFilters() {
    if (originalModelsData.length === 0) {
        originalModelsData = getTopModelsByScore(100);
    }
    
    let filteredData = [...originalModelsData];
    
    // 搜索筛选
    if (currentFilters.search) {
        filteredData = filteredData.filter(model => 
            model.name.toLowerCase().includes(currentFilters.search) ||
            model.category.toLowerCase().includes(currentFilters.search) ||
            model.industry.toLowerCase().includes(currentFilters.search)
        );
    }
    
    // 分数筛选
    if (currentFilters.score) {
        filteredData = filteredData.filter(model => {
            const score = model.totalScore;
            switch (currentFilters.score) {
                case '90-100': return score >= 90;
                case '80-89': return score >= 80 && score < 90;
                case '70-79': return score >= 70 && score < 80;
                case '60-69': return score >= 60 && score < 70;
                case 'below-60': return score < 60;
                default: return true;
            }
        });
    }
    
    // 使用量筛选
    if (currentFilters.usage) {
        filteredData = filteredData.filter(model => {
            const usage = model.usage;
            switch (currentFilters.usage) {
                case 'high': return usage > 5000;
                case 'medium': return usage >= 1000 && usage <= 5000;
                case 'low': return usage < 1000;
                default: return true;
            }
        });
    }
    
    // 排序
    filteredData.sort((a, b) => {
        switch (currentFilters.sort) {
            case 'total-score':
                return b.totalScore - a.totalScore;
            case 'usage':
                return b.usage - a.usage;
            case 'market-change':
                return b.change - a.change;
            case 'price':
                return a.tokenPrice - b.tokenPrice;
            case 'name':
                return a.name.localeCompare(b.name);
            default:
                return b.totalScore - a.totalScore;
        }
    });
    
    // 更新表格显示
    populateBenchmarkTable(filteredData);
    
    // 更新结果统计
    updateResultsCount(filteredData.length, originalModelsData.length);
}

// 清除所有筛选条件
function clearAllFilters() {
    // 重置筛选状态
    currentFilters = {
        search: '',
        score: '',
        usage: '',
        sort: 'total-score'
    };
    
    // 重置界面元素
    document.querySelector('.search-input').value = '';
    document.querySelector('.sort-select').value = 'total-score';
    document.querySelectorAll('.filter-select').forEach(select => {
        select.value = '';
    });
    
    // 重新显示所有数据
    applyAllFilters();
}

// 更新结果统计
function updateResultsCount(filteredCount, totalCount) {
    // 将统计信息放在搜索控件内部，而不是 header 中
    const searchControls = document.querySelector('.search-controls');
    let countDisplay = searchControls.querySelector('.results-count');
    
    if (!countDisplay) {
        countDisplay = document.createElement('div');
        countDisplay.className = 'results-count';
        countDisplay.style.cssText = `
            text-align: right;
            margin-top: 10px;
            padding: 8px 16px;
            background: rgba(139, 92, 246, 0.1);
            border: 1px solid rgba(139, 92, 246, 0.2);
            border-radius: 6px;
        `;
        searchControls.appendChild(countDisplay);
    }
    
    countDisplay.innerHTML = `
        <span class="count-text">
            Showing <strong>${filteredCount}</strong> of <strong>${totalCount}</strong> models
        </span>
    `;
}

// 导出新函数
window.filterBenchmarkTable = filterBenchmarkTable;
window.filterByScore = filterByScore;
window.filterByUsage = filterByUsage;
window.sortBenchmarkTable = sortBenchmarkTable;
window.clearAllFilters = clearAllFilters;