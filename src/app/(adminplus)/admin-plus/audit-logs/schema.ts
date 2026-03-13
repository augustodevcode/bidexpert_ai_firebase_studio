/**
 * Schema de validação Zod para AuditLog.
 */
import { z } from 'zod';

export const AUDIT_LOG_ACTION_OPTIONS = [
  { value: 'CREATE', label: 'Criar' },
  { value: 'UPDATE', label: 'Atualizar' },
  { value: 'DELETE', label: 'Excluir' },
  { value: 'SOFT_DELETE', label: 'Excluir (Soft)' },
  { value: 'RESTORE', label: 'Restaurar' },
  { value: 'PUBLISH', label: 'Publicar' },
  { value: 'UNPUBLISH', label: 'Despublicar' },
  { value: 'APPROVE', label: 'Aprovar' },
  { value: 'REJECT', label: 'Rejeitar' },
  { value: 'EXPORT', label: 'Exportar' },
  { value: 'IMPORT', label: 'Importar' },
] as const;

export const auditLogSchema = z.object({
  userId: z.string().min(1, 'Usuário é obrigatório'),
  entityType: z.string().min(1, 'Tipo de entidade é obrigatório'),
  entityId: z.string().min(1, 'ID da entidade é obrigatório'),
  action: z.string().min(1, 'Ação é obrigatória'),
  changedFields: z.string().or(z.literal('')).optional(),
  ipAddress: z.string().or(z.literal('')).optional(),
  userAgent: z.string().or(z.literal('')).optional(),
});

export type AuditLogFormData = z.infer<typeof auditLogSchema>;
