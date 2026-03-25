# Checklist de Módulo Canônico

Use esta lista antes de considerar um módulo concluído.

## List

- usa `RecordListHost`
- tem botão `Novo`
- usa `SearchPanel` padrão
- `Filter` e `Group` funcionam
- `typeviews` seguem o padrão do sistema
- colunas base incluem `Tags`, `Cadastro` e `Status` quando aplicável

## Detail

- `new` e `edit` usam o mesmo formulário principal
- o detail não tem botão `Novo`
- `Excluir` aparece quando permitido
- o body principal não duplica `Tags`

## Side

- usa `StandardDetailMetadataSide`
- abas fixas:
  - `Auditoria`
  - `Comentarios`
  - `Notas internas`
  - `Tags`
  - `Anexos`
  - `Historico`
  - `Contexto`

## Relations

- relations ficam no rodapé
- relations usam list canônico
- relation abre detail do item relacionado
- relation não depende de tela legada

## Consistência

- nenhum texto técnico aparece para o usuário
- nomes em português nas labels visíveis
- nenhum componente legado fora do shell canônico
- builds de backend e frontend passam
