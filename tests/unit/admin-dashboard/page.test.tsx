/**
 * @fileoverview Testes unitários do server action do dashboard administrativo.
 * @vitest-environment node
 * BDD: Garantir que o action retorna métricas agregadas reais do serviço.
 * TDD: Validar contrato do retorno do action com dados simulados.
 */
import { describe, expect, it, vi } from 'vitest';
import type { AdminReportData } from '../../../src/types';

const mockedData: AdminReportData = {
  users: 120,
  auctions: 14,
  lots: 250,
  sellers: 9,
  totalRevenue: 10000,
  newUsersLast30Days: 6,
  activeAuctions: 4,
  lotsSoldCount: 18,
  salesData: [{ name: 'Jan/26', Sales: 1000 }],
  categoryData: [{ name: 'Imóveis', value: 5 }],
  averageBidValue: 500,
  auctionSuccessRate: 60,
  averageLotsPerAuction: 7,
};

vi.mock('../../../src/services/dashboard.service', () => ({
  DashboardService: class {
    async getAdminDashboardStats() {
      return mockedData;
    }
  },
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('../../../src/lib/prisma', () => ({
  prisma: {},
}));

vi.mock('../../../src/lib/get-tenant-id', () => ({
  getTenantId: vi.fn().mockResolvedValue(1),
}));

import { getAdminReportDataAction } from '../../../src/app/admin/reports/actions';

describe('getAdminReportDataAction', () => {
  it('retorna métricas agregadas do serviço de dashboard', async () => {
    const result = await getAdminReportDataAction();

    expect(result).toEqual(mockedData);
    expect(result.totalRevenue).toBe(10000);
    expect(result.activeAuctions).toBe(4);
  });
});
