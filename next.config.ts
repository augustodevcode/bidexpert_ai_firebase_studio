
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // `serverExternalPackages` is used to tell Next.js not to bundle certain packages
  // that are intended to be run on the server, like 'firebase-admin'.
  serverExternalPackages: ['firebase-admin'],
  experimental: {
  },
  headers: async () => [
    {
      source: '/:path*',
      headers: [{ key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*; style-src 'self' 'unsafe-inline' https://*; img-src 'self' data: https://*; media-src https://*; font-src 'self' https://*; connect-src 'self' https://*; object-src 'none'; base-uri 'self'; form-action 'self';" }],
    },
  ],
};

export default nextConfig;
