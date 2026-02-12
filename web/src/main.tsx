import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import "@/styles/globals.css"
import { App } from "./App"

// Initialize theme from localStorage before React mounts (prevents flash)
const savedTheme = localStorage.getItem("theme")
if (savedTheme === "dark") {
  document.documentElement.dataset.theme = "dark"
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      refetchOnWindowFocus: false,
    },
  },
})

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
)
