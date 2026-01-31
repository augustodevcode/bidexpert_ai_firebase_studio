/**
 * @fileoverview Testes unitários do envio de respostas de mensagens de contato.
 * BDD: Garantir que a resposta é enviada ao remetente correto.
 * TDD: Validar comportamento ao enviar resposta e quando a mensagem não existe.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ContactMessageService } from '../../../src/services/contact-message.service';

const { mockFindById, mockSendReply } = vi.hoisted(() => ({
  mockFindById: vi.fn(),
  mockSendReply: vi.fn(),
}));

vi.mock('../../../src/repositories/contact-message.repository', () => {
  class ContactMessageRepository {
    findById = mockFindById;
  }
  return { ContactMessageRepository };
});

vi.mock('../../../src/services/email.service', () => {
  class EmailService {
    sendContactMessageReply = mockSendReply;
  }
  return { EmailService };
});

const baseMessage = {
  id: BigInt(1),
  name: 'Maria Oliveira',
  email: 'maria@teste.com',
  subject: 'Parceria',
  message: 'Gostaria de conversar sobre parceria.',
};

describe('ContactMessageService.sendReplyToContactMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('envia resposta para o remetente e registra log', async () => {
    mockFindById.mockResolvedValue(baseMessage);
    mockSendReply.mockResolvedValue({ success: true, message: 'Resposta enviada com sucesso.' });

    const service = new ContactMessageService();
    const result = await service.sendReplyToContactMessage('1', {
      subject: 'Re: Parceria',
      message: 'Obrigado pelo contato. Vamos falar.',
    });

    expect(mockSendReply).toHaveBeenCalledWith({
      to: baseMessage.email,
      name: baseMessage.name,
      subject: 'Re: Parceria',
      message: 'Obrigado pelo contato. Vamos falar.',
      originalMessage: baseMessage.message,
      contactMessageId: baseMessage.id,
    });
    expect(result.success).toBe(true);
  });

  it('retorna erro quando mensagem não é encontrada', async () => {
    mockFindById.mockResolvedValue(null);

    const service = new ContactMessageService();
    const result = await service.sendReplyToContactMessage('99', {
      subject: 'Re: Mensagem',
      message: 'Não encontramos sua mensagem.',
    });

    expect(result.success).toBe(false);
    expect(mockSendReply).not.toHaveBeenCalled();
  });
});
