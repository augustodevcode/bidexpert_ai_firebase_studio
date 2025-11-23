# ⚡ Quick Reference: Assets nos Processos Judiciais

## 📋 Status Atual

✅ **IMPLEMENTADO** - Assets vinculados automaticamente a processos judiciais  
📊 **Cobertura:** 100% dos novos processos | 52.4% do total (incluindo dados antigos)  
🏛️ **Total:** 196 assets criados para 63 processos

---

## 🚀 Comandos Rápidos

### Criar Novos Dados (com assets automáticos)
```bash
npx tsx seed-data-extended-v3.ts
```

### Adicionar Assets a Processos Existentes
```bash
npx tsx backfill-assets-to-processes.ts
```

### Verificar Status
```bash
npx tsx verify-assets-processos.ts
```

---

## 📊 Estrutura de Dados

### Modelo Asset
```typescript
{
  id: BigInt
  publicId: String (único)
  title: String
  description: String
  status: 'CADASTRO' | 'DISPONIVEL' | 'LOTEADO' | 'VENDIDO' | 'REMOVIDO' | 'INATIVADO'
  judicialProcessId: BigInt (FK)
  sellerId: BigInt (FK)
  evaluationValue: Decimal
  tenantId: BigInt (FK)
  dataAiHint: 'IMOVEL' | 'VEICULO' | 'MAQUINARIO' | 'MOBILIARIO'
}
```

### Tipos de Assets Disponíveis

**IMOVEL:**
- Sala Comercial
- Apartamento Residencial
- Casa Térrea
- Galpão Industrial
- Terreno Urbano

**VEICULO:**
- Automóvel Sedan
- Caminhonete Pick-up
- Motocicleta

**MAQUINARIO:**
- Torno Mecânico
- Empilhadeira

**MOBILIARIO:**
- Conjunto de Mesas e Cadeiras
- Equipamentos de TI

---

## 🔍 Consultas SQL Úteis

### Ver Assets por Processo
```sql
SELECT 
  jp.processNumber,
  COUNT(a.id) as total_bens,
  SUM(a.evaluationValue) as valor_total_avaliacao
FROM JudicialProcess jp
LEFT JOIN Asset a ON a.judicialProcessId = jp.id
GROUP BY jp.id, jp.processNumber
ORDER BY total_bens DESC;
```

### Processos Sem Assets
```sql
SELECT 
  jp.id,
  jp.processNumber,
  jp.tenantId
FROM JudicialProcess jp
LEFT JOIN Asset a ON a.judicialProcessId = jp.id
WHERE a.id IS NULL;
```

### Assets Vinculados a Lotes
```sql
SELECT 
  l.number,
  l.title as lote,
  a.title as bem,
  a.evaluationValue
FROM AssetsOnLots aol
JOIN Asset a ON aol.assetId = a.id
JOIN Lot l ON aol.lotId = l.id;
```

---

## 📁 Arquivos Importantes

| Arquivo | Descrição |
|---------|-----------|
| `seed-data-extended-v3.ts` | Seed principal (cria assets automaticamente) |
| `backfill-assets-to-processes.ts` | Adiciona assets a processos existentes |
| `verify-assets-processos.ts` | Verificação e relatórios |
| `IMPLEMENTACAO_ASSETS_PROCESSOS_FINAL.md` | Documentação completa |
| `RELATORIO_ASSETS_PROCESSOS.md` | Detalhes técnicos |

---

## ⚙️ Como Funciona

### No Seed Extended V3

1. Cria processos judiciais
2. Para cada processo criado:
   - Gera 1-3 assets aleatórios
   - Define tipo (IMOVEL, VEICULO, MAQUINARIO, MOBILIARIO)
   - Atribui status (CADASTRO, DISPONIVEL, LOTEADO)
   - Define valor de avaliação (R$ 30k - R$ 430k)
   - Vincula ao processo e seller

### Vinculação a Lotes

- Assets com status LOTEADO são vinculados aos lotes
- Assets DISPONIVEL podem ser vinculados e ter status atualizado
- Tabela `AssetsOnLots` registra a vinculação

---

## ✅ Checklist de Validação

- [ ] Executar seed extended v3
- [ ] Verificar que processos novos têm assets
- [ ] Executar backfill para processos antigos
- [ ] Validar com verify-assets-processos.ts
- [ ] Conferir cobertura >= 50%
- [ ] Validar valores de avaliação
- [ ] Confirmar status variados
- [ ] Verificar vinculações a lotes

---

## 🎯 Métricas de Sucesso

✅ **100%** dos processos novos com assets  
✅ **196** assets criados  
✅ **130** vinculações asset-lote  
✅ **4 tipos** de assets diferentes  
✅ **3 status** variados  
✅ Valores entre R$ 30k e R$ 430k  

---

## 💡 Dicas

1. **Sempre execute verify** após modificar dados
2. **Mantenha backups** antes de executar scripts de massa
3. **Limpe dados órfãos** regularmente
4. **Valide integridade** antes de produção

---

## 🐛 Problemas Comuns

### "Foreign key constraint violated on tenantId"
**Causa:** Processo tem tenantId inválido  
**Solução:** Executar script de limpeza ou atualizar tenantId

### "Processo sem assets após seed"
**Causa:** Tenant inválido ou erro durante criação  
**Solução:** Executar backfill-assets-to-processes.ts

### "Assets não aparecem no painel"
**Causa:** Cache ou problema de query  
**Solução:** Verificar relação judicialProcessId e recarregar página

---

## 📞 Referência Rápida

**Seed completo:** 
```bash
npx tsx seed-data-extended-v3.ts
```

**Backfill:**
```bash
npx tsx backfill-assets-to-processes.ts
```

**Verificar:**
```bash
npx tsx verify-assets-processos.ts
```

---

**Última Atualização:** 22/11/2024  
**Status:** ✅ Produção  
**Versão:** 1.0
