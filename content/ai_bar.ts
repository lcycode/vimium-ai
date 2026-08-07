import {
  fgCache, doc, locHref
} from "../lib/utils"
import { removeHandler_, replaceOrSuppressMost_, getMappedKey, isEscape_, prevent_ } from "../lib/keyboard_utils"
import {
  isHTML_, createElement_, setClassName_s, appendNode_s, textContent_s,
  setDisplaying_s, toggleClass_s
} from "../lib/dom_utils"
import { adjustUI, addUIElement } from "./dom_ui"
import { post_ } from "./port"

/// <reference path="../lib/base.ai_bar.d.ts" />

/** fixed width of the AI bar panel, in px */
const kWidth = 560
/** max height of the whole panel, in px */
const kMaxHeight = 480
/** max chars of page body text sent to the AI */
const kMaxPageText = 8000

let box: HTMLDivElement | null = null
let input_: HTMLTextAreaElement | null = null
let answerEl_: HTMLDivElement | null = null
let historyEl_: HTMLDivElement | null = null
let statusEl_: HTMLDivElement | null = null
let isActive = false
let isVisible = false
let isStreaming = false
let conversationId_ = 0
let history_: AIBarNS.Message[] = []
let timeoutId_ = 0
let ackTimeoutId_ = 0

const clearSendTimeout = (): void => {
  if (timeoutId_) { clearTimeout(timeoutId_); timeoutId_ = 0 }
}

const clearAckTimeout = (): void => {
  if (ackTimeoutId_) { clearTimeout(ackTimeoutId_); ackTimeoutId_ = 0 }
}

type SimpleKeyResult = HandlerResult

/** extract visible text content of the current page */
const extractPageText = (): AIBarNS.PageText | null => {
  if (!isHTML_()) { return null }
  try {
    const title = (doc.title || "").slice(0, 200)
    const url = locHref()
    const body = doc.body
    if (!body) { return null }
    const skipTags = new Set!(["SCRIPT", "STYLE", "NOSCRIPT", "IFRAME", "SVG", "META", "LINK", "HEAD", "TITLE", "NOSCRIPT", "TEMPLATE"])
    const walker = doc.createTreeWalker(body, NodeFilter.SHOW_TEXT, {
      acceptNode(node: Text): number {
        const parent = node.parentElement as SafeElement | null
        if (!parent || skipTags.has(parent.tagName)) { return NodeFilter.FILTER_REJECT }
        if (parent.getAttribute && parent.getAttribute("aria-hidden") === "true") { return NodeFilter.FILTER_REJECT }
        const style = (window.getComputedStyle ? window.getComputedStyle(parent) : null)
        if (style && (style.display === "none" || style.visibility === "hidden" || style.opacity === "0")) {
          return NodeFilter.FILTER_REJECT
        }
        const text = (node.nodeValue || "").trim()
        if (!text) { return NodeFilter.FILTER_REJECT }
        return NodeFilter.FILTER_ACCEPT
      }
    })
    let bodyText = ""
    let node: Text | null
    while ((node = walker.nextNode() as Text | null)) {
      const t = (node.nodeValue || "").trim()
      if (t) {
        bodyText += t + "\n"
        if (bodyText.length > kMaxPageText) {
          bodyText = bodyText.slice(0, kMaxPageText) + "\n..."
          break
        }
      }
    }
    return { t: title, u: url, b: bodyText || "(no visible text)" }
  } catch {
    return null
  }
}

