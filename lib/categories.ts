export const CATEGORIES = [
  { id: "pos",  label: "品詞" },
  { id: "verb", label: "動詞（時制・態・一致）" },
  { id: "prep", label: "前置詞" },
  { id: "conj", label: "接続詞" },
  { id: "rel",  label: "関係詞" },
  { id: "pron", label: "代名詞" },
  { id: "comp", label: "比較・数量" },
  { id: "vocab",label: "語彙・言い換え" },
] as const;

export type CategoryId = typeof CATEGORIES[number]["id"];

/**
 * どのカテゴリが、どのJSONを読むか
 * まずは pos は pos.json（= prep.json をコピーしたもの）を読む
 */
export const CATEGORY_TO_JSON: Record<CategoryId, string> = {
  pos: "/data/questions/pos.json",
  verb: "/data/questions/verb.json",
  prep: "/data/questions/prep.json",
  conj: "/data/questions/conj.json",
  rel: "/data/questions/rel.json",
  pron: "/data/questions/pron.json",
  comp: "/data/questions/comp.json",
  vocab: "/data/questions/vocab.json",
};
