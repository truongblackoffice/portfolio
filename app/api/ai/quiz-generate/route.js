import { NextResponse } from "next/server";
import mammoth from "mammoth";
import JSZip from "jszip";

export const maxDuration = 60; // Dynamic route timeout for Next.js

// Danh sách các model fallback dự phòng nếu không list được models từ API
const DEFAULT_CANDIDATE_MODELS = [
  { apiVersion: "v1beta", model: "gemini-3.8-flash" },
  { apiVersion: "v1beta", model: "gemini-2.0-flash" },
  { apiVersion: "v1beta", model: "gemini-1.5-flash" },
  { apiVersion: "v1", model: "gemini-1.5-flash" },
  { apiVersion: "v1beta", model: "gemini-2.0-flash-exp" },
  { apiVersion: "v1beta", model: "gemini-1.5-flash-002" },
  { apiVersion: "v1beta", model: "gemini-1.5-flash-001" },
  { apiVersion: "v1beta", model: "gemini-1.5-pro" },
  { apiVersion: "v1", model: "gemini-1.5-pro" },
];

/**
 * Trích xuất toàn bộ văn bản và ghi chú bài giảng từ tệp PowerPoint (.pptx)
 */
async function extractTextFromPptx(buffer) {
  const zip = await JSZip.loadAsync(buffer);

  // Lấy các slide XML (ppt/slides/slide1.xml, ppt/slides/slide2.xml, ...)
  const slideFiles = Object.keys(zip.files).filter((name) =>
    /^ppt\/slides\/slide\d+\.xml$/i.test(name)
  );

  slideFiles.sort((a, b) => {
    const numA = parseInt(a.replace(/\D/g, ""), 10) || 0;
    const numB = parseInt(b.replace(/\D/g, ""), 10) || 0;
    return numA - numB;
  });

  const slideTexts = [];

  for (const sf of slideFiles) {
    const xml = await zip.file(sf).async("text");
    const matches = xml.match(/<a:t(?:\s+[^>]*)?>([\s\S]*?)<\/a:t>/gi) || [];
    const textPieces = matches
      .map((m) => m.replace(/<[^>]+>/g, "").trim())
      .filter(Boolean);

    const slideNum = sf.replace(/\D/g, "");
    if (textPieces.length > 0) {
      slideTexts.push(`[Slide ${slideNum}]:\n${textPieces.join(" ")}`);
    }
  }

  // Lấy ghi chú bài giảng (speaker notes) nếu có
  const noteFiles = Object.keys(zip.files).filter((name) =>
    /^ppt\/notesSlides\/notesSlide\d+\.xml$/i.test(name)
  );
  for (const nf of noteFiles) {
    const xml = await zip.file(nf).async("text");
    const matches = xml.match(/<a:t(?:\s+[^>]*)?>([\s\S]*?)<\/a:t>/gi) || [];
    const textPieces = matches
      .map((m) => m.replace(/<[^>]+>/g, "").trim())
      .filter(Boolean);
    const noteNum = nf.replace(/\D/g, "");
    if (textPieces.length > 0) {
      slideTexts.push(`[Ghi chú bài giảng Slide ${noteNum}]:\n${textPieces.join(" ")}`);
    }
  }

  return slideTexts.join("\n\n");
}

/**
 * Tự động truy vấn danh sách model được phép sử dụng từ Google API đối với API Key này
 */
