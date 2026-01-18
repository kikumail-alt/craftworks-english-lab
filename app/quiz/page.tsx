"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Question = {
  id: string;
  sentence: string;
  choices: string[];
  choicePos?: string[];
  answer: number;
  explanation?: string;
  trap?: string;
  difficulty?: number;
};

function getQueryParam(name: string) {
  if (typeof window === "undefined") return null;
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

export default function QuizPage() {
  const category = useMemo(() => getQueryParam("cat") ?? "pos", []);
  const dataUrl = useMemo(() => `/data/questions/${category}.json`, [category]);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [idx, setIdx] = useState(0);

  const [picked, setPicked] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ streak（連続正解）
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setError(null);
        const res = await fetch(dataUrl, { cache: "no-store" });
        if (!res.ok) throw new Error(`Cannot load ${dataUrl}`);
        const json = (await res.json()) as Question[];
        if (!Array.isArray(json) || json.length === 0) throw new Error("No questions found");

        if (!cancelled) {
          setQuestions(json);
          setIdx(0);
          setPicked(null);
          setShowAnswer(false);
          setStreak(0); // カテゴリ読み込み時はリセット（維持したいならこの行を削除）
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Load error");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [dataUrl]);

  const q = questions[idx];

  function onPick(i: number) {
    if (!q) return;
    if (showAnswer) return;

    setPicked(i);
    setShowAnswer(true);

    // ✅ 正誤で streak 更新
    if (i === q.answer) {
      setStreak((s) => s + 1);
    } else {
      setStreak(0);
    }
  }

  function next() {
    if (!questions.length) return;
    const nextIdx = (idx + 1) % questions.length;
    setIdx(nextIdx);
    setPicked(null);
    setShowAnswer(false);
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quiz</h1>
          <p className="mt-1 text-sm opacity-80">
            Category: <span className="font-semibold">{category}</span>
          </p>
        </div>

        {/* ✅ 右上に streak */}
        <div className="text-right">
          <div className="text-xs opacity-70">Streak</div>
          <div className="text-2xl font-bold tabular-nums">{streak}</div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <Link href="/" className="text-sm underline opacity-80 hover:opacity-100">
          ← Back
        </Link>

        {/* ✅ 小さくID */}
        {q?.id && (
          <div className="text-xs opacity-60">
            ID: <span className="font-mono">{q.id}</span>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-6 rounded-lg border p-4">
          <p className="text-red-500 font-semibold">Error</p>
          <p className="mt-2 text-sm opacity-80">{error}</p>
          <p className="mt-2 text-sm opacity-80">
            確認：<span className="font-mono">public{dataUrl}</span> が存在するか
          </p>
        </div>
      )}

      {!error && !q && <p className="mt-6 text-sm opacity-80">Loading...</p>}

      {!error && q && (
        <div className="mt-6 space-y-5">
          {/* 問題文 */}
          <div className="rounded-xl border p-5">
            <p className="text-xl font-semibold leading-relaxed">{q.sentence}</p>
          </div>

          {/* 選択肢（縦並び） */}
          <div className="grid gap-2">
            {q.choices.map((c, i) => {
              const isCorrect = showAnswer && i === q.answer;
              const isWrong = showAnswer && picked === i && i !== q.answer;

              return (
                <button
                  key={i}
                  onClick={() => onPick(i)}
                  className={[
                    "w-full rounded-xl border px-4 py-3 text-left text-base",
                    "transition",
                    "hover:opacity-95",
                    "disabled:opacity-80 disabled:cursor-not-allowed",
                    isCorrect ? "border-green-500" : "",
                    isWrong ? "border-red-500" : "",
                  ].join(" ")}
                  disabled={showAnswer}
                >
                  {/* A/B/C/D を小さめに */}
                  <span className="mr-2 text-xs opacity-70">
                    {String.fromCharCode(65 + i)}.
                  </span>

                  <span className="font-medium">{c}</span>

                  {/* 品詞ラベル */}
                  {q.choicePos?.[i] && (
                    <span className="ml-3 text-sm opacity-75">（{q.choicePos[i]}）</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* 解説 */}
          {showAnswer && (
            <div className="rounded-xl border p-5 space-y-2">
              <div className="text-sm">
                {picked === q.answer ? (
                  <span className="font-semibold">✅ Correct</span>
                ) : (
                  <span className="font-semibold">❌ Incorrect</span>
                )}
              </div>

              {q.explanation && (
                <p className="text-sm leading-relaxed opacity-90">
                  <span className="font-semibold">Explanation: </span>
                  {q.explanation}
                </p>
              )}

              {q.trap && (
                <p className="text-sm leading-relaxed opacity-85">
                  <span className="font-semibold">Trap: </span>
                  {q.trap}
                </p>
              )}

              <div className="pt-2">
                <button
                  onClick={next}
                  className="rounded-xl border px-4 py-2 text-sm hover:opacity-95"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
