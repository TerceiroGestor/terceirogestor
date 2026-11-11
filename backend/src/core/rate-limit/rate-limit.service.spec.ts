import { RateLimitService } from './rate-limit.service';

describe('RateLimitService', () => {
  let service: RateLimitService;

  beforeEach(() => {
    service = new RateLimitService();
  });

  it('permite a primeira chamada de uma chave nova', () => {
    const result = service.consume('key-1', 60_000, 3);
    expect(result).toEqual({
      allowed: true,
      remaining: 2,
      resetAt: expect.any(Number),
    });
  });

  it('permite até o limite e bloqueia a partir da chamada seguinte', () => {
    expect(service.consume('key-2', 60_000, 3).allowed).toBe(true);
    expect(service.consume('key-2', 60_000, 3).allowed).toBe(true);
    expect(service.consume('key-2', 60_000, 3).allowed).toBe(true);

    const blocked = service.consume('key-2', 60_000, 3);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it('bloqueia a primeira chamada quando max é 0 (bucket recém-criado)', () => {
    const result = service.consume('key-zero', 60_000, 0);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('mantém contadores independentes por chave', () => {
    service.consume('key-a', 60_000, 1);
    const blockedA = service.consume('key-a', 60_000, 1);
    const allowedB = service.consume('key-b', 60_000, 1);

    expect(blockedA.allowed).toBe(false);
    expect(allowedB.allowed).toBe(true);
  });

  it('libera a janela novamente depois que resetAt passa', () => {
    jest.useFakeTimers();
    try {
      jest.setSystemTime(0);
      expect(service.consume('key-3', 1_000, 1).allowed).toBe(true);
      expect(service.consume('key-3', 1_000, 1).allowed).toBe(false);

      jest.setSystemTime(1_001);
      expect(service.consume('key-3', 1_000, 1).allowed).toBe(true);
    } finally {
      jest.useRealTimers();
    }
  });
});
