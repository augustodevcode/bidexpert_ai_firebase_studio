
# Project Context History

Este arquivo contém um resumo do contexto do projeto BidExpert, incluindo seu propósito, funcionalidades chave, e decisões importantes tomadas durante o desenvolvimento.

## Sessão Inicial (Junho 2024) - Foco em Configuração, Correções de Build e Início da Customização

**Objetivo Principal do Projeto BidExpert (Conforme PRD):**

Criar uma plataforma de leilões online chamada "BidExpert" com as seguintes funcionalidades principais:
*   **Catálogo de Leilões:** Exibição filtrável e ordenável de leilões na home page.
*   **Detalhes do Lote:** Página amigável para detalhes do lote, destacando informações chave, mídia e especificidades do leilão.
*   **Autenticação de Usuário:** Páginas para criação de conta, login e gerenciamento de perfil.
*   **Busca de Leilões:** Funcionalidade para localizar leilões por critérios como categoria e localização.
*   **Navegação do Site:** Estruturas de menu claras e um rodapé abrangente.
*   **Conteúdo Estático:** Entrega eficiente de páginas de marketing e informativas.
*   **Orientação de Leilão com IA:** Geração de recomendações sobre detalhes ótimos de listagem e previsão de valores de abertura baseados em dados históricos e tendências.

**Tecnologias Definidas:**
NextJS, React, ShadCN UI, Tailwind CSS, Genkit (para IA), TypeScript. Suporte para bancos de dados SQL (PostgreSQL e MySQL) com um adaptador selecionável.

**Diretrizes de Estilo:**
*   Ícones line-based, transições sutis.
*   Esquema de cores: Predominantemente branco (#FFFFFF) e cinza claro (#F2F2F2) para fundos. Azul primário (#3498db) para elementos interativos. Verde suave (#2ecc71) como cor de acento secundária.
*   Fonte: 'Open Sans' para títulos e corpo de texto.
*   Layout: Baseado em cards com cantos arredondados (8px) e sombras sutis.
*   Amplo espaço em branco e preenchimento consistente.

**Progresso e Decisões Chave nesta Sessão:**

1.  **Correções de Erros de Build e Runtime:**
    *   Resolvido erro `Expected unicode escape` em `src/lib/database/mysql.adapter.ts` (linha ~507) removendo uma barra invertida (`\`) extra.
    *   Adicionada a origem `https://6000-...cloudworkstations.dev` ao `allowedDevOrigins` em `next.config.ts` para corrigir erro de cross-origin.
    *   Resolvido erro `Cannot read properties of undefined (reading 'call')` relacionado a `getFavoriteLotIdsFromStorage` em `src/components/layout/header.tsx`. Foi garantido que a função está corretamente exportada em `src/lib/recently-viewed-store.ts` e importada no header. O problema persistiu como um aviso de build ("Attempted import error"), mas o erro de runtime foi o foco da correção.
    *   Resolvido erro `searchParams should be awaited` em `/admin/lots/new/page.tsx` ajustando a forma como `searchParams.auctionId` é acessado em um Server Component.
    *   Resolvido erro `SyntaxError: Unexpected end of JSON input` em `mysql.adapter.ts` (função `mapToLot`) ao fazer `JSON.parse()` em strings que poderiam ser vazias ou nulas para `galleryImageUrls` e `mediaItemIds`. A lógica foi ajustada para verificar se a string é não vazia antes do parse.
    *   Resolvido erro `<AdminSellersPage> is an async Client Component` movendo a busca de dados em `/admin/sellers/page.tsx` para `useEffect` e `useState`, removendo `async` da declaração da função do componente.
    *   Resolvido erro `ER_WRONG_VALUE_COUNT_ON_ROW` no MySQL ao criar um lote, corrigindo o número de placeholders na query SQL em `mysql.adapter.ts` (de 56 para 58).

2.  **Início da Implementação da Customização do Site (Admin):**
    *   **Objetivo:** Permitir que administradores customizem aspectos do site, como Título e Tagline, persistindo essas configurações no banco de dados (`platform_settings` table).
    *   **Tipos e Schemas:**
        *   Atualizado `src/types/index.ts`: Adicionados `siteTitle` e `siteTagline` à interface `PlatformSettings` e `PlatformSettingsFormData`.
        *   Atualizado `src/app/admin/settings/settings-form-schema.ts`: Adicionados `siteTitle` e `siteTagline` ao `platformSettingsFormSchema` com validações Zod.
    *   **Formulário de Configurações (`/admin/settings/settings-form.tsx`):**
        *   Adicionados campos `Input` para "Título do Site" e "Tagline do Site".
        *   Atualizados os `defaultValues` no `useForm` para incluir os novos campos.
        *   Adicionados campos para `platformPublicIdMasks` (embora a lógica completa de máscaras ainda não esteja implementada, os campos foram adicionados para evitar erros de formulário não controlado).
    *   **Adaptadores de Banco de Dados (MySQL e PostgreSQL):**
        *   Modificadas as instruções `CREATE TABLE IF NOT EXISTS platform_settings` em `mysql.adapter.ts` e `postgres.adapter.ts` para incluir as colunas `site_title` (VARCHAR(100)) e `site_tagline` (VARCHAR(255)).
        *   Atualizada a função `getPlatformSettings` em ambos os adaptadores para buscar os novos campos, retornando valores padrão ("BidExpert", "Leilões Online Especializados") se não encontrados.
        *   Atualizada a função `updatePlatformSettings` em ambos os adaptadores para salvar os novos campos.
    *   **Exibição no Header (`src/components/layout/header.tsx`):**
        *   O componente foi modificado para ser um Client Component.
        *   Utiliza `useEffect` e `useState` para buscar `platformSettings` através da server action `getPlatformSettings`.
        *   Exibe dinamicamente o `siteTitle` e `siteTagline` buscados. Se não definidos, usa "BidExpert" e "Seu parceiro especialista em leilões online." como fallback respectivamente.

**Próximos Passos Imediatos Discutidos:**
*   Continuar a implementação da customização do site, potencialmente adicionando opções para logo, favicon e cores do tema.
*   Implementar as funcionalidades principais do PRD (Catálogo de Leilões, Detalhes do Lote, Autenticação, etc.).

**Decisões de Arquitetura:**
*   Uso de Server Actions para mutações de dados.
*   Componentes de Cliente (`'use client';`) para páginas que necessitam de interatividade e hooks do React (ex: `useState`, `useEffect`).
*   Busca de dados em Componentes de Cliente geralmente é feita dentro de `useEffect`.
*   Manter arquivos de `actions.ts` separados para cada entidade/módulo no admin.
*   Utilizar um sistema de adaptadores de banco de dados para alternar entre Firestore, MySQL e PostgreSQL.
