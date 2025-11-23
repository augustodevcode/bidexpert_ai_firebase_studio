// src/services/user.service.ts
/**
 * @fileoverview Este arquivo contém a classe UserService, que encapsula a
 * lógica de negócio para o gerenciamento de Usuários. É uma das classes mais
 * críticas, lidando com criação de contas, validação de e-mails, atualização
 * de perfis e perfis, e o processo de habilitação de usuários para dar lances.
 */
import { UserRepository } from '@/repositories/user.repository';
import { RoleRepository } from '@/repositories/role.repository';
import type { UserProfileWithPermissions, UserCreationData, EditableUserProfileData, Tenant, Role } from '@/types';
import bcrypt from 'bcryptjs';
import type { Prisma, UserDocument, DocumentType } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { prisma as basePrisma } from '@/lib/prisma';


export class UserService {
  private userRepository: UserRepository;
  private roleRepository: RoleRepository;
  private prisma;

  constructor() {
    this.userRepository = new UserRepository();
    this.roleRepository = new RoleRepository();
    this.prisma = basePrisma; 
  }
  
  private formatUser(user: any): UserProfileWithPermissions | null {
    if (!user) return null;

    const roles: Role[] = user.roles?.map((ur: any) => ({
      ...ur.role,
      id: ur.role.id.toString(), // Convert BigInt to string
    })) || [];
    
    const permissions = Array.from(new Set(roles.flatMap((r: any) => {
        if (Array.isArray(r.permissions)) {
            return r.permissions;
        }
        return [];
    })));

    const tenants: Tenant[] = user.tenants?.map((ut: any) => ({
        ...ut.tenant,
        id: ut.tenant.id.toString(), // Convert BigInt to string
    })) || [];
    
    return {
      ...user,
      id: user.id.toString(),
      uid: user.id.toString(), 
      roles,
      tenants,
      roleIds: roles.map((r: any) => r.id),
      roleNames: roles.map((r: any) => r.name),
      permissions,
      roleName: roles[0]?.name,
      sellerId: user.sellerId?.toString() ?? null,
      auctioneerId: user.auctioneerId?.toString() ?? null,
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
    const user = await this.userRepository.findById(BigInt(id));
    // DEBUG: Check for lots in user
    if ((user as any)?.lotsWon) {
        console.error('UserService.getUserById: FOUND LOTS WON IN USER RESPONSE!', (user as any).lotsWon);
    }
    if ((user as any)?.bids) {
        console.error('UserService.getUserById: FOUND BIDS IN USER RESPONSE!', (user as any).bids);
    }
    return this.formatUser(user);
  }
  
  async findUserByEmail(email: string): Promise<UserProfileWithPermissions | null> {
    const user = await this.userRepository.findByEmail(email);
    return this.formatUser(user);
  }

  async findFirst(args: Prisma.UserFindFirstArgs): Promise<UserProfileWithPermissions | null> {
    const user = await this.prisma.user.findFirst(args);
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
        
        let finalRoleIds: string[] = providedRoleIds || [];
        if (finalRoleIds.length === 0) {
          const userRole = await this.roleRepository.findByNormalizedName('USER');
          if (!userRole) {
            throw new Error("O perfil padrão 'USER' não foi encontrado. Popule os dados essenciais primeiro.");
          }
          finalRoleIds.push(userRole.id.toString());
        }

        const dataToCreate: Prisma.UserCreateInput = {
            ...(userData as any),
            password: hashedPassword,
            roles: {
                create: finalRoleIds.map(roleId => ({
                    role: { connect: { id: BigInt(roleId) } },
                    assignedBy: 'system-signup'
                }))
            },
            tenants: {
                create: tenantId ? [{
                    tenant: { connect: { id: BigInt(tenantId) } },
                    assignedBy: 'system-signup'
                }] : []
            }
        };
        
        const newUser = await this.userRepository.create(dataToCreate);
        return { success: true, message: 'Usuário criado com sucesso.', userId: newUser.id.toString() };
    } catch (error: any) {
        console.error(`Error in UserService.createUser for email ${data.email}:`, error);
        return { success: false, message: `Falha ao criar usuário: ${error.message}` };
    }
  }
  
