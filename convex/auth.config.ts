import type { AuthConfig } from "convex/server";

const clerkIssuer = process.env.CLERK_FRONTEND_API_URL;
const productionClerkIssuer = "https://clerk.donestudio.in";

if (!clerkIssuer) {
  throw new Error("CLERK_FRONTEND_API_URL is required for Clerk authentication.");
}

export default {
  providers: [...new Set([clerkIssuer, productionClerkIssuer])].map((domain) => ({
    domain,
    applicationID: "convex",
  })),
} satisfies AuthConfig;
