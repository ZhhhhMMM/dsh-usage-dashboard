/**
 * dsh-usage-dashboard host plugin.
 *
 * Two responsibilities:
 *  1. Serve the client bundle (via the plugin's own `dsh.client` declaration).
 *  2. Expose GET /dsh-usage-dashboard/balance — a DeepSeek API balance proxy
 *     (reads DEEPSEEK_API_KEY from the credentials file and calls
 *     https://api.deepseek.com/user/balance) so the dashboard can show the
 *     account balance. Self-contained: does not depend on dsh-harness-pet.
 *
 * The usage charts themselves are client-only: they aggregate the harness's own
 * `dsh-token-meter` (tokenUsage/contextBreakdown/contextPressure) and
 * `dsh-session-stats` (sessionStats) projections that are already shipped to the
 * browser through the session-projection seam. No projection and no tool is
 * registered here.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'
import { request as httpsRequest } from 'node:https'
import type { Context } from '@deepseek-ai/cordis'

/** Cordis plugin name (the Loader entry and client bundle id). */
export const name = 'dsh-usage-dashboard'

/** The host needs the web server to mount the balance proxy. */
export const inject: readonly string[] = ['webServer']

const NL = String.fromCharCode(10)
const DQ = String.fromCharCode(34)
const SQ = String.fromCharCode(39)

/** Read the DeepSeek API key out of the DSH credentials file (same convention as dsh-harness-pet). */
function readApiKey(): string | null {
  const candidates: string[] = []
  if (process.env.DSH_HOME) candidates.push(process.env.DSH_HOME)
  candidates.push(join(homedir(), '.dsh'))
  for (const home of candidates) {
    try {
      const raw = readFileSync(join(home, '.credentials.yaml'), 'utf8')
      for (const line of raw.split(NL)) {
        const idx = line.indexOf('DEEPSEEK_API_KEY')
        if (idx === -1) continue
        const colon = line.indexOf(':', idx)
        if (colon === -1) continue
        let v = line.slice(colon + 1).trim()
        if ((v.startsWith(DQ) && v.endsWith(DQ)) || (v.startsWith(SQ) && v.endsWith(SQ))) v = v.slice(1, -1)
        if (v) return v
      }
    } catch {}
  }
  return null
}

/** Fetch the DeepSeek account balance. */
function fetchBalance(key: string): Promise<{ is_available: boolean; balance_infos?: Array<{ currency: string; total_balance: string; granted_balance: string; topped_up_balance: string }> }> {
  return new Promise((resolve, reject) => {
    const req = httpsRequest('https://api.deepseek.com/user/balance', {
      method: 'GET',
      headers: { Authorization: 'Bearer ' + key, 'User-Agent': 'dsh-usage-dashboard' },
      timeout: 15000,
    }, (res) => {
      let body = ''
      res.setEncoding('utf8')
      res.on('data', (c) => { body += c; if (body.length > 65536) req.destroy() })
      res.on('end', () => {
        if (res.statusCode !== 200) { reject(new Error('HTTP ' + res.statusCode + ' ' + body.slice(0, 120))); return }
        try { resolve(JSON.parse(body)) } catch (e) { reject(new Error('bad json: ' + body.slice(0, 120))) }
      })
      res.on('error', reject)
    })
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')) })
    req.on('error', reject)
    req.end()
  })
}

function json(res: { writeHead(status: number, headers: Record<string, string>): void; end(body: string): void }, status: number, obj: unknown): void {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
  res.end(JSON.stringify(obj))
}

/**
 * Mount the balance proxy. Idempotent: on a hot reload the previous fiber's
 * route disposer is not always run before this `apply`, and a duplicate exact
 * route throws (`webserver: duplicate exact route`). We guard with a
 * module-level set of the registrations this plugin owns and reuse the prior
 * disposer when the same route is already registered.
 * @param ctx - owning cordis context.
 */
export function apply(ctx: Context): void {
  const path = '/dsh-usage-dashboard/balance'
  const existing = ownedRoutes.get(path)
  if (existing !== undefined) {
    // Already registered in this module instance; leave the live route alone.
    return
  }
  let dispose: () => void
  try {
    dispose = ctx.webServer.register({
      kind: 'exact',
      path,
      handler: async (req: unknown, res: Parameters<typeof json>[0]) => {
        try {
          const key = readApiKey()
          if (!key) { json(res, 200, { ok: false, error: 'DEEPSEEK_API_KEY not found in credentials' }); return }
          const data = await fetchBalance(key)
          const infos = Array.isArray(data.balance_infos) ? data.balance_infos : []
          const cny = infos.find((i) => i.currency === 'CNY') ?? infos[0]
          json(res, 200, {
            ok: true,
            isAvailable: data.is_available === true,
            currency: cny ? cny.currency : null,
            total: cny ? cny.total_balance : null,
            granted: cny ? cny.granted_balance : null,
            toppedUp: cny ? cny.topped_up_balance : null,
          })
        } catch (e) {
          json(res, 200, { ok: false, error: String((e && (e as Error).message) || e) })
        }
      },
    })
  } catch (err) {
    // A duplicate `exact` route means the prior fiber's route is still live
    // (hot reload re-ran apply before the old fiber disposed). Treat it as
    // already-registered so a reload does not fail the plugin.
    if (String((err as Error).message).includes('duplicate')) return
    throw err
  }
  ownedRoutes.set(path, dispose)
  ctx.effect(() => {
    return () => {
      try { dispose() } catch {}
      ownedRoutes.delete(path)
    }
  }, 'dsh-usage-dashboard: balance route ownership')
}

/** Routes this plugin has already registered, so re-applies are no-ops. */
const ownedRoutes = new Map<string, () => void>()
