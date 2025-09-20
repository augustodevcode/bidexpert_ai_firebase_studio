// src/app/admin/cities/city-form-schema.ts
/**
 * @fileoverview Define o schema de validação (usando Zod) para o formulário
 * de criação e edição de Cidades. Este schema é usado pelo `react-hook-form`
 * para garantir que os dados do formulário sejam consistentes e válidos antes
 * de serem enviados para as server actions.
 */
import * as z from 'zod';

export const cityFormSchema = z.object({
  name: z.string().min(2, {
    message: "O nome da cidade deve ter pelo menos 2 caracteres.",
  }).max(150, {
    message: "O nome da cidade não pode exceder 150 caracteres.",
  }),
  stateId: z.string().min(1, {
    message: "Por favor, selecione um estado.",
  }),
  ibgeCode: z.string().length(7, {
    message: "O código IBGE da cidade deve ter 7 dígitos.",
  }).regex(/^\d+$/, {
    message: "O código IBGE deve conter apenas números."
  }).optional().or(z.literal('')),
});

export type CityFormValues = z.infer<typeof cityFormSchema>;
