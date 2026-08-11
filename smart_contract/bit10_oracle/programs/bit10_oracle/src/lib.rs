use anchor_lang::prelude::*;
use anchor_lang::solana_program::system_instruction;
use anchor_lang::solana_program::program::invoke;
use anchor_lang::solana_program::program::invoke_signed;

declare_id!("AFAEYYsCPmwLsd97XWVJxbWnB7tHFqQ41hUZGK2fKWZX");

const AUTHORIZED_UPDATER: Pubkey = pubkey!("keyMikmFKNDSu1ykZXWFRDhTdMEasfcmFjHSD4pSh9y");

pub const MAX_INDEX_TOKENS: usize = 10;
pub const MAX_ID_LEN: usize = 32;
pub const MAX_SYMBOL_LEN: usize = 10;
pub const MAX_NAME_LEN: usize = 32;
pub const MAX_CHUNK_SIZE: usize = 5;
pub const MAX_REBALANCE_LIST_SIZE: usize = 10;

const ORACLE_STATE_DISCRIMINATOR: [u8; 8] = [97, 156, 157, 189, 194, 73, 8, 15];

const MAX_FUTURE_DRIFT_SECS: i64 = 10;
const MAX_STALENESS_SECS: i64 = 60;

pub const MAX_PRICE_SKEW_SECS: i64 = 30;

const MIN_PRICE: u64 = 1;
const MAX_PRICE: u64 = 100_000_000_000_000;

const MAX_DEVIATION_BPS: u64 = 500;

const PROPOSAL_TTL_SECS: i64 = 7 * 24 * 60 * 60;
const MIN_ROTATION_DELAY_SECS: i64 = 60 * 60;

const OFF_AUTHORITY:                   usize = 8;
const OFF_BIT10SOL_TIMESTAMP:          usize = 40;
const OFF_BIT10SOL_PRICE:              usize = 48;
const OFF_BIT10SOL_TOKEN_COUNT:        usize = 56;
const OFF_BIT10SOL_TOKENS:             usize = 57;
const OFF_SOL_TIMESTAMP:               usize = 1277;
const OFF_SOL_PRICE:                   usize = 1285;
const OFF_SOL_MARKET_CAP:              usize = 1293;
const OFF_USDC_TIMESTAMP:              usize = 1301;
const OFF_USDC_PRICE:                  usize = 1309;
const OFF_USDC_MARKET_CAP:             usize = 1317;
const OFF_UTILITY_TIMESTAMP:           usize = 1325;
const OFF_UTILITY_PRICE:               usize = 1333;
const OFF_UTILITY_MARKET_CAP:          usize = 1341;
const OFF_REBALANCE_TIMESTAMP:         usize = 1349;
const OFF_REBALANCE_INDEX_VALUE:       usize = 1357;
const OFF_REBALANCE_PRICE_TO_BUY:      usize = 1365;
const OFF_REBALANCE_NEW_TOKEN_COUNT:   usize = 1373;
const OFF_REBALANCE_ADDED_COUNT:       usize = 1374;
const OFF_REBALANCE_REMOVED_COUNT:     usize = 1375;
const OFF_REBALANCE_RETAINED_COUNT:    usize = 1376;
const OFF_REBALANCE_NEW_TOKENS:        usize = 1377;
const OFF_REBALANCE_ADDED:             usize = 2357;
const OFF_REBALANCE_REMOVED:           usize = 3337;
const OFF_REBALANCE_RETAINED:          usize = 4317;
const OFF_PENDING_AUTHORITY_FLAG:      usize = 5297;
const OFF_PENDING_AUTHORITY:           usize = 5298;
const OFF_PENDING_AUTHORITY_EXPIRY:    usize = 5330;
const OFF_AUTHORITY_PROPOSED_AT:       usize = 5338;
const OFF_PAUSED:                      usize = 5346;
const OFF_PENDING_CLOSE_FLAG:          usize = 5347;
const OFF_PENDING_CLOSE_AT:            usize = 5348;

const _: () = assert!(
    OFF_REBALANCE_RETAINED + (MAX_REBALANCE_LIST_SIZE * REBALANCE_TOKEN_DATA_LEN)
        == OFF_PENDING_AUTHORITY_FLAG
);

const TOKEN_DATA_LEN: usize = 122;
const REBALANCE_TOKEN_DATA_LEN: usize = 98;

fn write_u8(data: &mut [u8], offset: usize, val: u8) {
    data[offset] = val;
}

fn write_i64(data: &mut [u8], offset: usize, val: i64) {
    data[offset..offset + 8].copy_from_slice(&val.to_le_bytes());
}

fn write_u64(data: &mut [u8], offset: usize, val: u64) {
    data[offset..offset + 8].copy_from_slice(&val.to_le_bytes());
}

fn read_u8(data: &[u8], offset: usize) -> u8 {
    data[offset]
}

fn check_discriminator(data: &[u8]) -> Result<()> {
    require!(
        data.len() >= 8 && data[0..8] == ORACLE_STATE_DISCRIMINATOR,
        OracleError::BadDiscriminator
    );
    require!(data.len() >= OracleState::LEN, OracleError::AccountNotMigrated);
    Ok(())
}

