import type { Metadata } from 'next'
import { SiteFooter, SiteHeader } from '@/components/Site'

export const metadata: Metadata = { title: 'Privacy' }

const SECTIONS = [
  ['What we collect', 'Your account details (name, email, age), the profile you build (avatar, interests, preferences, prompts), photos you upload, proposals, bookings, feedback and memories, plus basic device and usage information needed to run the service securely.'],
  ['Blind-first by design', 'In Discover, people only see your avatar, first name, age, neighbourhood, interests and compatibility. Your photos are only shown to people you have a confirmed date with, and to a partner you have linked. Your email, phone and exact location are never shown to other members.'],
  ['Venues', 'When you book, the venue receives your first name, the booking time and the experience. Guests’ contact details are not shared with venues.'],
  ['Safety', 'Reports, blocks and verification data are used by our Trust & Safety team to keep the community safe. Reports are confidential.'],
  ['Your choices', 'You can edit or delete your profile, photos and memories at any time, unblock people, unlink a partner, and request a copy or deletion of your data by writing to privacy@mingleo.app.'],
]

export default function Privacy() {
  return (
    <div className="bg-cream">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 py-16">
        <h1 className="font-display text-[42px]">Privacy</h1>
        <p className="mt-3 text-ink-soft">How Mingleo handles your information. Questions: privacy@mingleo.app.</p>
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
