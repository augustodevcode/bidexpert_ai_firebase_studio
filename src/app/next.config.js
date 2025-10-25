/** @type {import('next').NextConfig} */

console.log(`[next.config.js] LOG: Reading Next.js configuration for NODE_ENV: ${process.env.NODE_ENV}`);

const isDevelopment = process.env.NODE_ENV === 'development';

const config = {
  /* config options here */
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
    ],
  },
};

// A lógica original foi alterada para sempre habilitar os checks.
console.log(`[next.config.js] LOG: Strict build checks are now ENABLED for all environments.`);

module.exports = config;
