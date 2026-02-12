import { useState, useRef, useEffect, useCallback } from "react"
import { useClaudeSocket } from "@/lib/ws"
import { useSessions, useWorkspaces, useSessionMessages } from "@/lib/queries"
import { MessageRenderer } from "@/components/MessageRenderer"
import { PromptInput } from "@/components/PromptInput"
import { PermissionPrompt } from "@/components/PermissionPrompt"
import { AskUser } from "@/components/AskUser"
import { SessionSidebar } from "@/components/SessionSidebar"
import { PresetLauncher } from "@/components/PresetLauncher"
import { QuickActions } from "@/components/QuickActions"
import { Settings } from "@/components/Settings"
import { Menu, Wifi, WifiOff, Settings as SettingsIcon } from "lucide-react"

export function App() {
  const {
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
  } = useClaudeSocket()

  const { data: sessions } = useSessions()
  const { data: workspaces } = useWorkspaces()
  const { data: sessionMessages } = useSessionMessages(activeSessionId)

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Sync state → URL
  useEffect(() => {
    if (showSettings) return
    const target = activeSessionId ? `/session/${activeSessionId}` : "/"
    if (window.location.pathname !== target) {
      window.history.pushState(null, "", target)
    }
  }, [activeSessionId, showSettings])

  // Handle browser back/forward
  useEffect(() => {
    function onPopState() {
      const match = window.location.pathname.match(/^\/session\/(.+)$/)
      setActiveSessionId(match ? match[1] : null)
      setShowSettings(false)
    }
    window.addEventListener("popstate", onPopState)
    return () => window.removeEventListener("popstate", onPopState)
  }, [setActiveSessionId])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    const el = scrollRef.current
    if (el) {
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight
      })
    }
  }, [sessionMessages.length])

  const handleLaunch = useCallback((cwd: string, prompt?: string) => {
    send({ type: "create_session", cwd, prompt })
  }, [send])

  const handleSendMessage = useCallback((text: string) => {
    if (!activeSessionId) return
    const session = sessions.find((s) => s.id === activeSessionId)
    if (session?.status === "ended") {
      resumeSession(activeSessionId)
    }
    pushUserMessage(activeSessionId, text)
    send({ type: "send_message", sessionId: activeSessionId, text })
  }, [activeSessionId, sessions, resumeSession, pushUserMessage, send])

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
  const goHome = useCallback(() => {
    setActiveSessionId(null)
    setShowSettings(false)
  }, [setActiveSessionId])
  const openSettings = useCallback(() => setShowSettings(true), [])
  const closeSettings = useCallback(() => setShowSettings(false), [])

  const activeSession = sessions.find((s) => s.id === activeSessionId)
  const activeWorkspace = workspaces.find((w) => w.cwd === activeSession?.cwd)

  const hasPermission = pendingPermission?.type === "permission_request" &&
    pendingPermission.sessionId === activeSessionId

  const hasQuestion = pendingQuestion?.type === "ask_user_question" &&
    pendingQuestion.sessionId === activeSessionId

  const inputDisabled = !connected || !!hasPermission || !!hasQuestion

  const sidebar = (
    <SessionSidebar
      open={sidebarOpen}
      onClose={closeSidebar}
      sessions={sessions}
      activeSessionId={activeSessionId}
      onSelectSession={(id) => { setActiveSessionId(id); setShowSettings(false) }}
      onNewSession={goHome}
      onKillSession={handleKillSession}
      onOpenSettings={() => { openSettings(); closeSidebar() }}
    />
  )

  // Settings view
  if (showSettings) {
    return (
      <div className="min-h-dvh flex flex-col">
        <Header onMenuClick={openSidebar} connected={connected} onSettingsClick={openSettings} />
        <Settings onBack={closeSettings} />
        {sidebar}
      </div>
    )
  }

  // Landing page
  if (!activeSessionId) {
    return (
      <div className="min-h-dvh flex flex-col">
        <Header onMenuClick={openSidebar} connected={connected} onSettingsClick={openSettings} />
        <PresetLauncher onLaunch={handleLaunch} />
        {sidebar}
      </div>
    )
  }

  // Chat view
  return (
    <div className="h-dvh flex flex-col overflow-hidden">
      <Header
        onMenuClick={openSidebar}
        connected={connected}
        onSettingsClick={openSettings}
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
      {sidebar}
    </div>
  )
}

function Header({ onMenuClick, onSettingsClick, connected, title, subtitle }: {
  onMenuClick: () => void
  onSettingsClick: () => void
  connected: boolean
  title?: string
  subtitle?: string
}) {
  return (
    <header className="sticky top-0 z-30 flex items-center gap-0 px-2 py-0 border-b-2 border-foreground/[0.08] shrink-0 bg-background">
      <button
        onClick={onMenuClick}
        className="p-2.5 hover:bg-foreground/[0.06] active:bg-foreground/[0.10] transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
      >
        <Menu className="w-[18px] h-[18px] text-foreground/50" />
      </button>

      {title ? (
        <div className="flex-1 min-w-0 py-2 pl-2">
          <p className="text-sm font-semibold tracking-tight truncate">{title}</p>
          <p className="text-[10px] text-foreground/35 font-mono truncate">{subtitle}</p>
        </div>
      ) : (
        <div className="flex-1 py-2 pl-2">
          <p className="text-sm font-mono font-semibold tracking-tight">
            claude<span className="text-foreground/30">/</span>web
          </p>
        </div>
      )}

      <button
        onClick={onSettingsClick}
        className="p-2.5 hover:bg-foreground/[0.06] active:bg-foreground/[0.10] transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
      >
        <SettingsIcon className="w-[16px] h-[16px] text-foreground/35" />
      </button>

      <div className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-mono font-medium border-l-2 ${
        connected
          ? "border-emerald-500 text-emerald-600 bg-emerald-500/10"
          : "border-red-500 text-red-500 bg-red-500/10"
      }`}>
        {connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
        {connected ? "LIVE" : "OFF"}
      </div>
    </header>
  )
}
