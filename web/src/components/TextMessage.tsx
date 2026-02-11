import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"

export function TextMessage({ text }: { text: string }) {
  return (
    <div className="markdown-body text-sm break-words">
      <Markdown remarkPlugins={[remarkGfm]}>{text}</Markdown>
    </div>
  )
}
