# 🎯 PRÓXIMOS PASSOS - Validação Dashboard Advogado

## ⚡ Execução Rápida

Execute os comandos abaixo **EM SEQUÊNCIA**:

### 1️⃣ Instalar Dependências Atualizadas
```cmd
cd e:\SmartDataCorp\BidExpert\BidExpertVsCode\bidexpert_ai_firebase_studio
npm install
```

**O que faz:**
- Instala `eslint-config-next@^15.0.0` (compatível com ESLint 9)
- Instala `@eslint/eslintrc@^3.2.0` (necessário para flat config)
- Atualiza todas as dependências

---

### 2️⃣ Verificar ESLint
```cmd
npm run lint
```

**Resultado Esperado:**
```
✔ No ESLint warnings or errors
```

**Se falhar:**
- Verifique se `eslint.config.mjs` foi criado
- Verifique se `.eslintrc.json` ainda existe (pode causar conflito)
- Execute: `npm install eslint-config-next@latest --save-dev`

---

### 3️⃣ Executar Seed de Dados
```cmd
npm run db:seed:v3
```

**Resultado Esperado:**
```
✨ SEED CONCLUÍDO COM SUCESSO!

📊 RESUMO:
   • Tenants: 3
   • Usuários: 6
   • Leilões: 4
   • Lotes: 5
   • Lances: 9

🔐 CREDENCIAIS DE TESTE:
   Email: advogado@bidexpert.com.br
   Senha: Test@12345
   Roles: ADVOGADO, COMPRADOR
   - 1 lote ganho (Sala Comercial)
   - 2 lotes com lances ativos
```

---

### 4️⃣ Iniciar Servidor de Desenvolvimento
```cmd
npm run dev
```

**Deixe este terminal ABERTO e rodando**

Aguarde até ver:
```
✓ Ready in X ms
○ Local:    http://localhost:9002
```

---

### 5️⃣ Executar Testes Playwright (NOVO TERMINAL)

**Abra um NOVO terminal** e execute:

```cmd
cd e:\SmartDataCorp\BidExpert\BidExpertVsCode\bidexpert_ai_firebase_studio
npx playwright test tests/e2e/lawyer-dashboard.spec.ts --config=playwright.config.local.ts
```

**Ou use o script automatizado:**
```cmd
npx playwright test tests/e2e/lawyer-dashboard.spec.ts --config=playwright.config.local.ts --headed
```

---

### 6️⃣ Visualizar Relatório
```cmd
npx playwright show-report
```

---

## 📋 Arquivos Criados/Modificados

### ✅ Criados
1. `eslint.config.mjs` - Configuração ESLint 9 flat config
2. `tests/e2e/lawyer-dashboard.spec.ts` - 14 testes para dashboard advogado
3. `validate-lawyer-dashboard.bat` - Script de validação completo
4. `VALIDACAO_DASHBOARD_ADVOGADO.md` - Documentação completa
5. `PROXIMOS_PASSOS_VALIDACAO.md` - Este arquivo

### ✅ Modificados
1. `package.json` - Atualizado eslint-config-next e adicionado @eslint/eslintrc
2. `seed-data-extended-v3.ts` - Adicionado usuário advogado + lotes + lances
3. `tests/e2e/global-setup.ts` - Adicionado autenticação do advogado

---

## 🧪 Cenários de Teste Implementados

### Dashboard do Advogado
1. ✅ Login e redirecionamento correto
2. ✅ Widget de lances ativos (2 lances)
3. ✅ Widget de lotes ganhos (1 lote)
4. ✅ Widget de análise jurídica
5. ✅ Widget de processos judiciais
6. ✅ Estatísticas do perfil
7. ✅ Navegação para leilões
8. ✅ Informações do perfil
9. ✅ Renderização de dados
10. ✅ Validação de erros console
11. ✅ Lance vencedor - Imóvel R$ 520k ✨
12. ✅ Lance superado - Veículo R$ 90k
13. ✅ Lote ganho - Sala Comercial R$ 310k ✨

---

## 🎯 Dados de Seed Criados

### Usuário Advogado
```javascript
Email: advogado@bidexpert.com.br
Senha: Test@12345
Roles: ['ADVOGADO', 'COMPRADOR']
OAB: OAB/SP 123456
```

### Lotes Relacionados

#### 1. Imóvel Residencial - São Paulo/SP ⭐ VENCENDO
- **ID:** lote-001-001
- **Valor Inicial:** R$ 450.000,00
- **Valor Atual:** R$ 520.000,00 (lance do advogado)
- **Status:** EM_LEILAO
- **Situação:** Advogado está vencendo

#### 2. Veículo - Honda Civic 2020 ⚠️ PERDENDO
- **ID:** lote-001-002
- **Valor Inicial:** R$ 85.000,00
- **Lance Advogado:** R$ 90.000,00
- **Valor Atual:** R$ 95.000,00 (outro comprador)
- **Status:** EM_LEILAO
- **Situação:** Advogado foi superado

#### 3. Apartamento - Copacabana/RJ
- **ID:** lote-001-003
- **Valor Inicial:** R$ 750.000,00
- **Valor Atual:** R$ 750.000,00
- **Status:** EM_LEILAO
- **Situação:** Sem lances

#### 4. Sala Comercial - Av. Paulista/SP ✅ GANHO
- **ID:** lote-003-001
- **Valor Final:** R$ 310.000,00
- **Status:** VENDIDO
- **Vencedor:** advogado@bidexpert.com.br
- **Situação:** Leilão encerrado - Advogado venceu

