"use client";
import { useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { saveItem, uploadFile, slugify, fmtDate } from "@/lib/db";

const csv = (s) => s.split(",").map((x) => x.trim()).filter(Boolean);

export default function PostEditor({ item, onDone }) {
  const [f, setF] = useState({
    ...item,
    tagsText: (item.tags || []).join(", "),
    cover: item.cover || "",
    slug: item.slug || (item.title ? slugify(item.title) : ""),
    author: item.author || "",
    membersOnly: Boolean(item.membersOnly),
    published: item.published !== false,
  });

  const [activeTab, setActiveTab] = useState("split"); // "edit" | "preview" | "split"
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const textareaRef = useRef(null);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  // Tự động gợi ý slug nếu chưa sửa
  const handleTitleChange = (e) => {
    const title = e.target.value;
    const shouldUpdateSlug = !f.slug || f.slug === slugify(f.title || "");
    setF({
      ...f,
      title,
      slug: shouldUpdateSlug ? slugify(title) : f.slug,
    });
  };

  // Tính số từ & thời gian đọc ước tính
  const wordsCount = (f.content || "").trim().split(/\s+/).filter(Boolean).length;
  const readTimeMinutes = Math.max(1, Math.ceil(wordsCount / 200));

  // Chèn cú pháp markdown vào textarea tại vị trí con trỏ
  const insertSyntax = (before, after = "", defaultText = "văn bản") => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selText = el.value.substring(start, end) || defaultText;
    const replacement = `${before}${selText}${after}`;

    const newContent = el.value.substring(0, start) + replacement + el.value.substring(end);
    setF({ ...f, content: newContent });

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + before.length, start + before.length + selText.length);
    }, 50);
  };

  // Xử lý upload ảnh bìa hoặc chèn ảnh vào bài viết
  const handleImageUpload = async (e, target = "cover") => {
    const file = e.target.files[0];
    if (!file) return;
    setBusy(true);
    setErr("");
    try {
      const url = await uploadFile(file);
      if (target === "cover") {
        setF((prev) => ({ ...prev, cover: url }));
      } else {
        insertSyntax(`\n![${file.name}](${url})\n`, "", "");
      }
    } catch (x) {
      setErr(x.message + " (Bạn có thể dán đường link ảnh trực tiếp)");
    }
    setBusy(false);
  };

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const { tagsText, ...rest } = f;
      await saveItem("posts", {
        ...rest,
        slug: rest.slug.trim() || slugify(rest.title),
        tags: csv(tagsText),
        membersOnly: Boolean(rest.membersOnly),
        readTime: `${readTimeMinutes} phút đọc`,
      });
      onDone();
    } catch (x) {
      setErr(x.message || "Lỗi khi lưu bài viết");
    }
    setBusy(false);
  }

  return (
    <form className="glass reveal" style={{ padding: 28, borderRadius: "var(--radius)", marginBottom: 30 }} onSubmit={submit} id="post-form">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2>{item.id ? "Chỉnh sửa bài viết" : "Tạo bài viết mới"}</h2>
          <span className="muted" style={{ fontSize: ".85rem" }}>
            {wordsCount} từ · Khoảng {readTimeMinutes} phút đọc
          </span>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-ghost btn-sm" type="button" onClick={onDone}>Hủy</button>
          <button className="btn btn-primary btn-sm" type="submit" disabled={busy} id="save-post">
            {busy ? "Đang lưu..." : "Lưu bài viết"}
          </button>
        </div>
      </div>

      {err && <div className="msg err">{err}</div>}

      {/* Thông tin cơ bản */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
        <div className="field">
          <label>Tiêu đề bài viết *</label>
          <input required value={f.title} onChange={handleTitleChange} placeholder="Nhập tiêu đề hấp dẫn..." />
        </div>
        <div className="field">
          <label>Đường dẫn tĩnh (Slug URL)</label>
          <input value={f.slug} onChange={set("slug")} placeholder="duong-dan-bai-viet" />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        <div className="field">
          <label>Danh mục</label>
          <input value={f.category} onChange={set("category")} placeholder="Ví dụ: Lập trình, AI, Kỹ năng" />
        </div>
        <div className="field">
          <label>Thẻ (cách nhau bằng dấu phẩy)</label>
          <input value={f.tagsText} onChange={set("tagsText")} placeholder="react, nextjs, web" />
        </div>
        <div className="field">
          <label>Tác giả (tùy chọn)</label>
          <input value={f.author} onChange={set("author")} placeholder="Tên tác giả" />
        </div>
      </div>

      {/* Ảnh bìa */}
      <div className="field">
        <label>Ảnh bìa (URL hoặc tải lên)</label>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <input style={{ flex: 1, minWidth: 240 }} value={f.cover} onChange={set("cover")} placeholder="https://images.unsplash.com/... hoặc link ảnh" />
          <label className="btn btn-ghost btn-sm" style={{ cursor: "pointer", margin: 0 }}>
            Tải ảnh bìa
            <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handleImageUpload(e, "cover")} />
          </label>
          {f.cover && (
            <button type="button" className="btn btn-danger btn-sm" onClick={() => setF({ ...f, cover: "" })}>
              Xóa ảnh
            </button>
          )}
        </div>
        {f.cover && (
          <div style={{ marginTop: 10, maxHeight: 180, overflow: "hidden", borderRadius: 12, border: "1px solid var(--glass-border)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={f.cover} alt="Xem trước bìa" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          </div>
        )}
      </div>

      <div className="field">
        <label>Mô tả ngắn (Excerpt - hiển thị ở trang danh sách bài)</label>
        <textarea rows={2} style={{ minHeight: 70 }} value={f.excerpt} onChange={set("excerpt")} placeholder="Tóm tắt nội dung 1-2 câu ngắn gọn..." />
      </div>

      {/* Trạng thái bài viết */}
      <div style={{ display: "flex", gap: 24, margin: "14px 0", flexWrap: "wrap" }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <input type="checkbox" style={{ width: "auto" }} checked={f.published} onChange={(e) => setF({ ...f, published: e.target.checked })} />
          <span>Xuất bản công khai</span>
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <input type="checkbox" style={{ width: "auto" }} checked={f.membersOnly} onChange={(e) => setF({ ...f, membersOnly: e.target.checked })} />
          <span>🔒 Chỉ dành cho thành viên đã đăng nhập</span>
        </label>
      </div>

      {/* THANH ĐIỀU HƯỚNG SOẠN THẢO VÀ XEM TRƯỚC */}
      <div style={{ marginTop: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 10 }}>
          <label style={{ fontWeight: 600 }}>Nội dung bài viết (Markdown)</label>
          <div className="admin-tabs" style={{ margin: 0 }}>
            <a href="#" className={activeTab === "edit" ? "active" : ""} onClick={(e) => { e.preventDefault(); setActiveTab("edit"); }}>Soạn thảo</a>
            <a href="#" className={activeTab === "split" ? "active" : ""} onClick={(e) => { e.preventDefault(); setActiveTab("split"); }}>Song song (Split)</a>
            <a href="#" className={activeTab === "preview" ? "active" : ""} onClick={(e) => { e.preventDefault(); setActiveTab("preview"); }}>Xem trước (Preview)</a>
          </div>
        </div>

        {/* Thanh công cụ định dạng nhanh */}
        {(activeTab === "edit" || activeTab === "split") && (
          <div className="toolbar" style={{ gap: 6, marginBottom: 10, padding: 8, background: "hsla(0 0% 100% / .04)", borderRadius: 12, border: "1px solid var(--glass-border)" }}>
            <button type="button" className="btn btn-ghost btn-sm" title="Tiêu đề 2" onClick={() => insertSyntax("\n## ", "\n", "Tiêu đề mục")}><b>H2</b></button>
            <button type="button" className="btn btn-ghost btn-sm" title="Tiêu đề 3" onClick={() => insertSyntax("\n### ", "\n", "Tiêu đề nhỏ")}><b>H3</b></button>
            <button type="button" className="btn btn-ghost btn-sm" title="In đậm" onClick={() => insertSyntax("**", "**", "in đậm")}><b>B</b></button>
            <button type="button" className="btn btn-ghost btn-sm" title="In nghiêng" onClick={() => insertSyntax("*", "*", "in nghiêng")}><i>I</i></button>
            <button type="button" className="btn btn-ghost btn-sm" title="Trích dẫn" onClick={() => insertSyntax("\n> ", "\n", "Trích dẫn hay")}>❝ Trích dẫn</button>
            <button type="button" className="btn btn-ghost btn-sm" title="Code inline" onClick={() => insertSyntax("`", "`", "code")}>Code</button>
            <button type="button" className="btn btn-ghost btn-sm" title="Khối code" onClick={() => insertSyntax("\n```javascript\n", "\n```\n", "// Viết code ở đây")}>Khối code</button>
            <button type="button" className="btn btn-ghost btn-sm" title="Danh sách" onClick={() => insertSyntax("\n- ", "\n- Mục 2", "Mục 1")}>• Danh sách</button>
            <button type="button" className="btn btn-ghost btn-sm" title="Chèn liên kết" onClick={() => insertSyntax("[", "](https://example.com)", "Tên hiển thị")}>🔗 Link</button>
            <button type="button" className="btn btn-ghost btn-sm" title="Chèn bảng" onClick={() => insertSyntax("\n| Cột 1 | Cột 2 |\n| --- | --- |\n| Dữ liệu 1 | Dữ liệu 2 |\n", "", "")}>Bảng</button>
            <label className="btn btn-ghost btn-sm" style={{ cursor: "pointer", margin: 0 }} title="Tải ảnh chèn vào bài">
              🖼️ Chèn ảnh
              <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handleImageUpload(e, "inline")} />
            </label>
          </div>
        )}

        {/* Khung Soạn thảo & Xem trước */}
        <div style={{
          display: "grid",
          gridTemplateColumns: activeTab === "split" ? "1fr 1fr" : "1fr",
          gap: 18,
          alignItems: "stretch"
        }}>
          {/* Ô nhập Textarea */}
          {(activeTab === "edit" || activeTab === "split") && (
            <div>
              <textarea
                ref={textareaRef}
                style={{
                  minHeight: 460,
                  height: "100%",
                  fontFamily: "var(--font-geist-mono), monospace",
                  fontSize: ".92rem",
                  lineHeight: 1.6,
                }}
                required
                value={f.content}
                onChange={set("content")}
                placeholder="Viết nội dung bài viết bằng định dạng Markdown tại đây..."
              />
            </div>
          )}

          {/* Ô Xem trước trực quan (Preview) */}
          {(activeTab === "preview" || activeTab === "split") && (
            <div className="glass" style={{
              minHeight: 460,
              padding: 24,
              overflowY: "auto",
              maxHeight: 600,
              background: "hsla(240 30% 8% / .6)",
              borderRadius: 14,
              border: "1px solid var(--glass-border)"
            }}>
              {/* Header mô phỏng bài đọc */}
              <div style={{ borderBottom: "1px solid var(--glass-border)", paddingBottom: 16, marginBottom: 20 }}>
                {f.cover && (
                  <div style={{ height: 160, overflow: "hidden", borderRadius: 10, marginBottom: 14 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={f.cover} alt="Cover" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                )}
                <div className="meta" style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8, fontSize: ".8rem", color: "var(--accent)" }}>
                  {f.membersOnly && <span className="badge draft">🔒 Chỉ thành viên</span>}
                  <span>{f.category || "Chưa phân loại"}</span>
                  <span>· {fmtDate(f.createdAt || undefined)}</span>
                  <span>· {readTimeMinutes} phút đọc</span>
                </div>
                <h1 style={{ fontSize: "1.7rem", marginTop: 4 }}>{f.title || "Tiêu đề bài viết"}</h1>
                {f.excerpt && <p className="muted" style={{ fontStyle: "italic", marginTop: 6 }}>{f.excerpt}</p>}
                {f.author && <div className="muted" style={{ fontSize: ".82rem", marginTop: 4 }}>Tác giả: <b>{f.author}</b></div>}
              </div>

              {/* Nội dung markdown */}
              <div className="prose">
                {f.content ? (
                  <ReactMarkdown>{f.content}</ReactMarkdown>
                ) : (
                  <span className="muted">Nội dung xem trước sẽ hiển thị ở đây khi bạn bắt đầu viết...</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? "Đang lưu..." : "Lưu bài viết"}
        </button>
        <button className="btn btn-ghost" type="button" onClick={onDone}>Hủy</button>
      </div>
    </form>
  );
}
