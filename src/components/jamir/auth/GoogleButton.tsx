import { useEffect, useRef, useState } from 'react'
import { useAuthConfig } from '@/hooks/queries'

interface GoogleId {
  accounts: {
    id: {
      initialize: (o: { client_id: string; callback: (r: { credential: string }) => void; ux_mode?: string }) => void
      renderButton: (el: HTMLElement, o: Record<string, unknown>) => void
    }
  }
}
declare global {
  interface Window {
    google?: GoogleId
  }
}

let gisPromise: Promise<void> | null = null
const loadGis = () =>
  (gisPromise ??= new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://accounts.google.com/gsi/client'
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('gis'))
    document.head.appendChild(s)
  }))

/**
 * "Đăng nhập bằng Google" (Google Identity Services). The client id comes from
 * the server (/auth/config → GOOGLE_CLIENT_ID); without it a disabled button
 * explains that Google login is not configured yet.
 */
export function GoogleButton({ onCredential }: { onCredential: (credential: string) => void }) {
  const { data } = useAuthConfig()
  const ref = useRef<HTMLDivElement>(null)
  const [failed, setFailed] = useState(false)
  const clientId = data?.googleClientId
  const cb = useRef(onCredential)
  cb.current = onCredential

  useEffect(() => {
    if (!clientId || !ref.current) return
    let cancelled = false
    loadGis()
      .then(() => {
        if (cancelled || !ref.current || !window.google) return
        window.google.accounts.id.initialize({ client_id: clientId, callback: (r) => cb.current(r.credential) })
        window.google.accounts.id.renderButton(ref.current, {
          theme: 'outline',
          size: 'large',
          shape: 'pill',
          text: 'continue_with',
          locale: 'vi',
          width: ref.current.offsetWidth || 320,
        })
      })
      .catch(() => setFailed(true))
    return () => {
      cancelled = true
    }
  }, [clientId])

  if (!clientId || failed)
    return (
      <button
        type="button"
        disabled
        title="Chưa cấu hình GOOGLE_CLIENT_ID trên máy chủ"
        className="flex h-11 w-full cursor-not-allowed items-center justify-center gap-2.5 rounded-full border border-line bg-surface text-sm font-semibold text-muted opacity-70"
      >
        <GoogleG />
        Tiếp tục với Google <span className="text-xs font-normal">(chưa cấu hình)</span>
      </button>
    )
  return <div ref={ref} className="flex min-h-11 w-full justify-center" />
}

function GoogleG() {
  return (
    <svg viewBox="0 0 48 48" className="size-5" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  )
}
