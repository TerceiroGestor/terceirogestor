"use client";

import * as React from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilterDrawer } from "@/components/FilterEngine/FilterDrawer";
import type { Domain } from "@/web-client/domain/types";
import type { SearchViewDefinition } from "@/web-client/search/types";
import { AdvancedFilterBuilder } from "./AdvancedFilterBuilder";

export function FilterMenu({
  searchView,
  domain,
  onChange,
}: {
  searchView: SearchViewDefinition;
  domain: Domain;
  onChange: (next: Domain) => void;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        title="Filtros"
      >
        <SlidersHorizontal className="mr-2 size-4" />
        Filtros
      </Button>

      <FilterDrawer open={open} onOpenChange={setOpen} title="Filtros avanÃ§ados">
        <AdvancedFilterBuilder
          searchView={searchView}
          value={domain}
          onChange={onChange}
        />
      </FilterDrawer>
    </>
  );
}

