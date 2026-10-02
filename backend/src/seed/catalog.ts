/**
 * Hand-written demo content for the seed: Dehradun, aimed at a Gen Z (18–27) launch audience.
 * Every venue and business here is fictional; neighbourhoods and landmarks are real.
 * Generated dummy users live in seed.ts.
 */

export interface AvatarConfig {
  skin: string
  hair: 'short' | 'wavy' | 'long' | 'bun' | 'curly' | 'buzz' | 'bob'
  hairColor: string
  bg: [string, string]
  shirt: string
  accessory: 'none' | 'glasses' | 'earrings' | 'beanie'
  beard?: boolean
}
export interface Interest { emoji: string; label: string }
export interface Treat { name: string; emoji: string; note: string }
export interface Package { id: string; name: string; includes: string[]; price: number; duration: string }

export interface Person {
  id: string
  name: string
  age: number
  pronouns: string
  gender: 'woman' | 'man' | 'nonbinary'
  area: string
  distanceKm: number
  avatar: AvatarConfig
  interests: Interest[]
  traits: string[]
  food: string[]
  datePrefs: string[]
  lifestyle: { label: string; value: string }[]
  intention: string
  conversation: string
  about: string
  prompts: { q: string; a: string }[]
  verified: boolean
  favoriteVenue: string
}

export interface Venue {
  id: string
  name: string
  kind: 'cafe' | 'restaurant' | 'activity'
  category: string
  area: string
  distanceKm: number
  rating: number
  reviews: number
  emoji: string
  tone: [string, string]
  ambience: string[]
  treats: Treat[]
  packages: Package[]
  slots: string[]
}

export interface Memory { title: string; venue: string; emoji: string; occasion: string; note: string; tone: [string, string]; rating: number }

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

export const ME_AVATAR: AvatarConfig = { skin: SKINS[2], hair: 'wavy', hairColor: HAIR_COLORS[0], bg: BGS[0], shirt: SHIRTS[0], accessory: 'none', beard: true }

// Keep in sync with frontend/src/lib/constants.ts: compatibility matches on these labels.
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

const I = (...labels: string[]) => labels.map((l) => ALL_INTERESTS.find((i) => i.label === l)!)

