
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
  // `serverExternalPackages` is used to tell Next.js not to bundle certain packages
  // that are intended to be run on the server, like 'firebase-admin'.
  serverExternalPackages: ['firebase-admin'],
  experimental: {
  },
  // Required for dev environments that proxy the dev server
  // Read more: https://nextjs.org/docs/app/api-reference/next-config-js/allowedDevOrigins
  allowedDevOrigins: ['https://6000-firebase-studio-1748711833657.cluster-ve345ymguzcd6qqzuko2qbxtfe.cloudworkstations.dev'],
  headers: async () => [
    {
      source: '/:path*',
      headers: [{ key: 'Content-Security-Policy', value: "default-src 'self'; frame-src 'self' https://www.google.com https://www.openstreetmap.org; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*; style-src 'self' 'unsafe-inline' https://*; img-src 'self' data: https://*; media-src https://*; font-src 'self' https://*; connect-src 'self' https://*; object-src 'none'; base-uri 'self'; form-action 'self';" }],
    },
  ],
};

export default nextConfig;
