# 🤖 AI-ITSM Queue System

Sistema completo de gerenciamento automático de falhas CI/CD com correção via AI Agent, funcionando como uma fila ITSM inteligente.

## 📋 Visão Geral

O **AI-ITSM Queue System** é uma solução automatizada para detecção, rastreamento e correção de falhas em pipelines CI/CD. O sistema funciona como uma fila de tickets ITSM tradicional, mas com inteligência artificial para correção automática de problemas comuns.

### 🎯 Objetivos

- ✅ **Detecção Automática**: Identificar falhas em workflows CI/CD automaticamente
- ✅ **Rastreabilidade**: Criar issues com contexto completo (logs, commit, branch, executor)
- ✅ **Correção Inteligente**: Acionar AI Agent para análise e correção automática
- ✅ **Limite de Tentativas**: Escalar para humanos após 3 tentativas sem sucesso
- ✅ **Gestão Manual**: Script PowerShell para gerenciamento da fila
- ✅ **Métricas**: Acompanhar MTTR, taxa de sucesso e escalações

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                         CI/CD Pipeline                          │
│  (P0 CI, Deploy DEMO, Deploy HML, Deploy Production)           │
└────────────────┬────────────────────────────────────────────────┘
                 │ Failure Detected
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│         create-issue-on-failure.yml (Workflow)                  │
│  • Coleta logs do workflow falhado                              │
│  • Extrai contexto (branch, commit, executor, timestamp)        │
│  • Cria issue com labels: ai-fix, ci-cd, priority:high         │
│  • Adiciona comentário inicial                                  │
└────────────────┬────────────────────────────────────────────────┘
                 │ Issue Created with 'ai-fix' label
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│          ai-agent-auto-fix.yml (Workflow)                       │
│  • Trigger: issue opened/labeled com 'ai-fix'                   │
│  • Conta tentativas anteriores (comentários)                    │
│  • Decisão: Processar (< 3) ou Escalar (≥ 3)                   │
│  • Atualiza labels e adiciona comentários                       │
└────────────────┬────────────────────────────────────────────────┘
                 │
        ┌────────┴────────┐
        ▼                 ▼
┌──────────────┐   ┌──────────────────┐
│ Tentativa    │   │ Escalação        │
│ 1, 2, ou 3   │   │ (≥ 3 tentativas) │
│              │   │                  │
│ • Label:     │   │ • Remove: ai-fix │
│   in-progress│   │ • Adiciona:      │
│ • AI Agent   │   │   escalated,     │
│   acionado   │   │   needs-human-   │
│ • Comentário │   │   review         │
│   com status │   │ • Comentário de  │
└──────────────┘   │   escalação      │
                   └──────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│      process-ai-fix-queue.ps1 (Script Manual)                   │
│  • Listar fila de issues com 'ai-fix'                           │
│  • Processar issue específica                                   │
│  • Modo DryRun para simulação                                   │
│  • Verificar tentativas e aplicar limite                        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│         ai-fix.yml (Issue Template)                             │
│  • Criação manual de requisições de correção                    │
│  • Campos estruturados: tipo, prioridade, logs, contexto        │
│  • Validações e checkboxes de confirmação                       │
└─────────────────────────────────────────────────────────────────┘
```

## 🔧 Componentes

### 1. `create-issue-on-failure.yml`

**Responsabilidade**: Detectar automaticamente falhas em workflows CI/CD e criar issues com contexto completo.

**Trigger**:
- `workflow_run` com tipos `[completed]`
- Workflows monitorados: "P0 CI Pipeline", "Deploy DEMO to Vercel", "Deploy HML to Vercel", "Deploy to Production"
- Condição: `conclusion == 'failure'`

**Funcionalidades**:
- ✅ Coleta logs de jobs falhados via GitHub API
- ✅ Extrai informações de contexto (workflow, run number, branch, commit, executor)
- ✅ Cria issue com título formatado: `🚨 CI/CD Failure: {workflow} - Run #{number}`
- ✅ Adiciona labels automáticas: `ai-fix`, `ci-cd`, `priority:high`, `automated`
- ✅ Inclui logs em seção expansível (limitado a 5000 chars)
- ✅ Adiciona comentário inicial informando sobre AI Agent
- ✅ Gera resumo no GitHub Actions Summary

