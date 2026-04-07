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
    webpack: (config, { isServer }) => {
        config.resolve.alias = {
            ...config.resolve.alias,
            '@react-native-async-storage/async-storage': 'next/dist/compiled/react',
            'react-native': 'react-native-web',
        };

        config.externals.push({
            'pino-pretty': 'commonjs pino-pretty',
            'pino': 'commonjs pino'
        });

        if (isServer) {
            config.externals.push({
                'bufferutil': 'bufferutil',
                'utf-8-validate': 'utf-8-validate',
            });
        }

        return config;
    },
    compiler: {
        removeConsole: process.env.NODE_ENV === 'production'
    }
};

export default withNextIntl(config);
