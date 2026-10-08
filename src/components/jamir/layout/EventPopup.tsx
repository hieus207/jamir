import { ArrowRight } from 'lucide-react'
import { type ElementType, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { useActiveEvents, useKolFeed } from '@/hooks/queries'
import { cn } from '@/lib/utils'
import type { KolReview, SiteEvent } from '@/types/domain'
import { KolVideoViewer } from '../review/KolVideoViewer'
import { PosterPopup } from './PosterPopup'
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
  const quiet = pathname.startsWith('/admin') || pathname.startsWith('/uu-dai/') || storyActive
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
    if (type === 'product') navigate(`/san-pham/${value}`)
    else if (type === 'news') navigate(`/tin-tuc/${value}`)
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
        <DialogContent
          className={cn('w-full overflow-y-auto p-0', event?.style === 'poster' || event?.style === 'image' ? 'bg-transparent shadow-none' : '')}
          style={{ maxWidth: event ? `min(${popupWidth(event)}px, 100%)` : undefined }}
        >
          {event?.style === 'image' && (
            <>
              <DialogTitle className="sr-only">{event.title}</DialogTitle>
              <ImageBody event={event} onGo={go} />
            </>
          )}
          {event?.style === 'poster' && (
            <>
              <DialogTitle className="sr-only">{event.title}</DialogTitle>
              <PosterPopup event={event} onGo={go} />
            </>
          )}
          {event && (!event.style || event.style === 'banner') && <BannerBody event={event} onGo={go} onLater={close} Title={DialogTitle} Description={DialogDescription} />}
        </DialogContent>
      </Dialog>
      <KolVideoViewer review={video} playlist={video ? [video] : []} onChange={setVideo} onClose={() => setVideo(null)} />
    </>
  )
}

/** Banner popup content (image + title + CTA), also used by the admin preview. */
export function BannerBody({
  event,
  onGo,
  onLater,
  Title = 'h2',
  Description = 'p',
}: {
  event: SiteEvent
  onGo: () => void
  onLater: () => void
  Title?: ElementType
  Description?: ElementType
}) {
  return (
    <>
      <button type="button" onClick={onGo} className="block w-full cursor-pointer" aria-label={event.ctaText ?? 'Xem ngay'}>
        {event.image ? <img src={event.image} alt="" className="aspect-[16/10] w-full object-cover" /> : <span className="block aspect-[16/10] w-full bg-line-soft" />}
      </button>
      <div className="flex flex-col gap-3 p-5 md:p-7">
        <Title className="text-2xl font-extrabold text-ink md:text-3xl">{event.title}</Title>
        {event.description && <Description className="text-sm text-muted">{event.description}</Description>}
        <button
          type="button"
          onClick={onGo}
          className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-btn bg-brand-gradient font-bold text-white shadow-brand transition-[filter] hover:brightness-110"
        >
          {event.ctaText || 'Xem ngay'}
          <ArrowRight className="size-5" aria-hidden="true" />
        </button>
        <button type="button" onClick={onLater} className="cursor-pointer text-center text-sm text-muted hover:text-ink">
          Để sau
        </button>
      </div>
    </>
  )
}

/** Default width per style; the admin can override it. */
export const popupWidth = (e: SiteEvent) => (e.width && e.width >= 240 ? e.width : e.style === 'poster' ? 500 : e.style === 'image' ? 560 : 720)

/** A banner designed elsewhere: the whole image is the button. */
export function ImageBody({ event, onGo }: { event: SiteEvent; onGo: () => void }) {
  return (
    <button type="button" onClick={onGo} aria-label={event.ctaText || event.title} className="block w-full cursor-pointer overflow-hidden rounded-[18px] shadow-2xl">
      {event.image ? <img src={event.image} alt={event.title} className="block h-auto w-full" /> : <span className="block aspect-[3/4] w-full bg-line-soft" />}
    </button>
  )
}
