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
        roles: {
          some: {
            role: {
              nameNormalized: { in: ['LAWYER', 'ADVOGADO'] },
            },
          },
        },
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
      take: 100,
    });

    // Para cada advogado, conta processos ativos
    const lawyersWithCounts = await Promise.all(
      lawyers.map(async (lawyer) => {
        let activeCasesCount = 0;
        
        if (lawyer.cpf) {
          const processesCount = await prisma.judicialProcess.count({
            where: {
              parties: {
                some: {
                  documentNumber: lawyer.cpf,
                  partyType: { in: ['ADVOGADO_AUTOR', 'ADVOGADO_REU'] },
                },
              },
            },
          });
          activeCasesCount = processesCount;
        }

        return {
          id: lawyer.id.toString(),
          fullName: lawyer.fullName ?? 'Sem nome',
          email: lawyer.email,
          cpf: lawyer.cpf,
          activeCasesCount,
        };
      })
    );

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
