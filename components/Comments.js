"use client";
import { useEffect, useState, useCallback } from "react";
import { listComments, addComment, removeComment, fmtDate } from "@/lib/db";

export default function Comments({ postId, currentUser, isAdmin }) {
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState("");
  const [guestName, setGuestName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const reload = useCallback(async () => {
    if (!postId) return;
    const list = await listComments(postId);
    setComments(list);
  }, [postId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    const authorName = currentUser?.displayName || currentUser?.email?.split("@")[0] || guestName.trim() || "Bạn đọc";
    const authorEmail = currentUser?.email || "";
    const authorAvatar = currentUser?.photoURL || "";
    const uid = currentUser?.uid || "guest";

    setBusy(true);
    setErr("");
    try {
      await addComment({
        postId,
        authorName,
        authorEmail,
        authorAvatar,
        content: content.trim(),
        uid,
      });
      setContent("");
      if (!currentUser) setGuestName("");
      await reload();
    } catch (x) {
      setErr(x.message || "Lỗi khi gửi bình luận.");
    }
    setBusy(false);
  };

  const handleDelete = async (commentId) => {
    if (!confirm("Bạn có chắc muốn xóa bình luận này?")) return;
    try {
      await removeComment(commentId);
      await reload();
    } catch (x) {
      alert("Lỗi khi xóa bình luận: " + x.message);
    }
  };

  return (
    <section className="glass reveal" style={{ marginTop: 36, padding: "28px 24px", borderRadius: 16 }}>
      <h3 style={{ fontSize: "1.25rem", marginBottom: 6 }}>
        💬 Bình luận ({comments.length})
      </h3>
      <p className="muted" style={{ fontSize: ".88rem", marginBottom: 20 }}>
        Chia sẻ cảm nghĩ, đặt câu hỏi hoặc đóng góp ý kiến cho bài viết
      </p>

      {err && <div className="msg err" style={{ marginBottom: 16 }}>{err}</div>}

      {/* Form gửi bình luận */}
      <form onSubmit={handleSubmit} style={{ marginBottom: 28 }}>
        {!currentUser && (
          <div className="field" style={{ maxWidth: 320, marginBottom: 12 }}>
            <label style={{ fontSize: ".82rem" }}>Tên của bạn (Tùy chọn)</label>
            <input
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Nhập tên hiển thị..."
            />
          </div>
        )}

        {currentUser && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, fontSize: ".85rem" }}>
            <span className="muted">Bình luận với tư cách:</span>
            <b>{currentUser.displayName || currentUser.email}</b>
            {isAdmin && <span className="badge" style={{ fontSize: ".7rem" }}>Admin</span>}
          </div>
        )}

        <div className="field" style={{ margin: 0 }}>
          <textarea
            required
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Viết bình luận của bạn tại đây..."
            style={{ resize: "vertical", minHeight: 80 }}
          />
        </div>

        <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end" }}>
          <button type="submit" className="btn btn-primary btn-sm" disabled={busy || !content.trim()}>
            {busy ? "Đang gửi..." : "Gửi bình luận"}
          </button>
        </div>
      </form>

      {/* Danh sách bình luận */}
      <div style={{ display: "grid", gap: 14 }}>
        {comments.map((c) => {
          const canDelete = isAdmin || (currentUser && currentUser.uid === c.uid);
          const initial = (c.authorName || "B")[0].toUpperCase();

          return (
            <div
              key={c.id}
              className="glass"
              style={{
                padding: "16px 18px",
                borderRadius: 12,
                background: "hsla(0 0% 100% / .02)",
                border: "1px solid var(--glass-border)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {c.authorAvatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.authorAvatar}
                      alt={c.authorName}
                      style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        background: "var(--grad)",
                        color: "#fff",
                        display: "grid",
                        placeItems: "center",
                        fontSize: ".85rem",
                        fontWeight: "bold",
                      }}
                    >
                      {initial}
                    </div>
                  )}
                  <div>
                    <b style={{ fontSize: ".9rem" }}>{c.authorName}</b>
                    <span className="muted" style={{ fontSize: ".76rem", marginLeft: 8 }}>
                      {fmtDate(c.createdAt)}
                    </span>
                  </div>
                </div>

                {canDelete && (
                  <button
                    type="button"
                    onClick={() => handleDelete(c.id)}
                    className="btn btn-ghost btn-sm"
                    style={{ color: "var(--danger)", padding: "2px 8px", fontSize: ".75rem" }}
                    title="Xóa bình luận"
                  >
                    Xóa
                  </button>
                )}
              </div>

              <p style={{ fontSize: ".9rem", lineHeight: 1.6, paddingLeft: 42, whiteSpace: "pre-wrap" }}>
                {c.content}
              </p>
            </div>
          );
        })}

        {comments.length === 0 && (
          <div className="muted" style={{ textAlign: "center", padding: "18px 0", fontStyle: "italic", fontSize: ".88rem" }}>
            Chưa có bình luận nào. Hãy là người đầu tiên chia sẻ cảm nghĩ!
          </div>
        )}
      </div>
    </section>
  );
}
