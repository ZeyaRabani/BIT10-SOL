import { type StaticImageData } from 'next/image';
import { PublicKey } from '@solana/web3.js';
import SOLImg from '@/assets/tokens/sol.svg';
import USDCImg from '@/assets/tokens/usdc.svg';
import BIT10Img from '@/assets/tokens/bit10.svg';

export const buyPayTokens = [
    { label: 'SOL', value: 'Solana', img: SOLImg as StaticImageData, address: 'So11111111111111111111111111111111111111112', tokenType: 'SPL', gasFee: 0, slug: ['solana'] },
    { label: 'USDC', value: 'USD Coin', img: USDCImg as StaticImageData, address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', tokenType: 'SPL', gasFee: 0, slug: ['usdc', 'stable', 'stable-coin', 'stable coin', 'stablecoin'] }
]

export const buyReceiveTokens = [
    { label: 'BIT10.SOL', value: 'BIT10.SOL', img: BIT10Img as StaticImageData, address: 'bitQG7BVz72Gu5L99bYRrZxTmFj8NPaFpT2uPp47yew', tokenType: 'SPL', gasFee: 0.001, slug: ['SOL crypto'] }
]

export const sellTokens = [
    { label: 'BIT10.SOL', value: 'BIT10.SOL', img: BIT10Img as StaticImageData, address: 'bitQG7BVz72Gu5L99bYRrZxTmFj8NPaFpT2uPp47yew', tokenType: 'SPL', gasFee: 0.001, slug: ['top crypto'] }
]

export const sellReceiveTokens = [
    { label: 'SOL', value: 'Solana', img: SOLImg as StaticImageData, address: 'So11111111111111111111111111111111111111112', tokenType: 'SPL', gasFee: 0, slug: ['solana'] }
]

export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const ROUTER_PROGRAM_ID = new PublicKey('7CQDVZbDr9DtmzjYUFK2SM1GEGGc4o2qeYoUBfFyYb9N');
export const ORACLE_ADDRESS = new PublicKey('2X3HQPE1oQfdpEvXieVPjVvafWcSxik2MALvXpPQK5Jc');
export const RECIPIENT_ADDRESS = new PublicKey('key4yrLZ9RFDMqE9sNKTZEvVsPQXmJg46s2ooTw45du');
export const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
export const BIT10_SOL_MINT = new PublicKey('bitQG7BVz72Gu5L99bYRrZxTmFj8NPaFpT2uPp47yew');
export const SOL_WRAPPED_MINT = new PublicKey('So11111111111111111111111111111111111111112');
