/** @type {import('next').NextConfig} */

console.log(`[next.config.mjs] LOG: Reading Next.js configuration for NODE_ENV: ${process.env.NODE_ENV}`);

const isDevelopment = process.env.NODE_ENV === 'development';

const config = {
  /* config options here */
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
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

console.log(`[next.config.mjs] LOG: Strict build checks are ${isDevelopment ? 'DISABLED' : 'ENABLED'}.`);

export default config;
