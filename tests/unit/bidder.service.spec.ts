import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BidderService } from '@/services/bidder.service';

describe('BidderService', () => {
  let service: BidderService;
  let mockRepository: any;

  beforeEach(() => {
    mockRepository = {
      findByUserId: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    };
    service = new BidderService();
    (service as any).bidderRepository = mockRepository;
  });

  it('deve validar dados de perfil antes de atualizar', async () => {
    const userId = 1n;
    const invalidData = {
      fullName: 'Jo', // curto demais
      cpf: 'invalid-cpf',
      state: 'São Paulo', // longo demais (deve ser 2 chars)
    } as any;

    const result = await service.updateBidderProfile(userId, invalidData);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Dados inválidos');
    expect(result.error).toContain('Nome muito curto');
    expect(result.error).toContain('CPF inválido');
    expect(result.error).toContain('Estado deve ter 2 caracteres');
  });

  it('deve permitir atualização com dados válidos', async () => {
    const userId = 1n;
    const validData = {
      fullName: 'João Silva',
      cpf: '123.456.789-00',
      state: 'SP',
    } as any;

    const existingProfile = { id: 10n, userId, emailNotifications: true, smsNotifications: false, isActive: true };
    mockRepository.findByUserId.mockResolvedValue(existingProfile);
    mockRepository.update.mockResolvedValue({ ...existingProfile, ...validData, updatedAt: new Date() });

    const result = await service.updateBidderProfile(userId, validData);

    expect(result.success).toBe(true);
    expect(result.data?.fullName).toBe('João Silva');
    expect(mockRepository.update).toHaveBeenCalled();

    // Verificar se chamou update com os dados validados (Zod pode transformar ou filtrar)
    const updateArgs = mockRepository.update.mock.calls[0][1];
    expect(updateArgs.fullName).toBe('João Silva');
    expect(updateArgs.cpf).toBe('123.456.789-00');
  });
});
