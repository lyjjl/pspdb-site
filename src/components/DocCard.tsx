import { useState } from "react"

import type { Doc, Field } from "@/data/pspdb"

import { Button } from "@/components/ui/button"
import { Check, Copy, Download } from "lucide-react"

interface DocCardProps {
  doc: Doc
  values: Record<string, string>
  onChange: (id: string, value: string) => void
  /** 获取已套用填写内容的文本；md 保留标记，txt 去除标记 */
  getText: (format: "txt" | "md") => string
  onDownload: (ext: "txt" | "md") => void
}

/** 行内 Markdown：**加粗**、`代码`、[文本](链接)、裸 URL 自动识别 */
function InlineMarkdown({ text }: { text: string }) {
  const parts = text.split(
    /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\)|https?:\/\/[^\s，。；：、！？）】"']+)/g
  )
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={i}>{part.slice(2, -2)}</strong>
        }
        if (part.startsWith("`") && part.endsWith("`")) {
          return (
            <code
              key={i}
              className="rounded-sm bg-muted px-1 font-mono text-[0.875em]"
            >
              {part.slice(1, -1)}
            </code>
          )
        }
        const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part)
        if (link) {
          return (
            <a
              key={i}
              href={link[2]}
              target="_blank"
              rel="noreferrer"
              className="text-primary underline decoration-primary/40 underline-offset-4 transition-colors hover:decoration-primary"
            >
              {link[1]}
            </a>
          )
        }
        if (/^https?:\/\//.test(part)) {
          return (
            <a
              key={i}
              href={part}
              target="_blank"
              rel="noreferrer"
              className="break-all text-primary underline decoration-primary/40 underline-offset-4 transition-colors hover:decoration-primary"
            >
              {part}
            </a>
          )
        }
        return <span key={i}>{part}</span>
      })}
    </>
  )
}

/** 渲染单段正文，遇 {{id}} 占位符则渲染为内联输入框 */
function renderParagraph(
  p: string,
  values: Record<string, string>,
  onChange: (id: string, v: string) => void,
  fieldsById: Record<string, Field>
) {
  const parts = p.split(/(\{\{[^}]+\}\})/g)
  return parts.map((part, i) => {
    const m = /^\{\{([^}]+)\}\}$/.exec(part)
    if (!m) return <InlineMarkdown key={i} text={part} />
    const id = m[1]
    const field = fieldsById[id]
    return (
      <input
        key={i}
        data-field={id}
        placeholder={field?.hint ?? field?.label ?? id}
        value={values[id] ?? ""}
        onChange={(e) => onChange(id, e.target.value)}
        className="field-sizing-content mx-0.5 inline-block min-w-16 max-w-full rounded-sm border-b border-dashed border-primary/40 bg-primary/[0.04] px-1 font-[inherit] text-[length:inherit] leading-[inherit] text-foreground outline-none transition-colors placeholder:font-sans placeholder:text-[0.75em] placeholder:text-muted-foreground/60 hover:border-primary/70 focus:border-solid focus:border-primary focus:bg-primary/[0.07]"
      />
    )
  })
}

export function DocCard({
  doc,
  values,
  onChange,
  getText,
  onDownload,
}: DocCardProps) {
  const [copied, setCopied] = useState(false)
  const fieldsById = Object.fromEntries(doc.fields.map((f) => [f.id, f]))

  const copyAll = async () => {
    await navigator.clipboard.writeText(getText("txt"))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <article className="flex flex-col gap-4">
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={copyAll}>
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? "已复制" : "复制全文"}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onDownload("txt")}>
          <Download className="size-4" />
          TXT
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDownload("md")}
          className="hidden sm:inline-flex"
        >
          <Download className="size-4" />
          MD
        </Button>
      </div>

      <div className="rounded-xl border bg-card px-6 py-8 shadow-sm sm:px-10">
        <div className="gw-page gw-body">
          {doc.sections.map((section, si) => (
            <section key={si} className="mb-6 last:mb-0">
              {section.title && section.titleKind === "doc" && (
                <h1 className="gw-title mb-8 mt-2">{section.title}</h1>
              )}
              {section.title && section.titleKind !== "doc" && (
                <h2 className="gw-h1 mb-0 mt-6 indent-[2em] first:mt-0">
                  {section.title}
                </h2>
              )}
              {section.paragraphs.map((p, pi) => {
                const isDocTitle = p.startsWith("# ")
                return isDocTitle ? (
                  <h1 key={pi} className="gw-title mb-8 mt-2">
                    {p.replace(/^#\s*/, "")}
                  </h1>
                ) : (
                  <p key={pi} className="mb-0 indent-[2em]">
                    {renderParagraph(p, values, onChange, fieldsById)}
                  </p>
                )
              })}
            </section>
          ))}
        </div>
      </div>
    </article>
  )
}