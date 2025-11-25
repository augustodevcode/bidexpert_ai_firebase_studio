# 📖 MANUAL DE TESTES ITSM-AI - Para Usuários

## 🎯 Objetivo do Manual

Este documento fornece um guia completo de **BDD (Behavior-Driven Development)** e **TDD (Test-Driven Development)** para que qualquer usuário possa testar todas as funcionalidades do Sistema ITSM-AI implementado na plataforma BidExpert.

---

## 📋 Pré-requisitos

Antes de começar os testes, certifique-se de que:

- ✅ O sistema está rodando (`npm run dev` ou em produção)
- ✅ O banco de dados possui as tabelas ITSM (migration aplicada)
- ✅ Você tem acesso à aplicação (usuário comum e admin)
- ✅ Você tem um navegador moderno (Chrome, Firefox, Edge)

---

## 🧪 CENÁRIOS DE TESTE BDD

### Formato dos Cenários

Cada teste segue a estrutura **Given-When-Then**:

- **Given (Dado)**: Estado inicial
- **When (Quando)**: Ação executada
- **Then (Então)**: Resultado esperado
- **And (E)**: Condições adicionais

---

## 🟦 TESTE 1: VISUALIZAÇÃO DOS BOTÕES FLUTUANTES

### Cenário 1.1: Botões aparecem na página pública

```gherkin
Feature: Botões Flutuantes de Suporte
  Como usuário da plataforma
  Quero ver os botões de suporte flutuantes
  Para acessar rapidamente o suporte

Scenario: Usuário acessa página pública
  Given que estou em uma página pública (não /admin)
  When a página carregar completamente
  Then devo ver um botão flutuante no canto inferior direito
  And o botão deve ter um gradiente colorido (azul para roxo)
  And o botão deve exibir o ícone de "Headset" (fone de ouvido)
```

#### ✅ Passos do Teste

1. **Abra o navegador** e acesse: `http://localhost:3000` ou sua URL de produção
2. **Aguarde** o carregamento completo da página
3. **Verifique** o canto inferior direito da tela
4. **Confirme** que aparece um botão redondo colorido
5. **Passe o mouse** sobre o botão (deve ter efeito hover)

#### ✅ Resultado Esperado

- Botão visível no canto inferior direito
- Botão com gradiente azul para roxo
- Ícone de headset no centro
- Efeito de escala ao passar o mouse (scale-110)

#### ❌ Possíveis Problemas

| Problema | Solução |
|----------|---------|
| Botão não aparece | Verifique o console do navegador (F12) |
| Botão aparece cortado | Verifique z-index e padding da página |
| Sem efeito hover | Limpe cache do navegador (Ctrl+F5) |

---

### Cenário 1.2: Expandir menu de opções

```gherkin
Scenario: Usuário clica no botão principal
  Given que vejo o botão flutuante
  When eu clicar no botão principal
  Then o menu deve expandir mostrando 3 opções
  And devo ver:
    | Botão     | Cor    | Ícone          |
    | FAQ       | Azul   | MessageCircle  |
    | Chat AI   | Roxo   | MessageSquare  |
    | Reportar  | Laranja| AlertCircle    |
  And o botão principal deve rotacionar 90 graus
```

#### ✅ Passos do Teste

1. **Clique** no botão flutuante principal
2. **Observe** a animação de expansão
3. **Conte** os botões que aparecem (devem ser 3)
4. **Verifique** as cores de cada botão:
   - FAQ: Azul (`bg-blue-600`)
   - Chat AI: Roxo (`bg-purple-600`)
   - Reportar: Laranja (`bg-orange-600`)

#### ✅ Resultado Esperado

- 3 botões aparecem acima do principal
- Animação suave de fade-in e slide-up
- Botão principal rotaciona 90° (ícone gira)
- Cada botão tem a cor correta

#### ❌ Possíveis Problemas

| Problema | Solução |
|----------|---------|
| Botões não aparecem | Verifique estado `isOpen` no componente |
| Animação travando | Reduza animações no navegador |
| Cores erradas | Verifique classes Tailwind aplicadas |

---

## 🟦 TESTE 2: FUNCIONALIDADE FAQ

### Cenário 2.1: Abrir modal de FAQ

```gherkin
Scenario: Usuário clica no botão FAQ
  Given que o menu de opções está expandido
  When eu clicar no botão "FAQ" (azul)
  Then um modal deve abrir
  And o título do modal deve ser "❓ Perguntas Frequentes"
  And devo ver uma lista de perguntas
```

#### ✅ Passos do Teste