fn check_discriminator_min(data: &[u8]) -> Result<()> {
    require!(
        data.len() >= 8 && data[0..8] == ORACLE_STATE_DISCRIMINATOR,
        OracleError::BadDiscriminator
    );
    Ok(())
}

fn validate_timestamp(data: &[u8], offset: usize, new_ts: i64) -> Result<()> {
    let now = Clock::get()?.unix_timestamp;
    require!(new_ts <= now.saturating_add(MAX_FUTURE_DRIFT_SECS), OracleError::TimestampInFuture);
    require!(new_ts >= now.saturating_sub(MAX_STALENESS_SECS), OracleError::TimestampTooStale);

    let prev = i64::from_le_bytes(data[offset..offset + 8].try_into().unwrap());
    require!(prev == 0 || new_ts > prev, OracleError::TimestampNotMonotonic);
    Ok(())
}

fn require_fresh_header_timestamp(data: &[u8], offset: usize) -> Result<()> {
    let stored = i64::from_le_bytes(data[offset..offset + 8].try_into().unwrap());
    require!(stored != 0, OracleError::HeaderNotSet);

    let now = Clock::get()?.unix_timestamp;
    require!(stored <= now.saturating_add(MAX_FUTURE_DRIFT_SECS), OracleError::TimestampInFuture);
    require!(now.saturating_sub(stored) <= MAX_STALENESS_SECS, OracleError::TimestampTooStale);
    Ok(())
}

fn require_price_sane(new_price: u64, prev_price: u64) -> Result<()> {
    require!(new_price >= MIN_PRICE, OracleError::PriceOutOfBounds);
    require!(new_price <= MAX_PRICE, OracleError::PriceOutOfBounds);

    if prev_price != 0 {
        let diff = new_price.abs_diff(prev_price) as u128;
        let bps = diff
            .checked_mul(10_000)
            .and_then(|v| v.checked_div(prev_price as u128))
            .ok_or(OracleError::MathOverflow)?;
        require!(bps <= MAX_DEVIATION_BPS as u128, OracleError::PriceDeviationTooLarge);
    }
    Ok(())
}

fn require_not_paused(data: &[u8]) -> Result<()> {
    require!(read_u8(data, OFF_PAUSED) == 0, OracleError::OraclePaused);
    Ok(())
}

fn clear_slots_from(data: &mut [u8], array_base: usize, elem_len: usize, from: usize, capacity: usize) {
    if from >= capacity {
        return;
    }
    let start = array_base + from * elem_len;
    let end = array_base + capacity * elem_len;
    data[start..end].fill(0);
}

fn write_token_data(data: &mut [u8], array_base: usize, slot: usize, token: &TokenData) {
    let base = array_base + slot * TOKEN_DATA_LEN;
    data[base..base + 32].copy_from_slice(&token.id);
    data[base + 32..base + 42].copy_from_slice(&token.symbol);
    data[base + 42..base + 74].copy_from_slice(&token.name);
    data[base + 74..base + 82].copy_from_slice(&token.price.to_le_bytes());
    data[base + 82..base + 90].copy_from_slice(&token.market_cap.to_le_bytes());
    data[base + 90..base + 122].copy_from_slice(&token.token_address);
}

fn write_rebalance_token(data: &mut [u8], array_base: usize, slot: usize, token: &RebalanceTokenData) {
    let base = array_base + slot * REBALANCE_TOKEN_DATA_LEN;
    data[base..base + 32].copy_from_slice(&token.id);
    data[base + 32..base + 42].copy_from_slice(&token.symbol);
    data[base + 42..base + 74].copy_from_slice(&token.name);
    data[base + 74..base + 82].copy_from_slice(&token.price.to_le_bytes());
    data[base + 82..base + 90].copy_from_slice(&token.market_cap.to_le_bytes());
    data[base + 90..base + 98].copy_from_slice(&token.no_of_tokens.to_le_bytes());
}

#[program]
pub mod bit10_oracle {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        verify_updater(&ctx.accounts.authority.key())?;

        let oracle_info    = ctx.accounts.oracle.to_account_info();
        let authority_info = ctx.accounts.authority.to_account_info();
        let system_program = ctx.accounts.system_program.to_account_info();

        require!(oracle_info.data_len() == 0, OracleError::AlreadyInitialized);
        require!(
            oracle_info.owner == &anchor_lang::solana_program::system_program::ID,
            OracleError::AlreadyInitialized
        );

        let space = OracleState::LEN;
        let rent  = Rent::get()?.minimum_balance(space);
        let bump  = ctx.bumps.oracle;
        let seeds: &[&[u8]] = &[b"bit10-oracle", &[bump]];

