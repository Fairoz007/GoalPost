import type { AuthConfig } from "convex/server";

const configuredIssuer = process.env.CLERK_FRONTEND_API_URL || process.env.CLERK_JWT_ISSUER_DOMAIN;
const defaultIssuers = [
  "https://rich-elephant-82.clerk.accounts.dev",
  "https://clerk.donestudio.in",
];

const allDomains = [
  configuredIssuer,
  ...defaultIssuers,
].filter((domain): domain is string => Boolean(domain && domain.trim()));

export default {
  providers: [...new Set(allDomains)].map((domain) => ({
    domain,
    applicationID: "convex",
  })),
} satisfies AuthConfig;
