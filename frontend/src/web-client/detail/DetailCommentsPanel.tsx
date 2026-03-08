"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type CommentUser = {
  id: string;
  name: string;
  email?: string | null;
  avatarUrl?: string | null;
};

type CommentItem = {
  id: string;
  body: string;
  mentionUserIds: string[];
  author: {
    id: string | null;
    name: string;
    email?: string | null;
    avatarUrl?: string | null;
  };
  createdAt: string;
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((item) => item[0] ?? "")
    .join("")
    .toUpperCase();
}

export function DetailCommentsPanel({
  comments,
  value,
  mentionUserIds,
  users,
  onValueChange,
  onMentionUserIdsChange,
  onSubmit,
  onDeleteComment,
  submitting = false,
  readOnly = false,
  emptyLabel = "Nenhum comentario ainda.",
}: {
  comments: CommentItem[];
  value: string;
  mentionUserIds: string[];
  users: CommentUser[];
  onValueChange: (next: string) => void;
  onMentionUserIdsChange: (next: string[]) => void;
  onSubmit: () => void;
  onDeleteComment?: (commentId: string) => void;
  submitting?: boolean;
  readOnly?: boolean;
  emptyLabel?: string;
}) {
  const selectedMentionIds = React.useMemo(
    () => Array.from(new Set(mentionUserIds.filter(Boolean))),
    [mentionUserIds],
  );

  const selectedMentionUsers = React.useMemo(
    () => users.filter((user) => selectedMentionIds.includes(user.id)),
    [selectedMentionIds, users],
  );

  const availableMentionUsers = React.useMemo(
    () => users.filter((user) => !selectedMentionIds.includes(user.id)),
    [selectedMentionIds, users],
  );

  return (
    <div className="space-y-5">
      <div className="space-y-3 border-b border-border/50 pb-4">
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Discussao interna
        </div>
        <Textarea
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          placeholder="Escreva um comentario para o time."
          className="min-h-[120px] rounded-none border-0 border-b border-border/60 bg-transparent px-0 py-2 shadow-none focus-visible:border-primary focus-visible:ring-0"
          readOnly={readOnly}
        />

        {!readOnly ? (
          <div className="space-y-3">
            <Select
              value="__none__"
              onValueChange={(next) => {
                if (next === "__none__") return;
                onMentionUserIdsChange([...selectedMentionIds, next]);
              }}
            >
              <SelectTrigger className="h-8 rounded-none border-0 border-b border-border/60 bg-transparent px-0 text-xs shadow-none focus-visible:ring-0">
                <SelectValue placeholder="Mencionar pessoas" />
              </SelectTrigger>
              <SelectContent>
                {availableMentionUsers.length ? (
                  availableMentionUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="__none__" disabled>
                    Sem mais pessoas para mencionar
                  </SelectItem>
                )}
              </SelectContent>
            </Select>

            {selectedMentionUsers.length ? (
              <div className="flex flex-wrap gap-1.5">
                {selectedMentionUsers.map((user) => (
                  <Badge
                    key={user.id}
                    variant="outline"
                    className="gap-1 rounded-full px-2 text-[10px]"
                  >
                    @{user.name}
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() =>
                        onMentionUserIdsChange(
                          selectedMentionIds.filter((entry) => entry !== user.id),
                        )
                      }
                    >
                      x
                    </button>
                  </Badge>
                ))}
              </div>
            ) : null}

            <div className="flex justify-end">
              <Button
                type="button"
                size="sm"
                onClick={onSubmit}
                disabled={submitting || !value.trim()}
              >
                {submitting ? "Enviando..." : "Comentar"}
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      {comments.length ? (
        <div className="space-y-4">
          {comments.map((comment) => {
            const mentions = comment.mentionUserIds
              .map((mentionId) => users.find((user) => user.id === mentionId))
              .filter(Boolean) as CommentUser[];

            return (
              <article key={comment.id} className="space-y-2 border-b border-border/40 pb-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-9 items-center justify-center rounded-full bg-muted text-xs font-medium text-foreground">
                    {initials(comment.author.name)}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <div className="text-sm font-medium text-foreground">
                        {comment.author.name}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {comment.createdAt.slice(0, 16).replace("T", ", ")}
                      </div>
                    </div>
                    <div className="whitespace-pre-wrap text-sm text-foreground">
                      {comment.body}
                    </div>
                    {mentions.length ? (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {mentions.map((user) => (
                          <Badge
                            key={`${comment.id}:${user.id}`}
                            variant="outline"
                            className={cn("rounded-full px-2 text-[10px]", "border-sky-500/20 bg-sky-500/5 text-sky-700")}
                          >
                            @{user.name}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  {onDeleteComment ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => onDeleteComment(comment.id)}
                    >
                      Excluir
                    </Button>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="text-sm text-muted-foreground">{emptyLabel}</div>
      )}
    </div>
  );
}
