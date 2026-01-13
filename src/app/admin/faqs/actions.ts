
'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth';

const faqSchema = z.object({
    question: z.string().min(3, "A pergunta deve ter pelo menos 3 caracteres"),
    answer: z.string().min(3, "A resposta deve ter pelo menos 3 caracteres"),
    order: z.number().int().default(0),
    isActive: z.boolean().default(true),
});

export async function getFAQs() {
    const user = await getCurrentUser();
    if (!user) throw new Error("Não autorizado");

    // In a real multi-tenant app, we fetch FAQs for the current tenant.
    // We'll take the first tenant for now or all if admin.
    // For BidExpert, we'll try to get the tenant from the user.
    const tenantId = user.tenants[0]?.tenantId;
    if (!tenantId) throw new Error("Usuário não associado a um tenant");

    return await prisma.fAQ.findMany({
        where: { tenantId },
        orderBy: { order: 'asc' },
    });
}

export async function createFAQ(data: z.infer<typeof faqSchema>) {
    const user = await getCurrentUser();
    if (!user) throw new Error("Não autorizado");

    // Verify roles
    const allowedRoles = ['ADMIN', 'AUCTION_ANALYST', 'AUCTIONEER'];
    const userRoles = user.roles.map(r => r.role.name);
    const isAllowed = userRoles.some(role => allowedRoles.includes(role));

    if (!isAllowed) throw new Error("Sem permissão para criar FAQs");

    const tenantId = user.tenants[0]?.tenantId;
    if (!tenantId) throw new Error("Usuário não associado a um tenant");

    const validatedData = faqSchema.parse(data);

    const faq = await prisma.fAQ.create({
        data: {
            ...validatedData,
            tenantId,
        },
    });

    revalidatePath('/admin/faqs');
    revalidatePath('/faq');
    return { success: true, faq };
}

export async function updateFAQ(id: string | bigint, data: z.infer<typeof faqSchema>) {
    const user = await getCurrentUser();
    if (!user) throw new Error("Não autorizado");

    // Verify roles
    const allowedRoles = ['ADMIN', 'AUCTION_ANALYST', 'AUCTIONEER'];
    const userRoles = user.roles.map(r => r.role.name);
    const isAllowed = userRoles.some(role => allowedRoles.includes(role));

    if (!isAllowed) throw new Error("Sem permissão para atualizar FAQs");

    const validatedData = faqSchema.parse(data);

    const faq = await prisma.fAQ.update({
        where: { id: BigInt(id) },
        data: validatedData,
    });

    revalidatePath('/admin/faqs');
    revalidatePath('/faq');
    return { success: true, faq };
}

export async function deleteFAQ(id: string | bigint) {
    const user = await getCurrentUser();
    if (!user) throw new Error("Não autorizado");

    const allowedRoles = ['ADMIN', 'AUCTION_ANALYST', 'AUCTIONEER'];
    const userRoles = user.roles.map(r => r.role.name);
    const isAllowed = userRoles.some(role => allowedRoles.includes(role));

    if (!isAllowed) throw new Error("Sem permissão para excluir FAQs");

    await prisma.fAQ.delete({
        where: { id: BigInt(id) },
    });

    revalidatePath('/admin/faqs');
    revalidatePath('/faq');
    return { success: true };
}
