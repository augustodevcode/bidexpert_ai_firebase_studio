# Mapa do Produto: Plataforma de Leilões

Este documento oferece uma visão geral de alto nível sobre os módulos e funcionalidades da plataforma. **Para regras de negócio, especificações detalhadas e diretrizes de implementação, consulte o arquivo oficial: `REGRAS_NEGOCIO_CONSOLIDADO.md`.**

## 1. Sumário Executivo

**Perfis de Usuário Principais:**
*   Administrador, Analista de Leilão, Arrematante, Comitente (Vendedor), Tenant (Leiloeiro), Convidado, Auditor.

---

## 2. Premissas e Arquitetura

*   **Arquitetura Multi-Tenant:** A plataforma suporta múltiplos "tenants" (leiloeiros), com dados isolados por `tenantId`.
*   **Stack:** Next.js, Prisma, MySQL, Zod, Genkit.
*   **Autenticação:** JWT/OAuth2.

---

## 3. Módulos Principais

| Módulo | Descrição |
| :--- | :--- |
| **Arquitetura Multi-Tenant** | Isolamento de dados entre diferentes leiloeiros. |
| **Gestão de Leilões e Lotes** | Criação, configuração e gerenciamento de leilões e seus lotes. |
| **Módulo Judicial** | Gerenciamento de processos judiciais e entidades relacionadas. |
| **Painel do Administrador** | Hub central para todas as operações de gerenciamento. |
| **Jornada do Arrematante** | Fluxo completo do usuário final, do cadastro ao arremate. |
| **CMS & Configurações** | Gestão de conteúdo e configurações da plataforma. |
| **Componentes Universais** | `UniversalCard` e `UniversalListItem` para exibição consistente. |
| **Endereçamento Unificado** | `AddressGroup.tsx` para entrada de endereços. |

---

## 4. Orientações para Desenvolvedores

**Consulte sempre o `REGRAS_NEGOCIO_CONSOLIDADO.md` para diretrizes técnicas e de negócio detalhadas.**
- Sempre use o contexto de tenant (`getTenantIdFromRequest`).
- Edite o schema do Prisma diretamente em `prisma/schema.prisma`.
- Mantenha a coesão dos serviços e use os componentes universais.
- Crie testes para novas funcionalidades.
