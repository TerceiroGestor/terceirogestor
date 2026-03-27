# Documentacao Canonica

Esta pasta contem somente a documentacao ativa do projeto. O padrao oficial e unico e deve ser seguido por todos os modulos, sem excecoes ou variacoes locais.

Arquivos:

- [marco-zero-1.0.md](/c:/server/system_development/docs/marco-zero-1.0.md)
- [canonical-web-client-standard.md](/c:/server/system_development/docs/canonical-web-client-standard.md)
- [canonical-business-structure.md](/c:/server/system_development/docs/canonical-business-structure.md)
- [deployment-and-update.md](/c:/server/system_development/docs/deployment-and-update.md)
- [module-canonical-checklist.md](/c:/server/system_development/docs/module-canonical-checklist.md)

Regra de ouro:

- toda nova tela deve nascer no padrao canonico
- nao criar shells paralelos
- nao criar SearchPanel especial por modulo
- nao criar detail alternativo para `new` e `edit`
- nao criar relation fora do padrao `relationSlot`
- nao quebrar o contrato do `Marco Zero 1.0`
