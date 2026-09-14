export interface FilterOption {
  slug: string;
  label: string;
}

export const GENRES: FilterOption[] = [
  { slug: "action", label: "Action" },
  { slug: "romance", label: "Romance" },
  { slug: "fantasy", label: "Fantasy" },
  { slug: "adventure", label: "Adventure" },
  { slug: "comedy", label: "Comedy" },
  { slug: "drama", label: "Drama" },
  { slug: "isekai", label: "Isekai" },
  { slug: "martial-arts", label: "Martial Arts" },
  { slug: "mystery", label: "Mystery" },
  { slug: "supernatural", label: "Supernatural" },
  { slug: "psychological", label: "Psychological" },
  { slug: "school-life", label: "School Life" },
  { slug: "sci-fi", label: "Sci-Fi" },
  { slug: "slice-of-life", label: "Slice of Life" },
  { slug: "thriller", label: "Thriller" },
  { slug: "shounen", label: "Shounen" },
  { slug: "seinen", label: "Seinen" },
  { slug: "shoujo", label: "Shoujo" },
  { slug: "horror", label: "Horror" },
  { slug: "historical", label: "Historical" },
  { slug: "harem", label: "Harem" },
  { slug: "sports", label: "Sports" },
  { slug: "tragedy", label: "Tragedy" },
  { slug: "adult", label: "Adult" },
  { slug: "arts", label: "Arts" },
  { slug: "boys-love", label: "Boys' Love" },
  { slug: "crime", label: "Crime" },
  { slug: "demons", label: "Demons" },
  { slug: "drama-supernatural", label: "Drama Supernatural" },
  { slug: "ecchi", label: "Ecchi" },
  { slug: "game", label: "Game" },
  { slug: "gender-bender", label: "Gender Bender" },
  { slug: "girls-love", label: "Girls' Love" },
  { slug: "josei", label: "Josei" },
  { slug: "life", label: "Life" },
  { slug: "magical-girls", label: "Magical Girls" },
  { slug: "martial", label: "Martial" },
  { slug: "mature", label: "Mature" },
  { slug: "mecha", label: "Mecha" },
  { slug: "medical", label: "Medical" },
  { slug: "music", label: "Music" },
  { slug: "philosophical", label: "Philosophical" },
  { slug: "reincarnation", label: "Reincarnation" },
  { slug: "school", label: "School" },
  { slug: "shoujo-ai", label: "Shoujo Ai" },
  { slug: "shounen-ai", label: "Shounen Ai" },
  { slug: "smut", label: "Smut" },
  { slug: "superhero", label: "Superhero" },
  { slug: "wuxia", label: "Wuxia" },
  { slug: "yuri", label: "Yuri" },
];

export const TYPES: FilterOption[] = [
  { slug: "", label: "Semua Tipe" },
  { slug: "manhwa", label: "🇰🇷 Manhwa" },
  { slug: "manga", label: "🇯🇵 Manga" },
  { slug: "manhua", label: "🇨🇳 Manhua" },
];

export const STATUSES: FilterOption[] = [
  { slug: "", label: "Semua Status" },
  { slug: "ongoing", label: "Ongoing" },
  { slug: "completed", label: "Completed" },
];

export const ORDERS: FilterOption[] = [
  { slug: "popular", label: "🔥 Terpopuler" },
  { slug: "update", label: "🕓 Terbaru" },
  { slug: "title", label: "🔤 A–Z" },
  { slug: "titlereverse", label: "🔤 Z–A" },
];
