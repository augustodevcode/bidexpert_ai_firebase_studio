# BDD - Logging e Validação de Formulários

## Feature: Sistema de Logging de Ações do Usuário

### Cenário: Logging de Navegação
**Como** um desenvolvedor ou analista QA  
**Quero** que todas as navegações do usuário sejam registradas  
**Para** facilitar debug e análise de comportamento

**Dado** que o usuário está na página de listagem de leilões  
**Quando** o usuário clica em "Novo Leilão"  
**Então** um log "Navigate to create auction" deve ser registrado  
**E** o atributo `data-last-action` do body deve conter a ação  
**E** o log deve aparecer no console com categoria "navigation"

### Cenário: Logging de Seleção de Entidade
**Como** um desenvolvedor  
**Quero** registrar quando o usuário seleciona uma entidade  
**Para** rastrear fluxo de dados no formulário

**Dado** que o usuário está criando um lote  
**Quando** o usuário seleciona um processo judicial no dropdown  
**Então** um log "process selected {processId}" deve ser registrado  
**E** o log deve incluir o ID e nome do processo  
**E** o módulo deve ser identificado como "Lots"

### Cenário: Logging de Mudança de Campo
**Como** um desenvolvedor  
**Quero** registrar mudanças em campos importantes  
**Para** debug de validações e problemas de dados

**Dado** que o usuário está editando um leilão  
**Quando** o usuário altera o campo "título"  
**Então** um log "Field changed: title" deve ser registrado  
**E** o valor (truncado) deve estar nos detalhes  
**E** a categoria deve ser "form"

### Cenário: Logging de Operação CRUD
**Como** um desenvolvedor  
**Quero** registrar operações de criação/edição/exclusão  
**Para** auditoria e troubleshooting

**Dado** que o usuário preencheu um formulário de tenant  
**Quando** o usuário clica em "Salvar"  
**Então** um log "Saving data" deve ser registrado  
**E** quando a operação for bem-sucedida  
**Então** um log "Save successful" deve ser registrado  
**E** se houver erro  
**Então** um log "Save failed" deve ser registrado com categoria "error"

### Cenário: Logging de Navegação entre Seções
**Como** um desenvolvedor  
**Quero** registrar quando usuário abre/fecha seções de accordion  
**Para** entender fluxo de preenchimento do formulário

**Dado** que o usuário está em um formulário com accordion  
**Quando** o usuário clica para abrir "Informações de Contato"  
**Então** um log "Section opened: Informações de Contato" deve ser registrado  
**E** a categoria deve ser "interaction"

---

## Feature: Validação Visual de Formulários

### Cenário: Validação de Formulário com Campos Obrigatórios Faltando
**Como** um usuário  
**Quero** validar o formulário antes de submeter  
**Para** saber quais campos preciso preencher

**Dado** que o usuário está criando um novo leilão  
**E** preencheu apenas o campo "título"  
**Quando** o usuário clica em "Validar Formulário"  
**Então** um dialog deve abrir mostrando "Validação Reprovada"  
**E** deve mostrar a lista de campos obrigatórios faltando  
**E** deve mostrar estatísticas de campos preenchidos vs total  
**E** uma barra de progresso visual deve mostrar % de completude

### Cenário: Validação de Formulário Completo e Válido
**Como** um usuário  
**Quero** confirmar que o formulário está pronto para envio  
**Para** ter confiança antes de salvar

**Dado** que o usuário preencheu todos os campos obrigatórios  
**E** todos os valores são válidos  
**Quando** o usuário clica em "Validar Formulário"  
**Então** um dialog deve abrir mostrando "Validação Aprovada"  
**E** deve mostrar mensagem "Tudo Pronto!"  
**E** deve mostrar 100% de progresso  
**E** não deve mostrar erros

### Cenário: Validação com Erros de Formato
**Como** um usuário  
**Quero** ver erros específicos de validação  
**Para** corrigir campos com formato incorreto

