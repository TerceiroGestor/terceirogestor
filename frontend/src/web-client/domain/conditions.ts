"use client";

import type { Domain, DomainCombinator, DomainCondition } from "./types";

export function collectConditions(
  domain: Domain,
  combinator: DomainCombinator,
): DomainCondition[] | null {
  if (!domain) return [];
  if (domain.type === "condition") return [domain];
  if (domain.type === "not") return null;
  if (domain.type === "group") {
    if (domain.combinator !== combinator) return null;
    const all: DomainCondition[] = [];
    for (const child of domain.children) {
      const flattened = collectConditions(child, combinator);
      if (!flattened) return null;
      all.push(...flattened);
    }
    return all;
  }
  return null;
}

export function collectAndConditions(domain: Domain): DomainCondition[] | null {
  return collectConditions(domain, "and");
}

export function domainFromConditions(
  combinator: DomainCombinator,
  conditions: DomainCondition[],
): Domain {
  if (!conditions.length) return null;
  if (conditions.length === 1) return conditions[0];
  return { type: "group", combinator, children: conditions };
}

export function removeConditionAtIndex(
  domain: Domain,
  combinator: DomainCombinator,
  index: number,
): Domain {
  const conditions = collectConditions(domain, combinator);
  if (!conditions) return null;
  const next = conditions.filter((_, i) => i !== index);
  return domainFromConditions(combinator, next);
}

/**
 * Troca (ou remove) a condição de um campo dentro de um domínio combinado
 * por "and", preservando as outras condições - usado pelos atalhos rápidos
 * do `SearchPanelMenu` (ex.: período de uma vez, sem abrir o construtor de
 * filtro completo). Quando o domínio atual não é decomponível em "and"
 * (ex.: já tem um grupo "or"), não arrisca reescrever a árvore inteira: só
 * agrupa a condição nova ao lado do que já existe.
 */
export function upsertAndCondition(
  domain: Domain,
  field: string,
  condition: DomainCondition | null,
): Domain {
  const conditions = collectConditions(domain, "and");
  if (conditions) {
    const next = conditions.filter((entry) => entry.field !== field);
    if (condition) next.push(condition);
    return domainFromConditions("and", next);
  }

  if (!domain) return condition;
  if (!condition) return domain;
  return { type: "group", combinator: "and", children: [domain, condition] };
}
