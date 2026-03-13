/**
 * @fileoverview Wrapper de Server Actions tipadas para o Admin Plus.
 * Fornece createAdminAction que encapsula autenticação, permissões,
 * validação Zod e tratamento de erros em um resultado padronizado ActionResult.
 */

import { z } from 'zod';
import type { ActionResult } from './types';
import { getSession } from '@/server/lib/session';
import { getTenantIdFromRequest } from '@/lib/actions/auth';
import { hasPermission } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';

export interface ActionContext {
  userId: string;
  tenantId: string;
  tenantIdBigInt: bigint;
  permissions: string[];
}

interface CreateAdminActionOptions<TInput extends z.ZodTypeAny, TOutput> {
  /** Schema Zod de validação de input. Omitir para ações sem input. */
  inputSchema?: TInput;
  /** Permissão necessária para executar esta ação. */
  requiredPermission?: string;
  /** Handler que recebe input validado + contexto autenticado. */
  handler: (params: {
    input: z.infer<TInput>;
    ctx: ActionContext;
  }) => Promise<TOutput>;
}

/**
 * Factory de Server Actions autenticadas + validadas para Admin Plus.
 *
 * Fluxo:
 * 1. Verifica sessão autenticada (userId + tenantId)
 * 2. Verifica permissão (se requiredPermission definida)
 * 3. Valida input com schema Zod (se inputSchema definida)
 * 4. Executa handler
 * 5. Retorna ActionResult<TOutput> padronizado
 */
export function createAdminAction<TInput extends z.ZodTypeAny = z.ZodVoid, TOutput = unknown>(
  options: CreateAdminActionOptions<TInput, TOutput>,
) {
  return async (rawInput: z.infer<TInput>): Promise<ActionResult<TOutput>> => {
    try {
      // 1. Autenticação
      const session = await getSession();
      if (!session?.userId) {
        return { success: false, error: 'Não autenticado. Faça login novamente.' };
      }

      const tenantId = await getTenantIdFromRequest();
      if (!tenantId) {
        return { success: false, error: 'Tenant não identificado.' };
      }

      // Buscar permissões do usuário via UsersOnRoles (many-to-many)
      const user = await prisma.user.findUnique({
        where: { id: BigInt(session.userId) },
        include: {
          UsersOnRoles: {
            include: { Role: true },
          },
        },
      });

      const permissions: string[] = [];
      if (user?.UsersOnRoles) {
        for (const ur of user.UsersOnRoles) {
          if (ur.Role?.permissions) {
            const parsed = typeof ur.Role.permissions === 'string'
              ? JSON.parse(ur.Role.permissions)
              : ur.Role.permissions;
            if (Array.isArray(parsed)) {
              permissions.push(...parsed.map(String));
            }
          }
        }
      }

      // 2. Verificação de permissão
      if (options.requiredPermission) {
        const userForPermission = { permissions } as Parameters<typeof hasPermission>[0];
        if (!hasPermission(userForPermission, options.requiredPermission)) {
          return { success: false, error: 'Sem permissão para executar esta ação.' };
        }
      }

      const ctx: ActionContext = {
        userId: session.userId,
        tenantId,
        tenantIdBigInt: BigInt(tenantId),
        permissions,
      };

      // 3. Validação de input
      let validatedInput = rawInput;
      if (options.inputSchema) {
        const parseResult = options.inputSchema.safeParse(rawInput);
        if (!parseResult.success) {
          const fieldErrors: Record<string, string[]> = {};
          for (const issue of parseResult.error.issues) {
            const path = issue.path.join('.');
            if (!fieldErrors[path]) fieldErrors[path] = [];
            fieldErrors[path].push(issue.message);
          }
          return { success: false, error: 'Dados inválidos.', fieldErrors };
        }
        validatedInput = parseResult.data;
      }

      // 4. Executar handler
      const data = await options.handler({ input: validatedInput, ctx });

      return { success: true, data };
    } catch (error) {
      console.error('[AdminAction] Erro inesperado:', error);
      const message = error instanceof Error ? error.message : 'Erro interno do servidor.';
      return { success: false, error: message };
    }
  };
}
