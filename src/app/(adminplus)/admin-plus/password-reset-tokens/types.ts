/**
 * @fileoverview Tipos para PasswordResetToken — Admin Plus.
 */
export interface PasswordResetTokenRow {
  id: string;
  email: string;
  token: string;
  expires: string;
  createdAt: string;
}
