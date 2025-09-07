// src/components/admin/vehicle-models/form-schema.ts
import * as z from 'zod';

export const vehicleModelFormSchema = z.object({
  name: z.string().min(1, {
    message: "O nome do modelo é obrigatório.",
  }).max(100, {
    message: "O nome do modelo não pode exceder 100 caracteres.",
  }),
  makeId: z.string().min(1, {
    message: "É obrigatório selecionar uma marca.",
  }),
});

export type VehicleModelFormData = z.infer<typeof vehicleModelFormSchema>;