        let current_lamports = oracle_info.lamports();
        if current_lamports == 0 {
            invoke_signed(
                &system_instruction::create_account(
                    authority_info.key,
                    oracle_info.key,
                    rent,
                    space as u64,
                    ctx.program_id,
                ),
                &[authority_info.clone(), oracle_info.clone(), system_program],
                &[seeds],
            )?;
        } else {
            let top_up = rent.saturating_sub(current_lamports);
            if top_up > 0 {
                invoke(
                    &system_instruction::transfer(authority_info.key, oracle_info.key, top_up),
                    &[authority_info.clone(), oracle_info.clone(), system_program.clone()],
                )?;
            }
            invoke_signed(
                &system_instruction::allocate(oracle_info.key, space as u64),
                &[oracle_info.clone(), system_program.clone()],
                &[seeds],
            )?;
            invoke_signed(
                &system_instruction::assign(oracle_info.key, ctx.program_id),
                &[oracle_info.clone(), system_program.clone()],
                &[seeds],
            )?;
        }

        let mut data = oracle_info.try_borrow_mut_data()?;
        data[0..8].copy_from_slice(&ORACLE_STATE_DISCRIMINATOR);
        data[OFF_AUTHORITY..OFF_AUTHORITY + 32].copy_from_slice(authority_info.key.as_ref());

