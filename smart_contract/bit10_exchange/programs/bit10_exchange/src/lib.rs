use anchor_lang::prelude::*;
use anchor_lang::solana_program::clock::Clock;

use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self as token_1, Token};
use anchor_spl::token_2022 as token_2022;
use anchor_spl::token_2022::burn as token2022_burn;
use anchor_spl::token_2022::mint_to;
use anchor_spl::token_2022::transfer_checked as token2022_transfer_checked;

const MINT_AUTH_SEED: &[u8] = b"bit10-mint-authority";
const VAULT_SOL_SEED: &[u8] = b"bit10-sol-vault";
const VAULT_AUTH_SEED: &[u8] = b"bit10-vault-authority";

const ORACLE_ADDRESS_STR: &str = "8zmM85Vk7aLpjRgw9V4jJtt7ZPPmeWaGQVTfK45T6WEC";

const ORACLE_PROGRAM_ID_STR: &str = "9kWEcYpPbrB9C5yo9AKmS5HKHxqcwn4NzqhbJCsAh2bT";
const ORACLE_STATE_DISCRIMINATOR: [u8; 8] = [97, 156, 157, 189, 194, 73, 8, 15];

const RECIPIENT_ADDRESS_STR: &str = "key4yrLZ9RFDMqE9sNKTZEvVsPQXmJg46s2ooTw45du";

const SOL_MINT_STR: &str = "So11111111111111111111111111111111111111112";
const USDC_MINT_STR: &str = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const BIT10_SOL_INDEX_MINT_STR: &str = "bitQG7BVz72Gu5L99bYRrZxTmFj8NPaFpT2uPp47yew";

const SOL_TOKEN_ADDRESS: &str = "So11111111111111111111111111111111111111112";

declare_id!("7CQDVZbDr9DtmzjYUFK2SM1GEGGc4o2qeYoUBfFyYb9N");

pub const MAX_INDEX_TOKENS: usize = 10;
pub const MAX_ID_LEN: usize = 32;
pub const MAX_SYMBOL_LEN: usize = 10;
pub const MAX_NAME_LEN: usize = 32;

const ORACLE_DISCRIMINATOR_LEN: usize = 8;

const BIT10_DECIMALS: u128 = 1_000_000_000;
const SOL_PRECISION: u128 = 1_000_000_000;
const USDC_PRECISION: u128 = 1_000_000;

const FEE_NUMERATOR: u128 = 5;
const FEE_DENOMINATOR: u128 = 1000;

const MAX_SANE_PRICE: u64 = 100_000_000_000_000;

#[program]
pub mod bit10_exchange {
    use super::*;

