/**
 * @fileoverview Testes unitários do config compartilhado do selector de Processo Judicial.
 */

import { describe, expect, it } from 'vitest';

import {
  buildJudicialProcessSelectorOptions,
  judicialProcessSelectorColumns,
} from '@/components/admin/judicial-processes/judicial-process-selector-config';
import type { JudicialProcess } from '@/types';

describe('judicial-process-selector-config', () => {
  it('preserva bens/lotes e expõe colunas ampliadas do processo judicial', () => {
    const processes: JudicialProcess[] = [
      {
        id: '101',
        publicId: 'PROC-101',
        tenantId: '1',
        processNumber: '0001234-56.2024.8.26.0100',
        isElectronic: true,
        createdAt: '2026-04-22T10:00:00.000Z',
        updatedAt: '2026-04-22T12:00:00.000Z',
        courtId: '11',
        districtId: '12',
        branchId: '13',
        sellerId: '14',
        propertyMatricula: 'MAT-8899',
        propertyRegistrationNumber: 'REG-7788',
        actionType: 'PENHORA',
        actionDescription: 'Execução de título extrajudicial',
        actionCnjCode: '123456',
        parties: [
          {
            id: '1',
            processId: '101',
            name: 'Banco Alfa',
            partyType: 'PLAINTIFF',
            documentNumber: null,
            tenantId: '1',
          },
          {
            id: '2',
            processId: '101',
            name: 'Empresa Beta',
            partyType: 'DEFENDANT',
            documentNumber: null,
            tenantId: '1',
          },
        ],
        courtName: 'TJSP',
        districtName: 'São Paulo',
        branchName: '1ª Vara Cível',
        sellerName: 'Massa Falida XPTO',
        lotCount: 5,
        assetCount: 2,
        auctions: [],
        lots: [],
        assets: [],
      },
    ];

    const [option] = buildJudicialProcessSelectorOptions(processes);

    expect(option.processNumber).toBe('0001234-56.2024.8.26.0100');
    expect(option.sellerName).toBe('Massa Falida XPTO');
    expect(option.branchName).toBe('1ª Vara Cível');
    expect(option.courtName).toBe('TJSP');
    expect(option.propertyMatricula).toBe('MAT-8899');
    expect(option.propertyRegistrationNumber).toBe('REG-7788');
    expect(option.actionTypeLabel).toBe('Penhora');
    expect(option.actionCnjCode).toBe('123456');
    expect(option.assetCount).toBe(2);
    expect(option.lotCount).toBe(5);
    expect(option.partiesSummary).toContain('Plaintiff: Banco Alfa');
    expect(option.partiesSummary).toContain('Defendant: Empresa Beta');

    expect(judicialProcessSelectorColumns).toHaveLength(17);
  });
});