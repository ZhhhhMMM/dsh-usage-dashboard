/**
 * dsh-usage-dashboard client locale dictionaries (zh/en) under one namespace.
 */
import type { LocaleNamespaceMap } from '@deepseek-ai/dsh-client-ui-slots'

export const NS = 'usage-dashboard' as const

export type UsageDashboardKey =
  | 'nav'
  | 'title'
  | 'subtitle'
  | 'empty'
  | 'sessions'
  | 'totalTokens'
  | 'input'
  | 'output'
  | 'cacheRead'
  | 'cacheWrite'
  | 'cacheHit'
  | 'llmTime'
  | 'toolTime'
  | 'ttft'
  | 'decode'
  | 'turns'
  | 'steps'
  | 'decodeTokens'
  | 'perSession'
  | 'sessionTitle'
  | 'colTokens'
  | 'colTurns'
  | 'colSteps'
  | 'colLlm'
  | 'colCache'
  | 'running'
  | 'finished'
  | 'total'
  | 'cache'
  | 'avg'
  | 'noData'
  | 'unit'
  | 'balance'
  | 'balanceAvailable'
  | 'balanceUnavailable'
  | 'granted'
  | 'toppedUp'
  | 'refresh'
  | 'expand'
  | 'collapse'
  | 'detail'
  | 'fullscreen'
  | 'closeFullscreen'
  | 'days7'
  | 'days30'
  | 'legendInput'
  | 'legendOutput'
  | 'legendCacheRead'
  | 'legendCacheWrite'
  | 'totalTokensTitle'
  | 'composition'
  | 'trend'

export const zh = {
  nav: '用量统计',
  title: '用量统计',
  subtitle: '实时汇总 DSH 自身的 Token 与会话统计（跨会话、跨模型）',
  empty: '暂无用量数据。开始一轮对话后，tokenUsage 与 sessionStats 投影会实时汇入此处。',
  sessions: '会话数',
  totalTokens: '总 Token',
  input: '输入',
  output: '输出',
  cacheRead: '缓存命中',
  cacheWrite: '缓存写入',
  cacheHit: '缓存命中率',
  llmTime: 'LLM 耗时',
  toolTime: '工具耗时',
  ttft: '首 token 时延',
  decode: '解码耗时',
  turns: '轮次',
  steps: '步数',
  decodeTokens: '解码 token',
  perSession: '按会话',
  sessionTitle: '会话',
  colTokens: 'Token',
  colTurns: '轮',
  colSteps: '步',
  colLlm: 'LLM',
  colCache: '命中',
  running: '进行中',
  finished: '已结束',
  total: '总计',
  cache: '缓存',
  avg: '平均',
  noData: '无数据',
  unit: 'tokens',
  balance: '账户余额',
  balanceAvailable: '可用',
  balanceUnavailable: '获取失败',
  granted: '赠送',
  toppedUp: '充值',
  refresh: '刷新',
  expand: '展开',
  collapse: '收起',
  detail: '明细',
  fullscreen: '全屏',
  closeFullscreen: '退出全屏',
  days7: '近 7 日',
  days30: '近 30 日',
  legendInput: '输入',
  legendOutput: '输出',
  legendCacheRead: '缓存命中',
  legendCacheWrite: '缓存写入',
  totalTokensTitle: '总 Token',
  composition: 'Token 类型占比',
  trend: '用量趋势',
}

export const en = {
  nav: 'Usage',
  title: 'Usage Statistics',
  subtitle: 'Live aggregation of DSH own token & session statistics (across sessions and models)',
  empty: 'No usage data yet. Once a turn completes, the tokenUsage and sessionStats projections feed in here in real time.',
  sessions: 'Sessions',
  totalTokens: 'Total tokens',
  input: 'Input',
  output: 'Output',
  cacheRead: 'Cache read',
  cacheWrite: 'Cache write',
  cacheHit: 'Cache hit rate',
  llmTime: 'LLM time',
  toolTime: 'Tool time',
  ttft: 'First token latency',
  decode: 'Decode time',
  turns: 'Turns',
  steps: 'Steps',
  decodeTokens: 'Decode tokens',
  perSession: 'By session',
  sessionTitle: 'Session',
  colTokens: 'Tokens',
  colTurns: 'Turns',
  colSteps: 'Steps',
  colLlm: 'LLM',
  colCache: 'Hit',
  running: 'Running',
  finished: 'Finished',
  total: 'Total',
  cache: 'Cache',
  avg: 'Avg',
  noData: 'No data',
  unit: 'tokens',
  balance: 'Account balance',
  balanceAvailable: 'Available',
  balanceUnavailable: 'Fetch failed',
  granted: 'Granted',
  toppedUp: 'Topped up',
  refresh: 'Refresh',
  expand: 'Expand',
  collapse: 'Collapse',
  detail: 'Details',
  fullscreen: 'Full screen',
  closeFullscreen: 'Exit full screen',
  days7: 'Last 7 days',
  days30: 'Last 30 days',
  legendInput: 'Input',
  legendOutput: 'Output',
  legendCacheRead: 'Cache read',
  legendCacheWrite: 'Cache write',
  totalTokensTitle: 'Total tokens',
  composition: 'Token composition',
  trend: 'Usage trend',
}

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    'usage-dashboard': UsageDashboardKey
  }
}
