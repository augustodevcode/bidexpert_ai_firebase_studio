// src/app/admin/auctions/actions-with-audit.ts
// Exemplo de Server Action com auditoria integrada
// COPIAR e adaptar para outros módulos

'use server';

import { revalidatePath } from 'next/cache';
import { PrismaClient } from '@prisma/client';
import { AuditLogRepository } from '@/repositories/audit-log.repository';
import { EnhancedAuditService } from '@/services/enhanced-audit.service';
import { auth } from '@/auth';

const prisma = new PrismaClient();

export async function updateAuctionWithAudit(
  auctionId: string,
  formData: FormData
) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new Error('Não autenticado');
    }

    const id = BigInt(auctionId);
    
    // 1. Buscar estado ANTES da mudança
    const before = await prisma.auction.findUnique({
      where: { id },
    });

    if (!before) {
      throw new Error('Leilão não encontrado');
    }

    // 2. Preparar dados novos
    const data = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      // ... outros campos
    };

    // 3. Atualizar no banco
    const after = await prisma.auction.update({
      where: { id },
      data,
    });

    // 4. REGISTRAR LOG DE AUDITORIA (automático!)
    const auditRepo = new AuditLogRepository(prisma);
    const auditService = new EnhancedAuditService(auditRepo);

    await auditService.logAction({
      userId: BigInt(session.user.id),
      tenantId: before.tenantId,
      entityType: 'Auction',
      entityId: id,
      action: 'UPDATE',
      before: {
        title: before.title,
        description: before.description,
      },
      after: {
        title: after.title,
        description: after.description,
      },
      metadata: {
        userEmail: session.user.email,
        userName: session.user.name,
      },
    });

    revalidatePath(`/admin/auctions/${auctionId}`);

    return { 
      success: true, 
      message: 'Leilão atualizado e registrado no histórico' 
    };

  } catch (error: any) {
    console.error('Error updating auction:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

export async function createAuctionWithAudit(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new Error('Não autenticado');
    }

    const data = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      tenantId: BigInt(session.user.tenantId || 1),
      // ... outros campos
    };

    // Criar leilão
    const auction = await prisma.auction.create({ data });

    // Registrar log
    const auditRepo = new AuditLogRepository(prisma);
    const auditService = new EnhancedAuditService(auditRepo);

    await auditService.logAction({
      userId: BigInt(session.user.id),
      tenantId: auction.tenantId,
      entityType: 'Auction',
      entityId: auction.id,
      action: 'CREATE',
      after: {
        title: auction.title,
        description: auction.description,
      },
      metadata: {
        userEmail: session.user.email,
      },
    });

    revalidatePath('/admin/auctions');

    return { 
      success: true, 
      id: auction.id.toString(),
      message: 'Leilão criado e registrado no histórico' 
    };

  } catch (error: any) {
    console.error('Error creating auction:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}
