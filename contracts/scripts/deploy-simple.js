const { ethers } = require("hardhat");

async function main() {
    console.log("🚀 Deploying Certificate Management System on Ganache...");
    
    try {
        // Get the deployer account
        const [deployer] = await ethers.getSigners();
        console.log("📋 Deploying from account:", deployer.address);
        
        // Check balance
        const balance = await ethers.provider.getBalance(deployer.address);
        console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");
        
        // Get network info
        const network = await ethers.provider.getNetwork();
        console.log("🌐 Network Chain ID:", network.chainId.toString());
        
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
        
        // Test basic functionality
        console.log("🧪 Testing contract functionality...");
        
        const DEFAULT_ADMIN_ROLE = await certificate.DEFAULT_ADMIN_ROLE();
        const CREATOR_ROLE = await certificate.CREATOR_ROLE();
        const VERIFIER_ROLE = await certificate.VERIFIER_ROLE();
        const ISSUER_ROLE = await certificate.ISSUER_ROLE();
        
        console.log("📋 Role constants retrieved successfully");
        
        // Check if deployer has admin role
        const hasAdminRole = await certificate.hasRole(DEFAULT_ADMIN_ROLE, deployer.address);
        console.log("✅ Deployer has admin role:", hasAdminRole);
        
        console.log("\n🎉 Deployment Summary:");
        console.log("   Network: Ganache (Local Ethereum)");
        console.log("   Contract Address:", contractAddress);
        console.log("   Deployer Address:", deployer.address);
        
        console.log("\n📝 Environment Variables:");
        console.log(`   CERTIFICATE_REGISTRY_ADDRESS=${contractAddress}`);
        console.log(`   REACT_APP_CERTIFICATE_REGISTRY_ADDRESS=${contractAddress}`);
        
        console.log("\n🌐 Ganache Network Configuration:");
        console.log("   RPC URL: http://127.0.0.1:7545");
        console.log("   Chain ID: 1337");
        
        return certificate;
        
    } catch (error) {
        console.error("❌ Deployment failed:", error);
        throw error;
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Error:", error);
        process.exit(1);
    });