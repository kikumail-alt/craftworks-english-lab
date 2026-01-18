"use client";

import { useEffect, useState } from "react";

const THEME_KEY = "toeic_theme";
type Theme = "normal" | "dark" | "low";

export default function ThemeSwitch() {
  const [theme, setTheme] = useState<Theme>("low");

  useEffect(() => {
    const saved = (localStorage.getItem(THEME_KEY) as Theme) || "low";
    applyTheme(saved);
    setTheme(saved);
  }, []);

  function applyTheme(t: Theme) {
    document.body.classList.remove("theme-dark", "theme-low");
    if (t === "dark") document.body.classList.add("theme-dark");
    if (t === "low") document.body.classList.add("theme-low");
    localStorage.setItem(THEME_KEY, t);
  }

  const wrapStyle: React.CSSProperties = {
    position: "fixed",
    top: 12,
    right: 12,
    display: "flex",
    gap: 6,
    zIndex: 9999,
  };

  const btnStyle: React.CSSProperties = {
    padding: "8px 10px",
    fontSize: 13,
    borderRadius: 10,
    border: "1px solid #888",
    background: "#f2f2f2",
    color: "#111",
    cursor: "pointer",
  };

  const activeStyle: React.CSSProperties = {
    outline: "2px solid #4c9aff",
    outlineOffset: 2,
  };

  return (
    <div style={wrapStyle}>
      <button
        type="button"
        onClick={() => (applyTheme("normal"), setTheme("normal"))}
        style={{ ...btnStyle, ...(theme === "normal" ? activeStyle : {}) }}
      >
        ☀️ 通常
      </button>
      <button
        type="button"
        onClick={() => (applyTheme("dark"), setTheme("dark"))}
        style={{ ...btnStyle, ...(theme === "dark" ? activeStyle : {}) }}
      >
        🌙 白黒反転
      </button>
      <button
        type="button"
        onClick={() => (applyTheme("low"), setTheme("low"))}
        style={{ ...btnStyle, ...(theme === "low" ? activeStyle : {}) }}
      >
        🌘 低コントラスト
      </button>
    </div>
  );
}
