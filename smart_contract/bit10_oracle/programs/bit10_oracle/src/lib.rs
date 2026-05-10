use anchor_lang::prelude::*;

declare_id!("AFAEYYsCPmwLsd97XWVJxbWnB7tHFqQ41hUZGK2fKWZX");

const AUTHORIZED_UPDATER: &str = "keyMikmFKNDSu1ykZXWFRDhTdMEasfcmFjHSD4pSh9y";

pub const MAX_INDEX_TOKENS: usize = 10;
pub const MAX_ID_LEN: usize = 32;
pub const MAX_SYMBOL_LEN: usize = 10;
pub const MAX_NAME_LEN: usize = 32;

pub const MAX_CHUNK_SIZE: usize = 5;

#[program]
pub mod bit10_oracle {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let oracle = &mut ctx.accounts.oracle;
        oracle.authority = ctx.accounts.authority.key();

        oracle.bit10sol_timestamp = 0;
        oracle.bit10sol_price = 0;
        oracle.bit10sol_token_count = 0;

        oracle.sol_timestamp = 0;
        oracle.sol_price = 0;
        oracle.sol_market_cap = 0;

        oracle.usdc_timestamp = 0;
        oracle.usdc_price = 0;
        oracle.usdc_market_cap = 0;

        oracle.bit10_utility_timestamp = 0;
        oracle.bit10_utility_price = 0;
        oracle.bit10_utility_market_cap = 0;

        msg!("BIT10 Oracle initialized!");
        Ok(())
    }

    pub fn force_close(ctx: Context<ForceClose>) -> Result<()> {
        verify_updater(&ctx.accounts.authority.key())?;

        let oracle_info = ctx.accounts.oracle.to_account_info();
        let authority_info = ctx.accounts.authority.to_account_info();

        let lamports = oracle_info.lamports();
        **oracle_info.try_borrow_mut_lamports()? -= lamports;
        **authority_info.try_borrow_mut_lamports()? += lamports;

        let mut data = oracle_info.try_borrow_mut_data()?;
        for byte in data.iter_mut() {
            *byte = 0;
        }

        msg!("Oracle force closed, {} lamports returned", lamports);
        Ok(())
    }

    pub fn update_bit10sol_header(
        ctx: Context<UpdateOracle>,
        timestamp: i64,
        index_price: u64,
        token_count: u8,
    ) -> Result<()> {
        verify_updater(&ctx.accounts.updater.key())?;
        require!(
            (token_count as usize) <= MAX_INDEX_TOKENS,
            OracleError::TooManyTokens
        );

        let oracle = &mut ctx.accounts.oracle;
        oracle.bit10sol_timestamp = timestamp;
        oracle.bit10sol_price = index_price;
        oracle.bit10sol_token_count = token_count;

        msg!(
            "BIT10.SOL header: price={}, count={}, ts={}",
            index_price, token_count, timestamp
        );
        Ok(())
    }

    pub fn update_bit10sol_chunk(
        ctx: Context<UpdateOracle>,
        start_index: u8,
        tokens: Vec<TokenData>,
    ) -> Result<()> {
        verify_updater(&ctx.accounts.updater.key())?;
        require!(!tokens.is_empty(), OracleError::EmptyChunk);
        require!(tokens.len() <= MAX_CHUNK_SIZE, OracleError::ChunkTooLarge);

        let end = (start_index as usize)
            .checked_add(tokens.len())
            .ok_or(OracleError::IndexOutOfRange)?;
        require!(end <= MAX_INDEX_TOKENS, OracleError::IndexOutOfRange);

        let oracle = &mut ctx.accounts.oracle;
        for (i, token) in tokens.iter().enumerate() {
            let slot = (start_index as usize) + i;
            oracle.bit10sol_tokens[slot] = token.clone();
            msg!("Stored token slot {}: price={}", slot, token.price);
        }

        msg!(
            "BIT10.SOL chunk: start={}, len={}",
            start_index, tokens.len()
        );
        Ok(())
    }

    pub fn update_sol(
        ctx: Context<UpdateOracle>,
        timestamp: i64,
        price: u64,
        market_cap: u64,
    ) -> Result<()> {
        verify_updater(&ctx.accounts.updater.key())?;

        let oracle = &mut ctx.accounts.oracle;
        oracle.sol_timestamp = timestamp;
        oracle.sol_price = price;
        oracle.sol_market_cap = market_cap;

        msg!("SOL updated: price={}, ts={}", price, timestamp);
        Ok(())
    }

    pub fn update_usdc(
        ctx: Context<UpdateOracle>,
        timestamp: i64,
        price: u64,
        market_cap: u64,
    ) -> Result<()> {
        verify_updater(&ctx.accounts.updater.key())?;

        let oracle = &mut ctx.accounts.oracle;
        oracle.usdc_timestamp = timestamp;
        oracle.usdc_price = price;
        oracle.usdc_market_cap = market_cap;

        msg!("USDC updated: price={}, ts={}", price, timestamp);
        Ok(())
    }

    pub fn update_bit10_utility(
        ctx: Context<UpdateOracle>,
        timestamp: i64,
        price: u64,
        market_cap: u64,
    ) -> Result<()> {
        verify_updater(&ctx.accounts.updater.key())?;

        let oracle = &mut ctx.accounts.oracle;
        oracle.bit10_utility_timestamp = timestamp;
        oracle.bit10_utility_price = price;
        oracle.bit10_utility_market_cap = market_cap;

        msg!(
            "BIT10 Utility updated: price={}, ts={}",
            price, timestamp
        );
        Ok(())
    }
}

