// social-tasks.js - 社交任务功能

// 配置
const SOCIAL_TASKS_CONFIG = {
    twitter: {
        username: 'I3_Cubed',
        url: 'https://x.com/I3_Cubed',
        reward: 20
    },
    telegram: {
        url: 'https://t.me/I3_Cubed',  // 替换为你的 TG 群组链接
        reward: 20
    }
};

// NEW: 全局定时器与“处理中”标记
let _followXTimerId = null;
window._followXProcessing = false;


// 初始化任务状态
function initializeSocialTasks() {
    console.log('🎯 Initializing social tasks...');
    
    // 检查钱包是否连接
    if (!window.walletManager || !window.walletManager.isConnected) {
        console.log('❌ Wallet not connected, hiding tasks');
        const section = document.getElementById('socialTasksSection');
        if (section) section.style.display = 'none';
        return;
    }
    
    console.log('✅ Wallet connected, showing tasks');
    
    // 显示任务区域
    const section = document.getElementById('socialTasksSection');
    if (section) {
        section.style.display = 'block';
        console.log('✅ Tasks section displayed');
    } else {
        console.warn('⚠️ socialTasksSection not found in DOM');
    }
    
    // 检查任务完成状态
    checkTaskStatus();
}

// 检查任务完成状态
async function checkTaskStatus() {
    try {
        if (!window.firebaseDb || !window.walletManager.walletAddress) {
            console.log('⏳ Firebase or wallet not ready, skipping task status check');
            return;
        }
        
        const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
        const address = window.walletManager.walletAddress.toLowerCase();
        const walletRef = doc(window.firebaseDb, 'wallets', address);
        const walletSnap = await getDoc(walletRef);
        
        if (walletSnap.exists()) {
            const data = walletSnap.data();
            const tasks = data.tasks || {};
            
            console.log('📊 Task status:', tasks);
            
            // 更新 X 任务状态（加上 30s 保护，防止过早显示 Completed）
            if (!window._followXProcessing && tasks.followX && tasks.followX.completed) {
                markTaskCompleted('taskFollowX', 'btnFollowX');
                console.log('✅ X task already completed');
            }
            
            // 更新 TG 任务状态
            if (tasks.joinTelegram && tasks.joinTelegram.completed) {
                markTaskCompleted('taskJoinTG', 'btnJoinTG');
                console.log('✅ TG task already completed');
            }
        }
    } catch (error) {
        console.warn('Failed to check task status:', error);
    }
}

// 标记任务为完成状态
function markTaskCompleted(taskId, buttonId) {
    const button = document.getElementById(buttonId);
    if (button) {
        button.textContent = 'Completed!';
        button.classList.add('completed');
        button.onclick = null;
        console.log(`✅ Marked ${taskId} as completed`);
    }
}

// ========== Follow X 任务 ==========

function openFollowXModal() {
  console.log('🐦 Opening Follow X modal...');

  isTaskCompleted('followX').then(completed => {
    // 如果仍在30s处理期，即使后端是 completed:true 也允许打开弹窗
    if (completed && !window._followXProcessing) {
      showNotification('You have already submitted this task.', 'error');
      return;
    }

    const modal = document.getElementById('followXModal');
    if (!modal) return;

    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('show'), 10);

    // 清输入 & 隐状态
    const input = document.getElementById('twitterHandleInput');
    if (input) input.value = '';

    const status = document.getElementById('followXStatus');
    if (status) status.style.display = 'none';

    // 打开时复原按钮
    const btn = document.querySelector('.confirm-button');
    if (btn) {
      btn.disabled = false;
      btn.dataset.busy = '0';
      btn.textContent = 'Confirm';
    }

    // 如果正在 processing，重现“倒计时状态”并禁用按钮，防止重复提交
    if (window._followXProcessing) {
      const TOTAL = 30;
      const start = window._followXStartTs || Date.now();
      const elapsed = Math.floor((Date.now() - start) / 1000);
      const left = Math.max(0, TOTAL - elapsed);

      if (btn) {
        btn.disabled = true;
        btn.dataset.busy = '1';
        btn.textContent = 'Processing…';
      }
      showStatusMessage(`Processing… ${left}s`, 'pending');
    }
  });
}



// 关闭 Follow X 模态框（允许处理中关闭）
function closeFollowXModal() {
  const wasProcessing = !!window._followXProcessing; // 记录是否处于30s处理中

  const modal = document.getElementById('followXModal');
  if (modal) {
    modal.classList.remove('show');
    setTimeout(() => {
      modal.style.display = 'none';
    }, 250);
  }

  // 如果用户在processing中手动关闭，给个温和提示：后台继续计时，完成后会自动加分
  if (wasProcessing) {
    showNotification('Processing in background. You’ll get the credits shortly.', 'success');
  }
}


