"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  TASK_AUDIT_FIELD_LABELS,
  TASK_CHECKLIST_AUDIT_FIELD_LABELS,
  TASK_COMMENT_AUDIT_FIELD_LABELS,
  TASK_DEPENDENCY_AUDIT_FIELD_LABELS,
  TASK_DUE_STATE_BADGE_CLASSNAMES,
  TASK_STATUS_BADGE_CLASSNAMES,
  TASK_SUBTASK_AUDIT_FIELD_LABELS,
} from "@/modules/tasks/shared/domain/tasks.constants";
import type {
  TaskAssignableUser,
  TaskChecklistItem,
  TaskComment,
  TaskCommentMutationInput,
  TaskDependency,
  TaskMutationInput,
  TaskRecord,
  TaskSubtask,
} from "@/modules/tasks/shared/domain/types";
import { TaskDetailForm } from "@/modules/tasks/shared/ui/task-detail-form";
import { DetailCommentsPanel } from "@/web-client/detail/DetailCommentsPanel";
import type { DetailShellAuditContext } from "@/web-client/detail/DetailShellEngine";
import { DetailAuditFeed } from "@/web-client/detail/DetailAuditFeed";
import { DetailNotesPanel } from "@/web-client/detail/DetailNotesPanel";
import { DetailSideTabs } from "@/web-client/detail/DetailSideTabs";
import { DetailTagsField } from "@/web-client/detail/DetailTagsField";
import { buildGroupedAuditFeed } from "@/web-client/detail/audit-feed-utils";
import type { DetailLayoutConfig } from "@/web-client/registry/types";

const AUTO_SAVE_EDITING = {
  saveMode: "auto",
  autoSave: {
    trigger: "field-commit",
  },
} as const;

function checklistColumns(): ColumnDef<TaskChecklistItem, unknown>[] {
  return [
    {
      accessorKey: "label",
      header: "Item",
      cell: ({ row }) => row.original.label,
    },
    {
      accessorKey: "notes",
      header: "Notas",
      cell: ({ row }) => row.original.notes?.trim() || "-",
    },
    {
      accessorKey: "owner",
      header: "Responsavel",
      cell: ({ row }) => row.original.owner ?? "-",
    },
    {
      accessorKey: "dueDate",
      header: "Entrega",
      cell: ({ row }) => row.original.dueDate ?? "-",
    },
    {
      id: "done",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          className={cn(
            "rounded-full px-2 text-[10px]",
            row.original.done
              ? "border-transparent bg-emerald-500/10 text-emerald-700 dark:text-emerald-200"
              : "border-transparent bg-slate-500/10 text-slate-700 dark:text-slate-200",
          )}
        >
          {row.original.done ? "Concluido" : "Pendente"}
        </Badge>
      ),
    },
  ];
}

function subtaskColumns(): ColumnDef<TaskSubtask, unknown>[] {
  return [
    {
      accessorKey: "title",
      header: "Subtarefa",
      cell: ({ row }) => row.original.title,
    },
    {
      accessorKey: "description",
      header: "Descricao",
      cell: ({ row }) => row.original.description?.trim() || "-",
    },
    {
      accessorKey: "startDate",
      header: "Inicio",
      cell: ({ row }) => row.original.startDate ?? "-",
    },
    {
      accessorKey: "owner",
      header: "Responsavel",
      cell: ({ row }) => row.original.owner ?? "-",
    },
    {
      accessorKey: "dueDate",
      header: "Entrega",
      cell: ({ row }) => row.original.dueDate ?? "-",
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          className={cn(
            "rounded-full px-2 text-[10px]",
            TASK_STATUS_BADGE_CLASSNAMES[row.original.status],
          )}
        >
          {row.original.status}
        </Badge>
      ),
    },
  ];
}

function dependencyColumns(): ColumnDef<TaskDependency, unknown>[] {
  return [
    {
      accessorKey: "title",
      header: "Tarefa",
      cell: ({ row }) => row.original.title,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => row.original.status,
    },
    {
      accessorKey: "priority",
      header: "Prioridade",
      cell: ({ row }) => row.original.priority,
    },
    {
      accessorKey: "owner",
      header: "Responsavel",
      cell: ({ row }) => row.original.owner ?? "-",
    },
    {
      accessorKey: "dueDate",
      header: "Entrega",
      cell: ({ row }) => row.original.dueDate ?? "-",
    },
  ];
}

