import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';
import { blockchainService } from '../services/blockchainService';

// Initial state
const initialState = {
  // Connection state
  isConnected: false,
  isConnecting: false,
  account: null,
  chainId: null,
  balance: null,
  
  // Provider state
  provider: null,
  signer: null,
  
  // Contract state
  contract: null,
  contractAddress: null,
  
  // Error state
  error: null,
  
  // Support state
  isMetaMaskInstalled: false,
  supportedChains: ['0x539'], // Ganache (1337 in decimal)
};

// Action types
const Web3ActionTypes = {
  SET_CONNECTING: 'SET_CONNECTING',
  SET_CONNECTED: 'SET_CONNECTED',
  SET_DISCONNECTED: 'SET_DISCONNECTED',
  SET_ACCOUNT: 'SET_ACCOUNT',
  SET_CHAIN_ID: 'SET_CHAIN_ID',
  SET_BALANCE: 'SET_BALANCE',
  SET_PROVIDER: 'SET_PROVIDER',
  SET_CONTRACT: 'SET_CONTRACT',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_METAMASK_INSTALLED: 'SET_METAMASK_INSTALLED',
};

// Reducer
const web3Reducer = (state, action) => {
  switch (action.type) {
    case Web3ActionTypes.SET_CONNECTING:
      return {
        ...state,
        isConnecting: action.payload,
        error: action.payload ? null : state.error,
      };
    
    case Web3ActionTypes.SET_CONNECTED:
      return {
        ...state,
        isConnected: true,
        isConnecting: false,
        error: null,
      };
    
    case Web3ActionTypes.SET_DISCONNECTED:
      return {
        ...state,
        isConnected: false,
        isConnecting: false,
        account: null,
        chainId: null,
        balance: null,
        provider: null,
        signer: null,

        contract: null,
      };
    
    case Web3ActionTypes.SET_ACCOUNT:
      return {
        ...state,
        account: action.payload,
      };
    
    case Web3ActionTypes.SET_CHAIN_ID:
      return {
        ...state,
        chainId: action.payload,
      };
    
    case Web3ActionTypes.SET_BALANCE:
      return {
        ...state,
        balance: action.payload,
      };
    
    case Web3ActionTypes.SET_PROVIDER:
      return {
        ...state,
        provider: action.payload.provider,
        signer: action.payload.signer,
      };
    

    
    case Web3ActionTypes.SET_CONTRACT:
      return {
        ...state,
        contract: action.payload.contract,
        contractAddress: action.payload.address,
      };
    
    case Web3ActionTypes.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isConnecting: false,
      };
    
    case Web3ActionTypes.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };
    
    case Web3ActionTypes.SET_METAMASK_INSTALLED:
      return {
        ...state,
        isMetaMaskInstalled: action.payload,
      };
    
    default:
      return state;
  }
};

// Create context
const Web3Context = createContext();

// Network configurations
const NETWORKS = {
  ganache: {
    chainId: '0x539', // 1337 in decimal
    chainName: 'Ganache Local',
    rpcUrls: [process.env.REACT_APP_GANACHE_URL || 'http://127.0.0.1:7545'],
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
    blockExplorerUrls: [],
  },
};

