# Roteiro de Vídeo: Tutorial para Administradores da Plataforma de Leilões

## 1. Estrutura Geral e Objetivos

*   **Título do Vídeo:** "Dominando a Plataforma: Um Guia Completo para Administradores de Leilões"
*   **Público-alvo:** Administradores de Leilão, Analistas de Leilão, Gerentes de Operações.
*   **Objetivo Principal:** Capacitar o administrador a gerenciar de ponta a ponta o ciclo de vida de um leilão (com foco em leilões judiciais), desde a configuração inicial até a análise pós-venda, utilizando as ferramentas do painel de administração.
*   **Tom:** Profissional, claro, direto e prático.

### Estrutura do Vídeo (Capítulos)
1.  **Abertura (0:00 - 0:30):** Gancho rápido e dinâmico mostrando o potencial da plataforma.
2.  **Visão Geral do Painel (0:30 - 1:30):** Um tour pelas principais seções do dashboard de admin.
3.  **Passo a Passo: Publicando um Leilão Judicial (1:30 - 5:00):** O núcleo do tutorial, cobrindo o fluxo completo.
    *   Cadastro do Processo e Bens
    *   Criação do Leilão e Lotes
    *   Publicação
4.  **Monitoramento e Gestão Ativa (5:00 - 6:30):** Acompanhando um leilão em andamento.
5.  **Análise de Resultados Pós-Leilão (6:30 - 7:30):** Verificando vendas e gerando relatórios.
6.  **Runbook de Anomalias (7:30 - 8:30):** Como lidar com situações comuns (disputas, falhas de pagamento).
7.  **Encerramento e Próximos Passos (8:30 - 9:00):** Resumo e call-to-action.

---

## 2. Storyboard e Script (Teleprompter)

