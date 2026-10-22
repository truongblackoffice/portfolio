"use client";
import { useState } from "react";
import {
  listItems, saveItem, removeItem, isAdminUser, fmtDate, ROLES,
  ADMIN_FEATURES, getDefaultPermissions,
} from "@/lib/db";
import useAsync from "@/lib/useAsync";
import { toast } from "@/lib/toast";

export default function Users() {
  const { data, reload } = useAsync(() => listItems("users"));
  const [q, setQ] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [editingPermsUser, setEditingPermsUser] = useState(null);
  const [userPerms, setUserPerms] = useState([]);
  const [savingPerms, setSavingPerms] = useState(false);
  const [msg, setMsg] = useState("");

  if (!data) return null;

  const filtered = data.filter((u) => {
    const matchSearch = `${u.email} ${u.displayName}`.toLowerCase().includes(q.toLowerCase());
    if (!matchSearch) return false;
    if (filterRole === "all") return true;
    if (filterRole === "locked") return Boolean(u.disabled);
    if (filterRole === "admin") return isAdminUser(u) || u.role === "admin";
    if (filterRole === "editor") return !isAdminUser(u) && u.role === "editor";
    if (filterRole === "member") return !isAdminUser(u) && (!u.role || u.role === "member");
    return true;
  });

  const openPermsModal = (u) => {
    setEditingPermsUser(u);
    // Nếu user đã có permissions cụ thể thì dùng, ngược lại lấy theo vai trò mặc định
    const currentRole = isAdminUser(u) ? "admin" : (u.role || "member");
    const existing = Array.isArray(u.permissions) && u.permissions.length > 0
      ? u.permissions
      : getDefaultPermissions(currentRole);
    setUserPerms([...existing]);
    setMsg("");
  };

  const closePermsModal = () => {
    setEditingPermsUser(null);
    setUserPerms([]);
    setMsg("");
  };

  const togglePerm = (featId) => {
    setUserPerms((prev) =>
      prev.includes(featId) ? prev.filter((id) => id !== featId) : [...prev, featId]
    );
  };

  const applyPreset = (rolePreset) => {
    setUserPerms(getDefaultPermissions(rolePreset));
  };

  const savePerms = async () => {
    if (!editingPermsUser) return;
    setSavingPerms(true);
    setMsg("");
    try {
      await saveItem("users", {
        ...editingPermsUser,
        permissions: userPerms,
      });
      setMsg("✅ Đã cập nhật phân quyền tính năng thành công!");
      reload();
      setTimeout(() => {
        closePermsModal();
      }, 1200);
    } catch (err) {
      setMsg("❌ Lỗi khi lưu quyền: " + err.message);
    }
    setSavingPerms(false);
  };

  const handleRoleChange = async (u, newRole) => {
    try {
      const updatedUser = {
        ...u,
        role: newRole,
        // Cập nhật permissions tương ứng nếu chưa được tùy chỉnh riêng
        permissions: getDefaultPermissions(newRole),
      };
      await saveItem("users", updatedUser);
      toast.success(`Đã cập nhật vai trò: ${ROLES[newRole] || newRole}`);
      reload();
    } catch (err) {
      toast.error("Lỗi khi cập nhật vai trò: " + err.message);
    }
  };

  return (
    <>
      <div className="stats">
        <div className="stat glass">
          <b className="gradient-text">{data.length}</b>
          <span className="muted">Tổng tài khoản</span>
        </div>
        <div className="stat glass">
          <b className="gradient-text">{data.filter((u) => isAdminUser(u) || u.role === "admin").length}</b>
          <span className="muted">Quản trị viên</span>
        </div>
        <div className="stat glass">
          <b className="gradient-text">{data.filter((u) => !isAdminUser(u) && u.role === "editor").length}</b>
          <span className="muted">Biên tập viên</span>
        </div>
        <div className="stat glass">
          <b className="gradient-text">{data.filter((u) => u.disabled).length}</b>
          <span className="muted">Đang bị khóa</span>
        </div>
      </div>

      <div className="toolbar" style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 20 }}>
        <input
          id="user-search"
          placeholder="🔍 Tìm theo email hoặc tên..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ flex: 1, minWidth: 260 }}
        />
        <div className="chips" style={{ margin: 0 }}>
          <button type="button" className={`chip ${filterRole === "all" ? "on" : ""}`} onClick={() => setFilterRole("all")}>
            Tất cả ({data.length})
          </button>
          <button type="button" className={`chip ${filterRole === "admin" ? "on" : ""}`} onClick={() => setFilterRole("admin")}>
            👑 Quản trị ({data.filter((u) => isAdminUser(u) || u.role === "admin").length})
          </button>
          <button type="button" className={`chip ${filterRole === "editor" ? "on" : ""}`} onClick={() => setFilterRole("editor")}>
            ✍️ Biên tập ({data.filter((u) => !isAdminUser(u) && u.role === "editor").length})
          </button>
          <button type="button" className={`chip ${filterRole === "member" ? "on" : ""}`} onClick={() => setFilterRole("member")}>
            👤 Thành viên ({data.filter((u) => !isAdminUser(u) && (!u.role || u.role === "member")).length})
          </button>
          <button type="button" className={`chip ${filterRole === "locked" ? "on" : ""}`} onClick={() => setFilterRole("locked")}>
            🔒 Đã khóa ({data.filter((u) => u.disabled).length})
          </button>
        </div>
      </div>

      {!filtered.length && <div className="empty">Không tìm thấy tài khoản phù hợp với điều kiện lọc.</div>}

      <div style={{ display: "grid", gap: 12 }}>
        {filtered.map((u) => {
          const isSuper = isAdminUser(u);
          const currentRole = isSuper ? "admin" : (u.role || "member");
          const perms = Array.isArray(u.permissions) && u.permissions.length > 0
            ? u.permissions
            : getDefaultPermissions(currentRole);

          return (
            <div
              className="row glass reveal"
              key={u.id}
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 14,
                padding: "16px 20px",
                border: isSuper ? "1px solid var(--primary)" : undefined,
                background: isSuper ? "hsla(262 90% 68% / .06)" : undefined,
              }}
            >
              <div style={{ minWidth: 260, flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <b style={{ fontSize: "1.05rem" }}>{u.displayName || "(chưa đặt tên)"}</b>
                  {isSuper ? (
                    <span className="badge" style={{ background: "var(--grad)", color: "#fff", fontWeight: 600 }}>
                      👑 Super Admin (Chủ sở hữu)
                    </span>
                  ) : currentRole === "admin" ? (
                    <span className="badge" style={{ background: "hsla(262 90% 68% / .25)", color: "var(--primary)", border: "1px solid var(--primary)", fontWeight: 600 }}>
                      👑 Quản trị viên
                    </span>
                  ) : currentRole === "editor" ? (
                    <span className="badge" style={{ background: "hsla(190 95% 58% / .2)", color: "var(--accent)", border: "1px solid var(--accent)" }}>
                      ✍️ Biên tập viên
                    </span>
                  ) : (
                    <span className="badge" style={{ background: "hsla(0 0% 100% / .1)", color: "var(--muted)" }}>
                      👤 Thành viên
                    </span>
                  )}

                  {u.disabled && <span className="badge draft">🔒 Đã khóa</span>}
                </div>

                <div className="muted" style={{ fontSize: ".82rem", margin: "4px 0" }}>
                  ✉️ {u.email} · {u.provider === "google.com" ? "Google" : "Email"} · Đăng ký {fmtDate(u.createdAt)} · Gần nhất {fmtDate(u.lastLogin)}
                </div>

                {/* Tóm tắt quyền tính năng */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 6, fontSize: ".76rem" }}>
                  <span className="muted">Quyền truy cập:</span>
                  {isSuper ? (
                    <span className="chip" style={{ padding: "2px 8px", fontSize: ".75rem" }}>Toàn bộ hệ thống (100%)</span>
                  ) : perms.length === 0 ? (
                    <span className="muted" style={{ fontStyle: "italic" }}>Chưa có quyền quản trị tính năng nào</span>
                  ) : (
                    <span className="chip on" style={{ padding: "2px 8px", fontSize: ".75rem" }}>
                      Được cấp {perms.length}/{ADMIN_FEATURES.length} tính năng
                    </span>
                  )}
                </div>
              </div>

              {/* Các thao tác phân quyền */}
              <div className="actions" style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                {!isSuper ? (
                  <>
                    {/* Chọn vai trò chính */}
                    <select
                      aria-label="Chọn vai trò"
                      value={u.role || "member"}
                      style={{ width: "auto", padding: "8px 12px", borderRadius: 10, fontSize: ".88rem", fontWeight: 500 }}
                      onChange={(e) => handleRoleChange(u, e.target.value)}
                    >
                      <option value="member">👤 Thành viên</option>
                      <option value="editor">✍️ Biên tập viên</option>
                      <option value="admin">👑 Quản trị viên (Admin)</option>
                    </select>

                    {/* Nút bật tắt phân quyền chi tiết từng tính năng */}
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => openPermsModal(u)}
                      title="Bật/tắt các tính năng mà tài khoản này được phép quản trị"
                      style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                    >
                      ⚙️ Phân quyền ({perms.length})
                    </button>

                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={async () => {
                        await saveItem("users", { ...u, disabled: !u.disabled });
                        reload();
                      }}
                      title={u.disabled ? "Mở khóa tài khoản" : "Khóa tài khoản"}
                    >
                      {u.disabled ? "🔓 Mở" : "🔒 Khóa"}
                    </button>

                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={async () => {
                        if (confirm(`Gỡ tài khoản "${u.email}" khỏi danh sách?`)) {
                          await removeItem("users", u.id);
                          reload();
                        }
                      }}
                      title="Gỡ tài khoản khỏi danh sách"
                    >
                      Xóa
                    </button>
                  </>
                ) : (
                  <span className="muted" style={{ fontSize: ".82rem", fontStyle: "italic", padding: "6px 12px" }}>
                    Tài khoản gốc được bảo vệ
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="muted" style={{ fontSize: ".82rem", marginTop: 20 }}>
        💡 <b>Mẹo phân quyền:</b> Bấm nút <b>&quot;⚙️ Phân quyền&quot;</b> trên từng tài khoản để bật/tắt chính xác những tính năng (Bài viết, Tài liệu, Trắc nghiệm, Media, Banner, v.v.) mà tài khoản đó được phép quản lý.
      </p>

      {/* MODAL PHÂN QUYỀN TÍNH NĂNG CHI TIẾT */}
      {editingPermsUser && (
        <div
          className="quiz-modal"
          role="dialog"
          aria-modal="true"
          onClick={closePermsModal}
          style={{ zIndex: 100 }}
        >
          <div
            className="glass quiz-modal-box"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: 680,
              maxHeight: "90vh",
              overflowY: "auto",
              padding: 28,
              borderRadius: 20,
              background: "var(--bg)",
              border: "1px solid var(--glass-border)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: "1.3rem", margin: 0 }}>
                  ⚙️ Phân quyền tính năng
                </h3>
                <p className="muted" style={{ fontSize: ".88rem", margin: "4px 0 0" }}>
                  Tài khoản: <b>{editingPermsUser.displayName || editingPermsUser.email}</b> ({editingPermsUser.email})
                </p>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={closePermsModal}
                style={{ padding: "4px 10px" }}
              >
                ✕
              </button>
            </div>

            {msg && <div className="msg ok" style={{ marginBottom: 16 }}>{msg}</div>}

            {/* Các nút cấu hình nhanh */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18, alignItems: "center" }}>
              <span className="muted" style={{ fontSize: ".82rem" }}>Mẫu quyền:</span>
              <button
                type="button"
                className="chip"
                onClick={() => applyPreset("admin")}
                title="Cấp quyền toàn bộ 11 tính năng"
              >
                ⚡ Bật tất cả
              </button>
              <button
                type="button"
                className="chip"
                onClick={() => applyPreset("editor")}
                title="Quyền biên tập nội dung: Bài viết, Tài liệu, Danh mục, Trắc nghiệm, Media, Thống kê"
              >
                ✍️ Mặc định Biên tập
              </button>
              <button
                type="button"
                className="chip"
                onClick={() => setUserPerms([])}
                title="Tước tất cả quyền truy cập quản trị"
              >
                🚫 Bỏ chọn tất cả
              </button>
            </div>

            {/* Danh sách 11 tính năng để bật / tắt */}
            <div style={{ display: "grid", gap: 10, marginBottom: 24 }}>
              {ADMIN_FEATURES.map((feat) => {
                const isChecked = userPerms.includes(feat.id);
                return (
                  <label
                    key={feat.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 14,
                      padding: "12px 16px",
                      borderRadius: 14,
                      background: isChecked ? "hsla(262 90% 68% / .12)" : "hsla(0 0% 100% / .03)",
                      border: isChecked ? "1px solid var(--primary)" : "1px solid var(--glass-border)",
                      cursor: "pointer",
                      transition: ".2s",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                      <span style={{ fontSize: "1.5rem", lineHeight: 1 }}>{feat.icon}</span>
                      <div>
                        <b style={{ fontSize: ".95rem", color: isChecked ? "var(--text)" : "var(--muted)" }}>
                          {feat.name}
                        </b>
                        <div className="muted" style={{ fontSize: ".8rem" }}>
                          {feat.desc}
                        </div>
                      </div>
                    </div>

                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => togglePerm(feat.id)}
                      style={{ width: 20, height: 20, cursor: "pointer", accentColor: "var(--primary)" }}
                    />
                  </label>
                );
              })}
            </div>

            {/* Nút lưu */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, borderTop: "1px solid var(--glass-border)", paddingTop: 18 }}>
              <span className="muted" style={{ fontSize: ".85rem" }}>
                Đã chọn: <b>{userPerms.length}</b>/{ADMIN_FEATURES.length} tính năng
              </span>
              <div style={{ display: "flex", gap: 10 }}>
                <button type="button" className="btn btn-ghost btn-sm" onClick={closePermsModal} disabled={savingPerms}>
                  Đóng
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={savePerms}
                  disabled={savingPerms}
                  style={{ minWidth: 140 }}
                >
                  {savingPerms ? "Đang lưu..." : "💾 Lưu phân quyền"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
