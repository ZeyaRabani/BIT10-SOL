import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { type Metadata } from 'next';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function constructMetadata({
  title = 'BIT10',
  description = 'Diversified crypto index funds. On-chain. Auto-rebalanced. Built for the next wave of investing.',
  // image = '/assets/thumbnails/thumbnail.png',
  icons = '/favicon.ico',
  noIndex = false
}: {
  title?: string;
  description?: string;
  image?: string;
  icons?: string;
  noIndex?: boolean;
} = {}): Metadata {
  return {
    title,
    description,
    openGraph: {
      title, description,
      // images: [{url: image}]
    },
    twitter: { card: 'summary_large_image', title, description, creator: '@bit10app' },
    icons,
    metadataBase: new URL('https://www.bit10.app'),
    ...(noIndex && { robots: { index: false, follow: false } }),
  };
}

export const formatAddress = (id: string) => {
  if (!id) return '';
  if (id.length <= 7) return id;
  return `${id.slice(0, 8)}.....${id.slice(-8)}`;
};

export const formatCompactNumber = (value: number | string | null | undefined): string => {
  let numValue: number;
  if (typeof value === 'string') numValue = parseFloat(value);
  else numValue = value!;
  if (!numValue || isNaN(numValue)) return '0';
  if (numValue === 0) return '0';

  const absValue = Math.abs(numValue), isNegative = numValue < 0, sign = isNegative ? '-' : '';

  if (absValue < 0.00000001 && absValue > 0) {
    const scientific = absValue.toExponential(4), cleanScientific = scientific.replace('e+', 'e').replace('e-0', 'e-').replace(/e-(\d)$/, 'e-$1');
    return sign + cleanScientific;
  }

  if (absValue < 1) {
    const strValue = absValue.toFixed(20), [, decimalPart = ''] = strValue.split('.'), firstNonZeroIndex = decimalPart.search(/[1-9]/);
    if (firstNonZeroIndex === -1) return '0';
    const significantDecimals = decimalPart.slice(0, firstNonZeroIndex + 4), formatted = parseFloat(`0.${significantDecimals}`);
    let result = formatted.toFixed(Math.min(firstNonZeroIndex + 4, 8)).replace(/\.?0+$/, '');
    if (parseFloat(result) >= 1) result = '1.0000';
    return sign + result;
  }

  if (absValue < 1000) return sign + (Math.round(absValue * 10000) / 10000).toFixed(4).replace(/\.?0+$/, '');
  if (absValue < 1_000_000) {
    const integerPart = Math.floor(absValue), decimalPart = absValue - integerPart, formattedInteger = integerPart.toLocaleString('en-US'), decimalStr = decimalPart.toFixed(6).slice(2).replace(/0+$/, '');
    return sign + formattedInteger + (decimalStr ? '.' + decimalStr : '');
  }

  if (absValue < 1_000_000_000) return sign + (absValue / 1_000_000).toFixed(2).replace(/\.?0+$/, '') + 'M';
  if (absValue < 1_000_000_000_000) return sign + (absValue / 1_000_000_000).toFixed(2).replace(/\.?0+$/, '') + 'B';
  if (absValue < 1e15) return sign + (absValue / 1_000_000_000_000).toFixed(2).replace(/\.?0+$/, '') + 'T';

  const scientific = absValue.toExponential(2), cleanScientific = scientific.replace('e+', 'e').replace('e+0', 'e');
  return sign + cleanScientific;
};

export const formatCompactPercentNumber = (value: number | string | null | undefined): string => {
  let numValue: number;
  if (typeof value === 'string') numValue = parseFloat(value);
  else numValue = value!;
  if (!numValue || isNaN(numValue)) return '0';
  if (numValue === 0) return '0';

  const absValue = Math.abs(numValue), isNegative = numValue < 0, sign = isNegative ? '-' : '';

  if (absValue < 0.00000001 && absValue > 0) {
    const scientific = absValue.toExponential(2), cleanScientific = scientific.replace('e+', 'e').replace('e-0', 'e-').replace(/e-(\d)$/, 'e-$1');
    return sign + cleanScientific;
  }

  if (absValue < 1) {
    const strValue = absValue.toFixed(20), [, decimalPart = ''] = strValue.split('.'), firstNonZeroIndex = decimalPart.search(/[1-9]/);
    if (firstNonZeroIndex === -1) return '0';

    const decimalsNeeded = firstNonZeroIndex + 4;
    const formatted = absValue.toFixed(decimalsNeeded).replace(/\.?0+$/, '');
    return sign + formatted;
  }

  if (absValue < 1000) return sign + (Math.round(absValue * 10000) / 10000).toFixed(2).replace(/\.?0+$/, '');
  if (absValue < 1_000_000) {
    const integerPart = Math.floor(absValue), decimalPart = absValue - integerPart, formattedInteger = integerPart.toLocaleString('en-US'), decimalStr = decimalPart.toFixed(6).slice(2).replace(/0+$/, '');
    return sign + formattedInteger + (decimalStr ? '.' + decimalStr : '');
  }

  if (absValue < 1_000_000_000) return sign + (absValue / 1_000_000).toFixed(2).replace(/\.?0+$/, '') + 'M';
  if (absValue < 1_000_000_000_000) return sign + (absValue / 1_000_000_000).toFixed(2).replace(/\.?0+$/, '') + 'B';
  if (absValue < 1e15) return sign + (absValue / 1_000_000_000_000).toFixed(2).replace(/\.?0+$/, '') + 'T';

  const scientific = absValue.toExponential(2), cleanScientific = scientific.replace('e+', 'e').replace('e+0', 'e');
  return sign + cleanScientific;
};

