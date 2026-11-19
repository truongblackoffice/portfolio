"use client";
import { useState } from "react";
import { listItems, saveItem, removeItem, uploadFile } from "@/lib/db";
import useAsync from "@/lib/useAsync";
import { toast } from "@/lib/toast";

import { ALL_ICON_TOPICS, IT_ICON_GROUPS, PRESET_COLORS, renderIcon, isImageIcon } from "@/lib/presets";

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
  const [icon, setIcon] = useState("https://api.iconify.design/lucide/folder.svg?color=%238b5cf6");
  const [color, setColor] = useState("#8b5cf6");
  const [desc, setDesc] = useState("");
  const [editingCategory, setEditingCategory] = useState(null);
  const [activeGroup, setActiveGroup] = useState(ALL_ICON_TOPICS[0]?.id || "contact");
  const [showPicker, setShowPicker] = useState(true);
  const [pickerTab, setPickerTab] = useState("topics"); // "topics" | "search_cdn" | "custom_url"
  const [iconSearch, setIconSearch] = useState("");
  const [cdnQuery, setCdnQuery] = useState("");
  const [cdnSearchResults, setCdnSearchResults] = useState([]);
  const [searchingCdn, setSearchingCdn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploadingIcon, setUploadingIcon] = useState(false);

  // Tìm kiếm icon trực tuyến từ kho Iconify CDN toàn cầu
  const handleSearchCdn = async (q) => {
    const query = (q !== undefined ? q : cdnQuery).trim();
    if (!query) return;
    setSearchingCdn(true);
    try {
      const res = await fetch(`https://api.iconify.design/search?query=${encodeURIComponent(query)}&limit=36`);
      const data = await res.json();
      if (data?.icons && data.icons.length > 0) {
        setCdnSearchResults(
          data.icons.map((name) => ({
            name,
            url: `https://api.iconify.design/${name.replace(":", "/")}.svg`,
          }))
        );
      } else {
        setCdnSearchResults([]);
        toast.info(`Không tìm thấy icon nào với từ khóa "${query}"`);
      }
    } catch (err) {
      console.error("Lỗi tìm kiếm CDN:", err);
      toast.error("Không thể kết nối kho Icon CDN: " + err.message);
    } finally {
      setSearchingCdn(false);
    }
  };

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

  const currentIcons = ALL_ICON_TOPICS.find((g) => g.id === activeGroup)?.icons || [];

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

        {/* Bảng chọn Icon CDN Vector SVG (3 Tabs) */}
        {showPicker && (
          <div style={{ padding: 16, background: "hsla(0 0% 0% / .3)", borderRadius: 14, border: "1px solid var(--glass-border)", marginBottom: 16 }}>
            {/* 3 Sub-tabs */}
            <div style={{ display: "flex", gap: 8, borderBottom: "1px solid var(--glass-border)", paddingBottom: 10, marginBottom: 14, flexWrap: "wrap" }}>
              <button
                type="button"
                className={`chip ${pickerTab === "topics" ? "on" : ""}`}
                onClick={() => setPickerTab("topics")}
                style={{ fontSize: ".8rem", padding: "6px 14px" }}
              >
                ⚡ 6 Chủ đề Tuyển chọn (216+ Icon)
              </button>
              <button
                type="button"
                className={`chip ${pickerTab === "search_cdn" ? "on" : ""}`}
                onClick={() => setPickerTab("search_cdn")}
                style={{ fontSize: ".8rem", padding: "6px 14px" }}
              >
                🔍 Tìm kiếm CDN Toàn cầu (Iconify)
              </button>
              <button
                type="button"
                className={`chip ${pickerTab === "custom_url" ? "on" : ""}`}
                onClick={() => setPickerTab("custom_url")}
                style={{ fontSize: ".8rem", padding: "6px 14px" }}
              >
                📁 Tải ảnh logo riêng từ máy
              </button>
            </div>

            {/* TAB 1: 6 TOPICS */}
            {pickerTab === "topics" && (
              <div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                  {ALL_ICON_TOPICS.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setActiveGroup(g.id)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 999,
                        fontSize: ".76rem",
                        border: "1px solid var(--glass-border)",
                        background: activeGroup === g.id ? "var(--grad)" : "hsla(0 0% 100% / .06)",
                        color: activeGroup === g.id ? "#fff" : "var(--text)",
                        cursor: "pointer",
                        fontWeight: activeGroup === g.id ? 700 : 500,
                        transition: ".2s",
                      }}
                    >
                      {g.name} ({g.icons.length})
                    </button>
                  ))}
                </div>

                <div style={{ marginBottom: 12 }}>
                  <input
                    value={iconSearch}
                    onChange={(e) => setIconSearch(e.target.value)}
                    placeholder="🔍 Lọc nhanh icon trong chủ đề này..."
                    style={{ fontSize: ".8rem", padding: "6px 12px" }}
                  />
                </div>

                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
                  gap: 8,
                  maxHeight: 220,
                  overflowY: "auto",
                  padding: 4,
                }}>
                  {(ALL_ICON_TOPICS.find((g) => g.id === activeGroup)?.icons || [])
                    .filter((it) => !iconSearch.trim() || it.label.toLowerCase().includes(iconSearch.toLowerCase()) || it.icon.includes(iconSearch))
                    .map((it) => {
                      const isSelected = icon === it.icon;
                      return (
                        <button
                          key={it.label}
                          type="button"
                          onClick={() => {
                            setIcon(it.icon);
                            toast.success(`Đã chọn icon: ${it.label}`);
                          }}
                          title={it.label}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "7px 10px",
                            borderRadius: 10,
                            background: isSelected ? `${color}33` : "hsla(0 0% 100% / .04)",
                            border: isSelected ? `2px solid ${color}` : "1px solid var(--glass-border)",
                            color: "var(--text)",
                            cursor: "pointer",
                            transition: ".2s",
                            textAlign: "left",
                          }}
                        >
                          <span style={{ fontSize: "1.3rem", lineHeight: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, flexShrink: 0 }}>
                            {renderIcon(it.icon, "📁", { width: 20, height: 20, color })}
                          </span>
                          <span style={{ fontSize: ".76rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {it.label}
                          </span>
                        </button>
                      );
                    })}
                </div>
              </div>
            )}

            {/* TAB 2: GLOBAL SEARCH */}
            {pickerTab === "search_cdn" && (
              <div>
                <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                  <input
                    value={cdnQuery}
                    onChange={(e) => setCdnQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSearchCdn(cdnQuery);
                      }
                    }}
                    placeholder="Nhập từ khóa tiếng Anh (vd: ai, code, web, database, cloud, book, rocket, tools, mobile, security...)"
                    style={{ fontSize: ".8rem", padding: "8px 12px" }}
                  />
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => handleSearchCdn(cdnQuery)}
                    disabled={searchingCdn || !cdnQuery.trim()}
                    style={{ flexShrink: 0, fontSize: ".8rem" }}
                  >
                    {searchingCdn ? "Đang tìm..." : "🔍 Tìm kiếm"}
                  </button>
                </div>

                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                  <span className="muted" style={{ fontSize: ".74rem", alignSelf: "center" }}>Gợi ý:</span>
                  {["ai", "code", "database", "cloud", "security", "web", "react", "python", "javascript", "book", "rocket", "mobile", "tools", "star", "design", "network"].map((kw) => (
                    <button
                      key={kw}
                      type="button"
                      className="chip"
                      onClick={() => {
                        setCdnQuery(kw);
                        handleSearchCdn(kw);
                      }}
                      style={{ fontSize: ".72rem", padding: "3px 8px" }}
                    >
                      {kw}
                    </button>
                  ))}
                </div>

                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(46px, 1fr))",
                  gap: 6,
                  maxHeight: 200,
                  overflowY: "auto",
                  padding: 4,
                }}>
                  {cdnSearchResults.map((res, idx) => {
                    const isSelected = icon === res.url;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setIcon(res.url);
                          toast.success(`Đã chọn icon CDN: ${res.name}`);
                        }}
                        style={{
                          width: "100%",
                          aspectRatio: "1",
                          display: "grid",
                          placeItems: "center",
                          background: isSelected ? `${color}44` : "hsla(0 0% 100% / .06)",
                          border: isSelected ? `2px solid ${color}` : "1px solid var(--glass-border)",
                          borderRadius: 10,
                          cursor: "pointer",
                          padding: 8,
                          transition: ".15s",
                        }}
                        title={res.name}
                      >
                        {renderIcon(res.url, "📁", { width: 24, height: 24, color })}
                      </button>
                    );
                  })}

                  {cdnSearchResults.length === 0 && !searchingCdn && (
                    <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: 20, color: "var(--muted)", fontSize: ".82rem" }}>
                      Nhập từ khóa tiếng Anh ở trên và bấm &quot;Tìm kiếm&quot; để tra cứu hơn 200,000+ vector SVG icons từ CDN toàn cầu.
                    </div>
                  )}

                  {searchingCdn && (
                    <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: 20, color: "var(--accent)", fontSize: ".82rem" }}>
                      <span className="spinner" style={{ width: 16, height: 16, display: "inline-block", verticalAlign: "middle", marginRight: 8 }} />
                      Đang tra cứu Icon CDN...
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: UPLOAD TỪ MÁY */}
            {pickerTab === "custom_url" && (
              <div style={{ padding: "10px 0" }}>
                <p className="muted" style={{ fontSize: ".82rem", marginBottom: 12 }}>
                  Tải tệp hình ảnh biểu trưng riêng cho danh mục từ máy tính (PNG, SVG, JPG, WEBP):
                </p>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <label
                    className="btn btn-primary btn-sm"
                    style={{ cursor: uploadingIcon ? "wait" : "pointer", fontSize: ".82rem", display: "inline-flex", alignItems: "center", gap: 8 }}
                  >
                    {uploadingIcon ? "⏳ Đang tải ảnh..." : "📁 Tải ảnh từ máy tính"}
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
                      onClick={() => setIcon("📁")}
                      style={{ color: "var(--danger)" }}
                    >
                      Dùng lại emoji mặc định (📁)
                    </button>
                  )}
                </div>
              </div>
            )}
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