// 打开 X 主页
function openTwitterProfile() {
    window.open('https://x.com/I3_Cubed', '_blank', 'noopener,noreferrer');
}

// 确认 Follow X 任务
// 确认 Follow X 任务（30s 倒计时；允许中途关闭；到点再完成+加分）
async function confirmFollowX() {
  const input = document.getElementById('twitterHandleInput');
  const handle = (input?.value || '').trim();
  if (!handle) { showStatusMessage('Please enter your Twitter handle', 'error'); return; }

  const cleanHandle = handle.replace(/^@/, '');
  if (await isTaskCompleted('followX')) {
    showStatusMessage('You have already submitted this task.', 'error');
    return;
  }

  // 防二次点击 + 进入30s保护
  const confirmBtn = document.querySelector('.confirm-button');
  if (confirmBtn?.dataset.busy === '1') return;
  if (confirmBtn) {
    confirmBtn.disabled = true;
    confirmBtn.dataset.busy = '1';
    confirmBtn.textContent = 'Processing…';
  }
  window._followXProcessing = true;
  window._followXStartTs = Date.now();

  // 30s 倒计时提示
  const TOTAL = 30;
  let left = TOTAL;
  const tick = () => showStatusMessage(`Processing… ${left}s`, 'pending');
  tick();
  if (typeof _followXTimerId !== 'undefined' && _followXTimerId) clearInterval(_followXTimerId);
  _followXTimerId = setInterval(() => { left -= 1; if (left >= 0) tick(); }, 1000);

  try {
    // 立即写库（当前语义：直接 completed:true + increment）
    await saveFollowXTask(cleanHandle);

    // 满 30 秒再完成与加分提示
    setTimeout(() => {
      // 清理倒计时
      if (_followXTimerId) { clearInterval(_followXTimerId); _followXTimerId = null; }

      // 结束保护 → 允许抽屉更新
      window._followXProcessing = false;

      // 抽屉标记为 Completed
      markTaskCompleted('taskFollowX', 'btnFollowX');

      // 本地加分并刷新
      if (window.walletManager) {
        window.walletManager.credits += SOCIAL_TASKS_CONFIG.twitter.reward;
        window.walletManager.saveToStorage();
        window.walletManager.updateUI();
      }

      // 根据 modal 是否仍打开，分支处理反馈
      const modal = document.getElementById('followXModal');
      const isOpen = !!(modal && modal.classList.contains('show'));

      if (isOpen) {
        // 弹窗里提示成功 → 1s 后自动关闭
        showStatusMessage(`Success! +${SOCIAL_TASKS_CONFIG.twitter.reward} I3 tokens earned 🎉`, 'success');
        setTimeout(() => {
          if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.dataset.busy = '0';
            confirmBtn.textContent = 'Confirm';
          }
          closeFollowXModal();
          showNotification(`+${SOCIAL_TASKS_CONFIG.twitter.reward} I3 tokens earned! 🎉`, 'success');
        }, 1000);
      } else {
        // 用户已提前关闭：直接用站内通知反馈，不触摸已关闭的弹窗 DOM
        if (confirmBtn) {
          confirmBtn.disabled = false;
          confirmBtn.dataset.busy = '0';
          confirmBtn.textContent = 'Confirm';
        }
        showNotification(`+${SOCIAL_TASKS_CONFIG.twitter.reward} I3 tokens earned! 🎉`, 'success');
      }
    }, TOTAL * 1000);

  } catch (error) {
    console.error('Failed to confirm follow task:', error);
    if (_followXTimerId) { clearInterval(_followXTimerId); _followXTimerId = null; }
    showStatusMessage('Failed to submit. Please try again.', 'error');

    // 出错 → 结束保护并还原按钮
    window._followXProcessing = false;
    if (confirmBtn) {
      confirmBtn.disabled = false;
      confirmBtn.dataset.busy = '0';
      confirmBtn.textContent = 'Confirm';
    }
  }
}


// 保存 Follow X 任务到 Firebase
async function saveFollowXTask(twitterHandle) {
    if (!window.firebaseDb || !window.walletManager.walletAddress) {
        throw new Error('Firebase not ready');
    }
    
    const { doc, setDoc, serverTimestamp, increment } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
    const address = window.walletManager.walletAddress.toLowerCase();
    const walletRef = doc(window.firebaseDb, 'wallets', address);
    
    await setDoc(walletRef, {
        tasks: {
            followX: {
                completed: true,
                completedAt: serverTimestamp(),
                twitterHandle: twitterHandle,
                reward: SOCIAL_TASKS_CONFIG.twitter.reward
            }
        },
        credits: increment(SOCIAL_TASKS_CONFIG.twitter.reward),
        lastUpdated: serverTimestamp()
    }, { merge: true });
    
    console.log('✅ Follow X task saved to Firebase');
}

