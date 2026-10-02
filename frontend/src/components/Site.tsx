'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, Store, X } from 'lucide-react'
import { useSession } from '../lib/session'
import { Logo } from './ui'

const LINKS = [
  ['How it works', '/#how'],
  ['Date ideas', '/#doon'],
  ['For couples', '/#couples'],
  ['Safety', '/#safety'],
]

export function SiteHeader({ dark = false }: { dark?: boolean }) {
  const { user } = useSession()
  const [open, setOpen] = useState(false)
  const home = user ? (user.role === 'partner' ? '/partner' : user.role === 'admin' ? '/admin' : '/app') : null
  return (
    <header className={`sticky top-0 z-50 backdrop-blur-md ${dark ? 'bg-ink/80 text-white' : 'bg-cream/85'}`}>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link href="/"><Logo light={dark} /></Link>
        <nav className="hidden items-center gap-8 text-[14px] font-medium md:flex">
          {LINKS.map(([l, h]) => (
            <Link key={h} href={h} className={dark ? 'text-white/70 hover:text-white' : 'text-ink-soft hover:text-ink'}>{l}</Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          {!home && (
            <Link href="/partners" className={`inline-flex h-10 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold ${dark ? 'border-white/20 text-white hover:bg-white/10' : 'border-line bg-white/70 text-ink hover:border-ink/30'}`}>
              <Store size={15} /> For business
            </Link>
          )}
          {home ? (
            <Link href={home} className="inline-flex h-10 items-center rounded-full bg-ember px-5 text-sm font-semibold text-white hover:bg-ember-dark">Open Mingleo</Link>
          ) : (
            <>
              <Link href="/login" className={`inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold ${dark ? 'text-white' : 'text-ink'}`}>Log in</Link>
              <Link href="/signup" className="inline-flex h-10 items-center rounded-full bg-ember px-5 text-sm font-semibold text-white hover:bg-ember-dark">Get started</Link>
            </>
          )}
        </div>
        <button aria-label="Menu" onClick={() => setOpen(!open)} className="grid h-10 w-10 place-items-center rounded-full md:hidden cursor-pointer">{open ? <X size={20} /> : <Menu size={20} />}</button>
      </div>
      {open && (
        <div className={`border-t px-5 pb-5 md:hidden ${dark ? 'border-white/10' : 'border-line'}`}>
          {LINKS.map(([l, h]) => (
            <Link key={h} href={h} onClick={() => setOpen(false)} className="block py-3 text-[15px] font-medium">{l}</Link>
          ))}
          <div className="mt-2 grid grid-cols-2 gap-2">
            {home ? (
              <Link href={home} className="col-span-2 inline-flex h-11 items-center justify-center rounded-full bg-ember text-sm font-semibold text-white">Open Mingleo</Link>
            ) : (
              <>
                <Link href="/login" className="inline-flex h-11 items-center justify-center rounded-full border border-line bg-white text-sm font-semibold text-ink">Log in</Link>
                <Link href="/signup" className="inline-flex h-11 items-center justify-center rounded-full bg-ember text-sm font-semibold text-white">Get started</Link>
                <div className="col-span-2 mt-3 rounded-2xl bg-sand/70 p-3">
                  <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">Café or activity owner?</div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <Link href="/partners#join" onClick={() => setOpen(false)} className="inline-flex h-10 items-center justify-center rounded-full bg-ink text-[13px] font-semibold text-white">Register venue</Link>
                    <Link href="/partners/login" onClick={() => setOpen(false)} className="inline-flex h-10 items-center justify-center rounded-full border border-line bg-white text-[13px] font-semibold text-ink">Partner login</Link>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-cream">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm text-ink-soft">Meet. Date. Experience. Mingleo helps you create the experience that happens after you meet someone.</p>
        </div>
        {[
          ['Product', [['How it works', '/#how'], ['For couples', '/#couples'], ['Safety', '/#safety'], ['FAQ', '/#faq']]],
          ['For business', [['Register your venue', '/partners#join'], ['Partner login', '/partners/login'], ['Business model', '/business']]],
          ['Company', [['Support', 'mailto:support@mingleo.app'], ['Safety team', 'mailto:safety@mingleo.app'], ['Privacy', '/privacy'], ['Terms', '/terms']]],
        ].map(([title, links]) => (
          <div key={title as string}>
            <div className="text-[12px] font-bold uppercase tracking-[0.14em] text-muted">{title as string}</div>
            <ul className="mt-4 space-y-2.5 text-sm">
              {(links as string[][]).map(([l, h]) => (
                <li key={l}><Link href={h} className="text-ink-soft hover:text-ink">{l}</Link></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line py-6 text-center text-xs text-muted">© {new Date().getFullYear()} Mingleo · Made in Dehradun 🏔️</div>
    </footer>
  )
}
