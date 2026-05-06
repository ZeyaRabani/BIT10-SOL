use anchor_lang::prelude::*;
use anchor_lang::solana_program::clock::Clock;

declare_id!("3M2PP2Ex85JoQEdQHjEBDCJ4YVR3RLXSkVoB1kwHhF8Q");

const SOL_MINT_STR: &str = "So11111111111111111111111111111111111111112";
const USDC_MINT_STR: &str = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
const BIT10_SOL_INDEX_MINT_STR: &str = "bitfxKNf4xV9ynkbtVaiTr5hUPdDesUQUsRYVyG6iNe";

pub const MAX_INDEX_TOKENS: usize = 10;
pub const MAX_ID_LEN: usize = 32;
pub const MAX_SYMBOL_LEN: usize = 10;
pub const MAX_NAME_LEN: usize = 32;

const ORACLE_DISCRIMINATOR_LEN: usize = 8;

#[program]
pub mod bit10_exchange {
    use super::*;

    pub fn mint(
        ctx: Context<Mint>,
        token_in_amount: u64,
        token_in_address: Pubkey,
        token_out_address: Pubkey,
    ) -> Result<MintResult> {
        let sol_mint: Pubkey = SOL_MINT_STR.parse().map_err(|_| RouterError::InvalidMint)?;
        let usdc_mint: Pubkey = USDC_MINT_STR.parse().map_err(|_| RouterError::InvalidMint)?;
        let bit10_index_mint: Pubkey =
            BIT10_SOL_INDEX_MINT_STR.parse().map_err(|_| RouterError::InvalidMint)?;

        require!(
            token_in_address == sol_mint || token_in_address == usdc_mint,
            RouterError::InvalidTokenIn
        );

        require!(
            token_out_address == bit10_index_mint,
            RouterError::InvalidTokenOut
        );

        let oracle_data = ctx.accounts.oracle.try_borrow_data()?;
        if oracle_data.len() < ORACLE_DISCRIMINATOR_LEN {
            return err!(RouterError::OracleDataTooSmall);
        }

        let oracle_state = {
            let mut ok: Option<OracleStateProxy> = None;

            {
                let bytes = &oracle_data[ORACLE_DISCRIMINATOR_LEN..];
                let mut slice: &[u8] = bytes;
                if let Ok(v) = OracleStateProxy::try_deserialize(&mut slice) {
                    ok = Some(v);
                }
            }

            if ok.is_none() {
                let bytes = &oracle_data[..];
                let mut slice: &[u8] = bytes;
                if let Ok(v) = OracleStateProxy::try_deserialize(&mut slice) {
                    ok = Some(v);
                }
            }

            ok.ok_or(RouterError::OracleDeserializeFailed)?
        };

        require!(oracle_state.bit10sol_price != 0, RouterError::OraclePriceZero);

        let token_in_is_sol = token_in_address == sol_mint;

        let token_in_usd_amount: u64 = if token_in_is_sol {
            require!(oracle_state.sol_price != 0, RouterError::OraclePriceZero);
            mul_u64(token_in_amount, oracle_state.sol_price)?
        } else {
            require!(oracle_state.usdc_price != 0, RouterError::OraclePriceZero);
            mul_u64(token_in_amount, oracle_state.usdc_price)?
        };

        let token_out_amount: u64 = div_u64(token_in_usd_amount, oracle_state.bit10sol_price)?;

        let user_wallet_address = ctx.accounts.user.key();

        let transaction_timestamp = transaction_timestamp_ns_string()?;
        let swap_id = make_swap_id(user_wallet_address)?;

        msg!("Mint computed:");
        msg!("MintResult token_in_amount={}", token_in_amount);
        msg!("MintResult token_in_address={}", token_in_address);
        msg!("MintResult token_out_address={}", token_out_address);
        msg!("MintResult token_in_usd_amount={}", token_in_usd_amount);
        msg!("MintResult token_out_amount={}", token_out_amount);
        msg!("MintResult transaction_type={}", "Buy");
        msg!("MintResult network={}", "Solana");
        msg!("MintResult swap_id={}", swap_id);
        msg!("MintResult user_wallet_address={}", ctx.accounts.user.key());
        msg!("MintResult transaction_timestamp={}", transaction_timestamp);

        Ok(MintResult {
            token_in_amount: token_in_amount.to_string(),
            transaction_type: "Buy".to_string(),
            token_in_address: token_in_address.to_string(),
            token_out_address: token_out_address.to_string(),

            network: "Solana".to_string(),
            swap_id,

            user_wallet_address: user_wallet_address.to_string(),
            transaction_timestamp,

            token_in_usd_amount: token_in_usd_amount.to_string(),
            token_out_amount: token_out_amount.to_string(),
        })
    }
}

