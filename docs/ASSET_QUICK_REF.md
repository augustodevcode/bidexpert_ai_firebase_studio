# Quick Reference - Cadastro de Ativos V2

## Arquivos Principais

| Arquivo | Propósito |
|---------|-----------|
| `asset-field-config.ts` | Define campos por categoria |
| `asset-specific-fields.tsx` | Renderiza campos dinâmicos |
| `asset-form-schema.ts` | Validação Zod completa |
| `asset-form.tsx` | Formulário principal |
| `asset.service.ts` | Lógica de negócio |

## Comandos Rápidos

### Ver Backup
```bash
cd _backup_assets
dir
```

### Testar Nova Implementação
```bash
npm run dev
# Navegar para: /admin/assets/new
```

## Campos por Tipo

| Tipo | Campos Principais | Total |
|------|-------------------|-------|
| Veículos | plate, vin, make, model | 21 |
| Imóveis | matricula, IPTU, área | 21 |
| Máquinas | marca, série, specs | 17 |
| Pecuária | raça, peso, GTA | 13 |
| Móveis | tipo, material | 5 |
| Joias | metal, pedras | 7 |
| Arte | artista, período | 5 |
| Embarcações | tipo, comprimento | 4 |
| Commodities | produto, quantidade | 5 |
| Metais | tipo, pureza | 2 |
| Florestais | espécie, DOF | 4 |

## Fluxo de Criação

1. Selecionar categoria
2. Preencher informações básicas
3. Preencher campos específicos (dinâmicos)
4. Adicionar localização
5. Upload de imagens
6. Salvar

## Validações Obrigatórias

```typescript
✓ title (5-200 caracteres)
✓ status (enum)
✓ categoryId
✓ sellerId
```

## Exemplo de Mapeamento

```typescript
// Em asset-field-config.ts
'veiculos': VEHICLE_FIELDS,
'imoveis': PROPERTY_FIELDS,
'maquinas': MACHINERY_FIELDS,
```

## Troubleshooting Rápido

| Erro | Solução |
|------|---------|
| "Expected string, received bigint" | Converter ID com `.toString()` |
| "Unknown argument" | Campo não existe no Prisma |
| Campos não aparecem | Verificar mapeamento de categoria |
| Validação falha | Usar `optionalString/Number` |

## Links Úteis

- [Documentação Completa](./ASSET_REGISTRATION_V2.md)
- [Análise de Backup](./../_backup_assets/BACKUP_ANALYSIS.md)
- [Schema Prisma](./../prisma/schema.prisma)
