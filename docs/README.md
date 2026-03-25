# Documentação Canônica

Esta pasta contém somente a documentação ativa do projeto. O padrão oficial é único e deve ser seguido por todos os módulos, sem exceções ou variações locais.

Arquivos:

- [canonical-web-client-standard.md](/c:/server/system_development/docs/canonical-web-client-standard.md)
- [canonical-business-structure.md](/c:/server/system_development/docs/canonical-business-structure.md)
- [deployment-and-update.md](/c:/server/system_development/docs/deployment-and-update.md)
- [module-canonical-checklist.md](/c:/server/system_development/docs/module-canonical-checklist.md)

Regra de ouro:

- toda nova tela deve nascer no padrão canônico
- não criar shells paralelos
- não criar SearchPanel especial por módulo
- não criar detail alternativo para `new` e `edit`
- não criar relation fora do padrão `relationSlot`
