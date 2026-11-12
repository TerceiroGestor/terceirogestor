"use client";

import { ReactRenderer } from "@tiptap/react";
import type { SuggestionOptions } from "@tiptap/suggestion";
import {
  MentionSuggestionList,
  type MentionSuggestionListHandle,
  type MentionSuggestionUser,
} from "./MentionSuggestionList";

export function createMentionSuggestion(
  getUsers: () => MentionSuggestionUser[],
): Omit<SuggestionOptions<MentionSuggestionUser>, "editor"> {
  return {
    items: ({ query }) => {
      const normalizedQuery = query.trim().toLocaleLowerCase();
      return getUsers()
        .filter((user) => {
          if (!normalizedQuery) return true;
          const haystack = `${user.name} ${user.email ?? ""}`.toLocaleLowerCase();
          return haystack.includes(normalizedQuery);
        })
        .slice(0, 8);
    },
    render: () => {
      let component: ReactRenderer<MentionSuggestionListHandle, {
        items: MentionSuggestionUser[];
        command: (user: MentionSuggestionUser) => void;
      }> | null = null;
      let unmount: (() => void) | null = null;

      return {
        onStart: (props) => {
          component = new ReactRenderer(MentionSuggestionList, {
            props: {
              items: props.items,
              command: (user: MentionSuggestionUser) =>
                props.command({ id: user.id, label: user.name }),
            },
            editor: props.editor,
          });
          unmount = props.mount(component.element);
        },
        onUpdate: (props) => {
          component?.updateProps({
            items: props.items,
            command: (user: MentionSuggestionUser) =>
              props.command({ id: user.id, label: user.name }),
          });
        },
        onKeyDown: (props) => {
          if (props.event.key === "Escape") {
            unmount?.();
            return true;
          }
          return component?.ref?.onKeyDown(props) ?? false;
        },
        onExit: () => {
          unmount?.();
          component?.destroy();
          unmount = null;
          component = null;
        },
      };
    },
  };
}

export type { MentionSuggestionUser };
