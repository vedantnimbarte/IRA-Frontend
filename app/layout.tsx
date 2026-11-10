import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://ira.dev'),
  title: 'IRA — a voice assistant you can interrupt',
  description:
    'Wake word, endpointing, speech-to-text, a streaming model and streaming speech in one process. Turn-taking is the feature: interrupt her any time.',
  openGraph: {
    title: 'IRA — a voice assistant you can interrupt',
    description:
      'Turn-taking is the feature. A slower model that yields the floor correctly beats a smarter one that talks over you.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: '#05080a',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900&family=JetBrains+Mono:wght@400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
