/**
 * JSON "repository" — the only gateway to the mock data files.
 * Services read `db.*` inside their mock resolvers; components never import JSON.
 *
 * The JSON is code-split and fetched on first use (see client.ts), so once
 * VITE_API_BASE_URL points to a real backend the mock data is never downloaded.
 */
import type { data } from './db.data'

export type { CustomerReviewRecord, KolReviewRecord, RecommendationRecord } from './db.data'

type Db = typeof data

export const db = {} as Db

let loading: Promise<void> | null = null
export function loadDb() {
  loading ??= import('./db.data').then((m) => {
    Object.assign(db, m.data)
  })
  return loading
}
