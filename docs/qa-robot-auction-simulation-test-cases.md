# Plano de Testes QA — Simulação de Leilão (1 Admin + 10 Bots)

## 1) Objetivo
Validar ponta a ponta o cenário de leilão com alta concorrência simulada, garantindo:
- Criação e publicação correta de leilão/lotes pelo admin.
- Participação concorrente de 10 usuários robôs.
- Integridade dos lances, ordenação e resultado final.
- Evidências suficientes para auditoria (logs, screenshots e relatório).

## 2) Escopo
- Fluxo de autenticação (`admin` e `bots`).
- Cadastro/associação de ativos ao lote.
- Publicação para `ABERTO_PARA_LANCES`.
- Disputa de lances simultânea.
- Encerramento e validação do vencedor.

## 3) Pré-condições
- Ambiente acessível (preferencialmente URL de homologação/preview estável).
- Dados mínimos existentes: tenant, admin válido, 10 contas bot válidas.
- Permissões de admin para criar leilão/lote e publicar.
- Relógio do servidor sem desvio relevante.
- Playwright report habilitado para coleta de evidências.

## 4) Massa de dados sugerida
- 1 usuário administrador.
- 10 usuários bots (`bot1` ... `bot10`).
- 1 leilão com ao menos 1 lote.
- Valor inicial de lote e incremento configurados.

## 5) Casos de teste funcionais (BDD)

### CT-01 — Login do administrador
**Dado** que o admin está na tela de login  
**Quando** informa credenciais válidas e confirma  
**Então** deve acessar área autenticada sem erro 4xx/5xx.

### CT-02 — Criação de leilão e lote
**Dado** que o admin está autenticado  
**Quando** cria um leilão com lote válido  
**Então** o lote deve ficar visível no painel administrativo com status inicial esperado.

### CT-03 — Publicação para disputa
**Dado** leilão/lote criados  
**Quando** o admin publica para `ABERTO_PARA_LANCES`  
**Então** o lote deve ficar navegável na URL pública de detalhe.

### CT-04 — Login dos 10 bots
**Dado** 10 contas de bots válidas  
**Quando** cada bot autentica no sistema  
**Então** todos devem ter sessão ativa sem redirecionamento inesperado para login.

### CT-05 — Disputa concorrente de lances
**Dado** lote aberto para lances  
**Quando** 10 bots lançam em sequência concorrente  
**Então** o maior lance deve prevalecer, sem duplicidade inconsistente ou regressão de valor.

### CT-06 — Ordenação e trilha de lances
**Dado** múltiplos lances já enviados  
**Quando** o histórico de lances é consultado  
**Então** a ordenação deve refletir horário/valor corretamente e o último maior lance deve ser o topo.

### CT-07 — Encerramento de lote
**Dado** lote em disputa com lances válidos  
**Quando** o tempo encerra (ou cron de fechamento executa)  
**Então** o status muda para encerrado e o vencedor corresponde ao maior lance válido.

### CT-08 — Pós-arremate
**Dado** lote encerrado com vencedor  
**Quando** admin e vencedor consultam o resultado  
**Então** ambos visualizam o mesmo arrematante e valor final.

## 6) Casos negativos e de robustez

### CT-09 — Bot sem autenticação
Tentar lançar sem sessão válida deve retornar bloqueio e não registrar lance.

### CT-10 — Lance abaixo do mínimo
Enviar valor menor que incremento/regras deve falhar com mensagem clara e sem persistência.

### CT-11 — Corrida de dois lances no mesmo instante
Executar dois lances concorrentes no mesmo milissegundo e validar consistência de winner/top bid.

### CT-12 — Reabertura indevida após encerramento
Após encerrar, novas tentativas de lance devem ser rejeitadas e auditáveis.

## 7) Evidências obrigatórias por execução
- Screenshot do lote antes da disputa.
- Screenshot do histórico após disputa.
- Screenshot do resultado final (vencedor/valor).
- Export do relatório Playwright (`playwright-report-vercel`).
- Log de console do browser sem erros críticos bloqueantes.
- Log de servidor com timestamp da janela de teste.

## 8) Critérios de aceite
- 100% dos CT-01 a CT-08 aprovados.
- CT-09 a CT-12 sem violar regras de negócio.
- Nenhuma divergência entre UI, API e estado final persistido.
- Evidências anexadas ao ciclo de QA.

## 9) Roteiro rápido de execução (QA)
1. Executar login admin e publicar leilão/lote.
2. Autenticar os 10 bots e abrir o mesmo lote.
3. Simular rodada de lances concorrentes.
4. Encerrar lote e validar vencedor/valor final.
5. Capturar evidências e consolidar relatório de execução.

## 10) Matriz de rastreabilidade (Caso × Risco × Evidência)

| Caso | Risco coberto | Validação principal | Evidência mínima |
|---|---|---|---|
| CT-01 | Falha de autenticação/admin sem sessão | Login admin com credenciais válidas | Screenshot pós-login + log de rede sem 401/500 |
| CT-02 | Criação inconsistente de leilão/lote | Persistência e exibição no painel admin | Screenshot do cadastro salvo + ID/slug do lote |
| CT-03 | Lote não publicado para disputa | Transição para `ABERTO_PARA_LANCES` e URL pública | Screenshot de status + URL pública acessível |
| CT-04 | Falha de sessão concorrente dos bots | 10 sessões válidas em paralelo | Lista de bots autenticados + capturas por amostragem |
| CT-05 | Inconsistência de lance concorrente | Maior lance prevalece sem regressão | Histórico de lances + valor final em evidência |
| CT-06 | Ordenação incorreta no histórico | Sequência temporal/valor coerente | Screenshot histórico ordenado + horário dos eventos |
| CT-07 | Encerramento incorreto do lote | Status final e vencedor consistente | Screenshot pós-encerramento + registro do cron/evento |
| CT-08 | Divergência pós-arremate | Consistência de dados para admin e vencedor | Captura em dois perfis + comparação de valor/vencedor |
| CT-09 | Lance sem autenticação aceito indevidamente | Bloqueio de ação sem sessão | Mensagem de bloqueio + ausência de registro de lance |
| CT-10 | Regra de incremento não aplicada | Rejeição de lance inválido | Mensagem de validação + estado do lance inalterado |
| CT-11 | Condição de corrida em lances simultâneos | Determinismo do lance vencedor/top bid | Traço temporal dos dois lances + resultado único |
| CT-12 | Reabertura indevida após fechamento | Imutabilidade após encerramento | Tentativa rejeitada + status encerrado preservado |
