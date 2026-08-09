# D-One Arena on Cloudflare Workers

This repository uses the OpenNext adapter for Cloudflare Workers. The Worker name is `arena`.

## Cloudflare Workers Builds settings

- Build command: `npm run cf:build`
- Deploy command: `npm run cf:deploy`
- Root directory: `/`
- Node.js version: `22` or `24`

Add these as Cloudflare build variables before deploying:

```dotenv
NEXT_PUBLIC_CONVEX_URL=https://your-production-deployment.convex.cloud
NEXT_PUBLIC_CONVEX_SITE_URL=https://your-production-deployment.convex.site
```

These are public browser configuration values, but they must identify the intended production Convex deployment when the Next.js bundle is built.

## Local preview

Copy `.dev.vars.example` to `.dev.vars`, enter the appropriate Convex URLs, then run:

```bash
npm run cf:preview
```

Normal Next.js development remains available through `npm run dev` and `.env.local`.

## Direct deployment

```bash
npx wrangler login
npm run deploy
```

After deployment, add `arena.donestudio.in` under **Workers & Pages → arena → Settings → Domains & Routes**.

## Previous error 10143

The failed deployment was generated with a `WORKER_SELF_REFERENCE` binding targeting a nonexistent Worker named `my-project`. This app does not use ISR or on-demand revalidation, so the repository-owned `wrangler.jsonc` intentionally has no self-service binding. Do not use bare `npx wrangler deploy` as the Cloudflare deploy command; use the OpenNext scripts above.
