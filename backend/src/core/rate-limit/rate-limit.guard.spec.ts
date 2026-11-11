import { ExecutionContext, HttpException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RateLimitGuard } from './rate-limit.guard';
import { RateLimitService } from './rate-limit.service';
import type { RateLimitOptions } from './rate-limit.types';

function makeContext(req: Record<string, unknown>): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => req }),
    getHandler: () => ({}) as never,
    getClass: () => ({}) as never,
  } as unknown as ExecutionContext;
}

describe('RateLimitGuard', () => {
  let limiter: RateLimitService;

  beforeEach(() => {
    limiter = new RateLimitService();
  });

  function makeGuard(options: RateLimitOptions | undefined) {
    const reflector = {
      getAllAndOverride: () => options,
    } as unknown as Reflector;
    return new RateLimitGuard(reflector, limiter);
  }

  it('deixa passar quando o handler não tem @RateLimit', () => {
    const guard = makeGuard(undefined);
    const context = makeContext({ ip: '203.0.113.1' });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('deixa passar enquanto estiver dentro do limite', () => {
    const guard = makeGuard({
      name: 'test.endpoint',
      windowMs: 60_000,
      max: 2,
    });
    const context = makeContext({ ip: '203.0.113.1', path: '/x', method: 'POST' });

    expect(guard.canActivate(context)).toBe(true);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('lança 429 com retryAfterSeconds ao exceder o limite', () => {
    const guard = makeGuard({
      name: 'test.endpoint',
      windowMs: 60_000,
      max: 1,
    });
    const context = makeContext({ ip: '203.0.113.1', path: '/x', method: 'POST' });

    expect(guard.canActivate(context)).toBe(true);

    try {
      guard.canActivate(context);
      throw new Error('deveria ter lançado HttpException');
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      const response = (error as HttpException).getResponse() as {
        retryAfterSeconds: number;
      };
      expect((error as HttpException).getStatus()).toBe(429);
      expect(response.retryAfterSeconds).toBeGreaterThan(0);
    }
  });

  it('usa a mensagem customizada quando fornecida', () => {
    const guard = makeGuard({
      name: 'test.endpoint',
      windowMs: 60_000,
      max: 0,
      message: 'Calma lá.',
    });
    const context = makeContext({ ip: '203.0.113.1', path: '/x', method: 'POST' });

    try {
      guard.canActivate(context);
      throw new Error('deveria ter lançado HttpException');
    } catch (error) {
      const response = (error as HttpException).getResponse() as {
        message: string;
      };
      expect(response.message).toBe('Calma lá.');
    }
  });

  it('trata tentativas de dois IPs diferentes como buckets separados (keyParts: ip)', () => {
    const guard = makeGuard({
      name: 'test.endpoint',
      windowMs: 60_000,
      max: 1,
      keyParts: ['ip'],
    });

    expect(guard.canActivate(makeContext({ ip: '203.0.113.1' }))).toBe(true);
    expect(guard.canActivate(makeContext({ ip: '203.0.113.2' }))).toBe(true);
    expect(() => guard.canActivate(makeContext({ ip: '203.0.113.1' }))).toThrow(
      HttpException,
    );
  });

  it('separa buckets por tenantId (keyParts: tenantId)', () => {
    const guard = makeGuard({
      name: 'test.endpoint',
      windowMs: 60_000,
      max: 1,
      keyParts: ['tenantId'],
    });

    expect(
      guard.canActivate(makeContext({ tenantId: 'tenant-a' })),
    ).toBe(true);
    expect(
      guard.canActivate(makeContext({ tenantId: 'tenant-b' })),
    ).toBe(true);
    expect(() =>
      guard.canActivate(makeContext({ tenantId: 'tenant-a' })),
    ).toThrow(HttpException);
  });

  it('separa buckets por path+method (keyParts padrão)', () => {
    const guard = makeGuard({ name: 'test.endpoint', windowMs: 60_000, max: 1 });

    expect(
      guard.canActivate(makeContext({ ip: '1.1.1.1', path: '/a', method: 'POST' })),
    ).toBe(true);
    expect(
      guard.canActivate(makeContext({ ip: '1.1.1.1', path: '/b', method: 'POST' })),
    ).toBe(true);
    expect(
      guard.canActivate(makeContext({ ip: '1.1.1.1', path: '/a', method: 'GET' })),
    ).toBe(true);
  });

  it('normaliza o valor de bodyField (trim + lowercase) antes de usar como chave', () => {
    const guard = makeGuard({
      name: 'test.endpoint',
      windowMs: 60_000,
      max: 1,
      bodyField: 'email',
      keyParts: ['bodyField'],
    });

    expect(
      guard.canActivate(makeContext({ body: { email: '  User@Example.com  ' } })),
    ).toBe(true);
    // Mesmo e-mail, capitalização e espaços diferentes - mesma chave.
    expect(() =>
      guard.canActivate(makeContext({ body: { email: 'user@example.com' } })),
    ).toThrow(HttpException);
  });
});
