/**
 * @fileoverview Server Actions para CRUD de Tipos de Documento no Admin Plus.
 * Usa prisma diretamente para operações não disponíveis no DocumentTypeService.
 */
'use server';

import { z } from 'zod';
import { createAdminAction } from '@/lib/admin-plus/safe-action';
import { prisma } from '@/lib/prisma';
import { createDocumentTypeSchema, updateDocumentTypeSchema } from './schema';

type DocTypeRow = {
  id: string;
  name: string;
  description: string | null;
  isRequired: boolean;
  appliesTo: string;
};

function serializeDocType(row: { id: bigint; name: string; description: string | null; isRequired: boolean; appliesTo: string }): DocTypeRow {
  return { ...row, id: String(row.id) };
}

export const listDocumentTypesAction = createAdminAction({
  requiredPermission: 'document-types:read',
  handler: async () => {
    const rows = await prisma.documentType.findMany({ orderBy: { name: 'asc' } });
    const data = rows.map(serializeDocType);
    return { data, total: data.length, page: 1, pageSize: data.length || 25, totalPages: 1 };
  },
});

export const getDocumentTypeByIdAction = createAdminAction({
  requiredPermission: 'document-types:read',
  inputSchema: z.object({ id: z.string() }),
  handler: async ({ input }) => {
    const row = await prisma.documentType.findUnique({ where: { id: BigInt(input.id) } });
    if (!row) throw new Error('Tipo de documento não encontrado');
    return serializeDocType(row);
  },
});

export const createDocumentTypeAction = createAdminAction({
  requiredPermission: 'document-types:create',
  inputSchema: createDocumentTypeSchema,
  handler: async ({ input }) => {
    const existing = await prisma.documentType.findFirst({ where: { name: input.name } });
    if (existing) throw new Error('Já existe um tipo com esse nome');
    const row = await prisma.documentType.create({
      data: {
        name: input.name,
        description: input.description || null,
        isRequired: input.isRequired,
        appliesTo: input.appliesTo,
      },
    });
    return { id: String(row.id) };
  },
});

export const updateDocumentTypeAction = createAdminAction({
  requiredPermission: 'document-types:update',
  inputSchema: z.object({ id: z.string(), data: updateDocumentTypeSchema }),
  handler: async ({ input }) => {
    const payload: Record<string, unknown> = {};
    if (input.data.name !== undefined) payload.name = input.data.name;
    if (input.data.description !== undefined) payload.description = input.data.description || null;
    if (input.data.isRequired !== undefined) payload.isRequired = input.data.isRequired;
    if (input.data.appliesTo !== undefined) payload.appliesTo = input.data.appliesTo;
    await prisma.documentType.update({ where: { id: BigInt(input.id) }, data: payload });
  },
});

export const deleteDocumentTypeAction = createAdminAction({
  requiredPermission: 'document-types:delete',
  inputSchema: z.object({ id: z.string() }),
  handler: async ({ input }) => {
    await prisma.documentType.delete({ where: { id: BigInt(input.id) } });
  },
});
