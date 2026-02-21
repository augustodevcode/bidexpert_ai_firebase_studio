import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * @vitest-environment node
 * BDD: Garantir que CategoryRepository.create retorna IDs serializados como string.
 * TDD: Mockar prisma.lotCategory.create e validar conversão de BigInt para string.
 */
vi.mock('@/lib/prisma', () => {
  const lotCategoryMock = {
    create: vi.fn(),
  };

  const prismaMock = {
    lotCategory: lotCategoryMock,
  };

  return {
    prisma: prismaMock,
    default: prismaMock,
  };
});

import { prisma as mockedPrisma } from '@/lib/prisma';
import { CategoryRepository } from '@/repositories/category.repository';

describe('CategoryRepository', () => {
  const repository = new CategoryRepository();

  beforeEach(() => {
    mockedPrisma.lotCategory.create.mockReset();
  });

  it('serializa id BigInt para string no create', async () => {
    mockedPrisma.lotCategory.create.mockResolvedValueOnce({
      id: 5n,
      slug: 'cars',
      name: 'Cars',
      description: null,
      logoUrl: null,
      logoMediaId: null,
      dataAiHintLogo: null,
      coverImageUrl: null,
      coverImageMediaId: null,
      dataAiHintCover: null,
      megaMenuImageUrl: null,
      megaMenuImageMediaId: null,
      dataAiHintMegaMenu: null,
      hasSubcategories: false,
      isGlobal: true,
      tenantId: 2n,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const result = await repository.create({ name: 'Cars', slug: 'cars' } as any);

    expect(result.id).toBe('5');
    expect(mockedPrisma.lotCategory.create).toHaveBeenCalledWith({ data: { name: 'Cars', slug: 'cars' } });
  });
});
