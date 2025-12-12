# Certificate Management System

A decentralized certificate management system built with IPFS, zkSync Era, and multi-layer security.

## Architecture

- **Backend**: Node.js/Express API server
- **Frontend**: React.js web application
- **Smart Contracts**: Solidity contracts deployed on zkSync Era
- **Storage**: IPFS via Pinata for certificate documents
- **Security**: Two-layer protection (AES encryption + blockchain hashing)

## Workflow

1. **Creator**: Uploads CSV/Excel with student data
2. **Verifier**: Reviews and approves/rejects certificates
3. **Issuer**: Finalizes and issues certificates with blockchain anchoring

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- MetaMask or compatible Web3 wallet

### Installation
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Install contract dependencies
cd ../contracts
npm install
```

### Development
```bash
# Start backend server
cd backend
npm run dev

# Start frontend development server
cd frontend
npm start

# Compile and deploy contracts
cd contracts
npm run compile
npm run deploy
```

## Security Features

### Layer 1: Privacy Protection
- AES-256-GCM encryption for certificate data
- Client-side encryption before IPFS upload
- Role-based access control for decryption

### Layer 2: Integrity Protection
- Certificate hash stored on zkSync Era L2
- Immutable content addressing via IPFS CID
- ZK-proof validation for tamper detection

## Project Structure

```
certificate-manager/
├── backend/           # API server and services
├── frontend/          # React web application
├── contracts/         # Smart contracts
├── shared/           # Shared types and utilities
└── docs/             # Documentation
```