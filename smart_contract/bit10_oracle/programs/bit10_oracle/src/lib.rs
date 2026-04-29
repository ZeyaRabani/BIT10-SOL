use anchor_lang::prelude::*;

declare_id!("9kWEcYpPbrB9C5yo9AKmS5HKHxqcwn4NzqhbJCsAh2bT");

const AUTHORIZED_UPDATER: &str = "Tu2FnrzwHwQpqhmckLa1jFyiqRTqWj8qBm1yuSTQDjn";

pub const MAX_TOKENS: usize = 10;
pub const MAX_ID_LEN: usize = 32;
pub const MAX_SYMBOL_LEN: usize = 10;
pub const MAX_NAME_LEN: usize = 32;

#[program]
pub mod bit10_oracle {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let oracle = &mut ctx.accounts.oracle;
        oracle.authority = ctx.accounts.authority.key();
        oracle.timestamp = 0;
        oracle.token_price = 0;
        oracle.token_count = 0;
        msg!("BIT10 Oracle initialized!");
        Ok(())
    }

    pub fn update_oracle(
        ctx: Context<UpdateOracle>,
        timestamp: i64,
        token_price: u64,
        tokens: Vec<TokenData>,
    ) -> Result<()> {
        let authorized_key: Pubkey = AUTHORIZED_UPDATER
            .parse()
            .map_err(|_| OracleError::InvalidAuthority)?;

        require!(
            ctx.accounts.updater.key() == authorized_key,
            OracleError::Unauthorized
        );

        require!(
            tokens.len() <= MAX_TOKENS,
            OracleError::TooManyTokens
        );

        let oracle = &mut ctx.accounts.oracle;
        oracle.timestamp = timestamp;
        oracle.token_price = token_price;
        oracle.token_count = tokens.len() as u8;

        for (i, token) in tokens.iter().enumerate() {
            oracle.tokens[i] = token.clone();
        }

        msg!(
            "Oracle updated: price={}, tokens={}, ts={}",
            token_price,
            tokens.len(),
            timestamp
        );
        Ok(())
    }
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
    pub timestamp: i64,
    pub token_price: u64,
    pub token_count: u8,
    pub tokens: [TokenData; 10],
}

impl OracleState {
    pub const LEN: usize = 8
        + 32
        + 8
        + 8
        + 1
        + (10 * TokenData::LEN);
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct TokenData {
    pub id: [u8; MAX_ID_LEN],
    pub symbol: [u8; MAX_SYMBOL_LEN],
    pub name: [u8; MAX_NAME_LEN],
    pub price: u64,
    pub market_cap: u64,
}

impl TokenData {
    pub const LEN: usize = MAX_ID_LEN
        + MAX_SYMBOL_LEN
        + MAX_NAME_LEN
        + 8
        + 8;
}

#[error_code]
pub enum OracleError {
    #[msg("Unauthorized: Only the hardcoded updater wallet can update this oracle")]
    Unauthorized,
    #[msg("Too many tokens: max is 10")]
    TooManyTokens,
    #[msg("Invalid authority pubkey")]
    InvalidAuthority,
}
