/** @type {import('next').NextConfig} */

console.log("[next.config.js] LOG: Reading Next.js configuration.");

const config = {
  /* config options here */
  typescript: {
    // Definido como 'false' para FORÇAR a exibição de erros de TypeScript durante o build.
    // Isso impede que a compilação prossiga se houver erros de tipo.
    ignoreBuildErrors: false,
  },
  eslint: {
    // Definido como 'false' para FORÇAR a exibição de erros do ESLint durante o build.
    // Garante a qualidade e a padronização do código.
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
  // Adicionado para resolver o aviso de Cross-Origin
  experimental: {
    allowedDevOrigins: [
      "https://6000-firebase-studio-1748711833657.cluster-ve345ymguzcd6qqzuko2qbxtfe.cloudworkstations.dev"
    ],
  },
};

console.log("[next.config.js] LOG: Strict build checks (ignoreBuildErrors, ignoreDuringBuilds) are set to 'false'.");

module.exports = config;
