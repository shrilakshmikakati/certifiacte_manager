import { HardhatRuntimeEnvironment } from "hardhat/types/runtime";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { Provider, Wallet } from "zksync-web3";
import { ethers } from "ethers";

export default async function (hre: HardhatRuntimeEnvironment) {
  console.log(`Running deploy script for CertificateRegistry contract`);

  // Get private key from environment
  const PRIVATE_KEY = process.env.PRIVATE_KEY;
  if (!PRIVATE_KEY) {
    throw new Error("Please set PRIVATE_KEY in your environment variables");
  }

  // Initialize provider and wallet
  const networkUrl = (hre.network.config as any).url || 'https://mainnet.era.zksync.io';
  const provider = new Provider(networkUrl);
  const wallet = new Wallet(PRIVATE_KEY, provider);

  // Create deployer object and load the artifact of the contract we want to deploy
  const deployer = new Deployer(hre, wallet);
  const artifact = await deployer.loadArtifact("CertificateRegistry");

  // Get admin address (deployer by default, or from environment)
  const adminAddress = process.env.ADMIN_ADDRESS || wallet.address;
  console.log(`Admin address: ${adminAddress}`);

  // Deploy the contract with constructor arguments
  console.log("Deploying CertificateRegistry...");
  
  const deploymentFee = await deployer.estimateDeployFee(artifact, [adminAddress]);
  console.log(`Estimated deployment fee: ${deploymentFee.toString()} ETH`);

  const certificateRegistry = await deployer.deploy(artifact, [adminAddress]);

  // Show the contract info
  const contractAddress = certificateRegistry.address;
  console.log(`✅ CertificateRegistry deployed to: ${contractAddress}`);
  
  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    contractAddress: contractAddress,
    adminAddress: adminAddress,
    deployer: wallet.address,
    deploymentTime: new Date().toISOString(),
    transactionHash: certificateRegistry.deployTransaction?.hash,
    blockNumber: certificateRegistry.deployTransaction?.blockNumber
  };

  console.log("Deployment Info:", JSON.stringify(deploymentInfo, null, 2));

  // Grant initial roles if specified in environment
  try {
    if (process.env.INITIAL_CREATORS) {
      console.log("Setting up initial creators...");
      const creators = process.env.INITIAL_CREATORS.split(',');
      for (const creator of creators) {
        const creatorAddress = creator.trim();
        if (ethers.utils.isAddress(creatorAddress)) {
          console.log(`Granting CREATOR_ROLE to: ${creatorAddress}`);
          await certificateRegistry.grantRole(
            await certificateRegistry.CREATOR_ROLE(),
            creatorAddress
          );
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
          await certificateRegistry.grantRole(
            await certificateRegistry.VERIFIER_ROLE(),
            verifierAddress
          );
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
          await certificateRegistry.grantRole(
            await certificateRegistry.ISSUER_ROLE(),
            issuerAddress
          );
        } else {
          console.log(`⚠️ Invalid address format: ${issuerAddress}`);
        }
      }
    }
  } catch (error) {
    console.log("⚠️ Error setting up initial roles:", error);
  }

  console.log("✅ Deployment completed successfully!");
  
  // Verify contract if on mainnet or testnet
  if (hre.network.name !== 'hardhat' && process.env.VERIFY_CONTRACTS === 'true') {
    console.log("Initiating contract verification...");
    try {
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [adminAddress],
      });
      console.log("✅ Contract verified successfully!");
    } catch (error) {
      console.log("⚠️ Contract verification failed:", error);
    }
  }

  return deploymentInfo;
}