# 🎯 OS 5 GAPS PRINCIPAIS - PLANEJAMENTO TÉCNICO DETALHADO

## 1️⃣ LANCES AUTOMÁTICOS ⚡

### O que é?
Sistema que permite ao comprador configurar um valor máximo, e o sistema dá lances automáticos para vencer até esse limite.

### Por que?
- Melhor experiência para compradores
- Aumenta engajamento
- Reduz perda de leilões por inatividade

### Implementação Técnica

#### Backend (Node.js/TypeScript)
```typescript
// prisma/schema.prisma - Adicionar
model LanceAutomatico {
  id String @id @default(cuid())
  leilaoId String
  loteId String
  usuarioId String
  valorMaximo Decimal
  statusAtivado Boolean @default(false)
  ultimoLanceAutomatico Decimal?
  criadoEm DateTime @default(now())
  atualizadoEm DateTime @updatedAt
}

// services/lance-automatico.service.ts
class LanceAutomaticoService {
  async criarLanceAutomatico(input) {
    // Validar valor máximo
    // Criar registro
    // Iniciar worker
  }
  
  async processarLanceAutomatico(loteId) {
    // Get maior lance atual
    // Se < valorMaximo, dar lance automático
    // Registrar em AuditLog
  }
}

// jobs/auto-bidding.job.ts (worker)
async processAutoLances() {
  // Executar a cada 5 segundos
  // Para cada lote ativo:
  // - Buscar lances automáticos
  // - Executar lógica
}
```

#### Frontend (React/Next.js)
```typescript
// components/AuctionCreate/AutoBiddingToggle.tsx
<div>
  <checkbox 
    name="habilitarLancesAutomaticos"
    label="Permitir Lances Automáticos"
  />
  {habilitarLancesAutomaticos && (
    <input 
      name="incrementoAutomatico"
      type="number"
      label="Incremento Automático (R$)"
    />
  )}
</div>

// components/LoteBidding/AutoBidPanel.tsx
<div>
  <input 
    name="valorMaximoAutomatico"
    placeholder="Valor máximo que deseja"
  />
  <button onClick={habilitarLancesAutomaticos}>
    Ativar Lances Automáticos
  </button>
</div>
```

#### Database
```sql
-- Índices para performance
CREATE INDEX idx_lances_automaticos_lote ON lances_automaticos(lote_id, status_ativado);
CREATE INDEX idx_lances_automaticos_usuario ON lances_automaticos(usuario_id);
```

### Testes
- ✅ Test: "deve habilitar lances automáticos no cadastro"
- ✅ Test: "deve aceitar lances automáticos se habilitados"
- Falta: Teste de performance com 1000+ lances simultâneos

### Estimativa: 4-6 horas

---

## 2️⃣ MARKETING & BANNERS 📢

### O que é?
Sistema de banners dinâmicos, integração com redes sociais, e Google Ads.

### Componentes

#### A) Banners Dinâmicos
```typescript
// Banner que puxa do leilão e do lote para atrair visitantes

// prisma/schema.prisma
model Banner {
  id String @id
  titulo String
  descricao String
  imagemUrl String
  leilaoId String? // Link para leilão
  loteId String? // Link para lote
  posicao String // HOME, LISTAGEM, DETALHES
  ativo Boolean
  dataInicio DateTime
  dataFim DateTime?
  cliques Int @default(0)
  impressoes Int @default(0)
}

// components/BannerPromocional.tsx
export function BannerPromocional({ leilao, lote }) {
  return (
    <section className="banner-destaque">
      <img src={banner.imagemUrl} />
      <h2>{banner.titulo}</h2>
      <p>{banner.descricao}</p>
      <a href={`/leilao/${leilao.id}`}>
        Ver Leilão →
      </a>
    </section>
  );
}
```

#### B) Integração Redes Sociais
```typescript
// services/social-media.service.ts
class SocialMediaService {
  async compartilharNoFacebook(leilao) {
    // Usar facebook-sdk ou graph-api
  }
  
  async compartilharNoInstagram(lote) {
    // Gerar imagem otimizada
    // Compartilhar via API
  }
  
  async compartilharNoLinkedin(leilao) {
    // Para B2B
  }
  
  async compartilharNoWhatsapp(lote) {
    // Link com preview
  }
}
```

#### C) Google Ads Integration
```typescript
// services/google-ads.service.ts
class GoogleAdsService {
  async criarCampanha(leilao) {
    // Setup Google Ads API
    // Criar campanha
    // Setup conversão tracking
  }
  
  async rastrearConversao(leilaoId, usuarioId) {
    // Send to Google Ads conversion tracking
  }
}

// lib/google-ads-pixel.ts
// Tag para página de detalhes
gtag('event', 'view_item', {
  currency: 'BRL',
  value: lote.valor_estimado,
  items: [{
    item_id: lote.id,
    item_name: lote.titulo,
    item_category: 'leilao'
  }]
});
```

