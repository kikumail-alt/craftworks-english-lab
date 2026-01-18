"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES, type CategoryId } from "@/lib/categories";
import CategorySelector from "@/components/CategorySelector";

export default function HomePage() {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<CategoryId>>(() => new Set(["pos"]));

  const selectedIds = useMemo(() => Array.from(selected), [selected]);

  function onStart() {
    if (selectedIds.length === 0) return;
    const qs = new URLSearchParams({ cats: selectedIds.join(",") });
    router.push(`/quiz?${qs.toString()}`);
  }

  return (
    <main style={{ maxWidth: 760, margin: "0 auto" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: 6 }}>
        TOEIC Part 5 Train
      </h1>
      <p style={{ opacity: 0.9, marginTop: 0 }}>出題カテゴリを選択してください</p>

      <div style={{ marginTop: 14 }}>
        <CategorySelector value={selected} onChange={setSelected} />
      </div>

      <div style={{ marginTop: 14, display: "flex", gap: 10, alignItems: "center" }}>
        <button
          onClick={onStart}
          disabled={selectedIds.length === 0}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #666",
            background: "transparent",
            color: "inherit",
            cursor: selectedIds.length === 0 ? "not-allowed" : "pointer",
            opacity: selectedIds.length === 0 ? 0.5 : 1,
          }}
        >
          Start（次で実装）
        </button>

        <span style={{ fontSize: 12, opacity: 0.75 }}>
          選択中: {selectedIds.map(id => CATEGORIES.find(c => c.id === id)?.label).join(" / ")}
        </span>
      </div>
    </main>
  );
}
