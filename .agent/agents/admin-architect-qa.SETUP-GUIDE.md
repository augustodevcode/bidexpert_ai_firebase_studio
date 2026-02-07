# 🛠️ Admin Architect & System Auditor - Setup Guide (5 minutes)

**Goal**: Activate the 150+ attribute audit agent across VSCode, Claude, and Gemini  
**Time**: 5 minutes  
**Difficulty**: Easy (copy-paste setup)

---

## ✅ Step-by-Step Setup

### Step 1: Verify Agent Files Exist (30 seconds)

Check `.agent/agents/` directory contains:
```
✓ admin-architect-qa.agent.md (main definition - 150+ attributes)
✓ admin-architect-qa.quick-reference.md (daily checklist)
✓ admin-architect-qa.USAGE.md (how to invoke)
✓ admin-architect-qa.AUTO-ACTIVATE.md (keyword detection)
```

**If missing**: All files are created. Proceed to Step 2.

---

### Step 2: Update `.vscode/settings.json` (1 minute)

Open: `E:\SmartDataCorp\BidExpert\BidExpertVsCode\bidexpert_ai_firebase_studio\.vscode\settings.json`

Add after existing Copilot settings:
```json
"github.copilot.chat.admin.architect.customInstructions": "🛠️ ADMIN ARCHITECT & SYSTEM AUDITOR AUTO-ACTIVATION\n\nDetect keywords: backoffice, admin, lotes, lances, compliance, security, performance, infra\n\nON DETECT:\n1. Invoke runSubagent({agentName: 'admin-architect-qa', prompt: '[user request]'})\n2. Apply 150+ audit attributes across 24 blocks\n3. Demand proof (logs, metrics, stack trace)\n4. Generate BDD scenarios\n5. Provide action items by priority (P0-P3)"
```

**Restart VSCode** to apply settings.

---

### Step 3: Update `.claude/CLAUDE.md` (1 minute)

Open: `.claude/CLAUDE.md`

Add after "Project Memory" header:
```markdown
## 🛠️ Admin Architect & System Auditor

Whenever you detect mentions of: backoffice, admin, lotes, compliance, security, infrastructure, performance, bidding engine...

AUTOMATICALLY invoke: runSubagent({
  agentName: "admin-architect-qa",
  prompt: "[user request]"
})

This validates against 150+ audit attributes across 24 thematic blocks:
1. Gestão de Lotes | 2. UI/UX Admin | 3. Motor de Lances
4. Compliance | 5. Performance | 6. Usuários | 7. Financeiro
... (8-24 listed in agent.md)

Response includes: Block analysis, BDD scenarios, action items

Key files:
- `.agent/agents/admin-architect-qa.agent.md`
- `.agent/agents/admin-architect-qa.quick-reference.md`
```

---

### Step 4: Update `.gemini/` Configuration (1 minute)

Create: `.gemini/admin-architect-qa.config.yaml`

Copy the configuration from `.gemini/auction-sniper-qa.config.yaml` but replace:
```yaml
agentName: "admin-architect-qa"
triggers:
  keywords:
    - "backoffice"
    - "admin"
    - "lotes"
    - "lances"
    - "compliance"
    - "security"
    - "performance"
    - "infra"
```

---

### Step 5: Register in Global AGENTS.md (1 minute)

Open: `AGENTS.md`

Add this section after Auction Sniper & QA entry:
```markdown
## 🛠️ Admin Architect & System Auditor

**Purpose**: Validate 150+ audit attributes across backoffice, bidding engine, compliance, performance, and infrastructure

**Scope**: 24 thematic blocks covering inventory, UI/UX, bidding, legal, performance, users, finance, monitoring, BI, marketing, security, content, post-sale, DevOps, elite features, optimization, productivity, legal blindage, AI, disaster recovery, UX refinement, metrics, governance, and architecture mastery

**When to invoke**:
- Code changes to backoffice ⚡
- Bidding engine modifications ⚡
- Infrastructure/performance issues ⚡
- Compliance/audit requirements ⚡
- Security concerns ⚡

**How to invoke**:
- **Auto (recommended)**: Mention keywords → agent activates automatically
- **Manual**: Type "🛠️ Admin Architect: [request]"
- **Via SubAgent**: Simple mention triggers auto-invocation

**Documentation**:
- Main: `.agent/agents/admin-architect-qa.agent.md`
- Quick Ref: `.agent/agents/admin-architect-qa.quick-reference.md`
- Usage: `.agent/agents/admin-architect-qa.USAGE.md`
- Auto-Activate: `.agent/agents/admin-architect-qa.AUTO-ACTIVATE.md`
```

---

## 🧪 Test the Setup (2 minutes)

### Test 1: VSCode Auto-Activation

1. Open VSCode > Copilot Chat
2. Type: `Quais validações preciso fazer no backoffice antes de deploy?`
3. **Expected**: Agent auto-activates, returns 24 blocks to validate

**Success**: ✅ Shows Admin Architect response with blocks

---

### Test 2: OFF-Topic (Should NOT Activate)

1. Type: `Qual é o preço do Bitcoin hoje?`
2. **Expected**: Normal Copilot response, NO agent activation

**Success**: ✅ Regular response, no Admin Architect invocation

---

### Test 3: Critical Priority

1. Type: `Detectamos race condition nos lances, múltiplos bids simultâneos!`
2. **Expected**: Agent activates with P0 CRÍTICO priority

**Success**: ✅ Agent responds with emergency protocol

---

## 📊 Verification Checklist

- [ ] All 5 agent files exist in `.agent/agents/`
- [ ] `.vscode/settings.json` updated with custom instructions
- [ ] `.claude/CLAUDE.md` configured
- [ ] `.gemini/admin-architect-qa.config.yaml` created
- [ ] `AGENTS.md` updated with new agent section
- [ ] Test 1 passed (auto-activation)
- [ ] Test 2 passed (off-topic not triggered)
- [ ] Test 3 passed (P0 detection)

---

## 🚀 You're Ready!

The Admin Architect & System Auditor agent is now:

✅ **Active in VSCode Copilot** - Auto-triggers on keywords  
✅ **Active in Claude AI** - Configured in project memory  
✅ **Active in Google Gemini** - Antigravity automation ready  
✅ **Registered globally** - Discoverable in AGENTS.md  
✅ **Documented** - 150+ attributes across 24 blocks defined  

**Next**: Start using it! Mention backoffice, admin, compliance, or infrastructure topics and the agent auto-activates. 🎉

---

## ❌ Troubleshooting

**Issue**: Agent not activating in VSCode  
**Solution**: Restart VSCode after updating settings.json

**Issue**: Agent activating for off-topic questions  
**Solution**: Refine keyword list in AUTO-ACTIVATE.md

**Issue**: Response is too slow  
**Solution**: Reduce number of affected blocks (agent should be smart about scope)

**Issue**: Need to disable temporarily  
**Solution**: Remove custom instructions from settings.json
