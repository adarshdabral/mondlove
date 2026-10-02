import Link from 'next/link'
import { ArrowRight, BadgeCheck, CalendarHeart, Camera, EyeOff, Gift, HeartHandshake, Lock, MapPin, Phone, ShieldCheck, Sparkles, Store, Ticket, Wand2 } from 'lucide-react'
import { Avatar } from '@/components/Avatar'
import { SiteFooter, SiteHeader } from '@/components/Site'
import type { AvatarConfig } from '@/lib/types'

const A: Record<string, AvatarConfig> = {
  ananya: { skin: '#EBC1A0', hair: 'long', hairColor: '#3B2A22', bg: ['#E7E1F7', '#C9BDF0'], shirt: '#4F8A6A', accessory: 'earrings' },
  kabir: { skin: '#B97D57', hair: 'short', hairColor: '#1F1A1C', bg: ['#DDEEE4', '#B7D9C5'], shirt: '#4F7FBF', accessory: 'glasses', beard: true },
  zoya: { skin: '#F6D7C3', hair: 'bob', hairColor: '#1F1A1C', bg: ['#FBEFD3', '#F2D49A'], shirt: '#E8774A', accessory: 'none' },
  aarav: { skin: '#D9A27C', hair: 'wavy', hairColor: '#1F1A1C', bg: ['#FDE3D3', '#F6C9A8'], shirt: '#1E1B2E', accessory: 'none', beard: true },
  meera: { skin: '#8E5A3C', hair: 'bun', hairColor: '#1F1A1C', bg: ['#F7E1E6', '#EDC2CC'], shirt: '#D9A23B', accessory: 'glasses' },
}

