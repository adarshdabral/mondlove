import type { Metadata } from 'next'
import { BarChart3, CalendarClock, IndianRupee, Package, Percent, Sparkles } from 'lucide-react'
import { SiteFooter, SiteHeader } from '@/components/Site'
import { PartnerSignup } from './PartnerSignup'

export const metadata: Metadata = { title: 'List your venue' }

export default function PartnersPage() {
  return (
    <div className="bg-cream">
      <SiteHeader />
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-ember-soft blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-5 py-14 md:grid-cols-[1.1fr_1fr] md:py-20">
          <div>
            <div className="text-[12px] font-bold uppercase tracking-[0.16em] text-ember">Mingleo for Dehradun venues</div>
            <h1 className="mt-3 font-display text-[42px] leading-[1.05] md:text-[58px]">Become the place where Doon&apos;s first dates happen.</h1>
            <p className="mt-5 max-w-xl text-[17px] text-ink-soft">We&apos;re launching in Dehradun with the city&apos;s students and young professionals. Cafés, momo spots, restaurants and experience studios get booked straight from date proposals, Date Lab itineraries and couples&apos; surprises.</p>
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {[
                { icon: Percent, t: 'Pay per booking', d: 'No listing fee. A commission only when a booking happens.' },
                { icon: Package, t: 'Date packages', d: 'Bundle drinks, a snack to share and a reserved table at your price. Student-friendly packages (₹300–₹700) book fastest.' },
                { icon: CalendarClock, t: 'Your availability', d: 'Set capacity per slot. We never oversell a table.' },
                { icon: Sparkles, t: 'Date Tokens', d: 'See what guests pick for each other, so you can prep the right stock.' },
                { icon: BarChart3, t: 'Partner dashboard', d: 'Bookings, payouts, ratings and where your guests come from.' },
                { icon: IndianRupee, t: 'Weekly payouts', d: 'Paid every Monday, with a clear breakdown of every booking.' },
              ].map((x) => (
                <div key={x.t} className="rounded-3xl border border-line bg-white p-5">
                  <x.icon size={20} className="text-ember" />
                  <div className="mt-3 font-semibold">{x.t}</div>
                  <p className="mt-1 text-[14px] text-ink-soft">{x.d}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="md:pt-6">
            <PartnerSignup />
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  )
}
