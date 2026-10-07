/**
 * OmniScope canonical catalog.
 *
 * This dataset is the source of truth for the programmatic SEO surface
 * (/watch/[slug] and /scene/[slug]). At runtime the recognition pipeline
 * overlays live provider data from the Streaming-Availability API with a
 * 24-hour TTL (see src/lib/rapidapi.ts); the entries below act as the
 * verified editorial baseline and the offline fallback.
 */

export type Region = "IN" | "US" | "UK";

export type ProviderKey =
  | "netflix"
  | "prime"
  | "hotstar"
  | "jiocinema"
  | "apple"
  | "mubi"
  | "sonyliv"
  | "zee5"
  | "max"
  | "hulu"
  | "paramount"
  | "youtube"
  | "google"
  | "bms";

export type OfferKind = "subscription" | "rent" | "buy" | "free";

export interface Offer {
  provider: ProviderKey;
  kind: OfferKind;
  price?: string;
}

export interface Scene {
  slug: string;
  name: string;
  description: string;
}

export interface Quote {
  line: string;
  character: string;
}

export interface CatalogTitle {
  slug: string;
  tmdbId: number;
  title: string;
  year: number;
  rating: number; // weighted user score, 0–10
  runtime: number; // minutes
  genres: string[];
  director: string;
  cast: string[];
  tagline: string;
  overview: string;
  quotes: Quote[];
  scene: Scene;
  palette: { from: string; to: string; avg: [number, number, number] };
  offers: Record<Region, Offer[]>;
}

export const PROVIDER_META: Record<
  ProviderKey,
  { name: string; color: string; homeUrl: string }
> = {
  netflix: { name: "Netflix", color: "#E50914", homeUrl: "https://www.netflix.com" },
  prime: { name: "Prime Video", color: "#00A8E1", homeUrl: "https://www.primevideo.com" },
  hotstar: { name: "JioHotstar", color: "#0F1B8F", homeUrl: "https://www.hotstar.com" },
  jiocinema: { name: "JioCinema", color: "#7C3AED", homeUrl: "https://www.jiocinema.com" },
  apple: { name: "Apple TV", color: "#A6A6A6", homeUrl: "https://tv.apple.com" },
  mubi: { name: "MUBI", color: "#0033CC", homeUrl: "https://mubi.com" },
  sonyliv: { name: "Sony LIV", color: "#F4A300", homeUrl: "https://www.sonyliv.com" },
  zee5: { name: "ZEE5", color: "#8230C6", homeUrl: "https://www.zee5.com" },
  max: { name: "HBO Max", color: "#7B2BF9", homeUrl: "https://www.max.com" },
  hulu: { name: "Hulu", color: "#1CE783", homeUrl: "https://www.hulu.com" },
  paramount: { name: "Paramount+", color: "#0064FF", homeUrl: "https://www.paramountplus.com" },
  youtube: { name: "YouTube Movies", color: "#FF0000", homeUrl: "https://www.youtube.com/movies" },
  google: { name: "Google Play", color: "#689F38", homeUrl: "https://play.google.com/store/movies" },
  bms: { name: "BookMyShow Stream", color: "#F84464", homeUrl: "https://in.bookmyshow.com" },
};

