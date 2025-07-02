// src/app/admin/judicial-districts/judicial-district-form-schema.ts
import * as z from 'zod';

export const judicialDistrictFormSchema = z.object({
  name: z.string().min(3, {
    message: "O nome da comarca deve ter pelo menos 3 caracteres.",
  }).max(150, {
    message: "O nome da comarca não pode exceder 150 caracteres.",
  }),
  courtId: z.string().min(1, { message: "Selecione o tribunal ao qual a comarca pertence."}),
  stateId: z.string().min(1, { message: "Selecione o estado onde a comarca está localizada."}),
  zipCode: z.string().max(10, "O CEP não pode exceder 10 caracteres.").optional().nullable(),
});

export type JudicialDistrictFormValues = z.infer<typeof judicialDistrictFormSchema>;