1. **Expanda** o menu de suporte (clique no botão principal)
2. **Clique** no botão azul "FAQ"
3. **Aguarde** o modal abrir
4. **Verifique** o título do modal
5. **Role** a página para ver todas as FAQs

#### ✅ Resultado Esperado

- Modal abre em tela cheia ou centralizado
- Título: "❓ Perguntas Frequentes"
- Lista de cards com perguntas
- Botão "X" para fechar no canto superior

#### ❌ Possíveis Problemas

| Problema | Solução |
|----------|---------|
| Modal não abre | Verifique console para erros |
| FAQs não aparecem | Verifique array `FAQ_ITEMS` no código |
| Título cortado | Ajuste responsividade do modal |

---

### Cenário 2.2: Expandir pergunta FAQ

```gherkin
Scenario: Usuário clica em uma pergunta
  Given que o modal de FAQ está aberto
  When eu clicar em uma pergunta (card)
  Then o card deve expandir mostrando a resposta
  And a resposta deve ser legível e formatada
```

#### ✅ Passos do Teste

1. **No modal de FAQ**, clique em qualquer pergunta
2. **Observe** a animação de expansão
3. **Leia** a resposta completa
4. **Clique novamente** na mesma pergunta (deve colapsar)

#### ✅ Resultado Esperado

- Card expande com animação suave
- Resposta aparece com formatação adequada
- Botão "X" ou seta indica que pode colapsar
- Clicar novamente esconde a resposta

---

### Cenário 2.3: Não encontrou resposta

```gherkin
Scenario: Usuário não encontra resposta no FAQ
  Given que revisei todas as FAQs
  And não encontrei solução
  When eu clicar em "Não encontrou resposta?"
  Then devo ser direcionado para criar um ticket
```

#### ✅ Passos do Teste

1. **Role** até o final do modal de FAQ
2. **Localize** o link "Não encontrou resposta? Abra um ticket"
3. **Clique** no link
4. **Verifique** que o modal muda para o formulário de ticket

#### ✅ Resultado Esperado

- Modal fecha e reabre no modo "Ticket"
- Formulário de criação de ticket é exibido
- Transição suave entre os modos

---

## 🟣 TESTE 3: FUNCIONALIDADE CHAT AI

### Cenário 3.1: Abrir chat AI

```gherkin
Scenario: Usuário abre o chat AI
  Given que o menu de opções está expandido
  When eu clicar no botão "Chat AI" (roxo)
  Then um modal de chat deve abrir
  And devo ver uma mensagem de boas-vindas
  And devo ver um campo de input para digitar
```

#### ✅ Passos do Teste

1. **Expanda** o menu de suporte
2. **Clique** no botão roxo "Chat AI"
3. **Aguarde** o modal abrir
4. **Verifique** a mensagem inicial da IA
5. **Localize** o campo de input na parte inferior

#### ✅ Resultado Esperado

- Modal abre com título "💬 Chat com IA"
- Mensagem inicial: "Olá! Sou o assistente virtual..."
- Campo de input com placeholder "Digite sua mensagem..."
- Botão de enviar ao lado do input

---

### Cenário 3.2: Enviar mensagem no chat

```gherkin
Scenario: Usuário envia mensagem para a IA
  Given que o chat AI está aberto
  When eu digitar "Como faço para dar um lance?"
  And clicar no botão "Enviar"
  Then minha mensagem deve aparecer no chat (alinhada à direita)
  And após 1 segundo, devo receber uma resposta da IA
  And a resposta deve aparecer alinhada à esquerda
```

#### ✅ Passos do Teste

1. **Digite** no campo de input: "Como faço para dar um lance?"
2. **Clique** no botão de enviar (ou pressione Enter)
3. **Observe** sua mensagem aparecer no chat (lado direito, azul)
4. **Aguarde** 1 segundo
5. **Veja** a resposta da IA aparecer (lado esquerdo, cinza)

#### ✅ Resultado Esperado

- Mensagem do usuário:
  - Alinhada à direita
  - Background azul (`bg-blue-600`)
  - Texto branco
  - Timestamp exibido
- Resposta da IA:
  - Alinhada à esquerda
  - Background cinza (`bg-gray-200`)
  - Texto preto
  - Timestamp exibido
- Scroll automático para a última mensagem

#### 🧪 Mensagens de Teste

Experimente estas perguntas:

| Pergunta | Resposta Esperada |
|----------|-------------------|
| "Como faço para dar um lance?" | Resposta sobre lances |
| "Quais documentos preciso?" | Lista de documentos |
| "Formas de pagamento" | Opções de pagamento |
| "Como me habilito?" | Instruções de habilitação |
| "Qualquer outra pergunta" | Resposta genérica |