        msg!("BIT10 Oracle initialized! space={}", space);
        Ok(())
    }

    pub fn migrate(ctx: Context<Migrate>) -> Result<()> {
        let oracle_info    = ctx.accounts.oracle.to_account_info();
        let authority_info = ctx.accounts.authority.to_account_info();
        let system_program = ctx.accounts.system_program.to_account_info();

        {
            let data = oracle_info.try_borrow_data()?;
            check_discriminator_min(&data)?;
            verify_authority(&data, &authority_info.key())?;
        }

        let current_len = oracle_info.data_len();
        require!(current_len < OracleState::LEN, OracleError::AlreadyMigrated);

        let new_min_balance = Rent::get()?.minimum_balance(OracleState::LEN);
        let current_lamports = oracle_info.lamports();
        if new_min_balance > current_lamports {
            let top_up = new_min_balance - current_lamports;
            invoke(
                &system_instruction::transfer(authority_info.key, oracle_info.key, top_up),
                &[authority_info.clone(), oracle_info.clone(), system_program],
            )?;
        }

        oracle_info.realloc(OracleState::LEN, true)?;

        msg!("Oracle migrated: {} -> {} bytes", current_len, OracleState::LEN);
        Ok(())
    }

    pub fn propose_close(ctx: Context<UpdateAuthority>) -> Result<()> {
        let oracle_info = ctx.accounts.oracle.to_account_info();
        let mut data = oracle_info.try_borrow_mut_data()?;
        check_discriminator(&data)?;
        verify_authority(&data, &ctx.accounts.authority.key())?;

        let now = Clock::get()?.unix_timestamp;
        write_u8(&mut data, OFF_PENDING_CLOSE_FLAG, 1);
        write_i64(&mut data, OFF_PENDING_CLOSE_AT, now);

        emit!(CloseProposed { authority: ctx.accounts.authority.key(), earliest_execute_at: now + MIN_ROTATION_DELAY_SECS });
        msg!("Oracle close proposed; executable after {}s", MIN_ROTATION_DELAY_SECS);
        Ok(())
    }

    pub fn force_close(ctx: Context<ForceClose>) -> Result<()> {
        let oracle_info    = ctx.accounts.oracle.to_account_info();
        let authority_info = ctx.accounts.authority.to_account_info();

        {
            let data = oracle_info.try_borrow_data()?;
            check_discriminator(&data)?;
            verify_authority(&data, &authority_info.key())?;

            require!(read_u8(&data, OFF_PENDING_CLOSE_FLAG) == 1, OracleError::NoPendingClose);
            let proposed_at = i64::from_le_bytes(
                data[OFF_PENDING_CLOSE_AT..OFF_PENDING_CLOSE_AT + 8].try_into().unwrap(),
            );
            let now = Clock::get()?.unix_timestamp;
            require!(
                now.saturating_sub(proposed_at) >= MIN_ROTATION_DELAY_SECS,
                OracleError::TimelockNotElapsed
            );
        }

        let lamports = oracle_info.lamports();
        **oracle_info.try_borrow_mut_lamports()? -= lamports;
        **authority_info.try_borrow_mut_lamports()? += lamports;

        oracle_info.assign(&anchor_lang::solana_program::system_program::ID);
        oracle_info.realloc(0, false)?;

        emit!(OracleForceClosed { authority: authority_info.key(), lamports });
        msg!("Oracle force closed, {} lamports returned", lamports);
        Ok(())
    }

    pub fn propose_authority(ctx: Context<UpdateAuthority>, new_authority: Pubkey) -> Result<()> {
        require!(new_authority != Pubkey::default(), OracleError::InvalidAuthority);

        let oracle_info = ctx.accounts.oracle.to_account_info();
        let mut data = oracle_info.try_borrow_mut_data()?;
        check_discriminator(&data)?;
        verify_authority(&data, &ctx.accounts.authority.key())?;

        let now = Clock::get()?.unix_timestamp;
        write_u8(&mut data, OFF_PENDING_AUTHORITY_FLAG, 1);
        data[OFF_PENDING_AUTHORITY..OFF_PENDING_AUTHORITY + 32].copy_from_slice(new_authority.as_ref());
        write_i64(&mut data, OFF_PENDING_AUTHORITY_EXPIRY, now.saturating_add(PROPOSAL_TTL_SECS));
        write_i64(&mut data, OFF_AUTHORITY_PROPOSED_AT, now);

        emit!(AuthorityProposed { proposer: ctx.accounts.authority.key(), new_authority });
        msg!("Oracle authority rotation proposed: {}", new_authority);
        Ok(())
    }

    pub fn revoke_authority_proposal(ctx: Context<UpdateAuthority>) -> Result<()> {
        let oracle_info = ctx.accounts.oracle.to_account_info();
        let mut data = oracle_info.try_borrow_mut_data()?;
        check_discriminator(&data)?;
        verify_authority(&data, &ctx.accounts.authority.key())?;

        require!(read_u8(&data, OFF_PENDING_AUTHORITY_FLAG) == 1, OracleError::NoPendingAuthority);

        write_u8(&mut data, OFF_PENDING_AUTHORITY_FLAG, 0);
        data[OFF_PENDING_AUTHORITY..OFF_PENDING_AUTHORITY + 32].fill(0);
        write_i64(&mut data, OFF_PENDING_AUTHORITY_EXPIRY, 0);
        write_i64(&mut data, OFF_AUTHORITY_PROPOSED_AT, 0);

        msg!("Oracle authority rotation proposal revoked");
        Ok(())
    }

    pub fn accept_authority(ctx: Context<AcceptAuthority>) -> Result<()> {
        let oracle_info = ctx.accounts.oracle.to_account_info();
        let mut data = oracle_info.try_borrow_mut_data()?;
        check_discriminator(&data)?;

        require!(
            read_u8(&data, OFF_PENDING_AUTHORITY_FLAG) == 1,
            OracleError::NoPendingAuthority
        );
        require!(
            &data[OFF_PENDING_AUTHORITY..OFF_PENDING_AUTHORITY + 32]
                == ctx.accounts.new_authority.key().as_ref(),
            OracleError::Unauthorized
        );

        let now = Clock::get()?.unix_timestamp;
        let expiry = i64::from_le_bytes(
            data[OFF_PENDING_AUTHORITY_EXPIRY..OFF_PENDING_AUTHORITY_EXPIRY + 8].try_into().unwrap(),
        );
        require!(now <= expiry, OracleError::ProposalExpired);

        let proposed_at = i64::from_le_bytes(
            data[OFF_AUTHORITY_PROPOSED_AT..OFF_AUTHORITY_PROPOSED_AT + 8].try_into().unwrap(),
        );
        require!(
            now.saturating_sub(proposed_at) >= MIN_ROTATION_DELAY_SECS,
            OracleError::TimelockNotElapsed
        );

        let new_authority_bytes: [u8; 32] =
            data[OFF_PENDING_AUTHORITY..OFF_PENDING_AUTHORITY + 32].try_into().unwrap();
        data[OFF_AUTHORITY..OFF_AUTHORITY + 32].copy_from_slice(&new_authority_bytes);

        write_u8(&mut data, OFF_PENDING_AUTHORITY_FLAG, 0);
        data[OFF_PENDING_AUTHORITY..OFF_PENDING_AUTHORITY + 32].fill(0);
        write_i64(&mut data, OFF_PENDING_AUTHORITY_EXPIRY, 0);
        write_i64(&mut data, OFF_AUTHORITY_PROPOSED_AT, 0);

        emit!(AuthorityAccepted { new_authority: ctx.accounts.new_authority.key() });
        msg!("Oracle authority rotated to {}", ctx.accounts.new_authority.key());
        Ok(())
    }

    pub fn pause(ctx: Context<UpdateAuthority>) -> Result<()> {
        let oracle_info = ctx.accounts.oracle.to_account_info();
        let mut data = oracle_info.try_borrow_mut_data()?;
        check_discriminator(&data)?;
        verify_authority(&data, &ctx.accounts.authority.key())?;

        write_u8(&mut data, OFF_PAUSED, 1);
        emit!(OraclePausedEvent { authority: ctx.accounts.authority.key() });
        msg!("Oracle paused");
        Ok(())
    }

    pub fn unpause(ctx: Context<UpdateAuthority>) -> Result<()> {
        let oracle_info = ctx.accounts.oracle.to_account_info();
        let mut data = oracle_info.try_borrow_mut_data()?;
        check_discriminator(&data)?;
        verify_authority(&data, &ctx.accounts.authority.key())?;

        write_u8(&mut data, OFF_PAUSED, 0);
        emit!(OracleUnpaused { authority: ctx.accounts.authority.key() });
        msg!("Oracle unpaused");
        Ok(())
    }

    pub fn update_bit10sol_header(
        ctx: Context<UpdateOracle>,
        timestamp: i64,
        index_price: u64,
        token_count: u8,
    ) -> Result<()> {
        require!((token_count as usize) <= MAX_INDEX_TOKENS, OracleError::TooManyTokens);

        let oracle_info = ctx.accounts.oracle.to_account_info();
        let mut data = oracle_info.try_borrow_mut_data()?;
        check_discriminator(&data)?;
        verify_authority(&data, &ctx.accounts.updater.key())?;
        require_not_paused(&data)?;
        validate_timestamp(&data, OFF_BIT10SOL_TIMESTAMP, timestamp)?;
        let prev_price = u64::from_le_bytes(data[OFF_BIT10SOL_PRICE..OFF_BIT10SOL_PRICE + 8].try_into().unwrap());
        require_price_sane(index_price, prev_price)?;

        write_i64(&mut data, OFF_BIT10SOL_TIMESTAMP, timestamp);
        write_u64(&mut data, OFF_BIT10SOL_PRICE, index_price);
        write_u8(&mut data, OFF_BIT10SOL_TOKEN_COUNT, token_count);
        clear_slots_from(&mut data, OFF_BIT10SOL_TOKENS, TOKEN_DATA_LEN, token_count as usize, MAX_INDEX_TOKENS);

        msg!("BIT10.SOL header: price={}, count={}, ts={}", index_price, token_count, timestamp);
        Ok(())
    }

    pub fn update_bit10sol_chunk(
        ctx: Context<UpdateOracle>,
        start_index: u8,
        tokens: Vec<TokenData>,
    ) -> Result<()> {
        require!(!tokens.is_empty(), OracleError::EmptyChunk);
        require!(tokens.len() <= MAX_CHUNK_SIZE, OracleError::ChunkTooLarge);

        let end = (start_index as usize)
            .checked_add(tokens.len())
            .ok_or(OracleError::IndexOutOfRange)?;
        require!(end <= MAX_INDEX_TOKENS, OracleError::IndexOutOfRange);

        let oracle_info = ctx.accounts.oracle.to_account_info();
        let mut data = oracle_info.try_borrow_mut_data()?;
        check_discriminator(&data)?;
        verify_authority(&data, &ctx.accounts.updater.key())?;
        require_not_paused(&data)?;
        require_fresh_header_timestamp(&data, OFF_BIT10SOL_TIMESTAMP)?;

        let declared_count = read_u8(&data, OFF_BIT10SOL_TOKEN_COUNT) as usize;
        require!(end <= declared_count, OracleError::IndexOutOfRange);

        for (i, token) in tokens.iter().enumerate() {
            require!(token.token_address != [0u8; 32], OracleError::InvalidTokenAddress);
            let slot = (start_index as usize) + i;
            write_token_data(&mut data, OFF_BIT10SOL_TOKENS, slot, token);
            msg!("Stored token slot {}: price={}", slot, token.price);
        }

        msg!("BIT10.SOL chunk: start={}, len={}", start_index, tokens.len());
        Ok(())
    }

    pub fn update_sol(
        ctx: Context<UpdateOracle>,
        timestamp: i64,
        price: u64,
        market_cap: u64,
    ) -> Result<()> {
        let oracle_info = ctx.accounts.oracle.to_account_info();
        let mut data = oracle_info.try_borrow_mut_data()?;
        check_discriminator(&data)?;
        verify_authority(&data, &ctx.accounts.updater.key())?;
        require_not_paused(&data)?;
        validate_timestamp(&data, OFF_SOL_TIMESTAMP, timestamp)?;
        let prev_price = u64::from_le_bytes(data[OFF_SOL_PRICE..OFF_SOL_PRICE + 8].try_into().unwrap());
        require_price_sane(price, prev_price)?;

        write_i64(&mut data, OFF_SOL_TIMESTAMP, timestamp);
        write_u64(&mut data, OFF_SOL_PRICE, price);
        write_u64(&mut data, OFF_SOL_MARKET_CAP, market_cap);

        msg!("SOL updated: price={}, ts={}", price, timestamp);
        Ok(())
    }

    pub fn update_usdc(
        ctx: Context<UpdateOracle>,
        timestamp: i64,
        price: u64,
        market_cap: u64,
    ) -> Result<()> {
        let oracle_info = ctx.accounts.oracle.to_account_info();
        let mut data = oracle_info.try_borrow_mut_data()?;
        check_discriminator(&data)?;
        verify_authority(&data, &ctx.accounts.updater.key())?;
        require_not_paused(&data)?;
        validate_timestamp(&data, OFF_USDC_TIMESTAMP, timestamp)?;
        let prev_price = u64::from_le_bytes(data[OFF_USDC_PRICE..OFF_USDC_PRICE + 8].try_into().unwrap());
        require_price_sane(price, prev_price)?;

        write_i64(&mut data, OFF_USDC_TIMESTAMP, timestamp);
        write_u64(&mut data, OFF_USDC_PRICE, price);
        write_u64(&mut data, OFF_USDC_MARKET_CAP, market_cap);

        msg!("USDC updated: price={}, ts={}", price, timestamp);
        Ok(())
    }

    pub fn update_bit10_utility(
        ctx: Context<UpdateOracle>,
        timestamp: i64,
        price: u64,
        market_cap: u64,
    ) -> Result<()> {
        let oracle_info = ctx.accounts.oracle.to_account_info();
        let mut data = oracle_info.try_borrow_mut_data()?;
        check_discriminator(&data)?;
        verify_authority(&data, &ctx.accounts.updater.key())?;
        require_not_paused(&data)?;
        validate_timestamp(&data, OFF_UTILITY_TIMESTAMP, timestamp)?;
        let prev_price = u64::from_le_bytes(data[OFF_UTILITY_PRICE..OFF_UTILITY_PRICE + 8].try_into().unwrap());
        require_price_sane(price, prev_price)?;

        write_i64(&mut data, OFF_UTILITY_TIMESTAMP, timestamp);
        write_u64(&mut data, OFF_UTILITY_PRICE, price);
        write_u64(&mut data, OFF_UTILITY_MARKET_CAP, market_cap);

        msg!("BIT10 Utility updated: price={}, ts={}", price, timestamp);
        Ok(())
    }

    pub fn update_rebalance_header(
        ctx: Context<UpdateOracle>,
        timestamp: i64,
        index_value: u64,
        price_of_token_to_buy: u64,
        new_token_count: u8,
        added_count: u8,
        removed_count: u8,
        retained_count: u8,
    ) -> Result<()> {
        require!((new_token_count as usize) <= MAX_INDEX_TOKENS, OracleError::TooManyTokens);
        require!((added_count    as usize) <= MAX_REBALANCE_LIST_SIZE, OracleError::RebalanceListTooLarge);
        require!((removed_count  as usize) <= MAX_REBALANCE_LIST_SIZE, OracleError::RebalanceListTooLarge);
        require!((retained_count as usize) <= MAX_REBALANCE_LIST_SIZE, OracleError::RebalanceListTooLarge);

        let oracle_info = ctx.accounts.oracle.to_account_info();
        let mut data = oracle_info.try_borrow_mut_data()?;
        check_discriminator(&data)?;
        verify_authority(&data, &ctx.accounts.updater.key())?;
        require_not_paused(&data)?;
        validate_timestamp(&data, OFF_REBALANCE_TIMESTAMP, timestamp)?;
        let prev_price = u64::from_le_bytes(
            data[OFF_REBALANCE_PRICE_TO_BUY..OFF_REBALANCE_PRICE_TO_BUY + 8].try_into().unwrap(),
        );
        require_price_sane(price_of_token_to_buy, prev_price)?;

        write_i64(&mut data, OFF_REBALANCE_TIMESTAMP,      timestamp);
        write_u64(&mut data, OFF_REBALANCE_INDEX_VALUE,    index_value);
        write_u64(&mut data, OFF_REBALANCE_PRICE_TO_BUY,   price_of_token_to_buy);
        write_u8(&mut data,  OFF_REBALANCE_NEW_TOKEN_COUNT, new_token_count);
        write_u8(&mut data,  OFF_REBALANCE_ADDED_COUNT,     added_count);
        write_u8(&mut data,  OFF_REBALANCE_REMOVED_COUNT,   removed_count);
        write_u8(&mut data,  OFF_REBALANCE_RETAINED_COUNT,  retained_count);

        clear_slots_from(&mut data, OFF_REBALANCE_NEW_TOKENS, REBALANCE_TOKEN_DATA_LEN, new_token_count as usize, MAX_INDEX_TOKENS);
        clear_slots_from(&mut data, OFF_REBALANCE_ADDED,      REBALANCE_TOKEN_DATA_LEN, added_count as usize,     MAX_REBALANCE_LIST_SIZE);
        clear_slots_from(&mut data, OFF_REBALANCE_REMOVED,    REBALANCE_TOKEN_DATA_LEN, removed_count as usize,   MAX_REBALANCE_LIST_SIZE);
        clear_slots_from(&mut data, OFF_REBALANCE_RETAINED,   REBALANCE_TOKEN_DATA_LEN, retained_count as usize,  MAX_REBALANCE_LIST_SIZE);

        msg!(
            "Rebalance header: index_value={}, price_to_buy={}, new={}, added={}, removed={}, retained={}, ts={}",
            index_value, price_of_token_to_buy,
            new_token_count, added_count, removed_count, retained_count, timestamp
        );
        Ok(())
    }

    pub fn update_rebalance_new_tokens_chunk(
        ctx: Context<UpdateOracle>,
        start_index: u8,
        tokens: Vec<RebalanceTokenData>,
    ) -> Result<()> {
        require!(!tokens.is_empty(), OracleError::EmptyChunk);
        require!(tokens.len() <= MAX_CHUNK_SIZE, OracleError::ChunkTooLarge);

        let end = (start_index as usize)
            .checked_add(tokens.len())
            .ok_or(OracleError::IndexOutOfRange)?;
        require!(end <= MAX_INDEX_TOKENS, OracleError::IndexOutOfRange);

        let oracle_info = ctx.accounts.oracle.to_account_info();
        let mut data = oracle_info.try_borrow_mut_data()?;
        check_discriminator(&data)?;
        verify_authority(&data, &ctx.accounts.updater.key())?;
        require_not_paused(&data)?;
        require_fresh_header_timestamp(&data, OFF_REBALANCE_TIMESTAMP)?;

        let declared_count = read_u8(&data, OFF_REBALANCE_NEW_TOKEN_COUNT) as usize;
        require!(end <= declared_count, OracleError::IndexOutOfRange);

        for (i, token) in tokens.iter().enumerate() {
            write_rebalance_token(&mut data, OFF_REBALANCE_NEW_TOKENS, (start_index as usize) + i, token);
        }
        msg!("Rebalance new_tokens chunk: start={}, len={}", start_index, tokens.len());
        Ok(())
    }

    pub fn update_rebalance_added_chunk(
        ctx: Context<UpdateOracle>,
        start_index: u8,
        tokens: Vec<RebalanceTokenData>,
    ) -> Result<()> {
        require!(!tokens.is_empty(), OracleError::EmptyChunk);
        require!(tokens.len() <= MAX_CHUNK_SIZE, OracleError::ChunkTooLarge);

        let end = (start_index as usize)
            .checked_add(tokens.len())
            .ok_or(OracleError::IndexOutOfRange)?;
        require!(end <= MAX_REBALANCE_LIST_SIZE, OracleError::IndexOutOfRange);

        let oracle_info = ctx.accounts.oracle.to_account_info();
        let mut data = oracle_info.try_borrow_mut_data()?;
        check_discriminator(&data)?;
        verify_authority(&data, &ctx.accounts.updater.key())?;
        require_not_paused(&data)?;
        require_fresh_header_timestamp(&data, OFF_REBALANCE_TIMESTAMP)?;

        let declared_count = read_u8(&data, OFF_REBALANCE_ADDED_COUNT) as usize;
        require!(end <= declared_count, OracleError::IndexOutOfRange);

        for (i, token) in tokens.iter().enumerate() {
            write_rebalance_token(&mut data, OFF_REBALANCE_ADDED, (start_index as usize) + i, token);
        }
        msg!("Rebalance added chunk: start={}, len={}", start_index, tokens.len());
        Ok(())
    }

    pub fn update_rebalance_removed_chunk(
        ctx: Context<UpdateOracle>,
        start_index: u8,
        tokens: Vec<RebalanceTokenData>,
    ) -> Result<()> {
        require!(!tokens.is_empty(), OracleError::EmptyChunk);
        require!(tokens.len() <= MAX_CHUNK_SIZE, OracleError::ChunkTooLarge);

        let end = (start_index as usize)
            .checked_add(tokens.len())
            .ok_or(OracleError::IndexOutOfRange)?;
        require!(end <= MAX_REBALANCE_LIST_SIZE, OracleError::IndexOutOfRange);

        let oracle_info = ctx.accounts.oracle.to_account_info();
        let mut data = oracle_info.try_borrow_mut_data()?;
        check_discriminator(&data)?;
        verify_authority(&data, &ctx.accounts.updater.key())?;
        require_not_paused(&data)?;
        require_fresh_header_timestamp(&data, OFF_REBALANCE_TIMESTAMP)?;

        let declared_count = read_u8(&data, OFF_REBALANCE_REMOVED_COUNT) as usize;
        require!(end <= declared_count, OracleError::IndexOutOfRange);

        for (i, token) in tokens.iter().enumerate() {
            write_rebalance_token(&mut data, OFF_REBALANCE_REMOVED, (start_index as usize) + i, token);
        }
        msg!("Rebalance removed chunk: start={}, len={}", start_index, tokens.len());
        Ok(())
    }

    pub fn update_rebalance_retained_chunk(
        ctx: Context<UpdateOracle>,
        start_index: u8,
        tokens: Vec<RebalanceTokenData>,
    ) -> Result<()> {
        require!(!tokens.is_empty(), OracleError::EmptyChunk);
        require!(tokens.len() <= MAX_CHUNK_SIZE, OracleError::ChunkTooLarge);

        let end = (start_index as usize)
            .checked_add(tokens.len())
            .ok_or(OracleError::IndexOutOfRange)?;
        require!(end <= MAX_REBALANCE_LIST_SIZE, OracleError::IndexOutOfRange);

        let oracle_info = ctx.accounts.oracle.to_account_info();
        let mut data = oracle_info.try_borrow_mut_data()?;
        check_discriminator(&data)?;
        verify_authority(&data, &ctx.accounts.updater.key())?;
        require_not_paused(&data)?;
        require_fresh_header_timestamp(&data, OFF_REBALANCE_TIMESTAMP)?;

        let declared_count = read_u8(&data, OFF_REBALANCE_RETAINED_COUNT) as usize;
        require!(end <= declared_count, OracleError::IndexOutOfRange);

        for (i, token) in tokens.iter().enumerate() {
            write_rebalance_token(&mut data, OFF_REBALANCE_RETAINED, (start_index as usize) + i, token);
        }
        msg!("Rebalance retained chunk: start={}, len={}", start_index, tokens.len());
        Ok(())
    }
}

