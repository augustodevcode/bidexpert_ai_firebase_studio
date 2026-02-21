/**
 * @fileoverview Serviço de rastreamento de visitantes e eventos.
 * 
 * Este serviço implementa um sistema de tracking similar ao usado pelo Booking.com:
 * - Identificação única de visitantes via cookies
 * - Sessões de navegação
 * - Event sourcing para registrar todas as interações
 * - Métricas agregadas para contadores de visualização
 * 
 * REGRAS DE NEGÓCIO:
 * 1. Visitantes são identificados por um UUID único armazenado em cookie
 * 2. Uma sessão agrupa eventos de uma visita específica (30 min de inatividade = nova sessão)
 * 3. Eventos são imutáveis (Event Sourcing)
 * 4. Métricas agregadas são atualizadas em tempo real para exibição rápida
 * 5. NÃO duplicar contagem do mesmo visitante na mesma sessão para a mesma entidade
 */

import { PrismaClient, VisitorEvent_eventType, Visitor, VisitorSession, VisitorEvent, EntityViewMetrics } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

// Tempo de inatividade para considerar uma nova sessão (30 minutos)
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

// Interface para dados de geolocalização baseados em IP
interface GeoData {
  country?: string;
  region?: string;
  city?: string;
}

// Interface para dados do dispositivo parseados do User-Agent
interface DeviceData {
  deviceType: string;
  browser: string;
  os: string;
}

// Interface para parâmetros UTM
interface UtmParams {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

// Interface para metadados de evento
interface EventMetadata {
  [key: string]: string | number | boolean | null | undefined;
}

// Interface para resultado de registro de visita
interface VisitResult {
  visitorId: string;
  sessionId: string;
  isNewVisitor: boolean;
  isNewSession: boolean;
}

// Interface para métricas de visualização
interface ViewMetrics {
  totalViews: number;
  uniqueViews: number;
  viewsLast24h: number;
  viewsLast7d: number;
  viewsLast30d: number;
  lastViewedAt: Date | null;
}

export class VisitorTrackingService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  /**
   * Registra ou recupera um visitante pelo ID do cookie
   * @param visitorCookieId - UUID do cookie do visitante
   * @param userAgent - User-Agent do navegador
   * @param ipAddress - Endereço IP do visitante
   * @param referrer - URL de referência (de onde veio)
   * @param userId - ID do usuário logado (opcional)
   */
  async getOrCreateVisitor(
    visitorCookieId: string | null,
    userAgent?: string | null,
    ipAddress?: string | null,
    referrer?: string | null,
    userId?: bigint | null
  ): Promise<{ visitor: Visitor; isNew: boolean }> {
    // Se não há cookie ID, criar um novo visitante
    if (!visitorCookieId) {
      const newVisitorId = uuidv4();
      const deviceData = this.parseUserAgent(userAgent || '');
      const geoData = await this.getGeoDataFromIp(ipAddress || '');

      const visitor = await this.prisma.visitor.create({
        data: {
          visitorId: newVisitorId,
          userId: userId || null,
          firstUserAgent: userAgent,
          firstIpAddress: ipAddress,
          firstReferrer: referrer,
          deviceType: deviceData.deviceType,
          browser: deviceData.browser,
          os: deviceData.os,
          country: geoData.country,
          region: geoData.region,
          city: geoData.city,
        }
      });

      return { visitor, isNew: true };
    }

    // Buscar visitante existente
    let visitor = await this.prisma.visitor.findUnique({
      where: { visitorId: visitorCookieId }
    });

    if (!visitor) {
      // Cookie ID existe mas visitante não encontrado - criar novo com o ID existente
      const deviceData = this.parseUserAgent(userAgent || '');
      const geoData = await this.getGeoDataFromIp(ipAddress || '');

      visitor = await this.prisma.visitor.create({
        data: {
          visitorId: visitorCookieId,
          userId: userId || null,
          firstUserAgent: userAgent,
          firstIpAddress: ipAddress,
          firstReferrer: referrer,
          deviceType: deviceData.deviceType,
          browser: deviceData.browser,
          os: deviceData.os,
          country: geoData.country,
          region: geoData.region,
          city: geoData.city,
        }
      });

      return { visitor, isNew: true };
    }

    // Atualizar última visita e contador
    await this.prisma.visitor.update({
      where: { id: visitor.id },
      data: {
        lastVisitAt: new Date(),
        totalVisits: { increment: 1 },
        // Se usuário logou, atualizar userId
        ...(userId && !visitor.userId ? { userId } : {})
      }
    });

    return { visitor, isNew: false };
  }

