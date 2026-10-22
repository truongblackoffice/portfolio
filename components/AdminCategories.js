"use client";
import { useState } from "react";
import { listItems, saveItem, removeItem, uploadFile } from "@/lib/db";
import useAsync from "@/lib/useAsync";
import { toast } from "@/lib/toast";

import { IT_ICON_GROUPS, PRESET_COLORS, renderIcon, isImageIcon } from "@/lib/presets";

export default function AdminCategories() {
  const { data: catData, reload } = useAsync(async () => {
    const [cats, posts, docs] = await Promise.all([
      listItems("categories"),
      listItems("posts"),
      listItems("documents"),
    ]);

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
  const [editingCategory, setEditingCategory] = useState(null);
  const [activeGroup, setActiveGroup] = useState("dev");
  const [showPicker, setShowPicker] = useState(true);
  const [busy, setBusy] = useState(false);
  const [uploadingIcon, setUploadingIcon] = useState(false);

  const handleIconUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingIcon(true);
    try {
      const url = await uploadFile(file);
      setIcon(url);
      toast.success("Tải ảnh icon thành công");
    } catch (err) {
      toast.error("Lỗi tải ảnh icon: " + err.message);
    }
    setUploadingIcon(false);
    e.target.value = "";
  };

  const handleEdit = (c) => {
    setEditingCategory(c);
    setName(c.name);
    setIcon(c.icon || "📁");
    setColor(c.color || "#8b5cf6");
    setDesc(c.desc || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancel = () => {
    setEditingCategory(null);
    setName("");
    setIcon("🚀");
    setColor("#8b5cf6");
    setDesc("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;
    setBusy(true);
    try {
      const isUpdating = Boolean(editingCategory);
      const originalName = editingCategory?.name;
      const realDocId = editingCategory?.id && !editingCategory.id.startsWith("auto-") ? editingCategory.id : null;

      const payload = {
        name: trimmedName,
        icon: icon || "📁",
        color: color || "#8b5cf6",
        desc: desc.trim(),
      };
      if (realDocId) payload.id = realDocId;

      await saveItem("categories", payload);

      // Nếu cập nhật và đổi tên danh mục (ví dụ từ "Lập Trình" sang tên mới), đồng bộ cập nhật cho các bài viết và tài liệu cũ
      if (isUpdating && originalName && originalName !== trimmedName) {
        const [allPosts, allDocs] = await Promise.all([
          listItems("posts"),
          listItems("documents"),
        ]);
        const postUpdates = allPosts
          .filter((p) => p.category === originalName)
          .map((p) => saveItem("posts", { ...p, category: trimmedName }));
        const docUpdates = allDocs
          .filter((d) => d.category === originalName)
          .map((d) => saveItem("documents", { ...d, category: trimmedName }));
        await Promise.all([...postUpdates, ...docUpdates]);
      }

      toast.success(isUpdating ? "Đã cập nhật danh mục" : "Đã tạo danh mục mới");
      handleCancel();
      reload();
    } catch (err) {
      toast.error("Lỗi khi lưu danh mục: " + err.message);
    }
    setBusy(false);
  };

  const currentIcons = IT_ICON_GROUPS.find((g) => g.id === activeGroup)?.icons || [];

  return (
    <div className="glass reveal" style={{ padding: 28, borderRadius: "var(--radius)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2>Quản lý danh mục nội dung</h2>
          <p className="muted" style={{ marginBottom: 20, fontSize: ".9rem" }}>
            Định hình cấu trúc chủ đề chuyên nghiệp cho Bài viết và Kho tài liệu
          </p>
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => setShowPicker(!showPicker)}
        >
          {showPicker ? "Ẩn bảng chọn Icon" : "Mở bảng chọn Icon CNTT"}
        </button>
      </div>

      {/* Form thêm mới / cập nhật */}
      <form
        onSubmit={handleSubmit}
        className="glass"
        style={{
          padding: 22,
          borderRadius: 16,
          marginBottom: 28,
          border: editingCategory ? "2px solid #10b981" : "1px solid var(--glass-border)",
          background: editingCategory ? "hsla(160 84% 39% / .06)" : undefined,
          boxShadow: editingCategory ? "0 0 30px hsla(160 84% 39% / .2)" : undefined,
          transition: ".3s",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h3 style={{ fontSize: "1.15rem", margin: 0, color: editingCategory ? "#10b981" : "inherit" }}>
              {editingCategory ? `✏️ Cập nhật danh mục: "${editingCategory.name}"` : "+ Thêm danh mục mới"}
            </h3>
            {editingCategory && (
              <span className="badge" style={{ background: "hsla(160 84% 39% / .2)", color: "#10b981", border: "1px solid hsla(160 84% 39% / .4)" }}>
                Đang ở chế độ Cập nhật
              </span>
            )}
          </div>
          {editingCategory && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={handleCancel}>
              ❌ Hủy bỏ (Chuyển về tạo mới)
            </button>
          )}
        </div>

        {/* Xem trước trực tiếp (Live Preview) */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", background: "hsla(0 0% 100% / .03)", borderRadius: 12, marginBottom: 18, border: "1px dashed var(--glass-border)" }}>
          <span style={{ fontSize: ".82rem", color: "var(--muted)" }}>Xem trước hiển thị:</span>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{
              fontSize: "1.6rem", width: 44, height: 44, display: "grid", placeItems: "center",
              background: `${color}22`, borderRadius: 10, border: `1px solid ${color}66`,
              overflow: "hidden", padding: isImageIcon(icon) ? 4 : 0,
            }}>
              {renderIcon(icon, "📁")}
            </span>
            <div>
              <b style={{ fontSize: "1.05rem", color: color }}>{name || "Tên danh mục..."}</b>
              {desc && <span className="muted" style={{ fontSize: ".82rem", marginLeft: 8 }}>— {desc}</span>}
            </div>
          </div>
        </div>

        {/* Các trường nhập liệu */}
        <div style={{ display: "grid", gridTemplateColumns: "minmax(140px, auto) 1.5fr auto 2fr auto", gap: 12, alignItems: "end", marginBottom: 16 }}>
          <div className="field" style={{ margin: 0 }}>
            <label>Icon (Emoji / Ảnh)</label>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              {isImageIcon(icon) ? (
                <div style={{
                  width: 44, height: 44, borderRadius: 8, border: "1px solid var(--glass-border)",
                  padding: 4, display: "grid", placeItems: "center", background: "rgba(255,255,255,0.05)",
                  flexShrink: 0,
                }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={icon} alt="Icon" style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: 4 }} />
                </div>
              ) : (
                <input
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  placeholder="🚀"
                  style={{ textAlign: "center", fontSize: "1.3rem", width: 56 }}
                />
              )}
              <label
                className="btn btn-ghost btn-sm"
                style={{ cursor: "pointer", margin: 0, height: 44, display: "inline-flex", alignItems: "center", padding: "0 10px", fontSize: ".8rem" }}
                title="Tải ảnh icon từ máy tính (PNG, SVG, JPG, WEBP)"
              >
                {uploadingIcon ? "⏳" : "📷 Tải ảnh"}
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  disabled={uploadingIcon}
                  onChange={handleIconUpload}
                />
              </label>
              {isImageIcon(icon) && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ height: 44, padding: "0 8px", color: "var(--danger, #ef4444)" }}
                  onClick={() => setIcon("📁")}
                  title="Xóa ảnh và dùng emoji"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label>Tên danh mục *</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Trí tuệ nhân tạo (AI), DevOps..."
            />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label>Mã màu</label>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                style={{ width: 44, height: 44, padding: 3, cursor: "pointer", borderRadius: 8 }}
                title="Chọn màu tùy chỉnh"
              />
            </div>
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label>Mô tả ngắn</label>
            <input
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Mô tả tóm tắt nội dung chủ đề này..."
            />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={busy}
              style={{
                height: 44,
                minWidth: 120,
                background: editingCategory ? "linear-gradient(135deg, #059669, #10b981)" : undefined,
                boxShadow: editingCategory ? "0 4px 18px hsla(160 84% 39% / .4)" : undefined,
              }}
            >
              {busy ? "Đang lưu..." : editingCategory ? "💾 Cập nhật" : "+ Tạo mới"}
            </button>
            {editingCategory && (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={handleCancel}
                style={{ height: 44 }}
                title="Hủy cập nhật"
              >
                Hủy
              </button>
            )}
          </div>
        </div>

        {/* Bảng chọn màu nhanh (Preset Colors) */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
          <span className="muted" style={{ fontSize: ".8rem" }}>Màu gợi ý:</span>
          {PRESET_COLORS.map((p) => (
            <button
              key={p.color}
              type="button"
              onClick={() => setColor(p.color)}
              title={p.name}
              style={{
                width: 24, height: 24, borderRadius: "50%", background: p.color, border: color === p.color ? "2px solid #fff" : "1px solid transparent",
                cursor: "pointer", transition: ".2s", transform: color === p.color ? "scale(1.2)" : "scale(1)",
                boxShadow: color === p.color ? `0 0 10px ${p.color}` : "none",
              }}
            />
          ))}
        </div>

        {/* Bảng chọn Icon chủ đề CNTT */}
        {showPicker && (
          <div style={{ padding: 14, background: "hsla(0 0% 0% / .2)", borderRadius: 12, border: "1px solid var(--glass-border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
              <span style={{ fontSize: ".85rem", fontWeight: 600, color: "var(--accent)" }}>
                ⚡ Bộ sưu tập Icon Công nghệ thông tin & Lĩnh vực liên quan:
              </span>
              <span className="muted" style={{ fontSize: ".78rem" }}>Bấm vào bất kỳ icon nào để áp dụng</span>
            </div>

            {/* Tabs chủ đề */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
              {IT_ICON_GROUPS.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setActiveGroup(g.id)}
                  className={`chip ${activeGroup === g.id ? "on" : ""}`}
                  style={{ fontSize: ".8rem", padding: "4px 12px" }}
                >
                  {g.name}
                </button>
              ))}
            </div>

            {/* Danh sách icon trong tab đã chọn */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
              gap: 8,
              maxHeight: 220,
              overflowY: "auto",
              paddingRight: 4,
            }}>
              {currentIcons.map((item) => {
                const isSelected = icon === item.icon;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setIcon(item.icon)}
                    title={item.label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "7px 10px",
                      borderRadius: 10,
                      background: isSelected ? `${color}33` : "hsla(0 0% 100% / .04)",
                      border: isSelected ? `1.5px solid ${color}` : "1px solid var(--glass-border)",
                      color: isSelected ? "#fff" : "var(--text)",
                      cursor: "pointer",
                      transition: ".2s",
                      textAlign: "left",
                    }}
                  >
                    <span style={{ fontSize: "1.3rem", lineHeight: 1 }}>{item.icon}</span>
                    <span style={{ fontSize: ".78rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </form>

      {/* Danh sách danh mục đã có */}
      <h3 style={{ fontSize: "1.1rem", marginBottom: 14 }}>Danh sách danh mục hiện có</h3>
      <div style={{ display: "grid", gap: 12 }}>
        {(catData || []).map((c) => {
          const isSelected = editingCategory?.name === c.name;
          return (
            <div
              className="row glass"
              key={c.id || c.name}
              style={{
                margin: 0,
                border: isSelected ? "2px solid #10b981" : undefined,
                background: isSelected ? "hsla(160 84% 39% / .1)" : undefined,
                boxShadow: isSelected ? "0 0 20px hsla(160 84% 39% / .2)" : undefined,
                transition: ".3s",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span style={{
                  fontSize: "1.6rem", width: 44, height: 44, display: "grid", placeItems: "center",
                  background: `${c.color || "var(--primary)"}22`, borderRadius: 10, border: `1px solid ${c.color || "var(--primary)"}66`,
                  overflow: "hidden", padding: isImageIcon(c.icon) ? 4 : 0,
                }}>
                  {renderIcon(c.icon, "📁")}
                </span>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <b style={{ fontSize: "1.05rem", color: c.color }}>{c.name}</b>
                    {isSelected && (
                      <span className="badge" style={{ background: "hsla(160 84% 39% / .2)", color: "#10b981", fontSize: ".72rem", border: "1px solid hsla(160 84% 39% / .4)" }}>
                        Đang chọn sửa
                      </span>
                    )}
                  </div>
                  {c.desc && <p className="muted" style={{ fontSize: ".82rem", margin: "2px 0" }}>{c.desc}</p>}
                  <div className="muted" style={{ fontSize: ".78rem" }}>
                    {c.postCount} bài viết · {c.docCount} tài liệu
                  </div>
                </div>
              </div>
              <div className="actions" style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  className={`btn btn-sm ${isSelected ? "btn-primary" : "btn-ghost"}`}
                  onClick={() => handleEdit(c)}
                  style={{
                    background: isSelected ? "linear-gradient(135deg, #059669, #10b981)" : undefined,
                  }}
                >
                  {isSelected ? "✏️ Đang sửa" : "✏️ Sửa"}
                </button>
                {c.id && !c.id.startsWith("auto-") && (
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={async () => {
                      if (confirm(`Xóa danh mục "${c.name}"?`)) {
                        await removeItem("categories", c.id);
                        if (editingCategory?.id === c.id) handleCancel();
                        reload();
                      }
                    }}
                  >
                    Xóa
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {(!catData || catData.length === 0) && (
          <div className="empty">Chưa có danh mục nào. Hãy tạo danh mục đầu tiên ở trên!</div>
        )}
      </div>
    </div>
  );
}