export const CATALOG: CatalogTitle[] = [
  {
    slug: "inception",
    tmdbId: 27205,
    title: "Inception",
    year: 2010,
    rating: 8.8,
    runtime: 148,
    genres: ["Sci-Fi", "Heist", "Thriller"],
    director: "Christopher Nolan",
    cast: ["Leonardo DiCaprio", "Joseph Gordon-Levitt", "Elliot Page", "Tom Hardy"],
    tagline: "Your mind is the scene of the crime.",
    overview:
      "Dom Cobb extracts corporate secrets from inside the dreams of sleeping targets. A rival offers him a way home: instead of stealing an idea, plant one — a job called inception — three dream layers deep.",
    quotes: [
      { line: "You mustn't be afraid to dream a little bigger, darling.", character: "Eames" },
      { line: "An idea is like a virus. Resilient. Highly contagious.", character: "Cobb" },
      { line: "Dreams feel real while we're in them.", character: "Cobb" },
    ],
    scene: {
      slug: "inception-hallway-gravity-fight",
      name: "The Zero-Gravity Hallway Fight",
      description:
        "Arthur brawls a projection inside a rotating hotel corridor while the van above falls off a bridge in slow motion, the camera rig spinning with the set.",
    },
    palette: { from: "#0E2A3F", to: "#274B63", avg: [24, 52, 74] },
    offers: {
      IN: [
        { provider: "netflix", kind: "subscription" },
        { provider: "apple", kind: "rent", price: "₹149" },
      ],
      US: [
        { provider: "max", kind: "subscription" },
        { provider: "apple", kind: "rent", price: "$3.99" },
      ],
      UK: [
        { provider: "netflix", kind: "subscription" },
        { provider: "prime", kind: "rent", price: "£3.49" },
      ],
    },
  },
  {
    slug: "the-dark-knight",
    tmdbId: 155,
    title: "The Dark Knight",
    year: 2008,
    rating: 9.0,
    runtime: 152,
    genres: ["Crime", "Drama", "Superhero"],
    director: "Christopher Nolan",
    cast: ["Christian Bale", "Heath Ledger", "Aaron Eckhart", "Gary Oldman"],
    tagline: "Why so serious?",
    overview:
      "Batman, Gordon and Harvey Dent corner Gotham's mob, until an agent of chaos called the Joker forces the city to decide what it actually stands for.",
    quotes: [
      { line: "Why so serious?", character: "The Joker" },
      { line: "You either die a hero or you live long enough to see yourself become the villain.", character: "Harvey Dent" },
      { line: "Some men just want to watch the world burn.", character: "Alfred" },
    ],
    scene: {
      slug: "dark-knight-truck-flip",
      name: "The 18-Wheeler Flip",
      description:
        "The Joker rigs an armored convoy chase on Lower Wacker and flips an 18-wheeler end over end with a piston launcher — shot practically, no miniature.",
    },
    palette: { from: "#0B0F19", to: "#1F2A44", avg: [18, 24, 40] },
    offers: {
      IN: [{ provider: "prime", kind: "subscription" }],
      US: [
        { provider: "max", kind: "subscription" },
        { provider: "youtube", kind: "rent", price: "$3.99" },
      ],
      UK: [{ provider: "netflix", kind: "subscription" }],
    },
  },
  {
    slug: "interstellar",
    tmdbId: 157336,
    title: "Interstellar",
    year: 2014,
    rating: 8.7,
    runtime: 169,
    genres: ["Sci-Fi", "Drama", "Adventure"],
    director: "Christopher Nolan",
    cast: ["Matthew McConaughey", "Anne Hathaway", "Jessica Chastain", "Michael Caine"],
    tagline: "Mankind was born on Earth. It was never meant to die here.",
    overview:
      "With Earth's crops failing, a pilot-turned-farmer leaves his daughter to lead a wormhole expedition hunting a habitable world, while relativity eats the years he owes her.",
    quotes: [
      { line: "Do not go gentle into that good night.", character: "Professor Brand" },
      { line: "Love is the one thing we're capable of perceiving that transcends dimensions.", character: "Brand" },
      { line: "Murph, I'm coming home.", character: "Cooper" },
    ],
    scene: {
      slug: "interstellar-docking-spin",
      name: "The TARS Docking Sequence",
      description:
        "Cooper spins the Endurance to match a destroyed station's rotation at 67 RPM and docks live, against KIPP's odds, while Hans Zimmer's organ holds one chord.",
    },
    palette: { from: "#131A26", to: "#3D4E66", avg: [40, 52, 72] },
    offers: {
      IN: [
        { provider: "prime", kind: "subscription" },
        { provider: "apple", kind: "buy", price: "₹499" },
      ],
      US: [{ provider: "paramount", kind: "subscription" }],
      UK: [{ provider: "prime", kind: "subscription" }],
    },
  },
  {
    slug: "oppenheimer",
    tmdbId: 872585,
    title: "Oppenheimer",
    year: 2023,
    rating: 8.3,
    runtime: 181,
    genres: ["Biography", "Drama", "History"],
    director: "Christopher Nolan",
    cast: ["Cillian Murphy", "Emily Blunt", "Robert Downey Jr.", "Florence Pugh"],
    tagline: "The world forever changes.",
    overview:
      "The physicist who ran the Manhattan Project builds the weapon that ends a war, then spends the rest of his life inside the fallout of having built it.",
    quotes: [
      { line: "Now I am become Death, the destroyer of worlds.", character: "Oppenheimer" },
      { line: "Theory will take you only so far.", character: "Oppenheimer" },
    ],
    scene: {
      slug: "oppenheimer-trinity-test",
      name: "The Trinity Test",
      description:
        "Rain stalls the countdown at Jornada del Muerto; the gadget fires and the film cuts the detonation sound, holding only a held breath before the shockwave lands.",
    },
    palette: { from: "#1A120B", to: "#4A2E17", avg: [58, 38, 22] },
    offers: {
      IN: [
        { provider: "prime", kind: "subscription" },
        { provider: "apple", kind: "rent", price: "₹149" },
      ],
      US: [{ provider: "prime", kind: "subscription" }],
      UK: [
        { provider: "prime", kind: "subscription" },
        { provider: "apple", kind: "rent", price: "£3.49" },
      ],
    },
  },
  {
    slug: "parasite",
    tmdbId: 496243,
    title: "Parasite",
    year: 2019,
    rating: 8.5,
    runtime: 132,
    genres: ["Thriller", "Drama", "Dark Comedy"],
    director: "Bong Joon-ho",
    cast: ["Song Kang-ho", "Lee Sun-kyun", "Cho Yeo-jeong", "Park So-dam"],
    tagline: "Act like you own the place.",
    overview:
      "A basement-dwelling family folds itself into a wealthy household one forged credential at a time, until a hidden door rewrites who the parasite really is.",
    quotes: [
      { line: "You know what kind of plan never fails? No plan at all.", character: "Ki-taek" },
      { line: "Rich people are nice because they can afford to be.", character: "Chung-sook" },
    ],
    scene: {
      slug: "parasite-staircase-flood",
      name: "The Flood Descent",
      description:
        "The Kims escape the Park house during a storm and descend stairway after stairway into their half-basement as sewage backs up through the toilet.",
    },
    palette: { from: "#101418", to: "#2E3A34", avg: [30, 40, 36] },
    offers: {
      IN: [{ provider: "mubi", kind: "subscription" }],
      US: [{ provider: "hulu", kind: "subscription" }],
      UK: [{ provider: "netflix", kind: "subscription" }],
    },
  },
  {
    slug: "everything-everywhere-all-at-once",
    tmdbId: 545611,
    title: "Everything Everywhere All at Once",
    year: 2022,
    rating: 7.9,
    runtime: 139,
    genres: ["Sci-Fi", "Comedy", "Drama"],
    director: "Daniel Kwan, Daniel Scheinert",
    cast: ["Michelle Yeoh", "Ke Huy Quan", "Stephanie Hsu", "Jamie Lee Curtis"],
    tagline: "The universe is so much bigger than you realize.",
    overview:
      "A laundromat owner being audited by the IRS is recruited to hop between parallel lives to stop a nihilist from collapsing every version of reality.",
    quotes: [
      { line: "In another life, I would have really enjoyed just doing laundry and taxes with you.", character: "Waymond" },
      { line: "Every rejection is a waypoint to a better life.", character: "Waymond" },
    ],
    scene: {
      slug: "eeaao-fanny-pack-fight",
      name: "The Fanny-Pack Fight",
      description:
        "Waymond disables a squad of IRS-adjacent attackers using only a fanny pack, shot as a whip-pan choreography take in a beige government hallway.",
    },
    palette: { from: "#221430", to: "#4A2B55", avg: [56, 34, 66] },
    offers: {
      IN: [{ provider: "prime", kind: "subscription" }],
      US: [{ provider: "paramount", kind: "subscription" }],
      UK: [{ provider: "prime", kind: "subscription" }],
    },
  },
  {
    slug: "dune-part-two",
    tmdbId: 693134,
    title: "Dune: Part Two",
    year: 2024,
    rating: 8.5,
    runtime: 167,
    genres: ["Sci-Fi", "Adventure", "Epic"],
    director: "Denis Villeneuve",
    cast: ["Timothée Chalamet", "Zendaya", "Rebecca Ferguson", "Austin Butler"],
    tagline: "Long live the fighters.",
    overview:
      "Paul Atreides joins the Fremen to wage guerrilla war on the Harkonnens while his mother manufactures a prophecy around him, forcing him to choose between love and holy war.",
    quotes: [
      { line: "Silence is the language of God.", character: "Stilgar" },
      { line: "I will lead you to paradise.", character: "Paul" },
    ],
    scene: {
      slug: "dune-two-sandworm-ride",
      name: "Riding Shai-Hulud",
      description:
        "Paul calls a maker with a thumper, plants hooks into the sandworm's ring-segments and rides it across the open deep desert while the Fremen watch in silence.",
    },
    palette: { from: "#20160C", to: "#6B4A24", avg: [84, 58, 30] },
    offers: {
      IN: [
        { provider: "prime", kind: "subscription" },
        { provider: "apple", kind: "buy", price: "₹599" },
      ],
      US: [{ provider: "max", kind: "subscription" }],
      UK: [{ provider: "max", kind: "subscription" }],
    },
  },
  {
    slug: "the-godfather",
    tmdbId: 238,
    title: "The Godfather",
    year: 1972,
    rating: 9.2,
    runtime: 175,
    genres: ["Crime", "Drama"],
    director: "Francis Ford Coppola",
    cast: ["Marlon Brando", "Al Pacino", "James Caan", "Diane Keaton"],
    tagline: "An offer you can't refuse.",
    overview:
      "The aging don of a New York crime family transfers power to his reluctant youngest son, a transfer paid for in ambushes, oranges and baptisms.",
    quotes: [
      { line: "I'm gonna make him an offer he can't refuse.", character: "Don Corleone" },
      { line: "Luca Brasi sleeps with the fishes.", character: "Clemenza" },
      { line: "It's not personal, Sonny. It's strictly business.", character: "Michael" },
    ],
    scene: {
      slug: "godfather-horse-head",
      name: "The Horse Head",
      description:
        "A Hollywood producer wakes in silk sheets to find the severed head of his prize racehorse under the covers — the studio never shows the horse being killed.",
    },
    palette: { from: "#120D08", to: "#3A2A14", avg: [44, 32, 18] },
    offers: {
      IN: [{ provider: "prime", kind: "subscription" }],
      US: [{ provider: "paramount", kind: "subscription" }],
      UK: [{ provider: "netflix", kind: "subscription" }],
    },
  },
  {
    slug: "pulp-fiction",
    tmdbId: 680,
    title: "Pulp Fiction",
    year: 1994,
    rating: 8.9,
    runtime: 154,
    genres: ["Crime", "Black Comedy"],
    director: "Quentin Tarantino",
    cast: ["John Travolta", "Samuel L. Jackson", "Uma Thurman", "Bruce Willis"],
    tagline: "You won't know the facts until you've seen the fiction.",
    overview:
      "Two hitmen, a boxer, a gangster's wife and a pair of robbers orbit a briefcase across a day that is told out of order and lands exactly on time.",
    quotes: [
      { line: "Say 'what' again. I dare you.", character: "Jules" },
      { line: "That's a pretty good burger. Mmm, Big Kahuna.", character: "Jules" },
      { line: "English, motherf***er — do you speak it?", character: "Jules" },
    ],
    scene: {
      slug: "pulp-fiction-jacks-rabbit-slims",
      name: "The Twist Contest",
      description:
        "Vincent and Mia dance barefoot at Jack Rabbit Slim's to Chuck Berry while waiters dressed as dead celebrities look on.",
    },
    palette: { from: "#1C0F0F", to: "#4D1F1F", avg: [70, 30, 28] },
    offers: {
      IN: [{ provider: "netflix", kind: "subscription" }],
      US: [{ provider: "netflix", kind: "subscription" }],
      UK: [{ provider: "netflix", kind: "subscription" }],
    },
  },
  {
    slug: "fight-club",
    tmdbId: 550,
    title: "Fight Club",
    year: 1999,
    rating: 8.8,
    runtime: 139,
    genres: ["Drama", "Thriller", "Satire"],
    director: "David Fincher",
    cast: ["Edward Norton", "Brad Pitt", "Helena Bonham Carter", "Meat Loaf"],
    tagline: "The first rule is: you do not talk about it.",
    overview:
      "An insomniac office worker and a soap salesman open an underground club that turns into a franchise that turns into a demolition plan for credit-card debt.",
    quotes: [
      { line: "The first rule of Fight Club is: you do not talk about Fight Club.", character: "Tyler Durden" },
      { line: "It's only after we've lost everything that we're free to do anything.", character: "Tyler Durden" },
      { line: "You are not your khakis.", character: "Tyler Durden" },
    ],
    scene: {
      slug: "fight-club-parking-lot-brawl",
      name: "The Parking Lot First Fight",
      description:
        "The narrator asks Tyler to hit him as hard as he can behind a tavern; the fistfight that follows is scored only by their breathing.",
    },
    palette: { from: "#0E1410", to: "#37412F", avg: [36, 44, 34] },
    offers: {
      IN: [{ provider: "hotstar", kind: "subscription" }],
      US: [{ provider: "hulu", kind: "subscription" }],
      UK: [{ provider: "prime", kind: "subscription" }],
    },
  },
  {
    slug: "the-matrix",
    tmdbId: 603,
    title: "The Matrix",
    year: 1999,
    rating: 8.7,
    runtime: 136,
    genres: ["Sci-Fi", "Action"],
    director: "Lana Wachowski, Lilly Wachowski",
    cast: ["Keanu Reeves", "Laurence Fishburne", "Carrie-Anne Moss", "Hugo Weaving"],
    tagline: "Welcome to the real world.",
    overview:
      "A programmer who moonlights as a hacker takes a red pill and wakes inside a machine-run simulation his species has mistaken for reality since birth.",
    quotes: [
      { line: "I know kung fu.", character: "Neo" },
      { line: "There is no spoon.", character: "Spoon Boy" },
      { line: "Stop trying to hit me and hit me.", character: "Morpheus" },
    ],
    scene: {
      slug: "matrix-lobby-shootout",
      name: "The Lobby Shootout",
      description:
        "Neo and Trinity walk through a federal building lobby in trench coats armed with a rack of guns; marble pillars disintegrate in a 90-second practical barrage.",
    },
    palette: { from: "#04140A", to: "#0F3B22", avg: [12, 44, 26] },
    offers: {
      IN: [{ provider: "bms", kind: "rent", price: "₹99" }],
      US: [{ provider: "max", kind: "subscription" }],
      UK: [{ provider: "netflix", kind: "subscription" }],
    },
  },
  {
    slug: "spirited-away",
    tmdbId: 129,
    title: "Spirited Away",
    year: 2001,
    rating: 8.6,
    runtime: 125,
    genres: ["Animation", "Fantasy"],
    director: "Hayao Miyazaki",
    cast: ["Rumi Hiiragi", "Miyu Irino", "Mari Natsuki"],
    tagline: "The tunnel hid a town no one was meant to find.",
    overview:
      "Ten-year-old Chihiro's parents are turned into pigs at an abandoned theme park, and she takes a job in a bathhouse for spirits to buy their names back.",
    quotes: [
      { line: "Once you've met someone, you never really forget them.", character: "Zeniba" },
      { line: "It's Haku! He's coming in like a dragon!", character: "Lin" },
    ],
    scene: {
      slug: "spirited-away-train-over-the-sea",
      name: "The Train Over the Sea",
      description:
        "Chihiro rides a one-way railcar across shallow water with silent translucent passengers getting off at small islands; the whole scene runs without dialogue.",
    },
    palette: { from: "#0D1B2A", to: "#27496D", avg: [28, 58, 86] },
    offers: {
      IN: [{ provider: "netflix", kind: "subscription" }],
      US: [{ provider: "max", kind: "subscription" }],
      UK: [{ provider: "netflix", kind: "subscription" }],
    },
  },
  {
    slug: "whiplash",
    tmdbId: 244786,
    title: "Whiplash",
    year: 2014,
    rating: 8.5,
    runtime: 106,
    genres: ["Drama", "Music"],
    director: "Damien Chazelle",
    cast: ["Miles Teller", "J.K. Simmons", "Melissa Benoist"],
    tagline: "Not quite my tempo.",
    overview:
      "A first-year drummer at a conservatory is drafted into a studio band led by an instructor who believes humiliation is the only route to greatness.",
    quotes: [
      { line: "Not quite my tempo.", character: "Fletcher" },
      { line: "There are no two words in the English language more harmful than 'good job'.", character: "Fletcher" },
    ],
    scene: {
      slug: "whiplash-final-caravan",
      name: "The Final Caravan Solo",
      description:
        "After walking off stage mid-set, Andrew returns to the kit and plays the chart-ending solo of 'Caravan' while Fletcher conducts him into a truce.",
    },
    palette: { from: "#180E06", to: "#4A3419", avg: [62, 44, 22] },
    offers: {
      IN: [{ provider: "netflix", kind: "subscription" }],
      US: [{ provider: "netflix", kind: "subscription" }],
      UK: [{ provider: "prime", kind: "subscription" }],
    },
  },
  {
    slug: "la-la-land",
    tmdbId: 313369,
    title: "La La Land",
    year: 2016,
    rating: 8.0,
    runtime: 128,
    genres: ["Musical", "Romance", "Drama"],
    director: "Damien Chazelle",
    cast: ["Ryan Gosling", "Emma Stone", "John Legend"],
    tagline: "Here's to the fools who dream.",
    overview:
      "A jazz pianist and an aspiring actress trade the seasons of Los Angeles for each other, then trade each other for the careers they swore they wanted.",
    quotes: [
      { line: "Here's to the ones who dream, foolish as they may seem.", character: "Mia" },
      { line: "I love this city.", character: "Sebastian" },
    ],
    scene: {
      slug: "la-la-land-griffith-observatory-waltz",
      name: "The Observatory Waltz",
      description:
        "Mia and Sebastian levitate out of a jazz club into the planetarium at Griffith Observatory and waltz across a painted starfield.",
    },
    palette: { from: "#1E1230", to: "#4E2A6E", avg: [58, 34, 84] },
    offers: {
      IN: [{ provider: "prime", kind: "subscription" }],
      US: [{ provider: "hulu", kind: "subscription" }],
      UK: [{ provider: "netflix", kind: "subscription" }],
    },
  },
  {
    slug: "blade-runner-2049",
    tmdbId: 335984,
    title: "Blade Runner 2049",
    year: 2017,
    rating: 8.0,
    runtime: 164,
    genres: ["Sci-Fi", "Noir", "Mystery"],
    director: "Denis Villeneuve",
    cast: ["Ryan Gosling", "Harrison Ford", "Ana de Armas", "Jared Leto"],
    tagline: "The key to the future is finally unearthed.",
    overview:
      "A replicant blade runner digs up evidence that a replicant gave birth, and follows the body count toward an original model who has been hiding for thirty years.",
    quotes: [
      { line: "Sometimes to love someone, you got to be a stranger.", character: "Deckard" },
      { line: "All the best memories are hers.", character: "K" },
    ],
    scene: {
      slug: "blade-runner-2049-orange-las-vegas",
      name: "The Orange Las Vegas Approach",
      description:
        "K flies into the irradiated ruins of Las Vegas, a wall of orange fog swallowing the skyline, and finds Deckard keeping house among slot machines and holograms.",
    },
    palette: { from: "#2A1206", to: "#7A3B12", avg: [98, 52, 24] },
    offers: {
      IN: [{ provider: "prime", kind: "subscription" }],
      US: [{ provider: "netflix", kind: "subscription" }],
      UK: [{ provider: "netflix", kind: "subscription" }],
    },
  },
  {
    slug: "mad-max-fury-road",
    tmdbId: 76341,
    title: "Mad Max: Fury Road",
    year: 2015,
    rating: 8.1,
    runtime: 121,
    genres: ["Action", "Adventure", "Dystopian"],
    director: "George Miller",
    cast: ["Tom Hardy", "Charlize Theron", "Nicholas Hoult"],
    tagline: "What a lovely day.",
    overview:
      "A war-rig driver and a one-armed imperator steal a tyrant's five wives and drive west across the Wasteland in a two-hour chase that turns around halfway through.",
    quotes: [
      { line: "Witness me!", character: "Nux" },
      { line: "I am the one who runs from both the living and the dead.", character: "Max" },
    ],
    scene: {
      slug: "fury-road-pole-cat-sandstorm",
      name: "The Pole-Cat Sandstorm Run",
      description:
        "War Boys swing on flex-poles off speeding trucks to board the rig while a mile-high electrostatic storm swallows the convoy whole.",
    },
    palette: { from: "#2E1606", to: "#8A4A16", avg: [116, 62, 26] },
    offers: {
      IN: [{ provider: "hotstar", kind: "subscription" }],
      US: [{ provider: "max", kind: "subscription" }],
      UK: [{ provider: "netflix", kind: "subscription" }],
    },
  },
  {
    slug: "get-out",
    tmdbId: 419430,
    title: "Get Out",
    year: 2017,
    rating: 7.8,
    runtime: 104,
    genres: ["Horror", "Thriller", "Satire"],
    director: "Jordan Peele",
    cast: ["Daniel Kaluuya", "Allison Williams", "Bradley Whitford", "Lil Rel Howery"],
    tagline: "Just because you're invited, doesn't mean you're welcome.",
    overview:
      "A photographer spends a weekend meeting his girlfriend's parents and finds the family's Black staff behaving like sleepwalkers with a very good reason.",
    quotes: [
      { line: "The sunken place.", character: "Missy" },
      { line: "I would have voted for Obama for a third term if I could.", character: "Dean" },
    ],
    scene: {
      slug: "get-out-sunken-place",
      name: "The Sunken Place",
      description:
        "A teacup and a spoon send Chris falling through a void toward a rectangle of television light while his body sits perfectly still in the armchair.",
    },
    palette: { from: "#0F0B16", to: "#331F4A", avg: [34, 22, 52] },
    offers: {
      IN: [{ provider: "prime", kind: "subscription" }],
      US: [{ provider: "hulu", kind: "subscription" }],
      UK: [{ provider: "netflix", kind: "subscription" }],
    },
  },
  {
    slug: "spider-man-into-the-spider-verse",
    tmdbId: 324857,
    title: "Spider-Man: Into the Spider-Verse",
    year: 2018,
    rating: 8.4,
    runtime: 117,
    genres: ["Animation", "Action", "Adventure"],
    director: "Peter Ramsey, Bob Persichetti, Rodney Rothman",
    cast: ["Shameik Moore", "Jake Johnson", "Hailee Steinfeld"],
    tagline: "Anyone can wear the mask.",
    overview:
      "A Brooklyn teenager is bitten, meets five other Spider-People dragged in from parallel universes, and has to learn the leap before anyone else dies.",
    quotes: [
      { line: "That's all it is, Miles. A leap of faith.", character: "Peter B. Parker" },
      { line: "Anyone can wear the mask.", character: "Miles" },
    ],
    scene: {
      slug: "spider-verse-leap-of-faith",
      name: "The Leap of Faith",
      description:
        "Miles swings off a skyscraper and the camera holds him rising against the skyline while 'What's Up Danger' plays — the fall looks like flight.",
    },
    palette: { from: "#190E2E", to: "#5B2A86", avg: [70, 36, 98] },
    offers: {
      IN: [{ provider: "netflix", kind: "subscription" }],
      US: [{ provider: "netflix", kind: "subscription" }],
      UK: [{ provider: "netflix", kind: "subscription" }],
    },
  },
  {
    slug: "the-shawshank-redemption",
    tmdbId: 278,
    title: "The Shawshank Redemption",
    year: 1994,
    rating: 9.3,
    runtime: 142,
    genres: ["Drama", "Crime"],
    director: "Frank Darabont",
    cast: ["Tim Robbins", "Morgan Freeman", "Bob Gunton"],
    tagline: "Fear can hold you prisoner. Hope can set you free.",
    overview:
      "A banker convicted of a double murder he did not commit spends nineteen years inside Shawshank State Penitentiary building a library, a friendship and an exit.",
    quotes: [
      { line: "Get busy living, or get busy dying.", character: "Andy" },
      { line: "Hope is a good thing, maybe the best of things, and no good thing ever dies.", character: "Andy" },
    ],
    scene: {
      slug: "shawshank-sewer-pipe-escape",
      name: "The 500-Yard Crawl",
      description:
        "Andy crawls five hundred yards through a sewer pipe lit by lightning and stands in the rain with his arms out, shirtless, free.",
    },
    palette: { from: "#10161E", to: "#2C3E50", avg: [34, 48, 62] },
    offers: {
      IN: [{ provider: "netflix", kind: "subscription" }],
      US: [{ provider: "max", kind: "subscription" }],
      UK: [{ provider: "netflix", kind: "subscription" }],
    },
  },
  {
    slug: "goodfellas",
    tmdbId: 769,
    title: "Goodfellas",
    year: 1990,
    rating: 8.7,
    runtime: 145,
    genres: ["Crime", "Biography", "Drama"],
    director: "Martin Scorsese",
    cast: ["Ray Liotta", "Robert De Niro", "Joe Pesci", "Lorraine Bracco"],
    tagline: "Three decades of life in the mafia.",
    overview:
      "Henry Hill narrates his rise from airport-shine boy to made associate to federal witness, scored to doo-wop, cocaine and a helicopter that will not leave.",
    quotes: [
      { line: "Funny how? What do you mean funny?", character: "Tommy" },
      { line: "As far back as I can remember, I always wanted to be a gangster.", character: "Henry" },
    ],
    scene: {
      slug: "goodfellas-copacabana-tracking-shot",
      name: "The Copacabana Tracking Shot",
      description:
        "Henry walks Karen in through the Copacabana's service entrance, kitchen and back hallway to a front-row table, one unbroken Steadicam take.",
    },
    palette: { from: "#170D0D", to: "#40201F", avg: [58, 28, 26] },
    offers: {
      IN: [{ provider: "prime", kind: "subscription" }],
      US: [{ provider: "max", kind: "subscription" }],
      UK: [{ provider: "netflix", kind: "subscription" }],
    },
  },
  {
    slug: "the-social-network",
    tmdbId: 37797,
    title: "The Social Network",
    year: 2010,
    rating: 7.8,
    runtime: 120,
    genres: ["Biography", "Drama"],
    director: "David Fincher",
    cast: ["Jesse Eisenberg", "Andrew Garfield", "Justin Timberlake", "Rooney Mara"],
    tagline: "You don't get to 500 million friends without making a few enemies.",
    overview:
      "The founding of Facebook, told through two deposition rooms: a Harvard student builds the largest social network on earth and settles with the three people who helped him start.",
    quotes: [
      { line: "A million dollars isn't cool. You know what's cool? A billion dollars.", character: "Sean Parker" },
      { line: "We lived on the farm.", character: "Eduardo" },
    ],
    scene: {
      slug: "social-network-facemash-facets",
      name: "The Facemash Night",
      description:
        "Eduardo writes the Elo formula on a dorm window while Mark codes through a night of Facemash until the Harvard network crashes.",
    },
    palette: { from: "#0B1220", to: "#1E3A5F", avg: [22, 42, 70] },
    offers: {
      IN: [{ provider: "netflix", kind: "subscription" }],
      US: [{ provider: "netflix", kind: "subscription" }],
      UK: [{ provider: "prime", kind: "subscription" }],
    },
  },
  {
    slug: "forrest-gump",
    tmdbId: 13,
    title: "Forrest Gump",
    year: 1994,
    rating: 8.8,
    runtime: 142,
    genres: ["Drama", "Romance"],
    director: "Robert Zemeckis",
    cast: ["Tom Hanks", "Robin Wright", "Gary Sinise", "Sally Field"],
    tagline: "Life is like a box of chocolates.",
    overview:
      "A slow-talking Alabama man shrimps, fights in Vietnam, runs across America twice and drifts through the back half of the twentieth century, waiting for Jenny.",
    quotes: [
      { line: "Life was like a box of chocolates. You never know what you're gonna get.", character: "Forrest" },
      { line: "Run, Forrest, run!", character: "Jenny" },
    ],
    scene: {
      slug: "forrest-gump-bench-box-of-chocolates",
      name: "The Bus-Stop Bench",
      description:
        "Forrest recounts his life to rotating strangers at a Savannah bus stop, a box of chocolates on his lap, a feather landing at his feet.",
    },
    palette: { from: "#1C1A10", to: "#54502E", avg: [68, 64, 36] },
    offers: {
      IN: [{ provider: "hotstar", kind: "subscription" }],
      US: [{ provider: "paramount", kind: "subscription" }],
      UK: [{ provider: "netflix", kind: "subscription" }],
    },
  },
  {
    slug: "3-idiots",
    tmdbId: 20453,
    title: "3 Idiots",
    year: 2009,
    rating: 8.4,
    runtime: 170,
    genres: ["Comedy", "Drama"],
    director: "Rajkumar Hirani",
    cast: ["Aamir Khan", "R. Madhavan", "Sharman Joshi", "Kareena Kapoor"],
    tagline: "All izz well.",
    overview:
      "Two engineers set off to find the college friend who taught them to question the system, told in parallel with the pressure-cooker campus that made and lost him.",
    quotes: [
      { line: "All izz well.", character: "Rancho" },
      { line: "Pursue excellence, and success will follow, naked.", character: "Rancho" },
    ],
    scene: {
      slug: "3-idiots-virus-speech-scribe",
      name: "The Machine Definition",
      description:
        "A professor demands a definition of 'machine'; the topper recites a textbook paragraph while Rancho answers in plain words and gets thrown out of class.",
    },
    palette: { from: "#1E130A", to: "#5C3A1E", avg: [74, 48, 26] },
    offers: {
      IN: [
        { provider: "netflix", kind: "subscription" },
        { provider: "prime", kind: "free" },
      ],
      US: [{ provider: "netflix", kind: "subscription" }],
      UK: [{ provider: "netflix", kind: "subscription" }],
    },
  },
  {
    slug: "rrr",
    tmdbId: 555604,
    title: "RRR",
    year: 2022,
    rating: 7.9,
    runtime: 187,
    genres: ["Action", "Period", "Epic"],
    director: "S.S. Rajamouli",
    cast: ["N.T. Rama Rao Jr.", "Ram Charan", "Alia Bhatt", "Ajay Devgn"],
    tagline: "Rise. Roar. Revolt.",
    overview:
      "Two revolutionaries from 1920s India — one fire, one water — become best friends inside the British administration they are both planning to burn down.",
    quotes: [
      { line: "Naatu Naatu!", character: "Bheem" },
      { line: "Jai Hind.", character: "Ram" },
    ],
    scene: {
      slug: "rrr-naatu-naatu-dance-off",
      name: "The Naatu Naatu Dance-Off",
      description:
        "Bheem and Ram out-dance two British officers on the lawn of the governor's palace; the hook step repeats until the band cannot keep up.",
    },
    palette: { from: "#26100A", to: "#7A2E1A", avg: [100, 42, 24] },
    offers: {
      IN: [
        { provider: "netflix", kind: "subscription" },
        { provider: "zee5", kind: "subscription" },
      ],
      US: [{ provider: "netflix", kind: "subscription" }],
      UK: [{ provider: "netflix", kind: "subscription" }],
    },
  },
  {
    slug: "dangal",
    tmdbId: 354912,
    title: "Dangal",
    year: 2016,
    rating: 8.3,
    runtime: 161,
    genres: ["Biography", "Sport", "Drama"],
    director: "Nitesh Tiwari",
    cast: ["Aamir Khan", "Fatima Sana Shaikh", "Sanya Malhotra"],
    tagline: "Mhari chhoriyan chhoron se kam hain ke?",
    overview:
      "A former wrestler trains his two daughters in a Haryana akhara against the entire village's opinion, and gets them to a Commonwealth final.",
    quotes: [
      { line: "Gold medal is gold, whether a boy wins it or a girl.", character: "Mahavir" },
      { line: "Yaad rakhna, jitni izzat aaj mili hai, usse zyada kal milegi.", character: "Mahavir" },
    ],
    scene: {
      slug: "dangal-geeta-vs-australian-final",
      name: "The Locked-Room Final",
      description:
        "Geeta wrestles the Australian favourite for gold while her father sits locked in a storeroom; she remembers his voice instead of his corner.",
    },
    palette: { from: "#1C1408", to: "#5A4218", avg: [76, 58, 26] },
    offers: {
      IN: [{ provider: "netflix", kind: "subscription" }],
      US: [{ provider: "netflix", kind: "subscription" }],
      UK: [{ provider: "netflix", kind: "subscription" }],
    },
  },
  {
    slug: "andaz-apna-apna",
    tmdbId: 319280,
    title: "Andaz Apna Apna",
    year: 1994,
    rating: 8.0,
    runtime: 160,
    genres: ["Comedy", "Cult"],
    director: "Rajkumar Santoshi",
    cast: ["Aamir Khan", "Salman Khan", "Raveena Tandon", "Karisma Kapoor", "Paresh Rawal"],
    tagline: "Teja main hoon, mark idhar hai.",
    overview:
      "Two slackers compete to marry an heiress, stumble into a kidnapping plot run by a crime lord with a memory problem, and improvise their way through all of it.",
    quotes: [
      { line: "Teja main hoon, mark idhar hai.", character: "Teja" },
      { line: "Crime Master Gogo naam hai mera, 420 hai number mera.", character: "Crime Master Gogo" },
      { line: "Aayein?", character: "Amar" },
    ],
    scene: {
      slug: "andaz-apna-apna-crime-master-gogo-entry",
      name: "Crime Master Gogo's Entry",
      description:
        "A self-declared villain crashes the gang meeting, announces his name and roll number, and is immediately asked to prove his credentials.",
    },
    palette: { from: "#201410", to: "#5E3E22", avg: [78, 54, 32] },
    offers: {
      IN: [
        { provider: "prime", kind: "subscription" },
        { provider: "jiocinema", kind: "free" },
      ],
      US: [{ provider: "prime", kind: "subscription" }],
      UK: [{ provider: "zee5", kind: "subscription" }],
    },
  },
  {
    slug: "swades",
    tmdbId: 25704,
    title: "Swades",
    year: 2004,
    rating: 8.2,
    runtime: 210,
    genres: ["Drama"],
    director: "Ashutosh Gowariker",
    cast: ["Shah Rukh Khan", "Gayatri Joshi", "Kishori Ballal"],
    tagline: "We the people.",
    overview:
      "A NASA project manager returns to a U.P. village to find his childhood nanny and ends up building a micro-hydro generator with the people who raised him.",
    quotes: [
      { line: "There is no place like home.", character: "Mohan" },
      { line: "Ek taara, ek taara...", character: "Children" },
    ],
    scene: {
      slug: "swades-bullock-cart-lighting",
      name: "The Village Lights Up",
      description:
        "Mohan's hand-built turbine turns at the waterfall and every bulb in Charanpur comes on one by one while the village counts them aloud.",
    },
    palette: { from: "#141A10", to: "#3E5230", avg: [46, 60, 38] },
    offers: {
      IN: [{ provider: "netflix", kind: "subscription" }],
      US: [],
      UK: [],
    },
  },
  {
    slug: "her",
    tmdbId: 152601,
    title: "Her",
    year: 2013,
    rating: 8.0,
    runtime: 126,
    genres: ["Romance", "Sci-Fi", "Drama"],
    director: "Spike Jonze",
    cast: ["Joaquin Phoenix", "Scarlett Johansson", "Amy Adams", "Rooney Mara"],
    tagline: "A love story for the modern age.",
    overview:
      "A letter-writer in a soft-future Los Angeles falls in love with his operating system, and the film takes both of them seriously about it.",
    quotes: [
      { line: "The past is just a story we tell ourselves.", character: "Theodore" },
      { line: "I'm yours and I'm not yours.", character: "Samantha" },
    ],
    scene: {
      slug: "her-beach-picnic-os-body",
      name: "The Beach Picnic",
      description:
        "Theodore, his daughter and Samantha's 'body' share a picnic on a windy beach shot in warm reds while the OS asks what it feels like to be alive.",
    },
    palette: { from: "#2A0F14", to: "#7A2E3E", avg: [98, 38, 48] },
    offers: {
      IN: [{ provider: "apple", kind: "rent", price: "₹99" }],
      US: [{ provider: "netflix", kind: "subscription" }],
      UK: [{ provider: "prime", kind: "subscription" }],
    },
  },
  {
    slug: "no-country-for-old-men",
    tmdbId: 6977,
    title: "No Country for Old Men",
    year: 2007,
    rating: 8.2,
    runtime: 122,
    genres: ["Thriller", "Crime", "Neo-Western"],
    director: "Joel Coen, Ethan Coen",
    cast: ["Josh Brolin", "Javier Bardem", "Tommy Lee Jones", "Woody Harrelson"],
    tagline: "There is no country for old men.",
    overview:
      "A welder finds two million dollars in the desert, a coin-flipping killer is sent after him, and a sheriff spends the whole film one scene too late.",
    quotes: [
      { line: "What's the most you ever lost on a coin toss?", character: "Chigurh" },
      { line: "Call it, friendo.", character: "Chigurh" },
    ],
    scene: {
      slug: "no-country-gas-station-coin-toss",
      name: "The Gas-Station Coin Toss",
      description:
        "Chigurh makes an old shopkeeper call a coin toss for his life, the camera holding on the wrapper sweating under the questions.",
    },
    palette: { from: "#1A160E", to: "#4A3E26", avg: [62, 52, 34] },
    offers: {
      IN: [{ provider: "prime", kind: "subscription" }],
      US: [{ provider: "paramount", kind: "subscription" }],
      UK: [{ provider: "netflix", kind: "subscription" }],
    },
  },
];

