# 🤖 Configuração do GitHub Copilot Coding Agent

## Como o agente conhece as regras do projeto?

O **GitHub Copilot Coding Agent** (usado para resolver issues via GitHub.com) lê as regras do projeto a partir de dois arquivos especiais no repositório:

| Arquivo | Lido por | Propósito |
|---------|----------|-----------|
| `AGENTS.md` | GitHub Copilot Coding Agent, OpenAI Codex | Regras globais para agentes que operam via GitHub |
| `.github/copilot-instructions.md` | GitHub Copilot no VS Code e Coding Agent | Instruções detalhadas de tecnologia, estilo e negócio |

Ambos os arquivos são lidos **automaticamente** — não é necessário nenhuma configuração manual no momento de criar uma issue ou iniciar uma tarefa.

---

## Configuração VS Code (já feita)

O arquivo `.vscode/settings.json` já contém as configurações necessárias para o GitHub Copilot no VS Code:

```json
{
  "github.copilot.chat.codeGeneration.useInstructionFiles": true,
  "github.copilot.features.customInstructions": true,
  "chat.useNestedAgentsMdFiles": true,
  "chat.includeReferencedInstructions": true
}
```

Estas configurações garantem que:
- O Copilot leia `.github/copilot-instructions.md` automaticamente
- As instruções de subagentes em `.agent/` sejam consideradas
- Instruções referenciadas sejam incluídas no contexto

---

## Hierarquia de Fontes de Regras

```
AGENTS.md                          ← Lido pelo Copilot Coding Agent (GitHub.com)
    │
    └──► .github/copilot-instructions.md   ← Arquivo mestre de regras
              │
              ├── .agent/rules/            ← Regras específicas por persona
              ├── .agent/workflows/        ← Workflows obrigatórios
              ├── .agent/agents/           ← Agentes especializados
              ├── .github/skills/          ← Skills por domínio
              └── context/                 ← Contexto do projeto
                    ├── REGRAS_NEGOCIO_CONSOLIDADO.md
                    ├── AI_PROJECT_RULES.md
                    └── QUALITY_SECURITY_WORKFLOW.md
```

---

## Regras Críticas que o Agente DEVE seguir

### 1. Branches
- Sempre criar branch a partir de `demo-stable`
- Nunca fazer push direto em `main`
- Solicitar autorização antes de qualquer merge

### 2. Ambiente de Desenvolvimento
- Usar porta isolada (9006, 9007...) para não conflitar com DEMO (9005)
- Banco DEV: `bidexpert_dev` (MySQL local)
- URL de acesso: `http://dev.localhost:9006`

### 3. Qualidade (Gate Pré-PR)
```bash
npm ci
npm run typecheck
npm run build
# + evidências Playwright
```

### 4. Stack Obrigatória
- **Frontend**: Next.js, React, TypeScript, Tailwind CSS, ShadCN UI
- **Backend**: Prisma, Zod, Server Actions
- **Testes**: Vitest (unitários), Playwright (E2E)

---

## Verificar se o agente está configurado corretamente

Para confirmar que o Copilot Coding Agent lerá as regras:

1. ✅ `AGENTS.md` existe na raiz do repositório
2. ✅ `.github/copilot-instructions.md` existe
3. ✅ `.vscode/settings.json` tem `"github.copilot.chat.codeGeneration.useInstructionFiles": true`

Se algum destes estiver faltando, o agente operará sem as regras do projeto.

---

## Não é necessário nenhuma configuração adicional

### GitHub Copilot Coding Agent (GitHub.com)
O Coding Agent detecta e lê `AGENTS.md` **automaticamente** ao trabalhar em qualquer issue do repositório. Não é necessário:
- Adicionar comentários especiais nas issues
- Configurar variáveis de ambiente no GitHub
- Instalar extensões adicionais

### GitHub Copilot no VS Code
O Copilot no VS Code lê `.github/copilot-instructions.md` automaticamente quando a configuração `"github.copilot.chat.codeGeneration.useInstructionFiles": true` está ativa em `.vscode/settings.json` — o que já está configurado neste repositório.

As regras entram em efeito na próxima vez que qualquer agente for invocado, sem necessidade de reinicialização.
