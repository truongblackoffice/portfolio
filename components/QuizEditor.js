"use client";
import { useState } from "react";
import { saveItem } from "@/lib/db";
import { QUESTION_TYPES, TF_OPTIONS, newQuestion, validateQuiz } from "@/lib/quiz";
import { parseQuizInput, SAMPLE_QUIZ_TEXT, SAMPLE_QUIZ_JSON } from "@/lib/quizParser";
import { isImageIcon } from "@/lib/presets";

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
    shuffleQuestions: item.shuffleQuestions !== false,
    shuffleOptions: item.shuffleOptions !== false,
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [errors, setErrors] = useState([]);
  const [bulk, setBulk] = useState("");
  const [preview, setPreview] = useState(null);
  const [copiedJson, setCopiedJson] = useState(false);

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
      </div>
      <div style={{ display: "flex", gap: 22, margin: "10px 0 6px", flexWrap: "wrap" }}>
        <label className="quiz-check"><input type="checkbox" checked={f.published} onChange={check("published")} /> Xuất bản công khai</label>
        <label className="quiz-check"><input type="checkbox" checked={f.membersOnly} onChange={check("membersOnly")} /> 🔒 Chỉ dành cho thành viên</label>
        <label className="quiz-check"><input type="checkbox" checked={f.shuffleQuestions} onChange={check("shuffleQuestions")} /> Mặc định xáo trộn câu hỏi</label>
        <label className="quiz-check"><input type="checkbox" checked={f.shuffleOptions} onChange={check("shuffleOptions")} /> Mặc định xáo trộn đáp án</label>
      </div>

      {/* Nhập hàng loạt */}
      <details className="quiz-bulk">
        <summary>⚡ Nhập hàng loạt từ văn bản / JSON</summary>
        <p className="muted" style={{ fontSize: ".85rem", margin: "10px 0" }}>
          Hỗ trợ nhập hàng loạt câu hỏi bằng <b>văn bản thông thường</b> (dạng <code>Câu 1:... A. B. C. Đáp án:...</code>) hoặc <b>chuỗi JSON chuẩn</b>.
        </p>

        {/* Hướng dẫn chi tiết cấu trúc JSON */}
        <details style={{ background: "hsla(0 0% 100% / .03)", borderRadius: 12, padding: "12px 16px", margin: "12px 0", border: "1px solid var(--glass-border)" }}>
          <summary style={{ cursor: "pointer", fontWeight: 600, color: "var(--accent)", display: "flex", alignItems: "center", gap: 6, fontSize: ".9rem" }}>
            <span>📖 Hướng dẫn chi tiết cấu trúc viết JSON tạo bộ đề</span>
            <span className="badge" style={{ fontSize: ".7rem", marginLeft: "auto" }}>Xem quy chuẩn</span>
          </summary>
          <div style={{ marginTop: 12, fontSize: ".85rem", lineHeight: 1.6 }}>
            <p style={{ margin: "6px 0 10px" }}>
              Cấu trúc JSON là một mảng các câu hỏi <code>[...]</code> hoặc một đối tượng có trường <code>&#123; &quot;questions&quot;: [...] &#125;</code>:
            </p>
            <div style={{ overflowX: "auto", marginBottom: 12 }}>
              <table style={{ width: "100%", fontSize: ".82rem", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--glass-border)", color: "var(--accent)" }}>
                    <th style={{ padding: "6px 8px" }}>Trường</th>
                    <th style={{ padding: "6px 8px" }}>Kiểu</th>
                    <th style={{ padding: "6px 8px" }}>Mô tả &amp; Ví dụ</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: "1px solid hsla(0 0% 100% / .05)" }}>
                    <td style={{ padding: "6px 8px" }}><code>text</code></td>
                    <td style={{ padding: "6px 8px" }}>string *</td>
                    <td style={{ padding: "6px 8px" }}>Nội dung câu hỏi (chấp nhận cả <code>&quot;question&quot;</code> hoặc <code>&quot;text&quot;</code>, hỗ trợ Markdown).</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid hsla(0 0% 100% / .05)" }}>
                    <td style={{ padding: "6px 8px" }}><code>options</code></td>
                    <td style={{ padding: "6px 8px" }}>array *</td>
                    <td style={{ padding: "6px 8px" }}>Mảng các đáp án lựa chọn, ví dụ: <code>[&quot;A. ...&quot;, &quot;B. ...&quot;, &quot;C. ...&quot;, &quot;D. ...&quot;]</code>.</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid hsla(0 0% 100% / .05)" }}>
                    <td style={{ padding: "6px 8px" }}><code>correct</code></td>
                    <td style={{ padding: "6px 8px" }}>number / string / array *</td>
                    <td style={{ padding: "6px 8px" }}>
                      Đáp án đúng (chấp nhận cả trường <code>&quot;answer&quot;</code>):<br/>
                      • <b>1 đáp án</b>: số index (bắt đầu từ 0: <code>0</code>=A, <code>1</code>=B, <code>2</code>=C, <code>3</code>=D) hoặc chữ cái <code>&quot;A&quot;</code>, <code>&quot;B&quot;</code>.<br/>
                      • <b>Nhiều đáp án</b>: mảng số <code>[0, 2]</code> hoặc mảng chữ <code>[&quot;A&quot;, &quot;C&quot;]</code>.<br/>
                      • <b>Đúng / Sai</b>: số <code>0</code> (Đúng) / <code>1</code> (Sai), hoặc boolean <code>true</code>/<code>false</code>.
                    </td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid hsla(0 0% 100% / .05)" }}>
                    <td style={{ padding: "6px 8px" }}><code>type</code></td>
                    <td style={{ padding: "6px 8px" }}>string</td>
                    <td style={{ padding: "6px 8px" }}>Tùy chọn: <code>&quot;single&quot;</code> (1 đáp án), <code>&quot;multiple&quot;</code> (nhiều đáp án), <code>&quot;truefalse&quot;</code> (Đúng/Sai).</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "6px 8px" }}><code>explanation</code></td>
                    <td style={{ padding: "6px 8px" }}>string</td>
                    <td style={{ padding: "6px 8px" }}>Lời giải thích chi tiết khi người học xem kết quả bài thi.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span className="muted" style={{ fontSize: ".8rem" }}>Mẫu JSON hoàn chỉnh:</span>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                style={{ fontSize: ".75rem", padding: "2px 8px" }}
                onClick={() => {
                  navigator.clipboard?.writeText(SAMPLE_QUIZ_JSON);
                  setCopiedJson(true);
                  setTimeout(() => setCopiedJson(false), 2000);
                }}
              >
                {copiedJson ? "✅ Đã sao chép!" : "📋 Sao chép mẫu JSON"}
              </button>
            </div>
            <pre style={{
              background: "hsla(0 0% 0% / .4)",
              padding: 12,
              borderRadius: 8,
              border: "1px solid var(--glass-border)",
              fontSize: ".78rem",
              maxHeight: 180,
              overflowY: "auto",
              fontFamily: "var(--font-geist-mono), monospace",
            }}>
              <code>{SAMPLE_QUIZ_JSON}</code>
            </pre>
            <p className="muted" style={{ fontSize: ".78rem", marginTop: 8 }}>
              💡 <b>Mẹo dùng AI (ChatGPT, Claude, Gemini):</b> Bạn có thể bấm nút &quot;Sao chép mẫu JSON&quot; ở trên, gửi cho AI với câu lệnh: <i>&quot;Hãy tạo cho tôi 10 câu hỏi trắc nghiệm về [Chủ đề của bạn] theo đúng cấu trúc JSON sau: [Dán mẫu vào]&quot;</i> sau đó dán kết quả vào ô bên dưới!
            </p>
          </div>
        </details>

        <textarea
          rows={10} value={bulk} onChange={(e) => { setBulk(e.target.value); setPreview(null); }}
          placeholder="Dán nội dung văn bản hoặc mã JSON vào đây..." style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: ".88rem" }}
        />
        <div className="qrow" style={{ gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setBulk(SAMPLE_QUIZ_TEXT); setPreview(null); }}>📝 Chèn mẫu văn bản</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setBulk(SAMPLE_QUIZ_JSON); setPreview(null); }}>📋 Chèn mẫu JSON</button>
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
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
        <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? "Đang lưu..." : "Lưu bộ đề"}</button>
        <button className="btn btn-ghost" type="button" onClick={onDone}>Hủy</button>
      </div>
    </form>
  );
}
