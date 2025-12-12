const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying CertificateRegistry to local Hardhat network...");

  // Get the contract factory
  const CertificateRegistry = await ethers.getContractFactory("CertificateRegistry");

  // Get the first signer (deployer)
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Check balance
  const balance = await deployer.getBalance();
  console.log("Account balance:", ethers.utils.formatEther(balance), "ETH");

  // Deploy the contract
  console.log("Deploying CertificateRegistry...");
  const certificateRegistry = await CertificateRegistry.deploy(deployer.address);

  // Wait for deployment
  await certificateRegistry.deployed();

  console.log("✅ CertificateRegistry deployed to:", certificateRegistry.address);
  console.log("📋 Transaction hash:", certificateRegistry.deployTransaction.hash);
  console.log("⛽ Gas used:", certificateRegistry.deployTransaction.gasLimit?.toString());

  // Verify deployment
  const code = await ethers.provider.getCode(certificateRegistry.address);
  if (code === "0x") {
    throw new Error("Deployment failed - no code at address");
  }

  console.log("✅ Contract deployment verified");

  // Test basic functions
  try {
    const defaultAdminRole = await certificateRegistry.DEFAULT_ADMIN_ROLE();
    const creatorRole = await certificateRegistry.CREATOR_ROLE();
    const verifierRole = await certificateRegistry.VERIFIER_ROLE();
    const issuerRole = await certificateRegistry.ISSUER_ROLE();

    console.log("\n🔐 Contract Roles:");
    console.log("DEFAULT_ADMIN_ROLE:", defaultAdminRole);
    console.log("CREATOR_ROLE:", creatorRole);
    console.log("VERIFIER_ROLE:", verifierRole);
    console.log("ISSUER_ROLE:", issuerRole);

    // Check if deployer has admin role
    const hasAdminRole = await certificateRegistry.hasRole(defaultAdminRole, deployer.address);
    console.log(`Deployer has admin role: ${hasAdminRole}`);

  } catch (error) {
    console.log("⚠️ Role check failed:", error.message);
  }

  console.log("\n🎉 Local deployment completed successfully!");
  console.log("\n📝 Contract Address for .env files:");
  console.log(`CERTIFICATE_REGISTRY_ADDRESS=${certificateRegistry.address}`);
  console.log(`REACT_APP_CERTIFICATE_REGISTRY_ADDRESS=${certificateRegistry.address}`);

  return certificateRegistry;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });