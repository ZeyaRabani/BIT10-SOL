use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};
use anchor_spl::token_2022;
use anchor_spl::associated_token::AssociatedToken;

declare_id!("3M2PP2Ex85JoQEdQHjEBDCJ4YVR3RLXSkVoB1kwHhF8Q");

const SOL_MINT: &str = "So11111111111111111111111111111111111111112";
const USDC_MINT: &str = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
const BIT_SOL_MINT: &str = "bitfxKNf4xV9ynkbtVaiTr5hUPdDesUQUsRYVyG6iNe";
const PLATFORM_FEE_BPS: u64 = 50;
const BPS_DENOMINATOR: u64 = 10000;

const DISC: usize = 8;
const AUTHORITY_LEN: usize = 32;
const TOKEN_DATA_LEN: usize = 90;
const MAX_INDEX_TOKENS: usize = 10;

const BIT10SOL_PRICE_OFFSET: usize = DISC + AUTHORITY_LEN + 8;
const BIT10SOL_BLOCK_LEN: usize = 8 + 8 + 1 + (MAX_INDEX_TOKENS * TOKEN_DATA_LEN);
const SOL_PRICE_OFFSET: usize = DISC + AUTHORITY_LEN + BIT10SOL_BLOCK_LEN + 8;
const SOL_BLOCK_LEN: usize = 8 + 8 + 8;
const USDC_PRICE_OFFSET: usize = DISC + AUTHORITY_LEN + BIT10SOL_BLOCK_LEN + SOL_BLOCK_LEN + 8 + 8;

#[account]
pub struct ProgramState {
    pub initialized: bool,
    pub admin: Pubkey,
}

impl ProgramState {
    pub const LEN: usize = 8 + 1 + 32;
}

#[program]
pub mod bit10_exchange {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let state = &mut ctx.accounts.state;
        state.initialized = true;
        state.admin = ctx.accounts.admin.key();

        let cpi_accounts = anchor_spl::token_interface::SetAuthority {
            account_or_mint: ctx.accounts.token_out_mint.to_account_info(),
            current_authority: ctx.accounts.admin.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
        );
        anchor_spl::token_interface::set_authority(
            cpi_ctx,
            anchor_spl::token_interface::spl_token_2022::instruction::AuthorityType::MintTokens,
            Some(ctx.accounts.mint_authority.key()),
        )?;

        msg!(
            "Initialized. Mint authority transferred to PDA: {}",
            ctx.accounts.mint_authority.key()
        );
        Ok(())
    }

    pub fn mint(ctx: Context<MintAccounts>, token_in_amount: u64) -> Result<()> {
        let token_in_mint = ctx.accounts.token_in_mint.key();
        let token_out_mint = ctx.accounts.token_out_mint.key();

        require!(
            token_in_mint.to_string() == SOL_MINT
                || token_in_mint.to_string() == USDC_MINT,
            SwapperError::InvalidTokenIn
        );
        require!(
            token_out_mint.to_string() == BIT_SOL_MINT,
            SwapperError::InvalidTokenOut
        );
        require!(token_in_amount > 0, SwapperError::InvalidAmount);

        require!(
            ctx.accounts.state.initialized,
            SwapperError::NotInitialized
        );

        let expected_authority = ctx.accounts.mint_authority.key();
        let actual_authority = ctx.accounts.token_out_mint.mint_authority;
        require!(
            actual_authority == anchor_lang::solana_program::program_option::COption::Some(
                expected_authority
            ),
            SwapperError::InvalidMintAuthority
        );

        let token_in_price = get_token_price(&ctx.accounts.oracle, &token_in_mint)?;
        let token_out_price = get_token_price(&ctx.accounts.oracle, &token_out_mint)?;

        msg!(
            "Token In Price: {}, Token Out Price: {}",
            token_in_price,
            token_out_price
        );

        let token_in_decimals = ctx.accounts.token_in_mint.decimals;
        let token_out_decimals = ctx.accounts.token_out_mint.decimals;

        let token_out_amount = calculate_output_amount(
            token_in_amount,
            token_in_price,
            token_out_price,
            token_in_decimals,
            token_out_decimals,
        )?;

        msg!("Output amount before fee: {}", token_out_amount);

        let platform_fee = (token_out_amount * PLATFORM_FEE_BPS) / BPS_DENOMINATOR;
        let token_out_amount_after_fee = token_out_amount
            .checked_sub(platform_fee)
            .ok_or(SwapperError::CalculationError)?;

        msg!(
            "Platform fee: {}, Output after fee: {}",
            platform_fee,
            token_out_amount_after_fee
        );

        transfer_token_in(
            &ctx.accounts.user_token_in,
            &ctx.accounts.vault_token_in,
            &ctx.accounts.user,
            &ctx.accounts.token_in_mint,
            &ctx.accounts.token_program,
            token_in_amount,
            token_in_decimals,
        )?;

        msg!("Transferred {} of token_in to vault", token_in_amount);

        mint_token_out(
            &ctx.accounts.token_out_mint,
            &ctx.accounts.user_token_out,
            &ctx.accounts.mint_authority,
            &ctx.accounts.token_program,
            token_out_amount_after_fee,
            ctx.bumps.mint_authority,
        )?;

        msg!("Minted {} of token_out to user", token_out_amount_after_fee);

        emit!(MintEvent {
            user: ctx.accounts.user.key(),
            token_in: token_in_mint,
            token_in_amount,
            token_out: token_out_mint,
            token_out_amount: token_out_amount_after_fee,
            platform_fee,
            token_in_price,
            token_out_price,
        });

        Ok(())
    }
}

