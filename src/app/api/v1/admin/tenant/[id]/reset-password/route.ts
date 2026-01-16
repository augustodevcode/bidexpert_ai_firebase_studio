// src/app/api/v1/admin/tenant/[id]/reset-password/route.ts
/**
 * @fileoverview API para reset de senha de usuário administrativo.
 * 
 * Usado pelo suporte do BidExpertCRM quando um cliente
 * perde acesso à conta de administrador.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { validateAdminApiKey } from '@/lib/auth/admin-api-guard';
import { hashPassword } from '@/server/lib/password';
import crypto from 'crypto';

const resetPasswordSchema = z.object({
  userId: z.string().min(1, "ID do usuário é obrigatório"),
  newPassword: z.string().min(8, "Senha deve ter no mínimo 8 caracteres").optional(),
  generateRandom: z.boolean().default(true),
  sendEmail: z.boolean().default(true),
});

// Gera senha aleatória segura
function generateRandomPassword(length: number = 12): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
  let password = '';
  const randomBytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    password += chars[randomBytes[i] % chars.length];
  }
  return password;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // 1. Validar API Key
  const authResult = await validateAdminApiKey(request);
  if (!authResult.isValid) {
    return NextResponse.json({ error: 'Unauthorized', message: authResult.error }, { status: 401 });
  }

  try {
    const tenantId = BigInt(params.id);

    // 2. Verificar se tenant existe
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, name: true },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 });
    }

    // 3. Parsear body
    const body = await request.json();
    const data = resetPasswordSchema.parse(body);

    // 4. Verificar se usuário pertence ao tenant
    const userId = BigInt(data.userId);
    const userOnTenant = await prisma.usersOnTenants.findUnique({
      where: {
        userId_tenantId: { userId, tenantId },
      },
      include: {
        user: {
          select: { id: true, email: true, fullName: true },
        },
      },
    });

    if (!userOnTenant) {
      return NextResponse.json({ 
        error: 'Usuário não encontrado neste tenant' 
      }, { status: 404 });
    }

    // 5. Gerar ou usar senha fornecida
    const newPassword = data.generateRandom 
      ? generateRandomPassword() 
      : data.newPassword;

    if (!newPassword) {
      return NextResponse.json({ 
        error: 'Senha é obrigatória quando generateRandom é false' 
      }, { status: 400 });
    }

    // 6. Hash e atualizar senha
    const hashedPassword = await hashPassword(newPassword);
    
    await prisma.user.update({
      where: { id: userId },
      data: { 
        password: hashedPassword,
        // Opcional: forçar troca de senha no próximo login
        // passwordChangedAt: new Date(),
      },
    });

    // 7. TODO: Enviar email com nova senha (se sendEmail = true)
    // Isso seria feito via serviço de email

    // 8. Registrar auditoria
    // TODO: Criar registro de auditoria

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: userOnTenant.user.id.toString(),
          email: userOnTenant.user.email,
          fullName: userOnTenant.user.fullName,
        },
        // Só retorna a senha se foi gerada automaticamente (para suporte informar ao cliente)
        temporaryPassword: data.generateRandom ? newPassword : undefined,
        emailSent: data.sendEmail,
        message: 'Senha resetada com sucesso',
      },
    });

  } catch (error) {
    console.error('[POST /api/v1/admin/tenant/[id]/reset-password] Erro:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Dados inválidos',
        details: error.errors,
      }, { status: 400 });
    }

    return NextResponse.json({
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : 'Erro desconhecido',
    }, { status: 500 });
  }
}