**Exemplo de Issue Criada**:
```markdown
## 🚨 CI/CD Workflow Failed

### 📊 Failure Information
| Field | Value |
|-------|-------|
| **Workflow** | P0 CI Pipeline |
| **Run Number** | [#123](https://github.com/...) |
| **Branch** | `demo-stable` |
| **Commit** | `abc1234` |
| **Triggered by** | @user |
| **Failed at** | 2026-02-18T10:30:00Z |

### 📋 Logs
<details>
<summary>Click to expand failed job logs</summary>
...
</details>
```

### 2. `ai-fix.yml` (Issue Template)

**Responsabilidade**: Fornecer template estruturado para criação manual de requisições de correção via AI.

**Campos**:
- `failure_type` (dropdown): Teste Falhando, Erro de Build, Erro de Deploy, Lint/Type Check, Bug em Runtime, Outro
- `priority` (dropdown): Crítica, Alta, Média, Baixa
- `logs` (textarea, required): Logs completos do erro
- `context` (textarea): Branch, commit, workflow run, tentativas anteriores
- `reproduction` (textarea, optional): Passos para reproduzir
- `approval` (checkboxes, required): 3 confirmações obrigatórias

**Exemplo de Uso**:
1. Usuário acessa "New Issue" no GitHub
2. Seleciona template "🤖 AI Fix Request"
3. Preenche os campos estruturados
4. Ao criar, a issue recebe automaticamente label `ai-fix`
5. Workflow `ai-agent-auto-fix.yml` é acionado automaticamente

### 3. `ai-agent-auto-fix.yml`

**Responsabilidade**: Processar issues com label `ai-fix` e acionar AI Agent, respeitando limite de 3 tentativas.

**Trigger**:
- `issues` com types `[opened, labeled]`
- Condição: `contains(github.event.issue.labels.*.name, 'ai-fix')`

**Fluxo de Decisão**:
```javascript
// Contar tentativas anteriores
const attempts = comments.filter(c => 
  c.body.includes('🤖 **AI Agent ativado')
).length;

if (attempts >= 3) {
  // ESCALAR
  await removeLabel('ai-fix');
  await addLabels(['escalated', 'needs-human-review']);
  await createComment('🚨 Escalação para Revisão Humana');
} else {
  // PROCESSAR
  await addLabels(['in-progress']);
  await createComment('🤖 AI Agent ativado (Tentativa X/3)');
}
```

**Estados Possíveis**:
- **Tentativa 1-3**: Adiciona label `in-progress`, comenta progresso
- **≥ 3 tentativas**: Remove `ai-fix`, adiciona `escalated` + `needs-human-review`

**Exemplo de Comentário (Tentativa 2/3)**:
```markdown
## 🤖 **AI Agent ativado** (Tentativa 2/3)

O AI Agent foi acionado para analisar e corrigir este problema.

### 📋 Informações da Issue
- **Título:** [AI-FIX] Build failing on demo-stable
- **Labels:** ai-fix, ci-cd, priority:high
- **Tentativa:** 2 de 3

### 🔍 Próximos Passos
1. ✅ Análise dos logs e contexto
2. 🔧 Desenvolvimento da estratégia de correção
3. 💻 Implementação das mudanças
4. 🧪 Validação com testes
5. 📝 Criação de Pull Request (se bem-sucedido)
```

### 4. `process-ai-fix-queue.ps1`

**Responsabilidade**: Script PowerShell para gerenciamento manual da fila AI-Fix.

**Funcionalidades**:
- ✅ Listar todas as issues com label `ai-fix`
- ✅ Processar issue específica por número
- ✅ Contar tentativas anteriores
- ✅ Aplicar limite de tentativas (padrão: 3, configurável)
- ✅ Modo DryRun para simulação sem alterações
- ✅ Output colorido para melhor visualização
- ✅ Verificação de GitHub CLI instalado e autenticado

**Parâmetros**:
```powershell
-IssueNumber <int>     # Número da issue para processar
-DryRun                # Modo simulação (não faz alterações)
-MaxAttempts <int>     # Limite de tentativas (padrão: 3)
```

**Exemplos de Uso**:

