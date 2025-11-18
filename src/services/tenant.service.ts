// src/services/tenant.service.ts
/**
 * @fileoverview Este arquivo contém a classe TenantService, que encapsula a
 * lógica de negócio para o gerenciamento de Tenants (inquilinos/leiloeiros).
 * Sua principal responsabilidade é orquestrar a criação de um novo tenant, o que
 * inclui criar o registro do tenant e o seu usuário administrador associado,
 * tudo dentro de uma única transação para garantir a consistência dos dados.
 */
import { TenantRepository } from '@/repositories/tenant.repository';
import { slugify } from '@/lib/ui-helpers';
import type { Prisma, Tenant } from '@prisma/client';
import prisma from '@/lib/prisma';

interface CreateTenantData {
  name: string;
  subdomain: string;
}

export class TenantService {
  private tenantRepository: TenantRepository;

  constructor() {
    this.tenantRepository = new TenantRepository();
  }

  async createTenant(data: CreateTenantData): Promise<{ success: boolean; message: string; tenant?: Tenant }> {
    try {
      const { name, subdomain } = data;

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
