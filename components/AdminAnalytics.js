"use client";
import Link from "next/link";
import { listItems, fmtDate } from "@/lib/db";
import useAsync from "@/lib/useAsync";

export default function AdminAnalytics({ admin }) {
  const { data, loading } = useAsync(async () => {
    const [posts, docs, users, msgs] = await Promise.all([
      listItems("posts"),
      listItems("documents"),
      admin ? listItems("users") : Promise.resolve([]),
      admin ? listItems("messages") : Promise.resolve([]),
    ]);

    // Thống kê bài viết
    const publishedPosts = posts.filter((p) => p.published).length;
    const draftPosts = posts.length - publishedPosts;
    const membersOnlyPosts = posts.filter((p) => p.membersOnly).length;
    const totalWords = posts.reduce((acc, p) => acc + (p.content || "").trim().split(/\s+/).filter(Boolean).length, 0);

    // Phân bố danh mục bài viết
    const catMap = {};
    posts.forEach((p) => {
      const cat = p.category || "Chưa phân loại";
      catMap[cat] = (catMap[cat] || 0) + 1;
    });

    // Phân bố loại tài liệu
    const docTypeMap = {};
    docs.forEach((d) => {
      const t = d.fileType || "Khác";
      docTypeMap[t] = (docTypeMap[t] || 0) + 1;
    });

    return {
      posts,
      docs,
      users,
      msgs,
      publishedPosts,
      draftPosts,
      membersOnlyPosts,
      totalWords,
      catMap,
      docTypeMap,
    };
  });

  if (loading || !data) return <div className="empty">Đang tổng hợp dữ liệu phân tích...</div>;

  const {
    posts, docs, users, msgs,
    publishedPosts, draftPosts, membersOnlyPosts, totalWords,
    catMap, docTypeMap
  } = data;

  return (
    <div className="reveal" style={{ display: "grid", gap: 24 }}>
      {/* 4 Thẻ KPI chính */}
      <div className="stats" style={{ margin: 0 }}>
        <div className="stat glass">
          <b className="gradient-text">{posts.length}</b>
          <span className="muted">Bài viết ({publishedPosts} xuất bản · {draftPosts} nháp)</span>
        </div>
        <div className="stat glass">
          <b className="gradient-text">{docs.length}</b>
          <span className="muted">Tài liệu chia sẻ</span>
        </div>
        {admin && (
          <div className="stat glass">
            <b className="gradient-text">{users.length}</b>
            <span className="muted">Thành viên đăng ký</span>
          </div>
        )}
        {admin && (
          <div className="stat glass">
            <b className="gradient-text">{msgs.length}</b>
            <span className="muted">Tin nhắn liên hệ</span>
          </div>
        )}
      </div>

      {/* Thông tin chiều sâu: Số từ & Nội dung */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
        {/* Phân bố danh mục */}
        <div className="glass" style={{ padding: 24, borderRadius: 14 }}>
          <h3 style={{ fontSize: "1.1rem", marginBottom: 16 }}>📊 Phân bố bài viết theo danh mục</h3>
          {Object.keys(catMap).length === 0 ? (
            <div className="muted" style={{ fontStyle: "italic" }}>Chưa có bài viết nào.</div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {Object.entries(catMap).map(([cat, count]) => {
                const percent = Math.round((count / (posts.length || 1)) * 100);
                return (
                  <div key={cat}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".88rem", marginBottom: 4 }}>
                      <span><b>{cat}</b></span>
                      <span className="muted">{count} bài ({percent}%)</span>
                    </div>
                    <div style={{ height: 8, background: "hsla(0 0% 100% / .1)", borderRadius: 999, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${percent}%`, background: "var(--grad)", borderRadius: 999 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Thống kê bài viết & dung lượng */}
        <div className="glass" style={{ padding: 24, borderRadius: 14 }}>
          <h3 style={{ fontSize: "1.1rem", marginBottom: 16 }}>✍️ Thông số nội dung &amp; Độc giả</h3>
          <ul style={{ listStyle: "none", display: "grid", gap: 12, fontSize: ".92rem" }}>
            <li style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--glass-border)", paddingBottom: 8 }}>
              <span className="muted">Tổng số từ đã viết:</span>
              <b>{totalWords.toLocaleString()} từ</b>
            </li>
            <li style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--glass-border)", paddingBottom: 8 }}>
              <span className="muted">Thời gian đọc tích lũy:</span>
              <b>~{Math.ceil(totalWords / 200)} phút</b>
            </li>
            <li style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--glass-border)", paddingBottom: 8 }}>
              <span className="muted">Bài viết độc quyền thành viên:</span>
              <b>{membersOnlyPosts} bài</b>
            </li>
            <li style={{ display: "flex", justifyContent: "space-between" }}>
              <span className="muted">Định dạng tài liệu chính:</span>
              <b>{Object.keys(docTypeMap).slice(0, 3).join(", ") || "Chưa có"}</b>
            </li>
          </ul>
        </div>
      </div>

      {/* Bài viết mới cập nhật & Tin nhắn gần đây */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
        {/* Bài viết gần đây */}
        <div className="glass" style={{ padding: 22, borderRadius: 14 }}>
          <h3 style={{ fontSize: "1.05rem", marginBottom: 14 }}>📝 Bài viết mới nhất</h3>
          <div style={{ display: "grid", gap: 10 }}>
            {posts.slice(0, 4).map((p) => (
              <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: ".88rem", borderBottom: "1px solid var(--glass-border)", paddingBottom: 8 }}>
                <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 220 }}>
                  <b>{p.title}</b>
                  <div className="muted" style={{ fontSize: ".75rem" }}>{p.category} · {fmtDate(p.createdAt)}</div>
                </div>
                <a href={`/blog/${p.slug || p.id}`} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ fontSize: ".75rem", padding: "3px 8px" }}>
                  Xem ↗
                </a>
              </div>
            ))}
            {posts.length === 0 && <span className="muted">Chưa có bài viết nào.</span>}
          </div>
        </div>

        {/* Tin nhắn liên hệ gần đây (nếu là Admin) */}
        {admin && (
          <div className="glass" style={{ padding: 22, borderRadius: 14 }}>
            <h3 style={{ fontSize: "1.05rem", marginBottom: 14 }}>📩 Tin nhắn gần đây</h3>
            <div style={{ display: "grid", gap: 10 }}>
              {msgs.slice(0, 3).map((m) => (
                <div key={m.id} style={{ borderBottom: "1px solid var(--glass-border)", paddingBottom: 8, fontSize: ".88rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <b>{m.name}</b>
                    <span className="muted" style={{ fontSize: ".75rem" }}>{fmtDate(m.createdAt)}</span>
                  </div>
                  <div className="muted" style={{ fontSize: ".8rem", margin: "2px 0 4px" }}>{m.email}</div>
                  <p style={{ fontSize: ".85rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.message}</p>
                </div>
              ))}
              {msgs.length === 0 && <span className="muted">Chưa có tin nhắn liên hệ nào.</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
