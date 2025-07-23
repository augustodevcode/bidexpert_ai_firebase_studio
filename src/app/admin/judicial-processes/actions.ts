// src/app/admin/judicial-processes/actions.ts
'use server';

import { prisma } from '@/lib/prisma';
import type { JudicialProcess, JudicialProcessFormData } from '@/types';
import { revalidatePath } from 'next/cache';

export async function getJudicialProcesses(): Promise<JudicialProcess[]> {
    const processes = await prisma.judicialProcess.findMany({
        include: {
            court: { select: { name: true } },
            district: { select: { name: true } },
            branch: { select: { name: true } },
            seller: { select: { name: true } },
            parties: true,
        },
        orderBy: { createdAt: 'desc' }
    });

    return processes.map(p => ({
        ...p,
        courtName: p.court?.name,
        districtName: p.district?.name,
        branchName: p.branch?.name,
        sellerName: p.seller?.name,
    }));
}

export async function getJudicialProcess(id: string): Promise<JudicialProcess | null> {
    const process = await prisma.judicialProcess.findUnique({
        where: { id },
        include: {
            court: { select: { name: true } },
            district: { select: { name: true } },
            branch: { select: { name: true } },
            seller: { select: { name: true } },
            parties: true,
        },
    });

    if (!process) return null;

    return {
        ...process,
        courtName: process.court?.name,
        districtName: process.district?.name,
        branchName: process.branch?.name,
        sellerName: process.seller?.name,
    };
}

export async function createJudicialProcessAction(data: JudicialProcessFormData): Promise<{ success: boolean; message: string; processId?: string; }> {
    try {
        const { parties, ...processData } = data;
        const newProcess = await prisma.judicialProcess.create({
            // @ts-ignore
            data: {
                ...processData,
                parties: {
                    create: parties,
                },
            }
        });
        revalidatePath('/admin/judicial-processes');
        return { success: true, message: "Processo judicial criado com sucesso.", processId: newProcess.id };
    } catch (error: any) {
        return { success: false, message: `Falha ao criar processo: ${error.message}` };
    }
}

export async function updateJudicialProcessAction(id: string, data: Partial<JudicialProcessFormData>): Promise<{ success: boolean; message: string; }> {
    const { parties, ...processData } = data;
    try {
        await prisma.$transaction(async (tx) => {
            // Update the main process data
            await tx.judicialProcess.update({
                where: { id },
                data: processData as any,
            });

            // Handle parties: delete existing and create new ones
            if (parties) {
                await tx.judicialParty.deleteMany({ where: { processId: id } });
                await tx.judicialProcess.update({
                    where: { id },
                    data: {
                        parties: {
                            create: parties,
                        },
                    },
                });
            }
        });

        revalidatePath('/admin/judicial-processes');
        revalidatePath(`/admin/judicial-processes/${id}/edit`);
        return { success: true, message: "Processo judicial atualizado com sucesso." };
    } catch (error: any) {
        return { success: false, message: `Falha ao atualizar processo: ${error.message}` };
    }
}

export async function deleteJudicialProcess(id: string): Promise<{ success: boolean; message: string; }> {
    try {
        // Prisma will cascade delete parties due to the relation
        await prisma.judicialProcess.delete({ where: { id } });
        revalidatePath('/admin/judicial-processes');
        return { success: true, message: "Processo judicial excluído com sucesso." };
    } catch (error: any) {
        return { success: false, message: `Falha ao excluir processo: ${error.message}` };
    }
}