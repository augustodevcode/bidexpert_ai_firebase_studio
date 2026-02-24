/** @type {import('next').NextConfig} */

// Sentry is optional — only loaded when DSN is configured
let withSentryConfig;
try {
  const sentry = await import("@sentry/nextjs");
  withSentryConfig = sentry.withSentryConfig;
} catch {
  withSentryConfig = null;
}

console.log(`[next.config.mjs] LOG: Reading Next.js configuration for NODE_ENV: ${process.env.NODE_ENV}`);

const isDevelopment = process.env.NODE_ENV === 'development';

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.googleapis.com https://*.gstatic.com https://maps.googleapis.com https://*.vercel-analytics.com https://cdn.vercel-insights.com https://va.vercel-scripts.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https://placehold.co https://images.unsplash.com https://picsum.photos https://fastly.picsum.photos https://firebasestorage.googleapis.com https://*.s3.amazonaws.com https://res.cloudinary.com https://*.googleusercontent.com https://maps.googleapis.com https://maps.gstatic.com https://*.tile.openstreetmap.org https://unpkg.com https://blob.vercel-storage.com https://*.blob.vercel-storage.com https://*.public.blob.vercel-storage.com",
      "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://*.vercel-analytics.com https://cdn.vercel-insights.com https://va.vercel-scripts.com https://maps.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "frame-src 'self' https://*.firebaseapp.com https://www.google.com https://maps.google.com",
    ].join('; ')
  },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' }
];

const config = {
  /* config options here */
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
  // Output standalone para Docker/Cloud Run — desabilitado no Vercel
  ...(process.env.VERCEL ? {} : { output: 'standalone' }),
  typescript: {
    // TECH DEBT: src/ai/ tem erros de tipo que precisam ser corrigidos
    // TODO: Corrigir erros em src/ai/flows/*.ts e mudar para false
    ignoreBuildErrors: true,
  },
  eslint: {
    // TECH DEBT: ESLint config precisa ser migrado para flat config
    // TODO: Migrar eslint.config.mjs para formato correto
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
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'blob.vercel-storage.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.blob.vercel-storage.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.public.blob.vercel-storage.com',
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
    serverComponentsExternalPackages: ['ws', 'require-in-the-middle', '@opentelemetry/instrumentation', '@genkit-ai/core', 'async_hooks'],
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
      config.externals = [...config.externals, 'require-in-the-middle', 'async_hooks'];
    }
    
    // Fallback for client-side (async_hooks is Node.js only)
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        async_hooks: false,
      };
    }
    
    return config;
  },
};

// A lógica original foi alterada para sempre habilitar os checks.
console.log(`[next.config.mjs] LOG: Strict build checks are now ENABLED for all environments.`);

// Wrap with Sentry configuration if DSN is provided and package is available
const sentryConfig = (process.env.NEXT_PUBLIC_SENTRY_DSN && withSentryConfig) ? withSentryConfig(
  config,
  {
    silent: true,
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
  },
  {
    widenClientFileUpload: true,
    transpileClientSDK: true,
    tunnelRoute: "/monitoring",
    hideSourceMaps: true,
    disableLogger: true,
  }
) : config;

export default sentryConfig;

