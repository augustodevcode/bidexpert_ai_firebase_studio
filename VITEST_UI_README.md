# Vitest UI - Interface Interativa para Testes

O projeto agora inclui o **Vitest UI**, uma interface web interativa para visualizar e executar testes.

## 🚀 Como Usar

### 1. Executar o Vitest UI
```bash
npm run test:ui
# ou
npx vitest --ui
```

### 2. Acessar a Interface
Abra seu navegador em: **http://localhost:51204/__vitest__/**

### 3. Funcionalidades Disponíveis

#### 📊 **Dashboard Principal**
- Visão geral de todos os testes
- Status de execução (passando/falhando)
- Tempo de execução
- Cobertura de código (se configurada)

#### 🔍 **Module Graph**
- Visualização gráfica das dependências dos módulos
- Análise de performance de importação
- Detecção de gargalos de carregamento

#### 📈 **Import Breakdown**
- Lista dos módulos que mais demoram para carregar
- Identificação de problemas de performance
- Sugestões de otimização

#### 📝 **Module Info**
- Código fonte dos módulos
- Código transformado
- Source maps
- Tempos de carregamento detalhados

### 4. Relatórios HTML

O projeto também gera relatórios HTML estáticos dos testes:

```bash
# Após executar os testes, o relatório fica em:
# ./html/index.html

# Para visualizar:
npx vite preview --outDir ./html
```

## ⚙️ Configuração

### Scripts Disponíveis
- `npm test` - Executa todos os testes unitários
- `npm run test:ui` - Inicia o Vitest UI
- `npm run test:run` - Executa testes uma vez (sem watch)

### Configuração do Vitest (`vitest.config.ts`)
```typescript
export default defineConfig({
  // Servidor para UI
  server: {
    port: 51204
  },

  test: {
    // Reporters: terminal + HTML
    reporters: ['default', 'html'],

    // Foco em testes unitários
    include: [
      'tests/unit/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'scripts/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ],

    // Exclusões
    exclude: [
      '**/node_modules/**',
      '**/tests/e2e/**',  // Playwright E2E
      '**/tests/ui-e2e/**',
      '**/analisar/**'
    ]
  }
})
```

## 🎯 Benefícios

- **Interface Interativa**: Visualize testes em tempo real
- **Debugging Visual**: Module Graph ajuda a identificar problemas
- **Performance Insights**: Import Breakdown mostra gargalos
- **Relatórios HTML**: Compartilháveis e offline
- **Watch Mode**: Recarregamento automático durante desenvolvimento

## 📚 Recursos Adicionais

- [Documentação Oficial do Vitest UI](https://vitest.dev/guide/ui.html)
- [Module Graph Guide](https://vitest.dev/guide/ui.html#module-graph)
- [Coverage Integration](https://vitest.dev/guide/ui.html#coverage)