**Dado** que o usuário preencheu um formulário de tenant  
**E** inseriu um email inválido "teste@"  
**E** inseriu uma cor primária inválida "red"  
**Quando** o usuário clica em "Validar Formulário"  
**Então** o dialog deve mostrar a lista de erros  
**E** deve incluir "contactEmail: Email inválido"  
**E** deve incluir "primaryColor: Cor primária inválida"  
**E** cada erro deve mostrar o campo e a mensagem

### Cenário: Validação Inline (Sem Dialog)
**Como** um usuário  
**Quero** ver resultado de validação inline  
**Para** não precisar abrir um dialog

**Dado** que o formulário está configurado com validação inline  
**Quando** o usuário clica em "Validar Formulário"  
**Então** um badge deve aparecer ao lado do botão  
**E** se válido, deve mostrar badge verde "✓ Válido"  
**E** se inválido, deve mostrar badge vermelho "X erros"

### Cenário: Estatísticas de Validação
**Como** um usuário  
**Quero** ver estatísticas detalhadas  
**Para** entender o progresso do preenchimento

**Dado** que o usuário abriu o dialog de validação  
**Então** deve mostrar:
  - Total de campos no formulário
  - Campos preenchidos
  - Campos válidos
  - Campos inválidos
  - Percentual de completude
  - Barra de progresso visual

---

## Feature: Integração com Playwright

### Cenário: Detecção de Última Ação via Data Attribute
**Como** um teste automatizado  
**Quero** detectar a última ação do usuário  
**Para** validar fluxo de interação

**Dado** que um teste Playwright está executando  
**E** o usuário selecionou um processo judicial  
**Quando** o teste lê o atributo `data-last-action` do body  
**Então** deve conter "process selected"  
**E** o atributo `data-last-action-time` deve ter o timestamp

### Cenário: Aguardar Ação Específica
**Como** um teste automatizado  
**Quero** aguardar uma ação específica ocorrer  
**Para** sincronizar o teste com a aplicação

**Dado** que um teste Playwright está executando  
**Quando** o teste chama `waitForFunction` esperando "auction created"  
**E** o usuário cria um leilão  
**Então** o teste deve prosseguir quando a ação ocorrer

### Cenário: Capturar Logs do Console
**Como** um teste automatizado  
**Quero** capturar logs do console  
**Para** verificar que ações foram registradas

**Dado** que um teste Playwright está executando  
**E** tem um listener para eventos de console  
**Quando** o usuário interage com o formulário  
**Então** o teste deve capturar logs com "[FORM]" ou "[SELECTION]"  
**E** deve poder verificar conteúdo específico dos logs

### Cenário: Acessar Logger Diretamente
**Como** um teste automatizado  
**Quero** acessar o logger no contexto do navegador  
**Para** fazer asserções sobre histórico de ações

**Dado** que um teste Playwright está executando  
**Quando** o teste executa `page.evaluate(() => window.__userActionLogger.getLogs())`  
**Então** deve receber array de todos os logs  
**E** pode filtrar por categoria, módulo ou data  
**E** pode fazer asserções sobre sequência de ações

---

## Feature: Auto-validação em Tempo Real

### Cenário: Validação Automática Habilitada
**Como** um usuário em formulário simples  
**Quero** que a validação ocorra automaticamente  
**Para** ver erros imediatamente ao preencher

**Dado** que o formulário tem `autoValidate: true`  
**Quando** o usuário altera qualquer campo  
**Então** a validação deve executar automaticamente  
**E** o resultado deve atualizar em tempo real  
**E** erros devem aparecer conforme usuário digita

### Cenário: Validação Manual para Forms Complexos
**Como** um usuário em formulário complexo  
**Quero** que a validação seja manual  
**Para** evitar sobrecarga de processamento

**Dado** que o formulário tem `autoValidate: false`  
**Quando** o usuário altera campos  
**Então** a validação NÃO deve executar automaticamente  
**E** deve executar apenas quando clicar no botão

---

## Feature: Logging Seletivo de Campos

