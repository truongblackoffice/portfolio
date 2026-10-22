"use client";
import ReactMarkdown from "react-markdown";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
export const letterOf = (i) => LETTERS[i] || String(i + 1);

/* Câu gốc có options là chuỗi, câu trong phiên làm bài có options { text, origIndex } */
export const normOptions = (q) =>
  (q.options || []).map((o, i) => (typeof o === "string" ? { text: o, origIndex: i } : o));

export function Md({ children }) {
  if (!children) return null;
  return (
    <div className="prose quiz-md">
      <ReactMarkdown>{children}</ReactMarkdown>
    </div>
  );
}

/**
 * Danh sách đáp án ở chế độ xem lại / xem lời giải.
 * selected = null  → chỉ đánh dấu đáp án đúng (Xem lời giải)
 * selected = []    → xem lại bài đã làm: đúng/sai/bỏ sót
 */
export function ReviewOptions({ q, selected = null }) {
  const opts = normOptions(q);
  return (
    <div className="quiz-options">
      {opts.map((o, i) => {
        const isCorrect = (q.correct || []).includes(o.origIndex);
        const isSel = selected ? selected.includes(o.origIndex) : false;
        let state = "";
        let mark = letterOf(i);
        if (isCorrect && (selected === null || isSel)) { state = "correct"; mark = "✓"; }
        else if (isCorrect) { state = "missed"; mark = "✓"; }
        else if (isSel) { state = "wrong"; mark = "✗"; }
        return (
          <div key={o.origIndex} className={`quiz-opt static ${state}`}>
            <span className="quiz-opt-mark">{mark}</span>
            <span className="quiz-opt-text">{o.text}</span>
            {state === "missed" && <span className="quiz-opt-note">Đáp án đúng</span>}
          </div>
        );
      })}
    </div>
  );
}

/* Một câu hỏi dạng thu gọn/mở rộng kèm lời giải */
export function SolutionItem({ q, number, open, onToggle, selected = null, status }) {
  return (
    <div className={`quiz-sol ${open ? "open" : ""} ${status || ""}`}>
      <button type="button" className="quiz-sol-head" onClick={onToggle} aria-expanded={open}>
        <span className="quiz-sol-num">
          {status === "ok" ? "✓" : status === "bad" ? "✗" : `Câu ${number}`}
        </span>
        <span className="quiz-sol-title">{status ? `Câu ${number}. ` : ""}{q.text}</span>
        <span className="quiz-sol-caret" aria-hidden="true">{open ? "▾" : "▸"}</span>
      </button>
      {open && (
        <div className="quiz-sol-body">
          <ReviewOptions q={q} selected={selected} />
          {q.explanation ? (
            <div className="quiz-explain">
              <b>💡 Giải thích</b>
              <Md>{q.explanation}</Md>
            </div>
          ) : (
            <p className="muted" style={{ fontSize: ".85rem" }}>Câu này chưa có phần giải thích.</p>
          )}
        </div>
      )}
    </div>
  );
}
