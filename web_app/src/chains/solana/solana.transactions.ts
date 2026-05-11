/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { getCustomConnection } from './solana.client';
import { toast } from 'sonner';
import { ROUTER_PROGRAM_ID, ORACLE_PROGRAM_ID, USDC_MINT, BIT10_SOL_MINT, SOL_WRAPPED_MINT } from './solana.constants'
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, Transaction, TransactionInstruction, type AccountMeta } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID, getAssociatedTokenAddressSync } from '@solana/spl-token';
import { getAssociatedTokenAddressSync as getAta2022 } from '@solana/spl-token';
import { createAssociatedTokenAccountInstruction } from '@solana/spl-token';
import { addBit10SolSwap } from '@/actions/dbActions';

const ORACLE_SEED = 'bit10-oracle';
const MINT_AUTH_SEED = 'bit10-mint-authority';
const VAULT_SOL_SEED = 'bit10-sol-vault';
const VAULT_AUTH_SEED = 'bit10-vault-authority';

const MINT_DISCRIMINATOR = Buffer.from([51, 57, 225, 47, 182, 146, 137, 166]);
const BURN_DISCRIMINATOR = Buffer.from([116, 110, 29, 56, 107, 219, 42, 93]);

const SOL_DECIMALS = 9;
const USDC_DECIMALS = 6;
const BIT10_DECIMALS = 9;

function derivePda(seed: string, programId: PublicKey): PublicKey {
    const [pda] = PublicKey.findProgramAddressSync([Buffer.from(seed)], programId);
    return pda;
}

function fromBaseUnits(amount: bigint, decimals: number): string {
    const str = amount.toString().padStart(decimals + 1, '0');
    const intPart = str.slice(0, -decimals) || '0';
    const fracPart = str.slice(-decimals).replace(/0+$/, '');
    return fracPart ? `${intPart}.${fracPart}` : intPart;
}

function toBaseUnits(humanAmount: string, decimals: number): bigint {
    if (!humanAmount || humanAmount === '' || humanAmount === '.') return BigInt(0);
    const [intPart, fracPart = ''] = humanAmount.split('.');
    const fracPadded = fracPart.slice(0, decimals).padEnd(decimals, '0');
    return BigInt(intPart ?? '0') * BigInt(10 ** decimals) + BigInt(fracPadded || '0');
}

function buildIxData(discriminator: Buffer, amount: bigint, addr1: PublicKey, addr2: PublicKey): Buffer {
    const buf = Buffer.alloc(8 + 8 + 32 + 32);
    discriminator.copy(buf, 0);
    let x = amount;
    for (let i = 0; i < 8; i++) {
        buf[8 + i] = Number(x & BigInt(0xff));
        x >>= BigInt(8);
    }
    buf.set(addr1.toBytes(), 16);
    buf.set(addr2.toBytes(), 48);
    return buf;
}

