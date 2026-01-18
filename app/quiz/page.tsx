"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CATEGORY_TO_JSON, type CategoryId } from "@/lib/categories";

type Question = {
  id: string;
  sentence: string;
  choices: [string, string, string, string];
  // 品詞カテゴリ用：選択肢それぞれの品詞ラベル
  choicePos?: [string, string, string, string];

  answer: 0 | 1 | 2 | 3;
  explanation: string;
  trap: string;
  difficulty: 1 | 2 | 3;
};

function renderSentence(sentence: string) {
  // "_____" が太く見えすぎるのを防ぐ（Times系だと強調されがち）
  const parts = sentence.split("_____");
  if (parts.length === 1) return sentence;

  return (
    <>
      {parts.map((p, i) => (
        <span key={i}>
          {p}
          {i < parts.length - 1 && (
            <span
              style={{
                fontFamily: '"Times New Roman", Times, serif',
                fontWeight: 400,
                opacity: 0.6,
                letterSpacing: "-0.02em",
                whiteSpace: "nowrap",
              }}
              aria-hidden="true"
            >
              _____
            </span>
          )}
        </span>
      ))}
    </>
  );
}

export default function QuizPage() {
  const sp = useSearchParams();
  const catsParam = sp.get("cats") || "pos";

  const categoryIds = useMemo(() => {
    return catsParam
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean) as CategoryId[];
  }, [catsParam]);

  // 「品詞」だけ選んだ時だけ、選択肢に品詞ラベルを表示
  const isPosMode = categoryIds.length === 1 && categoryIds[0] === "pos";

  const [pool, setPool] = useState<Question[]>([]);
  const [q, setQ] = useState<Question | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [error, setError] = useState("");

  async function loadPool() {
    try {
      setError("");
      const files = categoryIds.map((id) => CATEGORY_TO_JSON[id]).filter(Boolean);

      const results = await Promise.all(
        files.map(async (path) => {
          const res = await fetch(path);
          if (!res.ok) throw new Error(`Cannot load ${path}`);
          return (await res.json()) as Question[];
        })
      );

      const merged = results.flat();
      if (merged.length === 0) throw new Error("No questions loaded.");

      setPool(merged);
      setPicked(null);
      setShowAnswer(false);
      setQ(merged[Math.floor(Math.random() * merged.length)]);
    } catch (e: any) {
      setError(e?.message ?? "Unknown error");
      setPool([]);
      setQ(null);
    }
  }

  function nextOne() {
    if (pool.length === 0) return;
    setPicked(null);
    setShowAnswer(false);
    setQ(pool[Math.floor(Math.random() * pool.length)]);
  }

  function choose(i: number) {
    if (showAnswer) return;
    setPicked(i);
    setShowAnswer(true);
  }

  useEffect(() => {
    loadPool();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catsParam]);

  return (
    <main style={{ maxWidth: 760, margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.6rem", fontWeight: 700, marginBottom: 10 }}>
        Quiz
      </h1>

      <p style={{ fontSize: 12, opacity: 0.75, marginTop: 0 }}>
        カテゴリ: {categoryIds.join(", ")}
      </p>

      {error && <p style={{ color: "#ffb4b4" }}>{error}</p>}

      {!q ? (
        <p>Loading...</p>
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          {/* 問題文：大きくクッキリ、TOEICっぽく Times 系 */}
          <div
            style={{
              fontSize: "1.6rem",
              fontWeight: 400,
              lineHeight: 1.6,
              letterSpacing: "0.01em",
              fontFamily: '"Times New Roman", Times, serif',
              userSelect: "text",
            }}
          >
            {renderSentence(q.sentence)}
          </div>

          {/* 仕切り（混ざって見えないように） */}
          <div
            aria-hidden="true"
            style={{
              height: 1,
              opacity: 0.35,
              background: "currentColor",
              borderRadius: 999,
            }}
          />

          {/* 選択肢 */}
          <div className="choices" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {q.choices.map((c, i) => {
              const isCorrect = showAnswer && i === q.answer;
              const isWrong = showAnswer && picked === i && i !== q.answer;

              const cls = [
                "choice",
                isCorrect ? "correct" : "",
                isWrong ? "wrong" : "",
              ]
                .filter(Boolean)
                .join(" ");

              const posLabel = isPosMode ? q.choicePos?.[i as 0 | 1 | 2 | 3] : undefined;

              return (
                <button
                  key={i}
                  onClick={() => choose(i)}
                  className={cls}
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "baseline",
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid #666",
                    background: "transparent",
                    color: "inherit",
                    cursor: showAnswer ? "default" : "pointer",
                    textAlign: "left",
                  }}
                >
                  {/* A/B/C/D は目立たせない */}
                  <span
                    style={{
                      fontSize: "0.8rem",
                      opacity: 0.55,
                      minWidth: "1.4em",
                      textAlign: "right",
                      letterSpacing: "0.04em",
                      fontFamily: "system-ui, sans-serif",
                      userSelect: "none",
                    }}
                    aria-hidden="true"
                  >
                    {String.fromCharCode(65 + i)}
                  </span>

                  {/* 選択肢本文 + 品詞ラベル */}
                  <span
                    style={{
                      display: "inline-flex",
                      gap: 10,
                      alignItems: "baseline",
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: '"Times New Roman", Times, serif',
                        fontSize: "1.1rem",
                        lineHeight: 1.35,
                      }}
                    >
                      {c}
                    </span>

                    {posLabel && (
                      <span
                        style={{
                          fontSize: "0.85rem",
                          opacity: 0.7,
                          border: "1px solid currentColor",
                          borderRadius: 999,
                          padding: "2px 8px",
                          lineHeight: 1.2,
                          fontFamily: "system-ui, sans-serif",
                        }}
                        aria-label={`品詞: ${posLabel}`}
                      >
                        {posLabel}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          {/* 解説 */}
          {showAnswer && (
            <div
              className="card"
              style={{
                border: "1px solid #666",
                borderRadius: 12,
                padding: 12,
              }}
            >
              <p style={{ margin: "0 0 6px" }}>
                {picked === q.answer ? "✅ Correct!" : "❌ Incorrect"}
              </p>

              <p className="explanation" style={{ margin: "4px 0" }}>
                <strong>Explanation:</strong> {q.explanation}
              </p>

              <p className="explanation" style={{ margin: "4px 0" }}>
                <strong>Trap:</strong> {q.trap}
              </p>
            </div>
          )}

          {/* 次へ */}
          {showAnswer && (
            <button
              onClick={nextOne}
              style={{
                alignSelf: "flex-start",
                padding: "8px 12px",
                borderRadius: 12,
                border: "1px solid #666",
                background: "transparent",
                color: "inherit",
                cursor: "pointer",
              }}
            >
              Next question
            </button>
          )}

          {/* ✅ ID：邪魔にならない場所（画面下・右寄せ・超薄く） */}
          <div
            style={{
              marginTop: 28,
              textAlign: "right",
              fontSize: "0.65rem",
              opacity: 0.28,
              letterSpacing: "0.08em",
              fontFamily: "system-ui, sans-serif",
              userSelect: "none",
            }}
            aria-hidden="true"
          >
            {q && `ID: ${q.id}`}
          </div>
        </div>
      )}
    </main>
  );
}
