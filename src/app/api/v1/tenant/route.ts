import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PlatformSettingsService } from '@/services/platform-settings.service';

const setupTenantSchema = z.object({
  tenantId: z.string().min(1, "ID do tenant é obrigatório."),
  settings: z.object({
    siteTitle: z.string().optional(),
    siteTagline: z.string().optional(),
    logoUrl: z.string().optional(),
    primaryColor: z.string().optional(),
    themes: z.any().optional(),
    mapSettings: z.any().optional(),
    biddingSettings: z.any().optional(),
    paymentGatewaySettings: z.any().optional(),
    notificationSettings: z.any().optional(),
    mentalTriggerSettings: z.any().optional(),
    sectionBadgeVisibility: z.any().optional(),
    realtimeSettings: z.any().optional(),
  }).refine((data) => Object.keys(data).length > 0, {
    message: "Pelo menos uma configuração deve ser fornecida."
  })
});

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get('Authorization')?.split(' ')[1];
  const expectedApiKey = process.env.TENANT_API_KEY;

  if (!expectedApiKey || apiKey !== expectedApiKey) {
    return NextResponse.json({ success: false, message: 'Não autorizado.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    
    // Check if this is a Setup request (has tenantId and settings)
    const validation = setupTenantSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ 
        success: false, 
        message: 'Dados inválidos.', 
        errors: validation.error.flatten() 
      }, { status: 400 });
    }

    const { tenantId, settings } = validation.data;
    
    const platformSettingsService = new PlatformSettingsService();
    const result = await platformSettingsService.updateSettings(tenantId, settings);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 200 });

  } catch (error: any) {
    console.error('[API /tenant] Error:', error);
    return NextResponse.json({ 
      success: false, 
      message: `Erro interno do servidor: ${error.message}` 
    }, { status: 500 });
  }
}
