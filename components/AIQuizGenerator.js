"use client";
import { useState, useRef } from "react";
import { QUESTION_TYPES } from "@/lib/quiz";

export default function AIQuizGenerator({ isOpen, onClose, onApply, existingCount = 0 }) {
  const [tab, setTab] = useState("file"); // "file" | "text"
  const [file, setFile] = useState(null);
  const [text, setText] = useState("");
  const [count, setCount] = useState(10);
  const [difficulty, setDifficulty] = useState("mixed"); // easy | medium | hard | mixed
  const [types, setTypes] = useState({
    single: true,
    multiple: true,
    truefalse: true,
  });
  const [customPrompt, setCustomPrompt] = useState("");
  const [apiKey, setApiKey] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        return localStorage.getItem("gemini_api_key_custom") || "";
      } catch {
        return "";
      }
    }
    return "";
  });
  const [showKeyInput, setShowKeyInput] = useState(false);

  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const fileInputRef = useRef(null);

  const handleSaveApiKey = (val) => {
    setApiKey(val);
    if (typeof window !== "undefined") {
      if (val) {
        localStorage.setItem("gemini_api_key_custom", val);
      } else {
        localStorage.removeItem("gemini_api_key_custom");
      }
    }
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) {
      if (f.size > 10 * 1024 * 1024) {
        setError("Tệp quá lớn (> 10MB). Vui lòng chọn tệp nhỏ hơn.");
        return;
      }
      setFile(f);
      setError("");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const f = e.dataTransfer?.files?.[0];
    if (f) {
      const name = f.name.toLowerCase();
      if (
        !name.endsWith(".docx") &&
        !name.endsWith(".pptx") &&
        !name.endsWith(".pdf") &&
        !name.endsWith(".txt") &&
        !name.endsWith(".md")
      ) {
        setError("Định dạng không được hỗ trợ. Vui lòng chọn tệp Word (.docx), PowerPoint (.pptx), PDF (.pdf), hoặc .txt");
        return;
      }
      if (f.size > 10 * 1024 * 1024) {
        setError("Tệp quá lớn (> 10MB). Vui lòng chọn tệp nhỏ hơn.");
        return;
      }
      setFile(f);
      setError("");
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const toggleType = (key) => {
    const next = { ...types, [key]: !types[key] };
    // Đảm bảo chọn ít nhất 1 loại
    if (!next.single && !next.multiple && !next.truefalse) {
      return;
    }
    setTypes(next);
  };

  const handleGenerate = async () => {
    setError("");
    setResult(null);

    if (tab === "file" && !file) {
      setError("Vui lòng tải lên tệp tài liệu (.docx, .pptx, .pdf, .txt).");
      return;
    }
    if (tab === "text" && !text.trim()) {
      setError("Vui lòng dán nội dung bài học hoặc đoạn văn bản.");
      return;
    }

    const selectedTypes = Object.entries(types)
      .filter(([, v]) => v)
      .map(([k]) => k)
      .join(",");

    setLoading(true);
    setLoadingStep("Đang tải dữ liệu và phân tích tài liệu...");

    try {
      const formData = new FormData();
      if (tab === "file" && file) {
        formData.append("file", file);
      } else {
        formData.append("text", text);
      }
      formData.append("count", count.toString());
      formData.append("difficulty", difficulty);
      formData.append("types", selectedTypes);
      formData.append("customPrompt", customPrompt);
      if (apiKey.trim()) {
        formData.append("apiKey", apiKey.trim());
      }

      setLoadingStep("AI đang phân tích kiến thức trọng tâm & biên soạn câu hỏi...");

      const res = await fetch("/api/ai/quiz-generate", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Lỗi máy chủ (${res.status})`);
      }

      setResult(data);
    } catch (err) {
      console.error("AI Generate Error:", err);
      setError(err.message || "Đã xảy ra lỗi khi tạo đề bằng AI.");
    } finally {
      setLoading(false);
      setLoadingStep("");
    }
  };

  const handleApply = (replaceAll) => {
    if (!result?.questions?.length) return;
    onApply(result.questions, replaceAll, result.titleSuggestion);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="ai-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="ai-modal-container glass-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 860,
          width: "94%",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          borderRadius: 20,
          overflow: "hidden",
          border: "1px solid rgba(168, 85, 247, 0.3)",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(168, 85, 247, 0.15)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 24px",
            background: "linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(168, 85, 247, 0.2))",
            borderBottom: "1px solid var(--glass-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: "linear-gradient(135deg, #6366f1, #a855f7)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.35rem",
                color: "#fff",
                boxShadow: "0 4px 14px rgba(168, 85, 247, 0.4)",
              }}
            >
              ✨
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.18rem", fontWeight: 700 }}>
                Trợ lý AI Tạo Đề Thi Tự Động
              </h3>
              <p className="muted" style={{ margin: "2px 0 0", fontSize: ".82rem" }}>
                Phân tích tài liệu Word (.docx), PDF, hoặc văn bản để tự động sinh câu hỏi trắc nghiệm chuẩn xác
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onClose}
            style={{ fontSize: "1.2rem", width: 34, height: 34, padding: 0, borderRadius: "50%" }}
            title="Đóng"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content */}
        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
          {error && (
            <div
              className="msg err"
              style={{
                marginBottom: 16,
                borderRadius: 10,
                padding: "10px 14px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>⚠️ {error}</span>
              <button
                type="button"
                onClick={() => setError("")}
                style={{ background: "none", border: "none", color: "inherit", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>
          )}

          {!result ? (
            <>
              {/* API Key setting bar */}
              <div
                style={{
                  background: "hsla(0 0% 100% / .03)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: 12,
                  padding: "10px 14px",
                  marginBottom: 18,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: ".85rem" }}>
                  <span>🔑</span>
                  <span>
                    Google Gemini API Key:{" "}
                    <b>{apiKey ? "Đã cài đặt key riêng" : "Mặc định hệ thống (Server)"}</b>
                  </span>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: ".78rem", padding: "4px 10px" }}
                    onClick={() => setShowKeyInput(!showKeyInput)}
                  >
                    {showKeyInput ? "Ẩn cấu hình key" : "Tùy chỉnh Key"}
                  </button>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: ".78rem", color: "var(--accent)", textDecoration: "underline" }}
                  >
                    Lấy key miễn phí ↗
                  </a>
                </div>
              </div>

              {showKeyInput && (
                <div
                  style={{
                    background: "rgba(0,0,0,0.25)",
                    border: "1px dashed rgba(168, 85, 247, 0.4)",
                    borderRadius: 12,
                    padding: 12,
                    marginBottom: 18,
                  }}
                >
                  <label style={{ fontSize: ".82rem", fontWeight: 600, display: "block", marginBottom: 6 }}>
                    Nhập Gemini API Key của bạn (Lưu an toàn tại trình duyệt của bạn):
                  </label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      type="password"
                      placeholder="AIzaSy..."
                      value={apiKey}
                      onChange={(e) => handleSaveApiKey(e.target.value)}
                      style={{ flex: 1, fontSize: ".85rem" }}
                    />
                    {apiKey && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleSaveApiKey("")}
                        style={{ fontSize: ".8rem" }}
                      >
                        Xóa
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Input Type Tabs */}
              <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                <button
                  type="button"
                  className={`btn ${tab === "file" ? "btn-primary" : "btn-ghost"}`}
                  onClick={() => setTab("file")}
                  style={{ flex: 1, padding: "9px 14px", borderRadius: 10, fontSize: ".9rem" }}
                >
                  📁 Tải Tệp Lên (Word / PowerPoint / PDF / Text)
                </button>
                <button
                  type="button"
                  className={`btn ${tab === "text" ? "btn-primary" : "btn-ghost"}`}
                  onClick={() => setTab("text")}
                  style={{ flex: 1, padding: "9px 14px", borderRadius: 10, fontSize: ".9rem" }}
                >
                  📝 Dán Nội Dung Văn Bản / Bài Học
                </button>
              </div>

              {/* Tab 1: File Upload */}
              {tab === "file" && (
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: "2px dashed rgba(168, 85, 247, 0.4)",
                    borderRadius: 14,
                    padding: "28px 20px",
                    textAlign: "center",
                    cursor: "pointer",
                    background: file
                      ? "rgba(168, 85, 247, 0.08)"
                      : "rgba(255, 255, 255, 0.02)",
                    transition: "all .2s ease",
                    marginBottom: 18,
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".docx,.pptx,.pdf,.txt,.md"
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                  />
                  {file ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
                      <span style={{ fontSize: "2rem" }}>
                        {file.name.endsWith(".pdf")
                          ? "📕"
                          : file.name.endsWith(".pptx")
                          ? "📙"
                          : file.name.endsWith(".docx")
                          ? "📘"
                          : "📄"}
                      </span>
                      <div style={{ textAlign: "left" }}>
                        <div style={{ fontWeight: 700, fontSize: ".95rem", color: "#fff" }}>{file.name}</div>
                        <div className="muted" style={{ fontSize: ".8rem" }}>
                          {(file.size / 1024 / 1024).toFixed(2)} MB • Nhấp để đổi tệp khác
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        style={{ marginLeft: 16 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setFile(null);
                        }}
                      >
                        Gỡ bỏ
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: "2.4rem", marginBottom: 6 }}>📤</div>
                      <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: 4 }}>
                        Kéo thả tệp vào đây hoặc nhấp để chọn tệp
                      </div>
                      <div className="muted" style={{ fontSize: ".83rem" }}>
                        Hỗ trợ Microsoft Word (<b>.docx</b>), PowerPoint (<b>.pptx</b>), Adobe PDF (<b>.pdf</b>), và tệp văn bản (<b>.txt</b>) tối đa 10MB
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Direct Text */}
              {tab === "text" && (
                <div style={{ marginBottom: 18 }}>
                  <textarea
                    rows={6}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Dán toàn bộ bài học, giáo án, tóm tắt lý thuyết, công thức hoặc đoạn văn bản cần ra đề trắc nghiệm vào đây..."
                    style={{
                      width: "100%",
                      borderRadius: 12,
                      fontSize: ".9rem",
                      lineHeight: "1.5",
                      fontFamily: "inherit",
                    }}
                  />
                  <div className="muted" style={{ fontSize: ".78rem", marginTop: 4, textAlign: "right" }}>
                    {text.length} ký tự
                  </div>
                </div>
              )}

              {/* Configuration Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: 16,
                  background: "hsla(0 0% 100% / .02)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: 14,
                  padding: 16,
                  marginBottom: 18,
                }}
              >
                {/* Count */}
                <div>
                  <label style={{ fontSize: ".85rem", fontWeight: 700, display: "block", marginBottom: 6 }}>
                    📊 Số lượng câu hỏi: <b style={{ color: "var(--accent)" }}>{count} câu</b>
                  </label>
                  <input
                    type="range"
                    min={3}
                    max={30}
                    step={1}
                    value={count}
                    onChange={(e) => setCount(parseInt(e.target.value, 10))}
                    style={{ width: "100%", accentColor: "var(--accent)" }}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".75rem" }} className="muted">
                    <span>3 câu</span>
                    <span>15 câu</span>
                    <span>30 câu</span>
                  </div>
                </div>

                {/* Difficulty */}
                <div>
                  <label style={{ fontSize: ".85rem", fontWeight: 700, display: "block", marginBottom: 6 }}>
                    🎯 Mức độ khó
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    style={{ width: "100%", borderRadius: 8, fontSize: ".88rem" }}
                  >
                    <option value="mixed">Trộn lẫn (Đủ các cấp độ)</option>
                    <option value="easy">Dễ (Nhận biết, định nghĩa)</option>
                    <option value="medium">Trung bình (Thông hiểu)</option>
                    <option value="hard">Khó (Vận dụng cao, tư duy)</option>
                  </select>
                </div>

                {/* Types */}
                <div>
                  <label style={{ fontSize: ".85rem", fontWeight: 700, display: "block", marginBottom: 6 }}>
                    🧩 Dạng câu hỏi mong muốn
                  </label>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label className="quiz-check" style={{ fontSize: ".82rem" }}>
                      <input
                        type="checkbox"
                        checked={types.single}
                        onChange={() => toggleType("single")}
                      />
                      1 Đáp án đúng (Single)
                    </label>
                    <label className="quiz-check" style={{ fontSize: ".82rem" }}>
                      <input
                        type="checkbox"
                        checked={types.multiple}
                        onChange={() => toggleType("multiple")}
                      />
                      Nhiều đáp án đúng (Multiple)
                    </label>
                    <label className="quiz-check" style={{ fontSize: ".82rem" }}>
                      <input
                        type="checkbox"
                        checked={types.truefalse}
                        onChange={() => toggleType("truefalse")}
                      />
                      Đúng / Sai (True / False)
                    </label>
                  </div>
                </div>
              </div>

              {/* Custom Prompt */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: ".85rem", fontWeight: 700, display: "block", marginBottom: 6 }}>
                  💬 Ghi chú / Yêu cầu riêng cho AI (Tùy chọn):
                </label>
                <input
                  type="text"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Ví dụ: Tập trung vào phần bài tập tính toán, tránh hỏi số liệu lịch sử cụ thể..."
                  style={{ width: "100%", borderRadius: 8, fontSize: ".88rem" }}
                />
              </div>

              {/* Generate Button */}
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleGenerate}
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "13px 20px",
                  borderRadius: 12,
                  fontWeight: 700,
                  fontSize: "1.02rem",
                  background: "linear-gradient(135deg, #6366f1, #a855f7, #ec4899)",
                  border: "none",
                  boxShadow: "0 6px 20px rgba(168, 85, 247, 0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  cursor: loading ? "wait" : "pointer",
                }}
              >
                {loading ? (
                  <>
                    <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                    <span>{loadingStep || "Đang xử lý..."}</span>
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: "1.2rem" }}>🚀</span>
                    <span>Bắt đầu Tạo Đề Thi Bằng AI</span>
                  </>
                )}
              </button>
            </>
          ) : (
            /* Results & Preview Mode */
            <div>
              {/* Summary Banner */}
              <div
                style={{
                  background: "linear-gradient(135deg, rgba(34, 197, 94, 0.12), rgba(16, 185, 129, 0.18))",
                  border: "1px solid rgba(34, 197, 94, 0.4)",
                  borderRadius: 14,
                  padding: "14px 18px",
                  marginBottom: 18,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                  <div>
                    <div style={{ color: "#4ade80", fontWeight: 700, fontSize: "1.05rem" }}>
                      🎉 Đã tạo thành công {result.questions.length} câu hỏi!
                    </div>
                    {result.titleSuggestion && (
                      <div style={{ fontSize: ".88rem", marginTop: 4 }}>
                        <b>Gợi ý tiêu đề:</b> {result.titleSuggestion}
                      </div>
                    )}
                    {result.summary && (
                      <div className="muted" style={{ fontSize: ".82rem", marginTop: 2 }}>
                        {result.summary}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setResult(null)}
                    style={{ fontSize: ".82rem" }}
                  >
                    🔄 Tạo lại
                  </button>
                </div>
              </div>

              {/* Questions List */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
                {result.questions.map((q, idx) => (
                  <div
                    key={q.id || idx}
                    style={{
                      background: "hsla(0 0% 100% / .03)",
                      border: "1px solid var(--glass-border)",
                      borderRadius: 12,
                      padding: 14,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <b style={{ color: "var(--accent)", fontSize: ".92rem" }}>Câu {idx + 1}</b>
                      <span
                        style={{
                          fontSize: ".72rem",
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: 999,
                          background:
                            q.type === "multiple"
                              ? "rgba(59, 130, 246, 0.2)"
                              : q.type === "truefalse"
                              ? "rgba(234, 179, 8, 0.2)"
                              : "rgba(168, 85, 247, 0.2)",
                          color:
                            q.type === "multiple"
                              ? "#60a5fa"
                              : q.type === "truefalse"
                              ? "#facc15"
                              : "#c084fc",
                        }}
                      >
                        {QUESTION_TYPES[q.type] || q.type}
                      </span>
                    </div>

                    <div style={{ fontSize: ".92rem", fontWeight: 600, marginBottom: 10 }}>{q.text}</div>

                    {/* Options */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
                      {q.options.map((opt, oIdx) => {
                        const isCorrect = q.correct.includes(oIdx);
                        return (
                          <div
                            key={oIdx}
                            style={{
                              padding: "6px 12px",
                              borderRadius: 8,
                              fontSize: ".86rem",
                              background: isCorrect ? "rgba(34, 197, 94, 0.15)" : "hsla(0 0% 100% / .02)",
                              border: isCorrect
                                ? "1px solid rgba(34, 197, 94, 0.5)"
                                : "1px solid transparent",
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <span
                              style={{
                                width: 18,
                                height: 18,
                                borderRadius: "50%",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: ".72rem",
                                fontWeight: 700,
                                background: isCorrect ? "#22c55e" : "rgba(255, 255, 255, 0.1)",
                                color: isCorrect ? "#fff" : "inherit",
                              }}
                            >
                              {String.fromCharCode(65 + oIdx)}
                            </span>
                            <span style={{ flex: 1 }}>{opt}</span>
                            {isCorrect && (
                              <span style={{ color: "#4ade80", fontSize: ".78rem", fontWeight: 700 }}>
                                ✓ Đáp án đúng
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    {q.explanation && (
                      <div
                        style={{
                          fontSize: ".8rem",
                          background: "rgba(0, 0, 0, 0.2)",
                          borderRadius: 8,
                          padding: "6px 10px",
                          color: "rgba(255, 255, 255, 0.8)",
                          borderLeft: "3px solid var(--accent)",
                        }}
                      >
                        <b>Giải thích:</b> {q.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  justifyContent: "flex-end",
                  flexWrap: "wrap",
                  position: "sticky",
                  bottom: 0,
                  background: "var(--card-bg, #1a1a24)",
                  padding: "12px 0 0",
                  borderTop: "1px solid var(--glass-border)",
                }}
              >
                <button type="button" className="btn btn-ghost" onClick={() => setResult(null)}>
                  Quay lại cài đặt
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleApply(false)}
                  style={{
                    background: "linear-gradient(135deg, #10b981, #059669)",
                    border: "none",
                  }}
                >
                  ➕ Thêm {result.questions.length} câu vào bộ đề (Đang có {existingCount} câu)
                </button>
                {existingCount > 0 && (
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => {
                      if (confirm("Thay thế toàn bộ câu hỏi hiện có bằng bộ câu hỏi AI mới này?")) {
                        handleApply(true);
                      }
                    }}
                  >
                    🔄 Thay thế toàn bộ ({existingCount} câu cũ)
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
