const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying I3 Check-In Platform for BSC Audit...");
  console.log("===============================================");
  
  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  // Check balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "BNB");
  
  if (balance < hre.ethers.parseEther("0.1")) {
    console.log("⚠️  Warning: Low balance. Make sure you have enough BNB for deployment and verification");
  }
  
  console.log("\n📋 Deployment Plan:");
  console.log("1. Deploy I3Token (ERC20 reward token)");
  console.log("2. Deploy I3CheckInCore (main check-in contract)");
  console.log("3. Connect contracts together");
  console.log("4. Initialize with test data");
  
  // Deploy I3Token contract first
  console.log("\n🪙 1. Deploying I3Token contract...");
  const I3Token = await hre.ethers.getContractFactory("I3Token");
  const token = await I3Token.deploy();
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("✅ I3Token deployed to:", tokenAddress);
  
  // Deploy I3CheckInCore contract
  console.log("\n🎯 2. Deploying I3CheckInCore contract...");
  const I3CheckInCore = await hre.ethers.getContractFactory("I3CheckInCore");
  const checkInCore = await I3CheckInCore.deploy();
  await checkInCore.waitForDeployment();
  const checkInCoreAddress = await checkInCore.getAddress();
  console.log("✅ I3CheckInCore deployed to:", checkInCoreAddress);
  
  // Connect the contracts
  console.log("\n🔗 3. Connecting contracts...");
  
  try {
    // Set check-in contract address in token contract
    const setCheckInTx = await token.setCheckInContract(checkInCoreAddress);
    await setCheckInTx.wait();
    console.log("✅ Token contract linked to CheckIn contract");
    
    // Set token contract address in check-in contract
    const setTokenTx = await checkInCore.setTokenContract(tokenAddress);
    await setTokenTx.wait();
    console.log("✅ CheckIn contract linked to Token contract");
    
    // Enable token rewards
    const enableRewardsTx = await checkInCore.setTokenRewardsEnabled(true);
    await enableRewardsTx.wait();
    console.log("✅ Token rewards enabled");
  } catch (error) {
    console.log("⚠️  Contract linking error:", error.message);
  }
  
  // Get contract info
  const tokenName = await token.name();
  const tokenSymbol = await token.symbol();
  const totalSupply = await token.totalSupply();
  const ownerBalance = await token.balanceOf(deployer.address);
  
  // Get check-in contract info
  const globalStats = await checkInCore.getGlobalStats();
  const todayIndex = await checkInCore.getTodayIndex();
  
  console.log("\n📊 4. Deployment Summary:");
  console.log("===============================================");
  
  // Determine network display name
  let networkDisplay;
  if (hre.network.name === "bscmainnet") {
    networkDisplay = "BNB Smart Chain Mainnet";
  } else if (hre.network.name === "opbnbmainnet") {
    networkDisplay = "opBNB Mainnet";
  } else if (hre.network.name === "bsctestnet") {
    networkDisplay = "BNB Smart Chain Testnet";
  } else if (hre.network.name === "opbnbtestnet") {
    networkDisplay = "opBNB Testnet";
  } else {
    networkDisplay = hre.network.name;
  }
  console.log("🌐 Network:", networkDisplay);
  
  console.log("🏗️  Deployer:", deployer.address);
  console.log("📅 Deploy Time:", new Date().toISOString());
  console.log("===============================================");
  console.log("🎯 Core Contract:", checkInCoreAddress);
  console.log("🪙 Token Contract:", tokenAddress);
  console.log("===============================================");
  console.log("📝 Token Details:");
  console.log("   Name:", tokenName);
  console.log("   Symbol:", tokenSymbol);
  console.log("   Total Supply:", hre.ethers.formatEther(totalSupply), "I3T");
  console.log("   Owner Balance:", hre.ethers.formatEther(ownerBalance), "I3T");
  console.log("===============================================");
  console.log("🎮 Platform Stats:");
  console.log("   Today Index:", todayIndex.toString());
  console.log("   Total Users:", globalStats[0].toString());
  console.log("   Total Check-ins:", globalStats[1].toString());
  console.log("   Total Credits:", globalStats[2].toString());
  console.log("===============================================");
  
  // Test the check-in functionality (optional)
  console.log("\n🧪 5. Testing Basic Functionality...");
  try {
    // Test getting user status (should show no check-ins initially)
    const userStatus = await checkInCore.getUserStatus(deployer.address);
    console.log("✅ getUserStatus() working - Next reward:", userStatus[4].toString(), "credits");
    
    // Test a check-in (costs gas)
    console.log("🔄 Performing test check-in...");
    const checkInTx = await checkInCore.checkIn({ value: 0 });
    await checkInTx.wait();
    console.log("✅ Check-in successful!");
    
    // Check updated status
    const updatedStatus = await checkInCore.getUserStatus(deployer.address);
    console.log("✅ User now has streak:", updatedStatus[1].toString());
    
  } catch (error) {
    console.log("⚠️  Test failed:", error.message);
  }
  
  // Contract verification info with network-specific commands
  console.log("\n🔍 6. Contract Verification Commands:");
  console.log("===============================================");
  
  if (hre.network.name === "bscmainnet") {
    console.log("For BSC Mainnet:");
    console.log(`npx hardhat verify --network bscmainnet ${tokenAddress} --config hardhat-audit.config.js`);
    console.log(`npx hardhat verify --network bscmainnet ${checkInCoreAddress} --config hardhat-audit.config.js`);
  } else if (hre.network.name === "opbnbmainnet") {
    console.log("For opBNB Mainnet:");
    console.log(`npx hardhat verify --network opbnbmainnet ${tokenAddress} --config hardhat-audit.config.js`);
    console.log(`npx hardhat verify --network opbnbmainnet ${checkInCoreAddress} --config hardhat-audit.config.js`);
  } else if (hre.network.name === "bsctestnet") {
    console.log("For BSC Testnet:");
    console.log(`npx hardhat verify --network bsctestnet ${tokenAddress} --config hardhat-audit.config.js`);
    console.log(`npx hardhat verify --network bsctestnet ${checkInCoreAddress} --config hardhat-audit.config.js`);
  } else {
    console.log("For current network:");
    console.log(`npx hardhat verify --network ${hre.network.name} ${tokenAddress} --config hardhat-audit.config.js`);
    console.log(`npx hardhat verify --network ${hre.network.name} ${checkInCoreAddress} --config hardhat-audit.config.js`);
  }
  
  // Save addresses to files
  const fs = require('fs');
  const deploymentData = {
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    contracts: {
      checkInCore: checkInCoreAddress,
      token: tokenAddress
    },
    deployer: deployer.address,
    deploymentTime: new Date().toISOString(),
    gasUsed: {
      estimated: "~0.015 BNB total"
    },
    auditInfo: {
      mainContract: checkInCoreAddress,
      tokenContract: tokenAddress,
      functionality: "Daily check-in with credit rewards",
      description: "Users check-in daily, earn credits, maintain streaks"
    }
  };
  
  // Save deployment info
  fs.writeFileSync('deployed-addresses-audit.json', JSON.stringify(deploymentData, null, 2));
  console.log("\n💾 Contract addresses saved to 'deployed-addresses-audit.json'");
  
  // Create audit submission info based on network
  let networkName, networkDescription;
  if (hre.network.name === "bscmainnet") {
    networkName = "BNB Smart Chain";
    networkDescription = "BNB Smart Chain Mainnet";
  } else if (hre.network.name === "opbnbmainnet") {
    networkName = "opBNB Mainnet"; 
    networkDescription = "opBNB";
  } else if (hre.network.name === "bsctestnet") {
    networkName = "BNB Smart Chain Testnet";
    networkDescription = "BNB Testnet";
  } else {
    networkName = hre.network.name;
    networkDescription = "Testnet";
  }
  
  const auditSubmission = {
    "dApp Name": "Intelligence Cubed Check-In",
    "Main Contract": checkInCoreAddress,
    "Token Contract": tokenAddress,
    "Network": networkName,
    "Functionality": "Daily check-in system with streak rewards",
    "User Interaction": "Users pay gas (~$0.02) to check-in daily and earn credits",
    "Revenue Model": "Gas fees to BSC network (not to platform)",
    "Launch Date": new Date().toISOString().split('T')[0]
  };
  
  fs.writeFileSync('audit-submission-info.json', JSON.stringify(auditSubmission, null, 2));
  
  console.log("\n📋 7. For BSC dApp Audit Submission:");
  console.log("===============================================");
  console.log("Main Contract Address:", checkInCoreAddress);
  console.log("Is 100% on-chain: YES");
  console.log("Blockchain:", networkDescription);
  console.log("Contract verification: Required after deployment");
  console.log("===============================================");
  
  console.log("\n🎉 Deployment Complete!");
  console.log("Next steps:");
  console.log("1. Verify contracts on BSCScan");
  console.log("2. Test check-in functionality");
  console.log("3. Submit for BSC dApp audit");
  console.log("4. Deploy to mainnet when ready");
  
  return {
    checkInCore: checkInCoreAddress,
    token: tokenAddress,
    network: hre.network.name,
    deployer: deployer.address
  };
}

// Error handling
main()
  .then((result) => {
    console.log("\n✅ All contracts deployed successfully!");
    console.log("Main contract for audit:", result.checkInCore);
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });