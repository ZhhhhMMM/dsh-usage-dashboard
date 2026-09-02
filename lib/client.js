window.__ModuleLoader__.load({ id: 'dsh-usage-dashboard', factory: (require) => { var module = { exports: {} }; var exports = module.exports;
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client/index.ts
var index_exports = {};
__export(index_exports, {
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(index_exports);

// src/client/DashboardSection.tsx
var import_react = require("react");
var import_react_dom = require("react-dom");

// src/client/usage.ts
function addTokens(acc, u) {
  acc.uncachedInput += u.uncachedInputTokens;
  acc.output += u.outputTokens;
  acc.cacheRead += u.cacheReadTokens;
  acc.cacheWrite += u.cacheWriteTokens;
  acc.total += u.uncachedInputTokens + u.outputTokens + u.cacheReadTokens + u.cacheWriteTokens;
}
function aggregate(entries) {
  const totals = { uncachedInput: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 };
  const time = { llmMs: 0, toolMs: 0, ttftMs: 0, decodeMs: 0 };
  const counts = { turns: 0, steps: 0, ttftSteps: 0, decodeTokens: 0 };
  const rows = [];
  for (const row of Object.values(entries)) {
    const u = row.projectionValues?.tokenUsage;
    const s = row.projectionValues?.sessionStats;
    if (u === void 0 && s === void 0) continue;
    const id = row.id ?? "";
    const tokens = u ?? { uncachedInputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0 };
    const stats = s ?? { turns: 0, steps: 0, llmMs: 0, toolMs: 0, ttftMs: 0, ttftSteps: 0, decodeMs: 0, decodeTokens: 0 };
    addTokens(totals, tokens);
    counts.turns += stats.turns;
    counts.steps += stats.steps;
    counts.ttftSteps += stats.ttftSteps;
    counts.decodeTokens += stats.decodeTokens;
    time.llmMs += stats.llmMs;
    time.toolMs += stats.toolMs;
    time.ttftMs += stats.ttftMs;
    time.decodeMs += stats.decodeMs;
    rows.push({
      sessionId: id,
      title: row.title ?? id.slice(0, 8),
      cwd: row.cwd,
      origin: row.origin,
      updatedAt: row.updatedAt,
      running: row.running,
      tokens,
      stats
    });
  }
  rows.sort((a, b) => b.tokens.cacheReadTokens + b.tokens.cacheWriteTokens + b.tokens.outputTokens + b.tokens.uncachedInputTokens - (a.tokens.cacheReadTokens + a.tokens.cacheWriteTokens + a.tokens.outputTokens + a.tokens.uncachedInputTokens));
  const input = totals.uncachedInput + totals.cacheRead;
  return {
    sessionCount: rows.length,
    totals,
    cacheHitRate: input > 0 ? totals.cacheRead / input : null,
    time,
    counts,
    rows
  };
}
var NO_BALANCE = { ok: false, isAvailable: false, currency: null, total: null, granted: null, toppedUp: null };
function currencySymbol(c) {
  if (c === "CNY") return "\xA5";
  if (c === "USD") return "$";
  return c || "" ? c + " " : "";
}
function fmtBalance(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "--";
  return n.toFixed(2);
}
function fetchBalance() {
  return fetch("/dsh-usage-dashboard/balance", { cache: "no-store" }).then((r) => r.json()).catch((e) => ({ ok: false, isAvailable: false, currency: null, total: null, granted: null, toppedUp: null, error: String(e && e.message || e) }));
}
function localDayKey(ms) {
  const d = new Date(ms);
  return d.getFullYear() * 1e4 + (d.getMonth() + 1) * 100 + d.getDate();
}
function dailySeries(rows, days, now = Date.now()) {
  const cursor = new Date(now);
  cursor.setHours(0, 0, 0, 0);
  cursor.setDate(cursor.getDate() - (days - 1));
  const buckets = /* @__PURE__ */ new Map();
  const points = [];
  for (let i = 0; i < days; i++) {
    const point = {
      label: `${cursor.getMonth() + 1}/${cursor.getDate()}`,
      uncached: 0,
      cacheRead: 0,
      cacheWrite: 0,
      output: 0
    };
    buckets.set(localDayKey(cursor.getTime()), point);
    points.push(point);
    cursor.setDate(cursor.getDate() + 1);
  }
  for (const r of rows) {
    const bucket = buckets.get(localDayKey(r.updatedAt));
    if (bucket === void 0) continue;
    bucket.uncached += r.tokens.uncachedInputTokens;
    bucket.cacheRead += r.tokens.cacheReadTokens;
    bucket.cacheWrite += r.tokens.cacheWriteTokens;
    bucket.output += r.tokens.outputTokens;
  }
  let first = points.findIndex((p) => p.uncached + p.cacheRead + p.cacheWrite + p.output > 0);
  if (first < 0) first = points.length - 1;
  return points.slice(first);
}

// src/client/DashboardSection.tsx
var import_jsx_runtime = require("react/jsx-runtime");
var SERIES = [
  { key: "uncached", color: "#3964fe", label: "legendInput" },
  { key: "cacheRead", color: "#22c55e", label: "legendCacheRead" },
  { key: "cacheWrite", color: "#f59e0b", label: "legendCacheWrite" },
  { key: "output", color: "#8b5cf6", label: "legendOutput" }
];
function intfmt(n) {
  return Number.isFinite(n) ? Math.round(n).toLocaleString("en-US") : "\u2014";
}
function unit(n) {
  if (!Number.isFinite(n)) return "\u2014";
  if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return String(Math.round(n));
}
function msfmt(ms) {
  if (!Number.isFinite(ms) || ms <= 0) return "\u2014";
  if (ms < 1e3) return Math.round(ms) + "ms";
  const s = ms / 1e3;
  if (s < 60) return s.toFixed(1) + "s";
  const m = s / 60;
  if (m < 60) return Math.floor(m) + "m " + Math.round(s % 60) + "s";
  const h = m / 60;
  return Math.floor(h) + "h " + Math.round(m % 60) + "m";
}
function useCountUp(target, duration = 750) {
  const [v, setV] = (0, import_react.useState)(0);
  (0, import_react.useEffect)(() => {
    if (!Number.isFinite(target) || target <= 0) {
      setV(0);
      return;
    }
    let raf = 0;
    const t0 = Date.now();
    const tick = () => {
      const p = Math.min(1, (Date.now() - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setV(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return v;
}
function Card(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh_usage_card", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsh_usage_cardLabel", children: props.label }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsh_usage_cardValue", children: props.value }),
    props.sub === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsh_usage_cardSub", children: props.sub })
  ] });
}
function BalanceCard(props) {
  const { balance, loading, onRefresh, t } = props;
  const ok = balance.ok && balance.total !== null;
  const value = ok ? currencySymbol(balance.currency) + fmtBalance(balance.total) : "\u2014";
  const sub = ok ? `${t("balanceAvailable")} \xB7 \u8D60 ${fmtBalance(balance.granted)} \xB7 \u5145 ${fmtBalance(balance.toppedUp)}` : balance.error ?? t("balanceUnavailable");
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh_usage_card dsh_usage_balanceCard", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsh_usage_cardLabel", children: t("balance") }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsh_usage_cardValue", children: loading ? "\u2026" : value }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsh_usage_cardSub", children: sub }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "dsh_usage_refreshBtn", onClick: onRefresh, disabled: loading, title: t("refresh"), children: t("refresh") })
  ] });
}
function MultiTrend(props) {
  const { data } = props;
  const n = data.length;
  if (n === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsh_usage_empty", children: "\u2014" });
  const chartW = 1e3;
  const chartH = 190;
  const barW = Math.max(8, Math.min(44, chartW / n * 0.6));
  const gap = (chartW - n * barW) / Math.max(1, n - 1);
  const max = Math.max(1, ...data.map((d) => d.uncached + d.cacheRead + d.cacheWrite + d.output));
  const plotH = 150;
  const baseY = chartH - 24;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { className: "dsh_usage_trend", viewBox: `0 0 ${chartW} ${chartH}`, role: "img", "aria-label": "usage trend", children: [
    data.map((d, i) => {
      const x = i * (barW + gap);
      let acc = 0;
      return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", { children: [
        SERIES.map((sr) => {
          const h = d[sr.key] / max * plotH;
          const y = baseY - acc - h;
          acc += h;
          return h > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", { className: "dsh_usage_trendBar", x, y, width: barW, height: Math.max(1, h), rx: 1.5, fill: sr.color, style: { opacity: 0.92 } }, sr.key) : null;
        }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", { className: "dsh_usage_trendLabel", x: x + barW / 2, y: chartH - 8, textAnchor: "middle", children: d.label }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("title", { children: `${d.label}: ${intfmt(d.uncached + d.cacheRead + d.cacheWrite + d.output)}` })
      ] }, d.label);
    }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", { className: "dsh_usage_trendAxis", x1: "0", y1: baseY, x2: chartW, y2: baseY })
  ] });
}
function DonutChart(props) {
  const { segments, center, centerLabel, t } = props;
  const total = segments.reduce((s, x) => s + x.value, 0);
  if (total <= 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsh_usage_empty", children: "\u2014" });
  const cx = 74;
  const cy = 74;
  const r = 56;
  const strokeW = 24;
  const C = 2 * Math.PI * r;
  let offset = 0;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh_usage_donutWrap", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { className: "dsh_usage_donut", viewBox: "0 0 148 148", role: "img", "aria-label": "composition", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx, cy, r, fill: "none", stroke: "var(--dsw-alias-bg-layer-1)", strokeWidth: strokeW }),
      segments.map((s) => {
        const dash = s.value / total * C;
        const el = /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "circle",
          {
            cx,
            cy,
            r,
            fill: "none",
            stroke: s.color,
            strokeWidth: strokeW,
            strokeDasharray: `${dash} ${C - dash}`,
            strokeDashoffset: -offset,
            transform: `rotate(-90 ${cx} ${cy})`,
            children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("title", { children: `${t(s.label)}: ${intfmt(s.value)}` })
          },
          s.key
        );
        offset += dash;
        return el;
      }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", { className: "dsh_usage_donutVal", x: cx, y: cy - 2, textAnchor: "middle", children: center }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", { className: "dsh_usage_donutLabel", x: cx, y: cy + 16, textAnchor: "middle", children: centerLabel })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsh_usage_donutLegend", children: segments.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh_usage_donutLegendItem", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsh_usage_donutDot", style: { background: s.color } }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsh_usage_donutLegendLabel", children: t(s.label) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "dsh_usage_donutLegendVal", children: [
        (s.value / total * 100).toFixed(1),
        "%"
      ] })
    ] }, s.key)) })
  ] });
}
function smoothPath(pts) {
  if (pts.length === 0) return "";
  if (pts.length === 1) return `M${pts[0].x},${pts[0].y}`;
  let d = `M${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${c1x},${c1y} ${c2x},${c2y} ${p2.x},${p2.y}`;
  }
  return d;
}
function LineTrend(props) {
  const { data } = props;
  const n = data.length;
  const svgRef = (0, import_react.useRef)(null);
  const [hover, setHover] = (0, import_react.useState)(null);
  if (n === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsh_usage_empty", children: "\u2014" });
  const chartW = 1e3;
  const chartH = 190;
  const padL = 46;
  const padR = 18;
  const padT = 18;
  const padB = 26;
  const max = Math.max(1, ...data.map((d) => d.uncached + d.cacheRead + d.cacheWrite + d.output));
  const stepX = (chartW - padL - padR) / Math.max(1, n - 1);
  const px = (i) => padL + i * stepX;
  const py = (v) => chartH - padB - v / max * (chartH - padT - padB);
  const vals = data.map((d) => d.uncached + d.cacheRead + d.cacheWrite + d.output);
  const pts = vals.map((v, i) => ({ x: px(i), y: py(v) }));
  const line = smoothPath(pts);
  const area = `${line} L${px(n - 1)},${chartH - padB} L${px(0)},${chartH - padB} Z`;
  const lastIdx = n - 1;
  const labelStep = n > 10 ? Math.ceil(n / 6) : 1;
  const onMove = (e) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width * chartW;
    let best = 0;
    let bestD = Infinity;
    for (let i = 0; i < n; i++) {
      const dd = Math.abs(px(i) - x);
      if (dd < bestD) {
        bestD = dd;
        best = i;
      }
    }
    setHover(best);
  };
  const onLeave = () => setHover(null);
  const hI = hover === null ? null : Math.min(hover, n - 1);
  const hX = hI === null ? 0 : px(hI);
  const hY = hI === null ? 0 : py(vals[hI]);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { ref: svgRef, className: "dsh_usage_line", viewBox: `0 0 ${chartW} ${chartH}`, role: "img", "aria-label": "usage trend line", onMouseMove: onMove, onMouseLeave: onLeave, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("defs", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("linearGradient", { id: "dsh_usage_lineStroke", x1: "0", y1: "0", x2: "1", y2: "0", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", { offset: "0%", stopColor: "#3964fe" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", { offset: "100%", stopColor: "#7c5cff" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("linearGradient", { id: "dsh_usage_areaGrad", x1: "0", y1: "0", x2: "0", y2: "1", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", { offset: "0%", stopColor: "#3964fe", stopOpacity: "0.22" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", { offset: "100%", stopColor: "#3964fe", stopOpacity: "0" })
      ] })
    ] }),
    [0.25, 0.5, 0.75].map((f) => {
      const gy = chartH - padB - f * (chartH - padT - padB);
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", { className: "dsh_usage_lineGrid", x1: padL, y1: gy, x2: chartW - padR, y2: gy }, f);
    }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { className: "dsh_usage_lineArea", d: area }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { className: "dsh_usage_linePath", d: line, pathLength: 1 }),
    hI !== null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", { className: "dsh_usage_cursor", x1: hX, y1: padT, x2: hX, y2: chartH - padB }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { className: "dsh_usage_hoverDot", cx: hX, cy: hY, r: "5.5" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", { className: "dsh_usage_tipBox", transform: `translate(${Math.min(Math.max(hX - 54, 4), chartW - 112)},${Math.max(4, hY - 52)})`, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", { width: "108", height: "42", rx: "7", className: "dsh_usage_tipRect" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", { className: "dsh_usage_tipLabel", x: "10", y: "17", children: data[hI].label }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", { className: "dsh_usage_tipValue", x: "10", y: "34", children: intfmt(vals[hI]) })
      ] })
    ] }) : null,
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { className: "dsh_usage_lineDotHalo", cx: pts[lastIdx].x, cy: pts[lastIdx].y, r: "12" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { className: "dsh_usage_lineDotLast", cx: pts[lastIdx].x, cy: pts[lastIdx].y, r: "4.5" })
    ] }),
    data.map((d, i) => i % labelStep === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", { className: "dsh_usage_trendLabel", x: px(i), y: chartH - 8, textAnchor: "middle", children: d.label }, d.label) : null)
  ] });
}
function Legend(props) {
  const { t } = props;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsh_usage_legend", children: SERIES.map((it) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "dsh_usage_legendItem", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsh_usage_legendDot", style: { background: it.color } }),
    t(it.label)
  ] }, it.key)) });
}
function Hero(props) {
  const { total, cacheHitRate, sessions, t } = props;
  const animated = useCountUp(total);
  const hit = cacheHitRate === null ? "\u2014" : (cacheHitRate * 100).toFixed(1) + "%";
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh_usage_hero dsh_usage_in", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsh_usage_heroLabel", children: t("totalTokens") }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsh_usage_heroValue", children: unit(animated) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh_usage_heroRow", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh_usage_heroStat", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsh_usage_heroStatLabel", children: t("cacheHit") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsh_usage_heroStatValue", children: hit })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh_usage_heroStat", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsh_usage_heroStatLabel", children: t("sessions") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsh_usage_heroStatValue", children: intfmt(sessions) })
      ] })
    ] })
  ] });
}
function SessionRanking(props) {
  const { rows, t } = props;
  const top = rows.slice(0, 8);
  const maxTot = Math.max(1, ...top.map((r) => r.tokens.uncachedInputTokens + r.tokens.cacheReadTokens + r.tokens.cacheWriteTokens + r.tokens.outputTokens));
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh_usage_rankCard dsh_usage_in", style: { animationDelay: "220ms" }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsh_usage_chartTitle", children: t("topSessions") }),
    top.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsh_usage_empty", children: t("noData") }) : top.map((r, i) => {
      const tot = r.tokens.uncachedInputTokens + r.tokens.cacheReadTokens + r.tokens.cacheWriteTokens + r.tokens.outputTokens;
      const w = tot / maxTot * 100;
      const meta = r.origin === "subagent" ? "subagent" : r.running ? t("running") : t("finished");
      return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh_usage_rankRow", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsh_usage_rankIdx", children: i + 1 }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: r.running ? "dsh_usage_rankDot dsh_usage_rankDotLive" : "dsh_usage_rankDot" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh_usage_rankBody", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsh_usage_rankTitle", title: r.cwd ?? "", children: r.title }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsh_usage_rankBar", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { width: `${w}%` } }) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "dsh_usage_rankVal", children: [
          unit(tot),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsh_usage_rankMeta", children: meta })
        ] })
      ] }, r.sessionId);
    })
  ] });
}
function DashboardBody(props) {
  const { dashboard: d, balance, balanceLoading, onRefreshBalance, t, range, setRange } = props;
  const hit = d.cacheHitRate === null ? "\u2014" : (d.cacheHitRate * 100).toFixed(1) + "%";
  const llm = msfmt(d.time.llmMs);
  const tool = msfmt(d.time.toolMs);
  const ttft = d.counts.ttftSteps > 0 && d.time.ttftMs > 0 ? msfmt(d.time.ttftMs / d.counts.ttftSteps) : "\u2014";
  const decode = d.time.decodeMs > 0 ? msfmt(d.time.decodeMs) : "\u2014";
  const data = dailySeries(d.rows, range);
  const donutSegments = SERIES.map((sr) => ({ key: sr.key, value: d.totals[sr.key === "uncached" ? "uncachedInput" : sr.key], color: sr.color, label: sr.label })).filter((s) => s.value > 0);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hero, { total: d.totals.total, cacheHitRate: d.cacheHitRate, sessions: d.sessionCount, t }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh_usage_cards dsh_usage_in", style: { animationDelay: "60ms" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BalanceCard, { balance, loading: balanceLoading, onRefresh: onRefreshBalance, t }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { label: t("totalTokens"), value: unit(d.totals.total), sub: intfmt(d.totals.total) + " " + t("unit") }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { label: t("cacheHit"), value: hit, sub: `${unit(d.totals.cacheRead)} \xB7 ${t("cacheRead")}` }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { label: t("input"), value: unit(d.totals.uncachedInput), sub: t("input") }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { label: t("output"), value: unit(d.totals.output), sub: intfmt(d.totals.output) + " " + t("unit") }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { label: t("sessions"), value: intfmt(d.sessionCount) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { label: t("llmTime"), value: llm, sub: t("toolTime") + " " + tool }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { label: t("ttft"), value: ttft }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { label: t("decode"), value: decode, sub: `${unit(d.counts.decodeTokens)} ${t("decodeTokens")}` })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh_usage_trendCard dsh_usage_in", style: { animationDelay: "140ms" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh_usage_trendHeader", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsh_usage_cardLabel", children: t("perSession") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh_usage_rangeToggle", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: `dsh_usage_rangeBtn ${range === 7 ? "dsh_usage_rangeBtnActive" : ""}`, onClick: () => {
            setRange(7);
          }, children: t("days7") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: `dsh_usage_rangeBtn ${range === 30 ? "dsh_usage_rangeBtnActive" : ""}`, onClick: () => {
            setRange(30);
          }, children: t("days30") })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh_usage_chartRow", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh_usage_chartCol dsh_usage_chartColTrend", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MultiTrend, { data }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Legend, { t })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh_usage_chartCol dsh_usage_chartColDonut", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsh_usage_chartTitle", children: t("composition") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DonutChart, { segments: donutSegments, center: unit(d.totals.total), centerLabel: t("totalTokens"), t })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsh_usage_chartTitle", children: t("trend") }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LineTrend, { data })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SessionRanking, { rows: d.rows, t })
  ] });
}
function DashboardSection({ sessions, t }) {
  const [dashboard, setDashboard] = (0, import_react.useState)(null);
  const [range, setRange] = (0, import_react.useState)(7);
  const [fullscreen, setFullscreen] = (0, import_react.useState)(false);
  const [balance, setBalance] = (0, import_react.useState)(NO_BALANCE);
  const [balanceLoading, setBalanceLoading] = (0, import_react.useState)(true);
  (0, import_react.useEffect)(() => {
    if (sessions === void 0 || sessions.list === void 0) {
      setDashboard(null);
      return;
    }
    const update = () => {
      const snap = sessions.list.getSnapshot();
      setDashboard(aggregate(snap.byId));
    };
    update();
    const off = sessions.list.subscribe(update);
    return off;
  }, [sessions]);
  const refreshBalance = (0, import_react.useCallback)(() => {
    setBalanceLoading(true);
    void fetchBalance().then((b) => {
      setBalance(b);
      setBalanceLoading(false);
    });
  }, []);
  (0, import_react.useEffect)(() => {
    refreshBalance();
  }, [refreshBalance]);
  (0, import_react.useEffect)(() => {
    if (!fullscreen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, [fullscreen]);
  if (dashboard === null) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", { className: "dsh_usage_section" });
  const body = dashboard.sessionCount === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsh_usage_empty", children: t("empty") }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DashboardBody, { dashboard, balance, balanceLoading, onRefreshBalance: refreshBalance, t, range, setRange });
  const overlay = fullscreen ? (0, import_react_dom.createPortal)(
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh_usage_fullscreen", role: "dialog", "aria-modal": "true", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh_usage_fullscreenHeader", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { className: "dsh_usage_title", children: t("title") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "dsh_usage_fullscreenBtn", onClick: () => {
          setFullscreen(false);
        }, children: t("closeFullscreen") })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsh_usage_fullscreenBody", children: body })
    ] }),
    document.body
  ) : null;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { className: "dsh_usage_section", "aria-labelledby": "dsh-usage-title", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh_usage_heading", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { id: "dsh-usage-title", className: "dsh_usage_title", children: t("title") }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh_usage_headingActions", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "dsh_usage_subtitle", children: t("subtitle") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "dsh_usage_fullscreenBtn", onClick: () => {
          setFullscreen(true);
        }, children: t("fullscreen") })
      ] })
    ] }),
    body,
    overlay
  ] });
}

