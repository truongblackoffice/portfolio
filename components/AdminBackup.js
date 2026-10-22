"use client";
import { useState } from "react";
import { listItems, saveItem, getProfile, saveProfile, isDemo } from "@/lib/db";

export default function AdminBackup() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  // Xuất dữ liệu
  const handleExport = async () => {
    setBusy(true); setMsg(""); setErr("");
    try {
      const [profile, posts, documents, messages, users, quizzes, quizTopics] = await Promise.all([
        getProfile(),
        listItems("posts"),
        listItems("documents"),
        listItems("messages"),
        listItems("users"),
        listItems("quizzes"),
        listItems("quizTopics"),
      ]);

      const backupData = {
        exportedAt: new Date().toISOString(),
        version: "1.0",
        profile,
        posts,
        documents,
        messages,
        users,
        quizzes,
        quizTopics,
      };

      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const filename = `backup_portfolio_${new Date().toISOString().slice(0, 10)}.json`;
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setMsg(`✅ Xuất thành công file "${filename}" (${posts.length} bài viết, ${documents.length} tài liệu, ${quizzes.length} bộ đề)!`);
    } catch (e) {
      setErr("Lỗi khi xuất dữ liệu: " + e.message);
    }
    setBusy(false);
  };

  // Nhập dữ liệu
  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setBusy(true); setMsg(""); setErr("");
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!confirm(`Bạn có chắc muốn khôi phục dữ liệu từ "${file.name}"? Dữ liệu mới sẽ được ghi đè/bổ sung.`)) {
        setBusy(false);
        return;
      }

      // Khôi phục hồ sơ
      if (data.profile) {
        await saveProfile(data.profile);
      }

      // Khôi phục bài viết
      if (Array.isArray(data.posts)) {
        for (const post of data.posts) {
          await saveItem("posts", post);
        }
      }

      // Khôi phục tài liệu
      if (Array.isArray(data.documents)) {
        for (const doc of data.documents) {
          await saveItem("documents", doc);
        }
      }

      // Khôi phục tin nhắn
      if (Array.isArray(data.messages)) {
        for (const m of data.messages) {
          await saveItem("messages", m);
        }
      }

      // Khôi phục chủ đề và bộ đề trắc nghiệm
      if (Array.isArray(data.quizTopics)) {
        for (const t of data.quizTopics) {
          await saveItem("quizTopics", t);
        }
      }
      if (Array.isArray(data.quizzes)) {
        for (const q of data.quizzes) {
          await saveItem("quizzes", q);
        }
      }

      setMsg(`✅ Đã nhập thành công toàn bộ dữ liệu từ file! Hãy tải lại trang để thấy thay đổi.`);
    } catch (e) {
      setErr("Lỗi khi đọc và khôi phục file: " + e.message);
    }
    setBusy(false);
    e.target.value = "";
  };

  return (
    <div className="glass reveal" style={{ padding: 28, borderRadius: "var(--radius)" }}>
      <h2 style={{ marginBottom: 8 }}>Sao lưu &amp; Phục hồi dữ liệu</h2>
      <p className="muted" style={{ marginBottom: 24 }}>
        Dự phòng an toàn: Tải toàn bộ nội dung website về máy tính cá nhân dưới dạng JSON hoặc khôi phục dữ liệu khi chuyển hosting.
      </p>

      {msg && <div className="msg ok">{msg}</div>}
      {err && <div className="msg err">{err}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
        {/* Xuất dữ liệu */}
        <div className="glass" style={{ padding: 22, borderRadius: 14 }}>
          <h3 style={{ marginBottom: 10 }}>📥 Xuất dữ liệu (Export)</h3>
          <p className="muted" style={{ fontSize: ".9rem", marginBottom: 18 }}>
            Tải về 1 tệp tin `.json` chứa tất cả: Bài viết, Tài liệu, Hồ sơ cá nhân, Cấu hình giao diện và Tin nhắn.
          </p>
          <button className="btn btn-primary" onClick={handleExport} disabled={busy}>
            {busy ? "Đang xử lý..." : "Tải file sao lưu (.JSON)"}
          </button>
        </div>

        {/* Nhập dữ liệu */}
        <div className="glass" style={{ padding: 22, borderRadius: 14 }}>
          <h3 style={{ marginBottom: 10 }}>📤 Khôi phục dữ liệu (Import)</h3>
          <p className="muted" style={{ fontSize: ".9rem", marginBottom: 18 }}>
            Chọn file sao lưu `.json` đã tải trước đó để nạp lại toàn bộ dữ liệu lên website.
          </p>
          <label className="btn btn-ghost" style={{ cursor: "pointer", display: "inline-flex" }}>
            {busy ? "Đang nạp..." : "Chọn file JSON để khôi phục"}
            <input type="file" accept=".json" style={{ display: "none" }} onChange={handleImport} disabled={busy} />
          </label>
        </div>
      </div>
    </div>
  );
}
