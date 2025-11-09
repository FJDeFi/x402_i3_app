// Firebase配置文件
// 初始化Firebase并连接到您的项目

// 注意：这个文件需要在HTML中通过CDN引入Firebase SDK后使用
// 不要直接运行，需要在HTML中引入

// 配置参数 (这里是您项目的专属信息)
const firebaseConfig = {
    apiKey: "AIzaSyCYdWqXjUfNbUAMW1cm8neZQGTBTA63pfM",
    authDomain: "i3-testnet.firebaseapp.com",
    projectId: "i3-testnet",
    storageBucket: "i3-testnet.firebasestorage.app",
    messagingSenderId: "892139814159",
    appId: "1:892139814159:web:4df8548eef1d9bd9a1927a",
    measurementId: "G-KCDG3D1FCC"
};

// 初始化Firebase
const app = initializeApp(firebaseConfig);

// 初始化Analytics服务
const analytics = getAnalytics(app);

// 导出Firebase实例供其他模块使用
export { app, analytics };

// 在控制台输出确认信息
console.log('🔥 Firebase 初始化成功！');
console.log('📊 Analytics 服务已启用');
console.log('🔗 项目ID:', firebaseConfig.projectId); 