/** simple markdown-ish rendering: code blocks, inline code, bold, links, paragraphs */
const renderMarkdown = (text: string): string => {
  const escHtml = (s: string): string => s.replace(<RegExpG> /&/g, "&amp;").replace(<RegExpG> /</g, "&lt;").replace(<RegExpG> />/g, "&gt;")
  let html = escHtml(text)
  // code blocks ```...```
  html = html.replace(<RegExpG & RegExpSearchable<1>> /```([\s\S]*?)```/g, (_m: string, code: string): string => {
    return '<pre class="VC-AI-code">' + code.trim() + "</pre>"
  })
  // inline code `...`
  html = html.replace(<RegExpG & RegExpSearchable<0>> /`([^`\n]+)`/g, '<code class="VC-AI-inline">$1</code>')
  // bold **...**
  html = html.replace(<RegExpG & RegExpSearchable<0>> /\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>")
  // links [text](url)
  html = html.replace(<RegExpG & RegExpSearchable<0>> /\[([^\]\n]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
  // paragraphs
  html = html.split(<RegExpOne> /\n{2,}/).map(p => "<p>" + p.replace(<RegExpG> /\n/g, "<br>") + "</p>").join("")
  return html
}

const setStatus = (text: string, isError?: boolean): void => {
  if (!statusEl_) { return }
  textContent_s(statusEl_, text)
  toggleClass_s(statusEl_, "VC-AI-error", !!isError)
}

const renderHistory = (): void => {
  if (!historyEl_) { return }
  historyEl_.innerHTML = ""
  for (const item of history_) {
    if (item.r === "user") {
      const div = createElement_("div")
      setClassName_s(div, "VC-AI-q")
      textContent_s(div, item.c)
      appendNode_s(historyEl_, div)
    } else if (item.r === "assistant" && item.c) {
      const div = createElement_("div")
      setClassName_s(div, "VC-AI-a")
      div.innerHTML = renderMarkdown(item.c)
      appendNode_s(historyEl_, div)
    }
  }
  if (historyEl_.scrollHeight) { historyEl_.scrollTop = historyEl_.scrollHeight }
}

const onSendTimeout = (): void => {
  if (!isStreaming) { return }
  setStatus("请求超时（45 秒未返回）。请在选项页检查 API endpoint 格式（如 https://api.deepseek.com）和 API key 是否正确。", true)
  statusEl_ && (statusEl_.style.display = "block")
  isStreaming = false
  if (isVisible && input_) { input_.focus() }
}

const onKeyHandler = (event: HandlerNS.Event): SimpleKeyResult => {
  const key = getMappedKey(event, kModeId.NO_MAP_KEY)
  if (isEscape_(key)) {
    prevent_(event.e)
    hide()
    return HandlerResult.Prevent
  }
  // let everything else flow to the focused textarea
  return HandlerResult.Nothing
}

/** re-show a panel that was hidden, keeping its history, input text and streaming state */
const show = (): void => {
  if (!box) { return }
  isActive = true
  isVisible = true
  box.style.display = "flex"
  adjustUI(1)
  replaceOrSuppressMost_(kHandler.aiBar, onKeyHandler)
  if (isStreaming) {
    // the send timeout was cleared on hide; re-arm it so a hung request doesn't lock the panel forever
    clearSendTimeout()
    timeoutId_ = setTimeout(onSendTimeout, 45000)
  }
  if (input_) { input_.focus() }
}

export const hide = (_fromInner?: 0 | 1 | 2): void => {
  if (!isVisible) { return }
  isVisible = false
  clearSendTimeout()
  clearAckTimeout()
  removeHandler_(kHandler.aiBar)
  if (box) { setDisplaying_s(box, 0) }
  adjustUI(2)
}

export const activate = (_options: CmdOptions[kFgCmd.aiBar], _count: number): void => {
  if (!isHTML_()) { return }
  if (box) {
    // already built once: pressing ":" toggles the panel, preserving history
    isVisible ? hide() : show()
    return
  }
  isActive = true
  isVisible = true
  history_ = []
  conversationId_++

  // build panel
  box = createElement_("div")
  setClassName_s(box, "VC-AI-Box" + (fgCache.d || ""))
  const style = box.style
  style.cssText = `position:fixed;top:8px;left:50%;transform:translateX(-50%);width:${kWidth}px;max-width:92vw;` +
    `max-height:${kMaxHeight}px;display:flex;flex-direction:column;z-index:2147483646;` +
    `background:#fff;color:#222;border:1px solid #ccc;border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,.25);` +
    `font:13px/1.5 system-ui,sans-serif;overflow:hidden;`

  // conversation history
  historyEl_ = createElement_("div")
  setClassName_s(historyEl_, "VC-AI-History")
  historyEl_.style.cssText = "flex:1;overflow-y:auto;padding:10px;min-height:60px;"
  appendNode_s(box, historyEl_)

  // streaming answer area
  answerEl_ = createElement_("div")
  setClassName_s(answerEl_, "VC-AI-Answer")
  answerEl_.style.cssText = "display:none;flex:1;overflow-y:auto;padding:10px;border-top:1px solid #eee;"
  appendNode_s(box, answerEl_)

  // status line
  statusEl_ = createElement_("div")
  setClassName_s(statusEl_, "VC-AI-Status")
  statusEl_.style.cssText = "display:none;padding:6px 10px;color:#888;font-size:12px;border-top:1px solid #f0f0f0;" +
    "white-space:pre-wrap;word-break:break-all;"
  appendNode_s(box, statusEl_)

  // input row
  const row = createElement_("div")
  row.style.cssText = "display:flex;align-items:center;gap:8px;border-top:1px solid #eee;padding:8px;"
  input_ = doc.createElement("textarea") as HTMLTextAreaElement & SafeHTMLElement
  input_.rows = 2
  input_.placeholder = "Ask about this page…  (Enter to send, Shift+Enter for newline, Esc to close)"
  input_.style.cssText = "flex:1;resize:none;border:1px solid #ccc;border-radius:6px;padding:6px 8px;" +
    "font:inherit;color:inherit;background:transparent;outline:none;"
  const sendBtn = doc.createElement("button") as HTMLButtonElement & SafeHTMLElement
  sendBtn.textContent = "Send"
  sendBtn.style.cssText = "border:none;background:#4a7dff;color:#fff;border-radius:6px;padding:6px 14px;cursor:pointer;"
  appendNode_s(row, input_)
  appendNode_s(row, sendBtn)
  appendNode_s(box, row)

  // install CSS
  const css = document.createElement("style")
  css.textContent =
    ".VC-AI-Box *{box-sizing:border-box}" +
    ".VC-AI-History .VC-AI-q{background:#f1f3f5;border-radius:6px;padding:6px 8px;margin:0 0 6px;white-space:pre-wrap;word-break:break-word}" +
    ".VC-AI-History .VC-AI-a{margin:0 0 10px;white-space:normal;word-break:break-word;color:#222}" +
    ".VC-AI-History p{margin:4px 0}" +
    ".VC-AI-Answer{padding:10px;white-space:normal;word-break:break-word;color:#222}" +
    ".VC-AI-Answer p{margin:4px 0}" +
    ".VC-AI-code{background:#f6f8fa;border-radius:6px;padding:8px;overflow-x:auto;font:12px/1.5 monospace;margin:6px 0}" +
    ".VC-AI-inline{background:#f6f8fa;border-radius:4px;padding:1px 4px;font-family:monospace}" +
    ".VC-AI-error{color:#c0392b}" +
    (fgCache.m ? "" : ".VC-AI-Box{color-scheme:light}") +
    "textarea{font:inherit}"
  box.appendChild(css)
  // dark mode if active
  if (fgCache.m) {
    box.style.background = "#222"
    box.style.color = "#eee"
    box.style.borderColor = "#444"
  }

  // addUIElement creates the shared Vimium C shadow root if it doesn't exist yet,
  // so the very first ":" press works even before any other UI (link hints / HUD) has run
  addUIElement(box, AdjustType.DEFAULT)

  const onSend = (): void => {
    if (isStreaming || !input_) { return }
    const q = input_.value.trim()
    if (!q) { return }
    isStreaming = true
    input_.value = ""
    // show user message immediately
    if (historyEl_) {
      const div = createElement_("div")
      setClassName_s(div, "VC-AI-q")
      textContent_s(div, q)
      appendNode_s(historyEl_, div)
    }
    history_.push({ r: "user", c: q })
    if (answerEl_) {
      answerEl_.innerHTML = ""
      answerEl_.style.display = "block"
      answerEl_.textContent = "…"
    }
    setStatus("正在发送请求…（等待后台确认）")
    statusEl_ && (statusEl_.style.display = "block")
    try {
      if (!Build.NDEBUG) { console.log("[AI] sending query id=", conversationId_) }
      post_({
        H: kFgReq.aiQuery,
        i: conversationId_,
        q,
        h: history_,
        p: extractPageText(),
      })
      clearSendTimeout()
      timeoutId_ = setTimeout(onSendTimeout, 45000)
      // if the background doesn't ack within 8s, the query likely never reached it
      clearAckTimeout()
      ackTimeoutId_ = setTimeout((): void => {
        if (!isStreaming) { return }
        setStatus("后台未确认收到请求（8 秒内无响应）。请打开 chrome://extensions → Vimium C → 点“service worker”查看其 console 是否有 [AI] handleAiQuery 日志；若没有，说明消息未到达后台。", true)
        statusEl_ && (statusEl_.style.display = "block")
      }, 8000)
    } catch (e) {
      setStatus("发送失败: " + (e as Error).message, true)
      isStreaming = false
      if (input_) { input_.focus() }
    }
  }

  sendBtn.onclick = onSend

  input_.onkeydown = (event: KeyboardEvent): void => {
    if (event.key === "Enter" && !event.shiftKey) {
      prevent_(event as never)
      onSend()
    } else if (event.key === "Escape") {
      prevent_(event as never)
      hide()
    }
    // stop propagation so Vimium C's global handler doesn't intercept
    event.stopPropagation()
  }
  input_.onkeyup = (event: KeyboardEvent): void => { event.stopPropagation() }
  input_.onkeypress = (event: KeyboardEvent): void => { event.stopPropagation() }
  input_.oninput = (event: Event): void => { event.stopPropagation() }

  // suppress the extension's own key handling while active, letting all keys into the textarea
  replaceOrSuppressMost_(kHandler.aiBar, onKeyHandler)

  input_.focus()
  adjustUI(1)
}

