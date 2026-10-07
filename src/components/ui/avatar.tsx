import { Avatar as BaseAvatar } from '@base-ui/react/avatar'
import { cn } from '@/lib/utils'

const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

export function Avatar({ src, name, className }: { src?: string; name: string; className?: string }) {
  return (
    <BaseAvatar.Root
      className={cn(
        'relative inline-flex size-9 shrink-0 select-none items-center justify-center overflow-hidden rounded-full bg-brand-100 align-middle text-xs font-bold text-brand-700',
        className,
      )}
    >
      <BaseAvatar.Fallback className="absolute inset-0 flex items-center justify-center">{initials(name)}</BaseAvatar.Fallback>
      {src && (
        <BaseAvatar.Image
          keepMounted
          src={src}
          alt={name}
          loading="lazy"
          className="absolute inset-0 size-full object-cover data-[error]:invisible data-[loading]:invisible"
        />
      )}
    </BaseAvatar.Root>
  )
}
