export interface QuoteItem {
  quote: string;
  author: string;
  work?: string;
  categories?: string[];
}

export const CURATED_QUOTES: QuoteItem[] = [
  {
    quote: "Always remember, success leaves clues.",
    author: "John Patrick Hickey",
    work: "On The Journey To Achievement",
    categories: ["success", "wisdom", "inspirational"]
  },
  {
    quote: "It never gets easier, you just go faster. Every mile is a step towards greatness.",
    author: "Greg LeMond",
    categories: ["running", "perseverance"]
  },
  {
    quote: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.",
    author: "Will Durant",
    categories: ["discipline", "wisdom"]
  },
  {
    quote: "The miracle isn't that I finished. The miracle is that I had the courage to start.",
    author: "John Bingham",
    categories: ["running", "courage"]
  },
  {
    quote: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    author: "Winston Churchill",
    categories: ["success", "wisdom"]
  },
  {
    quote: "Pain is inevitable. Suffering is optional.",
    author: "Haruki Murakami",
    work: "What I Talk About When I Talk About Running",
    categories: ["running", "wisdom"]
  },
  {
    quote: "Discipline is choosing between what you want now and what you want most.",
    author: "Abraham Lincoln",
    categories: ["discipline", "success"]
  },
  {
    quote: "Consistency is the DNA of mastery.",
    author: "Robin Sharma",
    categories: ["discipline", "success"]
  },
  {
    quote: "The only way to achieve the impossible is to believe it is possible.",
    author: "Charles Kingsleigh",
    categories: ["success", "inspirational"]
  },
  {
    quote: "You don't have to be great to start, but you have to start to be great.",
    author: "Zig Ziglar",
    categories: ["success", "motivation"]
  },
  {
    quote: "If you want to win something, run 100 meters. If you want to experience something, run a marathon.",
    author: "Emil Zatopek",
    categories: ["running", "wisdom"]
  },
  {
    quote: "Energy flows where attention goes.",
    author: "Tony Robbins",
    categories: ["focus", "success"]
  },
  {
    quote: "To give anything less than your best is to sacrifice the gift.",
    author: "Steve Prefontaine",
    categories: ["running", "excellence"]
  },
  {
    quote: "The secret of getting ahead is getting started.",
    author: "Mark Twain",
    categories: ["wisdom", "action"]
  },
  {
    quote: "Success is the sum of small efforts, repeated day in and day out.",
    author: "Robert Collier",
    categories: ["success", "consistency"]
  },
  {
    quote: "Action is the foundational key to all success.",
    author: "Pablo Picasso",
    categories: ["action", "success"]
  },
  {
    quote: "Run when you can, walk if you have to, crawl if you must; just never give up.",
    author: "Dean Karnazes",
    categories: ["running", "perseverance"]
  },
  {
    quote: "The journey of a thousand miles begins with a single step.",
    author: "Lao Tzu",
    categories: ["wisdom", "journey"]
  },
  {
    quote: "It always seems impossible until it's done.",
    author: "Nelson Mandela",
    categories: ["wisdom", "perseverance"]
  },
  {
    quote: "What hurts today makes you stronger tomorrow.",
    author: "Jay Cutler",
    categories: ["strength", "growth"]
  }
];

let lastIndex = -1;

export function getRandomCuratedQuote(): QuoteItem {
  if (CURATED_QUOTES.length <= 1) return CURATED_QUOTES[0];
  let newIndex = Math.floor(Math.random() * CURATED_QUOTES.length);
  while (newIndex === lastIndex) {
    newIndex = Math.floor(Math.random() * CURATED_QUOTES.length);
  }
  lastIndex = newIndex;
  return CURATED_QUOTES[newIndex];
}

/**
 * Fetches a random quote dynamically.
 * 1. Checks API Ninjas if a key is provided (or attempts endpoint)
 * 2. Falls back to DummyJSON random quotes API (free, open, no auth)
 * 3. Falls back to our curated motivational list (offline/error safe)
 */
export async function fetchRandomQuote(): Promise<QuoteItem> {
  const apiKey = (import.meta as any).env?.VITE_API_NINJAS_KEY;

  // 1. Try API Ninjas (as requested by user)
  if (apiKey) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const res = await fetch('https://api.api-ninjas.com/v2/randomquotes?categories=success,wisdom', {
        headers: {
          'X-Api-Key': apiKey,
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0 && data[0].quote) {
          return {
            quote: data[0].quote,
            author: data[0].author || 'Unknown',
            work: data[0].work,
            categories: data[0].categories,
          };
        }
      }
    } catch {
      // Continue to next fallback
    }
  }

  // 2. Try open quotes API without API key requirement
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const res = await fetch('https://dummyjson.com/quotes/random', {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.quote) {
        return {
          quote: data.quote,
          author: data.author || 'Wise Words',
        };
      }
    }
  } catch {
    // Continue to local curated list
  }

  // 3. Guaranteed reliable curated quote
  return getRandomCuratedQuote();
}
