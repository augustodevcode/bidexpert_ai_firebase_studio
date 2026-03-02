// src/services/whatsapp.service.ts
/**
 * @fileoverview Serviço de notificações WhatsApp via Twilio REST API.
 *
 * Usa fetch nativo (sem pacote npm adicional) para enviar mensagens
 * WhatsApp para o administrador via sandbox Twilio.
 *
 * Em ambiente de desenvolvimento (sem credenciais configuradas),
 * cai em fallback para console.info sem lançar erro.
 */

export interface WhatsAppNotificationPayload {
  to: string;
  message: string;
}

export class WhatsAppService {
  private readonly accountSid: string;
  private readonly authToken: string;
  private readonly fromNumber: string;
  private readonly isDev: boolean;

  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID || '';
    this.authToken = process.env.TWILIO_AUTH_TOKEN || '';
    this.fromNumber = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';

    this.isDev =
      !this.accountSid ||
      this.accountSid.startsWith('AC_FAKE') ||
      !this.authToken;
  }

  async sendNotification(payload: WhatsAppNotificationPayload): Promise<{ success: boolean; message: string }> {
    const { to, message } = payload;

    if (this.isDev) {
      console.info(`[WhatsApp DEV] → Para: ${to}\n${message}`);
      return { success: true, message: 'WhatsApp simulado (dev mode).' };
    }

    const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;

    const body = new URLSearchParams({
      From: this.fromNumber,
      To: to,
      Body: message,
    });

    const basicAuth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
        signal: AbortSignal.timeout(10_000),
      });

      if (!response.ok) {
        const text = await response.text();
        console.error(`[WhatsApp] Erro Twilio (${response.status}): ${text}`);
        return { success: false, message: `Twilio retornou ${response.status}` };
      }

      console.info(`[WhatsApp] Mensagem enviada para ${to}`);
      return { success: true, message: 'WhatsApp enviado com sucesso.' };
    } catch (error: any) {
      console.error('[WhatsApp] Erro ao chamar Twilio:', error.message);
      return { success: false, message: `Falha ao enviar WhatsApp: ${error.message}` };
    }
  }
}
