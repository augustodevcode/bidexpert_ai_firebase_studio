import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  external: [
    'react',
    'react-dom',
    'next',
    'next/image',
    'next/link',
    'next/navigation',
    '@prisma/client',
    'uuid',
    'date-fns',
    'date-fns/locale',
    'next/cache',
  ],
});