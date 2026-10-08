import type { UspItem } from '@/types/domain'

/** Used when settings.json has no `usps` yet (same as the seed). */
export const DEFAULT_USPS: UspItem[] = [
  {
    "icon": "truck",
    "title": "Hỏa tốc 4h",
    "text": "Nội thành HN & HCM"
  },
  {
    "icon": "shield-check",
    "title": "Bảo hành 12 tháng",
    "text": "1 đổi 1 trong 30 ngày đầu",
    "highlight": true
  },
  {
    "icon": "refresh",
    "title": "Đổi trả 30 ngày",
    "text": "Miễn phí vận chuyển"
  },
  {
    "icon": "play",
    "title": "Review thật",
    "text": "Video từ KOL & khách hàng"
  }
]
