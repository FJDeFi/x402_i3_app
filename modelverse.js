// ================================
// Modelverse - modelverse.js (Replacement, v3.1)
// ================================
// New in v3.1:
//  • Donut Pie chart ALWAYS draws. If data.purchasedPercent is missing or >35, use demo-friendly random [10,35].
//  • Keeps v3 features: Category/Industry in modal; Market Change sign from row; search panel hidden on open;
//    robust button rebinding so every row opens its own card.
// ================================

const MODELVERSE_PRICING = (window.PricingUtils && window.PricingUtils.constants) || {
  pricePerApiCallUsdc: 0.0008,
  gasEstimatePerCallUsdc: 0.00025,
  sharePurchaseMinUsdc: 1,
  sharePurchaseMaxUsdc: 20
};

const USDC_ICON_PATH = 'svg/usdc.svg';

function formatNumeric(value, decimals) {
  const num = Number(value);
  if (!Number.isFinite(num)) return '—';
  return num.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

function renderUsdcBadge(value, decimals = 5) {
  if (!Number.isFinite(Number(value))) {
    return '<span class="usdc-amount">—</span>';
  }
  const formatted = formatNumeric(value, decimals);
  return `<span class="usdc-amount">${formatted}</span><img src="${USDC_ICON_PATH}" alt="USDC" class="usdc-icon" loading="lazy">`;
}

function formatUsdc(value, options = {}) {
  if (window.PricingUtils && typeof window.PricingUtils.formatUsdcAmount === 'function') {
    return window.PricingUtils.formatUsdcAmount(value, options);
  }
  const num = Number(value || 0);
  const min = options.minimumFractionDigits ?? 4;
  const max = options.maximumFractionDigits ?? 6;
  return `${num.toFixed(Math.min(Math.max(min, 0), max))} USDC`;
}

function getModelCallPricing(modelData) {
  if (window.PricingUtils && typeof window.PricingUtils.normalizeModelPricing === 'function') {
    const normalized = window.PricingUtils.normalizeModelPricing(modelData);
    return {
      pricePerCall: normalized.pricePerCallUsdc,
      gas: normalized.gasPerCallUsdc,
      share: normalized.sharePriceUsdc
    };
  }
  return {
    pricePerCall: MODELVERSE_PRICING.pricePerApiCallUsdc,
    gas: MODELVERSE_PRICING.gasEstimatePerCallUsdc,
    share: MODELVERSE_PRICING.sharePurchaseMinUsdc
  };
}

// ---------- Search ----------
function performSearch() {
  const input = document.getElementById('searchInput');
  const searchTerm = (input ? input.value : '').toLowerCase().trim();

  if (!searchTerm) {
    clearSearch();
    return;
  }

  const rows = document.querySelectorAll('.models-table tbody tr');
  let visibleCount = 0;

  rows.forEach(row => {
    const nameCell = row.querySelector('.model-name');
    const paperLink = row.querySelector('.paper-link a')?.href || '';
    if (!nameCell) return;

    const modelName = nameCell.textContent.trim();
    const modelData = (typeof getModelData === 'function') ? getModelData(modelName) : null;

    const searchable = [
      modelName,
      modelData?.purpose || '',
      modelData?.useCase || '',
      modelData?.category || '',
      modelData?.industry || '',
      paperLink
    ].join(' ').toLowerCase();

    if (searchable.includes(searchTerm)) {
      row.style.display = '';
      highlightSearchTerms(nameCell, searchTerm);
      visibleCount++;
    } else {
      row.style.display = 'none';
    }
  });

  updateSearchResultCount(visibleCount);
  bindModelTableInteractions();
}

function clearSearch() {
  const input = document.getElementById('searchInput');
  if (input) input.value = '';
  const rows = document.querySelectorAll('.models-table tbody tr');
  rows.forEach(row => {
    row.style.display = '';
    const nameCell = row.querySelector('.model-name');
    if (!nameCell) return;
    nameCell.innerHTML = nameCell.textContent;
    delete nameCell.dataset.bound;
  });
  updateSearchResultCount(rows.length);
  bindModelTableInteractions();
}

function highlightSearchTerms(cellEl, term) {
  const original = cellEl.textContent;
  const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')})`, 'gi');
  cellEl.innerHTML = original.replace(regex, '<span class="highlight" style="background-color:#fef3c7;padding:1px 3px;border-radius:3px;font-weight:bold;">$1</span>');
}

function updateSearchResultCount(count) {
  const total = document.querySelectorAll('.models-table tbody tr').length;
  const info = document.querySelector('.search-info') || document.getElementById('searchResults');
  if (info) info.textContent = `Showing ${count} / ${total} models`;
}

window.performSearch = performSearch;
window.clearSearch = clearSearch;

// ---------- Donut Chart ----------
function drawDonutChart(percent = 0) {
  console.log('drawDonutChart called with percent:', percent);
  const canvas = document.getElementById('shareChart');
  if (!canvas) {
    console.error('Canvas element not found!');
    return;
  }
  console.log('Canvas found, size:', canvas.width, 'x', canvas.height);
  const ctx = canvas.getContext('2d');
  const DPR = window.devicePixelRatio || 1;
  
  // 确保画布是正方形，使用固定的正方形尺寸
  const size = 180; // 固定尺寸确保完美圆形
  canvas.width = size * DPR;
  canvas.height = size * DPR;
  canvas.style.width = size + 'px';
  canvas.style.height = size + 'px';
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

  const purchased = Math.max(0, Math.min(100, Number(percent)||0));
  const cx = size/2, cy = size/2;
  // 调整圆环比例，确保完美的圆形
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
  
  console.log('Chart drawn successfully with percentage:', purchased.toFixed(1) + '%');
}

// ---------- Modal helpers ----------
function getFloatingSearchPanel() {
  const input = document.getElementById('searchInput');
  if (!input) return null;
  let panel = input.parentElement;
  if (panel && panel.parentElement) panel = panel.parentElement;
  return panel;
}

// When opened via row (preferred – gives us sign)
function showModelCardForRow(rowEl) {
  const modelName = rowEl?.querySelector('.model-name')?.textContent?.trim();
  if (!modelName) return;
  let sign = null;
  const deltaCell = rowEl.querySelector('.daily-delta');
  if (deltaCell) {
    if (deltaCell.classList.contains('negative')) sign = -1;
    else if (deltaCell.classList.contains('positive')) sign = 1;
    const txt = (deltaCell.textContent || '').trim();
    if (sign === null) sign = txt.startsWith('-') ? -1 : 1;
  }
  showModelCard(modelName, sign);
}

// Main entry
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
  if (purposeEl) {
    const shortText = (data.purpose || '—').substring(0, 200) + "...";
    purposeEl.innerHTML = `
      ${shortText}
      <br><br>
      <a href="#" class="view-full-content" data-content="${encodeURIComponent(data.purpose || '')}" data-type="Purpose">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
        View Full Content
      </a>
    `;
  }
  if (useCaseEl) {
    const shortText = (data.useCase || '—').substring(0, 150) + "...";
    useCaseEl.innerHTML = `
      ${shortText}
      <br><br>
        <a href="#" class="view-full-content" data-content="${encodeURIComponent(data.useCase || '')}" data-type="Use Case">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
        View Full Content
      </a>
    `;
  }
  if (categoryEl) categoryEl.textContent = data.category || '—';
  if (industryEl) industryEl.textContent = data.industry || '—';
  if (priceEl) {
    const pricing = getModelCallPricing(data);
    const perCall = formatUsdc(pricing.pricePerCall, { minimumFractionDigits: 4, maximumFractionDigits: 6 });
    const gas = formatUsdc(pricing.gas, { minimumFractionDigits: 5, maximumFractionDigits: 6 });
    priceEl.innerHTML = `${perCall} per call<br><span class="gas-hint">Estimated gas ≈ ${gas}</span>`;
  }

  // fix market change sign
  let changeVal = Number(data.change);
  if (Number.isFinite(changeVal) && signOverride) {
    changeVal = Math.abs(changeVal) * (signOverride > 0 ? 1 : -1);
  }
  if (changeEl) {
    changeEl.classList.remove('positive', 'negative');
    const sign = changeVal > 0 ? '+' : (changeVal < 0 ? '−' : '');
    if (changeVal > 0) changeEl.classList.add('positive');
    if (changeVal < 0) changeEl.classList.add('negative');
    changeEl.textContent = `${sign}${Math.abs(changeVal).toFixed(2)}%`;
  }

  if (ratingEl)  ratingEl.textContent = `${data.ratingFormatted}/5 (${data.starsHtml})`;

  // Show modal
  modal.classList.add('active');
  modal.style.display = 'flex';
  document.body.classList.add('mvpro-lock');

  // Hide floating search while modal is open
  const panel = getFloatingSearchPanel();
  if (panel) panel.style.display = 'none';
  const results = document.getElementById('searchResults');
  if (results) results.style.display = 'none';

  // Donut chart value: use data if present but cap at 35; otherwise random in [10,35]
  let purchased = Number(data.purchasedPercent);
  if (!Number.isFinite(purchased) || purchased <= 0) {
    purchased = 10 + Math.random() * 25; // 10–35
  } else {
    purchased = Math.min(35, purchased);
  }
  
  // 确保图表绘制 - 添加延迟确保 DOM 完全加载
  setTimeout(() => {
    drawDonutChart(purchased);
    console.log('Drawing chart with percentage:', purchased.toFixed(1) + '%');
  }, 200);
  
  // 更新图例显示具体数据
  const legendItems = modal.querySelectorAll('.mvpro-legend .item');
  if (legendItems.length >= 2) {
    const purchasedItem = legendItems[0];
    const remainingItem = legendItems[1];
    
    // 更新 Purchased (%) 显示具体数据
    const purchasedText = purchasedItem.textContent.replace('Purchased (%)', `Purchased (${purchased.toFixed(1)}%)`);
    purchasedItem.textContent = purchasedText;
    
    // 更新 Remaining (%) 显示具体数据
    const remaining = 100 - purchased;
    const remainingText = remainingItem.textContent.replace('Remaining (%)', `Remaining (${remaining.toFixed(1)}%)`);
    remainingItem.textContent = remainingText;
  }
  
  // 也在图表下方显示百分比
  const percentageEl = $('#chartPercentage');
  if (percentageEl) {
    percentageEl.textContent = `${purchased.toFixed(1)}% Purchased`;
  }
}

