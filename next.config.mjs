/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Static export so `next build` drops a deployable /out anywhere (GitHub Pages included).
  output: 'export',
  images: { unoptimized: true },
}

export default nextConfig