```powershell
# Listar todas as issues na fila
.\process-ai-fix-queue.ps1

# Processar issue específica
.\process-ai-fix-queue.ps1 -IssueNumber 123

# Simular processamento (dry run)
.\process-ai-fix-queue.ps1 -IssueNumber 123 -DryRun

# Processar com limite customizado
.\process-ai-fix-queue.ps1 -IssueNumber 123 -MaxAttempts 5
```

**Output de Listagem**:
```
========================================
🤖 AI-ITSM Queue Processor
========================================
✅ GitHub CLI configurado corretamente

📋 Buscando issues na fila AI-Fix...
✅ Encontradas 3 issue(s) na fila

================================================================================
📋 FILA AI-FIX - Issues Pendentes
================================================================================

#123 - [AI-FIX] Build failing on demo-stable
  📅 Criado: 2026-02-18 10:30
  👤 Autor: augustodevcode
  🏷️  Labels: ai-fix, ci-cd, priority:high
  📊 Tentativas: 2/3

#124 - [AI-FIX] E2E tests timing out
  📅 Criado: 2026-02-18 11:15
  👤 Autor: augustodevcode
  🏷️  Labels: ai-fix, automated
  📊 Tentativas: 0/3

#125 - [AI-FIX] TypeScript errors after dependency update
  📅 Criado: 2026-02-18 12:00
  👤 Autor: augustodevcode
  🏷️  Labels: ai-fix, priority:high
  📊 Tentativas: 3/3
  ⚠️  ATENÇÃO: Limite atingido - pronta para escalação!

================================================================================
Total: 3 issue(s) na fila
================================================================================
```

### 5. `ai-itsm-queue.md`

**Responsabilidade**: Documentação completa do sistema com guias de instalação, uso e troubleshooting.

**Conteúdo**:
- Visão geral e objetivos
- Arquitetura com diagrama ASCII
- Detalhamento de cada componente
- Guia de instalação passo a passo
- Como usar (automático e manual)
- Troubleshooting com problemas comuns
- Métricas e KPIs
- Roadmap de evolução

## 📦 Instalação

### Passo 1: Verificar Nomes dos Workflows

Liste os workflows existentes para ajustar os nomes no arquivo `create-issue-on-failure.yml`:

```bash
gh workflow list
```

Edite o arquivo `.github/workflows/create-issue-on-failure.yml` e ajuste a linha 10-11 para incluir os nomes **exatos** dos workflows que você quer monitorar:

```yaml
workflows: ["Nome Exato 1", "Nome Exato 2", "Nome Exato 3"]
```

### Passo 2: Criar Labels Necessárias

Execute os comandos abaixo para criar todas as labels usadas pelo sistema:

```bash
# Label principal - aciona AI Agent
gh label create "ai-fix" \
  --description "Issue para correção automática via AI Agent" \
  --color "0E8A16"

# Label de categoria
gh label create "ci-cd" \
  --description "Issues relacionadas a CI/CD" \
  --color "D93F0B"

# Labels de prioridade
gh label create "priority:critical" \
  --description "Prioridade crítica - sistema não funcional" \
  --color "B60205"

gh label create "priority:high" \
  --description "Prioridade alta - funcionalidade importante quebrada" \
  --color "D93F0B"

gh label create "priority:medium" \
  --description "Prioridade média - funcionalidade secundária afetada" \
  --color "FBCA04"

gh label create "priority:low" \
  --description "Prioridade baixa - melhoria ou problema menor" \
  --color "0E8A16"

# Labels de estado
gh label create "in-progress" \
  --description "AI Agent está processando" \
  --color "1D76DB"

gh label create "escalated" \
  --description "Escalado após tentativas falhadas" \
  --color "B60205"

gh label create "needs-human-review" \
  --description "Requer revisão de desenvolvedor humano" \
  --color "D93F0B"

# Label de automação
gh label create "automated" \
  --description "Issue criada automaticamente" \
  --color "C5DEF5"
```

### Passo 3: Fazer Merge

Faça commit e push de todos os arquivos criados:

