/** @type {import('next').NextConfig} */

console.log(`[next.config.mjs] LOG: Reading Next.js configuration for NODE_ENV: ${process.env.NODE_ENV}`);

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
  // PWA e responsividade: habilitar viewport automático
  swcMinify: true,
  compress: true,
  productionBrowserSourceMaps: false,
  // Node.js runtime para WebSocket (realtime bids)
  experimental: {
    serverComponentsExternalPackages: ['ws', 'require-in-the-middle', '@opentelemetry/instrumentation', '@genkit-ai/core'],
  },
  // Webpack configuration to suppress handlebars and require-in-the-middle warnings
  webpack: (config, { isServer }) => {
    // Suppress specific warnings for dependencies that use require.extensions
    if (config.ignoreWarnings === undefined) {
      config.ignoreWarnings = [];
    }
    config.ignoreWarnings.push(
      /require\.extensions is not supported by webpack/,
      /Critical dependency: require function is used/,
      /require-in-the-middle/
    );
    
    // Exclude problematic modules from being parsed
    if (!config.externals) {
      config.externals = [];
    }
    
    if (isServer) {
      // Mark require-in-the-middle as external on server
      config.externals = [...config.externals, 'require-in-the-middle'];
    }
    
    return config;
  },
};

// A lógica original foi alterada para sempre habilitar os checks.
console.log(`[next.config.mjs] LOG: Strict build checks are now ENABLED for all environments.`);

export default config;

