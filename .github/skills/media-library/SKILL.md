# Media Library (Google Photos-like) — Skill

> **Scope**: Biblioteca de Mídia admin com galeria responsiva, entidades vinculadas, editor de imagem Canvas API, lightbox, e storage dual-adapter.

## Arquitetura

```
src/
├── app/admin/media/
│   ├── page.tsx              # Página principal: compõe todos os componentes
│   ├── actions.ts            # Server actions (CRUD + batch entity links)
│   └── columns.tsx           # LEGADO (DataTable — não mais importado)
├── app/api/media/
│   ├── edit/route.ts         # POST: salvar edição (copy ou overwrite)
│   └── ...                   # Upload, thumbnails
├── components/admin/media/
│   ├── media-gallery-view.tsx    # Grid/Rows/List com seleção multi
│   ├── media-sidebar-panel.tsx   # Sheet lateral 3 tabs (Info, Links, Edit)
│   ├── media-image-editor.tsx    # Canvas API: crop, rotate, flip, ajustes
│   ├── media-lightbox.tsx        # YARL lightbox (zoom, thumbnails, fullscreen)
│   ├── media-entity-badge.tsx    # Badges coloridos de entidade
│   ├── media-toolbar.tsx         # Toolbar: busca, filtros, sort, viewMode
│   └── media-upload-zone.tsx     # Drag-and-drop upload
├── services/
│   ├── media-entity-links.service.ts  # Reverse FK: descobre entidades vinculadas
│   └── media.service.ts              # CRUD básico
└── lib/storage/
    ├── index.ts                  # Factory: getStorageAdapter()
    ├── local.adapter.ts          # Dev: public/uploads/
    └── vercel-blob.adapter.ts    # Prod: @vercel/blob
```

## Dependências (todas MIT/Apache-2.0)

| Pacote | Versão | Uso |
|--------|--------|-----|
| `react-advanced-cropper` | ^0.20.1 | Crop tool (futura integração) |
| `yet-another-react-lightbox` | ^3.29.0 | Lightbox viewer |
| `react-photo-album` | ^3.4.0 | Layout de fotos (futura masonry) |
| `react-colorful` | ^5.6.1 | Color picker (futura paleta) |
| `@vercel/blob` | ^2.2.0 | Storage Vercel Blob |

**PROIBIDO**: `@imgly/background-removal` — licença AGPL incompatível com uso comercial.

## Componentes Principais

### MediaGalleryView (`media-gallery-view.tsx`)
- **ViewModes**: `grid` (masonry responsivo), `rows` (fileiras maiores), `list` (tabela compacta)
- **Seleção**: click=toggle, shift+click=range, ctrl+click=toggle
- **Hover overlay**: checkbox, Eye (lightbox), Pencil (editor), Trash2 (delete)
- **Entity badges**: exibe até 2 badges na thumbnail
- **data-ai-id**: `media-gallery-view`, `media-gallery-card`, `media-gallery-list-row`

### MediaSidebarPanel (`media-sidebar-panel.tsx`)
- **Sheet lateral** com 3 Tabs:
  - **Info**: filename, type, size, upload date, URL copy
  - **Links**: entity badges clicáveis (navega para admin page)
  - **Edit**: edição inline de title, altText, caption, description
- **data-ai-id**: `media-sidebar-panel`

### MediaImageEditor (`media-image-editor.tsx`)
- **Canvas API puro** (zero dependências AGPL)
- **Transform**: crop (aspect presets: 1:1, 4:3, 16:9, 3:2, free), rotate 90°, rotate livre 0-359°, flip H/V
- **Adjust**: brightness, contrast, saturation (sliders 0-200%)
- **History**: undo/redo via canvas snapshots (toDataURL)
- **Export**: download local, salvar cópia, sobrescrever original
- **data-ai-id**: `media-image-editor`

### MediaLightbox (`media-lightbox.tsx`)
- **Plugins**: Zoom (5x, scrollToZoom), Thumbnails, Fullscreen, Download, Counter, Captions
- Filtra apenas itens de imagem
- Exibe entity links na caption

