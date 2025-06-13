
# Project Progress

## DONE
- Criação do diretório `context` e arquivos iniciais de contexto.
- Correção de diversos erros de build e runtime:
    - `Expected unicode escape` em `mysql.adapter.ts`.
    - `Blocked cross-origin request` (porta 6000) em `next.config.ts`.
    - `getFavoriteLotIdsFromStorage not a function` (runtime) em `header.tsx`.
    - Aviso de `searchParams.auctionId` em Server Component (`/admin/lots/new/page.tsx`).
    - `SyntaxError: Unexpected end of JSON input` em `mysql.adapter.ts` (função `mapToLot`).
    - `<AdminSellersPage> is an async Client Component` em `/admin/sellers/page.tsx`.
    - `ER_WRONG_VALUE_COUNT_ON_ROW` (MySQL) ao criar lote, corrigindo placeholders.
- **Início da Funcionalidade de Customização do Site (Admin):**
    - **Configurações da Plataforma (`platform_settings`):**
        - Adicionados campos `siteTitle` e `siteTagline` aos tipos (`PlatformSettings`, `PlatformSettingsFormData`).
        - Atualizado schema Zod (`settings-form-schema.ts`) para incluir `siteTitle` e `siteTagline`.
        - Adicionados inputs para Título e Tagline no formulário de configurações (`/admin/settings/settings-form.tsx`).
        - Campos para `platformPublicIdMasks` adicionados ao formulário (lógica de máscaras pendente).
        - Schema dos bancos de dados SQL (MySQL e PostgreSQL) atualizados para incluir colunas `site_title` e `site_tagline` na tabela `platform_settings`.
        - Métodos `getPlatformSettings` e `updatePlatformSettings` nos adaptadores SQL atualizados para ler/gravar os novos campos.
    - **Exibição no Header:**
        - Componente `Header` (`src/components/layout/header.tsx`) agora busca e exibe dinamicamente `siteTitle` e `siteTagline` das configurações da plataforma.

## WORKING
- **Continuar implementação da customização do site:**
    - **Próximo:** Permitir upload e configuração de Logo do Site e Favicon.
    - **Depois:** Implementar gerenciamento de Temas de Cores (seleção de tema ativo, criação/edição de temas).

## NEXT
- **Customização do Site (Continuação):**
    - Adicionar campos para upload/URL de Logo do Site e Favicon no formulário de configurações.
    - Atualizar `platform_settings` (tipos, schema, adaptadores) para armazenar estas URLs.
    - Modificar o layout (provavelmente `src/app/layout.tsx` para favicon e `src/components/layout/header.tsx` para logo) para exibir o logo e favicon dinamicamente.
    - Implementar a interface para gerenciar Temas de Cores (CRUD para temas, seleção de tema ativo).
    - Aplicar o tema de cores ativo dinamicamente (atualizando variáveis CSS HSL em `globals.css` ou via `<style>` tag no layout).
- **Implementar as funcionalidades centrais do PRD:**
    - Catálogo de Leilões (Home Page).
    - Página de Detalhes do Lote.
    - Autenticação de Usuário (Login, Registro, Perfil).
    - Busca de Leilões.
    - Navegação do Site (Menus, Rodapé completo).
    - Páginas de Conteúdo Estático.
    - Funcionalidades de Orientação de Leilão com IA (Genkit).
- **Refinamentos e Melhorias:**
    - Concluir a lógica de `platformPublicIdMasks`.
    - Revisar e completar todos os TODOs nos adaptadores de banco de dados.
    - Implementação completa da Biblioteca de Mídia.
    - Testes abrangentes em todas as funcionalidades e com todos os sistemas de banco de dados suportados.
    - Melhorar a segurança com verificações de permissão robustas em Server Actions.
