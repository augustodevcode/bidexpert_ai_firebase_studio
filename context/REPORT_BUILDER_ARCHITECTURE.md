# Arquitetura do Módulo de Relatórios - BidExpert Report Builder

**Data de Criação:** 26 de Dezembro de 2025  
**Status:** ✅ Implementação em Progresso  
**Versão:** 2.0 Enterprise

---

## Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura de Alto Nível](#arquitetura-de-alto-nível)
3. [Modelo de Dados](#modelo-de-dados)
4. [Componentes Principais](#componentes-principais)
5. [Fluxos de Uso](#fluxos-de-uso)
6. [Sistema de Relatórios Predefinidos](#sistema-de-relatórios-predefinidos)
7. [Exportação e Formatos](#exportação-e-formatos)
8. [Extensibilidade](#extensibilidade)
9. [Segurança e Permissões](#segurança-e-permissões)
10. [Integração com IA](#integração-com-ia)
11. [Boas Práticas](#boas-práticas)

---

## Visão Geral

O **BidExpert Report Builder** é um módulo enterprise para criação, visualização e exportação de relatórios dinâmicos. Permite que usuários criem relatórios customizados a partir de entidades do sistema, além de oferecer relatórios predefinidos que podem ser copiados e personalizados.

### Capacidades Principais

- **Wizard de Criação**: Assistente passo-a-passo para criar relatórios
- **Designer Visual**: Editor WYSIWYG para customizar layouts
- **Múltiplos Tipos**: Tabelas, master-detail, cross-tab, formulários, gráficos
- **Fontes de Dados**: Bancos de dados, APIs, JSON, arquivos
- **Exportação Rica**: PDF, DOCX, XLSX, CSV, HTML, imagem
- **Relatórios Predefinidos**: Templates protegidos com opção de cópia
- **Parâmetros Dinâmicos**: Filtros, ranges, listas cascateadas
- **Visualizador Web**: Preview interativo com drill-down/through
- **IA Integrada**: Resumos, traduções, sugestões automáticas

---

## Arquitetura de Alto Nível

```
┌─────────────────────────────────────────────────────────────────┐
│                    CAMADA DE APRESENTAÇÃO                       │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Report List  │  │Report Wizard │  │Report Viewer │          │
│  │    Page      │  │  Component   │  │  Component   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────────────────────────────────────────┐          │
│  │           Visual Report Designer                  │          │
│  │  ┌─────────┐ ┌──────────┐ ┌────────────────┐    │          │
│  │  │ Toolbar │ │ Design   │ │  Properties    │    │          │
│  │  │         │ │ Surface  │ │  Panel         │    │          │
│  │  └─────────┘ └──────────┘ └────────────────┘    │          │
│  └──────────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CAMADA DE SERVIÇOS                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │  ReportService   │  │ ExportService    │                    │
│  │  - CRUD Reports  │  │ - PDF Generator  │                    │
│  │  - Execute Query │  │ - Excel Export   │                    │
│  │  - Parameters    │  │ - CSV/HTML       │                    │
│  └──────────────────┘  └──────────────────┘                    │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │ DataSourceSvc    │  │ AIReportService  │                    │
│  │ - Schema Fetch   │  │ - Summarize      │                    │
│  │ - Query Builder  │  │ - Translate      │                    │
│  │ - Data Binding   │  │ - Suggestions    │                    │
│  └──────────────────┘  └──────────────────┘                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CAMADA DE DADOS                              │
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                  Prisma ORM + MySQL                        │ │
│  │  ┌─────────┐ ┌──────────────┐ ┌──────────────────────┐   │ │
│  │  │ Report  │ │ ReportParam  │ │ PredefinedReport     │   │ │
│  │  │ Entity  │ │   Entity     │ │    Entity            │   │ │
│  │  └─────────┘ └──────────────┘ └──────────────────────┘   │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Modelo de Dados

### Entidades Prisma

```prisma
// Relatório customizado criado pelo usuário
model Report {
  id              BigInt   @id @default(autoincrement())
  publicId        String?  @unique
  name            String
  description     String?  @db.Text
  type            ReportType @default(TABLE)
  definition      Json     // Layout completo em JSON
  dataSource      String   // Nome do modelo/entidade
  queryConfig     Json?    // Configurações de consulta
  parameters      Json?    // Definição de parâmetros
  theme           Json?    // Tema visual
  permissions     Json?    // Permissões de acesso
  isActive        Boolean  @default(true)
  version         Int      @default(1)
  tenantId        BigInt
  createdById     BigInt
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  tenant          Tenant   @relation(fields: [tenantId], references: [id])
  createdBy       User     @relation("CreatedBy", fields: [createdById], references: [id])
  executions      ReportExecution[]
  schedules       ReportSchedule[]
}

// Relatório predefinido (template protegido)
model PredefinedReport {
  id              BigInt   @id @default(autoincrement())
  code            String   @unique // Código único: "INV_001", "EMP_BIRTHDAY"
  name            String
  description     String?  @db.Text
  category        String   // Categoria: "Vendas", "RH", "Financeiro"
  module          String?  // Módulo específico: "Auction", "User"
  type            ReportType @default(TABLE)
  definition      Json
  dataSource      String
  queryConfig     Json?
  parameters      Json?
  theme           Json?
  scripts         Json?    // Scripts associados ao relatório
  iconName        String?  // Ícone para exibição
  sortOrder       Int      @default(0)
  isActive        Boolean  @default(true)
  tenantId        BigInt?  // null = global (todos tenants)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  tenant          Tenant?  @relation(fields: [tenantId], references: [id])
}

// Parâmetro de relatório
model ReportParameter {
  id              BigInt   @id @default(autoincrement())
  reportId        BigInt
  name            String
  label           String
  type            ParameterType @default(TEXT)
  defaultValue    String?
  dataSource      String?  // Para listas dinâmicas
  cascadeFrom     String?  // Parâmetro pai para cascata
  isRequired      Boolean  @default(false)
  isMultiple      Boolean  @default(false)
  sortOrder       Int      @default(0)
  
  report          Report   @relation(fields: [reportId], references: [id])
}

// Execução de relatório (log/auditoria)
model ReportExecution {
  id              BigInt   @id @default(autoincrement())
  reportId        BigInt
  userId          BigInt
  parameters      Json?
  format          String   // PDF, XLSX, etc.
  status          String   // SUCCESS, ERROR
  rowCount        Int?
  executionTime   Int?     // ms
  errorMessage    String?  @db.Text
  createdAt       DateTime @default(now())
  
  report          Report   @relation(fields: [reportId], references: [id])
  user            User     @relation(fields: [userId], references: [id])
}

// Agendamento de relatório
model ReportSchedule {
  id              BigInt   @id @default(autoincrement())
  reportId        BigInt
  cronExpression  String   // "0 8 * * 1" = Segunda às 8h
  format          String   @default("PDF")
  recipients      Json     // Lista de emails
  parameters      Json?
  isActive        Boolean  @default(true)
  lastRun         DateTime?
  nextRun         DateTime?
  
  report          Report   @relation(fields: [reportId], references: [id])
}

enum ReportType {
  TABLE           // Tabela simples
  MASTER_DETAIL   // Mestre-detalhe
  CROSS_TAB       // Tabela dinâmica/pivot
  FORM            // Formulário livre
  CHART           // Baseado em gráficos
  LABEL           // Etiquetas/rótulos
  LETTER          // Carta-forma
  INVOICE         // Nota fiscal/fatura
  DASHBOARD       // Dashboard composto
  HIERARCHICAL    // Dados em árvore
}

enum ParameterType {
  TEXT
  NUMBER
  DATE
  DATE_RANGE
  BOOLEAN
  SELECT         // Lista simples
  MULTI_SELECT   // Lista múltipla
  CASCADE        // Lista cascateada
  ENTITY         // Seletor de entidade
}
```

### Estrutura da Definição JSON

```typescript
interface ReportDefinition {
  // Metadados
  version: string;
  pageSize: 'A4' | 'Letter' | 'Legal' | 'Custom';
  orientation: 'portrait' | 'landscape';
  margins: { top: number; right: number; bottom: number; left: number };
  
  // Bandas/Seções
  bands: {
    reportHeader?: Band;
    pageHeader?: Band;
    groupHeaders?: GroupBand[];
    detail: Band;
    groupFooters?: GroupBand[];
    pageFooter?: Band;
    reportFooter?: Band;
  };
  
  // Elementos visuais
  elements: ReportElement[];
  
  // Campos calculados
  calculatedFields?: CalculatedField[];
  
  // Agrupamentos
  groupings?: Grouping[];
  
  // Ordenação
  sorting?: SortField[];
  
  // Filtros
  filters?: FilterCondition[];
  
  // Scripts
  scripts?: ReportScript[];
}

interface ReportElement {
  id: string;
  type: 'text' | 'field' | 'image' | 'shape' | 'table' | 'chart' | 
        'barcode' | 'qrcode' | 'subreport' | 'richtext' | 'checkbox';
  bandId: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  
  // Propriedades específicas por tipo
  properties: {
    content?: string;
    fieldBinding?: string;
    format?: string;
    font?: FontStyle;
    borders?: BorderStyle;
    background?: string;
    visibility?: string; // Expressão condicional
    chartConfig?: ChartConfig;
    tableConfig?: TableConfig;
  };
  
  // Formatação condicional
  conditionalFormatting?: ConditionalFormat[];
}
```

---

## Componentes Principais

### 1. Report List Page (`/admin/reports`)

Lista todos os relatórios com ações CRUD:

- **Grade de Relatórios**: Nome, tipo, data criação, autor
- **Filtros**: Por tipo, categoria, período
- **Ações**: Novo, Editar, Preview, Exportar, Duplicar, Excluir
- **Seção de Predefinidos**: Lista separada de templates

### 2. Report Wizard Component

Assistente em 4 passos:

**Passo 1 - Informações Básicas:**
- Nome do relatório
- Descrição
- Entidade/fonte de dados
- Ícone/categoria

**Passo 2 - Tipo de Layout:**
- Tabela simples
- Master-detail
- Cross-tab/Pivot
- Formulário
- Etiquetas
- Gráfico

**Passo 3 - Seleção de Campos:**
- Lista de campos disponíveis
- Arrastar para reordenar
- Configurar largura/formato
- Definir agrupamentos

**Passo 4 - Tema e Cabeçalho:**
- Escolher esquema de cores
- Definir título do relatório
- Logo/imagem de cabeçalho
- Configurações de página

### 3. Visual Report Designer

Editor visual completo:

- **Toolbar**: Adicionar elementos, salvar, carregar, exportar
- **Toolbox**: Paleta de elementos arrastáveis
- **Design Surface**: Área WYSIWYG com grid
- **Properties Panel**: Configuração do elemento selecionado
- **Data Panel**: Campos e variáveis disponíveis
- **Preview Toggle**: Alternar entre Design/Preview

### 4. Report Viewer Component

Visualizador web interativo:

- **Paginação**: Navegação entre páginas
- **Zoom**: Controles de zoom
- **Pesquisa**: Buscar texto no relatório
- **Mapa de Documento**: Miniatura das páginas
- **Parâmetros**: Painel de filtros
- **Exportação**: Botões para cada formato
- **Impressão**: Integração com diálogo de impressão
- **Drill-down/Through**: Cliques interativos

---

## Fluxos de Uso

### Fluxo 1: Criar Novo Relatório

```
1. Usuário acessa /admin/reports
2. Clica em "Novo Relatório"
3. Wizard abre no Passo 1
   - Informa: "Lista de Funcionários"
   - Seleciona: Entidade "User"
4. Avança para Passo 2
   - Escolhe: "Tabela"
5. Avança para Passo 3
   - Seleciona: fullName, email, createdAt
   - Reordena campos
6. Avança para Passo 4
   - Escolhe tema "Profissional Azul"
   - Define título: "Relatório de Funcionários"
7. Clica "Concluir"
8. Sistema gera layout inicial
9. Redireciona para Designer
10. Usuário personaliza (opcional)
11. Salva relatório
```

### Fluxo 2: Editar Relatório Existente

```
1. Usuário acessa /admin/reports
2. Localiza relatório na grade
3. Clica em "Editar"
4. Designer abre com layout carregado
5. Usuário modifica:
   - Reordena colunas
   - Ajusta larguras
   - Configura bordas
   - Adiciona formatação condicional
6. Alterna para Preview
7. Visualiza com dados reais
8. Volta para Design se necessário
9. Salva alterações
```

### Fluxo 3: Copiar Relatório Predefinido

```
1. Usuário acessa /admin/reports
2. Navega para seção "Templates"
3. Localiza "Aniversariantes do Mês"
4. Clica em "Copiar para Meus Relatórios"
5. Sistema:
   - Cria cópia do relatório
   - Copia scripts associados
   - Define como editável
6. Usuário renomeia (opcional)
7. Pode editar livremente no Designer
```

### Fluxo 4: Visualizar e Exportar

```
1. Usuário acessa /admin/reports
2. Clica em "Visualizar" em um relatório
3. Viewer abre com Preview
4. Usuário:
   - Preenche parâmetros (se houver)
   - Navega entre páginas
   - Usa busca para localizar
5. Clica em "Exportar PDF"
6. Download inicia automaticamente
```

---

## Sistema de Relatórios Predefinidos

### Registro de Templates

Os relatórios predefinidos são registrados via seed ou migration:

```typescript
// prisma/seed.ts ou script específico
const predefinedReports = [
  {
    code: 'EMP_LIST',
    name: 'Lista de Funcionários',
    category: 'Recursos Humanos',
    module: 'User',
    type: 'TABLE',
    definition: { /* layout JSON */ },
    dataSource: 'User',
  },
  {
    code: 'EMP_BIRTHDAY',
    name: 'Aniversariantes do Mês',
    category: 'Recursos Humanos',
    module: 'User',
    type: 'TABLE',
    definition: { /* layout JSON */ },
    dataSource: 'User',
    queryConfig: {
      filter: "MONTH(dateOfBirth) = MONTH(CURRENT_DATE())"
    }
  },
  {
    code: 'AUCTION_SUMMARY',
    name: 'Resumo de Leilões',
    category: 'Vendas',
    module: 'Auction',
    type: 'MASTER_DETAIL',
    definition: { /* layout JSON */ },
    dataSource: 'Auction',
  },
  // ... mais templates
];

// Upsert para não duplicar
for (const report of predefinedReports) {
  await prisma.predefinedReport.upsert({
    where: { code: report.code },
    update: report,
    create: report,
  });
}
```

### Organização por Módulo/Tenant

```typescript
// Relatórios globais (todos os tenants)
{ code: 'GLOBAL_SALES', tenantId: null, ... }

// Relatórios específicos por tenant
{ code: 'TENANT_1_CUSTOM', tenantId: 1, ... }

// Query para obter relatórios disponíveis
const reports = await prisma.predefinedReport.findMany({
  where: {
    OR: [
      { tenantId: null },           // Globais
      { tenantId: currentTenantId } // Do tenant atual
    ],
    isActive: true
  },
  orderBy: [
    { category: 'asc' },
    { sortOrder: 'asc' }
  ]
});
```

---

## Exportação e Formatos

### Formatos Suportados

| Formato | Extensão | Biblioteca | Recursos |
|---------|----------|------------|----------|
| PDF | .pdf | @react-pdf/renderer | Imagens, fontes, assinatura digital |
| Excel | .xlsx | exceljs | Múltiplas abas, fórmulas, estilos |
| Word | .docx | docx | Layout preservado |
| CSV | .csv | papaparse | Delimitador configurável |
| HTML | .html | Nativo | Estilizado para email |
| Imagem | .png/.jpg | html-to-image | Para apresentações |

### Exemplo de Exportação PDF

```typescript
// src/services/export.service.ts
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';

class ExportService {
  async exportToPdf(report: Report, data: any[]): Promise<Blob> {
    const definition = report.definition as ReportDefinition;
    
    const doc = (
      <Document>
        <Page size={definition.pageSize} orientation={definition.orientation}>
          {/* Cabeçalho */}
          <View style={styles.header}>
            <Text>{definition.bands.reportHeader?.title}</Text>
          </View>
          
          {/* Dados */}
          <View style={styles.table}>
            {data.map((row, i) => (
              <View key={i} style={styles.tableRow}>
                {definition.elements
                  .filter(e => e.bandId === 'detail')
                  .map(el => (
                    <Text key={el.id} style={getElementStyle(el)}>
                      {formatValue(row[el.properties.fieldBinding!], el.properties.format)}
                    </Text>
                  ))}
              </View>
            ))}
          </View>
          
          {/* Rodapé */}
          <View style={styles.footer}>
            <Text>Página {pageNumber}</Text>
          </View>
        </Page>
      </Document>
    );
    
    return await pdf(doc).toBlob();
  }
}
```

---

## Extensibilidade

### Controles Customizados

```typescript
// Registrar novo tipo de elemento
registerReportElement({
  type: 'signature',
  name: 'Assinatura Digital',
  icon: 'pen-tool',
  defaultSize: { width: 200, height: 80 },
  properties: [
    { name: 'signerName', type: 'text', label: 'Nome do Signatário' },
    { name: 'showDate', type: 'boolean', label: 'Mostrar Data' },
  ],
  render: (props) => <SignatureElement {...props} />,
});
```

### Funções de Expressão Customizadas

```typescript
// Registrar função personalizada
registerExpression({
  name: 'FORMATAR_CPF',
  description: 'Formata CPF com máscara',
  parameters: [{ name: 'cpf', type: 'string' }],
  implementation: (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
});

// Uso no relatório
{ fieldBinding: 'cpf', format: '=FORMATAR_CPF(cpf)' }
```

### Data Providers Customizados

```typescript
// Registrar fonte de dados externa
registerDataProvider({
  name: 'API_EXTERNA',
  description: 'Dados de API REST',
  configSchema: {
    endpoint: { type: 'string', required: true },
    headers: { type: 'object' },
  },
  fetchData: async (config, parameters) => {
    const response = await fetch(config.endpoint, {
      headers: config.headers,
    });
    return response.json();
  }
});
```

---

## Segurança e Permissões

### Níveis de Acesso

```typescript
interface ReportPermissions {
  view: string[];     // Roles que podem visualizar
  edit: string[];     // Roles que podem editar
  delete: string[];   // Roles que podem excluir
  export: string[];   // Roles que podem exportar
  share: string[];    // Roles que podem compartilhar
}

// Exemplo
{
  view: ['admin', 'analyst', 'bidder'],
  edit: ['admin', 'analyst'],
  delete: ['admin'],
  export: ['admin', 'analyst'],
  share: ['admin']
}
```

### Mascaramento de Dados

```typescript
// Configuração de campo sensível
{
  fieldBinding: 'cpf',
  maskingRule: {
    roles: ['viewer'],          // Aplicar máscara para estes roles
    pattern: '***.***.XXX-XX',  // Exibir apenas últimos dígitos
  }
}
```

### Auditoria

Toda execução é registrada em `ReportExecution`:
- Quem executou
- Quando
- Parâmetros utilizados
- Formato de exportação
- Tempo de execução
- Quantidade de registros

---

## Integração com IA

### Funcionalidades IA

```typescript
// src/services/ai-report.service.ts
class AIReportService {
  // Resumir conteúdo do relatório
  async summarize(reportData: any[], prompt?: string): Promise<string> {
    const context = JSON.stringify(reportData.slice(0, 100));
    return await genkit.generate({
      prompt: prompt || `Resuma os principais insights destes dados: ${context}`,
      model: 'gemini-pro',
    });
  }
  
  // Traduzir labels do relatório
  async translate(definition: ReportDefinition, targetLang: string): Promise<ReportDefinition> {
    const labels = extractLabels(definition);
    const translated = await genkit.generate({
      prompt: `Traduza para ${targetLang}: ${JSON.stringify(labels)}`,
    });
    return applyTranslations(definition, translated);
  }
  
  // Sugerir visualização ideal
  async suggestVisualization(schema: any, data: any[]): Promise<ChartConfig> {
    const analysis = await genkit.generate({
      prompt: `Analise estes dados e sugira o melhor tipo de gráfico: ${JSON.stringify({ schema, sample: data.slice(0, 10) })}`,
    });
    return parseChartSuggestion(analysis);
  }
}
```

---

## Boas Práticas

### Validação de Dados

1. **Validar parâmetros** antes de executar queries
2. **Limitar registros** retornados (paginação/MAX)
3. **Timeout** para queries longas
4. **Cache** de resultados frequentes

### Performance

1. **Lazy loading** de dados no viewer
2. **Virtualização** de tabelas grandes
3. **Compressão** de exports grandes
4. **Background jobs** para relatórios pesados

### Extensibilidade Futura

1. **Versionamento** de definições de relatório
2. **Migrations** para atualizar layouts antigos
3. **Hooks** para eventos (beforeRender, afterExport)
4. **Plugins** para formatos de exportação adicionais

### Testes

```typescript
// Teste E2E do wizard
test('should create report via wizard', async ({ page }) => {
  await page.goto('/admin/reports');
  await page.click('[data-ai-id="report-create-button"]');
  
  // Passo 1
  await page.fill('[data-ai-id="report-name-input"]', 'Teste Report');
  await page.selectOption('[data-ai-id="report-datasource-select"]', 'User');
  await page.click('[data-ai-id="wizard-next-button"]');
  
  // Passo 2
  await page.click('[data-ai-id="layout-type-table"]');
  await page.click('[data-ai-id="wizard-next-button"]');
  
  // ...continua
});
```

---

## Próximos Passos

1. [ ] Implementar novos tipos de relatório (Cross-tab, Label)
2. [ ] Adicionar exportação para DOCX com docx.js
3. [ ] Criar agendamento de relatórios
4. [ ] Implementar drill-through entre relatórios
5. [ ] Adicionar suporte a subrelatórios
6. [ ] Criar galeria de templates visuais
7. [ ] Implementar colaboração em tempo real

---

*Documento mantido pela equipe de desenvolvimento BidExpert*
