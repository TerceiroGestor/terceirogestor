@file:desenvolvimento-orientado-contratos.agent.md 

CONTEXTO:
docs/people/feature-beneficiario.md

OBJETIVO DA FEATURE:
Garantir o cadastro correto de beneficiários com fluxo consistente e previsível.

TAREFA:
Revisar a funcionalidade de criação de beneficiário considerando:

- O fluxo correto deve ser:
  → criação apenas via clique no botão "Save"
  → NÃO deve ocorrer autosave na criação

VALIDAÇÕES:

1. Verificar se existe qualquer lógica de autosave na criação
2. Garantir que a persistência só ocorre após ação explícita do usuário
3. Validar possíveis efeitos colaterais:
   - criação parcial de registros
   - múltiplas gravações
   - inconsistência de estado

4. Conferir aderência com:
   - conventions.md
   - patterns.md (ex: DataProvider, DetailShell)
   - decisions.md (fluxo de criação)

REGRAS:
- NÃO corrigir automaticamente
- NÃO alterar código
- Apenas analisar

SAÍDA:

### Análise
- problemas encontrados
- violações de padrão

### Riscos
- impactos no sistema

### Pendências
- lista objetiva de ajustes necessários

### Sugestão de Correção
- como deveria funcionar corretamente