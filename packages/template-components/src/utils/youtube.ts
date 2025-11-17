/**
 * YouTube URL processing utilities
 */

export function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;

  try {
    const urlObj = new URL(url);

    // Handle youtu.be short URLs
    if (urlObj.hostname === "youtu.be" || urlObj.hostname === "www.youtu.be") {
      return urlObj.pathname.substring(1).split("?")[0];
    }

    // Handle youtube.com URLs
    if (
      urlObj.hostname === "youtube.com" ||
      urlObj.hostname === "www.youtube.com"
    ) {
      // Check for /watch?v= format
      const vParam = urlObj.searchParams.get("v");
      if (vParam) return vParam;

      // Check for /embed/ format
      if (urlObj.pathname.startsWith("/embed/")) {
        return urlObj.pathname.split("/embed/")[1].split("?")[0];
      }

      // Check for /v/ format
      if (urlObj.pathname.startsWith("/v/")) {
        return urlObj.pathname.split("/v/")[1].split("?")[0];
      }
    }

    return null;
  } catch {
    return null;
  }
}

export function getYouTubeEmbedUrl(url: string): string {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) return url;
  return `https://www.youtube.com/embed/${videoId}`;
}

export function getYouTubeThumbnail(url: string): string | null {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) return null;
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}

export function getFallbackYouTubeThumbnail(url: string): string | null {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) return null;
  return `https://img.youtube.com/vi/${videoId}/default.jpg`;
}
