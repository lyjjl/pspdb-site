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
        className="field-sizing-content mx-1 inline-block min-w-16 max-w-full rounded-sm border-b border-dashed border-primary/40 bg-primary/[0.04] px-2 text-base font-medium text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 hover:border-primary/70 focus:border-solid focus:border-primary focus:bg-primary/[0.07]"
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

      <div className="rounded-xl border bg-card px-6 py-8 text-base shadow-sm sm:px-10">
        {doc.sections.map((section, si) => (
          <section key={si} className="mb-8 last:mb-0">
            {section.title && (
              <h2 className="mb-4 mt-8 flex items-center gap-2 text-xl font-semibold tracking-tight first:mt-0">
                <span className="h-4 w-1 rounded-full bg-primary/50" aria-hidden />
                {section.title}
              </h2>
            )}
            <div
              className={
                section.title
                  ? "border-l border-border pl-4 sm:pl-6"
                  : undefined
              }
            >
              {section.paragraphs.map((p, pi) => {
                const isDocTitle = p.startsWith("# ")
                return (
                  <p
                    key={pi}
                    className={
                      isDocTitle
                        ? "mb-6 text-2xl font-bold tracking-tight"
                        : "mb-2 text-justify last:mb-0"
                    }
                  >
                    {isDocTitle
                      ? p.replace(/^#\s*/, "")
                      : renderParagraph(p, values, onChange, fieldsById)}
                  </p>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </article>
  )
}