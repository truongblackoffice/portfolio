"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getProfile } from "./db";

export const defaultSite = {
  siteName: "Nguyễn Mạnh Trường",
  tagline: "Hồ sơ cá nhân & Kho kiến thức",
  logoText: "<ManhTruong/>",
  logoImage: "",
  favicon: "",
  primary: "#8b5cf6",
  accent: "#22d3ee",
  heroBadge: "👋 Chào mừng bạn ghé thăm",
  footerText: "Xây dựng với Next.js & Firebase · Chia sẻ để cùng tiến bộ",
  banner: {
    enabled: false,
    text: "",
    link: "",
    linkText: "Xem ngay →",
  },
};

const Ctx = createContext({ site: defaultSite, refresh: () => {} });
export const useSite = () => useContext(Ctx);

function apply(site) {
  if (typeof document === "undefined") return;
  const root = document.documentElement.style;
  if (site.primary) root.setProperty("--primary", site.primary);
  if (site.accent) root.setProperty("--accent", site.accent);
  if (site.siteName) document.title = site.siteName;
  let meta = document.querySelector('meta[name="description"]');
  if (meta && site.tagline) meta.setAttribute("content", site.tagline);
  if (site.favicon) {
    let link = document.querySelector('link[rel~="icon"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = site.favicon;
  }
}

export function SiteProvider({ children }) {
  const [site, setSite] = useState(defaultSite);

  // Khởi tạo ngay từ cache localStorage để F5 không bị nháy
  useEffect(() => {
    try {
      const cached = localStorage.getItem("site_config");
      if (cached) {
        const parsed = JSON.parse(cached);
        setSite(parsed);
        apply(parsed);
      }
    } catch {}
  }, []);

  const refresh = useCallback(async () => {
    try {
      const p = await getProfile();
      const merged = { ...defaultSite, ...(p?.site || {}) };
      Object.keys(merged).forEach((k) => {
        if (merged[k] === undefined || merged[k] === null) merged[k] = defaultSite[k];
      });
      merged.logoImage = p?.site?.logoImage || "";
      merged.favicon = p?.site?.favicon || "";
      if (!merged.logoText) merged.logoText = "<ManhTruong/>";

      setSite(merged);
      apply(merged);

      try {
        localStorage.setItem("site_config", JSON.stringify(merged));
      } catch {}
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return <Ctx.Provider value={{ site, refresh }}>{children}</Ctx.Provider>;
}
