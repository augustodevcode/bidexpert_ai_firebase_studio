# 🤖 AI-ITSM Queue System

Sistema completo de gerenciamento de falhas CI/CD com correção automática via AI Agent, funcionando como uma fila ITSM (IT Service Management) inteligente.

## 📋 Visão Geral

O **AI-ITSM Queue System** é uma solução automatizada que detecta falhas em pipelines CI/CD, cria issues estruturadas e aciona um AI Agent para correção automática. O sistema implementa:

✅ **Detecção Automática**: Monitora workflows críticos e cria issues quando falham  
✅ **Contexto Completo**: Captura logs, branch, commit e informações relevantes  
✅ **Tentativas Limitadas**: Até 3 tentativas automáticas antes de escalar  
✅ **Escalação Inteligente**: Passa para revisão humana após tentativas esgotadas  
✅ **Gerenciamento Manual**: Script PowerShell para controle da fila  
✅ **Rastreabilidade Total**: Histórico completo de tentativas e ações  

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────────────┐
│                         WORKFLOW CI/CD                              │
│                    (P0 CI, Deploy, etc.)                           │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
                       │ (falha detectada)
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│         create-issue-on-failure.yml                                │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ 1. Coleta logs do workflow falhado                         │    │
│  │ 2. Extrai contexto (branch, commit, executor)              │    │
│  │ 3. Cria issue com label 'ai-fix'                           │    │
│  │ 4. Adiciona comentário inicial                             │    │
│  └────────────────────────────────────────────────────────────┘    │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
                       │ (issue criada)
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│           ai-agent-auto-fix.yml                                    │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ 1. Detecta label 'ai-fix' na issue                         │    │
│  │ 2. Conta tentativas anteriores                             │    │
│  │ 3. Decisão:                                                │    │
│  │    • < 3 tentativas → Aciona AI Agent                      │    │
│  │    • ≥ 3 tentativas → Escala para humanos                  │    │
│  └────────────────────────────────────────────────────────────┘    │
└──────────────────────┬──────────────────────┬───────────────────────┘
                       │                      │
          (< 3 tentativas)         (≥ 3 tentativas)
                       │                      │
                       ▼                      ▼
      ┌─────────────────────────┐   ┌────────────────────────┐
      │   🤖 AI Agent           │   │   👥 Revisão Humana    │
      │   - Analisa logs        │   │   - Label: escalated   │
      │   - Busca soluções      │   │   - Label:             │
      │   - Cria PR             │   │     needs-human-review │
      │   - Label: in-progress  │   │   - Notifica time      │
      └─────────────────────────┘   └────────────────────────┘
                       │
                       ▼
      ┌─────────────────────────────────────────┐
      │  process-ai-fix-queue.ps1              │
      │  (Gerenciamento Manual)                │
      │  - Lista fila                          │
      │  - Processa issues específicas         │
      │  - Modo DryRun para testes             │
      └─────────────────────────────────────────┘
```

## 🔧 Componentes

### 1. `.github/workflows/create-issue-on-failure.yml`

**Responsabilidade**: Detectar falhas automáticas em workflows CI/CD e criar issues estruturadas.

**Trigger**:
```yaml
on:
  workflow_run:
    workflows: 
      - "P0 CI Pipeline"
      - "Deploy to Demo (Vercel)"
      - "Deploy to HML (Vercel)"
      - "Deploy to Production"
      - "Seed Verification"
    types: [completed]
```

**Funcionalidades**:
- Monitora conclusão de workflows críticos
- Executa apenas se `conclusion == 'failure'`
- Coleta logs usando `gh run view --log-failed`
- Extrai informações: workflow name, run number, branch, commit, executor
- Cria issue com labels: `ai-fix`, `ci-cd`, `priority:high`, `automated`
- Adiciona comentário inicial informando acionamento do AI Agent

**Exemplo de Issue Criada**:
```markdown
## 🚨 CI/CD Falha Detectada Automaticamente