```bash
git add .github/workflows/create-issue-on-failure.yml
git add .github/workflows/ai-agent-auto-fix.yml
git add .github/ISSUE_TEMPLATE/ai-fix.yml
git add .agent/scripts/process-ai-fix-queue.ps1
git add .agent/workflows/ai-itsm-queue.md

git commit -m "feat: Implementar AI-ITSM Queue System para correção automática de falhas CI/CD"
git push origin main
```

### Passo 4: Testar o Sistema

#### Teste Automático:
1. Force uma falha em algum workflow (ex: adicione um erro de syntax em um arquivo)
2. Faça push para a branch monitorada
3. Aguarde o workflow falhar
4. Verifique se uma issue foi criada automaticamente com label `ai-fix`
5. Verifique se o workflow `ai-agent-auto-fix.yml` foi acionado

#### Teste Manual:
1. Acesse "Issues" → "New Issue"
2. Selecione template "🤖 AI Fix Request"
3. Preencha os campos e crie a issue
4. Verifique se o workflow foi acionado automaticamente

#### Teste PowerShell:
```powershell
# Listar fila
.\.agent\scripts\process-ai-fix-queue.ps1

# Testar em modo dry-run
.\.agent\scripts\process-ai-fix-queue.ps1 -IssueNumber <número> -DryRun
```

## 📘 Como Usar

### Uso Automático

O sistema funciona automaticamente seguindo este fluxo:

1. **Workflow CI/CD Falha**
   - Um workflow monitorado (P0 CI, Deploy, etc.) falha
   - Evento `workflow_run.completed` com `conclusion == 'failure'`

2. **Issue é Criada Automaticamente**
   - Workflow `create-issue-on-failure.yml` é acionado
   - Logs são coletados via GitHub API
   - Issue é criada com título, corpo formatado e labels

3. **AI Agent é Acionado**
   - Workflow `ai-agent-auto-fix.yml` detecta nova issue com label `ai-fix`
   - Verifica número de tentativas anteriores
   - Se < 3: processa e adiciona comentário
   - Se ≥ 3: escala para revisão humana

4. **Processamento Continua Até**
   - AI Agent resolve o problema (cria PR, fecha issue)
   - Ou atinge 3 tentativas (escala)

### Uso Manual

#### Via Interface Web:

1. Acesse repositório no GitHub
2. Clique em "Issues" → "New Issue"
3. Selecione template "🤖 AI Fix Request"
4. Preencha:
   - Tipo de falha (dropdown)
   - Prioridade (dropdown)
   - Logs completos (textarea)
   - Contexto adicional (opcional)
   - Confirmações (checkboxes obrigatórios)
5. Clique "Submit new issue"

#### Via GitHub CLI:

```bash
# Criar issue manualmente
gh issue create \
  --title "[AI-FIX] Descrição do problema" \
  --label "ai-fix" \
  --body "Logs e contexto do erro..."

# Adicionar label a issue existente
gh issue edit 123 --add-label "ai-fix"
```

#### Via Script PowerShell:

```powershell
# Listar fila completa
.\process-ai-fix-queue.ps1

# Processar issue específica
.\process-ai-fix-queue.ps1 -IssueNumber 123

# Simular (dry run)
.\process-ai-fix-queue.ps1 -IssueNumber 123 -DryRun

# Customizar limite de tentativas
.\process-ai-fix-queue.ps1 -IssueNumber 123 -MaxAttempts 5
```

## 🔍 Troubleshooting

### Problema 1: Issue Não Foi Criada Após Falha

**Causas Possíveis**:
- Nome do workflow não corresponde ao configurado em `create-issue-on-failure.yml`
- Permissões insuficientes no workflow
- Workflow não foi acionado porque a falha não atende aos critérios

**Soluções**:
```bash
# Verificar nome exato dos workflows
gh workflow list

# Editar create-issue-on-failure.yml linha 10-11
workflows: ["Nome Exato Do Workflow"]

# Verificar runs recentes
gh run list --workflow="create-issue-on-failure.yml"

# Ver logs do workflow
gh run view <run-id> --log-failed
```

### Problema 2: AI Agent Não Foi Acionado

**Causas Possíveis**:
- Issue não possui label `ai-fix`
- Workflow `ai-agent-auto-fix.yml` não tem permissões
- Já atingiu o limite de 3 tentativas

