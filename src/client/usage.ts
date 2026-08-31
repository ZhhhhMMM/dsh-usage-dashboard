/**
 * dsh-usage-dashboard shared types: the projection value shapes the dashboard
 * reads (imported type-only from the harness projections) and the aggregated
 * view model it renders. Everything here is client-safe plain JSON.
 */
import type { TokenUsageProjection } from '@deepseek-ai/dsh-token-meter/client'
import type { ContextBreakdownProjection, ContextPressureProjection } from '@deepseek-ai/dsh-token-meter/client'
import type { SessionStatsProjection } from '@deepseek-ai/dsh-session-stats/types'

export type { TokenUsageProjection, ContextBreakdownProjection, ContextPressureProjection, SessionStatsProjection }

/** Per-session projections as delivered off the session list. */
export interface UsageProjections {
  tokenUsage?: TokenUsageProjection
  sessionStats?: SessionStatsProjection
  contextBreakdown?: ContextBreakdownProjection
  contextPressure?: ContextPressureProjection
}

/** One dashboard table/breakdown row: one session's contribution. */
export interface SessionUsageRow {
  sessionId: string
  title: string
  cwd?: string
  origin?: 'subagent'
  updatedAt: number
  running: boolean
  tokens: TokenUsageProjection
  stats: SessionStatsProjection
}

/** Aggregated view model rendered by the dashboard. */
export interface UsageDashboard {
  /** Count of sessions that carry at least one projection value. */
  sessionCount: number
  /** Sum of token counts across all sessions. */
  totals: {
    uncachedInput: number
    output: number
    cacheRead: number
    cacheWrite: number
    total: number
  }
  /** Cache hit ratio (cache read / (read + uncached input)); null when no input. */
  cacheHitRate: number | null
  /** Summed wall times (ms). */
  time: {
    llmMs: number
    toolMs: number
    ttftMs: number
    decodeMs: number
  }
  /** Summed turn/step counts and decode token count. */
  counts: {
    turns: number
    steps: number
    decodeTokens: number
  }
  /** Per-session rows, sorted desc by total tokens, only sessions with data. */
  rows: SessionUsageRow[]
}