fn verify_updater(updater: &Pubkey) -> Result<()> {
    require!(*updater == AUTHORIZED_UPDATER, OracleError::Unauthorized);
    Ok(())
}

fn verify_authority(data: &[u8], signer: &Pubkey) -> Result<()> {
    let stored = &data[OFF_AUTHORITY..OFF_AUTHORITY + 32];
    require!(stored == signer.as_ref(), OracleError::Unauthorized);
    Ok(())
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut, seeds = [b"bit10-oracle"], bump)]
    pub oracle: UncheckedAccount<'info>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Migrate<'info> {
    #[account(mut, seeds = [b"bit10-oracle"], bump, owner = crate::ID @ OracleError::InvalidOwner)]
    pub oracle: UncheckedAccount<'info>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ForceClose<'info> {
    #[account(mut, seeds = [b"bit10-oracle"], bump, owner = crate::ID @ OracleError::InvalidOwner)]
    pub oracle: UncheckedAccount<'info>,

    #[account(mut)]
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct UpdateAuthority<'info> {
    #[account(mut, seeds = [b"bit10-oracle"], bump, owner = crate::ID @ OracleError::InvalidOwner)]
    pub oracle: UncheckedAccount<'info>,

    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct AcceptAuthority<'info> {
    #[account(mut, seeds = [b"bit10-oracle"], bump, owner = crate::ID @ OracleError::InvalidOwner)]
    pub oracle: UncheckedAccount<'info>,

    pub new_authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct UpdateOracle<'info> {
    #[account(mut, seeds = [b"bit10-oracle"], bump, owner = crate::ID @ OracleError::InvalidOwner)]
    pub oracle: UncheckedAccount<'info>,

    #[account(mut)]
    pub updater: Signer<'info>,
}

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

    pub rebalance_timestamp: i64,
    pub rebalance_index_value: u64,
    pub rebalance_price_of_token_to_buy: u64,
    pub rebalance_new_token_count: u8,
    pub rebalance_added_count: u8,
    pub rebalance_removed_count: u8,
    pub rebalance_retained_count: u8,
    pub rebalance_new_tokens: [RebalanceTokenData; MAX_INDEX_TOKENS],
    pub rebalance_added: [RebalanceTokenData; MAX_REBALANCE_LIST_SIZE],
    pub rebalance_removed: [RebalanceTokenData; MAX_REBALANCE_LIST_SIZE],
    pub rebalance_retained: [RebalanceTokenData; MAX_REBALANCE_LIST_SIZE],
}

