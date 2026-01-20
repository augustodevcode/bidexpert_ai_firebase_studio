// src/app/api/v1/admin/tenant/check-subdomain/route.ts
/**
 * @fileoverview API para verificar disponibilidade de subdomínio.
 * 
 * O CRM pode usar este endpoint antes de provisionar um tenant para
 * verificar se o subdomínio desejado está disponível e obter sugestões.
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateAdminApiKey } from '@/lib/auth/admin-api-guard';
import { slugify } from '@/lib/ui-helpers';

// Lista de subdomínios reservados que não podem ser usados
const RESERVED_SUBDOMAINS = [
  'www', 'api', 'app', 'admin', 'mail', 'email', 'ftp', 'ssh',
  'blog', 'shop', 'store', 'help', 'support', 'docs', 'cdn',
  'static', 'assets', 'media', 'images', 'img', 'files',
  'crm', 'erp', 'dashboard', 'portal', 'login', 'auth',
  'test', 'dev', 'staging', 'demo', 'sandbox', 'beta',
  'billing', 'payment', 'checkout', 'cart', 'order',
  'landlord', 'master', 'root', 'system', 'internal',
];

/**
 * GET /api/v1/admin/tenant/check-subdomain?subdomain=xxx
 * 
 * Verifica se um subdomínio está disponível para uso.
 */
export async function GET(request: NextRequest) {
  // 1. Validar API Key
  const authResult = validateAdminApiKey(request);
  if (!authResult.isValid) {
    return authResult.error!;
  }

  try {
    // 2. Obter parâmetro subdomain
    const searchParams = request.nextUrl.searchParams;
    const rawSubdomain = searchParams.get('subdomain');

    if (!rawSubdomain) {
      return NextResponse.json({
        success: false,
        error: 'MISSING_SUBDOMAIN',
        message: 'Parâmetro "subdomain" é obrigatório.',
      }, { status: 400 });
    }

    // 3. Normalizar o subdomínio
    const subdomain = slugify(rawSubdomain).substring(0, 50);

    if (subdomain.length < 3) {
      return NextResponse.json({
        success: false,
        error: 'SUBDOMAIN_TOO_SHORT',
        message: 'Subdomínio deve ter no mínimo 3 caracteres.',
        subdomain: rawSubdomain,
        normalized: subdomain,
      }, { status: 400 });
    }

    // 4. Verificar se é reservado
    if (RESERVED_SUBDOMAINS.includes(subdomain)) {
      const suggestions = generateSuggestions(subdomain);
      return NextResponse.json({
        available: false,
        subdomain,
        reason: 'RESERVED',
        message: `O subdomínio '${subdomain}' é reservado pelo sistema.`,
        suggestions,
        suggestedUrl: null,
      });
    }

    // 5. Verificar se já existe no banco
    const existingTenant = await prisma.tenant.findUnique({
      where: { subdomain },
      select: { id: true },
    });

    const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'bidexpert.com.br';

    if (existingTenant) {
      const suggestions = generateSuggestions(subdomain);
      return NextResponse.json({
        available: false,
        subdomain,
        reason: 'IN_USE',
        message: `O subdomínio '${subdomain}' já está em uso.`,
        suggestions,
        suggestedUrl: null,
      });
    }

    // 6. Subdomínio disponível!
    return NextResponse.json({
      available: true,
      subdomain,
      suggestedUrl: `https://${subdomain}.${appDomain}`,
      loginUrl: `https://${subdomain}.${appDomain}/auth/login`,
    });

  } catch (error: any) {
    console.error('[Check Subdomain API] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: `Erro ao verificar subdomínio: ${error.message}`,
    }, { status: 500 });
  }
}

/**
 * Gera sugestões alternativas para um subdomínio indisponível.
 */
function generateSuggestions(base: string): string[] {
  const suggestions: string[] = [];
  const suffixes = ['leiloes', 'online', 'br', '2', '3'];
  
  for (const suffix of suffixes) {
    const suggestion = `${base}-${suffix}`.substring(0, 50);
    suggestions.push(suggestion);
  }

  // Adiciona versão com ano
  const year = new Date().getFullYear();
  suggestions.push(`${base}-${year}`.substring(0, 50));

  return suggestions.slice(0, 5);
}
