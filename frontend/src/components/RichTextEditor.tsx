import React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import "../styles/RichTextEditor.css";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
}

function MenuBar({ editor }: { editor: any }) {
  if (!editor) return null;

  return (
    <div className="rte-toolbar">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={editor.isActive("bold") ? "rte-btn active" : "rte-btn"}
        title="Bold"
      >
        B
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={editor.isActive("italic") ? "rte-btn active" : "rte-btn"}
        title="Italic"
      >
        I
      </button>
      <span className="rte-separator" />
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={editor.isActive("heading", { level: 3 }) ? "rte-btn active" : "rte-btn"}
        title="Heading"
      >
        H3
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
        className={editor.isActive("heading", { level: 4 }) ? "rte-btn active" : "rte-btn"}
        title="Subheading"
      >
        H4
      </button>
      <span className="rte-separator" />
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={editor.isActive("bulletList") ? "rte-btn active" : "rte-btn"}
        title="Bullet List"
      >
        &bull; List
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={editor.isActive("orderedList") ? "rte-btn active" : "rte-btn"}
        title="Numbered List"
      >
        1. List
      </button>
      <span className="rte-separator" />
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={editor.isActive("blockquote") ? "rte-btn active" : "rte-btn"}
        title="Quote"
      >
        Quote
      </button>
      <button
        type="button"
        onClick={() => {
          const url = window.prompt("Enter URL:");
          if (url) {
            try {
              const parsed = new URL(url);
              if (!["http:", "https:", "mailto:"].includes(parsed.protocol)) {
                alert("Only http, https, and mailto links are allowed.");
                return;
              }
              editor.chain().focus().setLink({ href: url }).run();
            } catch {
              alert("Please enter a valid URL (e.g. https://example.com).");
            }
          }
        }}
        className={editor.isActive("link") ? "rte-btn active" : "rte-btn"}
        title="Add Link"
      >
        Link
      </button>
      {editor.isActive("link") && (
        <button
          type="button"
          onClick={() => editor.chain().focus().unsetLink().run()}
          className="rte-btn"
          title="Remove Link"
        >
          Unlink
        </button>
      )}
    </div>
  );
}

export default function RichTextEditor({ content, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ link: false }),
      Link.configure({ openOnClick: false }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  return (
    <div className="rte-container">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} className="rte-content" />
    </div>
  );
}
