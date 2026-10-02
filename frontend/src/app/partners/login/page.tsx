import type { Metadata } from 'next'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { AccountTypeTabs, LoginForm } from '../../login/LoginForm'

export const metadata: Metadata = { title: 'Partner login' }

export default function PartnerLoginPage() {
  return (
    <AuthLayout
      title="Partner login"
      sub="For cafés, restaurants and activity owners. Manage bookings, date packages and availability."
      aside={
        <div className="max-w-md">
          <p className="font-display text-[40px] leading-tight">Your venue, booked by Doon&apos;s first dates.</p>
          <ul className="mt-8 space-y-3 text-white/70">
            <li>✓ See today&apos;s bookings and check guests in</li>
            <li>✓ Create date packages and set capacity per slot</li>
            <li>✓ Track payouts, ratings and the Date Tokens guests pick</li>
          </ul>
        </div>
      }
    >
      <AccountTypeTabs active="partner" />
      <LoginForm variant="partner" />
    </AuthLayout>
  )
}
