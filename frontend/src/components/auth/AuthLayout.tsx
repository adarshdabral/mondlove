import Link from 'next/link'
import type { ReactNode } from 'react'
import { Logo } from '../ui'

/** Split layout used by login, signup and partner signup. */
export function AuthLayout({ title, sub, children, aside }: { title: string; sub: ReactNode; children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="grid min-h-screen bg-cream lg:grid-cols-[1fr_1.05fr]">
      <div className="flex flex-col px-6 py-8 md:px-14">
        <Link href="/" className="w-fit"><Logo /></Link>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          <h1 className="font-display text-[34px] leading-tight">{title}</h1>
          <div className="mt-2 text-[15px] text-ink-soft">{sub}</div>
          <div className="mt-8">{children}</div>
        </div>
      </div>
      <div className="relative hidden overflow-hidden bg-ink lg:block">
        <div className="absolute -left-20 top-10 h-96 w-96 rounded-full bg-ember/30 blur-3xl" />
        <div className="absolute -right-20 bottom-10 h-96 w-96 rounded-full bg-plum/60 blur-3xl" />
        <div className="relative flex h-full items-center justify-center p-14 text-white">{aside}</div>
      </div>
    </div>
  )
}
