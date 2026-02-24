---
description: Seed management and data integrity workflow using ultimate-master-seed.
---

# 📅 Seed & Data Management Workflow

Este workflow garante a integridade dos dados de teste para os ambientes de desenvolvimento e demo.

## 🔑 Credenciais de Teste (Canônicas)
Sempre verifique o arquivo `seed-master-data.md` ou o script `scripts/ultimate-master-seed.ts`.

- **Admin**: `admin@bidexpert.com.br` / `Admin@123`
- **Leiloeiro**: `carlos.silva@construtoraabc.com.br` / `Test@12345`
- **Comprador**: `comprador@bidexpert.com.br` / `Test@12345`
- **Advogado**: `advogado@bidexpert.com.br` / `Test@12345`
- **Analista**: `analista@lordland.com` / `password123`

## 🚀 Execução do Seed
Para resetar e popular o banco com a massa de dados canônica:

// turbo
```powershell
npm run db:seed:ultimate
```
*Isto executa `scripts/ultimate-master-seed.ts`.*

## 🛑 Regras de Implementação de Dados
1. **Nunca** use Prisma direto em novos seeds se houver Services disponíveis.
2. **Utilizar Services**: Sempre importe `UserService`, `LotService`, etc., para garantir que as regras de negócio de criação sejam disparadas.
3. **BigInt**: Lembre-se que as PKs são BigInt. No frontend, converta para string apenas na borda (UI).
4. **Tenant Isolation**: Todo dado deve possuir um `tenantId` válido (ex: `1` para Landlord/Demo).

## ✅ Verificação de Dados
// turbo
```powershell
npm run seed:verify
```
*Ou verifique contagens específicas:*
```powershell
npx tsx scripts/check-db-counts.ts
```
