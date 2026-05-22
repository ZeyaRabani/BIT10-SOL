import { Connection, PublicKey } from '@solana/web3.js';
import { env } from '@/env';

const MINT_ADDRESS = 'bitQG7BVz72Gu5L99bYRrZxTmFj8NPaFpT2uPp47yew';

export async function GET() {
    try {
        const rpcUrl = env.NEXT_PUBLIC_SOLANA_RPC_URL ?? 'https://api.mainnet-beta.solana.com';

        const connection = new Connection(rpcUrl, 'confirmed');

        const mintPublicKey = new PublicKey(MINT_ADDRESS);
        const tokenSupply = await connection.getTokenSupply(mintPublicKey);

        return Response.json({
            supply: tokenSupply.value.uiAmount,
            decimals: tokenSupply.value.decimals,
            rawAmount: tokenSupply.value.amount,
            timestamp: new Date().toISOString(),
        });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        return Response.json(
            { error: 'Failed to fetch token supply' },
            { status: 500 }
        );
    }
}
