use anchor_lang::prelude::*;
use switchboard_on_demand::on_demand::structs::PullFeedAccountData;

declare_id!("z6vynwMFikRzZGxyveT4twB95KPTjBr5WLr7tZLzNcZ");

#[program]
pub mod smart_contract {
    use super::*;

    pub fn get_token_price(ctx: Context<GetTokenPrice>) -> Result<()> {
        let feed = &ctx.accounts.feed.data();
        let feed_data = PullFeedAccountData::parse_unchecked(feed).map_err(|_| error!(ErrorCode::InvalidFeed))?;
        let price = feed_data.get_result()?;
        msg!("Token price: {}", price);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct GetTokenPrice<'info> {
    #[account()]
    pub feed: AccountInfo<'info>,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid Switchboard feed")]
    InvalidFeed,
}
