# 🧪 GUIA DE TESTES MANUAIS - CENÁRIO COMPLETO

Você é um QA tester especialista em sistemas de informação do ramo de leilões e especialista em negociações de leilões (por vezes arrematante) e um arquiteto de software fullstack (react, next, node.js, prisma, zod, mvc, typescript, c+, python, linguagem C, MCP especialista, mysql administrator, chromium expecialist). 

Usando o browser para navegar e testar a UI da plataforma, use a Massa de Testes (seed-data-extended-v3.ts)
 ; a massa de testes que está completa.
Analise o arquivo seed-data-extended-v3.ts e ele é a versão definitiva ("COMPLETE VERSION"). Ele gera:

Estrutura Base: Tenants, Roles (Leiloeiro, Admin, Advogado, etc.).
Entidades de Negócio: Leilões (Auctions), Lotes (Lots), Ativos (Assets).
Fluxos Complexos:
Habilitações: Cria registros de AuctionHabilitation (status 'HABILITADO').
Lances: Cria registros de Bid para simular histórico de lances.
Vencedores: Cria registros de UserWin.
Conclusão: Você tem uma base sólida. Se precisar garantir 100% de fidelidade ao TESTING_SCENARIOS.md, recomendo apenas verificar se o fluxo de aprovação de documentos (Módulo 2) está sendo testado em algum dos arquivos genéricos (complete-features ou `real-app-
tests`), pois é o único ponto que não tem um arquivo "especialista" óbvio. ; toda a estrutura de conhecimento da plataforma está nessa pasta. - Sendo assim execute esse seed extended v3 completamente e execute teste e2e com base no TESTING_SCENARIOS.md. Corrija o codebase caso tenha erros, atualize os scripts e reexecute tudo novamente. Só pare quando tudo estiver perfeitamente funcionando. 


## ✅ DADOS CRIADOS NO BANCO

### 🏙️ Localização
- **Cidade:** Maringá-PR
- **CEP:** 87043-420
- **Endereço:** Rua Endereço do Bem, 2203

### 🏍️ Bem (Asset)
- **ID:** 604
- **Título:** YAMAHA FACTOR YBR125 ED 2009
- **Cor:** Preta
- **FIPE:** 6302
- **Valor:** R$ 5.000,00

### 🔨 Leilão
- **ID:** 190
- **Título:** LEILÃO DE VEÍCULOS 01/2025 CONSERVADOS
- **Comitente:** Banco Bradesco
- **Leiloeiro:** LEILOEIRO SP 01
- **Tipo:** Extrajudicial, Online
- **Softclose:** Ativado (5 minutos)
- **Relist:** Ativado
- **Data Abertura:** 20/10/2025 09:00
- **Data Praça:** 25/11/2025 09:00
- **Data Encerramento:** 26/11/2025 12:04

### 📦 Lote
- **Número:** 001
- **Título:** YAMAHA FACTOR YBR125 ED 2009 - PRETA
- **Lance Inicial:** R$ 3.000,00
- **Incremento:** R$ 300,00
- **Localização:** Maringá-PR, Rua Endereço do Bem, 2203
- **Coordenadas:** -23.4205, -51.9333

### 👤 Usuários
- **Leiloeiro/Admin:** test.leiloeiro@bidexpert.com / Test@12345
- **Arrematante:** test.comprador@bidexpert.com / Test@12345 (HABILITADO)

### 💰 Lance Teste
- **Valor:** R$ 3.300,00
- **Arrematante:** test.comprador@bidexpert.com

---

## 📋 ROTEIRO DE TESTES NA UI

### TESTE 1: Login como Leiloeiro/Admin
```
URL: http://localhost:9005/auth/login
Email: vide seed-data-extended-v3.ts
Senha: vide seed-data-extended-v3.ts

✓ Verificar login bem-sucedido
✓ Verificar redirecionamento para dashboard/admin
✓ Verificar presença de menu admin
```

### TESTE 2: Verificar Leilão no Painel Admin
```
Navegar para: Admin > Leilões (ou /admin/auctions)

✓ Encontrar "LEILÃO DE VEÍCULOS 01/2025 CONSERVADOS"
✓ Verificar status: ABERTO_PARA_LANCES
✓ Verificar comitente: Banco Bradesco
✓ Verificar leiloeiro: LEILOEIRO SP 01
✓ Clicar para ver detalhes
```

### TESTE 3: Verificar Lote no Painel Admin
```
No detalhe do leilão ou em Admin > Lotes:

✓ Encontrar Lote #001
✓ Verificar título: YAMAHA FACTOR YBR125 ED 2009 - PRETA
✓ Verificar lance inicial: R$ 3.000,00
✓ Verificar incremento: R$ 300,00
✓ Verificar localização: Maringá-PR
✓ Verificar bem vinculado
```

