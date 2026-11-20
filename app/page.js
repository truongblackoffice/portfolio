"use client";
import Link from "next/link";
import { getProfile, listItems } from "@/lib/db";
import { seedProfile, seedPosts, seedDocuments, defaultContactConfig } from "@/lib/seed";
import useAsync from "@/lib/useAsync";
import { PostCard, DocCard } from "@/components/Cards";
import { useSite } from "@/lib/SiteContext";
import { renderIcon } from "@/lib/presets";

const defaultTechStack = [
  { name: "Next.js 16 (Turbopack)", icon: "https://api.iconify.design/simple-icons/nextdotjs.svg?color=%23ffffff", color: "#ffffff" },
  { name: "React 19", icon: "https://api.iconify.design/simple-icons/react.svg?color=%2361dafb", color: "#61dafb" },
  { name: "TypeScript", icon: "https://api.iconify.design/simple-icons/typescript.svg?color=%233178c6", color: "#3178c6" },
  { name: "JavaScript (ES6+)", icon: "https://api.iconify.design/simple-icons/javascript.svg?color=%23f7df1e", color: "#f7df1e" },
  { name: "Node.js", icon: "https://api.iconify.design/simple-icons/nodedotjs.svg?color=%235fa04e", color: "#5fa04e" },
  { name: "Python", icon: "https://api.iconify.design/simple-icons/python.svg?color=%233776ab", color: "#3776ab" },
  { name: "Google Gemini AI", icon: "https://api.iconify.design/simple-icons/googlegemini.svg?color=%238e75ff", color: "#8e75ff" },
  { name: "Tailwind CSS", icon: "https://api.iconify.design/simple-icons/tailwindcss.svg?color=%2306b6d4", color: "#06b6d4" },
  { name: "Firebase Firestore", icon: "https://api.iconify.design/simple-icons/firebase.svg?color=%23ffca28", color: "#ffca28" },
  { name: "Supabase Storage", icon: "https://api.iconify.design/simple-icons/supabase.svg?color=%233ecf8e", color: "#3ecf8e" },
  { name: "Docker", icon: "https://api.iconify.design/simple-icons/docker.svg?color=%232496ed", color: "#2496ed" },
  { name: "Git & GitHub", icon: "https://api.iconify.design/simple-icons/github.svg?color=%23ffffff", color: "#ffffff" },
  { name: "Linux / DevOps", icon: "https://api.iconify.design/simple-icons/linux.svg?color=%23fcc624", color: "#fcc624" },
];

const initialHomeData = {
  profile: seedProfile,
  posts: (seedPosts || []).filter((p) => p.published).slice(0, 3),
  docs: (seedDocuments || []).slice(0, 3),
  quizCount: 3,
  postCount: (seedPosts || []).length,
  docCount: (seedDocuments || []).length,
};