fn read_u64_at(data: &[u8], offset: usize) -> Result<u64> {
    if data.len() < offset + 8 {
        return Err(SwapperError::OracleFetchFailed.into());
    }
    Ok(u64::from_le_bytes(
        data[offset..offset + 8]
            .try_into()
            .map_err(|_| SwapperError::OracleFetchFailed)?,
    ))
}

fn get_token_price(oracle: &UncheckedAccount, token_mint: &Pubkey) -> Result<u64> {
    let expected_program: Pubkey = "9kWEcYpPbrB9C5yo9AKmS5HKHxqcwn4NzqhbJCsAh2bT"
        .parse()
        .map_err(|_| SwapperError::OracleFetchFailed)?;
    require!(
        *oracle.owner == expected_program,
        SwapperError::OracleFetchFailed
    );

    let data = oracle.try_borrow_data()?;
    let token_mint_str = token_mint.to_string();

    let price = if token_mint_str == BIT_SOL_MINT {
        read_u64_at(&data, BIT10SOL_PRICE_OFFSET)?
    } else if token_mint_str == SOL_MINT {
        read_u64_at(&data, SOL_PRICE_OFFSET)?
    } else if token_mint_str == USDC_MINT {
        read_u64_at(&data, USDC_PRICE_OFFSET)?
    } else {
        return Err(SwapperError::UnsupportedToken.into());
    };

    require!(price > 0, SwapperError::InvalidPrice);
    Ok(price)
}

fn calculate_output_amount(
    token_in_amount: u64,
    token_in_price: u64,
    token_out_price: u64,
    token_in_decimals: u8,
    token_out_decimals: u8,
) -> Result<u64> {
    require!(token_out_price > 0, SwapperError::InvalidPrice);

    let token_in_amount = token_in_amount as u128;
    let token_in_price = token_in_price as u128;
    let token_out_price = token_out_price as u128;

    let normalized_in: u128 = if token_in_decimals >= 9 {
        token_in_amount
            .checked_div(10u128.pow((token_in_decimals - 9) as u32))
            .ok_or(SwapperError::CalculationError)?
    } else {
        token_in_amount
            .checked_mul(10u128.pow((9 - token_in_decimals) as u32))
            .ok_or(SwapperError::CalculationError)?
    };

    let value_usd = normalized_in
        .checked_mul(token_in_price)
        .ok_or(SwapperError::CalculationError)?
        .checked_div(1_000_000_000u128)
        .ok_or(SwapperError::CalculationError)?;

    let out_at_9_decimals = value_usd
        .checked_mul(1_000_000_000u128)
        .ok_or(SwapperError::CalculationError)?
        .checked_div(token_out_price)
        .ok_or(SwapperError::CalculationError)?;

    let token_out_amount: u64 = if token_out_decimals >= 9 {
        out_at_9_decimals
            .checked_mul(10u128.pow((token_out_decimals - 9) as u32))
            .ok_or(SwapperError::CalculationError)?
    } else {
        out_at_9_decimals
            .checked_div(10u128.pow((9 - token_out_decimals) as u32))
            .ok_or(SwapperError::CalculationError)?
    }
    .try_into()
    .map_err(|_| SwapperError::CalculationError)?;

    Ok(token_out_amount)
}

