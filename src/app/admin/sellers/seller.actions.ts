// src/app/admin/sellers/seller.actions.ts
/**
 * @fileoverview Ações de servidor legadas ou específicas de um componente
 * para a entidade Seller. Este arquivo pode conter ações que foram criadas
 * para um propósito específico e podem ser refatoradas ou mescladas com o
 * arquivo principal de actions (`/admin/sellers/actions.ts`) no futuro.
 */
'use server';

import { deleteSeller } from './actions';

export async function handleDeleteSeller(id: string) {
  const result = await deleteSeller(id);
  if (!result.success) {
      console.error("Failed to delete seller:", result.message);
  }
  // Optionally, revalidate path or handle UI updates as needed
}
