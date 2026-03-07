---
name: report-builder
description: Implementação e evolução do módulo Report Builder com GrapesJS, Handlebars e renderização PDF via Puppeteer.
---

# Skill: Report Builder (GrapesJS + Puppeteer + Handlebars)

## 📸 Evidência Obrigatória para PR (Playwright)
- Todo PR deve incluir print(s)/screenshot(s) de sucesso dos testes Playwright.
- Deve incluir link do relatório de execução (Playwright/Vitest UI) e cenário validado.
- PR sem evidência visual não deve ser aprovado nem mergeado.

## Descrição

Esta skill habilita a criação e manutenção do módulo **Report Builder** do BidExpert, utilizando a arquitetura Composite com:
- **GrapesJS** (MIT): Editor visual drag-and-drop
- **Puppeteer** (Apache 2.0): Renderização de PDF
- **Handlebars** (MIT): Motor de templates

## Quando Ativar

Ative esta skill quando o usuário solicitar:
- Criação de templates de relatórios visuais
- Modificações no designer drag-and-drop
- Novos contextos de dados para relatórios
- Exportação ou renderização de PDF
- Integrações com "Editais", "Laudos", "Cartas de Arrematação"
- Variáveis dinâmicas em relatórios

**Palavras-chave**: report builder, relatório, edital, laudo, carta de arrematação, PDF, template, GrapesJS, drag and drop, arrastar, variáveis

## Arquitetura

```mermaid
graph TB
    subgraph "Frontend (React)"
        UI[GrapesJS Designer] --> |HTML + CSS| Template
        UI --> |drag-and-drop| Variables
    end
    
    subgraph "Backend (Next.js)"
        API[/api/reports/render] --> Handlebars
        Handlebars --> |compile| HTML
        HTML --> Puppeteer
        Puppeteer --> |generate| PDF
    end
    
    subgraph "Data Layer"
        Zod[Zod Schemas] --> |validate| Context
        Prisma[Prisma Client] --> |fetch| Data
    end
    
    UI --> API
    Context --> Handlebars
    Data --> Context
```

## Estrutura de Arquivos

```
src/
├── lib/report-builder/
│   ├── schemas/
│   │   └── auction-context.schema.ts  # Zod schemas para contextos
│   └── utils/
│       └── zod-to-grapesjs.ts         # Conversão Zod → GrapesJS blocks
├── components/BidReportBuilder/
│   ├── GrapesJSDesigner/
│   │   └── index.tsx                   # Componente principal do designer
│   └── ... outros componentes
└── app/
    ├── admin/report-builder/
    │   ├── designer/[id]/
    │   │   ├── page.tsx                # Página do designer
    │   │   └── designer-client.tsx     # Client component
    │   └── reports/
    │       └── page.tsx                # Lista de relatórios
    └── api/reports/
        └── render/
            └── route.ts                # API de renderização PDF
```

## Contextos de Dados Disponíveis

| Contexto | Descrição | Schema | Campos Principais |
|----------|-----------|--------|-------------------|
| `auction` | Leilão | `AuctionContextSchema` | titulo, data, local, leiloeiro |
| `lot` | Lote | `LotContextSchema` | numero, descricao, valor, fotos |
| `bidder` | Arrematante | `BidderContextSchema` | nome, cpf, email, endereco |
| `courtCase` | Processo Judicial | `CourtCaseContextSchema` | numero, vara, comarca, juiz |
| `auctionResult` | Resultado Leilão | `AuctionResultContextSchema` | lances, vencedor, valor |
| `appraisalReport` | Laudo Avaliação | `AppraisalReportContextSchema` | avaliador, valor, data |
| `invoice` | Nota Arrematação | `InvoiceContextSchema` | numero, itens, total |

## Adicionando Novo Contexto

### 1. Criar Zod Schema

```typescript
// src/lib/report-builder/schemas/auction-context.schema.ts

export const NovoContextoSchema = z.object({
  campo1: z.string().describe('Descrição do campo'),
  campo2: z.number().optional().describe('Outro campo'),
  // ...
});

export type NovoContexto = z.infer<typeof NovoContextoSchema>;
```

### 2. Registrar no REPORT_CONTEXTS

```typescript
export const REPORT_CONTEXTS = {
  // ... existentes
  novoContexto: {
    schema: NovoContextoSchema,
    label: 'Novo Contexto',
    description: 'Descrição do contexto',
    icon: '📌',
  },
} as const;
```

### 3. Atualizar API de Renderização

```typescript
// src/app/api/reports/render/route.ts

case 'novoContexto':
  data = await fetchNovoContextoData(entityId);
  break;
```

## Adicionando Bloco Customizado ao GrapesJS

