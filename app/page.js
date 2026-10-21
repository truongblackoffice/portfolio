"use client";
import Link from "next/link";
import { getProfile, listItems } from "@/lib/db";
import { seedProfile } from "@/lib/seed";
import useAsync from "@/lib/useAsync";
import { PostCard, DocCard } from "@/components/Cards";
import { useSite } from "@/lib/SiteContext";

const initialHomeData = {
  profile: seedProfile,
  posts: [],
  docs: [],
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
  const skills = profile.skills || [];

  return (
    <div className="container">
      <section className="hero reveal">
        <div>
          <span className="eyebrow glass">{site.heroBadge || "👋 Chào mừng bạn ghé thăm"}</span>
          <h1>Mình là <span className="gradient-text">{profile.name || "Nguyễn Mạnh Trường"}</span></h1>
          <p>{profile.title ? `${profile.title}. ` : ""}{profile.bio || "Chào mừng bạn đến với trang web cá nhân và không gian chia sẻ kiến thức của mình."}</p>
          <div className="hero-actions">
            <Link href="/blog" className="btn btn-primary" id="cta-blog">Đọc bài viết</Link>
            <Link href="/documents" className="btn btn-ghost" id="cta-docs">Kho tài liệu</Link>
          </div>
        </div>
        <div className="avatar-wrap">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="avatar"
            src={profile.avatar || "/avatar.jpg"}
            alt={profile.name || "Avatar"}
            width="340"
            height="340"
            loading="eager"
            decoding="async"
          />
        </div>
      </section>

      {skills.length > 0 && (
        <section className="section">
          <div className="section-head"><h2>Kỹ năng</h2></div>
          <div className="chips">{skills.map((s) => <span className="chip" key={s}>{s}</span>)}</div>
        </section>
      )}

      {posts.length > 0 && (
        <section className="section">
          <div className="section-head"><h2>Bài viết mới</h2><Link href="/blog" className="muted">Xem tất cả →</Link></div>
          <div className="grid">{posts.map((p) => <PostCard key={p.id} p={p} />)}</div>
        </section>
      )}

      {docs.length > 0 && (
        <section className="section">
          <div className="section-head"><h2>Tài liệu mới</h2><Link href="/documents" className="muted">Xem tất cả →</Link></div>
          <div className="grid">{docs.map((d) => <DocCard key={d.id} d={d} />)}</div>
        </section>
      )}
    </div>
  );
}
