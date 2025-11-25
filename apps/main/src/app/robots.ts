import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/demo", "/p/"],
      disallow: [
        "/dashboard",
        "/edit",
        "/upload",
        // "/auth",
        "/preview",
        "/api",
        "/test-upload",
      ],
    },
    sitemap: "https://portfolioly.app/sitemap.xml",
  };
}
