import { env } from '@/env';
import { type NextRequest } from 'next/server';

export async function GET(request: NextRequest, context: { params: Promise<{ index_fund: string }> }) {
    const node_server = env.NODE_SERVER;
    const { index_fund } = await context.params;
    const url = `${node_server}/bit10-${index_fund}-current-price`;

    try {
        const res = await fetch(url)
        const data = await res.json() as { timestmpz: string, tokenPrice: number, data: { id: string, name: string, symbol: string, price: number, marketCap: number }[] }
        return new Response(JSON.stringify(data), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        })
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Error fetching data' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        })
    }
}
