# BIT10 SOL

Building **BIT10 SOL** for the Frontier Hackathon and second index fund for BIT10. 

BIT10 SOL is an index-based token that tracks the **top 10 tokens on the Solana ecosystem** by market capitalization. Instead of manually researching, selecting, and managing multiple assets, users can hold a single token that represents a basket of leading Solana projects.

The product works like a crypto-native ETF:

- **Diversification**: Exposure to 10 top-performing Solana tokens reduces single-asset risk
- **Automatic rebalancing**: The index periodically adjusts to reflect changes in rankings and market conditions
- **Accessibility**: Users can buy one token instead of managing multiple positions
- **Transparency**: The composition and weighting of the index remain publicly visible

BIT10 SOL is designed for:

- New users who want simple exposure to Solana
- Investors looking to diversify within the ecosystem
- Traders who prefer index-style investing over active management

By combining the strengths of multiple top Solana projects into a single asset, BIT10 SOL aims to make ecosystem investing **simpler, smarter, and more scalable**.

## 📂 Code Structure

⚠️ Steps to run the Smart Contract and the related architecture diagrams are present in their respective folders.

- **`smart_contract/`**
  - `bit10_oracle/` - Oracle smart contract for retrieving pricing and other data, such as rebalancing, for the BIT10 index fund.
  - `bit10_exchange/` - Smart contract for minting and burning BIT10.
  - `bit10_asset_storage/` - Smart contract for storing assets used as collateral.

- **`web_app/`** - Contains frontend code for the BIT10 application.

## 🔗 Important Links

- BIT10 SOL web app: [bit10sol.vercel.app](https://bit10sol.vercel.app)
- Mainnet BIT10 Oracle Smart Contract: [AFAEYYsCPmwLsd97XWVJxbWnB7tHFqQ41hUZGK2fKWZX](https://solscan.io/account/AFAEYYsCPmwLsd97XWVJxbWnB7tHFqQ41hUZGK2fKWZX)
- Mainnet BIT10 Exchange Smart Contract: [7CQDVZbDr9DtmzjYUFK2SM1GEGGc4o2qeYoUBfFyYb9N](https://solscan.io/account/7CQDVZbDr9DtmzjYUFK2SM1GEGGc4o2qeYoUBfFyYb9N)

## 🏁 Getting Started

To start using BIT10, follow these steps:

1. **Navigate to web_app**:
    ```bash
    cd web_app
    ```

2. **Install Dependencies**:
    ```bash
    npm install
    ```

3. **Run the App**:
    ```bash
    npm run dev
    ```

3. **Access** the app at [http://localhost:3000](http://localhost:3000).
