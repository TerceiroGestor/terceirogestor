"## 2026-02-07 — Família expandida\n"+
"\n"+
"### Frontend\n"+
"- Padronizamos os cards de Renda, Patrimônio e Moradia usando `FamilyCard` e `FamilyMetricField/Badge`, alinhando títulos, subtítulos, grades e rodapés (`family-card.tsx`, `family-metrics.tsx`).\n"+
"- Reordenamos o `PeopleDetailContent`: três cards no topo e explicações adicionais para Núcleo Familiar e Bens/Serviços antes das listas.\n"+
"- Simplificamos os componentes de ativos e relações familiares, adicionando listagens colapsáveis, triggers de ícone e cabeçalhos compactos em `family-assets-report.tsx`, `family-household-report.tsx` e demais páginas associadas.\n"+
"\n"+
"### Backend\n"+
"- Iniciadas as novas migrations (`family_phase1`, `family_assets`) e DTOs para rendas, bens patrimoniais e vínculos familiares.\n"+
"- Preparados serviços e migrations adicionais para sincronizar `people` com o novo módulo de família.\n"+
"\n"+
"### Testes\n"+
"- `frontend`: `npm run build` (Next.js 16.1.6) para garantir que a nova composição compile.\n"+
"\n"+
"### Próximos passos\n"+
"1. Refletir as novas APIs do backend na documentação e nos testes automatizados.\n"+
"2. Criar oficialmente o PR com esta etapa e delegar a revisão.\n"+
"3. Continuar a fase 2 (contas financeiras) usando os helpers extraídos.\n"
