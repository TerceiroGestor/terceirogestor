export {
  buildPersonOrderBy,
  buildPersonWhere,
  parseAdvancedFilters,
  parseGrouping,
  type AdvancedFilter,
} from './application/queries/person-list.query';

/**
 * @deprecated Aliases legados mantidos apenas para compatibilidade temporaria durante a migracao para `person`.
 */
export {
  buildPersonOrderBy as buildPeopleOrderBy,
  buildPersonWhere as buildPeopleWhere,
} from './application/queries/person-list.query';
          gte: startRaw,
          lte: endRaw,
        },
      } as Prisma.PersonWhereInput;
    }
    case 'starts':
      return {
        [field]: { startsWith: String(rawValue) },
      } as Prisma.PersonWhereInput;
    case 'ends':
      return {
        [field]: { endsWith: String(rawValue) },
      } as Prisma.PersonWhereInput;
    case 'gt':
      return { [field]: { gt: rawValue } } as Prisma.PersonWhereInput;
    case 'gte':
      return { [field]: { gte: rawValue } } as Prisma.PersonWhereInput;
    case 'lte':
      return { [field]: { lte: rawValue } } as Prisma.PersonWhereInput;
    case 'lt':
      return { [field]: { lt: rawValue } } as Prisma.PersonWhereInput;
    default:
      return null;
  }
};
