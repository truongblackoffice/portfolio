"use client";
import { useState } from "react";
import { saveItem } from "@/lib/db";
import { QUESTION_TYPES, TF_OPTIONS, newQuestion, validateQuiz } from "@/lib/quiz";
import {
  parseQuizInput,
  SAMPLE_QUIZ_TEXT,
  SAMPLE_QUIZ_JSON,
  SAMPLE_JSON_GUIDED,
  SAMPLE_JSON_SIMPLE,
  SAMPLE_AI_PROMPT,
} from "@/lib/quizParser";
import { isImageIcon } from "@/lib/presets";
import AIQuizGenerator from "./AIQuizGenerator";

const csv = (s) => s.split(",").map((x) => x.trim()).filter(Boolean);
const uid = (i = 0) => `q-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}-${i}`;

export default function QuizEditor({ item, topics, onDone }) {
  const [f, setF] = useState({
    title: "", description: "", topicId: "", questions: [],
    ...item,
    tagsText: (item.tags || []).join(", "),
    published: item.published !== false,
    membersOnly: Boolean(item.membersOnly),
    timeLimitMin: item.timeLimitMin ?? 0,
    passPercent: item.passPercent ?? 50,
    maxExamPerHour: item.maxExamPerHour !== undefined ? item.maxExamPerHour : 5,
    examQuestionCount: item.examQuestionCount ?? 0,
    practiceQuestionCount: item.practiceQuestionCount ?? 0,
    shuffleQuestions: item.shuffleQuestions !== false,
    shuffleOptions: item.shuffleOptions !== false,
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [errors, setErrors] = useState([]);
  const [bulk, setBulk] = useState("");
  const [preview, setPreview] = useState(null);
  const [copiedJson, setCopiedJson] = useState(false);
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [activeJsonTab, setActiveJsonTab] = useState("guided"); // guided | simple | ai
  const [copiedModalTab, setCopiedModalTab] = useState(false);

  const handleApplyAiQuestions = (newQuestions, replaceAll, titleSuggestion) => {
    setF((p) => ({
      ...p,
      title: !p.title && titleSuggestion ? titleSuggestion : p.title,
      questions: replaceAll ? newQuestions : [...p.questions, ...newQuestions],
    }));
  };

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const num = (k) => (e) => setF({ ...f, [k]: Math.max(0, parseInt(e.target.value, 10) || 0) });
  const check = (k) => (e) => setF({ ...f, [k]: e.target.checked });

  const setQ = (i, patch) => setF((p) => ({ ...p, questions: p.questions.map((q, j) => (j === i ? { ...q, ...patch } : q)) }));
  const addQ = (type = "single") => setF((p) => ({ ...p, questions: [...p.questions, newQuestion(type)] }));
  const delQ = (i) => setF((p) => ({ ...p, questions: p.questions.filter((_, j) => j !== i) }));
  const moveQ = (i, d) => setF((p) => {
    const qs = [...p.questions];
    const j = i + d;
    if (j < 0 || j >= qs.length) return p;
    [qs[i], qs[j]] = [qs[j], qs[i]];
    return { ...p, questions: qs };
  });

  const changeType = (i, type) => {
    const q = f.questions[i];
    if (type === "truefalse") return setQ(i, { type, options: [...TF_OPTIONS], correct: [0] });
    if (q.type === "truefalse") return setQ(i, { type, options: ["", "", "", ""], correct: [] });
    setQ(i, { type, correct: type === "single" ? q.correct.slice(0, 1) : q.correct });
  };
  const setOption = (i, oi, text) => setQ(i, { options: f.questions[i].options.map((o, k) => (k === oi ? text : o)) });
  const addOption = (i) => setQ(i, { options: [...f.questions[i].options, ""] });
  const delOption = (i, oi) => {
    const q = f.questions[i];
    setQ(i, {
      options: q.options.filter((_, k) => k !== oi),
      correct: q.correct.filter((c) => c !== oi).map((c) => (c > oi ? c - 1 : c)),
    });
  };
  const toggleCorrect = (i, oi) => {
    const q = f.questions[i];
    if (q.type === "multiple") {
      setQ(i, { correct: q.correct.includes(oi) ? q.correct.filter((c) => c !== oi) : [...q.correct, oi].sort((a, b) => a - b) });
    } else setQ(i, { correct: [oi] });
  };

  const runPreview = () => setPreview(parseQuizInput(bulk));
  const applyPreview = (replace) => {
    if (!preview?.questions.length) return;
    const fresh = preview.questions.map((q, i) => ({ ...q, id: uid(i) }));
    setF((p) => ({ ...p, questions: replace ? fresh : [...p.questions, ...fresh] }));
    setBulk(""); setPreview(null);
  };

  async function submit(e) {
    e.preventDefault();
    const v = validateQuiz(f);
    setErrors(v);
    if (v.length) {
      setErr(`Có ${v.length} lỗi cần sửa trước khi lưu.`);
      return;
    }
    setBusy(true); setErr("");
    try {
      const { tagsText, ...rest } = f;
      await saveItem("quizzes", {
        ...rest,
        title: rest.title.trim(),
        tags: csv(tagsText),
        topicId: rest.topicId || "",
      });
      onDone();
    } catch (x) {
      setErr(x.message || "Lỗi khi lưu bộ đề");
    }
    setBusy(false);
  }

  const qErrors = (i) => errors.filter((x) => x.qIndex === i);
  const general = errors.filter((x) => x.qIndex === -1);

  return (
    <form className="glass reveal" style={{ padding: 28, borderRadius: "var(--radius)", marginBottom: 30 }} onSubmit={submit} id="quiz-form">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2>{item.id ? "Chỉnh sửa bộ đề" : "Tạo bộ đề mới"}</h2>
          <span className="muted" style={{ fontSize: ".85rem" }}>{f.questions.length} câu hỏi</span>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-ghost btn-sm" type="button" onClick={onDone}>Hủy</button>
          <button className="btn btn-primary btn-sm" type="submit" disabled={busy} id="save-quiz">{busy ? "Đang lưu..." : "Lưu bộ đề"}</button>
        </div>
      </div>

      {err && <div className="msg err">{err}</div>}
      {general.map((x, k) => <div className="msg err" key={k}>{x.message}</div>)}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
        <div className="field">
          <label>Tiêu đề bộ đề *</label>
          <input required value={f.title} onChange={set("title")} placeholder="Ví dụ: HTML cơ bản - Đề 1" />
        </div>
        <div className="field">
          <label>Chủ đề</label>
          <select value={f.topicId} onChange={set("topicId")}>
            <option value="">— Chưa phân loại —</option>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {isImageIcon(t.icon) ? "🖼️" : (t.icon || "📁")} {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="field">
        <label>Mô tả</label>
        <textarea rows={2} style={{ minHeight: 70 }} value={f.description} onChange={set("description")} placeholder="Giới thiệu ngắn về bộ đề..." />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
        <div className="field">
          <label>Thẻ (cách nhau bằng dấu phẩy)</label>
          <input value={f.tagsText} onChange={set("tagsText")} placeholder="html, web" />
        </div>
        <div className="field">
          <label>Thời gian thi thử (phút, 0 = không giới hạn)</label>
          <input type="number" min={0} value={f.timeLimitMin} onChange={num("timeLimitMin")} />
        </div>
        <div className="field">
          <label>Điểm đạt (%)</label>
          <input type="number" min={0} max={100} value={f.passPercent} onChange={num("passPercent")} />
        </div>
        <div className="field">
          <label>Lượt thi thử / 1 giờ (0 = vô hạn)</label>
          <input type="number" min={0} max={100} value={f.maxExamPerHour ?? 5} onChange={num("maxExamPerHour")} placeholder="5" />
          <small className="muted" style={{ fontSize: "0.78rem" }}>Chế độ Ôn tập luôn vô hạn lần</small>
        </div>
        <div className="field">
          <label>Số câu khi Thi thử (0 = tất cả)</label>
          <input
            type="number"
            min={0}
            max={1000}
            value={f.examQuestionCount ?? 0}
            onChange={num("examQuestionCount")}
            placeholder="0"
          />
          <small className="muted" style={{ fontSize: "0.78rem" }}>Ví dụ: Đề 200 câu, nhập 40 để lấy ngẫu nhiên 40 câu</small>
        </div>
        <div className="field">
          <label>Số câu khi Ôn tập (0 = tất cả)</label>
          <input
            type="number"
            min={0}
            max={1000}
            value={f.practiceQuestionCount ?? 0}
            onChange={num("practiceQuestionCount")}
            placeholder="0"
          />
          <small className="muted" style={{ fontSize: "0.78rem" }}>Số câu gợi ý khi học viên chọn Ôn tập</small>
        </div>
      </div>
      <div style={{ display: "flex", gap: 22, margin: "10px 0 6px", flexWrap: "wrap" }}>
        <label className="quiz-check"><input type="checkbox" checked={f.published} onChange={check("published")} /> Xuất bản công khai</label>
        <label className="quiz-check"><input type="checkbox" checked={f.membersOnly} onChange={check("membersOnly")} /> 🔒 Chỉ dành cho thành viên</label>
        <label className="quiz-check"><input type="checkbox" checked={f.shuffleQuestions} onChange={check("shuffleQuestions")} /> Mặc định xáo trộn câu hỏi</label>
        <label className="quiz-check"><input type="checkbox" checked={f.shuffleOptions} onChange={check("shuffleOptions")} /> Mặc định xáo trộn đáp án</label>
      </div>

      {/* TẠO ĐỀ BẰNG AI (WORD / PDF / TEXT) */}
      <div
        className="glass"
        style={{
          margin: "18px 0",
          padding: "16px 20px",
          borderRadius: 16,
          background: "linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(168, 85, 247, 0.15) 50%, rgba(236, 72, 153, 0.12) 100%)",
          border: "1px solid rgba(168, 85, 247, 0.4)",
          boxShadow: "0 8px 32px rgba(168, 85, 247, 0.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 260 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "linear-gradient(135deg, #6366f1, #a855f7, #ec4899)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.4rem",
              color: "#fff",
              boxShadow: "0 4px 16px rgba(168, 85, 247, 0.4)",
              flexShrink: 0,
            }}
          >
            ✨
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "#fff", display: "flex", alignItems: "center", gap: 8 }}>
              <span>Trợ lý AI Tạo Đề Tự Động</span>
              <span
                style={{
                  fontSize: ".7rem",
                  padding: "2px 8px",
                  borderRadius: 999,
                  background: "linear-gradient(135deg, #a855f7, #ec4899)",
                  color: "#fff",
                  fontWeight: 700,
                  textTransform: "uppercase",
                }}
              >
                Mới
              </span>
            </div>
            <div className="muted" style={{ fontSize: ".84rem", marginTop: 2 }}>
              Phân tích tệp bài học <b>Word (.docx)</b>, <b>PowerPoint (.pptx)</b>, <b>PDF</b> hoặc văn bản để tự động tạo câu hỏi trắc nghiệm kèm đáp án và lời giải.
            </div>
          </div>
        </div>
        <button
          type="button"
          className="btn"
          onClick={() => setShowAiModal(true)}
          style={{
            background: "linear-gradient(135deg, #6366f1, #a855f7, #ec4899)",
            color: "#fff",
            border: "none",
            borderRadius: 12,
            padding: "10px 22px",
            fontWeight: 700,
            fontSize: ".95rem",
            boxShadow: "0 4px 18px rgba(168, 85, 247, 0.4)",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            cursor: "pointer",
            transition: "all .2s ease",
          }}
        >
          <span>✨</span>
          <span>Tạo đề thi bằng AI</span>
        </button>
      </div>

      {/* Nhập hàng loạt */}
      <details className="quiz-bulk">
        <summary
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            cursor: "pointer",
            flexWrap: "wrap",
            padding: "2px 0",
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: "1rem" }}>
            ⚡ Nhập hàng loạt từ văn bản / JSON
          </span>
          <button
            type="button"
            className="btn btn-sm"
            style={{
              background: "linear-gradient(135deg, rgba(99,102,241,0.25), rgba(168,85,247,0.3))",
              border: "1px solid rgba(168,85,247,0.6)",
              color: "#fff",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontWeight: 600,
              padding: "5px 14px",
              borderRadius: 999,
              fontSize: ".83rem",
              boxShadow: "0 2px 10px rgba(168,85,247,0.2)",
              transition: "all .2s ease",
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowJsonModal(true);
            }}
            title="Bấm để mở ô mẫu JSON có hướng dẫn chi tiết cách điền và nút copy"
          >
            <span>📋 Ô Mẫu JSON &amp; Cách điền</span>
            <span
              style={{
                background: "rgba(255,255,255,0.22)",
                borderRadius: 999,
                padding: "1px 7px",
                fontSize: ".7rem",
                fontWeight: 700,
              }}
            >
              Copy
            </span>
          </button>
        </summary>

        <p className="muted" style={{ fontSize: ".85rem", margin: "12px 0 10px" }}>
          Hỗ trợ nhập hàng loạt câu hỏi bằng <b>văn bản thông thường</b> (dạng <code>Câu 1:... A. B. C. Đáp án:...</code>) hoặc <b>chuỗi JSON chuẩn</b>.
        </p>

        {/* Ô MẪU JSON CÓ HƯỚNG DẪN CÁCH ĐIỀN TRỰC TIẾP */}
        <div
          style={{
            background: "hsla(0 0% 100% / .03)",
            borderRadius: 14,
            padding: "14px 16px",
            margin: "12px 0 16px",
            border: "1px solid var(--glass-border)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: "1.1rem" }}>📋</span>
              <b style={{ color: "var(--accent)", fontSize: ".92rem" }}>Ô Mẫu JSON Chuẩn Có Hướng Dẫn Cách Điền</b>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <button
                type="button"
                className={`btn btn-sm ${activeJsonTab === "guided" ? "btn-primary" : "btn-ghost"}`}
                style={{ fontSize: ".76rem", padding: "3px 10px", borderRadius: 8 }}
                onClick={() => setActiveJsonTab("guided")}
              >
                Mẫu đầy đủ (3 dạng)
              </button>
              <button
                type="button"
                className={`btn btn-sm ${activeJsonTab === "simple" ? "btn-primary" : "btn-ghost"}`}
                style={{ fontSize: ".76rem", padding: "3px 10px", borderRadius: 8 }}
                onClick={() => setActiveJsonTab("simple")}
              >
                Mẫu 1 đáp án A/B/C/D
              </button>
              <button
                type="button"
                className={`btn btn-sm ${activeJsonTab === "ai" ? "btn-primary" : "btn-ghost"}`}
                style={{ fontSize: ".76rem", padding: "3px 10px", borderRadius: 8 }}
                onClick={() => setActiveJsonTab("ai")}
              >
                🤖 Prompt cho AI
              </button>
            </div>
          </div>

          <div style={{ position: "relative", marginBottom: 10 }}>
            <textarea
              readOnly
              rows={8}
              value={activeJsonTab === "guided" ? SAMPLE_JSON_GUIDED : activeJsonTab === "simple" ? SAMPLE_JSON_SIMPLE : SAMPLE_AI_PROMPT}
              style={{
                width: "100%",
                background: "hsla(0 0% 0% / .55)",
                padding: "12px 14px",
                borderRadius: 10,
                border: "1px solid var(--glass-border)",
                fontSize: ".8rem",
                lineHeight: 1.5,
                fontFamily: "var(--font-geist-mono), monospace",
                color: "#e2e8f0",
                resize: "vertical",
              }}
              onClick={(e) => e.target.select()}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                style={{ fontSize: ".8rem", padding: "5px 14px" }}
                onClick={() => {
                  const content = activeJsonTab === "guided" ? SAMPLE_JSON_GUIDED : activeJsonTab === "simple" ? SAMPLE_JSON_SIMPLE : SAMPLE_AI_PROMPT;
                  navigator.clipboard?.writeText(content);
                  setCopiedJson(true);
                  setTimeout(() => setCopiedJson(false), 2000);
                }}
              >
                {copiedJson ? "✅ Đã sao chép vào bộ nhớ!" : "📋 Sao chép ô mẫu này"}
              </button>
              {activeJsonTab !== "ai" && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: ".8rem", padding: "5px 12px" }}
                  onClick={() => {
                    const content = activeJsonTab === "guided" ? SAMPLE_JSON_GUIDED : SAMPLE_JSON_SIMPLE;
                    setBulk(content);
                    setPreview(null);
                  }}
                >
                  📥 Nạp mẫu vào ô nhập bên dưới
                </button>
              )}
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ fontSize: ".8rem", color: "var(--accent)" }}
              onClick={() => setShowJsonModal(true)}
            >
              📖 Xem chi tiết quy chuẩn &amp; Mẹo dùng AI ↗
            </button>
          </div>

          {/* Bảng tóm tắt nhanh cách điền */}
          <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px dashed var(--glass-border)", fontSize: ".8rem", color: "var(--muted)", lineHeight: 1.55 }}>
            <div style={{ fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>💡 Cách điền các trường trong JSON:</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 6 }}>
              <div>• <code>text</code>: Nội dung câu hỏi (chấp nhận cả chữ, công thức, Markdown).</div>
              <div>• <code>options</code>: Mảng 4 lựa chọn <code>[&quot;A...&quot;, &quot;B...&quot;, &quot;C...&quot;, &quot;D...&quot;]</code>.</div>
              <div>• <code>correct</code>: Đáp án đúng: số index từ 0 (0=A, 1=B, 2=C, 3=D) hoặc chữ <code>&quot;B&quot;</code>; nhiều đáp án: <code>[0, 2]</code>.</div>
              <div>• <code>type</code>: <code>&quot;single&quot;</code> (1 đáp án), <code>&quot;multiple&quot;</code> (nhiều đáp án), <code>&quot;truefalse&quot;</code> (Đúng/Sai).</div>
              <div>• <code>explanation</code>: Lời giải thích khi người thi hoàn thành câu hỏi.</div>
            </div>
          </div>
        </div>

        <div style={{ margin: "14px 0 6px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <label style={{ fontWeight: 600, fontSize: ".9rem" }}>Dán nội dung câu hỏi vào đây:</label>
          <span className="muted" style={{ fontSize: ".78rem" }}>Hỗ trợ cả dạng văn bản và JSON</span>
        </div>
        <textarea
          rows={10} value={bulk} onChange={(e) => { setBulk(e.target.value); setPreview(null); }}
          placeholder="Dán nội dung văn bản (Câu 1: ... A. ... B. ... Đáp án: ...) hoặc dán chuỗi JSON vào đây..." style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: ".88rem" }}
        />
        <div className="qrow" style={{ gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setBulk(SAMPLE_QUIZ_TEXT); setPreview(null); }}>📝 Chèn mẫu văn bản thường</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setBulk(SAMPLE_JSON_GUIDED); setPreview(null); }}>📋 Chèn mẫu JSON có hướng dẫn</button>
          <button type="button" className="btn btn-primary btn-sm" disabled={!bulk.trim()} onClick={runPreview}>🔍 Xem trước &amp; Kiểm tra</button>
        </div>
        {preview && (
          <div style={{ marginTop: 14 }}>
            <div className={`msg ${preview.questions.length ? "ok" : "err"}`}>
              Nhận diện được <b>{preview.questions.length}</b> câu{preview.errors.length ? `, ${preview.errors.length} lỗi` : ""}.
            </div>
            {preview.errors.map((x, k) => <div className="msg err" key={k}>Dòng {x.line}: {x.message}</div>)}
            {preview.questions.slice(0, 3).map((q, k) => (
              <div className="muted" key={k} style={{ fontSize: ".85rem", marginBottom: 4 }}>
                • [{QUESTION_TYPES[q.type]}] {q.text.slice(0, 90)}
              </div>
            ))}
            {preview.questions.length > 3 && <div className="muted" style={{ fontSize: ".85rem" }}>… và {preview.questions.length - 3} câu nữa</div>}
            {preview.questions.length > 0 && (
              <div className="qrow" style={{ gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                <button type="button" className="btn btn-primary btn-sm" onClick={() => applyPreview(false)}>Thêm {preview.questions.length} câu vào bộ đề</button>
                {f.questions.length > 0 && (
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => { if (confirm("Thay thế toàn bộ câu hỏi hiện có?")) applyPreview(true); }}>Thay thế toàn bộ</button>
                )}
              </div>
            )}
          </div>
        )}
      </details>

      {/* Danh sách câu hỏi */}
      <h3 style={{ margin: "26px 0 12px" }}>Câu hỏi ({f.questions.length})</h3>
      {f.questions.map((q, i) => (
        <div className="quiz-edit-q glass" key={q.id}>
          <div className="qrow" style={{ justifyContent: "space-between", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
            <b>Câu {i + 1}</b>
            <div className="qrow" style={{ gap: 6, flexWrap: "wrap" }}>
              <select value={q.type} onChange={(e) => changeType(i, e.target.value)} style={{ width: "auto" }}>
                {Object.entries(QUESTION_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <button type="button" className="btn btn-ghost btn-sm" disabled={i === 0} onClick={() => moveQ(i, -1)} aria-label="Lên">↑</button>
              <button type="button" className="btn btn-ghost btn-sm" disabled={i === f.questions.length - 1} onClick={() => moveQ(i, 1)} aria-label="Xuống">↓</button>
              <button type="button" className="btn btn-danger btn-sm" onClick={() => delQ(i)}>Xóa</button>
            </div>
          </div>
          <textarea rows={2} style={{ minHeight: 60 }} value={q.text} onChange={(e) => setQ(i, { text: e.target.value })} placeholder="Nội dung câu hỏi..." />
          <div className="muted" style={{ fontSize: ".8rem", margin: "10px 0 6px" }}>
            {q.type === "multiple" ? "Tích vào tất cả đáp án đúng:" : "Chọn đáp án đúng:"}
          </div>
          {q.options.map((o, oi) => (
            <div className="quiz-edit-opt" key={oi}>
              <input
                type={q.type === "multiple" ? "checkbox" : "radio"} name={`correct-${q.id}`}
                checked={q.correct.includes(oi)} onChange={() => toggleCorrect(i, oi)} aria-label={`Đáp án ${oi + 1} đúng`}
              />
              <input
                value={o} disabled={q.type === "truefalse"} onChange={(e) => setOption(i, oi, e.target.value)}
                placeholder={`Đáp án ${String.fromCharCode(65 + oi)}`}
              />
              {q.type !== "truefalse" && q.options.length > 2 && (
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => delOption(i, oi)} aria-label="Xóa đáp án">✕</button>
              )}
            </div>
          ))}
          {q.type !== "truefalse" && q.options.length < 8 && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => addOption(i)} style={{ marginTop: 6 }}>+ Thêm đáp án</button>
          )}
          <div className="field" style={{ marginTop: 12 }}>
            <label>Lời giải / Giải thích (hỗ trợ Markdown)</label>
            <textarea rows={2} style={{ minHeight: 60 }} value={q.explanation || ""} onChange={(e) => setQ(i, { explanation: e.target.value })} placeholder="Vì sao đáp án này đúng?" />
          </div>
          {qErrors(i).map((x, k) => <div className="msg err" key={k} style={{ margin: "6px 0 0" }}>{x.message}</div>)}
        </div>
      ))}
      {!f.questions.length && <div className="empty">Chưa có câu hỏi. Thêm thủ công bên dưới hoặc dùng “Nhập hàng loạt”.</div>}
      <div className="qrow" style={{ gap: 8, marginTop: 14, flexWrap: "wrap" }}>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => addQ("single")}>+ Chọn 1 đáp án</button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => addQ("multiple")}>+ Chọn nhiều đáp án</button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => addQ("truefalse")}>+ Đúng / Sai</button>
        <button
          type="button"
          className="btn btn-sm"
          style={{
            background: "linear-gradient(135deg, rgba(99,102,241,0.25), rgba(168,85,247,0.3))",
            border: "1px solid rgba(168,85,247,0.6)",
            color: "#fff",
            fontWeight: 600,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
          onClick={() => setShowAiModal(true)}
        >
          <span>✨</span>
          <span>Tạo bằng AI</span>
        </button>
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
        <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? "Đang lưu..." : "Lưu bộ đề"}</button>
        <button className="btn btn-ghost" type="button" onClick={onDone}>Hủy</button>
      </div>

      {/* Modal Ô Mẫu JSON & Hướng Dẫn Cách Điền */}
      {showJsonModal && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            background: "rgba(0, 0, 0, 0.78)",
            backdropFilter: "blur(10px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
          onClick={() => setShowJsonModal(false)}
        >
          <div
            className="glass"
            style={{
              background: "var(--bg-2)",
              border: "1px solid var(--glass-border)",
              borderRadius: 20,
              width: "100%",
              maxWidth: 780,
              maxHeight: "92vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 25px 70px rgba(0, 0, 0, 0.45)",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header modal */}
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid var(--glass-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "linear-gradient(135deg, rgba(99,102,241,0.1), rgba(168,85,247,0.1))",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: "linear-gradient(135deg, var(--accent), #a855f7)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.2rem",
                  }}
                >
                  📋
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "var(--text)" }}>
                    Ô Mẫu JSON Chuẩn &amp; Hướng Dẫn Cách Điền
                  </h3>
                  <p className="muted" style={{ margin: "2px 0 0", fontSize: ".8rem" }}>
                    Sao chép mẫu ra Notepad hoặc gửi cho AI để viết đề thi dễ dàng
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                style={{ fontSize: "1.2rem", width: 32, height: 32, padding: 0, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8 }}
                onClick={() => setShowJsonModal(false)}
                aria-label="Đóng"
              >
                ✕
              </button>
            </div>

            {/* Tabs chuyển đổi giữa 3 mẫu */}
            <div
              style={{
                display: "flex",
                gap: 8,
                padding: "12px 20px 8px",
                borderBottom: "1px solid var(--glass-border)",
                background: "rgba(0,0,0,0.08)",
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                className={`btn btn-sm ${activeJsonTab === "guided" ? "btn-primary" : "btn-ghost"}`}
                style={{ fontSize: ".82rem", borderRadius: 8, padding: "6px 14px" }}
                onClick={() => setActiveJsonTab("guided")}
              >
                🔹 Mẫu đầy đủ (Có hướng dẫn 3 loại câu)
              </button>
              <button
                type="button"
                className={`btn btn-sm ${activeJsonTab === "simple" ? "btn-primary" : "btn-ghost"}`}
                style={{ fontSize: ".82rem", borderRadius: 8, padding: "6px 14px" }}
                onClick={() => setActiveJsonTab("simple")}
              >
                🔹 Mẫu 1 đáp án A/B/C/D nhanh
              </button>
              <button
                type="button"
                className={`btn btn-sm ${activeJsonTab === "ai" ? "btn-primary" : "btn-ghost"}`}
                style={{ fontSize: ".82rem", borderRadius: 8, padding: "6px 14px" }}
                onClick={() => setActiveJsonTab("ai")}
              >
                🤖 Prompt câu lệnh cho AI (ChatGPT/Gemini)
              </button>
            </div>

            {/* Body cuộn */}
            <div style={{ padding: "16px 20px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: ".85rem", fontWeight: 600, color: "var(--text)" }}>
                    {activeJsonTab === "guided"
                      ? "Nội dung mẫu JSON có giải thích cách điền từng dòng:"
                      : activeJsonTab === "simple"
                      ? "Nội dung mẫu JSON câu hỏi 1 đáp án gọn nhẹ:"
                      : "Câu lệnh mẫu để copy gửi ChatGPT / Gemini / Claude:"}
                  </span>
                  <span className="muted" style={{ fontSize: ".76rem" }}>Click vào ô để chọn nhanh tất cả</span>
                </div>

                <textarea
                  readOnly
                  rows={12}
                  value={activeJsonTab === "guided" ? SAMPLE_JSON_GUIDED : activeJsonTab === "simple" ? SAMPLE_JSON_SIMPLE : SAMPLE_AI_PROMPT}
                  style={{
                    width: "100%",
                    background: "hsla(0 0% 0% / .65)",
                    padding: "14px 16px",
                    borderRadius: 12,
                    border: "1px solid var(--glass-border)",
                    fontSize: ".82rem",
                    lineHeight: 1.55,
                    fontFamily: "var(--font-geist-mono), monospace",
                    color: "#f1f5f9",
                    resize: "vertical",
                  }}
                  onClick={(e) => e.target.select()}
                />
              </div>

              {/* Nút hành động trong Modal */}
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ fontSize: ".88rem", padding: "8px 18px", display: "inline-flex", alignItems: "center", gap: 6 }}
                    onClick={() => {
                      const content = activeJsonTab === "guided" ? SAMPLE_JSON_GUIDED : activeJsonTab === "simple" ? SAMPLE_JSON_SIMPLE : SAMPLE_AI_PROMPT;
                      navigator.clipboard?.writeText(content);
                      setCopiedModalTab(true);
                      setTimeout(() => setCopiedModalTab(false), 2000);
                    }}
                  >
                    {copiedModalTab ? "✅ Đã sao chép vào bộ nhớ!" : "📋 Sao chép mẫu này"}
                  </button>
                  {activeJsonTab !== "ai" && (
                    <button
                      type="button"
                      className="btn btn-ghost"
                      style={{ fontSize: ".88rem", padding: "8px 16px" }}
                      onClick={() => {
                        const content = activeJsonTab === "guided" ? SAMPLE_JSON_GUIDED : SAMPLE_JSON_SIMPLE;
                        setBulk(content);
                        setPreview(null);
                        setShowJsonModal(false);
                      }}
                    >
                      📥 Nạp vào ô nhập liệu &amp; Đóng
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setShowJsonModal(false)}
                >
                  Đóng cửa sổ
                </button>
              </div>

              {/* Hướng dẫn chi tiết bảng các trường */}
              <div
                style={{
                  background: "rgba(255,255,255,0.02)",
                  borderRadius: 12,
                  padding: "14px 16px",
                  border: "1px solid var(--glass-border)",
                  fontSize: ".84rem",
                  lineHeight: 1.6,
                }}
              >
                <div style={{ fontWeight: 700, color: "var(--accent)", marginBottom: 8, fontSize: ".9rem" }}>
                  📖 Chi tiết ý nghĩa các trường khi điền JSON:
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", fontSize: ".82rem", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--glass-border)", color: "var(--text)" }}>
                        <th style={{ padding: "6px 8px" }}>Trường</th>
                        <th style={{ padding: "6px 8px" }}>Kiểu</th>
                        <th style={{ padding: "6px 8px" }}>Cách điền &amp; Ý nghĩa</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: "1px solid hsla(0 0% 100% / .05)" }}>
                        <td style={{ padding: "6px 8px" }}><code>text</code></td>
                        <td style={{ padding: "6px 8px" }}>chuỗi (bắt buộc)</td>
                        <td style={{ padding: "6px 8px" }}>Nội dung câu hỏi bạn muốn hỏi (chấp nhận cả <code>&quot;question&quot;</code>).</td>
                      </tr>
                      <tr style={{ borderBottom: "1px solid hsla(0 0% 100% / .05)" }}>
                        <td style={{ padding: "6px 8px" }}><code>options</code></td>
                        <td style={{ padding: "6px 8px" }}>mảng chuỗi</td>
                        <td style={{ padding: "6px 8px" }}>Danh sách các lựa chọn đáp án: <code>[&quot;Đáp án A&quot;, &quot;Đáp án B&quot;, &quot;Đáp án C&quot;, &quot;Đáp án D&quot;]</code>.</td>
                      </tr>
                      <tr style={{ borderBottom: "1px solid hsla(0 0% 100% / .05)" }}>
                        <td style={{ padding: "6px 8px" }}><code>correct</code></td>
                        <td style={{ padding: "6px 8px" }}>số / chữ / mảng</td>
                        <td style={{ padding: "6px 8px" }}>
                          • <b>1 đáp án</b>: điền số index (bắt đầu từ 0: <code>0</code>=A, <code>1</code>=B, <code>2</code>=C, <code>3</code>=D) hoặc chữ <code>&quot;A&quot;</code>, <code>&quot;B&quot;</code>.<br/>
                          • <b>Nhiều đáp án</b>: điền mảng vị trí <code>[0, 2]</code> hoặc mảng chữ <code>[&quot;A&quot;, &quot;C&quot;]</code>.<br/>
                          • <b>Đúng / Sai</b>: điền <code>0</code> (Đúng) hoặc <code>1</code> (Sai).
                        </td>
                      </tr>
                      <tr style={{ borderBottom: "1px solid hsla(0 0% 100% / .05)" }}>
                        <td style={{ padding: "6px 8px" }}><code>type</code></td>
                        <td style={{ padding: "6px 8px" }}>chuỗi (tùy chọn)</td>
                        <td style={{ padding: "6px 8px" }}><code>&quot;single&quot;</code> (1 đáp án), <code>&quot;multiple&quot;</code> (nhiều đáp án), <code>&quot;truefalse&quot;</code> (Đúng/Sai). Nếu bỏ trống, hệ thống tự động suy luận.</td>
                      </tr>
                      <tr>
                        <td style={{ padding: "6px 8px" }}><code>explanation</code></td>
                        <td style={{ padding: "6px 8px" }}>chuỗi (tùy chọn)</td>
                        <td style={{ padding: "6px 8px" }}>Lời giải thích chi tiết vì sao đáp án đúng khi người thi xem lại kết quả bài làm.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div style={{ marginTop: 12, padding: "10px 12px", background: "rgba(99,102,241,0.08)", borderRadius: 8, border: "1px solid rgba(99,102,241,0.2)" }}>
                  💡 <b>Mẹo dùng AI (ChatGPT, Claude, Gemini):</b> Chuyển sang tab <b>&quot;Prompt câu lệnh cho AI&quot;</b>, bấm sao chép và gửi cho AI kèm chủ đề của bạn. AI sẽ tạo 10-50 câu hỏi đúng chuẩn JSON chỉ trong vài giây! Sau đó bạn chỉ cần dán kết quả vào ô nhập liệu bên dưới là xong.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Quiz Generator Modal */}
      <AIQuizGenerator
        isOpen={showAiModal}
        onClose={() => setShowAiModal(false)}
        onApply={handleApplyAiQuestions}
        existingCount={f.questions.length}
      />
    </form>
  );
}
