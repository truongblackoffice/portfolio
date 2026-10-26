"use client";
import { useState, useEffect } from "react";
import { useSite, defaultSecurity } from "@/lib/SiteContext";
import { getProfile, saveProfile } from "@/lib/db";
import { toast } from "@/lib/toast";

export default function AdminSecurity() {
  const { site, refresh } = useSite();
  const [f, setF] = useState(() => ({
    ...defaultSecurity,
    ...(site?.security || {}),
  }));
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState("");

  const [prevSec, setPrevSec] = useState(site?.security);
  if (site?.security !== prevSec) {
    setPrevSec(site?.security);
    setF({
      ...defaultSecurity,
      ...(site?.security || {}),
    });
  }

  const toggle = (k) => {
    setOk(false);
    setF((prev) => ({ ...prev, [k]: !prev[k] }));
  };

  const setText = (k) => (e) => {
    setOk(false);
    setF((prev) => ({ ...prev, [k]: e.target.value }));
  };

  const applyPreset = (presetName) => {
    setOk(false);
    if (presetName === "max") {
      setF((prev) => ({
        ...prev,
        disableRegistration: true,
        blockConsole: true,
        blockDevTools: true,
        blockViewSource: true,
        blockContextMenu: true,
        blockCopyText: true,
        blockSelectText: true,
        antiDebugger: true,
        adminBypass: true,
        notifyOnViolation: true,
      }));
      toast.info("Đã áp dụng cấu hình Bảo vệ Tối đa.");
    } else if (presetName === "balanced") {
      setF((prev) => ({
        ...prev,
        disableRegistration: false,
        blockConsole: true,
        blockDevTools: true,
        blockViewSource: true,
        blockContextMenu: true,
        blockCopyText: false,
        blockSelectText: false,
        antiDebugger: false,
        adminBypass: true,
        notifyOnViolation: true,
      }));
      toast.info("Đã áp dụng cấu hình Tiêu chuẩn (Khuyên dùng).");
    } else if (presetName === "dev") {
      setF((prev) => ({
        ...prev,
        disableRegistration: false,
        blockConsole: false,
        blockDevTools: false,
        blockViewSource: false,
        blockContextMenu: false,
        blockCopyText: false,
        blockSelectText: false,
        antiDebugger: false,
        adminBypass: true,
        notifyOnViolation: false,
      }));
      toast.info("Đã tắt toàn bộ tính năng bảo vệ (Chế độ phát triển).");
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    setOk(false);
    try {
      const p = await getProfile();
      const updatedSite = {
        ...(p?.site || {}),
        security: f,
      };
      await saveProfile({ ...p, site: updatedSite });
      await refresh();
      setOk(true);
      toast.success("Đã cập nhật cấu hình bảo mật website thành công!");
    } catch (x) {
      setErr("Lỗi khi lưu cấu hình bảo mật: " + x.message);
      toast.error("Không thể lưu cấu hình bảo mật.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="form-card glass" style={{ maxWidth: 880 }} onSubmit={submit} id="security-settings-form">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: "0 0 6px", display: "flex", alignItems: "center", gap: 10 }}>
            <span>🛡️</span> Trung tâm Bảo mật &amp; Bảo vệ Website
          </h2>
          <p className="muted" style={{ margin: 0, fontSize: ".9rem" }}>
            Tùy biến các lớp bảo vệ chống soi mã nguồn, chặn console, chống copy nội dung và quản lý quyền đăng ký.
          </p>
        </div>
      </div>

      {ok && <div className="msg ok">✅ Đã lưu cấu hình bảo mật và kích hoạt thành công trên toàn hệ thống!</div>}
      {err && <div className="msg err">{err}</div>}

      {/* Preset Buttons */}
      <div
        style={{
          background: "rgba(139, 92, 246, 0.06)",
          border: "1px solid rgba(139, 92, 246, 0.2)",
          borderRadius: 14,
          padding: "16px 18px",
          marginBottom: 24,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <span style={{ fontWeight: 700, fontSize: ".92rem", display: "flex", alignItems: "center", gap: 6 }}>
            ⚡ Thiết lập nhanh theo kịch bản mẫu:
          </span>
          <span className="muted" style={{ fontSize: ".8rem" }}>
            Bấm chọn để kích hoạt ngay một bộ thiết lập tối ưu
          </span>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => applyPreset("balanced")}
            style={{ borderRadius: 8, borderColor: "rgba(59, 130, 246, 0.4)", background: "rgba(59, 130, 246, 0.1)" }}
          >
            ⚖️ Tiêu chuẩn (Khuyên dùng)
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => applyPreset("max")}
            style={{ borderRadius: 8, borderColor: "rgba(239, 68, 68, 0.4)", background: "rgba(239, 68, 68, 0.1)" }}
          >
            🛡️ Bảo vệ tối đa (Chống sao chép triệt để)
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => applyPreset("dev")}
            style={{ borderRadius: 8, borderColor: "rgba(107, 114, 128, 0.4)" }}
          >
            🔓 Tắt bảo vệ (Dành cho Lập trình viên)
          </button>
        </div>
      </div>

      {/* 1. ĐĂNG KÝ TÀI KHOẢN */}
      <div style={{ marginBottom: 28 }}>
        <h3 style={{ margin: "0 0 14px", borderBottom: "1px solid var(--border)", paddingBottom: 8, fontSize: "1.05rem" }}>
          1. 🔒 Quản lý Đăng ký thành viên mới
        </h3>
        <div
          style={{
            display: "grid",
            gap: 14,
            padding: 16,
            background: f.disableRegistration ? "rgba(239, 68, 68, 0.05)" : "rgba(34, 197, 94, 0.05)",
            border: `1px solid ${f.disableRegistration ? "rgba(239, 68, 68, 0.25)" : "rgba(34, 197, 94, 0.25)"}`,
            borderRadius: 12,
            transition: "all .2s ease",
          }}
        >
          <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", userSelect: "none" }}>
            <input
              type="checkbox"
              checked={Boolean(f.disableRegistration)}
              onChange={() => toggle("disableRegistration")}
              style={{ width: 18, height: 18, cursor: "pointer", accentColor: "#ef4444" }}
            />
            <div>
              <b style={{ color: f.disableRegistration ? "#ef4444" : "var(--fg)" }}>
                {f.disableRegistration ? "⛔ Đang KHÓA đăng ký thành viên mới" : "✅ Đang MỞ cho phép đăng ký thành viên"}
              </b>
              <div className="muted" style={{ fontSize: ".82rem", marginTop: 2 }}>
                Khi bật cờ này, khách truy cập sẽ không thể tạo tài khoản mới qua Form đăng ký hay qua Google Sign-In. Tài khoản thành viên cũ vẫn đăng nhập bình thường.
              </div>
            </div>
          </label>

          {f.disableRegistration && (
            <div className="field" style={{ margin: 0, paddingTop: 8, borderTop: "1px dashed rgba(239, 68, 68, 0.2)" }}>
              <label style={{ fontSize: ".85rem" }}>Lời nhắn thông báo khi người dùng bấm vào Đăng ký:</label>
              <textarea
                rows={2}
                value={f.registrationCloseMessage || ""}
                onChange={setText("registrationCloseMessage")}
                placeholder="Nhập lý do hoặc hướng dẫn liên hệ..."
                style={{ fontSize: ".88rem", resize: "vertical" }}
              />
            </div>
          )}
        </div>
      </div>

      {/* 2. CONSOLE & DEVTOOLS */}
      <div style={{ marginBottom: 28 }}>
        <h3 style={{ margin: "0 0 14px", borderBottom: "1px solid var(--border)", paddingBottom: 8, fontSize: "1.05rem" }}>
          2. 🚫 Bảo vệ Console &amp; Chống mở DevTools
        </h3>
        <div style={{ display: "grid", gap: 12 }}>
          {/* Chặn console */}
          <div
            style={{
              padding: 14,
              borderRadius: 10,
              background: "hsla(0 0% 100% / .02)",
              border: "1px solid var(--border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div>
              <b>Chặn &amp; vô hiệu hóa Console trình duyệt (`blockConsole`)</b>
              <div className="muted" style={{ fontSize: ".82rem", marginTop: 2 }}>
                Ghi đè tất cả các lệnh <code>console.log</code>, <code>warn</code>, <code>error</code>, <code>dir</code>... và tự động làm sạch console để tránh lộ thông tin và dữ liệu API.
              </div>
            </div>
            <input
              type="checkbox"
              checked={Boolean(f.blockConsole)}
              onChange={() => toggle("blockConsole")}
              style={{ width: 18, height: 18, cursor: "pointer", flexShrink: 0 }}
            />
          </div>

          {/* Chặn phím tắt F12 */}
          <div
            style={{
              padding: 14,
              borderRadius: 10,
              background: "hsla(0 0% 100% / .02)",
              border: "1px solid var(--border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div>
              <b>Chặn phím tắt mở DevTools &amp; Inspect (`blockDevTools`)</b>
              <div className="muted" style={{ fontSize: ".82rem", marginTop: 2 }}>
                Vô hiệu hóa phím <b>F12</b> và các tổ hợp phím kiểm tra phần tử: <b>Ctrl+Shift+I</b>, <b>Ctrl+Shift+J</b>, <b>Ctrl+Shift+C</b>, <b>Ctrl+Shift+K</b>.
              </div>
            </div>
            <input
              type="checkbox"
              checked={Boolean(f.blockDevTools)}
              onChange={() => toggle("blockDevTools")}
              style={{ width: 18, height: 18, cursor: "pointer", flexShrink: 0 }}
            />
          </div>

          {/* Chặn xem nguồn trang */}
          <div
            style={{
              padding: 14,
              borderRadius: 10,
              background: "hsla(0 0% 100% / .02)",
              border: "1px solid var(--border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div>
              <b>Chặn xem mã nguồn &amp; Lưu trang (`blockViewSource`)</b>
              <div className="muted" style={{ fontSize: ".82rem", marginTop: 2 }}>
                Vô hiệu hóa phím tắt <b>Ctrl+U</b> (Xem nguồn trang web) và <b>Ctrl+S</b> (Lưu tệp trang về máy tính).
              </div>
            </div>
            <input
              type="checkbox"
              checked={Boolean(f.blockViewSource)}
              onChange={() => toggle("blockViewSource")}
              style={{ width: 18, height: 18, cursor: "pointer", flexShrink: 0 }}
            />
          </div>

          {/* Bẫy debugger */}
          <div
            style={{
              padding: 14,
              borderRadius: 10,
              background: "hsla(0 0% 100% / .02)",
              border: "1px solid var(--border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div>
              <b>Bẫy đóng băng Debugger (`antiDebugger`)</b>
              <div className="muted" style={{ fontSize: ".82rem", marginTop: 2 }}>
                Tạo vòng lặp ngắt <code>debugger;</code> tự động khiến trình duyệt tạm dừng ngay khi người dùng cố tình mở bảng điều khiển để dịch ngược code.
              </div>
            </div>
            <input
              type="checkbox"
              checked={Boolean(f.antiDebugger)}
              onChange={() => toggle("antiDebugger")}
              style={{ width: 18, height: 18, cursor: "pointer", flexShrink: 0 }}
            />
          </div>
        </div>
      </div>

      {/* 3. NỘI DUNG & TƯƠNG TÁC */}
      <div style={{ marginBottom: 28 }}>
        <h3 style={{ margin: "0 0 14px", borderBottom: "1px solid var(--border)", paddingBottom: 8, fontSize: "1.05rem" }}>
          3. 📋 Bảo vệ Nội dung &amp; Chống sao chép (Copy Protection)
        </h3>
        <div style={{ display: "grid", gap: 12 }}>
          {/* Chặn chuột phải */}
          <div
            style={{
              padding: 14,
              borderRadius: 10,
              background: "hsla(0 0% 100% / .02)",
              border: "1px solid var(--border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div>
              <b>Chặn menu chuột phải (`blockContextMenu`)</b>
              <div className="muted" style={{ fontSize: ".82rem", marginTop: 2 }}>
                Ngăn menu ngữ cảnh khi click chuột phải, chống bấm &quot;Kiểm tra (Inspect Element)&quot; và &quot;Lưu hình ảnh thành...&quot;.
              </div>
            </div>
            <input
              type="checkbox"
              checked={Boolean(f.blockContextMenu)}
              onChange={() => toggle("blockContextMenu")}
              style={{ width: 18, height: 18, cursor: "pointer", flexShrink: 0 }}
            />
          </div>

          {/* Chặn sao chép */}
          <div
            style={{
              padding: 14,
              borderRadius: 10,
              background: "hsla(0 0% 100% / .02)",
              border: "1px solid var(--border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div>
              <b>Chặn sao chép văn bản (`blockCopyText`)</b>
              <div className="muted" style={{ fontSize: ".82rem", marginTop: 2 }}>
                Vô hiệu hóa phím tắt <b>Ctrl+C</b> và chặn sự kiện <code>copy</code>/<code>cut</code> để ngăn chặn việc sao chép nội dung bài viết và tài liệu.
              </div>
            </div>
            <input
              type="checkbox"
              checked={Boolean(f.blockCopyText)}
              onChange={() => toggle("blockCopyText")}
              style={{ width: 18, height: 18, cursor: "pointer", flexShrink: 0 }}
            />
          </div>

          {/* Chặn bôi đen */}
          <div
            style={{
              padding: 14,
              borderRadius: 10,
              background: "hsla(0 0% 100% / .02)",
              border: "1px solid var(--border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div>
              <b>Chặn bôi đen chọn chữ (`blockSelectText`)</b>
              <div className="muted" style={{ fontSize: ".82rem", marginTop: 2 }}>
                Khóa bôi đen văn bản trên toàn trang (vẫn cho phép nhập liệu bình thường ở các ô tìm kiếm, form và textarea).
              </div>
            </div>
            <input
              type="checkbox"
              checked={Boolean(f.blockSelectText)}
              onChange={() => toggle("blockSelectText")}
              style={{ width: 18, height: 18, cursor: "pointer", flexShrink: 0 }}
            />
          </div>
        </div>
      </div>

      {/* 4. ĐẶC QUYỀN ADMIN & CẢNH BÁO */}
      <div style={{ marginBottom: 28 }}>
        <h3 style={{ margin: "0 0 14px", borderBottom: "1px solid var(--border)", paddingBottom: 8, fontSize: "1.05rem" }}>
          4. 👑 Đặc quyền Quản trị viên &amp; Trải nghiệm
        </h3>
        <div style={{ display: "grid", gap: 12 }}>
          {/* Admin Bypass */}
          <div
            style={{
              padding: 14,
              borderRadius: 10,
              background: "rgba(168, 85, 247, 0.05)",
              border: "1px solid rgba(168, 85, 247, 0.25)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div>
              <b style={{ color: "var(--accent)" }}>Bỏ qua bảo vệ đối với Quản trị viên (`adminBypass`)</b>
              <div className="muted" style={{ fontSize: ".82rem", marginTop: 2 }}>
                Khi bạn đăng nhập tài khoản Quản trị viên (Admin), toàn bộ hạn chế (F12, Console, Chuột phải, Copy) sẽ tự động được gỡ bỏ để bạn thoải mái gỡ lỗi, kiểm tra mã nguồn và phát triển website.
              </div>
            </div>
            <input
              type="checkbox"
              checked={Boolean(f.adminBypass)}
              onChange={() => toggle("adminBypass")}
              style={{ width: 18, height: 18, cursor: "pointer", flexShrink: 0 }}
            />
          </div>

          {/* Toast thông báo */}
          <div
            style={{
              padding: 14,
              borderRadius: 10,
              background: "hsla(0 0% 100% / .02)",
              border: "1px solid var(--border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div>
              <b>Hiển thị Toast cảnh báo nhẹ nhàng (`notifyOnViolation`)</b>
              <div className="muted" style={{ fontSize: ".82rem", marginTop: 2 }}>
                Hiển thị thông báo nhỏ nhắc nhở khi học viên hoặc người dùng cố tình nhấn chuột phải, F12 hoặc copy nội dung bị khóa.
              </div>
            </div>
            <input
              type="checkbox"
              checked={Boolean(f.notifyOnViolation)}
              onChange={() => toggle("notifyOnViolation")}
              style={{ width: 18, height: 18, cursor: "pointer", flexShrink: 0 }}
            />
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
        <button className="btn btn-primary" type="submit" disabled={busy} id="save-security-btn">
          {busy ? "Đang lưu cấu hình..." : "Lưu thay đổi bảo mật"}
        </button>
        <button
          className="btn btn-ghost"
          type="button"
          onClick={() => {
            setF(defaultSecurity);
            toast.info("Đã đặt lại cấu hình mặc định (chưa lưu vào cơ sở dữ liệu).");
          }}
        >
          Đặt lại cấu hình mặc định
        </button>
      </div>
    </form>
  );
}