**Soluções**:
```bash
# Verificar labels da issue
gh issue view 123 --json labels

# Adicionar label manualmente
gh issue edit 123 --add-label "ai-fix"

# Verificar runs do workflow
gh run list --workflow="ai-agent-auto-fix.yml"

# Reprocessar via script PowerShell
.\process-ai-fix-queue.ps1 -IssueNumber 123
```

### Problema 3: Script PowerShell Falha

**Causas Possíveis**:
- GitHub CLI não instalado
- GitHub CLI não autenticado
- Permissões insuficientes no repositório

**Soluções**:
```powershell
# Verificar instalação do GitHub CLI
gh --version

# Se não instalado, baixar em:
# https://cli.github.com/

# Autenticar
gh auth login

# Verificar autenticação
gh auth status

# Testar acesso ao repositório
gh repo view

# Listar issues (teste básico)
gh issue list --limit 5
```

### Problema 4: Limite de Tentativas Não Funciona

**Causas Possíveis**:
- Comentários não seguem o padrão esperado
- Script ou workflow alterado incorretamente
- Issue foi editada manualmente

**Soluções**:
```bash
# Verificar comentários da issue
gh issue view 123 --json comments --jq '.comments[].body'

# Procurar pelo marcador
gh issue view 123 --json comments | Select-String "🤖 \*\*AI Agent ativado"

# Reprocessar com dry-run para diagnóstico
.\process-ai-fix-queue.ps1 -IssueNumber 123 -DryRun

# Se necessário, escalar manualmente
gh issue edit 123 --remove-label "ai-fix"
gh issue edit 123 --add-label "escalated,needs-human-review"
```

## 📊 Métricas e KPIs

### Métricas Sugeridas

#### 1. Taxa de Sucesso de Correção
```
Taxa de Sucesso = (Issues Resolvidas Automaticamente / Total de Issues) × 100
```

**Como Medir**:
```bash
# Issues resolvidas automaticamente (closed sem escalação)
gh issue list --label "ai-fix" --state closed --json number,labels \
  --jq 'map(select(.labels | map(.name) | contains(["escalated"]) | not)) | length'

# Total de issues processadas
gh issue list --label "ai-fix" --state all --json number | jq 'length'
```

#### 2. MTTR (Mean Time To Recovery)
```
MTTR = Soma(Tempo de Resolução) / Número de Issues Resolvidas
```

**Como Medir**:
```bash
# Tempo entre criação e fechamento de issues resolvidas
gh issue list --label "ai-fix" --state closed --json number,createdAt,closedAt \
  --jq 'map({number, duration: ((.closedAt | fromdateiso8601) - (.createdAt | fromdateiso8601))}) | group_by(.duration) | map({duration: .[0].duration, count: length})'
```

#### 3. Taxa de Escalação
```
Taxa de Escalação = (Issues Escaladas / Total de Issues) × 100
```

**Como Medir**:
```bash
# Issues escaladas
gh issue list --label "escalated" --state all --json number | jq 'length'

# Calcular percentual
# (Escaladas / Total) × 100
```

#### 4. Distribuição por Tipo de Falha

**Como Medir**:
```bash
# Agrupar por tipo (baseado em labels ou título)
gh issue list --label "ai-fix" --state all --json number,title,labels \
  --jq 'group_by(.title | split(":")[0]) | map({type: .[0].title | split(":")[0], count: length})'
```

### Dashboard de Exemplo

```markdown
## AI-ITSM Queue - Dashboard

### 📊 Estatísticas Gerais
- **Issues Criadas**: 150
- **Issues Resolvidas**: 102 (68%)
- **Issues Escaladas**: 35 (23%)
- **Issues em Progresso**: 13 (9%)

### ⏱️ Performance
- **MTTR Médio**: 15 minutos
- **Taxa de Sucesso**: 68%
- **Tentativas Médias**: 1.8

### 📈 Tendências (Últimos 30 dias)
| Métrica | Valor | Tendência |
|---------|-------|-----------|
| Issues/Dia | 5.0 | ↑ 10% |
| Taxa Sucesso | 68% | ↑ 5% |
| MTTR | 15 min | ↓ 20% |
| Taxa Escalação | 23% | ↓ 8% |

### 🔥 Top Tipos de Falha
1. Testes E2E (35%)
2. Build Errors (28%)
3. TypeScript (18%)
4. Deployment (12%)
5. Outros (7%)
```

