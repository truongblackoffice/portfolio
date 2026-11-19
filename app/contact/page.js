"use client";
import { useState, useRef, useEffect } from "react";
import { saveItem, getProfile } from "@/lib/db";
import { seedProfile, defaultContactConfig } from "@/lib/seed";
import { renderIcon } from "@/lib/presets";
import useAsync from "@/lib/useAsync";
import { toast } from "@/lib/toast";

export default function Contact() {
  const { data: p } = useAsync(getProfile, [], "contact_profile", seedProfile);
  const profile = p || seedProfile;
  const config = profile.contactConfig || defaultContactConfig;
  const channels = (config.channels || defaultContactConfig.channels).filter((c) => c.enabled !== false);
  const faqs = config.faqs || defaultContactConfig.faqs;

  const [f, setF] = useState({
    name: "",
    email: "",
    subject: "Hỏi đáp & Trao đổi ôn thi",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [st, setSt] = useState(null);
  const [activeMenu, setActiveMenu] = useState(null); // id of channel whose popup is open
  const menuRef = useRef(null);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  // Close popup when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActiveMenu(null);
      }
    }
    if (activeMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeMenu]);

  const handleCopyText = (text) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      toast.success("📋 Đã sao chép vào bộ nhớ tạm!");
    }
    setActiveMenu(null);
  };

  /** Build contextual action list for each channel type */
  function getChannelActions(ch) {
    const actions = [];
    const rawEmail = ch.link?.replace("mailto:", "").trim() || ch.value?.trim();
    const rawPhone = ch.link?.replace("tel:", "").trim() || ch.value?.trim();

    if (ch.type === "email" && rawEmail) {
      actions.push({
        icon: "https://api.iconify.design/simple-icons/gmail.svg?color=%23ea4335",
        label: "Gửi qua Gmail",
        href: `https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(rawEmail)}`,
        target: "_blank",
      });
      actions.push({
        icon: "https://api.iconify.design/simple-icons/microsoftoutlook.svg?color=%230078d4",
        label: "Gửi qua Outlook",
        href: `https://outlook.live.com/mail/0/deeplink/compose?to=${encodeURIComponent(rawEmail)}`,
        target: "_blank",
      });
      actions.push({
        icon: "https://api.iconify.design/simple-icons/yahoo.svg?color=%236001d2",
        label: "Gửi qua Yahoo Mail",
        href: `https://compose.mail.yahoo.com/?to=${encodeURIComponent(rawEmail)}`,
        target: "_blank",
      });
      actions.push({
        icon: "https://api.iconify.design/lucide/mail.svg?color=%238b5cf6",
        label: "Mở ứng dụng mail mặc định",
        href: ch.link || `mailto:${rawEmail}`,
        target: "_self",
      });
      actions.push({
        icon: "https://api.iconify.design/lucide/copy.svg?color=%2306b6d4",
        label: `Sao chép địa chỉ email`,
        copy: rawEmail,
      });
    } else if (ch.type === "phone") {
      if (rawPhone) {
        actions.push({
          icon: "https://api.iconify.design/simple-icons/zalo.svg?color=%230068ff",
          label: "Mở Zalo nhắn tin",
          href: `https://zalo.me/${rawPhone.replace(/\D/g, "")}`,
          target: "_blank",
        });
        actions.push({
          icon: "https://api.iconify.design/lucide/phone-call.svg?color=%2310b981",
          label: "Gọi điện thoại",
          href: `tel:${rawPhone.replace(/\s/g, "")}`,
          target: "_self",
        });
        actions.push({
          icon: "https://api.iconify.design/lucide/copy.svg?color=%2306b6d4",
          label: "Sao chép số điện thoại",
          copy: rawPhone,
        });
      }
    } else if (ch.link) {
      actions.push({
        icon: "https://api.iconify.design/lucide/external-link.svg?color=%238b5cf6",
        label: "Mở liên kết",
        href: ch.link,
        target: "_blank",
      });
      if (ch.value) {
        actions.push({
          icon: "https://api.iconify.design/lucide/copy.svg?color=%2306b6d4",
          label: `Sao chép "${ch.value}"`,
          copy: ch.value,
        });
      }
      actions.push({
        icon: "https://api.iconify.design/lucide/link.svg?color=%2364748b",
        label: "Sao chép URL",
        copy: ch.link,
      });
    }
    return actions;
  }

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setSt(null);
    try {
      await saveItem("messages", {
        ...f,
        createdAt: Date.now(),
      });
      setSt("ok");
      toast.success("🎉 Gửi tin nhắn thành công! Cảm ơn bạn.");
      setF({ name: "", email: "", subject: "Hỏi đáp & Trao đổi ôn thi", message: "" });
    } catch (err) {
      console.error(err);
      setSt("err");
      toast.error("Gửi tin nhắn thất bại. Vui lòng thử lại hoặc gửi email trực tiếp.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container section">
      {/* Header */}
      <div style={{ textAlign: "center", maxWidth: 760, margin: "0 auto 48px" }}>
        <span className="eyebrow glass" style={{ fontSize: ".82rem", padding: "6px 16px" }}>
          📬 KẾT NỐI VỚI MÌNH
        </span>
        <h1 style={{ fontSize: "clamp(2.2rem, 4.5vw, 3.2rem)", margin: "14px 0 16px" }}>
          {config.headline || "Liên hệ & Trao đổi thông tin"}
        </h1>
        <p className="muted" style={{ fontSize: "1.05rem", lineHeight: 1.65 }}>
          {config.subheadline ||
            "Bạn có thắc mắc về đề thi trắc nghiệm, muốn chia sẻ tài liệu học tập, góp ý bài viết hay đề xuất hợp tác lập trình? Đừng ngần ngại để lại lời nhắn hoặc kết nối trực tiếp qua các kênh bên dưới!"}
        </p>
      </div>

      {/* 2-Column Contact Grid */}
      <div className="contact-grid">
        {/* ====================================================================
            LEFT COLUMN: DIRECT CONTACT CHANNELS
            ==================================================================== */}
        <div>
          <h2 style={{ fontSize: "1.4rem", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
            <span>⚡</span> Kênh liên hệ trực tiếp
          </h2>

          {/* Dynamic Channels */}
          <div ref={menuRef} style={{ position: "relative" }}>
          {channels.map((ch) => {
            const actions = getChannelActions(ch);
            const hasActions = actions.length > 0;
            const isOpen = activeMenu === ch.id;

            return (
              <div
                key={ch.id}
                className={`card glass contact-method-card reveal ${hasActions ? "contact-method-clickable" : ""}`}
                style={{ cursor: hasActions ? "pointer" : "default", position: "relative" }}
                onClick={() => {
                  if (hasActions) setActiveMenu(isOpen ? null : ch.id);
                }}
                role={hasActions ? "button" : undefined}
                tabIndex={hasActions ? 0 : undefined}
                onKeyDown={(e) => {
                  if (hasActions && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    setActiveMenu(isOpen ? null : ch.id);
                  }
                  if (e.key === "Escape") setActiveMenu(null);
                }}
              >
                <div
                  className="contact-method-icon"
                  style={{
                    background: isOpen ? "hsla(262 90% 68% / .30)" : "hsla(262 90% 68% / .18)",
                    borderColor: isOpen ? "var(--primary)" : "hsla(262 90% 68% / .4)",
                    transition: "all .2s",
                  }}
                >
                  {renderIcon(ch.icon, "💬", { width: 28, height: 28 })}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: ".8rem", color: "var(--muted)", fontWeight: 500 }}>
                    {ch.title}
                  </div>
                  <b
                    style={{
                      display: "block",
                      fontSize: ".95rem",
                      wordBreak: "break-all",
                      margin: "2px 0 4px",
                    }}
                  >
                    {ch.value || ch.link || "Liên hệ trực tiếp"}
                  </b>
                  {ch.subtitle && (
                    <div className="muted" style={{ fontSize: ".78rem" }}>
                      {ch.subtitle}
                    </div>
                  )}
                </div>

                {/* Hint arrow */}
                {hasActions && (
                  <div
                    style={{
                      flexShrink: 0,
                      color: "var(--muted)",
                      fontSize: ".8rem",
                      transition: "transform .2s",
                      transform: isOpen ? "rotate(180deg)" : "none",
                    }}
                  >
                    ▾
                  </div>
                )}

                {/* Contextual Action Popup */}
                {isOpen && (
                  <div
                    className="contact-action-popup glass"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div style={{ fontSize: ".74rem", fontWeight: 700, color: "var(--muted)", letterSpacing: ".05em", padding: "4px 12px 8px", textTransform: "uppercase" }}>
                      Chọn hành động
                    </div>
                    {actions.map((action, i) => {
                      if (action.copy) {
                        return (
                          <button
                            key={i}
                            type="button"
                            className="contact-action-item"
                            onClick={() => handleCopyText(action.copy)}
                          >
                            <span style={{ width: 20, height: 20, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              {renderIcon(action.icon, "📋", { width: 18, height: 18 })}
                            </span>
                            <span>{action.label}</span>
                          </button>
                        );
                      }
                      return (
                        <a
                          key={i}
                          href={action.href}
                          target={action.target || "_blank"}
                          rel="noreferrer"
                          className="contact-action-item"
                          onClick={() => setActiveMenu(null)}
                        >
                          <span style={{ width: 20, height: 20, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            {renderIcon(action.icon, "🔗", { width: 18, height: 18 })}
                          </span>
                          <span>{action.label}</span>
                          <span style={{ marginLeft: "auto", opacity: .4, fontSize: ".7rem" }}>↗</span>
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
          </div>

          {channels.length === 0 && (
            <div className="empty" style={{ padding: 20 }}>
              Chưa có kênh liên hệ nào được cấu hình.
            </div>
          )}

          {/* Response Commitment Box */}
          <div className="card glass reveal" style={{ padding: 22, marginTop: 24, borderRadius: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <span className="contact-badge">
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "hsl(150 70% 45%)",
                    display: "inline-block",
                  }}
                />
                {config.statusText || "Đang trực tuyến"}
              </span>
              <span className="muted" style={{ fontSize: ".78rem" }}>
                {config.locationText || "GMT+7 (Việt Nam)"}
              </span>
            </div>
            <p className="muted" style={{ fontSize: ".88rem", lineHeight: 1.6 }}>
              ⏱️ <b>Cam kết phản hồi:</b>{" "}
              {config.responseTime ||
                "Mình thường xuyên kiểm tra hòm thư và sẽ nỗ lực phản hồi mọi tin nhắn của bạn trong vòng 2 đến 6 giờ làm việc."}
            </p>
          </div>
        </div>

        {/* ====================================================================
            RIGHT COLUMN: INTERACTIVE CONTACT FORM
            ==================================================================== */}
        <div>
          <form className="glass reveal" onSubmit={submit} id="contact-form" style={{ padding: 32, borderRadius: 20 }}>
            <h2 style={{ fontSize: "1.4rem", marginBottom: 8 }}>Gửi tin nhắn trực tiếp</h2>
            <p className="muted" style={{ fontSize: ".9rem", marginBottom: 24 }}>
              Điền thông tin vào biểu mẫu dưới đây, tin nhắn sẽ được lưu trữ an toàn và chuyển tiếp ngay tới quản trị viên.
            </p>

            {st === "ok" && (
              <div className="msg ok" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: "1.4rem" }}>🎉</span>
                <div>
                  <b>Đã gửi thành công!</b>
                  <div style={{ fontSize: ".85rem" }}>Cảm ơn bạn đã liên hệ, mình sẽ phản hồi lại sớm nhất qua email.</div>
                </div>
              </div>
            )}

            {st === "err" && (
              <div className="msg err">
                ⚠️ Gửi lời nhắn thất bại. Vui lòng kiểm tra lại kết nối mạng hoặc thử lại sau.
              </div>
            )}

            <div className="field">
              <label htmlFor="c-name">
                Họ và tên của bạn <span style={{ color: "var(--danger)" }}>*</span>
              </label>
              <input
                id="c-name"
                required
                placeholder="Ví dụ: Nguyễn Văn A"
                value={f.name}
                onChange={set("name")}
              />
            </div>

            <div className="field">
              <label htmlFor="c-email">
                Địa chỉ Email phản hồi <span style={{ color: "var(--danger)" }}>*</span>
              </label>
              <input
                id="c-email"
                type="email"
                required
                placeholder="tenban@gmail.com"
                value={f.email}
                onChange={set("email")}
              />
            </div>

            <div className="field">
              <label htmlFor="c-subject">Chủ đề trao đổi</label>
              <select id="c-subject" value={f.subject} onChange={set("subject")}>
                <option value="Hỏi đáp & Trao đổi ôn thi">🧠 Hỏi đáp &amp; Trao đổi ôn thi trắc nghiệm</option>
                <option value="Đóng góp câu hỏi & Tài liệu">📚 Đóng góp câu hỏi đề thi &amp; Chia sẻ tài liệu</option>
                <option value="Góp ý bài viết blog công nghệ">✍️ Góp ý bài viết blog công nghệ</option>
                <option value="Báo lỗi website hoặc tính năng AI">🐛 Báo lỗi hệ thống hoặc tính năng AI Quiz</option>
                <option value="Đề xuất hợp tác dự án lập trình">🤝 Đề xuất hợp tác phát triển phần mềm / dự án</option>
                <option value="Khác">💡 Chủ đề khác</option>
              </select>
            </div>

            <div className="field">
              <label htmlFor="c-msg">
                Nội dung chi tiết lời nhắn <span style={{ color: "var(--danger)" }}>*</span>
              </label>
              <textarea
                id="c-msg"
                required
                rows={5}
                placeholder="Nhập nội dung bạn muốn chia sẻ hoặc câu hỏi cần giải đáp tại đây..."
                value={f.message}
                onChange={set("message")}
              />
            </div>

            <button
              className="btn btn-primary"
              type="submit"
              id="c-submit"
              disabled={loading}
              style={{ width: "100%", justifyContent: "center", padding: "14px", marginTop: 8 }}
            >
              {loading ? (
                <>
                  <span className="spinner" style={{ width: 18, height: 18 }} />
                  Đang gửi tin nhắn...
                </>
              ) : (
                "🚀 Gửi tin nhắn ngay"
              )}
            </button>
          </form>
        </div>
      </div>

      {/* ====================================================================
          BOTTOM SECTION: FREQUENTLY ASKED QUESTIONS (FAQ)
          ==================================================================== */}
      {faqs && faqs.length > 0 && (
        <section className="section" style={{ marginTop: 20 }}>
          <div className="section-head" style={{ textAlign: "center", display: "block" }}>
            <span className="eyebrow glass" style={{ fontSize: ".8rem", padding: "4px 12px" }}>
              HỎI ĐÁP NHANH
            </span>
            <h2 style={{ marginTop: 8 }}>Câu hỏi thường gặp (FAQ)</h2>
          </div>

          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
            {faqs.map((faq) => (
              <div key={faq.id} className="card glass contact-faq-item reveal">
                <h4>{faq.question}</h4>
                <p>{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
