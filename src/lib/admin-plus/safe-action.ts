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

/**
 * Invoca o handler de uma ação options-style baseando-se SOMENTE em
 * Function.length (quantidade de parâmetros declarados), que é preservado
 * após minificação — ao contrário de handler.toString() + regex que quebra
 * em produção quando o Next.js renomeia parâmetros.
 *
 * Convenções suportadas:
 *  - length 0  → handler()
 *  - length 1  → handler({ ...inputSpread, input, ctx })  (envelope universal)
 *  - length 2+ → handler(input, ctx)                       (positional)
 */
async function invokeOptionsHandler<TOutput>(
  handler: (...args: any[]) => Promise<TOutput>,
  input: unknown,
  ctx: ActionContext,
) {
  const normalizedInput = input ?? {};

  // 0-arg: handler não precisa de input nem ctx
  if (handler.length === 0) {
    return handler();
  }

  // 2+ args: positional — handler(input, ctx)
  if (handler.length >= 2) {
    return handler(normalizedInput, ctx);
  }

  // 1-arg: envelope universal que satisfaz todos os padrões de 1 argumento:
  //   ({ input, ctx }) → destructura ambos
  //   ({ input })      → destructura apenas input
  //   ({ ctx })        → destructura apenas ctx
  //   ({ page, ... })  → destructura campos do input (spread no top-level)
  //   ({ id })         → destructura campo específico do input
  //   (arg)            → recebe objeto completo com campos do input no top-level
  const inputSpread = normalizedInput && typeof normalizedInput === 'object'
    ? normalizedInput as Record<string, unknown>
    : {};

  return handler({ ...inputSpread, input: normalizedInput, ctx });
}

function summarizeHandler(handler: (...args: any[]) => Promise<unknown>) {
  const source = handler.toString().replace(/\s+/g, ' ').trim();
  return source.slice(0, 160);
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
    let legacyHandler: LegacyAdminActionHandler<unknown, TOutput> | null = null;
    let options: CreateAdminActionOptions<TInput, TOutput> | null = null;

    try {
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
      const normalizedInputArg = inputArg ?? {};
      // Legacy handlers: SEMPRE (ctx, input, ...rest) — convenção padronizada.
      // Options handlers: dispatch via invokeOptionsHandler baseado em Function.length.
      const data = legacyHandler
        ? await legacyHandler(ctx, normalizedInputArg, ...restArgs)
        : await invokeOptionsHandler(options!.handler, validatedInput, ctx);

      return { success: true, data };
    } catch (error) {
      console.error('[AdminAction] Erro inesperado:', {
        error,
        mode: typeof optionsOrHandler === 'function' ? 'legacy-handler' : 'options-handler',
        hasSchema: Boolean((options as CreateAdminActionOptions<TInput, TOutput> | null)?.inputSchema ?? (options as CreateAdminActionOptions<TInput, TOutput> | null)?.schema),
        requiredPermission: (options as CreateAdminActionOptions<TInput, TOutput> | null)?.requiredPermission ?? null,
        permissions: (options as CreateAdminActionOptions<TInput, TOutput> | null)?.permissions ?? null,
        rawArgs,
        handlerPreview: legacyHandler
          ? summarizeHandler(legacyHandler as (...args: any[]) => Promise<unknown>)
          : options?.handler
            ? summarizeHandler(options.handler as (...args: any[]) => Promise<unknown>)
            : null,
      });
      const message = error instanceof Error ? error.message : 'Erro interno do servidor.';
      return { success: false, error: message };
    }
  };
}
