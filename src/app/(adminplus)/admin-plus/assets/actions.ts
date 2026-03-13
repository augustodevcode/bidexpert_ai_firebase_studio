/**
 * @fileoverview Server Actions para Asset — Admin Plus.
 */
'use server';

import { prisma } from '@/lib/prisma';
import { createAdminAction } from '@/lib/admin-plus/safe-action';
import { sanitizeResponse } from '@/lib/serialization-helper';
import type { AssetRow } from './types';

function generatePublicId(): string {
  return `AS-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`.toUpperCase();
}

function toRow(r: Record<string, unknown>): AssetRow {
  const cat = r.LotCategory as Record<string, unknown> | undefined;
  const sub = r.Subcategory as Record<string, unknown> | undefined;
  const sel = r.Seller as Record<string, unknown> | undefined;
  const jp = r.JudicialProcess as Record<string, unknown> | undefined;
  return {
    id: String(r.id),
    publicId: String(r.publicId ?? ''),
    title: String(r.title ?? ''),
    description: String(r.description ?? ''),
    status: String(r.status ?? ''),
    categoryId: r.categoryId ? String(r.categoryId) : '',
    categoryName: cat ? String(cat.name ?? '') : '',
    subcategoryId: r.subcategoryId ? String(r.subcategoryId) : '',
    subcategoryName: sub ? String(sub.name ?? '') : '',
    sellerId: r.sellerId ? String(r.sellerId) : '',
    sellerName: sel ? String(sel.name ?? '') : '',
    judicialProcessId: r.judicialProcessId ? String(r.judicialProcessId) : '',
    judicialProcessNumber: jp ? String(jp.processNumber ?? '') : '',
    evaluationValue: r.evaluationValue != null ? Number(r.evaluationValue) : null,
    imageUrl: String(r.imageUrl ?? ''),
    locationCity: String(r.locationCity ?? ''),
    locationState: String(r.locationState ?? ''),
    address: String(r.address ?? ''),
    plate: String(r.plate ?? ''),
    make: String(r.make ?? ''),
    model: String(r.model ?? ''),
    year: r.year != null ? Number(r.year) : null,
    mileage: r.mileage != null ? Number(r.mileage) : null,
    color: String(r.color ?? ''),
    fuelType: String(r.fuelType ?? ''),
    totalArea: r.totalArea != null ? Number(r.totalArea) : null,
    builtArea: r.builtArea != null ? Number(r.builtArea) : null,
    bedrooms: r.bedrooms != null ? Number(r.bedrooms) : null,
    parkingSpaces: r.parkingSpaces != null ? Number(r.parkingSpaces) : null,
    createdAt: r.createdAt ? new Date(r.createdAt as string).toISOString() : '',
  };
}