export const PEOPLE: Person[] = [
  {
    id: 'ananya',
    name: 'Ananya',
    age: 21,
    pronouns: 'she/her',
    gender: 'woman',
    area: 'Dalanwala',
    distanceKm: 1.8,
    avatar: { skin: SKINS[1], hair: 'long', hairColor: HAIR_COLORS[1], bg: BGS[1], shirt: SHIRTS[3], accessory: 'earrings' },
    interests: I('Café hopping', 'Indie music', 'Mussoorie trips', 'Momos', 'Books'),
    traits: ['Curious', 'Warm', 'Spontaneous', 'Witty'],
    food: ['Café bites', 'Momos & street food', 'Desserts'],
    datePrefs: ['Café hopping', 'Open mic night', 'Sunset spots'],
    lifestyle: [{ label: 'Weekends', value: 'Mussoorie on a whim' }, { label: 'Drinks', value: 'Never' }, { label: 'Mornings', value: 'Yoga, then chai' }, { label: 'Pets', value: 'Dog person' }],
    intention: 'Something long-term',
    conversation: 'Deep talks over small talk',
    about: 'Design student who rates every café on Rajpur Road out of 10 (strictly). Will drag you to Mussoorie for sunset on a whim.',
    prompts: [
      { q: 'A perfect Sunday looks like…', a: 'Bun maska and chai, a slow walk through Dalanwala, then a bookshop until the fog rolls in.' },
      { q: 'I’ll know it’s a good date if…', a: 'We forget to check the time and end up planning a second one.' },
    ],
    verified: true,
    favoriteVenue: 'pine-pour',
  },
  {
    id: 'kabir',
    name: 'Kabir',
    age: 23,
    pronouns: 'he/him',
    gender: 'man',
    area: 'Vasant Vihar',
    distanceKm: 3.1,
    avatar: { skin: SKINS[3], hair: 'short', hairColor: HAIR_COLORS[0], bg: BGS[2], shirt: SHIRTS[5], accessory: 'glasses', beard: true },
    interests: I('Trekking', 'Gaming', 'Photography', 'Board games', 'Cricket'),
    traits: ['Calm', 'Thoughtful', 'Planner', 'Early riser'],
    food: ['Pahadi (Garhwali)', 'Momos & street food', 'North Indian'],
    datePrefs: ['Trek or nature walk', 'Games night', 'Café hopping'],
    lifestyle: [{ label: 'Weekends', value: 'Treks around Doon' }, { label: 'Drinks', value: 'Rarely' }, { label: 'Fitness', value: 'Runs on Rajpur Road' }, { label: 'Pets', value: 'Has a cat named Momo' }],
    intention: 'Something long-term',
    conversation: 'Good listener, terrible puns',
    about: 'Final-year BTech and weekend trek leader. I know every shortcut to Robber’s Cave, and I will beat you at Catan.',
    prompts: [
      { q: 'My most irrational fear…', a: 'Monkeys on the Mussoorie road eyeing my Maggi.' },
      { q: 'Let’s make sure we…', a: 'Order one thing neither of us has tried before.' },
    ],
    verified: true,
    favoriteVenue: 'dice-dosti',
  },
  {
    id: 'zoya',
    name: 'Zoya',
    age: 21,
    pronouns: 'she/her',
    gender: 'woman',
    area: 'Jakhan',
    distanceKm: 3.5,
    avatar: { skin: SKINS[0], hair: 'bob', hairColor: HAIR_COLORS[0], bg: BGS[3], shirt: SHIRTS[1], accessory: 'none' },
    interests: I('Indie music', 'Open mics', 'Art & sketching', 'Thrifting', 'K-dramas'),
    traits: ['Adventurous', 'Witty', 'Night owl', 'Warm'],
    food: ['Korean', 'Desserts', 'Momos & street food'],
    datePrefs: ['Open mic night', 'Something creative', 'Café hopping'],
    lifestyle: [{ label: 'Weekends', value: 'Open mics + thrift stores' }, { label: 'Drinks', value: 'Socially' }, { label: 'Fitness', value: 'Dance classes' }, { label: 'Pets', value: 'Wants a dog' }],
    intention: 'Open to see where it goes',
    conversation: 'Banter first, depth later',
    about: 'Illustration student. I sketch people at open mics (nicely). Looking for someone who claps at the end of films.',
    prompts: [
      { q: 'Best gig I’ve been to…', a: 'An acoustic night at Astley Hall where the whole room sang the last song.' },
      { q: 'Green flag I look for…', a: 'You say thank you to the momo bhaiya.' },
    ],
    verified: true,
    favoriteVenue: 'acoustic-room',
  },
  {
    id: 'ishaan',
    name: 'Ishaan',
    age: 24,
    pronouns: 'he/him',
    gender: 'man',
    area: 'Prem Nagar',
    distanceKm: 7.4,
    avatar: { skin: SKINS[2], hair: 'curly', hairColor: HAIR_COLORS[0], bg: BGS[4], shirt: SHIRTS[2], accessory: 'none' },
    interests: I('Books', 'Trekking', 'Plants', 'Poetry'),
    traits: ['Empathetic', 'Easygoing', 'Curious', 'Homebody'],
    food: ['Pahadi (Garhwali)', 'Vegetarian', 'Maggi & chai'],
    datePrefs: ['Café hopping', 'Trek or nature walk', 'Sunset spots'],
    lifestyle: [{ label: 'Weekends', value: 'Sunrise at Maldevta' }, { label: 'Drinks', value: 'Never' }, { label: 'Fitness', value: 'Trekking' }, { label: 'Pets', value: '14 plants, 0 dead' }],
    intention: 'Something long-term',
    conversation: 'Thoughtful, asks follow-up questions',
    about: 'MA in Hindi literature, part-time poet, full-time plant parent. I’ll recommend you a book and then ask how it made you feel.',
    prompts: [
      { q: 'I geek out on…', a: 'Old Garhwali folk songs and second-hand bookstores in Paltan Bazaar.' },
      { q: 'Together we could…', a: 'Catch a sunrise and then argue about the best Maggi point on the way back.' },
    ],
    verified: false,
    favoriteVenue: 'lantern-house',
  },
  {
    id: 'meera',
    name: 'Meera',
    age: 22,
    pronouns: 'she/her',
    gender: 'woman',
    area: 'Clement Town',
    distanceKm: 6.2,
    avatar: { skin: SKINS[4], hair: 'bun', hairColor: HAIR_COLORS[0], bg: BGS[5], shirt: SHIRTS[4], accessory: 'glasses' },
    interests: I('Cooking', 'Dancing', 'Badminton', 'Content creation'),
    traits: ['Ambitious', 'Spontaneous', 'Warm', 'Witty'],
    food: ['Italian', 'Korean', 'Momos & street food'],
    datePrefs: ['Dinner date', 'Games night', 'Trek or nature walk'],
    lifestyle: [{ label: 'Weekends', value: 'Badminton + brunch' }, { label: 'Drinks', value: 'Socially' }, { label: 'Fitness', value: 'Badminton league' }, { label: 'Pets', value: 'Cat aunt' }],
    intention: 'Open to see where it goes',
    conversation: 'Energetic and direct',
    about: 'Hotel-management student who makes a mean pasta from scratch. Food reels at 2 AM are my love language.',
    prompts: [
      { q: 'Two truths and a lie…', a: 'I’ve trekked to Kedarkantha, I can juggle, I don’t like momos.' },
      { q: 'My love language is…', a: 'Sending you a reel at 1 AM that reminded me of you.' },
    ],
    verified: true,
    favoriteVenue: 'olive-oak',
  },
  {
    id: 'rohan',
    name: 'Rohan',
    age: 20,
    pronouns: 'he/him',
    gender: 'man',
    area: 'Ballupur',
    distanceKm: 4.0,
    avatar: { skin: SKINS[1], hair: 'wavy', hairColor: HAIR_COLORS[2], bg: BGS[0], shirt: SHIRTS[3], accessory: 'beanie' },
    interests: I('Indie music', 'Momos', 'Gaming', 'Road trips'),
    traits: ['Easygoing', 'Night owl', 'Curious', 'Witty'],
    food: ['Momos & street food', 'Korean', 'Desserts'],
    datePrefs: ['Open mic night', 'Games night', 'Momo crawl'],
    lifestyle: [{ label: 'Weekends', value: 'DJ sets + long drives' }, { label: 'Drinks', value: 'Socially' }, { label: 'Fitness', value: 'Cycling' }, { label: 'Pets', value: 'Dog person' }],
    intention: 'New friends first',
    conversation: 'Playful and curious',
    about: 'BCA student and weekend DJ. I know every hidden momo spot in Doon and I’m willing to share (some of) them.',
    prompts: [
      { q: 'The way to win me over…', a: 'Send me a song I haven’t heard yet.' },
      { q: 'Unpopular opinion…', a: 'Cold coffee in December fog. Fight me.' },
    ],
    verified: true,
    favoriteVenue: 'momo-mill',
  },
]

export const VENUES: Venue[] = [
  {
    id: 'pine-pour',
    name: 'Pine & Pour Café',
    kind: 'cafe',
    category: 'Specialty coffee',
    area: 'Rajpur Road',
    distanceKm: 2.0,
    rating: 4.8,
    reviews: 412,
    emoji: '☕',
    tone: ['#F6C9A8', '#E8774A'],
    ambience: ['Cosy corners', 'Acoustic Fridays', 'Mountain-view deck'],
    treats: [
      { name: 'Cappuccino', emoji: '☕', note: 'House roast, velvety microfoam' },
      { name: 'Matcha Latte', emoji: '🍵', note: 'Lightly sweet, oat milk on request' },
      { name: 'Hazelnut Cold Brew', emoji: '🧋', note: 'Cult favourite, even in winter' },
      { name: 'Bun Maska', emoji: '🍞', note: 'Doon-style, extra butter' },
      { name: 'Lemon Tart', emoji: '🍋', note: 'Made every morning' },
    ],
    packages: [
      { id: 'pp-cd', name: 'Coffee & Dessert Date', includes: ['2 handcrafted drinks', '1 dessert to share', 'Reserved couple table'], price: 450, duration: '90 min' },
      { id: 'pp-br', name: 'Slow Brunch Date', includes: ['2 brunch plates', '2 drinks', 'Deck table with a view'], price: 850, duration: '2 hrs' },
    ],
    slots: ['5:00 PM', '6:30 PM', '7:30 PM', '8:30 PM'],
  },
  {
    id: 'lantern-house',
    name: 'Lantern House Café',
    kind: 'cafe',
    category: 'Chai & bakery',
    area: 'Jakhan',
    distanceKm: 3.5,
    rating: 4.7,
    reviews: 268,
    emoji: '🏮',
    tone: ['#FBEFD3', '#D9A23B'],
    ambience: ['Fairy lights', 'Book nook', 'Quiet'],
    treats: [
      { name: 'Kulhad Chai', emoji: '🫖', note: 'Adrak-elaichi, served in clay' },
      { name: 'Masala Maggi', emoji: '🍜', note: 'The hill-station classic' },
      { name: 'Banana Bread', emoji: '🍞', note: 'Warm with salted butter' },
      { name: 'Hot Chocolate', emoji: '🍫', note: 'Thick enough to stand a spoon' },
    ],
    packages: [{ id: 'lh-cm', name: 'Chai, Maggi & Conversation', includes: ['2 kulhad chais', '2 masala Maggi', 'Book-nook table'], price: 300, duration: '75 min' }],
    slots: ['4:30 PM', '6:00 PM', '7:00 PM'],
  },
  {
    id: 'momo-mill',
    name: 'The Momo Mill',
    kind: 'restaurant',
    category: 'Momos & Tibetan',
    area: 'Paltan Bazaar',
    distanceKm: 1.2,
    rating: 4.6,
    reviews: 640,
    emoji: '🥟',
    tone: ['#F7E1D7', '#C95E33'],
    ambience: ['Buzzing', 'Street-side seating', 'Spicy chutney bar'],
    treats: [
      { name: 'Tandoori Momos', emoji: '🥟', note: 'Smoky, charred, addictive' },
      { name: 'Kurkure Momos', emoji: '🔥', note: 'Crunchy outside, juicy inside' },
      { name: 'Thukpa', emoji: '🍜', note: 'For foggy evenings' },
      { name: 'Butter Tea', emoji: '🫖', note: 'Try it once, at least' },
    ],
    packages: [{ id: 'mm-crawl', name: 'Momo Crawl for Two', includes: ['3 momo plates to share', '2 drinks', 'Chutney tasting'], price: 350, duration: '60 min' }],
    slots: ['5:00 PM', '6:30 PM', '8:00 PM'],
  },
  {
    id: 'seoul-steam',
    name: 'Seoul Steam',
    kind: 'cafe',
    category: 'Korean café',
    area: 'Vasant Vihar',
    distanceKm: 3.0,
    rating: 4.7,
    reviews: 389,
    emoji: '🍜',
    tone: ['#DDEEE4', '#4F8A6A'],
    ambience: ['K-pop playlist', 'Photo wall', 'Calm'],
    treats: [
      { name: 'Spicy Ramen', emoji: '🍜', note: 'Choose your heat level' },
      { name: 'Brown Sugar Boba', emoji: '🧋', note: 'Chewy pearls, cold milk' },
      { name: 'Mango Bingsu', emoji: '🍧', note: 'Big enough for two' },
      { name: 'Korean Corn Dog', emoji: '🌭', note: 'Mozzarella pull guaranteed' },
    ],
    packages: [{ id: 'ss-rb', name: 'Ramen & Boba Date', includes: ['2 ramen bowls', '2 boba teas', 'Bingsu to share'], price: 650, duration: '75 min' }],
    slots: ['3:00 PM', '5:00 PM', '6:30 PM'],
  },
  {
    id: 'olive-oak',
    name: 'Olive & Oak Trattoria',
    kind: 'restaurant',
    category: 'Italian',
    area: 'Rajpur Road',
    distanceKm: 2.4,
    rating: 4.6,
    reviews: 530,
    emoji: '🍕',
    tone: ['#F7E1D7', '#C95E33'],
    ambience: ['Candlelit', 'Wood-fired oven', 'Vinyl playlist'],
    treats: [
      { name: 'Wood-fired Margherita', emoji: '🍕', note: 'Blistered crust, fresh basil' },
      { name: 'Truffle Mushroom Pasta', emoji: '🍝', note: 'Creamy and earthy' },
      { name: 'Tiramisu', emoji: '🍮', note: 'House recipe' },
      { name: 'Virgin Mojito', emoji: '🍋', note: 'Fresh mint, lots of lime' },
    ],
    packages: [{ id: 'oo-dn', name: 'Candlelit Dinner for Two', includes: ['2 mains', '1 starter to share', '1 dessert', 'Window table'], price: 1600, duration: '2 hrs' }],
    slots: ['7:00 PM', '8:00 PM', '9:00 PM'],
  },
  {
    id: 'skyline-terrace',
    name: 'Skyline Terrace',
    kind: 'restaurant',
    category: 'Pahadi & North Indian',
    area: 'Sahastradhara Road',
    distanceKm: 5.5,
    rating: 4.7,
    reviews: 377,
    emoji: '🌄',
    tone: ['#FBEFD3', '#E8774A'],
    ambience: ['Rooftop', 'Sunset over the valley', 'Bonfire nights'],
    treats: [
      { name: 'Pahadi Thali', emoji: '🍲', note: 'Kafuli, bhatt ki churkani, mandua roti' },
      { name: 'Aloo ke Gutke', emoji: '🥔', note: 'With jakhiya tadka' },
      { name: 'Jhangora Kheer', emoji: '🍮', note: 'Barnyard-millet kheer' },
      { name: 'Buransh Sharbat', emoji: '🌺', note: 'Rhododendron, straight from the hills' },
    ],
    packages: [{ id: 'st-sd', name: 'Sunset Pahadi Dinner', includes: ['Rooftop table at sunset', 'Pahadi thali for two', 'Buransh welcome drinks'], price: 1800, duration: '2 hrs' }],
    slots: ['6:00 PM', '7:30 PM', '9:00 PM'],
  },
  {
    id: 'clay-kiln',
    name: 'Clay & Kiln Studio',
    kind: 'activity',
    category: 'Pottery',
    area: 'Dalanwala',
    distanceKm: 1.9,
    rating: 4.9,
    reviews: 341,
    emoji: '🏺',
    tone: ['#EADCCF', '#A7703E'],
    ambience: ['Hands-on', 'Music on', 'Beginner friendly'],
    treats: [
      { name: 'Wheel Throwing', emoji: '🏺', note: 'Make a cup for each other' },
      { name: 'Glaze Painting', emoji: '🎨', note: 'Paint the other’s bowl' },
    ],
    packages: [{ id: 'ck-cp', name: 'Couples Pottery Session', includes: ['90-min wheel class', 'Clay & glazes', '2 fired pieces to take home'], price: 1600, duration: '90 min' }],
    slots: ['11:00 AM', '4:00 PM', '6:30 PM'],
  },
  {
    id: 'strike-zone',
    name: 'Strike Zone Arcade',
    kind: 'activity',
    category: 'Bowling & arcade',
    area: 'Rajpur Road',
    distanceKm: 3.3,
    rating: 4.5,
    reviews: 802,
    emoji: '🎳',
    tone: ['#E1ECF8', '#4F7FBF'],
    ambience: ['Retro neon', 'Lively', 'Air hockey'],
    treats: [
      { name: 'Loaded Nachos', emoji: '🧀', note: 'Loser shares, obviously' },
      { name: 'Classic Milkshake', emoji: '🥤', note: 'Oreo or chocolate' },
    ],
    packages: [{ id: 'sz-bw', name: 'Bowling & Arcade Date', includes: ['2 bowling games for two', '20 arcade tokens', '1 snack to share'], price: 900, duration: '90 min' }],
    slots: ['5:00 PM', '7:00 PM', '9:00 PM'],
  },
  {
    id: 'acoustic-room',
    name: 'The Acoustic Room',
    kind: 'activity',
    category: 'Open mics & gigs',
    area: 'Astley Hall',
    distanceKm: 1.5,
    rating: 4.7,
    reviews: 455,
    emoji: '🎤',
    tone: ['#E7E1F7', '#4B3B7A'],
    ambience: ['Indie & acoustic', 'Intimate', 'Poetry nights'],
    treats: [
      { name: 'Mint Mojito (zero-proof)', emoji: '🍹', note: 'Bartender favourite' },
      { name: 'Truffle Fries', emoji: '🍟', note: 'Made for sharing' },
    ],
    packages: [{ id: 'ar-om', name: 'Open Mic Night', includes: ['2 reserved seats near the stage', '2 drinks', '1 sharing plate'], price: 700, duration: '2.5 hrs' }],
    slots: ['8:00 PM', '9:30 PM'],
  },
  {
    id: 'dice-dosti',
    name: 'Dice & Dosti',
    kind: 'cafe',
    category: 'Board-game café',
    area: 'Ballupur',
    distanceKm: 4.0,
    rating: 4.8,
    reviews: 296,
    emoji: '🎲',
    tone: ['#FBEFD3', '#4B3B7A'],
    ambience: ['200+ games', 'Game guides on hand', 'Loud in the best way'],
    treats: [
      { name: 'Cold Coffee', emoji: '🧋', note: 'With a scoop of ice cream' },
      { name: 'Peri-Peri Fries', emoji: '🍟', note: 'Perfect between turns' },
      { name: 'Brownie Sizzler', emoji: '🍫', note: 'Winner’s reward' },
    ],
    packages: [{ id: 'dd-gn', name: 'Board Game Night', includes: ['Unlimited games for 2 hours', '2 drinks', '1 snack to share'], price: 500, duration: '2 hrs' }],
    slots: ['4:00 PM', '6:00 PM', '8:00 PM'],
  },
  {
    id: 'pahadi-kitchen',
    name: 'Pahadi Kitchen Workshop',
    kind: 'activity',
    category: 'Cooking class',
    area: 'Jakhan',
    distanceKm: 3.8,
    rating: 4.8,
    reviews: 154,
    emoji: '🍳',
    tone: ['#F7E1E6', '#C95E33'],
    ambience: ['Hands-on', 'Small group', 'You eat what you make'],
    treats: [{ name: 'Mandua Roti', emoji: '🫓', note: 'Rolled together, eaten warm' }],
    packages: [{ id: 'pk-cook', name: 'Cook Garhwali Together', includes: ['Chef-led class', 'Dinner you cook', 'Recipe cards'], price: 1400, duration: '2.5 hrs' }],
    slots: ['11:00 AM', '6:00 PM'],
  },
  {
    id: 'doon-trails',
    name: 'Doon Trails: Maldevta Sunrise',
    kind: 'activity',
    category: 'Outdoor',
    area: 'Maldevta',
    distanceKm: 14,
    rating: 4.7,
    reviews: 96,
    emoji: '🌄',
    tone: ['#DDEEE4', '#D9A23B'],
    ambience: ['Sunrise', 'Guided', 'Maggi at the top'],
    treats: [{ name: 'Maggi & Chai at the Top', emoji: '🍜', note: 'Earned, not given' }],
    packages: [{ id: 'dt-sr', name: 'Sunrise Trek & Maggi', includes: ['Guided 4-km sunrise trek', 'Maggi & chai at the top', 'Pickup from Raipur'], price: 1000, duration: '4 hrs' }],
    slots: ['5:30 AM'],
  },
]

