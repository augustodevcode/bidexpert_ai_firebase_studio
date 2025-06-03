
import * as z from 'zod';

export const categoryFormSchema = z.object({
  name: z.string().min(2, {
    message: "O nome da categoria deve ter pelo menos 2 caracteres.",
  }).max(100, {
    message: "O nome da categoria não pode exceder 100 caracteres.",
  }),
  description: z.string().max(500, {
    message: "A descrição não pode exceder 500 caracteres.",
  }).optional(),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;
