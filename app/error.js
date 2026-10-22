"use client";
import { useEffect } from "react";
import Link from "next/link";

export default function Error({ error, reset }) {
  useEffect(() => {
    // Ghi log lỗi để theo dõi
    console.error("Lỗi ứng dụng:", error);
  }, [error]);

  return (
    <div className="container section" style={{ minHeight: "65vh", display: "grid", placeItems: "center" }}>
      <div
        className="glass reveal"
        style={{
          maxWidth: 540,
          width: "100%",
          padding: "44px 32px",
          textAlign: "center",
          borderRadius: 24,
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
        }}
      >
        <div style={{ fontSize: "3.5rem", marginBottom: 14 }}>⚠️</div>
        <h1 style={{ fontSize: "1.6rem", marginBottom: 12 }}>
          Đã có sự cố xảy ra
        </h1>
        <p className="muted" style={{ maxWidth: 420, margin: "0 auto 24px", fontSize: ".95rem", lineHeight: 1.6 }}>
          Hệ thống gặp trục trặc khi tải dữ liệu. Bạn hãy bấm thử lại hoặc quay về trang chủ.
        </p>

        {error?.message && (
          <div
            style={{
              padding: "10px 14px",
              background: "hsla(350 85% 62% / .1)",
              border: "1px solid hsla(350 85% 62% / .3)",
              borderRadius: 12,
              fontSize: ".82rem",
              color: "hsl(350 85% 55%)",
              marginBottom: 24,
              fontFamily: "var(--font-geist-mono), monospace",
              wordBreak: "break-word",
            }}
          >
            {error.message}
          </div>
        )}

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => reset()}
          >
            🔄 Thử lại
          </button>
          <Link href="/" className="btn btn-ghost">
            🏠 Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}
