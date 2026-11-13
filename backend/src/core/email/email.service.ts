import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly config: ConfigService) {}

  async send(input: SendEmailInput) {
    const apiKey = this.config.get<string>('RESEND_API_KEY')?.trim();
    const from =
      this.config.get<string>('EMAIL_FROM')?.trim() ?? 'no-reply@example.com';

    if (!apiKey) {
      this.logger.warn(
        `RESEND_API_KEY not configured; printing email to console (to=${input.to}, subject=${input.subject}).`,
      );
      this.logger.log(input.text);
      return { ok: true, mode: 'console' as const };
    }

    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      ...(input.html ? { html: input.html } : {}),
    });

    if (error) {
      this.logger.error(
        `Resend send failed (from=${from}, to=${input.to}): ${error.message}`,
      );
      throw new BadRequestException(
        'Falha ao enviar email. Verifique RESEND_API_KEY/EMAIL_FROM e o domínio verificado no Resend.',
      );
    }

    return { ok: true, mode: 'resend' as const };
  }
}
