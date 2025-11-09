const hre = require("hardhat");

async function main() {
  const TOKEN_ADDRESS = "0x4ec682AAA62cafee3aDf2c4c2fD04Bd0AC1b2A9a";
  const DEAD_ADDRESS = "0x000000000000000000000000000000000000dEaD";
  
  const [deployer] = await hre.ethers.getSigners();
  const I3Token = await hre.ethers.getContractFactory("I3Token");
  const token = I3Token.attach(TOKEN_ADDRESS);
  
  console.log("=== 验证转移结果 ===");
  
  const ownerBalance = await token.balanceOf(deployer.address);
  const deadBalance = await token.balanceOf(DEAD_ADDRESS);
  const totalSupply = await token.totalSupply();
  
  console.log("Owner balance:", hre.ethers.formatEther(ownerBalance), "I3T");
  console.log("Dead address balance:", hre.ethers.formatEther(deadBalance), "I3T");
  console.log("Total supply:", hre.ethers.formatEther(totalSupply), "I3T");
  
  const ownerPct = (ownerBalance * 100n) / totalSupply;
  const deadPct = (deadBalance * 100n) / totalSupply;
  
  console.log("Owner percentage:", ownerPct.toString() + "%");
  console.log("Dead address percentage:", deadPct.toString() + "%");
  
  // 检查交易详情
  const tx = await hre.ethers.provider.getTransaction("0x8581fce82fd6044874808e98b5aaa8baa8cbc5f1f03fc3865e29d13df3157c7f");
  const receipt = await hre.ethers.provider.getTransactionReceipt("0x8581fce82fd6044874808e98b5aaa8baa8cbc5f1f03fc3865e29d13df3157c7f");
  
  console.log("Transaction status:", receipt.status === 1 ? "Success" : "Failed");
  console.log("Gas used:", receipt.gasUsed.toString());
}

main().catch(console.error);