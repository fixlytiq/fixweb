import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import twilio from 'twilio';
import * as nodemailer from 'nodemailer';
import { TicketStatus } from '@prisma/client';

export interface TicketNotificationData {
  ticketId: string;
  ticketTitle: string;
  status: TicketStatus;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  storeName: string;
  storeEmail?: string;
  storePhone?: string;
  storeNotificationEmail?: string;
  estimatedCost?: number;
  total?: number;
  notes?: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private twilioClient: twilio.Twilio | null = null;
  private emailTransporter: nodemailer.Transporter | null = null;

  constructor(private configService: ConfigService) {
    this.initializeTwilio();
    this.initializeEmail();
  }

  private initializeTwilio() {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    const phoneNumber = this.configService.get<string>('TWILIO_PHONE_NUMBER');

    if (accountSid && authToken && phoneNumber) {
      try {
        this.twilioClient = twilio(accountSid, authToken);
        this.logger.log('Twilio client initialized');
      } catch (error) {
        this.logger.error('Failed to initialize Twilio client:', error);
      }
    } else {
      this.logger.warn('Twilio credentials not configured. SMS notifications will be disabled.');
    }
  }

  private initializeEmail() {
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    const smtpPort = this.configService.get<number>('SMTP_PORT', 587);
    const smtpUser = this.configService.get<string>('SMTP_USER');
    const smtpPassword = this.configService.get<string>('SMTP_PASSWORD');
    const smtpFrom = this.configService.get<string>('SMTP_FROM');

    if (smtpHost && smtpUser && smtpPassword) {
      this.emailTransporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPassword,
        },
      });
      this.logger.log('Email transporter initialized');
    } else {
      this.logger.warn('SMTP credentials not configured. Email notifications will be disabled.');
    }
  }

  private getStatusMessage(status: TicketStatus): string {
    const statusMessages: Record<TicketStatus, string> = {
      RECEIVED: 'Your repair ticket has been received and is in our queue.',
      IN_PROGRESS: 'We have started working on your repair. Our technician is now handling your device.',
      AWAITING_PARTS: 'Your repair is waiting for parts to arrive. We will update you once the parts are available.',
      READY: 'Great news! Your repair is complete and ready for pickup.',
      COMPLETED: 'Your repair has been completed. Thank you for choosing us!',
      CANCELLED: 'Your repair ticket has been cancelled.',
    };
    return statusMessages[status] || 'Your repair ticket status has been updated.';
  }

  private formatCurrency(amount?: number): string {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }

  async sendTicketStatusUpdate(data: TicketNotificationData): Promise<void> {
    const promises: Promise<void>[] = [];

    // Send SMS if phone number is available
    if (data.customerPhone && this.twilioClient) {
      promises.push(this.sendSMS(data));
    }

    // Send email if email is available
    if (data.customerEmail && this.emailTransporter) {
      promises.push(this.sendEmail(data));
    }

    // Execute all notifications in parallel
    await Promise.allSettled(promises).then((results) => {
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const type = index === 0 && data.customerPhone ? 'SMS' : 'Email';
          this.logger.error(`Failed to send ${type} notification:`, result.reason);
        }
      });
    });
  }

  private async sendSMS(data: TicketNotificationData): Promise<void> {
    if (!this.twilioClient || !data.customerPhone) {
      return;
    }

    try {
      // Use store's phone number if available, otherwise fall back to default Twilio number
      const fromPhoneNumber = data.storePhone || this.configService.get<string>('TWILIO_PHONE_NUMBER');
      if (!fromPhoneNumber) {
        this.logger.warn('No phone number configured for SMS sending');
        return;
      }

      const customerName = data.customerName || 'Customer';
      const statusMessage = this.getStatusMessage(data.status);
      
      let message = `Hi ${customerName}, ${statusMessage}\n\n`;
      message += `Ticket: ${data.ticketTitle}\n`;
      message += `Ticket ID: ${data.ticketId}\n`;
      message += `Store: ${data.storeName}\n`;

      if (data.status === TicketStatus.READY || data.status === TicketStatus.COMPLETED) {
        if (data.total) {
          message += `Total: ${this.formatCurrency(data.total)}\n`;
        } else if (data.estimatedCost) {
          message += `Estimated Cost: ${this.formatCurrency(data.estimatedCost)}\n`;
        }
      }

      if (data.notes) {
        message += `\nNote: ${data.notes}`;
      }

      message += `\n\nThank you for choosing ${data.storeName}!`;

      await this.twilioClient.messages.create({
        body: message,
        from: fromPhoneNumber,
        to: data.customerPhone,
      });

      this.logger.log(`SMS sent successfully to ${data.customerPhone} for ticket ${data.ticketId}`);
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${data.customerPhone}:`, error);
      throw error;
    }
  }

  private async sendEmail(data: TicketNotificationData): Promise<void> {
    if (!this.emailTransporter || !data.customerEmail) {
      return;
    }

    try {
      // Use store's notification email if available, otherwise use store email, then fall back to default
      const smtpFrom = data.storeNotificationEmail || data.storeEmail || this.configService.get<string>('SMTP_FROM') || 'noreply@fixlytiq.com';
      const customerName = data.customerName || 'Customer';
      const statusMessage = this.getStatusMessage(data.status);

      const subject = `Repair Ticket Update - ${data.ticketTitle}`;

      let htmlBody = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9f9f9; padding: 20px; margin-top: 20px; }
            .ticket-info { background-color: white; padding: 15px; margin: 10px 0; border-left: 4px solid #4CAF50; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            .status-badge { display: inline-block; padding: 5px 10px; background-color: #4CAF50; color: white; border-radius: 3px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Repair Ticket Status Update</h2>
            </div>
            <div class="content">
              <p>Hi ${customerName},</p>
              <p>${statusMessage}</p>
              
              <div class="ticket-info">
                <p><strong>Ticket:</strong> ${data.ticketTitle}</p>
                <p><strong>Ticket ID:</strong> ${data.ticketId}</p>
                <p><strong>Status:</strong> <span class="status-badge">${data.status.replace('_', ' ')}</span></p>
                <p><strong>Store:</strong> ${data.storeName}</p>
              </div>
      `;

      if (data.status === TicketStatus.READY || data.status === TicketStatus.COMPLETED) {
        if (data.total) {
          htmlBody += `<p><strong>Total Amount:</strong> ${this.formatCurrency(data.total)}</p>`;
        } else if (data.estimatedCost) {
          htmlBody += `<p><strong>Estimated Cost:</strong> ${this.formatCurrency(data.estimatedCost)}</p>`;
        }
      }

      if (data.notes) {
        htmlBody += `<div class="ticket-info"><p><strong>Note:</strong> ${data.notes}</p></div>`;
      }

      htmlBody += `
              <p>If you have any questions, please contact us.</p>
              <p>Thank you for choosing ${data.storeName}!</p>
            </div>
            <div class="footer">
              <p>This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const textBody = `
Hi ${customerName},

${statusMessage}

Ticket: ${data.ticketTitle}
Ticket ID: ${data.ticketId}
Status: ${data.status.replace('_', ' ')}
Store: ${data.storeName}
${data.total ? `Total: ${this.formatCurrency(data.total)}` : data.estimatedCost ? `Estimated Cost: ${this.formatCurrency(data.estimatedCost)}` : ''}
${data.notes ? `\nNote: ${data.notes}` : ''}

Thank you for choosing ${data.storeName}!
      `.trim();

      await this.emailTransporter.sendMail({
        from: smtpFrom,
        to: data.customerEmail,
        subject: subject,
        text: textBody,
        html: htmlBody,
      });

      this.logger.log(`Email sent successfully to ${data.customerEmail} for ticket ${data.ticketId}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${data.customerEmail}:`, error);
      throw error;
    }
  }
}

