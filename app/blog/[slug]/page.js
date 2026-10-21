"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { getItem, fmtDate, watchAuth, incrementPostViews, roleOf } from "@/lib/db";
import useAsync from "@/lib/useAsync";
import ShareBar from "@/components/ShareBar";
import Comments from "@/components/Comments";
import ScrollToTop from "@/components/ScrollToTop";

export default function PostDetail() {
  const { slug } = useParams();
  const [currentUser, setCurrentUser] = useState(undefined);

  useEffect(() => watchAuth(setCurrentUser), []);

  const { data: post, loading } = useAsync(
    () => getItem("posts", slug),
    [slug],
    slug ? `post_${slug}` : null
  );

  // Tăng lượt xem 1 lần duy nhất trong mỗi phiên đọc (chống spam F5)
  useEffect(() => {
    if (!post?.id) return;
    const sessionKey = "viewed_post_" + post.id;
    try {
      if (!sessionStorage.getItem(sessionKey)) {
        sessionStorage.setItem(sessionKey, "1");
        incrementPostViews(post.id);
      }
    } catch {}
  }, [post?.id]);

  if (loading && !post) return <div className="empty">Đang tải bài viết...</div>;
  if (!loading && !post) {
    return (
      <div className="container section">
        <div className="empty">
          <h2>Không tìm thấy bài viết</h2>
          <p className="muted" style={{ margin: "12px 0 20px" }}>Bài viết có thể đã bị xóa hoặc không tồn tại.</p>
          <Link href="/blog" className="btn btn-primary btn-sm">← Quay lại danh sách bài viết</Link>
        </div>
      </div>
    );
  }

  const isAdmin = roleOf(currentUser) === "admin";
  // Nếu bài chỉ dành cho thành viên mà khách chưa đăng nhập
  const isLocked = Boolean(post.membersOnly && !currentUser);

  return (
    <div className="container section">
      <article className="article glass reveal" style={{ padding: "36px 32px" }}>
        <Link href="/blog" className="muted" style={{ fontSize: ".9rem" }}>← Tất cả bài viết</Link>

        {/* Ảnh bìa bài viết nếu có */}
        {post.cover && (
          <div style={{ height: "clamp(220px, 35vw, 380px)", width: "100%", overflow: "hidden", borderRadius: 16, marginTop: 18, border: "1px solid var(--glass-border)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.cover} alt={post.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        )}

        <h1 style={{ marginTop: post.cover ? 24 : 16, fontSize: "clamp(2rem, 4vw, 2.7rem)" }}>{post.title}</h1>

        <div className="meta muted" style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center", margin: "14px 0 24px", fontSize: ".88rem" }}>
          {post.membersOnly && <span className="badge draft">🔒 Dành cho thành viên</span>}
          <span>{post.category}</span>
          {post.author && <span>· Tác giả: <b>{post.author}</b></span>}
          {post.readTime && <span>· {post.readTime}</span>}
          <span>· 👁️ {(post.views || 0) + 1} lượt xem</span>
          <span>· {fmtDate(post.createdAt)}</span>
        </div>

        {post.excerpt && (
          <p className="muted" style={{ fontSize: "1.1rem", fontStyle: "italic", borderLeft: "3px solid var(--accent)", paddingLeft: 14, marginBottom: 26 }}>
            {post.excerpt}
          </p>
        )}

        {isLocked ? (
          <div className="glass" style={{ padding: 32, textAlign: "center", borderRadius: 16, margin: "24px 0", background: "hsla(240 30% 8% / .8)" }}>
            <div style={{ fontSize: "2.4rem", marginBottom: 12 }}>🔒</div>
            <h3 style={{ marginBottom: 10 }}>Bài viết dành riêng cho thành viên</h3>
            <p className="muted" style={{ maxWidth: 440, margin: "0 auto 20px" }}>
              Bạn cần đăng nhập tài khoản để đọc toàn bộ nội dung của bài chia sẻ này.
            </p>
            <Link href={`/login?from=${encodeURIComponent(`/blog/${slug}`)}`} className="btn btn-primary">
              Đăng nhập hoặc Đăng ký
            </Link>
          </div>
        ) : (
          <div className="prose">
            <ReactMarkdown>{post.content}</ReactMarkdown>
          </div>
        )}

        {/* Thanh thẻ Tags */}
        <div className="chips" style={{ marginTop: 32, paddingTop: 20, borderTop: "1px solid var(--glass-border)" }}>
          {(post.tags || []).map((t) => <span className="chip" key={t}>#{t}</span>)}
        </div>

        {/* Thanh chia sẻ mạng xã hội */}
        <ShareBar title={post.title} />

        {/* Khu vực bình luận tương tác */}
        <Comments postId={post.id} currentUser={currentUser} isAdmin={isAdmin} />
      </article>

      {/* Nút cuộn mượt lên đầu trang */}
      <ScrollToTop />
    </div>
  );
}
