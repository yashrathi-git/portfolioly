import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/demo", "/p/"],
        disallow: [
          "/dashboard",
          "/edit",
          "/upload",
          "/preview",
          "/api",
          "/test-upload",
          "/auth/callback",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: ["/", "/demo", "/p/"],
        disallow: ["/dashboard", "/edit", "/upload", "/preview", "/api"],
      },
    ],
    sitemap: "https://portfolioly.app/sitemap.xml",
    host: "https://portfolioly.app",
  };
}