  /**
   * Obtém ou cria uma sessão para o visitante
   * Se a última atividade foi há mais de 30 minutos, cria nova sessão
   */
  async getOrCreateSession(
    visitorInternalId: bigint,
    userAgent?: string | null,
    ipAddress?: string | null,
    referrer?: string | null,
    utmParams?: UtmParams
  ): Promise<{ session: VisitorSession; isNew: boolean }> {
    const cutoffTime = new Date(Date.now() - SESSION_TIMEOUT_MS);

    // Buscar sessão ativa (última atividade dentro do timeout)
    const existingSession = await this.prisma.visitorSession.findFirst({
      where: {
        visitorId: visitorInternalId,
        lastActivityAt: { gte: cutoffTime },
        endedAt: null
      },
      orderBy: { lastActivityAt: 'desc' }
    });

    if (existingSession) {
      // Atualizar última atividade da sessão existente
      await this.prisma.visitorSession.update({
        where: { id: existingSession.id },
        data: { lastActivityAt: new Date() }
      });

      return { session: existingSession, isNew: false };
    }

    // Criar nova sessão
    const session = await this.prisma.visitorSession.create({
      data: {
        sessionId: uuidv4(),
        visitorId: visitorInternalId,
        userAgent,
        ipAddress,
        referrer,
        utmSource: utmParams?.utmSource,
        utmMedium: utmParams?.utmMedium,
        utmCampaign: utmParams?.utmCampaign,
      }
    });

    return { session, isNew: true };
  }

  /**
   * Registra um evento de visitante (Event Sourcing)
   * Não duplica eventos do mesmo tipo para a mesma entidade na mesma sessão
   */
  async trackEvent(
    visitorInternalId: bigint,
    sessionInternalId: bigint,
    eventType: VisitorEvent_eventType,
    entityType?: string | null,
    entityId?: bigint | null,
    entityPublicId?: string | null,
    pageUrl?: string | null,
    metadata?: EventMetadata
  ): Promise<{ event: VisitorEvent; isDuplicate: boolean }> {
    // Verificar se já existe evento do mesmo tipo para a mesma entidade nesta sessão
    // (para evitar contagem duplicada de visualizações)
    if (entityType && entityId && (eventType === 'LOT_VIEW' || eventType === 'AUCTION_VIEW')) {
      const existingEvent = await this.prisma.visitorEvent.findFirst({
        where: {
          sessionId: sessionInternalId,
          eventType,
          entityType,
          entityId
        }
      });

      if (existingEvent) {
        return { event: existingEvent, isDuplicate: true };
      }
    }

    // Criar o evento
    const event = await this.prisma.visitorEvent.create({
      data: {
        eventId: uuidv4(),
        visitorId: visitorInternalId,
        sessionId: sessionInternalId,
        eventType,
        entityType,
        entityId,
        entityPublicId,
        pageUrl,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null
      }
    });

    // Atualizar contadores
    await Promise.all([
      // Atualizar contador da sessão
      this.prisma.visitorSession.update({
        where: { id: sessionInternalId },
        data: {
          eventsCount: { increment: 1 },
          ...(eventType === 'PAGE_VIEW' || eventType === 'LOT_VIEW' || eventType === 'AUCTION_VIEW'
            ? { pageViews: { increment: 1 } }
            : {}),
          lastActivityAt: new Date()
        }
      }),
      // Atualizar contador do visitante
      this.prisma.visitor.update({
        where: { id: visitorInternalId },
        data: {
          totalEvents: { increment: 1 },
          ...(eventType === 'PAGE_VIEW' || eventType === 'LOT_VIEW' || eventType === 'AUCTION_VIEW'
            ? { totalPageViews: { increment: 1 } }
            : {}),
          lastVisitAt: new Date()
        }
      })
    ]);

    // Se é visualização de entidade, atualizar métricas agregadas
    if (entityType && entityId && (eventType === 'LOT_VIEW' || eventType === 'AUCTION_VIEW')) {
      await this.updateEntityMetrics(entityType, entityId, entityPublicId);
    }

    return { event, isDuplicate: false };
  }