## 🗺️ Roadmap

### Fase 1: Core System (Implementado) ✅
- ✅ Detecção automática de falhas
- ✅ Criação automática de issues
- ✅ Template de requisição manual
- ✅ Processamento com limite de tentativas
- ✅ Escalação automática
- ✅ Script PowerShell de gerenciamento

### Fase 2: Integração AI (Próxima)
- [ ] Integrar com GitHub Copilot Workspace
- [ ] Implementar análise de logs com LLM
- [ ] Criar estratégias de correção automática
- [ ] Implementar criação de PRs automáticos
- [ ] Adicionar validação de correções

### Fase 3: Aprendizado e Melhoria
- [ ] Sistema de feedback de correções
- [ ] Base de conhecimento de soluções
- [ ] Aprendizado de padrões de falha
- [ ] Sugestões proativas de melhorias

### Fase 4: Monitoramento Avançado
- [ ] Dashboard web com métricas em tempo real
- [ ] Alertas via Slack/Teams
- [ ] Relatórios semanais automáticos
- [ ] Integração com ferramentas APM

### Fase 5: Expansão
- [ ] Suporte a múltiplos repositórios
- [ ] Classificação ML de severidade
- [ ] Previsão de falhas
- [ ] Auto-healing de infraestrutura

## 🤝 Contribuindo

Para contribuir com melhorias no sistema:

1. Faça fork do repositório
2. Crie uma branch para sua feature (`git checkout -b feature/melhoria-itsm`)
3. Commit suas mudanças (`git commit -m 'feat: adicionar nova métrica'`)
4. Push para a branch (`git push origin feature/melhoria-itsm`)
5. Abra um Pull Request

### Áreas de Contribuição

- 🐛 **Correção de bugs** no sistema atual
- ✨ **Novas funcionalidades** (ex: novos tipos de análise)
- 📝 **Melhorias na documentação**
- 🧪 **Testes automatizados** para os workflows
- 📊 **Dashboards e visualizações** de métricas
- 🔌 **Integrações** com outras ferramentas

## 📚 Recursos Adicionais

### Documentação Relacionada
- [GitHub Actions - workflow_run](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#workflow_run)
- [GitHub Actions - permissions](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions#permissions)
- [GitHub CLI Manual](https://cli.github.com/manual/)
- [GitHub Issue Templates](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/configuring-issue-templates-for-your-repository)

### Scripts Úteis

#### Limpar Issues de Teste
```bash
# Listar issues com label 'automated' (criadas automaticamente)
gh issue list --label "automated" --state all

# Fechar em lote (USE COM CUIDADO!)
gh issue list --label "automated" --state open --json number \
  --jq '.[].number' | xargs -I {} gh issue close {}
```

#### Exportar Métricas para CSV
```bash
# Exportar histórico de issues
gh issue list --label "ai-fix" --state all --json number,title,createdAt,closedAt,labels \
  --jq 'map([.number, .title, .createdAt, .closedAt, (.labels | map(.name) | join(";"))]) | ["Number","Title","Created","Closed","Labels"], .[] | @csv' > issues-export.csv
```

#### Backup de Issues
```bash
# Fazer backup completo de todas as issues ai-fix
gh issue list --label "ai-fix" --state all --json number,title,body,comments,labels,createdAt,closedAt > backup-ai-fix-issues.json
```

## 💬 Suporte

Para suporte ou dúvidas sobre o sistema:

1. **Problemas Técnicos**: Abra uma issue com label `bug`
2. **Dúvidas**: Use as Discussions do repositório
3. **Melhorias**: Abra uma issue com label `enhancement`

## 📝 Changelog

### v1.0.0 (2026-02-18)
- ✨ Sistema inicial implementado
- ✅ 5 componentes principais criados
- ✅ Documentação completa
- ✅ Testes validados

## 📄 Licença

Este sistema é parte do projeto BidExpert e segue a mesma licença do projeto principal.

---

**Sistema AI-ITSM Queue** - Automação inteligente de correção de falhas CI/CD
