import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://mitienda.local";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/api/",
          "/cuenta",
          "/cuenta/",
          "/carrito",
        ],
      },
      {
        userAgent: [
          "GPTBot",
          "ChatGPT-User",
          "PerplexityBot",
          "ClaudeBot",
          "Google-Extended",
          "Amazonbot",
          "CCBot",
          "OAI-SearchBot",
        ],
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/api/",
          "/cuenta",
          "/cuenta/",
          "/carrito",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
