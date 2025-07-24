// src/services/user.service.ts
import { UserRepository } from '@/repositories/user.repository';
import { RoleRepository } from '@/repositories/role.repository';
import type { UserProfileWithPermissions, UserCreationData } from '@/types';
import bcrypt from 'bcrypt';
import type { Prisma } from '@prisma/client';

export class UserService {
  private userRepository: UserRepository;
  private roleRepository: RoleRepository;

  constructor() {
    this.userRepository = new UserRepository();
    this.roleRepository = new RoleRepository();
  }
  
  private formatUser(user: any): UserProfileWithPermissions | null {
    if (!user) return null;
    const roles = user.roles?.map((ur: any) => ur.role) || [];
    const permissions = Array.from(new Set(roles.flatMap((r: any) => r.permissions || [])));
    return {
      ...user,
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

  async createUser(data: UserCreationData): Promise<{ success: boolean; message: string; userId?: string }> {
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
              throw new Error("O perfil padrão 'USER' não foi encontrado. Popule os dados essenciais primeiro.");
          }
          roleIdsToAssign.push(userRole.id);
        }

        const dataToCreate: Prisma.UserCreateInput = {
            email: data.email,
            password: hashedPassword,
            fullName: data.fullName || 'Usuário',
            habilitationStatus: data.habilitationStatus || 'PENDING_DOCUMENTS',
            accountType: data.accountType || 'PHYSICAL',
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
      await this.userRepository.updateUserRoles(userId, roleIds);
      return { success: true, message: "Perfis do usuário atualizados com sucesso." };
    } catch (error: any) {
      console.error(`Error in UserService.updateUserRoles for userId ${userId}:`, error);
      return { success: false, message: `Falha ao atualizar perfis: ${error.message}` };
    }
  }

  async deleteUser(id: string): Promise<{ success: boolean; message: string }> {
    try {
        await this.userRepository.delete(id);
        return { success: true, message: "Usuário excluído com sucesso." };
    } catch (error: any) {
        console.error(`Error in UserService.deleteUser for id ${id}:`, error);
        return { success: false, message: `Falha ao excluir usuário: ${error.message}` };
    }
  }
}
