
// src/app/admin/contact-messages/actions.ts
'use server';

import { ContactMessageService } from '@bidexpert/services';
import { createCrudActions } from '@/lib/actions/create-crud-actions';

const contactMessageService = new ContactMessageService();

const { 
  obterTodos: getContactMessages, 
  excluir: deleteContactMessage
} = createCrudActions({
  service: contactMessageService,
  entityName: 'Mensagem de Contato',
  routeBase: '/admin/contact-messages'
});

export { getContactMessages, deleteContactMessage };


export async function toggleMessageReadStatus(id: string, isRead: boolean): Promise<{ success: boolean; message: string }> {
    return contactMessageService.toggleReadStatus(id, isRead);
}
