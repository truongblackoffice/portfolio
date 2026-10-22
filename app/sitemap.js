import { seedPosts } from "@/lib/seed";

export default function sitemap() {
  const baseUrl = "https://manhtruong.io.vn";
  const now = new Date();

  // Các trang tĩnh chính
  const staticRoutes = [
    {
      url: `${baseUrl}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/quiz`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/documents`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  // Các bài viết blog
  const postRoutes = (seedPosts || [])
    .filter((p) => p.published !== false)
    .map((p) => ({
      url: `${baseUrl}/blog/${p.slug || p.id}`,
      lastModified: p.createdAt ? new Date(p.createdAt) : now,
      changeFrequency: "weekly",
      priority: 0.85,
    }));

  return [...staticRoutes, ...postRoutes];
}