// Web3 provider component
export const Web3Provider = ({ children }) => {
  const [state, dispatch] = useReducer(web3Reducer, initialState);

  // Check if MetaMask is installed
  useEffect(() => {
    const checkMetaMask = () => {
      const installed = typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
      dispatch({
        type: Web3ActionTypes.SET_METAMASK_INSTALLED,
        payload: installed,
      });
    };
    
    checkMetaMask();
  }, []);

  // Initialize Web3 connection on mount
  useEffect(() => {
    if (state.isMetaMaskInstalled) {
      checkConnection();
      setupEventListeners();
    }
    
    return () => {
      removeEventListeners();
    };
  }, [state.isMetaMaskInstalled]);

  // Check existing connection
  const checkConnection = async () => {
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          await connectWallet();
        }
      }
    } catch (error) {
      console.error('Error checking connection:', error);
    }
  };

  // Setup event listeners
  const setupEventListeners = () => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      window.ethereum.on('disconnect', handleDisconnect);
    }
  };

  // Remove event listeners
  const removeEventListeners = () => {
    if (window.ethereum) {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
      window.ethereum.removeListener('disconnect', handleDisconnect);
    }
  };

  // Handle account changes
  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      disconnect();
    } else if (accounts[0] !== state.account) {
      dispatch({ type: Web3ActionTypes.SET_ACCOUNT, payload: accounts[0] });
      updateBalance(accounts[0]);
    }
  };

  // Handle chain changes
  const handleChainChanged = (chainId) => {
    dispatch({ type: Web3ActionTypes.SET_CHAIN_ID, payload: chainId });
    // Reload the page to reset the dApp state
    window.location.reload();
  };

  // Handle disconnect
  const handleDisconnect = () => {
    disconnect();
  };

  // Connect wallet
  const connectWallet = async () => {
    if (!state.isMetaMaskInstalled) {
      const error = 'MetaMask is not installed. Please install MetaMask to continue.';
      dispatch({ type: Web3ActionTypes.SET_ERROR, payload: error });
      toast.error(error);
      return { success: false, error };
    }

    try {
      dispatch({ type: Web3ActionTypes.SET_CONNECTING, payload: true });

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const account = accounts[0];
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });

      // Create providers  
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      // Update state
      dispatch({ type: Web3ActionTypes.SET_ACCOUNT, payload: account });
      dispatch({ type: Web3ActionTypes.SET_CHAIN_ID, payload: chainId });
      dispatch({
        type: Web3ActionTypes.SET_PROVIDER,
        payload: { provider, signer },
      });
      dispatch({ type: Web3ActionTypes.SET_CONNECTED });

      // Update balance
      await updateBalance(account);

      // Initialize contract
      await initializeContract(signer);

      toast.success('Wallet connected successfully!');
      return { success: true };
    } catch (error) {
      const errorMessage = error.message || 'Failed to connect wallet';
      dispatch({ type: Web3ActionTypes.SET_ERROR, payload: errorMessage });
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Disconnect wallet
  const disconnect = () => {
    dispatch({ type: Web3ActionTypes.SET_DISCONNECTED });
    toast.success('Wallet disconnected');
  };

  // Update balance
  const updateBalance = async (account) => {
    try {
      if (state.provider && account) {
        const balance = await state.provider.getBalance(account);
        const balanceInEther = ethers.utils.formatEther(balance);
        dispatch({ type: Web3ActionTypes.SET_BALANCE, payload: balanceInEther });
      }
    } catch (error) {
      console.error('Error updating balance:', error);
    }
  };

  // Initialize contract
  const initializeContract = async (signer) => {
    try {
      const contract = await blockchainService.getContract(signer);
      const contractAddress = contract.address;
      
      dispatch({
        type: Web3ActionTypes.SET_CONTRACT,
        payload: { contract, address: contractAddress },
      });
    } catch (error) {
      console.error('Error initializing contract:', error);
      toast.error('Failed to initialize smart contract');
    }
  };

  // Switch to supported network
  const switchNetwork = async (networkKey = 'ganache') => {
    try {
      const network = NETWORKS[networkKey];
      if (!network) {
        throw new Error('Unsupported network');
      }

      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: network.chainId }],
      });

      return { success: true };
    } catch (error) {
      if (error.code === 4902) {
        // Network not added to MetaMask
        try {
          await addNetwork(networkKey);
          return { success: true };
        } catch (addError) {
          const errorMessage = 'Failed to add network to MetaMask';
          toast.error(errorMessage);
          return { success: false, error: errorMessage };
        }
      } else {
        const errorMessage = error.message || 'Failed to switch network';
        toast.error(errorMessage);
        return { success: false, error: errorMessage };
      }
    }
  };

  // Add network to MetaMask
  const addNetwork = async (networkKey) => {
    const network = NETWORKS[networkKey];
    if (!network) {
      throw new Error('Unsupported network');
    }

    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [network],
    });
  };

  // Check if on supported network
  const isOnSupportedNetwork = () => {
    return state.supportedChains.includes(state.chainId);
  };

  // Get network name
  const getNetworkName = () => {
    const networkMap = {
      '0x539': 'Ganache Local',
    };
    return networkMap[state.chainId] || 'Unknown Network';
  };

  // Sign message
  const signMessage = async (message) => {
    try {
      if (!state.signer) {
        throw new Error('Wallet not connected');
      }
      
      const signature = await state.signer.signMessage(message);
      return { success: true, signature };
    } catch (error) {
      const errorMessage = error.message || 'Failed to sign message';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: Web3ActionTypes.CLEAR_ERROR });
  };

  const value = {
    ...state,
    connectWallet,
    disconnect,
    switchNetwork,
    addNetwork,
    signMessage,
    isOnSupportedNetwork,
    getNetworkName,
    clearError,
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
};

// Custom hook to use Web3 context
export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};

export default Web3Context;