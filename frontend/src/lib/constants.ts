import type { AvatarConfig, Interest } from './types'

/** UI constants shared across the app (pickers, avatar options, labels). */

export const SKINS = ['#F6D7C3', '#EBC1A0', '#D9A27C', '#B97D57', '#8E5A3C', '#5E3A26']
export const HAIR_COLORS = ['#1F1A1C', '#3B2A22', '#6B4429', '#A7703E', '#D9B47A', '#8C6BB0']
export const BGS: [string, string][] = [
  ['#FDE3D3', '#F6C9A8'],
  ['#E7E1F7', '#C9BDF0'],
  ['#DDEEE4', '#B7D9C5'],
  ['#FBEFD3', '#F2D49A'],
  ['#E1ECF8', '#BBD2EE'],
  ['#F7E1E6', '#EDC2CC'],
]
export const SHIRTS = ['#1E1B2E', '#E8774A', '#4B3B7A', '#4F8A6A', '#D9A23B', '#4F7FBF', '#F4EDE4']

export const ME_AVATAR: AvatarConfig = {
  skin: SKINS[2],
  hair: 'wavy',
  hairColor: HAIR_COLORS[0],
  bg: BGS[0],
  shirt: SHIRTS[0],
  accessory: 'none',
}

// Keep in sync with backend/src/seed/catalog.ts: compatibility matches on these labels.
export const ALL_INTERESTS: Interest[] = [
  { emoji: '☕', label: 'Café hopping' },
  { emoji: '🥟', label: 'Momos' },
  { emoji: '🎵', label: 'Indie music' },
  { emoji: '🎤', label: 'Open mics' },
  { emoji: '🏔️', label: 'Mussoorie trips' },
  { emoji: '🥾', label: 'Trekking' },
  { emoji: '🛵', label: 'Road trips' },
  { emoji: '📷', label: 'Photography' },
  { emoji: '🎬', label: 'Films' },
  { emoji: '📺', label: 'K-dramas' },
  { emoji: '🍥', label: 'Anime' },
  { emoji: '🎮', label: 'Gaming' },
  { emoji: '🛍️', label: 'Thrifting' },
  { emoji: '🎨', label: 'Art & sketching' },
  { emoji: '📚', label: 'Books' },
  { emoji: '✍️', label: 'Poetry' },
  { emoji: '📱', label: 'Content creation' },
  { emoji: '🎸', label: 'Guitar' },
  { emoji: '💃', label: 'Dancing' },
  { emoji: '🏋️', label: 'Gym' },
  { emoji: '🏸', label: 'Badminton' },
  { emoji: '🏏', label: 'Cricket' },
  { emoji: '🧘', label: 'Yoga' },
  { emoji: '🎲', label: 'Board games' },
  { emoji: '🍳', label: 'Cooking' },
  { emoji: '🐶', label: 'Dogs' },
  { emoji: '🌿', label: 'Plants' },
  { emoji: '🌄', label: 'Sunrises' },
]

export const TRAITS = [
  'Curious', 'Calm', 'Spontaneous', 'Thoughtful', 'Witty', 'Warm', 'Ambitious',
  'Easygoing', 'Adventurous', 'Homebody', 'Planner', 'Night owl', 'Early riser', 'Empathetic',
]

export const FOODS = ['Momos & street food', 'Maggi & chai', 'Café bites', 'Pahadi (Garhwali)', 'Korean', 'Italian', 'North Indian', 'Desserts', 'Vegetarian', 'Vegan']
export const DATE_STYLES = ['Café hopping', 'Momo crawl', 'Open mic night', 'Something creative', 'Sunset spots', 'Trek or nature walk', 'Games night', 'Dinner date']
export const INTENTIONS = ['Something long-term', 'Open to see where it goes', 'New friends first', 'Not sure yet']

export const COMPAT_LABELS: Record<string, { label: string; blurb: string }> = {
  personality: { label: 'Personality', blurb: 'How your energies and temperaments line up' },
  interests: { label: 'Interests', blurb: 'Things you both genuinely enjoy' },
  food: { label: 'Food', blurb: 'Tastes, cuisines and café habits' },
  lifestyle: { label: 'Lifestyle', blurb: 'Routines, weekends and pace of life' },
  datePrefs: { label: 'Date preferences', blurb: 'The kind of plans you both say yes to' },
  conversation: { label: 'Conversation style', blurb: 'How you like to talk and listen' },
}

