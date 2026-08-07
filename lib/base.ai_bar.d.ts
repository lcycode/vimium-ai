/// <reference path="../typings/lib/window.d.ts" />
declare namespace AIBarNS {
/** one message in a chat conversation */
interface Message {
  /** role */ r: "user" | "assistant" | "system"
  /** content */ c: string;
}
/** a question the user asked, which may be replied in the AI bar */
interface QueryRequest {
  /** conversation id */ i: number;
  /** user text */ q: string;
  /** conversation history */ h: AIBarNS.Message[];
  /** extracted page text */ p: AIBarNS.PageText | null;
}
/** extracted text of the current page */
interface PageText {
  /** title */ t: string
  /** url */ u: string
  /** body text */ b: string
}
/** settings that the background AI integration needs */
interface BackendItems {
  /** API key */ aiApiKey: string
  /** provider: only "deepseek" for now */ aiApiProvider: string
  /** API endpoint (base URL) */ aiApiEndpoint: string
  /** model name */ aiModel: string
  /** max output tokens */ aiMaxTokens: number
  /** system prompt */ aiSystemPrompt: string
}
}
