"use client";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/section-card";
import { SectionList, SectionListItem } from "@/components/section-list";

export type PantryExpiringItem = {
  itemId: string;
  name: string;
  unit: string;
  sector: string;
  stock: number;
  nextExpiryDate: string | null;
  validityStatus: string;
  daysToExpire: number | null;
};

type PantryOverviewAlertsSectionProps = {
  expiredItems: PantryExpiringItem[];
  formatDate: (value: string | null) => string;
  onOpenMovement: (params: {
    itemId: string;
    name: string;
    unit: string;
    sector?: string;
  }) => void;
  onRefresh?: () => void;
};

export function PantryOverviewAlertsSection({
  expiredItems,
  formatDate,
  onOpenMovement,
  onRefresh,
}: PantryOverviewAlertsSectionProps) {
  return (
    <SectionCard
      title="Alertas"
      subtitle="Produtos vencidos com saldo em estoque."
      actions={
        onRefresh ? (
          <Button variant="outline" size="sm" onClick={onRefresh}>
            Atualizar
          </Button>
        ) : null
      }
    >
      <div className="space-y-5">
        <div>
          <p className="text-xs font-semibold text-muted-foreground">
            Vencidos
          </p>
          {expiredItems.length ? (
            <SectionList className="mt-2">
              {expiredItems.map((row) => (
                <SectionListItem
                  key={`${row.itemId}-${row.sector}-${row.nextExpiryDate ?? ""}`}
                  title={
                    <>
                      <button
                        type="button"
                        className="text-left text-foreground underline-offset-4 hover:underline"
                        onClick={() => {
                          onOpenMovement({
                            itemId: row.itemId,
                            name: row.name,
                            unit: row.unit,
                            sector: row.sector,
                          });
                        }}
                      >
                        {row.name}
                      </button>
                      <span className="font-mono tabular-nums text-muted-foreground">
                        {Number(row.stock).toLocaleString("pt-BR")} {row.unit}
                      </span>
                    </>
                  }
                  subtitle={`Setor: ${row.sector} • Validade: ${formatDate(row.nextExpiryDate)}`}
                  meta={
                    row.daysToExpire !== null ? (
                      <span>
                        {row.daysToExpire < 0
                          ? `Venceu há ${Math.abs(row.daysToExpire)} dia(s)`
                          : `${row.daysToExpire} dia(s)`}
                      </span>
                    ) : null
                  }
                  showActionsOnHover={false}
                />
              ))}
            </SectionList>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              Nenhum produto vencido no momento.
            </p>
          )}
        </div>
      </div>
    </SectionCard>
  );
}
