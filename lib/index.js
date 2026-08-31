// ../../deepseek-harness/plugins/dsh-usage-dashboard/src/index.ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { request as httpsRequest } from "node:https";
var name = "dsh-usage-dashboard";
var inject = ["webServer"];
var NL = String.fromCharCode(10);
var DQ = String.fromCharCode(34);
var SQ = String.fromCharCode(39);
function readApiKey() {
  const candidates = [];
  if (process.env.DSH_HOME) candidates.push(process.env.DSH_HOME);
  candidates.push(join(homedir(), ".dsh"));
  for (const home of candidates) {
    try {
      const raw = readFileSync(join(home, ".credentials.yaml"), "utf8");
      for (const line of raw.split(NL)) {
        const idx = line.indexOf("DEEPSEEK_API_KEY");
        if (idx === -1) continue;
        const colon = line.indexOf(":", idx);
        if (colon === -1) continue;
        let v = line.slice(colon + 1).trim();
        if (v.startsWith(DQ) && v.endsWith(DQ) || v.startsWith(SQ) && v.endsWith(SQ)) v = v.slice(1, -1);
        if (v) return v;
      }
    } catch {
    }
  }
  return null;
}
function fetchBalance(key) {
  return new Promise((resolve, reject) => {
    const req = httpsRequest("https://api.deepseek.com/user/balance", {
      method: "GET",
      headers: { Authorization: "Bearer " + key, "User-Agent": "dsh-usage-dashboard" },
      timeout: 15e3
    }, (res) => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (c) => {
        body += c;
        if (body.length > 65536) req.destroy();
      });
      res.on("end", () => {
        if (res.statusCode !== 200) {
          reject(new Error("HTTP " + res.statusCode + " " + body.slice(0, 120)));
          return;
        }
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(new Error("bad json: " + body.slice(0, 120)));
        }
      });
      res.on("error", reject);
    });
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("timeout"));
    });
    req.on("error", reject);
    req.end();
  });
}
function json(res, status, obj) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  res.end(JSON.stringify(obj));
}
function apply(ctx) {
  const path = "/dsh-usage-dashboard/balance";
  const existing = ownedRoutes.get(path);
  if (existing !== void 0) {
    return;
  }
  let dispose;
  try {
    dispose = ctx.webServer.register({
      kind: "exact",
      path,
      handler: async (req, res) => {
        try {
          const key = readApiKey();
          if (!key) {
            json(res, 200, { ok: false, error: "DEEPSEEK_API_KEY not found in credentials" });
            return;
          }
          const data = await fetchBalance(key);
          const infos = Array.isArray(data.balance_infos) ? data.balance_infos : [];
          const cny = infos.find((i) => i.currency === "CNY") ?? infos[0];
          json(res, 200, {
            ok: true,
            isAvailable: data.is_available === true,
            currency: cny ? cny.currency : null,
            total: cny ? cny.total_balance : null,
            granted: cny ? cny.granted_balance : null,
            toppedUp: cny ? cny.topped_up_balance : null
          });
        } catch (e) {
          json(res, 200, { ok: false, error: String(e && e.message || e) });
        }
      }
    });
  } catch (err) {
    if (String(err.message).includes("duplicate")) return;
    throw err;
  }
  ownedRoutes.set(path, dispose);
  ctx.effect(() => {
    return () => {
      try {
        dispose();
      } catch {
      }
      ownedRoutes.delete(path);
    };
  }, "dsh-usage-dashboard: balance route ownership");
}
var ownedRoutes = /* @__PURE__ */ new Map();
export {
  apply,
  inject,
  name
};
//# sourceMappingURL=index.js.map
