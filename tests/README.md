# Guia de Testes - BidExpert

Este documento explica como executar e interpretar os testes automatizados do BidExpert.

## 🚀 Comandos Disponíveis

### Testes de Interface (Playwright)

```bash
# Executar todos os testes UI
npm run test:ui

# Executar testes com interface visual (modo headed)
npm run test:ui:headed

# Executar testes em modo debug (passo a passo)
npm run test:ui:debug

# Visualizar relatórios dos testes
npm run test:ui:report

# Limpar resultados anteriores
npm run test:ui:clean
```

### Testes Unitários (Vitest)

```bash
# Executar testes unitários
npm run test

# Executar testes E2E específicos
npm run test:e2e
```

## 📊 Relatórios Gerados

Após executar `npm run test:ui`, os seguintes relatórios são gerados automaticamente:

### 1. Relatório HTML Interativo
- **Localização**: `playwright-report/index.html`
- **Comando para visualizar**: `npm run test:ui:report`
- **Características**: Interface visual com screenshots, vídeos, traces e análise detalhada

### 2. Relatório em Texto Simples (Novo!)
- **Localização**: `test-results/plaintext-report.txt`
- **Características**: 
  - Resumo executivo em português
  - Detalhes de cada teste
  - Análise de performance
  - Lista de testes que falharam
  - Fácil de ler e compartilhar

### 3. Relatório JUnit XML
- **Localização**: `test-results/junit-report.xml`
- **Uso**: Integração com CI/CD (Jenkins, GitHub Actions, etc.)

### 4. Relatório JSON
- **Localização**: `test-results/test-results.json`
- **Uso**: Processamento programático dos resultados

## 🔧 Configurações Especiais

### Timeouts Ajustados
Devido à lentidão da aplicação BidExpert (≈2 minutos para carregar), os timeouts foram configurados para:
- **Timeout global**: 5 minutos (300.000ms)
- **Timeout de navegação**: 4 minutos (240.000ms)
- **Timeout de ações**: 1 minuto (60.000ms)

### Execução Sequencial
- **Workers**: 1 (execução sequencial)
- **Paralelismo**: Desabilitado
- **Motivo**: Performance da aplicação

## 📁 Estrutura dos Testes

```
tests/
├── ui/                          # Testes de interface
│   ├── sidebar-navigation.spec.ts
│   ├── admin-crud-*.spec.ts
│   └── ...
├── *.test.ts                    # Testes unitários
└── README.md                    # Este arquivo
```

## 🎯 Exemplo de Uso Completo

```bash
# 1. Limpar resultados anteriores
npm run test:ui:clean

# 2. Executar todos os testes
npm run test:ui

# 3. Visualizar relatório HTML
npm run test:ui:report

# 4. Ler relatório em texto simples
cat test-results/plaintext-report.txt
```

## 📋 Interpretando o Relatório em Texto Simples

O relatório em texto simples contém as seguintes seções:

### Resumo Executivo
- Total de testes executados
- Quantidade de sucessos/falhas
- Taxa de sucesso
- Duração total

### Resultados Detalhados
- Status de cada teste individual
- Duração de execução
- Detalhes de erros (se houver)
- Informações de retry

### Testes que Falharam
- Lista específica dos testes com falha
- Mensagens de erro detalhadas

### Análise de Performance
- Duração média por teste
- Teste mais lento/rápido
- Estatísticas de performance

## 🚨 Troubleshooting

### Problema: Testes com timeout
**Solução**: A aplicação pode estar mais lenta que o normal. Verifique se:
- O servidor de desenvolvimento está rodando (`npm run dev:playwright`)
- Não há outros processos consumindo recursos
- A base de dados está acessível

### Problema: Falhas de importação
**Solução**: Verifique se:
- O Prisma foi compilado (`npm run prisma:build`)
- As dependências estão instaladas (`npm install`)
- Os caminhos de importação estão corretos

### Problema: Relatórios não são gerados
**Solução**: 
- Verifique se o diretório `test-results/` existe
- Execute `npm run test:ui:clean` e tente novamente
- Verifique as permissões de escrita no diretório

## 📞 Suporte

Para problemas com os testes, verifique:
1. Os logs no console durante a execução
2. O arquivo `test-results/plaintext-report.txt` para detalhes
3. O relatório HTML para análise visual
4. Os traces no Playwright para debug detalhado

---

**Nota**: Este sistema de relatórios foi configurado especificamente para acomodar a lentidão da aplicação BidExpert, com timeouts estendidos e execução sequencial para máxima confiabilidade.
