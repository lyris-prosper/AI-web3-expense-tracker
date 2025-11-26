# AI Web3 Expense Tracker

AI-powered Web3 expense tracking application built with Next.js, RainbowKit, and IPFS storage.

## Features

- 🤖 **AI Natural Language Processing**: Input expenses in natural language (e.g., "今天吃饭30块")
- 💰 **Income & Expense Tracking**: Track both income and expenses with categories
- 🔐 **Web3 Data Ownership**: Encrypted data storage on IPFS (Pinata)
- 🔗 **On-Chain Index**: Store IPFS CID references on Ethereum for cross-device data recovery
- 💳 **Wallet Integration**: Connect with MetaMask and other wallets via RainbowKit
- 📊 **Smart Statistics**: Today's transactions + monthly income/expense breakdown
- 📸 **OCR Image Recognition**: Upload receipt photos for automatic data extraction
- 🏆 **NFT Milestones**: Earn NFTs for first expense achievement
- 📈 **Export & Backup**: CSV export and JSON backup/restore
- 📤 **AI Financial Insights**: Personalized spending advice from Qwen AI

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Web3**: RainbowKit, Wagmi, Viem
- **AI**: Alibaba Qwen (通义千问) with Claude fallback
- **Storage**: IPFS via Pinata
- **Blockchain**: Ethereum Sepolia testnet

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Edit `.env.local` with your API keys:

```env
# AI Service (provide at least one)
QWEN_API_KEY=your_qwen_api_key_here
CLAUDE_API_KEY=your_claude_api_key_here

# IPFS Storage (Pinata)
PINATA_JWT=your_pinata_jwt_token_here

# Wallet
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id

# Smart Contracts (will be updated after deployment)
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_EXPENSE_TRACKER_ADDRESS=0x...
```

**Note**: The app will try Qwen API first, and automatically fallback to Claude if Qwen fails or is not configured.

### 3. Deploy Smart Contracts

#### 3.1 Deploy ExpenseTracker Contract (Required for On-Chain Index)

1. Open [Remix IDE](https://remix.ethereum.org/)
2. Create new file `ExpenseTracker.sol`
3. Copy contract code from `contracts/ExpenseTracker.sol`
4. Compile with Solidity version `^0.8.0`
5. Select "Injected Provider - MetaMask" and connect to **Sepolia testnet**
6. Deploy the contract
7. Copy the deployed contract address
8. Update `.env.local`: `NEXT_PUBLIC_EXPENSE_TRACKER_ADDRESS=0x...`

#### 3.2 Deploy FirstExpenseNFT Contract (Optional - for NFT milestones)

1. In Remix, create new file `FirstExpenseNFT.sol`
2. Copy contract code from `contracts/FirstExpenseNFT.sol`
3. Compile and deploy to Sepolia testnet
4. Update `.env.local`: `NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=0x...`

**Important**: Make sure you have Sepolia testnet ETH. Get free test ETH from [Sepolia Faucet](https://sepoliafaucet.com/).

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Keys Setup

### AI Services (Choose at least one)

#### Qwen API (通义千问) - Primary

1. Visit [Alibaba Cloud DashScope](https://dashscope.aliyun.com/)
2. Sign up and get your API key
3. Add to `.env.local` as `QWEN_API_KEY`

#### Claude API - Backup (Optional)

1. Visit [Anthropic Console](https://console.anthropic.com/)
2. Sign up and get your API key
3. Add to `.env.local` as `CLAUDE_API_KEY`

The system will automatically use Claude as a fallback if Qwen is unavailable or fails.

### Web3.Storage

1. Visit [Pinata](https://pinata.cloud/)
2. Sign up for a free account
3. Go to API Keys section
4. Create a new API key and copy the JWT token
5. Add to `.env.local` as `PINATA_JWT`

### WalletConnect Project ID

1. Visit [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. Create a new project
3. Get your Project ID
4. Add to `.env.local` as `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`

## Usage

### Basic Workflow

1. **Connect Wallet**: Click the connect button and select your preferred wallet (MetaMask recommended)
2. **Add Expenses**:
   - **Text Input**: Type natural language like "今天吃饭30块" and let AI parse it
   - **Image Upload**: Upload receipt photos for automatic OCR recognition
3. **Review & Confirm**: Check AI parsing results and confirm
4. **Auto Sync**: Data is encrypted and stored on IPFS, with CID saved on-chain
5. **Track Progress**: View today's transactions and monthly statistics
6. **Cross-Device Recovery**: Connect your wallet on any device to restore all data

### On-Chain Index Benefits

- **Data Permanence**: Your expense CIDs are permanently stored on Ethereum blockchain
- **Cross-Device Sync**: Access your data from any device by connecting your wallet
- **Decentralized**: No central server required - data lives on IPFS + blockchain
- **Ownership**: You own your data through your wallet signature

## Project Structure

```
/app
  /api
    /parse           # AI text parsing endpoint
    /ocr             # OCR image recognition endpoint
    /ipfs-upload     # Pinata IPFS upload endpoint
  layout.tsx         # Root layout with wallet provider
  page.tsx           # Main application page
  globals.css        # Global styles

/components
  WalletConnect.tsx  # Wallet connection setup
  ExpenseForm.tsx    # Text input form with AI parsing
  ImageUpload.tsx    # Image upload with OCR recognition
  ExpenseList.tsx    # Expense history display
  TodayTransactions.tsx  # Today's income/expense summary
  MonthlyStats.tsx   # Monthly statistics with categories

/hooks
  useExpenseTracker.ts  # Custom hooks for on-chain index

/utils
  crypto.ts          # AES encryption utilities
  ipfs.ts            # Pinata IPFS utilities
  ai.ts              # AI parsing utilities
  storage.ts         # LocalStorage management

/contracts
  ExpenseTracker.sol     # On-chain index contract (stores CIDs)
  FirstExpenseNFT.sol    # NFT contract for milestones

/lib
  constants.ts       # App constants, types, and ABIs
  wagmi.ts           # Wagmi configuration
```


## License

MIT License
