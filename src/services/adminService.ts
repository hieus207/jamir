import type { AdminCustomer, AdminOverview, Customer } from '@/types/domain'
import { del, get, post, put, request } from './client'

/** Collections editable from the admin panel (server: /admin/c/:name). */
export type AdminCollection =
  | 'products'
  | 'categories'
  | 'stories'
  | 'kols'
  | 'kol-reviews'
  | 'reviews'
  | 'faqs'
  | 'news'
  | 'promotions'
  | 'orders'
  | 'landing-pages'
  | 'events'

export type AdminDoc = 'settings' | 'stories-config' | 'recommendations'

type Rec = Record<string, unknown> & { id: string }

export const adminApi = {
  overview: () => get<AdminOverview>('/admin/overview'),
  customers: () => get<AdminCustomer[]>('/admin/customers'),
  updateCustomer: (id: string, patch: Partial<Customer> & { password?: string }) => put<Customer>(`/admin/customers/${id}`, patch),
  deleteCustomer: (id: string) => del(`/admin/customers/${id}`),

  list: <T = Rec>(c: AdminCollection) => get<T[]>(`/admin/c/${c}`),
  create: <T = Rec>(c: AdminCollection, doc: Partial<T>) => post<T>(`/admin/c/${c}`, doc),
  update: <T = Rec>(c: AdminCollection, id: string, doc: Partial<T>) => put<T>(`/admin/c/${c}/${encodeURIComponent(id)}`, doc),
  remove: (c: AdminCollection, id: string) => del(`/admin/c/${c}/${encodeURIComponent(id)}`),

  readDoc: <T>(d: AdminDoc) => get<T>(`/admin/doc/${d}`),
  writeDoc: <T>(d: AdminDoc, value: T) => put<T>(`/admin/doc/${d}`, value),

  importStories: (json: unknown) => post<Rec[]>('/admin/stories/import', json),

  /** Streams the file as the raw request body. */
  upload: (file: File) =>
    request<{ url: string; size: number; type: 'image' | 'video' }>('POST', '/admin/upload', {
      query: { filename: file.name },
      raw: file,
      headers: { 'Content-Type': file.type || 'application/octet-stream' },
    }),
}
