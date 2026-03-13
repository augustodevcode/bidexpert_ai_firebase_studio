/**
 * @fileoverview Tipos da entidade UsersOnRoles — Admin Plus.
 */
export interface UsersOnRolesRow {
  compositeId: string; // "userId:roleId"
  userId: string;
  roleId: string;
  assignedAt: string;
  assignedBy: string;
  userName?: string;
  userEmail?: string;
  roleName?: string;
}
