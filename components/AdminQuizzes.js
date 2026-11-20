"use client";
import { useState } from "react";
import Link from "next/link";
import { listItems, saveItem, removeItem, uploadFile, fmtDate } from "@/lib/db";
import useAsync from "@/lib/useAsync";
import { ALL_ICON_TOPICS, IT_ICON_GROUPS, PRESET_COLORS, renderIcon, isImageIcon } from "@/lib/presets";
import QuizEditor from "@/components/QuizEditor";
import { toast } from "@/lib/toast";

const BLANK_TOPIC = { name: "", icon: "https://api.iconify.design/lucide/brain.svg?color=%238b5cf6", color: "#8b5cf6", desc: "", order: 0 };
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
  const [showPicker, setShowPicker] = useState(false);
  const [pickerTab, setPickerTab] = useState("topics"); // "topics" | "search_cdn" | "custom_url"
  const [activeGroup, setActiveGroup] = useState(ALL_ICON_TOPICS[0]?.id || "contact");
  const [iconSearch, setIconSearch] = useState("");
  const [cdnQuery, setCdnQuery] = useState("");
  const [cdnSearchResults, setCdnSearchResults] = useState([]);
  const [searchingCdn, setSearchingCdn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [edit, setEdit] = useState(null);

  // Tìm kiếm icon trực tuyến từ kho Iconify CDN toàn cầu
  const handleSearchCdn = async (q) => {
    const query = (q !== undefined ? q : cdnQuery).trim();
    if (!query) return;
    setSearchingCdn(true);
    try {
      const res = await fetch(`https://api.iconify.design/search?query=${encodeURIComponent(query)}&limit=36`);
      const data = await res.json();
      if (data?.icons && data.icons.length > 0) {
        setCdnSearchResults(
          data.icons.map((name) => ({
            name,
            url: `https://api.iconify.design/${name.replace(":", "/")}.svg`,
          }))
        );
      } else {
        setCdnSearchResults([]);
        toast.info(`Không tìm thấy icon nào với từ khóa "${query}"`);
      }
    } catch (err) {
      console.error("Lỗi tìm kiếm CDN:", err);
      toast.error("Không thể kết nối kho Icon CDN: " + err.message);
    } finally {
      setSearchingCdn(false);
    }
  };

  const handleIconUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingIcon(true);
    try {
      const url = await uploadFile(file);
      setT((prev) => ({ ...prev, icon: url }));
      toast.success("Tải ảnh icon thành công");
    } catch (err) {
      toast.error("Lỗi tải ảnh icon: " + err.message);
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
      toast.success(editingTopic ? "Đã cập nhật chủ đề" : "Đã tạo chủ đề mới");
      resetTopic();
      reload();
    } catch (x) {
      toast.error("Lỗi khi lưu chủ đề: " + x.message);
    }
    setBusy(false);
  }

  async function deleteTopic(topic) {
    const n = countIn(topic.id);
    if (n > 0) {
      toast.error(`Chủ đề "${topic.name}" còn ${n} bộ đề. Hãy chuyển hoặc xóa các bộ đề trước khi xóa chủ đề.`);
      return;
    }
    if (!confirm(`Xóa chủ đề "${topic.name}"?`)) return;
    await removeItem("quizTopics", topic.id);
    toast.success("Đã xóa chủ đề");
    if (editingTopic?.id === topic.id) resetTopic();
    reload();
  }

  const icons = ALL_ICON_TOPICS.find((g) => g.id === activeGroup)?.icons || [];

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
            <label>Icon (Emoji / CDN SVG)</label>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <div style={{
                width: 44, height: 44, borderRadius: 10, border: `1.5px solid ${t.color}`,
                padding: 4, display: "grid", placeItems: "center", background: `${t.color}22`,
                flexShrink: 0, overflow: "hidden",
              }}>
                {renderIcon(t.icon, "🧠", { width: 28, height: 28, color: t.color })}
              </div>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setShowPicker(!showPicker)}
                style={{ height: 44, padding: "0 12px", fontSize: ".8rem" }}
              >
                {showPicker ? "▲ Đóng kho icon" : "🌐 Chọn Icon CDN"}
              </button>
            </div>
          </div>
          <div className="field" style={{ margin: 0, gridColumn: "span 2" }}>
            <label>Tên chủ đề *</label>
            <input required value={t.name} onChange={(e) => setT({ ...t, name: e.target.value })} placeholder="Ví dụ: Lập trình Web, Mạng máy tính..." />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label>Màu chủ đề</label>
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
            {showPicker ? "Ẩn bảng icon" : "🌐 Mở kho Icon CDN Vector (200k+ icon)"}
          </button>
        </div>

        {/* EXPANDABLE CDN ICON PICKER */}
        {showPicker && (
          <div style={{ padding: 16, background: "hsla(0 0% 0% / .3)", borderRadius: 14, border: "1px solid var(--glass-border)", marginBottom: 16 }}>
            {/* 3 Sub-tabs */}
            <div style={{ display: "flex", gap: 8, borderBottom: "1px solid var(--glass-border)", paddingBottom: 10, marginBottom: 14, flexWrap: "wrap" }}>
              <button
                type="button"
                className={`chip ${pickerTab === "topics" ? "on" : ""}`}
                onClick={() => setPickerTab("topics")}
                style={{ fontSize: ".8rem", padding: "6px 14px" }}
              >
                ⚡ 6 Chủ đề Tuyển chọn (216+ Icon)
              </button>
              <button
                type="button"
                className={`chip ${pickerTab === "search_cdn" ? "on" : ""}`}
                onClick={() => setPickerTab("search_cdn")}
                style={{ fontSize: ".8rem", padding: "6px 14px" }}
              >
                🔍 Tìm kiếm CDN Toàn cầu (Iconify)
              </button>
              <button
                type="button"
                className={`chip ${pickerTab === "custom_url" ? "on" : ""}`}
                onClick={() => setPickerTab("custom_url")}
                style={{ fontSize: ".8rem", padding: "6px 14px" }}
              >
                📁 Tải ảnh logo riêng từ máy
              </button>
            </div>

            {/* TAB 1: 6 TOPICS */}
            {pickerTab === "topics" && (
              <div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                  {ALL_ICON_TOPICS.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setActiveGroup(g.id)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 999,
                        fontSize: ".76rem",
                        border: "1px solid var(--glass-border)",
                        background: activeGroup === g.id ? "var(--grad)" : "hsla(0 0% 100% / .06)",
                        color: activeGroup === g.id ? "#fff" : "var(--text)",
                        cursor: "pointer",
                        fontWeight: activeGroup === g.id ? 700 : 500,
                        transition: ".2s",
                      }}
                    >
                      {g.name} ({g.icons.length})
                    </button>
                  ))}
                </div>

                <div style={{ marginBottom: 12 }}>
                  <input
                    value={iconSearch}
                    onChange={(e) => setIconSearch(e.target.value)}
                    placeholder="🔍 Lọc nhanh icon trong chủ đề này..."
                    style={{ fontSize: ".8rem", padding: "6px 12px" }}
                  />
                </div>

                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(105px, 1fr))",
                  gap: 8,
                  maxHeight: 220,
                  overflowY: "auto",
                  padding: 4,
                }}>
                  {(ALL_ICON_TOPICS.find((g) => g.id === activeGroup)?.icons || [])
                    .filter((it) => !iconSearch.trim() || it.label.toLowerCase().includes(iconSearch.toLowerCase()) || it.icon.includes(iconSearch))
                    .map((it) => {
                      const isSelected = t.icon === it.icon;
                      return (
                        <button
                          key={it.label}
                          type="button"
                          title={it.label}
                          onClick={() => {
                            setT({ ...t, icon: it.icon });
                            toast.success(`Đã chọn icon: ${it.label}`);
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "7px 10px",
                            borderRadius: 10,
                            cursor: "pointer",
                            background: isSelected ? `${t.color}33` : "hsla(0 0% 100% / .04)",
                            border: isSelected ? `2px solid ${t.color}` : "1px solid var(--glass-border)",
                            color: "var(--text)",
                            textAlign: "left",
                          }}
                        >
                          <span style={{ fontSize: "1.3rem", lineHeight: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, flexShrink: 0 }}>
                            {renderIcon(it.icon, "📁", { width: 20, height: 20, color: t.color })}
                          </span>
                          <span style={{ fontSize: ".76rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {it.label}
                          </span>
                        </button>
                      );
                    })}
                </div>
              </div>
            )}

            {/* TAB 2: GLOBAL SEARCH */}
            {pickerTab === "search_cdn" && (
              <div>
                <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                  <input
                    value={cdnQuery}
                    onChange={(e) => setCdnQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSearchCdn(cdnQuery);
                      }
                    }}
                    placeholder="Nhập từ khóa tiếng Anh (vd: quiz, brain, code, web, python, react, database, network, security, ai...)"
                    style={{ fontSize: ".8rem", padding: "8px 12px" }}
                  />
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => handleSearchCdn(cdnQuery)}
                    disabled={searchingCdn || !cdnQuery.trim()}
                    style={{ flexShrink: 0, fontSize: ".8rem" }}
                  >
                    {searchingCdn ? "Đang tìm..." : "🔍 Tìm kiếm"}
                  </button>
                </div>

                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                  <span className="muted" style={{ fontSize: ".74rem", alignSelf: "center" }}>Gợi ý:</span>
                  {["quiz", "brain", "code", "terminal", "cpu", "server", "database", "python", "javascript", "react", "network", "lock", "cloud", "book", "award", "star"].map((kw) => (
                    <button
                      key={kw}
                      type="button"
                      className="chip"
                      onClick={() => {
                        setCdnQuery(kw);
                        handleSearchCdn(kw);
                      }}
                      style={{ fontSize: ".72rem", padding: "3px 8px" }}
                    >
                      {kw}
                    </button>
                  ))}
                </div>

                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(46px, 1fr))",
                  gap: 6,
                  maxHeight: 200,
                  overflowY: "auto",
                  padding: 4,
                }}>
                  {cdnSearchResults.map((res, idx) => {
                    const isSelected = t.icon === res.url;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setT({ ...t, icon: res.url });
                          toast.success(`Đã chọn icon CDN: ${res.name}`);
                        }}
                        style={{
                          width: "100%",
                          aspectRatio: "1",
                          display: "grid",
                          placeItems: "center",
                          background: isSelected ? `${t.color}44` : "hsla(0 0% 100% / .06)",
                          border: isSelected ? `2px solid ${t.color}` : "1px solid var(--glass-border)",
                          borderRadius: 10,
                          cursor: "pointer",
                          padding: 8,
                          transition: ".15s",
                        }}
                        title={res.name}
                      >
                        {renderIcon(res.url, "📁", { width: 24, height: 24, color: t.color })}
                      </button>
                    );
                  })}

                  {cdnSearchResults.length === 0 && !searchingCdn && (
                    <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: 20, color: "var(--muted)", fontSize: ".82rem" }}>
                      Nhập từ khóa tiếng Anh ở trên và bấm &quot;Tìm kiếm&quot; để tra cứu hơn 200,000+ vector SVG icons từ CDN toàn cầu.
                    </div>
                  )}

                  {searchingCdn && (
                    <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: 20, color: "var(--accent)", fontSize: ".82rem" }}>
                      <span className="spinner" style={{ width: 16, height: 16, display: "inline-block", verticalAlign: "middle", marginRight: 8 }} />
                      Đang tra cứu Icon CDN...
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: UPLOAD TỪ MÁY */}
            {pickerTab === "custom_url" && (
              <div style={{ padding: "10px 0" }}>
                <p className="muted" style={{ fontSize: ".82rem", marginBottom: 12 }}>
                  Tải tệp hình ảnh biểu trưng riêng cho chủ đề từ máy tính (PNG, SVG, JPG, WEBP):
                </p>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <label
                    className="btn btn-primary btn-sm"
                    style={{ cursor: uploadingIcon ? "wait" : "pointer", fontSize: ".82rem", display: "inline-flex", alignItems: "center", gap: 8 }}
                  >
                    {uploadingIcon ? "⏳ Đang tải ảnh..." : "📁 Tải ảnh từ máy tính"}
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
                      onClick={() => setT({ ...t, icon: "🧠" })}
                      style={{ color: "var(--danger)" }}
                    >
                      Dùng lại emoji mặc định (🧠)
                    </button>
                  )}
                </div>
              </div>
            )}
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
            <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: 1 }}>
              <span style={{
                fontSize: "1.5rem", width: 42, height: 42, display: "grid", placeItems: "center",
                background: `${c.color}22`, borderRadius: 10, border: `1px solid ${c.color}66`,
                overflow: "hidden", padding: isImageIcon(c.icon) ? 4 : 0, flexShrink: 0,
              }}>{renderIcon(c.icon, "🧠")}</span>
              <div style={{ minWidth: 0, flex: 1 }}>
                <b style={{ color: c.color, wordBreak: "break-word" }}>{c.name}</b>
                <div className="muted" style={{ fontSize: ".8rem", wordBreak: "break-word" }}>
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
          <div style={{ minWidth: 0, flex: 1 }}>
            <b style={{ wordBreak: "break-word" }}>{q.title}</b>{" "}
            <span className={`badge ${q.published ? "" : "draft"}`} style={{ whiteSpace: "nowrap" }}>{q.published ? "Đã đăng" : "Nháp"}</span>{" "}
            {q.membersOnly && <span className="badge draft" style={{ whiteSpace: "nowrap" }}>🔒 Chỉ thành viên</span>}
            <div className="muted" style={{ fontSize: ".8rem", wordBreak: "break-word" }}>
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
