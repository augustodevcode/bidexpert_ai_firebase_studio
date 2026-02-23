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
      '*.js',
      'temp_*.js',
      'check-*.js',
      'test*.js',
      'dataconnect/**',
      'dataconnect-generated/**',
      'prisma/migrations/**',
      'public/**',
      'docs/**',
      'context/**',
      'html/**',
      'playwright-report-media-local/**',
      'playwright-report/**',
    ],
  },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-this-alias': 'off',
      'react/no-unescaped-entities': 'off',
    },
  },
];

export default eslintConfig;
