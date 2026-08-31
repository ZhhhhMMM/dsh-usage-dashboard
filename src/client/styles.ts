/**
 * dsh-usage-dashboard client styles. Scoped under `.dsh_usage_*` so they never
 * collide with harness DOM; injected once at startup via a <style> tag.
 */
const css = `
.dsh_usage_section{display:flex;flex-direction:column;gap:16px;padding:20px 4px;color:var(--dsw-alias-label-primary);font-family:inherit}
.dsh_usage_heading{display:flex;flex-direction:column;gap:6px}
.dsh_usage_title{margin:0;font-size:18px;font-weight:600}
.dsh_usage_subtitle{margin:0;color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:1.6}
.dsh_usage_empty{color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:1.7;padding:16px 0}
.dsh_usage_cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px}
.dsh_usage_card{background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l1);border-radius:12px;padding:12px 14px;display:flex;flex-direction:column;gap:4px;min-width:0}
.dsh_usage_cardLabel{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:16px}
.dsh_usage_cardValue{font-size:22px;font-weight:650;font-variant-numeric:tabular-nums;line-height:1.2}
.dsh_usage_cardSub{color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dsh_usage_trendCard{background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l1);border-radius:12px;padding:14px;display:flex;flex-direction:column;gap:10px}
.dsh_usage_trend{width:100%;height:auto;display:block}
.dsh_usage_line{width:100%;height:auto;display:block}
.dsh_usage_lineGrid{stroke:var(--dsw-alias-border-l1);stroke-width:1;stroke-dasharray:3 3}
.dsh_usage_lineArea{fill:var(--dsw-alias-state-business-primary);opacity:.08}
.dsh_usage_linePath{stroke:var(--dsw-alias-state-business-primary);stroke-width:2.2;stroke-linejoin:round;stroke-linecap:round}
.dsh_usage_lineDot{fill:var(--dsw-alias-state-business-primary)}
.dsh_usage_trendBar{fill:var(--dsw-alias-state-business-primary);opacity:.9}
.dsh_usage_trendLabel{fill:var(--dsw-alias-label-tertiary);font-size:10px}
.dsh_usage_trendAxis{stroke:var(--dsw-alias-border-l1);stroke-width:1}
.dsh_usage_tableWrap{background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l1);border-radius:12px;overflow:auto}
.dsh_usage_table{width:100%;border-collapse:collapse;font-size:13px}
.dsh_usage_table th{text-align:left;color:var(--dsw-alias-label-tertiary);font-weight:500;padding:10px 12px;border-bottom:1px solid var(--dsw-alias-border-l1);position:sticky;top:0;background:var(--dsw-alias-bg-layer-2);white-space:nowrap}
.dsh_usage_table td{padding:8px 12px;border-bottom:1px solid var(--dsw-alias-border-l1);white-space:nowrap}
.dsh_usage_table tbody tr:last-child td{border-bottom:none}
.dsh_usage_table tbody tr:hover{background:var(--dsw-alias-interactive-bg-hover)}
.dsh_usage_num{text-align:right;font-variant-numeric:tabular-nums}
.dsh_usage_titleCell{max-width:260px;overflow:hidden}
.dsh_usage_sessTitle{display:block;color:var(--dsw-alias-label-primary);font-weight:500;overflow:hidden;text-overflow:ellipsis}
.dsh_usage_sessMeta{display:block;color:var(--dsw-alias-label-tertiary);font-size:11px;overflow:hidden;text-overflow:ellipsis}
.dsh_usage_status{color:var(--dsw-alias-label-tertiary);font-size:12px}
.dsh_usage_balanceCard{position:relative}
.dsh_usage_refreshBtn{position:absolute;top:10px;right:12px;background:var(--dsw-alias-interactive-bg);color:var(--dsw-alias-label-secondary);border:1px solid var(--dsw-alias-border-l1);border-radius:999px;padding:2px 10px;font-size:11px;cursor:pointer}
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
.dsh_usage_fullscreenHeader{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:18px 28px;border-bottom:1px solid var(--dsw-alias-border-l1);position:sticky;top:0;background:var(--dsw-alias-bg-base)}
.dsh_usage_fullscreenBody{padding:20px 28px 40px;max-width:1280px;width:100%;margin:0 auto;display:flex;flex-direction:column;gap:16px}
.dsh_usage_trendHeader{display:flex;align-items:center;justify-content:space-between;gap:12px}
.dsh_usage_rangeToggle{display:inline-flex;gap:4px}
.dsh_usage_rangeBtn{background:var(--dsw-alias-interactive-bg);color:var(--dsw-alias-label-secondary);border:1px solid var(--dsw-alias-border-l1);border-radius:999px;padding:2px 10px;font-size:11px;cursor:pointer}
.dsh_usage_rangeBtn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}
.dsh_usage_rangeBtnActive{background:var(--dsw-alias-state-business-primary);border-color:var(--dsw-alias-state-business-primary);color:var(--dsw-alias-label-primary-foreground)}
.dsh_usage_legend{display:flex;flex-wrap:wrap;gap:14px}
.dsh_usage_legendItem{display:inline-flex;align-items:center;gap:6px;color:var(--dsw-alias-label-secondary);font-size:12px}
.dsh_usage_legendDot{width:10px;height:10px;border-radius:3px;flex:none}
.dsh_usage_chartRow{display:grid;grid-template-columns:2fr 1fr;gap:18px;align-items:stretch}
.dsh_usage_chartCol{min-width:0;display:flex;flex-direction:column;gap:8px}
.dsh_usage_chartColDonut{justify-content:center}
.dsh_usage_chartTitle{color:var(--dsw-alias-label-secondary);font-size:12px;font-weight:600;margin-bottom:4px}
.dsh_usage_donutWrap{display:flex;align-items:center;gap:16px;flex-wrap:wrap}
.dsh_usage_donut{width:148px;height:148px;flex:none;display:block}
.dsh_usage_donutVal{font-size:16px;font-weight:650;fill:var(--dsw-alias-label-primary)}
.dsh_usage_donutLabel{font-size:10px;fill:var(--dsw-alias-label-tertiary)}
.dsh_usage_donutLegend{display:flex;flex-direction:column;gap:6px;min-width:0}
.dsh_usage_donutLegendItem{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--dsw-alias-label-secondary)}
.dsh_usage_donutDot{width:10px;height:10px;border-radius:50%;flex:none}
.dsh_usage_donutLegendLabel{min-width:0;flex:1}
.dsh_usage_donutLegendVal{font-variant-numeric:tabular-nums}
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
