
'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import type { Role, RoleFormData } from '@/types';
import { predefinedPermissions } from './role-form-schema';

export async function createRole(
  data: RoleFormData
): Promise<{ success: boolean; message: string; roleId?: string }> {
  try {
    const newRole = await prisma.role.create({
      data: {
        name: data.name,
        name_normalized: data.name.toUpperCase().replace(/\s/g, '_'),
        description: data.description,
        permissions: data.permissions || [],
      }
    });
    revalidatePath('/admin/roles');
    return { success: true, message: "Perfil criado com sucesso!", roleId: newRole.id };
  } catch (error: any) {
    console.error("Error creating role:", error);
    if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
      return { success: false, message: 'Já existe um perfil com este nome.' };
    }
    return { success: false, message: 'Falha ao criar perfil.' };
  }
}

export async function getRoles(): Promise<Role[]> {
  try {
    return await prisma.role.findMany({
      orderBy: { name: 'asc' }
    }) as unknown as Role[];
  } catch (error) {
    console.error("Error fetching roles:", error);
    return [];
  }
}

export async function getRole(id: string): Promise<Role | null> {
  try {
    const role = await prisma.role.findUnique({ where: { id }});
    return role as unknown as Role | null;
  } catch (error) {
    console.error("Error fetching role:", error);
    return null;
  }
}

export async function getRoleByName(name: string): Promise<Role | null> {
  try {
    const role = await prisma.role.findFirst({ where: { name_normalized: name.toUpperCase() }});
    return role as unknown as Role | null;
  } catch (error) {
    console.error("Error fetching role by name:", error);
    return null;
  }
}

export async function updateRole(
  id: string,
  data: Partial<RoleFormData>
): Promise<{ success: boolean; message: string }> {
  try {
    const updateData: any = { ...data };
    if (data.name) {
      updateData.name_normalized = data.name.toUpperCase().replace(/\s/g, '_');
    }
    await prisma.role.update({
      where: { id },
      data: updateData,
    });
    revalidatePath('/admin/roles');
    revalidatePath(`/admin/roles/${id}/edit`);
    return { success: true, message: 'Perfil atualizado com sucesso!' };
  } catch (error) {
    console.error(`Error updating role ${id}:`, error);
    return { success: false, message: 'Falha ao atualizar perfil.' };
  }
}

export async function deleteRole(
  id: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Prevent deletion of protected system roles
    const roleToDelete = await prisma.role.findUnique({ where: { id }});
    const protectedRoles = ['ADMINISTRATOR', 'USER', 'CONSIGNOR', 'AUCTIONEER', 'AUCTION_ANALYST'];
    if (protectedRoles.includes(roleToDelete?.name_normalized || '')) {
      return { success: false, message: 'Não é possível excluir perfis de sistema.' };
    }
    await prisma.role.delete({ where: { id } });
    revalidatePath('/admin/roles');
    return { success: true, message: 'Perfil excluído com sucesso!' };
  } catch (error: any) {
    console.error(`Error deleting role ${id}:`, error);
    if (error.code === 'P2003') {
        return { success: false, message: 'Não é possível excluir. Este perfil está em uso por um ou mais usuários.' };
    }
    return { success: false, message: 'Falha ao excluir perfil.' };
  }
}

export async function ensureDefaultRolesExist(): Promise<{ success: boolean; message: string; rolesProcessed?: number }> {
    let rolesProcessed = 0;
    const adminRoleData = { name: 'ADMINISTRATOR', description: 'Acesso total à plataforma.', permissions: ['manage_all'] };
    const userRoleData = { name: 'USER', description: 'Usuário padrão.', permissions: ['view_auctions', 'place_bids', 'view_lots'] };

    try {
        const adminRole = await prisma.role.findUnique({ where: { name_normalized: 'ADMINISTRATOR' } });
        if (!adminRole) {
            await createRole(adminRoleData);
            rolesProcessed++;
        }

        const userRole = await prisma.role.findUnique({ where: { name_normalized: 'USER' } });
        if (!userRole) {
            await createRole(userRoleData);
            rolesProcessed++;
        }
        return { success: true, message: "Perfis padrão verificados/criados.", rolesProcessed };
    } catch(err: any) {
        return { success: false, message: `Erro ao garantir perfis padrão: ${err.message}` };
    }
}