### Testes
- Test: "deve exibir banners em múltiplas páginas"
- Test: "deve rastrear cliques em banners"
- Test: "deve compartilhar corretamente em redes sociais"

### Estimativa: 8-10 horas

---

## 3️⃣ ANALYTICS COMPLETO 📊

### O que é?
Dashboard de analytics com tracking de eventos, falhas, e performance.

### Componentes

#### A) Event Tracking
```typescript
// lib/analytics.ts
class AnalyticsService {
  async rastrearEvento(evento: string, dados: any) {
    // Send to Google Analytics 4
    // Send to custom backend
    // Send to Mixpanel (opcional)
  }
  
  async rastrearFalha(erro: Error, contexto: any) {
    // Log erro
    // Send to Sentry
    // Store em banco
  }
}

// Uso em componentes
useEffect(() => {
  analytics.rastrearEvento('visualizou_lote', {
    loteId: lote.id,
    leilaoId: leilao.id,
    duracao: tempoNaPagina
  });
}, [lote.id]);
```

#### B) Dashboard Analytics
```typescript
// pages/admin/analytics.tsx
export default function AnalyticsDashboard() {
  return (
    <div>
      <MetricaCard
        titulo="Leilões Ativos"
        valor={stats.leiloes_ativos}
        trend="+12%"
      />
      <MetricaCard
        titulo="Lances Totais"
        valor={stats.total_lances}
        trend="+5%"
      />
      <GraficoTempo
        dados={stats.lances_por_hora}
        titulo="Lances por Hora"
      />
      <GraficoTempo
        dados={stats.usuarios_ativos}
        titulo="Usuários Ativos"
      />
      <TabelaFalhas
        falhas={stats.falhas_recentes}
      />
    </div>
  );
}
```

#### C) Analytics de Falhas
```typescript
// Database
model Falha {
  id String @id
  tipo String // ERROR, WARNING, TIMEOUT
  mensagem String
  stack String?
  contexto Json
  usuarioId String?
  timestamp DateTime @default(now())
  resolvido Boolean @default(false)
}

// API
GET /api/analytics/falhas?periodo=7d&tipo=ERROR
GET /api/analytics/falhas/:id

// Query
SELECT tipo, COUNT(*) as total 
FROM falhas 
WHERE timestamp >= NOW() - INTERVAL 7 DAY
GROUP BY tipo
```

### Estimativa: 6-8 horas

---

## 4️⃣ APIs GOOGLE 🔍

### O que é?
Integração com Google Maps, Imagens, Busca para enriquecer dados.

### Componentes

#### A) Google Maps - Busca por CEP
```typescript
// services/google-maps.service.ts
import { Client } from '@googlemaps/js-clients';

class GoogleMapsService {
  private client: Client;
  
  async buscarEnderecoPorCEP(cep: string) {
    // Usar Geocoding API
    const resultado = await this.client.geocode({
      address: cep
    });
    
    return {
      rua: resultado.address_components[0].long_name,
      numero: resultado.address_components[1]?.long_name,
      cidade: resultado.address_components[3]?.long_name,
      estado: resultado.address_components[5]?.long_name,
      cep: resultado.address_components[6]?.long_name,
      lat: resultado.geometry.location.lat,
      lng: resultado.geometry.location.lng
    };
  }
}

// Frontend - Hook
function useBuscaCEP() {
  const [endereco, setEndereco] = useState(null);
  const [loading, setLoading] = useState(false);
  
  async function buscar(cep: string) {
    setLoading(true);
    const resultado = await fetch(`/api/endereco/${cep}`);
    setEndereco(await resultado.json());
    setLoading(false);
  }
  
  return { endereco, buscar, loading };
}
```

#### B) Google Vision API - Análise de Imagens
```typescript
// services/google-vision.service.ts
class GoogleVisionService {
  async analisarImagem(url: string) {
    // Detectar objetos
    // Detectar texto
    // Verificar qualidade
    
    const response = await vision.detect(url);
    return {
      objetos_detectados: response.localizedObjectAnnotations,
      textos: response.textAnnotations,
      cores: response.imagePropertiesAnnotation,
      qualidade_score: calculaQualidade(response)
    };
  }
}

// Uso
const analise = await visionService.analisarImagem(lote.imagem_url);
console.log(`Qualidade: ${analise.qualidade_score}%`);
console.log(`Objetos: ${analise.objetos_detectados.map(o => o.name)}`);
```

#### C) Google Search API - Busca de Referências
```typescript
// services/google-search.service.ts
class GoogleSearchService {
  async buscarPrecosReferencia(lote) {
    // Buscar preços similares na internet
    const query = `${lote.marca} ${lote.modelo} preço`;
    const resultados = await this.buscar(query);
    
    return {
      precos_encontrados: extrairPrecos(resultados),
      links_referencias: resultados.slice(0, 5),
      media_preco: calcularMedia(resultados)
    };
  }
}
```