### MediaEntityBadge (`media-entity-badge.tsx`)
- Badges coloridos por tipo: Asset (azul), Auction (laranja), Lot (verde), Auctioneer (roxo), Seller (teal), Category (amarelo)
- Design tokens em `globals.css`: `--media-entity-*`

### MediaToolbar (`media-toolbar.tsx`)
- View mode toggle (grid/rows/list)
- Search input
- Sort (uploadedAt, fileName, sizeBytes)
- Filtros: entity type, file type
- Bulk actions: delete selecionados
- Upload button

### MediaUploadZone (`media-upload-zone.tsx`)
- Drag-and-drop via react-dropzone
- Progress bar com toast
- Upload via FormData → `/api/upload`

## Entity Links Service (`media-entity-links.service.ts`)

**Propósito**: Dado um MediaItem, descobre TODAS as entidades que o referenciam via FK reverso.

**Tabelas consultadas**:
- `Asset.imageMediaId`
- `Auction.imageMediaId`
- `Auctioneer.logoMediaId`
- `Lot.imageMediaId`
- `Seller.logoMediaId`
- `LotCategory.logoMediaId`, `coverImageMediaId`, `megaMenuImageMediaId`
- `Subcategory.iconMediaId`
- `DirectSaleOffer.imageMediaId`
- `AssetMedia` (junction table)

**REGRA CRÍTICA**: O model `Asset` usa o campo `title` (NÃO `name`). Sempre verificar o schema.prisma antes de adicionar novas queries.

## Storage Adapter Pattern

```typescript
// src/lib/storage/index.ts
export function getStorageAdapter(): StorageAdapter {
  if (process.env.VERCEL || process.env.BLOB_READ_WRITE_TOKEN) {
    return new VercelBlobAdapter();
  }
  return new LocalStorageAdapter();
}
```

- **Dev**: `LocalStorageAdapter` salva em `public/uploads/`
- **Prod**: `VercelBlobAdapter` usa `@vercel/blob` (put/del)

## Design System Tokens

Definidos em `globals.css`:
```css
:root {
  --media-grid-gap: 0.5rem;
  --media-thumb-radius: 0.375rem;
  --media-overlay-bg: hsla(0 0% 0% / 0.55);
  --media-selection-ring: 0 0 0 3px hsl(var(--primary));
  --media-entity-asset: 221 83% 53%;
  --media-entity-auction: 25 95% 53%;
  --media-entity-lot: 142 76% 36%;
  /* ... + editor tokens */
}
```

## API Routes

### POST `/api/media/edit`
- **Body**: FormData com `file`, `mode` ('copy'|'overwrite'), `originalId`, `userId`
- **Overwrite**: deleta arquivo antigo, atualiza MediaItem
- **Copy**: cria novo MediaItem com `_edited` suffix
- **OBRIGATÓRIO**: `export const dynamic = 'force-dynamic'`

## Testes

### Testes E2E recomendados
1. Navegar para `/admin/media` (requer login admin)
2. Verificar grid mode renderizado com data-ai-id
3. Upload de imagem via drag-and-drop
4. Alternar entre grid/rows/list
5. Abrir lightbox ao clicar em imagem
6. Abrir sidebar e editar metadados
7. Abrir editor, aplicar crop, salvar cópia
8. Deletar item via checkbox + bulk delete

### Locators data-ai-id
```
admin-media-page-container
media-gallery-view
media-gallery-card
media-gallery-list-row
media-sidebar-panel
media-image-editor
media-lightbox
```

## Regras para Agentes

1. **NUNCA** usar `Asset.name` — o campo correto é `Asset.title`
2. **NUNCA** usar `@imgly/background-removal` (AGPL)
3. **SEMPRE** usar `getStorageAdapter()` para operações de arquivo
4. **SEMPRE** serializar BigInt→string antes de retornar ao client
5. **SEMPRE** incluir `data-ai-id` em novos componentes de mídia
6. **SEMPRE** incluir `updatedAt: new Date()` em `create()` de MediaItem
7. Ao adicionar nova entidade vinculada, atualizar `media-entity-links.service.ts` em AMBAS as funções (`getEntityLinksForMediaItem` e `getEntityLinksForMediaItems`)
8. Design tokens de cor de entidade ficam em `globals.css` (não inline)