---

### Cenário 3.3: Chat com múltiplas mensagens

```gherkin
Scenario: Conversa com várias mensagens
  Given que estou no chat AI
  When eu enviar 5 mensagens diferentes
  Then todas devem aparecer no histórico
  And o scroll deve estar sempre na última mensagem
  And cada mensagem deve ter seu timestamp
```

#### ✅ Passos do Teste

1. **Envie** 5 mensagens seguidas rapidamente
2. **Verifique** que todas aparecem no chat
3. **Confirme** que o scroll está na última mensagem
4. **Role** para cima e veja mensagens antigas
5. **Verifique** timestamps de cada mensagem

#### ✅ Resultado Esperado

- Todas as mensagens aparecem em ordem
- Scroll automático para a última
- Timestamps formatados (HH:mm)
- Histórico completo mantido

---

### Cenário 3.4: Indicador de "digitando"

```gherkin
Scenario: IA está processando resposta
  Given que enviei uma mensagem
  When estiver aguardando a resposta
  Then devo ver um indicador "IA está digitando..."
  And o indicador deve ter uma animação de pontos
```

#### ✅ Passos do Teste

1. **Envie** uma mensagem
2. **Observe** imediatamente após enviar
3. **Veja** aparecer "IA está digitando..."
4. **Aguarde** a resposta (1 segundo)
5. **Confirme** que o indicador desaparece

#### ✅ Resultado Esperado

- Aparece "IA está digitando..." com animação
- Animação de 3 pontos pulsando
- Desaparece quando a resposta chega

---

## 🟠 TESTE 4: FUNCIONALIDADE DE TICKETS

### Cenário 4.1: Abrir formulário de ticket

```gherkin
Scenario: Usuário abre formulário de ticket
  Given que o menu de opções está expandido
  When eu clicar no botão "Reportar Issue" (laranja)
  Then um modal com formulário deve abrir
  And o título deve ser "🎫 Reportar Problema"
  And devo ver campos:
    | Campo       | Tipo     | Obrigatório |
    | Título      | Input    | Sim         |
    | Categoria   | Select   | Sim         |
    | Prioridade  | Select   | Sim         |
    | Descrição   | Textarea | Sim         |
```

#### ✅ Passos do Teste

1. **Expanda** o menu de suporte
2. **Clique** no botão laranja "Reportar Issue"
3. **Aguarde** o modal abrir
4. **Verifique** o título do modal
5. **Conte** os campos do formulário (devem ser 4)

#### ✅ Resultado Esperado

- Modal abre com formulário
- Título: "🎫 Reportar Problema"
- 4 campos visíveis:
  - Título (input text)
  - Categoria (select)
  - Prioridade (select)
  - Descrição (textarea)
- Botão "Criar Ticket" no final

---

### Cenário 4.2: Validação de campos obrigatórios

```gherkin
Scenario: Tentativa de criar ticket sem preencher campos
  Given que o formulário de ticket está aberto
  When eu clicar em "Criar Ticket" sem preencher nada
  Then não deve ser enviado
  And devo ver mensagens de erro nos campos
```

#### ✅ Passos do Teste

1. **Abra** o formulário de ticket
2. **Não preencha** nenhum campo
3. **Clique** em "Criar Ticket"
4. **Observe** que não acontece nada (ou aparecem erros)
5. **Verifique** bordas vermelhas ou mensagens de erro

#### ✅ Resultado Esperado

- Formulário não é enviado
- Campos obrigatórios destacados em vermelho
- Mensagens de validação aparecem
- Nenhum ticket é criado no banco

---

### Cenário 4.3: Criar ticket com sucesso

```gherkin
Scenario: Criar ticket preenchendo todos os campos
  Given que o formulário de ticket está aberto
  When eu preencher:
    | Campo       | Valor                              |
    | Título      | "Erro ao fazer login"              |
    | Categoria   | "Autenticação"                     |
    | Prioridade  | "Alta"                             |
    | Descrição   | "Não consigo fazer login com..."   |
  And clicar em "Criar Ticket"
  Then devo ver uma mensagem de sucesso
  And o modal deve mostrar o ID do ticket criado
  And após 3 segundos o modal deve fechar
```

#### ✅ Passos do Teste

1. **Abra** o formulário de ticket
2. **Preencha** todos os campos:
   - **Título**: Digite um título curto e descritivo
   - **Categoria**: Selecione uma opção do dropdown
   - **Prioridade**: Selecione uma prioridade
   - **Descrição**: Digite uma descrição detalhada (mín. 20 caracteres)
