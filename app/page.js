"use client";
import Link from "next/link";
import { getProfile, listItems } from "@/lib/db";
import { seedProfile, seedPosts, seedDocuments } from "@/lib/seed";
import useAsync from "@/lib/useAsync";
import { PostCard, DocCard } from "@/components/Cards";
import { useSite } from "@/lib/SiteContext";

const defaultSkills = [
  "Next.js 16 (Turbopack)",
  "React 19",
  "TypeScript",
  "JavaScript (ES6+)",
  "Node.js",
  "Firebase Firestore & Auth",
  "Supabase Storage",
  "Google Gemini AI 3.8",
  "Tailwind CSS",
  "HTML5 / CSS3 Glassmorphism",
  "Git & GitHub",
  "DevOps & Security",
];

const initialHomeData = {
  profile: seedProfile,
  posts: (seedPosts || []).filter((p) => p.published).slice(0, 3),
  docs: (seedDocuments || []).slice(0, 3),
};

export default function Home() {
  const { site } = useSite();
  const { data } = useAsync(
    async () => {
      const [profile, posts, docs] = await Promise.all([
        getProfile(),
        listItems("posts", true),
        listItems("documents"),
      ]);
      return {
        profile: profile || seedProfile,
        posts: (posts || []).filter((p) => p.published).slice(0, 3),
        docs: (docs || []).slice(0, 3),
      };
    },
    [],
    "home_data",
    initialHomeData
  );

  const { profile, posts, docs } = data || initialHomeData;
  const skills = profile.skills && profile.skills.length > 0 ? profile.skills : defaultSkills;

  return (
    <div className="container">
      {/* ====================================================================
          1. HERO SECTION
          ==================================================================== */}
      <section className="hero reveal" style={{ minHeight: "calc(100vh - 120px)", alignItems: "center" }}>
        <div>
          <span className="eyebrow glass" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#22c55e",
                boxShadow: "0 0 10px #22c55e",
                display: "inline-block",
              }}
            />
            {site.heroBadge || "👋 Chào mừng bạn ghé thăm"}
          </span>

          <h1 style={{ marginTop: 8 }}>
            Mình là <span className="gradient-text">{profile.name || "Nguyễn Mạnh Trường"}</span>
          </h1>

          <p style={{ marginTop: 14 }}>
            {profile.title ? `${profile.title}. ` : "Lập trình viên & Người chia sẻ kiến thức. "}
            {profile.bio || "Chào mừng bạn đến với trang web cá nhân, kho tài liệu học tập và nền tảng ôn thi trắc nghiệm thông minh tích hợp AI."}
          </p>

          <div className="hero-actions" style={{ marginTop: 24 }}>
            <Link href="/quiz" className="btn btn-primary" id="cta-quiz">
              🚀 Vào phòng ôn thi
            </Link>
            <Link href="/blog" className="btn btn-ghost" id="cta-blog">
              📖 Đọc bài viết
            </Link>
            <Link href="/documents" className="btn btn-ghost" id="cta-docs">
              📁 Kho tài liệu
            </Link>
          </div>
        </div>

        {/* Visual Right Column: Avatar HOẶC Code Showcase Window */}
        <div>
          {profile.avatar ? (
            <div className="avatar-wrap">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="avatar"
                src={profile.avatar}
                alt={profile.name || "Avatar"}
                width="340"
                height="340"
                loading="eager"
                decoding="async"
              />
            </div>
          ) : (
            <div className="hero-code-window glass">
              <div className="floating-badge floating-badge-1">⚡ Next.js 16 Turbopack</div>
              <div className="floating-badge floating-badge-2">🤖 Gemini AI 3.8</div>
              <div className="window-header">
                <div className="window-dots">
                  <span className="window-dot red" />
                  <span className="window-dot yellow" />
                  <span className="window-dot green" />
                </div>
                <div className="window-title">
                  <span>👨‍💻 Developer.ts</span>
                </div>
                <div style={{ fontSize: ".72rem", color: "var(--muted)" }}>UTF-8</div>
              </div>
              <div className="window-body">
                <div>
                  <span className="code-keyword">const</span> <span className="code-var">developer</span> = &#123;
                </div>
                <div style={{ paddingLeft: 18 }}>
                  <span className="code-var">name</span>: <span className="code-str">&quot;{profile.name || "Nguyễn Mạnh Trường"}&quot;</span>,
                </div>
                <div style={{ paddingLeft: 18 }}>
                  <span className="code-var">title</span>: <span className="code-str">&quot;Full-stack Developer&quot;</span>,
                </div>
                <div style={{ paddingLeft: 18 }}>
                  <span className="code-var">coreStack</span>: [<span className="code-str">&quot;Next.js 16&quot;</span>, <span className="code-str">&quot;React 19&quot;</span>, <span className="code-str">&quot;Firebase&quot;</span>],
                </div>
                <div style={{ paddingLeft: 18 }}>
                  <span className="code-var">aiModel</span>: <span className="code-str">&quot;Google Gemini 3.8 / 2.0&quot;</span>,
                </div>
                <div style={{ paddingLeft: 18 }}>
                  <span className="code-var">platform</span>: <span className="code-str">&quot;Interactive Quiz &amp; Knowledge Hub&quot;</span>,
                </div>
                <div style={{ paddingLeft: 18 }}>
                  <span className="code-var">status</span>: <span className="code-str">&quot;Building future tech experiences 🚀&quot;</span>,
                </div>
                <div>&#125;;</div>
                <div style={{ marginTop: 8 }}>
                  <span className="code-comment">{"// Tự động cập nhật tức thì qua Turbopack"}</span>
                </div>
                <div>
                  <span className="code-keyword">export default</span> <span className="code-var">developer</span>;
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ====================================================================
          2. HERO STATS RIBBON
          ==================================================================== */}
      <div className="hero-stats-ribbon glass reveal">
        <div className="hero-stat-item">
          <div className="hero-stat-icon">🧠</div>
          <div className="hero-stat-text">
            <b>3 Chế độ thi</b>
            <span>Ôn tập, Thi thử &amp; Xem giải</span>
          </div>
        </div>
        <div className="hero-stat-item">
          <div className="hero-stat-icon">🤖</div>
          <div className="hero-stat-text">
            <b>Google Gemini</b>
            <span>Tạo đề AI từ Word/PDF/PPTX</span>
          </div>
        </div>
        <div className="hero-stat-item">
          <div className="hero-stat-icon">📜</div>
          <div className="hero-stat-text">
            <b>Cấp chứng chỉ</b>
            <span>Bảng xếp hạng vinh danh</span>
          </div>
        </div>
        <div className="hero-stat-item">
          <div className="hero-stat-icon">⚡</div>
          <div className="hero-stat-text">
            <b>100% Miễn phí</b>
            <span>Kho tài liệu &amp; bài viết mở</span>
          </div>
        </div>
      </div>

      {/* ====================================================================
          3. FEATURE HIGHLIGHTS (4 GLASS CARDS)
          ==================================================================== */}
      <section className="section">
        <div className="section-head">
          <div>
            <span className="eyebrow glass" style={{ fontSize: ".8rem", padding: "4px 12px" }}>
              TÍNH NĂNG NỔI BẬT
            </span>
            <h2>Khám phá hệ sinh thái nền tảng</h2>
          </div>
        </div>

        <div className="grid">
          {/* Feature 1: Quiz */}
          <Link
            href="/quiz"
            className="card glass feature-card reveal"
            style={{ "--card-grad": "linear-gradient(90deg, #8b5cf6, #ec4899)" }}
          >
            <div className="feature-icon" style={{ background: "hsla(262 90% 68% / .18)", borderColor: "hsla(262 90% 68% / .4)" }}>
              🎯
            </div>
            <h3>Ôn tập &amp; Thi trắc nghiệm</h3>
            <p>
              Luyện thi thông minh với 3 chế độ: Ôn tập không giới hạn xem giải thích từng câu, Thi thử bấm giờ đếm ngược và Tra cứu đáp án nhanh.
            </p>
            <span className="feature-link">Vào phòng thi ngay →</span>
          </Link>

          {/* Feature 2: AI Generator */}
          <Link
            href="/quiz"
            className="card glass feature-card reveal"
            style={{ "--card-grad": "linear-gradient(90deg, #06b6d4, #3b82f6)" }}
          >
            <div className="feature-icon" style={{ background: "hsla(190 95% 58% / .18)", borderColor: "hsla(190 95% 58% / .4)" }}>
              🤖
            </div>
            <h3>Trợ lý AI tạo đề thi</h3>
            <p>
              Tích hợp Google Gemini AI đa tầng, tự động đọc hiểu tài liệu Word (.docx), PowerPoint (.pptx), PDF để tạo đến 200 câu hỏi trắc nghiệm chuẩn xác.
            </p>
            <span className="feature-link">Khám phá AI Quiz →</span>
          </Link>

          {/* Feature 3: Blog */}
          <Link
            href="/blog"
            className="card glass feature-card reveal"
            style={{ "--card-grad": "linear-gradient(90deg, #10b981, #06b6d4)" }}
          >
            <div className="feature-icon" style={{ background: "hsla(150 70% 50% / .18)", borderColor: "hsla(150 70% 50% / .4)" }}>
              ✍️
            </div>
            <h3>Blog &amp; Kiến thức Kỹ thuật</h3>
            <p>
              Kho bài viết chuyên sâu về Next.js 16, Google Antigravity, OpenAI Codex, kiến trúc phần mềm AI-First và kinh nghiệm lập trình thực chiến.
            </p>
            <span className="feature-link">Đọc bài viết mới →</span>
          </Link>

          {/* Feature 4: Documents */}
          <Link
            href="/documents"
            className="card glass feature-card reveal"
            style={{ "--card-grad": "linear-gradient(90deg, #f59e0b, #ef4444)" }}
          >
            <div className="feature-icon" style={{ background: "hsla(40 90% 55% / .18)", borderColor: "hsla(40 90% 55% / .4)" }}>
              📚
            </div>
            <h3>Thư viện tài liệu học tập</h3>
            <p>
              Tổng hợp giáo trình, slide bài giảng, đề thi mẫu và tài liệu chuyên ngành chất lượng cao, phân loại rõ ràng và tải về hoàn toàn miễn phí.
            </p>
            <span className="feature-link">Xem kho tài liệu →</span>
          </Link>
        </div>
      </section>

      {/* ====================================================================
          4. QUIZ SPOTLIGHT BANNER
          ==================================================================== */}
      <section className="section">
        <div className="quiz-spotlight glass reveal">
          <div>
            <span
              style={{
                background: "hsla(262 90% 68% / .2)",
                color: "var(--primary)",
                padding: "6px 16px",
                borderRadius: 999,
                fontSize: ".82rem",
                fontWeight: 700,
                display: "inline-block",
                marginBottom: 12,
              }}
            >
              🏆 NỀN TẢNG THI TRỰC TUYẾN THÔNG MINH
            </span>
            <h2 style={{ fontSize: "clamp(1.7rem, 3.2vw, 2.3rem)", marginBottom: 14 }}>
              Thử thách kiến thức &amp; Nhận chứng chỉ hoàn thành xuất sắc
            </h2>
            <p className="muted" style={{ fontSize: "1.02rem", marginBottom: 24, lineHeight: 1.65 }}>
              Hệ thống hỗ trợ xáo trộn câu hỏi và phương án ngẫu nhiên (Fisher–Yates shuffle), chấm điểm tự động, vinh danh học viên trên Bảng xếp hạng và tải chứng chỉ chất lượng cao tức thì!
            </p>
            <div className="hero-actions">
              <Link href="/quiz" className="btn btn-primary">
                ⏱️ Bắt đầu thi thử ngay
              </Link>
              <Link href="/quiz" className="btn btn-ghost">
                📖 Xem đáp án &amp; Ôn tập
              </Link>
            </div>
          </div>

          <div className="quiz-spotlight-visual">
            <div className="quiz-badge-pill">
              <span style={{ fontSize: "1.5rem" }}>🎯</span>
              <div>
                <b>Ôn tập không áp lực</b>
                <div className="muted" style={{ fontSize: ".8rem" }}>
                  Làm từng câu &amp; xem giải thích chi tiết ngay
                </div>
              </div>
            </div>
            <div className="quiz-badge-pill">
              <span style={{ fontSize: "1.5rem" }}>⏱️</span>
              <div>
                <b>Thi thử bấm giờ thực chiến</b>
                <div className="muted" style={{ fontSize: ".8rem" }}>
                  Đếm ngược &amp; tự động nộp bài khi hết giờ
                </div>
              </div>
            </div>
            <div className="quiz-badge-pill">
              <span style={{ fontSize: "1.5rem" }}>📜</span>
              <div>
                <b>Cấp chứng chỉ &amp; Bảng xếp hạng</b>
                <div className="muted" style={{ fontSize: ".8rem" }}>
                  Vinh danh top học viên có điểm số cao nhất
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          5. SKILLS / TECH STACK
          ==================================================================== */}
      {skills.length > 0 && (
        <section className="section">
          <div className="section-head">
            <div>
              <span className="eyebrow glass" style={{ fontSize: ".8rem", padding: "4px 12px" }}>
                NĂNG LỰC CHUYÊN MÔN
              </span>
              <h2>Công nghệ &amp; Kỹ năng</h2>
            </div>
          </div>
          <div className="chips">
            {skills.map((s) => (
              <span className="chip" key={s}>
                {s}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* ====================================================================
          6. LATEST POSTS
          ==================================================================== */}
      {posts.length > 0 && (
        <section className="section">
          <div className="section-head">
            <div>
              <span className="eyebrow glass" style={{ fontSize: ".8rem", padding: "4px 12px" }}>
                GÓC CHIA SẺ
              </span>
              <h2>Bài viết mới nhất</h2>
            </div>
            <Link href="/blog" className="muted" style={{ fontWeight: 600 }}>
              Xem tất cả bài viết →
            </Link>
          </div>
          <div className="grid">
            {posts.map((p) => (
              <PostCard key={p.id} p={p} />
            ))}
          </div>
        </section>
      )}

      {/* ====================================================================
          7. LATEST DOCUMENTS
          ==================================================================== */}
      {docs.length > 0 && (
        <section className="section">
          <div className="section-head">
            <div>
              <span className="eyebrow glass" style={{ fontSize: ".8rem", padding: "4px 12px" }}>
                TẢI VỀ MIỄN PHÍ
              </span>
              <h2>Tài liệu học tập mới</h2>
            </div>
            <Link href="/documents" className="muted" style={{ fontWeight: 600 }}>
              Xem toàn bộ tài liệu →
            </Link>
          </div>
          <div className="grid">
            {docs.map((d) => (
              <DocCard key={d.id} d={d} />
            ))}
          </div>
        </section>
      )}

      {/* ====================================================================
          8. CONTACT & CONNECT CTA BANNER
          ==================================================================== */}
      <section className="section">
        <div className="home-cta-banner glass reveal">
          <h2>Bạn muốn kết nối hoặc trao đổi chuyên môn?</h2>
          <p>
            Dù bạn là học viên cần luyện thi, lập trình viên muốn giao lưu công nghệ hay đối tác tìm kiếm sự hợp tác, mình luôn sẵn lòng đón nhận và đồng hành!
          </p>
          <div className="hero-actions" style={{ justifyContent: "center" }}>
            <Link href="/contact" className="btn btn-primary">
              ✉️ Gửi tin nhắn liên hệ
            </Link>
            <Link href="/about" className="btn btn-ghost">
              👨‍💻 Tìm hiểu về mình
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
