
/** @type {import('next').NextConfig} */

const isDevelopment = process.env.NODE_ENV === 'development';

const config = {
  /* config options here */
  transpilePackages: ['@bidexpert/ui', '@bidexpert/core'],
  typescript: {
    // Em desenvolvimento, ignoramos erros para não quebrar o HMR. Em produção, forçamos a verificação.
    ignoreBuildErrors: isDevelopment,
  },
  eslint: {
    // Em desenvolvimento, ignoramos erros para não quebrar o HMR. Em produção, forçamos a verificação.
    ignoreDuringBuilds: isDevelopment,
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
};

module.exports = config;
