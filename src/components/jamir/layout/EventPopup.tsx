import { ArrowRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { useActiveEvents, useKolFeed } from '@/hooks/queries'
import type { KolReview, SiteEvent } from '@/types/domain'
import { KolVideoViewer } from '../review/KolVideoViewer'
import { useStoryMode } from '../stories/storyMode'

const today = () => new Date().toISOString().slice(0, 10)
const key = (e: SiteEvent) => `jamir-event-${e.id}`

function seen(e: SiteEvent) {
  try {
    if (e.frequency === 'session') return sessionStorage.getItem(key(e)) === '1'
    const v = localStorage.getItem(key(e))
    return e.frequency === 'once' ? v !== null : v === today()
  } catch {
    return false
  }
}
function markSeen(e: SiteEvent) {
  try {
    if (e.frequency === 'session') sessionStorage.setItem(key(e), '1')
    else localStorage.setItem(key(e), today())
  } catch {
    /* storage blocked: the popup may show again, that's fine */
  }
}

/**
 * Promo popup (admin → Sự kiện): banner + CTA that opens a product, an article,
 * a KOL video or any link. Respects the event's frequency; never on admin/landing pages
 * or while story mode is playing.
 */
export function EventPopup() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const storyActive = useStoryMode((s) => s.active)
  const quiet = pathname.startsWith('/admin') || pathname.startsWith('/lp/') || storyActive
  const { data } = useActiveEvents()
  const [event, setEvent] = useState<SiteEvent | null>(null)
  const [video, setVideo] = useState<KolReview | null>(null)
  const kol = useKolFeed()

  useEffect(() => {
    if (quiet || event || !data?.length) return
    const next = data.find((e) => !seen(e))
    if (!next) return
    const t = setTimeout(() => setEvent(next), 1500)
    return () => clearTimeout(t)
  }, [data, quiet, event])

  const close = () => {
    if (event) markSeen(event)
    setEvent(null)
  }

  const go = () => {
    if (!event) return
    const { type, value } = event.target
    close()
    if (type === 'product') navigate(`/product/${value}`)
    else if (type === 'news') navigate(`/news/${value}`)
    else if (type === 'video') {
      const v = kol.data?.find((x) => x.id === value)
      if (v) setVideo(v)
      else navigate('/explore')
    } else if (/^https?:\/\//.test(value)) window.open(value, '_blank', 'noopener')
    else navigate(value)
  }

  return (
    <>
      <Dialog open={!!event} onOpenChange={(o) => !o && close()}>
        <DialogContent className="max-w-md overflow-hidden p-0">
          {event && (
            <>
              <button type="button" onClick={go} className="block w-full cursor-pointer" aria-label={event.ctaText ?? 'Xem ngay'}>
                <img src={event.image} alt="" className="aspect-[4/3] w-full object-cover" />
              </button>
              <div className="flex flex-col gap-3 p-5">
                <DialogTitle className="text-xl font-extrabold">{event.title}</DialogTitle>
                {event.description && <DialogDescription>{event.description}</DialogDescription>}
                <button
                  type="button"
                  onClick={go}
                  className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-btn bg-brand-gradient font-bold text-white shadow-brand transition-[filter] hover:brightness-110"
                >
                  {event.ctaText || 'Xem ngay'}
                  <ArrowRight className="size-5" aria-hidden="true" />
                </button>
                <button type="button" onClick={close} className="cursor-pointer text-center text-sm text-muted hover:text-ink">
                  Để sau
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      <KolVideoViewer review={video} playlist={video ? [video] : []} onChange={setVideo} onClose={() => setVideo(null)} />
    </>
  )
}