/** The placeholder used until the first projection value lands. */
export const ZERO_USAGE: UsageDashboard = {
  sessionCount: 0,
  totals: { uncachedInput: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
  cacheHitRate: null,
  time: { llmMs: 0, toolMs: 0, ttftMs: 0, decodeMs: 0 },
  counts: { turns: 0, steps: 0, decodeTokens: 0 },
  rows: [],
}

/** True when a session carries any projection worth counting. */
export function hasUsage(t: UsageProjections | undefined): boolean {
  const u = t?.tokenUsage
  return u !== undefined && (u.uncachedInputTokens > 0 || u.outputTokens > 0 || u.cacheReadTokens > 0 || u.cacheWriteTokens > 0)
}

/** Sum one session's tokens into an accumulator. */
export function addTokens(acc: UsageDashboard['totals'], u: TokenUsageProjection): void {
  acc.uncachedInput += u.uncachedInputTokens
  acc.output += u.outputTokens
  acc.cacheRead += u.cacheReadTokens
  acc.cacheWrite += u.cacheWriteTokens
  acc.total += u.uncachedInputTokens + u.outputTokens + u.cacheReadTokens + u.cacheWriteTokens
}

/** A session-list store row passed to {@link aggregate} (the `byId` value shape). */
export interface SessionStoreRow {
  id?: string
  title?: string
  cwd?: string
  origin?: 'subagent'
  updatedAt: number
  running: boolean
  projectionValues?: Readonly<{
    tokenUsage?: TokenUsageProjection
    sessionStats?: SessionStatsProjection
    contextBreakdown?: ContextBreakdownProjection
    contextPressure?: ContextPressureProjection
  }>
}

/**
 * Aggregate a session-list store snapshot into the dashboard view model.
 * @param entries - the store rows keyed by session id (the `byId` map).
 * @returns the aggregated dashboard.
 */
export function aggregate(entries: Readonly<Record<string, SessionStoreRow>>): UsageDashboard {
  const totals = { uncachedInput: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 }
  const time = { llmMs: 0, toolMs: 0, ttftMs: 0, decodeMs: 0 }
  const counts = { turns: 0, steps: 0, decodeTokens: 0 }
  const rows: SessionUsageRow[] = []

  for (const row of Object.values(entries)) {
    const u = row.projectionValues?.tokenUsage
    const s = row.projectionValues?.sessionStats
    if (u === undefined && s === undefined) continue
    const id = row.id ?? ''
    const tokens = u ?? { uncachedInputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0 }
    const stats = s ?? { turns: 0, steps: 0, llmMs: 0, toolMs: 0, ttftMs: 0, ttftSteps: 0, decodeMs: 0, decodeTokens: 0 }
    addTokens(totals, tokens)
    counts.turns += stats.turns
    counts.steps += stats.steps
    counts.decodeTokens += stats.decodeTokens
    time.llmMs += stats.llmMs
    time.toolMs += stats.toolMs
    time.ttftMs += stats.ttftMs
    time.decodeMs += stats.decodeMs
    rows.push({
      sessionId: id,
      title: row.title ?? id.slice(0, 8),
      cwd: row.cwd,
      origin: row.origin,
      updatedAt: row.updatedAt,
      running: row.running,
      tokens,
      stats,
    })
  }

  rows.sort((a, b) => (b.tokens.cacheReadTokens + b.tokens.cacheWriteTokens + b.tokens.outputTokens + b.tokens.uncachedInputTokens) - (a.tokens.cacheReadTokens + a.tokens.cacheWriteTokens + a.tokens.outputTokens + a.tokens.uncachedInputTokens))

  const input = totals.uncachedInput + totals.cacheRead
  return {
    sessionCount: rows.length,
    totals,
    cacheHitRate: input > 0 ? totals.cacheRead / input : null,
    time,
    counts,
    rows,
  }
}

/** The account balance as returned by the host proxy. */
export interface BalanceView {
  ok: boolean
  isAvailable: boolean
  currency: string | null
  total: string | null
  granted: string | null
  toppedUp: string | null
  error?: string
}

/** Empty/placeholder balance state. */
export const NO_BALANCE: BalanceView = { ok: false, isAvailable: false, currency: null, total: null, granted: null, toppedUp: null }

/** Currency symbol for a balance. */
export function currencySymbol(c: string | null): string {
  if (c === 'CNY') return '¥'
  if (c === 'USD') return '$'
  return (c || '') ? c + ' ' : ''
}

/** Format a balance amount with two decimals. */
export function fmtBalance(v: string | number | null | undefined): string {
  const n = Number(v)
  if (!Number.isFinite(n)) return '--'
  return n.toFixed(2)
}

/** Fetch the account balance from the host proxy. */
export function fetchBalance(): Promise<BalanceView> {
  return fetch('/dsh-usage-dashboard/balance', { cache: 'no-store' })
    .then((r) => r.json() as Promise<BalanceView>)
    .catch((e) => ({ ok: false, isAvailable: false, currency: null, total: null, granted: null, toppedUp: null, error: String((e && (e as Error).message) || e) }))
}

/** One day bucket of the multi-series daily trend. */
export interface DailyPoint {
  label: string
  uncached: number
  cacheRead: number
  cacheWrite: number
  output: number
}

/**
 * Bucket per-session token usage into per-day multi-series over the last `days`
 * days. Uses each session's `updatedAt` as the day key (last activity). Returns
 * one point per day, oldest first, each carrying the four token-type buckets.
 * @param rows - the aggregated session rows.
 * @param days - how many trailing days to cover (e.g. 7 or 30).
 * @returns the daily series, oldest first.
 */
export function dailySeries(rows: readonly SessionUsageRow[], days: number): DailyPoint[] {
  const points: DailyPoint[] = []
  const now = Date.now()
  for (let i = days - 1; i >= 0; i--) {
    const d0 = new Date(now - i * 86400000)
    const key = d0.toISOString().slice(0, 10)
    let uncached = 0
    let cacheRead = 0
    let cacheWrite = 0
    let output = 0
    for (const r of rows) {
      if (new Date(r.updatedAt).toISOString().slice(0, 10) === key) {
        uncached += r.tokens.uncachedInputTokens
        cacheRead += r.tokens.cacheReadTokens
        cacheWrite += r.tokens.cacheWriteTokens
        output += r.tokens.outputTokens
      }
    }
    points.push({ label: `${d0.getMonth() + 1}/${d0.getDate()}`, uncached, cacheRead, cacheWrite, output })
  }
  // Trim leading empty days so the chart starts at the first day with data.
  let first = points.findIndex((p) => p.uncached + p.cacheRead + p.cacheWrite + p.output > 0)
  if (first < 0) first = points.length - 1
  return points.slice(first)
}
