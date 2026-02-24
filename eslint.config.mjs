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
    linterOptions: {
      reportUnusedDisableDirectives: 'off',
    },
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
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-wrapper-object-types': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/prefer-as-const': 'off',
      'prefer-const': 'off',
      'react-hooks/rules-of-hooks': 'off',
      'react-hooks/exhaustive-deps': 'off',
      'react/jsx-no-undef': 'off',
      'react/no-deprecated': 'off',
      '@next/next/no-img-element': 'off',
      '@next/next/no-page-custom-font': 'off',
      'jsx-a11y/alt-text': 'off',
      'react/no-unescaped-entities': 'off',
    },
  },
];

export default eslintConfig;
