"use client";
import { useState, useEffect } from "react";
import { getProfile, saveProfile, uploadFile } from "@/lib/db";
import { defaultContactConfig } from "@/lib/seed";
import { ALL_ICON_TOPICS, renderIcon, isImageIcon } from "@/lib/presets";
import { toast } from "@/lib/toast";

const CHANNEL_PRESETS = [
  { title: "Email Quản trị", value: "your-email@gmail.com", icon: "✉️", link: "mailto:your-email@gmail.com", type: "email", subtitle: "Gửi thư điện tử trực tiếp", allowCopy: true },
  { title: "Zalo & Chat nhanh", value: "0987654321", icon: "💬", link: "https://zalo.me/0987654321", type: "phone", subtitle: "Nhắn tin Zalo nhanh", allowCopy: true },
  { title: "Kênh Telegram", value: "@username", icon: "✈️", link: "https://t.me/username", type: "link", subtitle: "Trao đổi qua Telegram", allowCopy: false },
  { title: "Số điện thoại / Hotline", value: "0987 654 321", icon: "📱", link: "tel:0987654321", type: "phone", subtitle: "Gọi điện thoại trực tiếp", allowCopy: true },
  { title: "GitHub Profile", value: "username", icon: "🐙", link: "https://github.com/username", type: "link", subtitle: "Khám phá kho mã nguồn mở", allowCopy: false },
  { title: "Facebook / Messenger", value: "Trang cá nhân", icon: "📘", link: "https://facebook.com/username", type: "link", subtitle: "Nhắn tin Facebook trực tiếp", allowCopy: false },
  { title: "LinkedIn Profile", value: "Hồ sơ chuyên nghiệp", icon: "💼", link: "https://linkedin.com/in/username", type: "link", subtitle: "Kết nối mạng lưới công việc", allowCopy: false },
  { title: "Discord Server", value: "username#1234", icon: "🎮", link: "https://discord.gg/...", type: "link", subtitle: "Tham gia máy chủ Discord", allowCopy: true },
];

