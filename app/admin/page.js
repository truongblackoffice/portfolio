"use client";
import { useEffect, useState } from "react";
import {
  watchAuth, login, logout, loginWithGoogle, authMessage, listItems, saveItem, removeItem, getProfile, saveProfile,
  uploadFile, isDemo, DEMO_EMAIL, DEMO_PASSWORD, slugify, fmtDate, roleOf, canEdit, ROLES, migrateAccess,
} from "@/lib/db";
import useAsync from "@/lib/useAsync";
import { useSite, defaultSite } from "@/lib/SiteContext";

import Users from "@/components/AdminUsers";
import PostEditor from "@/components/PostEditor";
import DocEditor from "@/components/DocEditor";
import AdminProfileVisual from "@/components/AdminProfileVisual";
import AdminBackup from "@/components/AdminBackup";
import AdminMedia from "@/components/AdminMedia";
import AdminCategories from "@/components/AdminCategories";
import AdminAnalytics from "@/components/AdminAnalytics";

// [id, nhãn, chỉ admin?]
const TABS = [
  ["dash", "📊 Tổng quan & Thống kê"],
  ["posts", "✍️ Bài viết"],
  ["documents", "📁 Tài liệu"],
  ["categories", "🏷️ Danh mục"],
  ["media", "🖼️ Thư viện Media"],
  ["profile", "👤 Hồ sơ cá nhân", true],
  ["appearance", "🎨 Giao diện & Banner", true],
  ["users", "👥 Quản lý tài khoản", true],
  ["messages", "📩 Hòm thư liên hệ", true],
  ["backup", "💾 Sao lưu dữ liệu", true],
];

export default function Admin() {
  const [user, setUser] = useState(undefined);
  const [tab, setTab] = useState("dash");
  useEffect(() => watchAuth(setUser), []);
  useEffect(() => { if (user && roleOf(user) === "admin") migrateAccess().catch(console.error); }, [user]);

  if (user === undefined) return <div className="empty">Đang kiểm tra...</div>;
  if (!user) return <Login />;
  if (!canEdit(user)) return (
    <div className="container section">
      <div className="form-card glass" style={{ maxWidth: 480, textAlign: "center" }}>
        <h1 style={{ marginBottom: 12 }}>Không có quyền truy cập</h1>
        <p className="muted" style={{ marginBottom: 20 }}>Tài khoản {user.email} ({ROLES[roleOf(user)]}) không có quyền quản trị.</p>
        <button className="btn btn-ghost" id="denied-logout" onClick={logout}>Đăng xuất</button>
      </div>
    </div>
  );

  const isAdmin = roleOf(user) === "admin";

  return (
    <div className="container section">
      <div className="section-head" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="gradient-text">Trung tâm quản trị</h1>
          <p className="muted" style={{ fontSize: ".9rem" }}>Hệ thống quản lý nội dung, tài liệu, người dùng và tùy biến toàn diện</p>
        </div>
        <button className="btn btn-ghost btn-sm" id="logout-btn" onClick={logout}>
          Đăng xuất ({user.email} · {ROLES[roleOf(user)]})
        </button>
      </div>

      {isDemo && <div className="msg ok">Chế độ demo: dữ liệu lưu trong trình duyệt. Thêm cấu hình Firebase vào <code>.env.local</code> để dùng Firestore.</div>}

      <div className="admin-tabs">
        {TABS.filter(([, , adminOnly]) => !adminOnly || isAdmin).map(([k, t]) => (
          <a
            href="#"
            key={k}
            id={`tab-${k}`}
            className={tab === k ? "active" : ""}
            onClick={(e) => { e.preventDefault(); setTab(k); }}
          >
            {t}
          </a>
        ))}
      </div>

      {tab === "dash" && <AdminAnalytics admin={isAdmin} />}
      {tab === "posts" && <Posts />}
      {tab === "documents" && <Docs />}
      {tab === "categories" && <AdminCategories />}
      {tab === "media" && <AdminMedia />}
      {isAdmin && tab === "profile" && <AdminProfileVisual />}
      {isAdmin && tab === "appearance" && <Appearance />}
      {isAdmin && tab === "users" && <Users />}
      {isAdmin && tab === "messages" && <Messages />}
      {isAdmin && tab === "backup" && <AdminBackup />}
    </div>
  );
}

