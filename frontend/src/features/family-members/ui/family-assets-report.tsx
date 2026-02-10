"use client";

import * as React from "react";
import { SectionCard } from "@/components/section-card";
import { SectionList, SectionListItem } from "@/components/section-list";
import { SectionListCollapse } from "@/components/section-list-collapse";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PersonIdentityAvatarTrigger } from "@/components/person-identity-card";
import { useFamilyRelationsContext } from "@/features/family-members/context/family-relations-context";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { usePathname } from "next/navigation";
import type {
  HouseholdAsset,
  PersonAsset,
  PersonAssetsGroup,
} from "@/app/[tenant]/(modules)/people/types";
import { resolvePersonDisplayNames } from "@/app/[tenant]/(modules)/people/utils";
import { getTenantSlugFromPath } from "@/lib/tenant-path";

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

const categoryOptions = [
  "Móveis",
  "Eletrodomésticos",
  "Serviços",
  "Veículos",
  "Eletrônicos",
  "Utensílios",
  "Outro",
];

const conditionOptions = [
  "Novo",
  "Bom",
  "Usado",
  "Precisa de reparo",
  "Outro",
];

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
  const [categoryOption, setCategoryOption] = React.useState(
    categoryOptions.includes(initial?.category ?? "")
      ? (initial?.category as string)
      : "Outro",
  );
  const [item, setItem] = React.useState(initial?.item ?? "");
  const [quantity, setQuantity] = React.useState(
    initial?.quantity?.toString() ?? "",
  );
  const [condition, setCondition] = React.useState(initial?.condition ?? "");
  const [conditionOption, setConditionOption] = React.useState(
    conditionOptions.includes(initial?.condition ?? "")
      ? (initial?.condition as string)
      : initial?.condition
        ? "Outro"
        : "",
  );
  const [notes, setNotes] = React.useState(initial?.notes ?? "");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    const nextCategory = initial?.category ?? "";
    setCategory(nextCategory);
    setCategoryOption(
      categoryOptions.includes(nextCategory) ? nextCategory : "Outro",
    );
    setItem(initial?.item ?? "");
    setQuantity(initial?.quantity?.toString() ?? "");
    const nextCondition = initial?.condition ?? "";
    setCondition(nextCondition);
    setConditionOption(
      conditionOptions.includes(nextCondition)
        ? nextCondition
        : nextCondition
          ? "Outro"
          : "",
    );
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
            <Select
              value={categoryOption}
              onValueChange={(value) => {
                setCategoryOption(value);
                if (value !== "Outro") {
                  setCategory(value);
                } else {
                  setCategory("");
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {categoryOption === "Outro" ? (
              <Input
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                placeholder="Descreva a categoria"
              />
            ) : null}
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label>Item</Label>
            <Input
              value={item}
              onChange={(event) => setItem(event.target.value)}
              placeholder="Ex.: Sofá, Internet, Moto"
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
            <Label>Condição</Label>
            <Select
              value={conditionOption}
              onValueChange={(value) => {
                setConditionOption(value);
                if (value !== "Outro") {
                  setCondition(value);
                } else {
                  setCondition("");
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {conditionOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {conditionOption === "Outro" ? (
              <Input
                value={condition}
                onChange={(event) => setCondition(event.target.value)}
                placeholder="Descreva a condição"
              />
            ) : null}
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label>Observações</Label>
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
}: {
  asset: HouseholdAsset | PersonAsset;
  onEdit: () => void;
  onDelete: () => void;
}) => (
  <SectionListItem
    title={
      <div className="grid w-full grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto] items-center gap-2 text-xs font-semibold">
        <span className="truncate text-foreground">{asset.item}</span>
        <span className="truncate text-[11px] text-muted-foreground">
          {asset.category}
        </span>
        {asset.quantity ? (
          <Badge variant="outline" className="text-[10px]">
            Qtd: {asset.quantity}
          </Badge>
        ) : (
          <span className="text-[10px] text-muted-foreground">Qtd: -</span>
        )}
        {asset.condition ? (
          <Badge variant="secondary" className="text-[10px]">
            {asset.condition}
          </Badge>
        ) : (
          <span className="text-[10px] text-muted-foreground">-</span>
        )}
      </div>
    }
    inlineActions
    actions={
      <>
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
      </>
    }
  />
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
  const grouped = React.useMemo(() => {
    return assets.reduce<Record<string, HouseholdAsset[]>>((acc, asset) => {
      const key = asset.category || "Sem categoria";
      if (!acc[key]) acc[key] = [];
      acc[key].push(asset);
      return acc;
    }, {});
  }, [assets]);
  const entries = Object.entries(grouped);

  if (!assets.length) {
    return (
      <p className="text-xs text-muted-foreground">
        Nenhum item compartilhado cadastrado.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map(([category, items]) => (
        <SectionListCollapse
          key={category}
          title={category}
          count={items.length}
        >
          <SectionList>
            {items.map((asset) => (
              <AssetRow
                key={asset.id}
                asset={asset}
                onEdit={() => onEditRequest(asset)}
                onDelete={() => onDelete(asset.id)}
              />
            ))}
          </SectionList>
        </SectionListCollapse>
      ))}
    </div>
  );
};

export function FamilyAssetsReport() {
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname);
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
    <SectionCard
      title="Bens e serviços"
      subtitle="Itens compartilhados e individuais da residência"
      contentClassName="space-y-6"
    >
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
              <SectionList className="space-y-3">
                {personAssetsByMember.map((group) => (
                  <PersonAssetGroup
                    key={group.person.id}
                    group={group}
                    tenantSlug={tenantSlug}
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
              </SectionList>
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
    </SectionCard>
  );
}

const PersonAssetGroup = ({
  group,
  tenantSlug,
  onCreate,
  onDelete,
  onEditRequest,
}: {
  group: PersonAssetsGroup;
  tenantSlug?: string | null;
  onCreate: (personId: string, payload: AssetPayload) => Promise<void>;
  onDelete: (assetId: string) => Promise<void>;
  onEditRequest: (asset: PersonAsset) => void;
}) => {
  const [createOpen, setCreateOpen] = React.useState(false);
  const displayNames = resolvePersonDisplayNames(
    group.person.fullName,
    group.person.socialName,
  );

  return (
    <SectionListCollapse
      title={
        <div className="flex items-center gap-2">
          <PersonIdentityAvatarTrigger
            personId={group.person.id}
            tenantSlug={tenantSlug}
            fullName={group.person.fullName}
            socialName={group.person.socialName}
            birthDate={group.person.birthDate ?? null}
            avatarUrl={group.person.avatarUrl}
            hasHealthCondition={group.person.hasHealthCondition}
            hasMedication={group.person.hasMedication}
            avatarClassName="size-7 border border-border/60"
            tooltipLabel={null}
          />
          <div>
            <p className="text-sm font-medium text-foreground">
              {displayNames.primary}
            </p>
            {displayNames.secondary ? (
              <p className="text-[11px] text-muted-foreground">
                {displayNames.secondary}
              </p>
            ) : null}
            <p className="text-[11px] text-muted-foreground">Itens individuais</p>
          </div>
        </div>
      }
      count={group.assets.length}
      toggleOnTitle={false}
      actions={
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
      }
    >
      {group.assets.length ? (
        <SectionList>
          {group.assets.map((asset) => (
            <AssetRow
              key={asset.id}
              asset={asset}
              onEdit={() => onEditRequest(asset)}
              onDelete={() => onDelete(asset.id)}
            />
          ))}
        </SectionList>
      ) : (
        <p className="text-xs text-muted-foreground">
          Nenhum item individual cadastrado.
        </p>
      )}
    </SectionListCollapse>
  );
};


