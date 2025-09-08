// src/services/user.service.ts
import { UserRepository } from '@/repositories/user.repository';
import { RoleRepository } from '@/repositories/role.repository';
import type { UserProfileWithPermissions, UserCreationData, EditableUserProfileData, UserHabilitationStatus } from '@/types';
import bcrypt from 'bcryptjs';
import type { Prisma, UserDocument, DocumentType } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/lib/prisma';
import { RoleService } from './role.service';


export class UserService {
  private userRepository: UserRepository;
  private roleRepository: RoleRepository;
  private roleService: RoleService;

  constructor() {
    this.userRepository = new UserRepository();
    this.roleRepository = new RoleRepository();
    this.roleService = new RoleService();
  }
  
  private formatUser(user: any): UserProfileWithPermissions | null {
    if (!user) return null;
    const roles = user.roles?.map((ur: any) => ur.role) || [];
    const permissions = Array.from(new Set(roles.flatMap((r: any) => r.permissions || [])));
    return {
      ...user,
      id: user.id, // Ensure id is passed through
      uid: user.id, // Ensure uid is the same as id
      roles, // Pass the full role objects
      roleIds: roles.map((r: any) => r.id),
      roleNames: roles.map((r: any) => r.name),
      permissions,
      // For compatibility with older components that might expect a single roleName
      roleName: roles[0]?.name,
    };
  }

  async getUsers(): Promise<UserProfileWithPermissions[]> {
    const users = await this.userRepository.findAll();
    return users.map(user => this.formatUser(user)).filter(Boolean) as UserProfileWithPermissions[];
  }

  async getUserById(id: string): Promise<UserProfileWithPermissions | null> {
    if (!id) {
        console.warn("[UserService] getUserById called with a null or undefined id.");
        return null;
    }
    const user = await this.userRepository.findById(id);
    return this.formatUser(user);
  }
  
  async findUserByEmail(email: string): Promise<UserProfileWithPermissions | null> {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });
    return this.formatUser(user);
  }


  async createUser(data: UserCreationData): Promise<{ success: boolean; message: string; userId?: string; }> {
    try {
        if (!data.email || !data.password) {
            return { success: false, message: "Email e senha são obrigatórios." };
        }

        const existingUser = await this.userRepository.findByEmail(data.email);
        if (existingUser) {
            return { success: false, message: "Este email já está em uso." };
        }

        const hashedPassword = await bcrypt.hash(data.password, 10);
        
        let roleIdsToAssign = data.roleIds || [];
        if (roleIdsToAssign.length === 0) {
          const userRole = await this.roleRepository.findByNormalizedName('USER');
          if (!userRole) {
              await this.roleService.createRole({name: 'USER', nameNormalized: 'USER', description: 'Usuário Padrão', permissions: ['view_auctions', 'view_lots']});
              const newUserRole = await this.roleRepository.findByNormalizedName('USER');
              if(!newUserRole) throw new Error("O perfil padrão 'USER' não foi encontrado. Popule os dados essenciais primeiro.");
              roleIdsToAssign.push(newUserRole.id);
          } else {
              roleIdsToAssign.push(userRole.id);
          }
        }

        const { roleIds, ...userData } = data;

        const dataToCreate: Prisma.UserCreateInput = {
            ...userData,
            password: hashedPassword,
        };
        
        const newUser = await this.userRepository.create(dataToCreate, roleIdsToAssign);
        return { success: true, message: 'Usuário criado com sucesso.', userId: newUser.id };
    } catch (error: any) {
        console.error("Error in UserService.createUser:", error);
        return { success: false, message: `Falha ao criar usuário: ${error.message}` };
    }
  }
  
  async updateUserRoles(userId: string, roleIds: string[]): Promise<{ success: boolean; message: string }> {
    try {
      if (!userId) {
        throw new Error("UserID é obrigatório para atualizar perfis.");
      }
      
      // First, clear existing roles for the user
      await prisma.usersOnRoles.deleteMany({ where: { userId }});

      // Then, add the new roles
      if (roleIds && roleIds.length > 0) {
        await prisma.usersOnRoles.createMany({
            data: roleIds.map(roleId => ({
                userId,
                roleId,
                assignedBy: 'admin-panel', 
            })),
        });
      }

      return { success: true, message: "Perfis do usuário atualizados com sucesso." };
    } catch (error: any) {
      console.error(`Error in UserService.updateUserRoles for userId ${userId}:`, error);
      return { success: false, message: `Falha ao atualizar perfis: ${error.message}` };
    }
  }

  async updateUserProfile(userId: string, data: EditableUserProfileData): Promise<{ success: boolean; message: string; }> {
    try {
        await this.userRepository.update(userId, data);
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

  async updateHabilitationStatus(userId: string, status: UserHabilitationStatus): Promise<void> {
    await prisma.user.update({
        where: { id: userId },
        data: { habilitationStatus: status }
    });
  }
  
  async authenticateUser(email: string, password: string):Promise<{ success: boolean; message: string; user?: UserProfileWithPermissions | null }> {
    const user = await this.findUserByEmail(email);
    if (!user || !user.password) {
      return { success: false, message: 'Email ou senha inválidos.' };
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return { success: false, message: 'Email ou senha inválidos.' };
    }
    return { success: true, message: 'Login bem-sucedido.', user };
  }

  /**
   * Checks if a user has submitted all required documents and updates their status to 'HABILITADO' if so.
   * Also updates the status to 'PENDING_ANALYSIS' when the first document is submitted.
   * @param {string} userId - The ID of the user to check.
   * @returns {Promise<void>}
   */
  async checkAndHabilitateUser(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { documents: true }
    });

    if (!user || user.habilitationStatus === 'HABILITADO') {
      return; // Skip if user not found or already habilitated
    }
    
    // Determine the account type to find required documents
    const accountType = user.accountType || 'PHYSICAL';
    
    const requiredDocTypes = await prisma.documentType.findMany({
      where: { 
        isRequired: true,
        appliesTo: {
          contains: accountType // Corrected from 'has' to 'contains'
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
      await this.updateHabilitationStatus(userId, 'HABILITADO');
      const bidderRole = await this.roleRepository.findByNormalizedName('BIDDER');
      if(bidderRole) {
        await prisma.usersOnRoles.createMany({
          data: [{ userId: userId, roleId: bidderRole.id, assignedBy: 'system-habilitation-check' }],
          skipDuplicates: true,
        });
      }
    } else if (user.documents.length > 0 && user.habilitationStatus === 'PENDING_DOCUMENTS') {
       // **NEW LOGIC**: If any document is submitted and status is PENDING_DOCUMENTS, update to PENDING_ANALYSIS
      await this.updateHabilitationStatus(userId, 'PENDING_ANALYSIS');
    }
  }
}
