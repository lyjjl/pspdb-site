import { useState } from "react"

import type { Doc, Field } from "@/data/pspdb"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Download, Copy, FileText } from "lucide-react"

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
    if (!m) {
      return <span key={i}>{part}</span>
    }
    const id = m[1]
    const field = fieldsById[id]
    return (
      <input
        key={i}
        data-field={id}
        placeholder={field?.label ?? id}
        value={values[id] ?? ""}
        onChange={(e) => onChange(id, e.target.value)}
        className="mx-0.5 inline-block min-w-20 max-w-full rounded border border-dashed border-ring px-1.5 py-0.5 text-sm font-medium outline-none transition-colors focus:border-solid focus:bg-primary/5"
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
    try {
      await navigator.clipboard.writeText(fullText)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // 降级：选中一个隐藏文本域以支持复制
      setCopied(false)
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle className="text-xl">{doc.title}</CardTitle>
            <CardDescription className="mt-1">{doc.subtitle}</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={copyAll}>
              <Copy className="size-4" />
              {copied ? "已复制" : "复制全文"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => onDownload("txt")}>
              <Download className="size-4" />TXT
            </Button>
            <Button variant="outline" size="sm" onClick={() => onDownload("md")}>
              <FileText className="size-4" />MD
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-6">
        {/* 待填写字段清单 */}
        <div className="rounded-lg bg-muted/50 p-4">
          <p className="mb-3 flex items-center gap-2 text-sm font-medium">
            <Badge className="bg-primary text-primary-foreground">
              {doc.fields.length}
            </Badge>
            待填写项
          </p>
          <div className="flex flex-col gap-3">
            {doc.fields.map((f) => (
              <div key={f.id} className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground" htmlFor={f.id}>
                  {f.label}
                  {f.hint && <span className="ml-2 opacity-70">（{f.hint}）</span>}
                </label>
                <Textarea
                  id={f.id}
                  className="min-h-10"
                  value={values[f.id]}
                  placeholder={f.hint}
                  onChange={(e) => onChange(f.id, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* 主体文件预览（可编辑，占位符内联展开） */}
        <div>
          <p className="mb-2 flex items-center gap-2 text-sm font-medium">
            <FileText className="size-4" />
            文档正文 · 点击内联框即可填写
          </p>
          <div className="rounded-lg border bg-card p-5 font-serif text-[15px] leading-7">
            {doc.sections.map((section, si) => (
              <div key={si} className="mb-4 last:mb-0">
                {section.title && (
                  <h3 className="mb-2 mt-2 text-base font-bold first:mt-0">
                    {section.title}
                  </h3>
                )}
                {section.paragraphs.map((p, pi) => {
                  // 标题段（以 # 开头，仅出现在首个 section）
                  const isDocTitle = p.startsWith("# ")
                  return (
                    <p
                      key={pi}
                      className={
                        isDocTitle
                          ? "mb-2 text-lg font-bold leading-snug"
                          : "mb-2"
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
        </div>
      </CardContent>
    </Card>
  )
}