3. **Clique** em "Criar Ticket"
4. **Aguarde** a confirmação
5. **Anote** o ID do ticket criado

#### ✅ Resultado Esperado

- Formulário é enviado
- Aparece mensagem: "✅ Ticket criado com sucesso!"
- ID do ticket é exibido (ex: "ITSM-20241123-XXXX")
- Modal fecha automaticamente após 3 segundos
- Ticket é salvo no banco de dados

#### 🧪 Dados de Teste

Use estes valores para testes:

**Teste 1 - Prioridade Alta**:
```
Título: Erro ao fazer login
Categoria: Autenticação
Prioridade: Alta
Descrição: Não consigo fazer login com meu email. Aparece erro "credenciais inválidas" mesmo com a senha correta.
```

**Teste 2 - Prioridade Média**:
```
Título: Dúvida sobre lances
Categoria: Funcionalidade
Prioridade: Média
Descrição: Gostaria de entender melhor como funciona o sistema de lances automáticos.
```

**Teste 3 - Prioridade Baixa**:
```
Título: Sugestão de melhoria
Categoria: Sugestão
Prioridade: Baixa
Descrição: Seria interessante ter notificações por SMS além de email.
```

---

### Cenário 4.4: Verificar dados capturados

```gherkin
Scenario: Sistema captura dados técnicos automaticamente
  Given que criei um ticket
  When eu consultar o banco de dados
  Then devo ver que foram capturados:
    | Dado              | Exemplo                          |
    | Browser           | "Chrome"                         |
    | Versão            | "120.0.0.0"                      |
    | Tamanho de tela   | "1920x1080"                      |
    | URL da página     | "http://localhost:3000/"         |
    | User Agent        | "Mozilla/5.0..."                 |
```

#### ✅ Passos do Teste (Técnico)

1. **Crie** um ticket normalmente
2. **Anote** o ID do ticket
3. **Acesse** o banco de dados:
   ```bash
   npx prisma studio
   ```
4. **Navegue** para a tabela `ITSM_Ticket`
5. **Encontre** seu ticket pelo ID
6. **Verifique** o campo `technicalData` (JSON)

#### ✅ Resultado Esperado

Campo `technicalData` deve conter:
```json
{
  "browser": "Chrome",
  "version": "120.0.0.0",
  "screenSize": "1920x1080",
  "currentUrl": "http://localhost:3000/",
  "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)..."
}
```

---

## 🔍 TESTE 5: PAINEL ADMIN DE TICKETS

### Cenário 5.1: Acessar painel admin

```gherkin
Scenario: Admin acessa painel de tickets
  Given que sou um usuário admin
  When eu acessar "/admin/support-tickets"
  Then devo ver a página de gerenciamento
  And devo ver filtros de status
  And devo ver campo de busca
  And devo ver lista de tickets
```

#### ✅ Passos do Teste

1. **Faça login** como usuário admin
2. **Acesse**: `http://localhost:3000/admin/support-tickets`
3. **Aguarde** o carregamento
4. **Verifique** os elementos da página

#### ✅ Resultado Esperado

- Página carrega sem erros
- Título: "🎫 Suporte - Tickets"
- Filtro de status (dropdown)
- Campo de busca
- Lista de tickets (se houver)

---

### Cenário 5.2: Filtrar tickets por status

```gherkin
Scenario: Filtrar tickets abertos
  Given que estou no painel admin
  And existem tickets de diferentes status
  When eu selecionar "Aberto" no filtro de status
  Then devo ver apenas tickets com status "Aberto"
```

#### ✅ Passos do Teste

1. **No painel admin**, localize o filtro de status
2. **Clique** no dropdown
3. **Selecione** "Aberto"
4. **Aguarde** a lista atualizar
5. **Verifique** que todos os tickets exibidos têm status "Aberto"

#### ✅ Resultado Esperado

- Lista filtra instantaneamente
- Apenas tickets "Aberto" são exibidos
- Badge de status mostra "Aberto" (azul)

#### 🧪 Teste com Todos os Status

Repita o teste para cada status:

- ✅ Aberto
- ✅ Em Andamento
- ✅ Resolvido
- ✅ Fechado
- ✅ Todos (sem filtro)

---

### Cenário 5.3: Buscar tickets

```gherkin
Scenario: Buscar ticket por título
  Given que estou no painel admin
  When eu digitar "login" no campo de busca
  Then devo ver apenas tickets cujo título contém "login"
```

#### ✅ Passos do Teste

1. **Localize** o campo de busca (ícone de lupa)
2. **Digite**: "login"
3. **Aguarde** a lista filtrar automaticamente
4. **Verifique** os resultados

