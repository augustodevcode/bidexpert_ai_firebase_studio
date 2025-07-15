// src/lib/database/index.ts
/**
 * @fileoverview Este é o principal ponto de entrada para a lógica de banco de dados do lado do servidor.
 * Ele garante que qualquer módulo que o importe seja executado apenas no servidor.
 */
import 'server-only';

// Re-exporta a função principal de obtenção do adaptador.
export { getDatabaseAdapter } from './get-adapter';