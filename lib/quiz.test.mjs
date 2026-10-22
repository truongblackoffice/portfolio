import test from "node:test";
import assert from "node:assert/strict";
import {
  shuffle, buildSession, gradeQuestion, scoreSession, validateQuiz,
  groupByTopic, collectSolutions, countQuestions, formatDuration, newQuestion, UNCATEGORIZED,
} from "./quiz.js";

const seq = (values) => { let i = 0; return () => values[i++ % values.length]; };

const single = { id: "a", type: "single", text: "Q1", options: ["x", "y", "z"], correct: [1], explanation: "" };
const multi = { id: "b", type: "multiple", text: "Q2", options: ["a", "b", "c", "d"], correct: [0, 2], explanation: "" };
const tf = { id: "c", type: "truefalse", text: "Q3", options: ["Đúng", "Sai"], correct: [1], explanation: "" };

test("shuffle giữ nguyên phần tử và không đổi mảng gốc", () => {
  const src = [1, 2, 3, 4, 5];
  const out = shuffle(src, seq([0.1, 0.9, 0.4, 0.7]));
  assert.deepEqual([...out].sort(), [1, 2, 3, 4, 5]);
  assert.deepEqual(src, [1, 2, 3, 4, 5]);
});

test("gradeQuestion: single", () => {
  assert.equal(gradeQuestion(single, [1]), true);
  assert.equal(gradeQuestion(single, [0]), false);
  assert.equal(gradeQuestion(single, []), false);
  assert.equal(gradeQuestion(single, undefined), false);
});

test("gradeQuestion: multiple phải khớp chính xác tập đáp án, không phụ thuộc thứ tự", () => {
  assert.equal(gradeQuestion(multi, [2, 0]), true);
  assert.equal(gradeQuestion(multi, [0]), false);
  assert.equal(gradeQuestion(multi, [0, 2, 3]), false);
  assert.equal(gradeQuestion(multi, [0, 0]), false);
});

test("gradeQuestion: truefalse", () => {
  assert.equal(gradeQuestion(tf, [1]), true);
  assert.equal(gradeQuestion(tf, [0]), false);
});

test("buildSession: xáo đáp án vẫn chấm đúng theo vị trí gốc", () => {
  const quiz = { questions: [single, multi, tf] };
  const session = buildSession(quiz, { shuffleOptions: true, rnd: seq([0.0, 0.3, 0.8]) });
  const q1 = session.find((q) => q.id === "a");
  const rightOpt = q1.options.find((o) => o.text === "y");
  assert.equal(gradeQuestion(q1, [rightOpt.origIndex]), true);
  const q2 = session.find((q) => q.id === "b");
  const picks = q2.options.filter((o) => o.text === "a" || o.text === "c").map((o) => o.origIndex);
  assert.equal(gradeQuestion(q2, picks), true);
});

test("buildSession: không xáo câu Đúng/Sai và giới hạn số câu", () => {
  const quiz = { questions: [single, multi, tf] };
  const session = buildSession(quiz, { shuffleOptions: true, rnd: () => 0 });
  const t = session.find((q) => q.id === "c");
  assert.deepEqual(t.options.map((o) => o.text), ["Đúng", "Sai"]);
  assert.equal(buildSession(quiz, { count: 2 }).length, 2);
  assert.equal(buildSession(quiz, { count: 99 }).length, 3);
  assert.equal(buildSession({}, {}).length, 0);
});

test("buildSession: không làm thay đổi bộ đề gốc", () => {
  const quiz = { questions: [single] };
  const snapshot = JSON.stringify(quiz);
  buildSession(quiz, { shuffleOptions: true, shuffleQuestions: true });
  assert.equal(JSON.stringify(quiz), snapshot);
});

test("scoreSession tính điểm và phần trăm", () => {
  const session = buildSession({ questions: [single, multi, tf] });
  const r = scoreSession(session, { a: [1], b: [0, 2], c: [0] });
  assert.deepEqual(r, { correctCount: 2, total: 3, percent: 67 });
  assert.deepEqual(scoreSession([], {}), { correctCount: 0, total: 0, percent: 0 });
  assert.equal(scoreSession(session, {}).correctCount, 0);
});

test("validateQuiz phát hiện các lỗi thường gặp", () => {
  assert.ok(validateQuiz({ title: "", questions: [] }).length >= 2);
  const bad = validateQuiz({
    title: "T",
    questions: [
      { type: "single", text: "", options: ["a"], correct: [] },
      { type: "single", text: "ok", options: ["a", "b"], correct: [0, 1] },
      { type: "single", text: "ok", options: ["a", ""], correct: [0] },
      { type: "multiple", text: "ok", options: ["a", "b"], correct: [5] },
    ],
  });
  const msgs = bad.map((e) => e.message).join("|");
  assert.match(msgs, /trống/);
  assert.match(msgs, /ít nhất 2 đáp án/);
  assert.match(msgs, /chỉ được có 1/);
  assert.match(msgs, /không hợp lệ/);
});

test("validateQuiz chấp nhận bộ đề hợp lệ", () => {
  assert.deepEqual(validateQuiz({ title: "T", questions: [single, multi, tf] }), []);
});

test("groupByTopic: sắp theo order, có nhóm Chưa phân loại, bỏ qua chủ đề không tồn tại", () => {
  const topics = [
    { id: "t2", name: "Mạng", order: 2 },
    { id: "t1", name: "Web", order: 1 },
    { id: "t3", name: "Rỗng", order: 3 },
  ];
  const quizzes = [
    { id: "q1", topicId: "t1", questions: [single, multi] },
    { id: "q2", topicId: "t2", questions: [tf] },
    { id: "q3", topicId: "" , questions: [single] },
    { id: "q4", topicId: "da-xoa", questions: [single, single] },
  ];
  const g = groupByTopic(quizzes, topics);
  assert.deepEqual(g.map((x) => x.topic.id), ["t1", "t2", "t3", UNCATEGORIZED]);
  assert.equal(g[0].quizCount, 1);
  assert.equal(g[0].questionCount, 2);
  assert.equal(g[2].quizCount, 0);
  assert.equal(g[3].quizCount, 2);
  assert.equal(g[3].questionCount, 3);
});

test("groupByTopic: không có nhóm Chưa phân loại khi mọi bộ đề đã có chủ đề", () => {
  const g = groupByTopic([{ id: "q", topicId: "t1", questions: [] }], [{ id: "t1", name: "A" }]);
  assert.equal(g.length, 1);
});

test("collectSolutions đánh số câu theo từng bộ đề và bỏ bộ đề rỗng", () => {
  const out = collectSolutions([
    { id: "q1", title: "A", questions: [single, tf] },
    { id: "q2", title: "B", questions: [] },
  ]);
  assert.equal(out.length, 1);
  assert.deepEqual(out[0].questions.map((q) => q.number), [1, 2]);
  assert.equal(countQuestions([{ questions: [1, 2] }, {}]), 2);
});

test("formatDuration và newQuestion", () => {
  assert.equal(formatDuration(65), "01:05");
  assert.equal(formatDuration(-3), "00:00");
  assert.deepEqual(newQuestion("truefalse").options, ["Đúng", "Sai"]);
  assert.equal(newQuestion("multiple").options.length, 4);
});
