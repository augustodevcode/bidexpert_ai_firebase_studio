# 🕵️ Auction Sniper - Auto-Activation Setup Guide

**Tempo Total**: 5 minutos | **Dificuldade**: Muito Fácil | **Resultado**: SubAgent automático em todos os chats

---

## 📋 O Que Você Vai Fazer

```
Setup Inicial (5 min)
  ↓
Copilot detecta automaticamente contexto de leilão
  ↓
SubAgent ativa SEM você pedir
  ↓
Recebe validação completa do protocolo (115+ checks)
  ↓
Tudo automatizado, sem prefixo 🕵️
```

---

## 🎯 PASSO 1: Copie as Instruções

**Abra este arquivo** (você está aqui):
```
.agent/agents/auction-sniper-qa.AUTO-ACTIVATE.md
```

**Copie a seção "INSTRUCTIONS"** (aquela entre os backticks):

```powershell
# Windows PowerShell - copiar automático:
Get-Content ".agent\agents\auction-sniper-qa.AUTO-ACTIVATE.md" | 
  Select-String -Pattern "=== INSTRUCTIONS ===" -A 100 | 
  Set-Clipboard
```

Ou **manualmente**:
1. Abra: `.agent/agents/auction-sniper-qa.AUTO-ACTIVATE.md`
2. Encontre: `=== DETECTION LOGIC ===`
3. Até: `===` (fim das instruções)
4. Copie tudo (Ctrl+A, Ctrl+C)

---

## 🚀 PASSO 2: Abra Custom Instructions no Copilot

### Visual Step-by-Step

```
1️⃣ Abra VS Code ou GitHub Copilot

2️⃣ Clique no ícone "⚙️ Settings" no canto inferior esquerdo
    ↓
    Ou: Ctrl + , (abre Settings)

3️⃣ Na caixa de busca, digite:
    "Copilot Custom Instructions"
    ↓
    (Deve aparecer 1 resultado)

4️⃣ Clique em "Copilot Custom Instructions"

5️⃣ Você verá um campo grande (Text Input)

6️⃣ Cole o conteúdo que você copiou (Ctrl+V)

7️⃣ Procure pela opção:
    ☐ "Apply to all chats"
    ☐ (marque a caixa)

8️⃣ Procure pela opção:
    ☐ "Apply to all workspaces"
    ☐ (marque a caixa - IMPORTANTE)

9️⃣ Clique em "Save" ou "Apply"

🔟 Reload Copilot: Ctrl+K (novo chat)
```

---

## 📸 Screenshots (Passo-a-Passo Visual)

### Passo 1: Settings
```
┌─────────────────────────────────────┐
│ VS Code Window                      │
│                                     │
│ [Seu código aqui...]                │
│                                     │
│ ⚙️ Settings (canto inferior)         │
└─────────────────────────────────────┘
```

### Passo 2: Search Bar
```
┌─────────────────────────────────────┐
│ Settings Window                     │
│                                     │
│ 🔍 Search: "Copilot Custom Instru.."│
│                                     │
│ ✓ Copilot: Custom Instructions      │
│   ✓ Copilot: Chat: Exclude Dir      │
│                                     │
└─────────────────────────────────────┘
```

### Passo 3: Text Area
```
┌─────────────────────────────────────┐
│ Copilot: Custom Instructions        │
│                                     │
│ ┌───────────────────────────────┐   │
│ │ 🕵️ AUCTION SNIPER & QA      │   │
│ │ AUTO-ACTIVATION PROTOCOL     │   │
│ │                               │   │
│ │ === DETECTION LOGIC ===       │   │
│ │ Sempre que detectar QUALQUER  │   │
│ │ menção de:                    │   │
│ │ • Leilão, auction...          │   │
│ │ • Bid, bidding, lance...      │   │
│ │ [... continua ...]            │   │
│ │                               │   │
│ └───────────────────────────────┘   │
│                                     │
│ ☐ Apply to all chats ✓              │
│ ☐ Apply to all workspaces ✓         │
│                                     │
│ [   Save   ] [  Cancel  ]           │
│                                     │
└─────────────────────────────────────┘
```

---

## ✅ PASSO 3: Verificar Setup

### Test 1: Trigger Simples (5 segundos)

**Abra um novo chat** (Ctrl+L) e digite:

```
Implementei função de ROI em src/lib/roi-calculator.ts

Pode validar se está correto?
```

**Resultado esperado** (em 2-3 segundos):
- Agent aparece dizendo: `🕵️ Auto-Activated: auction-sniper-qa`
- Aplica Bloco 3 (ROI) + Bloco 5 (Security)
- Exige validação matemática
- Pede testes unitários

