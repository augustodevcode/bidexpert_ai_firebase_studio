// src/lib/bidder-schemas.ts
/**
 * @fileoverview Schemas Zod para validação de formulários do bidder dashboard
 * Segue o padrão do projeto com schemas centralizados e enums
 */

import { z } from 'zod';

// Enums específicos do bidder dashboard
export const bidderDocumentStatusValues: [string, ...string[]] = [
  'PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'EXPIRED'
];

export const bidderNotificationTypeValues: [string, ...string[]] = [
  'AUCTION_WON', 'PAYMENT_DUE', 'PAYMENT_OVERDUE', 'DOCUMENT_APPROVED',
  'DOCUMENT_REJECTED', 'DELIVERY_UPDATE', 'AUCTION_ENDING', 'SYSTEM_UPDATE'
];

export const paymentMethodTypeValues: [string, ...string[]] = [
  'CREDIT_CARD', 'DEBIT_CARD', 'PIX', 'BOLETO', 'BANK_TRANSFER'
];

export const participationResultValues: [string, ...string[]] = [
  'WON', 'LOST', 'WITHDRAWN'
];

export const wonLotStatusValues: [string, ...string[]] = [
  'WON', 'PAID', 'DELIVERED', 'CANCELLED'
];

export const deliveryStatusValues: [string, ...string[]] = [
  'PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'FAILED'
];

// Schemas de validação para formulários

// Schema para criação de perfil do bidder
export const bidderProfileFormSchema = z.object({
  fullName: z.string()
    .min(2, { message: 'Nome deve ter pelo menos 2 caracteres' })
    .max(100, { message: 'Nome não pode exceder 100 caracteres' })
    .optional(),
  cpf: z.string()
    .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, { message: 'CPF deve estar no formato 000.000.000-00' })
    .optional(),
  phone: z.string()
    .regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, { message: 'Telefone deve estar no formato (11) 99999-9999' })
    .optional(),
  dateOfBirth: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Data deve estar no formato YYYY-MM-DD' })
    .optional(),
  address: z.string()
    .max(255, { message: 'Endereço não pode exceder 255 caracteres' })
    .optional(),
  city: z.string()
    .max(100, { message: 'Cidade não pode exceder 100 caracteres' })
    .optional(),
  state: z.string()
    .length(2, { message: 'Estado deve ter 2 caracteres (UF)' })
    .optional(),
  zipCode: z.string()
    .regex(/^\d{5}-\d{3}$/, { message: 'CEP deve estar no formato 00000-000' })
    .optional(),
  emailNotifications: z.boolean().default(true),
  smsNotifications: z.boolean().default(false)
});

export type BidderProfileFormData = z.infer<typeof bidderProfileFormSchema>;

// Schema para método de pagamento - Cartão de Crédito
export const creditCardPaymentMethodSchema = z.object({
  type: z.literal('CREDIT_CARD'),
  cardNumber: z.string()
    .regex(/^\d{16}$/, { message: 'Número do cartão deve ter 16 dígitos' }),
  cardHolderName: z.string()
    .min(2, { message: 'Nome no cartão é obrigatório' })
    .max(100, { message: 'Nome no cartão não pode exceder 100 caracteres' }),
  cardExpiry: z.string()
    .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, { message: 'Validade deve estar no formato MM/AA' }),
  cardCvv: z.string()
    .regex(/^\d{3}$/, { message: 'CVV deve ter 3 dígitos' }),
  isDefault: z.boolean().default(false)
});

// Schema para método de pagamento - PIX
export const pixPaymentMethodSchema = z.object({
  type: z.literal('PIX'),
  pixKey: z.string()
    .min(1, { message: 'Chave PIX é obrigatória' })
    .max(100, { message: 'Chave PIX não pode exceder 100 caracteres' }),
  pixKeyType: z.enum(['CPF', 'EMAIL', 'PHONE', 'RANDOM']),
  isDefault: z.boolean().default(false)
});

// Schema para método de pagamento - Boleto
export const boletoPaymentMethodSchema = z.object({
  type: z.literal('BOLETO'),
  isDefault: z.boolean().default(false)
});

// Schema genérico para método de pagamento
export const paymentMethodFormSchema = z.discriminatedUnion('type', [
  creditCardPaymentMethodSchema,
  pixPaymentMethodSchema,
  boletoPaymentMethodSchema
]);

