/**
 * dsh-usage-dashboard client plugin: the browser half of the usage dashboard.
 * Reads the live session-list service to aggregate DSH's own token/stat
 * projections (tokenUsage, sessionStats) and registers a 用量统计 section into
 * the harness `settings.section` slot (settings left-rail nav + content pane).
 * No host register needed — the projections already exist and are shipped to
 * the browser by the session-projection seam.
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
// Type-only: the token/session projection value shapes (client-safe).
import type { TokenUsageProjection, ContextBreakdownProjection, ContextPressureProjection } from '@deepseek-ai/dsh-token-meter/client'
import type { SessionStatsProjection } from '@deepseek-ai/dsh-session-stats/types'
// Type-only: the ctx.locale Context merge.
import type {} from '@deepseek-ai/dsh-client-locale/client'
// Type-only: the settings.section SlotMap entry.
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import { DashboardSection, type DashboardInjected } from './DashboardSection.tsx'
import { NS, en, zh } from './locales.ts'
import { adoptStyles } from './styles.ts'

/** Required services: the session list, slots, and locale. */
export const inject = ['sessions', 'slots', 'locale']

/** The slice of the sessions service this plugin reads (the SessionRuntime.list store). */
export interface SessionsListFace {
  readonly list: { getSnapshot(): SessionListState; subscribe(listener: () => void): () => void }
}

/** The session-list store snapshot; rows ride `byId` (keyed by session id). */
export interface SessionListState {
  readonly ids: ReadonlyArray<string>
  readonly byId: Readonly<Record<string, SessionListEntry>>
}

/** One session-list row (the SessionSummary shape). */
export interface SessionListEntry {
  id: string
  title?: string
  cwd?: string
  origin?: 'subagent'
  running: boolean
  updatedAt: number
  projectionValues?: Readonly<{
    tokenUsage?: TokenUsageProjection
    sessionStats?: SessionStatsProjection
    contextBreakdown?: ContextBreakdownProjection
    contextPressure?: ContextPressureProjection
  }>
}

/**
 * Register the usage section.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  adoptStyles()
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-usage-dashboard: dictionaries')
  const t = ctx.locale.bind(NS)

  // The sessions face is read through the service store (like dsh-notification):
  // the host dsh-session package merges a different `sessions` Context member,
  // so the two collide in this single-program build.
  const sessions = ctx.get('sessions') as unknown as SessionsListFace

  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'usage-dashboard',
    order: 90,
    label: () => t('nav'),
    locale: NS,
    inject: (): DashboardInjected => ({ sessions }),
  }, DashboardSection))
}
