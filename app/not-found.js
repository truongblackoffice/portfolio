import Link from "next/link";

export const metadata = {
  title: "404 - Không tìm thấy trang",
  description: "Trang bạn đang tìm kiếm không tồn tại hoặc đã bị chuyển đi.",
};

export default function NotFound() {
  return (
    <div className="container section" style={{ minHeight: "65vh", display: "grid", placeItems: "center" }}>
      <div
        className="glass reveal"
        style={{
          maxWidth: 580,
          width: "100%",
          padding: "48px 36px",
          textAlign: "center",
          borderRadius: 24,
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
        }}
      >
        <div
          style={{
            fontSize: "clamp(4.5rem, 12vw, 7rem)",
            fontWeight: 900,
            lineHeight: 1,
            marginBottom: 12,
            fontFamily: "var(--font-outfit), sans-serif",
          }}
          className="gradient-text"
        >
          404
        </div>
        <h1 style={{ fontSize: "1.6rem", marginBottom: 12 }}>
          Không tìm thấy trang yêu cầu
        </h1>
        <p className="muted" style={{ maxWidth: 420, margin: "0 auto 28px", fontSize: ".98rem", lineHeight: 1.6 }}>
          Đường dẫn bạn vừa truy cập có thể đã bị thay đổi, di chuyển hoặc không còn tồn tại trên hệ thống.
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 24 }}>
          <Link href="/" className="btn btn-primary" id="btn-home">
            🏠 Về trang chủ
          </Link>
          <Link href="/blog" className="btn btn-ghost" id="btn-blog">
            ✍️ Đọc bài viết
          </Link>
          <Link href="/quiz" className="btn btn-ghost" id="btn-quiz">
            🧠 Ôn tập trắc nghiệm
          </Link>
        </div>

        <div style={{ paddingTop: 18, borderTop: "1px solid var(--glass-border)", fontSize: ".84rem" }} className="muted">
          Cần hỗ trợ? Hãy ghé thăm trang <Link href="/contact" style={{ color: "var(--accent)", textDecoration: "underline" }}>Liên hệ</Link> để gửi tin nhắn.
        </div>
      </div>
    </div>
  );
}