export default function Home() {
  const { site } = useSite();
  const { data } = useAsync(
    async () => {
      const [profile, posts, docs, quizzes] = await Promise.all([
        getProfile(),
        listItems("posts", true),
        listItems("documents"),
        listItems("quizzes", true),
      ]);
      return {
        profile: profile || seedProfile,
        posts: (posts || []).filter((p) => p.published).slice(0, 3),
        docs: (docs || []).slice(0, 3),
        quizCount: (quizzes || []).filter((q) => q.published).length || 3,
        postCount: (posts || []).filter((p) => p.published).length || (seedPosts || []).length,
        docCount: (docs || []).length || (seedDocuments || []).length,
      };
    },
    [],
    "home_data",
    initialHomeData
  );

  const { profile, posts, docs, quizCount, postCount, docCount } = data || initialHomeData;

  const contactConfig = profile.contactConfig || defaultContactConfig;
  const quickChannels = (contactConfig.channels || defaultContactConfig.channels)
    .filter((c) => c.enabled !== false && (c.link || c.value))
    .slice(0, 4);

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
            {site.heroBadge || "🟢 Sẵn sàng kết nối & Chia sẻ kiến thức"}
          </span>

          <h1 style={{ marginTop: 8 }}>
            Xin chào, mình là <span className="gradient-text">{profile.name || "Nguyễn Mạnh Trường"}</span>
          </h1>

          <p style={{ marginTop: 14 }}>
            {profile.title ? `${profile.title}. ` : "Full-stack Developer & Người chia sẻ tri thức. "}
            {profile.bio || "Chào mừng bạn đến với trang web cá nhân, kho tài liệu học tập và nền tảng ôn thi trắc nghiệm thông minh tích hợp AI."}
          </p>

          <div className="hero-actions" style={{ marginTop: 24 }}>
            <a href="#ecosystem" className="btn btn-primary" id="cta-explore">
              🚀 Khám phá Nền tảng
            </a>
            <Link href="/quiz" className="btn btn-ghost" id="cta-quiz">
              ⏱️ Vào phòng thi
            </Link>
            <Link href="/documents" className="btn btn-ghost" id="cta-docs">
              📁 Kho tài liệu
            </Link>
            <Link href="/blog" className="btn btn-ghost" id="cta-blog">
              📖 Bài viết
            </Link>
          </div>

          {/* Quick social channels */}
          {quickChannels.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 24, flexWrap: "wrap" }}>
              <span className="muted" style={{ fontSize: ".82rem" }}>Kết nối nhanh:</span>
              <div style={{ display: "flex", gap: 8 }}>
                {quickChannels.map((ch) => (
                  <a
                    key={ch.id}
                    href={ch.link || (ch.type === "email" ? `mailto:${ch.value}` : "#")}
                    target="_blank"
                    rel="noreferrer"
                    title={ch.title}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: "var(--glass)",
                      border: "1px solid var(--glass-border)",
                      display: "grid",
                      placeItems: "center",
                      color: "var(--text)",
                      transition: ".2s",
                      fontSize: "1.1rem",
                    }}
                  >
                    {renderIcon(ch.icon, "💬", { width: 18, height: 18 })}
                  </a>
                ))}
              </div>
            </div>
          )}
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
                  <span className="code-comment">{"// Tự động tối ưu hóa qua Turbopack"}</span>
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
          2. HERO REAL-TIME COUNTERS (BENTO STATS RIBBON)
          ==================================================================== */}
      <div className="hero-stats-ribbon glass reveal">
        <div className="hero-stat-item">
          <div className="hero-stat-icon">🎯</div>
          <div className="hero-stat-text">
            <b>{quizCount} Bộ đề thi</b>
            <span>3 Chế độ &amp; Đếm ngược</span>
          </div>
        </div>
        <div className="hero-stat-item">
          <div className="hero-stat-icon">📚</div>
          <div className="hero-stat-text">
            <b>{docCount} Tài liệu học tập</b>
            <span>Slide, Giáo trình miễn phí</span>
          </div>
        </div>
        <div className="hero-stat-item">
          <div className="hero-stat-icon">✍️</div>
          <div className="hero-stat-text">
            <b>{postCount} Bài viết chia sẻ</b>
            <span>Kinh nghiệm lập trình web</span>
          </div>
        </div>
        <div className="hero-stat-item">
          <div className="hero-stat-icon">🤖</div>
          <div className="hero-stat-text">
            <b>Gemini AI 3.8</b>
            <span>Tạo đề AI từ Word/PDF</span>
          </div>
        </div>
      </div>

      {/* ====================================================================
          3. BENTO GRID ECOSYSTEM (KHÁM PHÁ HỆ SINH THÁI)
          ==================================================================== */}
      <section className="section" id="ecosystem">
        <div className="section-head">
          <div>
            <span className="eyebrow glass" style={{ fontSize: ".8rem", padding: "4px 12px" }}>
              HỆ SINH THÁI NỀN TẢNG
            </span>
            <h2>Không gian Học tập, Luyện thi &amp; Tri thức Công nghệ</h2>
          </div>
          <p className="muted" style={{ maxWidth: 460, fontSize: ".92rem" }}>
            Mọi tính năng được tích hợp liền mạch theo mô hình Bento Grid hiện đại: từ phòng thi thông minh, kho tài liệu chọn lọc đến blog kỹ thuật chuyên sâu.
          </p>
        </div>

        <div className="bento-grid">
          {/* BENTO 1: SPOTLIGHT QUIZ & AI (SPAN 8) */}
          <div
            className="bento-card bento-col-8 reveal"
            style={{
              "--card-grad": "linear-gradient(135deg, #8b5cf6, #ec4899)",
              background: "linear-gradient(135deg, hsla(262 90% 68% / .1), hsla(320 90% 66% / .06))",
              border: "1px solid hsla(262 90% 68% / .3)",
            }}
          >
            <div className="bento-spotlight-content">
              <div>
                <span
                  style={{
                    background: "hsla(262 90% 68% / .22)",
                    color: "var(--primary)",
                    padding: "4px 14px",
                    borderRadius: 999,
                    fontSize: ".78rem",
                    fontWeight: 700,
                    display: "inline-block",
                    marginBottom: 12,
                  }}
                >
                  🎯 NỀN TẢNG LUYỆN THI TRỰC TUYẾN
                </span>
                <h3 style={{ fontSize: "clamp(1.4rem, 2.5vw, 1.85rem)", marginBottom: 12, lineHeight: 1.3 }}>
                  Ôn tập &amp; Thi thử Trắc nghiệm Thông minh
                </h3>
                <p className="muted" style={{ fontSize: ".95rem", lineHeight: 1.6, marginBottom: 20 }}>
                  Trải nghiệm 3 chế độ thi chuyên biệt: <b>Ôn tập</b> (xem giải thích tức thì), <b>Thi thử bấm giờ</b> (thuật toán xáo trộn câu hỏi và đáp án chống học vẹt) và <b>Xem lời giải chi tiết</b>. Nhận ngay chứng chỉ vinh danh khi hoàn thành xuất sắc!
                </p>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <Link href="/quiz" className="btn btn-primary btn-sm" style={{ padding: "10px 20px" }}>
                    🚀 Vào phòng thi ngay →
                  </Link>
                  <Link href="/quiz" className="btn btn-ghost btn-sm" style={{ padding: "10px 18px" }}>
                    🏆 Xem bảng xếp hạng
                  </Link>
                </div>
              </div>

              {/* Visual Mini Badges Column */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div className="quiz-badge-pill" style={{ padding: "10px 14px" }}>
                  <span style={{ fontSize: "1.3rem" }}>🎯</span>
                  <div>
                    <b style={{ fontSize: ".88rem" }}>Ôn tập linh hoạt</b>
                    <div className="muted" style={{ fontSize: ".76rem" }}>Giải thích đáp án tức thời</div>
                  </div>
                </div>
                <div className="quiz-badge-pill" style={{ padding: "10px 14px" }}>
                  <span style={{ fontSize: "1.3rem" }}>⏱️</span>
                  <div>
                    <b style={{ fontSize: ".88rem" }}>Thi thử tính giờ</b>
                    <div className="muted" style={{ fontSize: ".76rem" }}>Tự động nộp bài khi hết giờ</div>
                  </div>
                </div>
                <div className="quiz-badge-pill" style={{ padding: "10px 14px" }}>
                  <span style={{ fontSize: "1.3rem" }}>📜</span>
                  <div>
                    <b style={{ fontSize: ".88rem" }}>Chứng chỉ &amp; Xếp hạng</b>
                    <div className="muted" style={{ fontSize: ".76rem" }}>Vinh danh học viên điểm cao</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* BENTO 2: AI QUIZ GENERATOR (SPAN 4) */}
          <Link
            href="/quiz"
            className="bento-card bento-col-4 reveal"
            style={{
              "--card-grad": "linear-gradient(135deg, #06b6d4, #3b82f6)",
              background: "linear-gradient(135deg, hsla(190 95% 58% / .08), hsla(220 90% 60% / .04))",
              border: "1px solid hsla(190 95% 58% / .25)",
            }}
          >
            <div>
              <div className="feature-icon" style={{ background: "hsla(190 95% 58% / .18)", borderColor: "hsla(190 95% 58% / .4)", marginBottom: 16 }}>
                🤖
              </div>
              <span className="badge" style={{ background: "hsla(190 95% 58% / .2)", color: "var(--accent)", marginBottom: 8, display: "inline-block" }}>
                AI-Powered
              </span>
              <h3 style={{ fontSize: "1.2rem", marginBottom: 8 }}>Trợ lý AI Tạo Đề Thi</h3>
              <p className="muted" style={{ fontSize: ".88rem", lineHeight: 1.55 }}>
                Tích hợp Google Gemini AI đa tầng, tự động đọc hiểu tài liệu Word (.docx), PowerPoint (.pptx), PDF để tạo đến 200 câu hỏi trắc nghiệm kèm giải thích chuẩn xác.
              </p>
            </div>
            <span className="feature-link" style={{ marginTop: 18 }}>Khám phá Trợ lý AI →</span>
          </Link>

          {/* BENTO 3: DOCUMENTS (SPAN 4) */}
          <Link
            href="/documents"
            className="bento-card bento-col-4 reveal"
            style={{
              "--card-grad": "linear-gradient(135deg, #f59e0b, #ef4444)",
              background: "linear-gradient(135deg, hsla(40 90% 55% / .08), hsla(10 90% 60% / .04))",
              border: "1px solid hsla(40 90% 55% / .25)",
            }}
          >
            <div>
              <div className="feature-icon" style={{ background: "hsla(40 90% 55% / .18)", borderColor: "hsla(40 90% 55% / .4)", marginBottom: 16 }}>
                📚
              </div>
              <span className="badge" style={{ background: "hsla(40 90% 55% / .2)", color: "hsl(40 90% 45%)", marginBottom: 8, display: "inline-block" }}>
                100% Miễn phí
              </span>
              <h3 style={{ fontSize: "1.2rem", marginBottom: 8 }}>Kho Tài Liệu Học Tập</h3>
              <p className="muted" style={{ fontSize: ".88rem", lineHeight: 1.55 }}>
                Tổng hợp giáo trình, slide bài giảng, đề cương và mã nguồn mẫu chất lượng cao, phân loại rõ ràng và hỗ trợ tải về trực tiếp không giới hạn.
              </p>
            </div>
            <span className="feature-link" style={{ marginTop: 18 }}>Truy cập kho tài liệu →</span>
          </Link>

          {/* BENTO 4: BLOG (SPAN 4) */}
          <Link
            href="/blog"
            className="bento-card bento-col-4 reveal"
            style={{
              "--card-grad": "linear-gradient(135deg, #10b981, #06b6d4)",
              background: "linear-gradient(135deg, hsla(150 70% 50% / .08), hsla(190 95% 58% / .04))",
              border: "1px solid hsla(150 70% 50% / .25)",
            }}
          >
            <div>
              <div className="feature-icon" style={{ background: "hsla(150 70% 50% / .18)", borderColor: "hsla(150 70% 50% / .4)", marginBottom: 16 }}>
                ✍️
              </div>
              <span className="badge" style={{ background: "hsla(150 70% 50% / .2)", color: "#10b981", marginBottom: 8, display: "inline-block" }}>
                Kinh nghiệm thực chiến
              </span>
              <h3 style={{ fontSize: "1.2rem", marginBottom: 8 }}>Blog &amp; Tri Thức Kỹ Thuật</h3>
              <p className="muted" style={{ fontSize: ".88rem", lineHeight: 1.55 }}>
                Kho bài viết chuyên sâu về Next.js 16 Turbopack, AI Agents, React 19, tối ưu hóa hiệu năng website và kiến trúc phần mềm AI-First.
              </p>
            </div>
            <span className="feature-link" style={{ marginTop: 18 }}>Đọc bài viết mới →</span>
          </Link>

          {/* BENTO 5: CONNECT & CONTACT (SPAN 4) */}
          <Link
            href="/contact"
            className="bento-card bento-col-4 reveal"
            style={{
              "--card-grad": "linear-gradient(135deg, #a855f7, #6366f1)",
              background: "linear-gradient(135deg, hsla(270 90% 65% / .08), hsla(240 90% 65% / .04))",
              border: "1px solid hsla(270 90% 65% / .25)",
            }}
          >
            <div>
              <div className="feature-icon" style={{ background: "hsla(270 90% 65% / .18)", borderColor: "hsla(270 90% 65% / .4)", marginBottom: 16 }}>
                💬
              </div>
              <span className="badge" style={{ background: "hsla(270 90% 65% / .2)", color: "var(--primary)", marginBottom: 8, display: "inline-block" }}>
                Đang trực tuyến
              </span>
              <h3 style={{ fontSize: "1.2rem", marginBottom: 8 }}>Kết Nối &amp; Giao Lưu</h3>
              <p className="muted" style={{ fontSize: ".88rem", lineHeight: 1.55 }}>
                Bạn cần giải đáp tài liệu, trao đổi ôn thi hay đề xuất ý tưởng hợp tác? Kết nối trực tiếp qua Zalo, Facebook, Email chỉ với một cú chạm.
              </p>
            </div>
            <span className="feature-link" style={{ marginTop: 18 }}>Gửi lời nhắn ngay →</span>
          </Link>
        </div>
      </section>

      {/* ====================================================================
          4. TECH STACK & SYSTEM TOOLS (CÔNG NGHỆ NỔI BẬT)
          ==================================================================== */}
      <section className="section" style={{ paddingTop: 30 }}>
        <div className="section-head" style={{ marginBottom: 20 }}>
          <div>
            <span className="eyebrow glass" style={{ fontSize: ".8rem", padding: "4px 12px" }}>
              NĂNG LỰC KỸ THUẬT
            </span>
            <h2>Công nghệ &amp; Công cụ Hệ thống</h2>
          </div>
          <p className="muted" style={{ fontSize: ".9rem" }}>
            Hệ sinh thái công nghệ hiện đại tối ưu hóa hiệu năng, bảo mật và trải nghiệm học tập
          </p>
        </div>
        <div className="tech-grid">
          {defaultTechStack.map((tech) => (
            <div className="tech-pill" key={tech.name}>
              <span className="tech-pill-icon">
                {renderIcon(tech.icon, "⚡", { width: 18, height: 18, color: tech.color })}
              </span>
              <span>{tech.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ====================================================================
          5. LATEST POSTS
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
          6. LATEST DOCUMENTS
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
          7. CONTACT & CONNECT CTA BANNER
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
