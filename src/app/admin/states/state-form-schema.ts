
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
    
