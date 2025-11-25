# 🚀 Deployment - Sistema ITSM-AI

## Pré-requisitos

- [x] Acesso ao banco de dados MySQL
- [x] Node.js instalado
- [x] npm ou yarn configurado
- [x] Credenciais do banco (.env configurado)

---

## 📋 PASSO A PASSO

### 1. Backup do Banco de Dados

**IMPORTANTE**: Faça backup antes de qualquer mudança!

```bash
# Fazer backup completo
mysqldump -u username -p database_name > backup_before_itsm.sql

# Ou via interface gráfica (phpMyAdmin, etc.)
```

---

### 2. Executar Migration SQL

#### Opção A: Via Linha de Comando

```bash
# Navegue até a pasta do projeto
cd e:\SmartDataCorp\BidExpert\BidExpertVsCode\bidexpert_ai_firebase_studio

# Execute o script SQL
mysql -u YOUR_USERNAME -p YOUR_DATABASE < add_itsm_support_system.sql

# Digite a senha quando solicitado
```

#### Opção B: Via phpMyAdmin

1. Acesse phpMyAdmin
2. Selecione o banco de dados
3. Vá em "SQL"
4. Copie o conteúdo de `add_itsm_support_system.sql`
5. Cole na área de texto
6. Clique em "Executar"

#### Opção C: Via MySQL Workbench

1. Abra MySQL Workbench
2. Conecte ao banco
3. File → Open SQL Script
4. Selecione `add_itsm_support_system.sql`
5. Execute (⚡ ícone)

---

### 3. Gerar Prisma Client

```bash
# Gerar o client atualizado
npx prisma generate

# Se der erro, tente:
rm -rf node_modules/.prisma
npx prisma generate
```

---

### 4. Verificar Instalação

#### Verificar Tabelas

```sql
-- Listar todas as tabelas ITSM
SHOW TABLES LIKE 'itsm_%';

-- Deve retornar:
-- itsm_tickets
-- itsm_messages
-- itsm_attachments
-- itsm_chat_logs
-- itsm_query_logs
```

#### Testar Conexão

```bash
# Via Prisma Studio
npx prisma studio

# Procure pelas tabelas ITSM no navegador
```

---

### 5. Build da Aplicação

```bash
# Limpar cache (opcional)
rm -rf .next

# Build de produção
npm run build

# Ou para desenvolvimento
npm run dev
```

---

### 6. Testar Funcionalidades

#### Teste 1: Botões Flutuantes

1. Acesse qualquer página pública
2. Verifique se os botões aparecem no canto inferior direito
3. Clique no botão principal (gradiente)
4. Verifique se os 3 botões expandem

✅ **Esperado**: 3 botões (FAQ, Chat, Ticket) aparecem

---

#### Teste 2: Chat AI

1. Clique no botão "Chat AI" (roxo)
2. Digite: "Como faço para dar um lance?"
3. Aguarde resposta
4. Verifique se a mensagem aparece

✅ **Esperado**: Resposta automática sobre lances

---

#### Teste 3: Criar Ticket

1. Clique no botão "Reportar Issue" (laranja)
2. Preencha:
   - Título: "Teste de ticket"
   - Categoria: "DUVIDA"
   - Prioridade: "MEDIA"
   - Descrição: "Este é um teste"
3. Clique em "Criar Ticket"

✅ **Esperado**: Mensagem de sucesso + ícone verde

---

#### Teste 4: Painel Admin

1. Acesse `/admin/support-tickets`
2. Verifique se o ticket de teste aparece
3. Use os filtros
4. Teste a busca

✅ **Esperado**: Lista de tickets + filtros funcionando

---

#### Teste 5: Monitor de Queries

1. Acesse qualquer página em `/admin`
2. Verifique o rodapé
3. Clique em "Expandir"
4. Execute algumas ações (navegar, criar algo)
5. Verifique se queries aparecem

✅ **Esperado**: Queries aparecem em tempo real

---

## 🔧 Configurações Opcionais

### Ativar Query Logger

Edite `src/lib/prisma.ts`:

```typescript
import { PrismaClient } from '@prisma/client';
import { createQueryLoggerMiddleware } from '@/lib/middleware/query-logger';

const prisma = new PrismaClient();

// Ativar logging de queries
if (process.env.NODE_ENV === 'production') {
  prisma.$use(createQueryLoggerMiddleware(prisma));
}

export { prisma };
```

---

### Integrar com IA Real

