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
            ensureDefaultTenantPromise = null;
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
            throw new Error("Falha ao inicializar o tenant principal do sistema.");
        }
    }

    const session = await getSession();
    if (session?.tenantId) {
        // Retorna o ID do tenant da sessão do usuário autenticado
        return session.tenantId;
    }

    const headersList = headers();
    const tenantIdFromHeader = headersList.get('x-tenant-id');

    if (tenantIdFromHeader) {
        // Retorna o ID do tenant de um header, geralmente injetado por um middleware
        return tenantIdFromHeader;
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
