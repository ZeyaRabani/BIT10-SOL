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
