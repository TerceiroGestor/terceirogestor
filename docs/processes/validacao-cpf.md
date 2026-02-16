# Validação de CPF (backend)

Este documento explica **como o CPF é normalizado e validado** no backend, quais são as regras aplicadas e onde isso acontece no código.

## Onde a validação acontece

- Funções utilitárias:
  - `backend/src/core/utils/cpf.ts`
    - `normalizeCpfOrNull(value)` — normaliza para **apenas dígitos** (`\D`), valida tamanho **11** e retorna `string` ou `null`.
    - `isValidCpfDigits(cpfDigits)` — valida os **dígitos verificadores** (algoritmo oficial) e rejeita CPFs com **todos os dígitos iguais**.
- Regra de negócio (lança erro HTTP 400):
  - `backend/src/modules/people/people.service.ts`
    - `normalizeCpfDigitsOrNull(value)` — usa as funções acima e lança `BadRequestException('CPF inválido.')` quando não passa.

Atualmente o CPF é tratado como **dado sensível** e é salvo dentro do fluxo de **documentos sensíveis**:

- DTO: `backend/src/modules/people/dto/upsert-person-sensitive-documents.dto.ts` (`cpf?: string`)
- Service: `PeopleService.upsertSensitiveDocuments(...)` chama `normalizeCpfDigitsOrNull(dto.cpf)` quando o campo é enviado.

## O que a validação garante (e o que não garante)

Garante:

- Entrada com/sem máscara é aceita (ex.: `123.456.789-09`), pois tudo é normalizado para dígitos.
- O valor tem **11 dígitos**.
- O CPF não é uma sequência inválida trivial (ex.: `00000000000`, `11111111111`, ...).
- Os **2 dígitos verificadores** (10º e 11º) batem com o cálculo de módulo 11.

Não garante:

- Existência do CPF em alguma base externa.
- Titularidade (se o CPF pertence à pessoa cadastrada).

## Regras de normalização

1. `trim()` (remove espaços nas extremidades)
2. remove tudo que não é número (`\D`)
3. se não tiver exatamente **11** dígitos → inválido

Observação: campo vazio/ausente é tratado como `null` (quando o campo é opcional no DTO). Se em algum ponto o CPF precisar ser **obrigatório**, o DTO deve exigir o campo e a regra deve lançar erro quando vier vazio.

## Algoritmo dos dígitos verificadores (módulo 11)

O CPF tem 9 dígitos base + 2 verificadores:

- **D1 (10º dígito)**: calcula com os 9 primeiros dígitos e pesos `10..2`
- **D2 (11º dígito)**: calcula com os 10 primeiros dígitos (incluindo D1) e pesos `11..2`

Cálculo (para D1 e D2):

- `soma = Σ(dígito[i] * peso[i])`
- `mod = soma % 11`
- `dv = (mod < 2) ? 0 : (11 - mod)`

Implementação: `backend/src/core/utils/cpf.ts` (`isValidCpfDigits`).

## Comportamento de erro (API)

Quando o CPF é enviado e é inválido, o backend responde com **HTTP 400** e mensagem:

- `CPF inválido.`

Isso acontece porque `normalizeCpfDigitsOrNull` lança `BadRequestException`.

## Como testar localmente (sem usar CPF real)

Para testes manuais, evite usar CPF real. Gere um CPF sintético válido (apenas para teste) com um script local, por exemplo:

```bash
node - <<'NODE'
function genCpf() {
  const base = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10));
  if (base.every((d) => d === base[0])) base[8] = (base[8] + 1) % 10;
  const calc = (len) => {
    let sum = 0;
    for (let i = 0; i < len; i += 1) sum += base[i] * (len + 1 - i);
    const mod = sum % 11;
    return mod < 2 ? 0 : 11 - mod;
  };
  const d1 = calc(9);
  base.push(d1);
  const d2 = calc(10);
  base.push(d2);
  return base.join('');
}
console.log(genCpf());
NODE
```

Depois, envie esse valor no endpoint de documentos sensíveis e confirme que não retorna 400.

## Nota LGPD (por que validar)

Validação reduz erro de digitação e inconsistência de dados, mas **não substitui** controles de privacidade e segurança.
No projeto, o CPF é tratado como dado sensível e deve ser acessado apenas por perfis com permissão apropriada (ex.: `people.sensitive.read/update`).

## Teste

node -e "function calc(d,len){let s=0;for(let i=0;i<len;i++)s+=d[i]*(len+1-i);let m=s%11;return m<2?0:11-m} function gen(){while(true){let d=Array.from({length:9},()=>Math.floor(Math.random()*10)); if(d.every(x=>x===d[0])) continue; d.push(calc(d,9)); d.push(calc(d,10)); return d.join('')} } const cpf=gen(); console.log(cpf.replace(/(\\d{3})(\\d{3})(\\d{3})(\\d{2})/,'$1.$2.$3-$4'));"
