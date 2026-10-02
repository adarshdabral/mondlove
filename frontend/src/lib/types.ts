/** Shapes returned by the Mingleo API. */

export type HairStyle = 'short' | 'wavy' | 'long' | 'bun' | 'curly' | 'buzz' | 'bob'
export type Accessory = 'none' | 'glasses' | 'earrings' | 'beanie'

export interface AvatarConfig {
  skin: string
  hair: HairStyle
  hairColor: string
  bg: [string, string]
  shirt: string
  accessory: Accessory
  beard?: boolean
}

export interface Interest {
  emoji: string
  label: string
}

export type CompatKey = 'personality' | 'interests' | 'food' | 'lifestyle' | 'datePrefs' | 'conversation'

export interface Person {
  id: string
  name: string
  age: number
  pronouns?: string
  gender?: 'woman' | 'man' | 'nonbinary'
  area?: string
  distanceKm?: number
  avatar: AvatarConfig
  compat: number | null
  breakdown: Record<CompatKey, number> | null
  sharedLine: string
  interests: Interest[]
  traits: string[]
  food: string[]
  datePrefs: string[]
  lifestyle: { label: string; value: string }[]
  intention?: string
  conversation?: string
  about?: string
  prompts: { q: string; a: string }[]
  verified: boolean
  favoriteVenue?: string
  photos: string[]
  photosLocked: boolean
}

export interface Me extends Person {
  handle: string
  email: string
  role: 'user' | 'partner' | 'admin'
  mode: 'single' | 'couple' | 'both'
  interestedIn: 'women' | 'men' | 'everyone'
  onboarded: boolean
  trustedContact: { name: string; phone: string } | null
  verification?: { status: string; method?: string }
}

export interface MiniPerson {
  id: string
  name: string
  avatar: AvatarConfig
  verified: boolean
}

export interface Treat {
  name: string
  emoji: string
  note?: string
  /** Set by the venue: a photo of the dish or activity. */
  photo?: string
  price?: number
  diet?: 'veg' | 'nonveg' | 'egg'
}

export interface GoodToKnow {
  food?: string[]
  alcohol?: string
  seating?: string[]
  vibe?: string
  payment?: string[]
  parking?: string
  accessibility?: string[]
  amenities?: string[]
  safety?: string[]
  studentDiscount?: number
}

export interface VenuePolicies {
  cancellation?: string
  lateArrival?: string
  houseRules?: string
}

export interface OpeningHours {
  days: string[]
  open: string
  close: string
}

export interface Package {
  id: string
  name: string
  includes: string[]
  price: number
  duration?: string
  days?: string[]
  capacity?: number
  active?: boolean
  emoji?: string
}

export interface Venue {
  id: string
  name: string
  kind: 'cafe' | 'restaurant' | 'activity'
  category: string
  tags?: string[]
  area: string
  distanceKm?: number
  rating: number
  reviews: number
  emoji: string
  tone: [string, string]
  ambience: string[]
  treats: Treat[]
  slots: string[]
  verified: boolean
  featured?: boolean
  packages: Package[]
  description?: string
  address?: string
  landmark?: string
  mapsUrl?: string
  priceForTwo?: number | null
  hours?: OpeningHours | null
  photos?: { url: string; caption?: string }[]
  goodToKnow?: GoodToKnow
  policies?: VenuePolicies
}

export type ProposalStatus = 'sent' | 'customized' | 'confirmed' | 'declined' | 'cancelled'

export interface Proposal {
  id: string
  from: string
  to: string
  role: 'sender' | 'receiver'
  other: MiniPerson
  venueId: string
  packageId: string
  venue: { id: string; name: string; area: string; emoji: string; tone: [string, string]; category: string }
  experienceName: string
  day: string
  time: string
  startsAt: string
  treatForReceiver: Treat | null
  treatForSender: Treat | null
  note: string
  status: ProposalStatus
  myTurn: boolean
  changes: string[]
  bookingId: string | null
  bookingRef: string | null
  createdAt: string
}

export interface Booking {
  id: string
  ref: string
  kind: 'date' | 'lab' | 'surprise' | 'marketplace'
  day: string
  time: string
  startsAt: string
  status: 'pending' | 'confirmed' | 'arrived' | 'completed' | 'cancelled'
  with: MiniPerson[]
  iPlanned: boolean
  myFeedback: { rating: number; continue: string } | null
  secret: boolean
  title: string
  hint?: string
  from?: MiniPerson
  venue?: {
    id: string; name: string; area: string; emoji: string; tone: [string, string]; category: string
    address?: string; landmark?: string; mapsUrl?: string; phone?: string; cover?: string | null; goodToKnow?: GoodToKnow; policies?: VenuePolicies
  }
  experience?: { id: string; name: string; includes: string[]; duration?: string }
  items?: string[]
  treats?: { forReceiver?: Treat; forSender?: Treat }
  gift?: { id: string; label: string; price: number } | null
  message?: string
  price?: number | null
  proposalId?: string | null
}

export interface Memory {
  id: string
  title: string
  venue?: string
  emoji?: string
  tone?: [string, string]
  date?: string
  occasion?: string
  note?: string
  photos: string[]
  rating?: number
}

export interface LabPlan {
  title: string
  tagline: string
  steps: { emoji: string; label: string; venue: string; venueId: string | null; time: string }[]
  price: number
  mood: string
  occasion: string
  bookable: { venueId: string | null; time: string }
  /** True when real venue prices exceed the chosen tier's ceiling. */
  overBudget?: boolean
  tierMax?: number | null
}
