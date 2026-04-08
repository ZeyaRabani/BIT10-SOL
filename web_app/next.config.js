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
    compiler: {
        removeConsole: process.env.NODE_ENV === 'production'
    }
};

export default config;
