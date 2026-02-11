import { type ReactElement } from "react"
import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { DiagramEmbed } from "./DiagramEmbed"

export function TextMessage({ text }: { text: string }) {
  return (
    <div className="markdown-body text-sm break-words">
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
          pre({ children }) {
            const child = children as ReactElement<{ className?: string; children?: unknown }>
            if (child?.props?.className) {
              const lang = /language-(\w+)/.exec(child.props.className)?.[1]
              if (lang === "mermaid" || lang === "d2") {
                const source = String(child.props.children).replace(/\n$/, "")
                return <DiagramEmbed source={source} format={lang} />
              }
            }
            return <pre>{children}</pre>
          },
        }}
      >
        {text}
      </Markdown>
    </div>
  )
}
