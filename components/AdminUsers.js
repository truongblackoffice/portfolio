"use client";
import { useState } from "react";
import { listItems, saveItem, removeItem, isAdminUser, fmtDate, ROLES } from "@/lib/db";
import useAsync from "@/lib/useAsync";

export default function Users() {
  const { data, reload } = useAsync(() => listItems("users"));
  const [q, setQ] = useState("");
  if (!data) return null;
  const list = data.filter((u) => `${u.email} ${u.displayName}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <div className="stats">
        <div className="stat glass"><b className="gradient-text">{data.length}</b><span className="muted">Tổng tài khoản</span></div>
        <div className="stat glass"><b className="gradient-text">{data.filter((u) => u.disabled).length}</b><span className="muted">Đang bị khóa</span></div>
      </div>
      <div className="toolbar">
        <input id="user-search" placeholder="🔍 Tìm theo email hoặc tên..." value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {!list.length && <div className="empty">Chưa có tài khoản nào. Tài khoản xuất hiện sau lần đăng nhập đầu tiên.</div>}
      {list.map((u) => (
        <div className="row glass" key={u.id}>
          <div>
            <b>{u.displayName || "(chưa đặt tên)"}</b>{" "}
            {isAdminUser(u) ? <span className="badge">Admin</span> : <span className="badge">{ROLES[u.role || "member"]}</span>}{" "}
            {u.disabled && <span className="badge draft">Đã khóa</span>}
            <div className="muted" style={{ fontSize: ".8rem" }}>
              {u.email} · {u.provider === "google.com" ? "Google" : "Email"} · Đăng ký {fmtDate(u.createdAt)} · Gần nhất {fmtDate(u.lastLogin)}
            </div>
          </div>
          {!isAdminUser(u) && (
            <div className="actions">
              <select aria-label="Vai trò" value={u.role || "member"} style={{ width: "auto", padding: "6px 10px" }}
                onChange={async (e) => { await saveItem("users", { ...u, role: e.target.value }); reload(); }}>
                <option value="member">{ROLES.member}</option>
                <option value="editor">{ROLES.editor}</option>
              </select>
              <button className="btn btn-ghost btn-sm" onClick={async () => { await saveItem("users", { ...u, disabled: !u.disabled }); reload(); }}>
                {u.disabled ? "Mở khóa" : "Khóa"}
              </button>
              <button className="btn btn-danger btn-sm" onClick={async () => { if (confirm("Gỡ tài khoản này khỏi danh sách?")) { await removeItem("users", u.id); reload(); } }}>
                Xóa
              </button>
            </div>
          )}
        </div>
      ))}
      <p className="muted" style={{ fontSize: ".8rem" }}>
        Lưu ý: &quot;Khóa&quot; chặn tài khoản đăng nhập vào web này; &quot;Xóa&quot; chỉ gỡ khỏi danh sách. Muốn xóa hẳn tài khoản Auth, vào Firebase Console, mục Authentication.
      </p>
    </>
  );
}