function DetailSummary({
  task,
  draft,
  canEdit,
  onDraftChange,
  onCommitField,
}: {
  task: TaskRecord;
  draft: TaskMutationInput;
  canEdit: boolean;
  onDraftChange: React.Dispatch<React.SetStateAction<TaskMutationInput>>;
  onCommitField: <K extends keyof TaskMutationInput>(
    field: K,
    nextValue?: TaskMutationInput[K],
  ) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2 border-b border-border/50 pb-4">
        <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Contexto
        </div>
        <div className="grid gap-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Responsavel</span>
            <span className="text-foreground">{task.owner ?? "-"}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Time</span>
            <span className="text-foreground">{task.team ?? "-"}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Prazo</span>
            <Badge
              className={cn(
                "rounded-full px-2 text-[10px]",
                TASK_DUE_STATE_BADGE_CLASSNAMES[task.dueState],
              )}
            >
              {task.dueState}
            </Badge>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Marco</span>
            <span className="text-foreground">{task.isMilestone ? "Sim" : "Nao"}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Checklist</span>
            <span className="text-foreground">{task.checklist.length}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Subtarefas</span>
            <span className="text-foreground">{task.subtasks.length}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Comentarios</span>
            <span className="text-foreground">{task.comments.length}</span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <DetailTagsField
          value={draft.tags}
          onChange={(nextTags) =>
            onDraftChange((previous) => ({ ...previous, tags: nextTags }))
          }
          onCommit={(nextTags) => onCommitField("tags", nextTags)}
          readOnly={!canEdit}
        />
      </div>
    </div>
  );
}

export type TasksDetailLayoutContext = DetailShellAuditContext & {
  task: TaskRecord;
  draft: TaskMutationInput;
  assignableUsers: TaskAssignableUser[];
  assignableUsersLoading: boolean;
  onDraftChange: React.Dispatch<React.SetStateAction<TaskMutationInput>>;
  onCommitField: <K extends keyof TaskMutationInput>(
    field: K,
    nextValue?: TaskMutationInput[K],
  ) => void;
  onCommitDraft: (nextDraft: TaskMutationInput) => void;
  onNotesChange: (next: string | null) => void;
  onNotesBlur: () => void;
  onAddChecklistItem: () => void;
  onToggleChecklistItem: (item: TaskChecklistItem) => void;
  onEditChecklistItem: (item: TaskChecklistItem) => void;
  onAddSubtask: () => void;
  onToggleSubtaskStatus: (item: TaskSubtask) => void;
  onEditSubtask: (item: TaskSubtask) => void;
  commentDraft: TaskCommentMutationInput;
  onCommentDraftChange: React.Dispatch<React.SetStateAction<TaskCommentMutationInput>>;
  onSubmitComment: () => void;
  onDeleteComment: (comment: TaskComment) => void;
  commentSubmitting: boolean;
  onOpenDependencyCreate: () => void;
  onRemoveDependency: (dependency: TaskDependency) => void;
  auditVisibleCount: number;
  onAuditVisibleCountChange: React.Dispatch<React.SetStateAction<number>>;
  canAudit: boolean;
  canEdit: boolean;
};

function TaskDetailSide({
  task,
  draft,
  assignableUsers,
  detailAudit,
  canAudit,
  canEdit,
  auditVisibleCount,
  onAuditVisibleCountChange,
  onNotesChange,
  onNotesBlur,
  commentDraft,
  onCommentDraftChange,
  onSubmitComment,
  onDeleteComment,
  commentSubmitting,
  onDraftChange,
  onCommitField,
}: {
  task: TaskRecord;
  draft: TaskMutationInput;
  assignableUsers: TaskAssignableUser[];
  detailAudit?: DetailShellAuditContext["detailAudit"];
  canAudit: boolean;
  canEdit: boolean;
  auditVisibleCount: number;
  onAuditVisibleCountChange: React.Dispatch<React.SetStateAction<number>>;
  onNotesChange: (next: string | null) => void;
  onNotesBlur: () => void;
  commentDraft: TaskCommentMutationInput;
  onCommentDraftChange: React.Dispatch<React.SetStateAction<TaskCommentMutationInput>>;
  onSubmitComment: () => void;
  onDeleteComment: (comment: TaskComment) => void;
  commentSubmitting: boolean;
  onDraftChange: React.Dispatch<React.SetStateAction<TaskMutationInput>>;
  onCommitField: <K extends keyof TaskMutationInput>(
    field: K,
    nextValue?: TaskMutationInput[K],
  ) => void;
}) {
  const auditCount = buildGroupedAuditFeed(detailAudit?.logs ?? []).length;

  return (
    <DetailSideTabs
      tabs={[
        {
          value: "activity",
          label: "Atividade",
          badge: canAudit && auditCount ? auditCount : undefined,
          content: canAudit ? (
            <DetailAuditFeed
              mode="edit"
              auditState={detailAudit}
              auditVisibleCount={auditVisibleCount}
              onAuditVisibleCountChange={onAuditVisibleCountChange}
            />
          ) : (
            <div className="text-sm text-muted-foreground">Sem permissao para auditoria.</div>
          ),
        },
        {
          value: "comments",
          label: "Comentarios",
          badge: task.comments.length || undefined,
          content: (
            <DetailCommentsPanel
              comments={task.comments}
              value={commentDraft.body}
              mentionUserIds={commentDraft.mentionUserIds}
              users={assignableUsers}
              onValueChange={(next) =>
                onCommentDraftChange((previous) => ({ ...previous, body: next }))
              }
              onMentionUserIdsChange={(next) =>
                onCommentDraftChange((previous) => ({
                  ...previous,
                  mentionUserIds: next,
                }))
              }
              onSubmit={onSubmitComment}
              onDeleteComment={
                canEdit
                  ? (commentId) => {
                      const comment = task.comments.find((entry) => entry.id === commentId);
                      if (comment) {
                        onDeleteComment(comment);
                      }
                    }
                  : undefined
              }
              submitting={commentSubmitting}
              readOnly={!canEdit}
            />
          ),
        },
        {
          value: "notes",
          label: "Notas internas",
          content: (
            <DetailNotesPanel
              value={draft.internalNotes}
              onChange={onNotesChange}
              onBlur={onNotesBlur}
            />
          ),
        },
        {
          value: "context",
          label: "Contexto",
          content: (
            <DetailSummary
              task={task}
              draft={draft}
              canEdit={canEdit}
              onDraftChange={onDraftChange}
              onCommitField={onCommitField}
            />
          ),
        },
      ]}
      defaultValue="activity"
    />
  );
}