function closeModal() {
  const modal = document.getElementById('modelCartModal');
  if (!modal) return;
  modal.classList.remove('active');
  modal.style.display = 'none';
  document.body.classList.remove('mvpro-lock');

  const panel = getFloatingSearchPanel();
  if (panel) panel.style.display = '';
  const results = document.getElementById('searchResults');
  if (results) results.style.display = '';
}

window.addEventListener('click', function(e) {
  const modal = document.getElementById('modelCartModal');
  if (e.target === modal) closeModal();
});

window.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closeModal();
});

function closeModelCart(){ closeModal(); }
window.closeModal = closeModal;
window.closeModelCart = closeModelCart;
window.showModelCard = showModelCard;
window.showModelCardForRow = showModelCardForRow;

// ---------- Page init ----------
document.addEventListener('DOMContentLoaded', function() {
  renderModelTable();
  bindModelTableInteractions();

  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') performSearch();
    });
    searchInput.addEventListener('input', function() {
      if (this.value === '') clearSearch();
    });
  }

  updateSearchResultCount(document.querySelectorAll('.models-table tbody tr').length);
});

// ---------- Try / Cart ----------
function tryModelFromModelverse(button) {
  const row = button.closest('tr');
  const modelName = row?.querySelector('.model-name')?.textContent?.trim();
  if (!modelName) return;

  const data = (typeof getModelData === 'function') ? getModelData(modelName) : null;
  if (!data) {
    alert('❌ Model data not found. Please try again.');
    return;
  }

  alert(`🚀 Trying "${modelName}"...\n\nModel Info:\n• Category: ${data.category}\n• Industry: ${data.industry}\n• Purpose: ${data.purpose}\n• Use Case: ${data.useCase}\n\nRedirecting to model interface...`);

  const original = button.textContent;
  button.textContent = 'Trying...';
  button.disabled = true;
  button.style.opacity = '0.7';
  setTimeout(() => {
    button.textContent = original;
    button.disabled = false;
    button.style.opacity = '';
  }, 1500);
}

