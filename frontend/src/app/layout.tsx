import type { Metadata, Viewport } from 'next'
import { Fraunces, Plus_Jakarta_Sans } from 'next/font/google'
import { Providers } from '@/lib/session'
import './globals.css'

const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces', axes: ['opsz'], style: ['normal', 'italic'] })
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta' })

export const metadata: Metadata = {
  title: { default: 'Mingleo · Meet. Date. Experience.', template: '%s · Mingleo' },
  description: 'Meet people through personality, not photos. Propose a real date at a café or experience you’ll both love, and keep every date as a memory.',
}

export const viewport: Viewport = { themeColor: '#FBF7F2', width: 'device-width', initialScale: 1, viewportFit: 'cover' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${jakarta.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
