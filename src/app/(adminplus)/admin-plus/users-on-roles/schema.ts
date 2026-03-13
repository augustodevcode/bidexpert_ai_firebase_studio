/**
 * @fileoverview Schema Zod para criação de associação UsersOnRoles — Admin Plus.
 */
import { z } from 'zod';

export const usersOnRolesSchema = z.object({
  userId: z.string().min(1, 'Usuário é obrigatório'),
  roleId: z.string().min(1, 'Perfil é obrigatório'),
  assignedBy: z.string().optional().default(''),
});

export type UsersOnRolesInput = z.infer<typeof usersOnRolesSchema>;
