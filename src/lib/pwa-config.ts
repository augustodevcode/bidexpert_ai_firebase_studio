// (D) PWA + RESPONSIVO (#31/#32)
// Configuração de manifest.json

export const manifestConfig = {
  name: 'BidExpert - Leilões Online',
  short_name: 'BidExpert',
  description: 'Plataforma completa de leilões online com IA, blockchain e integração com cartórios',
  start_url: '/',
  scope: '/',
  display: 'standalone',
  orientation: 'portrait-primary',
  theme_color: '#000000',
  background_color: '#ffffff',
  categories: ['business', 'productivity'],
  screenshots: [
    {
      src: '/screenshots/mobile-1.png',
      sizes: '540x720',
      type: 'image/png',
      form_factor: 'narrow',
    },
    {
      src: '/screenshots/desktop-1.png',
      sizes: '1280x720',
      type: 'image/png',
      form_factor: 'wide',
    },
  ],
  icons: [
    {
      src: '/icon-192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: '/icon-512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: '/icon-maskable-192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'maskable',
    },
    {
      src: '/icon-maskable-512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable',
    },
  ],
  shortcuts: [
    {
      name: 'Leilões Ativos',
      short_name: 'Leilões',
      description: 'Ver leilões em tempo real',
      url: '/auctions',
      icons: [
        {
          src: '/icon-auctions-96.png',
          sizes: '96x96',
          type: 'image/png',
        },
      ],
    },
    {
      name: 'Meus Lances',
      short_name: 'Lances',
      description: 'Histórico de lances realizados',
      url: '/my-bids',
      icons: [
        {
          src: '/icon-bids-96.png',
          sizes: '96x96',
          type: 'image/png',
        },
      ],
    },
    {
      name: 'Dashboard',
      short_name: 'Dashboard',
      description: 'Painel de controle pessoal',
      url: '/dashboard',
      icons: [
        {
          src: '/icon-dashboard-96.png',
          sizes: '96x96',
          type: 'image/png',
        },
      ],
    },
  ],
  share_target: {
    action: '/share',
    method: 'POST',
    enctype: 'multipart/form-data',
    params: {
      title: 'title',
      text: 'text',
      url: 'url',
      files: [
        {
          name: 'media',
          accept: ['image/*', 'video/*'],
        },
      ],
    },
  },
};

export type ManifestConfig = typeof manifestConfig;

// Viewport meta tags para responsive
export const viewportMetaTags = {
  viewport: 'width=device-width, initial-scale=1, viewport-fit=cover',
  themeColor: '#000000',
  appleStatusBarStyle: 'black-translucent',
  appleWebAppCapable: 'yes',
  appleWebAppTitle: 'BidExpert',
};

// Media query breakpoints
export const breakpoints = {
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// PWA Service Worker config
export const swConfig = {
  path: '/sw.js',
  cacheName: 'bidexpert-v1',
  precacheUrlsExclude: [/^\/admin\//, /^\/api\//],
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com\//,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts',
        expiration: {
          maxEntries: 20,
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        },
      },
    },
    {
      urlPattern: /^https:\/\/fonts\.gstatic\.com\//,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-webfonts',
        expiration: {
          maxEntries: 30,
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        },
      },
    },
    {
      urlPattern: /^\/api\/(auctions|lots|bids)/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 5 * 60, // 5 minutes
        },
      },
    },
  ],
};

// Offline fallback page
export const offlineFallbackPage = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Offline - BidExpert</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 12px;
      padding: 40px;
      max-width: 400px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      text-align: center;
    }
    h1 {
      color: #333;
      font-size: 24px;
      margin-bottom: 16px;
    }
    p {
      color: #666;
      font-size: 16px;
      line-height: 1.6;
      margin-bottom: 24px;
    }
    button {
      background: #667eea;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 6px;
      font-size: 16px;
      cursor: pointer;
      transition: background 0.3s;
    }
    button:hover { background: #764ba2; }
    .icon {
      font-size: 48px;
      margin-bottom: 16px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">📡</div>
    <h1>Sem Conexão</h1>
    <p>Você está offline. Algumas funcionalidades podem estar limitadas. Verifique sua conexão com a internet.</p>
    <button onclick="window.location.reload()">Tentar Novamente</button>
  </div>
</body>
</html>
`;