| Cena # | Duração (est.) | Visual (O que é mostrado na tela) | Áudio (Narração / Script do Teleprompter) | Asset a Capturar |
| :--- | :--- | :--- | :--- | :--- |
| 1 | 0:30 | **(Música energética)** Montagem rápida: lances subindo, cronômetro correndo, martelo batendo (animação), e termina com o logo da plataforma sobre o painel de admin. | "(Narração) Gerenciar um leilão de sucesso exige poder, controle e precisão. E se você pudesse ter tudo isso em um só lugar? Bem-vindo ao painel de administração da sua nova plataforma de leilões. Vamos começar." | Animação de logo; Captura de tela do `/admin/dashboard`; UI de leilão ao vivo. |
| 2 | 1:00 | **(Música de fundo suave)** Cursor do mouse passeando pelo painel de admin, destacando os menus principais: "Leilões", "Usuários", "Módulo Judicial", "Relatórios", "Configurações". | "Este é o seu centro de comando. Daqui, você tem acesso a todas as ferramentas para gerenciar cada aspecto da sua operação. Vamos dar uma olhada rápida nas seções principais antes de mergulhar no nosso primeiro leilão." | Gravação de tela: Navegação pelo menu de `/admin/layout.tsx`. |
| 3.1 | 1:30 | Foco na seção "Módulo Judicial". O admin clica em "Processos" e depois em "Novo". A tela de cadastro de processo é preenchida. | "Tudo começa com a organização. Para um leilão judicial, o primeiro passo é cadastrar o processo. Acesse o Módulo Judicial e preencha os dados essenciais: número do processo, vara e comarca. Em seguida, na aba 'Bens', adicione os itens que serão leiloados, com fotos e valores de avaliação." | Gravação de tela: Fluxo em `/admin/judicial-processes/new` e cadastro de `Bem`. |
| 3.2 | 1:00 | Admin navega para "Leilões" -> "Novo". Seleciona "Judicial", associa o processo recém-criado. Configura as datas e regras (anti-sniping, etc.). | "Com o processo e os bens no sistema, vamos criar o leilão. Selecione a modalidade 'Judicial' e vincule o processo que acabamos de cadastrar. Defina as datas do primeiro e segundo pregão e as regras, como o tempo de extensão para lances no final." | Gravação de tela: Fluxo em `/admin/auctions/new`. |
| 3.3 | 1:00 | Dentro do leilão criado, o admin vai para a aba "Lotes", cria um novo lote e associa o bem (o apartamento) a ele. Define o preço inicial. Por fim, muda o status do leilão para "Aberto para Lances". | "Agora, vamos transformar nossos bens em lotes. Crie um lote, associe o bem correspondente e defina o valor inicial. Quando tudo estiver pronto, altere o status do leilão para 'Aberto para Lances'. Pronto! Seu leilão está no ar." | Gravação de tela: Fluxo em `/admin/auctions/[id]/lots` e mudança de `AuctionStatus`. |
| 4 | 1:30 | Tela de monitoramento do leilão. Mostra lances chegando em tempo real. Em outra parte da tela, mostra a página `/admin/habilitations` com um usuário pendente. O admin clica e aprova a documentação. | "Com o leilão ativo, seu trabalho é monitorar. Acompanhe os lances em tempo real e gerencie os participantes. Na tela de Habilitações, você pode analisar e aprovar os documentos dos arrematantes, garantindo que apenas usuários validados participem." | Gravação de tela: Dashboard de leilão ao vivo; Gravação de tela: `/admin/habilitations/[userId]`. |
| 5 | 1:00 | Leilão com status "Finalizado". O admin acessa a aba de resultados, onde vê o lote vendido, o vencedor e o valor final. Em seguida, navega para `/admin/reports` e gera um relatório de vendas. | "Leilão encerrado! Na tela de resultados, você tem a visão completa: o que foi vendido, por quanto e para quem. Para uma análise mais profunda, vá até a seção de Relatórios e exporte os dados de performance com apenas um clique." | Gravação de tela: Leilão finalizado; Gravação de tela: `/admin/reports`. |
| 6 | 1:00 | Simulação visual. Mostra um arremate com status "Pagamento Falhou". O admin clica e tem a opção de "Notificar Usuário" ou "Cancelar Venda". Mostra a tela de um documento rejeitado. | "E se algo der errado? No seu painel, você pode gerenciar exceções. Se um pagamento falhar, você pode contatar o usuário ou até mesmo cancelar a venda e ofertar ao segundo colocado. Documentos suspeitos? Rejeite-os com uma justificativa clara." | Mockup/Screenshot de status "Pagamento Falhou"; Captura da tela de rejeição de documentos. |
| 7 | 0:30 | **(Música inspiradora volta a subir)** Encerramento com o logo da plataforma e texto na tela. | "Você está no controle. Com estas ferramentas, você está pronto para conduzir leilões de forma eficiente, transparente e lucrativa. Para mais detalhes, consulte nossa documentação ou entre em contato com nosso suporte. Boas vendas!" | Animação de logo; URL da documentação na tela. |

---

## 3. Lista de Assets Requeridos

### A. Gravações de Tela (Screencasts)
-   [ ] Login e navegação geral no painel de admin (`/admin/dashboard`).
-   [ ] Fluxo completo de criação de leilão judicial:
    -   [ ] `/admin/judicial-processes/new`
    -   [ ] Adição de `Bem` ao processo.
    -   [ ] `/admin/auctions/new` (associando o processo).
    -   [ ] `/admin/auctions/[id]/lots` (criando o lote e associando o bem).
    -   [ ] Mudança de status do leilão para publicá-lo.
-   [ ] Tela de monitoramento de um leilão ao vivo.
-   [ ] Tela de análise e aprovação de documentos (`/admin/habilitations`).
-   [ ] Tela de resultados de um leilão finalizado.
-   [ ] Tela de geração de relatórios (`/admin/reports`).

### B. Gráficos e Animações
-   [ ] Abertura com logo animado e montagem de cenas.
-   [ ] Lower thirds (barras de texto) para introduzir cada seção (ex: "Passo 1: Cadastrando o Processo").
-   [ ] Setas e destaques animados para apontar para botões e menus importantes durante a gravação de tela.
-   [ ] Animação de "martelo batendo" para transições.
-   [ ] Encerramento com logo e informações de contato/documentação.

### C. Áudio
-   [ ] Faixa de música energética para abertura e encerramento.
-   [ ] Faixa de música de fundo neutra e corporativa para o miolo do tutorial.
-   [ ] Gravação da narração em alta qualidade (sem ruídos).