export const tasksDetailLayout: DetailLayoutConfig<TasksDetailLayoutContext> = {
  editing: AUTO_SAVE_EDITING,
  header: {
    title: ({ task }) => task.title,
    slot: ({ task }) => (
      <div className="border-y border-border/60 bg-transparent px-0 py-3">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="text-muted-foreground">Status</div>
            <div className="font-medium text-foreground">{task.status}</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-muted-foreground">Prioridade</div>
            <div className="font-medium text-foreground">{task.priority}</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-muted-foreground">Prazo</div>
            <Badge
              className={cn(
                "rounded-full px-2 text-[10px]",
                TASK_DUE_STATE_BADGE_CLASSNAMES[task.dueState],
              )}
            >
              {task.dueState}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-muted-foreground">Entrega</div>
            <div className="font-medium text-foreground">{task.dueDate ?? "-"}</div>
          </div>
          {task.isMilestone ? (
            <div className="flex items-center gap-2">
              <div className="text-muted-foreground">Marco</div>
              <div className="font-medium text-foreground">Sim</div>
            </div>
          ) : null}
          <div className="flex items-center gap-2">
            <div className="text-muted-foreground">Atualizado</div>
            <div className="font-medium text-foreground">{task.updatedAt.slice(0, 10)}</div>
          </div>
        </div>
      </div>
    ),
  },
  main: ({
    draft,
    assignableUsers,
    assignableUsersLoading,
    onDraftChange,
    onCommitField,
    onCommitDraft,
  }) => (
    <TaskDetailForm
      value={draft}
      assignableUsers={assignableUsers}
      assignableUsersLoading={assignableUsersLoading}
      onChange={onDraftChange}
      onCommitField={onCommitField}
      onCommitDraft={onCommitDraft}
    />
  ),
  side: ({
    task,
    draft,
    assignableUsers,
    detailAudit,
    canAudit,
    canEdit,
    auditVisibleCount,
    onAuditVisibleCountChange,
    onNotesChange,
    onNotesBlur,
    commentDraft,
    onCommentDraftChange,
    onSubmitComment,
    onDeleteComment,
    commentSubmitting,
    onDraftChange,
    onCommitField,
  }) => (
    <TaskDetailSide
      task={task}
      draft={draft}
      assignableUsers={assignableUsers}
      detailAudit={detailAudit}
      canAudit={canAudit}
      canEdit={canEdit}
      auditVisibleCount={auditVisibleCount}
      onAuditVisibleCountChange={onAuditVisibleCountChange}
      onNotesChange={onNotesChange}
      onNotesBlur={onNotesBlur}
      commentDraft={commentDraft}
      onCommentDraftChange={onCommentDraftChange}
      onSubmitComment={onSubmitComment}
      onDeleteComment={onDeleteComment}
      commentSubmitting={commentSubmitting}
      onDraftChange={onDraftChange}
      onCommitField={onCommitField}
    />
  ),
  tabTemplates: [
    {
      key: "checklist",
      label: "Checklist",
      badge: ({ task }) => task.checklist.length,
      content: () => (
        <div className="text-sm text-muted-foreground">
          Itens operacionais ligados a esta tarefa.
        </div>
      ),
      relations: [
        {
          key: "checklist-items",
          label: "Checklist",
          rows: ({ task }) => task.checklist,
          columns: checklistColumns(),
          getRowId: (row) => row.id,
          onRowClick: (row, { onEditChecklistItem }) => onEditChecklistItem(row),
          emptyLabel: "Nenhum item no checklist.",
          action: {
            label: "Novo item",
            onClick: ({ onAddChecklistItem }) => onAddChecklistItem(),
            hidden: ({ canEdit }) => !canEdit,
          },
        },
      ],
    },
    {
      key: "subtasks",
      label: "Subtarefas",
      badge: ({ task }) => task.subtasks.length,
      content: () => (
        <div className="text-sm text-muted-foreground">
          Desdobramentos da entrega principal.
        </div>
      ),
      relations: [
        {
          key: "subtask-items",
          label: "Subtarefas",
          rows: ({ task }) => task.subtasks,
          columns: subtaskColumns(),
          getRowId: (row) => row.id,
          onRowClick: (row, { onEditSubtask }) => onEditSubtask(row),
          emptyLabel: "Nenhuma subtarefa cadastrada.",
          action: {
            label: "Nova subtarefa",
            onClick: ({ onAddSubtask }) => onAddSubtask(),
            hidden: ({ canEdit }) => !canEdit,
          },
        },
      ],
    },
    {
      key: "dependencies",
      label: "Dependencias",
      badge: ({ task }) => task.dependencies.length + task.dependents.length,
      content: () => (
        <div className="text-sm text-muted-foreground">
          Relacoes entre tarefas que bloqueiam ou dependem desta entrega.
        </div>
      ),
      relations: [
        {
          key: "blocked-by",
          label: "Bloqueada por",
          rows: ({ task }) => task.dependencies,
          columns: dependencyColumns(),
          getRowId: (row) => row.id,
          onRowClick: (row, { onRemoveDependency }) => onRemoveDependency(row),
          emptyLabel: "Nenhuma dependencia cadastrada.",
          action: {
            label: "Nova dependencia",
            onClick: ({ onOpenDependencyCreate }) => onOpenDependencyCreate(),
            hidden: ({ canEdit }) => !canEdit,
          },
        },
        {
          key: "blocking",
          label: "Esta tarefa desbloqueia",
          rows: ({ task }) => task.dependents,
          columns: dependencyColumns(),
          getRowId: (row) => row.id,
          emptyLabel: "Nenhuma tarefa dependente.",
        },
      ],
    },
  ],
  auditSources: {
    primaryEntity: {
      key: "task",
      entity: "TaskOrganizerTask",
      model: "tasks.audit",
      label: "Tarefa",
      fieldLabels: TASK_AUDIT_FIELD_LABELS,
      valueFormatters: {
        progress: (value) => `${Number(value ?? 0)}%`,
        tags: (value) =>
          Array.isArray(value) ? value.map((entry) => String(entry)).join(", ") : "-",
      },
      resolveEntityId: ({ task }) => task.id,
    },
    relatedEntities: [
      {
        key: "checklist",
        entity: "TaskOrganizerChecklistItem",
        model: "tasks.audit",
        label: "Checklist",
        fieldLabels: TASK_CHECKLIST_AUDIT_FIELD_LABELS,
        valueFormatters: {
          done: (value) => (value ? "Concluido" : "Pendente"),
        },
        resolveEntityIds: ({ task }) => task.checklist.map((item) => item.id),
      },
      {
        key: "subtask",
        entity: "TaskOrganizerSubtask",
        model: "tasks.audit",
        label: "Subtarefa",
        fieldLabels: TASK_SUBTASK_AUDIT_FIELD_LABELS,
        resolveEntityIds: ({ task }) => task.subtasks.map((item) => item.id),
      },
      {
        key: "comment",
        entity: "TaskOrganizerComment",
        model: "tasks.audit",
        label: "Comentario",
        fieldLabels: TASK_COMMENT_AUDIT_FIELD_LABELS,
        valueFormatters: {
          mentionUserIds: (value, { context }) =>
            Array.isArray(value)
              ? value
                  .map((entry) =>
                    context.assignableUsers.find((user) => user.id === String(entry))?.name ??
                    String(entry),
                  )
                  .join(", ")
              : "-",
        },
        resolveEntityIds: ({ task }) => task.comments.map((item) => item.id),
      },
      {
        key: "dependency",
        entity: "TaskOrganizerTaskDependency",
        model: "tasks.audit",
        label: "Dependencia",
        fieldLabels: TASK_DEPENDENCY_AUDIT_FIELD_LABELS,
        resolveEntityIds: ({ task }) => [
          ...task.dependencies.map((item) => item.id),
          ...task.dependents.map((item) => item.id),
        ],
      },
    ],
    sort: [{ field: "createdAt", direction: "desc" }],
    pagination: { limit: 120 },
  },
};
