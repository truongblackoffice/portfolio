"use client";
import { useState } from "react";
import { saveItem, getProfile } from "@/lib/db";
import { seedProfile, defaultContactConfig } from "@/lib/seed";
import { renderIcon } from "@/lib/presets";
import CustomSelect from "@/components/CustomSelect";
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
  const [activeMenu, setActiveMenu] = useState(null); // id of channel whose panel is open

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const handleCopyText = (text) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      toast.success("📋 Đã sao chép vào bộ nhớ tạm!");
    }
    setActiveMenu(null);
  };

  /** Build contextual action list for each channel type based on admin config */
  function getChannelActions(ch) {
    const actions = [];
    const rawEmail = ch.link?.replace("mailto:", "").trim() || ch.value?.trim();
    const rawPhone = ch.link?.replace("tel:", "").trim() || ch.value?.trim();
    const opts = ch.actionOptions || {};

    if (ch.type === "email" && rawEmail) {
      if (opts.gmail !== false) {
        actions.push({
          icon: "https://api.iconify.design/simple-icons/gmail.svg?color=%23ea4335",
          label: "Gửi qua Gmail",
          href: `https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(rawEmail)}`,
          target: "_blank",
        });
      }
      if (opts.outlook !== false) {
        actions.push({
          icon: "https://api.iconify.design/simple-icons/microsoftoutlook.svg?color=%230078d4",
          label: "Gửi qua Outlook",
          href: `https://outlook.live.com/mail/0/deeplink/compose?to=${encodeURIComponent(rawEmail)}`,
          target: "_blank",
        });
      }
      if (opts.yahoo !== false) {
        actions.push({
          icon: "https://api.iconify.design/simple-icons/yahoo.svg?color=%236001d2",
          label: "Gửi qua Yahoo Mail",
          href: `https://compose.mail.yahoo.com/?to=${encodeURIComponent(rawEmail)}`,
          target: "_blank",
        });
      }
      if (opts.mailApp !== false) {
        actions.push({
          icon: "https://api.iconify.design/lucide/mail.svg?color=%238b5cf6",
          label: "Mở ứng dụng mail mặc định",
          href: ch.link || `mailto:${rawEmail}`,
          target: "_self",
        });
      }
      if (opts.copyEmail !== false) {
        actions.push({
          icon: "https://api.iconify.design/lucide/copy.svg?color=%2306b6d4",
          label: "Sao chép địa chỉ email",
          copy: rawEmail,
        });
      }
    } else if (ch.type === "phone") {
      if (rawPhone) {
        if (opts.zalo !== false) {
          actions.push({
            icon: "https://api.iconify.design/simple-icons/zalo.svg?color=%230068ff",
            label: "Mở Zalo nhắn tin",
            href: `https://zalo.me/${rawPhone.replace(/\D/g, "")}`,
            target: "_blank",
          });
        }
        if (opts.call !== false) {
          actions.push({
            icon: "https://api.iconify.design/lucide/phone-call.svg?color=%2310b981",
            label: "Gọi điện thoại",
            href: `tel:${rawPhone.replace(/\s/g, "")}`,
            target: "_self",
          });
        }
        if (opts.copyPhone !== false) {
          actions.push({
            icon: "https://api.iconify.design/lucide/copy.svg?color=%2306b6d4",
            label: "Sao chép số điện thoại",
            copy: rawPhone,
          });
        }
      }
    } else if (ch.link) {
      if (opts.openLink !== false) {
        actions.push({
          icon: "https://api.iconify.design/lucide/external-link.svg?color=%238b5cf6",
          label: "Mở liên kết",
          href: ch.link,
          target: "_blank",
        });
      }

      // Kiểm tra có copy text hiển thị không:
      // Không copy nếu opts.copyValue === false hoặc nếu là các cụm từ tĩnh vô nghĩa (như "Nhắn tin qua Zalo", "Trang cá nhân")
      const staticLabels = ["nhắn tin qua zalo", "trang cá nhân", "liên hệ trực tiếp", "kết nối ngay"];
      const isStaticLabel = staticLabels.includes(String(ch.value || "").toLowerCase().trim());
      const shouldCopyValue = opts.copyValue !== undefined
        ? opts.copyValue === true
        : (ch.allowCopy === true && !isStaticLabel);

      if (shouldCopyValue && ch.value) {
        actions.push({
          icon: "https://api.iconify.design/lucide/copy.svg?color=%2306b6d4",
          label: `Sao chép "${ch.value}"`,
          copy: ch.value,
        });
      }

      if (opts.copyLink !== false) {
        actions.push({
          icon: "https://api.iconify.design/lucide/link.svg?color=%2364748b",
          label: "Sao chép URL",
          copy: ch.link,
        });
      }
    }

    // Custom actions nếu quản trị viên tạo thêm
    if (Array.isArray(ch.customActions)) {
      ch.customActions.forEach((ca) => {
        if (ca && ca.enabled !== false && ca.label) {
          actions.push({
            icon: ca.icon || "https://api.iconify.design/lucide/link.svg?color=%238b5cf6",
            label: ca.label,
            href: ca.href || undefined,
            copy: ca.copy || undefined,
            target: ca.href?.startsWith("mailto:") || ca.href?.startsWith("tel:") ? "_self" : "_blank",
          });
        }
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
          {channels.map((ch) => {
            const actions = getChannelActions(ch);
            const hasActions = actions.length > 0;
            const isOpen = activeMenu === ch.id;
            const isClickable = hasActions || Boolean(ch.link);

            const handleCardClick = () => {
              if (hasActions) {
                setActiveMenu(isOpen ? null : ch.id);
              } else if (ch.link) {
                if (ch.link.startsWith("mailto:") || ch.link.startsWith("tel:")) {
                  window.location.href = ch.link;
                } else {
                  window.open(ch.link, "_blank", "noopener,noreferrer");
                }
              }
            };

            return (
              <div key={ch.id} className="contact-channel-wrapper reveal">
                {/* Main card row — click to toggle accordion or open link directly */}
                <div
                  className={`card glass contact-method-card ${isClickable ? "contact-method-clickable" : ""} ${isOpen ? "contact-method-open" : ""}`}
                  style={{ marginBottom: 0 }}
                  onClick={handleCardClick}
                  role={isClickable ? "button" : undefined}
                  tabIndex={isClickable ? 0 : undefined}
                  onKeyDown={(e) => {
                    if (isClickable && (e.key === "Enter" || e.key === " ")) {
                      e.preventDefault();
                      handleCardClick();
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
                    <b style={{ display: "block", fontSize: ".95rem", wordBreak: "break-all", margin: "2px 0 2px" }}>
                      {ch.value || ch.link || "Liên hệ trực tiếp"}
                    </b>
                    {ch.subtitle && (
                      <div className="muted" style={{ fontSize: ".78rem" }}>{ch.subtitle}</div>
                    )}
                  </div>

                  {/* Chevron hint */}
                  {hasActions && (
                    <div
                      style={{
                        flexShrink: 0,
                        width: 26,
                        height: 26,
                        display: "grid",
                        placeItems: "center",
                        borderRadius: 8,
                        background: isOpen ? "hsla(262 90% 68% / .25)" : "hsla(0 0% 100% / .06)",
                        color: isOpen ? "var(--primary)" : "var(--muted)",
                        fontSize: "1rem",
                        transition: "all .2s",
                        transform: isOpen ? "rotate(180deg)" : "none",
                      }}
                    >
                      ⌃
                    </div>
                  )}
                </div>

                {/* Inline expanded action panel — pushes siblings down naturally */}
                {isOpen && (
                  <div className="contact-action-panel glass" onClick={(e) => e.stopPropagation()}>
                    <div style={{ fontSize: ".7rem", fontWeight: 700, color: "var(--muted)", letterSpacing: ".08em", marginBottom: 8, textTransform: "uppercase" }}>
                      Chọn hành động
                    </div>
                    <div className="contact-action-grid">
                      {actions.map((action, i) => {
                        if (action.copy) {
                          return (
                            <button
                              key={i}
                              type="button"
                              className="contact-action-item"
                              onClick={() => handleCopyText(action.copy)}
                            >
                              <span className="contact-action-icon">
                                {renderIcon(action.icon, "📋", { width: 20, height: 20 })}
                              </span>
                              <span className="contact-action-label">{action.label}</span>
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
                            <span className="contact-action-icon">
                              {renderIcon(action.icon, "🔗", { width: 20, height: 20 })}
                            </span>
                            <span className="contact-action-label">{action.label}</span>
                            <span style={{ marginLeft: "auto", opacity: .4, fontSize: ".7rem", flexShrink: 0 }}>↗</span>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

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
              <CustomSelect
                id="c-subject"
                value={f.subject}
                onChange={(val) => setF({ ...f, subject: val })}
                options={[
                  { value: "Hỏi đáp & Trao đổi ôn thi", label: "Hỏi đáp & Trao đổi ôn thi trắc nghiệm", icon: "🧠" },
                  { value: "Đóng góp câu hỏi & Tài liệu", label: "Đóng góp câu hỏi đề thi & Chia sẻ tài liệu", icon: "📚" },
                  { value: "Góp ý bài viết blog công nghệ", label: "Góp ý bài viết blog công nghệ", icon: "✍️" },
                  { value: "Báo lỗi website hoặc tính năng AI", label: "Báo lỗi hệ thống hoặc tính năng AI Quiz", icon: "🐛" },
                  { value: "Đề xuất hợp tác dự án lập trình", label: "Đề xuất hợp tác phát triển phần mềm / dự án", icon: "🤝" },
                  { value: "Khác", label: "Chủ đề khác", icon: "💡" },
                ]}
              />
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
