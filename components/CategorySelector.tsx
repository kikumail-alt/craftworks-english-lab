"use client";
import { CATEGORIES, type CategoryId } from "@/lib/categories";

export default function CategorySelector({
  selected,
  setSelected,
}: {
  selected: CategoryId[];
  setSelected: (v: CategoryId[]) => void;
}) {
  const toggle = (id: CategoryId) =>
    setSelected(
      selected.includes(id)
        ? selected.filter((x) => x !== id)
        : [...selected, id]
    );

  return (
    <div className="grid gap-2">
      {CATEGORIES.map((c) => (
        <label key={c.id} className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={selected.includes(c.id)}
            onChange={() => toggle(c.id)}
          />
          <span>{c.label}</span>
        </label>
      ))}
    </div>
  );
}