#### ✅ Resultado Esperado

- Lista filtra enquanto você digita
- Apenas tickets com "login" no título aparecem
- Busca é case-insensitive

#### 🧪 Testes de Busca

Experimente buscar por:

| Termo | Deve Encontrar |
|-------|----------------|
| "login" | Tickets com "login" no título |
| "ITSM-" | Tickets pelo ID |
| Email do usuário | Tickets daquele usuário |

---

### Cenário 5.4: Visualizar detalhes do ticket

```gherkin
Scenario: Ver detalhes de um ticket
  Given que estou vendo a lista de tickets
  When eu clicar em "Ver Detalhes" em um ticket
  Then devo ver todas as informações do ticket
```

#### ✅ Passos do Teste

1. **Localize** um ticket na lista
2. **Clique** no botão "Ver Detalhes"
3. **Observe** o que acontece

#### ⚠️ Nota

Esta funcionalidade está preparada mas o modal de detalhes ainda não está implementado. Você deve ver um log no console ou uma mensagem de "Em breve".

---

## 📊 TESTE 6: MONITOR DE QUERIES (ADMIN)

### Cenário 6.1: Visualizar monitor no rodapé

```gherkin
Scenario: Admin vê monitor de queries
  Given que sou um usuário admin
  When eu acessar qualquer página "/admin/*"
  Then devo ver um rodapé fixo no fundo da página
  And o rodapé deve mostrar estatísticas de queries
```

#### ✅ Passos do Teste

1. **Faça login** como admin
2. **Acesse** qualquer página admin (ex: `/admin/support-tickets`)
3. **Role** até o final da página
4. **Verifique** o rodapé escuro fixo

#### ✅ Resultado Esperado

- Rodapé fixo no fundo (`fixed bottom-0`)
- Background escuro (`bg-slate-900`)
- 4 estatísticas exibidas:
  - Total de Queries
  - Tempo Médio
  - Queries Lentas
  - Queries com Falha

---

### Cenário 6.2: Estatísticas atualizam automaticamente

```gherkin
Scenario: Monitor atualiza a cada 5 segundos
  Given que estou vendo o monitor
  When eu aguardar 5 segundos
  Then as estatísticas devem atualizar
  And devo ver novos valores
```

#### ✅ Passos do Teste

1. **Observe** os valores iniciais das estatísticas
2. **Anote** o valor de "Total de Queries"
3. **Aguarde** 5 segundos
4. **Faça** alguma ação no sistema (navegue, busque, etc.)
5. **Aguarde** mais 5 segundos
6. **Verifique** se os valores mudaram

#### ✅ Resultado Esperado

- Estatísticas atualizam a cada 5 segundos
- Novos valores aparecem sem refresh da página
- Contador de queries aumenta

---

### Cenário 6.3: Expandir lista de queries

```gherkin
Scenario: Ver detalhes das queries
  Given que o monitor está visível
  When eu clicar em "Ver Detalhes"
  Then uma lista de queries deve expandir
  And devo ver:
    | Informação      | Formato            |
    | Timestamp       | "14:30:25"         |
    | Endpoint        | "/api/support/..." |
    | Método          | "GET" ou "POST"    |
    | Duração         | "250ms"            |
    | Status          | Badge colorido     |
```

#### ✅ Passos do Teste

1. **No monitor**, clique em "Ver Detalhes"
2. **Observe** a lista expandir para cima
3. **Role** a lista de queries
4. **Verifique** cada campo exibido

#### ✅ Resultado Esperado

- Lista expande com animação suave
- Até 50 queries recentes são exibidas
- Cada query mostra:
  - Timestamp formatado
  - Endpoint completo
  - Método HTTP
  - Duração em ms
  - Badge colorido:
    - 🟢 Verde: < 500ms
    - 🟡 Amarelo: 500ms - 1s
    - 🔴 Vermelho: > 1s

---

### Cenário 6.4: Identificar queries lentas

```gherkin
Scenario: Detectar queries problemáticas
  Given que expandiu a lista de queries
  When eu procurar por queries com badge vermelho
  Then devo identificar queries lentas (> 1s)
  And poder investigar o endpoint problemático
```

#### ✅ Passos do Teste

1. **Expanda** a lista de queries
2. **Procure** por badges vermelhos
3. **Clique** (se possível) ou **anote** o endpoint
4. **Investigue** por que está lento

#### ✅ Resultado Esperado

- Queries lentas são visualmente destacadas
- Badge vermelho para duração > 1s
- Fácil identificação de problemas de performance

---

## 🔄 TESTE 7: INTEGRAÇÃO COMPLETA

