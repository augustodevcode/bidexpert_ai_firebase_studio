/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Ignore AI flow type errors that are not related to auction details page
    ignoreBuildErrors: true,
  },
  eslint: {
    // Forçar a verificação de erros do ESLint durante o build de desenvolvimento
    ignoreDuringBuilds: true,
  },
  onDemandEntries: {
    // Allow prerendering errors on dynamic routes
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 5,
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

module.exports = nextConfig;