export const SEED_MEMORIES: Memory[] = [
  { title: 'First Mingleo Date', venue: 'Pine & Pour Café', emoji: '☕', occasion: 'First date', note: 'She picked the matcha for me. I picked the cappuccino for her. We both secretly preferred the other one.', tone: ['#F6C9A8', '#E8774A'], rating: 5 },
  { title: 'Three-Month Anniversary', venue: 'Skyline Terrace', emoji: '🌄', occasion: 'Anniversary', note: 'Sunset over the valley, a pahadi thali and buransh sharbat. The bonfire went out; we didn’t notice.', tone: ['#FBEFD3', '#E8774A'], rating: 5 },
  { title: 'Pottery Date', venue: 'Clay & Kiln Studio', emoji: '🎨', occasion: 'Just because', note: 'Two lopsided cups. Hers says "D", mine says "I". Ours.', tone: ['#EADCCF', '#A7703E'], rating: 4 },
]

/** "Fri, 9 Oct", the label format used across proposals and bookings. */
export const dayLabel = (d: Date) =>
  `${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()]}, ${d.getDate()} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()]}`

/** Bookable days used by tests: the five days starting a week from today. */
export const DAYS = [7, 8, 9, 10, 11].map((n) => dayLabel(new Date(Date.now() + n * 864e5)))
