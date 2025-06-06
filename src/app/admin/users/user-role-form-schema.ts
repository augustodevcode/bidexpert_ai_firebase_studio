
import * as z from 'zod';

export const userRoleFormSchema = z.object({
  roleId: z.string().optional().nullable(), // Role ID can be empty if no role is assigned or role is removed
});

export type UserRoleFormValues = z.infer<typeof userRoleFormSchema>;

    