export default function AdminContact() {
  const [profile, setProfile] = useState(null);
  const [config, setConfig] = useState(defaultContactConfig);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // Modal / Form state for Channel
  const [editingChannel, setEditingChannel] = useState(null);
  const [channelForm, setChannelForm] = useState({
    title: "",
    value: "",
    icon: "💬",
    link: "",
    type: "link",
    subtitle: "",
    allowCopy: false,
    enabled: true,
  });
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [uploadingIcon, setUploadingIcon] = useState(false);

  // Icon Picker state inside Modal
  const [activeIconGroup, setActiveIconGroup] = useState("contact");
  const [iconSearch, setIconSearch] = useState("");
  const [showIconPicker, setShowIconPicker] = useState(false);

  // Modal / Form state for FAQ
  const [editingFaq, setEditingFaq] = useState(null);
  const [faqForm, setFaqForm] = useState({ question: "", answer: "" });
  const [showFaqModal, setShowFaqModal] = useState(false);

  useEffect(() => {
    getProfile()
      .then((p) => {
        setProfile(p || {});
        if (p?.contactConfig) {
          setConfig({
            ...defaultContactConfig,
            ...p.contactConfig,
            channels: p.contactConfig.channels || defaultContactConfig.channels,
            faqs: p.contactConfig.faqs || defaultContactConfig.faqs,
          });
        }
      })
      .catch((err) => {
        console.error("Lỗi tải thông tin liên hệ:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSaveAll = async (newConfig = config) => {
    setBusy(true);
    try {
      const updatedProfile = {
        ...(profile || {}),
        contactConfig: newConfig,
      };
      await saveProfile(updatedProfile);
      setProfile(updatedProfile);
      setConfig(newConfig);
      toast.success("🎉 Đã lưu cấu hình thông tin liên hệ thành công!");
    } catch (err) {
      console.error(err);
      toast.error("Lưu cấu hình thất bại: " + err.message);
    } finally {
      setBusy(false);
    }
  };

  // Upload custom icon image
  const handleIconUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      return toast.error("Vui lòng chọn tệp hình ảnh hợp lệ (PNG, SVG, JPG, WEBP, GIF).");
    }
    setUploadingIcon(true);
    try {
      const url = await uploadFile(file);
      setChannelForm((prev) => ({ ...prev, icon: url }));
      toast.success("🎉 Tải ảnh icon lên thành công!");
    } catch (err) {
      console.error(err);
      toast.error("Lỗi tải ảnh icon: " + err.message);
    } finally {
      setUploadingIcon(false);
    }
  };

  // Channel Operations
  const openAddChannel = (preset = null) => {
    setEditingChannel(null);
    setShowIconPicker(false);
    setIconSearch("");
    if (preset) {
      setChannelForm({
        ...preset,
        enabled: true,
      });
    } else {
      setChannelForm({
        title: "",
        value: "",
        icon: "💬",
        link: "",
        type: "link",
        subtitle: "",
        allowCopy: false,
        enabled: true,
      });
    }
    setShowChannelModal(true);
  };

  const openEditChannel = (ch) => {
    setEditingChannel(ch);
    setShowIconPicker(false);
    setIconSearch("");
    setChannelForm({ ...ch });
    setShowChannelModal(true);
  };

  const saveChannelForm = (e) => {
    e.preventDefault();
    if (!channelForm.title.trim()) {
      return toast.error("Vui lòng nhập tiêu đề kênh liên hệ.");
    }

    let updatedChannels = [...(config.channels || [])];
    if (editingChannel) {
      updatedChannels = updatedChannels.map((c) =>
        c.id === editingChannel.id ? { ...channelForm, id: editingChannel.id } : c
      );
    } else {
      updatedChannels.push({
        ...channelForm,
        id: "ch_" + Date.now().toString(36),
      });
    }

    const newConfig = { ...config, channels: updatedChannels };
    setConfig(newConfig);
    setShowChannelModal(false);
    toast.success(editingChannel ? "Đã sửa kênh liên hệ!" : "Đã thêm kênh liên hệ mới!");
  };

  const deleteChannel = (id) => {
    if (!confirm("Bạn có chắc chắn muốn xóa kênh liên hệ này không?")) return;
    const updatedChannels = (config.channels || []).filter((c) => c.id !== id);
    const newConfig = { ...config, channels: updatedChannels };
    setConfig(newConfig);
    toast.info("Đã xóa kênh liên hệ.");
  };

  const toggleChannel = (id) => {
    const updatedChannels = (config.channels || []).map((c) =>
      c.id === id ? { ...c, enabled: !c.enabled } : c
    );
    const newConfig = { ...config, channels: updatedChannels };
    setConfig(newConfig);
  };

  // FAQ Operations
  const openAddFaq = () => {
    setEditingFaq(null);
    setFaqForm({ question: "", answer: "" });
    setShowFaqModal(true);
  };

  const openEditFaq = (faq) => {
    setEditingFaq(faq);
    setFaqForm({ question: faq.question, answer: faq.answer });
    setShowFaqModal(true);
  };

  const saveFaqForm = (e) => {
    e.preventDefault();
    if (!faqForm.question.trim() || !faqForm.answer.trim()) {
      return toast.error("Vui lòng nhập đầy đủ câu hỏi và câu trả lời.");
    }

    let updatedFaqs = [...(config.faqs || [])];
    if (editingFaq) {
      updatedFaqs = updatedFaqs.map((f) =>
        f.id === editingFaq.id ? { ...faqForm, id: editingFaq.id } : f
      );
    } else {
      updatedFaqs.push({
        ...faqForm,
        id: "faq_" + Date.now().toString(36),
      });
    }

    const newConfig = { ...config, faqs: updatedFaqs };
    setConfig(newConfig);
    setShowFaqModal(false);
    toast.success(editingFaq ? "Đã sửa câu hỏi FAQ!" : "Đã thêm câu hỏi FAQ mới!");
  };

  const deleteFaq = (id) => {
    if (!confirm("Bạn có chắc chắn muốn xóa câu hỏi FAQ này không?")) return;
    const updatedFaqs = (config.faqs || []).filter((f) => f.id !== id);
    const newConfig = { ...config, faqs: updatedFaqs };
    setConfig(newConfig);
    toast.info("Đã xóa câu hỏi FAQ.");
  };

  const handleResetDefaults = () => {
    if (!confirm("Bạn có chắc chắn muốn khôi phục toàn bộ thông tin liên hệ về mặc định không?")) return;
    setConfig(defaultContactConfig);
    handleSaveAll(defaultContactConfig);
  };

  // Filter icons for current group and search query
  const currentGroupObj = ALL_ICON_TOPICS.find((g) => g.id === activeIconGroup) || ALL_ICON_TOPICS[0];
  const filteredIcons = currentGroupObj.icons.filter((item) => {
    if (!iconSearch.trim()) return true;
    const q = iconSearch.toLowerCase();
    return item.label.toLowerCase().includes(q) || item.icon.includes(q);
  });

  if (loading) return <div className="empty">Đang tải cấu hình liên hệ...</div>;

  return (
    <div style={{ maxWidth: 960, margin: "0 auto" }}>
      {/* Top Header & Action */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: "1.6rem" }}>📞 Quản lý Thông tin &amp; Kênh Liên hệ</h2>
          <p className="muted" style={{ fontSize: ".88rem" }}>
            Tùy biến các phương thức liên lạc trực tiếp, mạng xã hội, upload logo icon hoặc chọn icon theo chủ đề (hơn 30 icon/chủ đề).
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <a href="/contact" target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">
            👁️ Xem trang thực tế ↗
          </a>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => handleSaveAll()}
            disabled={busy}
          >
            {busy ? "Đang lưu..." : "💾 Lưu toàn bộ thay đổi"}
          </button>
        </div>
      </div>

      {/* ====================================================================
          1. THÔNG TIN CHUNG & CAM KẾT PHẢN HỒI
          ==================================================================== */}
      <div className="glass" style={{ padding: 24, borderRadius: 18, marginBottom: 24 }}>
        <h3 style={{ fontSize: "1.2rem", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <span>📌</span> Tiêu đề trang &amp; Cam kết thời gian
        </h3>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div className="field">
            <label>Tiêu đề chính trang liên hệ</label>
            <input
              value={config.headline || ""}
              onChange={(e) => setConfig({ ...config, headline: e.target.value })}
              placeholder="Liên hệ & Trao đổi thông tin"
            />
          </div>

          <div className="field">
            <label>Trạng thái hoạt động (Status Badge)</label>
            <input
              value={config.statusText || ""}
              onChange={(e) => setConfig({ ...config, statusText: e.target.value })}
              placeholder="Đang trực tuyến"
            />
          </div>
        </div>

        <div className="field">
          <label>Mô tả / Lời dẫn dắt đầu trang</label>
          <textarea
            rows={2}
            value={config.subheadline || ""}
            onChange={(e) => setConfig({ ...config, subheadline: e.target.value })}
            placeholder="Bạn có thắc mắc về đề thi trắc nghiệm, muốn chia sẻ tài liệu..."
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16 }}>
          <div className="field">
            <label>Cam kết phản hồi (Response Commitment)</label>
            <input
              value={config.responseTime || ""}
              onChange={(e) => setConfig({ ...config, responseTime: e.target.value })}
              placeholder="Mình thường xuyên kiểm tra hòm thư và sẽ nỗ lực phản hồi trong vòng 2 đến 6 giờ làm việc."
            />
          </div>

          <div className="field">
            <label>Vị trí / Múi giờ</label>
            <input
              value={config.locationText || ""}
              onChange={(e) => setConfig({ ...config, locationText: e.target.value })}
              placeholder="GMT+7 (Việt Nam)"
            />
          </div>
        </div>
      </div>

      {/* ====================================================================
          2. QUẢN LÝ CÁC PHƯƠNG THỨC / KÊNH LIÊN HỆ
          ==================================================================== */}
      <div className="glass" style={{ padding: 24, borderRadius: 18, marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
          <div>
            <h3 style={{ fontSize: "1.2rem", display: "flex", alignItems: "center", gap: 8 }}>
              <span>⚡</span> Danh sách các Kênh liên hệ ({config.channels?.length || 0})
            </h3>
            <p className="muted" style={{ fontSize: ".82rem" }}>
              Hỗ trợ cả tải ảnh logo icon (PNG/SVG) từ máy tính hoặc chọn icon theo 6 chủ đề phong phú.
            </p>
          </div>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => openAddChannel()}>
            ➕ Thêm kênh liên hệ mới
          </button>
        </div>

        {/* Quick Add Presets Bar */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: ".78rem", color: "var(--muted)", marginBottom: 8, fontWeight: 600 }}>
            TẠO NHANH THEO MẪU CÓ SẴN:
          </div>
          <div className="chips">
            {CHANNEL_PRESETS.map((pr, idx) => (
              <button
                key={idx}
                type="button"
                className="chip"
                onClick={() => openAddChannel(pr)}
                title="Bấm để thêm kênh này"
              >
                {pr.icon} {pr.title}
              </button>
            ))}
          </div>
        </div>

        {/* Channels List */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {(config.channels || []).map((ch) => (
            <div
              key={ch.id}
              className="glass"
              style={{
                padding: "14px 18px",
                borderRadius: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 14,
                opacity: ch.enabled ? 1 : 0.55,
                borderLeft: ch.enabled ? "4px solid var(--primary)" : "4px solid var(--glass-border)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0, flex: 1 }}>
                <span
                  style={{
                    fontSize: "1.6rem",
                    width: 46,
                    height: 46,
                    display: "grid",
                    placeItems: "center",
                    borderRadius: 12,
                    background: "hsla(0 0% 100% / .08)",
                    border: "1px solid var(--glass-border)",
                    overflow: "hidden",
                    padding: isImageIcon(ch.icon) ? 6 : 0,
                    flexShrink: 0,
                  }}
                >
                  {renderIcon(ch.icon, "💬")}
                </span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <b style={{ fontSize: ".95rem" }}>{ch.title}</b>
                    {!ch.enabled && (
                      <span style={{ fontSize: ".7rem", padding: "1px 8px", borderRadius: 999, background: "hsla(0 0% 100% / .1)", color: "var(--muted)" }}>
                        Đang ẩn
                      </span>
                    )}
                    {ch.allowCopy && (
                      <span style={{ fontSize: ".7rem", padding: "1px 8px", borderRadius: 999, background: "hsla(150 70% 50% / .15)", color: "hsl(150 70% 45%)" }}>
                        Hỗ trợ chép nhanh
                      </span>
                    )}
                    {isImageIcon(ch.icon) && (
                      <span style={{ fontSize: ".7rem", padding: "1px 8px", borderRadius: 999, background: "hsla(262 90% 68% / .15)", color: "var(--primary)" }}>
                        Ảnh tải lên
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: ".82rem", color: "var(--accent)", marginTop: 2, wordBreak: "break-all" }}>
                    {ch.value || ch.link || "Chưa có liên kết"}
                  </div>
                  {ch.subtitle && (
                    <div className="muted" style={{ fontSize: ".76rem", marginTop: 2 }}>
                      {ch.subtitle}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => toggleChannel(ch.id)}
                  title={ch.enabled ? "Bấm để ẩn kênh này" : "Bấm để hiện kênh này"}
                  style={{ fontSize: ".76rem" }}
                >
                  {ch.enabled ? "👁️ Ẩn" : "👁️ Hiện"}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => openEditChannel(ch)}
                  style={{ fontSize: ".76rem" }}
                >
                  ✏️ Sửa
                </button>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => deleteChannel(ch.id)}
                  style={{ fontSize: ".76rem" }}
                >
                  🗑️ Xóa
                </button>
              </div>
            </div>
          ))}

          {(!config.channels || config.channels.length === 0) && (
            <div className="empty" style={{ padding: 30 }}>
              Chưa có kênh liên hệ nào. Bấm &quot;Thêm kênh liên hệ mới&quot; hoặc chọn mẫu có sẵn ở trên.
            </div>
          )}
        </div>
      </div>

      {/* ====================================================================
          3. QUẢN LÝ CÂU HỎI THƯỜNG GẶP (FAQ)
          ==================================================================== */}
      <div className="glass" style={{ padding: 24, borderRadius: 18, marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
          <div>
            <h3 style={{ fontSize: "1.2rem", display: "flex", alignItems: "center", gap: 8 }}>
              <span>❓</span> Danh sách Câu hỏi thường gặp FAQ ({config.faqs?.length || 0})
            </h3>
            <p className="muted" style={{ fontSize: ".82rem" }}>
              Các câu hỏi hiển thị dạng lưới ở cuối trang liên hệ để giải đáp nhanh cho học viên và độc giả.
            </p>
          </div>
          <button type="button" className="btn btn-primary btn-sm" onClick={openAddFaq}>
            ➕ Thêm câu hỏi FAQ mới
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {(config.faqs || []).map((faq) => (
            <div
              key={faq.id}
              className="glass"
              style={{
                padding: "16px 20px",
                borderRadius: 14,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 16,
              }}
            >
              <div style={{ flex: 1 }}>
                <b style={{ color: "var(--accent)", fontSize: ".95rem", display: "block", marginBottom: 6 }}>
                  {faq.question}
                </b>
                <p className="muted" style={{ fontSize: ".88rem", lineHeight: 1.55 }}>
                  {faq.answer}
                </p>
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => openEditFaq(faq)}
                  style={{ fontSize: ".76rem" }}
                >
                  ✏️ Sửa
                </button>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => deleteFaq(faq.id)}
                  style={{ fontSize: ".76rem" }}
                >
                  🗑️ Xóa
                </button>
              </div>
            </div>
          ))}

          {(!config.faqs || config.faqs.length === 0) && (
            <div className="empty" style={{ padding: 24 }}>
              Chưa có câu hỏi FAQ nào. Bấm &quot;Thêm câu hỏi FAQ mới&quot; để tạo.
            </div>
          )}
        </div>
      </div>

      {/* ====================================================================
          4. BOTTOM CONTROLS
          ==================================================================== */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginTop: 32 }}>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={handleResetDefaults}
          style={{ color: "var(--danger)" }}
        >
          🔄 Khôi phục mặc định ban đầu
        </button>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => handleSaveAll()}
          disabled={busy}
          style={{ padding: "14px 32px", fontSize: "1rem" }}
        >
          {busy ? "Đang lưu cấu hình..." : "💾 Lưu toàn bộ thông tin liên hệ"}
        </button>
      </div>

      {/* ====================================================================
          MODAL: THÊM / SỬA KÊNH LIÊN HỆ (KÈM UPLOAD ICON & PICKER THEO CHỦ ĐỀ)
          ==================================================================== */}
      {showChannelModal && (
        <div className="ai-modal-overlay" onClick={() => setShowChannelModal(false)}>
          <div
            className="ai-modal-container glass"
            style={{ width: "min(640px, 94%)", maxHeight: "90vh", overflowY: "auto", padding: 28, borderRadius: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <h3 style={{ fontSize: "1.25rem" }}>
                {editingChannel ? "✏️ Chỉnh sửa kênh liên hệ" : "➕ Thêm kênh liên hệ mới"}
              </h3>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setShowChannelModal(false)}
                style={{ padding: "4px 10px" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={saveChannelForm}>
              {/* Icon Section (Preview + Upload + Picker Button) */}
              <div style={{ marginBottom: 18, padding: 16, borderRadius: 14, background: "hsla(0 0% 100% / .04)", border: "1px solid var(--glass-border)" }}>
                <div style={{ fontSize: ".82rem", fontWeight: 600, color: "var(--muted)", marginBottom: 10 }}>
                  BIỂU TƯỢNG (ICON / LOGO)
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                  {/* Current Icon Preview Box */}
                  <div
                    style={{
                      width: 58,
                      height: 58,
                      borderRadius: 14,
                      background: "hsla(262 90% 68% / .15)",
                      border: "2px solid var(--primary)",
                      display: "grid",
                      placeItems: "center",
                      fontSize: "2rem",
                      overflow: "hidden",
                      padding: isImageIcon(channelForm.icon) ? 8 : 0,
                      flexShrink: 0,
                    }}
                    title="Icon hiện tại của kênh"
                  >
                    {renderIcon(channelForm.icon, "💬")}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1, minWidth: 200 }}>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {/* Button Open Topic Icon Picker */}
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => setShowIconPicker(!showIconPicker)}
                        style={{ fontSize: ".8rem" }}
                      >
                        {showIconPicker ? "▲ Đóng bộ chọn icon" : "🎨 Chọn icon theo chủ đề (200+ icon)"}
                      </button>

                      {/* Button Upload Image Icon */}
                      <label
                        className="btn btn-primary btn-sm"
                        style={{ cursor: uploadingIcon ? "wait" : "pointer", fontSize: ".8rem" }}
                      >
                        {uploadingIcon ? (
                          <>
                            <span className="spinner" style={{ width: 14, height: 14 }} />
                            Đang tải ảnh...
                          </>
                        ) : (
                          "📁 Tải ảnh logo từ máy"
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: "none" }}
                          disabled={uploadingIcon}
                          onChange={handleIconUpload}
                        />
                      </label>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <input
                        value={channelForm.icon}
                        onChange={(e) => setChannelForm({ ...channelForm, icon: e.target.value })}
                        placeholder="Nhập emoji hoặc link ảnh..."
                        style={{ fontSize: ".8rem", padding: "6px 10px" }}
                      />
                      {isImageIcon(channelForm.icon) && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => setChannelForm({ ...channelForm, icon: "💬" })}
                          style={{ fontSize: ".75rem", padding: "6px 10px", color: "var(--danger)" }}
                          title="Chuyển về emoji mặc định"
                        >
                          Xóa ảnh
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* EXPANDABLE TOPIC ICON PICKER */}
                {showIconPicker && (
                  <div
                    style={{
                      marginTop: 16,
                      padding: 14,
                      borderRadius: 14,
                      background: "hsla(0 0% 0% / .25)",
                      border: "1px solid var(--glass-border)",
                    }}
                  >
                    {/* Topic Tabs */}
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                      {ALL_ICON_TOPICS.map((topic) => (
                        <button
                          key={topic.id}
                          type="button"
                          onClick={() => setActiveIconGroup(topic.id)}
                          style={{
                            padding: "6px 12px",
                            borderRadius: 999,
                            fontSize: ".78rem",
                            border: "1px solid var(--glass-border)",
                            background: activeIconGroup === topic.id ? "var(--grad)" : "hsla(0 0% 100% / .06)",
                            color: activeIconGroup === topic.id ? "#fff" : "var(--text)",
                            cursor: "pointer",
                            fontWeight: activeIconGroup === topic.id ? 700 : 500,
                            transition: ".2s",
                          }}
                        >
                          {topic.name} ({topic.icons.length})
                        </button>
                      ))}
                    </div>

                    {/* Search inside Topic */}
                    <div style={{ marginBottom: 10 }}>
                      <input
                        value={iconSearch}
                        onChange={(e) => setIconSearch(e.target.value)}
                        placeholder={`🔍 Tìm icon trong nhóm "${currentGroupObj.name}"...`}
                        style={{ fontSize: ".8rem", padding: "6px 12px" }}
                      />
                    </div>

                    {/* Icons Grid (>= 30 icons per topic) */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(42px, 1fr))",
                        gap: 6,
                        maxHeight: 180,
                        overflowY: "auto",
                        padding: 4,
                      }}
                    >
                      {filteredIcons.map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setChannelForm({ ...channelForm, icon: item.icon });
                            toast.success(`Đã chọn icon: ${item.icon} (${item.label})`);
                          }}
                          style={{
                            width: "100%",
                            aspectRatio: "1",
                            fontSize: "1.4rem",
                            display: "grid",
                            placeItems: "center",
                            background: channelForm.icon === item.icon ? "hsla(262 90% 68% / .3)" : "hsla(0 0% 100% / .06)",
                            border: channelForm.icon === item.icon ? "2px solid var(--primary)" : "1px solid var(--glass-border)",
                            borderRadius: 10,
                            cursor: "pointer",
                            transition: ".15s",
                          }}
                          title={item.label}
                        >
                          {item.icon}
                        </button>
                      ))}

                      {filteredIcons.length === 0 && (
                        <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: 14, color: "var(--muted)", fontSize: ".82rem" }}>
                          Không tìm thấy icon phù hợp với &quot;{iconSearch}&quot;
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Title & Type */}
              <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 14 }}>
                <div className="field">
                  <label>Tiêu đề kênh liên hệ <span style={{ color: "var(--danger)" }}>*</span></label>
                  <input
                    required
                    value={channelForm.title}
                    onChange={(e) => setChannelForm({ ...channelForm, title: e.target.value })}
                    placeholder="Ví dụ: Email cá nhân, Zalo & Chat nhanh..."
                  />
                </div>

                <div className="field">
                  <label>Loại kênh (Type)</label>
                  <select
                    value={channelForm.type}
                    onChange={(e) => setChannelForm({ ...channelForm, type: e.target.value })}
                  >
                    <option value="email">✉️ Email (Gửi thư)</option>
                    <option value="phone">📱 Số điện thoại / Zalo</option>
                    <option value="link">🌐 Liên kết mạng xã hội / Web</option>
                    <option value="text">📝 Văn bản thuần</option>
                  </select>
                </div>
              </div>

              <div className="field">
                <label>Giá trị hiển thị trên thẻ</label>
                <input
                  value={channelForm.value}
                  onChange={(e) => setChannelForm({ ...channelForm, value: e.target.value })}
                  placeholder="Ví dụ: 0987.xxx.xxx, user@gmail.com, @username..."
                />
              </div>

              <div className="field">
                <label>Đường dẫn liên kết (Link URL / mailto / tel)</label>
                <input
                  value={channelForm.link}
                  onChange={(e) => setChannelForm({ ...channelForm, link: e.target.value })}
                  placeholder="Ví dụ: mailto:abc@gmail.com hoặc https://zalo.me/0987654321"
                />
              </div>

              <div className="field">
                <label>Mô tả / Phụ đề ngắn</label>
                <input
                  value={channelForm.subtitle}
                  onChange={(e) => setChannelForm({ ...channelForm, subtitle: e.target.value })}
                  placeholder="Ví dụ: Nhắn tin trao đổi nhanh, gửi thư trực tiếp..."
                />
              </div>

              <div style={{ display: "flex", gap: 20, margin: "16px 0 24px", flexWrap: "wrap" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: ".88rem" }}>
                  <input
                    type="checkbox"
                    checked={channelForm.allowCopy}
                    onChange={(e) => setChannelForm({ ...channelForm, allowCopy: e.target.checked })}
                    style={{ width: "auto" }}
                  />
                  Hiện nút sao chép nhanh (Copy to clipboard)
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: ".88rem" }}>
                  <input
                    type="checkbox"
                    checked={channelForm.enabled}
                    onChange={(e) => setChannelForm({ ...channelForm, enabled: e.target.checked })}
                    style={{ width: "auto" }}
                  />
                  Bật hiển thị kênh này trên website
                </label>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowChannelModal(false)}
                >
                  Hủy bỏ
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingChannel ? "Cập nhật kênh" : "Thêm vào danh sách"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL: THÊM / SỬA CÂU HỎI FAQ
          ==================================================================== */}
      {showFaqModal && (
        <div className="ai-modal-overlay" onClick={() => setShowFaqModal(false)}>
          <div
            className="ai-modal-container glass"
            style={{ width: "min(600px, 94%)", padding: 28, borderRadius: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <h3 style={{ fontSize: "1.25rem" }}>
                {editingFaq ? "✏️ Chỉnh sửa câu hỏi FAQ" : "➕ Thêm câu hỏi FAQ mới"}
              </h3>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setShowFaqModal(false)}
                style={{ padding: "4px 10px" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={saveFaqForm}>
              <div className="field">
                <label>Câu hỏi thắc mắc <span style={{ color: "var(--danger)" }}>*</span></label>
                <input
                  required
                  value={faqForm.question}
                  onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
                  placeholder="Ví dụ: Nền tảng ôn thi trắc nghiệm có mất phí không?"
                />
              </div>

              <div className="field">
                <label>Câu trả lời chi tiết <span style={{ color: "var(--danger)" }}>*</span></label>
                <textarea
                  required
                  rows={4}
                  value={faqForm.answer}
                  onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
                  placeholder="Nhập câu trả lời giải đáp rõ ràng cho người dùng..."
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowFaqModal(false)}
                >
                  Hủy bỏ
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingFaq ? "Cập nhật câu hỏi" : "Thêm vào FAQ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