/** handle background messages: ai_chunk / ai_done / ai_error */
export const aiOnChunk = (id: number, delta: string): void => {
  if (!isActive || id !== conversationId_ || !answerEl_) { return }
  clearSendTimeout()
  answerEl_.style.display = "block"
  statusEl_ && (statusEl_.style.display = "none")
  if (answerEl_.textContent === "…") { answerEl_.innerHTML = "" }
  // append raw text and re-render markdown; keep it simple by accumulating raw text
  const current = answerEl_.getAttribute("data-raw") || ""
  answerEl_.setAttribute("data-raw", current + delta)
  answerEl_.innerHTML = renderMarkdown(current + delta)
  answerEl_.scrollTop = answerEl_.scrollHeight
}

export const aiOnDone = (id: number, full: string): void => {
  if (!isActive || id !== conversationId_ || !answerEl_) { return }
  clearSendTimeout()
  answerEl_.setAttribute("data-raw", full)
  answerEl_.innerHTML = renderMarkdown(full)
  answerEl_.scrollTop = answerEl_.scrollHeight
  history_.push({ r: "assistant", c: full })
  renderHistory()
  answerEl_.style.display = "none"
  setStatus("")
  statusEl_ && (statusEl_.style.display = "none")
  isStreaming = false
  if (input_) { input_.focus() }
}

export const aiOnError = (id: number, message: string): void => {
  if (!isActive || id !== conversationId_) { return }
  clearSendTimeout()
  if (!Build.NDEBUG) { console.error("[AI] error id=", id, message) }
  answerEl_ && (answerEl_.style.display = "block")
  setStatus(message, true)
  statusEl_ && (statusEl_.style.display = "block")
  isStreaming = false
  if (input_) { input_.focus() }
}

/** the background confirms receipt and reports how the request will be made */
export const aiOnAck = (id: number, url: string, keySet: boolean, model: string): void => {
  if (!isActive || id !== conversationId_) { return }
  clearAckTimeout()
  setStatus("→ 后台已收到请求\n" + (url || "(未设置)") + "\n模型 " + model + "，API key " + (keySet ? "已设置" : "未设置"))
  statusEl_ && (statusEl_.style.display = "block")
}
