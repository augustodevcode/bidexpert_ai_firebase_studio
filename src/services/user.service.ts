// src/services/user.service.ts
import { UserRepository } from '@/repositories/user.repository';
import { RoleRepository } from '@/repositories/role.repository';
import type { UserProfileWithPermissions, UserCreationData, EditableUserProfileData, Tenant, Role } from '@/types';
import bcrypt from 'bcryptjs';
import type { Prisma, UserDocument, DocumentType } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { prisma as basePrisma, getPrismaInstance } from '@/lib/prisma';


export class UserService {
  private userRepository: UserRepository;
  private roleRepository: RoleRepository;
  private prisma;

  constructor() {
    this.userRepository = new UserRepository();
    this.roleRepository = new RoleRepository();
    // A instância do serviço usará o prisma com contexto por padrão.
    this.prisma = getPrismaInstance(); 
  }
  
  private formatUser(user: any): UserProfileWithPermissions | null {
    if (!user) return null;

    const roles: Role[] = user.roles?.map((ur: any) => ur.role) || [];
        const permissions = Array.from(new Set(roles.flatMap((r: any) => {
        if (typeof r.permissions === 'string') {
            return r.permissions.split(',');
        }
        if (Array.isArray(r.permissions)) {
            return r.permissions;
        }
        return [];
    })));
    const tenants: Tenant[] = user.tenants?.map((ut: any) => ut.tenant) || [];
    
    return {
      ...user,
      id: user.id,
      uid: user.id, 
      roles,
      tenants,
      roleIds: roles.map((r: any) => r.id),
      roleNames: roles.map((r: any) => r.name),
      permissions,
      roleName: roles[0]?.name,
    };
  }


  async getUsers(): Promise<UserProfileWithPermissions[]> {
    // A busca de todos os usuários é uma operação de admin, pode usar o base.
    const users = await this.userRepository.findAll();
    return users.map(user => this.formatUser(user)).filter(Boolean) as UserProfileWithPermissions[];
  }

  async getUserById(id: string): Promise<UserProfileWithPermissions | null> {
    if (!id) {
        console.warn("[UserService] getUserById called with a null or undefined id.");
        return null;
    }
    // A busca de um usuário por ID deve ser global.
    const user = await this.userRepository.findById(id);
    return this.formatUser(user);
  }
  
  async findUserByEmail(email: string): Promise<UserProfileWithPermissions | null> {
    // A busca por email no login deve ser global.
    const user = await this.userRepository.findByEmail(email);
    return this.formatUser(user);
  }


  async createUser(data: UserCreationData): Promise<{ success: boolean; message: string; userId?: string; }> {
    try {
        const { roleIds: providedRoleIds, tenantId, ...userData } = data;
        if (!userData.email || !userData.password) {
            return { success: false, message: "Email e senha são obrigatórios." };
        }
        
        const existingUser = await this.userRepository.findByEmail(userData.email);
        if (existingUser) {
            return { success: false, message: "Este email já está em uso." };
        }

        const hashedPassword = await bcrypt.hash(userData.password, 10);
        
        let finalRoleIds = providedRoleIds || [];
        if (finalRoleIds.length === 0) {
          const userRole = await this.roleRepository.findByNormalizedName('USER');
          if (!userRole) {
              throw new Error("O perfil padrão 'USER' não foi encontrado. Popule os dados essenciais primeiro.");
          }
          finalRoleIds.push(userRole.id);
        }

        const dataToCreate: Prisma.UserCreateInput = {
            ...(userData as any),
            password: hashedPassword,
        };
        
        const newUser = await this.userRepository.create(dataToCreate, finalRoleIds, tenantId || '1');
        return { success: true, message: 'Usuário criado com sucesso.', userId: newUser.id };
    } catch (error: any) {
        console.error("Error in UserService.createUser:", error);
        return { success: false, message: `Falha ao criar usuário: ${error.message}` };
    }
  }
  
