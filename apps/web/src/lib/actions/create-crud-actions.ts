
// src/lib/actions/create-crud-actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// Define a interface para um serviço CRUD genérico
interface CrudService<T, TCreate, TUpdate> {
  findAll?: (...args: any[]) => Promise<T[]>;
  findById?: (id: string) => Promise<T | null>;
  findBySlug?: (slug: string) => Promise<T | null>;
  create?: (data: TCreate) => Promise<{ success: boolean; message: string; [key: string]: any }>;
  update?: (id: string, data: TUpdate) => Promise<{ success: boolean; message: string }>;
  delete?: (id: string) => Promise<{ success: boolean; message: string }>;
}

interface CrudActionsOptions<T, TCreate, TUpdate> {
  service: CrudService<T, TCreate, TUpdate>;
  entityName: string;
  entityNamePlural?: string;
  routeBase: string;
}

/**
 * Cria um conjunto de Server Actions CRUD genéricas para uma entidade.
 * @param options - As opções de configuração, incluindo o serviço e nomes da entidade.
 * @returns Um objeto contendo as actions CRUD.
 */
export function createCrudActions<T, TCreate, TUpdate>({
  service,
  entityName,
  entityNamePlural, // Agora opcional
  routeBase,
}: CrudActionsOptions<T, TCreate, TUpdate>) {
  
  const obterTodos = service.findAll
    ? async (...args: any[]): Promise<T[]> => {
        return service.findAll!(...args);
      }
    : undefined;

  const obterPorId = service.findById
    ? async (id: string): Promise<T | null> => {
        return service.findById!(id);
      }
    : undefined;
    
  const obterPorSlug = service.findBySlug
    ? async (slug: string): Promise<T | null> => {
        return service.findBySlug!(slug);
      }
    : undefined;

  const criar = service.create
    ? async (data: TCreate) => {
        const result = await service.create!(data);
        if (result.success && process.env.NODE_ENV !== 'test') {
          revalidatePath(routeBase);
        }
        return result;
      }
    : undefined;

  const atualizar = service.update
    ? async (id: string, data: TUpdate) => {
        const result = await service.update!(id, data);
        if (result.success && process.env.NODE_ENV !== 'test') {
          revalidatePath(routeBase);
          revalidatePath(`${routeBase}/${id}/edit`);
        }
        return result;
      }
    : undefined;

  const excluir = service.delete
    ? async (id: string) => {
        const result = await service.delete!(id);
        if (result.success && process.env.NODE_ENV !== 'test') {
          revalidatePath(routeBase);
        }
        return result;
      }
    : undefined;

  // Retorna apenas as funções que foram definidas
  return {
    ...(obterTodos && { obterTodos }),
    ...(obterPorId && { obterPorId }),
    ...(obterPorSlug && { obterPorSlug }),
    ...(criar && { criar }),
    ...(atualizar && { atualizar }),
    ...(excluir && { excluir }),
  };
}