function addToCartFromModelverse(button) {
  const row = button.closest('tr');
  const modelName = row?.querySelector('.model-name')?.textContent?.trim();
  if (!modelName) return;

  const data = (typeof getModelData === 'function') ? getModelData(modelName) : null;
  if (!data) {
    alert('❌ Model data not found. Please try again.');
    return;
  }

  const ok = addToCartStorage(modelName, 1, 0);
  if (ok) {
    button.textContent = 'Added ✓';
    button.style.background = '#10b981';
    button.disabled = true;
    // Stay on page; do not redirect
  } else {
    alert('❌ Failed to add to cart. Please try again.');
  }
}

function addToCartStorage(modelName, tokenQuantity = 1, shareQuantity = 0) {
  try {
    const data = (typeof getModelData === 'function') ? getModelData(modelName) : null;
    if (!data) return false;

    let items = JSON.parse(localStorage.getItem('cartItems')) || [];
    const ex = items.find(x => x.modelName === modelName);
    if (ex) {
      ex.tokenQuantity = (ex.tokenQuantity || 0) + tokenQuantity;
      ex.shareQuantity = (ex.shareQuantity || 0) + shareQuantity;
    } else {
      items.push({
        modelName,
        tokenQuantity,
        shareQuantity,
        addedAt: new Date().toISOString()
      });
    }
    localStorage.setItem('cartItems', JSON.stringify(items));
    console.log('✅ Added to cart:', modelName, 'Tokens:', tokenQuantity, 'Shares:', shareQuantity);
    return true;
  } catch (err) {
    console.error('❌ addToCartStorage failed:', err);
    return false;
  }
}

