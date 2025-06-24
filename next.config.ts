
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
  serverActions: {
    bodySizeLimit: '10mb',
  },
  serverExternalPackages: ['firebase-admin'],
  experimental: {
  },
  allowedDevOrigins: ['https://6000-firebase-studio-1748711833657.cluster-ve345ymguzcd6qqzuko2qbxtfe.cloudworkstations.dev'],
  headers: async () => [
    {
      source: '/:path*',
      headers: [{ key: 'Content-Security-Policy', value: "default-src 'self'; frame-src 'self' https://www.google.com https://www.openstreetmap.org; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*; style-src 'self' 'unsafe-inline' https://*; img-src 'self' data: https://*; media-src https://*; font-src 'self' https://*; connect-src 'self' https://*; object-src 'none'; base-uri 'self'; form-action 'self';" }],
    },
     {
      source: "/api/:path*",
      headers: [
        { key: "Access-Control-Allow-Credentials", value: "true" },
        { key: "Access-Control-Allow-Origin", value: "*" },
        { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
        { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" },
      ]
    }
  ],
};

export default nextConfig;