export default function Landing() {
  return (
    <div className="bg-cream">
      <SiteHeader />

      {/* ---------------- Hero ---------------- */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -left-40 top-10 h-[480px] w-[480px] rounded-full bg-ember-soft blur-3xl" />
        <div className="pointer-events-none absolute -right-40 bottom-0 h-[480px] w-[480px] rounded-full bg-plum-soft blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 pb-20 pt-12 md:grid-cols-[1.05fr_1fr] md:pb-28 md:pt-20">
          <div className="animate-fade-up">
            <div className="inline-flex items-center gap-2 rounded-full border border-line bg-white/70 px-3 py-1.5 text-[12px] font-semibold text-ink-soft backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-sage" /> Launching first in Dehradun 🏔️
            </div>
            <h1 className="mt-6 font-display text-[44px] leading-[1.02] md:text-[68px]">
              Skip the endless chat.
              <br />
              <span className="italic text-ember">Go on the date.</span>
            </h1>
            <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-ink-soft md:text-lg">
              Mingleo matches you on personality, not photos. Then it helps you plan a real date: a café on Rajpur Road, a momo crawl in Paltan Bazaar, an open mic at Astley Hall. Every one becomes a memory.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/signup" className="inline-flex h-13 items-center gap-2 rounded-full bg-ember px-7 text-[15px] font-semibold text-white shadow-[0_10px_24px_-10px_rgb(232_119_74/0.8)] hover:bg-ember-dark">
                Get started free <ArrowRight size={17} />
              </Link>
              <Link href="/signup?intent=plan" className="inline-flex h-13 items-center gap-2 rounded-full border border-line bg-white px-7 text-[15px] font-semibold hover:border-ink/30">
                We&apos;re already a couple
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-ink-soft">
              <span className="flex items-center gap-1.5"><EyeOff size={15} className="text-plum" /> Photos unlock after your first date</span>
              <span className="flex items-center gap-1.5"><ShieldCheck size={15} className="text-sage" /> Verified people &amp; venues</span>
              <span className="flex items-center gap-1.5"><HeartHandshake size={15} className="text-ember" /> Free to meet</span>
            </div>
          </div>

          {/* Hero visual: blind profile + date proposal */}
          <div className="relative mx-auto h-[520px] w-full max-w-[460px]">
            <div className="absolute left-0 top-0 w-[290px] -rotate-3 animate-float rounded-[30px] border border-line/70 bg-white p-5 shadow-lift">
              <div className="flex items-start gap-4">
                <Avatar config={A.ananya} size={76} shape="squircle" ring />
                <div className="pt-1">
                  <div className="flex items-center gap-1.5 font-display text-[22px] leading-none">Ananya, 21 <BadgeCheck size={17} className="fill-sky text-white" /></div>
                  <div className="mt-1.5 flex items-center gap-1 text-[12px] text-muted"><MapPin size={12} /> Dalanwala</div>
                </div>
              </div>
              <p className="mt-4 font-display text-[16px] italic leading-snug">“You both love café hopping, indie music and last-minute Mussoorie plans.”</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {['☕ Café hopping', '🎵 Indie music', '🏔️ Mussoorie'].map((t) => <span key={t} className="rounded-full bg-sand px-2.5 py-1 text-[11px] font-medium">{t}</span>)}
              </div>
              <div className="absolute -right-4 -top-4 grid h-16 w-16 place-items-center rounded-full bg-white shadow-lift">
                <div className="text-center"><div className="font-display text-xl leading-none text-ember">92%</div><div className="text-[9px] font-bold uppercase text-muted">match</div></div>
              </div>
            </div>

            <div className="absolute bottom-0 right-0 w-[280px] rotate-2 sm:w-[300px] rounded-[30px] bg-white p-5 shadow-lift [animation-delay:1.5s]">
              <div className="text-[11px] font-bold uppercase tracking-widest text-ember">Date proposal</div>
              <div className="mt-2 font-display text-[22px] leading-tight">Coffee &amp; dessert at Pine &amp; Pour?</div>
              <div className="mt-3 flex gap-2 text-[12px]">
                <span className="rounded-full bg-sand px-2.5 py-1">Fri · 7:30 PM</span>
                <span className="rounded-full bg-sand px-2.5 py-1">Rajpur Road</span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-2xl bg-ember-soft p-3"><div className="text-[10px] font-semibold text-ember-dark">For her to try</div><div className="text-[13px] font-semibold">☕ Cappuccino</div></div>
                <div className="rounded-2xl bg-plum-soft p-3"><div className="text-[10px] font-semibold text-plum">For him to try</div><div className="text-[13px] font-semibold">🍵 Matcha</div></div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[12px] font-semibold">
                <span className="rounded-full bg-ember py-2 text-white">Accept</span>
                <span className="rounded-full bg-sand py-2">Customize</span>
                <span className="rounded-full bg-sand py-2 text-muted">Not now</span>
              </div>
            </div>

            <div className="absolute left-2 top-[300px] flex flex-col items-start gap-2">
              <div className="flex -space-x-3">
                {[A.kabir, A.zoya, A.meera].map((a, i) => <Avatar key={i} config={a} size={46} ring />)}
              </div>
              <div className="rounded-full bg-ink px-3 py-1.5 text-[11px] font-semibold text-white shadow-card">
                <Lock size={11} className="mr-1 inline" /> Photos hidden
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- How it works ---------------- */}
      <section id="how" className="scroll-mt-20 border-y border-line bg-white">
        <div className="mx-auto max-w-6xl px-5 py-20 md:py-28">
          <div className="max-w-2xl">
            <div className="text-[12px] font-bold uppercase tracking-[0.16em] text-ember">How it works</div>
            <h2 className="mt-3 font-display text-[36px] leading-tight md:text-[48px]">Know the person before you see the person.</h2>
          </div>
          <div className="mt-14 grid gap-5 md:grid-cols-4">
            {[
              { n: '01', icon: Sparkles, t: 'Build your avatar', d: 'An illustrated avatar, your interests, personality and the dates you’d say yes to. Your photos stay private.' },
              { n: '02', icon: HeartHandshake, t: 'Discover by compatibility', d: 'A few thoughtful matches with a clear compatibility indicator and what you share. No swipe deck.' },
              { n: '03', icon: CalendarHeart, t: 'Propose a real date', d: 'Pick a verified venue, a time and something you’d love them to try. They can accept, tweak it, or say “not this time”.' },
              { n: '04', icon: Camera, t: 'Keep the memory', d: 'Photos unlock after your first date. If you both want to continue, Mingleo becomes your shared date diary.' },
            ].map((s) => (
              <div key={s.n} className="rounded-[28px] border border-line bg-cream p-6">
                <div className="flex items-center justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-ember shadow-card"><s.icon size={20} /></span>
                  <span className="font-display text-2xl text-line">{s.n}</span>
                </div>
                <div className="mt-6 text-[18px] font-semibold">{s.t}</div>
                <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- Date proposal ---------------- */}
      <section className="mx-auto grid max-w-6xl items-center gap-14 px-5 py-20 md:grid-cols-2 md:py-28">
        <div className="order-2 md:order-1">
          <div className="rounded-[34px] bg-ink p-6 text-white shadow-lift md:p-8">
            <div className="flex items-center gap-3">
              <Avatar config={A.aarav} size={52} ring />
              <div>
                <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-peach">You&apos;re invited</div>
                <div className="font-display text-xl">Someone has invited you on a Mingleo Date</div>
              </div>
            </div>
            <div className="mt-6 space-y-3">
              {[
                ['Venue', 'The Acoustic Room · Astley Hall'],
                ['When', 'Saturday · 8:00 PM'],
                ['Experience', 'Open mic night'],
                ['Their pick for you', '🍟 Truffle fries'],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3 text-[14px]">
                  <span className="text-white/50">{k}</span>
                  <span className="font-semibold">{v}</span>
                </div>
              ))}
            </div>
            <p className="mt-5 text-[13px] text-white/50">No prices on invitations, ever. The person who books sees the cost, discreetly.</p>
          </div>
        </div>
        <div className="order-1 md:order-2">
          <div className="text-[12px] font-bold uppercase tracking-[0.16em] text-ember">The date proposal</div>
          <h2 className="mt-3 font-display text-[36px] leading-tight md:text-[46px]">Not “hey, want to chat?” <span className="italic text-ink-soft">“Would you like to go on this date?”</span></h2>
          <ul className="mt-8 space-y-4 text-[15px] text-ink-soft">
            {[
              ['A real plan', 'Venue, day, time and the experience, all in one invitation.'],
              ['The Date Token', 'Pick something for them to try. They pick something for you. A little ritual before you even meet.'],
              ['Customize, don’t negotiate', 'They can suggest a different time or place. You confirm. Nobody haggles over money.'],
              ['“Not this time” is fine', 'Declining never blocks anyone, and you never have to explain.'],
            ].map(([t, d]) => (
              <li key={t} className="flex gap-3">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-ember" />
                <span><b className="text-ink">{t}.</b> {d}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------------- Made for Doon ---------------- */}
      <section id="doon" className="scroll-mt-20 border-y border-line bg-white">
        <div className="mx-auto max-w-6xl px-5 py-20 md:py-28">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <div className="text-[12px] font-bold uppercase tracking-[0.16em] text-ember">Made for Doon</div>
              <h2 className="mt-3 font-display text-[36px] leading-tight md:text-[48px]">First dates that feel like Dehradun.</h2>
              <p className="mt-4 text-[17px] text-ink-soft">Cafés, momo spots, open mics and sunrise treks, all from verified local places. Most first dates cost <b className="text-ink">₹300–₹700 for two</b>.</p>
            </div>
            <Link href="/signup" className="inline-flex h-12 items-center gap-2 rounded-full bg-ink px-6 text-[15px] font-semibold text-white hover:bg-ink-soft">
              Find your date <ArrowRight size={16} />
            </Link>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {[
              { e: '☕', t: 'Café hopping', d: 'Rajpur Road', tone: 'from-[#F6C9A8] to-[#E8774A]' },
              { e: '🥟', t: 'Momo crawl', d: 'Paltan Bazaar', tone: 'from-[#F7E1D7] to-[#C95E33]' },
              { e: '🎤', t: 'Open mic night', d: 'Astley Hall', tone: 'from-[#E7E1F7] to-[#4B3B7A]' },
              { e: '🌄', t: 'Sunrise trek', d: 'Maldevta', tone: 'from-[#DDEEE4] to-[#D9A23B]' },
              { e: '🎲', t: 'Board-game night', d: 'Ballupur', tone: 'from-[#FBEFD3] to-[#4B3B7A]' },
              { e: '🏺', t: 'Pottery for two', d: 'Dalanwala', tone: 'from-[#EADCCF] to-[#A7703E]' },
              { e: '🍜', t: 'Ramen & boba', d: 'Vasant Vihar', tone: 'from-[#DDEEE4] to-[#4F8A6A]' },
              { e: '🍲', t: 'Pahadi dinner, valley view', d: 'Sahastradhara Road', tone: 'from-[#FBEFD3] to-[#E8774A]' },
            ].map((x) => (
              <div key={x.t} className="overflow-hidden rounded-3xl border border-line bg-cream">
                <div className={`grid h-24 place-items-center bg-gradient-to-br text-4xl ${x.tone}`}>{x.e}</div>
                <div className="p-4">
                  <div className="font-semibold leading-tight">{x.t}</div>
                  <div className="mt-0.5 flex items-center gap-1 text-[12px] text-muted"><MapPin size={11} /> {x.d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- Couples ---------------- */}
      <section id="couples" className="scroll-mt-20 bg-plum text-white">
        <div className="mx-auto max-w-6xl px-5 py-20 md:py-28">
          <div className="max-w-2xl">
            <div className="text-[12px] font-bold uppercase tracking-[0.16em] text-peach">For couples</div>
            <h2 className="mt-3 font-display text-[36px] leading-tight md:text-[48px]">Already together? Mingleo is for you too.</h2>
            <p className="mt-4 text-[17px] text-white/70">Link your partner and plan better dates, surprises and anniversaries, all saved to a shared timeline.</p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              { icon: Wand2, t: 'Date Lab', d: 'Pick a mood, occasion, cuisine and activity. Get a curated evening at real venues, ready to book.' },
              { icon: Gift, t: 'Surprise My Partner', d: 'Plan everything in secret. Your partner gets the day, the time and one hint. That’s all they need.' },
              { icon: Camera, t: 'Memories', d: 'Every date becomes a memory with photos, notes and the venue, visible only to the two of you.' },
            ].map((c) => (
              <div key={c.t} className="rounded-[28px] border border-white/10 bg-white/5 p-7 backdrop-blur">
                <c.icon size={24} className="text-peach" />
                <div className="mt-5 font-display text-2xl">{c.t}</div>
                <p className="mt-2 text-[14px] leading-relaxed text-white/70">{c.d}</p>
              </div>
            ))}
          </div>
          <Link href="/signup?intent=plan" className="mt-10 inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-[15px] font-semibold text-plum hover:bg-peach">
            Start as a couple <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ---------------- Safety ---------------- */}
      <section id="safety" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-20 md:py-28">
        <div className="grid gap-12 md:grid-cols-[1fr_1.3fr]">
          <div>
            <div className="text-[12px] font-bold uppercase tracking-[0.16em] text-sage">Safety, built in</div>
            <h2 className="mt-3 font-display text-[36px] leading-tight md:text-[46px]">Every first date is at a verified public place in Doon.</h2>
            <p className="mt-4 text-[16px] text-ink-soft">Safety is part of how Mingleo works, not a setting buried in a menu.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { icon: BadgeCheck, t: 'Verified, 18+ only', d: 'Selfie and ID checks before anyone can propose.' },
              { icon: Store, t: 'Verified venues', d: 'Every café, restaurant and studio is checked by our team.' },
              { icon: EyeOff, t: 'Privacy first', d: 'Photos and exact location are never shown in discovery.' },
              { icon: Phone, t: 'Help in one tap', d: 'Emergency call, trusted-contact check-in, report and block from every date.' },
            ].map((s) => (
              <div key={s.t} className="rounded-3xl border border-line bg-white p-6 shadow-card">
                <s.icon size={22} className="text-sage" />
                <div className="mt-4 font-semibold">{s.t}</div>
                <p className="mt-1 text-[14px] text-ink-soft">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- Venues ---------------- */}
      <section className="border-y border-line bg-white">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 md:grid-cols-2 md:py-24">
          <div>
            <div className="text-[12px] font-bold uppercase tracking-[0.16em] text-ember">For cafés, restaurants &amp; studios</div>
            <h2 className="mt-3 font-display text-[36px] leading-tight md:text-[44px]">Be the spot where Doon&apos;s first dates happen.</h2>
            <p className="mt-4 text-[16px] text-ink-soft">Reach Dehradun&apos;s students and young professionals on the evenings they actually go out. List date packages, set your availability, and get booked straight from date proposals, Date Lab and surprises. No upfront fee: you pay a commission only when a booking happens.</p>
            <Link href="/partners" className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-ink px-6 text-[15px] font-semibold text-white hover:bg-ink-soft">
              List your venue <ArrowRight size={16} />
            </Link>
          </div>
          <div className="rounded-[30px] border border-line bg-cream p-6">
            <div className="flex items-center justify-between">
              <div className="font-semibold">Coffee &amp; Dessert Date</div>
              <span className="rounded-full bg-sage-soft px-2.5 py-1 text-[11px] font-semibold text-sage">Live</span>
            </div>
            <div className="mt-2 text-[13px] text-ink-soft">2 handcrafted drinks · 1 dessert to share · Reserved couple table</div>
            <div className="mt-5 grid grid-cols-3 gap-3 text-center">
              {[['Booked', '112'], ['Rating', '4.8'], ['Repeat couples', '34%']].map(([k, v]) => (
                <div key={k} className="rounded-2xl bg-white p-3"><div className="font-display text-2xl">{v}</div><div className="text-[11px] text-muted">{k}</div></div>
              ))}
            </div>
            <div className="mt-4 text-[11px] text-muted">Example package and figures shown for illustration.</div>
          </div>
        </div>
      </section>

      {/* ---------------- Pricing principle ---------------- */}
      <section className="mx-auto max-w-6xl px-5 py-20 md:py-28">
        <div className="text-center">
          <div className="text-[12px] font-bold uppercase tracking-[0.16em] text-ember">Pricing</div>
          <h2 className="mx-auto mt-3 max-w-2xl font-display text-[36px] leading-tight md:text-[46px]">Free to meet. You only pay for the experience.</h2>
        </div>
        <div className="mx-auto mt-12 grid max-w-4xl gap-5 md:grid-cols-3">
          {[
            { t: 'Mingleo', p: 'Free', d: ['Discovery & compatibility', 'Unlimited date proposals', 'Safety toolkit', 'Memories'], hl: false },
            { t: 'Mingleo Plus', p: '₹99/mo', d: ['Everything in Free', 'More Date Lab ideas', 'See who viewed your profile', 'Priority support'], hl: false },
            { t: 'Couple Pass', p: '₹149/mo', d: ['Priority tables', 'Members-only experiences', 'Anniversary perks', 'Unlimited surprises'], hl: true },
          ].map((p) => (
            <div key={p.t} className={`rounded-[28px] p-7 ${p.hl ? 'bg-plum text-white shadow-lift' : 'border border-line bg-white shadow-card'}`}>
              <div className={`text-[13px] font-semibold ${p.hl ? 'text-peach' : 'text-muted'}`}>{p.t}</div>
              <div className="mt-2 font-display text-[34px]">{p.p}</div>
              <ul className={`mt-5 space-y-2 text-[14px] ${p.hl ? 'text-white/80' : 'text-ink-soft'}`}>
                {p.d.map((x) => <li key={x}>✓ {x}</li>)}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-6 text-center text-[13px] text-muted">Date packages are priced by each venue and shown before you book. Most first dates are ₹300–₹700 for two.</p>
      </section>

      {/* ---------------- FAQ ---------------- */}
      <section id="faq" className="scroll-mt-20 border-t border-line bg-white">
        <div className="mx-auto max-w-3xl px-5 py-20 md:py-24">
          <h2 className="font-display text-[34px] md:text-[42px]">Questions</h2>
          <div className="mt-8 divide-y divide-line">
            {[
              ['Where is Mingleo available?', 'We’re launching in Dehradun first, with verified cafés, restaurants and experiences across the city. Want Mingleo in your city? Write to hello@mingleo.app.'],
              ['Who is Mingleo for?', 'Anyone 18+ who’d rather go on a real date than text for weeks. Our first community is Dehradun’s students and young professionals.'],
              ['How much does a date cost?', 'Meeting people is free. Date packages are set by each venue: a chai-and-Maggi date starts around ₹300 for two, and most first dates are ₹300–₹700. The person who books sees the price; invitations never show it.'],
              ['When can I see someone’s photos?', 'After you both agree to a date. Until then you see their avatar, personality, interests and compatibility.'],
              ['Who pays for the date?', 'Whoever books it. The invitation never shows a price, and the payer sees the cost before confirming. You can split it at the venue.'],
              ['What does the compatibility score mean?', 'It’s a friendly indicator based on what you’ve both shared: interests, food, lifestyle and the dates you like. It isn’t a scientific prediction.'],
              ['What happens if I decline a proposal?', 'They see “Not this time”. Nobody is blocked, and you never have to explain.'],
              ['Can couples use Mingleo?', 'Yes. Link your partner to plan dates with Date Lab, organise surprises and keep a shared memory timeline. Couples don’t appear in Discover.'],
              ['Is Mingleo safe?', 'First dates are always at verified public venues. Profiles are verified, and report, block, emergency help and trusted-contact check-ins are one tap away.'],
            ].map(([q, a]) => (
              <details key={q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between text-[16px] font-semibold">
                  {q}
                  <span className="ml-4 text-xl text-muted transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- Final CTA ---------------- */}
      <section className="relative overflow-hidden bg-ink text-white">
        <div className="absolute -left-20 top-0 h-80 w-80 rounded-full bg-ember/25 blur-3xl" />
        <div className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-plum/60 blur-3xl" />
        <div className="relative mx-auto max-w-4xl px-5 py-20 text-center md:py-28">
          <h2 className="font-display text-[38px] leading-tight md:text-[56px]">Mingleo isn&apos;t just where you meet someone.</h2>
          <p className="mt-4 text-[18px] text-white/70">It helps you create the experience that happens next.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/signup" className="inline-flex h-13 items-center gap-2 rounded-full bg-ember px-7 text-[15px] font-semibold text-white hover:bg-ember-dark">Create your profile <ArrowRight size={17} /></Link>
            <Link href="/partners" className="inline-flex h-13 items-center gap-2 rounded-full border border-white/20 px-7 text-[15px] font-semibold text-white hover:bg-white/10"><Ticket size={16} /> List your venue</Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
