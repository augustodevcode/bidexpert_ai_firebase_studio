/**
 * Schema Zod de validação de ITSM_Ticket (tickets de suporte/chamados).
 */
import { z } from 'zod';

export const ITSM_STATUS_OPTIONS = [
  { value: 'ABERTO', label: 'Aberto' },
  { value: 'EM_ANDAMENTO', label: 'Em Andamento' },
  { value: 'AGUARDANDO_USUARIO', label: 'Aguardando Usuário' },
  { value: 'RESOLVIDO', label: 'Resolvido' },
  { value: 'FECHADO', label: 'Fechado' },
  { value: 'CANCELADO', label: 'Cancelado' },
] as const;

export const ITSM_PRIORITY_OPTIONS = [
  { value: 'BAIXA', label: 'Baixa' },
  { value: 'MEDIA', label: 'Média' },
  { value: 'ALTA', label: 'Alta' },
  { value: 'CRITICA', label: 'Crítica' },
] as const;

export const ITSM_CATEGORY_OPTIONS = [
  { value: 'TECNICO', label: 'Técnico' },
  { value: 'FUNCIONAL', label: 'Funcional' },
  { value: 'DUVIDA', label: 'Dúvida' },
  { value: 'SUGESTAO', label: 'Sugestão' },
  { value: 'BUG', label: 'Bug' },
  { value: 'OUTRO', label: 'Outro' },
] as const;

export const itsmTicketSchema = z.object({
  userId: z.string().min(1, 'Usuário obrigatório'),
  title: z.string().min(1, 'Título obrigatório'),
  description: z.string().min(1, 'Descrição obrigatória'),
  status: z.string().min(1, 'Status obrigatório'),
  priority: z.string().min(1, 'Prioridade obrigatória'),
  category: z.string().min(1, 'Categoria obrigatória'),
  assignedToUserId: z.string().optional().or(z.literal('')),
  browserInfo: z.string().optional().or(z.literal('')),
  screenSize: z.string().optional().or(z.literal('')),
  pageUrl: z.string().optional().or(z.literal('')),
  userAgent: z.string().optional().or(z.literal('')),
});

export type ItsmTicketFormData = z.infer<typeof itsmTicketSchema>;