| Campo | Valor |
|-------|-------|
| **Workflow** | [P0 CI Pipeline #123](https://...) |
| **Branch** | `main` |
| **Commit** | `abc1234` - Fix authentication bug |
| **Executado por** | @developer |

### 📋 Logs da Falha
<details>
<summary>Clique para expandir os logs</summary>
...
</details>
```

---

### 2. `.github/ISSUE_TEMPLATE/ai-fix.yml`

**Responsabilidade**: Permitir criação manual de requisições de correção por AI Agent.

**Campos**:
- **Tipo de Falha**: Dropdown (Teste Falhando, Erro de Build, etc.)
- **Prioridade**: Dropdown (Crítica, Alta, Média, Baixa)
- **Logs**: Textarea obrigatória com render shell
- **Contexto Adicional**: Textarea opcional
- **Confirmação**: Checkboxes obrigatórias

**Quando Usar**:
- Problemas que não geraram falha automática de CI/CD
- Bugs identificados em runtime
- Solicitações de correção preventiva
- Problemas intermitentes

**Exemplo de Uso**:
1. Acesse "Issues" → "New Issue"
2. Selecione "🤖 AI Fix Request"
3. Preencha o formulário
4. Submit → AI Agent é acionado automaticamente

---

### 3. `.github/workflows/ai-agent-auto-fix.yml`

**Responsabilidade**: Processar issues com label `ai-fix` e gerenciar tentativas de correção.

**Trigger**:
```yaml
on:
  issues:
    types: [opened, labeled]
```

**Fluxo de Decisão**:

```
Issue com label 'ai-fix' criada/atualizada
          ↓
┌─────────────────────────────┐
│ Contar tentativas anteriores│
│ (comentários com marcador)  │
└──────────┬──────────────────┘
           │
           ▼
    ┌──────────────┐
    │ < 3 tentativas?│
    └──┬───────┬───┘
       │ Sim   │ Não
       ▼       ▼
┌──────────┐ ┌──────────────┐
│ Acionar  │ │ Escalar para │
│ AI Agent │ │ Humanos      │
│          │ │              │
│ Labels:  │ │ Remover:     │
│ +in-     │ │ - ai-fix     │
│ progress │ │              │
│          │ │ Adicionar:   │
│ Comentar:│ │ - escalated  │
│ Tentativa│ │ - needs-     │
│ X/3      │ │   human-     │
│          │ │   review     │
└──────────┘ └──────────────┘
```

**Exemplo de Comentário (Tentativa 1/3)**:
```markdown
## 🤖 **AI Agent ativado** (Tentativa 1/3)

### 📊 Status da Tentativa
- **Tentativa atual**: 1 de 3
- **Tentativas restantes**: 2

### 🔧 Próximos Passos do AI Agent
1. ✅ Análise de logs e identificação do erro
2. 🔄 Busca por soluções conhecidas em documentação
3. 💡 Geração de correção apropriada
4. 🧪 Validação da correção (se possível)
5. 📝 Criação de Pull Request com a correção
```

**Exemplo de Comentário (Escalação)**:
```markdown
## 🚨 Escalação para Revisão Humana

O AI Agent tentou corrigir este problema **3 vezes** sem sucesso.

### 👥 Próximos Passos
Este caso requer atenção humana. Um desenvolvedor experiente precisa:
1. Revisar o histórico de tentativas do AI Agent
2. Analisar os logs e contexto fornecidos
3. Identificar a causa raiz do problema
4. Implementar uma correção manual
```

---

### 4. `.agent/scripts/process-ai-fix-queue.ps1`

**Responsabilidade**: Gerenciamento manual da fila de issues AI-Fix via PowerShell.

**Funcionalidades**:
- ✅ Listar todas issues com label `ai-fix`
- ✅ Processar issue específica
- ✅ Verificar número de tentativas
- ✅ Acionar AI Agent manualmente
- ✅ Escalar para revisão humana
- ✅ Modo DryRun para simulação
- ✅ Output colorido e formatado

**Comandos**:

```powershell
# Listar fila
.\process-ai-fix-queue.ps1

# Processar issue específica
.\process-ai-fix-queue.ps1 -IssueNumber 123

# Modo simulação (não faz alterações)
.\process-ai-fix-queue.ps1 -IssueNumber 123 -DryRun

# Customizar limite de tentativas
.\process-ai-fix-queue.ps1 -IssueNumber 123 -MaxAttempts 5
```

**Exemplo de Output**:
```
🤖 AI-ITSM Queue Processor - PowerShell Script
====================================================================================================

🔍 Verificando instalação do GitHub CLI...
✅ GitHub CLI instalado: gh version 2.40.0

📋 Obtendo fila de issues AI-Fix...

✅ Encontradas 3 issue(s) na fila

====================================================================================================
Número   Título                                            Autor                Criada em           
====================================================================================================
#123     🚨 CI/CD Failure: P0 CI Pipeline - Run #45       github-actions       2024-01-15 14:30    
         Labels: ai-fix, ci-cd, priority:high, automated

#124     [AI-FIX] Build error in authentication module    developer1           2024-01-15 15:00    
         Labels: ai-fix, priority:medium

#125     [AI-FIX] E2E tests timing out                    developer2           2024-01-15 15:30    
         Labels: ai-fix, priority:high

====================================================================================================

💡 Para processar uma issue específica, execute:
   .\process-ai-fix-queue.ps1 -IssueNumber <numero>
```

---

### 5. `.agent/workflows/ai-itsm-queue.md`

**Responsabilidade**: Documentação completa do sistema (este arquivo!).

**Conteúdo**:
- Visão geral e objetivos
- Arquitetura e fluxo
- Detalhamento de componentes
- Guia de instalação
- Instruções de uso
- Troubleshooting
- Métricas e KPIs
- Roadmap

---

## 📦 Instalação

### Passo 1: Verificar Workflows Monitorados

Ajuste a lista de workflows monitorados em `.github/workflows/create-issue-on-failure.yml`:

```bash
# Listar workflows disponíveis no repositório
gh workflow list

# Exemplo de output:
# P0 CI Pipeline               active  12345
# Deploy to Demo (Vercel)      active  12346
# Deploy to HML (Vercel)       active  12347
```

Edite a seção `workflows` para incluir os nomes exatos:

```yaml
on:
  workflow_run:
    workflows: 
      - "P0 CI Pipeline"              # ← Use o nome exato
      - "Deploy to Demo (Vercel)"     # ← Use o nome exato
      - "Deploy to HML (Vercel)"      # ← Use o nome exato
```

### Passo 2: Criar Labels Necessárias

Execute os seguintes comandos para criar as labels requeridas:

```bash
# Labels principais
gh label create "ai-fix" --description "Issue será processada pelo AI Agent" --color "7B68EE"
gh label create "ci-cd" --description "Relacionado a pipeline CI/CD" --color "FF6B6B"
gh label create "automated" --description "Criada automaticamente" --color "808080"
gh label create "in-progress" --description "AI Agent processando" --color "FFA500"

# Labels de prioridade
gh label create "priority:critical" --description "Prioridade crítica" --color "FF0000"
gh label create "priority:high" --description "Prioridade alta" --color "FF4500"
gh label create "priority:medium" --description "Prioridade média" --color "FFA500"
gh label create "priority:low" --description "Prioridade baixa" --color "32CD32"

# Labels de escalação
gh label create "escalated" --description "Escalado para revisão humana" --color "8B0000"
gh label create "needs-human-review" --description "Requer atenção humana" --color "DC143C"
```

**Verificar labels criadas**:
```bash
gh label list
```

### Passo 3: Fazer Merge dos Arquivos

1. Commit e push dos arquivos criados
2. Abra um Pull Request
3. Aguarde aprovação e merge
4. Os workflows estarão ativos automaticamente após o merge

### Passo 4: Testar o Sistema

**Teste 1: Criação Manual de Issue**
```bash
# Via GitHub CLI
gh issue create --title "[AI-FIX] Teste do sistema" \
  --body "Logs de teste..." \
  --label "ai-fix"

# Ou via interface web
# Issues → New Issue → 🤖 AI Fix Request
```

**Teste 2: Simular Falha de CI/CD**
```bash
# Introduzir um erro proposital em um teste
# Commitar e aguardar falha do CI
# Verificar se issue é criada automaticamente
```

**Teste 3: Script PowerShell**
```powershell
# Testar listagem
.\process-ai-fix-queue.ps1

# Testar modo DryRun
.\process-ai-fix-queue.ps1 -IssueNumber 123 -DryRun

# Processar de verdade
.\process-ai-fix-queue.ps1 -IssueNumber 123
```

---

## 📖 Como Usar

### Uso Automático (Recomendado)

O sistema funciona automaticamente sem intervenção:

1. **Falha Detectada**: Workflow CI/CD falha
2. **Issue Criada**: Sistema cria issue automaticamente com:
   - Título descritivo
   - Logs da falha
   - Contexto completo (branch, commit, etc.)
   - Labels apropriadas
3. **AI Agent Acionado**: Automaticamente ao criar a issue
4. **Tentativas**: Até 3 tentativas de correção
5. **Resultado**:
   - ✅ **Sucesso**: PR criado com correção
   - ❌ **Falha**: Escalado para revisão humana após 3 tentativas

**Você só precisa**:
- Revisar PRs criados pelo AI Agent
- Atender issues escaladas com label `needs-human-review`

---

### Uso Manual

#### Via Interface Web

1. Acesse **Issues** → **New Issue**
2. Selecione template **🤖 AI Fix Request**
3. Preencha:
   - **Tipo de Falha**: Selecione da lista
   - **Prioridade**: Crítica/Alta/Média/Baixa
   - **Logs**: Cole logs completos
   - **Contexto**: Adicione informações relevantes
   - **Confirmação**: Marque as caixas
4. Clique **Submit new issue**
5. AI Agent será acionado automaticamente

#### Via GitHub CLI

```bash
# Criar issue manualmente
gh issue create \
  --title "[AI-FIX] Descrição do problema" \
  --body "## Logs\n\`\`\`\nErro aqui...\n\`\`\`\n\n## Contexto\nBranch: main\nCommit: abc123" \
  --label "ai-fix,priority:high"

# Listar issues ai-fix
gh issue list --label "ai-fix"

# Ver detalhes de uma issue
gh issue view 123

# Adicionar comentário
gh issue comment 123 --body "Informações adicionais..."
```

#### Via Script PowerShell

```powershell
# 1. Listar fila
.\process-ai-fix-queue.ps1

# Output mostrará todas issues com label 'ai-fix'

# 2. Processar issue específica
.\process-ai-fix-queue.ps1 -IssueNumber 123

# 3. Testar sem fazer alterações (DryRun)
.\process-ai-fix-queue.ps1 -IssueNumber 123 -DryRun

# 4. Customizar limite de tentativas
.\process-ai-fix-queue.ps1 -IssueNumber 123 -MaxAttempts 5

# 5. Ver ajuda completa
Get-Help .\process-ai-fix-queue.ps1 -Full
```

---

## 🔍 Troubleshooting

### Problema 1: Issue Não Criada Após Falha de CI

**Sintomas**:
- Workflow falhou mas nenhuma issue foi criada
- Não aparece execução do workflow `create-issue-on-failure.yml`

**Causas Possíveis**:
1. Nome do workflow não está na lista monitorada
2. Permissões insuficientes
3. Workflow ainda não foi merged na branch principal

**Soluções**:

```bash
# 1. Verificar nome exato do workflow
gh workflow list

# 2. Verificar se o workflow create-issue-on-failure existe
gh workflow view "Create Issue on CI/CD Failure"

# 3. Verificar runs recentes
gh run list --workflow="Create Issue on CI/CD Failure"

# 4. Ver logs de uma run específica
gh run view 12345 --log

# 5. Verificar permissões no arquivo .yml
# Deve ter: permissions: contents: read, issues: write, actions: read
```

**Checklist**:
- [ ] Workflow está na branch `main` ou branch padrão
- [ ] Nome do workflow em `workflows:` está exato (case-sensitive)
- [ ] Repository tem Issues habilitadas
- [ ] Secrets `GITHUB_TOKEN` está disponível

---

### Problema 2: AI Agent Não Acionado

**Sintomas**:
- Issue criada com label `ai-fix`
- Nenhum comentário do AI Agent
- Label `in-progress` não adicionada

**Causas Possíveis**:
1. Workflow `ai-agent-auto-fix.yml` não executou
2. Condição do workflow não satisfeita
3. Erro na contagem de tentativas

**Soluções**:

```bash
# 1. Verificar se workflow existe
gh workflow view "AI Agent Auto-Fix"

# 2. Verificar runs para a issue
gh run list --workflow="AI Agent Auto-Fix"

# 3. Forçar re-execução
# Remover e re-adicionar label ai-fix
gh issue edit 123 --remove-label "ai-fix"
gh issue edit 123 --add-label "ai-fix"

# 4. Processar manualmente via script
.\process-ai-fix-queue.ps1 -IssueNumber 123
```

**Checklist**:
- [ ] Issue tem label `ai-fix` (exatamente, case-sensitive)
- [ ] Workflow `ai-agent-auto-fix.yml` está na branch principal
- [ ] Permissões: `contents: write`, `issues: write`, `pull-requests: write`
- [ ] Issue está aberta (não fechada)

---

### Problema 3: Script PowerShell Falha

**Sintomas**:
- Erros ao executar `process-ai-fix-queue.ps1`
- Comando `gh` não encontrado
- Erros de parsing JSON

**Soluções**:

```powershell
# 1. Verificar instalação do GitHub CLI
gh --version

# Se não instalado:
# Windows
winget install --id GitHub.cli

# macOS
brew install gh

# Linux
# Ver: https://github.com/cli/cli/blob/trunk/docs/install_linux.md

# 2. Autenticar GitHub CLI
gh auth login

# 3. Verificar permissões do script
# PowerShell pode bloquear scripts não assinados
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

# 4. Testar gh CLI manualmente
gh issue list --label "ai-fix"

# 5. Executar em modo DryRun para debug
.\process-ai-fix-queue.ps1 -IssueNumber 123 -DryRun -Verbose
```

**Checklist**:
- [ ] GitHub CLI instalado (`gh --version` funciona)
- [ ] GitHub CLI autenticado (`gh auth status`)
- [ ] Permissões de execução do PowerShell
- [ ] Encoding do arquivo é UTF-8
- [ ] Conexão com internet ativa

---

### Problema 4: Limite de Tentativas Não Funciona

**Sintomas**:
- AI Agent continua tentando após 3 tentativas
- Label `escalated` não adicionada
- Issue não escalada para humanos

**Causas Possíveis**:
1. Formato do comentário de ativação mudou
2. Comentários deletados manualmente
3. Lógica de contagem com bug

**Soluções**:

```bash
# 1. Verificar comentários na issue
gh issue view 123 --json comments --jq '.comments[] | select(.body | contains("🤖 **AI Agent ativado"))'

# 2. Contar manualmente
gh issue view 123 --json comments --jq '[.comments[] | select(.body | contains("🤖 **AI Agent ativado"))] | length'

# 3. Forçar escalação manual
gh issue edit 123 --remove-label "ai-fix"
gh issue edit 123 --add-label "escalated,needs-human-review"

# 4. Adicionar comentário de escalação manual
gh issue comment 123 --body "🚨 Escalado manualmente após verificação de tentativas."
```

**Checklist**:
- [ ] Comentários não foram deletados
- [ ] String exata `🤖 **AI Agent ativado` presente nos comentários
- [ ] Workflow usando actions/github-script@v7 (versão correta)
- [ ] Código de contagem não foi modificado

---

## 📊 Métricas e KPIs

### Métricas Recomendadas

1. **Taxa de Sucesso de Correção**
   - Fórmula: `(Issues resolvidas pelo AI / Total de issues ai-fix) × 100`
   - Meta: > 60%
   - Tracking: Label `resolved` em issues fechadas

2. **MTTR (Mean Time To Recovery)**
   - Fórmula: Média de tempo entre abertura da issue e correção
   - Meta: < 2 horas para P0, < 8 horas para P1
   - Tracking: Timestamp de criação vs. timestamp de PR merged

3. **Taxa de Escalação**
   - Fórmula: `(Issues escaladas / Total de issues ai-fix) × 100`
   - Meta: < 40%
   - Tracking: Label `escalated`

4. **Distribuição por Tipo de Falha**
   - Build errors: X%
   - Test failures: Y%
   - Deploy errors: Z%
   - Tracking: Parse do corpo da issue

5. **Tentativas Médias Até Resolução**
   - Fórmula: Média de tentativas em issues resolvidas
   - Meta: ≤ 2 tentativas
   - Tracking: Contar comentários de ativação

### Exemplo de Dashboard

```bash
# Query para métricas (GitHub CLI)

# 1. Total de issues ai-fix (últimos 30 dias)
gh issue list --label "ai-fix" --state all --search "created:>=2024-01-01" --json number | jq 'length'

# 2. Issues escaladas
gh issue list --label "escalated" --state all --json number | jq 'length'

# 3. Issues resolvidas pelo AI
gh issue list --label "ai-fix" --state closed --json number,closedAt | jq 'length'

# 4. Issues abertas esperando AI
gh issue list --label "ai-fix,in-progress" --state open --json number,title

# 5. Issues críticas
gh issue list --label "ai-fix,priority:high" --state open --json number,title,createdAt
```

**Dashboard Visual** (exemplo com GitHub Actions):

```yaml
# .github/workflows/metrics-dashboard.yml
name: AI-ITSM Metrics Dashboard

on:
  schedule:
    - cron: '0 9 * * *'  # Daily at 9 AM
  workflow_dispatch:

jobs:
  generate-metrics:
    runs-on: ubuntu-latest
    steps:
      - name: Collect Metrics
        run: |
          echo "# 📊 AI-ITSM Queue Metrics" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          
          TOTAL=$(gh issue list --label "ai-fix" --state all --json number | jq 'length')
          ESCALATED=$(gh issue list --label "escalated" --state all --json number | jq 'length')
          RESOLVED=$(gh issue list --label "ai-fix" --state closed --json number | jq 'length')
          OPEN=$(gh issue list --label "ai-fix" --state open --json number | jq 'length')
          
          echo "| Métrica | Valor |" >> $GITHUB_STEP_SUMMARY
          echo "|---------|-------|" >> $GITHUB_STEP_SUMMARY
          echo "| Total de Issues AI-Fix | $TOTAL |" >> $GITHUB_STEP_SUMMARY
          echo "| Issues Abertas | $OPEN |" >> $GITHUB_STEP_SUMMARY
          echo "| Issues Resolvidas | $RESOLVED |" >> $GITHUB_STEP_SUMMARY
          echo "| Issues Escaladas | $ESCALATED |" >> $GITHUB_STEP_SUMMARY
          
          if [ $TOTAL -gt 0 ]; then
            SUCCESS_RATE=$(echo "scale=2; ($RESOLVED / $TOTAL) * 100" | bc)
            ESCALATION_RATE=$(echo "scale=2; ($ESCALATED / $TOTAL) * 100" | bc)
            echo "| Taxa de Sucesso | ${SUCCESS_RATE}% |" >> $GITHUB_STEP_SUMMARY
            echo "| Taxa de Escalação | ${ESCALATION_RATE}% |" >> $GITHUB_STEP_SUMMARY
          fi
        env:
          GH_TOKEN: ${{ github.token }}
```

---

## 🗺️ Roadmap

### Fase 1: Fundação ✅ (Implementado)
- [x] Detecção automática de falhas CI/CD
- [x] Criação de issues estruturadas
- [x] Template para requisições manuais
- [x] Workflow de acionamento do AI Agent
- [x] Lógica de tentativas limitadas
- [x] Escalação automática
- [x] Script PowerShell para gerenciamento
- [x] Documentação completa

### Fase 2: Inteligência 🔄 (Próximo)
- [ ] Integração real com AI Agent (OpenAI/Anthropic)
- [ ] Análise de logs com LLM
- [ ] Geração automática de PRs com correções
- [ ] Testes automáticos da correção antes de criar PR
- [ ] Aprendizado de correções bem-sucedidas

### Fase 3: Otimização 📋 (Planejado)
- [ ] Cache de soluções conhecidas
- [ ] Priorização inteligente baseada em impacto
- [ ] Detecção de padrões recorrentes
- [ ] Sugestão de refactorings preventivos
- [ ] Notificações proativas (Slack/Teams)

### Fase 4: Expansão 🎯 (Futuro)
- [ ] Suporte a múltiplos repositórios
- [ ] Dashboard web dedicado
- [ ] Integração com Jira/Linear
- [ ] Métricas avançadas e BI
- [ ] API para integrações externas

### Fase 5: Autonomia 🚀 (Visão)
- [ ] Auto-deploy de correções aprovadas
- [ ] Prevenção preditiva de falhas
- [ ] Otimização contínua de pipelines
- [ ] Sistema de recomendações de melhorias
- [ ] Documentação automática de problemas

---

## 🤝 Contribuindo

### Como Contribuir

1. **Reportar Bugs**: Abra uma issue descrevendo o problema
2. **Sugerir Melhorias**: Use issues com label `enhancement`
3. **Enviar PRs**: Fork, implemente, teste e submeta PR

### Diretrizes de Desenvolvimento

- Mantenha a compatibilidade com workflows existentes
- Adicione testes para novas funcionalidades
- Documente mudanças significativas
- Siga convenções de nomenclatura existentes
- Mantenha encoding UTF-8 em scripts PowerShell

### Áreas que Precisam de Ajuda

- [ ] Integração com mais plataformas CI/CD
- [ ] Suporte a outros sistemas de gerenciamento de issues
- [ ] Melhorias na interface do script PowerShell
- [ ] Testes automatizados dos workflows
- [ ] Tradução da documentação

---

## 📚 Recursos Adicionais

### Documentação Relacionada

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub CLI Manual](https://cli.github.com/manual/)
- [PowerShell Documentation](https://docs.microsoft.com/en-us/powershell/)
- [YAML Syntax](https://yaml.org/spec/)

### Ferramentas Úteis

- [GitHub Actions Toolkit](https://github.com/actions/toolkit)
- [Act - Run GitHub Actions Locally](https://github.com/nektos/act)
- [YAML Validator](https://www.yamllint.com/)
- [PowerShell Extension for VSCode](https://marketplace.visualstudio.com/items?itemName=ms-vscode.PowerShell)

### Artigos e Tutoriais

- [Building a CI/CD Pipeline with GitHub Actions](https://docs.github.com/en/actions/guides)
- [Automation Best Practices](https://docs.github.com/en/actions/learn-github-actions/best-practices-for-github-actions)
- [Working with Issues via API](https://docs.github.com/en/rest/issues)

---

## 💬 Suporte

### Obter Ajuda

- **Issues**: Use GitHub Issues para bugs e perguntas
- **Discussões**: Para dúvidas gerais e discussões
- **Email**: Contate o time de DevOps

### FAQ

**P: O AI Agent realmente cria PRs automaticamente?**  
R: Na Fase 1, o workflow prepara o contexto. A integração com LLM (Fase 2) permitirá criação automática de PRs.

**P: Posso customizar o número de tentativas?**  
R: Sim! Use o parâmetro `-MaxAttempts` no script PowerShell ou modifique a constante no workflow.

**P: Como desabilitar temporariamente o sistema?**  
R: Desabilite o workflow `create-issue-on-failure.yml` via interface web (Actions → Workflow → Disable).

**P: O sistema funciona em repositórios privados?**  
R: Sim, desde que o `GITHUB_TOKEN` tenha as permissões necessárias.

---

## 📝 Changelog

### v1.0.0 (2024-01-15)
- 🎉 Release inicial
- ✅ Detecção automática de falhas CI/CD
- ✅ Criação de issues estruturadas
- ✅ Template para requisições manuais
- ✅ Workflow de tentativas limitadas
- ✅ Escalação automática
- ✅ Script PowerShell de gerenciamento
- ✅ Documentação completa

---

## 📄 Licença

Este sistema é parte do projeto BidExpert e segue a licença do repositório principal.

---

**Última Atualização**: 2024-01-15  
**Versão**: 1.0.0  
**Mantido por**: DevOps Team

---

<div align="center">

**Construído com ❤️ para automatizar o que é repetitivo e focar no que importa**

</div>
