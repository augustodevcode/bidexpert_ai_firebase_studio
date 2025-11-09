import { MentalTriggerSettings, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export class MentalTriggerSettingsService {
    async createMentalTriggerSettings(data: {
        tenantId: string | bigint;
        title: string;
        subtitle?: string;
        icon?: string;
        order: number;
    }): Promise<MentalTriggerSettings> {
        const tenantIdBigInt = typeof data.tenantId === 'string' ? BigInt(data.tenantId) : data.tenantId;
        
        return await prisma.mentalTriggerSettings.create({
            data: {
                ...data,
                tenantId: tenantIdBigInt
            }
        });
    }

    async getMentalTriggerSettings(tenantId: string | bigint): Promise<MentalTriggerSettings[]> {
        const tenantIdBigInt = typeof tenantId === 'string' ? BigInt(tenantId) : tenantId;
        
        return prisma.mentalTriggerSettings.findMany({
            where: {
                tenantId: tenantIdBigInt
            },
            orderBy: {
                order: 'asc'
            }
        });
    }

    async updateMentalTriggerSettings(id: string | bigint, data: Partial<Prisma.MentalTriggerSettingsUpdateInput>): Promise<MentalTriggerSettings> {
        const settingsId = typeof id === 'string' ? BigInt(id) : id;
        
        return prisma.mentalTriggerSettings.update({
            where: { id: settingsId },
            data
        });
    }

    async deleteMentalTriggerSettings(id: string | bigint): Promise<void> {
        const settingsId = typeof id === 'string' ? BigInt(id) : id;
        
        await prisma.mentalTriggerSettings.delete({
            where: { id: settingsId }
        });
    }
}