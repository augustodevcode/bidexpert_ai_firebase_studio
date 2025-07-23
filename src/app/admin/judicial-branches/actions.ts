// src/app/admin/judicial-branches/actions.ts
'use server';

import { prisma } from '@/lib/prisma';
import type { JudicialBranch, JudicialBranchFormData } from '@/types';
import { revalidatePath } from 'next/cache';

export async function getJudicialBranches(): Promise<JudicialBranch[]> {
    const branches = await prisma.judicialBranch.findMany({
        include: {
            district: {
                include: { // Include the full state object to access 'uf'
                    state: true,
                }
            }
        },
        orderBy: { name: 'asc' }
    });
    // @ts-ignore
    return branches.map(b => ({ 
        ...b, 
        districtName: b.district.name, 
        stateUf: b.district.state?.uf // Access uf from the nested state object
    }));
}

export async function getJudicialBranch(id: string): Promise<JudicialBranch | null> {
    const branch = await prisma.judicialBranch.findUnique({
        where: { id },
        include: { 
            district: { 
                include: {
                    state: true
                }
            }
        }
    });
    if (!branch) return null;
    // @ts-ignore
    return { ...branch, districtName: branch.district.name, stateUf: branch.district.state?.uf };
}

export async function createJudicialBranch(data: JudicialBranchFormData): Promise<{ success: boolean; message: string; branchId?: string; }> {
    try {
        const newBranch = await prisma.judicialBranch.create({ data: data as any });
        revalidatePath('/admin/judicial-branches');
        return { success: true, message: "Vara judicial criada com sucesso.", branchId: newBranch.id };
    } catch (error: any) {
        return { success: false, message: `Falha ao criar vara judicial: ${error.message}`};
    }
}

export async function updateJudicialBranch(id: string, data: Partial<JudicialBranchFormData>): Promise<{ success: boolean; message: string; }> {
    try {
        await prisma.judicialBranch.update({ where: { id }, data: data as any });
        revalidatePath('/admin/judicial-branches');
        revalidatePath(`/admin/judicial-branches/${id}/edit`);
        return { success: true, message: "Vara judicial atualizada com sucesso." };
    } catch (error: any) {
        return { success: false, message: `Falha ao atualizar vara judicial: ${error.message}`};
    }
}

export async function deleteJudicialBranch(id: string): Promise<{ success: boolean; message: string; }> {
    try {
        await prisma.judicialBranch.delete({ where: { id } });
        revalidatePath('/admin/judicial-branches');
        return { success: true, message: "Vara judicial excluída com sucesso." };
    } catch (error: any) {
        return { success: false, message: `Falha ao excluir vara judicial: ${error.message}` };
    }
}