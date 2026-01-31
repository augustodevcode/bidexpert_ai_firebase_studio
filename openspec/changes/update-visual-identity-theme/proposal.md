# Change: Atualizar CRUD de Identidade Visual e Temas

## Why
A página atual não cobre todas as opções de tema do shadcn e não persiste dados no banco, causando inconsistências visuais e perda de configuração.

## What Changes
- Incluir todas as opções de cores do tema disponíveis no shadcn.
- Persistir configurações de identidade visual e tema via Prisma.
- Integrar logo com biblioteca de mídia, exigindo que o logo exista antes de ser usado.

## Impact
- Affected specs: visual-identity
- Affected code: páginas de configurações, schema Prisma, handlers de persistência e biblioteca de mídia. usarão apenas as cores do tema persistidos nessa tela. Ou seja o que foi salvo nesse crud irá ser o padrão do site. E se o usuário quiser mudar, então aquele botão de alterar tema de escuro para claro e cores passará para seu painel administrativo (no cabeçalho do painel admin e não mais nas páginas publicas.