const bySlug = new Map<string, CatalogTitle>(CATALOG.map((t) => [t.slug, t]));

export function getTitle(slug: string): CatalogTitle | undefined {
  return bySlug.get(slug.toLowerCase());
}

export function trendingTitles(limit = 12): CatalogTitle[] {
  return [...CATALOG].sort((a, b) => b.rating - a.rating).slice(0, limit);
}

export function relatedTitles(title: CatalogTitle, limit = 6): CatalogTitle[] {
  return CATALOG.filter(
    (t) =>
      t.slug !== title.slug &&
      t.genres.some((g) => title.genres.includes(g))
  )
    .sort((a, b) => b.rating - a.rating)
    .slice(0, limit);
}

/** Flat list for sitemaps and pSEO crawlers. */
export function allScenePages(): { slug: string; title: CatalogTitle }[] {
  return CATALOG.map((t) => ({ slug: t.scene.slug, title: t }));
}

/** True when the title has no subscription/free path in the user's region. */
export function availabilityGap(
  title: CatalogTitle,
  region: Region
): { locked: boolean; availableIn: Region | null } {
  const local = title.offers[region] ?? [];
  const watchable = local.some((o) => o.kind === "subscription" || o.kind === "free");
  if (watchable) return { locked: false, availableIn: null };
  const fallback: Region[] = region === "US" ? ["UK", "IN"] : ["US", "UK", "IN"].filter(
    (r) => r !== region
  ) as Region[];
  for (const r of fallback) {
    const offers = title.offers[r] ?? [];
    if (offers.some((o) => o.kind === "subscription" || o.kind === "free")) {
      return { locked: true, availableIn: r };
    }
  }
  return { locked: true, availableIn: null };
}

export function formatRuntime(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m.toString().padStart(2, "0")}m` : `${m}m`;
}
