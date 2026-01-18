"use client";

import { CATEGORIES, type CategoryId } from "@/lib/categories";

export default function CategorySelector({
  value,
  onChange,
}: {
  value: Set<CategoryId>;
  onChange: (next: Set<CategoryId>) => void;
}) {
  function toggle(id: CategoryId) {
    const next = new Set(value);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(next);
  }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
      {CATEGORIES.map((c) => (
        <label key={c.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <input
            type="checkbox"
            checked={value.has(c.id)}
            onChange={() => toggle(c.id)}
          />
          <span>{c.label}</span>
        </label>
      ))}
    </div>
  );
}
