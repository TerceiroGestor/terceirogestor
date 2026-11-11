/**
 * Quantos hops de proxy confiar para extrair o IP real do cliente
 * (`req.ip`) do header `X-Forwarded-For`. `rate-limit.guard.ts` e o
 * audit log (`access-log`, `audit-log`) usam `req.ip` — confiar no
 * header errado deixa qualquer cliente falsificar o próprio IP e furar
 * o rate-limit ou poluir o audit log.
 *
 * Padrão é 0 (não confia em nenhum proxy, mesmo comportamento de antes
 * desta variável existir — seguro pra ambiente local e pra qualquer
 * deploy sem proxy confiável na frente). Só aumentar quando a topologia
 * real atrás do Railway/Cloudflare estiver confirmada em staging (ver
 * item 11 de docs/auditoria-riscos.md).
 */
export function parseTrustProxyHops(raw: string | undefined): number {
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 0) return 0;
  return parsed;
}
