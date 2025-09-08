// src/components/admin/vehicle-makes/form-schema.ts
import * as z from 'zod';

export const vehicleMakeFormSchema = z.object({
  name: z.string().min(2, {
    message: "O nome da marca deve ter pelo menos 2 caracteres.",
  }).max(100, {
    message: "O nome da marca não pode exceder 100 caracteres.",
  }),
});

export type VehicleMakeFormData = z.infer<typeof vehicleMakeFormSchema>;
