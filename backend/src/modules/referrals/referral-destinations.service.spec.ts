import { buildReferralDestinationWhere } from './referral-destinations.service';
import type { ListReferralDestinationsQueryDto } from './dto/list-referral-destinations-query.dto';

describe('buildReferralDestinationWhere', () => {
  it('sempre filtra por tenantId, mesmo sem nenhum outro filtro', () => {
    const query: ListReferralDestinationsQueryDto = {};
    const where = buildReferralDestinationWhere({
      tenantId: 'tenant-a',
      query,
    });

    expect(where.tenantId).toBe('tenant-a');
  });

  it('busca livre (q) filtra pelo nome, sem deixar vazar tenantId de outro tenant', () => {
    const query: ListReferralDestinationsQueryDto = { q: 'hospital' };
    const where = buildReferralDestinationWhere({
      tenantId: 'tenant-a',
      query,
    });

    expect(where.tenantId).toBe('tenant-a');
    expect(where.name).toEqual({ contains: 'hospital', mode: 'insensitive' });
  });
});
