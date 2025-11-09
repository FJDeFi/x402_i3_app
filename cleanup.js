const fs = require('fs');
const path = require('path');

console.log('🧹 开始清理不必要的文件...');

// 要删除的文件列表
const filesToDelete = [
    // 测试文件
    'google-login-test.html',
    'test-simple-google-auth.html',
    'test-google-auth.html',
    'test-simple-auth.ps1',
    'start-google-auth-test.ps1',
    
    // PowerShell 脚本（保留主要的）
    'start-simple.ps1',
    'start-clean.ps1',
    'start-server.ps1',
    'test-google-login.ps1',
    
    // 重复或过时的文件
    'benchmark_modified.html',
    'modelverse_modal_pro.html',
    'modelverse_pro.css',
    'modelverse_pro.js',
    'modal.css',
    'tooltip_fix.css',
    'clear_cart_data.html',
    'remove_cart_buttons.js',
    
    // 文档文件（保留主要的）
    'GOOGLE_AUTH_SETUP.md',
    'DEPLOYMENT_CHECKLIST.md',
    'DEPLOY_TO_VERCEL.md',
    'ENVIRONMENT_VARIABLES.md',
    'QUICK_START.md',
    'PROJECT_STATUS.md',
    'UPDATE_SUMMARY.md',
    
    // 部署相关（保留主要的）
    'deploy.ps1',
    'deploy.sh',
    'clean-vercel.js',
    'copy-assets.js',
    'vite.config.js',
    
    // 其他不必要的文件
    'script.js',
    'intelligence-cubed-logo.svg',
    'i3-token-logo.svg',
    '.gitattributes',
    'LICENSE'
];

// 要删除的目录
const dirsToDelete = [
    'dist',
    'dataconnect'
];

// 删除文件
function deleteFile(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`✅ 已删除文件: ${filePath}`);
            return true;
        } else {
            console.log(`⚠️  文件不存在: ${filePath}`);
            return false;
        }
    } catch (error) {
        console.error(`❌ 删除文件失败 ${filePath}:`, error.message);
        return false;
    }
}

// 删除目录
function deleteDir(dirPath) {
    try {
        if (fs.existsSync(dirPath)) {
            fs.rmSync(dirPath, { recursive: true, force: true });
            console.log(`✅ 已删除目录: ${dirPath}`);
            return true;
        } else {
            console.log(`⚠️  目录不存在: ${dirPath}`);
            return false;
        }
    } catch (error) {
        console.error(`❌ 删除目录失败 ${dirPath}:`, error.message);
        return false;
    }
}

// 执行清理
let deletedFiles = 0;
let deletedDirs = 0;

console.log('\n📁 删除不必要的文件...');
filesToDelete.forEach(file => {
    if (deleteFile(file)) {
        deletedFiles++;
    }
});

console.log('\n📂 删除不必要的目录...');
dirsToDelete.forEach(dir => {
    if (deleteDir(dir)) {
        deletedDirs++;
    }
});

// 清理结果
console.log('\n🎉 清理完成！');
console.log(`📊 统计结果:`);
console.log(`   - 删除文件: ${deletedFiles} 个`);
console.log(`   - 删除目录: ${deletedDirs} 个`);
console.log(`   - 保留的核心文件:`);
console.log(`     • index.html (主页面)`);
console.log(`     • 各个功能页面 (.html)`);
console.log(`     • 样式文件 (.css)`);
console.log(`     • 脚本文件 (.js)`);
console.log(`     • 配置文件 (package.json, server.js)`);
console.log(`     • 资源目录 (svg/, public/)`);
console.log(`     • 文档 (README.md)`);

// 检查是否还有不必要的文件
console.log('\n🔍 检查剩余文件...');
const remainingFiles = fs.readdirSync('.');
const unnecessaryRemaining = remainingFiles.filter(file => {
    const ext = path.extname(file);
    return file.includes('test') || 
           file.includes('Test') || 
           (ext === '.ps1' && !file.includes('start')) ||
           file.includes('_modified') ||
           file.includes('_pro');
});

if (unnecessaryRemaining.length > 0) {
    console.log('⚠️  可能还有这些文件需要手动检查:');
    unnecessaryRemaining.forEach(file => {
        console.log(`   - ${file}`);
    });
} else {
    console.log('✅ 所有不必要的文件都已清理完毕！');
} 