export const METRIC_TONE_CLASSES = {
  amber: {
    icon: 'bg-amber-50 text-amber-600',
    value: 'text-amber-600',
  },
  blue: {
    icon: 'bg-blue-50 text-blue-600',
    value: 'text-blue-600',
  },
  cyan: {
    icon: 'bg-cyan-50 text-cyan-600',
    value: 'text-cyan-600',
  },
  emerald: {
    icon: 'bg-emerald-50 text-emerald-600',
    value: 'text-emerald-600',
  },
  green: {
    icon: 'bg-green-50 text-green-600',
    value: 'text-green-600',
  },
  indigo: {
    icon: 'bg-indigo-50 text-indigo-600',
    value: 'text-indigo-600',
  },
  orange: {
    icon: 'bg-orange-50 text-orange-600',
    value: 'text-orange-600',
  },
  pink: {
    icon: 'bg-pink-50 text-pink-600',
    value: 'text-pink-600',
  },
  purple: {
    icon: 'bg-purple-50 text-purple-600',
    value: 'text-purple-600',
  },
  red: {
    icon: 'bg-red-50 text-red-600',
    value: 'text-red-600',
  },
  rose: {
    icon: 'bg-rose-50 text-rose-600',
    value: 'text-rose-600',
  },
  teal: {
    icon: 'bg-teal-50 text-teal-600',
    value: 'text-teal-600',
  },
} as const;

export type MetricTone = keyof typeof METRIC_TONE_CLASSES;