### Cenário 7.1: Fluxo usuário completo

```gherkin
Scenario: Usuário resolve problema via chat ou ticket
  Given que sou um usuário com problema
  When eu abrir o chat AI
  And perguntar sobre meu problema
  And a IA não resolver
  When eu criar um ticket
  Then o ticket deve ser registrado
  And o admin deve ver na lista
```

#### ✅ Passos do Teste (Jornada Completa)

**Parte 1: Usuário**

1. **Acesse** a plataforma como usuário comum
2. **Clique** no botão flutuante
3. **Abra** o Chat AI (roxo)
4. **Pergunte**: "Não consigo fazer login"
5. **Receba** resposta da IA
6. **Não resolveu?** Feche o chat
7. **Clique** novamente no botão flutuante
8. **Abra** Reportar Issue (laranja)
9. **Preencha** o formulário:
   - Título: "Erro de login"
   - Categoria: "Autenticação"
   - Prioridade: "Alta"
   - Descrição: Detalhes do problema
10. **Crie** o ticket
11. **Anote** o ID do ticket

**Parte 2: Admin**

12. **Faça logout** do usuário
13. **Faça login** como admin
14. **Acesse** `/admin/support-tickets`
15. **Busque** pelo ID ou título do ticket
16. **Verifique** que o ticket aparece na lista
17. **Clique** em "Ver Detalhes"

#### ✅ Resultado Esperado

- Chat AI respondeu
- Ticket foi criado com sucesso
- Admin vê o ticket na lista
- Todas as informações do ticket estão corretas
- Dados técnicos foram capturados

---

### Cenário 7.2: Monitor registra ações do admin

```gherkin
Scenario: Queries são registradas no monitor
  Given que sou admin
  When eu realizar ações no painel (buscar, filtrar)
  Then queries devem ser registradas
  And aparecer no monitor
```

#### ✅ Passos do Teste

1. **Faça login** como admin
2. **Acesse** `/admin/support-tickets`
3. **Observe** o monitor no rodapé
4. **Realize ações**:
   - Filtre por status
   - Busque tickets
   - Navegue entre páginas
5. **Expanda** o monitor
6. **Veja** as queries registradas

#### ✅ Resultado Esperado

- Cada ação gera queries
- Queries aparecem no monitor
- Timestamps estão corretos
- Duração é razoável (< 1s)

---

## 🧪 TESTE 8: TESTES DE EDGE CASES

### Cenário 8.1: Múltiplos tickets do mesmo usuário

```gherkin
Scenario: Usuário cria 3 tickets seguidos
  Given que sou um usuário
  When eu criar 3 tickets rapidamente
  Then todos devem ser criados
  And cada um deve ter ID único
```

#### ✅ Passos do Teste

1. **Crie** o primeiro ticket
2. **Aguarde** confirmação
3. **Imediatamente** crie o segundo ticket
4. **Aguarde** confirmação
5. **Crie** o terceiro ticket
6. **Verifique** no admin que todos foram criados

#### ✅ Resultado Esperado

- 3 tickets criados com sucesso
- IDs diferentes para cada um
- Timestamps diferentes
- Todos aparecem no painel admin

---

### Cenário 8.2: Ticket com descrição muito longa

```gherkin
Scenario: Criar ticket com descrição de 1000+ caracteres
  Given que tenho um problema complexo
  When eu criar ticket com descrição muito longa
  Then deve ser aceito normalmente
```

#### ✅ Passos do Teste

1. **Abra** o formulário de ticket
2. **Cole** um texto com 1000+ caracteres na descrição
3. **Preencha** os outros campos
4. **Crie** o ticket
5. **Verifique** que foi aceito

#### ✅ Resultado Esperado

- Ticket criado com sucesso
- Descrição completa foi salva
- Não há truncamento

---

### Cenário 8.3: Caracteres especiais no ticket

```gherkin
Scenario: Ticket com emojis e caracteres especiais
  Given que quero testar encoding
  When eu criar ticket com:
    | Campo       | Valor                  |
    | Título      | "Erro com áçãõ 🚀"     |
    | Descrição   | "Símbolos: @#$%&*"     |
  Then deve funcionar normalmente
```

#### ✅ Passos do Teste

1. **Digite** no título: "Erro com áçãõ 🚀"
2. **Digite** na descrição: "Símbolos: @#$%&* e emojis 🎉"
3. **Crie** o ticket
4. **Verifique** no admin que foi salvo corretamente

#### ✅ Resultado Esperado

- Acentos preservados
- Emojis exibidos corretamente
- Símbolos não causam erro

---

### Cenário 8.4: Chat com 20 mensagens

