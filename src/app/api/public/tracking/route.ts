/**
 * @fileoverview API endpoint para registro de visitas e tracking de eventos.
 * 
 * REGRAS DE NEGÓCIO:
 * 1. Visitantes são identificados por cookie (bid_visitor_id)
 * 2. Se não existir cookie, um novo ID é gerado e retornado
 * 3. Eventos duplicados na mesma sessão não são contados novamente
 * 4. Métricas agregadas são atualizadas em tempo real
 */

import { NextRequest, NextResponse } from 'next/server';
import { visitorTrackingService } from '@/services/visitor-tracking.service';
import { z } from 'zod';

// Valores do enum VisitorEventType
const visitorEventTypes = [
  'PAGE_VIEW',
  'LOT_VIEW',
  'AUCTION_VIEW',
  'SEARCH',
  'FILTER_APPLIED',
  'BID_CLICK',
  'SHARE_CLICK',
  'FAVORITE_ADD',
  'FAVORITE_REMOVE',
  'DOCUMENT_DOWNLOAD',
  'IMAGE_VIEW',
  'VIDEO_PLAY',
  'CONTACT_CLICK',
  'HABILITATION_START'
] as const;

// Schema de validação para o body da requisição
const TrackEventSchema = z.object({
  eventType: z.enum(visitorEventTypes),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  entityPublicId: z.string().optional(),
  pageUrl: z.string().optional(),
  metadata: z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validar body
    const validationResult = TrackEventSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Obter cookie de visitante do header ou body
    const visitorCookieId = request.cookies.get('bid_visitor_id')?.value || null;
    
    // Obter User-Agent e IP
    const userAgent = request.headers.get('user-agent');
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ipAddress = forwardedFor?.split(',')[0] || request.headers.get('x-real-ip') || 'unknown';
    const referrer = request.headers.get('referer');

    // Registrar a visita
    const result = await visitorTrackingService.recordVisit(
      visitorCookieId,
      data.eventType,
      {
        userAgent,
        ipAddress,
        referrer,
        entityType: data.entityType,
        entityId: data.entityId ? BigInt(data.entityId) : undefined,
        entityPublicId: data.entityPublicId,
        pageUrl: data.pageUrl,
        metadata: data.metadata,
        utmParams: {
          utmSource: data.utmSource,
          utmMedium: data.utmMedium,
          utmCampaign: data.utmCampaign,
        }
      }
    );

    // Criar resposta com cookie se for novo visitante
    const response = NextResponse.json({
      success: true,
      visitorId: result.visitorId,
      sessionId: result.sessionId,
      isNewVisitor: result.isNewVisitor,
      isNewSession: result.isNewSession
    });

    // Se não tinha cookie ou é novo visitante, setar/atualizar cookie
    if (!visitorCookieId || result.isNewVisitor) {
      response.cookies.set('bid_visitor_id', result.visitorId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 365 * 24 * 60 * 60, // 1 ano
        path: '/'
      });
    }

    return response;
  } catch (error) {
    console.error('Error tracking visit:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');
    const publicId = searchParams.get('publicId');

    if (!entityType) {
      return NextResponse.json(
        { error: 'entityType is required' },
        { status: 400 }
      );
    }

    let metrics;

    if (publicId) {
      metrics = await visitorTrackingService.getEntityMetricsByPublicId(entityType, publicId);
    } else if (entityId) {
      metrics = await visitorTrackingService.getEntityMetrics(entityType, BigInt(entityId));
    } else {
      return NextResponse.json(
        { error: 'entityId or publicId is required' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      metrics
    });
  } catch (error) {
    console.error('Error getting metrics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
