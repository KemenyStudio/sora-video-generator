/**
 * Pricing configuration for Sora video generation
 * Prices are per second (direct OpenAI API costs)
 */

export const API_COSTS = {
  'sora-2': {
    '720p': 0.10, // per second (API cost)
    '1080p': 0.10,
  },
  'sora-2-pro': {
    '720p': 0.30, // per second (API cost)
    '1080p': 0.50,
    '1792p': 0.50,
  },
} as const;

export type ModelType = keyof typeof API_COSTS;
export type ResolutionType<M extends ModelType> = keyof typeof API_COSTS[M];

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
  const resKey = resolution as keyof typeof API_COSTS[typeof model];
  const pricePerSecond = API_COSTS[model][resKey] || 0;
  return Number((pricePerSecond * seconds).toFixed(4));
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
    'sora-2 (720p)': `$${API_COSTS['sora-2']['720p'].toFixed(2)} per second`,
    'sora-2-pro (720p)': `$${API_COSTS['sora-2-pro']['720p'].toFixed(2)} per second`,
    'sora-2-pro (1080p+)': `$${API_COSTS['sora-2-pro']['1080p'].toFixed(2)} per second`,
  };
}
