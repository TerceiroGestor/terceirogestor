"use client";

import * as React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { RichTextMenuBar } from "./RichTextMenuBar";
import StarterKit from "@tiptap/starter-kit";
import Heading from "@tiptap/extension-heading";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import ListItem from "@tiptap/extension-list-item";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import Document from "@tiptap/extension-document";
import Mention from "@tiptap/extension-mention";
import { createMentionSuggestion, type MentionSuggestionUser } from "./mention-suggestion";

interface Props {
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  onBlur?: () => void;
  /** Quando informado, habilita @menção para estas pessoas dentro do editor. */
  mentionUsers?: MentionSuggestionUser[];
}

export function RichText({ value, disabled, onChange, onBlur, mentionUsers }: Props) {
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

      ...(mentionUsers
        ? [
            Mention.configure({
              HTMLAttributes: { class: "richtext-mention" },
              suggestion: createMentionSuggestion(() => mentionUsers ?? []),
            }),
          ]
        : []),
    ],
    content: value ?? "",
    editable: !disabled,
    immediatelyRender: false,
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
    onBlur() {
      onBlur?.();
    },
  }, [mentionUsers]);

  if (!editor) return null;

  return (
    <div className="richtext-root">
      <div className="richtext-toolbar">
        <RichTextMenuBar editor={editor} />
      </div>
      <div className="richtext-body">
        <EditorContent editor={editor} className="tiptap" />
      </div>
    </div>
  );
}
