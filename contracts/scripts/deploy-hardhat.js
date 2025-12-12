const hre = require("hardhat");

async function main() {
  // Get network info
  const network = await hre.ethers.provider.getNetwork();
  const networkName = hre.network.name;
  
  console.log(`🚀 Deploying Certificate Management System to ${networkName.toUpperCase()} Network`);
  console.log(`📡 Network ID: ${network.chainId}`);
  
  // Get the contract factory
  const CertificateRegistry = await hre.ethers.getContractFactory("CertificateRegistry");
  
  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📋 Deploying from account:", deployer.address);
  
  // Check balance
  const balance = await deployer.getBalance();
  console.log("💰 Account balance:", hre.ethers.utils.formatEther(balance), "ETH");
  
  if (balance.lt(hre.ethers.utils.parseEther("0.01"))) {
    console.log("⚠️  Warning: Low balance for deployment");
  }
  
  // Deploy the contract
  console.log("📦 Deploying CertificateRegistry contract...");
  const certificate = await CertificateRegistry.deploy(deployer.address);
  
  await certificate.deployed();
  
  console.log("✅ CertificateRegistry deployed to:", certificate.address);
  console.log("🔗 Transaction hash:", certificate.deployTransaction.hash);
  
  // Verify the deployment
  console.log("🔍 Verifying deployment...");
  const code = await hre.ethers.provider.getCode(certificate.address);
  if (code === "0x") {
    console.log("❌ Contract deployment failed");
    return;
  }
  
  console.log("✅ Contract deployment verified");
  
  // Test basic functionality
  console.log("🧪 Testing contract functionality...");
  
  try {
    // Get role constants
    const DEFAULT_ADMIN_ROLE = await certificate.DEFAULT_ADMIN_ROLE();
    const CREATOR_ROLE = await certificate.CREATOR_ROLE();
    const VERIFIER_ROLE = await certificate.VERIFIER_ROLE();
    const ISSUER_ROLE = await certificate.ISSUER_ROLE();
    
    console.log("📋 Role constants retrieved:");
    console.log("   DEFAULT_ADMIN_ROLE:", DEFAULT_ADMIN_ROLE);
    console.log("   CREATOR_ROLE:", CREATOR_ROLE);
    console.log("   VERIFIER_ROLE:", VERIFIER_ROLE);
    console.log("   ISSUER_ROLE:", ISSUER_ROLE);
    
    // Check if deployer has admin role
    const hasAdminRole = await certificate.hasRole(DEFAULT_ADMIN_ROLE, deployer.address);
    console.log("✅ Deployer has admin role:", hasAdminRole);
    
    // Grant roles to deployer for testing
    console.log("🔐 Granting roles to deployer...");
    
    await certificate.grantRole(CREATOR_ROLE, deployer.address);
    console.log("✅ CREATOR_ROLE granted to deployer");
    
    await certificate.grantRole(VERIFIER_ROLE, deployer.address);
    console.log("✅ VERIFIER_ROLE granted to deployer");
    
    await certificate.grantRole(ISSUER_ROLE, deployer.address);
    console.log("✅ ISSUER_ROLE granted to deployer");
    
  } catch (error) {
    console.log("⚠️ Role setup failed:", error.message);
  }
  
  console.log("\n🎉 Deployment Summary:");
  console.log("   Network: hardhat");
  console.log("   Contract Address:", certificate.address);
  console.log("   Deployer Address:", deployer.address);
  console.log("   Gas Used:", certificate.deployTransaction.gasLimit?.toString() || "N/A");
  
  console.log("\n📝 Save this address for your frontend configuration:");
  console.log(`   REACT_APP_CERTIFICATE_REGISTRY_ADDRESS=${certificate.address}`);
  
  return certificate;
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});