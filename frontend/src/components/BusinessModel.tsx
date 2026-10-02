import { ArrowDown, ArrowRight, Building2, Crown, Gift, Handshake, Heart, Megaphone, Percent, RefreshCw, Sparkles, Ticket } from 'lucide-react'
import { LogoMark } from './ui'

const FLOW = [
  { t: 'Users', d: 'Singles & couples join free', e: '👥' },
  { t: 'Connections', d: 'Blind-first matches', e: '💫' },
  { t: 'Dates', d: 'Proposals become plans', e: '💌' },
  { t: 'Bookings', d: 'Real tables, real slots', e: '🎟️' },
  { t: 'Partner revenue', d: 'Cafés & studios fill seats', e: '☕' },
  { t: 'Mingleo revenue', d: 'Commission on each booking', e: '📈' },
  { t: 'More experiences', d: 'Partners create packages', e: '✨' },
  { t: 'Repeat usage', d: 'Couples keep coming back', e: '🔁' },
]

const STREAMS = [
  { g: 'Primary', icon: Percent, t: 'Booking commission', d: 'Mingleo earns 10–15% from cafés, restaurants and activity providers every time a date is booked.', tone: 'bg-ember text-white' },
  { g: 'Secondary', icon: Sparkles, t: 'Date experience commission', d: 'Commission on curated Date Lab itineraries and Surprise My Partner bundles.', tone: 'bg-ember-soft text-ember-dark' },
  { g: 'Secondary', icon: Crown, t: 'Mingleo Plus', d: 'Optional premium for singles: richer insights, more Date Lab ideas. Never required to meet anyone.', tone: 'bg-ember-soft text-ember-dark' },
  { g: 'Secondary', icon: Heart, t: 'Couple Pass', d: 'Priority tables, exclusive experiences and anniversary perks for couples.', tone: 'bg-plum-soft text-plum' },
  { g: 'B2B', icon: Megaphone, t: 'Featured venue placement', d: 'Businesses promote experiences in Discover, Date Lab and the marketplace.', tone: 'bg-gold-soft text-[#9a6d17]' },
  { g: 'B2B', icon: Building2, t: 'Partner Pro', d: 'Subscription for dashboards, Date Token insights, dynamic pricing and analytics.', tone: 'bg-gold-soft text-[#9a6d17]' },
  { g: 'Additional', icon: Gift, t: 'Gifts & add-ons', d: 'Commission on flowers, cakes, décor and keepsakes added to dates.', tone: 'bg-sage-soft text-sage' },
  { g: 'Additional', icon: Handshake, t: 'Brand partnerships', d: 'Sponsored experiences and seasonal campaigns with lifestyle brands.', tone: 'bg-sage-soft text-sage' },
]

export function BusinessModel() {
  return (
    <div className="min-h-full bg-cream">
      <div className="relative overflow-hidden bg-ink px-6 py-14 text-white lg:px-14">
        <div className="absolute -left-20 top-0 h-80 w-80 rounded-full bg-ember/25 blur-3xl" />
        <div className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-plum/60 blur-3xl" />
        <div className="relative mx-auto max-w-5xl">
          <div className="flex items-center gap-3"><LogoMark size={36} /><span className="font-display text-2xl">mingleo</span></div>
          <h1 className="mt-8 max-w-3xl font-display text-[40px] leading-[1.05] lg:text-[56px]">
            Mingleo isn&apos;t just where you meet someone. <span className="text-peach">It helps you create the experience that happens next.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-white/70">
            We never charge people to find a person. Mingleo earns when connections become real-world experiences at local cafés, restaurants and studios. We&apos;re launching in Dehradun, with the city&apos;s Gen Z (18–27) as our first community.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-14 lg:px-0">
        <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-ember">The flywheel</div>
        <h2 className="mt-2 font-display text-[34px] leading-tight">Every connection creates economic activity.</h2>
        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {FLOW.map((f, i) => (
            <div key={f.t} className="relative">
              <div className={`h-full rounded-3xl border p-5 shadow-card ${i === 5 ? 'border-ember bg-ember text-white' : 'border-line bg-white'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-3xl">{f.e}</span>
                  <span className={`text-[11px] font-bold ${i === 5 ? 'text-white/70' : 'text-muted'}`}>0{i + 1}</span>
                </div>
                <div className="mt-3 text-[17px] font-semibold">{f.t}</div>
                <div className={`text-[13px] ${i === 5 ? 'text-white/80' : 'text-muted'}`}>{f.d}</div>
              </div>
              {i < FLOW.length - 1 && (
                <>
                  <ArrowRight size={18} className={`absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-cream text-muted lg:block ${i === 3 ? 'lg:hidden' : ''}`} />
                  <ArrowDown size={18} className="mx-auto my-1 text-muted sm:hidden" />
                </>
              )}
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-center gap-2 text-[13px] font-semibold text-plum"><RefreshCw size={15} /> Repeat usage feeds new experiences, and the loop compounds</div>

        <div className="mt-16 text-[11px] font-bold uppercase tracking-[0.18em] text-ember">Revenue model</div>
        <h2 className="mt-2 font-display text-[34px] leading-tight">Eight streams. One principle.</h2>
        <p className="mt-2 max-w-2xl text-ink-soft">Monetization follows real-world value. Users only pay when they choose an experience, and partners pay when Mingleo fills their seats.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {STREAMS.map((s, i) => (
            <div key={s.t} className={`flex gap-4 rounded-3xl border bg-white p-5 shadow-card ${i === 0 ? 'border-ember md:col-span-2' : 'border-line'}`}>
              <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${s.tone}`}><s.icon size={22} /></div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted">{s.g}</div>
                <div className="text-[17px] font-semibold">{s.t}</div>
                <div className="mt-1 text-[14px] text-ink-soft">{s.d}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 grid gap-4 md:grid-cols-3">
          {[
            [Ticket, 'For users', 'Free to meet. Pay only for the date you choose, with prices never shown on invitations.'],
            [Building2, 'For partners', 'A steady stream of couples on slow weekdays, with zero upfront cost and pay-per-booking.'],
            [Heart, 'For couples', 'Mingleo becomes the place their relationship history lives, so they keep coming back.'],
          ].map(([I, t, d]) => {
            const Icon = I as typeof Ticket
            return (
              <div key={t as string} className="rounded-3xl bg-sand/70 p-6">
                <Icon size={22} className="text-ember" />
                <div className="mt-3 font-display text-xl">{t as string}</div>
                <p className="mt-1 text-[14px] text-ink-soft">{d as string}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
