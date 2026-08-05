import React from "react";

interface JsonFieldEditorProps {
  value: string;
  onChange: (json: string) => void;
  section: string;
}

type FieldSchema = { key: string; label: string; type: "text" | "textarea" }[];

const SCHEMAS: Record<string, FieldSchema> = {
  stats_items: [
    { key: "value", label: "Value", type: "text" },
    { key: "label", label: "Label", type: "text" },
  ],
  services_cards: [
    { key: "icon", label: "Icon", type: "text" },
    { key: "title", label: "Title", type: "text" },
    { key: "description", label: "Description", type: "textarea" },
  ],
  why_choose_items: [
    { key: "title", label: "Title", type: "text" },
    { key: "description", label: "Description", type: "text" },
  ],
  values_cards: [
    { key: "icon", label: "Icon", type: "text" },
    { key: "title", label: "Title", type: "text" },
    { key: "description", label: "Description", type: "textarea" },
  ],
  team_cards: [
    { key: "icon", label: "Icon", type: "text" },
    { key: "title", label: "Title", type: "text" },
    { key: "description", label: "Description", type: "textarea" },
  ],
  timeline_items: [
    { key: "year", label: "Year", type: "text" },
    { key: "title", label: "Title", type: "text" },
    { key: "description", label: "Description", type: "textarea" },
  ],
  business_hours: [
    { key: "day", label: "Day(s)", type: "text" },
    { key: "hours", label: "Hours", type: "text" },
  ],
};

function parseItems(value: string): any[] {
  try {
    return JSON.parse(value) || [];
  } catch {
    return [];
  }
}

export default function JsonFieldEditor({ value, onChange, section }: JsonFieldEditorProps) {
  const items = parseItems(value);
  const schema = SCHEMAS[section];

  if (!schema) {
    // Simple string array (certifications_items)
    return (
      <StringArrayEditor
        items={items as string[]}
        onChange={(newItems) => onChange(JSON.stringify(newItems))}
      />
    );
  }

  const updateItem = (index: number, key: string, val: string) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [key]: val };
    onChange(JSON.stringify(updated));
  };

  const addItem = () => {
    const blank: Record<string, string> = {};
    schema.forEach((f) => (blank[f.key] = ""));
    onChange(JSON.stringify([...items, blank]));
  };

  const removeItem = (index: number) => {
    const updated = items.filter((_, i) => i !== index);
    onChange(JSON.stringify(updated));
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= items.length) return;
    const updated = [...items];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    onChange(JSON.stringify(updated));
  };

  return (
    <div className="json-editor">
      {items.map((item, index) => (
        <div key={index} className="json-editor-item">
          <div className="json-editor-item-header">
            <span className="json-editor-item-number">#{index + 1}</span>
            <div className="json-editor-item-actions">
              <button type="button" onClick={() => moveItem(index, -1)} disabled={index === 0} title="Move up">
                &uarr;
              </button>
              <button type="button" onClick={() => moveItem(index, 1)} disabled={index === items.length - 1} title="Move down">
                &darr;
              </button>
              <button type="button" onClick={() => removeItem(index)} className="json-remove-btn" title="Remove">
                &times;
              </button>
            </div>
          </div>
          {schema.map((field) => (
            <div key={field.key} className="json-editor-field">
              <label>{field.label}</label>
              {field.type === "textarea" ? (
                <textarea
                  value={item[field.key] || ""}
                  onChange={(e) => updateItem(index, field.key, e.target.value)}
                  rows={2}
                />
              ) : (
                <input
                  type="text"
                  value={item[field.key] || ""}
                  onChange={(e) => updateItem(index, field.key, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>
      ))}
      <button type="button" className="json-add-btn" onClick={addItem}>
        + Add Item
      </button>
    </div>
  );
}

function StringArrayEditor({ items, onChange }: { items: string[]; onChange: (items: string[]) => void }) {
  const update = (index: number, val: string) => {
    const updated = [...items];
    updated[index] = val;
    onChange(updated);
  };

  const add = () => onChange([...items, ""]);
  const remove = (index: number) => onChange(items.filter((_, i) => i !== index));

  return (
    <div className="json-editor">
      {items.map((item, index) => (
        <div key={index} className="json-editor-string-item">
          <input
            type="text"
            value={item}
            onChange={(e) => update(index, e.target.value)}
          />
          <button type="button" onClick={() => remove(index)} className="json-remove-btn" title="Remove">
            &times;
          </button>
        </div>
      ))}
      <button type="button" className="json-add-btn" onClick={add}>
        + Add Item
      </button>
    </div>
  );
}
