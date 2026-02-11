import { useState, useRef, useEffect, useCallback } from "react"
import { useClaudeSocket } from "@/lib/ws"
import { MessageRenderer } from "@/components/MessageRenderer"
import { PromptInput } from "@/components/PromptInput"
import { PermissionPrompt } from "@/components/PermissionPrompt"
import { AskUser } from "@/components/AskUser"
import { SessionSidebar } from "@/components/SessionSidebar"
import { PresetLauncher } from "@/components/PresetLauncher"
import { QuickActions } from "@/components/QuickActions"
import { Menu, Wifi, WifiOff } from "lucide-react"

type Workspace = { name: string; cwd: string; prompt?: string }

export function App() {
  const {
    connected,
    send,
    pushUserMessage,
    sessions,
    activeSessionId,
    setActiveSessionId,
    sessionMessages,
    pendingPermission,
    setPendingPermission,
    pendingQuestion,
    setPendingQuestion,
    isStreaming,
  } = useClaudeSocket()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    const el = scrollRef.current
    if (el) {
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight
      })
    }
  }, [sessionMessages.length])

  // Request session list + workspaces on connect
  useEffect(() => {
    if (connected) {
      send({ type: "list_sessions" })
      fetch("/api/workspaces").then((r) => r.json()).then(setWorkspaces).catch(() => {})
    }
  }, [connected, send])

  const handleLaunch = useCallback((cwd: string, prompt?: string) => {
    send({ type: "create_session", cwd, prompt })
  }, [send])

  const handleSendMessage = useCallback((text: string) => {
    if (!activeSessionId) return
    pushUserMessage(activeSessionId, text)
    send({ type: "send_message", sessionId: activeSessionId, text })
  }, [activeSessionId, pushUserMessage, send])

  const handlePermissionRespond = useCallback((allow: boolean) => {
    if (!pendingPermission || pendingPermission.type !== "permission_request") return
    send({
      type: "permission_response",
      sessionId: pendingPermission.sessionId,
      toolUseId: pendingPermission.toolUseId,
      allow,
    })
    setPendingPermission(null)
  }, [pendingPermission, send, setPendingPermission])

  const handleQuestionRespond = useCallback((answers: Record<string, string>, questions: any[]) => {
    if (!pendingQuestion || pendingQuestion.type !== "ask_user_question") return
    send({
      type: "ask_user_response",
      sessionId: pendingQuestion.sessionId,
      toolUseId: pendingQuestion.toolUseId,
      answers,
      questions,
    })
    setPendingQuestion(null)
  }, [pendingQuestion, send, setPendingQuestion])

  const handleKillSession = useCallback((id: string) => {
    send({ type: "kill_session", sessionId: id })
    if (activeSessionId === id) {
      setActiveSessionId(null)
    }
  }, [send, activeSessionId, setActiveSessionId])

  const openSidebar = useCallback(() => setSidebarOpen(true), [])
  const closeSidebar = useCallback(() => setSidebarOpen(false), [])
  const goHome = useCallback(() => setActiveSessionId(null), [setActiveSessionId])

  const activeSession = sessions.find((s) => s.id === activeSessionId)
  const activeWorkspace = workspaces.find((w) => w.cwd === activeSession?.cwd)

  const hasPermission = pendingPermission?.type === "permission_request" &&
    pendingPermission.sessionId === activeSessionId

  const hasQuestion = pendingQuestion?.type === "ask_user_question" &&
    pendingQuestion.sessionId === activeSessionId

  const inputDisabled = !connected || !!hasPermission || !!hasQuestion

  // Landing page
  if (!activeSessionId) {
    return (
      <div className="min-h-dvh flex flex-col">
        <Header onMenuClick={openSidebar} connected={connected} />
        <PresetLauncher onLaunch={handleLaunch} />
        <SessionSidebar
          open={sidebarOpen}
          onClose={closeSidebar}
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={setActiveSessionId}
          onNewSession={goHome}
          onKillSession={handleKillSession}
        />
      </div>
    )
  }

  // Chat view
  return (
    <div className="min-h-dvh flex flex-col">
      <Header
        onMenuClick={openSidebar}
        connected={connected}
        title={activeSession?.cwd.split("/").pop()}
        subtitle={activeSessionId.slice(0, 8)}
      />

      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <MessageRenderer messages={sessionMessages} isStreaming={isStreaming} />
      </div>

      {hasPermission && pendingPermission.type === "permission_request" && (
        <PermissionPrompt msg={pendingPermission} onRespond={handlePermissionRespond} />
      )}

      {hasQuestion && pendingQuestion.type === "ask_user_question" && (
        <AskUser msg={pendingQuestion} onRespond={handleQuestionRespond} />
      )}

      {activeSession && (
        <QuickActions
          cwd={activeSession.cwd}
          presetPrompt={activeWorkspace?.prompt}
          onSend={handleSendMessage}
        />
      )}

      <PromptInput onSend={handleSendMessage} disabled={inputDisabled} />

      <SessionSidebar
        open={sidebarOpen}
        onClose={closeSidebar}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={setActiveSessionId}
        onNewSession={goHome}
        onKillSession={handleKillSession}
      />
    </div>
  )
}

function Header({ onMenuClick, connected, title, subtitle }: {
  onMenuClick: () => void
  connected: boolean
  title?: string
  subtitle?: string
}) {
  return (
    <header className="flex items-center gap-3 px-3 py-2.5 border-b border-foreground/[0.10] shrink-0">
      <button
        onClick={onMenuClick}
        className="p-2 rounded-lg hover:bg-foreground/[0.06] transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
      >
        <Menu className="w-4 h-4 text-foreground/60" />
      </button>
      {title ? (
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{title}</p>
          <p className="text-[10px] text-foreground/40 font-mono truncate">{subtitle}</p>
        </div>
      ) : (
        <div className="flex-1" />
      )}
      <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-mono ${
        connected ? "text-emerald-600" : "text-red-500"
      }`}>
        {connected ? <Wifi className="w-2.5 h-2.5" /> : <WifiOff className="w-2.5 h-2.5" />}
        {connected ? "live" : "off"}
      </div>
    </header>
  )
}
