"use client";
import { useState } from "react";
import { listItems, saveItem, removeItem, uploadFile, fmtDate, isDemo } from "@/lib/db";
import useAsync from "@/lib/useAsync";

export default function AdminMedia() {
  const { data: mediaList, reload } = useAsync(() => listItems("media"));
  const [busy, setBusy] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [err, setErr] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [nameInput, setNameInput] = useState("");

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setBusy(true); setErr("");
    try {
      const url = await uploadFile(file);
      await saveItem("media", {
        name: file.name,
        url,
        size: (file.size / 1024).toFixed(1) + " KB",
        type: file.type.startsWith("image/") ? "image" : "file",
      });
      reload();
    } catch (x) {
      setErr(x.message + " (Gợi ý: bạn có thể dán đường link ảnh trực tiếp vào ô bên dưới)");
    }
    setBusy(false);
    e.target.value = "";
  };

  const handleAddLink = async (e) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    setBusy(true); setErr("");
    try {
      await saveItem("media", {
        name: nameInput.trim() || urlInput.split("/").pop() || "Media link",
        url: urlInput.trim(),
        size: "External Link",
        type: "image",
      });
      setUrlInput("");
      setNameInput("");
      reload();
    } catch (x) {
      setErr(x.message || "Lỗi khi lưu link media");
    }
    setBusy(false);
  };

  const copyToClipboard = (item) => {
    navigator.clipboard.writeText(item.url);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="glass reveal" style={{ padding: 28, borderRadius: "var(--radius)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2>Thư viện Media &amp; Tệp tin</h2>
          <span className="muted" style={{ fontSize: ".85rem" }}>Tải lên, quản lý hình ảnh và sao chép link chèn nhanh vào bài viết</span>
        </div>
        <label className="btn btn-primary btn-sm" style={{ cursor: "pointer", margin: 0 }}>
          {busy ? "Đang tải lên..." : "+ Tải ảnh lên"}
          <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleUpload} disabled={busy} />
        </label>
      </div>

      {err && <div className="msg err">{err}</div>}

      {/* Thêm link ngoài */}
      <form onSubmit={handleAddLink} style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
        <input
          style={{ flex: 1, minWidth: 240 }}
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="Hoặc dán URL ảnh có sẵn (https://images.unsplash.com/...)..."
        />
        <input
          style={{ width: 180 }}
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          placeholder="Tên gợi nhớ..."
        />
        <button type="submit" className="btn btn-ghost btn-sm" disabled={busy || !urlInput.trim()}>
          + Lưu vào thư viện
        </button>
      </form>

      {/* Danh sách Media Grid */}
      {(!mediaList || mediaList.length === 0) ? (
        <div className="empty">Thư viện trống. Hãy bấm &quot;+ Tải ảnh lên&quot; hoặc dán URL ảnh để lưu trữ.</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 18 }}>
          {mediaList.map((m) => (
            <div className="glass" key={m.id} style={{ borderRadius: 14, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <div style={{ height: 140, background: "hsla(0 0% 0% / .3)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={m.url}
                  alt={m.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={(e) => { e.target.style.display = "none"; }}
                />
              </div>
              <div style={{ padding: 12, flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ fontWeight: 600, fontSize: ".85rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={m.name}>
                  {m.name}
                </div>
                <div className="muted" style={{ fontSize: ".75rem" }}>
                  {m.size} · {fmtDate(m.createdAt)}
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: "auto", paddingTop: 8 }}>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    style={{ flex: 1, fontSize: ".78rem", padding: "4px 8px" }}
                    onClick={() => copyToClipboard(m)}
                  >
                    {copiedId === m.id ? "✓ Đã chép!" : "Sao chép Link"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    style={{ padding: "4px 8px" }}
                    onClick={async () => { if (confirm("Xóa ảnh này khỏi thư viện?")) { await removeItem("media", m.id); reload(); } }}
                    title="Xóa"
                  >
                    🗑
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