  /**
   * Atualiza as métricas agregadas de uma entidade
   * Incrementa contadores e recalcula métricas de período
   */
  private async updateEntityMetrics(
    entityType: string,
    entityId: bigint,
    entityPublicId?: string | null,
    tenantId?: bigint | null
  ): Promise<void> {
    // Verificar se registro de métricas existe
    const existingMetrics = await this.prisma.entityViewMetrics.findUnique({
      where: {
        entityType_entityId: { entityType, entityId }
      }
    });

    if (existingMetrics) {
      // Atualizar métricas existentes
      await this.prisma.entityViewMetrics.update({
        where: { id: existingMetrics.id },
        data: {
          totalViews: { increment: 1 },
          lastViewedAt: new Date()
        }
      });
    } else {
      // Criar novo registro de métricas
      await this.prisma.entityViewMetrics.create({
        data: {
          entityType,
          entityId,
          entityPublicId,
          tenantId,
          totalViews: 1,
          uniqueViews: 1,
          lastViewedAt: new Date()
        }
      });
    }

    // Atualizar também o campo views no Lot se for visualização de lote
    if (entityType === 'Lot') {
      await this.prisma.lot.update({
        where: { id: entityId },
        data: { views: { increment: 1 } }
      });
    }
  }

  /**
   * Recalcula métricas de visitantes únicos para uma entidade
   * (Deve ser executado periodicamente por um job)
   */
  async recalculateUniqueViews(entityType: string, entityId: bigint): Promise<number> {
    const uniqueCount = await this.prisma.visitorEvent.groupBy({
      by: ['visitorId'],
      where: {
        entityType,
        entityId,
        eventType: entityType === 'Lot' ? 'LOT_VIEW' : 'AUCTION_VIEW'
      },
      _count: { visitorId: true }
    });

    const count = uniqueCount.length;

    await this.prisma.entityViewMetrics.upsert({
      where: {
        entityType_entityId: { entityType, entityId }
      },
      update: { uniqueViews: count },
      create: {
        entityType,
        entityId,
        uniqueViews: count,
        totalViews: count
      }
    });

    return count;
  }

  /**
   * Recalcula métricas por período (24h, 7d, 30d)
   * (Deve ser executado periodicamente por um job)
   */
  async recalculatePeriodMetrics(entityType: string, entityId: bigint): Promise<void> {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const eventType = entityType === 'Lot' ? VisitorEvent_eventType.LOT_VIEW : VisitorEvent_eventType.AUCTION_VIEW;

    const [views24h, views7d, views30d] = await Promise.all([
      this.prisma.visitorEvent.count({
        where: { entityType, entityId, eventType, timestamp: { gte: last24h } }
      }),
      this.prisma.visitorEvent.count({
        where: { entityType, entityId, eventType, timestamp: { gte: last7d } }
      }),
      this.prisma.visitorEvent.count({
        where: { entityType, entityId, eventType, timestamp: { gte: last30d } }
      })
    ]);

    await this.prisma.entityViewMetrics.upsert({
      where: {
        entityType_entityId: { entityType, entityId }
      },
      update: {
        viewsLast24h: views24h,
        viewsLast7d: views7d,
        viewsLast30d: views30d
      },
      create: {
        entityType,
        entityId,
        viewsLast24h: views24h,
        viewsLast7d: views7d,
        viewsLast30d: views30d
      }
    });
  }

  /**
   * Obtém métricas de visualização de uma entidade
   */
  async getEntityMetrics(entityType: string, entityId: bigint): Promise<ViewMetrics> {
    const metrics = await this.prisma.entityViewMetrics.findUnique({
      where: {
        entityType_entityId: { entityType, entityId }
      }
    });

    if (!metrics) {
      return {
        totalViews: 0,
        uniqueViews: 0,
        viewsLast24h: 0,
        viewsLast7d: 0,
        viewsLast30d: 0,
        lastViewedAt: null
      };
    }

    return {
      totalViews: metrics.totalViews,
      uniqueViews: metrics.uniqueViews,
      viewsLast24h: metrics.viewsLast24h,
      viewsLast7d: metrics.viewsLast7d,
      viewsLast30d: metrics.viewsLast30d,
      lastViewedAt: metrics.lastViewedAt
    };
  }

  /**
   * Obtém métricas de visualização por publicId
   */
  async getEntityMetricsByPublicId(entityType: string, publicId: string): Promise<ViewMetrics> {
    const metrics = await this.prisma.entityViewMetrics.findFirst({
      where: {
        entityType,
        entityPublicId: publicId
      }
    });

    if (!metrics) {
      return {
        totalViews: 0,
        uniqueViews: 0,
        viewsLast24h: 0,
        viewsLast7d: 0,
        viewsLast30d: 0,
        lastViewedAt: null
      };
    }

    return {
      totalViews: metrics.totalViews,
      uniqueViews: metrics.uniqueViews,
      viewsLast24h: metrics.viewsLast24h,
      viewsLast7d: metrics.viewsLast7d,
      viewsLast30d: metrics.viewsLast30d,
      lastViewedAt: metrics.lastViewedAt
    };
  }

