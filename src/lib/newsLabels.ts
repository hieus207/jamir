import type { NewsLabel } from '@/types/domain'

/** Article labels — each has its own color so they stand apart on cards. */
export const NEWS_LABELS: Record<NewsLabel, { text: string; icon: string; className: string }> = {
  popular: { text: 'Nhiều người quan tâm', icon: '👀', className: 'bg-gradient-to-r from-orange-500 to-amber-400 text-white' },
  trending: { text: 'Trending', icon: '📈', className: 'bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white' },
  hot: { text: 'Hot', icon: '🔥', className: 'bg-gradient-to-r from-red-600 to-orange-500 text-white' },
  new: { text: 'Mới', icon: '✨', className: 'bg-emerald-500 text-white' },
  deal: { text: 'Ưu đãi', icon: '🎁', className: 'bg-violet-600 text-white' },
  guide: { text: 'Hướng dẫn', icon: '📘', className: 'bg-sky-600 text-white' },
}

export const NEWS_LABEL_OPTIONS = (Object.keys(NEWS_LABELS) as NewsLabel[]).map((value) => ({
  value,
  label: `${NEWS_LABELS[value].icon} ${NEWS_LABELS[value].text}`,
}))
