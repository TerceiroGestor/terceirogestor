# Record Module Starter

Use this starter when creating a new module on top of the universal web client.

## Required files

1. `src/modules/<module>/config/<module>-module-contract.tsx`
2. `src/modules/<module>/config/<module>-detail-layout-contract.tsx`
3. `src/modules/<module>/features/list/ui/<module>-list-module-client-page.tsx`
4. `src/modules/<module>/features/detail/ui/<module>-detail-engine-client-page.tsx`
5. `src/web-client/registry/actions/<module>.tsx`
6. Route pages using `ScreenHost`

## Contract checklist

- Define `moduleId`, `actionKey`, `favoriteKey`
- Fill `permissions` and `actions`
- Point `queryAdapters` to list/detail/audit providers
- Reuse `createStandardListView`, `createStandardDetailView`
- Reuse `createStandardListQueryState`, `createStandardDetailQueryState`
- Provide `searchConfig`
- Provide `detailLayout` when `viewType` is `detail`
- Declare `auditSources` when the detail side needs activity feed

## Shared building blocks

- List shell: `src/web-client/record/RecordListHost.tsx`
- Detail shell: `src/web-client/detail/DetailShellEngine.tsx`
- Audit feed: `src/web-client/detail/DetailAuditFeed.tsx`
- Side tabs: `src/web-client/detail/DetailSideTabs.tsx`
- Notes panel: `src/web-client/detail/DetailNotesPanel.tsx`
- Starter helpers: `src/web-client/starter/record-module-starter.tsx`

## Minimum wiring

1. Register search view in `src/web-client/registry/index.ts`
2. Register window actions in `src/web-client/registry/index.ts`
3. Point route pages to `ScreenHost`
4. Add module definitions to `src/web-client/starter/module-standard-smoke.ts`

## Validation

- Run `npx tsc --noEmit --pretty false`
- Run `npm run build`
- Confirm list, detail, audit, side tabs, and permissions in at least one route
