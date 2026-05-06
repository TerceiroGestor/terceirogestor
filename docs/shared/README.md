# shared/README.md

## Objetivo

Este diretorio e a fonte oficial de convencoes, decisoes e patterns do projeto.

---

## Escopo

- Regras globais para frontend, backend, tenancy, acesso e banco.
- Regras de implementacao e operacao por modulo.
- Padroes reutilizaveis validados no codigo.

---

## Documentos principais

- `conventions.md`: convencoes obrigatorias do projeto.
- `decisions.md`: decisoes tecnicas ativas e governanca de modulos.
- `patterns.md`: patterns reutilizaveis implementados.
- `marco-zero-1.0.md`: contrato, checklist, plano e operacao de auditoria 1.0.
- `marco-zero-1.0-audit-matrix.csv`: matriz operacional consolidada de auditoria.

---

## Regra de governanca

- Toda nova feature ou refactor deve estar aderente ao que esta em `docs/shared`.
- Em conflito entre documento antigo e `docs/shared`, prevalece `docs/shared`.
- Nova convencao ou decisao deve ser registrada aqui no mesmo PR da mudanca de codigo.
- Nao devem existir copias normativas desses contratos fora de `docs/shared`.
- O conjunto minimo oficial de governanca e composto por: `README.md`, `conventions.md`, `decisions.md`, `patterns.md`, `marco-zero-1.0.md` e `marco-zero-1.0-audit-matrix.csv`.
