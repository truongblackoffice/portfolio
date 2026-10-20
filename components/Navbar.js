"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { watchAuth, logout, canEdit } from "@/lib/db";
import { useSite } from "@/lib/SiteContext";

import ThemeToggle from "./ThemeToggle";

const links = [
  ["/", "Trang chủ"], ["/about", "Giới thiệu"], ["/blog", "Bài viết"],
  ["/documents", "Tài liệu"], ["/contact", "Liên hệ"],
];
const adminLink = ["/admin", "Quản trị"];

export default function Navbar() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const { site } = useSite();
  const [user, setUser] = useState(null);
  const isAdmin = canEdit(user);
  useEffect(() => watchAuth(setUser), []);
  const active = (h) => (h === "/" ? path === "/" : path.startsWith(h));
  return (
    <>
      {site.banner?.enabled && site.banner?.text && (
        <div
          id="announcement-banner"
          style={{
            background: "linear-gradient(90deg, var(--primary), var(--accent))",
            color: "#fff",
            textAlign: "center",
            padding: "8px 16px",
            fontSize: ".85rem",
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            position: "relative",
            zIndex: 60,
          }}
        >
          <span>📢 {site.banner.text}</span>
          {site.banner.link && (
            <a
              href={site.banner.link}
              style={{
                color: "#fff",
                textDecoration: "underline",
                fontWeight: 600,
              }}
            >
              {site.banner.linkText || "Xem ngay →"}
            </a>
          )}
        </div>
      )}
      <header className="nav glass" id="site-nav">
        <Link href="/" className="logo" id="site-logo" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {site.logoImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={site.logoImage} alt={site.siteName} style={{ height: 34, borderRadius: 8 }} />
          )}
          <span className="gradient-text">{site.logoText}</span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto", marginRight: 8 }}>
          <ThemeToggle />
          <button id="menu-toggle" className="menu-btn" aria-label="Mở menu" onClick={() => setOpen(!open)}>☰</button>
        </div>
        <nav className={`nav-links ${open ? "open" : ""}`} onClick={() => setOpen(false)}>
          {(isAdmin ? [...links, adminLink] : links).map(([h, t]) => (
            <Link key={h} href={h} className={active(h) ? "active" : ""}>{t}</Link>
          ))}
          {user ? (
            <>
              <span className="muted" id="user-name" style={{ padding: "0 8px", fontSize: ".85rem" }}>{user.displayName || user.email}</span>
              <button className="btn btn-ghost btn-sm" id="nav-logout" onClick={logout}>Đăng xuất</button>
            </>
          ) : (
            <Link href="/login" id="nav-login" className="btn btn-primary btn-sm" style={{ color: "#fff" }}>Đăng nhập</Link>
          )}
        </nav>
      </header>
    </>
  );
}
