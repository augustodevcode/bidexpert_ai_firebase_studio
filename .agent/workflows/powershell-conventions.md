# PowerShell Naming, Formatting & Timestamp Standards

> **REGRA OBRIGATÓRIA:** Todo agente AI que inicia um bloco PowerShell DEVE renomear a janela terminal e registrar timestamps em cada interação.

## 1. Convenções de Nomenclatura

### 1.1 Renomear Janela PowerShell

**Quando:** Antes do primeiro comando em cada bloco PowerShell  
**Formato:** `Tarefa: [Descrição Curta] (Porta [XXXX])`  
**Cmdlet:** `$Host.UI.RawUI.WindowTitle`

#### Exemplos

```powershell
# [23/02/2026 14:30:15] Renomear janela com título descritivo
$Host.UI.RawUI.WindowTitle = "Tarefa: Iniciar Aplicação DEV (Porta 9006)"

# Depois execute os comandos normalmente
Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
```

**Variações de Títulos:**
- `Tarefa: Verificar Porta Disponível (Porta 9006)`
- `Tarefa: Branch Feature Auction Filter (Porta 9007)`
- `Tarefa: Executar Seed Master Data (Banco DEV)`
- `Tarefa: Build & Typecheck (Pre-PR)`
- `Tarefa: E2E Tests - Login Flow (Demo)`

---

## 2. Timestamps: Formato & Localização

### 2.1 Formato Português (PADRÃO)

```
Formato: DD/MM/YYYY HH:MM:SS
Exemplo: 23/02/2026 14:30:15

# Gerado com PowerShell:
$(Get-Date -Format "dd/MM/yyyy HH:mm:ss")

# Em scripts, para usar como variável:
$timestamp = Get-Date -Format "dd/MM/yyyy HH:mm:ss"
Write-Host "[$timestamp] Iniciando processo..."
```

### 2.2 Onde Registrar Timestamps

#### **Em Comentários PowerShell** (dentro do bloco de código)

```powershell
# [23/02/2026 14:30:15] Parar processos Node anteriores
Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue

# [23/02/2026 14:30:16] Definir variáveis de ambiente
$env:PORT=9006
$env:DATABASE_URL="mysql://root:senha@localhost:3306/bidexpert_dev"

# [23/02/2026 14:30:17] Gerar cliente Prisma
npx prisma generate

# [23/02/2026 14:30:25] Iniciar servidor
node .vscode/start-9006-dev.js
```

#### **Em Markdown (antes de cada bloco PowerShell)**

```markdown
**[23/02/2026 14:30:15]** Parar processos Node e definir ambiente:

\`\`\`powershell
Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
$env:PORT=9006
\`\`\`

**[23/02/2026 14:30:25]** Iniciar servidor de desenvolvimento:

\`\`\`powershell
node .vscode/start-9006-dev.js
\`\`\`
```

### 2.3 Quando Registrar Timestamps

Registre timestamps ANTES DE:

1. **Cada bloco PowerShell principal** (em markdown)
2. **Cada comando crítico** (em comentário dentro do bloco)
3. **Transições de estado** (verificações, installs, builds, execução)

❌ **NÃO registre** timestamps para:
- Comentários explicativos longos
- Linhas de continuação de comando
- Variáveis definidas sequencialmente sem ação

### 2.4 Template Completo: Inicialização Robusta

```powershell
# [23/02/2026 14:30:15] === INÍCIO: Iniciar Aplicação BidExpert (DEV) ===

# [23/02/2026 14:30:15] Verificar porta 9006 disponível
netstat -ano | findstr ":9006"

# [23/02/2026 14:30:16] Parar processos Node anteriores
Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue

# [23/02/2026 14:30:17] Definir variáveis de ambiente
$env:PORT=9006
$env:DATABASE_URL="mysql://root:M%21nh%40S3nha2025@localhost:3306/bidexpert_dev"
$env:NODE_ENV="development"

# [23/02/2026 14:30:18] Gerar cliente Prisma
npx prisma generate

# [23/02/2026 14:30:25] Iniciar servidor customizado
node .vscode/start-9006-dev.js

# [23/02/2026 14:35:42] === FIM: Servidor iniciado com sucesso ===
```

---

## 3. Padrões de Execução Sequencial

### 3.1 Checklist de Inicialização (com Timestamps)

Sempre use esta sequência quando iniciando um novo ambiente:

```powershell
# [23/02/2026 14:30:15] 1. Parar processos anteriores
Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue

# [23/02/2026 14:30:16] 2. Definir porta e banco de dados
$env:PORT=9006
$env:DATABASE_URL="mysql://root:M%21nh%40S3nha2025@localhost:3306/bidexpert_dev"

# [23/02/2026 14:30:17] 3. Sincronizar dependências
npm ci

# [23/02/2026 14:30:35] 4. Gerar cliente Prisma
npx prisma generate

# [23/02/2026 14:30:42] 5. Executar typecheck
npm run typecheck

# [23/02/2026 14:30:55] 6. Iniciar servidor
node .vscode/start-9006-dev.js
```

### 3.2 Padrão: Criar Branch com Timestamp

```powershell
# [23/02/2026 14:30:15] Fazer fetch de demo-stable
git fetch origin demo-stable && git checkout demo-stable && git pull origin demo-stable

# [23/02/2026 14:30:20] Criar branch com timestamp automático
$timestamp = Get-Date -Format "yyyyMMdd-HHmm"
git checkout -b feat/auction-filter-$timestamp

# [23/02/2026 14:30:21] Verificar branch criada
git branch --show-current
```

