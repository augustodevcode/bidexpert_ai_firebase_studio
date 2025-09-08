// src/app/admin/contact-messages/actions.ts
'use server';

import type { ContactMessage } from '@bidexpert/core';
import { ContactMessageService } from '@bidexpert/services';
import { createCrudActions } from '@/lib/actions/create-crud-actions';

const contactMessageService = new ContactMessageService();
const contactMessageActions = createCrudActions({
  service: contactMessageService,
  entityName: 'ContactMessage',
  entityNamePlural: 'ContactMessages',
  routeBase: '/admin/contact-messages'
});


export const {
  getAll: getContactMessages,
  delete: deleteContactMessage,
} = contactMessageActions;

export async function toggleMessageReadStatus(id: string, isRead: boolean): Promise<{ success: boolean; message: string }> {
    return contactMessageService.toggleReadStatus(id, isRead);
}
