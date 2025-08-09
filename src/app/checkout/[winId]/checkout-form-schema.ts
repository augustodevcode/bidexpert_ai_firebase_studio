// src/app/checkout/[winId]/checkout-form-schema.ts
import * as z from 'zod';

export const checkoutFormSchema = z.object({
  cardholderName: z.string().min(3, { message: "O nome no cartão é obrigatório." }),
  cardNumber: z.string()
    .min(16, { message: "O número do cartão deve ter 16 dígitos." })
    .max(16, { message: "O número do cartão deve ter 16 dígitos." })
    .regex(/^\d+$/, { message: "O número do cartão deve conter apenas dígitos." }),
  expiryDate: z.string()
    .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, { message: "Formato de validade inválido. Use MM/AA." })
    .refine((val) => {
        const [month, year] = val.split('/');
        const expiry = new Date(2000 + parseInt(year, 10), parseInt(month, 10));
        const now = new Date();
        now.setMonth(now.getMonth() - 1); // Allow current month
        return expiry > now;
    }, { message: "Cartão expirado." }),
  cvc: z.string().min(3, { message: "CVC deve ter 3 dígitos." }).max(4, { message: "CVC inválido." }),
});

export type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;
