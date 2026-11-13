import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { EmailService } from './email.service';

const sendMock = jest.fn();

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: sendMock },
  })),
}));

function makeConfig(values: Record<string, string | undefined>) {
  return { get: (key: string) => values[key] } as unknown as ConfigService;
}

describe('EmailService', () => {
  beforeEach(() => {
    sendMock.mockReset();
  });

  it('imprime no console e não chama o Resend quando RESEND_API_KEY não está configurada', async () => {
    const service = new EmailService(makeConfig({}));

    const result = await service.send({
      to: 'pessoa@example.com',
      subject: 'Assunto',
      text: 'Corpo',
    });

    expect(result).toEqual({ ok: true, mode: 'console' });
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('envia pelo Resend quando RESEND_API_KEY está configurada', async () => {
    sendMock.mockResolvedValue({ data: { id: 'email_123' }, error: null });
    const service = new EmailService(
      makeConfig({
        RESEND_API_KEY: 're_test_key',
        EMAIL_FROM: 'no-reply@terceirogestor.local',
      }),
    );

    const result = await service.send({
      to: 'pessoa@example.com',
      subject: 'Assunto',
      text: 'Corpo',
      html: '<p>Corpo</p>',
    });

    expect(result).toEqual({ ok: true, mode: 'resend' });
    expect(sendMock).toHaveBeenCalledWith({
      from: 'no-reply@terceirogestor.local',
      to: 'pessoa@example.com',
      subject: 'Assunto',
      text: 'Corpo',
      html: '<p>Corpo</p>',
    });
  });

  it('lança BadRequestException quando o Resend retorna erro', async () => {
    sendMock.mockResolvedValue({
      data: null,
      error: { name: 'validation_error', message: 'Domínio não verificado' },
    });
    const service = new EmailService(
      makeConfig({ RESEND_API_KEY: 're_test_key' }),
    );

    await expect(
      service.send({
        to: 'pessoa@example.com',
        subject: 'Assunto',
        text: 'Corpo',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
