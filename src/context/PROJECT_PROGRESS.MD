# Project Progress - BidExpert

## DONE
- **Item 1.1:** Correção da lógica de exibição do "Total de Lotes" nos cards e implementação da atualização do contador nas actions.
- **Item 1.2:** Detalhamento abrangente nos cards e modal de pré-visualização de lotes, com abas para Descrição, Especificações e Documentos.
- **Item 1.3:** Acessibilidade da documentação (editais) nas páginas de detalhe e no modal de pré-visualização.
- **Item 2.1:** Criação de perfis detalhados para comitentes e leiloeiros com páginas públicas e listagem de leilões ativos.
- **Item 2.2:** Implementação completa da funcionalidade de lance, soft-close, e criação das páginas "Meus Arremates" e "Meus Lances" com dados funcionais.
- **Item 2.3 (Finalizado):** Página "Fale Conosco" agora é funcional e salva mensagens no banco de dados, com painel de admin para visualização.
- **Item 3.2:** Ícones de redes sociais no rodapé e botões de compartilhamento social.
- **Item 3.3 (Parcial):** Sistema de gamificação inicial implementado com medalha de "Primeiro Arremate" no perfil do usuário.
- **Item 3.5:** SEO básico implementado com metadados dinâmicos nas páginas de leilão, lote e categoria.
- **Item 4.1 (Finalizado):** Sistema de notificações agora inclui alertas para lances superados, aprovação/rejeição de documentos e status de habilitação, com contador dinâmico no header.
- **Item 4.2:** Sistema completo de Avaliações e Perguntas/Respostas na página de lotes, com envio e listagem de dados.
- **Item 20:** Estrutura completa e funcionalidade de dados do Auditório Virtual, com seleção de lote e navegação.
- **Admin Panel Foundation:** CRUDs completos e funcionais para todas as entidades principais, incluindo gerenciamento de Templates de Documentos.
- **Database System:** Conversão para Prisma finalizada. Scripts de seed aprimorados.
- **Header & Navigation:** Implementação de megamenus dinâmicos e responsivos.
- **Painel de Usuário:** Todas as seções do dashboard do usuário agora são funcionais e exibem dados reais.
- **Refatoração do Modelo de Dados:** Status e datas foram removidos do modelo de `Lot` e agora são derivados do `Auction` principal.
- **Gerenciamento de Habilitação (Admin):** Interface administrativa funcional para revisar e gerenciar documentos.
- **Painel do Comitente (Finalizado):** Todas as seções (Visão Geral, Meus Leilões, Meus Lotes, Venda Direta, Relatórios, Financeiro, Configurações) estão agora ativas e funcionais, exibindo dados reais do comitente logado.
- **Refatoração do Formulário de Lotes:** O formulário de lotes agora exibe os "Bens" disponíveis para loteamento de forma contextual ao leilão.
- **Geração de Documentos (Estrutura):** A plataforma agora tem a estrutura (modelos, permissões, UI) pronta para a futura implementação da geração de PDFs.

## DOING
- **Geração de Documentos (PDF):** Implementar a lógica de servidor para pegar os templates customizados, preenchê-los com dados do sistema e gerar um arquivo PDF para download. Isso pode envolver uma biblioteca como `puppeteer` ou `pdf-lib`.

## NEXT
- **Item 1.1 (Avançado):** Implementar atualização em tempo real para volume de ofertas e lances via WebSockets para uma experiência de leilão ainda mais dinâmica.
- **Item 2.3 (Avançado):** Criar seção formal de "Resolução de Disputas" e integrar um sistema de suporte mais robusto (tickets ou chat).
- **Item 3.1:** Integrar um módulo de blog para marketing de conteúdo, com artigos sobre o mercado de leilões.
- **Item 3.3 (Avançado):** Expandir o sistema de gamificação com mais pontos, recompensas e tipos de medalhas.
- **Item 3.4:** Integrar APIs de parceiros estratégicos para funcionalidades como simulação de frete e opções de financiamento.
- **Item 4.3:** Pesquisar e, se viável, implementar uma camada de certificação via blockchain para o registro de lances e arremates, aumentando a transparência e a segurança.

---

### 5. Technical Debt e Correções

- **(DONE)** **5.1. Componentes de Mapa (Leaflet)** - Corrigido erro "Map container is already initialized" em todas as instâncias.
