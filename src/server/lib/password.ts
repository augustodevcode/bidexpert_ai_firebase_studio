// src/server/lib/password.ts
/**
 * @fileoverview Utilitários para hash de senhas usando bcrypt.
 */
import 'server-only';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

/**
 * Cria um hash bcrypt de uma senha.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verifica se uma senha corresponde a um hash.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
