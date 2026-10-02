import type { Metadata } from 'next'
import { SiteFooter, SiteHeader } from '@/components/Site'

export const metadata: Metadata = { title: 'Terms' }

const SECTIONS = [
  ['Who can use Mingleo', 'You must be 18 or older, use your real first name and age, and keep your account secure. One account per person.'],
  ['Respect', 'Be kind. Harassment, hate, impersonation, scams and asking people to move dates off-platform are not allowed and may lead to suspension.'],
  ['Dates and bookings', 'Bookings are made with independent venues. Prices are set by each venue and shown to the person booking before they confirm. Free cancellation applies up to 24 hours before a booking unless the venue states otherwise.'],
  ['Payments', 'Mingleo is free to join. We earn a commission from venues on bookings, and from optional subscriptions such as Mingleo Plus and Couple Pass.'],
  ['Safety', 'First dates happen at verified public venues. Use the safety toolkit to report, block or get help at any time. In an emergency, call 112.'],
]

export default function Terms() {
  return (
    <div className="bg-cream">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 py-16">
        <h1 className="font-display text-[42px]">Terms of use</h1>
        <p className="mt-3 text-ink-soft">The short version of the rules that keep Mingleo good for everyone.</p>
        <div className="mt-10 space-y-8">
          {SECTIONS.map(([t, d]) => (
            <section key={t}>
              <h2 className="text-lg font-semibold">{t}</h2>
              <p className="mt-2 leading-relaxed text-ink-soft">{d}</p>
            </section>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
