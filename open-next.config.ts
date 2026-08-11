import { defineCloudflareConfig } from "@opennextjs/cloudflare";

const config = defineCloudflareConfig();

// Cloudflare runs `npm run build`. Point OpenNext directly at Next.js so the
// adapter can create its required standalone output without recursing back
// into the package build script.
config.buildCommand = "next build";

export default config;