// src/client/locales.ts
var NS = "usage-dashboard";
var zh = {
  nav: "\u7528\u91CF\u7EDF\u8BA1",
  title: "\u7528\u91CF\u7EDF\u8BA1",
  subtitle: "\u5B9E\u65F6\u6C47\u603B DSH \u81EA\u8EAB\u7684 Token \u4E0E\u4F1A\u8BDD\u7EDF\u8BA1\uFF08\u8DE8\u4F1A\u8BDD\u3001\u8DE8\u6A21\u578B\uFF09",
  empty: "\u6682\u65E0\u7528\u91CF\u6570\u636E\u3002\u5F00\u59CB\u4E00\u8F6E\u5BF9\u8BDD\u540E\uFF0CtokenUsage \u4E0E sessionStats \u6295\u5F71\u4F1A\u5B9E\u65F6\u6C47\u5165\u6B64\u5904\u3002",
  sessions: "\u4F1A\u8BDD\u6570",
  totalTokens: "\u603B Token",
  input: "\u8F93\u5165",
  output: "\u8F93\u51FA",
  cacheRead: "\u7F13\u5B58\u547D\u4E2D",
  cacheWrite: "\u7F13\u5B58\u5199\u5165",
  cacheHit: "\u7F13\u5B58\u547D\u4E2D\u7387",
  llmTime: "LLM \u8017\u65F6",
  toolTime: "\u5DE5\u5177\u8017\u65F6",
  ttft: "\u9996 token \u65F6\u5EF6",
  decode: "\u89E3\u7801\u8017\u65F6",
  turns: "\u8F6E\u6B21",
  steps: "\u6B65\u6570",
  decodeTokens: "\u89E3\u7801 token",
  perSession: "\u6309\u4F1A\u8BDD",
  sessionTitle: "\u4F1A\u8BDD",
  colTokens: "Token",
  colTurns: "\u8F6E",
  colSteps: "\u6B65",
  colLlm: "LLM",
  colCache: "\u547D\u4E2D",
  running: "\u8FDB\u884C\u4E2D",
  finished: "\u5DF2\u7ED3\u675F",
  total: "\u603B\u8BA1",
  cache: "\u7F13\u5B58",
  avg: "\u5E73\u5747",
  noData: "\u65E0\u6570\u636E",
  unit: "tokens",
  balance: "\u8D26\u6237\u4F59\u989D",
  balanceAvailable: "\u53EF\u7528",
  balanceUnavailable: "\u83B7\u53D6\u5931\u8D25",
  granted: "\u8D60\u9001",
  toppedUp: "\u5145\u503C",
  refresh: "\u5237\u65B0",
  expand: "\u5C55\u5F00",
  collapse: "\u6536\u8D77",
  detail: "\u660E\u7EC6",
  fullscreen: "\u5168\u5C4F",
  closeFullscreen: "\u9000\u51FA\u5168\u5C4F",
  days7: "\u8FD1 7 \u65E5",
  days30: "\u8FD1 30 \u65E5",
  legendInput: "\u8F93\u5165",
  legendOutput: "\u8F93\u51FA",
  legendCacheRead: "\u7F13\u5B58\u547D\u4E2D",
  legendCacheWrite: "\u7F13\u5B58\u5199\u5165",
  totalTokensTitle: "\u603B Token",
  composition: "Token \u7C7B\u578B\u5360\u6BD4",
  trend: "\u7528\u91CF\u8D8B\u52BF",
  topSessions: "Top \u4F1A\u8BDD Token \u6392\u884C"
};
var en = {
  nav: "Usage",
  title: "Usage Statistics",
  subtitle: "Live aggregation of DSH own token & session statistics (across sessions and models)",
  empty: "No usage data yet. Once a turn completes, the tokenUsage and sessionStats projections feed in here in real time.",
  sessions: "Sessions",
  totalTokens: "Total tokens",
  input: "Input",
  output: "Output",
  cacheRead: "Cache read",
  cacheWrite: "Cache write",
  cacheHit: "Cache hit rate",
  llmTime: "LLM time",
  toolTime: "Tool time",
  ttft: "First token latency",
  decode: "Decode time",
  turns: "Turns",
  steps: "Steps",
  decodeTokens: "Decode tokens",
  perSession: "By session",
  sessionTitle: "Session",
  colTokens: "Tokens",
  colTurns: "Turns",
  colSteps: "Steps",
  colLlm: "LLM",
  colCache: "Hit",
  running: "Running",
  finished: "Finished",
  total: "Total",
  cache: "Cache",
  avg: "Avg",
  noData: "No data",
  unit: "tokens",
  balance: "Account balance",
  balanceAvailable: "Available",
  balanceUnavailable: "Fetch failed",
  granted: "Granted",
  toppedUp: "Topped up",
  refresh: "Refresh",
  expand: "Expand",
  collapse: "Collapse",
  detail: "Details",
  fullscreen: "Full screen",
  closeFullscreen: "Exit full screen",
  days7: "Last 7 days",
  days30: "Last 30 days",
  legendInput: "Input",
  legendOutput: "Output",
  legendCacheRead: "Cache read",
  legendCacheWrite: "Cache write",
  totalTokensTitle: "Total tokens",
  composition: "Token composition",
  trend: "Usage trend",
  topSessions: "Top sessions by tokens"
};

// src/client/styles.ts
var css = `
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
`;
var STYLE_ID = "dsh-usage-dashboard-styles";
function adoptStyles() {
  try {
    if (document.getElementById(STYLE_ID) !== null) return;
    const el = document.createElement("style");
    el.id = STYLE_ID;
    el.textContent = css;
    document.head.appendChild(el);
  } catch {
  }
}

// src/client/index.ts
var inject = ["sessions", "slots", "locale"];
function apply(ctx) {
  adoptStyles();
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), "dsh-usage-dashboard: dictionaries");
  const t = ctx.locale.bind(NS);
  const sessions = ctx.get("sessions");
  ctx.slots.inject("settings.section", () => ctx.slots.register({
    name: "settings.section",
    id: "usage-dashboard",
    order: 90,
    label: () => t("nav"),
    locale: NS,
    inject: () => ({ sessions })
  }, DashboardSection));
}
return module.exports; } });
//# sourceMappingURL=client.js.map