```gherkin
Scenario: Conversa longa no chat
  Given que estou no chat AI
  When eu enviar 20 mensagens seguidas
  Then todas devem aparecer
  And o scroll deve funcionar corretamente
```

#### ✅ Passos do Teste

1. **Abra** o chat AI
2. **Envie** 20 mensagens diferentes rapidamente
3. **Verifique** que todas aparecem
4. **Role** para cima e para baixo
5. **Teste** o scroll automático

#### ✅ Resultado Esperado

- Todas as 20 mensagens aparecem
- Scroll funciona sem travar
- Última mensagem sempre visível
- Performance não degrada

---

## 🔐 TESTE 9: SEGURANÇA E PERMISSÕES

### Cenário 9.1: Usuário comum tenta acessar admin

```gherkin
Scenario: Acesso não autorizado ao painel admin
  Given que sou um usuário comum (não admin)
  When eu tentar acessar "/admin/support-tickets"
  Then devo ser bloqueado ou redirecionado
```

#### ✅ Passos do Teste

1. **Faça login** como usuário comum (não admin)
2. **Tente acessar**: `http://localhost:3000/admin/support-tickets`
3. **Observe** o resultado

#### ✅ Resultado Esperado

- Acesso negado
- Redirecionamento para home ou página de erro
- Mensagem "Acesso não autorizado"

---

### Cenário 9.2: Usuário vê apenas seus tickets

```gherkin
Scenario: Isolamento de dados entre usuários
  Given que criei 3 tickets
  When outro usuário acessar o sistema
  Then ele não deve ver meus tickets na API
```

#### ✅ Passos do Teste (Técnico)

1. **Usuário A**: Crie 3 tickets
2. **Anote** os IDs
3. **Faça logout**
4. **Usuário B**: Faça login com outro usuário
5. **Tente acessar**: `GET /api/support/tickets?userId=A`
6. **Verifique** a resposta

#### ✅ Resultado Esperado

- API retorna apenas tickets do próprio usuário
- Não há vazamento de dados entre usuários

---

## 📱 TESTE 10: RESPONSIVIDADE

### Cenário 10.1: Mobile - Botões flutuantes

```gherkin
Scenario: Botões funcionam em mobile
  Given que estou em um dispositivo mobile
  When eu acessar a plataforma
  Then os botões flutuantes devem aparecer
  And serem clicáveis com o dedo
```

#### ✅ Passos do Teste

1. **Abra** DevTools (F12)
2. **Ative** modo mobile (Ctrl+Shift+M)
3. **Selecione** um dispositivo (iPhone, Samsung, etc.)
4. **Atualize** a página
5. **Teste** os botões flutuantes

#### ✅ Resultado Esperado

- Botões visíveis em telas pequenas
- Tamanho adequado para toque (min 44x44px)
- Menu expande sem sair da tela
- Modais ajustam ao tamanho da tela

---

### Cenário 10.2: Tablet - Layout do admin

```gherkin
Scenario: Painel admin em tablet
  Given que estou em um tablet (768px)
  When eu acessar "/admin/support-tickets"
  Then o layout deve se adaptar
```

#### ✅ Passos do Teste

1. **Configure** DevTools para 768px de largura
2. **Acesse** o painel admin
3. **Verifique** o layout
4. **Teste** filtros e busca

#### ✅ Resultado Esperado

- Layout responsivo
- Cards não quebram
- Filtros acessíveis
- Monitor de queries ajustado

---

## 🎯 CHECKLIST DE VALIDAÇÃO FINAL

### ✅ Funcionalidades Básicas

- [ ] Botões flutuantes aparecem em páginas públicas
- [ ] Menu expande ao clicar no botão principal
- [ ] FAQ abre e mostra perguntas
- [ ] Chat AI abre e responde mensagens
- [ ] Formulário de ticket valida campos
- [ ] Ticket é criado com sucesso
- [ ] ID único é gerado para cada ticket

### ✅ Painel Admin

- [ ] Página `/admin/support-tickets` carrega
- [ ] Lista de tickets é exibida
- [ ] Filtro de status funciona
- [ ] Busca encontra tickets
- [ ] Monitor de queries aparece no rodapé
- [ ] Estatísticas atualizam a cada 5s
- [ ] Lista de queries expande

### ✅ Segurança

- [ ] Usuário comum não acessa painel admin
- [ ] Queries registram apenas do usuário logado
- [ ] Dados técnicos são capturados corretamente

### ✅ Performance

- [ ] Queries < 500ms (maioria)
- [ ] Modais abrem < 1s
- [ ] Chat responde < 2s
- [ ] Monitor não trava a página

