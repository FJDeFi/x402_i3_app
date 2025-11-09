// Firebase 连接验证脚本
// 在浏览器控制台中运行此脚本来验证 Firebase 配置

console.log(' 开始验证 Firebase 配置...');

// 检查 window 对象上的 Firebase 实例
if (window.firebaseApp) {
    console.log(' window.firebaseApp 存在');
} else {
    console.log(' window.firebaseApp 不存在');
}

if (window.firebaseAuth) {
    console.log(' window.firebaseAuth 存在');
} else {
    console.log(' window.firebaseAuth 不存在');
}

if (window.firebaseDb) {
    console.log(' window.firebaseDb 存在');
} else {
    console.log(' window.firebaseDb 不存在');
}

if (window.currentUser) {
    console.log(' window.currentUser 存在:', window.currentUser.email);
} else {
    console.log('ℹ window.currentUser 不存在（用户未登录）');
}

// 测试 Firestore 写入
async function testFirestoreWrite() {
    try {
        console.log(' 测试 Firestore 写入...');
        const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
        await setDoc(doc(window.firebaseDb, 'test', 'from_console'), { 
            ok: true, 
            timestamp: Date.now(),
            test: 'Firebase 连接验证'
        }, { merge: true });
        console.log(' Firestore 写入测试成功！');
        console.log(' 请检查 Firebase 控制台中的 test/from_console 文档');
    } catch (error) {
        console.error(' Firestore 写入测试失败:', error);
    }
}

// 运行测试
testFirestoreWrite();
