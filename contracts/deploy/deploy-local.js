const { Deployer } = require('@matterlabs/hardhat-zksync-deploy');
const { Wallet, Provider } = require('zksync-web3');
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Local deployment configuration
const PRIVATE_KEY = process.env.PRIVATE_KEY || '0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110';
const LOCAL_RPC_URL = process.env.ZKSYNC_LOCAL_URL || 'http://localhost:3050';

module.exports = async function (hre) {
  console.log('🚀 Starting local deployment of CertificateRegistry...');
  
  try {
    // Initialize wallet and deployer  
    const provider = new Provider(LOCAL_RPC_URL);
    const wallet = new Wallet(PRIVATE_KEY, provider);
    const deployer = new Deployer(hre, wallet);
    
    console.log('📋 Deployment Details:');
    console.log(`   Network: ${hre.network.name}`);
    console.log(`   RPC URL: ${LOCAL_RPC_URL}`);
    console.log(`   Deployer: ${wallet.address}`);
    
    // Check balance
    const balance = await wallet.getBalance();
    console.log(`   Balance: ${hre.ethers.utils.formatEther(balance)} ETH`);
    
    // Load and compile contract
    const contractArtifact = await deployer.loadArtifact('CertificateRegistry');
    console.log(`✅ Contract artifact loaded: ${contractArtifact.contractName}`);
    
    // Deploy contract
    console.log('📦 Deploying contract...');
    const deploymentFee = await deployer.estimateDeployFee(contractArtifact, []);
    console.log(`   Estimated deployment fee: ${hre.ethers.utils.formatEther(deploymentFee)} ETH`);
    
    const contract = await deployer.deploy(contractArtifact, []);
    
    // Wait for deployment
    await contract.deployed();
    console.log(`🎉 Contract deployed at: ${contract.address}`);
    
    // Setup roles for local development
    console.log('🔐 Setting up roles...');
    
    // Test addresses for local development
    const testAddresses = {
      admin: wallet.address,
      creator: '0xa61464658AfeAf65CccaaFD3a512b69A83B77618', // Local test account 1
      verifier: '0x0D43eB5B8a47bA8900d84AA36656c92024e9772e', // Local test account 2
      issuer: '0x617F2E2fD72FD9D5503197092aC168c91465E7f2'   // Local test account 3
    };
    
    try {
      // Grant roles
      const tx1 = await contract.grantRole(await contract.CREATOR_ROLE(), testAddresses.creator);
      await tx1.wait();
      console.log(`✅ CREATOR_ROLE granted to ${testAddresses.creator}`);
      
      const tx2 = await contract.grantRole(await contract.VERIFIER_ROLE(), testAddresses.verifier);
      await tx2.wait();
      console.log(`✅ VERIFIER_ROLE granted to ${testAddresses.verifier}`);
      
      const tx3 = await contract.grantRole(await contract.ISSUER_ROLE(), testAddresses.issuer);
      await tx3.wait();
      console.log(`✅ ISSUER_ROLE granted to ${testAddresses.issuer}`);
      
    } catch (roleError) {
      console.log(`⚠️  Role setup warning: ${roleError.message}`);
    }
    
    // Save deployment info
    const deploymentInfo = {
      network: hre.network.name,
      contractAddress: contract.address,
      deployer: wallet.address,
      timestamp: new Date().toISOString(),
      testAccounts: testAddresses,
      rpcUrl: LOCAL_RPC_URL
    };
    
    // Create deployments directory if it doesn't exist
    const deploymentsDir = path.join(__dirname, '..', 'deployments', 'local');
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }
    
    // Save deployment info
    fs.writeFileSync(
      path.join(deploymentsDir, 'CertificateRegistry.json'),
      JSON.stringify(deploymentInfo, null, 2)
    );
    
    // Update environment files
    const envFiles = [
      path.join(__dirname, '..', '..', '.env.local'),
      path.join(__dirname, '..', '..', 'frontend', '.env.local')
    ];
    
    for (const envFile of envFiles) {
      if (fs.existsSync(envFile)) {
        let content = fs.readFileSync(envFile, 'utf8');
        content = content.replace(
          /CERTIFICATE_REGISTRY_ADDRESS=.*/,
          `CERTIFICATE_REGISTRY_ADDRESS=${contract.address}`
        );
        content = content.replace(
          /REACT_APP_CERTIFICATE_REGISTRY_ADDRESS=.*/,
          `REACT_APP_CERTIFICATE_REGISTRY_ADDRESS=${contract.address}`
        );
        fs.writeFileSync(envFile, content);
        console.log(`📝 Updated ${envFile}`);
      }
    }
    
    console.log('\n🎊 Local deployment completed successfully!');
    console.log('📋 Summary:');
    console.log(`   Contract Address: ${contract.address}`);
    console.log(`   Network: ${hre.network.name}`);
    console.log(`   RPC URL: ${LOCAL_RPC_URL}`);
    console.log(`   Admin: ${testAddresses.admin}`);
    console.log(`   Creator: ${testAddresses.creator}`);
    console.log(`   Verifier: ${testAddresses.verifier}`);
    console.log(`   Issuer: ${testAddresses.issuer}`);
    console.log('\n🚀 You can now start your frontend and backend services!');
    
    return contract;
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    if (error.code === 'CALL_EXCEPTION') {
      console.error('💡 This might be a gas estimation issue. Try increasing gas limit.');
    }
    throw error;
  }
};