/**
 * @fileoverview Testes unitários (BDD/TDD) para seed mínimo de 50 registros.
 */
import { describe, it, expect, vi } from 'vitest';
import { seedMin50ZeroTables } from '../../scripts/seed-min-50-lib';

vi.mock('../../src/lib/prisma', () => {
  const prisma = {
    dataSource: { count: vi.fn().mockResolvedValue(0), createMany: vi.fn() },
    report: { count: vi.fn().mockResolvedValue(0) },
    subscriber: { count: vi.fn().mockResolvedValue(0) },
    contactMessage: { count: vi.fn().mockResolvedValue(0) },
    passwordResetToken: { count: vi.fn().mockResolvedValue(0), createMany: vi.fn() },
    tenantInvoice: { count: vi.fn().mockResolvedValue(0), createMany: vi.fn() },
    formSubmission: { count: vi.fn().mockResolvedValue(0), createMany: vi.fn() },
    itsmTicket: { count: vi.fn().mockResolvedValue(1), findMany: vi.fn().mockResolvedValue([{ id: 1n }]), create: vi.fn() },
    itsmAttachment: { count: vi.fn().mockResolvedValue(0), createMany: vi.fn() },
    itsmChatLog: { count: vi.fn().mockResolvedValue(0), createMany: vi.fn() },
    itsmQueryLog: { count: vi.fn().mockResolvedValue(0), createMany: vi.fn() },
    paymentMethod: { count: vi.fn().mockResolvedValue(0) },
    bidderProfile: { count: vi.fn().mockResolvedValue(1), findMany: vi.fn().mockResolvedValue([{ id: 1n, userId: 1n }]) },
    participationHistory: { count: vi.fn().mockResolvedValue(0), createMany: vi.fn() },
    lot: { findMany: vi.fn().mockResolvedValue([{ id: 1n, title: 'Lote A' }]) },
    auction: { findMany: vi.fn().mockResolvedValue([{ id: 1n, title: 'Leilão A' }]) },
    user: { findFirst: vi.fn().mockResolvedValue({ id: 1n }), findMany: vi.fn().mockResolvedValue([{ id: 1n }]) },
    userDocument: { findMany: vi.fn().mockResolvedValue([{ userId: 1n }]) },
    documentType: { findFirst: vi.fn().mockResolvedValue({ id: 1n }) },
  };

  return { prisma, default: prisma };
});

describe('Seed mínimo 50 registros', () => {
  it('deve criar registros para tabelas zeradas', async () => {
    const deps = {
      reportService: { createReport: vi.fn().mockResolvedValue({ success: true }) },
      subscriberService: { createSubscriber: vi.fn().mockResolvedValue({ success: true }) },
      contactMessageService: { saveMessage: vi.fn().mockResolvedValue({ success: true }) },
      paymentMethodService: { createPaymentMethod: vi.fn().mockResolvedValue({}) },
      bidderService: {
        getOrCreateBidderProfile: vi.fn().mockResolvedValue({ id: 1n }),
        updateBidderProfile: vi.fn().mockResolvedValue({ success: true })
      },
      userService: { updateUserProfile: vi.fn().mockResolvedValue({ success: true }) }
    } as any;

    await seedMin50ZeroTables(1n, { targetCount: 5 }, deps);

    expect(deps.reportService.createReport).toHaveBeenCalled();
    expect(deps.subscriberService.createSubscriber).toHaveBeenCalled();
    expect(deps.contactMessageService.saveMessage).toHaveBeenCalled();
    expect(deps.paymentMethodService.createPaymentMethod).toHaveBeenCalled();
  });
});
