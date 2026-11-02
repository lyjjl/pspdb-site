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
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-8 sm:px-6">
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
          getText={(ext) => buildFullText(doc, values[doc.id], ext)}
          onDownload={(ext) =>
            downloadText(
              `${exportFilename(doc, values[doc.id])}.${ext}`,
              buildFullText(doc, values[doc.id], ext),
              ext === "md" ? "text/markdown" : "text/plain"
            )
          }
        />
      ))}
    </main>
  )
}