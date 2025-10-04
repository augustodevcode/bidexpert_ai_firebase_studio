import * as z from 'zod';

export const userRoleFormSchema = z.object({
  roleIds: z.array(z.string()).refine((value) => value.some(item => item), {
    message: "Você deve selecionar pelo menos um perfil.",
  }),
});

export type UserRoleFormValues = z.infer<typeof userRoleFormSchema>;
