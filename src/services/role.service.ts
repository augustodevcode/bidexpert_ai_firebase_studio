// src/services/role.service.ts
import { RoleRepository } from '@/repositories/role.repository';
import type { Role, RoleFormData } from '@/types';
import type { Prisma } from '@prisma/client';

export class RoleService {
  private repository: RoleRepository;

  constructor() {
    this.repository = new RoleRepository();
  }

  async getRoles(): Promise<Role[]> {
    return this.repository.findAll();
  }

  async getRoleById(id: string): Promise<Role | null> {
    return this.repository.findById(id);
  }

  async createRole(data: RoleFormData): Promise<{ success: boolean; message: string; roleId?: string }> {
    try {
      const nameNormalized = data.name.toUpperCase().replace(/\s/g, '_');
      const existing = await this.repository.findByNormalizedName(nameNormalized);
      if (existing) {
        return { success: false, message: 'Já existe um perfil com este nome.' };
      }

      const dataToCreate: Prisma.RoleCreateInput = {
        name: data.name,
        nameNormalized: nameNormalized,
        description: data.description,
        permissions: data.permissions || [],
      };

      const newRole = await this.repository.create(dataToCreate);
      return { success: true, message: 'Perfil criado com sucesso.', roleId: newRole.id };
    } catch (error: any) {
      console.error("Error in RoleService.createRole:", error);
      return { success: false, message: `Falha ao criar perfil: ${error.message}` };
    }
  }

  async updateRole(id: string, data: Partial<RoleFormData>): Promise<{ success: boolean; message: string }> {
    try {
      const dataToUpdate: Partial<Prisma.RoleUpdateInput> = { ...data };
      if (data.name) {
        dataToUpdate.nameNormalized = data.name.toUpperCase().replace(/\s/g, '_');
      }
      // Garante que a permissão seja um objeto JSON válido ou nulo.
      if (data.permissions) {
        dataToUpdate.permissions = data.permissions;
      }
      
      await this.repository.update(id, dataToUpdate);
      return { success: true, message: 'Perfil atualizado com sucesso.' };
    } catch (error: any) {
      console.error(`Error in RoleService.updateRole for id ${id}:`, error);
      return { success: false, message: `Falha ao atualizar perfil: ${error.message}` };
    }
  }

  async deleteRole(id: string): Promise<{ success: boolean; message: string; }> {
    try {
      // Add check for users with this role
      const usersWithRole = await prisma.usersOnRoles.count({ where: { roleId: id } });
      if (usersWithRole > 0) {
        return { success: false, message: `Não é possível excluir. O perfil está em uso por ${usersWithRole} usuário(s).` };
      }
      await this.repository.delete(id);
      return { success: true, message: 'Perfil excluído com sucesso.' };
    } catch (error: any) {
      console.error(`Error in RoleService.deleteRole for id ${id}:`, error);
      return { success: false, message: `Falha ao excluir perfil: ${error.message}` };
    }
  }
}
