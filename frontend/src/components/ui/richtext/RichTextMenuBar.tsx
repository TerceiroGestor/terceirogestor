import { Editor } from "@tiptap/react";
import { useRichTextState } from "./useRichTextState";

export function RichTextMenuBar({ editor }: { editor: Editor }) {
  const state = useRichTextState(editor);

  if (!editor) return null;

  return (
    <div className="toolbar">
      {/* ===== Text styles ===== */}
      <div className="toolbar-group">
        <button
          type="button"
          title="Negrito"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!state.canBold}
          className={state.isBold ? "active" : ""}
        >
          B
        </button>

        <button
          type="button"
          title="Italico"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!state.canItalic}
          className={state.isItalic ? "active" : ""}
        >
          I
        </button>

        <button
          type="button"
          title="Tachado"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={!state.canStrike}
          className={state.isStrike ? "active" : ""}
        >
          S
        </button>

        <button
          type="button"
          title="Codigo"
          onClick={() => editor.chain().focus().toggleCode().run()}
          disabled={!state.canCode}
          className={state.isCode ? "active" : ""}
        >
          {"[A]"}
        </button>
      </div>

      <div className="toolbar-divider" />

      {/* ===== Paragraph / Headings ===== */}
      <div className="toolbar-group">
        <button
          type="button"
          title="Paragrafo"
          onClick={() => editor.chain().focus().setParagraph().run()}
          className={state.isParagraph ? "active" : ""}
        >
          P
        </button>

        <button
          type="button"
          title="Titulo 1"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          className={state.isHeading1 ? "active" : ""}
        >
          H1
        </button>

        <button
          type="button"
          title="Titulo 2"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          className={state.isHeading2 ? "active" : ""}
        >
          H2
        </button>

        <button
          type="button"
          title="Titulo 3"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          className={state.isHeading3 ? "active" : ""}
        >
          H3
        </button>
      </div>

      <div className="toolbar-divider" />

      {/* ===== Lists / Blocks ===== */}
      <div className="toolbar-group">
        <button
          type="button"
          title="Lista com marcadores"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={state.isBulletList ? "active" : ""}
        >
          •
        </button>

        <button
          type="button"
          title="Lista numerada"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={state.isOrderedList ? "active" : ""}
        >
          1.
        </button>

        <button
          type="button"
          title="Citacao"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={state.isBlockquote ? "active" : ""}
        >
          ❝
        </button>

        <button
          type="button"
          title="Bloco de codigo"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={state.isCodeBlock ? "active" : ""}
        >
          [ ]
        </button>
      </div>

      <div className="toolbar-divider" />

      {/* ===== Utils ===== */}
      <div className="toolbar-group">
        <button
          type="button"
          title="Limpar formatacao"
          onClick={() => editor.chain().focus().unsetAllMarks().run()}
        >
          ⌫
        </button>

        <button
          type="button"
          title="Linha horizontal"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          ―
        </button>
      </div>

      <div className="toolbar-divider" />

      {/* ===== History ===== */}
      <div className="toolbar-group">
        <button
          type="button"
          title="Desfazer"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!state.canUndo}
        >
          ↶
        </button>

        <button
          type="button"
          title="Refazer"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!state.canRedo}
        >
          ↷
        </button>
      </div>
    </div>
  );
}
