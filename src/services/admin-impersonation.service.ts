// src/services/admin-impersonation.service.ts
/**
 * @fileoverview Serviço para permitir que administradores visualizem
 * painéis de outros usuários (advogados, comitentes, etc.) como se
 * estivessem logados como esses usuários.
 */

import { prisma } from '@/lib/prisma';

export interface ImpersonationSession {
  adminUserId: string;
  targetUserId: string;
  targetUserRole: string;
  createdAt: Date;
  expiresAt: Date;
}

export class AdminImpersonationService {
  /**
   * Verifica se um usuário tem permissão de administrador
   */
  async isAdmin(userId: string): Promise<boolean> {
    const userPrimaryKey = this.parseUserId(userId);
    
    const userWithRoles = await prisma.user.findUnique({
      where: { id: userPrimaryKey },
      include: {
        UsersOnRoles: {
          include: {
            Role: true,
          },
        },
      },
    });

    if (!userWithRoles) {
      return false;
    }

    // Verifica se o usuário tem alguma role de administrador
    const roles = userWithRoles.UsersOnRoles || [];
    return roles.some(
      (userRole) =>
        userRole.Role.nameNormalized === 'ADMIN' ||
        userRole.Role.nameNormalized === 'SUPERADMIN' ||
        userRole.Role.nameNormalized === 'ADMINISTRATOR'
    );
  }

  /**
   * Lista usuários disponíveis para impersonação (advogados)
   */
  async getImpersonatableLawyers(adminUserId: string): Promise<Array<{
    id: string;
    fullName: string;
    email: string;
    cpf: string | null;
    activeCasesCount: number;
  }>> {
    const isAdminUser = await this.isAdmin(adminUserId);
    if (!isAdminUser) {
      throw new Error('Usuário não tem permissão de administrador');
    }

    // Busca usuários com role de advogado
    const lawyers = await prisma.user.findMany({
      where: {
        UsersOnRoles: {
          some: {
            Role: {
              nameNormalized: { in: ['LAWYER', 'ADVOGADO'] },
            },
          },
        },
      },
      include: {
        UsersOnRoles: {
          include: {
            Role: true,
          },
        },
      },
      take: 100,
    });

    // Lista de CPFs para busca em lote, otimizando o N+1 anterior
    const cpfs = lawyers
      .map((l) => l.cpf)
      .filter((cpf): cpf is string => !!cpf);

    const processCountsMap = new Map<string, number>();

    if (cpfs.length > 0) {
      // Busca todas as associações únicas de CPF -> Processo em uma única query
      const partyAssociations = await prisma.judicialParty.findMany({
        where: {
          documentNumber: { in: cpfs },
          partyType: { in: ['ADVOGADO_AUTOR', 'ADVOGADO_REU'] },
        },
        select: {
          documentNumber: true,
          processId: true,
        },
        distinct: ['documentNumber', 'processId'],
      });

      // Agrupa as contagens em memória
      for (const assoc of partyAssociations) {
        if (assoc.documentNumber) {
          processCountsMap.set(
            assoc.documentNumber,
            (processCountsMap.get(assoc.documentNumber) || 0) + 1
          );
        }
      }
    }

    // Mapeia os advogados com os contadores pré-calculados
    const lawyersWithCounts = lawyers.map((lawyer) => {
      const activeCasesCount = lawyer.cpf ? (processCountsMap.get(lawyer.cpf) || 0) : 0;

      return {
        id: lawyer.id.toString(),
        fullName: lawyer.fullName ?? 'Sem nome',
        email: lawyer.email,
        cpf: lawyer.cpf,
        activeCasesCount,
      };
    });

    return lawyersWithCounts.sort((a, b) => b.activeCasesCount - a.activeCasesCount);
  }

  /**
   * Valida se um admin pode impersonar um usuário específico
   */
  async canImpersonate(adminUserId: string, targetUserId: string): Promise<boolean> {
    const isAdminUser = await this.isAdmin(adminUserId);
    if (!isAdminUser) {
      return false;
    }

    const targetUserPrimaryKey = this.parseUserId(targetUserId);
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserPrimaryKey },
    });

    return !!targetUser;
  }

  private parseUserId(rawId: string): bigint | number {
    if (typeof rawId === 'number' || typeof rawId === 'bigint') {
      return rawId;
    }

    const numericId = rawId.trim();

    if (!numericId) {
      throw new Error('Identificador de usuário não pode ser vazio.');
    }

    if (/^\d+$/.test(numericId)) {
      try {
        return BigInt(numericId);
      } catch {
        const asNumber = Number(numericId);
        if (!Number.isNaN(asNumber)) {
          return asNumber;
        }
      }
    }

    throw new Error(`Identificador de usuário inválido: ${rawId}`);
  }
}

export const adminImpersonationService = new AdminImpersonationService();