function Login() {
  const [email, setEmail] = useState(isDemo ? DEMO_EMAIL : "");
  const [pw, setPw] = useState(isDemo ? DEMO_PASSWORD : "");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      await login(email, pw);
    } catch (x) {
      setErr(authMessage(x));
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setBusy(true);
    setErr("");
    try {
      await loginWithGoogle();
    } catch (x) {
      setErr(authMessage(x));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container section">
      <div className="form-card glass" style={{ maxWidth: 440 }}>
        <h1 style={{ marginBottom: 20 }}>Đăng nhập quản trị</h1>
        {isDemo && <div className="msg ok">Demo: {DEMO_EMAIL} / {DEMO_PASSWORD}</div>}
        {err && <div className="msg err">{err}</div>}

        <button
          type="button"
          id="admin-google-btn"
          className="btn btn-ghost"
          style={{ width: "100%", justifyContent: "center", marginBottom: 20 }}
          disabled={busy}
          onClick={handleGoogle}
        >
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true" style={{ marginRight: 8 }}>
            <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.1 5.3-4.5 7l7.3 5.7c4.3-4 6.9-9.9 6.9-17.2z"/>
            <path fill="#FBBC05" d="M10.5 28.7c-.5-1.4-.8-3-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.4 0 20.100 0 24s.9 7.600 2.600 10.800l7.900-6.100z"/>
            <path fill="#34A853" d="M24 48c6.500 0 11.900-2.100 15.900-5.800l-7.300-5.700c-2 1.400-4.700 2.200-8.600 2.200-6.300 0-11.600-4.100-13.500-9.800l-7.900 6.100C6.500 42.600 14.600 48 24 48z"/>
          </svg>
          {busy ? "Đang xử lý..." : "Đăng nhập nhanh với Google"}
        </button>

        <div className="muted" style={{ textAlign: "center", marginBottom: 20, fontSize: ".85rem" }}>— hoặc dùng Email & Mật khẩu —</div>

        <form onSubmit={submit} id="login-form">
          <div className="field">
            <label htmlFor="l-email">Email</label>
            <input id="l-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="l-pw">Mật khẩu</label>
            <input id="l-pw" type="password" required value={pw} onChange={(e) => setPw(e.target.value)} />
          </div>
          <button className="btn btn-primary" id="login-submit" type="submit" disabled={busy} style={{ width: "100%", justifyContent: "center" }}>
            {busy ? "Đang xử lý..." : "Đăng nhập"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Posts() {
  const { data, reload } = useAsync(() => listItems("posts"));
  const [edit, setEdit] = useState(null);
  if (edit) return <PostEditor item={edit} onDone={() => { setEdit(null); reload(); }} />;
  return (
    <>
      <button className="btn btn-primary" id="new-post" style={{ marginBottom: 20 }} onClick={() => setEdit({ title: "", excerpt: "", content: "", category: "", tags: [], published: true, membersOnly: false })}>
        + Viết bài mới (Trình soạn thảo Markdown trực quan)
      </button>
      {(data || []).map((p) => (
        <div className="row glass" key={p.id}>
          <div>
            <b>{p.title}</b>{" "}
            <span className={`badge ${p.published ? "" : "draft"}`}>{p.published ? "Đã đăng" : "Nháp"}</span>{" "}
            {p.membersOnly && <span className="badge draft">🔒 Chỉ thành viên</span>}
            <div className="muted" style={{ fontSize: ".8rem" }}>
              {p.category} {p.author ? `· Tác giả: ${p.author}` : ""} · {fmtDate(p.createdAt)}
            </div>
          </div>
          <div className="actions">
            <a href={`/blog/${p.slug || p.id}`} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" title="Mở trang xem trước">
              Xem bài ↗
            </a>
            <button className="btn btn-ghost btn-sm" onClick={() => setEdit(p)}>Sửa</button>
            <button className="btn btn-danger btn-sm" onClick={async () => { if (confirm("Xóa bài viết này?")) { await removeItem("posts", p.id); reload(); } }}>Xóa</button>
          </div>
        </div>
      ))}
      {(!data || data.length === 0) && <div className="empty">Chưa có bài viết nào. Bấm nút "+ Viết bài mới" để tạo bài viết đầu tiên!</div>}
    </>
  );
}

function Docs() {
  const { data, reload } = useAsync(() => listItems("documents"));
  const [edit, setEdit] = useState(null);
  if (edit) return <DocEditor item={edit} onDone={() => { setEdit(null); reload(); }} />;
  return (
    <>
      <button className="btn btn-primary" id="new-doc" style={{ marginBottom: 20 }} onClick={() => setEdit({ title: "", description: "", category: "", tags: [], fileUrl: "", fileType: "PDF", size: "", membersOnly: false })}>
        + Thêm tài liệu mới
      </button>
      {(data || []).map((d) => (
        <div className="row glass" key={d.id}>
          <div>
            <b>{d.title}</b>
            {d.membersOnly && <> <span className="badge draft">🔒 Chỉ thành viên</span></>}
            <div className="muted" style={{ fontSize: ".8rem" }}>
              {d.category} · {d.fileType} {d.version ? `· v${d.version}` : ""} · {fmtDate(d.createdAt)}
            </div>
          </div>
          <div className="actions">
            {d.fileUrl && (
              <a href={d.fileUrl} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" title="Mở liên kết file">
                Mở tệp ↗
              </a>
            )}
            <button className="btn btn-ghost btn-sm" onClick={() => setEdit(d)}>Sửa</button>
            <button className="btn btn-danger btn-sm" onClick={async () => { if (confirm("Xóa tài liệu này?")) { await removeItem("documents", d.id); reload(); } }}>Xóa</button>
          </div>
        </div>
      ))}
      {(!data || data.length === 0) && <div className="empty">Chưa có tài liệu nào. Bấm nút "+ Thêm tài liệu mới" để chia sẻ file đầu tiên!</div>}
    </>
  );
}

function Appearance() {
  const { site, refresh } = useSite();
  const [f, setF] = useState(site);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => setF(site), [site]);

  const set = (k) => (e) => { setOk(false); setF({ ...f, [k]: e.target.value }); };
  const setBanner = (k) => (e) => {
    setOk(false);
    const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setF((prev) => ({
      ...prev,
      banner: {
        ...(prev.banner || {}),
        [k]: val,
      },
    }));
  };

  async function upload(key, e) {
    const file = e.target.files[0];
    if (!file) return;
    setBusy(true); setErr("");
    try {
      setF((s) => ({ ...s, [key]: "" }));
      const url = await uploadFile(file);
      setF((s) => ({ ...s, [key]: url }));
    } catch (x) {
      setErr(x.message + " (hoặc dán URL ảnh vào ô bên trên)");
    }
    setBusy(false);
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const p = await getProfile();
      await saveProfile({ ...p, site: f });
      await refresh();
      setOk(true);
    } catch (x) {
      setErr("Lỗi khi lưu giao diện: " + x.message);
    }
    setBusy(false);
  }

  return (
    <form className="form-card glass" style={{ maxWidth: 780 }} onSubmit={submit} id="appearance-form">
      <h2 style={{ marginBottom: 12 }}>Tùy biến thương hiệu &amp; Giao diện</h2>
      {ok && <div className="msg ok">✅ Đã lưu giao diện thành công!</div>}
      {err && <div className="msg err">{err}</div>}

      {/* Thông tin nhận diện */}
      <h3 style={{ margin: "20px 0 12px", borderBottom: "1px solid var(--glass-border)", paddingBottom: 8 }}>1. Nhận diện thương hiệu (Branding)</h3>
      <div className="field"><label>Tên website (tiêu đề tab trình duyệt)</label><input value={f.siteName} onChange={set("siteName")} /></div>
      <div className="field"><label>Mô tả website (SEO &amp; công cụ tìm kiếm)</label><input value={f.tagline} onChange={set("tagline")} /></div>
      <div className="field"><label>Chữ logo (ví dụ: &lt;ManhTruong/&gt;)</label><input value={f.logoText} onChange={set("logoText")} /></div>
      <div className="field">
        <label>Ảnh logo (URL hoặc tải file lên, để trống nếu chỉ dùng chữ)</label>
        <input value={f.logoImage || ""} onChange={set("logoImage")} placeholder="https://..." />
        <input type="file" accept="image/*" onChange={(e) => upload("logoImage", e)} />
      </div>
      <div className="field">
        <label>Icon website / Favicon (URL hoặc tải file lên)</label>
        <input value={f.favicon || ""} onChange={set("favicon")} placeholder="https://..." />
        <input type="file" accept="image/*" onChange={(e) => upload("favicon", e)} />
        {busy && <span className="muted">Đang tải lên...</span>}
      </div>

      {/* Nội dung trang & Màu sắc */}
      <h3 style={{ margin: "24px 0 12px", borderBottom: "1px solid var(--glass-border)", paddingBottom: 8 }}>2. Nội dung &amp; Màu sắc chủ đạo</h3>
      <div className="field"><label>Dòng chào nổi bật ở Hero Banner</label><input value={f.heroBadge} onChange={set("heroBadge")} /></div>
      <div className="field"><label>Chữ chân trang (Footer)</label><input value={f.footerText} onChange={set("footerText")} /></div>
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginBottom: 16 }}>
        <div className="field"><label>Màu chính (Primary Color)</label><input type="color" style={{ height: 48, width: 90, padding: 4 }} value={f.primary} onChange={set("primary")} /></div>
        <div className="field"><label>Màu nhấn (Accent Color)</label><input type="color" style={{ height: 48, width: 90, padding: 4 }} value={f.accent} onChange={set("accent")} /></div>
      </div>

      {/* Announcement Banner */}
      <h3 style={{ margin: "24px 0 12px", borderBottom: "1px solid var(--glass-border)", paddingBottom: 8 }}>3. Thanh thông báo đầu trang (Top Banner)</h3>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <input
          type="checkbox"
          id="b-enable"
          checked={!!f.banner?.enabled}
          onChange={setBanner("enabled")}
          style={{ width: 18, height: 18, cursor: "pointer" }}
        />
        <label htmlFor="b-enable" style={{ cursor: "pointer", fontWeight: 600 }}>
          Bật thanh thông báo chạy trên đỉnh website
        </label>
      </div>
      {f.banner?.enabled && (
        <div style={{ display: "grid", gap: 12, padding: 16, background: "hsla(0 0% 100% / .03)", borderRadius: 12, marginBottom: 16 }}>
          <div className="field" style={{ margin: 0 }}>
            <label>Nội dung thông báo *</label>
            <input
              value={f.banner?.text || ""}
              onChange={setBanner("text")}
              placeholder="Ví dụ: 🎉 Website vừa cập nhật thêm bài viết và tài liệu mới!"
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 180px", gap: 12 }}>
            <div className="field" style={{ margin: 0 }}>
              <label>Đường dẫn liên kết (tùy chọn)</label>
              <input
                value={f.banner?.link || ""}
                onChange={setBanner("link")}
                placeholder="/blog hoặc https://..."
              />
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label>Chữ nút bấm</label>
              <input
                value={f.banner?.linkText || ""}
                onChange={setBanner("linkText")}
                placeholder="Xem ngay →"
              />
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
        <button className="btn btn-primary" type="submit" disabled={busy} id="save-appearance">
          {busy ? "Đang lưu..." : "Lưu thay đổi giao diện"}
        </button>
        <button className="btn btn-ghost" type="button" onClick={() => setF(defaultSite)}>
          Đặt lại mặc định
        </button>
      </div>
    </form>
  );
}

function Messages() {
  const { data, reload } = useAsync(() => listItems("messages"));
  if (!data) return null;
  if (!data.length) return <div className="empty">Chưa có tin nhắn liên hệ nào trong hòm thư.</div>;
  return (
    <div style={{ display: "grid", gap: 14 }}>
      {data.map((m) => (
        <div className="row glass" key={m.id}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <b>{m.name}</b>
              <span className="muted" style={{ fontSize: ".82rem" }}>&lt;{m.email}&gt; · {fmtDate(m.createdAt)}</span>
            </div>
            <p style={{ marginTop: 8, fontSize: ".92rem", lineHeight: 1.6 }}>{m.message}</p>
          </div>
          <div className="actions">
            <a href={`mailto:${m.email}?subject=Phản hồi từ website`} className="btn btn-ghost btn-sm">
              Trả lời ✉
            </a>
            <button className="btn btn-danger btn-sm" onClick={async () => { if (confirm("Xóa tin nhắn này?")) { await removeItem("messages", m.id); reload(); } }}>
              Xóa
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