window.tryModelFromModelverse = tryModelFromModelverse;
window.addToCartFromModelverse = addToCartFromModelverse;
window.addToCartStorage = addToCartStorage;

// ---------- Data access helper ----------
function getModelData(name) {
  if (typeof MODEL_DATA !== 'object') return null;
  return MODEL_DATA[name] || null;
}

// ====== ACTION 列注入 ======
(function () {
  document.addEventListener('DOMContentLoaded', injectActionColumn);

  function injectActionColumn() {
    const table = document.querySelector('.models-table');
    if (!table) return;

    // 1) 表头追加「Action」
    const headRow = table.querySelector('thead tr');
    if (headRow && !headRow.querySelector('th.action-col')) {
      const th = document.createElement('th');
      th.className = 'action-col';
      th.textContent = 'Action';
      headRow.appendChild(th);
    }

    // 2) 每一行追加按钮列
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(row => {
      if (row.querySelector('td.action-cell')) return; // 已注入则跳过
      const nameCell = row.querySelector('.model-name');
      if (!nameCell) return;
      const modelName = nameCell.textContent.trim();

      const td = document.createElement('td');
      td.className = 'action-cell';
      td.innerHTML = `
        <div class="invest">
          <button class="try-btn">Try</button>
          <button class="add-cart-btn">Add to Cart</button>
        </div>
      `;
      const tryBtn = td.querySelector('.try-btn');
      const addBtn = td.querySelector('.add-cart-btn');
      tryBtn.addEventListener('click', () => tryModel(modelName));
      addBtn.addEventListener('click', () => addToCart(modelName));
      row.appendChild(td);
    });
  }

  // ====== 与 Benchmark 一致的 Try / Add to Cart 行为 ======
  // Try：关掉 Auto Router、写入 running 状态并跳到 index.html
  window.tryModel = function (modelName) {
    const modelData = (typeof getModelData === 'function') ? getModelData(modelName) : null;

    // 记录当前选择的模型（不要存任何私钥）
    localStorage.setItem('currentModel', JSON.stringify({
      name: modelName,
      category: modelData?.category,
      industry: modelData?.industry,
      purpose: modelData?.purpose,
      useCase: modelData?.useCase
    }));

    // 与 Benchmark 页相同的工作流约定：running + 关闭 Auto Router
    // （Benchmark 里也是在 tryModel 里做同样的事）
    localStorage.setItem('autoRouter', 'off');
    localStorage.setItem('currentWorkflow', JSON.stringify({
      name: modelName,
      status: 'running',
      startedAt: new Date().toISOString()
    }));

    // 去聊天页，首页会读取 running 状态并显示"Running …"
    // （index.html 的这套展示逻辑你已具备）
    window.location.href = 'index.html?tryModel=' + encodeURIComponent(modelName);
  };

  // Add to Cart：与 Benchmark 一致的功能
  window.addToCart = function (modelName) {
    const modelData = (typeof getModelData === 'function') ? getModelData(modelName) : null;
    if (modelData) {
      // 添加到购物车并跳转 (默认添加1个token)
      const success = addToCartStorage(modelName, 1, 0);
      if (success) {
        // 更新按钮状态
        const button = event.target;
        button.textContent = 'Added ✓';
        button.style.background = '#10b981';
        button.disabled = true;
        // Stay on page; do not redirect
      } else {
        alert('❌ Failed to add to cart. Please try again.');
      }
    } else {
      alert('❌ Model data not found. Please try again.');
    }
  };
})();

