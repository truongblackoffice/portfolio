"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getProfile } from "./db";

export const defaultSecurity = {
  disableRegistration: false,
  registrationCloseMessage: "Hệ thống hiện đang tạm đóng chức năng đăng ký tài khoản mới. Vui lòng liên hệ Quản trị viên để được hỗ trợ.",
  blockConsole: true,
  blockDevTools: true,
  blockViewSource: true,
  blockContextMenu: true,
  blockCopyText: false,
  blockSelectText: false,
  antiDebugger: false,
  adminBypass: true,
  notifyOnViolation: true,
};

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
  defaultMaxExamPerHour: 5,
  banner: {
    enabled: false,
    text: "",
    link: "",
    linkText: "Xem ngay →",
  },
  security: defaultSecurity,
};

function mergeSite(rawSite) {
  const merged = { ...defaultSite, ...(rawSite || {}) };
  Object.keys(merged).forEach((k) => {
    if (merged[k] === undefined || merged[k] === null) merged[k] = defaultSite[k];
  });
  merged.security = {
    ...defaultSecurity,
    ...(rawSite?.security || {}),
  };
  merged.banner = {
    ...defaultSite.banner,
    ...(rawSite?.banner || {}),
  };
  merged.logoImage = rawSite?.logoImage || "";
  merged.favicon = rawSite?.favicon || "";
  if (!merged.logoText) merged.logoText = "<ManhTruong/>";
  return merged;
}

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
  const [site, setSite] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("site_config");
        if (cached) return mergeSite(JSON.parse(cached));
      } catch {}
    }
    return defaultSite;
  });

  const refresh = useCallback(async () => {
    try {
      const p = await getProfile();
      const merged = mergeSite(p?.site);

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
    apply(site);
  }, [site]);

  useEffect(() => {
    let ignore = false;
    getProfile()
      .then((p) => {
        if (ignore) return;
        const merged = mergeSite(p?.site);

        setSite(merged);
        try {
          localStorage.setItem("site_config", JSON.stringify(merged));
        } catch {}
      })
      .catch(console.error);

    return () => {
      ignore = true;
    };
  }, []);

  return <Ctx.Provider value={{ site, refresh }}>{children}</Ctx.Provider>;
}
