/* Chuyển văn bản / JSON dán vào thành danh sách câu hỏi trắc nghiệm. */
import { TF_OPTIONS } from "./quiz.js";

export const SAMPLE_QUIZ_TEXT = `Câu 1: Thẻ HTML nào dùng để tạo liên kết?
A. <div>
B. <a>
C. <p>
D. <span>
Đáp án: B
Giải thích: Thẻ <a> (anchor) tạo siêu liên kết, thuộc tính href chứa địa chỉ đích.

Câu 2: Chọn các ngôn ngữ chạy được trực tiếp trong trình duyệt.
A. JavaScript
B. Python
C. HTML
D. CSS
Đáp án: A, C, D
Giải thích: Trình duyệt hiểu HTML, CSS và JavaScript. Python cần môi trường riêng.

Câu 3: CSS dùng để định dạng giao diện trang web.
Đáp án: Đúng
Giải thích: CSS (Cascading Style Sheets) mô tả cách hiển thị: màu sắc, bố cục, phông chữ.

Câu 4: HTML là một ngôn ngữ lập trình.
Đáp án: Sai
Giải thích: HTML là ngôn ngữ đánh dấu, dùng mô tả cấu trúc nội dung, không có logic điều khiển.

Câu 5: Phương thức HTTP nào thường dùng để lấy dữ liệu từ máy chủ?
A. POST
B. DELETE
*C. GET
D. PUT
Giải thích: GET dùng để đọc dữ liệu và không làm thay đổi tài nguyên trên máy chủ.`;

export const SAMPLE_QUIZ_JSON = `[
  {
    "type": "single",
    "text": "Thẻ HTML nào dùng để tạo siêu liên kết?",
    "options": [
      "<div>",
      "<a>",
      "<p>",
      "<span>"
    ],
    "correct": 1,
    "explanation": "Thẻ <a> (anchor) với thuộc tính href dùng để tạo siêu liên kết."
  },
  {
    "type": "multiple",
    "text": "Chọn các ngôn ngữ chạy được trực tiếp trong trình duyệt web:",
    "options": [
      "JavaScript",
      "Python",
      "HTML",
      "CSS"
    ],
    "correct": [0, 2, 3],
    "explanation": "Trình duyệt hỗ trợ trực tiếp HTML, CSS và JavaScript. Python cần môi trường runtime riêng."
  },
  {
    "type": "truefalse",
    "text": "HTML là một ngôn ngữ lập trình.",
    "options": [
      "Đúng",
      "Sai"
    ],
    "correct": 1,
    "explanation": "HTML là ngôn ngữ đánh dấu siêu văn bản, không có các cấu trúc điều khiển như if/else hay vòng lặp."
  }
]`;

/** Mẫu JSON có hướng dẫn chi tiết từng dòng để người dùng copy điền đề thi */
export const SAMPLE_JSON_GUIDED = `[
  {
    "type": "single",
    "text": "1. Điền câu hỏi 1 đáp án đúng vào đây? (Ví dụ: Thủ đô của Việt Nam là gì?)",
    "options": [
      "Đáp án A (Vị trí 0)",
      "Đáp án B (Vị trí 1 - ĐÁP ÁN ĐÚNG)",
      "Đáp án C (Vị trí 2)",
      "Đáp án D (Vị trí 3)"
    ],
    "correct": 1,
    "explanation": "Điền lời giải thích vì sao đáp án B đúng vào đây (có thể để trống)."
  },
  {
    "type": "multiple",
    "text": "2. Điền câu hỏi chọn NHIỀU đáp án đúng vào đây?",
    "options": [
      "Đáp án A (Vị trí 0 - ĐÚNG)",
      "Đáp án B (Vị trí 1 - Sai)",
      "Đáp án C (Vị trí 2 - ĐÚNG)",
      "Đáp án D (Vị trí 3 - ĐÚNG)"
    ],
    "correct": [0, 2, 3],
    "explanation": "Điền mảng vị trí [0, 2, 3] tương ứng với A, C, D (hoặc viết dạng [\\"A\\", \\"C\\", \\"D\\"])."
  },
  {
    "type": "truefalse",
    "text": "3. Điền nhận định Đúng hoặc Sai vào đây?",
    "options": [
      "Đúng",
      "Sai"
    ],
    "correct": 0,
    "explanation": "Điền 0 nếu nhận định trên là Đúng, điền 1 nếu là Sai."
  }
]`;

/** Mẫu trắc nghiệm cơ bản 1 đáp án A/B/C/D nhanh gọn */
export const SAMPLE_JSON_SIMPLE = `[
  {
    "text": "Câu hỏi trắc nghiệm số 1?",
    "options": [
      "Lựa chọn A",
      "Lựa chọn B (Đáp án đúng)",
      "Lựa chọn C",
      "Lựa chọn D"
    ],
    "correct": "B",
    "explanation": "Giải thích chi tiết cho câu 1..."
  },
  {
    "text": "Câu hỏi trắc nghiệm số 2?",
    "options": [
      "Lựa chọn A (Đáp án đúng)",
      "Lựa chọn B",
      "Lựa chọn C",
      "Lựa chọn D"
    ],
    "correct": "A",
    "explanation": "Giải thích chi tiết cho câu 2..."
  }
]`;

