// src/lib/actions/auth.ts
/**
 * @fileoverview Ações de autenticação centralizadas e seguras para uso no lado do servidor.
 * Este arquivo fornece funções para obter o contexto de autenticação e tenant
 * de uma maneira que é segura e compatível com os Server Components e Server Actions do Next.js.
 */
'use server';

import { getSession } from '@/server/lib/session';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';

let cachedDefaultTenantId: string | null = null;
let ensureDefaultTenantPromise: Promise<string> | null = null;

/**
 * Resolve o tenantId vindo do header (slug ou domínio) para um ID numérico.
 * Retorna null quando não for possível resolver.
 */
async function resolveTenantIdFromHeader(tenantIdFromHeader?: string | null): Promise<string | null> {
    if (!tenantIdFromHeader) return null;

    const normalized = tenantIdFromHeader.trim().toLowerCase();
    if (!normalized) return null;

    if (/^\d+$/.test(normalized)) {
        return normalized;
    }

    const tenant = await prisma.tenant.findFirst({
        where: {
            OR: [
                { subdomain: normalized },
                { domain: normalized },
            ],
        },
        select: { id: true },
    });

    if (!tenant) return null;
    return tenant.id.toString();
}

/**
 * Garante que um tenant padrão (landlord) exista no banco de dados e retorna seu ID.
 * Se nenhum tenant for encontrado, cria um novo com valores padrão.
 * Isso é crucial para a primeira execução do sistema ou para ambientes de teste.
 * @returns {Promise<string>} O ID do tenant padrão.
 */
async function ensureDefaultTenant(): Promise<string> {
    if (cachedDefaultTenantId) {
        return cachedDefaultTenantId;
    }

    if (!ensureDefaultTenantPromise) {
        ensureDefaultTenantPromise = (async () => {
            const defaultTenantName = "Bid Expert"; // Nome do tenant padrão

            let tenant = await prisma.tenant.findFirst({
                orderBy: {
                    createdAt: 'asc',
                },
            });

            if (!tenant) {
                console.log(`Nenhum tenant encontrado. Criando tenant padrão: "${defaultTenantName}"`);
                try {
                    tenant = await prisma.tenant.create({
                        data: {
                            name: defaultTenantName,
                            subdomain: 'www',
                            updatedAt: new Date(),
                        },
                    });
                    console.log(`Tenant padrão criado com sucesso. ID: ${tenant.id}`);
                } catch (error) {
                    console.error("Erro ao criar o tenant padrão:", error);
                    tenant = await prisma.tenant.findFirst({
                        orderBy: { createdAt: 'asc' },
                    });

                    if (!tenant) {
                        throw new Error("Não foi possível criar ou encontrar um tenant padrão após a falha inicial.");
                    }
                }
            }

            cachedDefaultTenantId = tenant.id.toString();
            return tenant.id.toString();
        })()
        .catch((error) => {
            // Se falhar devido a problemas de BD (ex.: credenciais, conta bloqueada),
            // em ambiente de desenvolvimento não queremos travar todo o servidor.
            ensureDefaultTenantPromise = null;

            console.error('Erro durante ensureDefaultTenant:', error);
            if (process.env.NODE_ENV !== 'production') {
                console.warn('Ambiente de desenvolvimento: retornando fallback tenantId=1 para continuar.');
                return '1';
            }

            throw error;
        })
        .finally(() => {
            ensureDefaultTenantPromise = null;
        });
    }

    return ensureDefaultTenantPromise;
}


/**
 * Obtém o ID do tenant para a requisição atual de forma segura.
 * A ordem de precedência é:
 * 1. Sessão do usuário logado.
 * 2. Header 'x-tenant-id' (para contextos de middleware).
 * 3. Fallback para o tenant padrão (landlord) após garantir sua existência.
 * @param {boolean} isPublicCall - Se verdadeiro, a função pode recorrer ao tenant padrão.
 * @returns {Promise<string>} O ID do tenant.
 * @throws {Error} Se o tenant não for identificado em um contexto não-público.
 */
export async function getTenantIdFromRequest(isPublicCall = false): Promise<string> {
    if (isPublicCall) {
        try {
            return await ensureDefaultTenant();
        } catch (error) {
            console.error("Falha crítica ao garantir a existência do tenant padrão em chamada pública:", error);
            if (process.env.NODE_ENV !== 'production') {
                console.warn('Ambiente de desenvolvimento: fallback tenantId=1 será usado para chamadas públicas.');
                return '1';
            }
            throw new Error("Falha ao inicializar o tenant principal do sistema.");
        }
    }

    const session = await getSession();
    const headersList = headers();
    const tenantIdFromHeader = headersList.get('x-tenant-id');

    const resolvedHeaderTenantId = await resolveTenantIdFromHeader(tenantIdFromHeader);

    if (session?.tenantId) {
        // Admin do landlord pode navegar em qualquer tenant: usa o tenant da URL quando houver.
        if (session.tenantId === '1' && resolvedHeaderTenantId && resolvedHeaderTenantId !== '1') {
            return resolvedHeaderTenantId;
        }
        // Retorna o ID do tenant da sessão do usuário autenticado
        return session.tenantId;
    }

    if (resolvedHeaderTenantId) {
        // Retorna o ID do tenant resolvido a partir do header
        return resolvedHeaderTenantId;
    }

    // Fallback de segurança para chamadas internas não-públicas.
    // Isso indica um possível problema de lógica, pois o tenant deveria ser resolvido antes.
    console.warn("[getTenantIdFromRequest] Aviso: Tenant ID não encontrado para chamada interna. Recorrendo ao tenant padrão.");
    try {
        return await ensureDefaultTenant();
    } catch (error) {
        console.error("Falha crítica ao garantir a existência do tenant padrão como fallback:", error);
        throw new Error("Falha ao inicializar o tenant principal do sistema.");
    }
}