function getAllModelEntries(limit = 300) {
  if (typeof getTopModelsByScore === 'function') {
    return getTopModelsByScore(limit);
  }
  if (typeof MODEL_DATA === 'object' && MODEL_DATA) {
    return Object.entries(MODEL_DATA)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => (Number(b.totalScore) || 0) - (Number(a.totalScore) || 0))
      .slice(0, limit);
  }
  return [];
}

function renderModelTable() {
  const tbody = document.getElementById('modelsTableBody');
  if (!tbody) return;

  const models = getAllModelEntries(400);
  const fragment = document.createDocumentFragment();

  models.forEach(model => {
    const pricing = getModelCallPricing(model);
    const perCallBadge = renderUsdcBadge(pricing.pricePerCall, 5);
    const shareBadge = renderUsdcBadge(pricing.share, 2);
    const gasEstimate = formatUsdc(pricing.gas, { minimumFractionDigits: 5, maximumFractionDigits: 6 });
    const changeValue = Number(model.change) || 0;
    const changeClass = changeValue >= 0 ? 'positive' : 'negative';
    const changeText = `${changeValue >= 0 ? '+' : ''}${changeValue.toFixed(2)}%`;
    const usageText = Number.isFinite(Number(model.usage)) ? Number(model.usage).toLocaleString() : '—';
    const compatibilityText = Number.isFinite(Number(model.compatibility)) ? Number(model.compatibility).toFixed(1) : '—';
    const totalScoreText = Number.isFinite(Number(model.totalScore)) ? `${Number(model.totalScore).toFixed(0)}%` : '—';

    const row = document.createElement('tr');
    row.innerHTML = `
      <td class="model-name">${model.name}</td>
      <td class="category">${model.category || '—'}</td>
      <td class="industry">${model.industry || '—'}</td>
      <td class="api-price"><div class="price-badge">${perCallBadge}</div></td>
      <td class="api-price"><div class="price-badge">${shareBadge}</div></td>
      <td class="daily-delta ${changeClass}">${changeText}</td>
      <td class="usage-score">${usageText}</td>
      <td class="compatibility-score">${compatibilityText}</td>
      <td class="total-score">${totalScoreText}</td>
      <td class="action-cell">
        <div class="invest">
          <button class="model-card-btn">Details</button>
          <button class="try-btn">Try</button>
          <button class="add-cart-btn">Add to Cart</button>
        </div>
      </td>
    `;
    fragment.appendChild(row);
  });

  tbody.innerHTML = '';
  tbody.appendChild(fragment);
  updateSearchResultCount(models.length);
}

