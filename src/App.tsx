import { useMemo, useState } from "react"

import { docs } from "@/data/pspdb"
import { buildFullText, downloadText, exportFilename } from "@/lib/document"

import { DocCard } from "./components/DocCard"

export default function App() {
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
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-10">
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
      </div>
    </div>
  )
}