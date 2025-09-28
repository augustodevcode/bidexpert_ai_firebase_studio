// src/app/api/v1/tenant/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { TenantService } from '@/services/tenant.service';
import { createTenantSchema } from './schema';

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get('Authorization')?.split(' ')[1];
  const expectedApiKey = process.env.TENANT_API_KEY;

  if (!expectedApiKey || apiKey !== expectedApiKey) {
    return NextResponse.json({ success: false, message: 'Não autorizado.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validation = createTenantSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ success: false, message: 'Dados inválidos.', errors: validation.error.flatten() }, { status: 400 });
    }
    
    const tenantService = new TenantService();
    const result = await tenantService.createTenant(validation.data);

    if (!result.success) {
      return NextResponse.json(result, { status: 409 }); // Conflict or other business rule error
    }

    return NextResponse.json(result, { status: 201 });

  } catch (error: any) {
    console.error('[API /tenant/create] Error:', error);
    return NextResponse.json({ success: false, message: `Erro interno do servidor: ${error.message}` }, { status: 500 });
  }
}
