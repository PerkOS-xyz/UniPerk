'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { RainbowKitProvider, darkTheme, lightTheme } from '@rainbow-me/rainbowkit'
import { ThemeProvider, useTheme } from 'next-themes'
import { config } from '@/lib/wagmi'
import { useState } from 'react'

import '@rainbow-me/rainbowkit/styles.css'

const rkAccent = {
  accentColor: '#FF007A',
  accentColorForeground: 'white',
  borderRadius: 'medium' as const,
}

function RainbowKitWithTheme({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme()
  const rkTheme = resolvedTheme === 'dark' ? darkTheme(rkAccent) : lightTheme(rkAccent)

  return (
    <RainbowKitProvider theme={rkTheme}>
      {children}
    </RainbowKitProvider>
  )
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitWithTheme>
            {children}
          </RainbowKitWithTheme>
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  )
}