impl OracleState {
    pub const LEN: usize = 8
        + 32
        + 8 + 8 + 1
        + (MAX_INDEX_TOKENS * TOKEN_DATA_LEN)
        + 8 + 8 + 8
        + 8 + 8 + 8
        + 8 + 8 + 8
        + 8 + 8 + 8 + 1 + 1 + 1 + 1
        + (MAX_INDEX_TOKENS        * REBALANCE_TOKEN_DATA_LEN)
        + (MAX_REBALANCE_LIST_SIZE * REBALANCE_TOKEN_DATA_LEN)
        + (MAX_REBALANCE_LIST_SIZE * REBALANCE_TOKEN_DATA_LEN)
        + (MAX_REBALANCE_LIST_SIZE * REBALANCE_TOKEN_DATA_LEN)
        + 128;
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

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct RebalanceTokenData {
    pub id: [u8; MAX_ID_LEN],
    pub symbol: [u8; MAX_SYMBOL_LEN],
    pub name: [u8; MAX_NAME_LEN],
    pub price: u64,
    pub market_cap: u64,
    pub no_of_tokens: u64,
}

#[event]
pub struct AuthorityProposed {
    pub proposer: Pubkey,
    pub new_authority: Pubkey,
}

#[event]
pub struct AuthorityAccepted {
    pub new_authority: Pubkey,
}

#[event]
pub struct CloseProposed {
    pub authority: Pubkey,
    pub earliest_execute_at: i64,
}

#[event]
pub struct OracleForceClosed {
    pub authority: Pubkey,
    pub lamports: u64,
}

#[event]
pub struct OraclePausedEvent {
    pub authority: Pubkey,
}

#[event]
pub struct OracleUnpaused {
    pub authority: Pubkey,
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
    #[msg("Rebalance list too large: max is 10")]
    RebalanceListTooLarge,
    #[msg("Account discriminator mismatch")]
    BadDiscriminator,
    #[msg("Oracle already initialized")]
    AlreadyInitialized,
    #[msg("Timestamp is too far in the future")]
    TimestampInFuture,
    #[msg("Timestamp is too stale")]
    TimestampTooStale,
    #[msg("Timestamp must not regress behind the previously stored value")]
    TimestampNotMonotonic,
    #[msg("Account is not owned by this program")]
    InvalidOwner,
    #[msg("No pending authority to accept")]
    NoPendingAuthority,
    #[msg("Header timestamp has not been set or validated yet")]
    HeaderNotSet,
    #[msg("Account has not been migrated to the current layout yet; call migrate first")]
    AccountNotMigrated,
    #[msg("Account is already at or above the current layout size")]
    AlreadyMigrated,
    #[msg("Price is outside the allowed sanity bounds")]
    PriceOutOfBounds,
    #[msg("Price moved more than the allowed deviation from its previous value")]
    PriceDeviationTooLarge,
    #[msg("Oracle is paused")]
    OraclePaused,
    #[msg("Authority proposal has expired")]
    ProposalExpired,
    #[msg("Timelock has not elapsed yet")]
    TimelockNotElapsed,
    #[msg("No pending close to execute")]
    NoPendingClose,
    #[msg("Token address must not be the zero pubkey")]
    InvalidTokenAddress,
    #[msg("Arithmetic overflow")]
    MathOverflow,
}