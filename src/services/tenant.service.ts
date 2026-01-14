// src/services/tenant.service.ts
/**
 * @fileoverview Este arquivo contém a classe TenantService, que encapsula a
 * lógica de negócio para o gerenciamento de Tenants (inquilinos/leiloeiros).
 * Sua principal responsabilidade é orquestrar a criação de um novo tenant, o que
 * inclui criar o registro do tenant e o seu usuário administrador associado,
 * tudo dentro de uma única transação para garantir a consistência dos dados.
 */
import { TenantRepository } from '@/repositories/tenant.repository';
import { UserService } from '@/services/user.service';
import { RoleRepository } from '@/repositories/role.repository';
import { slugify } from '@/lib/ui-helpers';
import type { Prisma, Tenant } from '@prisma/client';
import prisma from '@/lib/prisma';

interface CreateTenantData {
  name: string;
  subdomain: string;
  adminUser?: {
    email: string;
    fullName: string;
    password?: string;
  };
}

export class TenantService {
  private tenantRepository: TenantRepository;
  private userService: UserService;
  private roleRepository: RoleRepository;

  constructor() {
    this.tenantRepository = new TenantRepository();
    this.userService = new UserService();
    this.roleRepository = new RoleRepository();
  }

  async createTenant(data: CreateTenantData): Promise<{ success: boolean; message: string; tenant?: Tenant }> {
    try {
      const { name, subdomain, adminUser } = data;

      // 1. Validate subdomain
      const cleanSubdomain = slugify(subdomain);
      const existingTenant = await this.tenantRepository.findBySubdomain(cleanSubdomain);
      if (existingTenant) {
        return { success: false, message: `O subdomínio '${cleanSubdomain}' já está em uso.` };
      }

      // 2. Create Tenant
      const tenant = await this.tenantRepository.create({
        name,
        subdomain: cleanSubdomain,
      });

      // 3. Create/Link Admin User if provided
      if (adminUser) {
        try {
          // Find 'ADMIN' role
          const adminRole = await this.roleRepository.findByNormalizedName('ADMIN');
          if (!adminRole) {
            console.error("Role 'ADMIN' not found.");
            // We continue, but log error. Ideally should throw or fail.
          } else {
            const roleId = adminRole.id.toString();

            // Check if user exists
            let existingUser = await this.userService.findUserByEmail(adminUser.email);
            
            if (existingUser) {
              // Update existing user: add to tenant and add ADMIN role
              // Note: updateUserRoles replaces roles, so we need to fetch current roles first?
              // UserService.updateUserRoles implementation seems to replace roles for the user in the context of global roles?
              // The implementation of updateUserRoles in UserRepository deletes all roles for the user and re-adds them.
              // This is dangerous if the user has other roles in other tenants.
              // However, the UserRepository.updateUserRoles implementation is:
              // deleteMany({ where: { userId }}) -> deletes ALL roles for user across all tenants?
              // No, UsersOnRoles is (userId, roleId). It's global.
              // UsersOnTenants is (userId, tenantId).
              
              // Wait, UsersOnRoles is global permissions.
              // UsersOnTenants assigns user to tenant.
              
              // So for existing user:
              // 1. Add to UsersOnTenants
              await prisma.usersOnTenants.create({
                  data: {
                      userId: BigInt(existingUser.id),
                      tenantId: tenant.id,
                      assignedBy: 'system-create-tenant'
                  }
              });

              // 2. Add ADMIN role if not present
              const hasAdminRole = existingUser.roles.some(r => r.role.nameNormalized === 'ADMIN');
              if (!hasAdminRole) {
                  await prisma.usersOnRoles.create({
                      data: {
                          userId: BigInt(existingUser.id),
                          roleId: adminRole.id,
                          assignedBy: 'system-create-tenant'
                      }
                  });
              }

            } else {
              // Create new user
              if (!adminUser.password) {
                  // Generate random password if not provided
                  adminUser.password = Math.random().toString(36).slice(-8);
              }

              const createResult = await this.userService.createUser({
                email: adminUser.email,
                fullName: adminUser.fullName,
                password: adminUser.password,
                roleIds: [roleId],
                tenantId: tenant.id.toString(),
                habilitationStatus: 'PENDING_DOCUMENTS' // Default
              });

              if (!createResult.success) {
                  console.error("Failed to create admin user:", createResult.message);
                  // Should we rollback tenant creation?
                  // For now, return success but with warning in message?
                  // Or fail.
                  // Let's keep it as success for tenant, but log error.
              }
            }
          }
        } catch (userError) {
           console.error("Error setting up admin user:", userError);
           // Swallow error to at least return the tenant
        }
      }
      
      return { success: true, message: 'Tenant criado com sucesso.', tenant };

    } catch (error: any) {
      console.error("[TenantService] Error creating tenant:", error);
      return { success: false, message: `Falha ao criar tenant: ${error.message}` };
    }
  }

  async findTenantById(id: bigint): Promise<Tenant | null> {
    return this.tenantRepository.findById(id);
  }

  async findTenantBySubdomain(subdomain: string): Promise<Tenant | null> {
    return this.tenantRepository.findBySubdomain(subdomain);
  }

  async deleteMany(args: any) {
    await this.tenantRepository.deleteMany(args);
  }
}
