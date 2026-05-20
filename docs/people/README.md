## Refatoração e Segregação de Subfluxos

- Desde 2026-05, todos os fluxos patrimoniais/familiares, metadata (comentários/anexos) e validação de registros foram extraídos do service raiz (`PersonService`) para services dedicados.
- O `PersonService` tornou-se uma fachada fina, delegando operações para os services de domínio conforme o blueprint do backend.
- Helpers privados duplicados foram eliminados, centralizando lógica de validação e acesso em cada boundary.
- O padrão de extração incremental e delegação deve ser seguido para novos subfluxos.
# People - Documentacao por Feature

Este diretorio concentra a documentacao operacional do modulo People em um arquivo por feature, usando o template padrao.

## Objetivo

Manter uma fonte unica por feature para reduzir duplicacao, facilitar manutencao e preservar historico de decisoes.

## Features consolidadas (fonte principal)

- `feature-beneficiario.md`
- `feature-relacoes.md`
- `feature-sideshell.md`
- `feature-documentos-sensiveis.md`

## Convencoes

- Cada feature segue o template padrao: Status, Objetivo, Checklist, Pendencias, Decisoes Tecnicas e Historico de Alteracoes.
- Itens transversais ficam referenciados no arquivo de feature relevante, sem copiar conteudo entre arquivos.

## Escopo atual da pasta

Esta pasta deve conter apenas o README e os arquivos de feature atuais do modulo People.
