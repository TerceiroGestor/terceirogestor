"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SectionCard } from "@/components/section-card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/features/auth/auth-context";
import { useCurrentUser } from "@/features/auth/current-user-context";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";
import { listPantryItems, type ApiPantryItem } from "@/modules/pantry/api";
import {
  PantryMovementWorkspace,
  type PantryMovementDialogItem,
} from "@/modules/pantry/shared/ui/pantry-movement-workspace";
import { PageControlPanel } from "@/web-client/control-panel/PageControlPanel";

export function PantryExitSheetPage() {
  const router = useRouter();
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname);
  const searchParams = useSearchParams();

  const { token } = useAuth();
  const { permissions } = useCurrentUser();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();

  const canRead = permissions.includes("pantry.read");
  const enabled = Boolean(token && isAuthenticated && canRead && !authLoading);

  const itemId = searchParams.get("itemId") ?? "";
  const sectorParam = searchParams.get("sector") ?? "";

  const [items, setItems] = React.useState<ApiPantryItem[]>([]);
  const [loadingItems, setLoadingItems] = React.useState(false);

  const itemsById = React.useMemo(() => {
    return new Map(items.map((item) => [item.id, item]));
  }, [items]);

  const selectedItem = React.useMemo(() => {
    if (!itemId) return null;
    return itemsById.get(itemId) ?? null;
  }, [itemId, itemsById]);

  const preferredSector = React.useMemo(() => {
    if (sectorParam.trim()) return sectorParam.trim();
    return selectedItem?.defaultSector?.trim() || "Geral";
  }, [sectorParam, selectedItem?.defaultSector]);

  const movementItem = React.useMemo<PantryMovementDialogItem | null>(() => {
    if (!selectedItem) return null;
    return {
      id: selectedItem.id,
      name: selectedItem.name,
      unit: selectedItem.unit,
      stock: selectedItem.stock,
      minStock: selectedItem.minStock,
    };
  }, [selectedItem]);

  const updateQuery = React.useCallback(
    (next: { itemId?: string; sector?: string }) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next.itemId !== undefined) {
        if (next.itemId) params.set("itemId", next.itemId);
        else params.delete("itemId");
      }
      if (next.sector !== undefined) {
        if (next.sector) params.set("sector", next.sector);
        else params.delete("sector");
      }

      const query = params.toString();
      router.push(
        `${withTenantPath("/pantry/exit", tenantSlug)}${query ? `?${query}` : ""}`,
      );
    },
    [router, searchParams, tenantSlug],
  );

  const loadItems = React.useCallback(async () => {
    if (!enabled || !token) return;
    setLoadingItems(true);
    try {
      const response = await listPantryItems(token, { all: true, limit: 200 });
      setItems(response.data);
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "Falha ao carregar alimentos.";
      toast({ variant: "destructive", title: "Falha ao carregar", description: message });
      setItems([]);
    } finally {
      setLoadingItems(false);
    }
  }, [enabled, token, toast]);

  React.useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const itemOptions = React.useMemo(
    () => items.slice().sort((a, b) => a.name.localeCompare(b.name)),
    [items],
  );

  if (!canRead) {
    return (
      <div className="px-4 py-4 text-sm text-muted-foreground">
        Você não tem permissão para acessar esta área.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PageControlPanel
        rightSlot={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => router.push(withTenantPath("/pantry/exits", tenantSlug))}
            >
              Ver saídas
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => void loadItems()}
              disabled={loadingItems}
            >
              Atualizar
            </Button>
          </div>
        }
      />

      <div className="px-4">
        <SectionCard
          title="Registrar saída"
          subtitle="Selecione o alimento e registre a saída por lote/validade."
          defaultOpen
        >
          <PantryMovementWorkspace
            enabled={enabled}
            item={movementItem}
            preferredSector={preferredSector}
            onSaved={async () => {
              await loadItems();
            }}
            leftTopSlot={
              <div>
                <p className="pb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Alimento
                </p>
                <Select
                  value={itemId}
                  onValueChange={(nextItemId) => {
                    const nextItem = itemsById.get(nextItemId);
                    updateQuery({
                      itemId: nextItemId,
                      sector: nextItem?.defaultSector?.trim() || "Geral",
                    });
                  }}
                  disabled={!enabled || loadingItems}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={loadingItems ? "Carregando..." : "Selecione um alimento"}
                    />
                  </SelectTrigger>
                  <SelectContent className="max-h-[420px]">
                    {itemOptions.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            }
          />
        </SectionCard>
      </div>
    </div>
  );
}

