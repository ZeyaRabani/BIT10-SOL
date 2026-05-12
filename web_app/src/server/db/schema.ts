import { pgTable, text, boolean, unique, timestamp, doublePrecision, index, json, bigint, serial, varchar, foreignKey, check, date, numeric, primaryKey, pgEnum } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const aalLevel = pgEnum('aal_level', ['aal1', 'aal2', 'aal3'])
export const action = pgEnum('action', ['INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'ERROR'])
export const codeChallengeMethod = pgEnum('code_challenge_method', ['s256', 'plain'])
export const equalityOp = pgEnum('equality_op', ['eq', 'neq', 'lt', 'lte', 'gt', 'gte', 'in'])
export const factorStatus = pgEnum('factor_status', ['unverified', 'verified'])
export const factorType = pgEnum('factor_type', ['totp', 'webauthn'])
export const keyStatus = pgEnum('key_status', ['default', 'valid', 'invalid', 'expired'])
export const keyType = pgEnum('key_type', ['aead-ietf', 'aead-det', 'hmacsha512', 'hmacsha256', 'auth', 'shorthash', 'generichash', 'kdf', 'secretbox', 'secretstream', 'stream_xchacha20'])
export const oneTimeTokenType = pgEnum('one_time_token_type', ['confirmation_token', 'reauthentication_token', 'recovery_token', 'email_change_token_new', 'email_change_token_current', 'phone_change_token'])

export const referralJune2025Tasks = pgTable('referral_june_2025_tasks', {
	address: text().primaryKey().notNull(),
	questionnaire: boolean().default(false).notNull(),
});

export const referralJune2025 = pgTable('referral_june_2025', {
	referralCode: text('referral_code').notNull(),
	userId: text('user_id').primaryKey().notNull(),
	usedAt: timestamp('used_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	unique('referral_june_2025_referral_code_user_id_key').on(table.referralCode, table.userId),
]);

export const mbTokenMint = pgTable('mb_token_mint', {
	tokenMintId: text('token_mint_id').primaryKey().notNull(),
	userPrincipalId: text('user_principal_id').notNull(),
	mintingAmount: text('minting_amount').notNull(),
	mintingTokenName: text('minting_token_name').notNull(),
	mintingUsdAmount: text('minting_usd_amount').notNull(),
	recievingTokenAmount: text('recieving_token_amount').notNull(),
	recievingTokenName: text('recieving_token_name').notNull(),
	mintingStatus: text('minting_status').notNull(),
	tokenMintAt: timestamp('token_mint_at', { withTimezone: true, mode: 'string' }).notNull(),
	transactionIndex: text('transaction_index').notNull(),
});

export const teLiquidityHub = pgTable('te_liquidity_hub', {
	liquidationId: text('liquidation_id').primaryKey().notNull(),
	tickInAddress: text('tick_in_address').notNull(),
	tickInName: text('tick_in_name').notNull(),
	tickInAmount: doublePrecision('tick_in_amount').notNull(),
	duration: doublePrecision().notNull(),
	liquidationType: text('liquidation_type').notNull(),
	liquidationMode: text('liquidation_mode').notNull(),
	transactionStatus: text('transaction_status').notNull(),
	transactionTimestamp: timestamp('transaction_timestamp', { withTimezone: true, mode: 'string' }).notNull(),
	tickInNetwork: text('tick_in_network').notNull(),
	tickInTxBlock: text('tick_in_tx_block').notNull(),
});

export const bit10Top = pgTable('bit10_top', {
	timestmpz: timestamp({ withTimezone: true, mode: 'string' }).primaryKey().notNull(),
	tokenPrice: doublePrecision('token_price').notNull(),
	data: json().notNull(),
}, (table) => [
	index('bit10_top_timestmpz_idx').using('btree', table.timestmpz.desc().nullsFirst().op('timestamptz_ops')),
]);

export const bit10TopHistoricalData = pgTable('bit10_top_historical_data', {
	timestmpz: timestamp({ withTimezone: true, mode: 'string' }).primaryKey().notNull(),
	tokenPrice: doublePrecision('token_price').notNull(),
	data: json().notNull(),
}, (table) => [
	index('bit10_top_historical_data_timestmpz_idx').using('btree', table.timestmpz.desc().nullsFirst().op('timestamptz_ops')),
]);

export const swap = pgTable('swap', {
	tokenSwapId: text('token_swap_id').primaryKey().notNull(),
	userPrincipalId: text('user_principal_id').notNull(),
	tickInName: text('tick_in_name').notNull(),
	tickInAmount: text('tick_in_amount').notNull(),
	tickInUsdAmount: text('tick_in_usd_amount').notNull(),
	tickInTxBlock: text('tick_in_tx_block').notNull(),
	tickOutName: text('tick_out_name').notNull(),
	tickOutAmount: text('tick_out_amount').notNull(),
	tickOutTxBlock: text('tick_out_tx_block').notNull(),
	transactionType: text('transaction_type').notNull(),
	transactionStatus: text('transaction_status').notNull(),
	transactionTimestamp: timestamp('transaction_timestamp', { withTimezone: true, mode: 'string' }).notNull(),
	network: text().notNull(),
});

export const testBit10TopRebalance = pgTable('test_bit10_top_rebalance', {
	timestmpz: timestamp({ withTimezone: true, mode: 'string' }).primaryKey().notNull(),
	indexValue: doublePrecision('index_value').notNull(),
	priceOfTokenToBuy: doublePrecision('price_of_token_to_buy').notNull(),
	newTokens: json('new_tokens').notNull(),
	added: json().notNull(),
	removed: json().notNull(),
	retained: json().notNull(),
}, (table) => [
	index('test_bit10_top_rebalance_timestmpz_idx').using('btree', table.timestmpz.desc().nullsFirst().op('timestamptz_ops')),
]);

export const referralApr2025 = pgTable('referral_apr_2025', {
	referralCode: text('referral_code').notNull(),
	userId: text('user_id').primaryKey().notNull(),
	usedAt: timestamp('used_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	unique('referral_apr_2025_referral_code_user_id_key').on(table.referralCode, table.userId),
	unique('referral_apr_2025_user_id_key').on(table.userId),
]);

export const referralApr2025Tasks = pgTable('referral_apr_2025_tasks', {
	address: text().primaryKey().notNull(),
	task1: boolean('task_1').default(false).notNull(),
	task2: boolean('task_2').default(false).notNull(),
	task3: boolean('task_3').default(false).notNull(),
}, (table) => [
	unique('referral_apr_2025_tasks_address_key').on(table.address),
]);

export const bit10Meme = pgTable('bit10_meme', {
	timestmpz: timestamp({ withTimezone: true, mode: 'string' }).primaryKey().notNull(),
	tokenPrice: doublePrecision('token_price').notNull(),
	data: json().notNull(),
}, (table) => [
	index('bit10_meme_timestmpz_idx').using('btree', table.timestmpz.desc().nullsFirst().op('timestamptz_ops')),
]);

export const bit10MemeHistoricalData = pgTable('bit10_meme_historical_data', {
	timestmpz: timestamp({ withTimezone: true, mode: 'string' }).primaryKey().notNull(),
	tokenPrice: doublePrecision('token_price').notNull(),
	data: json().notNull(),
}, (table) => [
	index('bit10_meme_historical_data_timestmpz_idx').using('btree', table.timestmpz.desc().nullsFirst().op('timestamptz_ops')),
]);

export const teSwap = pgTable('te_swap', {
	tokenSwapId: text('token_swap_id').primaryKey().notNull(),
	userPrincipalId: text('user_principal_id').notNull(),
	tickInName: text('tick_in_name').notNull(),
	tickInAmount: text('tick_in_amount').notNull(),
	tickInUsdAmount: text('tick_in_usd_amount').notNull(),
	tickInTxBlock: text('tick_in_tx_block').notNull(),
	tickOutName: text('tick_out_name').notNull(),
	tickOutAmount: text('tick_out_amount').notNull(),
	tickOutTxBlock: text('tick_out_tx_block').notNull(),
	transactionType: text('transaction_type').notNull(),
	transactionStatus: text('transaction_status').notNull(),
	transactionTimestamp: timestamp('transaction_timestamp', { withTimezone: true, mode: 'string' }).notNull(),
	network: text().notNull(),
});

export const testBit10MemeRebalance = pgTable('test_bit10_meme_rebalance', {
	timestmpz: timestamp({ withTimezone: true, mode: 'string' }).primaryKey().notNull(),
	indexValue: doublePrecision('index_value').notNull(),
	priceOfTokenToBuy: doublePrecision('price_of_token_to_buy').notNull(),
	newTokens: json('new_tokens').notNull(),
	added: json().notNull(),
	removed: json().notNull(),
	retained: json().notNull(),
}, (table) => [
	index('test_bit10_meme_rebalance_timestmpz_idx').using('btree', table.timestmpz.desc().nullsFirst().op('timestamptz_ops')),
]);

export const waitlistAddress = pgTable('waitlist_address', {
	// You can use { mode: 'bigint' } if numbers are exceeding js number limitations
	waitlistAddressId: bigint('waitlist_address_id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity({ name: 'waitlist_address_waitlist_address_id_seq', startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	address: text().notNull(),
}, (table) => [
	unique('waitlist_address_address_key').on(table.address),
]);

export const bit10Defi = pgTable('bit10_defi', {
	timestmpz: timestamp({ withTimezone: true, mode: 'string' }).primaryKey().notNull(),
	tokenPrice: doublePrecision('token_price').notNull(),
	data: json().notNull(),
}, (table) => [
	index('bit10_defi_timestmpz_idx').using('btree', table.timestmpz.desc().nullsFirst().op('timestamptz_ops')),
]);

export const teUsers = pgTable('te_users', {
	userId: text('user_id').primaryKey().notNull(),
	userPrincipalId: text('user_principal_id').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull(),
}, (table) => [
	unique('te_users_user_id_key').on(table.userId),
	unique('te_users_user_principal_id_key').on(table.userPrincipalId),
]);

export const userSignups = pgTable('user_signups', {
	newsletterSubscribersId: serial('newsletter_subscribers_id').primaryKey().notNull(),
	email: varchar({ length: 255 }).notNull(),
}, (table) => [
	unique('newsletter_subscribers_email_key').on(table.email),
]);

export const teTokenSwap = pgTable('te_token_swap', {
	tokenSwapId: text('token_swap_id').primaryKey().notNull(),
	userPrincipalId: text('user_principal_id').notNull(),
	tokenPurchaseAmount: text('token_purchase_amount').notNull(),
	tokenPurchaseName: text('token_purchase_name').notNull(),
	tokenPurchaseUsdAmount: text('token_purchase_usd_amount').notNull(),
	bit10TokenQuantity: text('bit10_token_quantity').notNull(),
	bit10TokenName: text('bit10_token_name').notNull(),
	tokenTransactionStatus: text('token_transaction_status').notNull(),
	tokenBoughtAt: timestamp('token_bought_at', { withTimezone: true, mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
		columns: [table.userPrincipalId],
		foreignColumns: [teUsers.userPrincipalId],
		name: 'te_token_swap_user_principal_id_te_users_user_principal_id_fk'
	}),
	unique('te_token_swap_token_swap_id_key').on(table.tokenSwapId),
]);

export const teRequestBtc = pgTable('te_request_btc', {
	email: varchar({ length: 255 }).notNull(),
	userPrincipalId: text('user_principal_id').notNull(),
	requestId: serial('request_id').primaryKey().notNull(),
	btcSent: boolean('btc_sent').default(false),
}, (table) => [
	unique('te_request_btc_request_id_key').on(table.requestId),
]);

export const bit10CollateralTokenPrices = pgTable('bit10_collateral_token_prices', {
	bit10TokenName: text('bit10_token_name').primaryKey().notNull(),
	priceOfTokenToBuy: doublePrecision('price_of_token_to_buy').notNull(),
});

export const bit10Brc20Rebalance = pgTable('bit10_brc20_rebalance', {
	timestmpz: timestamp({ withTimezone: true, mode: 'string' }).primaryKey().notNull(),
	indexValue: doublePrecision('index_value').notNull(),
	priceOfTokenToBuy: doublePrecision('price_of_token_to_buy').notNull(),
	newTokens: json('new_tokens').notNull(),
	added: json().notNull(),
	removed: json().notNull(),
	retained: json().notNull(),
}, (table) => [
	index('bit10_brc20_rebalance_timestmpz_idx').using('btree', table.timestmpz.desc().nullsFirst().op('timestamptz_ops')),
]);

export const bit10Brc20HistoricalData = pgTable('bit10_brc20_historical_data', {
	timestmpz: timestamp({ withTimezone: true, mode: 'string' }).primaryKey().notNull(),
	tokenPrice: doublePrecision('token_price').notNull(),
	data: json().notNull(),
}, (table) => [
	index('bit10_brc20_historical_data_timestmpz_idx').using('btree', table.timestmpz.desc().nullsFirst().op('timestamptz_ops')),
]);

export const bit10Brc20 = pgTable('bit10_brc20', {
	timestmpz: timestamp({ withTimezone: true, mode: 'string' }).primaryKey().notNull(),
	tokenPrice: doublePrecision('token_price').notNull(),
	data: json().notNull(),
}, (table) => [
	index('bit10_brc20_timestmpz_idx').using('btree', table.timestmpz.desc().nullsFirst().op('timestamptz_ops')),
]);

export const tokenSwap = pgTable('token_swap', {
	tokenSwapId: text('token_swap_id').primaryKey().notNull(),
	userPaymentAddress: text('user_payment_address').notNull(),
	userOrdinalsAddress: text('user_ordinals_address').notNull(),
	userStacksAddress: text('user_stacks_address').notNull(),
	tokenPurchaseAmount: text('token_purchase_amount').notNull(),
	tokenPurchaseName: text('token_purchase_name').notNull(),
	bit10TokenQuantity: text('bit10_token_quantity').notNull(),
	bit10TokenName: text('bit10_token_name').notNull(),
	tokenTransactionSignature: text('token_transaction_signature').notNull(),
	tokenBoughtAt: timestamp('token_bought_at', { withTimezone: true, mode: 'string' }).notNull(),
	tokenPurchaseUsdAmount: text('token_purchase_usd_amount').notNull(),
}, (table) => [
	foreignKey({
		columns: [table.userOrdinalsAddress],
		foreignColumns: [users.userOrdinalsAddress],
		name: 'token_swap_user_ordinals_address_users_user_ordinals_address_fk'
	}),
	foreignKey({
		columns: [table.userPaymentAddress],
		foreignColumns: [users.userPaymentAddress],
		name: 'token_swap_user_payment_address_users_user_payment_address_fk'
	}),
	foreignKey({
		columns: [table.userStacksAddress],
		foreignColumns: [users.userStacksAddress],
		name: 'token_swap_user_stacks_address_users_user_stacks_address_fk'
	}),
	unique('token_swap_token_swap_id_key').on(table.tokenSwapId),
]);

export const mbPrincipalIdWhitelist = pgTable('mb_principal_id_whitelist', {
	userPrincipalId: text('user_principal_id').primaryKey().notNull(),
});

export const mbUsers = pgTable('mb_users', {
	userId: text('user_id').primaryKey().notNull(),
	userPrincipalId: text('user_principal_id').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull(),
}, (table) => [
	unique('mb_users_user_principal_id_key').on(table.userPrincipalId),
]);

export const mbTokenSwap = pgTable('mb_token_swap', {
	tokenSwapId: text('token_swap_id').primaryKey().notNull(),
	userPrincipalId: text('user_principal_id').notNull(),
	tokenPurchaseAmount: text('token_purchase_amount').notNull(),
	tokenPurchaseName: text('token_purchase_name').notNull(),
	tokenPurchaseUsdAmount: text('token_purchase_usd_amount').notNull(),
	bit10TokenQuantity: text('bit10_token_quantity').notNull(),
	bit10TokenName: text('bit10_token_name').notNull(),
	tokenTransactionStatus: text('token_transaction_status').notNull(),
	tokenBoughtAt: timestamp('token_bought_at', { withTimezone: true, mode: 'string' }).notNull(),
	transactionIndex: text('transaction_index').notNull(),
}, (table) => [
	foreignKey({
		columns: [table.userPrincipalId],
		foreignColumns: [mbUsers.userPrincipalId],
		name: 'mb_token_swap_user_principal_id_mb_users_user_principal_id_fk'
	}),
	unique('mb_token_swap_transaction_index_key').on(table.transactionIndex),
]);

export const dex = pgTable('dex', {
	swapId: text('swap_id').primaryKey().notNull(),
	poolId: text('pool_id').notNull(),
	tickInWalletAddress: text('tick_in_wallet_address').notNull(),
	tickOutWalletAddress: text('tick_out_wallet_address').notNull(),
	swapType: text('swap_type').notNull(),
	sourceChain: text('source_chain').notNull(),
	destinationChain: text('destination_chain').notNull(),
	tokenInAddress: text('token_in_address').notNull(),
	tokenOutAddress: text('token_out_address').notNull(),
	amountIn: text('amount_in').notNull(),
	amountOut: text('amount_out').notNull(),
	slippage: text().notNull(),
	txHashIn: text('tx_hash_in').notNull(),
	txHashOut: text('tx_hash_out').notNull(),
	status: text().notNull(),
	// You can use { mode: 'bigint' } if numbers are exceeding js number limitations
	timestamp: bigint({ mode: 'number' }).notNull(),
}, (table) => [
	index('idx_dex_destination_chain').using('btree', table.destinationChain.asc().nullsLast().op('text_ops')),
	index('idx_dex_source_chain').using('btree', table.sourceChain.asc().nullsLast().op('text_ops')),
	index('idx_dex_timestamp').using('btree', table.timestamp.asc().nullsLast().op('int8_ops')),
	check('check_positive_amounts', sql`((amount_in)::numeric >= (0)::numeric) AND ((amount_out)::numeric >= (0)::numeric)`),
]);

export const bit10SolHistoricalData = pgTable('bit10_sol_historical_data', {
	timestmpz: timestamp({ withTimezone: true, mode: 'string' }).primaryKey().notNull(),
	tokenPrice: doublePrecision('token_price').notNull(),
	data: json().notNull(),
}, (table) => [
	index('bit10_sol_historical_data_timestmpz_idx').using('btree', table.timestmpz.desc().nullsFirst().op('timestamptz_ops')),
]);

export const walletAllocations = pgTable('wallet_allocations', {
	walletAddress: text('wallet_address').primaryKey().notNull(),
	explorerAddress: text('explorer_address').notNull(),
	bit10: text().array().notNull(),
	tokenId: text('token_id').array(),
});

export const teLend = pgTable('te_lend', {
	lenderAddress: text('lender_address').notNull(),
	tokenChain: text('token_chain').notNull(),
	tokenAddress: text('token_address').notNull(),
	tokenAmount: text('token_amount').notNull(),
	tokenSentTrxHash: text('token_sent_trx_hash').notNull(),
	interestRate: text('interest_rate').notNull(),
	status: text().notNull(),
	returnAmount: text('return_amount'),
	returnTrxHash: text('return_trx_hash'),
	// You can use { mode: 'bigint' } if numbers are exceeding js number limitations
	returnTimestamp: bigint('return_timestamp', { mode: 'number' }),
	// You can use { mode: 'bigint' } if numbers are exceeding js number limitations
	openedAt: bigint('opened_at', { mode: 'number' }).notNull(),
	// You can use { mode: 'bigint' } if numbers are exceeding js number limitations
	closedAt: bigint('closed_at', { mode: 'number' }),
	lendId: text('lend_id').primaryKey().notNull(),
}, (table) => [
	index('idx_te_lend_lender_address').using('btree', table.lenderAddress.asc().nullsLast().op('text_ops')),
	unique('te_lend_lend_id_key').on(table.lendId),
	check('te_lend_status_check', sql`status = ANY (ARRAY['Active'::text, 'Closed'::text])`),
]);

export const teBorrow = pgTable('te_borrow', {
	borrowerAddress: text('borrower_address').notNull(),
	borrowTokenChain: text('borrow_token_chain').notNull(),
	borrowTokenAddress: text('borrow_token_address').notNull(),
	borrowTokenAmount: text('borrow_token_amount').notNull(),
	borrowTrxHash: text('borrow_trx_hash').notNull(),
	collateralAddress: text('collateral_address').notNull(),
	collateralAmount: text('collateral_amount').notNull(),
	collateralTrxHash: text('collateral_trx_hash').notNull(),
	interestRate: text('interest_rate').notNull(),
	status: text().notNull(),
	repaymentAmount: text('repayment_amount'),
	repaymentTrxHash: text('repayment_trx_hash'),
	// You can use { mode: 'bigint' } if numbers are exceeding js number limitations
	repaymentTimestamp: bigint('repayment_timestamp', { mode: 'number' }),
	// You can use { mode: 'bigint' } if numbers are exceeding js number limitations
	openedAt: bigint('opened_at', { mode: 'number' }).notNull(),
	// You can use { mode: 'bigint' } if numbers are exceeding js number limitations
	closedAt: bigint('closed_at', { mode: 'number' }),
	collateralChain: text('collateral_chain').notNull(),
	borrowWalletAddress: text('borrow_wallet_address').notNull(),
	borrowId: text('borrow_id').primaryKey().notNull(),
}, (table) => [
	index('idx_te_borrow_borrower_address').using('btree', table.borrowerAddress.asc().nullsLast().op('text_ops')),
	unique('te_borrow_borrow_id_key').on(table.borrowId),
	check('te_borrow_status_check', sql`status = ANY (ARRAY['Active'::text, 'Closed'::text, 'Liquidated'::text])`),
]);

export const bit10TopRebalance = pgTable('bit10_top_rebalance', {
	timestmpz: timestamp({ withTimezone: true, mode: 'string' }).primaryKey().notNull(),
	indexValue: doublePrecision('index_value').notNull(),
	priceOfTokenToBuy: doublePrecision('price_of_token_to_buy').notNull(),
	newTokens: json('new_tokens').notNull(),
	added: json().notNull(),
	removed: json().notNull(),
	retained: json().notNull(),
}, (table) => [
	index('bit10_top_rebalance_timestmpz_idx').using('btree', table.timestmpz.desc().nullsFirst().op('timestamptz_ops')),
]);

export const teDexSwap = pgTable('te_dex_swap', {
	// You can use { mode: 'bigint' } if numbers are exceeding js number limitations
	id: bigint({ mode: 'number' }).primaryKey().generatedAlwaysAsIdentity({ name: 'dex_swap_id_seq', startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	amountIn: text('amount_in').notNull(),
	amountOut: text('amount_out').notNull(),
	destinationChain: text('destination_chain').notNull(),
	poolId: text('pool_id').notNull(),
	slippage: text().notNull(),
	sourceChain: text('source_chain').notNull(),
	status: text().notNull(),
	swapType: text('swap_type').notNull(),
	tickInWalletAddress: text('tick_in_wallet_address').notNull(),
	tickOutWalletAddress: text('tick_out_wallet_address').notNull(),
	// You can use { mode: 'bigint' } if numbers are exceeding js number limitations
	timestamp: bigint({ mode: 'number' }).notNull(),
	tokenInAddress: text('token_in_address').notNull(),
	tokenOutAddress: text('token_out_address').notNull(),
	txHashIn: text('tx_hash_in').notNull(),
	txHashOut: text('tx_hash_out').notNull(),
}, (table) => [
	index('idx_dex_swap_destination_chain').using('btree', table.destinationChain.asc().nullsLast().op('text_ops')),
	index('idx_dex_swap_source_chain').using('btree', table.sourceChain.asc().nullsLast().op('text_ops')),
	index('idx_dex_swap_timestamp').using('btree', table.timestamp.asc().nullsLast().op('int8_ops')),
	check('check_positive_amounts', sql`((amount_in)::numeric >= (0)::numeric) AND ((amount_out)::numeric >= (0)::numeric)`),
]);

export const bit10SolSwap = pgTable('bit10_sol_swap', {
	tokenInAmount: text('token_in_amount'),
	transactionType: text('transaction_type'),
	tokenInAddress: text('token_in_address'),
	tokenOutAddress: text('token_out_address'),
	tokenInTxHash: text('token_in_tx_hash'),
	network: text(),
	swapId: text('swap_id').primaryKey().notNull(),
	tokenOutTxHash: text('token_out_tx_hash'),
	userWalletAddress: text('user_wallet_address'),
	transactionTimestamp: text('transaction_timestamp'),
	tokenInUsdAmount: text('token_in_usd_amount'),
	tokenOutAmount: text('token_out_amount'),
});

export const bit10SolComparison = pgTable('bit10_sol_comparison', {
	date: date().primaryKey().notNull(),
	bit10Sol: numeric('bit10_sol').notNull(),
	btc: numeric().notNull(),
	sol: numeric().notNull(),
	eth: numeric().notNull(),
	sp500: numeric().notNull(),
	gold: numeric().notNull(),
});

export const bit10SolRebalance = pgTable('bit10_sol_rebalance', {
	timestmpz: timestamp({ withTimezone: true, mode: 'string' }).primaryKey().notNull(),
	indexValue: doublePrecision('index_value').notNull(),
	priceOfTokenToBuy: doublePrecision('price_of_token_to_buy').notNull(),
	newTokens: json('new_tokens').notNull(),
	added: json().notNull(),
	removed: json().notNull(),
	retained: json().notNull(),
}, (table) => [
	index('bit10_sol_rebalance_timestmpz_idx').using('btree', table.timestmpz.desc().nullsFirst().op('timestamptz_ops')),
]);

export const bit10Comparison = pgTable('bit10_comparison', {
	date: date().primaryKey().notNull(),
	bit10Top: numeric('bit10_top').notNull(),
	btc: numeric().notNull(),
	sp500: numeric().notNull(),
	gold: numeric().notNull(),
	bit10Sol: numeric('bit10_sol').default('0').notNull(),
	sol: numeric().default('0').notNull(),
	eth: numeric().default('0').notNull(),
}, (table) => [
	index('idx_bit10_comparison_date').using('btree', table.date.asc().nullsLast().op('date_ops')),
]);

export const users = pgTable('users', {
	userId: text('user_id').notNull(),
	userPaymentAddress: text('user_payment_address').notNull(),
	userOrdinalsAddress: text('user_ordinals_address').notNull(),
	userStacksAddress: text('user_stacks_address').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull(),
}, (table) => [
	primaryKey({ columns: [table.userId, table.userPaymentAddress], name: 'users_pkey' }),
	unique('users_user_id_key').on(table.userId),
	unique('users_user_payment_address_key').on(table.userPaymentAddress),
	unique('users_user_ordinals_address_key').on(table.userOrdinalsAddress),
	unique('users_user_stacks_address_key').on(table.userStacksAddress),
]);
