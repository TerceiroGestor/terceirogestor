"use client";

import * as React from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Heading from "@tiptap/extension-heading";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import ListItem from "@tiptap/extension-list-item";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import Document from "@tiptap/extension-document";
import { Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type NoteMentionUser = {
  id: string;
  name: string;
  email?: string | null;
};

type SlashCommand = {
  id: "h1" | "h2" | "list" | "quote" | "code" | "pending" | "urgent";
  label: string;
  description: string;
};

const SLASH_COMMANDS: SlashCommand[] = [
  {
    id: "h1",
    label: "/titulo",
    description: "Titulo principal",
  },
  {
    id: "h2",
    label: "/subtitulo",
    description: "Subtitulo",
  },
  {
    id: "list",
    label: "/lista",
    description: "Lista com marcadores",
  },
  {
    id: "quote",
    label: "/citacao",
    description: "Bloco de citacao",
  },
  {
    id: "code",
    label: "/codigo",
    description: "Bloco de codigo",
  },
  {
    id: "pending",
    label: "/pendencia",
    description: "Marcar pendencia interna",
  },
  {
    id: "urgent",
    label: "/urgente",
    description: "Marcar anotacao urgente",
  },
];

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeInitialContent(value: string | null | undefined) {
  const text = value ?? "";
  const trimmed = text.trim();
  if (!trimmed) return "<p></p>";
  const looksLikeHtml = /<[a-z][\s\S]*>/i.test(trimmed);
  if (looksLikeHtml) return text;
  return `<p>${escapeHtml(text).replace(/\r?\n/g, "<br />")}</p>`;
}

function resolveMentionIdsInText(
  text: string,
  users: NoteMentionUser[],
  candidateIds: string[],
) {
  return Array.from(new Set(candidateIds.filter(Boolean))).filter((mentionId) => {
    const user = users.find((entry) => entry.id === mentionId);
    if (!user?.name?.trim()) return false;
    const pattern = new RegExp(`(^|\\s)@${escapeRegExp(user.name)}(?=\\s|$)`, "i");
    return pattern.test(text);
  });
}

function resolveMentionQueryFromEditor(editor: Editor) {
  const { from, $from } = editor.state.selection;
  const before = $from.parent.textBetween(0, $from.parentOffset, " ", " ");
  const match = before.match(/(^|\s)@([^\s@]*)$/);
  if (!match) return null;
  const query = match[2] ?? "";
  const start = from - query.length - 1;
  if (start < 0) return null;
  return { query, start, end: from };
}

function resolveSlashQueryFromEditor(editor: Editor) {
  const { from, $from } = editor.state.selection;
  const before = $from.parent.textBetween(0, $from.parentOffset, " ", " ");
  const match = before.match(/(^|\s)\/([^\s/]*)$/);
  if (!match) return null;
  const query = match[2] ?? "";
  const start = from - query.length - 1;
  if (start < 0) return null;
  return { query, start, end: from };
}

export function DetailNotesPanel({
  value,
  onChange,
  onBlur,
  readOnly,
  placeholder = "Notas internas",
  itemLabel,
  users = [],
}: {
  value: string | null | undefined;
  onChange: (next: string | null) => void;
  onBlur: (next?: string | null) => void;
  readOnly?: boolean;
  placeholder?: string;
  itemLabel?: string;
  users?: NoteMentionUser[];
}) {
  const [mentionUserIds, setMentionUserIds] = React.useState<string[]>([]);
  const [mentionIndex, setMentionIndex] = React.useState(0);
  const [slashIndex, setSlashIndex] = React.useState(0);
  const [readerOpen, setReaderOpen] = React.useState(false);
  const [activeMention, setActiveMention] = React.useState<{
    query: string;
    start: number;
    end: number;
  } | null>(null);
  const [activeSlash, setActiveSlash] = React.useState<{
    query: string;
    start: number;
    end: number;
  } | null>(null);

  const refreshEditorDerivedState = React.useCallback(
    (currentEditor: Editor) => {
      setMentionUserIds((previous) =>
        resolveMentionIdsInText(currentEditor.getText(), users, previous),
      );
      setActiveMention(resolveMentionQueryFromEditor(currentEditor));
      setActiveSlash(resolveSlashQueryFromEditor(currentEditor));
    },
    [users],
  );

  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
      }),
      Heading.configure({
        levels: [1, 2, 3, 4, 5, 6],
      }),
      BulletList,
      OrderedList,
      ListItem,
    ],
    content: normalizeInitialContent(value),
    editable: !readOnly,
    immediatelyRender: false,
    onUpdate({ editor: currentEditor }) {
      onChange(currentEditor.getHTML());
      refreshEditorDerivedState(currentEditor);
    },
    onSelectionUpdate({ editor: currentEditor }) {
      refreshEditorDerivedState(currentEditor);
    },
    onBlur({ editor: currentEditor }) {
      onBlur(currentEditor.getHTML());
    },
  });

  React.useEffect(() => {
    if (!editor) return;
    const nextContent = normalizeInitialContent(value);
    if (editor.getHTML() !== nextContent) {
      editor.commands.setContent(nextContent, { emitUpdate: false });
    }
    refreshEditorDerivedState(editor);
  }, [editor, refreshEditorDerivedState, value]);

  React.useEffect(() => {
    if (!editor) return;
    editor.setEditable(!readOnly);
  }, [editor, readOnly]);

  React.useEffect(() => {
    if (!readerOpen || !editor || readOnly) return;
    requestAnimationFrame(() => {
      editor.commands.focus("end");
    });
  }, [editor, readOnly, readerOpen]);

  const mentionSuggestions = React.useMemo(() => {
    if (!activeMention) return [];
    const selected = new Set(mentionUserIds);
    const normalizedQuery = activeMention.query.trim().toLocaleLowerCase();
    return users
      .filter((user) => !selected.has(user.id))
      .filter((user) => {
        if (!normalizedQuery) return true;
        const haystack = `${user.name} ${user.email ?? ""}`.toLocaleLowerCase();
        return haystack.includes(normalizedQuery);
      })
      .slice(0, 8);
  }, [activeMention, mentionUserIds, users]);

  const slashSuggestions = React.useMemo(() => {
    if (!activeSlash) return [];
    const normalizedQuery = activeSlash.query.trim().toLocaleLowerCase();
    return SLASH_COMMANDS.filter((command) => {
      if (!normalizedQuery) return true;
      const haystack = `${command.label} ${command.description}`.toLocaleLowerCase();
      return haystack.includes(normalizedQuery);
    }).slice(0, 8);
  }, [activeSlash]);

  React.useEffect(() => {
    setMentionIndex(0);
  }, [activeMention?.query]);

  React.useEffect(() => {
    setSlashIndex(0);
  }, [activeSlash?.query]);

  const showMentionSuggestions =
    !readOnly && Boolean(activeMention) && mentionSuggestions.length > 0;
  const showSlashSuggestions =
    !readOnly &&
    !showMentionSuggestions &&
    Boolean(activeSlash) &&
    slashSuggestions.length > 0;

  const applyMention = React.useCallback(
    (user: NoteMentionUser) => {
      if (!editor) return;
      const mention = resolveMentionQueryFromEditor(editor);
      if (!mention) return;

      editor
        .chain()
        .focus()
        .deleteRange({ from: mention.start, to: mention.end })
        .insertContent(`@${user.name} `)
        .run();

      setMentionUserIds((previous) =>
        previous.includes(user.id) ? previous : [...previous, user.id],
      );
    },
    [editor],
  );

  const applySlashCommand = React.useCallback(
    (command: SlashCommand) => {
      if (!editor) return;
      const slash = resolveSlashQueryFromEditor(editor);
      if (!slash) return;

      const baseChain = editor
        .chain()
        .focus()
        .deleteRange({ from: slash.start, to: slash.end });

      switch (command.id) {
        case "h1":
          baseChain.toggleHeading({ level: 1 }).run();
          break;
        case "h2":
          baseChain.toggleHeading({ level: 2 }).run();
          break;
        case "list":
          baseChain.toggleBulletList().run();
          break;
        case "quote":
          baseChain.toggleBlockquote().run();
          break;
        case "code":
          baseChain.toggleCodeBlock().run();
          break;
        case "pending":
          baseChain.insertContent("[PENDENCIA] ").run();
          break;
        case "urgent":
          baseChain.insertContent("[URGENTE] ").run();
          break;
        default:
          break;
      }
    },
    [editor],
  );

  const handleEditorKeyDown = React.useCallback(
    ({ event }: { event: KeyboardEvent }) => {
      if (showMentionSuggestions) {
        if (event.key === "ArrowDown") {
          event.preventDefault();
          setMentionIndex((previous) =>
            previous + 1 >= mentionSuggestions.length ? 0 : previous + 1,
          );
          return true;
        }
        if (event.key === "ArrowUp") {
          event.preventDefault();
          setMentionIndex((previous) =>
            previous - 1 < 0 ? mentionSuggestions.length - 1 : previous - 1,
          );
          return true;
        }
        if (event.key === "Enter" && !event.shiftKey) {
          const activeUser = mentionSuggestions[mentionIndex];
          if (activeUser) {
            event.preventDefault();
            applyMention(activeUser);
            return true;
          }
        }
      }

      if (showSlashSuggestions) {
        if (event.key === "ArrowDown") {
          event.preventDefault();
          setSlashIndex((previous) =>
            previous + 1 >= slashSuggestions.length ? 0 : previous + 1,
          );
          return true;
        }
        if (event.key === "ArrowUp") {
          event.preventDefault();
          setSlashIndex((previous) =>
            previous - 1 < 0 ? slashSuggestions.length - 1 : previous - 1,
          );
          return true;
        }
        if (event.key === "Enter" && !event.shiftKey) {
          const activeCommand = slashSuggestions[slashIndex];
          if (activeCommand) {
            event.preventDefault();
            applySlashCommand(activeCommand);
            return true;
          }
        }
      }

      return false;
    },
    [
      applyMention,
      applySlashCommand,
      mentionIndex,
      mentionSuggestions,
      showMentionSuggestions,
      showSlashSuggestions,
      slashIndex,
      slashSuggestions,
    ],
  );

  React.useEffect(() => {
    if (!editor) return;
    editor.setOptions({
      editorProps: {
        handleKeyDown: (_view, event) => handleEditorKeyDown({ event }),
      },
    });
  }, [editor, handleEditorKeyDown]);

  const selectedMentionUsers = React.useMemo(
    () => users.filter((user) => mentionUserIds.includes(user.id)),
    [mentionUserIds, users],
  );

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="flex items-center justify-between gap-3 rounded-t-lg border border-b-0 border-border/60 bg-gradient-to-r from-muted/35 via-background to-muted/20 px-3 py-2">
          <div />
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 gap-1.5 px-2.5 text-xs"
            onClick={() => setReaderOpen(true)}
            disabled={!editor}
          >
            <Eye className="size-3.5" />
            Ampliar
          </Button>
        </div>

        <div className="richtext-root rounded-t-none border-border/60 shadow-sm">
          <div className="richtext-body max-h-[360px]">
            {editor && !readerOpen ? (
              <EditorContent
                editor={editor}
                className={cn("tiptap", readOnly ? "opacity-85" : undefined)}
              />
            ) : !editor ? (
              <div className="px-4 py-3 text-sm text-muted-foreground">{placeholder}</div>
            ) : (
              <div className="h-[140px]" />
            )}
          </div>
        </div>

        {showMentionSuggestions && !readerOpen ? (
          <div className="absolute left-0 right-0 top-full z-20 mt-2 rounded-md border border-border bg-background shadow-sm">
            <div className="border-b border-border/60 px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Mencionar pessoas
            </div>
            <div className="max-h-56 overflow-y-auto py-1">
              {mentionSuggestions.map((user, index) => (
                <button
                  key={user.id}
                  type="button"
                  className={cn(
                    "flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm",
                    index === mentionIndex
                      ? "bg-primary/10 text-foreground"
                      : "text-foreground hover:bg-muted/60",
                  )}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    applyMention(user);
                  }}
                >
                  <span className="truncate font-medium">{user.name}</span>
                  {user.email ? (
                    <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {showSlashSuggestions && !readerOpen ? (
          <div className="absolute left-0 right-0 top-full z-20 mt-2 rounded-md border border-border bg-background shadow-sm">
            <div className="border-b border-border/60 px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Comandos
            </div>
            <div className="max-h-56 overflow-y-auto py-1">
              {slashSuggestions.map((command, index) => (
                <button
                  key={command.id}
                  type="button"
                  className={cn(
                    "flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm",
                    index === slashIndex
                      ? "bg-primary/10 text-foreground"
                      : "text-foreground hover:bg-muted/60",
                  )}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    applySlashCommand(command);
                  }}
                >
                  <span className="truncate font-medium">{command.label}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {command.description}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {selectedMentionUsers.length ? (
        <div className="flex flex-wrap gap-1.5">
          {selectedMentionUsers.map((user) => (
            <Badge key={user.id} variant="outline" className="rounded-full px-2 text-[10px]">
              @{user.name}
            </Badge>
          ))}
        </div>
      ) : null}

      <div className="text-[11px] text-muted-foreground">
        Dicas: use @ para mencionar pessoas e / para abrir comandos de formatação rápida.
      </div>

      <Dialog open={readerOpen} onOpenChange={setReaderOpen}>
        <DialogContent className="max-w-[min(96vw,68rem)] p-0">
          <div className="border-b border-border/60 px-6 py-4 text-sm font-medium text-foreground">
            {`Notas internas de ${itemLabel ?? "item"}`}
          </div>
          <div className="max-h-[72vh] overflow-y-auto px-6 py-5">
            <div className="relative">
              <div className="richtext-root border-border/60 shadow-sm">
                {editor ? (
                  <EditorContent
                    editor={editor}
                    className={cn("tiptap", readOnly ? "opacity-85" : undefined)}
                  />
                ) : (
                  <div className="px-4 py-3 text-sm text-muted-foreground">{placeholder}</div>
                )}
              </div>

              {showMentionSuggestions && readerOpen ? (
                <div className="absolute left-0 right-0 top-full z-20 mt-2 rounded-md border border-border bg-background shadow-sm">
                  <div className="border-b border-border/60 px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    Mencionar pessoas
                  </div>
                  <div className="max-h-56 overflow-y-auto py-1">
                    {mentionSuggestions.map((user, index) => (
                      <button
                        key={user.id}
                        type="button"
                        className={cn(
                          "flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm",
                          index === mentionIndex
                            ? "bg-primary/10 text-foreground"
                            : "text-foreground hover:bg-muted/60",
                        )}
                        onMouseDown={(event) => {
                          event.preventDefault();
                          applyMention(user);
                        }}
                      >
                        <span className="truncate font-medium">{user.name}</span>
                        {user.email ? (
                          <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                        ) : null}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {showSlashSuggestions && readerOpen ? (
                <div className="absolute left-0 right-0 top-full z-20 mt-2 rounded-md border border-border bg-background shadow-sm">
                  <div className="border-b border-border/60 px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    Comandos
                  </div>
                  <div className="max-h-56 overflow-y-auto py-1">
                    {slashSuggestions.map((command, index) => (
                      <button
                        key={command.id}
                        type="button"
                        className={cn(
                          "flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm",
                          index === slashIndex
                            ? "bg-primary/10 text-foreground"
                            : "text-foreground hover:bg-muted/60",
                        )}
                        onMouseDown={(event) => {
                          event.preventDefault();
                          applySlashCommand(command);
                        }}
                      >
                        <span className="truncate font-medium">{command.label}</span>
                        <span className="truncate text-xs text-muted-foreground">
                          {command.description}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
