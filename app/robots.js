export default function robots() {
  const baseUrl = "https://manhtruong.io.vn";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/profile", "/api/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
