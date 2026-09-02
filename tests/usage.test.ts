/**
 * Regression tests for the two pure functions the dashboard's numbers rest on:
 * `aggregate` (the fold over session-list rows) and `dailySeries` (the day
 * bucketing behind both charts). Both take plain JSON and touch no DOM.
 */
import { describe, it, expect } from 'vitest'
import { aggregate, dailySeries, type SessionStoreRow, type SessionUsageRow } from '../src/client/usage.ts'

/** Epoch ms for a **local** wall-clock time, so tests are timezone-agnostic. */
function localTime(y: number, m: number, d: number, h = 12, min = 0): number {
  return new Date(y, m - 1, d, h, min, 0, 0).getTime()
}

/** A session-list row carrying the given tokens/stats. */
function storeRow(id: string, updatedAt: number, tokens: Partial<{
  uncachedInputTokens: number
  outputTokens: number
  cacheReadTokens: number
  cacheWriteTokens: number
}> = {}, stats: Partial<{
  turns: number
  steps: number
  llmMs: number
  toolMs: number
  ttftMs: number
  ttftSteps: number
  decodeMs: number
  decodeTokens: number
}> = {}): SessionStoreRow {
  return {
    id,
    title: id,
    updatedAt,
    running: false,
    projectionValues: {
      tokenUsage: {
        uncachedInputTokens: 0,
        outputTokens: 0,
        cacheReadTokens: 0,
        cacheWriteTokens: 0,
        ...tokens,
      },
      sessionStats: {
        turns: 0,
        steps: 0,
        llmMs: 0,
        toolMs: 0,
        ttftMs: 0,
        ttftSteps: 0,
        decodeMs: 0,
        decodeTokens: 0,
        ...stats,
      },
    },
  } as SessionStoreRow
}

/** A pre-aggregated dashboard row, for driving `dailySeries` directly. */
function usageRow(updatedAt: number, total: number): SessionUsageRow {
  return {
    sessionId: 's' + String(updatedAt),
    title: 's',
    updatedAt,
    running: false,
    tokens: { uncachedInputTokens: total, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0 },
    stats: { turns: 0, steps: 0, llmMs: 0, toolMs: 0, ttftMs: 0, ttftSteps: 0, decodeMs: 0, decodeTokens: 0 },
  } as SessionUsageRow
}

describe('aggregate', () => {
  it('sums tokens and derives the cache hit rate', () => {
    const d = aggregate({
      a: storeRow('a', localTime(2026, 9, 1), { uncachedInputTokens: 100, cacheReadTokens: 300, outputTokens: 50 }),
      b: storeRow('b', localTime(2026, 9, 1), { uncachedInputTokens: 100, cacheReadTokens: 100, cacheWriteTokens: 20 }),
    })
    expect(d.sessionCount).toBe(2)
    expect(d.totals.uncachedInput).toBe(200)
    expect(d.totals.cacheRead).toBe(400)
    expect(d.totals.total).toBe(670)
    // 400 cache reads out of 600 total input.
    expect(d.cacheHitRate).toBeCloseTo(400 / 600, 10)
  })

  it('reports a null hit rate rather than dividing by zero', () => {
    const d = aggregate({ a: storeRow('a', localTime(2026, 9, 1), { outputTokens: 10 }) })
    expect(d.cacheHitRate).toBeNull()
  })

  it('accumulates ttftSteps so the average TTFT has a matched denominator', () => {
    // 12 steps ran, but only 4 of them streamed a first token.
    const d = aggregate({
      a: storeRow('a', localTime(2026, 9, 1), { outputTokens: 1 }, { steps: 8, ttftMs: 600, ttftSteps: 3 }),
      b: storeRow('b', localTime(2026, 9, 1), { outputTokens: 1 }, { steps: 4, ttftMs: 200, ttftSteps: 1 }),
    })
    expect(d.counts.steps).toBe(12)
    expect(d.counts.ttftSteps).toBe(4)
    // The card divides by ttftSteps: 800 / 4 = 200ms.
    expect(d.time.ttftMs / d.counts.ttftSteps).toBe(200)
    // Dividing by `steps` would have reported 66.7ms — a 3x understatement.
    expect(d.time.ttftMs / d.counts.steps).toBeLessThan(d.time.ttftMs / d.counts.ttftSteps)
  })

  it('skips sessions carrying no projection at all', () => {
    const d = aggregate({
      a: storeRow('a', localTime(2026, 9, 1), { outputTokens: 5 }),
      b: { id: 'b', updatedAt: localTime(2026, 9, 1), running: false } as SessionStoreRow,
    })
    expect(d.sessionCount).toBe(1)
  })
})

describe('dailySeries', () => {
  it('buckets by local calendar day, not the UTC day', () => {
    // Just after local midnight. In any timezone east of UTC this instant falls
    // on the *previous* UTC day, which is what the old toISOString() key used.
    const now = localTime(2026, 9, 2, 23, 59)
    const series = dailySeries([usageRow(localTime(2026, 9, 2, 0, 1), 12345)], 3, now)
    const today = series[series.length - 1]
    expect(today.label).toBe('9/2')
    expect(today.uncached).toBe(12345)
  })

  it('keeps late-evening activity on the same local day', () => {
    // Just before local midnight. West of UTC this instant falls on the *next*
    // UTC day. Together with the test above, this pins the bug in either
    // direction, for any non-zero UTC offset.
    const now = localTime(2026, 9, 2, 23, 59)
    const series = dailySeries([usageRow(localTime(2026, 9, 2, 23, 58), 777)], 3, now)
    const today = series[series.length - 1]
    expect(today.label).toBe('9/2')
    expect(today.uncached).toBe(777)
  })

  it('labels the window in order and ending on today', () => {
    const now = localTime(2026, 9, 2, 12)
    const series = dailySeries([usageRow(localTime(2026, 8, 31, 9), 1)], 7, now)
    expect(series.map((p) => p.label)).toEqual(['8/31', '9/1', '9/2'])
  })

  it('steps across a month boundary without skipping a day', () => {
    const now = localTime(2026, 3, 2, 12)
    const series = dailySeries([usageRow(localTime(2026, 2, 27, 12), 1)], 7, now)
    // 2026 is not a leap year: February ends on the 28th.
    expect(series.map((p) => p.label)).toEqual(['2/27', '2/28', '3/1', '3/2'])
  })

  it('drops activity that falls outside the requested window', () => {
    const now = localTime(2026, 9, 10, 12)
    const series = dailySeries([usageRow(localTime(2026, 9, 1, 12), 999)], 3, now)
    expect(series.reduce((s, p) => s + p.uncached, 0)).toBe(0)
  })

  it('splits the four token types into their own series', () => {
    const now = localTime(2026, 9, 2, 12)
    const row: SessionUsageRow = {
      sessionId: 'x',
      title: 'x',
      updatedAt: localTime(2026, 9, 2, 10),
      running: false,
      tokens: { uncachedInputTokens: 1, outputTokens: 2, cacheReadTokens: 3, cacheWriteTokens: 4 },
      stats: { turns: 0, steps: 0, llmMs: 0, toolMs: 0, ttftMs: 0, ttftSteps: 0, decodeMs: 0, decodeTokens: 0 },
    } as SessionUsageRow
    const today = dailySeries([row], 3, now).at(-1)!
    expect(today).toMatchObject({ uncached: 1, output: 2, cacheRead: 3, cacheWrite: 4 })
  })

  it('returns a single point when nothing has any usage', () => {
    const series = dailySeries([], 30, localTime(2026, 9, 2, 12))
    expect(series).toHaveLength(1)
    expect(series[0].label).toBe('9/2')
  })
})
