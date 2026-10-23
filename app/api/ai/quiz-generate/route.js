import { NextResponse } from "next/server";
import mammoth from "mammoth";

export const maxDuration = 60; // Dynamic route timeout for Next.js

// Danh sách model ưu tiên thử nghiệm
const CANDIDATE_MODELS = [
  "gemini-2.5-flash",
  "gemini-1.5-flash",
  "gemini-1.5-flash-latest",
];

async function callGeminiApi({ apiKey, contents, systemInstruction, modelIndex = 0 }) {
  const modelName = CANDIDATE_MODELS[modelIndex] || CANDIDATE_MODELS[0];
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents,
      systemInstruction: { parts: [{ text: systemInstruction }] },
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.3,
      },
    }),
  });

  // Nếu gặp lỗi 404 (model không tìm thấy) và còn model fallback, thử model tiếp theo
  if (!res.ok && res.status === 404 && modelIndex < CANDIDATE_MODELS.length - 1) {
    console.warn(`Model ${modelName} trả về 404, thử fallback sang ${CANDIDATE_MODELS[modelIndex + 1]}...`);
    return callGeminiApi({ apiKey, contents, systemInstruction, modelIndex: modelIndex + 1 });
  }

  return { res, modelUsed: modelName };
}

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const rawText = formData.get("text") || "";
    const count = Math.min(40, Math.max(1, parseInt(formData.get("count") || "10", 10)));
    const difficulty = formData.get("difficulty") || "mixed"; // easy | medium | hard | mixed
    const questionTypes = formData.get("types") || "single,multiple,truefalse";
    const customPrompt = formData.get("customPrompt") || "";
    const userApiKey = formData.get("apiKey") || "";

    const apiKey = (userApiKey || process.env.GEMINI_API_KEY || "").trim();
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "Chưa có Gemini API Key. Bạn có thể dán API Key trực tiếp vào giao diện (lấy miễn phí tại aistudio.google.com) hoặc cấu hình biến môi trường GEMINI_API_KEY.",
        },
        { status: 400 }
      );
    }

    const contentsParts = [];

    if (file && typeof file === "object" && file.size > 0) {
      // Giới hạn 10MB
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { error: "Kích thước tệp vượt quá giới hạn 10MB. Vui lòng tải tài liệu ngắn hơn hoặc chia nhỏ." },
          { status: 400 }
        );
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const fileName = (file.name || "").toLowerCase();

      if (fileName.endsWith(".docx")) {
        try {
          const result = await mammoth.extractRawText({ buffer });
          const text = (result.value || "").trim();
          if (!text) {
            return NextResponse.json({ error: "Không tìm thấy nội dung văn bản trong tệp DOCX." }, { status: 400 });
          }
          contentsParts.push({ text: `TÀI LIỆU BÀI HỌC (TRÍCH XUẤT TỪ FILE WORD ${file.name}):\n\n${text}` });
        } catch (docxErr) {
          console.error("Mammoth error:", docxErr);
          return NextResponse.json({ error: `Lỗi đọc tệp DOCX: ${docxErr.message}` }, { status: 400 });
        }
      } else if (fileName.endsWith(".pdf")) {
        // PDF gửi trực tiếp dạng multimodal base64
        contentsParts.push({
          inlineData: {
            mimeType: "application/pdf",
            data: buffer.toString("base64"),
          },
        });
      } else {
        // Text, md, v.v.
        const textContent = buffer.toString("utf-8").trim();
        if (!textContent) {
          return NextResponse.json({ error: "Tệp văn bản trống." }, { status: 400 });
        }
        contentsParts.push({ text: `TÀI LIỆU BÀI HỌC:\n\n${textContent}` });
      }
    } else if (rawText && rawText.trim()) {
      contentsParts.push({ text: `NỘI DUNG BÀI HỌC / VĂN BẢN ĐƯỢC CUNG CẤP:\n\n${rawText.trim()}` });
    } else {
      return NextResponse.json(
        { error: "Vui lòng chọn tệp tài liệu (.docx, .pdf, .txt) hoặc dán nội dung bài học vào ô văn bản." },
        { status: 400 }
      );
    }

    const difficultyDesc = {
      easy: "Dễ (Mức độ Nhận biết, kiểm tra ghi nhớ định nghĩa, sự kiện, công thức cơ bản).",
      medium: "Trung bình (Mức độ Thông hiểu, giải thích hiện tượng, so sánh, phân tích cơ bản).",
      hard: "Khó (Mức độ Vận dụng cao, tư duy logic, tính toán phức tạp hoặc tình huống thực tế).",
      mixed: "Phân bổ hợp lý: 40% Nhận biết, 35% Thông hiểu, 25% Vận dụng.",
    }[difficulty] || "Đa dạng các mức độ.";

    const systemInstruction = `Bạn là chuyên gia giáo dục và khảo thí hàng đầu. Nhiệm vụ của bạn là đọc kỹ tài liệu bài học được cung cấp và biên soạn ĐÚNG ${count} CÂU HỎI TRẮC NGHIỆM bằng tiếng Việt, chuẩn xác và không có lỗi sai kiến thức.

TIÊU CHUẨN BIÊN SOẠN:
1. Số lượng câu hỏi: Chính xác ${count} câu.
2. Mức độ câu hỏi: ${difficultyDesc}
3. Các dạng câu hỏi được phép: ${questionTypes}
   - "single": Trắc nghiệm 1 đáp án đúng duy nhất. Mảng "options" gồm 4 lựa chọn A, B, C, D không chứa tiền tố "A. ", "B. ". "correct" là mảng 1 số nguyên, ví dụ [0].
   - "multiple": Trắc nghiệm chọn nhiều đáp án đúng. Mảng "options" gồm 4 lựa chọn. "correct" chứa danh sách các chỉ số đúng (ít nhất 2 đáp án), ví dụ [0, 2].
   - "truefalse": Dạng Đúng / Sai. Mảng "options" BẮT BUỘC là ["Đúng", "Sai"]. "correct" là [0] nếu phát biểu đúng, hoặc [1] nếu phát biểu sai.
4. Mỗi câu hỏi BẮT BUỘC có "explanation" giải thích rõ ràng tại sao đáp án đó là đúng dựa trên tài liệu.
${customPrompt ? `5. LƯU Ý ĐẶC BIỆT TỪ GIÁO VIÊN: ${customPrompt}` : ""}`;

    const promptText = `Dựa vào tài liệu trên, hãy phân tích toàn diện và sinh danh sách câu hỏi trắc nghiệm dưới dạng JSON thuần túy theo cấu trúc:
{
  "title": "Gợi ý tiêu đề bộ đề phù hợp với tài liệu",
  "summary": "Tóm tắt ngắn gọn 1-2 câu về nội dung bài học",
  "questions": [
    {
      "text": "Nội dung câu hỏi...",
      "type": "single",
      "options": ["Phương án 1", "Phương án 2", "Phương án 3", "Phương án 4"],
      "correct": [0],
      "explanation": "Lời giải thích cặn kẽ..."
    }
  ]
}`;

    contentsParts.push({ text: promptText });

    const { res: geminiRes, modelUsed } = await callGeminiApi({
      apiKey,
      contents: [{ role: "user", parts: contentsParts }],
      systemInstruction,
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error(`Gemini API error (${geminiRes.status}):`, errText);
      let clientMsg = `Lỗi từ Gemini API (${geminiRes.status})`;
      try {
        const errObj = JSON.parse(errText);
        if (errObj?.error?.message) {
          clientMsg = errObj.error.message;
        }
      } catch {
        // ignore
      }
      return NextResponse.json({ error: clientMsg }, { status: 500 });
    }

    const geminiData = await geminiRes.json();
    let rawTextOutput = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawTextOutput) {
      return NextResponse.json({ error: "AI không trả về nội dung hợp lệ." }, { status: 500 });
    }

    // Làm sạch nếu AI lỡ bọc trong markdown ```json ... ```
    rawTextOutput = rawTextOutput.replace(/^```json\s*/i, "").replace(/\s*```$/, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(rawTextOutput);
    } catch (parseErr) {
      console.error("JSON parse error:", parseErr, rawTextOutput);
      return NextResponse.json({ error: "Không thể phân tích dữ liệu JSON trả về từ AI." }, { status: 500 });
    }

    const rawQuestions = Array.isArray(parsed.questions) ? parsed.questions : [];
    if (rawQuestions.length === 0) {
      return NextResponse.json({ error: "AI không tìm thấy nội dung phù hợp để tạo câu hỏi." }, { status: 400 });
    }

    const now = Date.now().toString(36);
    const questions = rawQuestions.map((q, idx) => {
      const type = ["single", "multiple", "truefalse"].includes(q.type) ? q.type : "single";
      let options = Array.isArray(q.options) ? q.options.map(String) : [];
      if (type === "truefalse") {
        options = ["Đúng", "Sai"];
      } else if (options.length < 2) {
        options = ["Phương án A", "Phương án B", "Phương án C", "Phương án D"];
      }

      let correct = Array.isArray(q.correct)
        ? q.correct.map((c) => parseInt(c, 10)).filter((c) => !isNaN(c) && c >= 0 && c < options.length)
        : [0];

      if (correct.length === 0) {
        correct = [0];
      }

      return {
        id: `q-ai-${now}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
        type,
        text: (q.text || `Câu hỏi ${idx + 1}`).trim(),
        options,
        correct,
        explanation: (q.explanation || "").trim(),
      };
    });

    return NextResponse.json({
      success: true,
      modelUsed,
      titleSuggestion: parsed.title || "",
      summary: parsed.summary || "",
      count: questions.length,
      questions,
    });
  } catch (err) {
    console.error("API error in quiz-generate:", err);
    return NextResponse.json({ error: err.message || "Đã xảy ra lỗi nội bộ khi xử lý." }, { status: 500 });
  }
}
