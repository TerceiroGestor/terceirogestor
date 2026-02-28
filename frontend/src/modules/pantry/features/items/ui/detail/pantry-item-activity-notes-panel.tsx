"use client";

import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTimePtBR } from "@/lib/date";
import { resolveMediaUrl } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { ApiPantryAuditLog } from "@/modules/pantry/api";
import type { PantryItemDetailMode } from "@/modules/pantry/features/items/domain/pantry-item-detail.types";
import {
  diffAuditFields,
  formatAuditValue,
  initialsFromLabel,
  pickAvatarPalette,
  resolveAuditActionLabel,
} from "@/modules/pantry/features/items/domain/pantry-item-detail.helpers";

export type PantryItemActivityNotesPanelProps = {
  mode: PantryItemDetailMode;
  readOnly: boolean;
  auditLoading: boolean;
  auditLogs: ApiPantryAuditLog[];
  auditVisibleCount: number;
  onAuditVisibleCountChange: React.Dispatch<React.SetStateAction<number>>;
  notes: string | null;
  onNotesChange: (next: string | null) => void;
  onNotesBlur: () => void;
};

export function PantryItemActivityNotesPanel({
  mode,
  readOnly,
  auditLoading,
  auditLogs,
  auditVisibleCount,
  onAuditVisibleCountChange,
  notes,
  onNotesChange,
  onNotesBlur,
}: PantryItemActivityNotesPanelProps) {
  return (
    <div className="rounded-md border border-border/60 bg-card p-3">
      <Tabs defaultValue="activity">
        <TabsList className="h-9 w-full justify-start gap-4 rounded-none border-0 border-b border-border/60 bg-transparent p-0">
          <TabsTrigger
            value="activity"
            className="rounded-none border-b-2 border-transparent bg-transparent px-0 text-xs text-muted-foreground shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=inactive]:hover:bg-transparent"
          >
            Atividade
          </TabsTrigger>
          <TabsTrigger
            value="notes"
            className="rounded-none border-b-2 border-transparent bg-transparent px-0 text-xs text-muted-foreground shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=inactive]:hover:bg-transparent"
          >
            Notas internas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="activity">
          {mode !== "edit" ? (
            <div className="rounded-md border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
              Salve o registro para ver a auditoria.
            </div>
          ) : auditLoading ? (
            <div className="text-sm text-muted-foreground">Carregando...</div>
          ) : auditLogs.length ? (
            <div className="space-y-3">
              <div className="max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
                <div className="space-y-3">
                  {auditLogs
                    .slice(0, Math.min(auditVisibleCount, auditLogs.length))
                    .map((log) => {
                      const actor = log.user?.name ?? log.user?.email ?? "Sistema";
                      const rows = log.action === "UPDATE" ? diffAuditFields(log) : [];
                      const initials = initialsFromLabel(actor);
                      const palette = pickAvatarPalette(log.userId ?? actor);
                      const avatarRaw = log.user?.avatarUrl ?? null;
                      const avatarSrc = avatarRaw ? resolveMediaUrl(avatarRaw) : "";

                      return (
                        <div key={log.id} className="flex items-start gap-3">
                          <Avatar className="mt-0.5 size-9 border border-border/60" title={actor}>
                            {avatarSrc ? <AvatarImage src={avatarSrc} alt={actor} /> : null}
                            <AvatarFallback className={cn(palette.bg, palette.text)}>
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline justify-between gap-2">
                              <div className="truncate text-xs font-semibold text-foreground">
                                {actor}
                              </div>
                              <div className="shrink-0 text-[11px] text-muted-foreground">
                                {formatDateTimePtBR(log.createdAt)}
                              </div>
                            </div>
                            <div className="mt-1 rounded-md border border-border/60 bg-muted/10 px-3 py-2">
                              <div className="flex items-center gap-2 text-xs">
                                {log.action === "CREATE" ? (
                                  <Badge className="border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-200">
                                    Criado
                                  </Badge>
                                ) : log.action === "DELETE" ? (
                                  <Badge className="border-transparent bg-rose-500/15 text-rose-700 dark:text-rose-200">
                                    Removido
                                  </Badge>
                                ) : (
                                  <Badge className="border-transparent bg-sky-500/15 text-sky-700 dark:text-sky-200">
                                    Atualizado
                                  </Badge>
                                )}
                                <span className="text-muted-foreground">
                                  {resolveAuditActionLabel(log.action)}
                                </span>
                              </div>
                              {rows.length ? (
                                <div className="mt-2 space-y-1">
                                  {rows.map((row) => (
                                    <div key={row.key} className="text-xs text-foreground">
                                      <span className="text-muted-foreground">{row.label}:</span>{" "}
                                      <span className="font-mono">{formatAuditValue(row.before)}</span>{" "}
                                      <span className="text-muted-foreground">→</span>{" "}
                                      <span className="font-mono">{formatAuditValue(row.after)}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="mt-1 text-xs text-muted-foreground">
                                  {log.action === "CREATE"
                                    ? "Registro criado."
                                    : log.action === "DELETE"
                                      ? "Registro removido."
                                      : null}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {auditVisibleCount < auditLogs.length ? (
                <div className="flex items-center justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() =>
                      onAuditVisibleCountChange((prev) => Math.min(prev + 24, auditLogs.length))
                    }
                  >
                    Mostrar mais
                  </Button>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
              Sem auditoria.
            </div>
          )}
        </TabsContent>

        <TabsContent value="notes">
          <div className="space-y-2">
            <Textarea
              value={notes ?? ""}
              onChange={(e) => onNotesChange(e.target.value || null)}
              onBlur={onNotesBlur}
              placeholder="Anotações internas..."
              className="min-h-[220px] rounded-none border-0 border-b border-border/60 bg-transparent px-0 shadow-none focus-visible:ring-0"
              readOnly={readOnly}
            />
            <div className="text-[11px] text-muted-foreground">Essas notas ficam salvas no registro.</div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
