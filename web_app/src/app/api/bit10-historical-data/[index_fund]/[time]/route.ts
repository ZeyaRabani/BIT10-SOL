import { env } from '@/env';
import { type NextRequest } from 'next/server';

export async function GET(request: NextRequest, context: { params: Promise<{ index_fund: string; time: string }> }) {
    const node_server = env.NODE_SERVER;
    const { index_fund, time } = await context.params;

    if (!index_fund) {
        return new Response(JSON.stringify({ error: 'Invalid or missing index_fund parameter' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    if (!time || isNaN(Number(time))) {
        return new Response(JSON.stringify({ error: 'Invalid or missing time parameter' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const url = `${node_server}/bit10-${index_fund}?day=${time}&format=day`;

    try {
        const res = await fetch(url);
        if (!res.ok) {
            throw new Error(`Error fetching data: ${res.statusText}`);
        }

        const data = (await res.json()) as {
            timestmpz: string;
            tokenPrice: number;
        };

        return new Response(JSON.stringify(data), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        const errorMessage = (error as Error).message;
        return new Response(JSON.stringify({ error: 'Error fetching data', details: errorMessage }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
