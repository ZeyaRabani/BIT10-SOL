import { toast } from 'sonner';
import { getCustomConnection } from './solana.client';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getAssociatedTokenAddress, getAccount, TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import { formatCompactNumber } from '@/lib/utils';

export const fetchTokenBalance = async ({ tokenAddress, publicKey }: { tokenAddress: string; publicKey: PublicKey; }): Promise<number> => {
    const customConnection = getCustomConnection();

    let decimals;
    if (tokenAddress === 'So11111111111111111111111111111111111111112') {
        decimals = 9;
    } else if (tokenAddress === 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v') {
        decimals = 6;
    } else {
        decimals = 9;
    }

    try {
        if (tokenAddress === 'So11111111111111111111111111111111111111112') {
            let balance: number | undefined;
            let retries = 3;

            while (retries > 0) {
                try {
                    balance = await customConnection.getBalance(publicKey);
                    break;
                } catch (err) {
                    retries--;
                    if (retries === 0) throw err;
                    await new Promise((resolve) =>
                        setTimeout(resolve, 1000 * (4 - retries))
                    );
                }
            }

            if (balance === undefined) {
                throw new Error('Failed to fetch balance after retries');
            }

            const balanceSOL = formatCompactNumber(balance / LAMPORTS_PER_SOL);
            return Number(balanceSOL);
        } else {
            const tokenAddressPublicKey = new PublicKey(tokenAddress);

            const programsToTry = [
                { programId: TOKEN_PROGRAM_ID, name: 'Token Program' },
                { programId: TOKEN_2022_PROGRAM_ID, name: 'Token-22 Program' },
            ];

            for (const { programId, name } of programsToTry) {
                try {
                    const associatedTokenAddress = await getAssociatedTokenAddress(tokenAddressPublicKey, publicKey, false, programId);
                    const tokenAccount = await getAccount(customConnection, associatedTokenAddress, 'confirmed', programId);
                    const balance = parseFloat(tokenAccount.amount.toString()) / 10 ** decimals;
                    return Number(balance.toFixed(decimals));
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : String(error);

                    if (
                        errorMessage.includes('could not find account') ||
                        errorMessage.includes('Account not found') ||
                        errorMessage.includes('TokenAccountNotFoundError') ||
                        errorMessage.includes('owner does not match')
                    ) {
                        if (programId === TOKEN_2022_PROGRAM_ID) {
                            return 0;
                        }
                        continue;
                    }

                    if (programId === TOKEN_2022_PROGRAM_ID) {
                        return 0;
                    }
                    continue;
                }
            }

            return 0;
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);

        if (errorMessage.includes('403')) {
            toast.error('RPC access forbidden. Please check your connection settings.');
        } else {
            console.error('Detailed error:', errorMessage);
            if (!errorMessage.includes('TokenAccountNotFoundError')) {
                toast.error('Error fetching balance. Please try again.');
            }
        }
        return 0;
    }
};
