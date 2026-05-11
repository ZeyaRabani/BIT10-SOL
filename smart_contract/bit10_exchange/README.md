# BIT10 Exchange

BIT10 Exchange smart contract for buying (minting) or selling (burning) BIT10.SOL Index Token on Solana.

## 🌟 Overview

BIT10 Exchange is a decentralized protocol that enables users to mint and burn the BIT10.SOL index token, which tracks a weighted basket of the top 10 cryptocurrencies by market capitalization. The protocol supports multiple token standards (Token-Program and Token-2022) and integrates oracle price feeds for accurate asset valuations.

## 🌐 Core Features

- **Minting (Buy)**: Exchange SOL or USDC for BIT10.SOL tokens with automatic price calculation
- **Burning (Sell)**: Redeem BIT10.SOL tokens back to SOL with proper fee deduction
- **Multi-Token Support**: Compatible with both SPL Token (Token-Program) and Token-2022 standards
- **Oracle Integration**: Real-time price feeds for BIT10.SOL, SOL, and USDC
- **Index Tracking**: Automatically maintains weights based on top 10 token market caps
- **Fee Structure**: 0.5% fee applied on all swaps (5/1000 basis)
- **Comprehensive Logging**: Transaction tracking with swap IDs, timestamps, and USD valuations

## 📐 Architecture Overview

```mermaid
graph TB
    User["User Wallet"]
    UserATA_IN["User ATA<br/>(Input Token)"]
    UserATA_OUT["User ATA<br/>(BIT10.SOL)"]
    
    Oracle["Oracle Account<br/>(Price Feed)"]
    
    MintInstr["Mint Instruction<br/>(Buy BIT10)"]
    BurnInstr["Burn Instruction<br/>(Sell BIT10)"]
    
    TokenProgram1["Token Program<br/>(SPL Token)"]
    TokenProgram2022["Token-2022<br/>(Extended)"]
    SystemProgram["System Program"]
    
    VaultSOL["SOL Vault<br/>(PDA)"]
    VaultTokens["Token Vault<br/>(PDA)"]
    
    MintAuth["Mint Authority<br/>(PDA)"]
    VaultAuth["Vault Authority<br/>(PDA)"]
    
    TokenInMint["Mint Account<br/>(Input Token)"]
    TokenOutMint["Mint Account<br/>(BIT10.SOL)"]
    
    User -->|1. Approve Token| UserATA_IN
    User -->|2. Call Mint/Burn| MintInstr
    MintInstr -->|3. Read Prices| Oracle
    
    MintInstr -->|4a. Transfer Input| TokenProgram1
    MintInstr -->|4b. Transfer Input| TokenProgram2022
    TokenProgram1 -->|5. Transfer to Vault| VaultTokens
    TokenProgram2022 -->|5. Transfer to Vault| VaultTokens
    VaultTokens -->|Store Input| VaultSOL
    
    MintInstr -->|6. Mint BIT10| MintAuth
    MintAuth -->|7. Authority Sign| TokenOutMint
    TokenOutMint -->|8. Mint Tokens| UserATA_OUT
    
    BurnInstr -->|1. Read Prices| Oracle
    BurnInstr -->|2. Burn BIT10| TokenProgram2022
    TokenProgram2022 -->|3. Burn from ATA| UserATA_OUT
    
    BurnInstr -->|4. Calculate SOL| VaultSOL
    VaultAuth -->|5. Sign Transfer| SystemProgram
    SystemProgram -->|6. Transfer SOL| User
    
    style User fill:#4f46e5,stroke:#312e81,color:#fff
    style Oracle fill:#ec4899,stroke:#831843,color:#fff
    style MintInstr fill:#06b6d4,stroke:#164e63,color:#fff
    style BurnInstr fill:#06b6d4,stroke:#164e63,color:#fff
    style MintAuth fill:#f59e0b,stroke:#92400e,color:#fff
    style VaultAuth fill:#f59e0b,stroke:#92400e,color:#fff
    style VaultSOL fill:#10b981,stroke:#065f46,color:#fff
    style VaultTokens fill:#10b981,stroke:#065f46,color:#fff
```

## 🔗 Solana Smart Contract

- Devnet BIT10 Exchange Smart Contract: [3M2PP2Ex85JoQEdQHjEBDCJ4YVR3RLXSkVoB1kwHhF8Q](https://solscan.io/account/3M2PP2Ex85JoQEdQHjEBDCJ4YVR3RLXSkVoB1kwHhF8Q?cluster=devnet)
- Mainnet BIT10 Exchange Smart Contract: [7CQDVZbDr9DtmzjYUFK2SM1GEGGc4o2qeYoUBfFyYb9N](https://solscan.io/account/7CQDVZbDr9DtmzjYUFK2SM1GEGGc4o2qeYoUBfFyYb9N)

## 🏁 Getting Started

To start using the BIT10 Exchange smart contract, follow these steps:

1. **Clone the Repository**:
    ```bash
    git clone https://github.com/ZeyaRabani/BIT10.git
    ```

2. **Go to bit10_exchange folder**:
    ```bash
    cd smart_contract/bit10_exchange
    ```

3. **Build and deploy the smart contract**:
    ```bash
    anchor build

    anchor deploy --provider.cluster devnet
    ```