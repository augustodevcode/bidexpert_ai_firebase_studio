import { z } from 'zod';

export interface WhatsAppNotificationPayload {
  to: string;
  templateName: string;
  variables: Record<string, string>;
  language?: string;
}

/**
 * @fileoverview Serviço de notificações WhatsApp via Twilio REST API.
 * Em ambiente de desenvolvimento (sem credenciais), cai em fallback log.
 */
export class WhatsAppService {
  private accountSid: string;
  private authToken: string;
  private fromNumber: string;

  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID || '';
    this.authToken = process.env.TWILIO_AUTH_TOKEN || '';
    this.fromNumber = process.env.TWILIO_WHATSAPP_NUMBER || '';
  }

  /**
   * Envia uma mensagem de notificação para WhatsApp.
   */
  async sendNotification(payload: WhatsAppNotificationPayload): Promise<boolean> {
    try {
      if (!this.accountSid || !this.authToken || !this.fromNumber) {
        console.info('[WhatsAppService] Sandbox mode / Dev mode: Credenciais do Twilio não configuradas. Mensagem WhatsApp descartada.', payload);
        return true;
      }

      // Constrói a mensagem
      let messageBody = `Nova Notificação: ${payload.templateName}\n`;
      for (const [key, value] of Object.entries(payload.variables)) {
        messageBody += `${key}: ${value}\n`;
      }

      const toFormatted = payload.to.startsWith('whatsapp:') ? payload.to : `whatsapp:+55${payload.to.replace(/\D/g, '')}`;
      const fromFormatted = this.fromNumber.startsWith('whatsapp:') ? this.fromNumber : `whatsapp:${this.fromNumber}`;

      const params = new URLSearchParams();
      params.append('To', toFormatted);
      params.append('From', fromFormatted);
      params.append('Body', messageBody);

      const authHeader = 'Basic ' + Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');
      const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[WhatsAppService] Falha na API do Twilio:', errorText);
        return false;
      }

      const data = await response.json();
      console.info(`[WhatsAppService] Mensagem enviada via Twilio com SID: ${data.sid}`);
      return true;

    } catch (error) {
      console.error('[WhatsAppService] Falha inesperada ao enviar:', error);
      return false;
    }
  }
}