### Mock para Testes
```typescript
// tests/mocks/google-services.mock.ts
export const mockGoogleMapsService = {
  buscarEnderecoPorCEP: jest.fn().mockResolvedValue({
    rua: 'Avenida Paulista',
    numero: '1000',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01311100'
  })
};

export const mockGoogleVisionService = {
  analisarImagem: jest.fn().mockResolvedValue({
    objetos_detectados: [{ name: 'notebook', confidence: 0.95 }],
    qualidade_score: 85
  })
};
```

### Estimativa: 5-7 horas

---

## 5️⃣ SUPORTE ERP 🔗

### O que é?
Disponibilizar funcionalidades no ERP do leiloeiro via API/Webservice.

### Arquitetura

#### A) Webservice REST API
```typescript
// controllers/erp-integration.controller.ts
export class ERPIntegrationController {
  // Para sincronizar leilões
  @Post('/api/erp/sync/leiloes')
  async sincronizarLeiloes(@Body() body) {
    // Receber dados do ERP
    // Criar/atualizar leilões
    // Retornar status
  }
  
  // Para sincronizar lotes
  @Post('/api/erp/sync/lotes')
  async sincronizarLotes(@Body() body) {
    // Receber lotes do ERP
    // Validar dados
    // Criar em BD
  }
  
  // Para buscar status
  @Get('/api/erp/leiloes/:id/status')
  async obterStatusLeilao(@Param() id: string) {
    // Retornar status atual
    // Retornar lances
    // Retornar ganhador (se encerrado)
  }
  
  // Para buscar resultados
  @Get('/api/erp/leiloes/:id/resultado')
  async obterResultado(@Param() id: string) {
    // Retornar lote vendido
    // Retornar ganhador
    // Retornar valor final
  }
}
```

#### B) OpenAPI/Swagger
```yaml
# swagger.yaml
openapi: 3.0.0
info:
  title: BidExpert ERP Integration API
  version: 1.0.0
paths:
  /api/erp/sync/leiloes:
    post:
      summary: Sincronizar leilões
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/LeilaoSyncRequest'
      responses:
        '200':
          description: Sucesso
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SyncResponse'
components:
  schemas:
    LeilaoSyncRequest:
      type: object
      properties:
        id: { type: string }
        titulo: { type: string }
        lotes: { type: array }
        dataInicio: { type: string, format: date-time }
        dataFim: { type: string, format: date-time }
```

#### C) Autenticação
```typescript
// middleware/erp-auth.ts
export function erpAuth(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  const timestamp = req.headers['x-timestamp'];
  const signature = req.headers['x-signature'];
  
  // Validar API Key
  // Validar timestamp (max 5 min)
  // Validar signature HMAC-SHA256
  
  if (!validarAssinatura(apiKey, timestamp, signature, req.body)) {
    return res.status(401).json({ erro: 'Assinatura inválida' });
  }
  
  next();
}
```

#### D) Webhooks para Notificações
```typescript
// services/erp-webhook.service.ts
class ERPWebhookService {
  async notificarMudanca(evento: string, dados: any) {
    // Buscar webhooks cadastrados
    // Enviar POST para cada URL
    // Registrar tentativas
    // Retry com backoff exponencial
  }
}

// Eventos:
// - leilao.criado
// - leilao.iniciado
// - leilao.encerrado
// - lote.vendido
// - lance.novo
```

### Mock para Testes
```typescript
// Mock ERP responses
const mockERP = {
  leiloes: [{
    id: 'leilao-001',
    titulo: 'Teste ERP',
    estado: 'ATIVO'
  }],
  
  resultado: {
    loteId: 'lote-001',
    ganhador: 'comprador@test.com',
    valor: 950.00,
    data_venda: new Date()
  }
};
```

### Estimativa: 10-12 horas

---

## 📊 ROADMAP TOTAL

```
Semana 1:
  ├─ Lances Automáticos (4-6h) ✓ Testes prontos
  └─ APIs Google (5-7h) ✓ Testes prontos

Semana 2:
  ├─ Marketing & Banners (8-10h) ✓ Testes prontos
  └─ Analytics (6-8h) ✓ Testes prontos

Semana 3:
  ├─ Suporte ERP (10-12h) ✓ Testes prontos
  └─ Testes de carga & CI/CD

Estimativa Total: ~45-55 horas = ~1 semana intensiva
```

---

## ✅ PRÓXIMOS PASSOS

1. **Executar testes** para validar infraestrutura
2. **Começar pelo GAP 1** (Lances Automáticos)
3. **Usar testes como guia** de implementação
4. **Deploy incrementalmente** após cada GAP

---

**Status:** 📋 Planejamento Técnico Completo
**Data:** 2025-11-14
