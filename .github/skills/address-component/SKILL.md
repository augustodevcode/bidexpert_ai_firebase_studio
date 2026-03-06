# Address Component Skill

## Visão Geral
O módulo de endereço reutilizável do BidExpert (`@/components/address`) centraliza toda a funcionalidade de endereço em um único componente, eliminando duplicação de código e bugs de persistência.

## Arquitetura

### Componentes
| Arquivo | Propósito |
|---------|-----------|
| `src/components/address/AddressComponent.tsx` | Componente principal — renderiza todos os campos de endereço |
| `src/components/address/AddressMapPicker.tsx` | Sub-componente de mapa Leaflet com busca de CEP |
| `src/components/address/index.ts` | Barrel exports |
| `src/components/address-group.tsx` | Wrapper backward-compat (deprecated) |

### Infraestrutura
| Arquivo | Propósito |
|---------|-----------|
| `src/lib/schemas/address.schema.ts` | Schema Zod compartilhado (relational + text modes) |
| `src/lib/helpers/address.helper.ts` | Helper de persistência para service layer |

## Modos de Uso

### Modo Relacional (padrão)
Para entidades com FK para City/State: Auction, Seller, Auctioneer, Asset, Lot.

```tsx
import { AddressComponent } from '@/components/address';
import { relationalAddressFields, addressDefaults } from '@/lib/schemas/address.schema';

const formSchema = z.object({
  name: z.string().min(1),
}).merge(relationalAddressFields);

function MyForm() {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', ...addressDefaults.relational },
  });

  return (
    <Form {...form}>
      <FormField name="name" ... />
      <AddressComponent form={form} />
    </Form>
  );
}
```

### Modo Texto
Para entidades com city/state como string: User, BidderProfile.

```tsx
import { textAddressFields, addressDefaults } from '@/lib/schemas/address.schema';

const schema = z.object({ ... }).merge(textAddressFields);

<AddressComponent form={form} mode="text" />
```

### Campos Visíveis Customizados
```tsx
<AddressComponent
  form={form}
  visibleFields={['zipCode', 'stateId', 'cityId', 'latitude', 'longitude', 'map']}
/>
```

## Props do AddressComponent

| Prop | Tipo | Default | Descrição |
|------|------|---------|-----------|
| `form` | `UseFormReturn` | required | Instância do react-hook-form |
| `mode` | `'relational' \| 'text'` | `'relational'` | FK vs texto para city/state |
| `visibleFields` | `AddressFieldKey[]` | all fields | Campos a exibir |
| `initialStates` | `StateInfo[]` | auto-fetch | SSR optimization |
| `initialCities` | `CityInfo[]` | auto-fetch | SSR optimization |
| `sectionTitle` | `string` | `'Endereço'` | Título da seção |
| `showSectionTitle` | `boolean` | `false` | Exibir título |

## Helper de Persistência (Service Layer)

### extractAddressFields()
Separa campos de endereço do restante dos dados do formulário:
```typescript
import { extractAddressFields } from '@/lib/helpers/address.helper';

const { addressFields, remainingData } = extractAddressFields(formData);
```

### prepareAddressPrismaData()
Transforma campos de endereço no formato Prisma:
```typescript
import { prepareAddressPrismaData } from '@/lib/helpers/address.helper';

const addressData = await prepareAddressPrismaData(prisma, addressFields, {
  mode: 'relational',
  generateFullAddress: true,
  generateAddressLink: true,
  resolveNames: true, // Resolve cityId → city name, stateId → state UF
});

await prisma.seller.create({
  data: { ...remainingData, ...addressData, ... },
});
```

### buildAddressLink()
Gera URL do Google Maps a partir de lat/lng:
```typescript
import { buildAddressLink } from '@/lib/helpers/address.helper';

const link = buildAddressLink(-23.55, -46.63);
// → "https://www.google.com/maps?q=-23.55,-46.63"
```

## Campo addressLink
Adicionado ao Prisma schema em 5 models: Asset, Auction, Auctioneer, Seller, Lot.
- Auto-gerado pelo AddressComponent quando lat/lng são definidos
- Auto-gerado pelo helper de persistência
- Exibido como link clicável no mapa

## Regras

1. **SEMPRE** usar `AddressComponent` em novos formulários (nunca duplicar campos)
2. **SEMPRE** usar `.merge(relationalAddressFields)` no schema Zod
3. **SEMPRE** usar `addressDefaults.relational` nos defaultValues
4. **NUNCA** destructurar campos de endereço manualmente na service layer
5. **SEMPRE** usar `extractAddressFields()` + `prepareAddressPrismaData()` nos services
6. **SEMPRE** manter ambos schemas Prisma sincronizados (MySQL + PostgreSQL)

## data-ai-id
Todos os elementos possuem `data-ai-id` para testabilidade:
- `address-component-container`
- `address-component-street`, `address-component-number`, etc.
- `address-map-picker-container`
- `address-map-picker-cep-input`
- `address-map-picker-map`
