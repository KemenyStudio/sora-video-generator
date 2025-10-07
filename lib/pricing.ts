/**
 * Pricing configuration for Sora video generation
 * Prices are 2x the OpenAI API costs
 */

export const API_COSTS = {
  'sora-2': {
    '720p': 0.10, // per minute (API cost)
    '1080p': 0.10,
  },
  'sora-2-pro': {
    '720p': 0.30, // per minute (API cost)
    '1080p': 0.50,
    '1792p': 0.50,
  },
} as const;

export const MARKUP_MULTIPLIER = 2; // 2x markup

// Calculate our prices (2x API cost)
export const OUR_PRICES = {
  'sora-2': {
    '720p': API_COSTS['sora-2']['720p'] * MARKUP_MULTIPLIER,
    '1080p': API_COSTS['sora-2']['1080p'] * MARKUP_MULTIPLIER,
  },
  'sora-2-pro': {
    '720p': API_COSTS['sora-2-pro']['720p'] * MARKUP_MULTIPLIER,
    '1080p': API_COSTS['sora-2-pro']['1080p'] * MARKUP_MULTIPLIER,
    '1792p': API_COSTS['sora-2-pro']['1792p'] * MARKUP_MULTIPLIER,
  },
} as const;

export type ModelType = keyof typeof OUR_PRICES;
export type ResolutionType<M extends ModelType> = keyof typeof OUR_PRICES[M];

// Resolution options with display names
export const RESOLUTIONS = {
  '720p': '1280x720',
  '1080p': '1920x1080',
  '1792p': '1792x1024',
} as const;

// Valid duration options (in seconds)
export const VALID_DURATIONS = [4, 8, 12] as const;
export type Duration = typeof VALID_DURATIONS[number];

/**
 * Calculate cost for a video generation
 */
export function calculateCost(
  model: ModelType,
  resolution: string,
  seconds: Duration
): number {
  const resKey = resolution as keyof typeof OUR_PRICES[typeof model];
  const pricePerMinute = OUR_PRICES[model][resKey] || 0;
  const minutes = seconds / 60;
  return Number((pricePerMinute * minutes).toFixed(4));
}

/**
 * Credit packages for purchase
 */
export const CREDIT_PACKAGES = [
  {
    id: 'starter',
    name: 'Starter',
    credits: 10,
    price: 10, // $10
    bonus: 0,
    popular: false,
  },
  {
    id: 'creator',
    name: 'Creator',
    credits: 30,
    price: 25, // $25 (save $5)
    bonus: 5,
    popular: true,
  },
  {
    id: 'professional',
    name: 'Professional',
    credits: 100,
    price: 75, // $75 (save $25)
    bonus: 25,
    popular: false,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    credits: 300,
    price: 200, // $200 (save $100)
    bonus: 100,
    popular: false,
  },
] as const;

/**
 * Display pricing information
 */
export function getPricingDisplay() {
  return {
    'sora-2 (720p)': `$${OUR_PRICES['sora-2']['720p'].toFixed(2)} per second`,
    'sora-2-pro (720p)': `$${OUR_PRICES['sora-2-pro']['720p'].toFixed(2)} per second`,
    'sora-2-pro (1080p+)': `$${OUR_PRICES['sora-2-pro']['1080p'].toFixed(2)} per second`,
  };
}