export const formatPreciseDecimal = (value: number | string | null | undefined): string => {
  let numValue: number;
  if (typeof value === 'string') numValue = parseFloat(value);
  else numValue = value!;
  if (!numValue || isNaN(numValue)) return '0';
  if (numValue === 0) return '0';

  const strValue = numValue.toFixed(10).replace(/\.?0+$/, ''), [integerPart, decimalPart = ''] = strValue.split('.'), formattedInteger = Number(integerPart).toLocaleString();
  if (!decimalPart) return formattedInteger || '0';
  const firstNonZeroIndex = decimalPart.search(/[1-9]/);
  if (firstNonZeroIndex === -1) return formattedInteger || '0';
  const trimmedDecimal = decimalPart.slice(0, firstNonZeroIndex + 4);
  return `${formattedInteger}.${trimmedDecimal}`;
};

export const formatDate = (dateInput: string | bigint | number | Date): string => {
  let date: Date;

  if (typeof dateInput === 'string' || typeof dateInput === 'number') {
    const inputStr = dateInput.toString();
    const timestamp = inputStr.length > 13
      ? Number(inputStr.slice(0, 13))
      : Number(inputStr);
    date = new Date(timestamp);
  } else if (typeof dateInput === 'bigint') {
    const timestamp = Number(dateInput / 1000000n);
    date = new Date(timestamp);
  } else {
    date = new Date(dateInput);
  };

  const addOrdinalSuffix = (day: number): string => {
    if (day >= 11 && day <= 13) return day + 'th';
    const lastDigit = day % 10;
    if (lastDigit === 1) return day + 'st';
    if (lastDigit === 2) return day + 'nd';
    if (lastDigit === 3) return day + 'rd';
    return day + 'th';
  };

  const day = date.getDate();
  const formattedDay = addOrdinalSuffix(day);
  const month = date.toLocaleString(undefined, { month: 'long' });
  const year = date.getFullYear();

  const hour = date.getHours();
  const formattedHour = hour % 12 === 0 ? 12 : hour % 12;
  const minute = date.getMinutes().toString().padStart(2, '0');
  const period = hour < 12 ? 'AM' : 'PM';

  return `${formattedDay} ${month} ${year} at ${formattedHour}:${minute} ${period}`;
};

export const getTokenName = (tokenAddress: string): string => {
  if (!tokenAddress) {
    return 'Unknown Token';
  }

  const normalizedAddress = tokenAddress.toLowerCase();

  switch (normalizedAddress) {
    case 'So11111111111111111111111111111111111111112'.toLocaleLowerCase():
      return 'SOL';
    case 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'.toLocaleLowerCase():
      return 'USDC';
    case 'bitQG7BVz72Gu5L99bYRrZxTmFj8NPaFpT2uPp47yew'.toLocaleLowerCase():
      return 'BIT10.SOL';
    default:
      return tokenAddress;
  }
};

export const getTokenExplorer = (tokenAddress: string): string => {
  const normalizedAddress = tokenAddress.toLowerCase();

  switch (normalizedAddress) {
    case 'So11111111111111111111111111111111111111112'.toLocaleLowerCase():
    case 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'.toLocaleLowerCase():
    case 'bitQG7BVz72Gu5L99bYRrZxTmFj8NPaFpT2uPp47yew'.toLocaleLowerCase():
      return 'https://explorer.solana.com/tx/';
    default:
      return 'https://explorer.solana.com/tx/';
  }
};
