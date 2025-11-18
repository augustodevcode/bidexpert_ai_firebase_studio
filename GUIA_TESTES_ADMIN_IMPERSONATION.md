# Guia Rápido - Testes Atualizados Admin Impersonation

## Pré-requisitos

Certifique-se de que o ambiente está configurado:

```bash
# Instalar dependências (se necessário)
npm install

# Verificar que o Playwright está instalado
npx playwright --version
```

## Executar Testes

### 1. Todos os Testes E2E

```bash
npm run test:e2e
```

### 2. Apenas Testes de Impersonação de Advogado

```bash
# Executar testes de impersonação
npx playwright test tests/e2e/admin/lawyer-impersonation.spec.ts

# Com relatório visual
npx playwright test tests/e2e/admin/lawyer-impersonation.spec.ts --reporter=html

# Com interface do Playwright
npx playwright test tests/e2e/admin/lawyer-impersonation.spec.ts --ui

# Modo debug
npx playwright test tests/e2e/admin/lawyer-impersonation.spec.ts --debug
```

### 3. Testes do Dashboard do Advogado (Original)

```bash
# Verificar que testes existentes ainda funcionam
npx playwright test tests/e2e/lawyer-dashboard.spec.ts
```

### 4. Todos os Testes Admin

```bash
# Executar todos os testes da pasta admin
npx playwright test tests/e2e/admin/
```

## Verificar Compilação TypeScript

```bash
# Verificar erros de TypeScript
npx tsc --noEmit

# Ou usar o script do package.json (se configurado)
npm run type-check
```

## Executar Aplicação Localmente

```bash
# Desenvolvimento
npm run dev

# Build de produção
npm run build

# Executar build
npm start
```

## Estrutura de Testes

### Novos Testes Adicionados

```
tests/e2e/admin/
└── lawyer-impersonation.spec.ts  ← NOVO
    ├── Admin - Impersonação de Advogado
    │   ├── admin pode acessar o painel do advogado
    │   ├── exibe seletor de impersonação para administradores
    │   ├── admin pode selecionar um advogado
    │   ├── admin pode voltar para seu próprio painel
    │   └── painel carrega métricas ao impersonar
    └── Admin - Permissões de Impersonação
        └── usuário não-admin não vê seletor
```

### Testes Existentes (não modificados)

```
tests/e2e/
├── lawyer-dashboard.spec.ts
├── admin/
│   ├── all-entities.spec.ts
│   ├── assets-crud.spec.ts
│   ├── auctions-crud.spec.ts
│   └── ...
└── ...
```

## Credenciais de Teste

### Admin
- Email: `admin@bidexpert.com.br`
- Senha: `Admin@12345`

### Advogado
- Email: `advogado@bidexpert.com.br`
- Senha: `Test@12345`

## URLs de Teste

- Dashboard do Advogado: `http://localhost:9005/lawyer/dashboard`
- Login: `http://localhost:9005/auth/login`
- Admin: `http://localhost:9005/admin`

## Test IDs Importantes

### Novos Test IDs (Impersonação)
- `lawyer-impersonation-selector` - Card do seletor de impersonação
- `lawyer-select-trigger` - Botão para abrir dropdown
- `lawyer-option-self` - Opção "Meu próprio painel"
- `lawyer-option-{id}` - Opções de advogados (substitua {id})

### Test IDs Existentes (Dashboard)
- `lawyer-dashboard-root` - Container principal
- `lawyer-dashboard-title` - Título do painel
- `lawyer-dashboard-subtitle` - Subtítulo
- `lawyer-metric-active-cases` - Métrica de casos ativos
- `lawyer-metric-hearings-week` - Audiências da semana
- `lawyer-metric-documents-pending` - Documentos pendentes
- `lawyer-metric-portfolio-value` - Valor em carteira
- `lawyer-cases-card` - Card da carteira jurídica
- `lawyer-case-row` - Linha de processo
- `lawyer-monetization-card` - Card de monetização
- `lawyer-task-item` - Item de tarefa
- `lawyer-hearings-card` - Card de audiências
- `lawyer-hearing-item` - Item de audiência
- `lawyer-documents-card` - Card de documentos
- `lawyer-document-item` - Item de documento

## Cenários de Teste

### Cenário 1: Admin Visualiza Painel de Advogado

```typescript
// 1. Login como admin
await loginAsAdmin(page);

// 2. Navegar para dashboard do advogado
await page.goto('/lawyer/dashboard');

// 3. Verificar seletor está visível
await expect(page.getByTestId('lawyer-impersonation-selector')).toBeVisible();

// 4. Selecionar advogado
await page.getByTestId('lawyer-select-trigger').click();
await page.locator('[data-testid^="lawyer-option-"]').first().click();

// 5. Verificar modo impersonação
await expect(page.getByText(/visualizando o painel como administrador/i)).toBeVisible();
```

### Cenário 2: Advogado Regular Sem Impersonação

```typescript
// 1. Login como advogado
await loginAsLawyer(page);

// 2. Navegar para dashboard
await page.goto('/lawyer/dashboard');

// 3. Verificar seletor NÃO está visível
await expect(page.getByTestId('lawyer-impersonation-selector')).not.toBeVisible();
```

## Troubleshooting

### Erro: "PowerShell 6+ is not available"
**Solução**: O sistema está usando PowerShell 5.1 (Windows padrão). Os comandos devem funcionar normalmente.

### Erro: Testes falhando
**Verificar**:
1. Aplicação está rodando? `npm run dev`
2. Porta correta? Padrão é `9005`
3. Banco de dados populado? Verificar seed

### Erro: Test IDs não encontrados
**Verificar**:
1. Componentes foram atualizados corretamente
2. Build foi executado após mudanças: `npm run build`
3. Cache do navegador limpo

### Erro: Permissões negadas
**Verificar**:
1. Usuário de teste tem role de admin
2. Sistema de permissões está configurado
3. Banco de dados tem dados de seed corretos

## Relatórios

### Gerar Relatório HTML

```bash
# Executar testes e gerar relatório
npx playwright test --reporter=html

# Abrir relatório
npx playwright show-report
```

### Relatório JSON

```bash
npx playwright test --reporter=json --output=test-results.json
```

### Screenshots e Vídeos

Por padrão, Playwright captura:
- Screenshots em falhas
- Vídeos de testes (se configurado)

Localização: `test-results/` e `playwright-report/`

## Comandos Úteis

```bash
# Limpar resultados anteriores
rm -rf test-results/ playwright-report/

# Executar em modo headed (com navegador visível)
npx playwright test --headed

# Executar em navegador específico
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Executar teste específico
npx playwright test -g "admin pode selecionar um advogado"

# Atualizar snapshots (se houver)
npx playwright test --update-snapshots
```

## Integração Contínua

### GitHub Actions (exemplo)

```yaml
- name: Install dependencies
  run: npm ci

- name: Install Playwright
  run: npx playwright install --with-deps

- name: Run Playwright tests
  run: npm run test:e2e

- name: Upload test results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## Documentação Adicional

- [Documentação Completa](./docs/ADMIN_IMPERSONATION_FEATURE.md)
- [Resumo de Implementação](./IMPLEMENTACAO_ADMIN_IMPERSONATION.md)
- [Playwright Docs](https://playwright.dev/)

## Suporte

Em caso de problemas:
1. Verificar logs do console
2. Revisar documentação
3. Verificar issues conhecidos
4. Contactar equipe de desenvolvimento
