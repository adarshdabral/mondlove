import type { Metadata } from 'next'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { LoginForm } from './LoginForm'

export const metadata: Metadata = { title: 'Log in' }

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams
  return (
    <AuthLayout
      title="Welcome back"
      sub="Log in to see your matches, proposals and plans."
      aside={
        <div className="max-w-md">
          <p className="font-display text-[40px] leading-tight">Pick their drink before you&apos;ve seen their face.</p>
          <p className="mt-6 text-white/60">The Date Token: every Mingleo proposal comes with something for the other person to try.</p>
        </div>
      }
    >
      <LoginForm next={next} />
    </AuthLayout>
  )
}