function bindModelTableInteractions() {
  document.querySelectorAll('.model-card-btn').forEach(btn => {
    if (btn.dataset.bound === '1') return;
    btn.dataset.bound = '1';
    try { btn.removeAttribute('onclick'); } catch (e) {}
    btn.addEventListener('click', function(ev) {
      ev.preventDefault();
      const row = this.closest('tr');
      if (row) {
        showModelCardForRow(row);
      } else {
        const modelName = this.textContent.trim();
        if (modelName) showModelCard(modelName);
      }
    });
  });

  document.querySelectorAll('.model-name').forEach(cell => {
    if (cell.dataset.bound === '1') return;
    cell.dataset.bound = '1';
    cell.style.cursor = 'pointer';
    cell.style.color = '#3b82f6';
    cell.addEventListener('click', function() {
      const row = this.closest('tr');
      if (row) {
        showModelCardForRow(row);
      } else {
        showModelCard(this.textContent.trim());
      }
    });
  });

  document.querySelectorAll('.try-btn').forEach(btn => {
    if (btn.dataset.bound === '1') return;
    btn.dataset.bound = '1';
    btn.addEventListener('click', function(ev) {
      ev.preventDefault();
      const row = this.closest('tr');
      const modelName = row?.querySelector('.model-name')?.textContent?.trim();
      if (modelName) {
        if (typeof window.tryModel === 'function') {
          window.tryModel(modelName);
        } else {
          tryModelFromModelverse(this);
        }
      }
    });
  });

  document.querySelectorAll('.add-cart-btn').forEach(btn => {
    if (btn.dataset.bound === '1') return;
    btn.dataset.bound = '1';
    btn.addEventListener('click', function(ev) {
      ev.preventDefault();
      const row = this.closest('tr');
      const modelName = row?.querySelector('.model-name')?.textContent?.trim();
      if (!modelName) return;
      if (typeof window.addToCart === 'function') {
        window.addToCart(modelName);
      } else {
        addToCartFromModelverse(this);
      }
    });
  });
}

// 创建全屏滚动弹窗
function showFullContentModal(content, title = 'Content') {
  const fullModal = document.createElement('div');
  fullModal.className = 'full-content-modal';
  fullModal.innerHTML = `
    <div class="full-content-overlay">
      <div class="full-content-container">
        <div class="full-content-header">
          <h3>Complete ${title}</h3>
          <button class="close-full-content">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="full-content-body">
          ${content}
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(fullModal);
  
  // 关闭事件
  fullModal.querySelector('.close-full-content').addEventListener('click', () => {
    document.body.removeChild(fullModal);
  });
  
  fullModal.addEventListener('click', (e) => {
    if (e.target === fullModal.querySelector('.full-content-overlay')) {
      document.body.removeChild(fullModal);
    }
  });
}

// 为模态框添加点击事件处理

document.addEventListener('click', function(e) {
  if (e.target.classList.contains('view-full-content') || e.target.closest('.view-full-content')) {
    e.preventDefault();
    const link = e.target.closest('.view-full-content');
    const fullContent = decodeURIComponent(link.dataset.content);
    const contentType = link.dataset.type || 'Content'; // 获取内容类型
    showFullContentModal(fullContent, contentType); // 传递标题参数
  }
});

window.showFullContentModal = showFullContentModal;