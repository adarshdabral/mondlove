import type { Metadata } from 'next'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { SignupForm } from './SignupForm'

export const metadata: Metadata = { title: 'Create your account' }

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ intent?: string }> }) {
  const { intent } = await searchParams
  const initial = intent === 'meet' || intent === 'plan' || intent === 'both' ? intent : undefined
  return (
    <AuthLayout
      title="What brings you to Mingleo?"
      sub="Free to join. You only ever pay for the experiences you book."
      aside={
        <div className="max-w-md">
          <p className="font-display text-[40px] leading-tight">Know the person before you see the person.</p>
          <ul className="mt-8 space-y-3 text-white/70">
            <li>✓ An illustrated avatar instead of photos</li>
            <li>✓ Real date proposals at verified venues</li>
            <li>✓ Photos unlock after your first date</li>
          </ul>
        </div>
      }
    >
      <SignupForm initialIntent={initial} />
    </AuthLayout>
  )
}
