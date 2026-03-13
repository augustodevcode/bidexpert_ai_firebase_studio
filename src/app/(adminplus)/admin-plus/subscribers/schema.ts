/**
 * Schema Zod para Subscriber no Admin Plus.
 */
import { z } from 'zod';

export const subscriberSchema = z.object({
  email: z.string().email('Email inválido'),
  name: z.string().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  preferences: z.string().optional().or(z.literal('')),
});

export type SubscriberFormData = z.infer<typeof subscriberSchema>;
