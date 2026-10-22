/* Logic thuần cho tính năng ôn tập trắc nghiệm (không phụ thuộc React/Firebase). */

export const QUESTION_TYPES = {
  single: "Chọn 1 đáp án",
  multiple: "Chọn nhiều đáp án",
  truefalse: "Đúng / Sai",
};
export const TF_OPTIONS = ["Đúng", "Sai"];
export const UNCATEGORIZED = "uncategorized";

/** Xáo trộn Fisher–Yates, không làm thay đổi mảng gốc. */
export function shuffle(arr, rnd = Math.random) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Tạo danh sách câu cho một lượt làm bài.
 * Mỗi đáp án giữ `origIndex` (vị trí gốc) nên xáo trộn vẫn chấm đúng.
 */
export function buildSession(quiz, { shuffleQuestions = false, shuffleOptions = false, count = 0, rnd = Math.random } = {}) {
  let qs = (quiz?.questions || []).map((q) => ({ ...q }));
  if (shuffleQuestions) qs = shuffle(qs, rnd);
  if (count > 0 && count < qs.length) qs = qs.slice(0, count);
  return qs.map((q) => {
    let options = (q.options || []).map((text, origIndex) => ({ text, origIndex }));
    if (shuffleOptions && q.type !== "truefalse") options = shuffle(options, rnd);
    return {
      id: q.id,
      type: q.type,
      text: q.text,
      explanation: q.explanation || "",
      options,
      correct: [...(q.correct || [])],
    };
  });
}

const sameSet = (a, b) => {
  if (a.length !== b.length) return false;
  const s = new Set(a);
  return b.every((x) => s.has(x)) && s.size === new Set(b).size;
};

/** Chấm một câu: `selected` là mảng vị trí gốc của các đáp án đã chọn. */
export function gradeQuestion(q, selected) {
  const sel = Array.isArray(selected) ? selected : [];
  if (!sel.length) return false;
  return sameSet(sel, q.correct || []);
}

/** Chấm cả lượt làm bài. `answers` có dạng { [questionId]: number[] }. */
export function scoreSession(session, answers = {}) {
  const total = session.length;
  const correctCount = session.filter((q) => gradeQuestion(q, answers[q.id])).length;
  const percent = total ? Math.round((correctCount / total) * 100) : 0;
  return { correctCount, total, percent };
}

/** Kiểm tra bộ đề, trả về danh sách lỗi dạng { qIndex, message } (qIndex = -1 là lỗi chung). */
export function validateQuiz(quiz) {
  const errors = [];
  if (!quiz?.title || !String(quiz.title).trim()) errors.push({ qIndex: -1, message: "Thiếu tiêu đề bộ đề." });
  const qs = quiz?.questions || [];
  if (!qs.length) errors.push({ qIndex: -1, message: "Bộ đề chưa có câu hỏi nào." });
  qs.forEach((q, i) => {
    if (!q.text || !String(q.text).trim()) errors.push({ qIndex: i, message: "Câu hỏi đang để trống." });
    const opts = q.options || [];
    if (opts.length < 2) errors.push({ qIndex: i, message: "Cần ít nhất 2 đáp án." });
    if (opts.some((o) => !String(o).trim())) errors.push({ qIndex: i, message: "Có đáp án đang để trống." });
    const correct = q.correct || [];
    if (!correct.length) errors.push({ qIndex: i, message: "Chưa đánh dấu đáp án đúng." });
    if (correct.some((c) => !Number.isInteger(c) || c < 0 || c >= opts.length)) {
      errors.push({ qIndex: i, message: "Đáp án đúng không hợp lệ." });
    }
    if ((q.type === "single" || q.type === "truefalse") && correct.length > 1) {
      errors.push({ qIndex: i, message: "Loại này chỉ được có 1 đáp án đúng." });
    }
  });
  return errors;
}

const byOrder = (a, b) => (a.order ?? 9999) - (b.order ?? 9999) || String(a.name || "").localeCompare(String(b.name || ""), "vi");

/**
 * Gom bộ đề theo chủ đề. Trả về mảng { topic, quizzes, quizCount, questionCount }.
 * Bộ đề không có chủ đề (hoặc chủ đề đã bị xóa) vào nhóm "Chưa phân loại" ở cuối.
 */
export function groupByTopic(quizzes = [], topics = []) {
  const known = new Set(topics.map((t) => t.id));
  const sorted = [...topics].sort(byOrder);
  const groups = sorted.map((topic) => {
    const list = quizzes.filter((q) => q.topicId === topic.id);
    return { topic, quizzes: list, quizCount: list.length, questionCount: countQuestions(list) };
  });
  const rest = quizzes.filter((q) => !q.topicId || !known.has(q.topicId));
  if (rest.length) {
    groups.push({
      topic: { id: UNCATEGORIZED, name: "Chưa phân loại", icon: "📂", color: "#64748b", desc: "" },
      quizzes: rest,
      quizCount: rest.length,
      questionCount: countQuestions(rest),
    });
  }
  return groups;
}

export const countQuestions = (quizzes = []) => quizzes.reduce((n, q) => n + (q.questions?.length || 0), 0);

/** Gom mọi câu hỏi của các bộ đề thành danh sách để hiển thị lời giải theo chủ đề. */
export function collectSolutions(quizzes = []) {
  return quizzes
    .filter((q) => (q.questions || []).length)
    .map((q) => ({
      quizId: q.id,
      quizTitle: q.title,
      questions: q.questions.map((question, i) => ({ ...question, number: i + 1 })),
    }));
}

export function formatDuration(sec = 0) {
  const s = Math.max(0, Math.round(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

/** Tạo câu hỏi rỗng theo loại, dùng cho trình soạn thảo. */
export function newQuestion(type = "single") {
  const id = `q-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  if (type === "truefalse") return { id, type, text: "", options: [...TF_OPTIONS], correct: [0], explanation: "" };
  return { id, type, text: "", options: ["", "", "", ""], correct: [], explanation: "" };
}
