// src/app/admin/judicial-districts/actions.ts
'use server';

import { prisma } from '@/lib/prisma';
import type { JudicialDistrict, JudicialDistrictFormData } from '@/types';
import { revalidatePath } from 'next/cache';
import { slugify } from '@/lib/sample-data-helpers';


export async function getJudicialDistricts(): Promise<JudicialDistrict[]> {
    const districts = await prisma.judicialDistrict.findMany({
        include: {
            court: { select: { name: true } },
            state: { select: { uf: true } }
        },
        orderBy: { name: 'asc' }
    });
    // @ts-ignore
    return districts.map(d => ({ ...d, courtName: d.court.name, stateUf: d.state.uf }));
}

export async function getJudicialDistrict(id: string): Promise<JudicialDistrict | null> {
    const district = await prisma.judicialDistrict.findUnique({
        where: { id },
        include: {
            court: { select: { name: true } },
            state: { select: { uf: true } }
        }
    });
    if (!district) return null;
     // @ts-ignore
    return { ...district, courtName: district.court.name, stateUf: district.state.uf };
}

export async function createJudicialDistrict(data: JudicialDistrictFormData): Promise<{ success: boolean; message: string; districtId?: string; }> {
    try {
        const newDistrict = await prisma.judicialDistrict.create({
            data: {
                name: data.name,
                slug: slugify(data.name),
                courtId: data.courtId,
                stateId: data.stateId,
                zipCode: data.zipCode,
            }
        });
        revalidatePath('/admin/judicial-districts');
        return { success: true, message: "Comarca criada com sucesso.", districtId: newDistrict.id };
    } catch (error: any) {
        return { success: false, message: `Falha ao criar comarca: ${error.message}` };
    }
}

export async function updateJudicialDistrict(id: string, data: Partial<JudicialDistrictFormData>): Promise<{ success: boolean; message: string; }> {
    try {
        await prisma.judicialDistrict.update({
            where: { id },
            data: {
                ...data,
                slug: data.name ? slugify(data.name) : undefined
            }
        });
        revalidatePath('/admin/judicial-districts');
        revalidatePath(`/admin/judicial-districts/${id}/edit`);
        return { success: true, message: "Comarca atualizada com sucesso." };
    } catch (error: any) {
        return { success: false, message: `Falha ao atualizar comarca: ${error.message}` };
    }
}

export async function deleteJudicialDistrict(id: string): Promise<{ success: boolean; message: string; }> {
    try {
        await prisma.judicialDistrict.delete({ where: { id } });
        revalidatePath('/admin/judicial-districts');
        return { success: true, message: "Comarca excluída com sucesso." };
    } catch (error: any) {
        return { success: false, message: `Falha ao excluir comarca: ${error.message}` };
    }
}