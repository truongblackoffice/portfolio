"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { login, register, loginWithGoogle, watchAuth, isAdminUser, authMessage, isDemo } from "@/lib/db";
import { useSite } from "@/lib/SiteContext";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="container section empty">Đang tải biểu mẫu đăng nhập...</div>}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || searchParams.get("redirect") || "";
  const initialMode = searchParams.get("mode") === "register" ? "register" : "login";

  const [mode, setMode] = useState(initialMode);
  const [f, setF] = useState({ name: "", email: "", password: "", confirm: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const { site } = useSite();
  const registrationDisabled = Boolean(site?.security?.disableRegistration);
  const regCloseMsg = site?.security?.registrationCloseMessage || "Chức năng đăng ký tài khoản mới hiện đang tạm đóng. Vui lòng liên hệ Quản trị viên để được hỗ trợ.";

  // Tự động điều hướng sau khi đăng nhập / đăng ký thành công
  useEffect(() => {
    return watchAuth((u) => {
      if (!u) return;
      const isAdmin = isAdminUser(u);

      if (isAdmin) {
        // Tài khoản Admin:
        // Nếu có trang đang xem trước đó (và không phải trang login), quay về trang đó; nếu không có thì vào /admin
        if (from && from !== "/login" && !from.startsWith("/login")) {
          router.replace(from);
        } else {
          router.replace("/admin");
        }
      } else {
        // Tài khoản Thành viên thường (không phải admin):
        // Nếu đến từ trang /admin thì chuyển thẳng về trang chủ (Home "/")
        // Nếu đến từ trang nội dung bình thường (ví dụ /blog/..., /documents, /about...), trả về đúng trang đó!
        if (from && from !== "/login" && !from.startsWith("/login") && !from.startsWith("/admin")) {
          router.replace(from);
        } else {
          router.replace("/");
        }
      }
    });
  }, [router, from]);

  async function run(fn) {
    setBusy(true);
    setErr("");
    try {
      await fn();
    } catch (e) {
      setErr(authMessage(e));
    }
    setBusy(false);
  }

  function submit(e) {
    e.preventDefault();
    if (mode === "register") {
      if (registrationDisabled) return setErr(regCloseMsg);
      if (f.password !== f.confirm) return setErr("Mật khẩu nhập lại không khớp.");
      return run(() => register(f.name, f.email, f.password));
    }
    return run(() => login(f.email, f.password));
  }

  const backHref = from && !from.startsWith("/admin") ? from : "/";
  const backLabel = from && !from.startsWith("/admin") ? "← Quay lại trang trước" : "← Về trang chủ";

  return (
    <div className="container section">
      <div className="form-card glass reveal" style={{ maxWidth: 460 }}>
        <div className="admin-tabs" style={{ marginBottom: 20 }}>
          <a
            href="#"
            id="tab-login"
            className={mode === "login" ? "active" : ""}
            onClick={(e) => { e.preventDefault(); setMode("login"); setErr(""); }}
          >
            Đăng nhập
          </a>
          <a
            href="#"
            id="tab-register"
            className={mode === "register" ? "active" : ""}
            onClick={(e) => { e.preventDefault(); setMode("register"); setErr(""); }}
          >
            Đăng ký {registrationDisabled && <span style={{ fontSize: ".72rem", color: "#ef4444", fontWeight: "normal" }}>(Tạm đóng)</span>}
          </a>
        </div>

        {mode === "register" && registrationDisabled && (
          <div className="msg err" style={{ marginBottom: 16 }}>
            🔒 {regCloseMsg}
          </div>
        )}

        <h1 style={{ fontSize: "1.8rem", marginBottom: 20 }}>
          {mode === "login" ? "Chào mừng trở lại" : "Tạo tài khoản mới"}
        </h1>

        {from && !from.startsWith("/admin") && (
          <div className="msg ok" style={{ fontSize: ".84rem", marginBottom: 16 }}>
            💡 Sau khi đăng nhập xong, bạn sẽ được tự động quay lại trang đang xem.
          </div>
        )}

        {err && <div className="msg err">{err}</div>}
        {isDemo && <div className="msg err">Chưa cấu hình Firebase nên đăng ký/Google chưa dùng được.</div>}

        <button
          type="button"
          id="google-btn"
          className="btn btn-ghost"
          style={{ width: "100%", justifyContent: "center", marginBottom: 20 }}
          disabled={busy}
          onClick={() => run(loginWithGoogle)}
        >
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true" style={{ marginRight: 8 }}>
            <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.1 5.3-4.5 7l7.3 5.7c4.3-4 6.9-9.9 6.9-17.2z"/>
            <path fill="#FBBC05" d="M10.5 28.7c-.5-1.4-.8-3-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.4 0 20.100 0 24s.9 7.600 2.600 10.800l7.900-6.100z"/>
            <path fill="#34A853" d="M24 48c6.500 0 11.900-2.100 15.900-5.800l-7.300-5.700c-2 1.400-4.700 2.200-8.600 2.200-6.300 0-11.600-4.100-13.500-9.800l-7.900 6.100C6.500 42.600 14.600 48 24 48z"/>
          </svg>
          Tiếp tục với Google
        </button>

        <div className="muted" style={{ textAlign: "center", marginBottom: 20, fontSize: ".85rem" }}>— hoặc dùng email —</div>

        <form onSubmit={submit} id="auth-form">
          {mode === "register" && (
            <div className="field">
              <label htmlFor="a-name">Họ tên</label>
              <input id="a-name" required value={f.name} onChange={set("name")} placeholder="Họ và tên của bạn..." />
            </div>
          )}
          <div className="field">
            <label htmlFor="a-email">Email</label>
            <input id="a-email" type="email" required value={f.email} onChange={set("email")} placeholder="name@example.com" />
          </div>
          <div className="field">
            <label htmlFor="a-pw">Mật khẩu</label>
            <input id="a-pw" type="password" required minLength={6} value={f.password} onChange={set("password")} placeholder="Tối thiểu 6 ký tự..." />
          </div>
          {mode === "register" && (
            <div className="field">
              <label htmlFor="a-pw2">Nhập lại mật khẩu</label>
              <input id="a-pw2" type="password" required value={f.confirm} onChange={set("confirm")} placeholder="Nhập lại đúng mật khẩu..." />
            </div>
          )}
          <button
            className="btn btn-primary"
            id="auth-submit"
            type="submit"
            disabled={busy || (mode === "register" && registrationDisabled)}
            style={{ width: "100%", justifyContent: "center" }}
          >
            {busy ? "Đang xử lý..." : mode === "login" ? "Đăng nhập" : (registrationDisabled ? "Đăng ký tạm đóng" : "Tạo tài khoản")}
          </button>
        </form>

        <p className="muted" style={{ marginTop: 18, fontSize: ".85rem", textAlign: "center" }}>
          <Link href={backHref} className="gradient-text">
            {backLabel}
          </Link>
        </p>
      </div>
    </div>
  );
}
