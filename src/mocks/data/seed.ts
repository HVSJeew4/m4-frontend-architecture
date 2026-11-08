// Deterministic seed data for the mock API. A tiny seeded PRNG instead of Faker keeps the mock
// out of the bundle-size budget: the mock runs in the production build too (there is no backend).
import type { Activity, ActivityType, TrendPoint } from '@/types/dashboard';
import type { AppNotification } from '@/types/notification';
import type { User } from '@/types/user';
import { DEMO_ACCOUNTS } from './demoAccounts';

const SEED = 20261108;
const DAY_MS = 24 * 60 * 60 * 1000;
export const TREND_DAYS = 180;
const USER_COUNT = 250;

const FIRST_NAMES = [
  'Amara',
  'Ben',
  'Chen',
  'Dilani',
  'Elena',
  'Farid',
  'Grace',
  'Hiro',
  'Isla',
  'Jonas',
  'Kavya',
  'Liam',
  'Maya',
  'Nikhil',
  'Olivia',
  'Pedro',
  'Qing',
  'Ravi',
  'Sofia',
  'Tariq',
  'Uma',
  'Victor',
  'Wen',
  'Ximena',
  'Yusuf',
  'Zara',
  'Anil',
  'Bianca',
  'Carlos',
  'Dmitri',
];
const LAST_NAMES = [
  'Perera',
  'Smith',
  'Wang',
  'Silva',
  'Garcia',
  'Khan',
  'Mueller',
  'Tanaka',
  'Fernando',
  'Okafor',
  'Nguyen',
  'Rossi',
  'Kowalski',
  'Haddad',
  'Johansson',
  'Mendes',
  'Dubois',
  'Ivanova',
  'Patel',
  'Kim',
];

// mulberry32: small, fast, good enough for fake data, and the same sequence for the same seed.
function createRandom(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface SeedData {
  users: User[];
  trend: TrendPoint[];
  activity: Activity[];
  notifications: AppNotification[];
}

export function createSeed(now = Date.now()): SeedData {
  const random = createRandom(SEED);
  const pick = <T>(items: readonly T[]): T => items[Math.floor(random() * items.length)] as T;
  const isoDaysAgo = (days: number) => new Date(now - days * DAY_MS).toISOString();

  const users: User[] = DEMO_ACCOUNTS.map((account, i) => ({
    id: `u${i + 1}`,
    name: account.name,
    email: account.email,
    role: account.role,
    isActive: true,
    createdAt: isoDaysAgo(400 - i),
    updatedAt: isoDaysAgo(400 - i),
    deletedAt: null,
  }));
  for (let i = users.length; i < USER_COUNT; i += 1) {
    const first = pick(FIRST_NAMES);
    const last = pick(LAST_NAMES);
    const roll = random();
    const createdAt = isoDaysAgo(Math.floor(random() * 365));
    users.push({
      id: `u${i + 1}`,
      name: `${first} ${last}`,
      // The index keeps emails unique even when the same name comes up twice.
      email: `${first}.${last}${i + 1}@example.com`.toLowerCase(),
      role: roll < 0.1 ? 'admin' : roll < 0.3 ? 'editor' : 'user',
      isActive: random() < 0.85,
      createdAt,
      updatedAt: createdAt,
      deletedAt: null,
    });
  }

  // Daily figures, oldest first: slow growth, a weekend dip and some noise.
  const trend: TrendPoint[] = [];
  for (let daysAgo = TREND_DAYS - 1; daysAgo >= 0; daysAgo -= 1) {
    const day = new Date(now - daysAgo * DAY_MS);
    const growth = 1 + (TREND_DAYS - daysAgo) / TREND_DAYS / 2;
    const weekend = day.getUTCDay() === 0 || day.getUTCDay() === 6 ? 0.7 : 1;
    const orders = Math.round(40 * growth * weekend * (0.8 + random() * 0.4));
    trend.push({
      date: day.toISOString().slice(0, 10),
      orders,
      revenueCents: orders * Math.round(4500 + random() * 3000),
      newUsers: Math.round(3 * growth * (0.5 + random())),
    });
  }

  const activityTemplates: { type: ActivityType; text: (name: string) => string }[] = [
    { type: 'user.created', text: (n) => `created user ${n}` },
    { type: 'user.updated', text: (n) => `updated ${n}'s role` },
    { type: 'order.placed', text: (n) => `placed an order for ${n}` },
    { type: 'auth.login', text: () => 'signed in' },
  ];
  const activity: Activity[] = Array.from({ length: 25 }, (_, i) => {
    const template = pick(activityTemplates);
    return {
      id: `a${i + 1}`,
      type: template.type,
      actor: pick(users.slice(0, 2)).name,
      message: template.text(pick(users).name),
      createdAt: isoDaysAgo(i * 0.4 + random() * 0.3),
    };
  });

  const notifications: AppNotification[] = [
    {
      title: 'Weekly report ready',
      message: 'Your weekly metrics report is ready to view.',
      level: 'info',
    },
    { title: 'Revenue milestone', message: 'Revenue passed last month’s total.', level: 'success' },
    {
      title: 'Failed login attempts',
      message: '5 failed sign-ins for user@adminflow.test.',
      level: 'warning',
    },
    {
      title: 'Payment provider error',
      message: 'Two payments failed and will be retried.',
      level: 'error',
    },
    { title: 'New editor added', message: 'Eden Editor now has editor access.', level: 'info' },
    {
      title: 'Maintenance window',
      message: 'Planned maintenance on Sunday 02:00–03:00 UTC.',
      level: 'info',
    },
  ].map((n, i) => ({
    ...n,
    level: n.level as AppNotification['level'],
    id: `n${i + 1}`,
    read: i >= 3,
    createdAt: isoDaysAgo(i * 0.8),
  }));

  return { users, trend, activity, notifications };
}
