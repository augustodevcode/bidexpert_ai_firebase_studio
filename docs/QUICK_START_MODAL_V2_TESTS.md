# 🚀 Quick Start - Testar Modais V2

## Passo 1: Iniciar Servidor de Desenvolvimento

```bash
npm run dev:9009
```

Aguarde até ver a mensagem: `✓ Ready in X.XXs`

## Passo 2: Abrir no Navegador

Acesse: `http://localhost:9009`

## Passo 3: Testar Manualmente

### Testar Modal de Lote

1. **Encontrar um card de lote** na página inicial
2. **Passar o mouse** sobre o card (aparecerão botões de ação)
3. **Clicar no ícone de olho** 👁️ (preview)
4. **Verificar**:
   - ✅ Modal abre em tela grande (950px)
   - ✅ Lado esquerdo (3/5) mostra galeria com fundo preto
   - ✅ Lado direito (2/5) mostra informações
   - ✅ Setas de navegação funcionam (se houver múltiplas imagens)
   - ✅ Dots na parte inferior da galeria
   - ✅ Badge de urgência no canto superior esquerdo
   - ✅ Card de preço com gradiente
   - ✅ Estatísticas em 3 colunas coloridas
   - ✅ Lista de benefícios com checkmarks
   - ✅ Botão "Ver Detalhes Completos e Dar Lance"
   - ✅ Countdown se o lote estiver ativo

### Testar Modal de Leilão

1. **Ir para página de leilões**: `http://localhost:9009/auctions`
2. **Clicar em um card de leilão**
3. **Clicar no ícone de preview**
4. **Verificar**:
   - ✅ Mesmo layout 3+2
   - ✅ Badges específicos de leilão
   - ✅ Valor de referência total
   - ✅ Avatar do leiloeiro
   - ✅ Nome do comitente
   - ✅ Botão "Ver Todos os X Lotes"

### Testar Responsividade

1. **Abrir DevTools** (F12)
2. **Ativar modo responsivo** (Ctrl+Shift+M)
3. **Testar em**:
   - Mobile (375x667)
   - Tablet (768x1024)
   - Desktop (1920x1080)

### Testar Acessibilidade

1. **Com modal aberto**:
   - Pressionar `ESC` → deve fechar
   - Pressionar `Tab` → deve navegar pelos elementos
   - Clicar fora do modal → deve fechar

## Passo 4: Executar Testes Playwright

### Opção A: Modo Headless (CI/CD)

```bash
npm run test:e2e -- modal-preview-redesign.spec.ts
```

### Opção B: Modo UI (Recomendado)

```bash
npm run test:e2e:ui -- modal-preview-redesign.spec.ts
```

Isso abrirá uma interface gráfica onde você pode:
- Ver todos os testes
- Executar individualmente
- Ver em tempo real
- Inspecionar cada passo

### Opção C: Modo Debug

```bash
npm run test:e2e:debug -- modal-preview-redesign.spec.ts
```

### Opção D: Executar apenas um teste específico

```bash
# Exemplo: testar apenas o layout de 5 colunas
npm run test:e2e -- modal-preview-redesign.spec.ts -g "5-column grid"
```

## Passo 5: Ver Resultados

### Relatório HTML

Após executar os testes, abrir o relatório:

```bash
npx playwright show-report
```

### Relatório em Texto

Arquivo gerado automaticamente:
```
test-results/plaintext-report.txt
```

### Screenshots e Vídeos

Em caso de falhas, confira:
```
test-results/
├── screenshots/
└── videos/
```

## 🐛 Solução de Problemas

### Servidor não inicia (erro de porta)

```bash
# Usar porta alternativa
npm run dev:9003
# ou
npm run dev:9005
```

Atualizar `BASE_URL` no teste se necessário.

### Erro de compilação

```bash
# Limpar cache
npm run clean
rm -rf .next node_modules/.cache

# Reinstalar dependências
npm install

# Tentar novamente
npm run dev:9009
```

### Testes não encontram elementos

1. Verificar se o servidor está rodando
2. Verificar se há dados no banco (seed)
3. Abrir `http://localhost:9009` manualmente
4. Confirmar que há cards visíveis

### Prisma lock error

```bash
# Matar todos os processos node
taskkill /F /IM node.exe

# Reiniciar
npm run dev:9009
```

## 📊 Interpretando Resultados dos Testes

### ✅ Todos Passaram

```
✅ Passou: 21
❌ Falhou: 0
⏭️  Pulado: 0
```

**Tudo funcionando perfeitamente!**

### ⏭️ Alguns Pulados

```
✅ Passou: 15
⏭️  Pulado: 6
```

**Normal**. Alguns testes pulam se não houver cards disponíveis.

### ❌ Alguns Falharam

```
✅ Passou: 18
❌ Falhou: 3
```

**Verificar**:
1. Screenshots em `test-results/`
2. Vídeos da execução
3. Logs de erro no relatório HTML

## 🎯 Checklist Rápido

Antes de marcar como concluído, verificar:

- [ ] Servidor dev inicia sem erros
- [ ] Modal de lote abre corretamente
- [ ] Modal de leilão abre corretamente
- [ ] Layout 3+2 está visível
- [ ] Badges de urgência aparecem
- [ ] Estatísticas mostram números
- [ ] CTAs redirecionam corretamente
- [ ] Modal fecha com ESC
- [ ] Galeria de imagens funciona
- [ ] Pelo menos 15 testes Playwright passam

## 💡 Dicas

### Para Desenvolvimento

```bash
# Deixar servidor rodando em um terminal
npm run dev:9009

# Em outro terminal, rodar testes em watch mode
npx playwright test --ui modal-preview-redesign.spec.ts
```

### Para CI/CD

```bash
# Build de produção
npm run build

# Iniciar em modo produção
npm run start -- -p 9005

# Rodar testes
npm run test:e2e -- modal-preview-redesign.spec.ts --reporter=html
```

### Para Debug Visual

Use o modo UI do Playwright:
- Mostra timeline de cada ação
- Permite inspecionar DOM em qualquer momento
- Ver screenshots de cada passo
- Re-rodar testes facilmente

## 📞 Ajuda Adicional

Se precisar de ajuda:

1. Verificar `docs/MODAL_PREVIEW_IMPLEMENTATION_COMPLETE.md` (documentação completa)
2. Verificar `docs/MODAL_PREVIEW_REDESIGN.md` (especificação original)
3. Inspecionar código-fonte dos componentes:
   - `src/components/lot-preview-modal-v2.tsx`
   - `src/components/auction-preview-modal-v2.tsx`

---

**Boa sorte com os testes! 🚀**
