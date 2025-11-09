const hre = require("hardhat");

async function main() {
  const TOKEN_ADDRESS = "0xF0E019Bb23a4c314db4df42a70Af128987Fba285"; // opBNB地址
  const DEAD_ADDRESS = "0x000000000000000000000000000000000000dEaD";
  
  const [deployer] = await hre.ethers.getSigners();
  const I3Token = await hre.ethers.getContractFactory("I3Token");
  const token = I3Token.attach(TOKEN_ADDRESS);
  
  console.log("=== opBNB 网络验证结果 ===");
  console.log("Network:", hre.network.name);
  console.log("Token address:", TOKEN_ADDRESS);
  
  try {
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
    
    // 检查交易状态
    const txHash = "0x635b854c271ec31c09f96c522669a6e3f0ba734c191924042c9361820388a092";
    console.log("\n=== 交易验证 ===");
    console.log("Transaction hash:", txHash);
    
    try {
      const receipt = await hre.ethers.provider.getTransactionReceipt(txHash);
      if (receipt) {
        console.log("Transaction status:", receipt.status === 1 ? "Success" : "Failed");
        console.log("Gas used:", receipt.gasUsed.toString());
        console.log("Block number:", receipt.blockNumber);
      } else {
        console.log("Transaction not found");
      }
    } catch (error) {
      console.log("Error getting transaction:", error.message);
    }
    
  } catch (error) {
    console.log("Error reading contract:", error.message);
  }
}

main().catch(console.error);