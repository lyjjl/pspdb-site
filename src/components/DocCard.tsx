import { useState } from "react"

import type { Doc, Field } from "@/data/pspdb"

import { Button } from "@/components/ui/button"
import { Check, Copy, Download } from "lucide-react"

interface DocCardProps {
  doc: Doc
  values: Record<string, string>
  onChange: (id: string, value: string) => void
  fullText: string
  onDownload: (ext: "txt" | "md") => void
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
    if (!m) return <span key={i}>{part}</span>
    const id = m[1]
    const field = fieldsById[id]
    return (
      <input
        key={i}
        data-field={id}
        placeholder={field?.hint ?? field?.label ?? id}
        value={values[id] ?? ""}
        onChange={(e) => onChange(id, e.target.value)}
        className="field-sizing-content mx-0.5 inline-block min-w-16 max-w-full border-b border-dashed border-primary/50 bg-transparent px-1 text-[15px] font-medium outline-none transition-colors placeholder:text-muted-foreground/50 hover:border-solid focus:border-solid focus:bg-primary/5"
      />
    )
  })
}

export function DocCard({
  doc,
  values,
  onChange,
  fullText,
  onDownload,
}: DocCardProps) {
  const [copied, setCopied] = useState(false)
  const fieldsById = Object.fromEntries(doc.fields.map((f) => [f.id, f]))

  const copyAll = async () => {
    await navigator.clipboard.writeText(fullText)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <section>
      <div className="mb-3 flex justify-end gap-1.5">
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

      <div className="rounded-xl border p-5 font-serif text-[15px] leading-7 sm:p-8">
        {doc.sections.map((section, si) => (
          <div key={si} className="mb-4 last:mb-0">
            {section.title && (
              <h3 className="mb-2 mt-3 text-base font-bold first:mt-0">
                {section.title}
              </h3>
            )}
            {section.paragraphs.map((p, pi) => {
              const isDocTitle = p.startsWith("# ")
              return (
                <p
                  key={pi}
                  className={
                    isDocTitle ? "mb-3 text-lg font-bold leading-snug" : "mb-2"
                  }
                >
                  {isDocTitle
                    ? p.replace(/^#\s*/, "")
                    : renderParagraph(p, values, onChange, fieldsById)}
                </p>
              )
            })}
          </div>
        ))}
      </div>
    </section>
  )
}