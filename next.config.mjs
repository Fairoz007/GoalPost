import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare'

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  images: {
    unoptimized: true,
  },
  async headers() {
    const securityHeaders = [
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), browsing-topics=()' },
      {
        key: 'Content-Security-Policy',
        value: [
          "default-src 'self'",
          "base-uri 'self'",
          "object-src 'none'",
          "form-action 'self' https://*.clerk.accounts.dev https://clerk.donestudio.in",
          "frame-src 'self' https://www.youtube-nocookie.com https://*.clerk.accounts.dev https://clerk.donestudio.in",
          "frame-ancestors 'self'",
          "img-src 'self' data: blob: https:",
          "font-src 'self' data: https://fonts.gstatic.com",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev https://clerk.donestudio.in https://challenges.cloudflare.com https://static.cloudflareinsights.com",
          "worker-src 'self' blob:",
          "connect-src 'self' https: wss:",
          "upgrade-insecure-requests",
        ].join('; '),
      },
    ]
    return [
      { source: '/tournaments/:id/overlay', headers: securityHeaders.filter(({ key }) => key !== 'Content-Security-Policy').concat({ key: 'Content-Security-Policy', value: securityHeaders.find(({ key }) => key === 'Content-Security-Policy').value.replace("frame-ancestors 'self'", 'frame-ancestors *') }) },
      { source: '/((?!tournaments/[^/]+/overlay).*)', headers: securityHeaders },
    ]
  },
}

initOpenNextCloudflareForDev()

export default nextConfig