/** "Fri, 9 Oct" — the label format used across proposals and bookings (parsed by the API). */
export const dayLabel = (d: Date) =>
  `${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()]}, ${d.getDate()} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()]}`

const inDays = (n: number) => new Date(Date.now() + n * 864e5)

/** Bookable days shown in pickers: the five days starting a week from today. */
/** Bookable days for pickers: tomorrow onwards. */
export const upcomingDays = (count = 12, from = 1) => Array.from({ length: count }, (_, i) => dayLabel(inDays(from + i)))

export const OCCASIONS = [
  { id: 'regular', label: 'Regular date', emoji: '🗓️' },
  { id: 'birthday', label: 'Birthday', emoji: '🎂' },
  { id: 'anniversary', label: 'Anniversary', emoji: '💍' },
  { id: 'first-anniv', label: 'First-date anniversary', emoji: '☕' },
  { id: 'just-because', label: 'Just because', emoji: '💌' },
]

export const MOODS = [
  { id: 'romantic', label: 'Romantic', emoji: '❤️' },
  { id: 'fun', label: 'Fun', emoji: '🎉' },
  { id: 'relaxing', label: 'Relaxing', emoji: '🌿' },
  { id: 'adventurous', label: 'Adventurous', emoji: '🔥' },
  { id: 'surprise', label: 'Surprise me', emoji: '✨' },
]

// Keys must match FOOD_VENUE / ACTIVITY_VENUE in backend/src/services/experience.ts.
export const CUISINES = [
  { id: 'coffee', label: 'Coffee', emoji: '☕' },
  { id: 'chai', label: 'Chai & Maggi', emoji: '🫖' },
  { id: 'momos', label: 'Momos', emoji: '🥟' },
  { id: 'korean', label: 'Korean', emoji: '🍜' },
  { id: 'italian', label: 'Pizza & pasta', emoji: '🍕' },
  { id: 'pahadi', label: 'Pahadi', emoji: '🍲' },
]

export const ACTIVITIES = [
  { id: 'pottery', label: 'Pottery', emoji: '🏺' },
  { id: 'openmic', label: 'Open mic', emoji: '🎤' },
  { id: 'boardgames', label: 'Board games', emoji: '🎲' },
  { id: 'arcade', label: 'Bowling & arcade', emoji: '🎳' },
  { id: 'cooking', label: 'Cook pahadi', emoji: '🍳' },
  { id: 'trek', label: 'Sunrise trek', emoji: '🌄' },
  { id: 'sunset', label: 'Sunset spot', emoji: '🌅' },
  { id: 'walk', label: 'Evening walk', emoji: '🌳' },
]

// Student-friendly tiers for the Dehradun launch; keep in sync with TIER_RANGE in the backend.
export const TIERS = [
  { id: 'easy', label: 'Easygoing', hint: 'Under ₹500', dots: 1 },
  { id: 'classic', label: 'Classic', hint: '₹500 – ₹1,500', dots: 2 },
  { id: 'special', label: 'Special', hint: '₹1,500 – ₹3,000', dots: 3 },
  { id: 'unforgettable', label: 'Unforgettable', hint: '₹3,000+', dots: 4 },
]

export const GIFTS = [
  { id: 'none', label: 'No gift', emoji: '🙂', price: 0, note: 'The experience is the gift' },
  { id: 'flowers', label: 'Flower bouquet', emoji: '💐', price: 499, note: 'Fresh blooms waiting at the table' },
  { id: 'cake', label: 'Mini celebration cake', emoji: '🎂', price: 549, note: 'With a handwritten topper' },
  { id: 'note', label: 'Handwritten letter', emoji: '💌', price: 99, note: 'We print your words on cotton paper' },
  { id: 'decor', label: 'Table décor', emoji: '🕯️', price: 799, note: 'Candles, fairy lights, the works' },
  { id: 'polaroid', label: 'Polaroid moment', emoji: '📸', price: 299, note: 'Three instant photos to keep' },
]

export const inr = (n: number) => '₹' + n.toLocaleString('en-IN')
