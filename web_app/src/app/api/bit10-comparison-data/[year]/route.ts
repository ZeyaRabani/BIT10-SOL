import { env } from '@/env';
import { type NextRequest } from 'next/server';

interface Bit10ComparisonEntry {
    date: string;
    bit10Top: string;
    bit10Sol: string;
    btc: string;
    eth: string;
    sol: string;
    sp500: string;
    gold: string;
}

interface Bit10ComparisonResponse {
    bit10: Bit10ComparisonEntry[];
}

const FIXED_START_DATE = '2021-05-01';

export async function GET(request: NextRequest, context: { params: Promise<{ year: string }> }) {
    const node_server = env.NODE_SERVER;
    const { year } = await context.params;

    if (!year || isNaN(Number(year))) {
        return new Response(JSON.stringify({ error: 'Invalid or missing year parameter' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const url = `${node_server}/bit10-comparison?year=${year}`;

    try {
        const res = await fetch(url);
        if (!res.ok) {
            throw new Error(`Error fetching data: ${res.statusText}`);
        }

        const data = (await res.json()) as Bit10ComparisonResponse;

        let bit10 = data.bit10;

        if (Number(year) > 4) {
            bit10 = bit10.filter((entry) => entry.date >= FIXED_START_DATE);
        }

        const trimmedData: Bit10ComparisonResponse = { ...data, bit10 };

        return new Response(JSON.stringify(trimmedData), {
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
