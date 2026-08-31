/**
 * The settings 用量统计 (usage) section, with a full-screen mode.
 *
 * In the settings modal it renders as a compact pane; a "全屏" toggle in the
 * header puts the whole dashboard into a fixed full-viewport overlay (rendered
 * through a portal so it escapes the settings modal's clipping), with a "退出
 * 全屏" button. The real-time aggregation, summary cards, account balance, a
 * multi-series daily trend chart (uncached input / cache read / cache write /
 * output, with a 近7日/近30日 range toggle and legend), and the expandable
 * per-session table all render at any size.
 */
import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { PropsLocale, PropsRuntime, InjectFace } from '@deepseek-ai/dsh-client-ui-slots'
import type { SessionsListFace } from './index.ts'
import { aggregate, dailySeries, fetchBalance, currencySymbol, fmtBalance, NO_BALANCE, type BalanceView, type DailyPoint, type UsageDashboard } from './usage.ts'
import type { UsageDashboardKey } from './locales.ts'

/** Injected business face: the live sessions list. */
export interface DashboardInjected {
  sessions: SessionsListFace
}

/** Full section props: runtime share + injected face + the locale seat. */
export type DashboardSectionProps = PropsRuntime<'settings.section'> & InjectFace<DashboardInjected> & PropsLocale<'usage-dashboard'>

/** Format an integer with thousands separators. */
function intfmt(n: number): string {
  return Number.isFinite(n) ? Math.round(n).toLocaleString('en-US') : '—'
}

/** Compact token/latency unit formatting. */
function unit(n: number): string {
  if (!Number.isFinite(n)) return '—'
  if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(2) + 'B'
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(2) + 'M'
  if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(1) + 'K'
  return String(Math.round(n))
}

/** Format a millisecond duration into a readable compact string. */
function msfmt(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return '—'
  if (ms < 1000) return Math.round(ms) + 'ms'
  const s = ms / 1000
  if (s < 60) return s.toFixed(1) + 's'
  const m = s / 60
  if (m < 60) return Math.floor(m) + 'm ' + Math.round(s % 60) + 's'
  const h = m / 60
  return Math.floor(h) + 'h ' + Math.round(m % 60) + 'm'
}

/** One summary card. */
function Card(props: { label: string; value: string; sub?: string }): JSX.Element {
  return (
    <div className="dsh_usage_card">
      <div className="dsh_usage_cardLabel">{props.label}</div>
      <div className="dsh_usage_cardValue">{props.value}</div>
      {props.sub === undefined ? null : <div className="dsh_usage_cardSub">{props.sub}</div>}
    </div>
  )
}

/** The account-balance card with a refresh button. */
function BalanceCard(props: { balance: BalanceView; loading: boolean; onRefresh: () => void; t: (k: UsageDashboardKey) => string }): JSX.Element {
  const { balance, loading, onRefresh, t } = props
  const ok = balance.ok && balance.total !== null
  const value = ok ? currencySymbol(balance.currency) + fmtBalance(balance.total) : '—'
  const sub = ok
    ? `${t('balanceAvailable')} · 赠 ${fmtBalance(balance.granted)} · 充 ${fmtBalance(balance.toppedUp)}`
    : (balance.error ?? t('balanceUnavailable'))
  return (
    <div className="dsh_usage_card dsh_usage_balanceCard">
      <div className="dsh_usage_cardLabel">{t('balance')}</div>
      <div className="dsh_usage_cardValue">{loading ? '…' : value}</div>
      <div className="dsh_usage_cardSub">{sub}</div>
      <button type="button" className="dsh_usage_refreshBtn" onClick={onRefresh} disabled={loading} title={t('refresh')}>
        {t('refresh')}
      </button>
    </div>
  )
}

