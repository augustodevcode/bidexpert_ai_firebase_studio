// src/services/tenant.service.ts
/**
 * @fileoverview Este arquivo contém a classe TenantService, que encapsula a
 * lógica de negócio para o gerenciamento de Tenants (inquilinos/leiloeiros).
 * Sua principal responsabilidade é orquestrar a criação de um novo tenant, o que
 * inclui criar o registro do tenant e o seu usuário administrador associado,
 * tudo dentro de uma única transação para garantir a consistência dos dados.
 */
import { TenantRepository } from '@/repositories/tenant.repository';
import { UserRepository } from '@/repositories/user.repository';
import { RoleRepository } from '@/repositories/role.repository';
import { slugify } from '@/lib/ui-helpers';
import bcrypt from 'bcryptjs';
import type { Prisma, Tenant, User } from '@prisma/client';
import { prisma } from '@/lib/prisma';

interface CreateTenantData {
  name: string;
  subdomain: string;
  adminUser: {
    email: string;
    fullName: string;
    password?: string;
  };
}

export class TenantService {
  private tenantRepository: TenantRepository;
  private userRepository: UserRepository;
  private roleRepository: RoleRepository;

  constructor() {
    this.tenantRepository = new TenantRepository();
    this.userRepository = new UserRepository();
    this.roleRepository = new RoleRepository();
  }

  async createTenant(data: CreateTenantData): Promise<{ success: boolean; message: string; tenant?: Tenant, user?: User }> {
    try {
      const { name, subdomain, adminUser } = data;

      // 1. Validate subdomain
      const cleanSubdomain = slugify(subdomain);
      const existingTenant = await this.tenantRepository.findBySubdomain(cleanSubdomain);
      if (existingTenant) {
        return { success: false, message: `O subdomínio '${cleanSubdomain}' já está em uso.` };
      }

      // 2. Validate admin user email
      const existingUser = await prisma.user.findFirst({ where: { email: adminUser.email }});
      if (existingUser) {
        return { success: false, message: `O email '${adminUser.email}' já está em uso por outro usuário.` };
      }
      
      // 3. Get the TENANT_ADMIN role
      const tenantAdminRole = await this.roleRepository.findByNormalizedName('TENANT_ADMIN');
      if (!tenantAdminRole) {
          throw new Error("O perfil 'TENANT_ADMIN' não foi encontrado. Execute o seed de dados essenciais.");
      }

      // 4. Create Tenant and User within a transaction
      const { tenant, user } = await prisma.$transaction(async (tx) => {
        // Create the tenant
        const newTenant = await tx.tenant.create({
          data: {
            name,
            subdomain: cleanSubdomain,
          },
        });

        // Create the admin user for the tenant
        const hashedPassword = await bcrypt.hash(adminUser.password || 'password123', 10);
        const newUser = await tx.user.create({
          data: {
            email: adminUser.email,
            fullName: adminUser.fullName,
            password: hashedPassword,
            habilitationStatus: 'HABILITADO',
            accountType: 'LEGAL',
          },
        });
        
        // Link user to the tenant and assign the role
        await tx.usersOnTenants.create({
          data: {
            userId: newUser.id,
            tenantId: newTenant.id,
            assignedBy: 'system-onboarding',
          },
        });

        await tx.usersOnRoles.create({
            data: {
                userId: newUser.id,
                roleId: tenantAdminRole.id,
                assignedBy: 'system-onboarding',
            }
        });
        
        return { tenant: newTenant, user: newUser };
      });
      
      return { success: true, message: 'Tenant e usuário administrador criados com sucesso.', tenant, user };

    } catch (error: any) {
      console.error("[TenantService] Error creating tenant:", error);
      return { success: false, message: `Falha ao criar tenant: ${error.message}` };
    }
  }
}
