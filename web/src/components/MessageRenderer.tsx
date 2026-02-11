import { TextMessage } from "./TextMessage"
import { ToolUse } from "./ToolUse"
import { ToolResult } from "./ToolResult"
import type { ChatMessage } from "@/lib/ws"
import { Bot, Info, AlertCircle, User, Terminal, Loader2 } from "lucide-react"

type Props = {
  messages: ChatMessage[]
  isStreaming?: boolean
}

export function MessageRenderer({ messages, isStreaming }: Props) {
  return (
    <div className="space-y-1 px-3 py-3 max-w-2xl mx-auto">
      {messages.map((msg, i) => (
        <MessageItem key={i} msg={msg} />
      ))}
      {isStreaming && (
        <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
          <Loader2 className="w-3 h-3 animate-spin" />
          <span className="font-mono">working...</span>
        </div>
      )}
    </div>
  )
}

function MessageItem({ msg }: { msg: ChatMessage }) {
  if (msg.type === "user_message") {
    return <UserMessage text={msg.text} />
  }

  if (msg.type !== "sdk_message") return null

  const sdkMsg = msg.message
  if (!sdkMsg) return null

  switch (sdkMsg.type) {
    case "assistant":
      return <AssistantMessage message={sdkMsg} />
    case "result":
      return <ResultMessage message={sdkMsg} />
    case "system":
      return <SystemMessage message={sdkMsg} />
    default:
      return null
  }
}

function UserMessage({ text }: { text: string }) {
  return (
    <div className="group py-2">
      <div className="flex gap-2.5 items-start">
        <div className="w-5 h-5 rounded bg-foreground/[0.08] flex items-center justify-center shrink-0 mt-0.5">
          <User className="w-3 h-3 text-foreground/70" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-medium text-foreground/60 font-mono uppercase tracking-wide mb-1">you</p>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{text}</p>
        </div>
      </div>
    </div>
  )
}

function AssistantMessage({ message }: { message: any }) {
  const content = message.message?.content
  if (!Array.isArray(content)) return null

  const hasText = content.some((b: any) => b.type === "text")

  return (
    <div className="py-2">
      {/* Label row only for text-containing messages */}
      {hasText && (
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-5 h-5 rounded bg-blue-500/10 flex items-center justify-center shrink-0">
            <Bot className="w-3 h-3 text-blue-600" />
          </div>
          <p className="text-[11px] font-medium text-blue-600/80 font-mono uppercase tracking-wide">claude</p>
        </div>
      )}

      <div className={hasText ? "pl-[30px]" : ""}>
        {content.map((block: any, i: number) => {
          switch (block.type) {
            case "text":
              return (
                <div key={i}>
                  <TextMessage text={block.text} />
                </div>
              )
            case "tool_use":
              return <ToolUse key={i} name={block.name} input={block.input || {}} />
            case "tool_result":
              return (
                <ToolResult
                  key={i}
                  toolUseId={block.tool_use_id}
                  content={block.content}
                  isError={block.is_error}
                />
              )
            default:
              return null
          }
        })}
      </div>
    </div>
  )
}

function ResultMessage({ message }: { message: any }) {
  const isError = message.subtype === "error_max_turns" || message.is_error
  const cost = message.cost_usd
  const duration = message.duration_ms
  const inputTokens = message.usage?.input_tokens
  const outputTokens = message.usage?.output_tokens

  return (
    <div className="py-1">
      <div className={`flex items-center gap-1.5 text-[10px] font-mono ${
        isError ? "text-red-600/80" : "text-foreground/40"
      }`}>
        {isError ? (
          <AlertCircle className="w-3 h-3" />
        ) : (
          <Terminal className="w-3 h-3" />
        )}
        <span>{isError ? "error" : "done"}</span>
        {duration != null && <span>| {(duration / 1000).toFixed(1)}s</span>}
        {cost != null && <span>| ${cost.toFixed(4)}</span>}
        {inputTokens != null && outputTokens != null && (
          <span>| {inputTokens}+{outputTokens} tok</span>
        )}
      </div>
    </div>
  )
}

function SystemMessage({ message }: { message: any }) {
  const parts: string[] = []
  if (message.model) parts.push(message.model)
  if (message.cwd) parts.push(message.cwd)
  if (message.tools) parts.push(`${message.tools.length} tools`)

  if (parts.length === 0) return null

  return (
    <div className="py-1">
      <div className="flex items-center gap-1.5 text-[10px] font-mono text-foreground/40">
        <Info className="w-3 h-3" />
        <span>{parts.join(" | ")}</span>
      </div>
    </div>
  )
}