/** A multi-series stacked area chart over the daily buckets. */
function MultiTrend(props: { data: DailyPoint[]; series: Array<{ key: 'uncached' | 'cacheRead' | 'cacheWrite' | 'output'; color: string }> }): JSX.Element {
  const { data, series } = props
  const n = data.length
  if (n === 0) return <div className="dsh_usage_empty">—</div>
  const chartW = 900
  const barW = Math.max(8, Math.min(40, (chartW / n) * 0.6))
  const gap = (chartW - n * barW) / Math.max(1, n - 1)
  const max = Math.max(1, ...data.map((d) => series.reduce((s, sr) => s + d[sr.key], 0)))
  const seriesColors = ['#3964fe', '#22c55e', '#f59e0b', '#8b5cf6']

  return (
    <svg className="dsh_usage_trend" viewBox={`0 0 ${chartW} 160`} role="img" aria-label="usage trend">
      {data.map((d, i) => {
        const x = i * (barW + gap)
        // Stack the buckets bottom-up.
        let acc = 0
        return (
          <g key={d.label}>
            {series.map((sr, si) => {
              const h = (d[sr.key] / max) * 128
              const y = 136 - acc - h
              acc += h
              return h > 0 ? (
                <rect key={sr.key} className="dsh_usage_trendBar" x={x} y={y} width={barW} height={Math.max(1, h)} rx={1.5} fill={seriesColors[si % seriesColors.length]} />
              ) : null
            })}
            <text className="dsh_usage_trendLabel" x={x + barW / 2} y={150} textAnchor="middle">{d.label}</text>
            <title>{`${d.label}: ${intfmt(series.reduce((s, sr) => s + d[sr.key], 0))}`}</title>
          </g>
        )
      })}
      <line className="dsh_usage_trendAxis" x1="0" y1="136" x2={chartW} y2="136" />
    </svg>
  )
}

/** A tiny legend for the multi-series chart. */
function Legend(props: { t: (k: UsageDashboardKey) => string }): JSX.Element {
  const { t } = props
  const items: Array<{ key: UsageDashboardKey; color: string }> = [
    { key: 'legendInput', color: '#3964fe' },
    { key: 'legendCacheRead', color: '#22c55e' },
    { key: 'legendCacheWrite', color: '#f59e0b' },
    { key: 'legendOutput', color: '#8b5cf6' },
  ]
  return (
    <div className="dsh_usage_legend">
      {items.map((it) => (
        <span className="dsh_usage_legendItem" key={it.key}>
          <span className="dsh_usage_legendDot" style={{ background: it.color }} />
          {t(it.key)}
        </span>
      ))}
    </div>
  )
}

/** The expandable per-session detail breakdown. */
function DetailRow(props: { r: UsageDashboard['rows'][number]; t: (k: UsageDashboardKey) => string }): JSX.Element {
  const { r, t } = props
  const tok = r.tokens
  const st = r.stats
  const rows: Array<{ label: string; value: string }> = [
    { label: t('input'), value: intfmt(tok.uncachedInputTokens) },
    { label: t('output'), value: intfmt(tok.outputTokens) },
    { label: t('cacheRead') + ' (' + t('cache') + ')', value: intfmt(tok.cacheReadTokens) },
    { label: t('cacheWrite'), value: intfmt(tok.cacheWriteTokens) },
    { label: t('turns'), value: intfmt(st.turns) },
    { label: t('steps'), value: intfmt(st.steps) },
    { label: t('llmTime'), value: msfmt(st.llmMs) },
    { label: t('toolTime'), value: msfmt(st.toolMs) },
    { label: t('ttft'), value: msfmt(st.ttftMs) },
    { label: t('decode'), value: msfmt(st.decodeMs) },
    { label: t('decodeTokens'), value: intfmt(st.decodeTokens) },
  ]
  return (
    <tr className="dsh_usage_detailRow">
      <td colSpan={8}>
        <div className="dsh_usage_detailGrid">
          {rows.map((row) => (
            <div className="dsh_usage_detailItem" key={row.label}>
              <span className="dsh_usage_detailLabel">{row.label}</span>
              <span className="dsh_usage_detailValue">{row.value}</span>
            </div>
          ))}
        </div>
      </td>
    </tr>
  )
}

/** A Fragment wrapper so a session (main row + optional detail row) stays one keyed chunk. */
function FragmentedRow(props: { children: React.ReactNode }): JSX.Element {
  return <>{props.children}</>
}

/**
 * The dashboard body shared by both the settings-pane and full-screen views.
 * @param props - the common props + view-state hooks.
 */