/** Prompt mẫu chuẩn dùng cho AI (ChatGPT, Claude, Gemini) tạo bộ đề */
export const SAMPLE_AI_PROMPT = `Hãy tạo cho tôi [10] câu hỏi trắc nghiệm về chủ đề "[Điền chủ đề của bạn vào đây]", trả về kết quả CHỈ DUY NHẤT một mảng JSON thuần túy (không kèm lời chào hay văn bản thừa) theo đúng định dạng mẫu sau:

[
  {
    "type": "single",
    "text": "Nội dung câu hỏi?",
    "options": [
      "Đáp án A",
      "Đáp án B",
      "Đáp án C",
      "Đáp án D"
    ],
    "correct": 0,
    "explanation": "Lời giải thích vì sao đáp án này đúng..."
  }
]`;

const RE_QUESTION = /^(?:câu(?:\s*hỏi)?|cau|question)\s*\d*\s*[:.)\-–]\s*(.*)$/i;
const RE_NUMBERED = /^\d+\s*[.)]\s+(.+)$/;
const RE_OPTION = /^(\*?)\s*([A-Ha-h])\s*[.)]\s*(.*)$/;
const RE_ANSWER = /^(?:đáp án(?:\s*đúng)?|dap an|answer|đ\/a)\s*[:：\-–]\s*(.+)$/i;
const RE_EXPLAIN = /^(?:giải thích|lời giải|giai thich|explanation)\s*[:：\-–]\s*(.*)$/i;

const TRUE_WORDS = ["đúng", "dung", "true", "t", "đ"];
const FALSE_WORDS = ["sai", "false", "f", "s"];
const norm = (s) => String(s).trim().toLowerCase();
const makeId = (i) => `q-${Date.now().toString(36)}-${i}`;

const isTrueFalseOptions = (opts) =>
  opts.length === 2 &&
  TRUE_WORDS.includes(norm(opts[0])) &&
  FALSE_WORDS.includes(norm(opts[1]));

function finishQuestion(draft, index, errors) {
  const where = draft.line;
  const fail = (message) => errors.push({ line: where, message: `Câu ${index}: ${message}` });
  const text = draft.text.trim();
  if (!text) return fail("thiếu nội dung câu hỏi."), null;

  const opts = draft.options.map((o) => o.text.trim());
  let correct = draft.options.map((o, i) => (o.star ? i : -1)).filter((i) => i >= 0);

  // Không có lựa chọn: câu Đúng/Sai
  if (!opts.length) {
    const raw = norm(draft.answer || "");
    if (TRUE_WORDS.includes(raw)) correct = [0];
    else if (FALSE_WORDS.includes(raw)) correct = [1];
    else return fail("không có đáp án A/B/C và đáp án không phải Đúng/Sai."), null;
    return { id: makeId(index), type: "truefalse", text, options: [...TF_OPTIONS], correct, explanation: draft.explanation.trim() };
  }

  if (opts.length < 2) return fail("cần ít nhất 2 đáp án."), null;
  if (opts.some((o) => !o)) return fail("có đáp án để trống."), null;

  if (!correct.length && draft.answer) {
    const tokens = draft.answer
      .split(/[\s,;&]+/)
      .map((t) => t.trim().toUpperCase())
      .filter((t) => t && t !== "VÀ" && t !== "AND");
    for (const t of tokens) {
      const idx = t.charCodeAt(0) - 65;
      if (t.length !== 1 || idx < 0 || idx >= opts.length) return fail(`đáp án "${t}" không khớp với các lựa chọn.`), null;
      if (!correct.includes(idx)) correct.push(idx);
    }
  }
  if (!correct.length) return fail("thiếu đáp án đúng (dòng \"Đáp án: ...\" hoặc dấu * trước lựa chọn đúng)."), null;

  let type = correct.length > 1 ? "multiple" : "single";
  if (type === "single" && isTrueFalseOptions(opts)) {
    return { id: makeId(index), type: "truefalse", text, options: [...TF_OPTIONS], correct, explanation: draft.explanation.trim() };
  }
  return { id: makeId(index), type, text, options: opts, correct: correct.sort((a, b) => a - b), explanation: draft.explanation.trim() };
}

