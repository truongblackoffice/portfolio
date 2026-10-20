"use client";
import { useState } from "react";
import { listItems, saveItem, removeItem } from "@/lib/db";
import useAsync from "@/lib/useAsync";

export default function AdminCategories() {
  const { data: catData, reload } = useAsync(async () => {
    const [cats, posts, docs] = await Promise.all([
      listItems("categories"),
      listItems("posts"),
      listItems("documents"),
    ]);

    // Gom cả danh mục đã lưu trong collection categories và danh mục đang dùng trong posts/docs
    const map = new Map();
    cats.forEach((c) => map.set(c.name, { ...c }));

    posts.forEach((p) => {
      if (p.category && !map.has(p.category)) {
        map.set(p.category, { id: `auto-${p.category}`, name: p.category, icon: "📁", color: "#8b5cf6", desc: "" });
      }
    });
    docs.forEach((d) => {
      if (d.category && !map.has(d.category)) {
        map.set(d.category, { id: `auto-${d.category}`, name: d.category, icon: "📁", color: "#8b5cf6", desc: "" });
      }
    });

    const list = Array.from(map.values()).map((c) => ({
      ...c,
      postCount: posts.filter((p) => p.category === c.name).length,
      docCount: docs.filter((d) => d.category === c.name).length,
    }));

    return list;
  });

  const [name, setName] = useState("");
  const [icon, setIcon] = useState("🚀");
  const [color, setColor] = useState("#8b5cf6");
  const [desc, setDesc] = useState("");
  const [busy, setBusy] = useState(false);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      await saveItem("categories", {
        name: name.trim(),
        icon: icon || "📁",
        color: color || "#8b5cf6",
        desc: desc.trim(),
      });
      setName("");
      setDesc("");
      reload();
    } catch (e) {
      alert("Lỗi khi thêm danh mục: " + e.message);
    }
    setBusy(false);
  };

  return (
    <div className="glass reveal" style={{ padding: 28, borderRadius: "var(--radius)" }}>
      <h2>Quản lý danh mục nội dung</h2>
      <p className="muted" style={{ marginBottom: 24, fontSize: ".9rem" }}>
        Định hình cấu trúc chủ đề cho Bài viết và Kho tài liệu
      </p>

      {/* Form thêm mới */}
      <form onSubmit={handleAdd} className="glass" style={{ padding: 18, borderRadius: 14, marginBottom: 28 }}>
        <h3 style={{ fontSize: "1.1rem", marginBottom: 12 }}>+ Thêm danh mục mới</h3>
        <div style={{ display: "grid", gridTemplateColumns: "70px 1.5fr 80px 2fr auto", gap: 12, alignItems: "end" }}>
          <div className="field" style={{ margin: 0 }}>
            <label>Icon</label>
            <input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="🚀" style={{ textAlign: "center" }} />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label>Tên danh mục *</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ví dụ: Trí tuệ nhân tạo (AI)" />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label>Màu sắc</label>
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} style={{ height: 44, padding: 3 }} />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label>Mô tả ngắn</label>
            <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Mô tả chủ đề này..." />
          </div>
          <button type="submit" className="btn btn-primary btn-sm" disabled={busy} style={{ height: 44 }}>
            Tạo mới
          </button>
        </div>
      </form>

      {/* Danh sách danh mục */}
      <div style={{ display: "grid", gap: 12 }}>
        {(catData || []).map((c) => (
          <div className="row glass" key={c.id || c.name} style={{ margin: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ fontSize: "1.6rem", width: 40, height: 40, display: "grid", placeItems: "center", background: `${c.color || "var(--primary)"}22`, borderRadius: 10, border: `1px solid ${c.color || "var(--primary)"}66` }}>
                {c.icon || "📁"}
              </span>
              <div>
                <b style={{ fontSize: "1.05rem", color: c.color }}>{c.name}</b>
                {c.desc && <p className="muted" style={{ fontSize: ".82rem", margin: "2px 0" }}>{c.desc}</p>}
                <div className="muted" style={{ fontSize: ".78rem" }}>
                  {c.postCount} bài viết · {c.docCount} tài liệu
                </div>
              </div>
            </div>
            <div className="actions">
              {c.id && !c.id.startsWith("auto-") && (
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={async () => {
                    if (confirm(`Xóa danh mục "${c.name}"?`)) {
                      await removeItem("categories", c.id);
                      reload();
                    }
                  }}
                >
                  Xóa
                </button>
              )}
            </div>
          </div>
        ))}
        {(!catData || catData.length === 0) && (
          <div className="empty">Chưa có danh mục nào. Hãy tạo danh mục đầu tiên ở trên!</div>
        )}
      </div>
    </div>
  );
}
