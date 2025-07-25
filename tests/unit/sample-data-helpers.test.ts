import { getAuctionStatusText } from '@/lib/sample-data-helpers';
import type { AuctionStatus, LotStatus, PaymentStatus } from '@/types';

describe('getAuctionStatusText', () => {
  // Test for AuctionStatus types
  it('should return the correct text for AuctionStatus variants', () => {
    expect(getAuctionStatusText('EM_BREVE')).toBe('Em Breve');
    expect(getAuctionStatusText('ABERTO_PARA_LANCES')).toBe('Aberto para Lances');
    expect(getAuctionStatusText('ENCERRADO')).toBe('Encerrado');
    expect(getAuctionStatusText('CANCELADO')).toBe('Cancelado');
    expect(getAuctionStatusText('RASCUNHO')).toBe('Rascunho');
  });

  // Test for LotStatus types
  it('should return the correct text for LotStatus variants', () => {
    expect(getAuctionStatusText('VENDIDO')).toBe('Vendido');
    expect(getAuctionStatusText('NAO_VENDIDO')).toBe('Não Vendido');
  });

  // Test for PaymentStatus types
  it('should return the correct text for PaymentStatus variants', () => {
    expect(getAuctionStatusText('PENDENTE')).toBe('Pendente');
    expect(getAuctionStatusText('PAGO')).toBe('Pago');
    expect(getAuctionStatusText('FALHOU')).toBe('Falhou');
  });

  // Test for UserHabilitationStatus types
  it('should return the correct text for UserHabilitationStatus variants', () => {
    expect(getAuctionStatusText('HABILITADO')).toBe('Habilitado para Dar Lances');
    expect(getAuctionStatusText('BLOCKED')).toBe('Conta Bloqueada');
    expect(getAuctionStatusText('PENDING_DOCUMENTS')).toBe('Documentação Pendente');
  });

  // Test the default case for unhandled string
  it('should format an unknown string status correctly', () => {
    expect(getAuctionStatusText('SOME_NEW_STATUS')).toBe('Some New Status');
  });

  // Test for undefined or null input
  it('should return "Status Desconhecido" for undefined or null input', () => {
    expect(getAuctionStatusText(undefined)).toBe('Status Desconhecido');
    // @ts-ignore
    expect(getAuctionStatusText(null)).toBe('Status Desconhecido');
  });
});
