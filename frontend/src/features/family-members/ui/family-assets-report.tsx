"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useFamilyRelationsContext } from "@/features/family-members/context/family-relations-context";
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2 } from "lucide-react";
import type {
  HouseholdAsset,
  PersonAsset,
  PersonAssetsGroup,
} from "@/app/(modules)/people/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type AssetPayload = {
  category: string;
  item: string;
  quantity?: number | null;
  condition?: string | null;
  notes?: string | null;
};

type AssetDialogProps = {
  title: string;
  description: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: AssetPayload) => Promise<void>;
  initial?: AssetPayload | null;
  triggerLabel?: string;
  trigger?: React.ReactNode;
};

const AssetDialog = ({
  title,
  description,
  open,
  onOpenChange,
  onSubmit,
  initial,
  triggerLabel,
  trigger,
}: AssetDialogProps) => {
  const [category, setCategory] = React.useState(initial?.category ?? "");
  const [item, setItem] = React.useState(initial?.item ?? "");
  const [quantity, setQuantity] = React.useState(
    initial?.quantity?.toString() ?? "",
  );
  const [condition, setCondition] = React.useState(initial?.condition ?? "");
  const [notes, setNotes] = React.useState(initial?.notes ?? "");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setCategory(initial?.category ?? "");
    setItem(initial?.item ?? "");
    setQuantity(initial?.quantity?.toString() ?? "");
    setCondition(initial?.condition ?? "");
    setNotes(initial?.notes ?? "");
  }, [open, initial]);

  const isValid = category.trim().length > 0 && item.trim().length > 0;

  const handleSubmit = async () => {
    if (!isValid) return;
    setIsSubmitting(true);
    await onSubmit({
      category: category.trim(),
      item: item.trim(),
      quantity: quantity ? Number(quantity) : undefined,
      condition: condition.trim() || null,
      notes: notes.trim() || null,
    });
    setIsSubmitting(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : triggerLabel ? (
        <DialogTrigger asChild>
          <Button size="sm" variant="outline" className="gap-2">
            <Plus className="size-4" />
            {triggerLabel}
          </Button>
        </DialogTrigger>
      ) : null}
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2 sm:col-span-2">
            <Label>Categoria</Label>
            <Input
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              placeholder="Ex.: Moveis, Servicos, Veiculos"
            />
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label>Item</Label>
            <Input
              value={item}
              onChange={(event) => setItem(event.target.value)}
              placeholder="Ex.: Sofa, Internet, Moto"
            />
          </div>
          <div className="grid gap-2">
            <Label>Quantidade</Label>
            <Input
              type="number"
              min="0"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Condicao</Label>
            <Input
              value={condition}
              onChange={(event) => setCondition(event.target.value)}
              placeholder="Bom, usado..."
            />
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label>Observacoes</Label>
            <Textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || isSubmitting}>
            {isSubmitting ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const AssetRow = ({
  asset,
  onEdit,
  onDelete,
  compact = false,
}: {
  asset: HouseholdAsset | PersonAsset;
  onEdit: () => void;
  onDelete: () => void;
  compact?: boolean;
}) => (
  <div
    className={`group grid gap-3 border-b border-border/30 ${compact ? "py-1" : "py-2"} pr-2 md:grid-cols-[minmax(0,1fr)_auto_auto]`}
  >
    <div>
      <p
        className={`text-sm font-medium ${compact ? "text-foreground" : "text-foreground"}`}
      >
        {asset.item}
      </p>
      <p className="text-xs text-muted-foreground">{asset.category}</p>
    </div>
    <div className="flex flex-wrap gap-1">
      {asset.quantity ? (
        <Badge variant="outline" className="text-[10px]">
          Qtd: {asset.quantity}
        </Badge>
      ) : null}
      {asset.condition ? (
        <Badge variant="secondary" className="text-[10px]">
          {asset.condition}
        </Badge>
      ) : null}
    </div>
    <div
      className={`flex items-center justify-end gap-1 transition-opacity duration-200 ${compact ? "opacity-100" : "opacity-0 group-hover:opacity-100 md:opacity-100"}`}
    >
      <Button
        size="icon"
        variant="ghost"
        className="size-7 text-muted-foreground hover:text-foreground"
        onClick={onEdit}
      >
        <Pencil className="size-3" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="size-7 text-destructive hover:text-destructive/80"
        onClick={onDelete}
      >
        <Trash2 className="size-3" />
      </Button>
    </div>
  </div>
);

const SharedAssetsList = ({
  assets,
  onEditRequest,
  onDelete,
}: {
  assets: HouseholdAsset[];
  onEditRequest: (asset: HouseholdAsset) => void;
  onDelete: (assetId: string) => void;
}) => {
  const [expandedCategories, setExpandedCategories] = React.useState<
    Record<string, boolean>
  >({});

  const grouped = React.useMemo(() => {
    return assets.reduce<Record<string, HouseholdAsset[]>>((acc, asset) => {
      const key = asset.category || "Sem categoria";
      if (!acc[key]) acc[key] = [];
      acc[key].push(asset);
      return acc;
    }, {});
  }, [assets]);

  const toggleCategory = (category: string) =>
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));

  const entries = Object.entries(grouped);

  if (!assets.length) {
    return (
      <p className="text-xs text-muted-foreground">
        Nenhum item compartilhado cadastrado.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {entries.map(([category, items]) => {
          const isOpen = Boolean(expandedCategories[category]);
          return (
            <div
              key={category}
              className="rounded-2xl border border-border/60 bg-background/60 px-3 py-2"
            >
              <button
                type="button"
                onClick={() => toggleCategory(category)}
                className="flex w-full items-center justify-between gap-2 text-sm font-medium text-foreground"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm leading-tight">{category}</span>
                  <Badge variant="outline" className="text-[10px]">
                    {items.length} itens
                  </Badge>
                </div>
                {isOpen ? (
                  <ChevronUp className="size-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="size-4 text-muted-foreground" />
                )}
              </button>
              {isOpen ? (
                <div className="space-y-1 border-t border-border/30 pt-2">
                  {items.map((asset) => (
                    <AssetRow
                      key={asset.id}
                      asset={asset}
                      onEdit={() => onEditRequest(asset)}
                      onDelete={() => onDelete(asset.id)}
                      compact
                    />
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export function FamilyAssetsReport() {
  const {
    householdAssets,
    personAssetsByMember,
    createHouseholdAsset,
    updateHouseholdAsset,
    removeHouseholdAsset,
    createPersonAsset,
    updatePersonAsset,
    removePersonAsset,
  } = useFamilyRelationsContext();

  const sharedTotals = householdAssets.reduce<Record<string, number>>(
    (acc, asset) => {
      const key = asset.category || "Outros";
      acc[key] = (acc[key] ?? 0) + (asset.quantity ?? 1);
      return acc;
    },
    {},
  );

  const individualTotals = personAssetsByMember.reduce<Record<string, number>>(
    (acc, group) => {
      group.assets.forEach((asset) => {
        const key = asset.category || "Outros";
        acc[key] = (acc[key] ?? 0) + (asset.quantity ?? 1);
      });
      return acc;
    },
    {},
  );

  const buildSummary = (data: Record<string, number>) =>
    Object.entries(data).map(([label, value]) => ({ label, value }));

  const sharedSummary = buildSummary(sharedTotals);
  const individualSummary = buildSummary(individualTotals);

  const [editingIndividual, setEditingIndividual] = React.useState<{
    personId: string;
    asset: PersonAsset;
  } | null>(null);
  const [editingShared, setEditingShared] = React.useState<{
    id: string;
    initial: HouseholdAsset;
  } | null>(null);
  const [createOpenShared, setCreateOpenShared] = React.useState(false);
  const [createOpenIndividual, setCreateOpenIndividual] = React.useState(false);

  return (
    <Card>
      <CardContent className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              Itens compartilhados
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {sharedSummary.length ? (
                sharedSummary.map((metric) => (
                  <Badge key={`${metric.label}-shared`} variant="outline">
                    {metric.label}: {metric.value}
                  </Badge>
                ))
              ) : (
                <Badge variant="secondary">Sem itens</Badge>
              )}
            </div>
          </div>
          <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              Itens individuais
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {individualSummary.length ? (
                individualSummary.map((metric) => (
                  <Badge key={`${metric.label}-individual`} variant="outline">
                    {metric.label}: {metric.value}
                  </Badge>
                ))
              ) : (
                <Badge variant="secondary">Sem itens pessoais</Badge>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">
                Itens compartilhados
              </p>
            <AssetDialog
              title="Adicionar item"
              description="Registre um item para a residência."
              open={createOpenShared}
              onOpenChange={setCreateOpenShared}
              onSubmit={createHouseholdAsset}
              trigger={
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-7 text-muted-foreground hover:text-foreground"
                >
                  <Plus className="size-4" />
                </Button>
              }
            />
            </div>
            <SharedAssetsList
              assets={householdAssets}
              onEditRequest={(asset) =>
                setEditingShared({
                  id: asset.id,
                  initial: asset,
                })
              }
              onDelete={(id) => removeHouseholdAsset(id)}
            />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">
                Itens individuais
              </p>
            </div>
            {personAssetsByMember.length ? (
              <div className="space-y-3">
                {personAssetsByMember.map((group) => (
                  <PersonAssetGroup
                    key={group.person.id}
                    group={group}
                    onCreate={createPersonAsset}
                    onDelete={(assetId) =>
                      removePersonAsset(group.person.id, assetId)
                    }
                    onEditRequest={(asset) =>
                      setEditingIndividual({
                        personId: group.person.id,
                        asset,
                      })
                    }
                  />
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Nenhum item individual cadastrado.
              </p>
            )}
          </div>
        </div>

        {editingShared ? (
          <AssetDialog
            title="Editar item"
            description="Atualize as informações do item."
            open={Boolean(editingShared)}
            onOpenChange={(open) => {
              if (!open) setEditingShared(null);
            }}
            initial={{
              category: editingShared.initial.category,
              item: editingShared.initial.item,
              quantity: editingShared.initial.quantity ?? undefined,
              condition: editingShared.initial.condition ?? undefined,
              notes: editingShared.initial.notes ?? undefined,
            }}
            onSubmit={(payload) => {
              const current = editingShared;
              if (!current) return Promise.resolve();
              return updateHouseholdAsset(current.id, payload).then(() =>
                setEditingShared(null),
              );
            }}
          />
        ) : null}

        {editingIndividual ? (
          <AssetDialog
            title="Editar item"
            description="Atualize as informações do item."
            open={Boolean(editingIndividual)}
            onOpenChange={(open) => {
              if (!open) setEditingIndividual(null);
            }}
            initial={{
              category: editingIndividual.asset.category,
              item: editingIndividual.asset.item,
              quantity: editingIndividual.asset.quantity ?? undefined,
              condition: editingIndividual.asset.condition ?? undefined,
              notes: editingIndividual.asset.notes ?? undefined,
            }}
            onSubmit={(payload) =>
              updatePersonAsset(
                editingIndividual.personId,
                editingIndividual.asset.id,
                payload,
              ).then(() => setEditingIndividual(null))
            }
          />
        ) : null}
      </CardContent>
    </Card>
  );
}

const PersonAssetGroup = ({
  group,
  onCreate,
  onDelete,
  onEditRequest,
}: {
  group: PersonAssetsGroup;
  onCreate: (personId: string, payload: AssetPayload) => Promise<void>;
  onDelete: (assetId: string) => Promise<void>;
  onEditRequest: (asset: PersonAsset) => void;
}) => {
  const [createOpen, setCreateOpen] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);

  const initials = group.person.fullName
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="space-y-2 rounded-xl border border-border/60 bg-background/60 px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Avatar className="size-7 border border-border/60">
            <AvatarImage src={group.person.avatarUrl ?? undefined} />
            <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium text-foreground">
              {group.person.fullName}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Itens individuais
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px]">
            {group.assets.length}
          </Badge>
          <Button
            size="icon"
            variant="ghost"
            className="size-7 text-muted-foreground hover:text-foreground"
            onClick={() => setExpanded((prev) => !prev)}
            aria-label={expanded ? "Ocultar itens" : "Mostrar itens"}
          >
            {expanded ? (
              <ChevronUp className="size-4" />
            ) : (
              <ChevronDown className="size-4" />
            )}
          </Button>
          <AssetDialog
            title="Adicionar item pessoal"
            description="Registre um item individual deste familiar."
            open={createOpen}
            onOpenChange={setCreateOpen}
            onSubmit={(payload) => onCreate(group.person.id, payload)}
            trigger={
              <Button
                size="icon"
                variant="ghost"
                className="size-7 text-muted-foreground hover:text-foreground"
              >
                <Plus className="size-4" />
              </Button>
            }
          />
        </div>
      </div>

      {expanded ? (
        group.assets.length ? (
          <div className="space-y-2">
            {group.assets.map((asset) => (
              <AssetRow
                key={asset.id}
                asset={asset}
                onEdit={() => onEditRequest(asset)}
                onDelete={() => onDelete(asset.id)}
              />
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Nenhum item individual cadastrado.
          </p>
        )
      ) : null}
    </div>
  );
};