### TESTE 4: Logout e Login como Arrematante
```
Fazer logout
URL: http://localhost:9005/auth/login
Email: test.comprador@bidexpert.com
Senha: Test@12345

✓ Verificar login bem-sucedido
✓ Verificar dashboard do arrematante
```

### TESTE 5: Visualizar Leilão na Home/Marketplace
```
Navegar para: Home ou Leilões (/auctions)

✓ CARD DO LEILÃO deve mostrar:
  - Título: "LEILÃO DE VEÍCULOS 01/2025 CONSERVADOS"
  - Imagem (se configurada)
  - Data do leilão
  - Status: Aberto para Lances
  - Comitente: Banco Bradesco
  
✓ Clicar no card do leilão
```

### TESTE 6: Visualizar Lote e Informações
```
Na página do leilão:

✓ CARD DO LOTE deve mostrar:
  - Lote #001
  - Título: YAMAHA FACTOR YBR125 ED 2009 - PRETA
  - Localização: Maringá-PR ⭐
  - Endereço: Rua Endereço do Bem, 2203 ⭐
  - Lance inicial: R$ 3.000,00
  - Lance atual: R$ 3.300,00 (se houver lance)
  
✓ Clicar no lote para ver detalhes
```

### TESTE 7: Página de Detalhes do Lote
```
Na página de detalhes do lote:

✓ INFORMAÇÕES PRINCIPAIS:
  - Título completo
  - Descrição (com FIPE 6302, valor R$ 5.000,00)
  - Lance inicial: R$ 3.000,00
  - Incremento: R$ 300,00
  - Lance atual: R$ 3.300,00

✓ LOCALIZAÇÃO:
  - Cidade: Maringá-PR ⭐
  - Endereço completo: Rua Endereço do Bem, 2203, CEP 87043-420 ⭐
  
✓ MAPA: ⭐
  - Verificar se o mapa aparece
  - Verificar se marca Maringá-PR (coord: -23.4205, -51.9333)
  - Verificar se mostra endereço

✓ HISTÓRICO DE LANCES:
  - Lance de R$ 3.300,00
  - Nome do arrematante
  - Data/hora do lance

✓ FAIXAS DE LANCES (se implementado):
  - R$ 3.000,00
  - R$ 3.300,00
  - R$ 3.600,00
  - R$ 3.900,00
  - etc.
```

### TESTE 8: Dar um Lance
```
Ainda na página de detalhes do lote:

✓ Encontrar campo/botão para dar lance
✓ Inserir valor: R$ 3.600,00
✓ Confirmar lance
✓ Verificar mensagem de sucesso
✓ Verificar atualização do lance atual
✓ Verificar novo lance aparece no histórico
```

### TESTE 9: Filtros e Busca
```
Voltar para listagem de leilões/lotes:

✓ FILTRO POR CIDADE:
  - Selecionar "Maringá"
  - Verificar se lote aparece
  
✓ FILTRO POR CATEGORIA:
  - Selecionar "Veículos" > "Motos"
  - Verificar se lote aparece
  
✓ FILTRO POR VALOR:
  - Definir range que inclua R$ 3.000 - R$ 5.000
  - Verificar se lote aparece

✓ BUSCA:
  - Buscar por "YAMAHA"
  - Buscar por "Maringá"
  - Buscar por "6302"
  - Verificar resultados
```

### TESTE 10: Painel de Loteamento Avançado
```
Navegar para: Admin > Loteamento (/admin/lotting)

1. Seletores iniciais
  - Usar `lotting-filter-process` para escolher um processo criado pelo seed (ex: `PROC-0001`).
  - Usar `lotting-filter-auction` para vincular ao leilão "LEILÃO DE VEÍCULOS 01/2025".
  - Validar carregamento automático dos cards `lotting-kpi-card-*` (pelo menos 4 KPIs devem aparecer com valores coerentes).

2. Preferências inteligentes
  - Ativar `lotting-toggle-ai` e garantir que apenas ativos com `dataAiHint` sejam exibidos.
  - Ajustar `lotting-slider-valuation` para R$ 200.000 e validar que ativos abaixo desse valor desaparecem da tabela.
  - Desativar `lotting-toggle-include-grouped` para esconder ativos já loteados e depois reativar para comparar os resultados.

3. Alertas e visão contextual
  - Conferir se o card `lotting-alerts-card` lista alertas coerentes (ex: "Processo sem lote vinculado").
  - Clicar no botão de refresh dentro do card e validar que os alertas são recarregados (spinner/feedback rápido).
  - Checar o card `lotting-lots-summary` e confirmar que os lotes listados exibem quantidade de ativos e status atualizado.

4. Ações rápidas do leiloeiro
  - Selecionar ao menos dois ativos na tabela (`lotting-assets-title`).
  - Usar `lotting-action-individual` para criar lotes individualmente e validar o toast de sucesso.
  - Recarregar (`lotting-alerts-refresh` ou botão principal) e verificar se os novos lotes aparecem no resumo.
  - Abrir `lotting-action-grouped` para validar o modal de agrupamento `CreateLotFromAssetsModal`.

5. Telemetria / data-ai-id
  - Garantir que os principais elementos (KPIs, filtros, botões) possuem o atributo `data-ai-id` para uso pelos agentes de IA).
```

