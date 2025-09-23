export const DEFAULT_BET_CATEGORIES = [
  {
    title: 'First Dance Song Genre',
    description: 'What genre will the couple\'s first dance song be?',
    options: ['Love Ballad', 'Classic Rock', 'Pop Hit', 'Country Song', 'R&B/Soul', 'Other'],
    points: 10,
  },
  {
    title: 'Who Will Cry First?',
    description: 'Who will be the first to shed tears during the ceremony?',
    options: ['Bride', 'Groom', 'Mother of Bride', 'Mother of Groom', 'Father of Bride', 'Someone Else'],
    points: 15,
  },
  {
    title: 'Bouquet Catch',
    description: 'Who will catch the bouquet?',
    options: ['Single Friend', 'Married Friend', 'Family Member', 'Child', 'Bride\'s Sister', 'No One'],
    points: 20,
  },
  {
    title: 'Best Man Speech Duration',
    description: 'How long will the best man\'s speech be?',
    options: ['Under 2 minutes', '2-5 minutes', '5-8 minutes', '8-10 minutes', 'Over 10 minutes'],
    points: 10,
  },
  {
    title: 'Wedding Cake Flavors',
    description: 'How many different cake flavors will there be?',
    options: ['1 flavor', '2 flavors', '3 flavors', '4+ flavors'],
    points: 12,
  },
  {
    title: 'First Dance Disaster',
    description: 'Will there be any mishaps during the first dance?',
    options: ['Perfect execution', 'Minor stumble', 'Someone steps on dress', 'Music issues', 'Major disaster'],
    points: 25,
  },
  {
    title: 'Weather Surprise',
    description: 'What will be the biggest weather-related surprise?',
    options: ['Perfect weather', 'Light rain', 'Heavy rain', 'Unexpected sunshine', 'Wind issues', 'Temperature surprise'],
    points: 18,
  },
  {
    title: 'Guest Count Accuracy',
    description: 'How close will the actual guest count be to the planned number?',
    options: ['Exact match', 'Within 5', 'Within 10', 'Within 20', 'More than 20 off'],
    points: 15,
  },
  {
    title: 'Most Emotional Moment',
    description: 'What will be the most emotional part of the ceremony?',
    options: ['Vows', 'Ring exchange', 'First kiss', 'Walking down aisle', 'Parent moments', 'Surprise element'],
    points: 14,
  },
  {
    title: 'Reception Dance Floor',
    description: 'When will the dance floor be most crowded?',
    options: ['During first dance', 'After dinner', 'During parent dances', 'Late night', 'Never very crowded'],
    points: 11,
  },
];

export const POINT_VALUES = {
  EASY: 5,
  MEDIUM: 10,
  HARD: 15,
  VERY_HARD: 20,
  LEGENDARY: 25,
} as const;

export const BET_STATUSES = {
  OPEN: 'open',
  CLOSED: 'closed',
  SETTLED: 'settled',
} as const;

export const EVENT_STATUSES = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export const COLORS = {
  PRIMARY: '#D4AF37',
  SECONDARY: '#F8F9FA',
  SUCCESS: '#10B981',
  WARNING: '#F59E0B',
  ERROR: '#EF4444',
  INFO: '#3B82F6',
  GRAY_100: '#F3F4F6',
  GRAY_200: '#E5E7EB',
  GRAY_300: '#D1D5DB',
  GRAY_400: '#9CA3AF',
  GRAY_500: '#6B7280',
  GRAY_600: '#4B5563',
  GRAY_700: '#374151',
  GRAY_800: '#1F2937',
  GRAY_900: '#111827',
} as const;