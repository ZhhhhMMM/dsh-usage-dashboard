# dsh-usage-dashboard

在 DeepSeek Harness Web 的设置里新增 **用量统计** 分区，实时汇总 DSH 自身的
跨会话 Token、会话统计与 DeepSeek 账户余额，并支持全屏查看与多系列图表。

## 功能

- **用量汇总卡**：总 Token、缓存命中率、输入/输出、会话数、LLM/工具/首 token/解码耗时。
- **账户余额卡**：显示 DeepSeek 账户余额（总额 / 赠送 / 充值），可手动刷新。
- **多系列每日趋势图**：按 token 类型（输入 / 缓存命中 / 缓存写入 / 输出）堆叠展示，
  支持 `近 7 日` / `近 30 日` 范围切换与图例。
- **环形占比图**：按同一组 token 类型用环形图展示存量占比（含百分比图例），
  一眼看清输入/缓存/输出的构成，全屏下同样自适应。
- **每日用量折线趋势**：近 7/30 日总 token 随时间的折线图（+ 面积填充 + 数据点）。
- **可展开的会话表格**：每行可展开查看该会话的输入/输出/缓存/轮次/步数/时延明细；
  全屏模式下同样支持。
- **全屏模式**：面板右上角"全屏"按钮把整个仪表盘渲染为固定全屏覆盖层，
  `Esc` 或"退出全屏"返回。

## 原理

不抓取任何外部页面、不需要登录。DSH 本身就通过 session-projection 通道为每个
会话折叠客户端可见的用量投影：

- `tokenUsage`（`@deepseek-ai/dsh-token-meter`）：uncached 输入 / 输出 / 缓存读 / 缓存写
- `sessionStats`（`@deepseek-ai/dsh-session-stats`）：轮次、步数、LLM/工具/首 token/解码耗时

本插件是 client 贡献：注册一个 `settings.section`，订阅会话列表，把每个会话的
`projectionValues.tokenUsage` / `sessionStats` 聚合渲染。余额由 host 侧代理提供：
注册 `GET /dsh-usage-dashboard/balance`，读取 credentials 里的 `DEEPSEEK_API_KEY`，
调用 `https://api.deepseek.com/user/balance`，无需依赖 dsh-harness-pet。

> 为什么占比图/趋势图按 **token 类型** 而不是按**模型**分组：会话列表投影里没有
> 可靠的每会话模型字段（`agentDefaultModel` 只是默认模型工具），因此用
> 输入/缓存命中/缓存写入/输出 四种 token 类型作为稳定的分组维度。若后续投影
> 暴露了可信的 per-session 模型字段，可扩展为按模型分组。

## 安装

```sh
dsh plugin --profile <name> add file:/path/to/dsh-usage-dashboard
```

重启 web 服务后刷新页面；入口在 **设置 > 用量统计**。

## 能力边界

| 动作 | 在哪里执行 | 是否需要审批 |
| --- | --- | --- |
| 读取会话投影并渲染统计 | 浏览器 | 否 |
| 读取账户余额（API key 代理） | 主机（`/dsh-usage-dashboard/balance`） | 否 |

不提供工具、不注册 setting 命名空间、不写文件。

## 开发

```sh
pnpm install
pnpm run check   # typecheck + build；提交 lib/
```

仓库同级 `../dsh` 占用 `link:` 解析用于开发期构建；若缺失，可先用已构建的 `lib/`
通过 `file:` 安装直接运行。`lib/` 为构建产物，建议一并提交以便免构建安装。
