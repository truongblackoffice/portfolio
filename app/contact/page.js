"use client";
import { useState } from "react";
import { saveItem } from "@/lib/db";

export default function Contact() {
  const [f, setF] = useState({ name: "", email: "", message: "" });
  const [st, setSt] = useState(null);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  async function submit(e) {
    e.preventDefault();
    try { await saveItem("messages", f); setSt("ok"); setF({ name: "", email: "", message: "" }); }
    catch { setSt("err"); }
  }
  return (
    <div className="container section">
      <h1 className="gradient-text" style={{ fontSize: "2.6rem", marginBottom: 24, textAlign: "center" }}>Liên hệ</h1>
      <form className="form-card glass" onSubmit={submit} id="contact-form">
        {st === "ok" && <div className="msg ok">Đã gửi! Cảm ơn bạn.</div>}
        {st === "err" && <div className="msg err">Gửi thất bại, vui lòng thử lại.</div>}
        <div className="field"><label htmlFor="c-name">Họ tên</label><input id="c-name" required value={f.name} onChange={set("name")} /></div>
        <div className="field"><label htmlFor="c-email">Email</label><input id="c-email" type="email" required value={f.email} onChange={set("email")} /></div>
        <div className="field"><label htmlFor="c-msg">Lời nhắn</label><textarea id="c-msg" required value={f.message} onChange={set("message")} /></div>
        <button className="btn btn-primary" type="submit" id="c-submit">Gửi lời nhắn</button>
      </form>
    </div>
  );
}
