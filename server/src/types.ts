import type { SDKMessage, Query } from "@anthropic-ai/claude-agent-sdk"

export type PresetConfig = {
  name: string
  prompt?: string
}

export type AppConfig = {
  port: number
  baseDir: string
  presets: PresetConfig[]
  dangerouslySkipPermissions: boolean
}

export type Workspace = {
  name: string
  cwd: string
  prompt?: string
}

export type SessionState = {
  id: string
  cwd: string
  query: Query | null
  abortController: AbortController
  messages: SDKMessage[]
  createdAt: number
  pendingPermissions: Map<string, PermissionResolver>
  inputQueue: InputQueue
  _startQuery?: (firstMessage: SDKUserMessage) => void
}

export type PermissionResolver = {
  resolve: (result: { behavior: "allow"; updatedInput: Record<string, unknown> } | { behavior: "deny"; message: string }) => void
}

export type InputQueue = {
  push: (msg: SDKUserMessage) => void
  iterable: AsyncIterable<SDKUserMessage>
}

export type SDKUserMessage = {
  type: "user"
  message: { role: "user"; content: string }
  parent_tool_use_id: null
  session_id: string
}

export type SessionInfo = {
  id: string
  cwd: string
  createdAt: number
  messageCount: number
  status: "active" | "ended"
}

export type ClientMessage =
  | { type: "create_session"; cwd: string; prompt?: string }
  | { type: "resume_session"; sessionId: string }
  | { type: "send_message"; sessionId: string; text: string }
  | { type: "permission_response"; sessionId: string; toolUseId: string; allow: boolean; updatedInput?: Record<string, unknown> }
  | { type: "ask_user_response"; sessionId: string; toolUseId: string; answers: Record<string, string>; questions: unknown[] }
  | { type: "list_sessions" }
  | { type: "kill_session"; sessionId: string }

export type ServerMessage =
  | { type: "sdk_message"; sessionId: string; message: SDKMessage }
  | { type: "permission_request"; sessionId: string; toolName: string; input: Record<string, unknown>; toolUseId: string; description?: string }
  | { type: "ask_user_question"; sessionId: string; questions: unknown[]; toolUseId: string }
  | { type: "session_list"; sessions: SessionInfo[] }
  | { type: "session_created"; sessionId: string; cwd: string }
  | { type: "session_ended"; sessionId: string }
  | { type: "error"; message: string }
