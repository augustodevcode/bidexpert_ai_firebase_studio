'use server';

import { deleteSeller } from './actions';

export async function handleDeleteSeller(id: string) {
  const result = await deleteSeller(id);
  if (!result.success) {
      console.error("Failed to delete seller:", result.message);
  }
  // Optionally, revalidate path or handle UI updates as needed
}