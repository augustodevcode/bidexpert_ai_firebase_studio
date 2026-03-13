/**
 * @fileoverview Tipos para BidderProfile (Perfil do Arrematante) — Admin Plus.
 */
export interface BidderProfileRow {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  fullName: string | null;
  cpf: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  city: string | null;
  state: string | null;
  documentStatus: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  isActive: boolean;
  tenantId: string | null;
  createdAt: string;
  updatedAt: string;
}
