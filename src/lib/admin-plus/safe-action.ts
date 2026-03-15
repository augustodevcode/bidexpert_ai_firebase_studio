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

interface CreateAdminActionOptions<TInput extends z.ZodTypeAny | undefined, TOutput> {
  /** Schema Zod de validação de input. Omitir para ações sem input. */
  inputSchema?: TInput;
  /** Alias legado para inputSchema. */
  schema?: TInput;
  /** Permissão necessária para executar esta ação. */
  requiredPermission?: string;
  /** Alias legado para múltiplas permissões aceitas. */
  permissions?: string[];
  /** Handler que recebe input validado + contexto autenticado. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: (...args: any[]) => Promise<TOutput>;
}

type LegacyAdminActionHandler<TInput = unknown, TOutput = unknown> = (
  ctx: ActionContext,
  input: TInput,
  ...args: unknown[]
) => Promise<TOutput>;

function getFunctionParams(source: string): string {
  const trimmed = source.trim();
  const arrowWithParens = trimmed.match(/^(?:async\s*)?\(([^)]*)\)\s*=>/s);
  if (arrowWithParens) return arrowWithParens[1].trim();
  const arrowSingle = trimmed.match(/^(?:async\s*)?([^=()\s]+)\s*=>/s);
  if (arrowSingle) return arrowSingle[1].trim();
  const fnMatch = trimmed.match(/^(?:async\s*)?function[^(]*\(([^)]*)\)/s);
  if (fnMatch) return fnMatch[1].trim();
  return '';
}

function shouldUseEnvelope(handler: (...args: any[]) => Promise<unknown>) {
  const params = getFunctionParams(handler.toString());
  return params.startsWith('{');
}

function isCtxFirst(handler: (...args: any[]) => Promise<unknown>) {
  const params = getFunctionParams(handler.toString());
  return params.startsWith('ctx') || params.startsWith('_ctx');
}

async function invokeOptionsHandler<TOutput>(
  handler: (...args: any[]) => Promise<TOutput>,
  input: unknown,
  ctx: ActionContext,
) {
  if (handler.length === 0) {
    return handler();
  }

  if (shouldUseEnvelope(handler)) {
    return handler({ input, ctx });
  }

  if (handler.length >= 2) {
    return isCtxFirst(handler) ? handler(ctx, input) : handler(input, ctx);
  }

  return isCtxFirst(handler) ? handler(ctx) : handler(input);
}

export function createAdminAction<TInput = unknown, TOutput = unknown>(
  handler: LegacyAdminActionHandler<TInput, TOutput>,
): (...args: unknown[]) => Promise<ActionResult<TOutput>>;

export function createAdminAction<TInput extends z.ZodTypeAny | undefined = z.ZodVoid, TOutput = unknown>(
  options: CreateAdminActionOptions<TInput, TOutput>,
): (...args: unknown[]) => Promise<ActionResult<TOutput>>;

export function createAdminAction<TInput extends z.ZodTypeAny, TOutput = unknown>(
  schema: TInput,
  handler: (input: z.infer<TInput>, ctx?: ActionContext) => Promise<TOutput>,
): (...args: unknown[]) => Promise<ActionResult<TOutput>>;

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
export function createAdminAction<TInput extends z.ZodTypeAny | undefined = z.ZodVoid, TOutput = unknown>(
  optionsOrHandler: CreateAdminActionOptions<TInput, TOutput> | LegacyAdminActionHandler<unknown, TOutput> | TInput,
  twoArgHandler?: (input: unknown, ctx?: ActionContext) => Promise<TOutput>,
) {
  return async (...rawArgs: unknown[]): Promise<ActionResult<TOutput>> => {
    try {
      let legacyHandler: LegacyAdminActionHandler<unknown, TOutput> | null = null;
      let options: CreateAdminActionOptions<TInput, TOutput> | null = null;

      if (twoArgHandler && optionsOrHandler instanceof z.ZodType) {
        options = {
          inputSchema: optionsOrHandler as TInput,
          handler: ((input: unknown, ctx?: ActionContext) => twoArgHandler(input, ctx)) as (...args: any[]) => Promise<TOutput>,
        };
      } else if (typeof optionsOrHandler === 'function') {
        legacyHandler = optionsOrHandler;
      } else {
        options = optionsOrHandler as CreateAdminActionOptions<TInput, TOutput>;
      }

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
      const requiredPermissions = options?.permissions?.length
        ? options.permissions
        : options?.requiredPermission
          ? [options.requiredPermission]
          : [];

      if (requiredPermissions.length > 0) {
        const userForPermission = { permissions } as Parameters<typeof hasPermission>[0];
        const allowed = requiredPermissions.some((permission) => hasPermission(userForPermission, permission));
        if (!allowed) {
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
      let validatedInput = rawArgs[0];
      const schema = options?.inputSchema ?? options?.schema;
      if (schema) {
        const parseResult = schema.safeParse(rawArgs[0]);
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
      const [inputArg, ...restArgs] = rawArgs;
      const data = legacyHandler
        ? await legacyHandler(ctx, inputArg, ...restArgs)
        : await invokeOptionsHandler(options!.handler, validatedInput, ctx);

      return { success: true, data };
    } catch (error) {
      console.error('[AdminAction] Erro inesperado:', error);
      const message = error instanceof Error ? error.message : 'Erro interno do servidor.';
      return { success: false, error: message };
    }
  };
}