    pub fn mint(
        ctx: Context<MintCtx>,
        token_in_amount: u64,
        token_in_address: Pubkey,
        token_out_address: Pubkey,
        min_token_out_amount: u64,
    ) -> Result<MintResult> {
        let sol_marker: Pubkey = SOL_MINT_STR
            .parse()
            .map_err(|_| RouterError::InvalidMint)?;
        let bit10_index_mint: Pubkey = BIT10_SOL_INDEX_MINT_STR
            .parse()
            .map_err(|_| RouterError::InvalidMint)?;
        let oracle_address: Pubkey = ORACLE_ADDRESS_STR
            .parse()
            .map_err(|_| RouterError::InvalidMint)?;
        let recipient_address: Pubkey = RECIPIENT_ADDRESS_STR
            .parse()
            .map_err(|_| RouterError::InvalidMint)?;

        require_eq!(
            ctx.accounts.oracle.key(),
            oracle_address,
            RouterError::InvalidOracleAccount
        );

        require_eq!(
            ctx.accounts.recipient.key(),
            recipient_address,
            RouterError::InvalidRecipientAccount
        );

        require!(
            token_in_address == sol_marker
                || token_in_address == ctx.accounts.token_in_mint.key(),
            RouterError::InvalidTokenIn
        );
        require!(token_out_address == bit10_index_mint, RouterError::InvalidTokenOut);
        require!(
            ctx.accounts.token_out_mint.key() == token_out_address,
            RouterError::InvalidTokenOut
        );

        let oracle_data = decode_oracle(&ctx.accounts.oracle)?;

        msg!(
            "ORACLE mint: bit10sol_price={} sol_price={} usdc_price={}",
            oracle_data.prices.bit10sol_price,
            oracle_data.prices.sol_price,
            oracle_data.prices.usdc_price
        );

        require!(
            oracle_data.prices.bit10sol_price != 0,
            RouterError::OraclePriceZero
        );
        require_price_fresh(oracle_data.prices.bit10sol_timestamp)?;

        log_index_weights(&oracle_data)?;

        let token_in_is_sol = token_in_address == sol_marker;
        msg!("MINT token_in_is_sol={}", token_in_is_sol);

        let (token_in_price, token_in_precision): (u128, u128) = if token_in_is_sol {
            require_price_fresh(oracle_data.prices.sol_timestamp)?;
            require!(oracle_data.prices.sol_price != 0, RouterError::OraclePriceZero);
            (oracle_data.prices.sol_price as u128, SOL_PRECISION)
        } else {
            let usdc_mint: Pubkey = USDC_MINT_STR
                .parse()
                .map_err(|_| RouterError::InvalidMint)?;
            require_keys_eq!(
                ctx.accounts.token_in_mint.key(),
                usdc_mint,
                RouterError::InvalidTokenIn
            );
            require_price_fresh(oracle_data.prices.usdc_timestamp)?;
            require!(oracle_data.prices.usdc_price != 0, RouterError::OraclePriceZero);
            (oracle_data.prices.usdc_price as u128, USDC_PRECISION)
        };

        let bit10sol_price: u128 = oracle_data.prices.bit10sol_price as u128;
        let amount_in: u128 = token_in_amount as u128;

        let token_out_raw: u128 = amount_in
            .checked_mul(token_in_price)
            .ok_or(RouterError::MathOverflow)?
            .checked_mul(BIT10_DECIMALS)
            .ok_or(RouterError::MathOverflow)?
            .checked_div(
                token_in_precision
                    .checked_mul(bit10sol_price)
                    .ok_or(RouterError::MathOverflow)?,
            )
            .ok_or(RouterError::MathOverflow)?;

        let token_out_final: u128 = token_out_raw
            .checked_mul(FEE_DENOMINATOR - FEE_NUMERATOR)
            .ok_or(RouterError::MathOverflow)?
            .checked_div(FEE_DENOMINATOR)
            .ok_or(RouterError::MathOverflow)?;

        let token_in_usd_amount: u128 = amount_in
            .checked_mul(token_in_price)
            .ok_or(RouterError::MathOverflow)?
            .checked_div(token_in_precision)
            .ok_or(RouterError::MathOverflow)?;

        let token_out_amount: u64 = token_out_final
            .try_into()
            .map_err(|_| RouterError::MathOverflow)?;

        require!(token_out_amount > 0, RouterError::TokenOutAmountZero);
        require!(
            token_out_amount >= min_token_out_amount,
            RouterError::SlippageExceeded
        );

        let user_wallet_address = ctx.accounts.user.key();
        let transaction_timestamp = transaction_timestamp_ns_string()?;
        let swap_id = make_swap_id(user_wallet_address)?;

        msg!("MintResult token_in_amount={}", token_in_amount);
        msg!("MintResult token_in_address={}", token_in_address);
        msg!("MintResult token_out_address={}", token_out_address);
        msg!("MintResult token_in_usd_amount={}", token_in_usd_amount);
        msg!("MintResult token_out_amount={}", token_out_amount);
        msg!("MintResult transaction_type={}", "Buy");
        msg!("MintResult network={}", "Solana");
        msg!("MintResult swap_id={}", swap_id);
        msg!("MintResult user_wallet_address={}", user_wallet_address);
        msg!("MintResult transaction_timestamp={}", transaction_timestamp);

        if token_in_is_sol {
            anchor_lang::solana_program::program::invoke(
                &anchor_lang::solana_program::system_instruction::transfer(
                    ctx.accounts.user.key,
                    ctx.accounts.vault_sol_pda.key,
                    token_in_amount,
                ),
                &[
                    ctx.accounts.user.to_account_info(),
                    ctx.accounts.vault_sol_pda.to_account_info(),
                    ctx.accounts.system_program.to_account_info(),
                ],
            )?;
        } else {
            let token_in_mint_owner = ctx.accounts.token_in_mint.to_account_info().owner;
            let token1_program_id = token_1::ID;
            let token2022_program_id = token_2022::ID;

            verify_token_account(
                &ctx.accounts.user_token_in_ata.to_account_info(),
                token_in_mint_owner,
                &ctx.accounts.token_in_mint.key(),
                &ctx.accounts.user.key(),
            )?;
            verify_token_account(
                &ctx.accounts.recipient_token_in_ata.to_account_info(),
                token_in_mint_owner,
                &ctx.accounts.token_in_mint.key(),
                &recipient_address,
            )?;

            if token_in_mint_owner == &token1_program_id {
                let cpi_accounts = token_1::Transfer {
                    from: ctx.accounts.user_token_in_ata.to_account_info(),
                    to: ctx.accounts.recipient_token_in_ata.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                };
                let cpi_ctx = CpiContext::new(
                    ctx.accounts.token_program_in_1.to_account_info(),
                    cpi_accounts,
                );
                token_1::transfer(cpi_ctx, token_in_amount)?;
            } else if token_in_mint_owner == &token2022_program_id {
                let decimals = read_token_mint_decimals(
                    &ctx.accounts.token_in_mint.to_account_info(),
                )?;
                let cpi_accounts = token_2022::TransferChecked {
                    from: ctx.accounts.user_token_in_ata.to_account_info(),
                    to: ctx.accounts.recipient_token_in_ata.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                    mint: ctx.accounts.token_in_mint.to_account_info(),
                };
                let cpi_ctx = CpiContext::new(
                    ctx.accounts.token_program_in_2022.to_account_info(),
                    cpi_accounts,
                );
                token2022_transfer_checked(cpi_ctx, token_in_amount, decimals)?;
            } else {
                return err!(RouterError::InvalidTokenInProgram);
            }
        }

        verify_token_account(
            &ctx.accounts.user_token_out_ata.to_account_info(),
            &token_2022::ID,
            &ctx.accounts.token_out_mint.key(),
            &ctx.accounts.user.key(),
        )?;

        let mint_auth_bump = ctx.bumps.mint_authority;
        let signer_seeds_inner: [&[u8]; 2] =
            [MINT_AUTH_SEED, &[mint_auth_bump]];
        let signer_seeds_wrapper: [&[&[u8]]; 1] = [&signer_seeds_inner];

        let cpi_accounts = token_2022::MintTo {
            mint: ctx.accounts.token_out_mint.to_account_info(),
            to: ctx.accounts.user_token_out_ata.to_account_info(),
            authority: ctx.accounts.mint_authority.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program_out_2022.to_account_info(),
            cpi_accounts,
            &signer_seeds_wrapper,
        );
        mint_to(cpi_ctx, token_out_amount)?;

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

    pub fn burn(
        ctx: Context<BurnCtx>,
        token_in_amount: u64,
        token_in_address: Pubkey,
        token_out_address: Pubkey,
        min_token_out_lamports: u64,
    ) -> Result<BurnResult> {
        let sol_marker: Pubkey = SOL_MINT_STR
            .parse()
            .map_err(|_| RouterError::InvalidMint)?;
        let bit10_index_mint: Pubkey = BIT10_SOL_INDEX_MINT_STR
            .parse()
            .map_err(|_| RouterError::InvalidMint)?;
        let oracle_address: Pubkey = ORACLE_ADDRESS_STR
            .parse()
            .map_err(|_| RouterError::InvalidMint)?;

        require_eq!(
            ctx.accounts.oracle.key(),
            oracle_address,
            RouterError::InvalidOracleAccount
        );

        require!(token_in_address == bit10_index_mint, RouterError::InvalidTokenIn);
        require!(
            ctx.accounts.token_in_mint.key() == token_in_address,
            RouterError::InvalidTokenIn
        );
        require!(token_out_address == sol_marker, RouterError::InvalidTokenOut);

        let oracle_data = decode_oracle(&ctx.accounts.oracle)?;

        msg!(
            "ORACLE burn: bit10sol_price={} sol_price={} usdc_price={}",
            oracle_data.prices.bit10sol_price,
            oracle_data.prices.sol_price,
            oracle_data.prices.usdc_price
        );

        require!(
            oracle_data.prices.bit10sol_price != 0,
            RouterError::OraclePriceZero
        );
        require!(oracle_data.prices.sol_price != 0, RouterError::OraclePriceZero);
        require_price_fresh(oracle_data.prices.bit10sol_timestamp)?;
        require_price_fresh(oracle_data.prices.sol_timestamp)?;

        log_index_weights(&oracle_data)?;

        let bit10sol_price: u128 = oracle_data.prices.bit10sol_price as u128;
        let sol_price: u128 = oracle_data.prices.sol_price as u128;
        let amount_in: u128 = token_in_amount as u128;

        let token_out_raw: u128 = amount_in
            .checked_mul(bit10sol_price)
            .ok_or(RouterError::MathOverflow)?
            .checked_mul(SOL_PRECISION)
            .ok_or(RouterError::MathOverflow)?
            .checked_div(
                BIT10_DECIMALS
                    .checked_mul(sol_price)
                    .ok_or(RouterError::MathOverflow)?,
            )
            .ok_or(RouterError::MathOverflow)?;

        let token_out_final: u128 = token_out_raw
            .checked_mul(FEE_DENOMINATOR - FEE_NUMERATOR)
            .ok_or(RouterError::MathOverflow)?
            .checked_div(FEE_DENOMINATOR)
            .ok_or(RouterError::MathOverflow)?;

        let fee_amount: u128 = token_out_raw
            .checked_sub(token_out_final)
            .ok_or(RouterError::MathOverflow)?;

        let token_in_usd_amount: u128 = amount_in
            .checked_mul(bit10sol_price)
            .ok_or(RouterError::MathOverflow)?
            .checked_div(BIT10_DECIMALS)
            .ok_or(RouterError::MathOverflow)?;

        let token_out_lamports: u64 = token_out_final
            .try_into()
            .map_err(|_| RouterError::MathOverflow)?;

        require!(token_out_lamports > 0, RouterError::TokenOutAmountZero);
        require!(
            token_out_lamports >= min_token_out_lamports,
            RouterError::SlippageExceeded
        );

        let vault_lamports = ctx.accounts.vault_sol_pda.to_account_info().lamports();
        require!(
            vault_lamports >= token_out_lamports,
            RouterError::InsufficientVaultLamports
        );

        let user_wallet_address = ctx.accounts.user.key();
        let transaction_timestamp = transaction_timestamp_ns_string()?;
        let swap_id = make_swap_id(user_wallet_address)?;

        msg!("BurnResult token_in_amount={}", token_in_amount);
        msg!("BurnResult token_in_address={}", token_in_address);
        msg!("BurnResult token_out_address={}", token_out_address);
        msg!("BurnResult token_in_usd_amount={}", token_in_usd_amount);
        msg!("BurnResult token_out_lamports={}", token_out_lamports);
        msg!("BurnResult platform_fee_lamports={}", fee_amount);
        msg!("BurnResult transaction_type={}", "Sell");
        msg!("BurnResult network={}", "Solana");
        msg!("BurnResult swap_id={}", swap_id);
        msg!("BurnResult user_wallet_address={}", user_wallet_address);
        msg!("BurnResult transaction_timestamp={}", transaction_timestamp);

        verify_token_account(
            &ctx.accounts.user_token_in_ata.to_account_info(),
            &token_2022::ID,
            &ctx.accounts.token_in_mint.key(),
            &ctx.accounts.user.key(),
        )?;

        let vault_bump = ctx.bumps.vault_sol_pda;
        let vault_signer_seeds_inner: [&[u8]; 2] = [VAULT_SOL_SEED, &[vault_bump]];
        let vault_signer_seeds_wrapper: [&[&[u8]]; 1] = [&vault_signer_seeds_inner];

        anchor_lang::solana_program::program::invoke_signed(
            &anchor_lang::solana_program::system_instruction::transfer(
                ctx.accounts.vault_sol_pda.key,
                ctx.accounts.user.key,
                token_out_lamports,
            ),
            &[
                ctx.accounts.vault_sol_pda.to_account_info(),
                ctx.accounts.user.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
            &vault_signer_seeds_wrapper,
        )?;

        let cpi_accounts = token_2022::Burn {
            mint: ctx.accounts.token_in_mint.to_account_info(),
            from: ctx.accounts.user_token_in_ata.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program_in_2022.to_account_info(),
            cpi_accounts,
        );
        token2022_burn(cpi_ctx, token_in_amount)?;

        emit!(BurnExecuted {
            user: user_wallet_address,
            burned: token_in_amount,
            paid_out_lamports: token_out_lamports,
        });

        Ok(BurnResult {
            token_in_amount: token_in_amount.to_string(),
            transaction_type: "Sell".to_string(),
            token_in_address: token_in_address.to_string(),
            token_out_address: token_out_address.to_string(),
            network: "Solana".to_string(),
            swap_id,
            user_wallet_address: user_wallet_address.to_string(),
            transaction_timestamp,
            token_in_usd_amount: token_in_usd_amount.to_string(),
            token_out_amount: token_out_lamports.to_string(),
        })
    }
}

#[derive(Clone, Debug)]
pub struct OraclePrices {
    pub bit10sol_price: u64,
    pub sol_price: u64,
    pub usdc_price: u64,
    pub bit10sol_timestamp: i64,
    pub sol_timestamp: i64,
    pub usdc_timestamp: i64,
}

#[derive(Clone, Debug)]
pub struct IndexToken {
    pub symbol: [u8; MAX_SYMBOL_LEN],
    pub market_cap: u64,
    pub token_address: [u8; 32],
}

#[derive(Clone, Debug)]
pub struct OracleData {
    pub prices: OraclePrices,
    pub tokens: [IndexToken; MAX_INDEX_TOKENS],
    pub token_count: u8,
}

fn read_u64_le(data: &[u8], offset: usize) -> Result<u64> {
    if data.len() < offset + 8 {
        return err!(RouterError::OracleDataTooSmall);
    }
    let mut b = [0u8; 8];
    b.copy_from_slice(&data[offset..offset + 8]);
    Ok(u64::from_le_bytes(b))
}

fn read_i64_le(data: &[u8], offset: usize) -> Result<i64> {
    if data.len() < offset + 8 {
        return err!(RouterError::OracleDataTooSmall);
    }
    let mut b = [0u8; 8];
    b.copy_from_slice(&data[offset..offset + 8]);
    Ok(i64::from_le_bytes(b))
}

fn read_bytes_fixed<const N: usize>(data: &[u8], offset: usize) -> Result<[u8; N]> {
    if data.len() < offset + N {
        return err!(RouterError::OracleDataTooSmall);
    }
    let mut b = [0u8; N];
    b.copy_from_slice(&data[offset..offset + N]);
    Ok(b)
}

fn decode_oracle(oracle: &UncheckedAccount) -> Result<OracleData> {
    let oracle_program_id: Pubkey = ORACLE_PROGRAM_ID_STR
        .parse()
        .map_err(|_| RouterError::InvalidMint)?;
    require_keys_eq!(
        *oracle.to_account_info().owner,
        oracle_program_id,
        RouterError::InvalidOracleAccount
    );

    let oracle_data = oracle.try_borrow_data()?;

    if oracle_data.len() < ORACLE_DISCRIMINATOR_LEN {
        return err!(RouterError::OracleDataTooSmall);
    }

    require!(
        oracle_data[..ORACLE_DISCRIMINATOR_LEN] == ORACLE_STATE_DISCRIMINATOR,
        RouterError::OracleDeserializeFailed
    );

    let d = &oracle_data[ORACLE_DISCRIMINATOR_LEN..];

    require_eq!(d.len(), EXPECTED_ORACLE_DATA_LEN, RouterError::OracleDataTooSmall);

    const TOKEN_DATA_LEN: usize = 122;
    let tokens_len = MAX_INDEX_TOKENS * TOKEN_DATA_LEN;

    const EXPECTED_ORACLE_DATA_LEN: usize =
        32 + 8 + 8 + 1 + (MAX_INDEX_TOKENS * TOKEN_DATA_LEN) + 24 + 24 + 24 + 64;

    let bit10sol_timestamp_offset = 32;
    let bit10sol_price_offset = 32 + 8;
    let bit10sol_token_count_offset = 32 + 8 + 8;
    let bit10sol_tokens_offset = 32 + 8 + 8 + 1;

    let sol_timestamp_offset = bit10sol_tokens_offset + tokens_len;
    let sol_price_offset = sol_timestamp_offset + 8;

    let usdc_timestamp_offset = sol_price_offset + 8 + 8;
    let usdc_price_offset = usdc_timestamp_offset + 8;

    let bit10sol_timestamp = read_i64_le(d, bit10sol_timestamp_offset)?;
    let bit10sol_price = read_u64_le(d, bit10sol_price_offset)?;
    let sol_timestamp = read_i64_le(d, sol_timestamp_offset)?;
    let sol_price = read_u64_le(d, sol_price_offset)?;
    let usdc_timestamp = read_i64_le(d, usdc_timestamp_offset)?;
    let usdc_price = read_u64_le(d, usdc_price_offset)?;

    require!(bit10sol_price <= MAX_SANE_PRICE, RouterError::OraclePriceOutOfBounds);
    require!(sol_price <= MAX_SANE_PRICE, RouterError::OraclePriceOutOfBounds);
    require!(usdc_price <= MAX_SANE_PRICE, RouterError::OraclePriceOutOfBounds);

    let token_count = if d.len() > bit10sol_token_count_offset {
        d[bit10sol_token_count_offset]
    } else {
        0
    };

    let token_count = token_count.min(MAX_INDEX_TOKENS as u8);

    let mut tokens: [IndexToken; MAX_INDEX_TOKENS] = core::array::from_fn(|_| IndexToken {
        symbol: [0u8; MAX_SYMBOL_LEN],
        market_cap: 0,
        token_address: [0u8; 32],
    });

    for i in 0..(token_count as usize) {
        let token_offset = bit10sol_tokens_offset + (i * TOKEN_DATA_LEN);

        let symbol_offset = token_offset + 32;
        let market_cap_offset = token_offset + 32 + 10 + 32 + 8; // id + symbol + name + price
        let token_address_offset = token_offset + 32 + 10 + 32 + 8 + 8; // id + symbol + name + price + market_cap

        let symbol = read_bytes_fixed::<MAX_SYMBOL_LEN>(d, symbol_offset)?;
        let market_cap = read_u64_le(d, market_cap_offset)?;
        let token_address = read_bytes_fixed::<32>(d, token_address_offset)?;

        tokens[i] = IndexToken {
            symbol,
            market_cap,
            token_address,
        };
    }

    Ok(OracleData {
        prices: OraclePrices {
            bit10sol_price,
            sol_price,
            usdc_price,
            bit10sol_timestamp,
            sol_timestamp,
            usdc_timestamp,
        },
        tokens,
        token_count,
    })
}

const MAX_ORACLE_STALENESS_SECS: i64 = 300;

fn require_price_fresh(price_timestamp: i64) -> Result<()> {
    let now = Clock::get()?.unix_timestamp;
    require!(
        now.saturating_sub(price_timestamp) <= MAX_ORACLE_STALENESS_SECS,
        RouterError::OraclePriceStale
    );
    Ok(())
}

fn log_index_weights(oracle_data: &OracleData) -> Result<()> {
    let mut total_market_cap: u128 = 0;

    for i in 0..(oracle_data.token_count as usize) {
        let mcap = oracle_data.tokens[i].market_cap as u128;
        total_market_cap = total_market_cap
            .checked_add(mcap)
            .ok_or(RouterError::MathOverflow)?;
    }

    if total_market_cap == 0 {
        msg!("INDEX_WEIGHTS: total_market_cap is zero");
        return Ok(());
    }

    msg!("INDEX_WEIGHTS total_market_cap={}", total_market_cap);

   for i in 0..(oracle_data.token_count as usize) {
        let mcap = oracle_data.tokens[i].market_cap as u128;

        let weight_basis_points: u128 = mcap
            .checked_mul(10000)
            .ok_or(RouterError::MathOverflow)?
            .checked_div(total_market_cap)
            .ok_or(RouterError::MathOverflow)?;

        let weight_whole = weight_basis_points / 100;
        let weight_frac = weight_basis_points % 100;

        let symbol_str = symbol_to_string(&oracle_data.tokens[i].symbol);
        let addr_str = pubkey_bytes_to_string(&oracle_data.tokens[i].token_address);

        msg!(
            "INDEX_TOKEN[{}] symbol={} mcap={} weight={}.{:02}% addr={}",
            i,
            symbol_str,
            mcap,
            weight_whole,
            weight_frac,
            addr_str
        );
    }

    msg!(
        "INDEX_REFERENCE sol_address={}",
        SOL_TOKEN_ADDRESS
    );

    Ok(())
}

fn symbol_to_string(symbol: &[u8; MAX_SYMBOL_LEN]) -> String {
    let end = symbol.iter().position(|&b| b == 0).unwrap_or(symbol.len());
    String::from_utf8_lossy(&symbol[..end]).to_string()
}

fn pubkey_bytes_to_string(bytes: &[u8; 32]) -> String {
    const ALPHABET: &[u8] = b"123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

    let mut encoded = Vec::new();
    let mut num = bytes.to_vec();

    for &byte in bytes {
        if byte == 0 {
            encoded.push(ALPHABET[0]);
        } else {
            break;
        }
    }

    while !num.is_empty() && num.iter().all(|&b| b == 0) {
        num.pop();
    }

    if num.is_empty() {
        return String::from_utf8(encoded).unwrap_or_default();
    }

    while num.iter().any(|&b| b != 0) {
        let mut carry = 0u16;
        for byte in &mut num {
            carry = (carry * 256) + (*byte as u16);
            *byte = (carry / 58) as u8;
            carry %= 58;
        }

        encoded.push(ALPHABET[carry as usize]);

        while !num.is_empty() && num[0] == 0 {
            num.remove(0);
        }
    }

    encoded.reverse();
    String::from_utf8(encoded).unwrap_or_default()
}

fn verify_token_account(
    account: &AccountInfo,
    token_program_id: &Pubkey,
    expected_mint: &Pubkey,
    expected_owner: &Pubkey,
) -> Result<()> {
    require_keys_eq!(*account.owner, *token_program_id, RouterError::InvalidTokenInProgram);

    let data = account.try_borrow_data()?;

    const TOKEN_ACCOUNT_LEN: usize = 165;
    const STATE_OFFSET: usize = 108;
    if data.len() < TOKEN_ACCOUNT_LEN {
        return err!(RouterError::TokenMintDataTooSmall);
    }
    require!(data[0..32] == expected_mint.to_bytes(), RouterError::InvalidTokenAccountMint);
    require!(data[32..64] == expected_owner.to_bytes(), RouterError::InvalidTokenAccountOwner);

    require!(data[STATE_OFFSET] != 0, RouterError::InvalidTokenAccountState);
    Ok(())
}

fn read_token_mint_decimals(mint_account: &AccountInfo) -> Result<u8> {
    let data = mint_account.try_borrow_data()?;
    const DECIMALS_OFFSET: usize = 44;
    if data.len() <= DECIMALS_OFFSET {
        return err!(RouterError::TokenMintDataTooSmall);
    }
    Ok(data[DECIMALS_OFFSET])
}

fn transaction_timestamp_ns_string() -> Result<String> {
    let clock = Clock::get()?;
    let secs = clock.unix_timestamp.max(0) as u64;
    let slot = clock.slot;
    let nanos = slot.wrapping_mul(2_654_435_761) % 1_000_000_000;
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
pub struct MintCtx<'info> {
    #[account(mut)]
    pub oracle: UncheckedAccount<'info>,

    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut)]
    pub recipient: UncheckedAccount<'info>,

