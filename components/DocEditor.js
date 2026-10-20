"use client";
import { useState } from "react";
import { saveItem, uploadFile, fmtDate } from "@/lib/db";
import { DocCard } from "./Cards";

const csv = (s) => s.split(",").map((x) => x.trim()).filter(Boolean);

const FILE_TYPES = [
  "PDF", "DOCX", "PPTX", "ZIP", "LINK", "GITHUB", "GOOGLE DRIVE", "IMAGE", "VIDEO", "AUDIO", "KHÁC"
];

export default function DocEditor({ item, onDone }) {
  const [f, setF] = useState({
    ...item,
    tagsText: (item.tags || []).join(", "),
    fileUrl: item.fileUrl || "",
    fileType: item.fileType || "PDF",
    size: item.size || "",
    version: item.version || "1.0",
    author: item.author || "",
    membersOnly: Boolean(item.membersOnly),
  });

  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [activeTab, setActiveTab] = useState("split"); // "edit" | "preview" | "split"

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  // Tự động đoán định dạng tệp từ tên hoặc link
  const detectFileType = (filename) => {
    const ext = filename.split(".").pop().toUpperCase();
    if (["PDF", "DOC", "DOCX", "PPT", "PPTX", "ZIP", "RAR", "MP4", "MP3", "PNG", "JPG"].includes(ext)) {
      return ext === "DOC" ? "DOCX" : ext === "PPT" ? "PPTX" : ext;
    }
    if (filename.includes("drive.google.com")) return "GOOGLE DRIVE";
    if (filename.includes("github.com")) return "GITHUB";
    return "LINK";
  };

  async function pick(e) {
    const file = e.target.files[0];
    if (!file) return;
    setBusy(true);
    setErr("");
    try {
      const url = await uploadFile(file);
      const ext = detectFileType(file.name);
      setF({
        ...f,
        fileUrl: url,
        fileType: ext,
        size: (file.size / 1048576).toFixed(2) + " MB",
      });
    } catch (x) {
      setErr(x.message + " (Bạn có thể dán link trực tiếp vào ô bên dưới)");
    }
    setBusy(false);
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const { tagsText, ...rest } = f;
      await saveItem("documents", {
        ...rest,
        tags: csv(tagsText),
        membersOnly: Boolean(rest.membersOnly),
      });
      onDone();
    } catch (x) {
      setErr(x.message || "Lỗi khi lưu tài liệu");
    }
    setBusy(false);
  }

  // Dữ liệu dùng để xem trước card
  const previewDoc = {
    ...f,
    id: f.id || "preview-id",
    tags: csv(f.tagsText),
    createdAt: f.createdAt || Date.now(),
  };

  return (
    <form className="glass reveal" style={{ padding: 28, borderRadius: "var(--radius)", marginBottom: 30 }} onSubmit={submit} id="doc-form">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2>{item.id ? "Chỉnh sửa tài liệu" : "Thêm tài liệu mới"}</h2>
          <span className="muted" style={{ fontSize: ".85rem" }}>
            Quản lý tài liệu chia sẻ, sách điện tử, slide hoặc mã nguồn
          </span>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-ghost btn-sm" type="button" onClick={onDone}>Hủy</button>
          <button className="btn btn-primary btn-sm" type="submit" disabled={busy} id="save-doc">
            {busy ? "Đang lưu..." : "Lưu tài liệu"}
          </button>
        </div>
      </div>

      {err && <div className="msg err">{err}</div>}

      <div className="admin-tabs" style={{ marginBottom: 18 }}>
        <a href="#" className={activeTab === "split" ? "active" : ""} onClick={(e) => { e.preventDefault(); setActiveTab("split"); }}>Song song (Soạn thảo + Xem trước)</a>
        <a href="#" className={activeTab === "edit" ? "active" : ""} onClick={(e) => { e.preventDefault(); setActiveTab("edit"); }}>Chỉ nhập liệu</a>
        <a href="#" className={activeTab === "preview" ? "active" : ""} onClick={(e) => { e.preventDefault(); setActiveTab("preview"); }}>Chỉ xem trước</a>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: activeTab === "split" ? "1.2fr 0.8fr" : "1fr",
        gap: 24,
        alignItems: "start",
      }}>
        {/* Cột form nhập liệu */}
        {(activeTab === "edit" || activeTab === "split") && (
          <div>
            <div className="field">
              <label>Tiêu đề tài liệu *</label>
              <input required value={f.title} onChange={set("title")} placeholder="Ví dụ: Giáo trình Lập trình Web Full-Stack 2026" />
            </div>

            <div className="field">
              <label>Mô tả tài liệu</label>
              <textarea style={{ minHeight: 90 }} value={f.description} onChange={set("description")} placeholder="Mô tả nội dung tài liệu, dành cho ai, bao gồm những gì..." />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
              <div className="field">
                <label>Danh mục</label>
                <input value={f.category} onChange={set("category")} placeholder="Ví dụ: Lập trình, Ebook, Slide" />
              </div>
              <div className="field">
                <label>Định dạng tệp</label>
                <select value={f.fileType} onChange={set("fileType")}>
                  {FILE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Phiên bản (Version)</label>
                <input value={f.version} onChange={set("version")} placeholder="v1.0 hoặc 2026" />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
              <div className="field">
                <label>Tác giả / Nguồn</label>
                <input value={f.author} onChange={set("author")} placeholder="Tên tác giả hoặc tổ chức" />
              </div>
              <div className="field">
                <label>Dung lượng tệp (tự động hoặc nhập tay)</label>
                <input value={f.size} onChange={set("size")} placeholder="Ví dụ: 12.5 MB" />
              </div>
              <div className="field">
                <label>Thẻ (dấu phẩy)</label>
                <input value={f.tagsText} onChange={set("tagsText")} placeholder="javascript, pdf, guide" />
              </div>
            </div>

            {/* File link & Upload */}
            <div className="field">
              <label>Liên kết tài liệu (URL trực tiếp hoặc Drive / Dropbox / GitHub) *</label>
              <input required value={f.fileUrl} onChange={(e) => {
                const url = e.target.value;
                setF({
                  ...f,
                  fileUrl: url,
                  fileType: f.fileType === "PDF" && url ? detectFileType(url) : f.fileType,
                });
              }} placeholder="https://..." />
            </div>

            <div className="field">
              <label>Hoặc tải tệp lên Firebase Storage {busy && "(Đang tải...)"}</label>
              <input type="file" onChange={pick} />
            </div>

            <div className="field" style={{ marginTop: 12 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <input type="checkbox" style={{ width: "auto" }} checked={f.membersOnly} onChange={(e) => setF({ ...f, membersOnly: e.target.checked })} />
                <span>🔒 Chỉ thành viên đã đăng nhập mới được xem và tải về</span>
              </label>
            </div>
          </div>
        )}

        {/* Cột Xem trước thẻ và file */}
        {(activeTab === "preview" || activeTab === "split") && (
          <div style={{ display: "grid", gap: 16 }}>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 8, fontSize: ".9rem" }}>Xem trước hiển thị (Live Preview):</div>
              <DocCard d={previewDoc} />
            </div>

            {/* Chi tiết thêm về tài liệu */}
            <div className="glass" style={{ padding: 18, borderRadius: 14 }}>
              <div style={{ fontWeight: 600, fontSize: ".85rem", marginBottom: 8, color: "var(--accent)" }}>Thông tin chi tiết:</div>
              <ul style={{ listStyle: "none", fontSize: ".85rem", display: "grid", gap: 6 }}>
                <li><b>Định dạng:</b> {f.fileType || "Chưa chọn"}</li>
                {f.size && <li><b>Dung lượng:</b> {f.size}</li>}
                {f.version && <li><b>Phiên bản:</b> {f.version}</li>}
                {f.author && <li><b>Tác giả:</b> {f.author}</li>}
                <li><b>Truy cập:</b> {f.membersOnly ? "🔒 Thành viên" : "🌐 Công khai"}</li>
              </ul>

              {f.fileUrl && (
                <div style={{ marginTop: 14 }}>
                  <a href={f.fileUrl} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ width: "100%", justifyContent: "center" }}>
                    ↗ Mở thử liên kết trong tab mới
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? "Đang lưu..." : "Lưu tài liệu"}
        </button>
        <button className="btn btn-ghost" type="button" onClick={onDone}>Hủy</button>
      </div>
    </form>
  );
}
