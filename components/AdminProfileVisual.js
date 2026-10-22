"use client";
import { useEffect, useState } from "react";
import { getProfile, saveProfile, uploadFile } from "@/lib/db";
import useAsync from "@/lib/useAsync";

export default function AdminProfileVisual() {
  const { data, reload } = useAsync(getProfile);
  const [f, setF] = useState(null);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const [syncedKey, setSyncedKey] = useState(null);

  if (data && syncedKey !== (data.name || "init")) {
    setSyncedKey(data.name || "init");
    setF({
      name: data.name || "",
      title: data.title || "",
      bio: data.bio || "",
      avatar: data.avatar || "/avatar.jpg",
      skills: data.skills || [],
      experience: data.experience || [],
      socials: {
        github: data.socials?.github || "",
        linkedin: data.socials?.linkedin || "",
        facebook: data.socials?.facebook || "",
        email: data.socials?.email || "",
      },
    });
  }

  if (!f) return <div className="empty">Đang tải hồ sơ...</div>;

  const set = (k) => (e) => { setOk(false); setF({ ...f, [k]: e.target.value }); };
  const soc = (k) => (e) => { setOk(false); setF({ ...f, socials: { ...f.socials, [k]: e.target.value } }); };

  // Kỹ năng
  const addSkill = (e) => {
    e.preventDefault();
    const val = newSkill.trim();
    if (!val || f.skills.includes(val)) return;
    setF({ ...f, skills: [...f.skills, val] });
    setNewSkill("");
    setOk(false);
  };
  const removeSkill = (sk) => {
    setF({ ...f, skills: f.skills.filter((s) => s !== sk) });
    setOk(false);
  };

  // Kinh nghiệm
  const addExp = () => {
    setF({
      ...f,
      experience: [
        ...f.experience,
        { period: "2025 - Nay", role: "Vị trí công việc", place: "Tên công ty/dự án", desc: "Mô tả công việc và thành tựu..." },
      ],
    });
    setOk(false);
  };
  const updateExp = (index, field, val) => {
    const list = [...f.experience];
    list[index] = { ...list[index], [field]: val };
    setF({ ...f, experience: list });
    setOk(false);
  };
  const removeExp = (index) => {
    setF({ ...f, experience: f.experience.filter((_, i) => i !== index) });
    setOk(false);
  };

  // Upload avatar
  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setBusy(true); setErr("");
    try {
      const url = await uploadFile(file);
      setF({ ...f, avatar: url });
      setOk(false);
    } catch (x) {
      setErr(x.message + " (Bạn có thể dán đường link ảnh bên dưới)");
    }
    setBusy(false);
  };

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setErr("");
    try {
      const current = await getProfile();
      await saveProfile({
        ...current,
        name: f.name,
        title: f.title,
        bio: f.bio,
        avatar: f.avatar,
        skills: f.skills,
        experience: f.experience,
        socials: f.socials,
      });
      setOk(true);
      reload();
    } catch (x) {
      setErr(x.message || "Lỗi khi lưu hồ sơ.");
    }
    setBusy(false);
  }

  return (
    <form className="glass reveal" style={{ padding: 28, borderRadius: "var(--radius)" }} onSubmit={submit} id="profile-form">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2>Quản lý hồ sơ cá nhân</h2>
          <span className="muted" style={{ fontSize: ".85rem" }}>Thông tin giới thiệu, kỹ năng và kinh nghiệm hiển thị ngoài website</span>
        </div>
        <button className="btn btn-primary" type="submit" disabled={busy} id="save-profile">
          {busy ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
      </div>

      {ok && <div className="msg ok">✅ Đã lưu hồ sơ thành công!</div>}
      {err && <div className="msg err">{err}</div>}

      {/* Thông tin cơ bản */}
      <h3 style={{ margin: "20px 0 14px", borderBottom: "1px solid var(--glass-border)", paddingBottom: 8 }}>1. Thông tin chung &amp; Ảnh đại diện</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 240px", gap: 24, alignItems: "start", flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="field">
              <label>Họ và tên *</label>
              <input required value={f.name} onChange={set("name")} placeholder="Ví dụ: Nguyễn Mạnh Trường" />
            </div>
            <div className="field">
              <label>Chức danh / Nghề nghiệp</label>
              <input value={f.title} onChange={set("title")} placeholder="Ví dụ: Lập trình viên Full-stack" />
            </div>
          </div>
          <div className="field">
            <label>Tiểu sử / Giới thiệu ngắn</label>
            <textarea style={{ minHeight: 90 }} value={f.bio} onChange={set("bio")} placeholder="Giới thiệu đôi nét về đam mê, phương châm sống..." />
          </div>
        </div>

        {/* Avatar Box */}
        <div className="glass" style={{ padding: 16, textAlign: "center", borderRadius: 14 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={f.avatar || "/avatar.jpg"}
            alt="Avatar"
            style={{ width: 120, height: 120, borderRadius: "50%", objectFit: "cover", margin: "0 auto 10px", border: "2px solid var(--primary)" }}
          />
          <div className="field" style={{ marginBottom: 8 }}>
            <label style={{ fontSize: ".75rem" }}>URL Ảnh đại diện</label>
            <input value={f.avatar} onChange={set("avatar")} placeholder="https://..." style={{ fontSize: ".8rem", padding: "6px 8px" }} />
          </div>
          <label className="btn btn-ghost btn-sm" style={{ cursor: "pointer", width: "100%", justifyContent: "center" }}>
            Tải ảnh lên
            <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarUpload} />
          </label>
        </div>
      </div>

      {/* Kỹ năng */}
      <h3 style={{ margin: "28px 0 14px", borderBottom: "1px solid var(--glass-border)", paddingBottom: 8 }}>2. Kỹ năng chuyên môn</h3>
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 10, maxWidth: 440, marginBottom: 14 }}>
          <input
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") addSkill(e); }}
            placeholder="Nhập kỹ năng (e.g. Next.js, Docker, Python)..."
          />
          <button type="button" className="btn btn-ghost" onClick={addSkill}>+ Thêm</button>
        </div>
        <div className="chips">
          {f.skills.map((sk) => (
            <span className="chip" key={sk} style={{ display: "inline-flex", alignItems: "center", gap: 6, paddingRight: 8 }}>
              {sk}
              <button
                type="button"
                onClick={() => removeSkill(sk)}
                style={{ background: "none", border: "none", color: "var(--danger)", cursor: "pointer", fontWeight: "bold", fontSize: "1rem", lineHeight: 1 }}
                title="Xóa kỹ năng"
              >
                ×
              </button>
            </span>
          ))}
          {!f.skills.length && <span className="muted" style={{ fontStyle: "italic" }}>Chưa có kỹ năng nào. Thêm kỹ năng ở trên.</span>}
        </div>
      </div>

      {/* Kinh nghiệm */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "28px 0 14px", borderBottom: "1px solid var(--glass-border)", paddingBottom: 8 }}>
        <h3>3. Quá trình kinh nghiệm &amp; Học vấn</h3>
        <button type="button" className="btn btn-ghost btn-sm" onClick={addExp}>+ Thêm mốc kinh nghiệm</button>
      </div>

      <div style={{ display: "grid", gap: 14 }}>
        {f.experience.map((exp, idx) => (
          <div className="glass" key={idx} style={{ padding: 18, borderRadius: 12, position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span className="badge">Mục #{idx + 1}</span>
              <button type="button" className="btn btn-danger btn-sm" onClick={() => removeExp(idx)}>Xóa mục này</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "180px 1fr 1fr", gap: 12, marginBottom: 10 }}>
              <div className="field" style={{ margin: 0 }}>
                <label>Thời gian</label>
                <input value={exp.period || ""} onChange={(e) => updateExp(idx, "period", e.target.value)} placeholder="2024 - nay" />
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label>Vai trò / Chức danh</label>
                <input value={exp.role || ""} onChange={(e) => updateExp(idx, "role", e.target.value)} placeholder="Full-stack Developer" />
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label>Nơi làm việc / Cơ quan</label>
                <input value={exp.place || ""} onChange={(e) => updateExp(idx, "place", e.target.value)} placeholder="Tên công ty hoặc trường" />
              </div>
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label>Mô tả chi tiết</label>
              <textarea style={{ minHeight: 60 }} value={exp.desc || ""} onChange={(e) => updateExp(idx, "desc", e.target.value)} placeholder="Nhiệm vụ chính, kết quả đạt được..." />
            </div>
          </div>
        ))}
        {!f.experience.length && <div className="muted" style={{ fontStyle: "italic" }}>Chưa có mốc kinh nghiệm nào. Bấm nút &quot;+ Thêm mốc kinh nghiệm&quot; để tạo mới.</div>}
      </div>

      {/* Mạng xã hội */}
      <h3 style={{ margin: "28px 0 14px", borderBottom: "1px solid var(--glass-border)", paddingBottom: 8 }}>4. Liên kết mạng xã hội</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
        <div className="field">
          <label>GitHub</label>
          <input value={f.socials.github} onChange={soc("github")} placeholder="https://github.com/..." />
        </div>
        <div className="field">
          <label>LinkedIn</label>
          <input value={f.socials.linkedin} onChange={soc("linkedin")} placeholder="https://linkedin.com/in/..." />
        </div>
        <div className="field">
          <label>Facebook</label>
          <input value={f.socials.facebook} onChange={soc("facebook")} placeholder="https://facebook.com/..." />
        </div>
        <div className="field">
          <label>Email liên hệ công khai</label>
          <input value={f.socials.email} onChange={soc("email")} placeholder="email@example.com" />
        </div>
      </div>

      <div style={{ marginTop: 26 }}>
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? "Đang lưu..." : "Lưu thay đổi hồ sơ"}
        </button>
      </div>
    </form>
  );
}
