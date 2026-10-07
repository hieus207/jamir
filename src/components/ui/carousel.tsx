import useEmblaCarousel, { type UseEmblaCarouselType } from 'embla-carousel-react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  type ComponentProps,
  createContext,
  type KeyboardEvent,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import { cn } from '@/lib/utils'

type CarouselApi = UseEmblaCarouselType[1]
type CarouselOptions = Parameters<typeof useEmblaCarousel>[0]

interface CarouselContextValue {
  viewportRef: UseEmblaCarouselType[0]
  api: CarouselApi
  canPrev: boolean
  canNext: boolean
  scrollPrev: () => void
  scrollNext: () => void
}

const CarouselContext = createContext<CarouselContextValue | null>(null)

function useCarousel() {
  const ctx = useContext(CarouselContext)
  if (!ctx) throw new Error('useCarousel must be used within <Carousel>')
  return ctx
}

/** shadcn-style Embla carousel. */
export function Carousel({
  opts,
  setApi,
  className,
  children,
  ...props
}: ComponentProps<'div'> & { opts?: CarouselOptions; setApi?: (api: CarouselApi) => void }) {
  const [viewportRef, api] = useEmblaCarousel({ align: 'start', containScroll: 'trimSnaps', ...opts })
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)

  const onSelect = useCallback((a: CarouselApi) => {
    if (!a) return
    setCanPrev(a.canScrollPrev())
    setCanNext(a.canScrollNext())
  }, [])

  useEffect(() => {
    if (!api) return
    setApi?.(api)
    onSelect(api)
    api.on('reInit', onSelect).on('select', onSelect)
    return () => {
      api.off('reInit', onSelect).off('select', onSelect)
    }
  }, [api, onSelect, setApi])

  const scrollPrev = useCallback(() => api?.scrollPrev(), [api])
  const scrollNext = useCallback(() => api?.scrollNext(), [api])

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      scrollPrev()
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      scrollNext()
    }
  }

  return (
    <CarouselContext.Provider value={{ viewportRef, api, canPrev, canNext, scrollPrev, scrollNext }}>
      <div
        className={cn('relative', className)}
        role="region"
        aria-roledescription="carousel"
        onKeyDownCapture={onKeyDown}
        {...props}
      >
        {children}
      </div>
    </CarouselContext.Provider>
  )
}

export function CarouselContent({ className, ...props }: ComponentProps<'div'>) {
  const { viewportRef } = useCarousel()
  return (
    <div ref={viewportRef} className="overflow-hidden">
      <div className={cn('-ml-3 flex touch-pan-y', className)} {...props} />
    </div>
  )
}

export function CarouselItem({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      role="group"
      aria-roledescription="slide"
      className={cn('min-w-0 shrink-0 grow-0 basis-full pl-3', className)}
      {...props}
    />
  )
}

const arrow =
  'absolute top-1/2 z-10 hidden size-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-line bg-surface/95 text-ink shadow-card backdrop-blur transition-[opacity,transform,color] hover:text-brand-600 active:scale-95 disabled:pointer-events-none disabled:opacity-0 md:inline-flex'

export function CarouselPrevious({ className, ...props }: ComponentProps<'button'>) {
  const { canPrev, scrollPrev } = useCarousel()
  return (
    <button type="button" aria-label="Trước" disabled={!canPrev} onClick={scrollPrev} className={cn(arrow, '-left-4', className)} {...props}>
      <ChevronLeft className="size-5" />
    </button>
  )
}

export function CarouselNext({ className, ...props }: ComponentProps<'button'>) {
  const { canNext, scrollNext } = useCarousel()
  return (
    <button type="button" aria-label="Tiếp" disabled={!canNext} onClick={scrollNext} className={cn(arrow, '-right-4', className)} {...props}>
      <ChevronRight className="size-5" />
    </button>
  )
}

/** Dot indicator bound to the carousel's selected snap. */
export function CarouselDots({ className }: { className?: string }) {
  const { api } = useCarousel()
  const [selected, setSelected] = useState(0)
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!api) return
    const update = () => {
      setSelected(api.selectedScrollSnap())
      setCount(api.scrollSnapList().length)
    }
    update()
    api.on('select', update).on('reInit', update)
    return () => {
      api.off('select', update).off('reInit', update)
    }
  }, [api])
  if (count <= 1) return null
  return (
    <div className={cn('flex justify-center gap-1.5', className)}>
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          type="button"
          aria-label={`Trang ${i + 1}`}
          aria-current={i === selected}
          onClick={() => api?.scrollTo(i)}
          className={cn(
            'h-1.5 cursor-pointer rounded-full transition-all duration-300',
            i === selected ? 'w-5 bg-brand-600' : 'w-1.5 bg-line hover:bg-subtle',
          )}
        />
      ))}
    </div>
  )
}

export type { CarouselApi }
