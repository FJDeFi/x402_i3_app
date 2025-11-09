const hre = require("hardhat");

async function main() {
  console.log("🔧 Transferring tokens to reduce concentration...");
  
  // 合约地址
  const TOKEN_ADDRESSES = {
    bscmainnet: "0x4ec682AAA62cafee3aDf2c4c2fD04Bd0AC1b2A9a",
    opbnbmainnet: "0xF0E019Bb23a4c314db4df42a70Af128987Fba285"
  };
  
  const tokenAddress = TOKEN_ADDRESSES[hre.network.name];
  if (!tokenAddress) {
    console.log("❌ Unsupported network");
    return;
  }
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("Using account:", deployer.address);
  
  // 连接到代币合约
  const I3Token = await hre.ethers.getContractFactory("I3Token");
  const token = I3Token.attach(tokenAddress);
  
  // 检查当前状态
  const currentBalance = await token.balanceOf(deployer.address);
  const totalSupply = await token.totalSupply();
  const currentPercentage = (currentBalance * 100n) / totalSupply;
  
  console.log("Current balance:", hre.ethers.formatEther(currentBalance), "I3T");
  console.log("Total supply:", hre.ethers.formatEther(totalSupply), "I3T");
  console.log("Current percentage:", currentPercentage.toString() + "%");
  
  // 目标：持有35%，转移65%
  const targetPercentage = 35n;
  const targetBalance = (totalSupply * targetPercentage) / 100n;
  const transferAmount = currentBalance - targetBalance;
  
  if (transferAmount <= 0) {
    console.log("✅ Already below threshold");
    return;
  }
  
  console.log("Need to transfer:", hre.ethers.formatEther(transferAmount), "I3T");
  console.log("Target percentage:", targetPercentage.toString() + "%");
  
  // 转移到销毁地址
  const deadAddress = "0x000000000000000000000000000000000000dEaD";
  
  try {
    console.log("📤 Transferring tokens to burn address...");
    const tx = await token.transfer(deadAddress, transferAmount);
    console.log("Transaction hash:", tx.hash);
    await tx.wait();
    console.log("✅ Transfer successful!");
    
    // 验证结果
    const newBalance = await token.balanceOf(deployer.address);
    const newPercentage = (newBalance * 100n) / totalSupply;
    
    console.log("New balance:", hre.ethers.formatEther(newBalance), "I3T");
    console.log("New percentage:", newPercentage.toString() + "%");
    
    if (newPercentage <= 40n) { // 40% threshold for audit
      console.log("🎉 Successfully reduced below 40% threshold!");
    }
    
  } catch (error) {
    console.log("❌ Transfer failed:", error.message);
  }
}

main()
  .then(() => {
    console.log("✅ Token transfer completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Transfer failed:", error);
    process.exit(1);
  });