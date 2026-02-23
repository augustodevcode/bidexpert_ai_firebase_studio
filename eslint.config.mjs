import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    ignores: [
      '**/node_modules/**',
      '.next/**',
      'dist/**',
      'build/**',
      'out/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
      '.vscode/**',
      '.idx/**',
      '.windsurf/**',
      '_Aiexclude/**',
      '_components_old/**',
      '.gemini/**',
      '.qoder/**',
      'tests/**',
      'scripts/**',
      '**/*.spec.ts',
      '**/*.test.ts',
      '**/*.log',
      'logs/**',
      '*.sql',
      'dataconnect/**',
      'dataconnect-generated/**',
      'prisma/migrations/**',
      'public/**',
      'docs/**',
      'context/**',
      // Additional ignores for non-source files
      'analisar/**',
      '*.js',
      '*.mjs',
      'openspec/**',
      'reports/**',
      'html/**',
      'prisma_chunks/**',
    ],
  },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_'
      }],
    },
  },
];

export default eslintConfig;