### Cenário: Logging de Campos Específicos
**Como** um desenvolvedor  
**Quero** logar apenas campos importantes  
**Para** reduzir volume de logs

**Dado** que o formulário está configurado com `fieldsToLog: ['title', 'price']`  
**Quando** o usuário altera o campo "title"  
**Então** deve gerar log  
**Quando** o usuário altera o campo "description"  
**Então** NÃO deve gerar log  
**Quando** o usuário altera o campo "price"  
**Então** deve gerar log

---

## Feature: Debug via Console do Navegador

### Cenário: Visualizar Logs no Console
**Como** um desenvolvedor debugando  
**Quero** acessar logs via console  
**Para** investigar problemas

**Dado** que estou no console do navegador  
**Quando** executo `window.__userActionLogger.getLogs()`  
**Então** deve retornar array de todos os logs  
**E** cada log deve ter timestamp, categoria, ação, detalhes

### Cenário: Filtrar Logs por Categoria
**Como** um desenvolvedor  
**Quero** filtrar logs por categoria  
**Para** focar em tipo específico de ação

**Dado** que estou no console  
**Quando** executo `window.__userActionLogger.getLogs({ category: 'validation' })`  
**Então** deve retornar apenas logs de validação

### Cenário: Filtrar Logs por Módulo
**Como** um desenvolvedor  
**Quero** filtrar logs por módulo  
**Para** ver apenas ações de um módulo específico

**Dado** que estou no console  
**Quando** executo `window.__userActionLogger.getLogs({ module: 'Auctions' })`  
**Então** deve retornar apenas logs do módulo Auctions

### Cenário: Exportar Logs como JSON
**Como** um desenvolvedor  
**Quero** exportar logs  
**Para** análise offline ou compartilhamento

**Dado** que estou no console  
**Quando** executo `window.__userActionLogger.export()`  
**Então** deve retornar string JSON formatada  
**E** posso copiar e salvar em arquivo

### Cenário: Limpar Logs
**Como** um desenvolvedor  
**Quero** limpar logs acumulados  
**Para** começar análise limpa

**Dado** que estou no console  
**Quando** executo `window.__userActionLogger.clear()`  
**Então** todos os logs devem ser removidos  
**E** deve mostrar mensagem de confirmação

### Cenário: Desabilitar/Habilitar Logging
**Como** um desenvolvedor  
**Quero** desabilitar logging temporariamente  
**Para** testes sem overhead de logs

**Dado** que estou no console  
**Quando** executo `window.__userActionLogger.setEnabled(false)`  
**Então** logs param de ser registrados  
**Quando** executo `window.__userActionLogger.setEnabled(true)`  
**Então** logs voltam a ser registrados

---

## Feature: Logs Coloridos no Console

### Cenário: Cores por Categoria
**Como** um desenvolvedor  
**Quero** que logs tenham cores diferentes por categoria  
**Para** identificação visual rápida

**Dado** que estou observando o console  
**Então** logs de "navigation" devem ser azuis  
**E** logs de "form" devem ser verdes  
**E** logs de "selection" devem ser roxos  
**E** logs de "crud" devem ser âmbar  
**E** logs de "validation" devem ser rosa  
**E** logs de "interaction" devem ser ciano  
**E** logs de "error" devem ser vermelhos

---

## Feature: Performance e Limites

### Cenário: Limite de Logs em Memória
**Como** sistema  
**Quero** limitar logs em memória  
**Para** evitar vazamento de memória

**Dado** que o sistema está rodando há muito tempo  
**E** gerou mais de 500 logs  
**Quando** novos logs são adicionados  
**Então** logs mais antigos devem ser removidos  
**E** máximo de 500 logs deve ser mantido

### Cenário: Debounce em Auto-validação
**Como** sistema  
**Quero** que auto-validação use debounce  
**Para** evitar validações excessivas

**Dado** que `autoValidate: true`  
**Quando** usuário digita rapidamente  
**Então** validação deve esperar pausa na digitação  
**E** não deve validar a cada tecla pressionada
