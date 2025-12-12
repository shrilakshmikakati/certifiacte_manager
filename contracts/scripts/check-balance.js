const { Provider, Wallet, utils } = require("zksync-web3");
const { ethers } = require("ethers");
require("dotenv").config();

async function main() {
    // Initialize the provider
    const provider = new Provider(hre.network.config.url);
    
    // Initialize the wallet
    const wallet = new Wallet(process.env.PRIVATE_KEY, provider);
    
    console.log("🔍 Checking balance for zkSync Sepolia deployment...");
    console.log("Network:", hre.network.name);
    console.log("RPC URL:", hre.network.config.url);
    console.log("Wallet address:", wallet.address);
    
    try {
        // Get balance
        const balance = await wallet.getBalance();
        const balanceInEth = ethers.utils.formatEther(balance);
        
        console.log("\n💰 Current Balance:");
        console.log("Balance:", balanceInEth, "ETH");
        console.log("Balance (wei):", balance.toString());
        
        // Estimate gas for deployment
        console.log("\n⛽ Gas Estimation:");
        console.log("Required gas from error: ~151,977,700,000,000 wei");
        console.log("Required gas in ETH: ~0.000152 ETH");
        
        if (parseFloat(balanceInEth) > 0.000152) {
            console.log("✅ Sufficient balance for deployment");
        } else {
            console.log("❌ Insufficient balance for deployment");
            console.log("\n📘 To get testnet funds:");
            console.log("1. Visit zkSync Sepolia faucet: https://portal.zksync.io/faucet");
            console.log("2. Or Ethereum Sepolia faucet: https://faucets.chain.link/sepolia");
            console.log("3. Request ETH for address:", wallet.address);
            console.log("4. Bridge ETH from Sepolia to zkSync Sepolia if needed");
        }
        
    } catch (error) {
        console.error("❌ Error checking balance:", error.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });