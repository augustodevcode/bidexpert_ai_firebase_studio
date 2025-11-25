# Sistema ITSM-AI de Suporte - Implementação Completa

## 📋 Visão Geral

Este documento descreve a implementação completa do sistema ITSM-AI (IT Service Management com Inteligência Artificial) para a plataforma BidExpert.

## 🎯 Funcionalidades Implementadas

### 1. **Botões Flutuantes de Suporte**
Botões flutuantes acessíveis em todas as páginas públicas da aplicação:
- **FAQ**: Acesso rápido às perguntas frequentes
- **Chat AI**: Assistente virtual para dúvidas gerais
- **Reportar Issue**: Abertura de tickets de suporte

**Localização**: Canto inferior direito de todas as páginas
**Arquivo**: `src/components/support/floating-support-buttons.tsx`

### 2. **Modal de Chat/Suporte**
Interface unificada para interação com o sistema de suporte:
- **Modo Chat**: Conversa em tempo real com IA
- **Modo Ticket**: Formulário para abertura de tickets
- **Modo FAQ**: Lista de perguntas frequentes

**Arquivo**: `src/components/support/support-chat-modal.tsx`

### 3. **Monitor de Queries no Painel Admin**
Rodapé fixo no painel administrativo mostrando:
- Queries recentes ao banco de dados
- Tempo de execução (com alerta para queries lentas)
- Taxa de sucesso/falha
- Estatísticas em tempo real

**Localização**: Rodapé do painel `/admin`
**Arquivo**: `src/components/support/admin-query-monitor.tsx`

### 4. **Painel de Gerenciamento de Tickets**
Dashboard para a equipe de suporte gerenciar tickets:
- Listagem de todos os tickets
- Filtros por status, prioridade e categoria
- Busca por ID, título ou email do usuário
- Visualização de detalhes

**Localização**: `/admin/support-tickets`
**Arquivo**: `src/app/admin/support-tickets/page.tsx`

## 🗄️ Estrutura do Banco de Dados

### Tabelas Criadas

#### `itsm_tickets`
Armazena os tickets de suporte abertos pelos usuários.

```sql
- id: BIGINT (PK, AUTO_INCREMENT)
- publicId: VARCHAR(191) UNIQUE
- userId: BIGINT (FK -> User)
- title: VARCHAR(191)
- description: TEXT
- status: ENUM('ABERTO', 'EM_ANDAMENTO', 'AGUARDANDO_USUARIO', 'RESOLVIDO', 'FECHADO', 'CANCELADO')
- priority: ENUM('BAIXA', 'MEDIA', 'ALTA', 'CRITICA')
- category: ENUM('TECNICO', 'FUNCIONAL', 'DUVIDA', 'SUGESTAO', 'BUG', 'OUTRO')
- userSnapshot: JSON
- userAgent: TEXT
- browserInfo: TEXT
- screenSize: VARCHAR(191)
- pageUrl: TEXT
- errorLogs: JSON
- assignedToUserId: BIGINT (FK -> User) NULLABLE
- createdAt: DATETIME(3)
- updatedAt: DATETIME(3)
- resolvedAt: DATETIME(3) NULLABLE
- closedAt: DATETIME(3) NULLABLE
```

#### `itsm_messages`
Mensagens trocadas dentro de um ticket.

```sql
- id: BIGINT (PK, AUTO_INCREMENT)
- ticketId: BIGINT (FK -> itsm_tickets)
- userId: BIGINT (FK -> User)
- message: TEXT
- isInternal: BOOLEAN (false = visível para usuário)
- createdAt: DATETIME(3)
```

#### `itsm_attachments`
Anexos enviados nos tickets.

```sql
- id: BIGINT (PK, AUTO_INCREMENT)
- ticketId: BIGINT (FK -> itsm_tickets)
- fileName: VARCHAR(191)
- fileUrl: TEXT
- fileSize: INT NULLABLE
- mimeType: VARCHAR(191) NULLABLE
- uploadedBy: BIGINT (FK -> User)
- createdAt: DATETIME(3)
```

#### `itsm_chat_logs`
Logs de conversas com o chat AI.

```sql
- id: BIGINT (PK, AUTO_INCREMENT)
- ticketId: BIGINT (FK -> itsm_tickets) NULLABLE
- userId: BIGINT (FK -> User)
- messages: JSON (array de {role, content, timestamp})
- sessionId: VARCHAR(191) NULLABLE
- context: JSON
- wasHelpful: BOOLEAN NULLABLE
- ticketCreated: BOOLEAN (default false)
- createdAt: DATETIME(3)
- updatedAt: DATETIME(3)
```

#### `itsm_query_logs`
Logs de queries SQL para monitoramento.

```sql
- id: BIGINT (PK, AUTO_INCREMENT)
- query: TEXT
- duration: INT (milissegundos)
- success: BOOLEAN
- errorMessage: TEXT NULLABLE
- userId: BIGINT (FK -> User) NULLABLE
- endpoint: VARCHAR(191) NULLABLE
- method: VARCHAR(191) NULLABLE
- ipAddress: VARCHAR(191) NULLABLE
- timestamp: DATETIME(3)
```

## 🔌 APIs Implementadas

### 1. POST `/api/support/chat`
Envia mensagem para o chat AI e recebe resposta.

**Request Body**:
```json
{
  "message": "Como faço para dar um lance?",
  "userId": "123",
  "context": {
    "url": "https://example.com/leilao/123",
    "userAgent": "Mozilla/5.0...",
    "screenSize": "1920x1080"
  }
}
```

**Response**:
```json
{
  "response": "Para dar um lance...",
  "chatLogId": "456"
}
```

### 2. POST `/api/support/tickets`
Cria um novo ticket de suporte.

**Request Body**:
```json
{
  "title": "Erro ao fazer login",
  "description": "Não consigo acessar minha conta...",
  "category": "TECNICO",
  "priority": "ALTA",
  "userId": "123",
  "userSnapshot": {...},
  "userAgent": "Mozilla/5.0...",
  "browserInfo": "Chrome 120",
  "screenSize": "1920x1080",
  "pageUrl": "https://example.com/login"
}
```

**Response**:
```json
{
  "success": true,
  "ticketId": "TICKET-1234567890",
  "message": "Ticket criado com sucesso!"
}
```

### 3. GET `/api/support/tickets`
Lista todos os tickets (com filtros).

**Query Parameters**:
- `userId`: Filtra por usuário
- `status`: Filtra por status

**Response**:
```json
{
  "tickets": [
    {
      "id": "1",
      "publicId": "TICKET-123",
      "title": "...",
      "status": "ABERTO",
      "priority": "MEDIA",
      "user": {...},
      "messages": [...]
    }
  ]
}
```

### 4. GET `/api/admin/query-monitor`
Retorna estatísticas e logs de queries recentes (somente admin).

**Response**:
```json
{
  "queries": [
    {
      "id": "1",
      "query": "SELECT * FROM ...",
      "duration": 245,
      "success": true,
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ],
  "stats": {
    "total": 50,
    "avgDuration": 180,
    "slowQueries": 3,
    "failedQueries": 1
  }
}
```

## 📦 Arquivos Criados

### Componentes
1. `src/components/support/floating-support-buttons.tsx`
2. `src/components/support/support-chat-modal.tsx`
3. `src/components/support/admin-query-monitor.tsx`

### APIs
1. `src/app/api/support/chat/route.ts`
2. `src/app/api/support/tickets/route.ts`
3. `src/app/api/admin/query-monitor/route.ts`

### Páginas Admin
1. `src/app/admin/support-tickets/page.tsx`

### Middleware
1. `src/lib/middleware/query-logger.ts`

### Database
1. `add_itsm_support_system.sql` (migration script)
2. `prisma/schema.prisma` (atualizado com novos models)

## 🚀 Como Executar a Migração

### Opção 1: Via SQL Direto
```bash
# Execute o arquivo SQL no banco de dados MySQL
mysql -u username -p database_name < add_itsm_support_system.sql
```

### Opção 2: Via Prisma (recomendado)
```bash
# Gerar Prisma Client
npx prisma generate

# Aplicar migrations
npx prisma db push
```

## ⚙️ Configurações Necessárias

### 1. Atualizar Layout Principal
O arquivo `src/app/app-content-wrapper.tsx` foi atualizado para incluir os botões flutuantes.

### 2. Atualizar Layout Admin
O arquivo `src/app/admin/admin-layout.client.tsx` foi atualizado para incluir o monitor de queries no rodapé.

### 3. Permissões de Acesso
- **Usuários**: Podem criar tickets e usar o chat
- **Admins/Suporte**: Acesso completo ao painel de tickets e monitor de queries

## 📊 Estatísticas e Métricas

O sistema coleta automaticamente:
- Tempo de resposta de queries
- Taxa de sucesso/falha de operações
- Logs de interação do usuário
- Contexto completo de cada issue (URL, browser, tela, etc.)

## 🎨 Customização

### Alterar Cores dos Botões
Edite `src/components/support/floating-support-buttons.tsx`:
```tsx
// FAQ - Azul
className="bg-blue-600 hover:bg-blue-700"

// Chat AI - Roxo
className="bg-purple-600 hover:bg-purple-700"

// Ticket - Laranja
className="bg-orange-600 hover:bg-orange-700"
```

### Alterar Respostas do Chat AI
Edite a função `generateAIResponse` em `src/app/api/support/chat/route.ts`.

### Integrar com IA Real
Substitua `generateAIResponse` por uma chamada para API de IA (OpenAI, Gemini, etc.):

```typescript
const response = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [
    { role: "system", content: "Você é um assistente de suporte..." },
    { role: "user", content: message }
  ]
});
```

## 🔐 Segurança

- Todas as APIs verificam autenticação via `getServerSession`
- Queries sensíveis são protegidas por permissões de admin
- Dados do usuário são sanitizados antes de armazenamento
- Foreign Keys garantem integridade referencial

## 📞 Próximos Passos

1. **Integração com IA Real**: Conectar com OpenAI/Gemini
2. **Notificações Email**: Alertar usuários sobre updates em tickets
3. **Dashboard Analytics**: Métricas avançadas de suporte
4. **Anexos em Tickets**: Permitir upload de screenshots
5. **Chat em Tempo Real**: WebSockets para chat ao vivo

## 🐛 Troubleshooting

### Erro ao criar Prisma Client
```bash
# Limpe o cache e regenere
rm -rf node_modules/.prisma
npx prisma generate
```

### Tabelas não aparecem no banco
```bash
# Verifique se o SQL foi executado
# Execute manualmente o arquivo add_itsm_support_system.sql
```

### Botões não aparecem na tela
Verifique se `FloatingSupportButtons` foi adicionado ao layout em `app-content-wrapper.tsx`.

---

## 👥 Roles de Acesso

### Usuário Final
- Ver e usar botões flutuantes
- Abrir tickets
- Usar chat AI
- Ver FAQ

### Admin/Suporte
- Tudo que o usuário final pode
- Acessar `/admin/support-tickets`
- Ver monitor de queries
- Atribuir tickets
- Responder tickets

---

**Data de Implementação**: Novembro 2024
**Versão**: 1.0.0
**Desenvolvido para**: BidExpert Platform
