import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { SessionInfo, ChatMessage } from "./ws"

// --- Config types ---

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

async function assertOk(res: Response): Promise<Response> {
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res
}

async function fetchSessions(): Promise<SessionInfo[]> {
  const res = await assertOk(await fetch("/api/sessions"))
  return res.json()
}

async function fetchWorkspaces(): Promise<{ name: string; cwd: string; prompt?: string }[]> {
  const res = await assertOk(await fetch("/api/workspaces"))
  return res.json()
}

async function fetchSessionMessages(sessionId: string): Promise<ChatMessage[]> {
  const res = await assertOk(await fetch(`/api/sessions/${sessionId}/messages`))
  const sdkMessages: unknown[] = await res.json()
  return sdkMessages.map((m) => ({
    type: "sdk_message" as const,
    sessionId,
    message: m,
  }))
}

export function useSessions() {
  return useQuery({
    queryKey: ["sessions"],
    queryFn: fetchSessions,
    initialData: [],
  })
}

export function useWorkspaces() {
  return useQuery({
    queryKey: ["workspaces"],
    queryFn: fetchWorkspaces,
    initialData: [],
  })
}

export function useSessionMessages(sessionId: string | null) {
  return useQuery({
    queryKey: ["messages", sessionId],
    queryFn: () => fetchSessionMessages(sessionId!),
    enabled: !!sessionId,
    initialData: [],
  })
}

async function fetchCommands(cwd: string): Promise<{ name: string; description?: string }[]> {
  const res = await assertOk(await fetch(`/api/commands?cwd=${encodeURIComponent(cwd)}`))
  return res.json()
}

export function useCommands(cwd: string | undefined) {
  return useQuery({
    queryKey: ["commands", cwd],
    queryFn: () => fetchCommands(cwd!),
    enabled: !!cwd,
    initialData: [],
  })
}

// --- Config ---

async function fetchConfig(): Promise<AppConfig> {
  const res = await assertOk(await fetch("/api/config"))
  return res.json()
}

async function updateConfig(config: AppConfig): Promise<AppConfig> {
  const res = await assertOk(await fetch("/api/config", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  }))
  return res.json()
}

export function useConfig() {
  return useQuery({
    queryKey: ["config"],
    queryFn: fetchConfig,
  })
}

export function useUpdateConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: updateConfig,
    onSuccess: (data) => {
      qc.setQueryData(["config"], data)
      qc.invalidateQueries({ queryKey: ["workspaces"] })
    },
  })
}
