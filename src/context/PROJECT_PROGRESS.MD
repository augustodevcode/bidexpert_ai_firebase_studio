# Project Progress - BidExpert

## DONE
- **Item 1.1:** Correção da lógica de exibição do "Total de Lotes" nos cards e implementação da atualização do contador nas actions.
- **Item 1.2:** Detalhamento abrangente nos cards e modal de pré-visualização de lotes, com abas para Descrição, Especificações e Documentos.
- **Item 1.3:** Acessibilidade da documentação (editais) nas páginas de detalhe e no modal de pré-visualização.
- **Item 2.1:** Criação de perfis detalhados para comitentes e leiloeiros com páginas públicas e listagem de leilões ativos.
- **Item 2.2:** Implementação completa da funcionalidade de lance, soft-close, e criação das páginas "Meus Arremates" e "Meus Lances" com dados funcionais.
- **Item 2.3 (Parcial):** Página "Fale Conosco" como canal inicial de contato.
- **Item 3.2:** Ícones de redes sociais no rodapé e botões de compartilhamento social.
- **Item 3.5:** SEO básico implementado com metadados dinâmicos nas páginas de leilão, lote e categoria.
- **Item 4.1 (Parcial):** Sistema de notificações (Backend e UI). Notificação de lance superado implementada. Notificações de aprovação/rejeição de documentos implementadas.
- **Item 4.2:** Sistema completo de Avaliações e Perguntas/Respostas na página de lotes, com envio e listagem de dados.
- **Item 20:** Estrutura completa e funcionalidade de dados do Auditório Virtual, com seleção de lote e navegação.
- **Item 5.1:** Correção do erro "Map container is already initialized" em todas as instâncias para garantir estabilidade.
- **Admin Panel Foundation:** CRUDs completos e funcionais para todas as entidades principais.
- **Database System:** Conversão para Prisma finalizada, eliminando o antigo sistema de adapters.
- **Header & Navigation:** Implementação de megamenus dinâmicos e responsivos.
- **Painel de Usuário:** Páginas de Favoritos, Histórico, Meus Arremates/Lances, Notificações e Visão Geral agora são funcionais.
- **Refatoração do Modelo de Dados:** Status e datas foram removidos do modelo de `Lot` e agora são derivados do `Auction` principal, garantindo consistência.
- **Painel do Comitente (`/consignor-dashboard`):** Implementada a busca e exibição de dados reais (leilões, lotes, métricas financeiras) e página de configurações.
- **Relatórios Avançados:** Adicionadas novas métricas e KPIs aos relatórios do admin.
- **Gerenciamento de Habilitação (Admin):** Implementada a interface administrativa para revisar, aprovar e rejeitar os documentos enviados pelos usuários.

## DOING
- **Item 4.1 (Em Andamento):** Implementar mais gatilhos de notificação. Já foram adicionadas notificações para lance superado e para aprovação/rejeição de documentos. Próximo: notificações de arremate e início de leilão.

## NEXT
- **Item 1.1 (Avançado):** Implementar atualização em tempo real para volume de ofertas e lances via WebSockets para uma experiência de leilão ainda mais dinâmica.
- **Item 2.3 (Avançado):** Criar seção formal de "Resolução de Disputas" e integrar um sistema de suporte mais robusto (tickets ou chat).
- **Item 3.1:** Integrar um módulo de blog para marketing de conteúdo, com artigos sobre o mercado de leilões.
- **Item 3.3:** Criar um sistema de gamificação com pontos/recompensas por atividade e um módulo para gerenciar promoções especiais.
- **Item 3.4:** Integrar APIs de parceiros estratégicos para funcionalidades como simulação de frete e opções de financiamento.
- **Item 4.3:** Pesquisar e, se viável, implementar uma camada de certificação via blockchain para o registro de lances e arremates, aumentando a transparência e a segurança.


---

### 5. Technical Debt e Correções

- **(DONE)** **5.1. Componentes de Mapa (Leaflet)**
  - Corrigido erro "Map container is already initialized" em todas as instâncias.