### 3.3 Tratamento de Erros

Sempre adicionar comentários com timestamp antes de blocos de tratamento:

```powershell
# [23/02/2026 14:30:15] Tentar conectar ao banco de dados
try {
    # [23/02/2026 14:30:16] Validar DATABASE_URL
    if ([string]::IsNullOrEmpty($env:DATABASE_URL)) {
        throw "DATABASE_URL não definida"
    }
    # [23/02/2026 14:30:17] Testar conexão
    npx prisma db execute --stdin <<< "SELECT 1"
    Write-Host "[$(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')] Conexão bem-sucedida"
} catch {
    Write-Host "[$(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')] ERRO: $_"
    exit 1
}
```

---

## 4. Quick Reference para Agentes

### 4.1 Comando Rápido: Renomear Janela

```powershell
$Host.UI.RawUI.WindowTitle = "Tarefa: [Descrição] (Porta [XXX])"
```

### 4.2 Gerar Timestamp Atual

```powershell
# Copiar-colar direto
Get-Date -Format "dd/MM/yyyy HH:mm:ss"

# Usar em echos
Write-Host "[$(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')] Mensagem aqui"

# Em comentários
# [23/02/2026 14:30:15] Texto do comentário
```

### 4.3 Verificações Pré-Execução

```powershell
# Verificar porta
netstat -ano | findstr ":9006"

# Verificar processo Node
Get-Process -Name node -ErrorAction SilentlyContinue

# Testar conexão TCP
Test-NetConnection -ComputerName 127.0.0.1 -Port 9006
```

### 4.4 Logs Estruturados

```powershell
# Iniciar tarefa
Write-Host "[$(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')] === INÍCIO: [Nome da Tarefa] ===" -ForegroundColor Green

# Durante execução
Write-Host "[$(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')] Executando: [ação]" -ForegroundColor Cyan

# Sucesso
Write-Host "[$(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')] ✓ [Ação completada]" -ForegroundColor Green

# Erro
Write-Host "[$(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')] ✗ ERRO: [mensagem]" -ForegroundColor Red

# Fim
Write-Host "[$(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')] === FIM: [Nome da Tarefa] ===" -ForegroundColor Green
```

---

## 5. Integração em Workflows Existentes

### 5.1 Em `.agent/workflows/parallel-development.md`

Toda tarefa de branch deve incluir:

```powershell
# [23/02/2026 14:30:15] Criar branch feature
$timestamp = Get-Date -Format "yyyyMMdd-HHmm"
git checkout -b feat/auction-filter-$timestamp
```

### 5.2 Em Scripts de Inicialização

Todo script `.vscode/*.js` ou PowerShell que inicia servidor deve:

1. Renomear janela com `$Host.UI.RawUI.WindowTitle`
2. Registrar primeira ação com timestamp
3. Registrar estado final com timestamp

### 5.3 Em Testes E2E

Bloco Playwright inicial:

```powershell
# [23/02/2026 14:30:15] === INÍCIO: Testes E2E Login Flow ===

# [23/02/2026 14:30:16] npm ci && npm run typecheck
npm ci
npm run typecheck

# [23/02/2026 14:30:45] Executar Playwright
npx playwright test tests/e2e/login.spec.ts

# [23/02/2026 14:31:00] === FIM: Testes completados ===
```

---

## 6. Validação & Troubleshooting

### 6.1 Verificar Janela Renomeada

```powershell
# Verificar o título atual
$Host.UI.RawUI.WindowTitle

# Espera-se algo como: "Tarefa: Iniciar Aplicação DEV (Porta 9006)"
```

### 6.2 Timestamps Faltando?

Se agente esqueceu de adicionar timestamps:

1. ✅ Sempre começar bloco PowerShell COM `$Host.UI.RawUI.WindowTitle`
2. ✅ Adicionar `# [timestamp]` ANTES de cada ação crítica
3. ✅ Adicionar `**[timestamp]**` em markdown ANTES de cada bloco

### 6.3 Formato de Timestamp Inconsistente?

Todos devem usar: `dd/MM/yyyy HH:mm:ss`

```powershell
# CORRETO
# [23/02/2026 14:30:15]

# INCORRETO
# [2026-02-23 14:30:15]
# [23-02-2026 2:30 PM]
# [14:30]
```

---

## 7. Checklist para Agentes de IA

Antes de executar qualquer bloco PowerShell, confirme:

- [ ] Window title renomeada: `$Host.UI.RawUI.WindowTitle = "..."`
- [ ] Primeiro comando tem timestamp em comentário
- [ ] Cada ação crítica (stop, set env, install, build) tem `# [HH:MM:SS]`
- [ ] Bloco em markdown tem `**[timestamp]**` antes dele
- [ ] Formato de timestamp: `dd/MM/yyyy HH:mm:ss`
- [ ] Comandos PowerShell (não Bash)
- [ ] Pipes com `|` (não `&&`)

---

**REFERÊNCIAS:**
- `.github/copilot-instructions.md` - Seção: PowerShell Naming & Timestamp Standards
- `AGENTS.md` - Seção: PowerShell Standards (Naming, Formatting, Timestamps)
- `.agent/workflows/parallel-development.md` - Integração com branches
- `.claude/CLAUDE.md` - Memória de Projeto