// 显示状态消息
function showStatusMessage(message, type) {
    let statusDiv = document.getElementById('followXStatus');
    if (!statusDiv) return;
    
    statusDiv.textContent = message;
    statusDiv.className = `status-message ${type}`;
    statusDiv.style.display = 'block';
}

// ========== Join Telegram 任务 ==========

async function handleJoinTelegram() {
    console.log('📱 Join Telegram clicked');
    
    try {
        // 检查是否已完成
        if (await isTaskCompleted('joinTelegram')) {
            showNotification('You have already completed this task.', 'success');
            return;
        }
        
        // 打开 Telegram 群组
        window.open(SOCIAL_TASKS_CONFIG.telegram.url, '_blank', 'noopener,noreferrer');
        
        // 立即标记为完成（信任制）
        await saveJoinTelegramTask();
        
        // 更新 UI
        markTaskCompleted('taskJoinTG', 'btnJoinTG');
        
        // 更新积分
        if (window.walletManager) {
            window.walletManager.credits += SOCIAL_TASKS_CONFIG.telegram.reward;
            window.walletManager.saveToStorage();
            window.walletManager.updateUI();
        }
        
        showNotification(`+${SOCIAL_TASKS_CONFIG.telegram.reward} I3 tokens earned! 🎉`, 'success');
        
    } catch (error) {
        console.error('Failed to handle Telegram task:', error);
        showNotification('Failed to save. Please try again.', 'error');
    }
}

// 保存 Join Telegram 任务到 Firebase
async function saveJoinTelegramTask() {
    if (!window.firebaseDb || !window.walletManager.walletAddress) {
        throw new Error('Firebase not ready');
    }
    
    const { doc, setDoc, serverTimestamp, increment } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
    const address = window.walletManager.walletAddress.toLowerCase();
    const walletRef = doc(window.firebaseDb, 'wallets', address);
    
    await setDoc(walletRef, {
        tasks: {
            joinTelegram: {
                completed: true,
                completedAt: serverTimestamp(),
                reward: SOCIAL_TASKS_CONFIG.telegram.reward
            }
        },
        credits: increment(SOCIAL_TASKS_CONFIG.telegram.reward),
        lastUpdated: serverTimestamp()
    }, { merge: true });
    
    console.log('✅ Join Telegram task saved to Firebase');
}

// ========== 工具函数 ==========

async function isTaskCompleted(taskName) {
    try {
        if (!window.firebaseDb || !window.walletManager.walletAddress) return false;
        
        const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
        const address = window.walletManager.walletAddress.toLowerCase();
        const walletRef = doc(window.firebaseDb, 'wallets', address);
        const walletSnap = await getDoc(walletRef);
        
        if (walletSnap.exists()) {
            const data = walletSnap.data();
            return data.tasks && data.tasks[taskName] && data.tasks[taskName].completed;
        }
        
        return false;
    } catch (error) {
        console.error('Failed to check task status:', error);
        return false;
    }
}

// FIX: 防止递归—捕获真正的全局实现并转发
(function () {
  // 记录当下页面上已经存在的“真正的”全局通知函数（如果有）
  const __globalNotify = (typeof window.showNotification === 'function')
    ? window.showNotification
    : null;

  // 用同名函数，但只转发到“被捕获”的原实现；避免再调自己导致递归
  window.showNotification = function (message, type = 'info', opts) {
    if (typeof __globalNotify === 'function') {
      return __globalNotify(message, type, opts);
    }
    try { alert(message); } catch {}
  };
})();


// ========== 事件监听 ==========

// 监听钱包连接事件
window.addEventListener('walletConnected', function() {
    console.log('👛 Wallet connected event received, initializing tasks...');
    setTimeout(() => {
        initializeSocialTasks();
    }, 500);
});

// 监听钱包断开事件
window.addEventListener('walletDisconnected', function() {
    console.log('👛 Wallet disconnected, hiding tasks');
    const section = document.getElementById('socialTasksSection');
    if (section) section.style.display = 'none';
});

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM loaded, checking wallet status...');
    setTimeout(() => {
        initializeSocialTasks();
    }, 1000);
});

// 监听 Account Dropdown 注入事件
window.addEventListener('accountDropdownInjected', function() {
    console.log('📋 Account dropdown injected, initializing tasks...');
    setTimeout(() => {
        initializeSocialTasks();
    }, 100);
});

// 导出到全局
window.openFollowXModal = openFollowXModal;
window.handleJoinTelegram = handleJoinTelegram;
window.initializeSocialTasks = initializeSocialTasks;

console.log('✅ Social tasks module loaded');