```typescript
// No zodSchemaToGrapesJSBlocks ou diretamente no editor

editor.BlockManager.add('meu-bloco', {
  label: 'Meu Bloco',
  category: 'Minha Categoria',
  content: {
    type: 'text',
    content: '{{contexto.campo}}',
    style: { padding: '10px' },
  },
});
```

## Sintaxe Handlebars

### Variável Simples
```handlebars
{{auction.titulo}}
```

### Loop (Each)
```handlebars
{{#each lots}}
  <div>{{this.numero}} - {{this.descricao}}</div>
{{/each}}
```

### Condicional
```handlebars
{{#if auction.isJudicial}}
  <p>Leilão Judicial</p>
{{else}}
  <p>Leilão Extrajudicial</p>
{{/if}}
```

### Formatação de Data
```handlebars
{{formatDate auction.dataInicio 'DD/MM/YYYY'}}
```

### Formatação de Moeda
```handlebars
{{formatCurrency lot.valorMinimo 'BRL'}}
```

## Helpers Handlebars Disponíveis

| Helper | Uso | Exemplo |
|--------|-----|---------|
| `formatDate` | Formata data | `{{formatDate data 'DD/MM/YYYY'}}` |
| `formatCurrency` | Formata moeda | `{{formatCurrency valor 'BRL'}}` |
| `uppercase` | Maiúsculas | `{{uppercase texto}}` |
| `lowercase` | Minúsculas | `{{lowercase texto}}` |
| `eq` | Igualdade | `{{#if (eq status 'ACTIVE')}}` |
| `or` | OU lógico | `{{#if (or cond1 cond2)}}` |
| `and` | E lógico | `{{#if (and cond1 cond2)}}` |

## Configuração de PDF

### Tamanhos de Página

```typescript
const PAGE_SIZES = {
  A4: { width: '210mm', height: '297mm' },
  Letter: { width: '8.5in', height: '11in' },
  Legal: { width: '8.5in', height: '14in' },
};
```

### CSS Paged Media

```css
@page {
  size: A4;
  margin: 20mm;
}

@page :first {
  margin-top: 30mm;
}

.page-break {
  page-break-before: always;
}
```

## Segurança

### Sanitização XSS

```typescript
import DOMPurify from 'isomorphic-dompurify';

const sanitizedHtml = DOMPurify.sanitize(userHtml, {
  ALLOWED_TAGS: ['div', 'span', 'p', 'table', 'tr', 'td', 'th', 'img', 'br', 'hr'],
  ALLOWED_ATTR: ['class', 'style', 'src', 'alt'],
});
```

### Validação de Dados

```typescript
const validatedData = ContextSchema.parse(rawData);
```

## Testes E2E

Arquivo: `tests/e2e/report-builder-grapesjs.spec.ts`

### Executar Testes

```bash
# Todos os testes
npx playwright test report-builder-grapesjs

# Testes específicos
npx playwright test report-builder-grapesjs -g "Carregamento"

# Com UI
npx playwright test report-builder-grapesjs --ui

# Debug
npx playwright test report-builder-grapesjs --debug
```

### Credenciais de Teste

| Perfil | Email | Senha | Permissões |
|--------|-------|-------|------------|
| ADMIN | admin@lordland.com | password123 | Todas |
| LEILOEIRO | auctioneer@lordland.com | password123 | Criar/Editar relatórios |
| ANALISTA | analista@lordland.com | password123 | Relatórios e análises |
| COMITENTE | seller@lordland.com | password123 | Relatórios de lotes |
| ARREMATANTE | bidder@lordland.com | password123 | Visualização apenas |

> **Nota:** Credenciais definidas em `prisma/seed.ts` com hash bcrypt

## Troubleshooting

### GrapesJS não carrega
1. Verificar se CSS do GrapesJS está importado
2. Verificar console por erros de módulo
3. Garantir que `use client` está no componente

### PDF não renderiza
1. Verificar se Puppeteer está instalado: `npm ls puppeteer`
2. Verificar logs do servidor
3. Testar com HTML simples primeiro

### Variáveis não substituem
1. Verificar sintaxe Handlebars: `{{contexto.campo}}`
2. Verificar se dados existem no contexto
3. Usar `{{log this}}` para debug

## Referências

- [GrapesJS Docs](https://grapesjs.com/docs/)
- [Handlebars Guide](https://handlebarsjs.com/guide/)
- [Puppeteer API](https://pptr.dev/)
- [CSS Paged Media](https://www.w3.org/TR/css-page-3/)
- [Zod Docs](https://zod.dev/)

## Checklist para Novas Features

- [ ] Schema Zod criado e registrado
- [ ] Blocos GrapesJS gerados
- [ ] API de dados implementada
- [ ] Sanitização XSS aplicada
- [ ] Testes E2E escritos
- [ ] Documentação atualizada