function DashboardBody(props: {
  dashboard: UsageDashboard
  balance: BalanceView
  balanceLoading: boolean
  onRefreshBalance: () => void
  t: (k: UsageDashboardKey) => string
  range: number
  setRange: (n: number) => void
}): JSX.Element {
  const { dashboard: d, balance, balanceLoading, onRefreshBalance, t, range, setRange } = props
  const hit = d.cacheHitRate === null ? '—' : (d.cacheHitRate * 100).toFixed(1) + '%'
  const llm = msfmt(d.time.llmMs)
  const tool = msfmt(d.time.toolMs)
  const ttft = d.counts.steps > 0 && d.time.ttftMs > 0 ? msfmt(d.time.ttftMs / Math.max(1, d.counts.steps)) : '—'
  const decode = d.time.decodeMs > 0 ? msfmt(d.time.decodeMs) : '—'
  const series: Array<{ key: 'uncached' | 'cacheRead' | 'cacheWrite' | 'output'; color: string }> = [
    { key: 'uncached', color: '#3964fe' },
    { key: 'cacheRead', color: '#22c55e' },
    { key: 'cacheWrite', color: '#f59e0b' },
    { key: 'output', color: '#8b5cf6' },
  ]

  const [expanded, setExpanded] = useState<string | null>(null)
  const toggle = (id: string): void => setExpanded((cur) => (cur === id ? null : id))

  return (
    <>
      <div className="dsh_usage_cards">
        <BalanceCard balance={balance} loading={balanceLoading} onRefresh={onRefreshBalance} t={t} />
        <Card label={t('totalTokens')} value={unit(d.totals.total)} sub={intfmt(d.totals.total) + ' ' + t('unit')} />
        <Card label={t('cacheHit')} value={hit} sub={`${unit(d.totals.cacheRead)} · ${t('cacheRead')}`} />
        <Card label={t('input')} value={unit(d.totals.uncachedInput)} sub={t('input')} />
        <Card label={t('output')} value={unit(d.totals.output)} sub={intfmt(d.totals.output) + ' ' + t('unit')} />
        <Card label={t('sessions')} value={intfmt(d.sessionCount)} />
        <Card label={t('llmTime')} value={llm} sub={t('toolTime') + ' ' + tool} />
        <Card label={t('ttft')} value={ttft} />
        <Card label={t('decode')} value={decode} sub={`${unit(d.counts.decodeTokens)} ${t('decodeTokens')}`} />
      </div>

      <div className="dsh_usage_trendCard">
        <div className="dsh_usage_trendHeader">
          <span className="dsh_usage_cardLabel">{t('perSession')}</span>
          <div className="dsh_usage_rangeToggle">
            <button type="button" className={`dsh_usage_rangeBtn ${range === 7 ? 'dsh_usage_rangeBtnActive' : ''}`} onClick={() => { setRange(7) }}>{t('days7')}</button>
            <button type="button" className={`dsh_usage_rangeBtn ${range === 30 ? 'dsh_usage_rangeBtnActive' : ''}`} onClick={() => { setRange(30) }}>{t('days30')}</button>
          </div>
        </div>
        <MultiTrend data={dailySeries(d.rows, range)} series={series} />
        <Legend t={t} />
      </div>

      <div className="dsh_usage_tableWrap">
        <table className="dsh_usage_table">
          <thead>
            <tr>
              <th className="dsh_usage_expandCol">{''}</th>
              <th>{t('sessionTitle')}</th>
              <th className="dsh_usage_num">{t('colTokens')}</th>
              <th className="dsh_usage_num">{t('colCache')}</th>
              <th className="dsh_usage_num">{t('colTurns')}</th>
              <th className="dsh_usage_num">{t('colSteps')}</th>
              <th className="dsh_usage_num">{t('colLlm')}</th>
              <th>{''}</th>
            </tr>
          </thead>
          <tbody>
            {d.rows.map((r) => {
              const tot = r.tokens.uncachedInputTokens + r.tokens.cacheReadTokens + r.tokens.cacheWriteTokens + r.tokens.outputTokens
              const inTotal = r.tokens.uncachedInputTokens + r.tokens.cacheReadTokens
              const hitRate = inTotal > 0 ? (r.tokens.cacheReadTokens / inTotal * 100).toFixed(0) : '—'
              const open = expanded === r.sessionId
              return (
                <FragmentedRow key={r.sessionId}>
                  <tr className={`dsh_usage_row ${open ? 'dsh_usage_rowOpen' : ''}`} onClick={() => { toggle(r.sessionId) }}>
                    <td className="dsh_usage_expandCol"><span className="dsh_usage_expandIcon">{open ? '−' : '+'}</span></td>
                    <td className="dsh_usage_titleCell">
                      <span className="dsh_usage_sessTitle" title={r.cwd ?? ''}>{r.title}</span>
                      <span className="dsh_usage_sessMeta">{r.origin === 'subagent' ? 'subagent' : r.cwd ?? ''}</span>
                    </td>
                    <td className="dsh_usage_num">{unit(tot)}</td>
                    <td className="dsh_usage_num">{hitRate}%</td>
                    <td className="dsh_usage_num">{r.stats.turns}</td>
                    <td className="dsh_usage_num">{r.stats.steps}</td>
                    <td className="dsh_usage_num">{msfmt(r.stats.llmMs)}</td>
                    <td className="dsh_usage_status">{r.running ? t('running') : t('finished')}</td>
                  </tr>
                  {open ? <DetailRow r={r} t={t} /> : null}
                </FragmentedRow>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}

/** Render the section (settings pane + optional full-screen overlay). */
export function DashboardSection({ sessions, t }: DashboardSectionProps): JSX.Element {
  const [dashboard, setDashboard] = useState<UsageDashboard | null>(null)
  const [range, setRange] = useState(7)
  const [fullscreen, setFullscreen] = useState(false)
  const [balance, setBalance] = useState<BalanceView>(NO_BALANCE)
  const [balanceLoading, setBalanceLoading] = useState(true)

  useEffect(() => {
    if (sessions === undefined || sessions.list === undefined) {
      setDashboard(null)
      return
    }
    const update = (): void => {
      const snap = sessions.list.getSnapshot()
      setDashboard(aggregate(snap.byId))
    }
    update()
    const off = sessions.list.subscribe(update)
    return off
  }, [sessions])

  const refreshBalance = useCallback((): void => {
    setBalanceLoading(true)
    void fetchBalance().then((b) => {
      setBalance(b)
      setBalanceLoading(false)
    })
  }, [])

  useEffect(() => {
    refreshBalance()
  }, [refreshBalance])

  useEffect(() => {
    if (!fullscreen) return
    const onKey = (e: KeyboardEvent): void => { if (e.key === 'Escape') setFullscreen(false) }
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('keydown', onKey) }
  }, [fullscreen])

  if (dashboard === null) return <section className="dsh_usage_section" />

  const body = dashboard.sessionCount === 0
    ? <div className="dsh_usage_empty">{t('empty')}</div>
    : <DashboardBody dashboard={dashboard} balance={balance} balanceLoading={balanceLoading} onRefreshBalance={refreshBalance} t={t} range={range} setRange={setRange} />

  const overlay = fullscreen ? createPortal(
    <div className="dsh_usage_fullscreen" role="dialog" aria-modal="true">
      <div className="dsh_usage_fullscreenHeader">
        <h2 className="dsh_usage_title">{t('title')}</h2>
        <button type="button" className="dsh_usage_fullscreenBtn" onClick={() => { setFullscreen(false) }}>{t('closeFullscreen')}</button>
      </div>
      <div className="dsh_usage_fullscreenBody">
        {body}
      </div>
    </div>,
    document.body,
  ) : null

  return (
    <section className="dsh_usage_section" aria-labelledby="dsh-usage-title">
      <div className="dsh_usage_heading">
        <h2 id="dsh-usage-title" className="dsh_usage_title">{t('title')}</h2>
        <div className="dsh_usage_headingActions">
          <p className="dsh_usage_subtitle">{t('subtitle')}</p>
          <button type="button" className="dsh_usage_fullscreenBtn" onClick={() => { setFullscreen(true) }}>{t('fullscreen')}</button>
        </div>
      </div>
      {body}
      {overlay}
    </section>
  )
}
