// src/repositories/role.repository.ts
import { prisma } from '@/lib/prisma'; // Usa a instância base para modelos globais
import type { Role } from '@/types';
import type { Prisma } from '@prisma/client';

export class RoleRepository {
  async findAll(): Promise<Role[]> {
    // @ts-ignore
    return prisma.role.findMany({ orderBy: { name: 'asc' } });
  }

  async findById(id: bigint): Promise<Role | null> {
    // @ts-ignore
    return prisma.role.findUnique({ where: { id } });
  }
  
  async findByName(name: string): Promise<Role | null> {
    return prisma.role.findUnique({ where: { name } });
  }
  
  async findByNormalizedName(nameNormalized: string): Promise<Role | null> {
    return prisma.role.findUnique({ where: { nameNormalized } });
  }

  async create(data: Prisma.RoleCreateInput): Promise<Role> {
    // @ts-ignore
    return prisma.role.create({ data });
  }

  async update(id: bigint, data: Prisma.RoleUpdateInput): Promise<Role> {
    // @ts-ignore
    return prisma.role.update({ where: { id }, data });
  }

  async delete(id: bigint): Promise<void> {
    await prisma.role.delete({ where: { id } });
  }
}