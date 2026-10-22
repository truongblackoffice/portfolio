"use client";
import { useState } from "react";
import Link from "next/link";
import { listItems, saveItem, removeItem, uploadFile, fmtDate } from "@/lib/db";
import useAsync from "@/lib/useAsync";
import { IT_ICON_GROUPS, PRESET_COLORS, renderIcon, isImageIcon } from "@/lib/presets";
import QuizEditor from "@/components/QuizEditor";

const BLANK_TOPIC = { name: "", icon: "🧠", color: "#8b5cf6", desc: "", order: 0 };
const BLANK_QUIZ = {
  title: "", description: "", topicId: "", tags: [], published: true, membersOnly: false,
  timeLimitMin: 0, passPercent: 50, shuffleQuestions: true, shuffleOptions: true, questions: [],
};

export default function AdminQuizzes() {
  const { data, reload } = useAsync(async () => {
    const [topics, quizzes] = await Promise.all([listItems("quizTopics"), listItems("quizzes")]);
    return { topics, quizzes };
  });
  const [t, setT] = useState(BLANK_TOPIC);
  const [editingTopic, setEditingTopic] = useState(null);
  const [group, setGroup] = useState("dev");
  const [showPicker, setShowPicker] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [edit, setEdit] = useState(null);

  const handleIconUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingIcon(true);
    try {
      const url = await uploadFile(file);
      setT((prev) => ({ ...prev, icon: url }));
    } catch (err) {
      alert("Lỗi tải ảnh icon: " + err.message);
    }
    setUploadingIcon(false);
    e.target.value = "";
  };

  const topics = [...(data?.topics || [])].sort(
    (a, b) => (a.order ?? 9999) - (b.order ?? 9999) || String(a.name).localeCompare(String(b.name), "vi"));
  const quizzes = data?.quizzes || [];
  const topicName = (id) => topics.find((x) => x.id === id)?.name || "Chưa phân loại";
  const countIn = (id) => quizzes.filter((q) => q.topicId === id).length;

  if (edit) {
    return <QuizEditor item={edit} topics={topics} onDone={() => { setEdit(null); reload(); }} />;
  }

  const resetTopic = () => { setT(BLANK_TOPIC); setEditingTopic(null); };

  async function submitTopic(e) {
    e.preventDefault();
    if (!t.name.trim()) return;
    setBusy(true);
    try {
      await saveItem("quizTopics", {
        ...(editingTopic ? { id: editingTopic.id, createdAt: editingTopic.createdAt } : {}),
        name: t.name.trim(), icon: t.icon || "📁", color: t.color || "#8b5cf6",
        desc: t.desc.trim(), order: Number(t.order) || 0,
      });
      resetTopic();
      reload();
    } catch (x) {
      alert("Lỗi khi lưu chủ đề: " + x.message);
    }
    setBusy(false);
  }

  async function deleteTopic(topic) {
    const n = countIn(topic.id);
    if (n > 0) {
      alert(`Chủ đề "${topic.name}" còn ${n} bộ đề. Hãy chuyển hoặc xóa các bộ đề trước khi xóa chủ đề.`);
      return;
    }
    if (!confirm(`Xóa chủ đề "${topic.name}"?`)) return;
    await removeItem("quizTopics", topic.id);
    if (editingTopic?.id === topic.id) resetTopic();
    reload();
  }

  const icons = IT_ICON_GROUPS.find((g) => g.id === group)?.icons || [];

  return (
    <div className="glass reveal" style={{ padding: 28, borderRadius: "var(--radius)" }}>
      <h2>Quản lý ôn tập trắc nghiệm</h2>
      <p className="muted" style={{ marginBottom: 22, fontSize: ".9rem" }}>
        Tạo chủ đề, sau đó thêm các bộ đề trắc nghiệm vào từng chủ đề. Người xem có thể ôn tập, thi thử và xem lời giải theo chủ đề.
      </p>

      {/* ----- Chủ đề ----- */}
      <form onSubmit={submitTopic} className="glass" style={{ padding: 20, borderRadius: 16, marginBottom: 26 }}>
        <h3 style={{ fontSize: "1.1rem", marginBottom: 14 }}>
          {editingTopic ? `✏️ Sửa chủ đề: "${editingTopic.name}"` : "+ Thêm chủ đề mới"}
        </h3>

        {/* Xem trước trực tiếp (Live Preview) */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", background: "hsla(0 0% 100% / .03)", borderRadius: 12, marginBottom: 16, border: "1px dashed var(--glass-border)" }}>
          <span style={{ fontSize: ".82rem", color: "var(--muted)" }}>Xem trước hiển thị:</span>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{
              fontSize: "1.6rem", width: 44, height: 44, display: "grid", placeItems: "center",
              background: `${t.color}22`, borderRadius: 10, border: `1px solid ${t.color}66`,
              overflow: "hidden", padding: isImageIcon(t.icon) ? 4 : 0,
            }}>
              {renderIcon(t.icon, "🧠")}
            </span>
            <div>
              <b style={{ fontSize: "1.05rem", color: t.color }}>{t.name || "Tên chủ đề..."}</b>
              {t.desc && <span className="muted" style={{ fontSize: ".82rem", marginLeft: 8 }}>— {t.desc}</span>}
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, alignItems: "end" }}>
          <div className="field" style={{ margin: 0 }}>
            <label>Icon (Emoji / Ảnh)</label>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              {isImageIcon(t.icon) ? (
                <div style={{
                  width: 44, height: 44, borderRadius: 8, border: "1px solid var(--glass-border)",
                  padding: 4, display: "grid", placeItems: "center", background: "rgba(255,255,255,0.05)",
                  flexShrink: 0,
                }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={t.icon} alt="Icon" style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: 4 }} />
                </div>
              ) : (
                <input
                  value={t.icon}
                  onChange={(e) => setT({ ...t, icon: e.target.value })}
                  style={{ textAlign: "center", fontSize: "1.3rem", width: 56 }}
                />
              )}
              <label
                className="btn btn-ghost btn-sm"
                style={{ cursor: "pointer", margin: 0, height: 44, display: "inline-flex", alignItems: "center", padding: "0 10px", fontSize: ".8rem" }}
                title="Tải ảnh icon từ máy tính (PNG, SVG, JPG, WEBP)"
              >
                {uploadingIcon ? "⏳" : "📷 Tải ảnh"}
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  disabled={uploadingIcon}
                  onChange={handleIconUpload}
                />
              </label>
              {isImageIcon(t.icon) && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ height: 44, padding: "0 8px", color: "var(--danger, #ef4444)" }}
                  onClick={() => setT((prev) => ({ ...prev, icon: "🧠" }))}
                  title="Xóa ảnh và dùng emoji"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
          <div className="field" style={{ margin: 0, gridColumn: "span 2" }}>
            <label>Tên chủ đề *</label>
            <input required value={t.name} onChange={(e) => setT({ ...t, name: e.target.value })} placeholder="Ví dụ: Lập trình Web, Mạng máy tính..." />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label>Màu</label>
            <input type="color" value={t.color} onChange={(e) => setT({ ...t, color: e.target.value })} style={{ width: 52, height: 44, padding: 3 }} />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label>Thứ tự (nhỏ hiện trước)</label>
            <input type="number" value={t.order} onChange={(e) => setT({ ...t, order: e.target.value })} />
          </div>
        </div>
        <div className="field" style={{ marginTop: 12 }}>
          <label>Mô tả ngắn</label>
          <input value={t.desc} onChange={(e) => setT({ ...t, desc: e.target.value })} placeholder="Chủ đề này gồm những nội dung gì?" />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          <span className="muted" style={{ fontSize: ".8rem" }}>Màu gợi ý:</span>
          {PRESET_COLORS.map((p) => (
            <button
              key={p.color} type="button" title={p.name} aria-label={p.name} onClick={() => setT({ ...t, color: p.color })}
              style={{
                width: 24, height: 24, borderRadius: "50%", background: p.color, cursor: "pointer",
                border: t.color === p.color ? "2px solid #fff" : "1px solid transparent",
                transform: t.color === p.color ? "scale(1.2)" : "scale(1)",
              }}
            />
          ))}
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowPicker(!showPicker)}>
            {showPicker ? "Ẩn bảng icon" : "Chọn icon CNTT"}
          </button>
        </div>
        {showPicker && (
          <div style={{ padding: 12, background: "hsla(0 0% 0% / .2)", borderRadius: 12, border: "1px solid var(--glass-border)", marginBottom: 14 }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
              {IT_ICON_GROUPS.map((g) => (
                <button key={g.id} type="button" className={`chip ${group === g.id ? "on" : ""}`} onClick={() => setGroup(g.id)}>{g.name}</button>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 8, maxHeight: 200, overflowY: "auto" }}>
              {icons.map((it) => (
                <button
                  key={it.label} type="button" title={it.label} onClick={() => setT({ ...t, icon: it.icon })}
                  style={{
                    display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 10, cursor: "pointer",
                    background: t.icon === it.icon ? `${t.color}33` : "hsla(0 0% 100% / .04)",
                    border: t.icon === it.icon ? `1.5px solid ${t.color}` : "1px solid var(--glass-border)",
                    color: "var(--text)", textAlign: "left",
                  }}
                >
                  <span style={{ fontSize: "1.3rem", lineHeight: 1 }}>{it.icon}</span>
                  <span style={{ fontSize: ".78rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-primary btn-sm" type="submit" disabled={busy}>
            {busy ? "Đang lưu..." : editingTopic ? "💾 Cập nhật chủ đề" : "+ Tạo chủ đề"}
          </button>
          {editingTopic && <button className="btn btn-ghost btn-sm" type="button" onClick={resetTopic}>Hủy</button>}
        </div>
      </form>

      <h3 style={{ fontSize: "1.1rem", marginBottom: 12 }}>Chủ đề ({topics.length})</h3>
      <div style={{ display: "grid", gap: 10, marginBottom: 30 }}>
        {topics.map((c) => (
          <div className="row glass" key={c.id} style={{ margin: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{
                fontSize: "1.5rem", width: 42, height: 42, display: "grid", placeItems: "center",
                background: `${c.color}22`, borderRadius: 10, border: `1px solid ${c.color}66`,
                overflow: "hidden", padding: isImageIcon(c.icon) ? 4 : 0,
              }}>{renderIcon(c.icon, "🧠")}</span>
              <div>
                <b style={{ color: c.color }}>{c.name}</b>
                <div className="muted" style={{ fontSize: ".8rem" }}>
                  {countIn(c.id)} bộ đề · thứ tự {c.order ?? 0}{c.desc ? ` · ${c.desc}` : ""}
                </div>
              </div>
            </div>
            <div className="actions">
              <Link href={`/quiz/topic/${c.id}`} target="_blank" className="btn btn-ghost btn-sm">Xem ↗</Link>
              <button className="btn btn-ghost btn-sm" onClick={() => {
                setEditingTopic(c);
                setT({ name: c.name, icon: c.icon || "📁", color: c.color || "#8b5cf6", desc: c.desc || "", order: c.order ?? 0 });
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}>Sửa</button>
              <button className="btn btn-danger btn-sm" onClick={() => deleteTopic(c)}>Xóa</button>
            </div>
          </div>
        ))}
        {!topics.length && <div className="empty">Chưa có chủ đề nào. Bộ đề không chọn chủ đề sẽ nằm trong “Chưa phân loại”.</div>}
      </div>

      {/* ----- Bộ đề ----- */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
        <h3 style={{ fontSize: "1.1rem" }}>Bộ đề ({quizzes.length})</h3>
        <button className="btn btn-primary" id="new-quiz" onClick={() => setEdit({ ...BLANK_QUIZ })}>+ Tạo bộ đề</button>
      </div>
      {quizzes.map((q) => (
        <div className="row glass" key={q.id}>
          <div>
            <b>{q.title}</b>{" "}
            <span className={`badge ${q.published ? "" : "draft"}`}>{q.published ? "Đã đăng" : "Nháp"}</span>{" "}
            {q.membersOnly && <span className="badge draft">🔒 Chỉ thành viên</span>}
            <div className="muted" style={{ fontSize: ".8rem" }}>
              {topicName(q.topicId)} · {q.questions?.length || 0} câu
              {q.timeLimitMin > 0 ? ` · ${q.timeLimitMin} phút` : ""} · {fmtDate(q.createdAt)}
            </div>
          </div>
          <div className="actions">
            <Link href={`/quiz/${q.id}`} target="_blank" className="btn btn-ghost btn-sm">Xem ↗</Link>
            <button className="btn btn-ghost btn-sm" onClick={() => setEdit(q)}>Sửa</button>
            <button className="btn btn-danger btn-sm" onClick={async () => {
              if (confirm(`Xóa bộ đề "${q.title}"?`)) { await removeItem("quizzes", q.id); reload(); }
            }}>Xóa</button>
          </div>
        </div>
      ))}
      {!quizzes.length && <div className="empty">Chưa có bộ đề nào. Bấm “+ Tạo bộ đề” rồi dùng “Chèn đề mẫu” để thử nhanh.</div>}
    </div>
  );
}