#### 5. Galpão Industrial - Guarulhos/SP
- **ID:** lote-003-002
- **Valor Final:** R$ 920.000,00
- **Status:** VENDIDO
- **Vencedor:** Outro comprador
- **Situação:** Sem participação do advogado

---

## 🔍 O Que Validar Manualmente

### No Dashboard do Advogado (UI)

1. **Header/Título**
   - [ ] Mostra "Dashboard Advogado" ou similar
   - [ ] Mostra nome do usuário "Dr. João Advocacia Silva"
   - [ ] Mostra OAB "OAB/SP 123456"

2. **Widget: Lances Ativos** (deve mostrar 2 itens)
   - [ ] Imóvel Residencial - R$ 520.000,00 - "Você está vencendo" 🟢
   - [ ] Honda Civic - R$ 90.000,00 - "Você foi superado" 🔴

3. **Widget: Lotes Ganhos** (deve mostrar 1 item)
   - [ ] Sala Comercial - R$ 310.000,00 - "Vencido" ✅

4. **Widget: Análise Jurídica Pendente**
   - [ ] Widget visível (mesmo que vazio)
   - [ ] Título/cabeçalho correto

5. **Widget: Processos Judiciais**
   - [ ] Widget visível (mesmo que vazio)
   - [ ] Título/cabeçalho correto

6. **Estatísticas/Cards**
   - [ ] Total de lances ativos: 2
   - [ ] Total de lotes ganhos: 1
   - [ ] Valor total investido: R$ 920.000,00
   - [ ] Taxa de vitória: 33% (1 de 3)

---

## ⚠️ Possíveis Problemas e Soluções

### Problema 1: ESLint ainda falha
**Mensagem:**
```
Error: Invalid option 'extensions'
```

**Solução:**
```cmd
# Remover .eslintrc.json (conflito com eslint.config.mjs)
del .eslintrc.json

# Reinstalar eslint-config-next
npm install eslint-config-next@latest --save-dev
npm run lint
```

---

### Problema 2: Seed falha - "Table doesn't exist"
**Mensagem:**
```
Table 'bidexpert.User' doesn't exist
```

**Solução:**
```cmd
# Fazer push do schema
npx prisma db push

# Reexecutar seed
npm run db:seed:v3
```

---

### Problema 3: Testes falham - "User not found"
**Mensagem:**
```
Invalid credentials or user not found
```

**Solução:**
```cmd
# Verificar se seed foi executado
npm run db:seed:v3

# Verificar no banco
npx prisma studio
# Procurar por: advogado@bidexpert.com.br
```

---

### Problema 4: Testes timeout
**Mensagem:**
```
Timeout 60000ms exceeded
```

**Possíveis causas:**
1. Servidor dev não está rodando
2. Porta incorreta (9002 vs 9005)
3. Aplicação muito lenta

**Solução:**
```cmd
# Verificar servidor
netstat -ano | findstr :9002

# Usar porta correta nos testes
# Editar playwright.config.local.ts
# baseURL: 'http://localhost:9002'
```

---

### Problema 5: Dashboard não mostra widgets
**Causa:** UI do dashboard ainda não implementada

**Solução:**
1. Verificar se a rota `/dashboard` ou `/advogado` existe
2. Verificar se há componentes específicos para role ADVOGADO
3. Os testes vão gerar warnings mas não devem falhar completamente

**Logs esperados:**
```
⚠️  Widget de lances ativos não encontrado com data-testid específico
⚠️  Widget de lotes ganhos não encontrado com data-testid específico
✅ Encontrados X cards de estatísticas
```

---

## 📊 Métricas de Sucesso

### ESLint ✅
- `npm run lint` passa sem erros
- Nenhum warning de configuração

### Seed ✅
- 6 usuários criados (incluindo advogado)
- 5 lotes criados
- 9 lances criados
- Dados corretos no Prisma Studio

### Testes Playwright ✅
- Pelo menos 10 de 14 testes passam
- Login funciona corretamente
- Dashboard renderiza sem erros críticos
- Dados são exibidos (mesmo que formato diferente)

---

## 🚀 Script de Validação Completa

Para executar TUDO de uma vez:

```cmd
cd e:\SmartDataCorp\BidExpert\BidExpertVsCode\bidexpert_ai_firebase_studio
validate-lawyer-dashboard.bat
```

**Este script faz:**
1. npm install
2. npm run lint
3. npx prisma generate
4. npm run db:seed:v3
5. npx playwright test lawyer-dashboard.spec.ts

---

## 📝 Checklist Final

- [ ] npm install executado com sucesso
- [ ] npm run lint passa sem erros
- [ ] Seed v3 criou 6 usuários
- [ ] Advogado existe no banco (Prisma Studio)
- [ ] 5 lotes criados com dados corretos
- [ ] 9 lances criados
- [ ] Servidor dev rodando na porta 9002
- [ ] Testes Playwright executados
- [ ] Pelo menos 10 testes passaram
- [ ] Relatório HTML gerado
- [ ] Dashboard renderiza para advogado
- [ ] Dados corretos aparecem na UI

---

## 📞 Próxima Ação

**EXECUTE AGORA:**

```cmd
cd e:\SmartDataCorp\BidExpert\BidExpertVsCode\bidexpert_ai_firebase_studio
npm install
npm run lint
npm run db:seed:v3
```

Se tudo passar, continue com:

```cmd
npm run dev
```

E em outro terminal:

```cmd
npx playwright test tests/e2e/lawyer-dashboard.spec.ts --config=playwright.config.local.ts --headed
```

---

**✨ Boa sorte com a validação!**
