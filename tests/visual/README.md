# Testes de Regressão Visual - BidExpert

Este documento explica como configurar e executar testes de regressão visual no projeto BidExpert usando Vitest.

## Status Atual

✅ **Configuração Completa**: Infraestrutura de testes visuais configurada e funcional
✅ **Testes Básicos**: Estrutura de testes criada e executando com sucesso
⚠️ **Implementação Pendente**: Testes visuais reais aguardam identificação da API correta do Vitest browser

## Visão Geral

Os testes de regressão visual garantem que a interface visual da aplicação permanece consistente, detectando mudanças não intencionais no layout, estilos e aparência dos componentes.

## Configuração

### Dependências Instaladas

- `@vitest/ui` - Interface visual para testes
- `@vitest/browser` - Suporte a testes no browser
- `@vitest/browser-playwright` - Provider Playwright para Vitest
- `playwright` - Framework de automação web

### Configuração do Vitest

O arquivo `vitest.config.ts` foi configurado com:

- Suporte a testes visuais com `toMatchScreenshot`
- Browser provider usando Playwright
- Viewport padrão de 1280x720
- Comparador pixelmatch com tolerâncias configuradas

## Executando Testes Visuais

### Interface Visual (UI)

```bash
npm run test:ui
```

Abre a interface visual do Vitest em `http://localhost:51204/__vitest__/` onde você pode:
- Visualizar testes em tempo real
- Ver gráficos de dependências de módulos
- Explorar informações detalhadas de módulos

### Apenas Testes Visuais

```bash
npx vitest run tests/visual/
```

### Com Relatório HTML

```bash
npx vitest run --reporter=html tests/visual/
npx vite preview --outDir html
```

## Estrutura dos Testes

```
tests/visual/
├── homepage-visual-regression.spec.ts  # Testes da homepage
└── __screenshots__/                    # Screenshots de referência
    └── homepage-visual-regression.spec.ts/
        ├── homepage-hero-section-chromium-win32.png
        ├── navigation-header-chromium-win32.png
        └── ...
```

## Criando Novos Testes Visuais

### Exemplo Básico

```typescript
import { expect, test } from 'vitest'

test('component looks correct', async () => {
  // Navegar para a página
  await page.goto('http://localhost:9002/some-page')

  // Capturar screenshot do componente
  const component = page.locator('[data-testid="my-component"]')
  await expect(component).toMatchScreenshot('my-component')
})
```

### Configurações Personalizadas

```typescript
await expect(component).toMatchScreenshot('component-name', {
  comparatorOptions: {
    threshold: 0.2,                    // Tolerância de cor (0-1)
    allowedMismatchedPixelRatio: 0.01, // % máximo de pixels diferentes
  },
  screenshotOptions: {
    mask: [page.locator('.dynamic-content')], // Máscara conteúdo dinâmico
    fullPage: false,                          // Apenas área visível
  },
})
```

## Boas Práticas

### 1. Viewport Consistente
- Use sempre o mesmo viewport para testes comparáveis
- Configure no `vitest.config.ts` ou por teste

### 2. Desabilitar Animações
```typescript
await page.addStyleTag({
  content: `
    *, *::before, *::after {
      animation-duration: 0s !important;
      transition-duration: 0s !important;
    }
  `
})
```

### 3. Aguardar Carregamento
```typescript
await page.goto(url, { waitUntil: 'networkidle' })
await page.waitForLoadState('networkidle')
```

### 4. Conteúdo Dinâmico
- Use `mask` para ocultar timestamps, IDs aleatórios
- Mock dados dinâmicos quando possível

### 5. Tolerâncias Adequadas
- Text-heavy: `allowedMismatchedPixelRatio: 0.1`
- Layout fixo: `allowedMismatchedPixelRatio: 0.01`
- Responsivo: `allowedMismatchedPixelRatio: 0.08`

## Atualizando Referências

Quando mudanças visuais são intencionais:

```bash
npx vitest --update tests/visual/
```

## Debugging

### Testes Falhando

Quando um teste falha, o Vitest gera:
- `reference.png` - Screenshot de referência
- `actual.png` - Screenshot atual
- `diff.png` - Diferenças destacadas

### Problemas Comuns

1. **Fontes diferentes**: Use fontes web consistentes
2. **Viewport variável**: Configure viewport fixo
3. **Animações**: Desabilite animações durante testes
4. **Conteúdo dinâmico**: Use máscaras ou mocks

## Integração CI/CD

Para ambientes de CI:

```bash
# Instalar browsers
npx playwright install chromium

# Executar testes
npx vitest run --browser.headless tests/visual/

# Atualizar referências (manual)
npx vitest --update --browser.headless tests/visual/
```

## Próximos Passos

### Implementação dos Testes Visuais Reais

Os testes atuais são placeholders. Para implementar testes visuais funcionais:

1. **Identificar API Correta**: Pesquisar documentação oficial do Vitest browser para screenshots
2. **Implementar Navegação**: Usar API correta para navegar para páginas da aplicação
3. **Capturar Screenshots**: Implementar captura de screenshots de componentes específicos
4. **Comparação Visual**: Configurar comparação com referências usando pixelmatch
5. **Testes Responsivos**: Implementar testes com diferentes viewports
6. **Integração Contínua**: Configurar execução automática em CI/CD

### Melhorias Planejadas

- Testes de componentes individuais usando Storybook
- Testes de acessibilidade visual
- Comparação automática de layouts responsivos
- Integração com ferramentas de design (Figma, etc.)

## Suporte

Para dúvidas sobre testes visuais, consulte:
- [Documentação Vitest Browser](https://vitest.dev/guide/browser.html)
- [Playwright Documentation](https://playwright.dev/)
- [Pixelmatch](https://github.com/mapbox/pixelmatch)

## Scripts Disponíveis

- `npm run test:ui` - Interface visual dos testes
- `npm run test:run` - Executar todos os testes
- `npx vitest run tests/visual/` - Apenas testes visuais
- `npx vite preview --outDir html` - Visualizar relatório HTML