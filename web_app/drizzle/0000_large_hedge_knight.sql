-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TYPE "public"."aal_level" AS ENUM('aal1', 'aal2', 'aal3');--> statement-breakpoint
CREATE TYPE "public"."action" AS ENUM('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'ERROR');--> statement-breakpoint
CREATE TYPE "public"."code_challenge_method" AS ENUM('s256', 'plain');--> statement-breakpoint
CREATE TYPE "public"."equality_op" AS ENUM('eq', 'neq', 'lt', 'lte', 'gt', 'gte', 'in');--> statement-breakpoint
CREATE TYPE "public"."factor_status" AS ENUM('unverified', 'verified');--> statement-breakpoint
CREATE TYPE "public"."factor_type" AS ENUM('totp', 'webauthn');--> statement-breakpoint
CREATE TYPE "public"."key_status" AS ENUM('default', 'valid', 'invalid', 'expired');--> statement-breakpoint
CREATE TYPE "public"."key_type" AS ENUM('aead-ietf', 'aead-det', 'hmacsha512', 'hmacsha256', 'auth', 'shorthash', 'generichash', 'kdf', 'secretbox', 'secretstream', 'stream_xchacha20');--> statement-breakpoint
CREATE TYPE "public"."one_time_token_type" AS ENUM('confirmation_token', 'reauthentication_token', 'recovery_token', 'email_change_token_new', 'email_change_token_current', 'phone_change_token');--> statement-breakpoint
CREATE TABLE "referral_june_2025_tasks" (
	"address" text PRIMARY KEY NOT NULL,
	"questionnaire" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "referral_june_2025" (
	"referral_code" text NOT NULL,
	"user_id" text PRIMARY KEY NOT NULL,
	"used_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "referral_june_2025_referral_code_user_id_key" UNIQUE("referral_code","user_id")
);
--> statement-breakpoint
CREATE TABLE "mb_token_mint" (
	"token_mint_id" text PRIMARY KEY NOT NULL,
	"user_principal_id" text NOT NULL,
	"minting_amount" text NOT NULL,
	"minting_token_name" text NOT NULL,
	"minting_usd_amount" text NOT NULL,
	"recieving_token_amount" text NOT NULL,
	"recieving_token_name" text NOT NULL,
	"minting_status" text NOT NULL,
	"token_mint_at" timestamp with time zone NOT NULL,
	"transaction_index" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "te_liquidity_hub" (
	"liquidation_id" text PRIMARY KEY NOT NULL,
	"tick_in_address" text NOT NULL,
	"tick_in_name" text NOT NULL,
	"tick_in_amount" double precision NOT NULL,
	"duration" double precision NOT NULL,
	"liquidation_type" text NOT NULL,
	"liquidation_mode" text NOT NULL,
	"transaction_status" text NOT NULL,
	"transaction_timestamp" timestamp with time zone NOT NULL,
	"tick_in_network" text NOT NULL,
	"tick_in_tx_block" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bit10_top" (
	"timestmpz" timestamp with time zone PRIMARY KEY NOT NULL,
	"token_price" double precision NOT NULL,
	"data" json NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bit10_top_historical_data" (
	"timestmpz" timestamp with time zone PRIMARY KEY NOT NULL,
	"token_price" double precision NOT NULL,
	"data" json NOT NULL
);
--> statement-breakpoint
CREATE TABLE "swap" (
	"token_swap_id" text PRIMARY KEY NOT NULL,
	"user_principal_id" text NOT NULL,
	"tick_in_name" text NOT NULL,
	"tick_in_amount" text NOT NULL,
	"tick_in_usd_amount" text NOT NULL,
	"tick_in_tx_block" text NOT NULL,
	"tick_out_name" text NOT NULL,
	"tick_out_amount" text NOT NULL,
	"tick_out_tx_block" text NOT NULL,
	"transaction_type" text NOT NULL,
	"transaction_status" text NOT NULL,
	"transaction_timestamp" timestamp with time zone NOT NULL,
	"network" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "test_bit10_top_rebalance" (
	"timestmpz" timestamp with time zone PRIMARY KEY NOT NULL,
	"index_value" double precision NOT NULL,
	"price_of_token_to_buy" double precision NOT NULL,
	"new_tokens" json NOT NULL,
	"added" json NOT NULL,
	"removed" json NOT NULL,
	"retained" json NOT NULL
);
--> statement-breakpoint
CREATE TABLE "referral_apr_2025" (
	"referral_code" text NOT NULL,
	"user_id" text PRIMARY KEY NOT NULL,
	"used_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "referral_apr_2025_referral_code_user_id_key" UNIQUE("referral_code","user_id"),
	CONSTRAINT "referral_apr_2025_user_id_key" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "referral_apr_2025_tasks" (
	"address" text PRIMARY KEY NOT NULL,
	"task_1" boolean DEFAULT false NOT NULL,
	"task_2" boolean DEFAULT false NOT NULL,
	"task_3" boolean DEFAULT false NOT NULL,
	CONSTRAINT "referral_apr_2025_tasks_address_key" UNIQUE("address")
);
--> statement-breakpoint
CREATE TABLE "bit10_meme" (
	"timestmpz" timestamp with time zone PRIMARY KEY NOT NULL,
	"token_price" double precision NOT NULL,
	"data" json NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bit10_meme_historical_data" (
	"timestmpz" timestamp with time zone PRIMARY KEY NOT NULL,
	"token_price" double precision NOT NULL,
	"data" json NOT NULL
);
--> statement-breakpoint
CREATE TABLE "te_swap" (
	"token_swap_id" text PRIMARY KEY NOT NULL,
	"user_principal_id" text NOT NULL,
	"tick_in_name" text NOT NULL,
	"tick_in_amount" text NOT NULL,
	"tick_in_usd_amount" text NOT NULL,
	"tick_in_tx_block" text NOT NULL,
	"tick_out_name" text NOT NULL,
	"tick_out_amount" text NOT NULL,
	"tick_out_tx_block" text NOT NULL,
	"transaction_type" text NOT NULL,
	"transaction_status" text NOT NULL,
	"transaction_timestamp" timestamp with time zone NOT NULL,
	"network" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "test_bit10_meme_rebalance" (
	"timestmpz" timestamp with time zone PRIMARY KEY NOT NULL,
	"index_value" double precision NOT NULL,
	"price_of_token_to_buy" double precision NOT NULL,
	"new_tokens" json NOT NULL,
	"added" json NOT NULL,
	"removed" json NOT NULL,
	"retained" json NOT NULL
);
--> statement-breakpoint
CREATE TABLE "waitlist_address" (
	"waitlist_address_id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "waitlist_address_waitlist_address_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"address" text NOT NULL,
	CONSTRAINT "waitlist_address_address_key" UNIQUE("address")
);
--> statement-breakpoint
CREATE TABLE "bit10_defi" (
	"timestmpz" timestamp with time zone PRIMARY KEY NOT NULL,
	"token_price" double precision NOT NULL,
	"data" json NOT NULL
);
--> statement-breakpoint
CREATE TABLE "te_users" (
	"user_id" text PRIMARY KEY NOT NULL,
	"user_principal_id" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "te_users_user_id_key" UNIQUE("user_id"),
	CONSTRAINT "te_users_user_principal_id_key" UNIQUE("user_principal_id")
);
--> statement-breakpoint
CREATE TABLE "user_signups" (
	"newsletter_subscribers_id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	CONSTRAINT "newsletter_subscribers_email_key" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "te_token_swap" (
	"token_swap_id" text PRIMARY KEY NOT NULL,
	"user_principal_id" text NOT NULL,
	"token_purchase_amount" text NOT NULL,
	"token_purchase_name" text NOT NULL,
	"token_purchase_usd_amount" text NOT NULL,
	"bit10_token_quantity" text NOT NULL,
	"bit10_token_name" text NOT NULL,
	"token_transaction_status" text NOT NULL,
	"token_bought_at" timestamp with time zone NOT NULL,
	CONSTRAINT "te_token_swap_token_swap_id_key" UNIQUE("token_swap_id")
);
--> statement-breakpoint
CREATE TABLE "te_request_btc" (
	"email" varchar(255) NOT NULL,
	"user_principal_id" text NOT NULL,
	"request_id" serial PRIMARY KEY NOT NULL,
	"btc_sent" boolean DEFAULT false,
	CONSTRAINT "te_request_btc_request_id_key" UNIQUE("request_id")
);
--> statement-breakpoint
CREATE TABLE "bit10_collateral_token_prices" (
	"bit10_token_name" text PRIMARY KEY NOT NULL,
	"price_of_token_to_buy" double precision NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bit10_brc20_rebalance" (
	"timestmpz" timestamp with time zone PRIMARY KEY NOT NULL,
	"index_value" double precision NOT NULL,
	"price_of_token_to_buy" double precision NOT NULL,
	"new_tokens" json NOT NULL,
	"added" json NOT NULL,
	"removed" json NOT NULL,
	"retained" json NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bit10_brc20_historical_data" (
	"timestmpz" timestamp with time zone PRIMARY KEY NOT NULL,
	"token_price" double precision NOT NULL,
	"data" json NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bit10_brc20" (
	"timestmpz" timestamp with time zone PRIMARY KEY NOT NULL,
	"token_price" double precision NOT NULL,
	"data" json NOT NULL
);
--> statement-breakpoint
CREATE TABLE "token_swap" (
	"token_swap_id" text PRIMARY KEY NOT NULL,
	"user_payment_address" text NOT NULL,
	"user_ordinals_address" text NOT NULL,
	"user_stacks_address" text NOT NULL,
	"token_purchase_amount" text NOT NULL,
	"token_purchase_name" text NOT NULL,
	"bit10_token_quantity" text NOT NULL,
	"bit10_token_name" text NOT NULL,
	"token_transaction_signature" text NOT NULL,
	"token_bought_at" timestamp with time zone NOT NULL,
	"token_purchase_usd_amount" text NOT NULL,
	CONSTRAINT "token_swap_token_swap_id_key" UNIQUE("token_swap_id")
);
--> statement-breakpoint
CREATE TABLE "mb_principal_id_whitelist" (
	"user_principal_id" text PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mb_users" (
	"user_id" text PRIMARY KEY NOT NULL,
	"user_principal_id" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "mb_users_user_principal_id_key" UNIQUE("user_principal_id")
);
--> statement-breakpoint
CREATE TABLE "mb_token_swap" (
	"token_swap_id" text PRIMARY KEY NOT NULL,
	"user_principal_id" text NOT NULL,
	"token_purchase_amount" text NOT NULL,
	"token_purchase_name" text NOT NULL,
	"token_purchase_usd_amount" text NOT NULL,
	"bit10_token_quantity" text NOT NULL,
	"bit10_token_name" text NOT NULL,
	"token_transaction_status" text NOT NULL,
	"token_bought_at" timestamp with time zone NOT NULL,
	"transaction_index" text NOT NULL,
	CONSTRAINT "mb_token_swap_transaction_index_key" UNIQUE("transaction_index")
);
--> statement-breakpoint
CREATE TABLE "dex" (
	"swap_id" text PRIMARY KEY NOT NULL,
	"pool_id" text NOT NULL,
	"tick_in_wallet_address" text NOT NULL,
	"tick_out_wallet_address" text NOT NULL,
	"swap_type" text NOT NULL,
	"source_chain" text NOT NULL,
	"destination_chain" text NOT NULL,
	"token_in_address" text NOT NULL,
	"token_out_address" text NOT NULL,
	"amount_in" text NOT NULL,
	"amount_out" text NOT NULL,
	"slippage" text NOT NULL,
	"tx_hash_in" text NOT NULL,
	"tx_hash_out" text NOT NULL,
	"status" text NOT NULL,
	"timestamp" bigint NOT NULL,
	CONSTRAINT "check_positive_amounts" CHECK (((amount_in)::numeric >= (0)::numeric) AND ((amount_out)::numeric >= (0)::numeric))
);
--> statement-breakpoint
CREATE TABLE "bit10_sol_historical_data" (
	"timestmpz" timestamp with time zone PRIMARY KEY NOT NULL,
	"token_price" double precision NOT NULL,
	"data" json NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallet_allocations" (
	"wallet_address" text PRIMARY KEY NOT NULL,
	"explorer_address" text NOT NULL,
	"bit10" text[] NOT NULL,
	"token_id" text[]
);
--> statement-breakpoint
CREATE TABLE "te_lend" (
	"lender_address" text NOT NULL,
	"token_chain" text NOT NULL,
	"token_address" text NOT NULL,
	"token_amount" text NOT NULL,
	"token_sent_trx_hash" text NOT NULL,
	"interest_rate" text NOT NULL,
	"status" text NOT NULL,
	"return_amount" text,
	"return_trx_hash" text,
	"return_timestamp" bigint,
	"opened_at" bigint NOT NULL,
	"closed_at" bigint,
	"lend_id" text PRIMARY KEY NOT NULL,
	CONSTRAINT "te_lend_lend_id_key" UNIQUE("lend_id"),
	CONSTRAINT "te_lend_status_check" CHECK (status = ANY (ARRAY['Active'::text, 'Closed'::text]))
);
--> statement-breakpoint
CREATE TABLE "te_borrow" (
	"borrower_address" text NOT NULL,
	"borrow_token_chain" text NOT NULL,
	"borrow_token_address" text NOT NULL,
	"borrow_token_amount" text NOT NULL,
	"borrow_trx_hash" text NOT NULL,
	"collateral_address" text NOT NULL,
	"collateral_amount" text NOT NULL,
	"collateral_trx_hash" text NOT NULL,
	"interest_rate" text NOT NULL,
	"status" text NOT NULL,
	"repayment_amount" text,
	"repayment_trx_hash" text,
	"repayment_timestamp" bigint,
	"opened_at" bigint NOT NULL,
	"closed_at" bigint,
	"collateral_chain" text NOT NULL,
	"borrow_wallet_address" text NOT NULL,
	"borrow_id" text PRIMARY KEY NOT NULL,
	CONSTRAINT "te_borrow_borrow_id_key" UNIQUE("borrow_id"),
	CONSTRAINT "te_borrow_status_check" CHECK (status = ANY (ARRAY['Active'::text, 'Closed'::text, 'Liquidated'::text]))
);
--> statement-breakpoint
CREATE TABLE "bit10_top_rebalance" (
	"timestmpz" timestamp with time zone PRIMARY KEY NOT NULL,
	"index_value" double precision NOT NULL,
	"price_of_token_to_buy" double precision NOT NULL,
	"new_tokens" json NOT NULL,
	"added" json NOT NULL,
	"removed" json NOT NULL,
	"retained" json NOT NULL
);
--> statement-breakpoint
CREATE TABLE "te_dex_swap" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "dex_swap_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"amount_in" text NOT NULL,
	"amount_out" text NOT NULL,
	"destination_chain" text NOT NULL,
	"pool_id" text NOT NULL,
	"slippage" text NOT NULL,
	"source_chain" text NOT NULL,
	"status" text NOT NULL,
	"swap_type" text NOT NULL,
	"tick_in_wallet_address" text NOT NULL,
	"tick_out_wallet_address" text NOT NULL,
	"timestamp" bigint NOT NULL,
	"token_in_address" text NOT NULL,
	"token_out_address" text NOT NULL,
	"tx_hash_in" text NOT NULL,
	"tx_hash_out" text NOT NULL,
	CONSTRAINT "check_positive_amounts" CHECK (((amount_in)::numeric >= (0)::numeric) AND ((amount_out)::numeric >= (0)::numeric))
);
--> statement-breakpoint
CREATE TABLE "bit10_sol_comparison" (
	"date" date PRIMARY KEY NOT NULL,
	"bit10_sol" numeric NOT NULL,
	"btc" numeric NOT NULL,
	"sol" numeric NOT NULL,
	"eth" numeric NOT NULL,
	"sp500" numeric NOT NULL,
	"gold" numeric NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bit10_comparison" (
	"date" date PRIMARY KEY NOT NULL,
	"bit10_top" numeric NOT NULL,
	"btc" numeric NOT NULL,
	"sp500" numeric NOT NULL,
	"gold" numeric NOT NULL,
	"bit10_sol" numeric DEFAULT '0' NOT NULL,
	"sol" numeric DEFAULT '0' NOT NULL,
	"eth" numeric DEFAULT '0' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"user_id" text NOT NULL,
	"user_payment_address" text NOT NULL,
	"user_ordinals_address" text NOT NULL,
	"user_stacks_address" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "users_pkey" PRIMARY KEY("user_id","user_payment_address"),
	CONSTRAINT "users_user_id_key" UNIQUE("user_id"),
	CONSTRAINT "users_user_payment_address_key" UNIQUE("user_payment_address"),
	CONSTRAINT "users_user_ordinals_address_key" UNIQUE("user_ordinals_address"),
	CONSTRAINT "users_user_stacks_address_key" UNIQUE("user_stacks_address")
);
--> statement-breakpoint
ALTER TABLE "te_token_swap" ADD CONSTRAINT "te_token_swap_user_principal_id_te_users_user_principal_id_fk" FOREIGN KEY ("user_principal_id") REFERENCES "public"."te_users"("user_principal_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "token_swap" ADD CONSTRAINT "token_swap_user_ordinals_address_users_user_ordinals_address_fk" FOREIGN KEY ("user_ordinals_address") REFERENCES "public"."users"("user_ordinals_address") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "token_swap" ADD CONSTRAINT "token_swap_user_payment_address_users_user_payment_address_fk" FOREIGN KEY ("user_payment_address") REFERENCES "public"."users"("user_payment_address") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "token_swap" ADD CONSTRAINT "token_swap_user_stacks_address_users_user_stacks_address_fk" FOREIGN KEY ("user_stacks_address") REFERENCES "public"."users"("user_stacks_address") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mb_token_swap" ADD CONSTRAINT "mb_token_swap_user_principal_id_mb_users_user_principal_id_fk" FOREIGN KEY ("user_principal_id") REFERENCES "public"."mb_users"("user_principal_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bit10_top_timestmpz_idx" ON "bit10_top" USING btree ("timestmpz" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "bit10_top_historical_data_timestmpz_idx" ON "bit10_top_historical_data" USING btree ("timestmpz" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "test_bit10_top_rebalance_timestmpz_idx" ON "test_bit10_top_rebalance" USING btree ("timestmpz" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "bit10_meme_timestmpz_idx" ON "bit10_meme" USING btree ("timestmpz" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "bit10_meme_historical_data_timestmpz_idx" ON "bit10_meme_historical_data" USING btree ("timestmpz" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "test_bit10_meme_rebalance_timestmpz_idx" ON "test_bit10_meme_rebalance" USING btree ("timestmpz" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "bit10_defi_timestmpz_idx" ON "bit10_defi" USING btree ("timestmpz" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "bit10_brc20_rebalance_timestmpz_idx" ON "bit10_brc20_rebalance" USING btree ("timestmpz" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "bit10_brc20_historical_data_timestmpz_idx" ON "bit10_brc20_historical_data" USING btree ("timestmpz" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "bit10_brc20_timestmpz_idx" ON "bit10_brc20" USING btree ("timestmpz" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_dex_destination_chain" ON "dex" USING btree ("destination_chain" text_ops);--> statement-breakpoint
CREATE INDEX "idx_dex_source_chain" ON "dex" USING btree ("source_chain" text_ops);--> statement-breakpoint
CREATE INDEX "idx_dex_timestamp" ON "dex" USING btree ("timestamp" int8_ops);--> statement-breakpoint
CREATE INDEX "bit10_sol_historical_data_timestmpz_idx" ON "bit10_sol_historical_data" USING btree ("timestmpz" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_te_lend_lender_address" ON "te_lend" USING btree ("lender_address" text_ops);--> statement-breakpoint
CREATE INDEX "idx_te_borrow_borrower_address" ON "te_borrow" USING btree ("borrower_address" text_ops);--> statement-breakpoint
CREATE INDEX "bit10_top_rebalance_timestmpz_idx" ON "bit10_top_rebalance" USING btree ("timestmpz" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_dex_swap_destination_chain" ON "te_dex_swap" USING btree ("destination_chain" text_ops);--> statement-breakpoint
CREATE INDEX "idx_dex_swap_source_chain" ON "te_dex_swap" USING btree ("source_chain" text_ops);--> statement-breakpoint
CREATE INDEX "idx_dex_swap_timestamp" ON "te_dex_swap" USING btree ("timestamp" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_bit10_comparison_date" ON "bit10_comparison" USING btree ("date" date_ops);
*/