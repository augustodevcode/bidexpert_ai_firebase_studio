// jest.config.js
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
});

// Add any custom config to be passed to Jest
/** @type {import('jest').Config} */
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'], // Opcional: para setup adicional
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    // Handle CSS imports (e.g., if you use CSS Modules)
    '^.+\\.module\\.(css|sass|scss)$': 'identity-obj-proxy',
    // Handle other static assets
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/__mocks__/fileMock.js',
    // Alias para caminhos (ajustar conforme tsconfig.json)
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  // Se estiver usando ts-jest diretamente, descomente e ajuste:
  // preset: 'ts-jest',
  // transform: {
  //   '^.+\\.(ts|tsx)?$': ['ts-jest', { tsconfig: 'tsconfig.jest.json' }],
  //   '^.+\\.(js|jsx)$': 'babel-jest',
  // },
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.{js,jsx,ts,tsx}', // Excluir arquivos index se forem apenas re-exports
    '!src/pages/_app.tsx', // Excluir arquivos específicos de config do Next
    '!src/pages/_document.tsx',
    '!src/lib/firebase.ts', // Excluir inicialização do Firebase
    '!src/lib/firebase/admin.ts',
    '!src/ai/**/*', // Excluir pasta de IA por enquanto
    '!src/types/**/*', // Excluir definições de tipos
    '!src/lib/sample-data.ts', // Excluir dados de exemplo
    '!**/node_modules/**',
    '!<rootDir>/scripts/**', // Excluir scripts
    '!<rootDir>/public/**',
    '!<rootDir>/.next/**',
    '!<rootDir>/.firebase/**',
    '!<rootDir>/coverage/**',
    '!<rootDir>/*.config.js',
    '!<rootDir>/*.config.ts',
    '!<rootDir>/*.config.mjs',
  ],
  coverageThreshold: { // Exemplo de configuração de threshold
    global: {
      branches: 5, // Mínimo de 5% para branches
      functions: 5,
      lines: 5,
      statements: 5,
    },
  },
};

module.exports = createJestConfig(customJestConfig);
