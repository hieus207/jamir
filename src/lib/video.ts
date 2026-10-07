import type { VideoAspect, VideoSource } from '@/types/domain'

export interface ParsedVideo {
  embedUrl?: string
  /** suggested frame (Shorts / TikTok / Reels are vertical) */
  aspect?: VideoAspect
  error?: string
}

/** How admins get a working link for each source (shown under the input). */
export const VIDEO_SOURCES: Record<VideoSource, { label: string; placeholder: string; guide: string[] }> = {
  jamir: {
    label: 'Tải lên',
    placeholder: '/media/... hoặc https://.../video.mp4',
    guide: ['Bấm nút tải lên để chọn file mp4, webm hoặc mov (tối đa 200MB).', 'Hoặc dán link trực tiếp tới file .mp4.'],
  },
  youtube: {
    label: 'YouTube',
    placeholder: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    guide: [
      'Mở video trên YouTube → bấm "Chia sẻ" → "Sao chép".',
      'Nhận các dạng: youtube.com/watch?v=…, youtu.be/…, youtube.com/shorts/… (Shorts tự đặt khung dọc 9:16).',
      'Video phải ở chế độ Công khai hoặc Không công khai, không chọn Riêng tư.',
    ],
  },
  tiktok: {
    label: 'TikTok',
    placeholder: 'https://www.tiktok.com/@tenkenh/video/7234567890123456789',
    guide: [
      'Mở video trên tiktok.com bằng trình duyệt máy tính → copy link trên thanh địa chỉ.',
      'Link đúng có dạng tiktok.com/@ten-kenh/video/<dãy số>.',
      'Link rút gọn vt.tiktok.com / vm.tiktok.com không dùng được: mở link đó trên trình duyệt trước, rồi copy link đầy đủ.',
    ],
  },
  facebook: {
    label: 'Facebook',
    placeholder: 'https://www.facebook.com/tenpage/videos/1234567890',
    guide: [
      'Mở video hoặc reel → bấm "⋯" (hoặc "Chia sẻ") → "Sao chép liên kết".',
      'Nhận các dạng: facebook.com/<trang>/videos/<id>, facebook.com/reel/<id>, facebook.com/watch/?v=<id>, fb.watch/…',
      'Video phải để chế độ Công khai thì mới nhúng được.',
    ],
  },
}

/** Turns a share link into an embeddable player URL. */
export function parseVideoUrl(source: VideoSource, raw: string): ParsedVideo {
  const input = raw.trim()
  if (!input) return {}
  if (source === 'jamir') return {}
  let url: URL
  try {
    url = new URL(input.startsWith('http') ? input : `https://${input}`)
  } catch {
    return { error: 'Link không hợp lệ' }
  }
  const host = url.hostname.replace(/^www\.|^m\./, '')

  if (source === 'youtube') {
    let id: string | null = null
    let aspect: VideoAspect = '16:9'
    if (host === 'youtu.be') id = url.pathname.slice(1)
    else if (host.endsWith('youtube.com')) {
      const [, kind, rest] = url.pathname.split('/')
      if (kind === 'watch') id = url.searchParams.get('v')
      else if (kind === 'shorts') {
        id = rest ?? null
        aspect = '9:16'
      } else if (kind === 'embed' || kind === 'live') id = rest ?? null
    }
    if (!id || !/^[\w-]{6,}$/.test(id)) return { error: 'Không đọc được mã video YouTube trong link này' }
    return { embedUrl: `https://www.youtube.com/embed/${id}?rel=0&playsinline=1`, aspect }
  }

  if (source === 'tiktok') {
    if (host === 'vt.tiktok.com' || host === 'vm.tiktok.com')
      return { error: 'Đây là link rút gọn. Hãy mở nó trên trình duyệt rồi copy link đầy đủ dạng tiktok.com/@…/video/<số>' }
    const m = url.pathname.match(/\/video\/(\d+)/) ?? url.pathname.match(/\/(?:embed(?:\/v2)?|player\/v1)\/(\d+)/)
    if (!host.endsWith('tiktok.com') || !m) return { error: 'Link TikTok cần có dạng tiktok.com/@ten-kenh/video/<dãy số>' }
    return { embedUrl: tiktokPlayer(m[1]!), aspect: '9:16' }
  }

  // facebook
  if (!(host.endsWith('facebook.com') || host === 'fb.watch')) return { error: 'Link phải từ facebook.com hoặc fb.watch' }
  if (host.endsWith('facebook.com') && url.pathname.startsWith('/plugins/video.php')) return { embedUrl: input }
  const isReel = /\/reels?\//.test(url.pathname)
  const ok = host === 'fb.watch' || isReel || /\/videos\//.test(url.pathname) || url.pathname.startsWith('/watch') || url.pathname.startsWith('/share/')
  if (!ok) return { error: 'Không nhận ra link video Facebook. Hãy dùng "Sao chép liên kết" của chính video' }
  return {
    embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(input)}&show_text=false&autoplay=false`,
    aspect: isReel ? '9:16' : '16:9',
  }
}

/** TikTok's official embed player (the old /embed/v2/ endpoint now answers 503 "overload-protect"). */
export const tiktokPlayer = (id: string) => `https://www.tiktok.com/player/v1/${id}?music_info=1&description=1&rel=0`

/** Upgrade embed URLs saved in the old format so existing videos keep playing. */
export function normalizeEmbedUrl(url?: string) {
  if (!url) return url
  const old = url.match(/tiktok\.com\/embed\/(?:v2\/)?(\d+)/)
  return old ? tiktokPlayer(old[1]!) : url
}
