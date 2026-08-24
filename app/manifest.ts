import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "D-One Arena",
    short_name: "D-One Arena",
    description: "Esports tournaments, fixtures, rankings, and champions.",
    start_url: "/",
    display: "standalone",
    background_color: "#070707",
    theme_color: "#070707",
    icons: [
      { src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
