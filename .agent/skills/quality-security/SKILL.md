# Skill: Quality & Security Guard (Shift Left)

## 📸 Evidência Obrigatória para PR (Playwright)
- Todo PR deve incluir print(s)/screenshot(s) de sucesso dos testes Playwright.
- Deve incluir link do relatório de execução (Playwright/Vitest UI) e cenário validado.
- PR sem evidência visual não deve ser aprovado nem mergeado.

Esta skill define as capacidades de análise de qualidade e segurança do agente.

## Capacidades
- Implementação de validação de dados via Zod em camadas de serviço.
- Configuração de headers de segurança (CSP, HSTS) em Next.js.
- Execução de Smoke Tests abrangentes via Playwright.
- Auditoria de dependências (npm audit) e segredos (Gitleaks).
- Escaneamento de débitos técnicos (lint/typecheck).

## Diretrizes de Uso
1. **Sempre** valide inputs externos.
2. **Sempre** capture screenshots e vídeos em testes E2E críticos.
3. **Sempre** verifique vulnerabilidades conhecidas ao adicionar dependências.

Referência: `context/QUALITY_SECURITY_WORKFLOW.md`
