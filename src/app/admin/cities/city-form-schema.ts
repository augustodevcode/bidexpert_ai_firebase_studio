
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
});

export type CityFormValues = z.infer<typeof cityFormSchema>;
    
