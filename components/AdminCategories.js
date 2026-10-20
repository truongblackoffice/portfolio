"use client";
import { useState } from "react";
import { listItems, saveItem, removeItem } from "@/lib/db";
import useAsync from "@/lib/useAsync";

const IT_ICON_GROUPS = [
  {
    id: "dev",
    name: "💻 Lập trình & Kỹ thuật",
    icons: [
      { icon: "💻", label: "Laptop / Dev" },
      { icon: "🖥️", label: "Desktop" },
      { icon: "🌐", label: "Web / Frontend" },
      { icon: "⚙️", label: "Backend / Hệ thống" },
      { icon: "⚡", label: "Hiệu năng / Tốc độ" },
      { icon: "🧩", label: "Module / Thư viện" },
      { icon: "🛠️", label: "Công cụ / Tools" },
      { icon: "🚀", label: "Deploy / Khởi chạy" },
      { icon: "📦", label: "Package / NPM" },
      { icon: "⌨️", label: "Bàn phím / Coding" },
      { icon: "🐞", label: "Debug / Gỡ lỗi" },
      { icon: "🧪", label: "Kiểm thử / Testing" },
      { icon: "🔌", label: "API / Tích hợp" },
      { icon: "🧱", label: "Framework / Cấu trúc" },
    ],
  },
  {
    id: "ai",
    name: "🤖 Trí tuệ nhân tạo (AI) & Dữ liệu",
    icons: [
      { icon: "🤖", label: "AI / Bot" },
      { icon: "🧠", label: "Deep Learning / Trí tuệ" },
      { icon: "🗄️", label: "Cơ sở dữ liệu (Database)" },
      { icon: "📊", label: "Phân tích dữ liệu" },
      { icon: "📈", label: "Khoa học dữ liệu (Data Science)" },
      { icon: "🔮", label: "Mô hình dự đoán" },
      { icon: "🧬", label: "Thuật toán" },
      { icon: "💡", label: "Ý tưởng / Sáng tạo" },
      { icon: "👁️", label: "Thị giác máy tính (Computer Vision)" },
      { icon: "🔍", label: "Tìm kiếm dữ liệu" },
    ],
  },
  {
    id: "security",
    name: "🔒 Bảo mật & DevOps / Cloud",
    icons: [
      { icon: "🔒", label: "Bảo mật thông tin" },
      { icon: "🛡️", label: "Tường lửa / Phòng vệ" },
      { icon: "🔑", label: "Mật khẩu / Khóa truy cập" },
      { icon: "☁️", label: "Điện toán đám mây (Cloud)" },
      { icon: "🐳", label: "Docker / Container" },
      { icon: "🐧", label: "Linux / Mã nguồn mở" },
      { icon: "📡", label: "Mạng máy tính (Networking)" },
      { icon: "🏗️", label: "Kiến trúc hệ thống" },
      { icon: "🔐", label: "Mã hóa dữ liệu" },
      { icon: "🚨", label: "Giám sát & Cảnh báo" },
    ],
  },
  {
    id: "mobile",
    name: "📱 Thiết bị, Mobile & Game",
    icons: [
      { icon: "📱", label: "Lập trình Di động (Mobile)" },
      { icon: "📲", label: "Ứng dụng di động" },
      { icon: "🎮", label: "Phát triển Game" },
      { icon: "🕹️", label: "Đồ họa máy tính" },
      { icon: "💾", label: "Bộ nhớ & Lưu trữ" },
      { icon: "🔋", label: "Phần cứng & IoT" },
      { icon: "⌚", label: "Thiết bị thông minh" },
      { icon: "🎧", label: "Công nghệ Âm thanh / Media" },
    ],
  },
  {
    id: "edu",
    name: "📚 Tài liệu, Học tập & Chia sẻ",
    icons: [
      { icon: "📁", label: "Thư mục tổng hợp" },
      { icon: "📚", label: "Kho sách & Ebook" },
      { icon: "📖", label: "Tài liệu hướng dẫn" },
      { icon: "📝", label: "Ghi chú & Tips" },
      { icon: "🎓", label: "Khóa học & Chứng chỉ" },
      { icon: "🎯", label: "Lộ trình học (Roadmap)" },
      { icon: "⭐", label: "Kinh nghiệm thực chiến" },
      { icon: "🔥", label: "Xu hướng Công nghệ" },
      { icon: "💼", label: "Phỏng vấn & Nghề nghiệp" },
      { icon: "☕", label: "Góc Lập trình viên" },
    ],
  },
];

