/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Forçar a verificação de erros de TypeScript durante o build de desenvolvimento
    ignoreBuildErrors: false,
  },
  eslint: {
    // Forçar a verificação de erros do ESLint durante o build de desenvolvimento
    ignoreDuringBuilds: false,
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
