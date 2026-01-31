## Context
A configuração de identidade visual precisa cobrir todas as opções de tema do shadcn e persistir no banco via Prisma, além de usar a biblioteca de mídia para logo.

## Goals / Non-Goals
- Goals: Persistência completa, compatibilidade com shadcn, integração com mídia.
- Non-Goals: Alterar outras configurações não relacionadas.

## Decisions
- Persistir configuração por tenant com Prisma.
- Validar logo pelo ID/URL da biblioteca de mídia antes de salvar.

## Risks / Trade-offs
- Mudanças no schema exigem migration → Mitigação: migration versionada.

## Migration Plan
1. Atualizar schema Prisma
2. Gerar migration
3. Atualizar CRUD e UI
4. Adicionar testes

## Open Questions
- Quais campos exatos de tema devem ser expostos além dos tokens shadcn padrão?
