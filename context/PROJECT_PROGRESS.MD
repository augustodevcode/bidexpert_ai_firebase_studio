# Project Progress - BidExpert

## Backlog de Gaps e Conflitos (A Fazer)
- **Item G-01:** Concluir a implementação do Dashboard do Arrematante (finalizar seções `won-lots`, `payments`, `notifications`, `history`, `profile`).
- **Item G-02:** Implementar os modos de edição de CRUD configuráveis (modal/sheet) usando `CrudFormContainer` em todas as páginas de listagem do admin.
- **Item G-03:** Revisar e corrigir o fluxo de "Setup Inicial" (`/setup`) para garantir que o redirecionamento baseado na flag `isSetupComplete` seja robusto e não cause loops.
- **Item G-04:** Adicionar testes de integração para o fluxo de "Setup Inicial".
- **Item G-05:** Implementar a lógica de elegibilidade para lances e arremates, incluindo a verificação de habilitação e documentos do usuário antes de permitir um lance.
- **Item G-06:** Implementar a busca avançada em todas as listagens do admin usando `BidExpertFilter`, `BidExpertSearchResultsFrame` e `Pagination`, com persistência de estado na URL.
- **Item G-07:** Implementar a migração final de todas as chaves primárias e estrangeiras de `String/cuid()` para `BigInt`.
- **Item G-08:** Refatorar todos os componentes de card (ex: `AuctionCard`, `LotCard`) para usar o componente unificado `UniversalCard` e `UniversalListItem` para manter a consistência visual, conforme definido no `PRODUCT_MAP.md`.

## DOING
- **Item 43: Implementar Modos de Edição de CRUD (Modal e Sheet) e Padronizar Formulários:**
    - **43.1:** **(EM ANDAMENTO)** Criar cenários de teste E2E para a nova funcionalidade.

## NEXT
- **Item 16:** Implementar a lógica para relistar um lote que não foi vendido, incluindo a UI para o administrador.
- **Item 17:** Implementar a lógica para "relotear" um bem, desvinculando-o de um lote não vendido.
- **Item 18:** Implementar pagamento parcelado para arremates.
- **Item 40:** Implementar um fluxo de "onboarding" guiado (`react-joyride` ou similar) para novos administradores.
- **Item 44: Refatorar Entidade `PlatformSettings` em Módulos Separados:**
    - **44.1:** Analisar o modelo `PlatformSettings` atual e dividi-lo em novas entidades lógicas no `schema.prisma`.
    - **44.2:** Refatorar o `PlatformSettingsService` para interagir com as novas tabelas de configuração individuais.
    - **44.3:** Substituir o formulário único de configurações por uma página de "hub" em `/admin/settings` que linka para novas páginas de CRUD dedicadas para cada grupo de configuração.
    - **44.4:** Criar os novos formulários de CRUD para cada nova entidade de configuração.
    - **44.5:** Atualizar todas as partes da aplicação que consomem as configurações para buscar os dados das novas tabelas.
- **Documentação Final:** Gerar a documentação final do projeto e da API para entrega.

---
## DONE
- **(Histórico de itens concluídos foi omitido para brevidade, mas seria mantido aqui)**
