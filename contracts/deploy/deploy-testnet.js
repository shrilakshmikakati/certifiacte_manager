const { Deployer } = require("@matterlabs/hardhat-zksync-deploy");
const { Provider, Wallet } = require("zksync-web3");
const { ethers } = require("ethers");

module.exports = async function (hre) {
  console.log(`Running deploy script for CertificateRegistry contract`);

  // Get private key from environment
  const PRIVATE_KEY = process.env.PRIVATE_KEY;
  if (!PRIVATE_KEY) {
    throw new Error("Please set PRIVATE_KEY in your environment variables");
  }

  // Initialize provider and wallet
  const networkUrl = hre.network.config.url || 'https://testnet.era.zksync.dev';
  const provider = new Provider(networkUrl);
  const wallet = new Wallet(PRIVATE_KEY, provider);

  // Create deployer object and load the artifact of the contract we want to deploy
  const deployer = new Deployer(hre, wallet);
  
  console.log(`Deploying from address: ${wallet.address}`);
  console.log(`Network: ${hre.network.name}`);
  console.log(`RPC URL: ${networkUrl}`);
  
  // Check wallet balance
  const balance = await wallet.getBalance();
  console.log(`Wallet balance: ${ethers.utils.formatEther(balance)} ETH`);
  
  if (balance.eq(0)) {
    throw new Error("Insufficient balance. Please fund your wallet with testnet ETH.");
  }

  // Load contract artifact
  const artifact = await deployer.loadArtifact("CertificateRegistry");
  console.log(`Contract artifact loaded: ${artifact.contractName}`);

  // Estimate deployment fee
  const deploymentFee = await deployer.estimateDeployFee(artifact, [wallet.address]);
  console.log(`Estimated deployment fee: ${ethers.utils.formatEther(deploymentFee)} ETH`);

  // Deploy the contract with the deployer's address as admin
  console.log("Deploying CertificateRegistry contract...");
  const certificateRegistry = await deployer.deploy(artifact, [wallet.address]);

  // Wait for the contract to be deployed
  await certificateRegistry.deployed();
  
  console.log(`✅ CertificateRegistry deployed at: ${certificateRegistry.address}`);
  console.log(`🔗 Transaction hash: ${certificateRegistry.deployTransaction.hash}`);
  console.log(`⛽ Gas used: ${certificateRegistry.deployTransaction.gasLimit?.toString() || 'N/A'}`);

  // Verify deployment
  const code = await provider.getCode(certificateRegistry.address);
  if (code === "0x") {
    throw new Error("Contract deployment failed - no code at address");
  }

  console.log("✅ Contract deployment verified");

  // Setup initial roles if specified
  try {
    console.log("Setting up roles...");

    // Check if we have initial creators to set up
    if (process.env.INITIAL_CREATORS) {
      console.log("Setting up initial creators...");
      const creators = process.env.INITIAL_CREATORS.split(',');
      for (const creator of creators) {
        const creatorAddress = creator.trim();
        if (ethers.utils.isAddress(creatorAddress)) {
          console.log(`Granting CREATOR_ROLE to: ${creatorAddress}`);
          const tx = await certificateRegistry.grantRole(
            await certificateRegistry.CREATOR_ROLE(),
            creatorAddress
          );
          await tx.wait();
          console.log(`✅ Creator role granted to ${creatorAddress}`);
        } else {
          console.log(`⚠️ Invalid address format: ${creatorAddress}`);
        }
      }
    }

    if (process.env.INITIAL_VERIFIERS) {
      console.log("Setting up initial verifiers...");
      const verifiers = process.env.INITIAL_VERIFIERS.split(',');
      for (const verifier of verifiers) {
        const verifierAddress = verifier.trim();
        if (ethers.utils.isAddress(verifierAddress)) {
          console.log(`Granting VERIFIER_ROLE to: ${verifierAddress}`);
          const tx = await certificateRegistry.grantRole(
            await certificateRegistry.VERIFIER_ROLE(),
            verifierAddress
          );
          await tx.wait();
          console.log(`✅ Verifier role granted to ${verifierAddress}`);
        } else {
          console.log(`⚠️ Invalid address format: ${verifierAddress}`);
        }
      }
    }

    if (process.env.INITIAL_ISSUERS) {
      console.log("Setting up initial issuers...");
      const issuers = process.env.INITIAL_ISSUERS.split(',');
      for (const issuer of issuers) {
        const issuerAddress = issuer.trim();
        if (ethers.utils.isAddress(issuerAddress)) {
          console.log(`Granting ISSUER_ROLE to: ${issuerAddress}`);
          const tx = await certificateRegistry.grantRole(
            await certificateRegistry.ISSUER_ROLE(),
            issuerAddress
          );
          await tx.wait();
          console.log(`✅ Issuer role granted to ${issuerAddress}`);
        } else {
          console.log(`⚠️ Invalid address format: ${issuerAddress}`);
        }
      }
    }

  } catch (error) {
    console.log(`⚠️ Role setup failed (this is optional): ${error.message}`);
  }

  // Save deployment info
  const deploymentInfo = {
    contractAddress: certificateRegistry.address,
    deployerAddress: wallet.address,
    network: hre.network.name,
    networkUrl: networkUrl,
    deploymentHash: certificateRegistry.deployTransaction.hash,
    timestamp: new Date().toISOString(),
    blockNumber: certificateRegistry.deployTransaction.blockNumber
  };

  console.log("\n🎉 Deployment completed successfully!");
  console.log("📋 Deployment Summary:");
  console.log(`   Contract: CertificateRegistry`);
  console.log(`   Address: ${certificateRegistry.address}`);
  console.log(`   Network: ${hre.network.name}`);
  console.log(`   Deployer: ${wallet.address}`);
  console.log(`   Tx Hash: ${certificateRegistry.deployTransaction.hash}`);
  console.log(`   Block: ${certificateRegistry.deployTransaction.blockNumber || 'Pending'}`);

  console.log("\n🔗 Explorer Links:");
  if (hre.network.name === 'zkSyncTestnet') {
    console.log(`   Contract: https://sepolia.explorer.zksync.io/address/${certificateRegistry.address}`);
    console.log(`   Transaction: https://sepolia.explorer.zksync.io/tx/${certificateRegistry.deployTransaction.hash}`);
  } else if (hre.network.name === 'zkSyncEra') {
    console.log(`   Contract: https://explorer.zksync.io/address/${certificateRegistry.address}`);
    console.log(`   Transaction: https://explorer.zksync.io/tx/${certificateRegistry.deployTransaction.hash}`);
  }

  console.log("\n📝 Next Steps:");
  console.log("1. Update your .env files with the contract address");
  console.log("2. Fund the contract if needed for operations");
  console.log("3. Test contract functions using the frontend or Hardhat console");

  return certificateRegistry;
};