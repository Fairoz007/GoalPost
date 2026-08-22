export function parseYouTubeVideoId(value: string) {
  const input = value.trim();
  if (!input) return null;

  let url: URL;
  try {
    url = new URL(
      input.startsWith("http://") || input.startsWith("https://")
        ? input
        : `https://${input}`,
    );
  } catch {
    throw new Error("Enter a valid YouTube video URL.");
  }

  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  let videoId: string | null = null;
  if (host === "youtu.be") {
    videoId = url.pathname.split("/").filter(Boolean)[0] ?? null;
  }
  if (
    host === "youtube.com" ||
    host === "m.youtube.com" ||
    host === "music.youtube.com"
  ) {
    if (url.pathname === "/watch") {
      videoId = url.searchParams.get("v");
    } else {
      const [kind, id] = url.pathname.split("/").filter(Boolean);
      if (["embed", "live", "shorts"].includes(kind)) videoId = id ?? null;
    }
  }

  if (!videoId || !/^[A-Za-z0-9_-]{11}$/.test(videoId)) {
    throw new Error("Use a YouTube watch, Shorts, live, or youtu.be video URL.");
  }
  return videoId;
}