  async updateUserRoles(userId: string, roleIds: string[]): Promise<{ success: boolean; message: string }> {
    try {
      const user = await this.userRepository.findById(userId);
      if(!user) return { success: false, message: 'Usuário não encontrado.'};

      const tenantIds = user.tenants.map(t => t.tenantId);

      await this.userRepository.updateUserRoles(userId, tenantIds, roleIds);
      return { success: true, message: "Perfis do usuário atualizados com sucesso." };
    } catch (error: any) {
      console.error(`Error in UserService.updateUserRoles for userId ${userId}:`, error);
      return { success: false, message: `Falha ao atualizar perfis: ${error.message}` };
    }
  }


  async updateUserProfile(userId: string, data: EditableUserProfileData): Promise<{ success: boolean; message: string; }> {
    try {
        const { password, ...profileData } = data;
        const dataToUpdate: Partial<Prisma.UserUpdateInput> = { ...profileData };

        // **CORREÇÃO:** Somente atualiza a senha se um novo valor válido for fornecido.
        if (password && password.length >= 6) {
          dataToUpdate.password = await bcrypt.hash(password, 10);
        }

        await this.userRepository.update(userId, dataToUpdate);
        return { success: true, message: "Perfil atualizado com sucesso."};
    } catch (error: any) {
        console.error(`Error updating user profile for ${userId}:`, error);
        return { success: false, message: "Erro ao salvar as informações do perfil."}
    }
  }

  async deleteUser(id: string): Promise<{ success: boolean; message: string; }> {
    try {
        await this.userRepository.delete(id);
        return { success: true, message: "Usuário excluído com sucesso." };
    } catch (error: any) {
        console.error(`Error in UserService.deleteUser for id ${id}:`, error);
        return { success: false, message: `Falha ao excluir usuário: ${error.message}` };
    }
  }

  /**
   * Checks if a user has submitted all required documents and updates their status to 'HABILITADO' if so.
   * Also updates the status to 'PENDING_ANALYSIS' when the first document is submitted.
   * @param {string} userId - The ID of the user to check.
   * @returns {Promise<void>}
   */
  async checkAndHabilitateUser(userId: string): Promise<void> {
    const user = await basePrisma.user.findUnique({
      where: { id: userId },
      include: { documents: true, tenants: true }
    });

    if (!user || user.habilitationStatus === 'HABILITADO') {
      return; // Skip if user not found or already habilitated
    }
    
    const accountType = user.accountType || 'PHYSICAL';
    
    const requiredDocTypes = await basePrisma.documentType.findMany({
      where: { 
        isRequired: true,
        appliesTo: {
          contains: accountType
        }
      }
    });

    const submittedApprovedDocTypeIds = new Set(
      user.documents.filter(d => d.status === 'APPROVED').map(d => d.documentTypeId)
    );

    const allRequiredDocsApproved = requiredDocTypes.every(
      requiredDoc => submittedApprovedDocTypeIds.has(requiredDoc.id)
    );

    if (allRequiredDocsApproved) {
      await basePrisma.user.update({
        where: { id: userId },
        data: { habilitationStatus: 'HABILITADO' }
      });
      const bidderRole = await this.roleRepository.findByNormalizedName('BIDDER');
      if(bidderRole && user.tenants) {
        // Habilitar como licitante em todos os tenants aos quais ele pertence.
        for (const userTenant of user.tenants) {
            await basePrisma.usersOnRoles.createMany({
                data: [{ 
                    userId: userId, 
                    roleId: bidderRole.id, 
                    assignedBy: 'system-habilitation' 
                }],
                skipDuplicates: true,
            });
        }
      }
    } else if (user.documents.length > 0 && user.habilitationStatus === 'PENDING_DOCUMENTS') {
      await basePrisma.user.update({
        where: { id: userId },
        data: { habilitationStatus: 'PENDING_ANALYSIS' }
      });
    }
  }
}
