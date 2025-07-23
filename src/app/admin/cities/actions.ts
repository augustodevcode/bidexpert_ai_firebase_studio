// src/app/admin/cities/actions.ts
'use server';

import { prisma } from '@/lib/prisma';
import type { CityInfo, CityFormData } from '@/types';
import { revalidatePath } from 'next/cache';
import { slugify } from '@/lib/sample-data-helpers';

export async function getCities(stateIdFilter?: string): Promise<CityInfo[]> {
    const cities = await prisma.city.findMany({
        where: stateIdFilter ? { stateId: stateIdFilter } : {},
        include: {
            state: {
                select: { uf: true }
            }
        },
        orderBy: { name: 'asc' }
    });
    return cities.map(city => ({ ...city, stateUf: city.state.uf }));
}

export async function getCity(id: string): Promise<CityInfo | null> {
    const city = await prisma.city.findUnique({
        where: { id },
        include: { state: { select: { uf: true }}}
    });
    if (!city) return null;
    return { ...city, stateUf: city.state.uf };
}

export async function createCity(data: CityFormData): Promise<{ success: boolean, message: string, cityId?: string }> {
    try {
        const parentState = await prisma.state.findUnique({ where: { id: data.stateId }});
        if (!parentState) {
            return { success: false, message: 'Estado pai não encontrado.' };
        }
        
        const newCity = await prisma.city.create({
            data: {
                name: data.name,
                slug: slugify(data.name),
                stateId: data.stateId,
                stateUf: parentState.uf,
                ibgeCode: data.ibgeCode || null,
            }
        });
        revalidatePath('/admin/cities');
        return { success: true, message: "Cidade criada com sucesso.", cityId: newCity.id };
    } catch (error: any) {
        if (error.code === 'P2002') {
             return { success: false, message: `Uma cidade com o código IBGE '${data.ibgeCode}' já existe.` };
        }
        return { success: false, message: `Falha ao criar cidade: ${error.message}` };
    }
}

export async function updateCity(id: string, data: Partial<CityFormData>): Promise<{ success: boolean, message: string }> {
     try {
        const dataToUpdate: any = { ...data };
        if (data.name) {
            dataToUpdate.slug = slugify(data.name);
        }
        if (data.stateId) {
             const parentState = await prisma.state.findUnique({ where: { id: data.stateId }});
             if (parentState) {
                 dataToUpdate.stateUf = parentState.uf;
             }
        }
        
        await prisma.city.update({ where: { id }, data: dataToUpdate });
        revalidatePath('/admin/cities');
        revalidatePath(`/admin/cities/${id}/edit`);
        return { success: true, message: "Cidade atualizada com sucesso." };
    } catch (error: any) {
         if (error.code === 'P2002') {
             return { success: false, message: `Uma cidade com o código IBGE '${data.ibgeCode}' já existe.` };
        }
        return { success: false, message: `Falha ao atualizar cidade: ${error.message}` };
    }
}

export async function deleteCity(id: string): Promise<{ success: boolean, message: string }> {
    try {
        await prisma.city.delete({ where: { id } });
        revalidatePath('/admin/cities');
        return { success: true, message: "Cidade excluída com sucesso." };
    } catch (error: any) {
        return { success: false, message: `Falha ao excluir cidade: ${error.message}` };
    }
}
