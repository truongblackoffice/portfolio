import test from "node:test";
import assert from "node:assert/strict";
import { parseQuizText, parseQuizInput, SAMPLE_QUIZ_TEXT } from "./quizParser.js";

test("đề mẫu phân tích được đủ 5 câu, không lỗi, đủ 3 loại", () => {
  const { questions, errors } = parseQuizText(SAMPLE_QUIZ_TEXT);
  assert.deepEqual(errors, []);
  assert.equal(questions.length, 5);
  assert.deepEqual(questions.map((q) => q.type), ["single", "multiple", "truefalse", "truefalse", "single"]);
  assert.deepEqual(questions[0].correct, [1]);
  assert.deepEqual(questions[1].correct, [0, 2, 3]);
  assert.deepEqual(questions[2].correct, [0]);
  assert.deepEqual(questions[3].correct, [1]);
  assert.deepEqual(questions[4].correct, [2]);
  assert.match(questions[0].explanation, /anchor/);
});

test("câu chọn 1 đáp án với dòng Đáp án", () => {
  const { questions, errors } = parseQuizText("Câu 1: 1+1=?\nA. 1\nB. 2\nC. 3\nĐáp án: B");
  assert.deepEqual(errors, []);
  assert.equal(questions[0].type, "single");
  assert.deepEqual(questions[0].options, ["1", "2", "3"]);
  assert.deepEqual(questions[0].correct, [1]);
});

test("đáp án đánh dấu bằng dấu *", () => {
  const { questions } = parseQuizText("Câu 1: Chọn\nA. x\n*B. y\nC. z");
  assert.deepEqual(questions[0].correct, [1]);
});

test("nhiều đáp án phân tách bằng dấu phẩy hoặc 'và' → multiple", () => {
  const a = parseQuizText("Câu 1: Q\nA. a\nB. b\nC. c\nĐáp án: A, C").questions[0];
  const b = parseQuizText("Câu 1: Q\nA. a\nB. b\nC. c\nĐáp án: A và C").questions[0];
  assert.equal(a.type, "multiple");
  assert.deepEqual(a.correct, [0, 2]);
  assert.deepEqual(b.correct, [0, 2]);
});

test("hai lựa chọn Đúng/Sai được nhận là truefalse", () => {
  const q = parseQuizText("Câu 1: Trái đất tròn\nA. Đúng\nB. Sai\nĐáp án: A").questions[0];
  assert.equal(q.type, "truefalse");
  assert.deepEqual(q.correct, [0]);
});

test("đánh số kiểu '1.' và nhận 'Câu hỏi 2:'", () => {
  const { questions, errors } = parseQuizText("1. Câu đầu\nA. a\nB. b\nĐáp án: A\n\nCâu hỏi 2: Câu hai\nA. a\nB. b\nĐáp án: B");
  assert.deepEqual(errors, []);
  assert.equal(questions.length, 2);
});

test("danh sách đánh số trong phần giải thích không bị tách thành câu mới", () => {
  const { questions } = parseQuizText("Câu 1: Q\nA. a\nB. b\nĐáp án: A\nGiải thích: Có hai lý do:\n1. Lý do một\n2. Lý do hai");
  assert.equal(questions.length, 1);
  assert.match(questions[0].explanation, /Lý do hai/);
});

test("dòng nối tiếp được ghép vào câu hỏi, đáp án và giải thích", () => {
  const { questions } = parseQuizText("Câu 1: Câu hỏi dài\ntiếp tục ở dòng sau\nA. đáp án dài\nvẫn tiếp\nB. b\nĐáp án: A\nGiải thích: dòng 1\ndòng 2");
  assert.equal(questions[0].text, "Câu hỏi dài tiếp tục ở dòng sau");
  assert.equal(questions[0].options[0], "đáp án dài vẫn tiếp");
  assert.equal(questions[0].explanation, "dòng 1\ndòng 2");
});

test("báo lỗi kèm số dòng khi thiếu đáp án hoặc đáp án sai", () => {
  const missing = parseQuizText("Câu 1: Q\nA. a\nB. b");
  assert.equal(missing.questions.length, 0);
  assert.match(missing.errors[0].message, /thiếu đáp án đúng/);
  assert.equal(missing.errors[0].line, 1);

  const wrong = parseQuizText("Câu 1: Q\nA. a\nB. b\nĐáp án: Z");
  assert.match(wrong.errors[0].message, /không khớp/);

  const oneOption = parseQuizText("Câu 1: Q\nA. a\nĐáp án: A");
  assert.match(oneOption.errors[0].message, /ít nhất 2/);

  const noChoicesBadAnswer = parseQuizText("Câu 1: Q\nĐáp án: có thể");
  assert.match(noChoicesBadAnswer.errors[0].message, /không phải Đúng\/Sai/);
});

test("một câu lỗi không làm mất các câu hợp lệ khác", () => {
  const { questions, errors } = parseQuizText("Câu 1: Hỏng\nA. a\nB. b\n\nCâu 2: Tốt\nA. a\nB. b\nĐáp án: A");
  assert.equal(questions.length, 1);
  assert.equal(errors.length, 1);
  assert.equal(questions[0].text, "Tốt");
});

test("văn bản rỗng hoặc dòng nằm ngoài câu hỏi", () => {
  assert.equal(parseQuizText("").errors.length, 1);
  const stray = parseQuizText("lạc đề\nCâu 1: Q\nA. a\nB. b\nĐáp án: A");
  assert.equal(stray.questions.length, 1);
  assert.equal(stray.errors.length, 1);
});

test("JSON: mảng câu hỏi, chỉ số, chữ cái và boolean", () => {
  const json = JSON.stringify([
    { text: "Q1", options: ["a", "b"], correct: 1 },
    { text: "Q2", options: ["a", "b", "c"], correct: ["A", "C"], explanation: "giải" },
    { text: "Q3", correct: true },
  ]);
  const { questions, errors } = parseQuizInput(json);
  assert.deepEqual(errors, []);
  assert.deepEqual(questions.map((q) => q.type), ["single", "multiple", "truefalse"]);
  assert.deepEqual(questions[1].correct, [0, 2]);
  assert.deepEqual(questions[2].correct, [0]);
});

test("JSON: đối tượng có trường questions và báo lỗi từng câu", () => {
  const ok = parseQuizInput(JSON.stringify({ questions: [{ text: "Q", options: ["a", "b"], correct: 0 }] }));
  assert.equal(ok.questions.length, 1);

  const bad = parseQuizInput(JSON.stringify([{ options: ["a", "b"], correct: 0 }, { text: "Q", options: ["a"], correct: 0 }, { text: "Q", options: ["a", "b"], correct: 9 }]));
  assert.equal(bad.questions.length, 0);
  assert.equal(bad.errors.length, 3);
});

test("JSON hỏng được báo lỗi rõ ràng, không ném ngoại lệ", () => {
  const r = parseQuizInput("[{ hỏng");
  assert.equal(r.questions.length, 0);
  assert.match(r.errors[0].message, /JSON không hợp lệ/);
  assert.match(parseQuizInput('{"a":1}').errors[0].message, /mảng câu hỏi/);
});

test("parseQuizInput chuyển văn bản thường sang bộ phân tích văn bản", () => {
  assert.equal(parseQuizInput("Câu 1: Q\nA. a\nB. b\nĐáp án: A").questions.length, 1);
});
