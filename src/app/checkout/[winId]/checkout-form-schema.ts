// src/app/checkout/[winId]/checkout-form-schema.ts
/**
 * @fileoverview Define o schema de validação (usando Zod) para o formulário
 * de checkout. Garante que os dados do cartão de crédito sejam válidos e que
 * o método de pagamento selecionado seja consistente com os dados fornecidos.
 */
import * as z from 'zod';

const cardSchema = z.object({
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

export const checkoutFormSchema = z.object({
  paymentMethod: z.enum(['credit_card', 'installments'], {
    required_error: "Selecione um método de pagamento.",
  }),
  installments: z.coerce.number().optional(),
  cardDetails: cardSchema.optional(),
}).superRefine((data, ctx) => {
    if (data.paymentMethod === 'credit_card' && !data.cardDetails) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['cardDetails'],
            message: "Detalhes do cartão são obrigatórios para pagamento à vista.",
        });
    }
});


export type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;
