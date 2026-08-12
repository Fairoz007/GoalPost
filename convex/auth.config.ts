import type { AuthConfig } from "convex/server";

const clerkIssuer = process.env.CLERK_FRONTEND_API_URL;

if (!clerkIssuer) {
  throw new Error("CLERK_FRONTEND_API_URL is required for Clerk authentication.");
}

export default {
  providers: [
    {
      domain: clerkIssuer,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
