// src/lib/firebase/admin.ts
/**
 * @fileoverview Este arquivo exporta tipos do Firestore para uso no lado do servidor,
 * garantindo consistência sem depender do SDK de administrador.
 */
export type { Timestamp as ServerTimestamp } from 'firebase/firestore';
