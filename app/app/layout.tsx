import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'UniPerk - Trust Layer for DeFi',
  description: 'Portable identity, instant execution, smart settlement for AI agents in DeFi',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background antialiased">
        {children}
      </body>
    </html>
  )
}
