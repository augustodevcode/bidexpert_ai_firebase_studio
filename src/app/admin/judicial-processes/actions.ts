
'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import type { JudicialProcess, JudicialProcessFormData } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export async function createJudicialProcessAction(data: JudicialProcessFormData): Promise<{ success: boolean; message: string; processId?: string; }> {
  try {
    const newProcess = await prisma.judicialProcess.create({
      data: {
        publicId: `PROC-PUB-${uuidv4().substring(0,8)}`,
        processNumber: data.processNumber,
        isElectronic: data.isElectronic,
        courtId: data.courtId,
        districtId: data.districtId,
        branchId: data.branchId,
        sellerId: data.sellerId,
        parties: {
          create: data.parties.map(p => ({
            name: p.name,
            partyType: p.partyType,
            documentNumber: p.documentNumber,
          }))
        }
      }
    });
    revalidatePath('/admin/judicial-processes');
    return { success: true, message: 'Processo criado com sucesso!', processId: newProcess.id };
  } catch (error: any) {
    console.error("Error creating judicial process:", error);
     if (error.code === 'P2002') {
      return { success: false, message: 'Já existe um processo com este número.' };
    }
    return { success: false, message: error.message || 'Falha ao criar processo.' };
  }
}

export async function getJudicialProcesses(): Promise<JudicialProcess[]> {
  try {
    const processes = await prisma.judicialProcess.findMany({
      include: {
        court: true,
        district: true,
        branch: true,
        parties: true,
      },
      orderBy: { createdAt: 'desc' }
    });
    return processes.map(p => ({
      ...p,
      courtName: p.court.name,
      districtName: p.district.name,
      branchName: p.branch.name
    })) as unknown as JudicialProcess[];
  } catch (error) {
    console.error("Error fetching judicial processes:", error);
    return [];
  }
}

export async function getJudicialProcess(id: string): Promise<JudicialProcess | null> {
  try {
    const process = await prisma.judicialProcess.findUnique({
      where: { id },
      include: { parties: true, seller: true }
    });
    if (!process) return null;
    return { ...process, sellerName: process.seller?.name } as unknown as JudicialProcess;
  } catch (error) {
    console.error(`Error fetching judicial process with ID ${id}:`, error);
    return null;
  }
}

export async function updateJudicialProcessAction(id: string, data: Partial<JudicialProcessFormData>): Promise<{ success: boolean; message: string; }> {
  try {
    // Prisma requires more specific handling for relation updates.
    // This is a simplified update that only handles top-level fields.
    // A full implementation would handle adding/removing/updating parties.
    const { parties, ...processData } = data;
    await prisma.judicialProcess.update({
      where: { id },
      data: processData,
    });

    if (parties) {
      // Basic implementation: Delete existing and create new ones.
      await prisma.processParty.deleteMany({ where: { processId: id }});
      await prisma.processParty.createMany({
        data: parties.map(p => ({
          processId: id,
          name: p.name!,
          partyType: p.partyType!,
          documentNumber: p.documentNumber
        }))
      });
    }

    revalidatePath('/admin/judicial-processes');
    revalidatePath(`/admin/judicial-processes/${id}/edit`);
    return { success: true, message: 'Processo atualizado com sucesso!' };
  } catch (error: any) {
    console.error(`Error updating judicial process ${id}:`, error);
    return { success: false, message: error.message || 'Falha ao atualizar processo.' };
  }
}

export async function deleteJudicialProcess(id: string): Promise<{ success: boolean; message: string; }> {
  try {
    await prisma.judicialProcess.delete({ where: { id } });
    revalidatePath('/admin/judicial-processes');
    return { success: true, message: 'Processo excluído com sucesso!' };
  } catch (error: any) {
    console.error(`Error deleting judicial process ${id}:`, error);
    if (error.code === 'P2003') {
        return { success: false, message: 'Não é possível excluir. Este processo tem bens vinculados.' };
    }
    return { success: false, message: error.message || 'Falha ao excluir processo.' };
  }
}
