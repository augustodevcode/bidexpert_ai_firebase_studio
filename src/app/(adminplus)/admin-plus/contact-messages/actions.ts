/**
 * Server Actions para CRUD de ContactMessage (Mensagens de Contato).
 * Nota: ContactMessage NÃO tem tenantId — é global.
 */
'use server';

import { createAdminAction } from '@/lib/admin-plus/safe-action';
import { prisma } from '@/lib/prisma';
import { sanitizeResponse } from '@/lib/serialization-helper';
import { contactMessageSchema } from './schema';
import type { ContactMessageRow } from './types';

function toRow(r: any): ContactMessageRow {
  return {
    id: r.id.toString(),
    name: r.name,
    email: r.email,
    phone: r.phone ?? '',
    subject: r.subject ?? '',
    message: r.message,
    isRead: r.isRead,
    createdAt: r.createdAt?.toISOString?.() ?? r.createdAt,
  };
}

export const listContactMessages = createAdminAction({
  requiredPermission: 'manage_all',
  handler: async ({ page = 1, pageSize = 10, search = '', sortField, sortOrder }) => {
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { subject: { contains: search } },
      ];
    }
    const orderBy = sortField ? { [sortField]: sortOrder || 'asc' } : { createdAt: 'desc' as const };
    const [data, total] = await Promise.all([
      prisma.contactMessage.findMany({ where, orderBy, skip: (page - 1) * pageSize, take: pageSize }),
      prisma.contactMessage.count({ where }),
    ]);
    return sanitizeResponse({ data: data.map(toRow), total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  },
});

export const getContactMessage = createAdminAction({
  requiredPermission: 'manage_all',
  handler: async ({ id }: { id: string }) => {
    const r = await prisma.contactMessage.findUniqueOrThrow({ where: { id: BigInt(id) } });
    return sanitizeResponse(toRow(r));
  },
});

export const createContactMessage = createAdminAction({
  requiredPermission: 'manage_all',
  handler: async (input: Record<string, unknown>) => {
    const parsed = contactMessageSchema.parse(input);
    const r = await prisma.contactMessage.create({
      data: {
        name: parsed.name,
        email: parsed.email,
        phone: parsed.phone || null,
        subject: parsed.subject || null,
        message: parsed.message,
        isRead: parsed.isRead ?? false,
      },
    });
    return sanitizeResponse(toRow(r));
  },
});

export const updateContactMessage = createAdminAction({
  requiredPermission: 'manage_all',
  handler: async (input: Record<string, unknown>) => {
    const { id, ...rest } = input as any;
    const parsed = contactMessageSchema.parse(rest);
    const r = await prisma.contactMessage.update({
      where: { id: BigInt(id) },
      data: {
        name: parsed.name,
        email: parsed.email,
        phone: parsed.phone || null,
        subject: parsed.subject || null,
        message: parsed.message,
        isRead: parsed.isRead ?? false,
      },
    });
    return sanitizeResponse(toRow(r));
  },
});

export const deleteContactMessage = createAdminAction({
  requiredPermission: 'manage_all',
  handler: async ({ id }: { id: string }) => {
    await prisma.contactMessage.delete({ where: { id: BigInt(id) } });
    return { deleted: true };
  },
});
