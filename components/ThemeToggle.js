"use client";
import { useEffect, useSyncExternalStore } from "react";

function subscribeTheme(callback) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getThemeSnapshot() {
  if (typeof window === "undefined") return "dark";
  const saved = localStorage.getItem("site_theme");
  if (saved) return saved;
  if (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches) {
    return "light";
  }
  return "dark";
}

export default function ThemeToggle() {
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);
  const theme = useSyncExternalStore(subscribeTheme, getThemeSnapshot, () => "dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("site_theme", next);
      window.dispatchEvent(new Event("storage"));
    } catch {}
  };

  if (!mounted) {
    return <div style={{ width: 38, height: 38 }} />;
  }

  return (
    <button
      type="button"
      className="theme-toggle-btn"
      onClick={toggle}
      title={theme === "dark" ? "Chuyển sang giao diện Sáng" : "Chuyển sang giao diện Tối"}
      aria-label="Đổi giao diện sáng/tối"
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}
