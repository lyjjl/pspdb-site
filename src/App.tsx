import { useMemo, useState } from "react"

import { docs } from "@/data/pspdb"
import { buildFullText, downloadText, exportFilename } from "@/lib/document"

import { DocCard } from "./components/DocCard"

export default function App() {
  // 每个文档一份填写值状态
  const initial = useMemo(() => {
    const m: Record<string, Record<string, string>> = {}
    for (const d of docs) {
      m[d.id] = Object.fromEntries(d.fields.map((f) => [f.id, f.defaultValue]))
    }
    return m
  }, [])
  const [values, setValues] = useState(initial)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <header className="mb-10">
          <p className="text-muted-foreground text-sm">
            PSPDB · 公共骰娘隐私声明 & 范本授权
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            骰娘隐私声明生成器
          </h1>
          <p className="mt-3 text-muted-foreground">
            在下方填写各文档中的内容，即可实时生成全文，并可一键复制或下载为
            TXT / MD 文件。
          </p>
        </header>

        <div className="flex flex-col gap-8">
          {docs.map((doc) => (
            <DocCard
              key={doc.id}
              doc={doc}
              values={values[doc.id]}
              onChange={(id, v) =>
                setValues((prev) => ({
                  ...prev,
                  [doc.id]: { ...prev[doc.id], [id]: v },
                }))
              }
              fullText={buildFullText(doc, values[doc.id])}
              onDownload={(ext) =>
                downloadText(
                  `${exportFilename(doc, values[doc.id])}.${ext}`,
                  buildFullText(doc, values[doc.id]),
                  ext === "md" ? "text/markdown" : "text/plain"
                )
              }
            />
          ))}
        </div>

        <footer className="mt-12 border-t pt-6 text-xs text-muted-foreground">
          各文本基于《公共骰娘隐私声明通用范本（PSPDB）V1.0.0》及其授权说明。
          采用 / 转载 / 修改请遵守 CC BY-SA 4.0 并保留作者署名。本工具仅作参考，
          不构成法律合规保证。
        </footer>
      </div>
    </div>
  )
}