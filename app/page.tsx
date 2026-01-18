"use client";
import { useEffect, useState } from "react";
import CategorySelector from "@/components/CategorySelector";
import type { CategoryId } from "@/lib/categories";

const LS_KEY = "toeic_p5_selected_categories";

export default function HomePage() {
  const [selected, setSelected] = useState<CategoryId[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) setSelected(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(selected));
  }, [selected]);

  return (
    <main className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">TOEIC Part 5 Trainer</h1>
      <p className="mb-4">出題カテゴリを選択してください</p>

      <CategorySelector selected={selected} setSelected={setSelected} />

      <button
        disabled={!selected.length}
        className="mt-4 px-4 py-2 bg-black text-white disabled:opacity-40"
      >
        Start（次で実装）
      </button>
    </main>
  );
}
