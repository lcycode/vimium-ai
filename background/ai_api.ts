import { settingsCache_ } from "./store"

/* minimal streaming HTTP types; the project's `noLib` DOM types are too thin */
interface AiStreamResponse {
  ok: boolean
  status: number
  body: { getReader(): { read(): Promise<{ done: boolean, value?: Uint8Array }> } } | null
  text(): Promise<string>
}
type AiFetch = (input: string, init?: object) => Promise<AiStreamResponse>

/**
 * Normalize a user-supplied endpoint so the request always hits a chat/completions URL.
 * Accepts either a full base URL ("https://api.deepseek.com") or a partial/full path:
 *   "…/v1/chat/completions", "…/v1", "…/chat/completions", "…/" …
 */
export const normalizeEndpoint_ = (raw: string): string => {
  let url = (raw || "").trim()
  if (!url) { return "https://api.deepseek.com/v1/chat/completions" }
  // strip a trailing slash so the checks below are reliable
  url = url.replace(<RegExpG> /\/+$/, "")
  const lower = url.toLowerCase()
  if (lower.endsWith("/chat/completions")) { return url }
  if (lower.endsWith("/v1")) { return url + "/chat/completions" }
  if (lower.endsWith("/completions")) {
    // user gave something like "…/v1/completions" or "…/completions"; drop the tail
    return url.replace(<RegExpG> /\/+$/, "").replace(<RegExpGI> /\/completions$/i, "") + "/chat/completions"
  }
  // it's a bare host / base URL (or some unknown path): append the default path
  return url + "/v1/chat/completions"
}

/**
 * DeepSeek chat completions (streaming) via the OpenAI-compatible API.
 * We use a locally-typed `fetch` because the codebase's `fetch` global is
 * type-restricted to internal URLs, while this call must reach the network.
 */

declare var AbortController: new () => { signal: { aborted: boolean }, abort(): void }

/** abort the inner request if no response headers arrive within `timeoutMs` */
const withConnectTimeout_ = (
  timeoutMs: number,
): { signal: object, timedOut: () => boolean, stop(): void } => {
  const ctrl = new AbortController()
  let timedOut = false
  const timer = setTimeout((): void => {
    if (!ctrl.signal.aborted) { timedOut = true; ctrl.abort() }
  }, timeoutMs)
  return {
    signal: ctrl.signal,
    timedOut: (): boolean => timedOut,
    stop: (): void => { clearTimeout(timer) },
  }
}

export const callDeepSeek = async (
  messages: AIBarNS.Message[],
  onChunk: (delta: string) => void,
  signal?: { aborted: boolean }
): Promise<string> => {
  const { aiApiKey, aiApiEndpoint, aiModel, aiMaxTokens } = settingsCache_
  if (!aiApiKey) {
    throw new Error("DeepSeek API key is not set. Please set it in the options page.")
  }
  const endpoint = normalizeEndpoint_(aiApiEndpoint)
  const body = {
    model: aiModel || "deepseek-chat",
    messages: messages.map(({ r, c }) => ({ role: r, content: c })),
    stream: true,
    max_tokens: aiMaxTokens || 4096,
  }
  const connect = withConnectTimeout_(20_000)
  let response: AiStreamResponse
  try {
    response = await (fetch as unknown as AiFetch)(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + aiApiKey,
      },
      body: JSON.stringify(body),
      signal: connect.signal,
    })
    connect.stop()
  } catch (e) {
    connect.stop()
    // fetch rejects on network failure / DNS / TLS / aborted; give the user actionable detail
    const msg = (e as Error).message || String(e)
    if (signal && signal.aborted) { throw new Error("请求已取消（可能是超时）。") }
    if (connect.timedOut()) { throw new Error("连接 " + endpoint + " 超时（20 秒未收到响应）。请检查网络，以及 endpoint 是否可访问。") }
    throw new Error("无法连接到 API 端点 " + endpoint + "：" + msg +
        "。请检查网络，以及选项中的“API endpoint”格式（应类似 https://api.deepseek.com）。")
  }
  if (!response.ok) {
    const detail = await response.text().catch(() => "")
    const hint = response.status === 401 ? "（API key 可能无效）"
        : response.status === 404 ? "（端点路径可能错误）"
        : response.status === 429 ? "（请求过于频繁或额度不足）"
        : ""
    throw new Error(`API 返回错误 ${response.status}${hint}。地址：${endpoint}。详情：${detail.slice(0, 300)}`)
  }
  if (!response.body) {
    throw new Error("API 返回了空的响应体（stream 未启用？）。")
  }
  const reader = response.body.getReader()
  const decoder = new TextDecoder("utf-8")
  let full = ""
  let buffer = ""
  for (;;) {
    const { done, value } = await reader.read()
    if (done) { break }
    buffer += decoder.decode(value, { stream: true })
    // SSE: lines are separated by \n; each data line starts with "data: "
    let idx: number
    while ((idx = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, idx).trim()
      buffer = buffer.slice(idx + 1)
      if (!line.startsWith("data:")) { continue }
      const data = line.slice(5).trim()
      if (data === "[DONE]") { continue }
      try {
        const parsed = JSON.parse(data) as {
          choices?: Array<{ delta?: { content?: string } }>
        }
        const delta = parsed.choices?.[0]?.delta?.content
        if (delta) {
          full += delta
          onChunk(delta)
        }
      } catch { /* ignore malformed SSE frames */ }
    }
  }
  return full
}
