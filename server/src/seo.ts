import { readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import type { IncomingMessage } from 'node:http'
import { config } from './config'
import type { Router } from './http'
import { visibleGifts } from './logic'
import type { Store } from './store'

/**
 * SEO for a client-rendered app: nginx sends /san-pham/*, /tin-tuc/*, /uu-dai/*
 * here; we return the built index.html with real <title>, description,
 * canonical, Open Graph (Facebook / Zalo previews) and JSON-LD injected.
 * The React app then boots as usual.
 */

let cache: { mtime: number; html: string } | null = null
function indexHtml() {
  const file = join(config.siteDir, 'index.html')
  const mtime = statSync(file).mtimeMs
  if (!cache || cache.mtime !== mtime) cache = { mtime, html: readFileSync(file, 'utf8') }
  return cache.html
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
/** headline markup (*red*, [tape], line breaks) → plain text */
const plain = (s: string) => s.replace(/[*[\]]/g, "").replace(/\s+/g, " ").trim()
const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s)

/** Public origin: PUBLIC_URL, else the request's host (works behind nginx / Cloudflare). */
export function origin(req: IncomingMessage) {
  if (config.publicUrl) return config.publicUrl.replace(/\/$/, '')
  const proto = (req.headers['x-forwarded-proto'] as string | undefined)?.split(',')[0] ?? 'http'
  return `${proto}://${req.headers['x-forwarded-host'] ?? req.headers.host ?? 'localhost'}`
}

interface Meta {
  title: string
  description: string
  path: string
  image?: string
  type?: 'website' | 'product' | 'article'
  jsonLd?: object | object[]
  noindex?: boolean
}

function render(html: string, base: string, m: Meta) {
  const abs = (u?: string) => (!u ? undefined : /^https?:\/\//.test(u) ? u : `${base}${u.startsWith('/') ? '' : '/'}${u}`)
  const url = `${base}${m.path}`
  const image = abs(m.image)
  const tags = [
    `<meta name="description" content="${esc(m.description)}">`,
    `<link rel="canonical" href="${esc(url)}">`,
    m.noindex ? '<meta name="robots" content="noindex">' : '',
    `<meta property="og:site_name" content="JAMIR">`,
    `<meta property="og:locale" content="vi_VN">`,
    `<meta property="og:type" content="${m.type === 'article' ? 'article' : m.type === 'product' ? 'product' : 'website'}">`,
    `<meta property="og:title" content="${esc(m.title)}">`,
    `<meta property="og:description" content="${esc(m.description)}">`,
    `<meta property="og:url" content="${esc(url)}">`,
    image ? `<meta property="og:image" content="${esc(image)}">` : '',
    `<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}">`,
    m.jsonLd ? `<script type="application/ld+json">${JSON.stringify(m.jsonLd).replace(/</g, '\\u003c')}</script>` : '',
  ]
    .filter(Boolean)
    .join('\n    ')
  return html
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(m.title)}</title>`)
    .replace(/<meta name="description"[^>]*>\s*/i, '')
    .replace('</head>', `    ${tags}\n  </head>`)
}

export const HOME_TITLE = 'JAMIR | Mua sắm phụ kiện công nghệ qua video'
export const HOME_DESCRIPTION = 'Khám phá phụ kiện công nghệ tại JAMIR qua video thực tế từ KOL, nhà sáng tạo nội dung và khách hàng.'

export function seoRoutes(r: Router, db: Store) {
  const productMeta = async (slug: string, base: string): Promise<Meta | null> => {
    const p = await db.products.find((x) => x.slug === slug)
    if (!p) return null
    const gifts = visibleGifts(p)
    const description = clip(
      `${p.shortDescription} Giá ${p.price.toLocaleString('vi-VN')}đ${p.discount ? ` (giảm ${p.discount}%)` : ''}${gifts.length ? `, tặng ${gifts.map((g) => g.name).join(', ')}` : ''}. ★ ${p.rating.toFixed(1)} từ ${p.reviewCount} đánh giá.`,
      160,
    )
    return {
      title: `${p.name}, giá ${p.price.toLocaleString('vi-VN')}đ | JAMIR`,
      description,
      path: `/san-pham/${p.slug}`,
      image: p.thumbnail,
      type: 'product',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: p.name,
        description: p.shortDescription,
        image: [p.thumbnail, ...p.gallery].map((u) => (/^https?:/.test(u) ? u : `${base}${u}`)),
        brand: { '@type': 'Brand', name: p.brand || 'JAMIR' },
        sku: p.id,
        aggregateRating: p.reviewCount ? { '@type': 'AggregateRating', ratingValue: p.rating, reviewCount: p.reviewCount } : undefined,
        offers: {
          '@type': 'Offer',
          url: `${base}/san-pham/${p.slug}`,
          priceCurrency: 'VND',
          price: p.price,
          availability: p.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        },
      },
    }
  }

  const pageMeta = async (path: string, base: string): Promise<Meta> => {
    const [, section, slug] = path.split('/')
    if (section === 'san-pham' && slug) {
      const m = await productMeta(decodeURIComponent(slug), base)
      if (m) return m
    }
    if (section === 'tin-tuc' && slug) {
      const n = await db.news.find((x) => x.slug === decodeURIComponent(slug) && x.published)
      if (n)
        return {
          title: n.title.length > 52 ? `${clip(n.title, 58)} | JAMIR` : `${n.title} | Tin tức JAMIR`,
          description: clip(n.excerpt || n.content, 160),
          path: `/tin-tuc/${n.slug}`,
          image: n.cover,
          type: 'article',
          jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'NewsArticle',
            headline: n.title,
            image: n.cover ? [/^https?:/.test(n.cover) ? n.cover : `${base}${n.cover}`] : undefined,
            datePublished: n.publishedAt,
            author: { '@type': 'Organization', name: n.author || 'JAMIR' },
          },
        }
    }
    if (section === 'cong-dong') {
      const latest = (await db.reviews.list()).filter((r) => !r.hidden && r.media.length).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
      return {
        title: 'Cộng đồng JAMIR | Cảm nhận thật mỗi tuần',
        description: 'Ảnh, video và cảm nhận thật từ người dùng JAMIR, cập nhật mỗi tuần: họ mang đi đâu, thích điều gì và nói gì với nhau.',
        path: '/cong-dong',
        image: latest?.media[0]?.thumbnail,
      }
    }
    if (section === 'tin-tuc' && !slug)
      return { title: 'Tin tức sản phẩm, ưu đãi và hướng dẫn | JAMIR', description: 'Ra mắt sản phẩm, ưu đãi và hướng dẫn sử dụng phụ kiện công nghệ từ JAMIR.', path: '/tin-tuc' }
    if (section === 'uu-dai' && slug) {
      const lp = await db.landingPages.find((x) => x.slug === decodeURIComponent(slug) && x.active)
      const p = lp && (await db.products.get(lp.productId))
      if (lp && p)
        return {
          title: `${plain(lp.headline)} | JAMIR`,
          description: clip(lp.subheadline || p.shortDescription, 160),
          path: `/uu-dai/${lp.slug}`,
          image: lp.designImage || (lp.heroMedia?.type === 'image' ? lp.heroMedia.src : p.thumbnail),
          type: 'product',
          jsonLd: (await productMeta(p.slug, base))?.jsonLd,
        }
    }
    if (path === '/') {
      const banner = (await db.banners.list()).filter((b) => b.active).sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))[0]
      const st = await db.settings.read()
      // Admin → Cài đặt → Chia sẻ link
      return {
        title: st.share?.title?.trim() || HOME_TITLE,
        description: st.share?.description?.trim() || HOME_DESCRIPTION,
        path: '/',
        image: st.share?.image || banner?.image,
        jsonLd: [
          {
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'JAMIR',
            url: base,
            logo: st.logo?.image ? (/^https?:/.test(st.logo.image) ? st.logo.image : `${base}${st.logo.image}`) : undefined,
            sameAs: [st.community.facebook, st.community.tiktok].filter(Boolean),
            contactPoint: st.hotline ? { '@type': 'ContactPoint', telephone: st.hotline, contactType: 'customer service', areaServed: 'VN', availableLanguage: 'vi' } : undefined,
          },
          {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'JAMIR',
            url: base,
            potentialAction: { '@type': 'SearchAction', target: `${base}/search?q={search_term_string}`, 'query-input': 'required name=search_term_string' },
          },
        ],
      }
    }
    const st = await db.settings.read()
    return { title: st.share?.title?.trim() || HOME_TITLE, description: st.share?.description?.trim() || HOME_DESCRIPTION, path, image: st.share?.image, noindex: section !== '' }
  }

  // nginx: proxy_pass .../api/seo/page?path=$uri
  r.get('/seo/page', async ({ req, res, query }) => {
    const path = (query.get('path') || '/').split('?')[0]!
    const base = origin(req)
    let html: string
    try {
      html = render(indexHtml(), base, await pageMeta(path, base))
    } catch (e) {
      console.error('[seo]', e)
      html = indexHtml()
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' })
    res.end(html)
  })

  r.get('/seo/sitemap.xml', async ({ req, res }) => {
    const base = origin(req)
    const day = (d?: string) => (d ? d.slice(0, 10) : new Date().toISOString().slice(0, 10))
    const urls: [string, string?][] = [
      ['/'],
      ['/tin-tuc'],
      ['/cong-dong'],
      ['/shop'],
      ...(await db.products.list()).map((p): [string] => [`/san-pham/${p.slug}`]),
      ...(await db.news.list()).filter((n) => n.published).map((n): [string, string] => [`/tin-tuc/${n.slug}`, n.publishedAt]),
      ...(await db.landingPages.list()).filter((l) => l.active).map((l): [string] => [`/uu-dai/${l.slug}`]),
    ]
    const body = urls.map(([u, d]) => `  <url><loc>${esc(base + u)}</loc><lastmod>${day(d)}</lastmod></url>`).join('\n')
    res.writeHead(200, { 'Content-Type': 'application/xml; charset=utf-8' })
    res.end(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`)
  })

  r.get('/seo/robots.txt', ({ req, res }) => {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end(`User-agent: *\nDisallow: /admin\nDisallow: /account\nDisallow: /api/\nSitemap: ${origin(req)}/sitemap.xml\n`)
  })
}
