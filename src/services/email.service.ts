// src/services/email.service.ts
/**
 * @fileoverview Serviço de envio de e-mails.
 * Este arquivo contém a classe EmailService, que encapsula a lógica
 * para envio de e-mails usando SendGrid ou outros provedores.
 */
import * as nodemailer from 'nodemailer';
import * as sgMail from '@sendgrid/mail';
import { EmailLogService } from './email-log.service';

export class EmailService {
  private transporter: nodemailer.Transporter;
  private sendGridApiKey: string;
  private emailLogService: EmailLogService;

  constructor() {
    // Configuração do SendGrid
    this.sendGridApiKey = process.env.SENDGRID_API_KEY || '';
    if (this.sendGridApiKey) {
      sgMail.setApiKey(this.sendGridApiKey);
    }

    // Configuração do Nodemailer como fallback (para desenvolvimento local)
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
      port: parseInt(process.env.SMTP_PORT || '2525'),
      secure: false, // true para 465, false para outros ports
      auth: {
        user: process.env.SMTP_USER || 'your-mailtrap-user',
        pass: process.env.SMTP_PASS || 'your-mailtrap-password',
      },
    });

    this.emailLogService = new EmailLogService();
  }

  async sendContactMessage(data: {
    name: string;
    email: string;
    subject: string;
    message: string;
    contactMessageId?: bigint; // ID da mensagem de contato para associar o log
  }): Promise<{ success: boolean; message: string }> {
    try {
      const emailSubject = `Nova mensagem de contato: ${data.subject}`;
      const emailBody = `
        <h2>Nova mensagem recebida através do formulário de contato</h2>
        <p><strong>Nome:</strong> ${data.name}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        <p><strong>Assunto:</strong> ${data.subject}</p>
        <p><strong>Mensagem:</strong></p>
        <p>${data.message.replace(/\n/g, '<br>')}</p>
        <hr>
        <p><small>Esta mensagem foi enviada através do formulário de contato do BidExpert.</small></p>
      `;

      const recipient = process.env.CONTACT_EMAIL_TO || 'suporte@bidexpert.com.br';
      const provider = this.sendGridApiKey ? 'SendGrid' : 'SMTP';

      // Criar log inicial
      const emailLog = await this.emailLogService.createLog({
        recipient,
        subject: emailSubject,
        content: emailBody,
        provider,
        contactMessageId: data.contactMessageId,
      });

      try {
        if (this.sendGridApiKey) {
          // Usar SendGrid se API key estiver configurada
          const msg = {
            to: recipient,
            from: process.env.CONTACT_EMAIL_FROM || 'noreply@bidexpert.com.br',
            subject: emailSubject,
            html: emailBody,
            replyTo: data.email, // Permite responder diretamente para o usuário
          };

          await sgMail.send(msg);
        } else {
          // Fallback para Nodemailer (útil para desenvolvimento local)
          const mailOptions = {
            from: process.env.CONTACT_EMAIL_FROM || 'noreply@bidexpert.com.br',
            to: recipient,
            subject: emailSubject,
            html: emailBody,
            replyTo: data.email,
          };

          await this.transporter.sendMail(mailOptions);
        }

        // Atualizar log como enviado com sucesso
        await this.emailLogService.updateLogStatus(emailLog.id, 'SENT');
        return { success: true, message: 'E-mail enviado com sucesso.' };
      } catch (sendError: any) {
        // Atualizar log como falha
        await this.emailLogService.updateLogStatus(
          emailLog.id,
          'FAILED',
          sendError.message
        );
        throw sendError;
      }
    } catch (error: any) {
      console.error('Erro ao enviar e-mail:', error);
      return { success: false, message: `Falha ao enviar e-mail: ${error.message}` };
    }
  }

  async sendContactMessageReply(data: {
    to: string;
    name?: string | null;
    subject: string;
    message: string;
    originalMessage?: string | null;
    contactMessageId?: bigint;
  }): Promise<{ success: boolean; message: string }> {
    try {
      const emailSubject = data.subject;
      const emailBody = `
        <p>Olá${data.name ? ` ${data.name}` : ''},</p>
        <p>Recebemos sua mensagem e segue nosso retorno:</p>
        <p>${data.message.replace(/\n/g, '<br>')}</p>
        ${data.originalMessage ? `
          <hr>
          <p><strong>Mensagem original</strong></p>
          <p>${data.originalMessage.replace(/\n/g, '<br>')}</p>
        ` : ''}
        <hr>
        <p><small>Equipe BidExpert</small></p>
      `;

      const provider = this.sendGridApiKey ? 'SendGrid' : 'SMTP';
      const fromAddress = process.env.CONTACT_EMAIL_FROM || 'noreply@bidexpert.com.br';

      const emailLog = await this.emailLogService.createLog({
        recipient: data.to,
        subject: emailSubject,
        content: emailBody,
        provider,
        contactMessageId: data.contactMessageId,
      });

      try {
        if (this.sendGridApiKey) {
          const msg = {
            to: data.to,
            from: fromAddress,
            subject: emailSubject,
            html: emailBody,
            replyTo: fromAddress,
          };

          await sgMail.send(msg);
        } else {
          const mailOptions = {
            from: fromAddress,
            to: data.to,
            subject: emailSubject,
            html: emailBody,
            replyTo: fromAddress,
          };

          await this.transporter.sendMail(mailOptions);
        }

        await this.emailLogService.updateLogStatus(emailLog.id, 'SENT');
        return { success: true, message: 'Resposta enviada com sucesso.' };
      } catch (sendError: any) {
        await this.emailLogService.updateLogStatus(
          emailLog.id,
          'FAILED',
          sendError.message
        );
        throw sendError;
      }
    } catch (error: any) {
      console.error('Erro ao enviar resposta:', error);
      return { success: false, message: `Falha ao enviar resposta: ${error.message}` };
    }
  }
}