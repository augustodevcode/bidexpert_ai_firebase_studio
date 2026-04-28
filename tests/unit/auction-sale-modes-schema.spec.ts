/**
 * @fileoverview Testa o contrato de validação das modalidades de venda no cadastro de leilões.
 */
import { describe, expect, it } from 'vitest';
import { auctionFormSchema } from '@/app/admin/auctions/auction-form-schema';
import { auctionFormSchema as auctionFormSchemaV2 } from '@/app/admin/auctions-v2/auction-form-schema-v2';

const stage = {
  name: '1ª Praça',
  startDate: new Date('2026-05-01T10:00:00.000Z'),
  endDate: new Date('2026-05-08T10:00:00.000Z'),
};

const baseAuction = {
  title: 'Leilão Judicial de Teste',
  description: 'Leilão criado para validar modalidades de venda.',
  status: 'RASCUNHO',
  auctionType: 'JUDICIAL',
  auctionMethod: 'STANDARD',
  participation: 'ONLINE',
  auctioneerId: '1',
  sellerId: '1',
  categoryId: '1',
  auctionStages: [stage],
};

describe('auction sale modes schema', () => {
  it('aceita modalidades ABA quando propostas têm prazo', () => {
    const parsed = auctionFormSchema.parse({
      ...baseAuction,
      allowSublots: true,
      perLotEnrollmentEnabled: true,
      preferenceRightEnabled: true,
      allowProposals: true,
      directSaleEnabled: true,
      proposalDeadline: '2026-05-06T18:00:00.000Z',
    });

    expect(parsed.allowSublots).toBe(true);
    expect(parsed.perLotEnrollmentEnabled).toBe(true);
    expect(parsed.preferenceRightEnabled).toBe(true);
    expect(parsed.allowProposals).toBe(true);
    expect(parsed.directSaleEnabled).toBe(true);
    expect(parsed.proposalDeadline).toEqual(new Date('2026-05-06T18:00:00.000Z'));
  });

  it('bloqueia propostas sem data limite no formulário clássico e no V2', () => {
    const classicResult = auctionFormSchema.safeParse({
      ...baseAuction,
      allowProposals: true,
      proposalDeadline: null,
    });
    const v2Result = auctionFormSchemaV2.safeParse({
      ...baseAuction,
      allowProposals: true,
      proposalDeadline: null,
    });

    expect(classicResult.success).toBe(false);
    expect(v2Result.success).toBe(false);
    expect(classicResult.error?.format().proposalDeadline?._errors.join(' ')).toMatch(/data limite/i);
    expect(v2Result.error?.format().proposalDeadline?._errors.join(' ')).toMatch(/data limite/i);
  });
});