  /**
   * Método principal para registrar uma visita completa
   * Combina criação/recuperação de visitante, sessão e evento
   */
  async recordVisit(
    visitorCookieId: string | null,
    eventType: VisitorEvent_eventType,
    options: {
      userAgent?: string | null;
      ipAddress?: string | null;
      referrer?: string | null;
      userId?: bigint | null;
      entityType?: string | null;
      entityId?: bigint | null;
      entityPublicId?: string | null;
      pageUrl?: string | null;
      metadata?: EventMetadata;
      utmParams?: UtmParams;
    } = {}
  ): Promise<VisitResult> {
    const { visitor, isNew: isNewVisitor } = await this.getOrCreateVisitor(
      visitorCookieId,
      options.userAgent,
      options.ipAddress,
      options.referrer,
      options.userId
    );

    const { session, isNew: isNewSession } = await this.getOrCreateSession(
      visitor.id,
      options.userAgent,
      options.ipAddress,
      options.referrer,
      options.utmParams
    );

    await this.trackEvent(
      visitor.id,
      session.id,
      eventType,
      options.entityType,
      options.entityId,
      options.entityPublicId,
      options.pageUrl,
      options.metadata
    );

    return {
      visitorId: visitor.visitorId,
      sessionId: session.sessionId,
      isNewVisitor,
      isNewSession
    };
  }

  /**
   * Obtém estatísticas de um visitante
   */
  async getVisitorStats(visitorCookieId: string): Promise<Visitor | null> {
    const visitor = await this.prisma.visitor.findUnique({
      where: { visitorId: visitorCookieId },
      include: {
        VisitorSession: {
          take: 10,
          orderBy: { startedAt: 'desc' }
        },
        _count: {
          select: {
            VisitorSession: true,
            VisitorEvent: true
          }
        }
      }
    });

    return visitor;
  }

  /**
   * Obtém os lotes mais visualizados
   */
  async getMostViewedLots(limit: number = 10, tenantId?: bigint): Promise<EntityViewMetrics[]> {
    const whereClause = {
      entityType: 'Lot',
      ...(tenantId ? { tenantId } : {})
    };

    const metrics = await this.prisma.entityViewMetrics.findMany({
      where: whereClause,
      orderBy: { totalViews: 'desc' },
      take: limit
    });

    return metrics;
  }

  /**
   * Obtém eventos recentes de uma entidade (para análise)
   */
  async getRecentEventsForEntity(
    entityType: string,
    entityId: bigint,
    limit: number = 100
  ): Promise<VisitorEvent[]> {
    const events = await this.prisma.visitorEvent.findMany({
      where: { entityType, entityId },
      orderBy: { timestamp: 'desc' },
      take: limit,
      include: {
        Visitor: {
          select: {
            visitorId: true,
            country: true,
            city: true,
            deviceType: true,
            browser: true
          }
        }
      }
    });

    return events;
  }

  /**
   * Parse User-Agent para extrair informações do dispositivo
   */
  private parseUserAgent(userAgent: string): DeviceData {
    let deviceType = 'desktop';
    let browser = 'unknown';
    let os = 'unknown';

    // Detectar dispositivo
    if (/mobile/i.test(userAgent)) {
      deviceType = 'mobile';
    } else if (/tablet|ipad/i.test(userAgent)) {
      deviceType = 'tablet';
    }

    // Detectar navegador
    if (/chrome/i.test(userAgent) && !/edge/i.test(userAgent)) {
      browser = 'Chrome';
    } else if (/firefox/i.test(userAgent)) {
      browser = 'Firefox';
    } else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) {
      browser = 'Safari';
    } else if (/edge/i.test(userAgent)) {
      browser = 'Edge';
    } else if (/msie|trident/i.test(userAgent)) {
      browser = 'Internet Explorer';
    }

    // Detectar OS
    if (/windows/i.test(userAgent)) {
      os = 'Windows';
    } else if (/macintosh|mac os/i.test(userAgent)) {
      os = 'macOS';
    } else if (/linux/i.test(userAgent)) {
      os = 'Linux';
    } else if (/android/i.test(userAgent)) {
      os = 'Android';
    } else if (/iphone|ipad|ipod/i.test(userAgent)) {
      os = 'iOS';
    }

    return { deviceType, browser, os };
  }

  /**
   * Obtém dados de geolocalização do IP
   * Em produção, usar serviço como MaxMind ou IP-API
   */
  private async getGeoDataFromIp(_ipAddress: string): Promise<GeoData> {
    // TODO: Integrar com serviço de geolocalização real
    // Por enquanto, retorna dados vazios
    return {
      country: undefined,
      region: undefined,
      city: undefined
    };
  }
}

// Exportar instância singleton
export const visitorTrackingService = new VisitorTrackingService();
