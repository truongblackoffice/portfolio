import { listItems } from "@/lib/db";
import { seedPosts } from "@/lib/seed";

export default async function sitemap() {
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

  let posts = [];
  let quizzes = [];
  let topics = [];

  try {
    const [fetchedPosts, fetchedQuizzes, fetchedTopics] = await Promise.all([
      listItems("posts", true),
      listItems("quizzes", true),
      listItems("quizTopics", true),
    ]);
    posts = fetchedPosts || [];
    quizzes = fetchedQuizzes || [];
    topics = fetchedTopics || [];
  } catch {
    posts = seedPosts;
  }

  if (!posts?.length) posts = seedPosts;

  // 1. Tuyến đường bài viết blog
  const postRoutes = posts
    .filter((p) => p && p.published !== false)
    .map((p) => ({
      url: `${baseUrl}/blog/${p.slug || p.id}`,
      lastModified: p.createdAt ? new Date(p.createdAt) : now,
      changeFrequency: "weekly",
      priority: 0.85,
    }));

  // 2. Tuyến đường bộ đề thi trắc nghiệm
  const quizRoutes = quizzes
    .filter((q) => q && q.published !== false)
    .map((q) => ({
      url: `${baseUrl}/quiz/${q.id}`,
      lastModified: q.createdAt ? new Date(q.createdAt) : now,
      changeFrequency: "weekly",
      priority: 0.85,
    }));

  // 3. Tuyến đường chủ đề trắc nghiệm
  const topicRoutes = topics
    .filter((t) => t && t.id)
    .map((t) => ({
      url: `${baseUrl}/quiz/topic/${t.id}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

  return [...staticRoutes, ...postRoutes, ...quizRoutes, ...topicRoutes];
}
