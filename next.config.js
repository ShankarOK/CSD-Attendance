/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Smooth page transitions using View Transitions API (Next.js 16 + React 19)
    viewTransition: true,
  },
}

module.exports = nextConfig

