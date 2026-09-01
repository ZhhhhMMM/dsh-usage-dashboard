/**
 * The settings 用量统计 (usage) section, with a full-screen mode.
 *
 * Charts: a stacked multi-series daily bar (uncached input / cache read /
 * cache write / output), a donut composition of the same four token types
 * (proportion of token usage), and a total-token trend line over the range.
 * All are inline SVG (no external chart lib), scoped under .dsh_usage_*.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
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

/** The four token-type series the charts share. */
type SeriesKey = 'uncached' | 'cacheRead' | 'cacheWrite' | 'output'
const SERIES: Array<{ key: SeriesKey; color: string; label: UsageDashboardKey }> = [
  { key: 'uncached', color: '#3964fe', label: 'legendInput' },
  { key: 'cacheRead', color: '#22c55e', label: 'legendCacheRead' },
  { key: 'cacheWrite', color: '#f59e0b', label: 'legendCacheWrite' },
  { key: 'output', color: '#8b5cf6', label: 'legendOutput' },
]

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

/** Animate a number from 0 to `target` (ease-out cubic) for the hero counter. */
function useCountUp(target: number, duration = 750): number {
  const [v, setV] = useState(0)
  useEffect(() => {
    if (!Number.isFinite(target) || target <= 0) { setV(0); return }
    let raf = 0
    const t0 = Date.now()
    const tick = (): void => {
      const p = Math.min(1, (Date.now() - t0) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setV(target * eased)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return v
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

/** A multi-series stacked bar chart over the daily buckets. */
function MultiTrend(props: { data: DailyPoint[] }): JSX.Element {
  const { data } = props
  const n = data.length
  if (n === 0) return <div className="dsh_usage_empty">—</div>
  const chartW = 1000
  const chartH = 190
  const barW = Math.max(8, Math.min(44, (chartW / n) * 0.6))
  const gap = (chartW - n * barW) / Math.max(1, n - 1)
  const max = Math.max(1, ...data.map((d) => d.uncached + d.cacheRead + d.cacheWrite + d.output))
  const plotH = 150
  const baseY = chartH - 24
  return (
    <svg className="dsh_usage_trend" viewBox={`0 0 ${chartW} ${chartH}`} role="img" aria-label="usage trend">
      {data.map((d, i) => {
        const x = i * (barW + gap)
        let acc = 0
        return (
          <g key={d.label}>
            {SERIES.map((sr) => {
              const h = (d[sr.key] / max) * plotH
              const y = baseY - acc - h
              acc += h
              return h > 0 ? (
                <rect key={sr.key} className="dsh_usage_trendBar" x={x} y={y} width={barW} height={Math.max(1, h)} rx={1.5} fill={sr.color} style={{ opacity: 0.92 }} />
              ) : null
            })}
            <text className="dsh_usage_trendLabel" x={x + barW / 2} y={chartH - 8} textAnchor="middle">{d.label}</text>
            <title>{`${d.label}: ${intfmt(d.uncached + d.cacheRead + d.cacheWrite + d.output)}`}</title>
          </g>
        )
      })}
      <line className="dsh_usage_trendAxis" x1="0" y1={baseY} x2={chartW} y2={baseY} />
    </svg>
  )
}

/** A donut chart of the token-type composition (proportion of token usage). */
function DonutChart(props: { segments: Array<{ key: SeriesKey; value: number; color: string; label: UsageDashboardKey }>; center: string; centerLabel: string; t: (k: UsageDashboardKey) => string }): JSX.Element {
  const { segments, center, centerLabel, t } = props
  const total = segments.reduce((s, x) => s + x.value, 0)
  if (total <= 0) return <div className="dsh_usage_empty">—</div>
  const cx = 74
  const cy = 74
  const r = 56
  const strokeW = 24
  const C = 2 * Math.PI * r
  let offset = 0
  return (
    <div className="dsh_usage_donutWrap">
      <svg className="dsh_usage_donut" viewBox="0 0 148 148" role="img" aria-label="composition">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--dsw-alias-bg-layer-1)" strokeWidth={strokeW} />
        {segments.map((s) => {
          const dash = (s.value / total) * C
          const el = (
            <circle key={s.key} cx={cx} cy={cy} r={r} fill="none"
              stroke={s.color} strokeWidth={strokeW}
              strokeDasharray={`${dash} ${C - dash}`} strokeDashoffset={-offset}
              transform={`rotate(-90 ${cx} ${cy})`}>
              <title>{`${t(s.label)}: ${intfmt(s.value)}`}</title>
            </circle>
          )
          offset += dash
          return el
        })}
        <text className="dsh_usage_donutVal" x={cx} y={cy - 2} textAnchor="middle">{center}</text>
        <text className="dsh_usage_donutLabel" x={cx} y={cy + 16} textAnchor="middle">{centerLabel}</text>
      </svg>
      <div className="dsh_usage_donutLegend">
        {segments.map((s) => (
          <div key={s.key} className="dsh_usage_donutLegendItem">
            <span className="dsh_usage_donutDot" style={{ background: s.color }} />
            <span className="dsh_usage_donutLegendLabel">{t(s.label)}</span>
            <span className="dsh_usage_donutLegendVal">{((s.value / total) * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Catmull-Rom → cubic Bézier path for a smooth curve through the points. */
function smoothPath(pts: Array<{ x: number; y: number }>): string {
  if (pts.length === 0) return ''
  if (pts.length === 1) return `M${pts[0].x},${pts[0].y}`
  let d = `M${pts[0].x},${pts[0].y}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[Math.min(pts.length - 1, i + 2)]
    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = p2.y - (p3.y - p1.y) / 6
    d += ` C${c1x},${c1y} ${c2x},${c2y} ${p2.x},${p2.y}`
  }
  return d
}

/** A minimalist smooth total-token trend line (gradient stroke + hover tooltip + last-point pulse). */
function LineTrend(props: { data: DailyPoint[] }): JSX.Element {
  const { data } = props
  const n = data.length
  const svgRef = useRef<SVGSVGElement>(null)
  const [hover, setHover] = useState<number | null>(null)
  if (n === 0) return <div className="dsh_usage_empty">—</div>
  const chartW = 1000
  const chartH = 190
  const padL = 46
  const padR = 18
  const padT = 18
  const padB = 26
  const max = Math.max(1, ...data.map((d) => d.uncached + d.cacheRead + d.cacheWrite + d.output))
  const stepX = (chartW - padL - padR) / Math.max(1, n - 1)
  const px = (i: number): number => padL + i * stepX
  const py = (v: number): number => chartH - padB - (v / max) * (chartH - padT - padB)
  const vals = data.map((d) => d.uncached + d.cacheRead + d.cacheWrite + d.output)
  const pts = vals.map((v, i) => ({ x: px(i), y: py(v) }))
  const line = smoothPath(pts)
  const area = `${line} L${px(n - 1)},${chartH - padB} L${px(0)},${chartH - padB} Z`
  const lastIdx = n - 1
  const labelStep = n > 10 ? Math.ceil(n / 6) : 1
  const onMove = (e: React.MouseEvent<SVGSVGElement>): void => {
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * chartW
    let best = 0
    let bestD = Infinity
    for (let i = 0; i < n; i++) { const dd = Math.abs(px(i) - x); if (dd < bestD) { bestD = dd; best = i } }
    setHover(best)
  }
  const onLeave = (): void => setHover(null)
  const hI = hover === null ? null : Math.min(hover, n - 1)
  const hX = hI === null ? 0 : px(hI)
  const hY = hI === null ? 0 : py(vals[hI])
  return (
    <svg ref={svgRef} className="dsh_usage_line" viewBox={`0 0 ${chartW} ${chartH}`} role="img" aria-label="usage trend line" onMouseMove={onMove} onMouseLeave={onLeave}>
      <defs>
        <linearGradient id="dsh_usage_lineStroke" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#3964fe" />
          <stop offset="100%" stopColor="#7c5cff" />
        </linearGradient>
        <linearGradient id="dsh_usage_areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3964fe" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#3964fe" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((f) => {
        const gy = chartH - padB - f * (chartH - padT - padB)
        return <line key={f} className="dsh_usage_lineGrid" x1={padL} y1={gy} x2={chartW - padR} y2={gy} />
      })}
      <path className="dsh_usage_lineArea" d={area} />
      <path className="dsh_usage_linePath" d={line} pathLength={1} />
      {hI !== null ? (
        <g>
          <line className="dsh_usage_cursor" x1={hX} y1={padT} x2={hX} y2={chartH - padB} />
          <circle className="dsh_usage_hoverDot" cx={hX} cy={hY} r="5.5" />
          <g className="dsh_usage_tipBox" transform={`translate(${Math.min(Math.max(hX - 54, 4), chartW - 112)},${Math.max(4, hY - 52)})`}>
            <rect width="108" height="42" rx="7" className="dsh_usage_tipRect" />
            <text className="dsh_usage_tipLabel" x="10" y="17">{data[hI].label}</text>
            <text className="dsh_usage_tipValue" x="10" y="34">{intfmt(vals[hI])}</text>
          </g>
        </g>
      ) : null}
      <g>
        <circle className="dsh_usage_lineDotHalo" cx={pts[lastIdx].x} cy={pts[lastIdx].y} r="12" />
        <circle className="dsh_usage_lineDotLast" cx={pts[lastIdx].x} cy={pts[lastIdx].y} r="4.5" />
      </g>
      {data.map((d, i) => (i % labelStep === 0 ? (
        <text key={d.label} className="dsh_usage_trendLabel" x={px(i)} y={chartH - 8} textAnchor="middle">{d.label}</text>
      ) : null))}
    </svg>
  )
}

/** A tiny legend for the multi-series bar chart. */
function Legend(props: { t: (k: UsageDashboardKey) => string }): JSX.Element {
  const { t } = props
  return (
    <div className="dsh_usage_legend">
      {SERIES.map((it) => (
        <span className="dsh_usage_legendItem" key={it.key}>
          <span className="dsh_usage_legendDot" style={{ background: it.color }} />
          {t(it.label)}
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

/** The gradient hero banner: a strong visual center holding the headline metric. */
function Hero(props: { total: number; cacheHitRate: number | null; sessions: number; t: (k: UsageDashboardKey) => string }): JSX.Element {
  const { total, cacheHitRate, sessions, t } = props
  const animated = useCountUp(total)
  const hit = cacheHitRate === null ? '—' : (cacheHitRate * 100).toFixed(1) + '%'
  return (
    <div className="dsh_usage_hero dsh_usage_in">
      <div className="dsh_usage_heroLabel">{t('totalTokens')}</div>
      <div className="dsh_usage_heroValue">{unit(animated)}</div>
      <div className="dsh_usage_heroRow">
        <div className="dsh_usage_heroStat"><span className="dsh_usage_heroStatLabel">{t('cacheHit')}</span><span className="dsh_usage_heroStatValue">{hit}</span></div>
        <div className="dsh_usage_heroStat"><span className="dsh_usage_heroStatLabel">{t('sessions')}</span><span className="dsh_usage_heroStatValue">{intfmt(sessions)}</span></div>
      </div>
    </div>
  )
}

/** Animated ranking of the top sessions by token usage (replaces the flat table). */
function SessionRanking(props: { rows: UsageDashboard['rows']; t: (k: UsageDashboardKey) => string }): JSX.Element {
  const { rows, t } = props
  const top = rows.slice(0, 8)
  const maxTot = Math.max(1, ...top.map((r) => r.tokens.uncachedInputTokens + r.tokens.cacheReadTokens + r.tokens.cacheWriteTokens + r.tokens.outputTokens))
  return (
    <div className="dsh_usage_rankCard dsh_usage_in" style={{ animationDelay: '220ms' }}>
      <div className="dsh_usage_chartTitle">{t('topSessions')}</div>
      {top.length === 0 ? <div className="dsh_usage_empty">{t('noData')}</div> : top.map((r, i) => {
        const tot = r.tokens.uncachedInputTokens + r.tokens.cacheReadTokens + r.tokens.cacheWriteTokens + r.tokens.outputTokens
        const w = (tot / maxTot) * 100
        const meta = r.origin === 'subagent' ? 'subagent' : (r.running ? t('running') : t('finished'))
        return (
          <div className="dsh_usage_rankRow" key={r.sessionId}>
            <span className="dsh_usage_rankIdx">{i + 1}</span>
            <span className={r.running ? 'dsh_usage_rankDot dsh_usage_rankDotLive' : 'dsh_usage_rankDot'} />
            <div className="dsh_usage_rankBody">
              <div className="dsh_usage_rankTitle" title={r.cwd ?? ''}>{r.title}</div>
              <div className="dsh_usage_rankBar"><span style={{ width: `${w}%` }} /></div>
            </div>
            <span className="dsh_usage_rankVal">{unit(tot)}<span className="dsh_usage_rankMeta">{meta}</span></span>
          </div>
        )
      })}
    </div>
  )
}

/**
 * The dashboard body shared by both the settings-pane and full-screen views.
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
  const data = dailySeries(d.rows, range)

  const donutSegments = SERIES
    .map((sr) => ({ key: sr.key, value: d.totals[sr.key === 'uncached' ? 'uncachedInput' : sr.key], color: sr.color, label: sr.label }))
    .filter((s) => s.value > 0)

  return (
    <>
      <Hero total={d.totals.total} cacheHitRate={d.cacheHitRate} sessions={d.sessionCount} t={t} />
      <div className="dsh_usage_cards dsh_usage_in" style={{ animationDelay: '60ms' }}>
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

      <div className="dsh_usage_trendCard dsh_usage_in" style={{ animationDelay: '140ms' }}>
        <div className="dsh_usage_trendHeader">
          <span className="dsh_usage_cardLabel">{t('perSession')}</span>
          <div className="dsh_usage_rangeToggle">
            <button type="button" className={`dsh_usage_rangeBtn ${range === 7 ? 'dsh_usage_rangeBtnActive' : ''}`} onClick={() => { setRange(7) }}>{t('days7')}</button>
            <button type="button" className={`dsh_usage_rangeBtn ${range === 30 ? 'dsh_usage_rangeBtnActive' : ''}`} onClick={() => { setRange(30) }}>{t('days30')}</button>
          </div>
        </div>

        <div className="dsh_usage_chartRow">
          <div className="dsh_usage_chartCol dsh_usage_chartColTrend">
            <MultiTrend data={data} />
            <Legend t={t} />
          </div>
          <div className="dsh_usage_chartCol dsh_usage_chartColDonut">
            <div className="dsh_usage_chartTitle">{t('composition')}</div>
            <DonutChart segments={donutSegments} center={unit(d.totals.total)} centerLabel={t('totalTokens')} t={t} />
          </div>
        </div>

        <div className="dsh_usage_chartTitle">{t('trend')}</div>
        <LineTrend data={data} />
      </div>

      <SessionRanking rows={d.rows} t={t} />
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
