
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
        hostname: 'images.unsplash.com', // Adicionado hostname do Unsplash
        port: '',
        pathname: '/**',
      },
    ],
  },
  serverExternalPackages: ['firebase-admin'],
  experimental: {
  },
  allowedDevOrigins: [
    'https://6000-firebase-studio-1748711833657.cluster-ve345ymguzcd6qqzuko2qbxtfe.cloudworkstations.dev',
    'https://9000-firebase-studio-1748711833657.cluster-ve345ymguzcd6qqzuko2qbxtfe.cloudworkstations.dev',
    'https://3000-firebase-studio-1748711833657.cluster-ve345ymguzcd6qqzuko2qbxtfe.cloudworkstations.dev',
  ],
};

export default nextConfig;
