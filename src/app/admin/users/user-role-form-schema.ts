
import * as z from 'zod';

export const userRoleFormSchema = z.object({
  roleIds: z.array(z.string()).optional(), // Role IDs can be empty if no role is assigned
});

export type UserRoleFormValues = z.infer<typeof userRoleFormSchema>;

    
