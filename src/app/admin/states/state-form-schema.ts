// src/app/admin/states/state-form-schema.ts
/**
 * @fileoverview Define o schema de validação (usando Zod) para o formulário
 * de criação e edição de Estados. Este schema é usado pelo `react-hook-form`
 * para garantir que os dados do formulário, como nome e UF, sejam consistentes
 * e válidos antes de serem enviados para as server actions.
 */
import * as z from 'zod';

export const stateFormSchema = z.object({
  name: z.string().min(3, {
    message: "O nome do estado deve ter pelo menos 3 caracteres.",
  }).max(100, {
    message: "O nome do estado não pode exceder 100 caracteres.",
  }),
  uf: z.string().length(2, {
    message: "A UF deve ter exatamente 2 caracteres.",
  }).regex(/^[A-Z]+$/, {
    message: "A UF deve conter apenas letras maiúsculas."
  }),
});

export type StateFormValues = z.infer<typeof stateFormSchema>;