async function getCandidateModelsForApiKey(apiKey) {
  try {
    const listRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      { cache: "no-store" }
    );
    if (listRes.ok) {
      const data = await listRes.json();
      const models = (data.models || [])
        .filter(
          (m) =>
            Array.isArray(m.supportedGenerationMethods) &&
            m.supportedGenerationMethods.includes("generateContent")
        )
        .map((m) => m.name.replace(/^models\//, ""))
        .filter((m) => !m.includes("2.5"));

      if (models.length > 0) {
        const prioritized = [];
        const priorityOrder = [
          (m) => m.startsWith("gemini-3.8-flash"),
          (m) => m.startsWith("gemini-2.0-flash") && !m.includes("lite") && !m.includes("thinking"),
          (m) => m === "gemini-1.5-flash",
          (m) => m.startsWith("gemini-1.5-flash-002"),
          (m) => m.startsWith("gemini-1.5-flash-001"),
          (m) => m.includes("2.0-flash"),
          (m) => m.includes("1.5-flash"),
          (m) => m.includes("flash"),
          (m) => m.includes("pro"),
        ];

        for (const check of priorityOrder) {
          const found = models.find(check);
          if (found && !prioritized.includes(found)) {
            prioritized.push(found);
          }
        }

        for (const m of models) {
          if (!prioritized.includes(m)) {
            prioritized.push(m);
          }
        }

        return prioritized.map((m) => ({ apiVersion: "v1beta", model: m }));
      }
    }
  } catch (err) {
    console.warn("Could not list models from Google API:", err);
  }

  return DEFAULT_CANDIDATE_MODELS;
}

/**
 * Gọi Google Gemini API với cơ chế tự động thử model khả dụng tiếp theo
 */
async function callGeminiApi({ apiKey, contents, systemInstruction }) {
  const candidates = await getCandidateModelsForApiKey(apiKey);
  let lastErrText = "";
  let lastStatus = 500;

  for (const { apiVersion, model } of candidates) {
    const url = `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent?key=${apiKey}`;

    try {
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

      if (res.ok) {
        return { res, modelUsed: `${model} (${apiVersion})` };
      }

      lastStatus = res.status;
      lastErrText = await res.text();
      console.warn(
        `Model ${model} (${apiVersion}) không khả dụng (${res.status}): ${lastErrText.slice(0, 140)}... Đang thử model tiếp theo...`
      );

      // Nếu là lỗi sai API Key hoàn toàn, dừng lại ngay để thông báo cho người dùng
      if (lastStatus === 400 && lastErrText.includes("API_KEY_INVALID")) {
        break;
      }
      if (lastStatus === 403 && lastErrText.includes("PERMISSION_DENIED")) {
        break;
      }
    } catch (fetchErr) {
      console.error(`Fetch error for ${model}:`, fetchErr);
    }
  }

  return {
    res: new Response(
      lastErrText || JSON.stringify({ error: "Không tìm thấy model Gemini phù hợp với API Key này." }),
      {
        status: lastStatus,
        headers: { "Content-Type": "application/json" },
      }
    ),
    modelUsed: "none",
  };
}

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const rawText = formData.get("text") || "";
    const count = Math.min(200, Math.max(1, parseInt(formData.get("count") || "10", 10)));
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
            return NextResponse.json({ error: "Không tìm thấy nội dung văn bản trong tệp Word (.docx)." }, { status: 400 });
          }
          contentsParts.push({ text: `TÀI LIỆU BÀI HỌC (TRÍCH XUẤT TỪ FILE WORD ${file.name}):\n\n${text}` });
        } catch (docxErr) {
          console.error("Mammoth error:", docxErr);
          return NextResponse.json({ error: `Lỗi đọc tệp DOCX: ${docxErr.message}` }, { status: 400 });
        }
      } else if (fileName.endsWith(".pptx")) {
        try {
          const text = await extractTextFromPptx(buffer);
          if (!text || !text.trim()) {
            return NextResponse.json(
              { error: "Không tìm thấy nội dung văn bản trong tệp PowerPoint (.pptx). Hãy đảm bảo các slide có chứa văn bản bài học." },
              { status: 400 }
            );
          }
          contentsParts.push({ text: `TÀI LIỆU BÀI GIẢNG (TRÍCH XUẤT TỪ SLIDE POWERPOINT ${file.name}):\n\n${text}` });
        } catch (pptxErr) {
          console.error("PPTX extract error:", pptxErr);
          return NextResponse.json({ error: `Lỗi đọc tệp PowerPoint (.pptx): ${pptxErr.message}` }, { status: 400 });
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
        // Text, md, csv, v.v.
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
        { error: "Vui lòng chọn tệp tài liệu (.docx, .pptx, .pdf, .txt) hoặc dán nội dung bài học vào ô văn bản." },
        { status: 400 }
      );
    }

    const difficultyDesc = {
      easy: "Dễ (Mức độ Nhận biết, kiểm tra ghi nhớ định nghĩa, sự kiện, công thức cơ bản).",
      medium: "Trung bình (Mức độ Thông hiểu, giải thích hiện tượng, so sánh, phân tích cơ bản).",
      hard: "Khó (Mức độ Vận dụng cao, tư duy logic, tính toán phức tạp hoặc tình huống thực tế).",
      mixed: "Phân bổ hợp lý: 40% Nhận biết, 35% Thông hiểu, 25% Vận dụng.",
    }[difficulty] || "Đa dạng các mức độ.";

    const systemInstruction = `Bạn là chuyên gia giáo dục và khảo thí hàng đầu. Nhiệm vụ của bạn là đọc kỹ tài liệu bài học/bài giảng được cung cấp và biên soạn ĐÚNG ${count} CÂU HỎI TRẮC NGHIỆM bằng tiếng Việt, chuẩn xác và không có lỗi sai kiến thức.

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