fn mul_u64(a: u64, b: u64) -> Result<u64> {
    a.checked_mul(b).ok_or(RouterError::MathOverflow.into())
}

fn div_u64(a: u64, b: u64) -> Result<u64> {
    require!(b != 0, RouterError::OraclePriceZero);
    Ok(a / b)
}

fn transaction_timestamp_ns_string() -> Result<String> {
    let clock = Clock::get()?;
    let secs: u64 = clock.unix_timestamp.max(0) as u64;
    let slot: u64 = clock.slot;

    let nanos: u64 = slot.wrapping_mul(2_654_435_761) % 1_000_000_000;

    let ns = secs
        .checked_mul(1_000_000_000)
        .ok_or(RouterError::MathOverflow)?
        .checked_add(nanos)
        .ok_or(RouterError::MathOverflow)?;

    Ok(ns.to_string())
}

fn make_swap_id(user: Pubkey) -> Result<String> {
    let clock = Clock::get()?;
    let slot: u64 = clock.slot;

    let user_bytes = user.to_bytes();

    let mut buf = [0u8; 26];
    buf[0..16].copy_from_slice(&user_bytes[0..16]);
    buf[16..24].copy_from_slice(&slot.to_le_bytes());
    buf[24..26].copy_from_slice(&[0x01, 0x01]);

    Ok(to_lower_hex(&buf))
}

fn to_lower_hex(bytes: &[u8]) -> String {
    const CHARS: &[u8; 16] = b"0123456789abcdef";
    let mut out = vec![0u8; bytes.len() * 2];
    for (i, b) in bytes.iter().enumerate() {
        out[i * 2] = CHARS[((b >> 4) & 0x0f) as usize];
        out[i * 2 + 1] = CHARS[(b & 0x0f) as usize];
    }
    String::from_utf8(out).unwrap()
}

#[derive(Accounts)]
pub struct Mint<'info> {
    #[account(mut)]
    pub oracle: UncheckedAccount<'info>,

    #[account(mut)]
    pub user: Signer<'info>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct TokenDataProxy {
    pub id: [u8; MAX_ID_LEN],
    pub symbol: [u8; MAX_SYMBOL_LEN],
    pub name: [u8; MAX_NAME_LEN],
    pub price: u64,
    pub market_cap: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct OracleStateProxy {
    pub authority: Pubkey,

    pub bit10sol_timestamp: i64,
    pub bit10sol_price: u64,
    pub bit10sol_token_count: u8,
    pub bit10sol_tokens: [TokenDataProxy; MAX_INDEX_TOKENS],

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

impl OracleStateProxy {
    pub fn try_deserialize(slice: &mut &[u8]) -> Result<Self> {
        Ok(OracleStateProxy::deserialize(slice)?)
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct MintResult {
    pub token_in_amount: String,
    pub transaction_type: String,
    pub token_in_address: String,
    pub token_out_address: String,

    pub network: String,
    pub swap_id: String,

    pub user_wallet_address: String,
    pub transaction_timestamp: String,

    pub token_in_usd_amount: String,
    pub token_out_amount: String,
}

#[error_code]
pub enum RouterError {
    #[msg("Unauthorized: only the hardcoded updater wallet can update")]
    Unauthorized,

    #[msg("Invalid token_in address (only SOL or USDC allowed)")]
    InvalidTokenIn,

    #[msg("Invalid token_out address (only BIT10.SOL index token allowed)")]
    InvalidTokenOut,

    #[msg("Invalid mint pubkey constant")]
    InvalidMint,

    #[msg("Math overflow")]
    MathOverflow,

    #[msg("Oracle price is zero")]
    OraclePriceZero,

    #[msg("Oracle account data too small")]
    OracleDataTooSmall,

    #[msg("Failed to deserialize oracle account")]
    OracleDeserializeFailed,
}
