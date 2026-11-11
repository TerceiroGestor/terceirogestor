import { parseTrustProxyHops } from './trust-proxy';

describe('parseTrustProxyHops', () => {
  it('é 0 por padrão quando a variável não está definida', () => {
    expect(parseTrustProxyHops(undefined)).toBe(0);
  });

  it('é 0 para valores inválidos (não numéricos)', () => {
    expect(parseTrustProxyHops('abc')).toBe(0);
    expect(parseTrustProxyHops('')).toBe(0);
  });

  it('é 0 para números negativos ou não inteiros', () => {
    expect(parseTrustProxyHops('-1')).toBe(0);
    expect(parseTrustProxyHops('1.5')).toBe(0);
  });

  it('aceita um número inteiro não-negativo válido', () => {
    expect(parseTrustProxyHops('0')).toBe(0);
    expect(parseTrustProxyHops('1')).toBe(1);
    expect(parseTrustProxyHops('3')).toBe(3);
  });
});