Edite `src/app/api/support/chat/route.ts`:

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateAIResponse(message: string): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: "Você é um assistente de suporte da plataforma BidExpert..."
      },
      {
        role: "user",
        content: message
      }
    ],
  });

  return completion.choices[0].message.content || "Erro ao gerar resposta";
}
```

Adicione ao `.env`:
```env
OPENAI_API_KEY=sk-your-key-here
```

---

### Configurar Notificações Email

Instale dependência:
```bash
npm install nodemailer
```

Crie serviço de email (`src/lib/email-service.ts`):
```typescript
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendTicketCreatedEmail(ticket: any) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: ticket.user.email,
    subject: `Ticket #${ticket.publicId} criado`,
    html: `
      <h1>Ticket Criado com Sucesso</h1>
      <p>Seu ticket #${ticket.publicId} foi criado.</p>
      <p><strong>Título:</strong> ${ticket.title}</p>
    `,
  });
}
```

---

## 🔒 Segurança

### Permissões de Roles

Certifique-se que apenas admins podem acessar:
- `/admin/support-tickets`
- `/api/admin/query-monitor`

Já está implementado via `hasPermission(user, 'manage_all')`

---

### Rate Limiting

Adicione rate limiting para APIs:

```bash
npm install express-rate-limit
```

```typescript
// src/app/api/support/chat/route.ts
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // 10 requests por minuto
});
```

---

## 📊 Monitoramento

### Queries Lentas

Verifique queries > 1s:

```sql
SELECT 
  query,
  duration,
  timestamp,
  endpoint
FROM itsm_query_logs
WHERE duration > 1000
ORDER BY duration DESC
LIMIT 20;
```

---

### Tickets Não Respondidos

```sql
SELECT 
  t.publicId,
  t.title,
  t.status,
  t.priority,
  t.createdAt,
  u.email
FROM itsm_tickets t
JOIN User u ON t.userId = u.id
WHERE t.status = 'ABERTO'
  AND t.assignedToUserId IS NULL
ORDER BY t.priority DESC, t.createdAt ASC;
```

---

## 🐛 Troubleshooting

### Erro: Tabelas não existem

**Solução**:
```bash
# Verifique se o SQL foi executado
mysql -u user -p database -e "SHOW TABLES LIKE 'itsm_%';"

# Se não aparecer nada, execute a migration novamente
mysql -u user -p database < add_itsm_support_system.sql
```

---

### Erro: Prisma Client desatualizado

**Solução**:
```bash
# Limpe e regenere
rm -rf node_modules/.prisma
npx prisma generate
npm run build
```

---

### Erro: Botões não aparecem

**Solução**:
1. Verifique `app-content-wrapper.tsx`
2. Confirme que `FloatingSupportButtons` foi importado
3. Verifique se não está em rota /admin ou /dashboard
4. Abra console (F12) e verifique erros

---

### Erro: Monitor não mostra queries

**Solução**:
1. Execute algumas operações no sistema
2. Verifique se `query-logger.ts` está ativo
3. Consulte direto no banco:
```sql
SELECT COUNT(*) FROM itsm_query_logs;
```

---

## 📝 Variáveis de Ambiente

Adicione ao `.env` (se necessário):

```env
# ITSM Configuration
ITSM_ENABLE_QUERY_LOGGING=true
ITSM_QUERY_THRESHOLD_MS=100
ITSM_ENABLE_AI_CHAT=true

# AI Integration (opcional)
OPENAI_API_KEY=sk-your-key-here
GEMINI_API_KEY=your-gemini-key

# Email Notifications (opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@bidexpert.com
```

---

## ✅ Checklist de Deploy

- [ ] Backup do banco de dados criado
- [ ] Migration SQL executada
- [ ] Tabelas ITSM criadas (5 tabelas)
- [ ] Prisma Client gerado
- [ ] Build da aplicação bem-sucedido
- [ ] Botões flutuantes aparecem
- [ ] Chat AI responde
- [ ] Tickets podem ser criados
- [ ] Painel admin funciona
- [ ] Monitor de queries ativo
- [ ] Testes realizados
- [ ] Documentação revisada
- [ ] Equipe treinada

---

## 🎉 Sucesso!

Se todos os itens acima estão ✅, o sistema ITSM-AI está **PRONTO PARA PRODUÇÃO**!

---

## 📞 Suporte

Em caso de dúvidas, consulte:
- `ITSM_IMPLEMENTATION_README.md` - Documentação completa
- `ITSM_QUICK_START.md` - Guia rápido de uso
- `ITSM_IMPLEMENTATION_SUMMARY.md` - Resumo da implementação

---

**Última Atualização**: Novembro 2024  
**Versão**: 1.0.0  
**Status**: Produção Pronta ✅
