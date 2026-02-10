"use client";

import type { TagEditorProps } from "./people-detail-tags";
import { TagEditor } from "./people-detail-tags";
import { FamilyHeaderPreview } from "@/features/family-members/ui/family-header-preview";

type PeopleDetailHeaderProps = TagEditorProps;

export function PeopleDetailHeader({
  tags,
  suggestions,
  disabled,
  onSave,
}: PeopleDetailHeaderProps) {
  return (
    <div className="shrink-0">
      <div className="rounded-2xl border border-border/60 bg-background px-4 py-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-[220px] space-y-1">
            <p className="text-[11px] text-muted-foreground">Tags</p>
            <TagEditor
              tags={tags}
              suggestions={suggestions}
              onSave={onSave}
              disabled={disabled}
            />
          </div>
          <FamilyHeaderPreview />
        </div>
      </div>
    </div>
  );
}