**Se NÃO aparecer**: Ir para "Troubleshooting" abaixo

### Test 2: Trigger Crítico (5 segundos)

```
Bug crítico: usuário conseguiu dar 2 bids no mesmo lote
em menos de 1 segundo. Dois débitos paralelos.

Isso é race condition?
```

**Resultado esperado**:
- Agent ativa com máxima prioridade
- Bloco 5 + 6 ativados
- Vocabulário crítico ("MUST", "Exige prova")
- Demand stack trace

### Test 3: Sem Trigger (5 segundos)

```
Qual é a capital do Brasil?
```

**Resultado esperado**:
- Agent NÃO ativa (não é contexto de leilão)
- Resposta normal, sem protocolo

---

## 🔍 Troubleshooting

### ❌ Problema: Agent não está ativando

**Solução**:
1. Verificar se Custom Instructions foi salvo
   - Abra novamente: Ctrl+, > Copilot Custom Instructions
   - Texto está lá? SIM → Próximo passo
   - Texto desapareceu? Copie e cole novamente

2. Recarregar Copilot
   - Ctrl+K (fecha chat)
   - Clique em "+" (novo chat)
   - Digite: `bid` (keyword simples)
   - Agent deve ativar

3. Se ainda não funcionar
   - Feche VS Code completamente
   - Abra novamente
   - Repita test acima

4. Última opção: Manual SubAgent
   - Copilot às vezes precisa de ajuda
   - Use: `runSubagent { "agentName": "auction-sniper-qa", ... }`

---

### ❌ Problema: Agent ativa quando NÃO deveria

**Solução**:
```
Pausar Agent nesta conversa:
🚫 Pause Auction Sniper para esta pergunta
[Sua pergunta aqui]
```

---

### ❌ Problema: Custom Instructions não aparece

**Solução**:
1. Verificar extensão Copilot instalada
   ```powershell
   # Terminal VSCode:
   Extensions > Buscar "GitHub Copilot"
   Deve estar instalado e habilitado (✓)
   ```

2. Se não estiver, instalar:
   - VSCode > Extensions
   - Buscar: "GitHub Copilot"
   - Clique em "Install"

3. Reload VSCode após instalar

---

## 📝 Quick Copy-Paste Commands

### Para PowerShell (Copiar automático)

```powershell
# 1. Copiar instruções
Get-Content ".agent\agents\auction-sniper-qa.AUTO-ACTIVATE.md" | Set-Clipboard

# 2. Verificar se copiou
Get-Clipboard | head -20
# (deve mostrar "🕵️ AUCTION SNIPER")
```

### Para Terminal Linux/Mac

```bash
# 1. Copiar instruções
cat .agent/agents/auction-sniper-qa.AUTO-ACTIVATE.md | pbcopy  # Mac
cat .agent/agents/auction-sniper-qa.AUTO-ACTIVATE.md | xclip   # Linux

# 2. Verificar
pbpaste | head -20
```

---

## 🎯 Checklist Final

Antes de considerar completo:

- [ ] Arquivo `.agent/agents/auction-sniper-qa.AUTO-ACTIVATE.md` existe
- [ ] Copiei as instruções (seção DETECTION LOGIC até fim)
- [ ] Abri Copilot Custom Instructions
- [ ] Colei o texto no campo
- [ ] Marquei "Apply to all chats"
- [ ] Marquei "Apply to all workspaces"
- [ ] Cliquei Save/Apply
- [ ] Recarreguei Copilot (Ctrl+K)
- [ ] Test 1 (ROI) passou ✓
- [ ] Test 2 (Race Condition) passou ✓
- [ ] Test 3 (Off-topic) passou ✓

✅ **COMPLETO!** Agent agora ativa automaticamente em todos os chats

---

## 🚀 Próximos Passos

### Agora que está ativado:

1. **Use normalmente**
   - Escrever código de leilão
   - Mencionar em chat
   - Agent ativa automaticamente

2. **Customize conforme necessário**
   - Adicionar novos keywords em Custom Instructions
   - Modificar trigger logic
   - Ajustar blocos prioritários

3. **Monitor**
   - Observe se agent ativa no momento certo
   - Ajuste se necessário

---

## 📞 Support

**Se algo não funcionar**:
1. Veja `auction-sniper-qa.AUTO-ACTIVATE.md` seção "Troubleshooting"
2. Veja `USAGE.md` para Como Invocar Manualmente
3. Se bug real: criar issue em `.github/issues/`

---

**Version**: 1.0.0 | **Last Updated**: 7/02/2026 | **Status**: ✅ Ready

**Próximo**: Teste seus 3 scenarios e aproveite o agent automático!
