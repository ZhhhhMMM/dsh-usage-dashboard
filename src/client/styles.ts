/**
 * dsh-usage-dashboard client styles. Scoped under `.dsh_usage_*` so they never
 * collide with harness DOM; injected once at startup via a <style> tag.
 *
 * Design language: a strong visual center (a gradient hero that holds the
 * headline metric), glass cards that lift on hover, soft entrance motion that
 * guides the gaze, and clean hierarchy/whitespace. Stays within DSH theme
 * tokens (--dsw-alias-*) so light and dark modes look native.
 */
const css = `
.dsh_usage_section{display:flex;flex-direction:column;gap:18px;padding:22px 4px;color:var(--dsw-alias-label-primary);font-family:inherit}
.dsh_usage_heading{display:flex;flex-direction:column;gap:6px}
.dsh_usage_title{margin:0;font-size:20px;font-weight:700;letter-spacing:-.01em}
.dsh_usage_subtitle{margin:0;color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:1.6}
.dsh_usage_empty{color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:1.7;padding:16px 0}

/* ---- Hero (visual center) ---- */
.dsh_usage_hero{position:relative;border-radius:18px;padding:22px 24px;overflow:hidden;color:#fff;display:flex;flex-direction:column;gap:6px;isolation:isolate;box-shadow:0 20px 44px -20px rgba(87,84,254,.55)}
.dsh_usage_hero::before{content:'';position:absolute;inset:0;z-index:-1;background:linear-gradient(135deg,#3964fe 0%,#7c5cff 48%,#b13fe0 78%,#22c55e 130%)}
.dsh_usage_hero::after{content:'';position:absolute;inset:-55%;z-index:-1;background:conic-gradient(from 0deg,transparent 0turn,rgba(255,255,255,.26) .08turn,transparent .18turn,transparent .5turn,rgba(255,255,255,.14) .62turn,transparent .74turn);animation:dsh_usage_heroSpin 9s linear infinite}
.dsh_usage_heroLabel{position:relative;z-index:1;font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:rgba(255,255,255,.85)}
.dsh_usage_heroValue{position:relative;z-index:1;font-size:40px;font-weight:800;line-height:1.05;letter-spacing:-.02em;font-variant-numeric:tabular-nums;text-shadow:0 2px 18px rgba(0,0,0,.22)}
.dsh_usage_heroRow{position:relative;z-index:1;display:flex;flex-wrap:wrap;gap:22px;margin-top:6px}
.dsh_usage_heroStat{display:flex;flex-direction:column;gap:3px;min-width:0}
.dsh_usage_heroStatLabel{font-size:11px;font-weight:500;color:rgba(255,255,255,.72)}
.dsh_usage_heroStatValue{font-size:18px;font-weight:700;font-variant-numeric:tabular-nums}
@keyframes dsh_usage_heroSpin{to{transform:rotate(360deg)}}

/* ---- Cards (glass, lift on hover) ---- */
.dsh_usage_cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px}
.dsh_usage_card{background:color-mix(in srgb,var(--dsw-alias-bg-layer-2) 82%,transparent);border:1px solid var(--dsw-alias-border-l1);border-radius:14px;padding:13px 15px;display:flex;flex-direction:column;gap:5px;min-width:0;backdrop-filter:blur(10px);transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease}
.dsh_usage_card:hover{transform:translateY(-2px);border-color:color-mix(in srgb,var(--dsw-alias-state-business-primary) 55%,transparent);box-shadow:0 12px 26px -14px rgba(57,100,254,.45)}
.dsh_usage_cardLabel{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:16px}
.dsh_usage_cardValue{font-size:24px;font-weight:700;font-variant-numeric:tabular-nums;line-height:1.15;letter-spacing:-.01em}
.dsh_usage_cardSub{color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

/* ---- Trend card ---- */
.dsh_usage_trendCard{background:color-mix(in srgb,var(--dsw-alias-bg-layer-2) 82%,transparent);border:1px solid var(--dsw-alias-border-l1);border-radius:16px;padding:16px;display:flex;flex-direction:column;gap:12px;backdrop-filter:blur(10px)}
.dsh_usage_trend{width:100%;height:190px;display:block}
.dsh_usage_line{width:100%;height:190px;display:block}
.dsh_usage_lineGrid{stroke:var(--dsw-alias-border-l1);stroke-width:1;stroke-dasharray:2 4;opacity:.55}
.dsh_usage_lineArea{fill:url(#dsh_usage_areaGrad)}
.dsh_usage_linePath{stroke:url(#dsh_usage_lineStroke);stroke-width:2;stroke-linejoin:round;stroke-linecap:round;stroke-dasharray:1;stroke-dashoffset:1;animation:dsh_usage_dash 1.1s ease-out forwards}
.dsh_usage_lineDotLast{fill:var(--dsw-alias-bg-base);stroke:url(#dsh_usage_lineStroke);stroke-width:2.5}
.dsh_usage_lineDotHalo{fill:url(#dsh_usage_lineStroke);opacity:.25;transform-box:fill-box;transform-origin:center;animation:dsh_usage_pulse 2.2s ease-in-out infinite}
.dsh_usage_cursor{stroke:var(--dsw-alias-border-l1);stroke-width:1;stroke-dasharray:3 3}
.dsh_usage_hoverDot{fill:var(--dsw-alias-bg-base);stroke:url(#dsh_usage_lineStroke);stroke-width:2.5}
.dsh_usage_tipRect{fill:color-mix(in srgb,var(--dsw-alias-bg-layer-2) 94%,transparent);stroke:var(--dsw-alias-border-l1)}
.dsh_usage_tipLabel{fill:var(--dsw-alias-label-tertiary);font-size:11px}
.dsh_usage_tipValue{fill:var(--dsw-alias-label-primary);font-size:14px;font-weight:700;font-variant-numeric:tabular-nums}
@keyframes dsh_usage_dash{to{stroke-dashoffset:0}}
@keyframes dsh_usage_pulse{0%,100%{transform:scale(1);opacity:.22}50%{transform:scale(1.7);opacity:.04}}
.dsh_usage_trendBar{opacity:.92;transition:opacity .15s ease}
.dsh_usage_trendBar:hover{opacity:1;filter:brightness(1.08)}
.dsh_usage_trendLabel{fill:var(--dsw-alias-label-tertiary);font-size:10px}
.dsh_usage_trendAxis{stroke:var(--dsw-alias-border-l1);stroke-width:1}

/* ---- Donut ---- */
.dsh_usage_donutWrap{display:flex;align-items:center;gap:16px;flex-wrap:wrap}
.dsh_usage_donut{width:152px;height:152px;flex:none;display:block;filter:drop-shadow(0 6px 16px rgba(57,100,254,.18))}
.dsh_usage_donutVal{font-size:16px;font-weight:700;fill:var(--dsw-alias-label-primary)}
.dsh_usage_donutLabel{font-size:10px;fill:var(--dsw-alias-label-tertiary)}
.dsh_usage_donutLegend{display:flex;flex-direction:column;gap:6px;min-width:0}
.dsh_usage_donutLegendItem{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--dsw-alias-label-secondary)}
.dsh_usage_donutDot{width:10px;height:10px;border-radius:50%;flex:none}
.dsh_usage_donutLegendLabel{min-width:0;flex:1}
.dsh_usage_donutLegendVal{font-variant-numeric:tabular-nums}

/* ---- Layout ---- */
.dsh_usage_chartRow{display:grid;grid-template-columns:2fr 1fr;gap:18px;align-items:start}
.dsh_usage_chartCol{min-width:0;display:flex;flex-direction:column;gap:8px}
.dsh_usage_chartColDonut{justify-content:center}
.dsh_usage_chartTitle{color:var(--dsw-alias-label-secondary);font-size:12px;font-weight:600;margin-bottom:4px}
.dsh_usage_legend{display:flex;flex-wrap:wrap;gap:14px}
.dsh_usage_legendItem{display:inline-flex;align-items:center;gap:6px;color:var(--dsw-alias-label-secondary);font-size:12px}
.dsh_usage_legendDot{width:10px;height:10px;border-radius:3px;flex:none;box-shadow:0 0 8px rgba(57,100,254,.3)}

/* ---- Table ---- */
.dsh_usage_tableWrap{background:color-mix(in srgb,var(--dsw-alias-bg-layer-2) 82%,transparent);border:1px solid var(--dsw-alias-border-l1);border-radius:16px;overflow:auto;backdrop-filter:blur(10px)}
.dsh_usage_table{width:100%;border-collapse:collapse;font-size:13px}
.dsh_usage_table th{text-align:left;color:var(--dsw-alias-label-tertiary);font-weight:500;padding:10px 12px;border-bottom:1px solid var(--dsw-alias-border-l1);position:sticky;top:0;background:color-mix(in srgb,var(--dsw-alias-bg-layer-2) 92%,transparent);white-space:nowrap}
.dsh_usage_table td{padding:8px 12px;border-bottom:1px solid var(--dsw-alias-border-l1);white-space:nowrap;font-variant-numeric:tabular-nums}
.dsh_usage_table tbody tr:last-child td{border-bottom:none}
.dsh_usage_table tbody tr{cursor:pointer;transition:background .12s ease}
.dsh_usage_table tbody tr:hover{background:var(--dsw-alias-interactive-bg-hover)}
.dsh_usage_num{text-align:right}
.dsh_usage_titleCell{max-width:260px;overflow:hidden}
.dsh_usage_sessTitle{display:block;color:var(--dsw-alias-label-primary);font-weight:500;overflow:hidden;text-overflow:ellipsis}
.dsh_usage_sessMeta{display:block;color:var(--dsw-alias-label-tertiary);font-size:11px;overflow:hidden;text-overflow:ellipsis}
.dsh_usage_status{color:var(--dsw-alias-label-tertiary);font-size:12px}

/* ---- Balance / buttons / fullscreen ---- */
.dsh_usage_balanceCard{position:relative}
.dsh_usage_refreshBtn{position:absolute;top:10px;right:12px;background:var(--dsw-alias-interactive-bg);color:var(--dsw-alias-label-secondary);border:1px solid var(--dsw-alias-border-l1);border-radius:999px;padding:2px 10px;font-size:11px;cursor:pointer;transition:background .12s ease,color .12s ease}
.dsh_usage_refreshBtn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.dsh_usage_refreshBtn:disabled{opacity:.5;cursor:default}
.dsh_usage_row{cursor:pointer}
.dsh_usage_rowOpen{background:var(--dsw-alias-interactive-bg-hover)}
.dsh_usage_expandCol{width:20px;text-align:center}
.dsh_usage_expandIcon{display:inline-flex;justify-content:center;align-items:center;width:18px;height:18px;color:var(--dsw-alias-label-tertiary);font-weight:600;font-size:13px;line-height:1}
.dsh_usage_expandIcon:hover{color:var(--dsw-alias-label-primary)}
.dsh_usage_detailRow td{background:var(--dsw-alias-bg-layer-1);padding:12px 14px}
.dsh_usage_detailGrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px 16px}
.dsh_usage_detailItem{display:flex;flex-direction:column;gap:2px;min-width:0}
.dsh_usage_detailLabel{color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:15px}
.dsh_usage_detailValue{color:var(--dsw-alias-label-primary);font-size:13px;font-variant-numeric:tabular-nums;line-height:18px;overflow:hidden;text-overflow:ellipsis}
.dsh_usage_headingActions{display:flex;align-items:center;justify-content:space-between;gap:12px}
.dsh_usage_headingActions .dsh_usage_subtitle{flex:1;min-width:0}
.dsh_usage_fullscreenBtn{background:var(--dsw-alias-interactive-bg);color:var(--dsw-alias-label-secondary);border:1px solid var(--dsw-alias-border-l1);border-radius:999px;padding:4px 12px;font-size:12px;cursor:pointer;white-space:nowrap;flex-shrink:0}
.dsh_usage_fullscreenBtn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.dsh_usage_fullscreen{position:fixed;inset:0;z-index:2147483000;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);display:flex;flex-direction:column;overflow:auto}
.dsh_usage_fullscreenHeader{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:18px 28px;border-bottom:1px solid var(--dsw-alias-border-l1);position:sticky;top:0;background:color-mix(in srgb,var(--dsw-alias-bg-base) 88%,transparent);backdrop-filter:blur(14px)}
.dsh_usage_fullscreenBody{padding:20px 28px 40px;max-width:1280px;width:100%;margin:0 auto;display:flex;flex-direction:column;gap:18px}
.dsh_usage_trendHeader{display:flex;align-items:center;justify-content:space-between;gap:12px}
.dsh_usage_rangeToggle{display:inline-flex;gap:4px}
.dsh_usage_rangeBtn{background:var(--dsw-alias-interactive-bg);color:var(--dsw-alias-label-secondary);border:1px solid var(--dsw-alias-border-l1);border-radius:999px;padding:2px 10px;font-size:11px;cursor:pointer;transition:all .12s ease}
.dsh_usage_rangeBtn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}
.dsh_usage_rangeBtnActive{background:linear-gradient(120deg,#3964fe,#7c5cff);border-color:transparent;color:#fff}

/* entrance motion (staggered via inline animation-delay) */
.dsh_usage_in{animation:dsh_usage_in .5s cubic-bezier(.2,.7,.2,1) both}
@keyframes dsh_usage_in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}

.dsh_usage_rankCard{background:color-mix(in srgb,var(--dsw-alias-bg-layer-2) 82%,transparent);border:1px solid var(--dsw-alias-border-l1);border-radius:16px;padding:16px;display:flex;flex-direction:column;gap:12px;backdrop-filter:blur(10px)}
.dsh_usage_rankRow{display:flex;align-items:center;gap:12px;padding:4px 2px}
.dsh_usage_rankRow:hover .dsh_usage_rankBar span{filter:brightness(1.12)}
.dsh_usage_rankIdx{width:20px;text-align:center;font-weight:700;color:var(--dsw-alias-label-tertiary);font-size:12px;font-variant-numeric:tabular-nums;flex:none}
.dsh_usage_rankDot{width:9px;height:9px;border-radius:50%;background:var(--dsw-alias-label-tertiary);flex:none;opacity:.55}
.dsh_usage_rankDotLive{background:#22c55e;opacity:1;box-shadow:0 0 0 0 rgba(34,197,94,.5);animation:dsh_usage_dot 1.8s ease-out infinite}
@keyframes dsh_usage_dot{70%{box-shadow:0 0 0 7px rgba(34,197,94,0)}100%{box-shadow:0 0 0 0 rgba(34,197,94,0)}}
.dsh_usage_rankBody{flex:1;min-width:0;display:flex;flex-direction:column;gap:5px}
.dsh_usage_rankTitle{font-size:13px;font-weight:500;color:var(--dsw-alias-label-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dsh_usage_rankBar{height:7px;border-radius:999px;background:var(--dsw-alias-bg-layer-1);overflow:hidden}
.dsh_usage_rankBar span{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,#3964fe,#7c5cff);transition:width .6s cubic-bezier(.2,.7,.2,1)}
.dsh_usage_rankVal{font-size:13px;font-weight:650;font-variant-numeric:tabular-nums;color:var(--dsw-alias-label-primary);display:flex;flex-direction:column;align-items:flex-end;gap:2px;flex:none}
.dsh_usage_rankMeta{font-size:11px;font-weight:400;color:var(--dsw-alias-label-tertiary)}

@media(max-width:860px){.dsh_usage_chartRow{grid-template-columns:1fr}}
`

const STYLE_ID = 'dsh-usage-dashboard-styles'

/** Inject the dashboard <style> once into <head>. */
export function adoptStyles(): void {
  try {
    if (document.getElementById(STYLE_ID) !== null) return
    const el = document.createElement('style')
    el.id = STYLE_ID
    el.textContent = css
    document.head.appendChild(el)
  } catch {}
}
