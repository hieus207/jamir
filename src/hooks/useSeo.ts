import { useEffect } from 'react'

function setMeta(attr: 'name' | 'property', key: string, value?: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!value) return el?.remove()
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.content = value
}

/**
 * Title / description / canonical while navigating inside the app. The first
 * load of /san-pham, /tin-tuc, /uu-dai pages already comes with these tags
 * from the server (server/src/seo.ts) for crawlers and link previews.
 */
export function useSeo(meta: { title?: string; description?: string; path?: string; image?: string } | null) {
  const { title, description, path, image } = meta ?? {}
  useEffect(() => {
    if (!title) return
    document.title = title
    setMeta('name', 'description', description)
    setMeta('property', 'og:title', title)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:image', image)
    if (path) {
      let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
      if (!link) {
        link = document.createElement('link')
        link.rel = 'canonical'
        document.head.appendChild(link)
      }
      link.href = `${location.origin}${path}`
      setMeta('property', 'og:url', link.href)
    }
  }, [title, description, path, image])
}
