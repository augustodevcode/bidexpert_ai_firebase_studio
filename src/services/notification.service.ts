// src/services/notification.service.ts
/**
 * @fileoverview Este arquivo contém a classe NotificationService, responsável
 * por toda a lógica de envio de notificações da plataforma, como e-mails para
 * assinantes sobre novos leilões.
 * 
 * ATENÇÃO: Esta é uma implementação de placeholder (simulada). Em um ambiente
 * de produção, aqui seria integrada uma API de um provedor de e-mail real
 * como SendGrid, Mailgun, AWS SES, etc.
 */

import type { Subscriber } from '@prisma/client';
import type { Auction } from '@/types';
import { getPrismaInstance } from '@/lib/prisma';
import logger from '@/lib/logger';

export class NotificationService {
  private prisma;

  constructor() {
    this.prisma = getPrismaInstance();
  }
  
  /**
   * Simula o envio de um e-mail para um assinante sobre um novo leilão.
   * @param subscriber - O objeto do assinante.
   * @param auction - O objeto do leilão.
   */
  private async sendEmail(subscriber: Subscriber, subject: string, body: string): Promise<void> {
    // LÓGICA DE ENVIO DE E-MAIL REAL IRIA AQUI
    logger.info(`[NotificationService] SIMULATING EMAIL SEND`);
    logger.info(`  - To: ${subscriber.email}`);
    logger.info(`  - Subject: ${subject}`);
    logger.info(`  - Body: ${body.substring(0, 100)}...`);
    
    // Simula uma pequena demora de rede
    await new Promise(resolve => setTimeout(resolve, 50)); 
  }

  /**
   * Dispara o envio de notificações sobre um novo leilão para todos os assinantes
   * que optaram por receber este tipo de alerta.
   * @param auction - O leilão que acabou de ser publicado.
   */
  async notifySubscribersOfNewAuction(auction: Auction): Promise<{ success: boolean; message: string; notificationsSent: number }> {
    try {
      const allSubscribers = await this.prisma.subscriber.findMany({
        where: {
          isVerified: true, // Apenas para assinantes verificados
          preferences: {
            // @ts-ignore - Prisma JSON filtering might need specific types
            path: ['notifyOnNewAuction'],
            equals: true,
          },
        },
      });

      if (allSubscribers.length === 0) {
        return { success: true, message: "Nenhum assinante para notificar.", notificationsSent: 0 };
      }

      logger.info(`[NotificationService] Iniciando envio de notificação sobre o leilão "${auction.title}" para ${allSubscribers.length} assinante(s).`);
      
      const subject = `Novo Leilão na BidExpert: ${auction.title}`;
      const body = `
        <p>Olá!</p>
        <p>Um novo leilão que pode te interessar acaba de ser publicado em nossa plataforma: <strong>${auction.title}</strong>.</p>
        <p>O leilão inicia em ${auction.auctionDate ? new Date(auction.auctionDate).toLocaleDateString('pt-BR') : 'data a ser definida'} e conta com ${auction.totalLots || 0} lotes.</p>
        <p>Clique no link abaixo para ver todos os detalhes:</p>
        <a href="https://bidexpert.com.br/auctions/${auction.publicId || auction.id}">Ver Leilão Agora</a>
        <br/><br/>
        <p>Atenciosamente,<br/>Equipe BidExpert</p>
      `;

      for (const subscriber of allSubscribers) {
        await this.sendEmail(subscriber, subject, body);
      }

      const message = `${allSubscribers.length} notificações sobre o novo leilão foram enviadas com sucesso.`;
      logger.info(`[NotificationService] ${message}`);
      return { success: true, message, notificationsSent: allSubscribers.length };

    } catch (error: any) {
      logger.error("[NotificationService] Falha ao enviar notificações de novo leilão:", error);
      return { success: false, message: `Erro ao processar notificações: ${error.message}`, notificationsSent: 0 };
    }
  }
}