    #[account(mut)]
    pub user_token_in_ata: UncheckedAccount<'info>,

    #[account(mut)]
    pub recipient_token_in_ata: UncheckedAccount<'info>,

    #[account(
        mut,
        constraint = *token_in_mint.owner == token_1::ID
            || *token_in_mint.owner == token_2022::ID
            @ RouterError::InvalidTokenInProgram
    )]
    pub token_in_mint: UncheckedAccount<'info>,

    #[account(
        mut,
        constraint = *token_out_mint.owner == token_2022::ID @ RouterError::InvalidTokenOutProgram
    )]
    pub token_out_mint: UncheckedAccount<'info>,

    #[account(seeds = [MINT_AUTH_SEED], bump)]
    pub mint_authority: UncheckedAccount<'info>,

    #[account(mut)]
    pub user_token_out_ata: UncheckedAccount<'info>,

    #[account(constraint = token_program_in_1.key() == token_1::ID @ RouterError::InvalidTokenInProgram)]
    pub token_program_in_1: Program<'info, Token>,
    #[account(constraint = token_program_in_2022.key() == token_2022::ID @ RouterError::InvalidTokenInProgram)]
    pub token_program_in_2022: Program<'info, token_2022::Token2022>,
    #[account(constraint = token_program_out_2022.key() == token_2022::ID @ RouterError::InvalidTokenOutProgram)]
    pub token_program_out_2022: Program<'info, token_2022::Token2022>,

    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,

    #[account(seeds = [VAULT_AUTH_SEED], bump)]
    pub vault_authority: UncheckedAccount<'info>,

    #[account(mut, seeds = [VAULT_SOL_SEED], bump)]
    pub vault_sol_pda: UncheckedAccount<'info>,

    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct BurnCtx<'info> {
    #[account(mut)]
    pub oracle: UncheckedAccount<'info>,

    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut)]
    pub user_token_in_ata: UncheckedAccount<'info>,

    #[account(
        mut,
        constraint = *token_in_mint.owner == token_2022::ID @ RouterError::InvalidTokenInProgram
    )]
    pub token_in_mint: UncheckedAccount<'info>,

    #[account(mut, seeds = [VAULT_SOL_SEED], bump)]
    pub vault_sol_pda: UncheckedAccount<'info>,

    #[account(constraint = token_program_in_2022.key() == token_2022::ID @ RouterError::InvalidTokenInProgram)]
    pub token_program_in_2022: Program<'info, token_2022::Token2022>,
    pub system_program: Program<'info, System>,

    #[account(seeds = [VAULT_AUTH_SEED], bump)]
    pub vault_authority: UncheckedAccount<'info>,
}

