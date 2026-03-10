<!--
  @fileoverview Documenta a correção de sanitização de tenant e fallback de schema drift para preview/Vercel,
  além das validações locais executadas em 2026-03-07.
-->

# Vercel Preview Tenant Hardening

## Objetivo

Corrigir dois problemas observados em preview/Vercel:

1. valores de tenant chegando com quebras de linha, como `demo\r\n`
2. falha de leitura de `PlatformSettings.featureFlags` quando a coluna ainda não existe na base remota

## Alterações aplicadas

- Criado helper centralizado `src/lib/tenant-token.ts` para sanitizar tokens de tenant/subdomínio vindos de env, headers e path.
- Aplicada sanitização em middleware, helpers de tenant, login e resolução do client Prisma.
- Adicionado fallback controlado para schema drift de `PlatformSettings.featureFlags` em preview/dev.
- Ajustado `vitest.setup.ts` para não quebrar testes unitários `node` por import estático de `@testing-library/jest-dom`.
- Ajustado `tests/e2e/global-setup.ts` para usar o helper canônico de autenticação.
- Ajustado `tests/e2e/comprehensive-smoke.spec.ts` para remover login inline frágil e usar `loginAsAdmin`.

## Validação executada

### Código

- `npm run typecheck` no worktree: OK
- `npm run test:unit -- tests/unit/tenant-token.test.ts tests/unit/db-resilience-schema.test.ts`: OK
- `npm run build`: OK quando executado com env mínimo explícito para `DATABASE_URL`, `SESSION_SECRET`, `NEXTAUTH_SECRET` e `AUTH_SECRET`

### Runtime local

- Smoke local em `http://demo.localhost:9006`: OK
- Login global Playwright em tenant `demo`: OK
- Endpoint `GET /api/public/tenants`: OK após subir o runtime com MySQL local correto

## Pendências identificadas fora da correção atual

- A suíte `tests/e2e/comprehensive-smoke.spec.ts` ainda expõe falhas antigas do painel administrativo local demo.
- O banco local `bidexpert_demo` estava com drift de schema; `prisma db push` reduziu parte dos erros, mas ainda restam telas administrativas com `500` e `404` não relacionadas à sanitização de tenant.
- O script `/_vercel/insights/script.js` gera `404` em runtime local; isso é ruído de ambiente local, não regressão da correção.

## Resultado desta iteração

- A cadeia de tenant ficou saneada fim a fim.
- O fallback para `PlatformSettings.featureFlags` está implementado para preview/dev.
- O smoke local mínimo passou.
- A suíte abrangente ainda não está verde por dívida pré-existente no ambiente/admin local.