  async updateUserRoles(userId: string, roleIds: string[]): Promise<{ success: boolean; message: string }> {
    console.log('[UserService.updateUserRoles] Iniciando atualização de perfis');
    console.log('[UserService.updateUserRoles] userId:', userId);
    console.log('[UserService.updateUserRoles] roleIds:', roleIds.map(id => id.toString()));
    
    try {
      const user = await this.userRepository.findById(BigInt(userId));
      
      if(!user) {
        console.error('[UserService.updateUserRoles] Usuário não encontrado');
        return { success: false, message: 'Usuário não encontrado.'};
      }

      console.log('[UserService.updateUserRoles] Usuário encontrado:', {
        id: user.id.toString(),
        email: user.email,
        currentRoles: user.roles?.map((r: any) => ({ id: r.roleId.toString(), name: r.role.name }))
      });

      const tenantIds = user.tenants?.map((t: any) => t.tenantId) || [];
      console.log('[UserService.updateUserRoles] tenantIds do usuário:', tenantIds.map(id => id.toString()));

      const roleIdsAsBigInt = roleIds.map(id => BigInt(id));
      console.log('[UserService.updateUserRoles] Chamando repository.updateUserRoles...');
      
      await this.userRepository.updateUserRoles(BigInt(userId), tenantIds, roleIdsAsBigInt);
      
      console.log('[UserService.updateUserRoles] Perfis atualizados com sucesso no repositório');
      
      // Verificar se realmente atualizou
      const updatedUser = await this.userRepository.findById(BigInt(userId));
      console.log('[UserService.updateUserRoles] Perfis após atualização:', 
        updatedUser?.roles?.map((r: any) => ({ id: r.roleId.toString(), name: r.role.name }))
      );
      
      return { success: true, message: "Perfis do usuário atualizados com sucesso." };
    } catch (error: any) {
      console.error(`[UserService.updateUserRoles] Erro ao atualizar perfis para userId ${userId}:`, error);
      return { success: false, message: `Falha ao atualizar perfis: ${error.message}` };
    }
  }


  async updateUserProfile(userId: string, data: EditableUserProfileData): Promise<{ success: boolean; message: string; }> {
    try {
        const dataToUpdate: any = { ...data };
        if ((data as any).password && (data as any).password.length >= 6) {
          dataToUpdate.password = await bcrypt.hash((data as any).password, 10);
        } else {
          delete dataToUpdate.password;
        }

        await this.userRepository.update(BigInt(userId), dataToUpdate);
        return { success: true, message: "Perfil atualizado com sucesso."};
    } catch (error: any) {
        console.error(`Error updating user profile for ${userId}:`, error);
        return { success: false, message: "Erro ao salvar as informações do perfil."}
    }
  }

  async deleteUser(id: string): Promise<{ success: boolean; message: string; }> {
    try {
        await basePrisma.$transaction([
            basePrisma.usersOnRoles.deleteMany({ where: { userId: BigInt(id) } }),
            basePrisma.usersOnTenants.deleteMany({ where: { userId: BigInt(id) } }),
            basePrisma.userDocument.deleteMany({ where: { userId: BigInt(id) } }),
            basePrisma.bid.deleteMany({ where: { bidderId: BigInt(id) } }),
            basePrisma.userWin.deleteMany({ where: { userId: BigInt(id) } }),
            basePrisma.userLotMaxBid.deleteMany({ where: { userId: BigInt(id) } }),
            basePrisma.user.delete({ where: { id: BigInt(id) } }),
        ]);
        return { success: true, message: "Usuário e todos os dados relacionados foram excluídos." };
    } catch (error: any) {
        console.error(`Error in UserService.deleteUser for id ${id}:`, error);
        return { success: false, message: `Falha ao excluir usuário: ${error.message}` };
    }
  }

  async deleteAllUsers(): Promise<{ success: boolean; message: string; }> {
    try {
      const users = await this.userRepository.findAll();
      for (const user of users) {
        if (user.email !== 'admin@bidexpert.com.br') {
          await this.deleteUser(user.id.toString());
        }
      }
      return { success: true, message: 'Todos os usuários não-administradores foram excluídos.' };
    } catch (error: any) {
      return { success: false, message: 'Falha ao excluir todos os usuários.' };
    }
  }

  async checkAndHabilitateUser(userId: string): Promise<void> {
    const user = await basePrisma.user.findUnique({
      where: { id: BigInt(userId) },
      include: { documents: true, tenants: true }
    }) as any;

    if (!user || user.habilitationStatus === 'HABILITADO') {
      return; 
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
      user.documents?.filter((d: any) => d.status === 'APPROVED').map((d: any) => d.documentTypeId.toString()) || []
    );

    const allRequiredDocsApproved = requiredDocTypes.every(
      requiredDoc => submittedApprovedDocTypeIds.has(requiredDoc.id.toString())
    );

    if (allRequiredDocsApproved) {
      await basePrisma.user.update({
        where: { id: BigInt(userId) },
        data: { habilitationStatus: 'HABILITADO' }
      });
      const bidderRole = await this.roleRepository.findByNormalizedName('BIDDER');
      if (bidderRole && user.tenants) {
        for (const userTenant of user.tenants) {
            await basePrisma.usersOnRoles.createMany({
                data: [{ 
                    userId: BigInt(userId), 
                    roleId: bidderRole.id, 
                    assignedBy: 'system-habilitation' 
                }],
                skipDuplicates: true,
            });
        }
      }
    } else if (user.documents && user.documents.length > 0) {
      // If there are documents, but not all approved, and status is not REJECTED_DOCUMENTS, set to PENDING_ANALYSIS
      // This ensures that after uploading, the user appears in the admin list
      if (user.habilitationStatus !== 'REJECTED_DOCUMENTS' && user.habilitationStatus !== 'PENDING_ANALYSIS') {
          await basePrisma.user.update({
            where: { id: BigInt(userId) },
            data: { habilitationStatus: 'PENDING_ANALYSIS' }
          });
      }
    }
  }
}
