# ✅ BIDEXPERT E2E TESTING - SETUP CHECKLIST

## 📋 Pré-requisitos

- [ ] Node.js 18+ instalado (`node --version`)
- [ ] MySQL rodando (`mysql -u root -p` conecta)
- [ ] `.env` configurado com DATABASE_URL válido
- [ ] `npm install` já executado

---

## 🔧 FASE 1: SETUP (Execute uma vez)

### Etapa 1.1: Gerar Prisma Client
```bash
npx prisma generate
```
- [ ] Concluído sem erros
- [ ] `node_modules/@prisma/client` atualizado

### Etapa 1.2: Sincronizar Schema com BD
```bash
npx prisma db push
```
- [ ] Concluído sem erros
- [ ] Tabelas criadas/atualizadas
- [ ] Nenhuma migração pendente

### Etapa 1.3: Seed Dados de Teste
```bash
npm run db:seed:test
```
- [ ] Concluído em < 1 minuto
- [ ] Viu mensagem "Test data seeded successfully!"
- [ ] Usuários de teste criados:
  - [ ] admin@bidexpert.com / Admin@12345
  - [ ] test-bidder@bidexpert.com / Test@12345
  - [ ] bidder2@test.com / Test@12345
- [ ] Leilão de teste criado (ID 1)
- [ ] 2 lotes criados
- [ ] 4 lances simulados

---

## 🚀 FASE 2: SERVIDOR (Mantenha rodando)

### Etapa 2.1: Iniciar Next.js Dev Server
```bash
npm run dev:9005
```
- [ ] Server iniciado com sucesso
- [ ] Mensagem "Ready in XXXms" apareceu
- [ ] Nenhum erro Critical
- [ ] Pode acessar http://localhost:9005

**DEIXE ESTE TERMINAL ABERTO!**

---

## 🧪 FASE 3: TESTES (Execute após Fase 2)

### Etapa 3.1: Rodar Suite Completa
```bash
npm run test:e2e:realtime
```

#### Resultado esperado:
```
=====================================
 21 passed (3.2s)
=====================================

To open last HTML report run:
  npx playwright show-report
```

- [ ] Todos 21 testes passaram ✅
- [ ] Tempo total < 10 segundos
- [ ] Nenhum teste com warning
- [ ] Relatório HTML gerado

### Etapa 3.2: Revisar Relatório
```bash
npx playwright show-report
```
- [ ] Browser abriu com relatório
- [ ] Todos testes com status ✓
- [ ] Expandiu alguns testes e viu detalhes
- [ ] Screenshots dos testes (se houver)

---

## 🧩 TESTES INDIVIDUAIS (Opcional)

### Rodar apenas testes de WebSocket
```bash
npx playwright test complete-features.spec.ts -g "Realtime Bids" --config=playwright.config.local.ts
```
- [ ] 4 testes de realtime bids passaram

### Rodar apenas testes de Soft Close
```bash
npx playwright test complete-features.spec.ts -g "Soft Close" --config=playwright.config.local.ts
```
- [ ] 3 testes de soft close passaram

### Rodar apenas testes de Audit Logs
```bash
npx playwright test complete-features.spec.ts -g "Audit Logs" --config=playwright.config.local.ts
```
- [ ] 3 testes de audit passaram

### Rodar em modo debug (interativo)
```bash
npx playwright test complete-features.spec.ts --debug --config=playwright.config.local.ts
```
- [ ] Interface de debug abriu
- [ ] Pode step-through dos testes
- [ ] Pode inspecionar elementos

---

## 📊 VALIDAÇÃO DE DADOS

### Verificar Usuários no Banco
```bash
mysql -u root -p -e "use bidexpert; select email, fullName from User limit 5;"
```
- [ ] Admin user presente
- [ ] 2 bidders presentes

### Verificar Leilão Criado
```bash
mysql -u root -p -e "use bidexpert; select id, name, status from Auction limit 5;"
```
- [ ] Leilão ID 1 com status ACTIVE
- [ ] Nome: "Test Auction 1"

### Verificar Lotes Criados
```bash
mysql -u root -p -e "use bidexpert; select id, title, currentBid from Lot limit 5;"
```
- [ ] Lote 1: "Apartamento com 3 quartos" - R$ 260.000
- [ ] Lote 2: "Carro 2020" - R$ 55.000

---

## 🌐 VALIDAÇÃO MANUAL (Browser)

Acesse http://localhost:9005 e teste:

### Home Page
- [ ] Carrega em < 3 segundos
- [ ] Logo e navegação visíveis
- [ ] Auctions listadas

### Auction Listing
- [ ] Clica em "Test Auction 1"
- [ ] 2 lotes aparecem
- [ ] Status ACTIVE mostrado

### Lot Details
- [ ] Clica no lote
- [ ] Histórico de lances carregado
- [ ] Preço atual correto (R$ 260.000 ou R$ 55.000)
- [ ] Socket conectado (ícone verde, se implementado)

### Login
- [ ] Clica "Sign In"
- [ ] Email: test-bidder@bidexpert.com
- [ ] Senha: Test@12345
- [ ] Login bem-sucedido
- [ ] Redirecionado para dashboard

### Admin Panel (Login como admin)
- [ ] Email: admin@bidexpert.com
- [ ] Senha: Admin@12345
- [ ] Acessa /admin/settings
- [ ] Vê toggles para:
  - [ ] Soft Close
  - [ ] Blockchain
  - [ ] WebSocket

---

## 🐛 TROUBLESHOOTING

### Se testes falham:

**Erro: "Connection ECONNREFUSED 127.0.0.1:9005"**
- [ ] Terminal 2 está rodando `npm run dev:9005`?
- [ ] Esperou "Ready in XXXms"?
- [ ] Porta 9005 não bloqueada por outro processo?

**Erro: "Cannot read properties of undefined"**
- [ ] Rodou `npx prisma generate`?
- [ ] Rodou `npx prisma db push`?
- [ ] Rodou `npm run db:seed:test`?

**Erro: "Cannot find test file"**
- [ ] Arquivo `tests/e2e/complete-features.spec.ts` existe?
- [ ] Estrutura de pastas correta?

**Tests timeout (> 30 seg)**
- [ ] Server respondendo lentamente?
- [ ] BD bloqueada?
- [ ] Browser realmente abrindo?

### Se ainda tiver problemas:

1. [ ] Limpar cache:
   ```bash
   rm -rf node_modules/.prisma
   npx prisma generate
   ```

2. [ ] Reinstalar deps:
   ```bash
   npm install
   ```

3. [ ] Reset completo:
   ```bash
   npx prisma db push --force-reset
   npm run db:seed:test
   npm run dev:9005
   npm run test:e2e:realtime
   ```

---

## ✅ CONCLUSÃO

### Se todas as checkboxes acima estão marcadas:
- ✅ Setup realizado com sucesso
- ✅ Servidor funcionando
- ✅ 21 testes passando
- ✅ Dados de teste validados
- ✅ Sistema pronto para próximos gaps

### Próximos passos:
1. [ ] Enviar screenshot do "21 passed"
2. [ ] Proceder com implementação dos gaps (#4, #5, #11, #21, #27-32)
3. [ ] Manter testes rodando durante desenvolvimento
4. [ ] Adicionar testes conforme novos features

---

**Data**: 14 Nov 2025  
**Versão**: 1.0  
**Status**: ✅ PRONTO PARA EXECUÇÃO

Tempo estimado: **5-10 minutos**