export type PaymentMethodFormData = z.infer<typeof paymentMethodFormSchema>;

// Schema para upload de documentos
export const documentUploadSchema = z.object({
  documentType: z.string()
    .min(1, { message: 'Tipo de documento é obrigatório' }),
  file: z.instanceof(File)
    .refine(file => file.size <= 10 * 1024 * 1024, { message: 'Arquivo deve ter no máximo 10MB' })
    .refine(
      file => ['application/pdf', 'image/jpeg', 'image/png'].includes(file.type),
      { message: 'Formato deve ser PDF, JPG ou PNG' }
    ),
  description: z.string()
    .max(500, { message: 'Descrição não pode exceder 500 caracteres' })
    .optional()
});

export type DocumentUploadFormData = z.infer<typeof documentUploadSchema>;

// Schema para filtros de lotes arrematados
export const wonLotsFiltersSchema = z.object({
  status: z.array(z.enum(wonLotStatusValues)).optional(),
  paymentStatus: z.array(z.string()).optional(),
  dateRange: z.object({
    from: z.date(),
    to: z.date()
  }).optional(),
  search: z.string()
    .max(100, { message: 'Busca não pode exceder 100 caracteres' })
    .optional()
});

export type WonLotsFiltersFormData = z.infer<typeof wonLotsFiltersSchema>;

// Schema para filtros de notificações
export const notificationsFiltersSchema = z.object({
  type: z.array(z.enum(bidderNotificationTypeValues)).optional(),
  isRead: z.boolean().optional(),
  dateRange: z.object({
    from: z.date(),
    to: z.date()
  }).optional()
});

export type NotificationsFiltersFormData = z.infer<typeof notificationsFiltersSchema>;

// Schema para filtros de histórico
export const participationHistoryFiltersSchema = z.object({
  result: z.array(z.enum(participationResultValues)).optional(),
  dateRange: z.object({
    from: z.date(),
    to: z.date()
  }).optional(),
  search: z.string()
    .max(100, { message: 'Busca não pode exceder 100 caracteres' })
    .optional()
});

export type ParticipationHistoryFiltersFormData = z.infer<typeof participationHistoryFiltersSchema>;

// Schema para processamento de pagamento
export const processPaymentSchema = z.object({
  wonLotId: z.string().min(1, { message: 'ID do lote é obrigatório' }),
  paymentMethodId: z.string().min(1, { message: 'Método de pagamento é obrigatório' }),
  amount: z.number()
    .positive({ message: 'Valor deve ser positivo' })
    .optional(),
  installmentCount: z.number()
    .int()
    .min(1, { message: 'Número de parcelas deve ser pelo menos 1' })
    .max(12, { message: 'Número de parcelas não pode exceder 12' })
    .optional()
});

export type ProcessPaymentFormData = z.infer<typeof processPaymentSchema>;

// Schema para geração de boleto
export const generateBoletoSchema = z.object({
  wonLotId: z.string().min(1, { message: 'ID do lote é obrigatório' }),
  dueDate: z.date()
    .min(new Date(), { message: 'Data de vencimento deve ser futura' })
    .optional(),
  installmentNumber: z.number()
    .int()
    .min(1, { message: 'Número da parcela deve ser pelo menos 1' })
    .optional()
});

export type GenerateBoletoFormData = z.infer<typeof generateBoletoSchema>;

// Schema para configuração de notificações
export const notificationSettingsSchema = z.object({
  emailNotifications: z.boolean(),
  smsNotifications: z.boolean(),
  notificationTypes: z.object({
    auctionWon: z.boolean().default(true),
    paymentDue: z.boolean().default(true),
    paymentOverdue: z.boolean().default(true),
    documentStatus: z.boolean().default(true),
    deliveryUpdates: z.boolean().default(true),
    auctionEnding: z.boolean().default(true),
    systemUpdates: z.boolean().default(true)
  }).default({
    auctionWon: true,
    paymentDue: true,
    paymentOverdue: true,
    documentStatus: true,
    deliveryUpdates: true,
    auctionEnding: true,
    systemUpdates: true
  })
});

export type NotificationSettingsFormData = z.infer<typeof notificationSettingsSchema>;