fn transfer_token_in<'info>(
    user_token_in: &InterfaceAccount<'info, TokenAccount>,
    vault_token_in: &InterfaceAccount<'info, TokenAccount>,
    user: &Signer<'info>,
    token_in_mint: &InterfaceAccount<'info, Mint>,
    token_program: &Interface<'info, TokenInterface>,
    amount: u64,
    decimals: u8,
) -> Result<()> {
    let cpi_accounts = anchor_spl::token_interface::TransferChecked {
        from: user_token_in.to_account_info(),
        mint: token_in_mint.to_account_info(),
        to: vault_token_in.to_account_info(),
        authority: user.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(token_program.to_account_info(), cpi_accounts);
    anchor_spl::token_interface::transfer_checked(cpi_ctx, amount, decimals)?;
    Ok(())
}

fn mint_token_out<'info>(
    token_out_mint: &InterfaceAccount<'info, Mint>,
    user_token_out: &InterfaceAccount<'info, TokenAccount>,
    mint_authority: &UncheckedAccount<'info>,
    token_program: &Interface<'info, TokenInterface>,
    amount: u64,
    bump: u8,
) -> Result<()> {
    let seeds: &[&[u8]] = &[b"mint-authority", &[bump]];
    let signer_seeds = &[seeds];

    let cpi_accounts = token_2022::MintTo {
        mint: token_out_mint.to_account_info(),
        to: user_token_out.to_account_info(),
        authority: mint_authority.to_account_info(),
    };
    let cpi_ctx = CpiContext::new_with_signer(
        token_program.to_account_info(),
        cpi_accounts,
        signer_seeds,
    );
    token_2022::mint_to(cpi_ctx, amount)?;
    Ok(())
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        init,
        payer = admin,
        space = ProgramState::LEN,
        seeds = [b"program-state"],
        bump
    )]
    pub state: Account<'info, ProgramState>,

    #[account(mut)]
    pub token_out_mint: InterfaceAccount<'info, Mint>,

    #[account(
        seeds = [b"mint-authority"],
        bump
    )]
    pub mint_authority: UncheckedAccount<'info>,

    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct MintAccounts<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut)]
    pub user_token_in: InterfaceAccount<'info, TokenAccount>,

    #[account(mut)]
    pub vault_token_in: InterfaceAccount<'info, TokenAccount>,

    #[account(mut)]
    pub user_token_out: InterfaceAccount<'info, TokenAccount>,

    pub token_in_mint: InterfaceAccount<'info, Mint>,

    #[account(mut)]
    pub token_out_mint: InterfaceAccount<'info, Mint>,

    #[account(
        seeds = [b"program-state"],
        bump
    )]
    pub state: Account<'info, ProgramState>,

    #[account(
        seeds = [b"mint-authority"],
        bump
    )]
    pub mint_authority: UncheckedAccount<'info>,

    pub oracle: UncheckedAccount<'info>,

    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[event]
pub struct MintEvent {
    pub user: Pubkey,
    pub token_in: Pubkey,
    pub token_in_amount: u64,
    pub token_out: Pubkey,
    pub token_out_amount: u64,
    pub platform_fee: u64,
    pub token_in_price: u64,
    pub token_out_price: u64,
}

#[error_code]
pub enum SwapperError {
    #[msg("Invalid token in")]
    InvalidTokenIn,
    #[msg("Invalid token out")]
    InvalidTokenOut,
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Invalid price from oracle")]
    InvalidPrice,
    #[msg("Oracle fetch failed")]
    OracleFetchFailed,
    #[msg("Unsupported token")]
    UnsupportedToken,
    #[msg("Calculation error")]
    CalculationError,
    #[msg("Program not initialized")]
    NotInitialized,
    #[msg("Invalid mint authority — program may not be initialized")]
    InvalidMintAuthority,
}
