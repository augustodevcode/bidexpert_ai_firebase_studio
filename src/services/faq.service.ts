
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-helpers'; // I'll check if this exists or create it

export class FAQService {
    async getFAQs(tenantId: string | bigint) {
        return await prisma.fAQ.findMany({
            where: {
                tenantId: BigInt(tenantId),
            },
            orderBy: {
                order: 'asc',
            },
        });
    }

    async getFAQById(id: string | bigint) {
        return await prisma.fAQ.findUnique({
            where: {
                id: BigInt(id),
            },
        });
    }

    async createFAQ(data: { question: string, answer: string, order?: number, isActive?: boolean, tenantId: string | bigint }) {
        try {
            const faq = await prisma.fAQ.create({
                data: {
                    question: data.question,
                    answer: data.answer,
                    order: data.order || 0,
                    isActive: data.isActive !== undefined ? data.isActive : true,
                    tenantId: BigInt(data.tenantId),
                },
            });
            return { success: true, message: 'FAQ criada com sucesso', data: faq };
        } catch (error) {
            console.error('Error creating FAQ:', error);
            return { success: false, message: 'Erro ao criar FAQ' };
        }
    }

    async updateFAQ(id: string | bigint, data: { question?: string, answer?: string, order?: number, isActive?: boolean }) {
        try {
            const faq = await prisma.fAQ.update({
                where: { id: BigInt(id) },
                data: {
                    ...data,
                },
            });
            return { success: true, message: 'FAQ atualizada com sucesso', data: faq };
        } catch (error) {
            console.error('Error updating FAQ:', error);
            return { success: false, message: 'Erro ao atualizar FAQ' };
        }
    }

    async deleteFAQ(id: string | bigint) {
        try {
            await prisma.fAQ.delete({
                where: { id: BigInt(id) },
            });
            return { success: true, message: 'FAQ excluída com sucesso' };
        } catch (error) {
            console.error('Error deleting FAQ:', error);
            return { success: false, message: 'Erro ao excluir FAQ' };
        }
    }
}