export const listAssets = createAdminAction(async (ctx, params: { page: number; pageSize: number; search?: string; sortField?: string; sortOrder?: string }) => {
  const { page, pageSize, search, sortField, sortOrder } = params;
  const where: Record<string, unknown> = { tenantId: ctx.tenantIdBigInt };
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { publicId: { contains: search } },
    ];
  }
  const [data, total] = await Promise.all([
    prisma.asset.findMany({
      where,
      include: {
        LotCategory: { select: { name: true } },
        Subcategory: { select: { name: true } },
        Seller: { select: { name: true } },
        JudicialProcess: { select: { processNumber: true } },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: sortField ? { [sortField]: sortOrder ?? 'asc' } : { createdAt: 'desc' },
    }),
    prisma.asset.count({ where }),
  ]);
  return sanitizeResponse({ data: data.map((d) => toRow(d as unknown as Record<string, unknown>)), total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
});

export const createAsset = createAdminAction(async (ctx, values: Record<string, unknown>) => {
  const rec = await prisma.asset.create({
    data: {
      publicId: generatePublicId(),
      title: String(values.title),
      description: values.description ? String(values.description) : null,
      status: (values.status as string) || 'DISPONIVEL',
      categoryId: values.categoryId ? BigInt(values.categoryId as string) : null,
      subcategoryId: values.subcategoryId ? BigInt(values.subcategoryId as string) : null,
      sellerId: values.sellerId ? BigInt(values.sellerId as string) : null,
      judicialProcessId: values.judicialProcessId ? BigInt(values.judicialProcessId as string) : null,
      evaluationValue: values.evaluationValue ? Number(values.evaluationValue) : null,
      imageUrl: values.imageUrl ? String(values.imageUrl) : null,
      locationCity: values.locationCity ? String(values.locationCity) : null,
      locationState: values.locationState ? String(values.locationState) : null,
      address: values.address ? String(values.address) : null,
      plate: values.plate ? String(values.plate) : null,
      make: values.make ? String(values.make) : null,
      model: values.model ? String(values.model) : null,
      year: values.year ? Number(values.year) : null,
      mileage: values.mileage ? Number(values.mileage) : null,
      color: values.color ? String(values.color) : null,
      fuelType: values.fuelType ? String(values.fuelType) : null,
      totalArea: values.totalArea ? Number(values.totalArea) : null,
      builtArea: values.builtArea ? Number(values.builtArea) : null,
      bedrooms: values.bedrooms ? Number(values.bedrooms) : null,
      parkingSpaces: values.parkingSpaces ? Number(values.parkingSpaces) : null,
      tenantId: ctx.tenantIdBigInt,
      updatedAt: new Date(),
    },
  });
  return sanitizeResponse(rec);
});

export const updateAsset = createAdminAction(async (ctx, id: string, values: Record<string, unknown>) => {
  const data: Record<string, unknown> = {
    title: String(values.title),
    updatedAt: new Date(),
  };
  if (values.description !== undefined) data.description = values.description ? String(values.description) : null;
  if (values.status) data.status = values.status;
  if (values.categoryId !== undefined) data.categoryId = values.categoryId ? BigInt(values.categoryId as string) : null;
  if (values.subcategoryId !== undefined) data.subcategoryId = values.subcategoryId ? BigInt(values.subcategoryId as string) : null;
  if (values.sellerId !== undefined) data.sellerId = values.sellerId ? BigInt(values.sellerId as string) : null;
  if (values.judicialProcessId !== undefined) data.judicialProcessId = values.judicialProcessId ? BigInt(values.judicialProcessId as string) : null;
  if (values.evaluationValue !== undefined) data.evaluationValue = values.evaluationValue ? Number(values.evaluationValue) : null;
  if (values.imageUrl !== undefined) data.imageUrl = values.imageUrl ? String(values.imageUrl) : null;
  if (values.locationCity !== undefined) data.locationCity = values.locationCity ? String(values.locationCity) : null;
  if (values.locationState !== undefined) data.locationState = values.locationState ? String(values.locationState) : null;
  if (values.address !== undefined) data.address = values.address ? String(values.address) : null;
  if (values.plate !== undefined) data.plate = values.plate ? String(values.plate) : null;
  if (values.make !== undefined) data.make = values.make ? String(values.make) : null;
  if (values.model !== undefined) data.model = values.model ? String(values.model) : null;
  if (values.year !== undefined) data.year = values.year ? Number(values.year) : null;
  if (values.mileage !== undefined) data.mileage = values.mileage ? Number(values.mileage) : null;
  if (values.color !== undefined) data.color = values.color ? String(values.color) : null;
  if (values.fuelType !== undefined) data.fuelType = values.fuelType ? String(values.fuelType) : null;
  if (values.totalArea !== undefined) data.totalArea = values.totalArea ? Number(values.totalArea) : null;
  if (values.builtArea !== undefined) data.builtArea = values.builtArea ? Number(values.builtArea) : null;
  if (values.bedrooms !== undefined) data.bedrooms = values.bedrooms ? Number(values.bedrooms) : null;
  if (values.parkingSpaces !== undefined) data.parkingSpaces = values.parkingSpaces ? Number(values.parkingSpaces) : null;
  const rec = await prisma.asset.update({
    where: { id: BigInt(id), tenantId: ctx.tenantIdBigInt },
    data,
  });
  return sanitizeResponse(rec);
});

export const deleteAsset = createAdminAction(async (ctx, id: string) => {
  await prisma.asset.delete({ where: { id: BigInt(id), tenantId: ctx.tenantIdBigInt } });
  return { deleted: true };
});
