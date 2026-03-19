# Record Module Starter

Use this starter when creating a new module on top of the universal web client.

## Definition of done

A module is only considered complete when the full canonical flow is delivered.

The canonical standard is:

- main route opens in `table-view`
- main `searchText` searches across all visible list columns for the module
- the canonical list search input uses search icon and placeholder `Pesquisar`
- the module exposes all relevant standard views for its data shape
- row action always navigates to `detail`
- `detail` contains the complete form, not a placeholder or transitional shell
- canonical detail forms use visible field labels, not placeholder-only inputs
- canonical date inputs normalize API values before hydration so persisted dates remain visible in the form
- `detail` side includes audit and notes whenever the module supports them
- standalone business modules should prefer canonical detail routes under their own module path, such as `/group/[id]`, instead of keeping detail navigation trapped inside a parent query-string route
- when a child entity becomes a first-class module, its breadcrumb should start from that module, not from the parent entity path
- canonical side panels with large volumes of `historico` or `auditoria` must expose compact `Pesquisar` plus `SearchPanelMenu`
- canonical side tab order should prefer `Anotacoes`, `Contexto`, `Historico`, `Auditoria` when all four exist
- canonical detail headers with side panels must keep the side toggle aligned to the far right; when action buttons exist, they stay immediately to the left of the toggle
- on mobile, canonical side panels must open from a lateral overlay and must not take the full screen width, so the close affordance always remains visible
- canonical detail layouts should keep fixed headers in the three main areas: detail header, side header and relation/tab header
- canonical details must not reserve an empty control-panel strip below the navbar when the screen does not expose panel actions, filters, search, or view controls
- scrolling should keep the headers visible without trapping or hiding relation/tab content; when relation content needs more height, the main detail body may keep page scroll instead of forcing a fixed-height inner scroller
- canonical detail headers should not keep extra top padding below the navbar
- side search in `historico` and `auditoria` must match any visible value from the current item, not only a small subset of fields
- the `detail-info` summary strip must stay concise and avoid repeating dates or values already visible in the main form
- related records appear in footer tabs or equivalent standardized relation areas
- each relation/tab area uses a single compact toolbar row with `Search` and `Add`
- relation search filters across all visible columns in the related table
- the relation search input uses search icon and placeholder `Pesquisar`
- the relation search input shows the filtered total inline, following the compact search pattern
- each related list has row action to open the related `detail`
- each related list has a create action that also navigates to the related `detail`

Not every relation follows the same creation flow. The canonical standard recognizes three relation modes:

- `child relation`: the related record belongs to the parent entity and the `Add` action opens the child `detail`
- `association relation`: the related record is an N:N association and the `Add` action opens a linking flow, including bulk selection when that is the natural workflow
- `scoped relation`: the related record already belongs to the root parent and the `Add` action only associates existing parent-linked records into the current scope, such as a cycle or group

Canonical behavior by relation mode:

- `child relation`: row action opens the child `detail`, add action opens the child create/detail flow
- `association relation`: row action opens the main related entity detail, while association edits happen in a dedicated association flow, drawer, dialog, or management screen
- `scoped relation`: row action opens the main related entity detail, while add/remove actions manage scoped membership from records already linked to the parent root
- `association relation`: when the flow is "pick from another module", prefer a dialog with the related module in `table-view`, canonical search, and row action that completes the link immediately
- `scoped relation`: in child details such as group/cycle, prefer a dialog listing only records already linked to the root parent, with immediate row action to associate them to the current scope
- child entity details such as `group` and `cycle` should still render a canonical right-side panel, even when they only expose context information for now

Association history is mandatory:

- association removals must not hard-delete historical links
- project, cycle, and group memberships must use logical removal such as `deletedAt`, `endedAt`, or equivalent lifecycle fields
- the canonical UI should treat removal as closing/deactivating membership while preserving auditability and historical reports

Centralizing only the route or only the shell is not enough. Partial migrations do not satisfy this starter.

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
- Ensure the default list experience is `table-view`
- Ensure canonical `searchText` covers all visible list columns, not only the primary title field
- Ensure row action opens the canonical `detail`
- Ensure related records use canonical relation panels and actions
- Ensure relation areas do not render explanatory helper text blocks when the tab label already provides context
- Ensure relation toolbar uses only compact search plus add action
- Ensure list and relation searches use only the placeholder `Pesquisar`
- Ensure relation search shows the filtered total inline in the search field area
- Ensure each relation declares its canonical mode: `child relation`, `association relation`, or `scoped relation`
- Ensure N:N and scoped memberships use logical removal instead of hard delete when history matters
- Ensure canonical forms render labels for editable fields
- Ensure date inputs are normalized from API payload to input-compatible values
- Ensure create/edit/detail flows do not depend on temporary fallback content

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
- Confirm main route opens in `table-view`
- Confirm the main search returns matches from all visible list columns
- Confirm the canonical search input shows icon plus placeholder `Pesquisar`
- Confirm list row action opens `detail`
- Confirm `detail` has full form content
- Confirm canonical form fields render visible labels
- Confirm persisted date values remain visible after loading the detail form
- Confirm audit and notes on the side when applicable
- Confirm first-class child modules open in their own canonical route, such as `/group/[id]`, and keep the module selected in sidebar navigation
- Confirm detail breadcrumbs start from the owning module when the detail is opened from a first-class module route
- Confirm side tabs with `historico` or `auditoria` expose compact search plus `SearchPanelMenu`
- Confirm side tabs follow the canonical order `Anotacoes`, `Contexto`, `Historico`, `Auditoria` when applicable
- Confirm side-panel action buttons appear to the left of the side toggle and the toggle stays pinned to the far right of the detail header
- Confirm the mobile side panel opens as a lateral overlay narrower than the viewport, keeping the close affordance visible
- Confirm related tabs exist and open related details
- Confirm each related tab uses compact search across all visible columns
- Confirm each related search shows icon plus placeholder `Pesquisar`
- Confirm related create actions open related details
- Confirm relation add flows match the declared relation mode
- Confirm `association relation` pickers use canonical table/dialog flow with row action add
- Confirm `scoped relation` pickers only expose records already linked to the root parent
- Confirm picker dialogs use `table-view`, not `DataTable`, when they are part of the canonical module flow
- Confirm membership removals preserve historical records through logical removal
- Confirm permissions in at least one route
