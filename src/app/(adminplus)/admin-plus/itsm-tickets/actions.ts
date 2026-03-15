/**
 * Server Actions para CRUD de ITSM_Ticket no Admin Plus.
 * Tickets de suporte — tenantId nullable.
 */
'use server';

import { prisma } from '@/lib/prisma';
import { createAdminAction } from '@/lib/admin-plus/safe-action';
import { sanitizeResponse } from '@/lib/serialization-helper';
import type { ItsmTicketRow } from './types';
import type { ItsmTicketFormData } from './schema';

function toRow(r: any): ItsmTicketRow {
  return {
    id: r.id.toString(),
    publicId: r.publicId,
    userId: r.userId.toString(),
    userName: r.User_itsm_tickets_userIdToUser?.fullName ?? '-',
    title: r.title,
    description: r.description,
    status: r.status,
    priority: r.priority,
    category: r.category,
    assignedToUserId: r.assignedToUserId?.toString() ?? '',
    assignedToUserName: r.User_itsm_tickets_assignedToUserIdToUser?.fullName ?? '',
    browserInfo: r.browserInfo ?? '',
    screenSize: r.screenSize ?? '',
    pageUrl: r.pageUrl ?? '',
    userAgent: r.userAgent ?? '',
    createdAt: r.createdAt?.toISOString() ?? '',
    updatedAt: r.updatedAt?.toISOString() ?? '',
    resolvedAt: r.resolvedAt?.toISOString() ?? '',
    closedAt: r.closedAt?.toISOString() ?? '',
  };
}

const include = {
  User_itsm_tickets_userIdToUser: { select: { fullName: true } },
  User_itsm_tickets_assignedToUserIdToUser: { select: { fullName: true } },
};

/* ── list ── */
export const listItsmTickets = createAdminAction(async (ctx, params: { page: number; pageSize: number; sortField?: string; sortDirection?: string; search?: string }) => {
  const where: any = { OR: [{ tenantId: ctx.tenantIdBigInt }, { tenantId: null }] };
  if (params.search) { where.AND = [{ OR: [{ title: { contains: params.search } }, { publicId: { contains: params.search } }, { User_itsm_tickets_userIdToUser: { fullName: { contains: params.search } } }] }]; }
  const orderBy = params.sortField ? { [params.sortField]: params.sortDirection || 'asc' } : { createdAt: 'desc' as const };
  const [data, total] = await Promise.all([
    prisma.iTSM_Ticket.findMany({ where, include, orderBy, skip: (params.page - 1) * params.pageSize, take: params.pageSize }),
    prisma.iTSM_Ticket.count({ where }),
  ]);
  return sanitizeResponse({ data: data.map(toRow), total, page: params.page, pageSize: params.pageSize, totalPages: Math.ceil(total / params.pageSize) });
});

/* ── create ── */
export const createItsmTicket = createAdminAction(async (ctx, data: ItsmTicketFormData) => {
  const publicId = `TK-${Date.now().toString(36).toUpperCase()}`;
  const record = await prisma.iTSM_Ticket.create({
    data: {
      publicId,
      userId: BigInt(data.userId),
      title: data.title,
      description: data.description,
      status: data.status as any,
      priority: data.priority as any,
      category: data.category as any,
      assignedToUserId: data.assignedToUserId ? BigInt(data.assignedToUserId) : null,
      browserInfo: data.browserInfo || null,
      screenSize: data.screenSize || null,
      pageUrl: data.pageUrl || null,
      userAgent: data.userAgent || null,
      tenantId: ctx.tenantIdBigInt,
      updatedAt: new Date(),
    },
    include,
  });
  return sanitizeResponse(toRow(record));
});

/* ── update ── */
export const updateItsmTicket = createAdminAction(async (_ctx, params: { id: string; data: ItsmTicketFormData }) => {
  const updateData: any = {
    userId: BigInt(params.data.userId),
    title: params.data.title,
    description: params.data.description,
    status: params.data.status as any,
    priority: params.data.priority as any,
    category: params.data.category as any,
    assignedToUserId: params.data.assignedToUserId ? BigInt(params.data.assignedToUserId) : null,
    browserInfo: params.data.browserInfo || null,
    screenSize: params.data.screenSize || null,
    pageUrl: params.data.pageUrl || null,
    userAgent: params.data.userAgent || null,
  };
  if (params.data.status === 'RESOLVIDO') updateData.resolvedAt = new Date();
  if (params.data.status === 'FECHADO' || params.data.status === 'CANCELADO') updateData.closedAt = new Date();
  const record = await prisma.iTSM_Ticket.update({ where: { id: BigInt(params.id) }, data: updateData, include });
  return sanitizeResponse(toRow(record));
});

/* ── delete ── */
export const deleteItsmTicket = createAdminAction(async (_ctx, params: { id: string }) => {
  await prisma.iTSM_Ticket.delete({ where: { id: BigInt(params.id) } });
  return { id: params.id };
});
