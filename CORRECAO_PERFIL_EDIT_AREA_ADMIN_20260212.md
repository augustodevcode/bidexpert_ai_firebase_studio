# Correção: Edição de Perfil na Área Administrativa

## Objetivo
Garantir que a edição de perfil do usuário seja aberta no contexto administrativo (layout do painel), e não no layout público do site.

## Implementação
- Nova rota administrativa criada: `/dashboard/profile/edit`.
- Rota legada `/profile/edit` mantida com redirecionamento automático para `/dashboard/profile/edit`.
- Pontos de navegação atualizados para abrir a nova rota:
  - Menu do usuário (`user-nav`)
  - Sidebar do dashboard (`dashboard-sidebar`)
  - Botão "Editar Perfil" da página de perfil (`/profile`)
- Breadcrumb atualizado para refletir corretamente o caminho administrativo.
- Revalidação de cache ajustada para incluir `/dashboard/profile/edit` após salvar o perfil.

## BDD
### Cenário 1: Abrir edição do perfil pelo menu
- **DADO** que o usuário está autenticado
- **QUANDO** clica em "Meu Perfil" no menu do usuário
- **ENTÃO** deve acessar `/dashboard/profile/edit`

### Cenário 2: Acesso por URL legada
- **DADO** que existe acesso direto em `/profile/edit`
- **QUANDO** a URL é aberta
- **ENTÃO** deve redirecionar para `/dashboard/profile/edit`

### Cenário 3: Usuário não autenticado
- **DADO** que o usuário não está autenticado
- **QUANDO** tenta abrir `/profile/edit`
- **ENTÃO** deve ser redirecionado para login com `redirect=/dashboard/profile/edit`

## TDD / Validação Executada
- Verificação estática dos arquivos alterados: sem erros de TypeScript nos arquivos da correção.
- Teste de UI (navegação real em browser):
  - URL testada: `http://dev.localhost:9006/profile/edit`
  - Resultado observado: redirecionamento para `/dashboard/profile/edit`
  - Sem sessão: redirecionamento final para `/auth/login?redirect=/dashboard/profile/edit`
- `npm run typecheck` executado no projeto (há erros pré-existentes e não relacionados à correção desta task).
