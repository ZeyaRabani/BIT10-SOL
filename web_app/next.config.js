/** 
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful 
 * for Docker builds. 
 */
/** @type {import('next').NextConfig} */
const config = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**',
            },
        ],
    },
    async redirects() {
        return [
            {
                source: '/gitbook',
                destination: 'https://gitbook.bit10.app',
                permanent: true,
            },
            {
                source: '/twitter',
                destination: 'https://twitter.com/bit10app',
                permanent: true,
            },
            {
                source: '/telegram',
                destination: 'https://t.me/+7LRp1ZtAlt45ZjY0',
                permanent: true,
            }
        ]
    },
    async rewrites() {
        return [
            {
                source: '/bit10-comparison-data-:time',
                destination: '/api/bit10-comparison-data/:time*',
            },
            {
                source: '/bit10-latest-price-:index_fund',
                destination: '/api/bit10-latest-price/:index_fund',
            },
            {
                source: '/bit10-historical-data-:index_fund-:time',
                destination: '/api/bit10-historical-data/:index_fund/:time',
            },
        ]
    },
    compiler: {
        removeConsole: process.env.NODE_ENV === 'production'
    }
};

export default config;
