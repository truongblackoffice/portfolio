"use client";
import { useState } from "react";
import { saveItem, getProfile } from "@/lib/db";
import { seedProfile } from "@/lib/seed";
import useAsync from "@/lib/useAsync";
import { toast } from "@/lib/toast";

export default function Contact() {
  const { data: p } = useAsync(getProfile, [], "contact_profile", seedProfile);
  const profile = p || seedProfile;
  const socials = profile.socials || {};

  const adminEmail = socials.email || process.env.NEXT_PUBLIC_ADMIN_EMAIL || "pcrongvang@gmail.com";
  const githubUrl = socials.github || "https://github.com/truongblackoffice";
  const facebookUrl = socials.facebook || "";
  const linkedinUrl = socials.linkedin || "";

  const [f, setF] = useState({
    name: "",
    email: "",
    subject: "Hỏi đáp & Trao đổi ôn thi",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [st, setSt] = useState(null);
  const [copied, setCopied] = useState(false);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const handleCopyEmail = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(adminEmail);
      setCopied(true);
      toast.success("📋 Đã sao chép địa chỉ email vào bộ nhớ tạm!");
      setTimeout(() => setCopied(false), 2500);
    }
  };

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
          Liên hệ &amp; <span className="gradient-text">Trao đổi thông tin</span>
        </h1>
        <p className="muted" style={{ fontSize: "1.05rem", lineHeight: 1.65 }}>
          Bạn có thắc mắc về đề thi trắc nghiệm, muốn chia sẻ tài liệu học tập, góp ý bài viết hay đề xuất hợp tác lập trình? Đừng ngần ngại để lại lời nhắn hoặc kết nối trực tiếp qua các kênh bên dưới!
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

          {/* Email Direct */}
          <div className="card glass contact-method-card reveal" style={{ cursor: "default" }}>
            <div className="contact-method-icon" style={{ background: "hsla(262 90% 68% / .18)", borderColor: "hsla(262 90% 68% / .4)" }}>
              ✉️
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: ".8rem", color: "var(--muted)", fontWeight: 500 }}>Email cá nhân &amp; Quản trị</div>
              <b style={{ display: "block", fontSize: ".95rem", wordBreak: "break-all", margin: "2px 0 8px" }}>
                {adminEmail}
              </b>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <a href={`mailto:${adminEmail}`} className="btn btn-primary btn-sm" style={{ padding: "4px 12px", fontSize: ".78rem" }}>
                  Gửi thư ↗
                </a>
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="btn btn-ghost btn-sm"
                  style={{ padding: "4px 12px", fontSize: ".78rem" }}
                >
                  {copied ? "✓ Đã chép" : "📋 Sao chép"}
                </button>
              </div>
            </div>
          </div>

          {/* GitHub Channel */}
          <a
            href={githubUrl}
            target="_blank"
            rel="noreferrer"
            className="card glass contact-method-card reveal"
          >
            <div className="contact-method-icon" style={{ background: "hsla(190 95% 58% / .18)", borderColor: "hsla(190 95% 58% / .4)" }}>
              🐙
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: ".8rem", color: "var(--muted)", fontWeight: 500 }}>GitHub / Mã nguồn mở</div>
              <b style={{ display: "block", fontSize: ".95rem" }}>truongblackoffice</b>
              <span className="muted" style={{ fontSize: ".8rem" }}>Xem các dự án &amp; repositories công khai ↗</span>
            </div>
          </a>

          {/* Facebook / Messenger */}
          {facebookUrl ? (
            <a
              href={facebookUrl}
              target="_blank"
              rel="noreferrer"
              className="card glass contact-method-card reveal"
            >
              <div className="contact-method-icon" style={{ background: "hsla(220 90% 60% / .18)", borderColor: "hsla(220 90% 60% / .4)" }}>
                📘
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: ".8rem", color: "var(--muted)", fontWeight: 500 }}>Facebook / Messenger</div>
                <b style={{ display: "block", fontSize: ".95rem" }}>Trang cá nhân</b>
                <span className="muted" style={{ fontSize: ".8rem" }}>Nhắn tin trò chuyện trực tiếp ↗</span>
              </div>
            </a>
          ) : (
            <div className="card glass contact-method-card reveal" style={{ cursor: "default" }}>
              <div className="contact-method-icon" style={{ background: "hsla(220 90% 60% / .18)", borderColor: "hsla(220 90% 60% / .4)" }}>
                💬
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: ".8rem", color: "var(--muted)", fontWeight: 500 }}>Hỗ trợ nhanh</div>
                <b style={{ display: "block", fontSize: ".95rem" }}>Zalo &amp; Tin nhắn trực tiếp</b>
                <span className="muted" style={{ fontSize: ".8rem" }}>Liên hệ qua form bên cạnh để nhận phản hồi nhanh</span>
              </div>
            </div>
          )}

          {/* LinkedIn Channel */}
          {linkedinUrl && (
            <a
              href={linkedinUrl}
              target="_blank"
              rel="noreferrer"
              className="card glass contact-method-card reveal"
            >
              <div className="contact-method-icon" style={{ background: "hsla(200 95% 50% / .18)", borderColor: "hsla(200 95% 50% / .4)" }}>
                💼
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: ".8rem", color: "var(--muted)", fontWeight: 500 }}>Mạng lưới chuyên nghiệp</div>
                <b style={{ display: "block", fontSize: ".95rem" }}>LinkedIn Profile</b>
                <span className="muted" style={{ fontSize: ".8rem" }}>Kết nối cơ hội nghề nghiệp &amp; dự án ↗</span>
              </div>
            </a>
          )}

          {/* Response Commitment Box */}
          <div className="card glass reveal" style={{ padding: 22, marginTop: 24, borderRadius: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <span className="contact-badge">
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "hsl(150 70% 45%)", display: "inline-block" }} />
                Đang trực tuyến
              </span>
              <span className="muted" style={{ fontSize: ".78rem" }}>GMT+7 (Việt Nam)</span>
            </div>
            <p className="muted" style={{ fontSize: ".88rem", lineHeight: 1.6 }}>
              ⏱️ <b>Cam kết phản hồi:</b> Mình thường xuyên kiểm tra hòm thư và sẽ nỗ lực phản hồi mọi tin nhắn của bạn trong vòng <b>2 đến 6 giờ</b> làm việc.
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
                ⚠️ Gửi lời nhắn thất bại. Vui lòng kiểm tra lại kết nối mạng hoặc gửi thư trực tiếp đến {adminEmail}.
              </div>
            )}

            <div className="field">
              <label htmlFor="c-name">Họ và tên của bạn <span style={{ color: "var(--danger)" }}>*</span></label>
              <input
                id="c-name"
                required
                placeholder="Ví dụ: Nguyễn Văn A"
                value={f.name}
                onChange={set("name")}
              />
            </div>

            <div className="field">
              <label htmlFor="c-email">Địa chỉ Email phản hồi <span style={{ color: "var(--danger)" }}>*</span></label>
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
              <label htmlFor="c-msg">Nội dung chi tiết lời nhắn <span style={{ color: "var(--danger)" }}>*</span></label>
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
      <section className="section" style={{ marginTop: 20 }}>
        <div className="section-head" style={{ textAlign: "center", display: "block" }}>
          <span className="eyebrow glass" style={{ fontSize: ".8rem", padding: "4px 12px" }}>
            HỎI ĐÁP NHANH
          </span>
          <h2 style={{ marginTop: 8 }}>Câu hỏi thường gặp (FAQ)</h2>
        </div>

        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
          <div className="card glass contact-faq-item reveal">
            <h4>❓ Nền tảng ôn thi trắc nghiệm có mất phí không?</h4>
            <p>
              Hoàn toàn <b>miễn phí 100%</b>! Bạn có thể thoải mái ôn tập từng câu kèm giải thích, làm bài thi thử bấm giờ, xem bảng xếp hạng và nhận chứng chỉ hoàn thành mà không phải trả bất kỳ chi phí nào.
            </p>
          </div>

          <div className="card glass contact-faq-item reveal">
            <h4>🤖 Trợ lý AI tạo đề thi hoạt động như thế nào?</h4>
            <p>
              Hệ thống tích hợp mô hình <b>Google Gemini AI</b> tiên tiến, có khả năng tự động đọc hiểu tài liệu Word (.docx), PowerPoint (.pptx), PDF để tạo hàng trăm câu hỏi trắc nghiệm chuẩn xác theo từng cấp độ khó.
            </p>
          </div>

          <div className="card glass contact-faq-item reveal">
            <h4>📚 Tôi có thể đóng góp tài liệu hoặc câu hỏi không?</h4>
            <p>
              Rất hoan nghênh! Bạn có thể gửi thông tin qua biểu mẫu liên hệ ở trên hoặc email trực tiếp. Mình sẽ kiểm duyệt, gắn tag tên tác giả/người đóng góp và xuất bản lên kho tài liệu công khai.
            </p>
          </div>

          <div className="card glass contact-faq-item reveal">
            <h4>⏱️ Sau bao lâu tôi sẽ nhận được email phản hồi?</h4>
            <p>
              Mọi tin nhắn gửi qua biểu mẫu đều được thông báo tức thì đến quản trị viên. Bạn sẽ nhận được email phản hồi chi tiết trong vòng <b>2 đến 6 giờ</b> làm việc.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