### ✅ Responsividade

- [ ] Funciona em desktop (1920x1080)
- [ ] Funciona em laptop (1366x768)
- [ ] Funciona em tablet (768x1024)
- [ ] Funciona em mobile (375x667)

---

## 🐛 TROUBLESHOOTING

### Problema: Botões não aparecem

**Possíveis Causas**:
- Layout não importou o componente
- CSS não carregou
- JavaScript com erro

**Solução**:
1. Verifique console (F12)
2. Confirme que `FloatingSupportButtons` está no layout
3. Limpe cache (Ctrl+F5)

---

### Problema: Modal não abre

**Possíveis Causas**:
- Estado `isOpen` travado
- Z-index muito baixo
- Overlay bloqueando

**Solução**:
1. Verifique estado no React DevTools
2. Aumente z-index do modal (z-50)
3. Teste em navegador diferente

---

### Problema: Chat não responde

**Possíveis Causas**:
- API `/api/support/chat` não configurada
- Banco de dados sem tabela `itsm_chat_logs`
- Erro no backend

**Solução**:
1. Verifique console do servidor
2. Teste API diretamente:
   ```bash
   curl -X POST http://localhost:3000/api/support/chat \
     -H "Content-Type: application/json" \
     -d '{"message":"teste"}'
   ```
3. Aplique migration SQL

---

### Problema: Ticket não é criado

**Possíveis Causas**:
- Campos obrigatórios não preenchidos
- Usuário não autenticado
- Erro no banco de dados

**Solução**:
1. Preencha todos os campos
2. Verifique se está logado
3. Confira logs do servidor
4. Verifique tabela `itsm_tickets` existe

---

### Problema: Admin não vê tickets

**Possíveis Causas**:
- Nenhum ticket criado ainda
- Filtro aplicado
- Erro na API

**Solução**:
1. Crie tickets primeiro
2. Remova filtros (selecione "Todos")
3. Teste API:
   ```bash
   curl http://localhost:3000/api/support/tickets
   ```

---

### Problema: Monitor não atualiza

**Possíveis Causas**:
- JavaScript desabilitado
- useEffect não rodando
- API retornando erro

**Solução**:
1. Verifique console
2. Recarregue a página
3. Teste manualmente:
   ```bash
   curl http://localhost:3000/api/admin/query-monitor
   ```

---

## 📊 MÉTRICAS DE TESTE

### Cobertura Esperada

| Funcionalidade | Testes | Aprovação |
|----------------|--------|-----------|
| Botões Flutuantes | 4 cenários | 100% |
| FAQ | 3 cenários | 100% |
| Chat AI | 4 cenários | 100% |
| Tickets | 4 cenários | 100% |
| Admin Panel | 4 cenários | 100% |
| Monitor | 4 cenários | 100% |
| Integração | 2 cenários | 100% |
| Edge Cases | 4 cenários | 100% |
| Segurança | 2 cenários | 100% |
| Responsividade | 2 cenários | 100% |

**Total**: 33 cenários | **Meta**: 100% de aprovação

---

## 🎓 GLOSSÁRIO

| Termo | Significado |
|-------|-------------|
| **BDD** | Behavior-Driven Development (Desenvolvimento Guiado por Comportamento) |
| **TDD** | Test-Driven Development (Desenvolvimento Guiado por Testes) |
| **ITSM** | IT Service Management (Gerenciamento de Serviços de TI) |
| **Edge Case** | Caso extremo ou situação não usual |
| **Timestamp** | Marca de tempo (data/hora) |
| **Modal** | Janela popup que aparece sobre o conteúdo |
| **Dropdown** | Menu suspenso |
| **Badge** | Etiqueta colorida indicadora |
| **Scroll** | Rolagem da página |
| **Hover** | Passar o mouse sobre |

---

## 📞 SUPORTE

Se encontrar algum problema durante os testes:

1. **Verifique** este manual novamente
2. **Consulte** a seção de Troubleshooting
3. **Crie** um ticket usando o próprio sistema (meta! 🎯)
4. **Documente** o erro com prints e logs

---

## ✅ CONCLUSÃO

Este manual cobre **100% das funcionalidades** implementadas no Sistema ITSM-AI.

Seguindo todos os cenários de teste você será capaz de:
- ✅ Validar que o sistema funciona completamente
- ✅ Identificar possíveis problemas
- ✅ Documentar bugs encontrados
- ✅ Garantir qualidade antes do deploy

**Boa sorte com os testes! 🚀**

---

*Última atualização: Novembro 2024*
*Versão do Manual: 1.0.0*
