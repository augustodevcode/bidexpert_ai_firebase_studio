# ❌ Erros Encontrados no seed-data-extended.ts

## 🔴 Problema Principal

O arquivo `seed-data-extended.ts` está usando serviços que estão **comentados** nas importações:

### Linhas com Erro:

**Linha 669:**
```typescript
await installmentPaymentService.createInstallmentsForWin(win.id, 3);
```
❌ Erro: `installmentPaymentService` não está definido (importação comentada na linha 28)

**Linha 692:**
```typescript
await lotQuestionService.createQuestion(...)
```
❌ Erro: `lotQuestionService` não está definido (importação comentada na linha 23)

**Linha 700:**
```typescript
await reviewService.createReview(...)
```
❌ Erro: `reviewService` não está definido (importação comentada na linha 24)

---

## ✅ Solução Recomendada

### Opção 1: Usar o Script Unificado (RECOMENDADO)

O script **`seed-complete-unified.ts`** já está funcionando 100% e não tem esses erros:

```bash
npx tsx scripts/seed-complete-unified.ts
```

### Opção 2: Corrigir o seed-data-extended.ts

Substituir as linhas problemáticas por código Prisma direto:

#### Linha 669 - InstallmentPayment:
```typescript
// SUBSTITUIR:
await installmentPaymentService.createInstallmentsForWin(win.id, 3);

// POR:
const numInstallments = 3;
const installmentAmount = Number(win.winningBidAmount) / numInstallments;
for (let i = 1; i <= numInstallments; i++) {
  await prisma.installmentPayment.create({
    data: {
      userWinId: win.id,
      installmentNumber: i,
      amount: installmentAmount,
      dueDate: new Date(Date.now() + i * 30 * 24 * 60 * 60 * 1000),
      status: i === 1 ? 'PAGO' : 'PENDENTE',
    },
  });
}
```

#### Linhas 692-698 - LotQuestion:
```typescript
// SUBSTITUIR:
await lotQuestionService.createQuestion(
  reviewedLot.id,
  questioner.id,
  questioner.fullName || '',
  'Qual o estado dos pneus?'
);

// POR:
await prisma.lotQuestion.create({
  data: {
    lotId: reviewedLot.id,
    auctionId: reviewedLot.auctionId,
    userId: questioner.id,
    userDisplayName: questioner.fullName || '',
    questionText: 'Qual o estado dos pneus?',
  },
});
```

#### Linhas 700-706 - Review:
```typescript
// SUBSTITUIR:
await reviewService.createReview(
  reviewedLot.id,
  reviewer.id,
  reviewer.fullName || '',
  4,
  'Ótimo estado, mas a entrega demorou.'
);

// POR:
await prisma.review.create({
  data: {
    lotId: reviewedLot.id,
    auctionId: reviewedLot.auctionId,
    userId: reviewer.id,
    userDisplayName: reviewer.fullName || '',
    rating: 4,
    comment: 'Ótimo estado, mas a entrega demorou.',
  },
});
```

---

## 📊 Status Atual do Banco

Execute para verificar:
```bash
npx tsx scripts/check-seed-status.ts
```

**Resultado esperado:** 46/46 tabelas (100%) já populadas pelo `seed-complete-unified.ts`

---

## 🎯 Recomendação Final

**USE O SCRIPT UNIFICADO** que já está funcionando perfeitamente:

```bash
# Script que funciona 100%
npx tsx scripts/seed-complete-unified.ts

# Verificar status
npx tsx scripts/check-seed-status.ts
```

O `seed-data-extended.ts` precisa das correções acima para funcionar.