// Schema para busca de arrematantes (admin)
export const bidderSearchFiltersSchema = z.object({
  search: z.string()
    .max(100, { message: 'Busca não pode exceder 100 caracteres' })
    .optional(),
  documentStatus: z.enum(bidderDocumentStatusValues).optional(),
  isActive: z.boolean().optional(),
  dateRange: z.object({
    from: z.date(),
    to: z.date()
  }).optional()
});

export type BidderSearchFiltersFormData = z.infer<typeof bidderSearchFiltersSchema>;

// Schema para impersonação de bidder (admin)
export const bidderImpersonationSchema = z.object({
  bidderId: z.string().min(1, { message: 'ID do arrematante é obrigatório' }),
  reason: z.string()
    .min(10, { message: 'Motivo deve ter pelo menos 10 caracteres' })
    .max(500, { message: 'Motivo não pode exceder 500 caracteres' })
});

export type BidderImpersonationFormData = z.infer<typeof bidderImpersonationSchema>;

// Schema para atualização de status de documentos (admin)
export const updateDocumentStatusSchema = z.object({
  bidderId: z.string().min(1, { message: 'ID do arrematante é obrigatório' }),
  documentStatus: z.enum(bidderDocumentStatusValues),
  adminNotes: z.string()
    .max(1000, { message: 'Observações não podem exceder 1000 caracteres' })
    .optional(),
  rejectionReason: z.string()
    .max(500, { message: 'Motivo de rejeição não pode exceder 500 caracteres' })
    .optional()
});

export type UpdateDocumentStatusFormData = z.infer<typeof updateDocumentStatusSchema>;

// Schema para atualização de status de entrega (admin)
export const updateDeliveryStatusSchema = z.object({
  wonLotId: z.string().min(1, { message: 'ID do lote é obrigatório' }),
  deliveryStatus: z.enum(deliveryStatusValues),
  trackingCode: z.string()
    .max(50, { message: 'Código de rastreio não pode exceder 50 caracteres' })
    .optional(),
  notes: z.string()
    .max(500, { message: 'Observações não podem exceder 500 caracteres' })
    .optional()
});

export type UpdateDeliveryStatusFormData = z.infer<typeof updateDeliveryStatusSchema>;

// Schema para atualização de status de pagamento (admin)
export const updatePaymentStatusSchema = z.object({
  wonLotId: z.string().min(1, { message: 'ID do lote é obrigatório' }),
  paymentStatus: z.string(), // PaymentStatus enum
  amount: z.number()
    .positive({ message: 'Valor deve ser positivo' })
    .optional(),
  transactionId: z.string()
    .max(100, { message: 'ID da transação não pode exceder 100 caracteres' })
    .optional(),
  notes: z.string()
    .max(500, { message: 'Observações não podem exceder 500 caracteres' })
    .optional()
});

export type UpdatePaymentStatusFormData = z.infer<typeof updatePaymentStatusSchema>;

// Export de todos os tipos
export type BidderProfileFormSchema = z.infer<typeof bidderProfileFormSchema>;
export type CreditCardPaymentMethodSchema = z.infer<typeof creditCardPaymentMethodSchema>;
export type PixPaymentMethodSchema = z.infer<typeof pixPaymentMethodSchema>;
export type BoletoPaymentMethodSchema = z.infer<typeof boletoPaymentMethodSchema>;
export type PaymentMethodFormSchema = z.infer<typeof paymentMethodFormSchema>;
export type DocumentUploadSchema = z.infer<typeof documentUploadSchema>;
export type WonLotsFiltersSchema = z.infer<typeof wonLotsFiltersSchema>;
export type NotificationsFiltersSchema = z.infer<typeof notificationsFiltersSchema>;
export type ParticipationHistoryFiltersSchema = z.infer<typeof participationHistoryFiltersSchema>;
export type ProcessPaymentSchema = z.infer<typeof processPaymentSchema>;
export type GenerateBoletoSchema = z.infer<typeof generateBoletoSchema>;
export type NotificationSettingsSchema = z.infer<typeof notificationSettingsSchema>;
export type BidderSearchFiltersSchema = z.infer<typeof bidderSearchFiltersSchema>;
export type BidderImpersonationSchema = z.infer<typeof bidderImpersonationSchema>;
export type UpdateDocumentStatusSchema = z.infer<typeof updateDocumentStatusSchema>;
export type UpdateDeliveryStatusSchema = z.infer<typeof updateDeliveryStatusSchema>;
export type UpdatePaymentStatusSchema = z.infer<typeof updatePaymentStatusSchema>;