const PRESET_COLORS = [
  { color: "#8b5cf6", name: "Tím Cyber" },
  { color: "#3b82f6", name: "Xanh Dev" },
  { color: "#06b6d4", name: "Cyan Tech" },
  { color: "#10b981", name: "Xanh AI" },
  { color: "#f59e0b", name: "Cam Sáng tạo" },
  { color: "#ef4444", name: "Đỏ Bảo mật" },
  { color: "#ec4899", name: "Hồng Hiện đại" },
  { color: "#64748b", name: "Xám Hệ thống" },
];

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
  const [editingId, setEditingId] = useState(null);
  const [activeGroup, setActiveGroup] = useState("dev");
  const [showPicker, setShowPicker] = useState(true);
  const [busy, setBusy] = useState(false);

  const handleEdit = (c) => {
    setEditingId(c.id && !c.id.startsWith("auto-") ? c.id : null);
    setName(c.name);
    setIcon(c.icon || "📁");
    setColor(c.color || "#8b5cf6");
    setDesc(c.desc || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancel = () => {
    setEditingId(null);
    setName("");
    setIcon("🚀");
    setColor("#8b5cf6");
    setDesc("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      const payload = {
        name: name.trim(),
        icon: icon || "📁",
        color: color || "#8b5cf6",
        desc: desc.trim(),
      };
      if (editingId) payload.id = editingId;

      await saveItem("categories", payload);
      handleCancel();
      reload();
    } catch (e) {
      alert("Lỗi khi lưu danh mục: " + e.message);
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

      {/* Form thêm mới / chỉnh sửa */}
      <form onSubmit={handleSubmit} className="glass" style={{ padding: 20, borderRadius: 16, marginBottom: 28, border: editingId ? "1px solid var(--primary)" : "1px solid var(--glass-border)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ fontSize: "1.1rem", margin: 0, color: editingId ? "var(--accent)" : "inherit" }}>
            {editingId ? `✏️ Đang chỉnh sửa danh mục: "${name}"` : "+ Thêm danh mục mới"}
          </h3>
          {editingId && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={handleCancel}>
              Hủy chỉnh sửa
            </button>
          )}
        </div>

        {/* Xem trước trực tiếp (Live Preview) */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", background: "hsla(0 0% 100% / .03)", borderRadius: 12, marginBottom: 18, border: "1px dashed var(--glass-border)" }}>
          <span style={{ fontSize: ".82rem", color: "var(--muted)" }}>Xem trước hiển thị:</span>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{
              fontSize: "1.6rem", width: 42, height: 42, display: "grid", placeItems: "center",
              background: `${color}22`, borderRadius: 10, border: `1px solid ${color}66`,
            }}>
              {icon || "📁"}
            </span>
            <div>
              <b style={{ fontSize: "1.05rem", color: color }}>{name || "Tên danh mục..."}</b>
              {desc && <span className="muted" style={{ fontSize: ".82rem", marginLeft: 8 }}>— {desc}</span>}
            </div>
          </div>
        </div>

        {/* Các trường nhập liệu */}
        <div style={{ display: "grid", gridTemplateColumns: "85px 1.5fr auto 2fr auto", gap: 12, alignItems: "end", marginBottom: 16 }}>
          <div className="field" style={{ margin: 0 }}>
            <label>Icon</label>
            <input
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="🚀"
              style={{ textAlign: "center", fontSize: "1.3rem" }}
            />
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
          <button type="submit" className="btn btn-primary" disabled={busy} style={{ height: 44, minWidth: 100 }}>
            {busy ? "Đang lưu..." : editingId ? "Lưu thay đổi" : "Tạo mới"}
          </button>
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
        {(catData || []).map((c) => (
          <div className="row glass" key={c.id || c.name} style={{ margin: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{
                fontSize: "1.6rem", width: 44, height: 44, display: "grid", placeItems: "center",
                background: `${c.color || "var(--primary)"}22`, borderRadius: 10, border: `1px solid ${c.color || "var(--primary)"}66`,
              }}>
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
            <div className="actions" style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => handleEdit(c)}
              >
                ✏️ Sửa
              </button>
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
