import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export class PaymentMethodService {
  private prisma;

  constructor() {
    this.prisma = prisma;
  }

  /**
   * Cria um novo método de pagamento
   * @param data Dados do método de pagamento
   * @returns O método de pagamento criado
   */
  async createPaymentMethod(data: Prisma.PaymentMethodCreateInput) {
    return this.prisma.paymentMethod.create({
      data,
    });
  }

  /**
   * Obtém um método de pagamento por ID
   * @param id ID do método de pagamento
   * @returns O método de pagamento encontrado ou null
   */
  async getPaymentMethodById(id: bigint) {
    return this.prisma.paymentMethod.findUnique({
      where: { id },
    });
  }

  /**
   * Lista os métodos de pagamento de um comprador
   * @param bidderId ID do comprador
   * @returns Lista de métodos de pagamento
   */
  async listPaymentMethodsByBidder(bidderId: bigint) {
    return this.prisma.paymentMethod.findMany({
      where: { bidderId },
      orderBy: { isDefault: 'desc' },
    });
  }

  /**
   * Define um método de pagamento como padrão
   * @param id ID do método de pagamento
   * @param bidderId ID do comprador (para segurança)
   * @returns O método de pagamento atualizado
   */
  async setDefaultPaymentMethod(id: bigint, bidderId: bigint) {
    // Primeiro, remove o padrão de todos os métodos do comprador
    await this.prisma.paymentMethod.updateMany({
      where: { bidderId, isDefault: true },
      data: { isDefault: false },
    });

    // Depois define o método específico como padrão
    return this.prisma.paymentMethod.update({
      where: { id, bidderId },
      data: { isDefault: true },
    });
  }

  /**
   * Remove um método de pagamento
   * @param id ID do método de pagamento
   * @param bidderId ID do comprador (para segurança)
   * @returns O método de pagamento removido
   */
  async deletePaymentMethod(id: bigint, bidderId: bigint) {
    return this.prisma.paymentMethod.delete({
      where: { id, bidderId },
    });
  }
}