function buildMintInstruction(amount: bigint, tokenInAddress: PublicKey, accounts: { oracle: PublicKey; user: PublicKey; userTokenInAta: PublicKey; vaultTokenInAta: PublicKey; tokenInMint: PublicKey; mintAuthority: PublicKey; userTokenOutAta: PublicKey; vaultSolPda: PublicKey; vaultAuthority: PublicKey; }): TransactionInstruction {
    const data = buildIxData(MINT_DISCRIMINATOR, amount, tokenInAddress, BIT10_SOL_MINT);

    const keys: AccountMeta[] = [
        { pubkey: accounts.oracle, isSigner: false, isWritable: true },
        { pubkey: accounts.user, isSigner: true, isWritable: true },
        { pubkey: accounts.userTokenInAta, isSigner: false, isWritable: true },
        { pubkey: accounts.vaultTokenInAta, isSigner: false, isWritable: true },
        { pubkey: accounts.tokenInMint, isSigner: false, isWritable: true },
        { pubkey: BIT10_SOL_MINT, isSigner: false, isWritable: true },
        { pubkey: accounts.mintAuthority, isSigner: false, isWritable: false },
        { pubkey: accounts.userTokenOutAta, isSigner: false, isWritable: true },
        { pubkey: accounts.vaultSolPda, isSigner: false, isWritable: true },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        { pubkey: accounts.vaultAuthority, isSigner: false, isWritable: false },
        { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
    ];

    return new TransactionInstruction({ programId: ROUTER_PROGRAM_ID, keys, data });
}

function buildBurnInstruction(amount: bigint, accounts: { oracle: PublicKey; user: PublicKey; userTokenInAta: PublicKey; vaultSolPda: PublicKey; vaultAuthority: PublicKey; }): TransactionInstruction {
    const data = buildIxData(BURN_DISCRIMINATOR, amount, BIT10_SOL_MINT, SOL_WRAPPED_MINT);

    const keys: AccountMeta[] = [
        { pubkey: accounts.oracle, isSigner: false, isWritable: true },
        { pubkey: accounts.user, isSigner: true, isWritable: true },
        { pubkey: accounts.userTokenInAta, isSigner: false, isWritable: true },
        { pubkey: BIT10_SOL_MINT, isSigner: false, isWritable: true },
        { pubkey: accounts.vaultSolPda, isSigner: false, isWritable: true },
        { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        { pubkey: accounts.vaultAuthority, isSigner: false, isWritable: false },
    ];

    return new TransactionInstruction({ programId: ROUTER_PROGRAM_ID, keys, data });
}

export const buyBIT10Token = async ({ tokenInAmount, tokenInAddress, tokenOutAddress, walletAddress, wallet }: { tokenInAmount: string, tokenInAddress: string, tokenOutAmount: string, tokenOutAddress: string, walletAddress: string, wallet: any }) => {
    try {
        const connection = getCustomConnection();

        if (!wallet.publicKey) throw new Error('Connect wallet first');
        if (!wallet.signTransaction) throw new Error('Wallet does not support signing');

        const user = wallet.publicKey as PublicKey;
        const vaultOwner = ROUTER_PROGRAM_ID;
        const isSolIn = tokenInAddress === SOL_WRAPPED_MINT.toBase58();

        const oraclePda = derivePda(ORACLE_SEED, ORACLE_PROGRAM_ID);
        const mintAuthorityPda = derivePda(MINT_AUTH_SEED, ROUTER_PROGRAM_ID);
        const vaultSolPda = derivePda(VAULT_SOL_SEED, ROUTER_PROGRAM_ID);
        const vaultAuthorityPda = derivePda(VAULT_AUTH_SEED, ROUTER_PROGRAM_ID);

        const tokenInDecimals = isSolIn ? SOL_DECIMALS : USDC_DECIMALS;
        const mintAmountRaw = toBaseUnits(tokenInAmount, tokenInDecimals);

        if (mintAmountRaw <= BigInt(0)) throw new Error('Amount must be greater than 0');

        let tokenInMint: PublicKey;
        let tokenInIs2022 = false;
        let userTokenInAta: PublicKey;
        let vaultTokenInAta: PublicKey;

        if (isSolIn) {
            tokenInMint = USDC_MINT;
            userTokenInAta = getAssociatedTokenAddressSync(USDC_MINT, user, true);
            vaultTokenInAta = getAssociatedTokenAddressSync(USDC_MINT, vaultOwner, true);
        } else {
            tokenInMint = USDC_MINT;
            const mintInfo = await connection.getAccountInfo(tokenInMint, 'confirmed');
            if (!mintInfo) throw new Error('USDC mint not found');
            tokenInIs2022 = mintInfo.owner.equals(TOKEN_2022_PROGRAM_ID);

            if (tokenInIs2022) {
                userTokenInAta = getAta2022(tokenInMint, user, false, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);
                vaultTokenInAta = getAta2022(tokenInMint, vaultOwner, true, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);
            } else {
                userTokenInAta = getAssociatedTokenAddressSync(tokenInMint, user, true);
                vaultTokenInAta = getAssociatedTokenAddressSync(tokenInMint, vaultOwner, true);
            }
        }

        const userTokenOutAta = getAta2022(BIT10_SOL_MINT, user, false, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);

        const tx = new Transaction();

        if (isSolIn) {
            tx.add(
                SystemProgram.transfer({
                    fromPubkey: user,
                    toPubkey: vaultSolPda,
                    lamports: Number(mintAmountRaw),
                })
            );

            const userOutInfo = await connection.getAccountInfo(userTokenOutAta, 'confirmed');
            if (!userOutInfo) {
                tx.add(createAssociatedTokenAccountInstruction(user, userTokenOutAta, user, BIT10_SOL_MINT, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID));
            }
        } else {
            const [userInInfo, vaultInInfo, userOutInfo] = await Promise.all([
                connection.getAccountInfo(userTokenInAta, 'confirmed'),
                connection.getAccountInfo(vaultTokenInAta, 'confirmed'),
                connection.getAccountInfo(userTokenOutAta, 'confirmed'),
            ]);

            if (!userInInfo) {
                tx.add(createAssociatedTokenAccountInstruction(user, userTokenInAta, user, tokenInMint, tokenInIs2022 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID));
            }
            if (!vaultInInfo) {
                tx.add(createAssociatedTokenAccountInstruction(user, vaultTokenInAta, vaultOwner, tokenInMint, tokenInIs2022 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID));
            }
            if (!userOutInfo) {
                tx.add(createAssociatedTokenAccountInstruction(user, userTokenOutAta, user, BIT10_SOL_MINT, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID));
            }
        }

        const tokenInAddressPubkey = isSolIn ? SOL_WRAPPED_MINT : USDC_MINT;

        tx.add(buildMintInstruction(mintAmountRaw, tokenInAddressPubkey, { oracle: oraclePda, user, userTokenInAta, vaultTokenInAta, tokenInMint, mintAuthority: mintAuthorityPda, userTokenOutAta, vaultSolPda, vaultAuthority: vaultAuthorityPda, }));

        tx.feePayer = user;
        tx.recentBlockhash = (await connection.getLatestBlockhash('finalized')).blockhash;

        const signed = await wallet.signTransaction(tx);
        const sig = await connection.sendRawTransaction(signed.serialize(), { skipPreflight: false, maxRetries: 3 });

        await connection.confirmTransaction(sig, 'confirmed');
        // eslint-disable-next-line prefer-const
        let parsedLog: Record<string, string> = {};
        for (let i = 0; i < 5; i++) {
            const tx = await connection.getTransaction(sig, {
                commitment: 'confirmed',
                maxSupportedTransactionVersion: 0,
            });
            if (tx?.meta?.logMessages) {
                const logs = tx.meta.logMessages;
                for (const line of logs) {
                    const trimmed = line.trim();
                    if (!trimmed.startsWith('Program log: MintResult ')) continue;
                    const rest = trimmed.slice('Program log: MintResult '.length);
                    const eqIdx = rest.indexOf('=');
                    if (eqIdx === -1) continue;
                    parsedLog[rest.slice(0, eqIdx).trim()] = rest.slice(eqIdx + 1).trim();
                }
                break;
            }
            await new Promise((r) => setTimeout(r, 2000));
        }

        const rawTokenInAddress = parsedLog.token_in_address ?? tokenInAddress;
        const resolvedTokenInDecimals =
            rawTokenInAddress === 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
                ? USDC_DECIMALS
                : SOL_DECIMALS;

        const display_token_in_amount = parsedLog.token_in_amount
            ? fromBaseUnits(BigInt(parsedLog.token_in_amount), resolvedTokenInDecimals)
            : 'N/A';

        const display_token_in_usd_amount = parsedLog.token_in_usd_amount
            ? fromBaseUnits(BigInt(parsedLog.token_in_usd_amount), 9)
            : 'N/A';

        const display_token_out_amount = parsedLog.token_out_amount
            ? fromBaseUnits(BigInt(parsedLog.token_out_amount), BIT10_DECIMALS)
            : 'N/A';

        await addBit10SolSwap({
            tokenInAmount: display_token_in_amount.toString() ?? '0',
            transactionType: parsedLog.transaction_type ?? 'Buy',
            tokenInAddress: parsedLog.token_in_address ?? tokenInAddress,
            tokenOutAddress: parsedLog.token_out_address ?? tokenOutAddress,
            tokenInTxHash: sig,
            network: parsedLog.network ?? 'Solana',
            swapId: parsedLog.swap_id ?? sig,
            tokenOutTxHash: sig,
            userWalletAddress: parsedLog.user_wallet_address ?? walletAddress,
            transactionTimestamp: parsedLog.transaction_timestamp ?? new Date().toISOString(),
            tokenInUsdAmount: display_token_in_usd_amount.toString() ?? '0',
            tokenOutAmount: display_token_out_amount.toString() ?? '0',
        });

        toast.success('BIT10.SOL minted successfully!');
        return sig;
    } catch (error: any) {
        console.error(error);
        toast.error(error?.message ?? 'An error occurred while processing your request. Please try again!');
        throw error;
    }
};

export const sellBIT10Token = async ({ tokenInAmount, tokenInAddress, tokenOutAddress, walletAddress, wallet }: { tokenInAmount: string, tokenInAddress: string, tokenOutAmount: string, tokenOutAddress: string, walletAddress: string, wallet: any }) => {
    try {
        const connection = getCustomConnection();

        if (!wallet.publicKey) throw new Error('Connect wallet first');
        if (!wallet.signTransaction) throw new Error('Wallet does not support signing');

        const user = wallet.publicKey as PublicKey;

        const oraclePda = derivePda(ORACLE_SEED, ORACLE_PROGRAM_ID);
        const vaultSolPda = derivePda(VAULT_SOL_SEED, ROUTER_PROGRAM_ID);
        const vaultAuthorityPda = derivePda(VAULT_AUTH_SEED, ROUTER_PROGRAM_ID);

        const burnAmountRaw = toBaseUnits(tokenInAmount, BIT10_DECIMALS);
        if (burnAmountRaw <= BigInt(0)) throw new Error('Amount must be greater than 0');

        const userTokenInAta = getAta2022(
            BIT10_SOL_MINT,
            user,
            false,
            TOKEN_2022_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
        );

        const userInInfo = await connection.getAccountInfo(userTokenInAta, 'confirmed');
        if (!userInInfo) {
            throw new Error('No BIT10.SOL token account found. You need BIT10.SOL tokens to sell.');
        }

        const tx = new Transaction();

        tx.add(
            buildBurnInstruction(burnAmountRaw, {
                oracle: oraclePda,
                user,
                userTokenInAta,
                vaultSolPda,
                vaultAuthority: vaultAuthorityPda,
            })
        );

        tx.feePayer = user;
        tx.recentBlockhash = (await connection.getLatestBlockhash('finalized')).blockhash;

        const signed = await wallet.signTransaction(tx);
        const sig = await connection.sendRawTransaction(signed.serialize(), {
            skipPreflight: false,
            maxRetries: 3,
        });

        await connection.confirmTransaction(sig, 'confirmed');

        // eslint-disable-next-line prefer-const
        let parsedLog: Record<string, string> = {};
        for (let i = 0; i < 5; i++) {
            const tx = await connection.getTransaction(sig, {
                commitment: 'confirmed',
                maxSupportedTransactionVersion: 0,
            });
            if (tx?.meta?.logMessages) {
                const logs = tx.meta.logMessages;
                for (const line of logs) {
                    const trimmed = line.trim();
                    if (!trimmed.startsWith('Program log: BurnResult ')) continue;
                    const rest = trimmed.slice('Program log: BurnResult '.length);
                    const eqIdx = rest.indexOf('=');
                    if (eqIdx === -1) continue;
                    parsedLog[rest.slice(0, eqIdx).trim()] = rest.slice(eqIdx + 1).trim();
                }
                break;
            }
            await new Promise((r) => setTimeout(r, 2000));
        }

        const display_token_in_amount = parsedLog.token_in_amount
            ? fromBaseUnits(BigInt(parsedLog.token_in_amount), BIT10_DECIMALS)
            : 'N/A';

        const display_token_in_usd_amount = parsedLog.token_in_usd_amount
            ? fromBaseUnits(BigInt(parsedLog.token_in_usd_amount), 9)
            : 'N/A';

        const display_token_out_lamports = parsedLog.token_out_lamports
            ? fromBaseUnits(BigInt(parsedLog.token_out_lamports), SOL_DECIMALS)
            : 'N/A';

        await addBit10SolSwap({
            tokenInAmount: display_token_in_amount.toString() ?? '0',
            transactionType: parsedLog.transaction_type ?? 'Sell',
            tokenInAddress: parsedLog.token_in_address ?? tokenInAddress,
            tokenOutAddress: parsedLog.token_out_address ?? tokenOutAddress,
            tokenInTxHash: sig,
            network: parsedLog.network ?? 'Solana',
            swapId: parsedLog.swap_id ?? sig,
            tokenOutTxHash: sig,
            userWalletAddress: parsedLog.user_wallet_address ?? walletAddress,
            transactionTimestamp: parsedLog.transaction_timestamp ?? new Date().toISOString(),
            tokenInUsdAmount: display_token_in_usd_amount.toString() ?? '0',
            tokenOutAmount: display_token_out_lamports.toString() ?? '0',
        });

        toast.success('BIT10.SOL sold successfully!');
        return sig;
    } catch (error: any) {
        console.error(error);
        toast.error(error?.message ?? 'An error occurred while processing your request. Please try again!');
        throw error;
    }
};