#[event]
pub struct BurnExecuted {
    pub user: Pubkey,
    pub burned: u64,
    pub paid_out_lamports: u64,
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

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct BurnResult {
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
    #[msg("Invalid token_in address")]
    InvalidTokenIn,

    #[msg("Invalid token_out address")]
    InvalidTokenOut,

    #[msg("Invalid mint pubkey constant")]
    InvalidMint,

    #[msg("Math overflow")]
    MathOverflow,

    #[msg("Oracle price is zero")]
    OraclePriceZero,

    #[msg("Oracle price data is stale")]
    OraclePriceStale,

    #[msg("Oracle account data too small")]
    OracleDataTooSmall,

    #[msg("Failed to deserialize oracle account")]
    OracleDeserializeFailed,

    #[msg("Computed token_out_amount is zero")]
    TokenOutAmountZero,

    #[msg("Invalid token in program id (neither token-1 nor token-2022)")]
    InvalidTokenInProgram,

    #[msg("Invalid token out program id (must be token-2022)")]
    InvalidTokenOutProgram,

    #[msg("Token mint data too small to read decimals")]
    TokenMintDataTooSmall,

    #[msg("Insufficient vault lamports")]
    InsufficientVaultLamports,

    #[msg("Invalid oracle account - must be the hardcoded oracle")]
    InvalidOracleAccount,

    #[msg("Invalid recipient account - must be the hardcoded recipient")]
    InvalidRecipientAccount,

    #[msg("Token account mint does not match the expected mint")]
    InvalidTokenAccountMint,

    #[msg("Token account owner does not match the expected owner")]
    InvalidTokenAccountOwner,

    #[msg("Oracle price is out of sane bounds")]
    OraclePriceOutOfBounds,

    #[msg("Token account is not in a valid initialized state")]
    InvalidTokenAccountState,

    #[msg("Output amount is below the caller's minimum (slippage)")]
    SlippageExceeded,
}