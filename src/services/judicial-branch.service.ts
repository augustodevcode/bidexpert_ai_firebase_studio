// src/services/judicial-branch.service.ts
import { JudicialBranchRepository } from '@/repositories/judicial-branch.repository';
import type { JudicialBranch, JudicialBranchFormData } from '@/types';
import { slugify } from '@/lib/sample-data-helpers';
import type { Prisma } from '@prisma/client';

export class JudicialBranchService {
  private repository: JudicialBranchRepository;

  constructor() {
    this.repository = new JudicialBranchRepository();
  }

  async getJudicialBranches(): Promise<JudicialBranch[]> {
    const branches = await this.repository.findAll();
    return branches.map(b => ({
      ...b,
      districtName: b.district.name,
      stateUf: b.district.state?.uf,
    }));
  }

  async getJudicialBranchById(id: string): Promise<JudicialBranch | null> {
    const branch = await this.repository.findById(id);
    if (!branch) return null;
    return {
      ...branch,
      districtName: branch.district.name,
      stateUf: branch.district.state?.uf,
    };
  }

  async createJudicialBranch(data: JudicialBranchFormData): Promise<{ success: boolean; message: string; branchId?: string; }> {
    try {
      const dataToCreate: Prisma.JudicialBranchCreateInput = {
        name: data.name,
        slug: slugify(data.name),
        contactName: data.contactName,
        phone: data.phone,
        email: data.email,
        district: { connect: { id: data.districtId } },
      };
      const newBranch = await this.repository.create(dataToCreate);
      return { success: true, message: 'Vara criada com sucesso.', branchId: newBranch.id };
    } catch (error: any) {
      console.error("Error in JudicialBranchService.create:", error);
      return { success: false, message: `Falha ao criar vara: ${error.message}` };
    }
  }

  async updateJudicialBranch(id: string, data: Partial<JudicialBranchFormData>): Promise<{ success: boolean; message: string }> {
    try {
      const dataToUpdate: Partial<Prisma.JudicialBranchUpdateInput> = { };
      if (data.name) {
        dataToUpdate.slug = slugify(data.name);
        dataToUpdate.name = data.name;
      }
      if (data.contactName) dataToUpdate.contactName = data.contactName;
      if (data.phone) dataToUpdate.phone = data.phone;
      if (data.email) dataToUpdate.email = data.email;

      if (data.districtId) {
          dataToUpdate.district = { connect: { id: data.districtId } };
      }
      await this.repository.update(id, dataToUpdate);
      return { success: true, message: 'Vara atualizada com sucesso.' };
    } catch (error: any) {
      console.error(`Error in JudicialBranchService.update for id ${id}:`, error);
      return { success: false, message: `Falha ao atualizar vara: ${error.message}` };
    }
  }

  async deleteJudicialBranch(id: string): Promise<{ success: boolean; message: string; }> {
    try {
      await this.repository.delete(id);
      return { success: true, message: 'Vara excluída com sucesso.' };
    } catch (error: any) {
      console.error(`Error in JudicialBranchService.delete for id ${id}:`, error);
      return { success: false, message: `Falha ao excluir vara: ${error.message}` };
    }
  }
}
