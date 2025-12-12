const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
    console.log("🚀 Deploying Certificate Management System on Ganache...");
    
    try {
        // Get network info
        const network = await ethers.provider.getNetwork();
        console.log("🌐 Network Chain ID:", network.chainId.toString());
        
        // Get the deployer account
        const [deployer] = await ethers.getSigners();
        console.log("📋 Deploying from account:", deployer.address);
        
        // Check balance
        const balance = await ethers.provider.getBalance(deployer.address);
        console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");
        
        // Get the contract factory
        console.log("📦 Getting contract factory...");
        const CertificateRegistry = await ethers.getContractFactory("CertificateRegistry");
        
        // Deploy the contract
        console.log("🚀 Deploying CertificateRegistry...");
        const certificate = await CertificateRegistry.deploy(deployer.address);
        
        // Wait for deployment
        await certificate.waitForDeployment();
        
        const contractAddress = await certificate.getAddress();
        console.log("✅ CertificateRegistry deployed to:", contractAddress);
        
        // Verify the deployment
        console.log("🔍 Verifying deployment...");
        const code = await ethers.provider.getCode(contractAddress);
        if (code === "0x") {
            console.log("❌ Contract deployment failed");
            return;
        }
        
        console.log("✅ Contract deployment verified");
        
        // Test basic functionality
        console.log("🧪 Testing contract functionality...");
        
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
        console.log("🔐 Granting roles to deployer for testing...");
        
        const tx1 = await certificate.grantRole(CREATOR_ROLE, deployer.address);
        await tx1.wait();
        console.log("✅ CREATOR_ROLE granted to deployer");
        
        const tx2 = await certificate.grantRole(VERIFIER_ROLE, deployer.address);
        await tx2.wait();
        console.log("✅ VERIFIER_ROLE granted to deployer");
        
        const tx3 = await certificate.grantRole(ISSUER_ROLE, deployer.address);
        await tx3.wait();
        console.log("✅ ISSUER_ROLE granted to deployer");
        
        // Create test accounts for different roles
        const accounts = await ethers.getSigners();
        if (accounts.length > 3) {
            console.log("🎭 Setting up test accounts with different roles...");
            
            const creator = accounts[1];
            const verifier = accounts[2];
            const issuer = accounts[3];
            
            const tx4 = await certificate.grantRole(CREATOR_ROLE, creator.address);
            await tx4.wait();
            console.log(`✅ CREATOR_ROLE granted to ${creator.address}`);
            
            const tx5 = await certificate.grantRole(VERIFIER_ROLE, verifier.address);
            await tx5.wait();
            console.log(`✅ VERIFIER_ROLE granted to ${verifier.address}`);
            
            const tx6 = await certificate.grantRole(ISSUER_ROLE, issuer.address);
            await tx6.wait();
            console.log(`✅ ISSUER_ROLE granted to ${issuer.address}`);
        }
        
        console.log("\n🎉 Deployment Summary:");
        console.log("   Network: Ganache (Local Ethereum)");
        console.log("   Contract Address:", contractAddress);
        console.log("   Deployer Address:", deployer.address);
        
        console.log("\n🔐 Two-Layer Security Architecture:");
        console.log("   Layer 1: AES-256-GCM Encryption (Backend)");
        console.log("   Layer 2: Blockchain Verification (Ganache)");
        
        console.log("\n📝 Environment Variables:");
        console.log(`   CERTIFICATE_REGISTRY_ADDRESS=${contractAddress}`);
        console.log(`   REACT_APP_CERTIFICATE_REGISTRY_ADDRESS=${contractAddress}`);
        
        console.log("\n🌐 Ganache Network Configuration:");
        console.log("   RPC URL: http://127.0.0.1:7545");
        console.log("   Chain ID: 1337");
        
        return certificate;
        
    } catch (error) {
        console.error("❌ Role setup failed:", error.message);
        throw error;
    }
}

// Execute deployment
main()
    .then(() => {
        console.log("\n🎉 Deployment completed successfully!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });