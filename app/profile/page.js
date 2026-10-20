"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  watchAuth, logout, roleOf, ROLES, canEdit, fmtDate,
  updateUserProfile, changeUserPassword, sendUserPasswordReset,
  getUserData, getUserComments, removeComment, uploadFile, isDemo,
} from "@/lib/db";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(undefined);
  const [userData, setUserData] = useState(null);
  const [comments, setComments] = useState([]);
  const [tab, setTab] = useState("info");

  // Form states
  const [displayName, setDisplayName] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [bio, setBio] = useState("");
  const [uploading, setUploading] = useState(false);

  // Password states
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [msg, setMsg] = useState({ text: "", type: "" });
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef(null);
  const formFileInputRef = useRef(null);

  useEffect(() => {
    return watchAuth(async (u) => {
      setUser(u);
      if (u) {
        setDisplayName(u.displayName || "");
        setPhotoURL(u.photoURL || "");
        const d = await getUserData(u.uid);
        if (d) {
          setUserData(d);
          if (d.bio) setBio(d.bio);
          if (d.photoURL) setPhotoURL(d.photoURL);
          if (d.displayName) setDisplayName(d.displayName);
        }
        const userCmts = await getUserComments(u.uid);
        setComments(userCmts);
      }
    });
  }, []);

  if (user === undefined) {
    return (
      <div className="container section">
        <div className="empty">Đang tải thông tin tài khoản...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container section">
        <div className="form-card glass reveal" style={{ maxWidth: 480, textAlign: "center", margin: "40px auto" }}>
          <div style={{ fontSize: "3rem", marginBottom: 12 }}>👤</div>
          <h2 style={{ marginBottom: 12 }}>Bạn chưa đăng nhập</h2>
          <p className="muted" style={{ marginBottom: 24, fontSize: ".95rem" }}>
            Vui lòng đăng nhập hoặc tạo tài khoản để quản lý thông tin cá nhân và xem hoạt động của bạn.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <Link href="/login?from=/profile" className="btn btn-primary">
              Đăng nhập ngay
            </Link>
            <Link href="/" className="btn btn-ghost">
              Về trang chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const role = roleOf(user);
  const roleName = ROLES[role] || "Thành viên";
  const isAdmin = canEdit(user);
  const isGoogleUser = user.providerData?.[0]?.providerId === "google.com";

  // Xử lý upload avatar (Chỉ cho phép tải ảnh từ máy, không nhận link thủ công)
  const handleAvatarFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      return setMsg({ text: "Vui lòng chọn một tệp hình ảnh hợp lệ (PNG, JPG, JPEG, WEBP).", type: "err" });
    }
    if (file.size > 5 * 1024 * 1024) {
      return setMsg({ text: "Kích thước ảnh tối đa là 5MB. Vui lòng chọn ảnh nhẹ hơn.", type: "err" });
    }
    setUploading(true);
    setMsg({ text: "", type: "" });
    try {
      const url = await uploadFile(file);
      setPhotoURL(url);
      await updateUserProfile({ photoURL: url });
      setMsg({ text: "🎉 Cập nhật ảnh đại diện thành công!", type: "ok" });
    } catch (err) {
      setMsg({ text: "Lỗi tải ảnh: " + err.message, type: "err" });
    }
    setUploading(false);
  };

  // Cập nhật thông tin cá nhân (Tên hiển thị & Giới thiệu Bio)
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMsg({ text: "", type: "" });
    try {
      await updateUserProfile({
        displayName: displayName.trim(),
        bio: bio.trim(),
      });
      setMsg({ text: "Lưu thông tin cá nhân thành công!", type: "ok" });
    } catch (err) {
      setMsg({ text: "Lỗi cập nhật: " + err.message, type: "err" });
    }
    setBusy(false);
  };

  // Đổi mật khẩu
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      return setMsg({ text: "Mật khẩu mới phải có tối thiểu 6 ký tự.", type: "err" });
    }
    if (newPassword !== confirmPassword) {
      return setMsg({ text: "Mật khẩu xác nhận không khớp.", type: "err" });
    }
    setBusy(true);
    setMsg({ text: "", type: "" });
    try {
      await changeUserPassword(newPassword);
      setNewPassword("");
      setConfirmPassword("");
      setMsg({ text: "Đổi mật khẩu thành công! Hãy ghi nhớ mật khẩu mới của bạn.", type: "ok" });
    } catch (err) {
      setMsg({ text: "Lỗi đổi mật khẩu: " + (err.message.includes("requires-recent-login") ? "Vì lý do bảo mật, bạn cần đăng xuất rồi đăng nhập lại trước khi đổi mật khẩu." : err.message), type: "err" });
    }
    setBusy(false);
  };

  // Gửi email đặt lại mật khẩu
  const handleSendReset = async () => {
    setBusy(true);
    setMsg({ text: "", type: "" });
    try {
      await sendUserPasswordReset(user.email);
      setMsg({ text: `Đã gửi liên kết đặt lại mật khẩu tới hòm thư ${user.email}. Vui lòng kiểm tra hộp thư đến hoặc mục Spam.`, type: "ok" });
    } catch (err) {
      setMsg({ text: "Lỗi gửi email: " + err.message, type: "err" });
    }
    setBusy(false);
  };

  // Xóa bình luận của bản thân
  const handleDeleteComment = async (cid) => {
    if (!confirm("Bạn có chắc chắn muốn xóa bình luận này?")) return;
    try {
      await removeComment(cid);
      setComments(comments.filter((c) => c.id !== cid));
      setMsg({ text: "Đã xóa bình luận thành công.", type: "ok" });
    } catch (err) {
      setMsg({ text: "Lỗi khi xóa bình luận: " + err.message, type: "err" });
    }
  };

  const initial = (user.displayName || user.email || "U")[0].toUpperCase();

  return (
    <div className="container section" style={{ maxWidth: 860 }}>
      {/* Thẻ Header Hồ sơ */}
      <div
        className="glass reveal"
        style={{
          padding: 32,
          borderRadius: "var(--radius)",
          marginBottom: 28,
          display: "flex",
          alignItems: "center",
          gap: 24,
          flexWrap: "wrap",
          background: "linear-gradient(135deg, hsla(262 90% 68% / .1), hsla(200 90% 55% / .05))",
          border: "1px solid var(--glass-border)",
        }}
      >
        {/* Avatar */}
        <div style={{ position: "relative" }}>
          {photoURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoURL}
              alt="Avatar"
              style={{
                width: 96,
                height: 96,
                borderRadius: "50%",
                objectFit: "cover",
                border: "3px solid var(--primary)",
                boxShadow: "0 0 25px hsla(262 90% 68% / .4)",
              }}
            />
          ) : (
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: "50%",
                background: "var(--grad)",
                color: "#fff",
                fontSize: "2.4rem",
                fontWeight: 700,
                display: "grid",
                placeItems: "center",
                boxShadow: "0 0 25px hsla(262 90% 68% / .4)",
              }}
            >
              {initial}
            </div>
          )}
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            style={{
              position: "absolute",
              bottom: -6,
              right: -6,
              padding: "4px 10px",
              fontSize: ".75rem",
              borderRadius: 999,
            }}
            title="Tải ảnh mới từ máy"
          >
            {uploading ? "..." : "📷 Đổi ảnh"}
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleAvatarFile}
            accept="image/*"
            style={{ display: "none" }}
          />
        </div>

        {/* Thông tin chính */}
        <div style={{ flex: 1, minWidth: 260 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
            <h1 style={{ fontSize: "1.8rem", margin: 0 }}>
              {user.displayName || "Thành viên"}
            </h1>
            <span
              className="badge"
              style={{
                background: isAdmin ? "hsla(262 90% 68% / .2)" : "hsla(160 84% 39% / .2)",
                color: isAdmin ? "var(--primary)" : "#10b981",
                border: `1px solid ${isAdmin ? "var(--primary)" : "#10b981"}66`,
              }}
            >
              {isAdmin ? "👑 " : "👤 "}
              {roleName}
            </span>
          </div>

          <p className="muted" style={{ margin: "4px 0 10px", fontSize: ".92rem" }}>
            ✉️ {user.email} · {isGoogleUser ? "Đăng nhập với Google" : "Tài khoản Email"}
          </p>

          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: ".82rem", color: "var(--muted)" }}>
            <span>📅 Tham gia: {fmtDate(userData?.createdAt || Date.now())}</span>
            <span>⏱️ Hoạt động gần nhất: {fmtDate(userData?.lastLogin || Date.now())}</span>
          </div>
        </div>

        {/* Nút hành động */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {isAdmin && (
            <Link href="/admin" className="btn btn-primary btn-sm">
              ⚙️ Trang quản trị
            </Link>
          )}
          <button className="btn btn-ghost btn-sm" onClick={logout}>
            Đăng xuất
          </button>
        </div>
      </div>

      {/* Thông báo kết quả thao tác */}
      {msg.text && (
        <div className={`msg ${msg.type}`} style={{ marginBottom: 20 }}>
          {msg.text}
        </div>
      )}

      {/* Menu các Tab chức năng */}
      <div className="admin-tabs" style={{ marginBottom: 24 }}>
        <a
          href="#"
          className={tab === "info" ? "active" : ""}
          onClick={(e) => { e.preventDefault(); setTab("info"); setMsg({ text: "", type: "" }); }}
        >
          👤 Thông tin cá nhân
        </a>
        <a
          href="#"
          className={tab === "security" ? "active" : ""}
          onClick={(e) => { e.preventDefault(); setTab("security"); setMsg({ text: "", type: "" }); }}
        >
          🔒 Bảo mật & Mật khẩu
        </a>
        <a
          href="#"
          className={tab === "comments" ? "active" : ""}
          onClick={(e) => { e.preventDefault(); setTab("comments"); setMsg({ text: "", type: "" }); }}
        >
          💬 Bình luận của tôi ({comments.length})
        </a>
      </div>

      {/* TAB 1: THÔNG TIN CÁ NHÂN */}
      {tab === "info" && (
        <form onSubmit={handleSaveProfile} className="glass reveal" style={{ padding: 28, borderRadius: "var(--radius)" }}>
          <h2 style={{ fontSize: "1.3rem", marginBottom: 6 }}>Cập nhật thông tin hồ sơ</h2>
          <p className="muted" style={{ fontSize: ".88rem", marginBottom: 24 }}>
            Tên và ảnh đại diện này sẽ được hiển thị khi bạn để lại bình luận hoặc tương tác trên trang web.
          </p>

          <div className="field">
            <label htmlFor="p-name">Họ và tên / Tên hiển thị</label>
            <input
              id="p-name"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Nhập họ tên hoặc biệt danh của bạn..."
            />
          </div>

          {/* Ảnh đại diện (Chỉ cho phép tải ảnh từ thiết bị, ẩn hoàn toàn link URL) */}
          <div className="field">
            <label>Ảnh đại diện</label>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "16px 20px",
                background: "hsla(0 0% 100% / .03)",
                borderRadius: 14,
                border: "1px solid var(--glass-border)",
                flexWrap: "wrap",
              }}
            >
              {photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoURL}
                  alt="Avatar"
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "2px solid var(--primary)",
                    boxShadow: "0 0 15px hsla(262 90% 68% / .35)",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: "50%",
                    background: "var(--grad)",
                    color: "#fff",
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  {initial}
                </div>
              )}

              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => formFileInputRef.current?.click()}
                    disabled={uploading}
                    style={{
                      background: "hsla(262 90% 68% / .15)",
                      border: "1px solid hsla(262 90% 68% / .4)",
                    }}
                  >
                    {uploading ? "⏳ Đang tải ảnh lên..." : "📤 Tải ảnh mới từ thiết bị"}
                  </button>
                  <input
                    type="file"
                    ref={formFileInputRef}
                    onChange={handleAvatarFile}
                    accept="image/*"
                    style={{ display: "none" }}
                  />
                  {photoURL && (
                    <span className="badge" style={{ fontSize: ".72rem", color: "#10b981", background: "hsla(160 84% 39% / .15)", border: "1px solid hsla(160 84% 39% / .3)" }}>
                      ✓ Đã tải ảnh
                    </span>
                  )}
                </div>
                <p className="muted" style={{ fontSize: ".8rem", margin: 0 }}>
                  Chỉ hỗ trợ tải trực tiếp từ máy (PNG, JPG, WEBP, tối đa 5MB).
                </p>
              </div>
            </div>
          </div>

          <div className="field">
            <label htmlFor="p-bio">Giới thiệu bản thân (Bio)</label>
            <textarea
              id="p-bio"
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Viết đôi dòng chia sẻ ngắn về bản thân, sở thích hoặc chuyên môn của bạn..."
              style={{ resize: "vertical" }}
            />
          </div>

          <div className="field">
            <label>Địa chỉ Email (Không thể thay đổi)</label>
            <input value={user.email} disabled style={{ opacity: 0.6, cursor: "not-allowed" }} />
          </div>

          <div style={{ marginTop: 20 }}>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? "Đang lưu..." : "💾 Lưu thông tin"}
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: BẢO MẬT & MẬT KHẨU */}
      {tab === "security" && (
        <div className="glass reveal" style={{ padding: 28, borderRadius: "var(--radius)" }}>
          <h2 style={{ fontSize: "1.3rem", marginBottom: 6 }}>Bảo mật tài khoản</h2>
          <p className="muted" style={{ fontSize: ".88rem", marginBottom: 24 }}>
            Quản lý mật khẩu và phương thức đăng nhập để giữ tài khoản của bạn luôn an toàn.
          </p>

          {isGoogleUser ? (
            <div
              className="glass"
              style={{
                padding: 24,
                borderRadius: 14,
                display: "flex",
                gap: 16,
                alignItems: "flex-start",
                background: "hsla(217 91% 60% / .08)",
                border: "1px solid hsla(217 91% 60% / .3)",
              }}
            >
              <div style={{ fontSize: "2rem" }}>🛡️</div>
              <div>
                <b style={{ fontSize: "1.05rem" }}>Đăng nhập liên kết Google</b>
                <p className="muted" style={{ fontSize: ".88rem", margin: "6px 0 0" }}>
                  Tài khoản của bạn được bảo mật an toàn trực tiếp qua Google (<code>{user.email}</code>). Bạn không cần đặt mật khẩu riêng cho trang web này. Mọi cài đặt bảo mật và xác thực 2 lớp (2FA) được quản lý qua tài khoản Google của bạn.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleChangePassword}>
              <div className="field">
                <label htmlFor="p-newpw">Mật khẩu mới</label>
                <input
                  id="p-newpw"
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự..."
                />
              </div>

              <div className="field">
                <label htmlFor="p-confirmpw">Xác nhận mật khẩu mới</label>
                <input
                  id="p-confirmpw"
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại đúng mật khẩu mới..."
                />
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
                <button type="submit" className="btn btn-primary" disabled={busy || !newPassword}>
                  {busy ? "Đang xử lý..." : "Đổi mật khẩu"}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={handleSendReset}
                  disabled={busy}
                  title="Gửi email chứa liên kết đặt lại mật khẩu"
                >
                  📧 Gửi email đặt lại mật khẩu
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* TAB 3: BÌNH LUẬN CỦA TÔI */}
      {tab === "comments" && (
        <div className="glass reveal" style={{ padding: 28, borderRadius: "var(--radius)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: "1.3rem", margin: 0 }}>Lịch sử bình luận ({comments.length})</h2>
              <p className="muted" style={{ fontSize: ".88rem", marginTop: 4 }}>
                Tất cả các ý kiến đóng góp và thảo luận bạn đã đăng trên bài viết
              </p>
            </div>
            <Link href="/blog" className="btn btn-ghost btn-sm">
              Khám phá bài viết
            </Link>
          </div>

          {comments.length === 0 ? (
            <div className="empty" style={{ padding: "40px 0" }}>
              <div style={{ fontSize: "2.4rem", marginBottom: 12 }}>💬</div>
              <p>Bạn chưa gửi bình luận nào.</p>
              <Link href="/blog" className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>
                Đọc bài viết và tham gia thảo luận
              </Link>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 14 }}>
              {comments.map((c) => (
                <div
                  key={c.id}
                  className="glass"
                  style={{
                    padding: 18,
                    borderRadius: 12,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 16,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: ".82rem", color: "var(--accent)" }}>
                        🕒 {fmtDate(c.createdAt)}
                      </span>
                      {c.postId && (
                        <Link
                          href={`/blog/${c.postId}`}
                          style={{ fontSize: ".82rem", color: "var(--primary)", textDecoration: "underline" }}
                        >
                          Xem bài viết →
                        </Link>
                      )}
                    </div>
                    <p style={{ margin: 0, fontSize: ".95rem", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                      {c.content}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDeleteComment(c.id)}
                    title="Xóa bình luận này"
                  >
                    Xóa
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