### TESTE 10: Visualização Card vs Lista
```
Na listagem de lotes:

✓ VISUALIZAÇÃO CARD:
  - Clicar botão/toggle para view em cards
  - Verificar layout em grid
  - Verificar informações resumidas aparecem

✓ VISUALIZAÇÃO LISTA:
  - Clicar botão/toggle para view em lista
  - Verificar layout em tabela/lista
  - Verificar informações detalhadas aparecem
  
✓ ALTERNAR:
  - Card → Lista
  - Lista → Card
  - Verificar transição suave
```

### TESTE 11: Responsividade (Opcional)
```
✓ DESKTOP (1920x1080):
  - Verificar layout completo
  - Verificar todos elementos visíveis

✓ TABLET (768x1024):
  - Verificar layout adapta
  - Verificar menu/navegação

✓ MOBILE (375x667):
  - Verificar layout mobile
  - Verificar menu hamburger
  - Verificar cards empilham verticalmente
```

---

## ⚠️ PROBLEMAS ESPERADOS E CORREÇÕES

### Problema 1: Mapa não aparece
**Causa:** Integração com Leaflet/OpenStreetMap pode não estar configurada
**Solução:** Verificar componente de mapa, adicionar bibliotecas necessárias

### Problema 2: Faixas de lances não aparecem
**Causa:** Feature pode não estar implementada no frontend
**Solução:** Implementar componente de faixas predefinidas

### Problema 3: Imagens da moto não aparecem
**Causa:** Galeria de fotos não foi populada
**Solução:** Upload manual de fotos ou popular via script

### Problema 4: Erro ao dar lance
**Causas possíveis:**
- Validação de incremento
- Usuário não habilitado (mas está)
- Leilão não aberto (mas está)
**Solução:** Verificar logs do console do browser, corrigir validações

### Problema 5: Filtros não funcionam
**Causa:** Lógica de filtro pode ter bug
**Solução:** Verificar código de filtros, testar queries

---

## 🐛 COMO REPORTAR BUGS ENCONTRADOS

Para cada problema encontrado:

1. **Capturar screenshot**
2. **Abrir console do browser** (F12)
3. **Copiar mensagens de erro**
4. **Anotar:**
   - URL onde ocorreu
   - Passos para reproduzir
   - Comportamento esperado vs atual

5. **Identificar código relevante:**
   - Buscar componente React relacionado
   - Verificar API/action envolvida
   - Checar schema Prisma se erro de DB

6. **Corrigir e testar novamente**

---

## ✅ CHECKLIST FINAL

- [ ] Login como leiloeiro funciona
- [ ] Login como arrematante funciona
- [ ] Leilão aparece na listagem
- [ ] Lote aparece na listagem
- [ ] Card mostra cidade Maringá
- [ ] Card mostra endereço completo
- [ ] Detalhes do lote mostram tudo
- [ ] Mapa mostra Maringá corretamente
- [ ] Histórico de lances aparece
- [ ] Consegue dar novo lance
- [ ] Filtro por cidade funciona
- [ ] Filtro por categoria funciona
- [ ] Busca funciona
- [ ] Toggle card/lista funciona
- [ ] Todas informações estão corretas

---

## 📊 DADOS PARA COPIAR/COLAR NOS TESTES

```
Leiloeiro:
Email: test.leiloeiro@bidexpert.com
Senha: Test@12345

Arrematante:
Email: test.comprador@bidexpert.com
Senha: Test@12345

Leilão ID: 190
Lote ID: (verificar no admin)

Valor para lance teste: 3600
(incremento de R$ 300 sobre R$ 3.300)
```

---

**🎯 OBJETIVO:** Completar todos os testes acima e corrigir quaisquer problemas encontrados no código para manter a plataforma funcional e segura conforme a filosofia do app descrita em /context/README.md!