/** Phân tích văn bản theo mẫu "Câu N: ... / A. ... / Đáp án: ... / Giải thích: ...". */
export function parseQuizText(input) {
  const errors = [];
  const questions = [];
  const lines = String(input || "").replace(/\r/g, "").split("\n");
  let cur = null;
  let field = "text"; // text | option | explanation
  let n = 0;

  const flush = () => {
    if (!cur) return;
    n += 1;
    const q = finishQuestion(cur, n, errors);
    if (q) questions.push(q);
    cur = null;
  };
  const start = (text, line) => {
    flush();
    cur = { text, options: [], answer: "", explanation: "", line };
    field = "text";
  };

  lines.forEach((raw, i) => {
    const line = raw.trim();
    const lineNo = i + 1;
    if (!line) return;

    let m = line.match(RE_QUESTION);
    if (m) return start(m[1], lineNo);

    // "1. nội dung" chỉ tính là câu mới khi chưa có câu nào hoặc câu trước đã có đáp án
    m = line.match(RE_NUMBERED);
    if (m && (!cur || (cur.answer && field !== "explanation") || (cur.options.some((o) => o.star) && field !== "explanation"))) {
      return start(m[1], lineNo);
    }

    if (!cur) {
      errors.push({ line: lineNo, message: `Dòng ${lineNo} nằm ngoài câu hỏi nào (cần bắt đầu bằng "Câu N:").` });
      return;
    }

    m = line.match(RE_ANSWER);
    if (m) { cur.answer = m[1].trim(); field = "answer"; return; }

    m = line.match(RE_EXPLAIN);
    if (m) { cur.explanation = m[1]; field = "explanation"; return; }

    m = line.match(RE_OPTION);
    if (m && field !== "explanation") {
      cur.options.push({ text: m[3], star: m[1] === "*" });
      field = "option";
      return;
    }

    // Dòng nối tiếp của phần đang viết
    if (field === "explanation") cur.explanation += `\n${line}`;
    else if (field === "option") cur.options[cur.options.length - 1].text += ` ${line}`;
    else if (field === "text") cur.text += ` ${line}`;
  });
  flush();

  if (!questions.length && !errors.length) errors.push({ line: 0, message: "Không tìm thấy câu hỏi nào. Mỗi câu cần bắt đầu bằng \"Câu 1:\"." });
  return { questions, errors };
}

/** Chuẩn hóa một câu hỏi dạng JSON. */
function normalizeJsonQuestion(raw, i, errors) {
  const fail = (message) => errors.push({ line: 0, message: `Câu ${i + 1}: ${message}` });
  if (!raw || typeof raw !== "object") return fail("không phải đối tượng hợp lệ."), null;
  const text = String(raw.text ?? raw.question ?? "").trim();
  if (!text) return fail("thiếu trường \"text\"."), null;

  let options = Array.isArray(raw.options) ? raw.options.map((o) => String(o).trim()) : [];
  let correct = raw.correct ?? raw.answer;
  let type = raw.type;

  if (type === "truefalse" || (!options.length && typeof correct === "boolean")) {
    options = [...TF_OPTIONS];
    if (typeof correct === "boolean") correct = [correct ? 0 : 1];
    type = "truefalse";
  }
  correct = Array.isArray(correct) ? correct : correct === undefined ? [] : [correct];
  correct = correct.map((c) => {
    if (typeof c === "string") {
      const trimmed = c.trim();
      if (/^[A-Za-z]$/.test(trimmed)) return trimmed.toUpperCase().charCodeAt(0) - 65;
    }
    return Number(c);
  });

  if (options.length < 2) return fail("cần ít nhất 2 đáp án trong \"options\"."), null;
  if (!correct.length || correct.some((c) => !Number.isInteger(c) || c < 0 || c >= options.length)) {
    return fail("\"correct\" thiếu hoặc không khớp với \"options\"."), null;
  }
  if (type !== "single" && type !== "multiple" && type !== "truefalse") type = correct.length > 1 ? "multiple" : "single";
  if (type !== "multiple" && correct.length > 1) return fail("loại 1 đáp án nhưng có nhiều đáp án đúng."), null;

  return { id: makeId(i + 1), type, text, options, correct: [...new Set(correct)].sort((a, b) => a - b), explanation: String(raw.explanation ?? "").trim() };
}

/** Loại bỏ comment //, /* và dấu phẩy thừa trước ] hoặc } */
function cleanJsonString(str) {
  let cleaned = str.replace(/\\"|"(?:\\"|[^"])*"|(\/\/.*|\/\*[\s\S]*?\*\/)/g, (m, g) => (g ? "" : m));
  cleaned = cleaned.replace(/,(\s*[\]}])/g, "$1");
  return cleaned.trim();
}

/** Nhận cả văn bản theo mẫu lẫn JSON (mảng câu hỏi hoặc { questions: [...] }). */
export function parseQuizInput(input) {
  const s = String(input || "").trim();
  const cleaned = cleanJsonString(s);
  if (cleaned.startsWith("[") || cleaned.startsWith("{")) {
    try {
      const data = JSON.parse(cleaned);
      const list = Array.isArray(data) ? data : data.questions;
      if (!Array.isArray(list)) return { questions: [], errors: [{ line: 0, message: "JSON cần là một mảng câu hỏi hoặc đối tượng có trường \"questions\"." }] };
      const errors = [];
      const questions = list.map((q, i) => normalizeJsonQuestion(q, i, errors)).filter(Boolean);
      return { questions, errors };
    } catch (e) {
      return { questions: [], errors: [{ line: 0, message: `JSON không hợp lệ: ${e.message}` }] };
    }
  }
  return parseQuizText(s);
}
