import { settingsCache_ } from "./store"
import { safePost } from "./ports"
import { callDeepSeek, normalizeEndpoint_ } from "./ai_api"

declare var AbortController: new () => { signal: { aborted: boolean }, abort(): void }
type AbortControllerType = { signal: { aborted: boolean }, abort(): void }

/** active streaming sessions: conversationId -> AbortController */
const sessions_ = new Map<number, AbortControllerType>()

/** overall watchdog: fail the session if neither chunks nor done nor error arrive in time */
const kWatchdogMs = 40_000

const systemPrompt = (): string => settingsCache_.aiSystemPrompt ||
    "You are Vimium C's AI assistant, embedded in the browser. The user gives you the text of the current webpage plus a question. Answer concisely in the user's language. If the page content is insufficient, say so."

/** build the messages list: system + optional page text + history */
const buildMessages = (req: FgReq[kFgReq.aiQuery]): AIBarNS.Message[] => {
  const msgs: AIBarNS.Message[] = [{ r: "system", c: systemPrompt() }]
  if (req.p && req.p.b) {
    msgs.push({
      r: "system",
      c: "Current webpage content:\nTitle: " + (req.p.t || "") +
        "\nURL: " + (req.p.u || "") + "\n---\n" + req.p.b,
    })
  }
  // history already includes the user's current question as the last message
  for (const m of req.h) {
    if (m.r === "system") { continue }
    msgs.push(m)
  }
  return msgs
}

export const handleAiQuery = (req: FgReq[kFgReq.aiQuery], port: Port): void => {
  const id = req.i
  // cancel any previous session for this conversation id
  const old = sessions_.get(id)
  if (old) { old.abort() }
  const ctrl = new AbortController()
  sessions_.set(id, ctrl)

  const sendChunk = (delta: string): void => {
    if (!delta) { return }
    safePost(port, { N: kBgReq.ai_chunk, i: id, d: delta })
  }
  const sendDone = (full: string): void => {
    sessions_.delete(id)
    safePost(port, { N: kBgReq.ai_done, i: id, f: full })
  }
  const sendError = (message: string): void => {
    sessions_.delete(id)
    safePost(port, { N: kBgReq.ai_error, i: id, m: message })
  }

  if (!Build.NDEBUG) { console.log("[AI] handleAiQuery id=", id, "key set=", !!settingsCache_.aiApiKey, "endpoint=", settingsCache_.aiApiEndpoint) }

  // tell the content script immediately that the background received the query,
  // so the user can distinguish "message never arrived" from "request failed"
  safePost(port, {
    N: kBgReq.ai_ack,
    i: id,
    u: normalizeEndpoint_(settingsCache_.aiApiEndpoint || ""),
    k: !!settingsCache_.aiApiKey,
    m: settingsCache_.aiModel || "deepseek-chat",
  })

  let watchdog = setTimeout((): void => {
    if (!ctrl.signal.aborted) { ctrl.abort() }
    sendError("请求超时（40 秒未返回）。请检查 API endpoint 和网络，并查看扩展后台 console 的 [AI] 日志。")
  }, kWatchdogMs)

  let messages: AIBarNS.Message[]
  try {
    messages = buildMessages(req)
  } catch (e) {
    clearTimeout(watchdog)
    sendError("Failed to build request: " + (e as Error).message)
    return
  }
  callDeepSeek(messages, sendChunk, ctrl.signal).then((full: string) => {
    clearTimeout(watchdog)
    if (ctrl.signal.aborted) {
      // watchdog or user cancellation already surfaced; do not send a late done
      sessions_.delete(id)
      return
    }
    sendDone(full)
  }, (e: Error) => {
    clearTimeout(watchdog)
    if (ctrl.signal.aborted) {
      // cancelled by the user (or the watchdog); do not surface as an error
      sessions_.delete(id)
      return
    }
    sendError(e.message || String(e))
  })
}

export const handleAiCancel = (id: number): void => {
  const ctrl = sessions_.get(id)
  if (ctrl) { ctrl.abort() }
}
