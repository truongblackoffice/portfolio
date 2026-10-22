"use client";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { getItem, listItems, watchAuth, saveAttempt } from "@/lib/db";
import useAsync from "@/lib/useAsync";
import { buildSession, scoreSession, gradeQuestion, formatDuration, QUESTION_TYPES, getExamLimitInfo, recordExamAttempt } from "@/lib/quiz";
import { useSite } from "@/lib/SiteContext";
import { renderIcon } from "@/lib/presets";
import { Md, ReviewOptions, SolutionItem, letterOf } from "@/components/QuizParts";

const MODE_LABEL = { practice: "Ôn tập", exam: "Thi thử" };

export default function QuizPage() {
  const { id } = useParams();
  const search = useSearchParams();
  const [user, setUser] = useState(undefined);
  useEffect(() => watchAuth(setUser), []);
  const authKey = user === undefined ? "pending" : user ? user.uid || "member" : "guest";

  const { data, loading } = useAsync(
    async () => {
      const quiz = await getItem("quizzes", id);
      let topic = null;
      if (quiz?.topicId) {
        const topics = await listItems("quizTopics");
        topic = topics.find((t) => t.id === quiz.topicId) || null;
      }
      return { quiz, topic };
    },
    [id, authKey],
    id ? `quiz_${id}_${user ? "m" : "g"}` : null
  );
  const quiz = data?.quiz || null;
  const topic = data?.topic || null;
  const total = quiz?.questions?.length || 0;

  const { site } = useSite();
  const maxPerHour = quiz?.maxExamPerHour !== undefined ? quiz.maxExamPerHour : (site?.defaultMaxExamPerHour ?? 5);

  const [limitInfo, setLimitInfo] = useState({ limited: false, remaining: 5, max: 5, isBlocked: false, nextAvailableMin: 0 });
  const [blockedModal, setBlockedModal] = useState(false);

  const updateLimit = useCallback(() => {
    if (!quiz?.id) return null;
    const info = getExamLimitInfo(quiz.id, maxPerHour);
    setLimitInfo(info);
    return info;
  }, [quiz?.id, maxPerHour]);

  useEffect(() => {
    updateLimit();
  }, [updateLimit]);

  const [phase, setPhase] = useState(() => (search.get("mode") === "study" ? "study" : "start"));
  const [mode, setMode] = useState("practice");
  const [optsOver, setOptsOver] = useState({});
  const opts = {
    count: total,
    shuffleQuestions: quiz?.shuffleQuestions !== false,
    shuffleOptions: quiz?.shuffleOptions !== false,
    ...optsOver,
  };
  const [session, setSession] = useState([]);
  const [answers, setAnswers] = useState({});
  const [checked, setChecked] = useState({});
  const [idx, setIdx] = useState(0);
  const [remaining, setRemaining] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState(null);
  const [onlyWrong, setOnlyWrong] = useState(false);
  const [open, setOpen] = useState(() => new Set());
  const deadline = useRef(0);
  const startedAt = useRef(0);
  const [isRetry, setIsRetry] = useState(false);
  const finishedRef = useRef(false);

  const begin = (m, source = quiz, retry = false) => {
    if (m === "exam") {
      const info = updateLimit() || limitInfo;
      if (info?.isBlocked) {
        setBlockedModal(true);
        return;
      }
      recordExamAttempt(quiz.id);
      updateLimit();
    }
    const n = source.questions?.length || 0;
    const count = retry || opts.count >= n ? 0 : opts.count;
    const s = buildSession(source, { shuffleQuestions: opts.shuffleQuestions, shuffleOptions: opts.shuffleOptions, count });
    if (!s.length) return;
    finishedRef.current = false;
    setIsRetry(retry);
    startedAt.current = Date.now();
    setSession(s); setAnswers({}); setChecked({}); setIdx(0);
    setConfirming(false); setResult(null); setOnlyWrong(false); setOpen(new Set());
    if (m === "exam" && quiz.timeLimitMin > 0) {
      deadline.current = Date.now() + quiz.timeLimitMin * 60000;
      setRemaining(quiz.timeLimitMin * 60);
    } else setRemaining(null);
    setMode(m);
    setPhase("run");
    window.scrollTo({ top: 0 });
  };

  const renderBlockedModal = () => {
    if (!blockedModal) return null;
    return (
      <div className="quiz-modal" role="dialog" aria-modal="true" onClick={() => setBlockedModal(false)}>
        <div className="glass quiz-modal-box" style={{ maxWidth: 440, textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
          <div style={{ fontSize: "2.8rem", marginBottom: 8 }}>⏳</div>
          <h3 style={{ marginBottom: 8 }}>Đã đạt giới hạn thi thử</h3>
          <p className="muted" style={{ fontSize: ".92rem", lineHeight: 1.6, marginBottom: 16 }}>
            Bạn đã sử dụng hết <b>{limitInfo.max} lượt thi thử</b> trong 1 giờ qua. Vui lòng quay lại sau <b>{limitInfo.nextAvailableMin} phút</b> nữa.
          </p>
          <div style={{ padding: 12, background: "rgba(16, 185, 129, 0.1)", borderRadius: 10, border: "1px solid rgba(16, 185, 129, 0.25)", marginBottom: 20, textAlign: "left" }}>
            <b style={{ color: "#10b981", display: "block", marginBottom: 4 }}>💡 Ôn tập không giới hạn:</b>
            <span style={{ fontSize: "0.85rem", color: "var(--foreground)" }}>
              Chế độ <b>Ôn tập</b> hoàn toàn <b>vô hạn lần</b>, bạn có thể tự do luyện tập và xem ngay giải thích cho từng câu hỏi!
            </span>
          </div>
          <div className="qrow" style={{ justifyContent: "center", gap: 10 }}>
            <button className="btn btn-ghost btn-sm" type="button" onClick={() => setBlockedModal(false)}>Để sau</button>
            <button className="btn btn-primary btn-sm" type="button" onClick={() => { setBlockedModal(false); begin("practice"); }}>
              Chuyển sang Ôn tập ngay 🎯
            </button>
          </div>
        </div>
      </div>
    );
  };

  const finish = useCallback(() => {
    if (finishedRef.current || !quiz) return;
    finishedRef.current = true;
    const score = scoreSession(session, answers);
    const durationSec = Math.round((Date.now() - startedAt.current) / 1000);
    const passed = score.percent >= (quiz.passPercent ?? 50);
    setResult({ ...score, durationSec, passed });
    setPhase("result");
    setConfirming(false);
    window.scrollTo({ top: 0 });
    if (!isRetry && user) {
      saveAttempt({
        quizId: quiz.id, quizTitle: quiz.title, topicId: quiz.topicId || "", mode,
        correctCount: score.correctCount, total: score.total, percent: score.percent, durationSec,
      });
    }
  }, [quiz, session, answers, mode, user, isRetry]);

  // Đồng hồ đếm ngược dựa trên mốc thời gian thật để không bị lệch khi tab bị làm chậm
  const timed = remaining !== null;
  useEffect(() => {
    if (phase !== "run" || mode !== "exam" || !timed) return;
    const t = setInterval(() => setRemaining(Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000))), 500);
    return () => clearInterval(t);
  }, [phase, mode, timed]);

  useEffect(() => {
    if (phase === "run" && mode === "exam" && timed && remaining === 0) finish();
  }, [phase, mode, timed, remaining, finish]);

  // Cảnh báo khi đóng/tải lại trang giữa lúc đang làm bài
  useEffect(() => {
    if (phase !== "run") return;
    const warn = (e) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [phase]);

  /* ---------- Trạng thái tải / không truy cập được ---------- */
  if (!quiz && (loading || user === undefined)) return <div className="empty">Đang tải bộ đề...</div>;
  if (!quiz || (quiz.membersOnly && !user)) {
    return (
      <div className="container section">
        <div className="glass" style={{ padding: 32, textAlign: "center", borderRadius: 16 }}>
          <div style={{ fontSize: "2.4rem", marginBottom: 12 }}>🔒</div>
          <h2 style={{ marginBottom: 10 }}>{user ? "Không tìm thấy bộ đề" : "Bộ đề dành cho thành viên"}</h2>
          <p className="muted" style={{ maxWidth: 460, margin: "0 auto 20px" }}>
            {user
              ? "Bộ đề có thể đã bị xóa hoặc chưa được đăng."
              : "Bộ đề này không tồn tại hoặc chỉ dành cho thành viên. Hãy đăng nhập để tiếp tục."}
          </p>
          <div className="qrow" style={{ justifyContent: "center", gap: 10 }}>
            {!user && (
              <Link href={`/login?from=${encodeURIComponent(`/quiz/${id}`)}`} className="btn btn-primary">
                Đăng nhập hoặc Đăng ký
              </Link>
            )}
            <Link href="/quiz" className="btn btn-ghost">← Về Ôn tập</Link>
          </div>
        </div>
      </div>
    );
  }
  if (!total) {
    return (
      <div className="container section">
        <div className="empty">
          <h2>Bộ đề chưa có câu hỏi</h2>
          <Link href="/quiz" className="btn btn-primary btn-sm" style={{ marginTop: 16 }}>← Về Ôn tập</Link>
        </div>
      </div>
    );
  }

  const back = topic ? { href: `/quiz/topic/${topic.id}`, label: `← ${topic.name}` } : { href: "/quiz", label: "← Tất cả bộ đề" };

  /* ---------- Xem lời giải ---------- */
  if (phase === "study") {
    const keys = quiz.questions.map((q) => q.id);
    const allOpen = keys.every((k) => open.has(k));
    return (
      <div className="container section">
        <Link href={back.href} className="muted" style={{ fontSize: ".9rem" }}>{back.label}</Link>
        <h1 style={{ fontSize: "clamp(1.7rem, 4vw, 2.3rem)", margin: "12px 0 6px" }}>{quiz.title}</h1>
        <p className="muted" style={{ marginBottom: 18 }}>📖 Xem lời giải · {total} câu</p>
        <div className="qrow" style={{ gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setOpen(allOpen ? new Set() : new Set(keys))}>
            {allOpen ? "Thu gọn tất cả" : "Mở tất cả"}
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              setOpen(new Set(keys));
              setTimeout(() => window.print(), 150);
            }}
            title="In toàn bộ đề thi hoặc lưu về dạng tệp PDF"
          >
            🖨️ In đề / Xuất PDF
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => { setOpen(new Set()); setPhase("start"); window.scrollTo({ top: 0 }); }}>
            Làm bài ngay
          </button>
        </div>
        <div className="quiz-sol-list">
          {quiz.questions.map((q, i) => (
            <SolutionItem
              key={q.id} q={q} number={i + 1} open={open.has(q.id)}
              onToggle={() => setOpen((prev) => { const n = new Set(prev); n.has(q.id) ? n.delete(q.id) : n.add(q.id); return n; })}
            />
          ))}
        </div>
      </div>
    );
  }

  /* ---------- Màn hình bắt đầu ---------- */
  if (phase === "start") {
    return (
      <div className="container section">
        <Link href={back.href} className="muted" style={{ fontSize: ".9rem" }}>{back.label}</Link>
        <div className="glass reveal" style={{ padding: "32px 28px", marginTop: 14, borderRadius: 18 }}>
          <div className="meta muted" style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: ".88rem" }}>
            {quiz.membersOnly && <span className="badge draft">🔒 Thành viên</span>}
            {topic && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 18, height: 18, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                  {renderIcon(topic.icon, "📁")}
                </span>
                {topic.name}
              </span>
            )}
            <span>· {total} câu</span>
            {quiz.timeLimitMin > 0 && <span>· ⏱ {quiz.timeLimitMin} phút (Thi thử)</span>}
            <span>· Đạt từ {quiz.passPercent ?? 50}%</span>
            {limitInfo.limited && <span>· 🔄 Thi thử: tối đa {limitInfo.max} lượt/giờ</span>}
          </div>
          <h1 style={{ fontSize: "clamp(1.8rem, 4vw, 2.5rem)", margin: "12px 0" }}>{quiz.title}</h1>
          {quiz.description && <p className="muted" style={{ marginBottom: 18 }}>{quiz.description}</p>}

          {result && (
            <div
              className="glass reveal"
              style={{
                padding: "16px 20px",
                borderRadius: 16,
                margin: "18px 0",
                border: `1px solid ${result.passed ? "rgba(16, 185, 129, 0.4)" : "rgba(239, 68, 68, 0.4)"}`,
                background: result.passed ? "rgba(16, 185, 129, 0.08)" : "rgba(239, 68, 68, 0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 14,
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: "1.8rem" }}>{result.passed ? "🎉" : "💪"}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "1rem" }}>
                    Kết quả vừa hoàn thành:{" "}
                    <span style={{ color: result.passed ? "#10b981" : "#ef4444", fontWeight: 700 }}>
                      {result.percent}%
                    </span>{" "}
                    ({result.correctCount}/{result.total} câu đúng) · {MODE_LABEL[mode]}
                  </div>
                  <div className="muted" style={{ fontSize: ".84rem", marginTop: 2 }}>
                    ⏱️ Thời gian: {formatDuration(result.durationSec)} · Điểm đạt {quiz.passPercent ?? 50}%{" "}
                    {result.passed ? "✅ Đạt" : "❌ Chưa đạt"}
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => { setPhase("result"); window.scrollTo({ top: 0 }); }}
                style={{ borderColor: "currentColor", fontWeight: 600 }}
              >
                📖 Xem lại bài làm chi tiết →
              </button>
            </div>
          )}

          <div className="quiz-modes">
            <button className="quiz-mode" onClick={() => begin("practice")}>
              <span className="quiz-mode-ico">🎯</span>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", gap: 6, flexWrap: "wrap" }}>
                <b>Ôn tập</b>
                <span style={{ fontSize: "0.72rem", background: "rgba(16, 185, 129, 0.15)", color: "#10b981", border: "1px solid rgba(16, 185, 129, 0.3)", padding: "2px 8px", borderRadius: 99, fontWeight: 600 }}>
                  ♾️ Vô hạn lần
                </span>
              </div>
              <span className="muted">Kiểm tra từng câu, xem đúng/sai và giải thích ngay. Ôn luyện tự do không giới hạn.</span>
            </button>
            <button className="quiz-mode" onClick={() => begin("exam")}>
              <span className="quiz-mode-ico">⏱️</span>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", gap: 6, flexWrap: "wrap" }}>
                <b>Thi thử</b>
                {limitInfo.limited ? (
                  <span style={{
                    fontSize: "0.72rem",
                    background: limitInfo.isBlocked ? "rgba(239, 68, 68, 0.15)" : "rgba(245, 158, 11, 0.15)",
                    color: limitInfo.isBlocked ? "#ef4444" : "#f59e0b",
                    border: `1px solid ${limitInfo.isBlocked ? "rgba(239, 68, 68, 0.3)" : "rgba(245, 158, 11, 0.3)"}`,
                    padding: "2px 8px",
                    borderRadius: 99,
                    fontWeight: 600,
                  }}>
                    {limitInfo.isBlocked ? `Hết lượt (chờ ${limitInfo.nextAvailableMin}p)` : `Còn ${limitInfo.remaining}/${limitInfo.max} lượt/giờ`}
                  </span>
                ) : (
                  <span style={{ fontSize: "0.72rem", background: "rgba(59, 130, 246, 0.15)", color: "#3b82f6", border: "1px solid rgba(59, 130, 246, 0.3)", padding: "2px 8px", borderRadius: 99, fontWeight: 600 }}>
                    Không giới hạn
                  </span>
                )}
              </div>
              <span className="muted">
                {quiz.timeLimitMin > 0 ? `Giới hạn ${quiz.timeLimitMin} phút, ` : "Không giới hạn thời gian, "}chấm điểm khi nộp bài.
                {limitInfo.limited && ` (Tối đa ${limitInfo.max} lượt/giờ)`}
              </span>
            </button>
            <button className="quiz-mode" onClick={() => { setOpen(new Set()); setPhase("study"); }}>
              <span className="quiz-mode-ico">📖</span>
              <b>Xem lời giải</b>
              <span className="muted">Đọc toàn bộ đáp án đúng và giải thích, không chấm điểm.</span>
            </button>
          </div>

          <div className="quiz-opts-row">
            {total > 1 && (
              <label className="field" style={{ margin: 0, maxWidth: 160 }}>
                <span>Số câu</span>
                <input
                  type="number" min={1} max={total} value={opts.count || ""}
                  onChange={(e) => {
                    const v = Math.min(total, Math.max(1, parseInt(e.target.value, 10) || 1));
                    setOptsOver((o) => ({ ...o, count: v }));
                  }}
                />
              </label>
            )}
            <label className="quiz-check">
              <input type="checkbox" checked={opts.shuffleQuestions} onChange={(e) => setOptsOver((o) => ({ ...o, shuffleQuestions: e.target.checked }))} />
              Xáo trộn câu hỏi
            </label>
            <label className="quiz-check">
              <input type="checkbox" checked={opts.shuffleOptions} onChange={(e) => setOptsOver((o) => ({ ...o, shuffleOptions: e.target.checked }))} />
              Xáo trộn đáp án
            </label>
          </div>
          {!user && (
            <p className="muted" style={{ fontSize: ".85rem", marginTop: 16 }}>
              💾 <Link href={`/login?from=${encodeURIComponent(`/quiz/${id}`)}`} style={{ color: "var(--accent)" }}>Đăng nhập</Link> để lưu lịch sử làm bài vào hồ sơ.
            </p>
          )}
        </div>
        {renderBlockedModal()}
      </div>
    );
  }

  /* ---------- Kết quả ---------- */
  if (phase === "result" && result) {
    const wrongIds = new Set(session.filter((q) => !gradeQuestion(q, answers[q.id])).map((q) => q.id));
    const shown = session.map((q, i) => ({ q, i })).filter(({ q }) => !onlyWrong || wrongIds.has(q.id));
    const reviewKeys = shown.map(({ q }) => q.id);
    const allOpen = reviewKeys.length > 0 && reviewKeys.every((k) => open.has(k));
    return (
      <div className="container section">
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 8, fontSize: ".9rem" }}>
          <button
            type="button"
            className="muted"
            onClick={() => { setPhase("start"); window.scrollTo({ top: 0 }); }}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0, textDecoration: "underline" }}
            title="Quay lại màn hình chọn chế độ thi hoặc ôn tập"
          >
            ← Tùy chọn chế độ ({quiz.title})
          </button>
          <span className="muted">·</span>
          <Link href={back.href} className="muted">{back.label}</Link>
        </div>
        <div className={`glass quiz-result ${result.passed ? "pass" : "fail"}`}>
          <div className="quiz-result-ico">{result.passed ? "🎉" : "💪"}</div>
          <h1 style={{ fontSize: "clamp(1.6rem, 4vw, 2.2rem)" }}>{result.passed ? "Chúc mừng, bạn đã đạt!" : "Cố gắng thêm nhé!"}</h1>
          <div className="quiz-score">{result.percent}%</div>
          <p className="muted">
            Đúng <b>{result.correctCount}/{result.total}</b> câu · {MODE_LABEL[mode]} · ⏱ {formatDuration(result.durationSec)} · Điểm đạt {quiz.passPercent ?? 50}%
          </p>
          <div className="qrow" style={{ justifyContent: "center", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => { setPhase("start"); window.scrollTo({ top: 0 }); }}
              id="btn-back-to-options"
            >
              🎯 Đổi chế độ / Tùy chọn đề
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => begin(mode === "exam" && !isRetry ? "exam" : "practice")}
              id="btn-retry-same-mode"
            >
              🔄 Làm lại ngay ({MODE_LABEL[mode]})
            </button>
            {wrongIds.size > 0 && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => begin("practice", { ...quiz, questions: quiz.questions.filter((q) => wrongIds.has(q.id)) }, true)}
              >
                ❌ Chỉ làm lại {wrongIds.size} câu sai
              </button>
            )}
            <Link href="/quiz" className="btn btn-ghost btn-sm">📋 Về danh sách đề</Link>
          </div>
          <p className="muted" style={{ fontSize: ".8rem", marginTop: 14 }}>
            {isRetry
              ? "Lượt làm lại câu sai không được lưu vào lịch sử."
              : user ? "✅ Kết quả đã được lưu vào lịch sử trong Hồ sơ." : "Đăng nhập để lưu kết quả vào lịch sử."}
          </p>
        </div>

        <h2 style={{ fontSize: "1.25rem", margin: "28px 0 12px" }}>Xem lại bài làm</h2>
        <div className="qrow" style={{ gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
          <button className={`chip ${onlyWrong ? "on" : ""}`} onClick={() => setOnlyWrong(!onlyWrong)}>Chỉ câu sai ({wrongIds.size})</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setOpen(allOpen ? new Set() : new Set(reviewKeys))}>
            {allOpen ? "Thu gọn tất cả" : "Mở tất cả"}
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              setOpen(new Set(reviewKeys));
              setTimeout(() => window.print(), 150);
            }}
            title="In toàn bộ kết quả bài làm hoặc lưu về PDF"
          >
            🖨️ In bài làm / Xuất PDF
          </button>
        </div>
        <div className="quiz-sol-list">
          {shown.length ? shown.map(({ q, i }) => (
            <SolutionItem
              key={q.id} q={q} number={i + 1} open={open.has(q.id)}
              selected={answers[q.id] || []} status={wrongIds.has(q.id) ? "bad" : "ok"}
              onToggle={() => setOpen((prev) => { const n = new Set(prev); n.has(q.id) ? n.delete(q.id) : n.add(q.id); return n; })}
            />
          )) : <div className="empty">Bạn không sai câu nào 🎉</div>}
        </div>
        <div className="qrow" style={{ justifyContent: "center", gap: 12, marginTop: 28, padding: "18px 0", borderTop: "1px solid var(--glass-border)", flexWrap: "wrap" }}>
          <button
            className="btn btn-primary"
            onClick={() => { setPhase("start"); window.scrollTo({ top: 0 }); }}
          >
            🎯 Trở về trang tùy chọn chế độ (Thi / Ôn tập)
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => begin(mode === "exam" && !isRetry ? "exam" : "practice")}
          >
            🔄 Làm lại ngay
          </button>
          <Link href="/quiz" className="btn btn-ghost">📋 Về danh sách đề</Link>
        </div>
        {renderBlockedModal()}
      </div>
    );
  }

  /* ---------- Đang làm bài ---------- */
  const q = session[idx];
  if (!q) return <div className="empty">Đang chuẩn bị bài làm...</div>;
  const sel = answers[q.id] || [];
  const isChecked = mode === "practice" && Boolean(checked[q.id]);
  const isMultiple = q.type === "multiple";
  const pick = (origIndex) => {
    if (isChecked) return;
    setAnswers((a) => {
      const cur = a[q.id] || [];
      const next = isMultiple ? (cur.includes(origIndex) ? cur.filter((x) => x !== origIndex) : [...cur, origIndex]) : [origIndex];
      return { ...a, [q.id]: next };
    });
  };
  const last = idx === session.length - 1;
  const answeredCount = session.filter((x) => (answers[x.id] || []).length).length;
  const blanks = session.length - answeredCount;
  const goNext = () => (last ? (mode === "exam" ? setConfirming(true) : finish()) : setIdx(idx + 1));
  const lowTime = timed && remaining <= 60;

  return (
    <div className="container section">
      <div className="quiz-bar glass">
        <div style={{ minWidth: 0 }}>
          <div className="muted" style={{ fontSize: ".78rem" }}>{MODE_LABEL[mode]} · {quiz.title}</div>
          <b>Câu {idx + 1}/{session.length}</b>
        </div>
        {timed && <div className={`quiz-timer ${lowTime ? "low" : ""}`} aria-live="off">⏱ {formatDuration(remaining)}</div>}
      </div>
      <div className="quiz-progress" aria-hidden="true">
        <div style={{ width: `${((mode === "exam" ? answeredCount : idx + (isChecked ? 1 : 0)) / session.length) * 100}%` }} />
      </div>

      <div className="glass quiz-card">
        <div className="meta muted" style={{ marginBottom: 10 }}>
          <span className="chip">{QUESTION_TYPES[q.type]}</span>
          {isMultiple && <span style={{ marginLeft: 8, fontSize: ".82rem" }}>Chọn tất cả đáp án đúng</span>}
        </div>
        <h2 className="quiz-q">{q.text}</h2>

        {isChecked ? (
          <ReviewOptions q={q} selected={sel} />
        ) : (
          <div className="quiz-options" role={isMultiple ? "group" : "radiogroup"}>
            {q.options.map((o, i) => {
              const on = sel.includes(o.origIndex);
              return (
                <button
                  key={o.origIndex} type="button"
                  className={`quiz-opt ${on ? "selected" : ""}`}
                  onClick={() => pick(o.origIndex)}
                  aria-pressed={on}
                >
                  <span className="quiz-opt-mark">{isMultiple ? (on ? "☑" : "☐") : letterOf(i)}</span>
                  <span className="quiz-opt-text">{o.text}</span>
                </button>
              );
            })}
          </div>
        )}

        {isChecked && (
          <div className={`quiz-feedback ${gradeQuestion(q, sel) ? "ok" : "bad"}`}>
            <b>{gradeQuestion(q, sel) ? "✅ Chính xác!" : "❌ Chưa đúng"}</b>
            {q.explanation && <Md>{q.explanation}</Md>}
          </div>
        )}

        <div className="quiz-actions">
          {mode === "practice" ? (
            <>
              <span />
              {!isChecked ? (
                <div className="qrow" style={{ gap: 8 }}>
                  <button className="btn btn-ghost btn-sm" onClick={goNext}>Bỏ qua</button>
                  <button className="btn btn-primary" disabled={!sel.length} onClick={() => setChecked((c) => ({ ...c, [q.id]: true }))}>
                    Kiểm tra
                  </button>
                </div>
              ) : (
                <button className="btn btn-primary" onClick={goNext}>{last ? "Xem kết quả" : "Câu tiếp →"}</button>
              )}
            </>
          ) : (
            <>
              <button className="btn btn-ghost btn-sm" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>← Trước</button>
              {last ? (
                <button className="btn btn-primary" onClick={() => setConfirming(true)}>Nộp bài</button>
              ) : (
                <button className="btn btn-primary" onClick={() => setIdx(idx + 1)}>Sau →</button>
              )}
            </>
          )}
        </div>
      </div>

      {mode === "exam" && (
        <div className="glass" style={{ padding: 18, marginTop: 16, borderRadius: 16 }}>
          <div className="qrow" style={{ justifyContent: "space-between", marginBottom: 10, gap: 10, flexWrap: "wrap" }}>
            <b style={{ fontSize: ".95rem" }}>Bảng câu hỏi · đã làm {answeredCount}/{session.length}</b>
            <button className="btn btn-ghost btn-sm" onClick={() => setConfirming(true)}>Nộp bài</button>
          </div>
          <div className="quiz-nav">
            {session.map((x, i) => (
              <button
                key={x.id} type="button" aria-label={`Câu ${i + 1}`}
                className={`${(answers[x.id] || []).length ? "done" : ""} ${i === idx ? "cur" : ""}`}
                onClick={() => setIdx(i)}
              >{i + 1}</button>
            ))}
          </div>
        </div>
      )}

      {confirming && (
        <div className="quiz-modal" role="dialog" aria-modal="true" onClick={() => setConfirming(false)}>
          <div className="glass quiz-modal-box" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: 10 }}>Nộp bài?</h3>
            <p className="muted" style={{ marginBottom: 18 }}>
              {blanks > 0 ? `Bạn còn ${blanks} câu chưa trả lời. ` : "Bạn đã trả lời tất cả các câu. "}Nộp bài ngay bây giờ?
            </p>
            <div className="qrow" style={{ gap: 10, justifyContent: "flex-end" }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setConfirming(false)}>Làm tiếp</button>
              <button className="btn btn-primary btn-sm" onClick={finish}>Nộp bài</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
