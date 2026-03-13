/**
 * Tipos de dados da tabela ContactMessage (Mensagens de Contato).
 */
export interface ContactMessageRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}
