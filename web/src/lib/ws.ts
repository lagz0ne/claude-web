import { useCallback, useEffect, useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"

export type ServerMessage =
  | { type: "sdk_message"; sessionId: string; message: any }
  | { type: "permission_request"; sessionId: string; toolName: string; input: any; toolUseId: string; description?: string }
  | { type: "ask_user_question"; sessionId: string; questions: any[]; toolUseId: string }
  | { type: "session_list"; sessions: SessionInfo[] }
  | { type: "session_created"; sessionId: string; cwd: string }
  | { type: "session_ended"; sessionId: string }
  | { type: "error"; message: string }

export type LocalMessage =
  | { type: "user_message"; sessionId: string; text: string; timestamp: number }

export type ChatMessage = ServerMessage | LocalMessage

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
  | { type: "permission_response"; sessionId: string; toolUseId: string; allow: boolean; updatedInput?: any }
  | { type: "ask_user_response"; sessionId: string; toolUseId: string; answers: Record<string, string>; questions: any[] }
  | { type: "list_sessions" }
  | { type: "kill_session"; sessionId: string }

export function useClaudeSocket() {
  const wsRef = useRef<WebSocket | null>(null)
  const queryClient = useQueryClient()
  const [connected, setConnected] = useState(false)
  const [activeSessionId, setActiveSessionId] = useState<string | null>(() => {
    const match = window.location.pathname.match(/^\/session\/(.+)$/)
    return match ? match[1] : null
  })
  const [pendingPermission, setPendingPermission] = useState<ServerMessage | null>(null)
  const [pendingQuestion, setPendingQuestion] = useState<ServerMessage | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)

  const queryClientRef = useRef(queryClient)
  queryClientRef.current = queryClient

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
    const wsUrl = `${protocol}//${window.location.host}/ws`

    function connect() {
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => setConnected(true)
      ws.onclose = () => {
        setConnected(false)
        setTimeout(connect, 2000)
      }

      ws.onmessage = (event) => {
        const msg: ServerMessage = JSON.parse(event.data)
        const qc = queryClientRef.current

        switch (msg.type) {
          case "sdk_message": {
            const sdkMsg = msg.message
            if (sdkMsg?.type === "assistant" && sdkMsg?.message?.stop_reason === null) {
              setIsStreaming(true)
            } else if (sdkMsg?.type === "result" || (sdkMsg?.type === "assistant" && sdkMsg?.message?.stop_reason)) {
              setIsStreaming(false)
            }

            qc.setQueryData<ChatMessage[]>(["messages", msg.sessionId], (old) => [...(old || []), msg])
            break
          }
          case "session_created": {
            setActiveSessionId(msg.sessionId)
            qc.invalidateQueries({ queryKey: ["sessions"] })
            break
          }
          case "session_ended": {
            setIsStreaming(false)
            qc.invalidateQueries({ queryKey: ["sessions"] })
            break
          }
          case "session_list": {
            qc.setQueryData(["sessions"], msg.sessions)
            break
          }
          case "permission_request": {
            setIsStreaming(false)
            setPendingPermission(msg)
            break
          }
          case "ask_user_question": {
            setIsStreaming(false)
            setPendingQuestion(msg)
            break
          }
          case "error": {
            console.error("Server error:", msg.message)
            break
          }
        }
      }
    }

    connect()
    return () => wsRef.current?.close()
  }, [])

  const send = useCallback((msg: ClientMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg))
    }
  }, [])

  const pushUserMessage = useCallback((sessionId: string, text: string) => {
    const local: LocalMessage = {
      type: "user_message",
      sessionId,
      text,
      timestamp: Date.now(),
    }
    queryClient.setQueryData<ChatMessage[]>(["messages", sessionId], (old) => [...(old || []), local])
    setIsStreaming(true)
  }, [queryClient])

  const resumeSession = useCallback((sessionId: string) => {
    send({ type: "resume_session", sessionId })
  }, [send])

  return {
    connected,
    send,
    pushUserMessage,
    activeSessionId,
    setActiveSessionId,
    resumeSession,
    pendingPermission,
    setPendingPermission,
    pendingQuestion,
    setPendingQuestion,
    isStreaming,
  }
}