fn verify_updater(updater: &Pubkey) -> Result<()> {
    let authorized_key: Pubkey = AUTHORIZED_UPDATER
        .parse()
        .map_err(|_| OracleError::InvalidAuthority)?;
    require!(*updater == authorized_key, OracleError::Unauthorized);
    Ok(())
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = OracleState::LEN,
        seeds = [b"bit10-oracle"],
        bump
    )]
    pub oracle: Account<'info, OracleState>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ForceClose<'info> {
    /// CHECK: This account is manually zeroed and its lamports drained in the
    /// instruction body. We intentionally bypass Anchor's type checks here so
    /// the account can be closed even if its discriminator is corrupt or the
    /// layout has changed after a migration.
    #[account(
        mut,
        seeds = [b"bit10-oracle"],
        bump,
    )]
    pub oracle: UncheckedAccount<'info>,

    #[account(mut)]
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct UpdateOracle<'info> {
    #[account(
        mut,
        seeds = [b"bit10-oracle"],
        bump
    )]
    pub oracle: Account<'info, OracleState>,

    #[account(mut)]
    pub updater: Signer<'info>,
}

#[account]
pub struct OracleState {
    pub authority: Pubkey,

    pub bit10sol_timestamp: i64,
    pub bit10sol_price: u64,
    pub bit10sol_token_count: u8,
    pub bit10sol_tokens: [TokenData; MAX_INDEX_TOKENS],

    pub sol_timestamp: i64,
    pub sol_price: u64,
    pub sol_market_cap: u64,

    pub usdc_timestamp: i64,
    pub usdc_price: u64,
    pub usdc_market_cap: u64,

    pub bit10_utility_timestamp: i64,
    pub bit10_utility_price: u64,
    pub bit10_utility_market_cap: u64,
}

impl OracleState {
    pub const LEN: usize = 8
        + 32
        + 8 + 8 + 1
        + (10 * TokenData::LEN)
        + 8 + 8 + 8
        + 8 + 8 + 8
        + 8 + 8 + 8
        + 64;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct TokenData {
    pub id: [u8; MAX_ID_LEN],
    pub symbol: [u8; MAX_SYMBOL_LEN],
    pub name: [u8; MAX_NAME_LEN],
    pub price: u64,
    pub market_cap: u64,
    pub token_address: [u8; 32],
}

impl TokenData {
    pub const LEN: usize = MAX_ID_LEN + MAX_SYMBOL_LEN + MAX_NAME_LEN + 8 + 8 + 32;
}

#[error_code]
pub enum OracleError {
    #[msg("Unauthorized: only the hardcoded updater wallet can update")]
    Unauthorized,
    #[msg("Too many tokens: max is 10")]
    TooManyTokens,
    #[msg("Invalid authority pubkey")]
    InvalidAuthority,
    #[msg("Chunk is empty")]
    EmptyChunk,
    #[msg("Chunk too large: max 5 tokens per call")]
    ChunkTooLarge,
    #[msg("Token index out of range")]
    IndexOutOfRange,
}