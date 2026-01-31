/**
 * @fileoverview Regressão visual da tela de mensagens de contato.
 * BDD: Garantir que o modal de visualização e resposta mantém layout consistente.
 * TDD: Capturar screenshot do modal de resposta com conteúdo de exemplo.
 */
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import type { ContactMessage } from '../../src/types';

import { ContactMessageDialog } from '../../src/components/admin/contact-messages/contact-message-dialog';

const mockMessages: ContactMessage[] = [
  {
    id: '1',
    name: 'Maria Oliveira',
    email: 'maria@teste.com',
    subject: 'Parceria',
    message: 'Sou leiloeira e gostaria de usar a plataforma.',
    isRead: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as ContactMessage,
];

describe('Mensagens de Contato - Visual', () => {
  beforeEach(async () => {
    await page.viewport(1440, 900);
    vi.clearAllMocks();
  });

  it('mantém layout do modal de resposta', async () => {
    await render(
      <div className="p-6 bg-background">
        <ContactMessageDialog
          open={true}
          message={mockMessages[0]}
          isSending={false}
          onOpenChange={() => undefined}
          onSendReply={() => undefined}
        />
      </div>
    );

    const dialog = page.getByTestId('contact-message-dialog');
    await expect.element(dialog).toBeVisible();

    await expect(dialog).toMatchScreenshot('contact-message-reply-dialog.png');
  });
});
