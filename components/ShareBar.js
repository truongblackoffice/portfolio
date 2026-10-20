"use client";
import { useState } from "react";

export default function ShareBar({ title, url }) {
  const [copied, setCopied] = useState(false);

  const getUrl = () => {
    if (url) return url;
    if (typeof window !== "undefined") return window.location.href;
    return "https://manhtruong.io.vn";
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {}
  };

  const currentUrl = encodeURIComponent(getUrl());
  const currentTitle = encodeURIComponent(title || "Bài viết từ Nguyễn Mạnh Trường");

  return (
    <>
      <div className="share-bar glass" style={{ marginTop: 28, marginBottom: 28 }}>
        <span className="muted" style={{ fontSize: ".88rem", fontWeight: 600 }}>
          📢 Chia sẻ bài viết:
        </span>

        {/* Facebook */}
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${currentUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className="share-btn"
          title="Chia sẻ lên Facebook"
        >
          <span style={{ color: "#1877f2", fontWeight: "bold" }}>f</span> Facebook
        </a>

        {/* X / Twitter */}
        <a
          href={`https://twitter.com/intent/tweet?url=${currentUrl}&text=${currentTitle}`}
          target="_blank"
          rel="noopener noreferrer"
          className="share-btn"
          title="Chia sẻ lên X (Twitter)"
        >
          <span style={{ fontWeight: "bold" }}>𝕏</span> Twitter
        </a>

        {/* Zalo */}
        <a
          href={`https://zalo.me/share?url=${currentUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className="share-btn"
          title="Chia sẻ qua Zalo"
        >
          <span style={{ color: "#0068ff", fontWeight: "bold" }}>Z</span> Zalo
        </a>

        {/* Copy Link */}
        <button
          type="button"
          onClick={handleCopy}
          className="share-btn"
          style={{ marginLeft: "auto" }}
          title="Sao chép liên kết"
        >
          {copied ? "✓ Đã sao chép!" : "🔗 Sao chép link"}
        </button>
      </div>

      {copied && (
        <div className="toast">
          ✓ Đã sao chép liên kết bài viết vào bộ nhớ tạm!
        </div>
      )}
    </>
  );
}
