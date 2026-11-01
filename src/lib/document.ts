import type { Doc } from "@/data/pspdb"
import { resolveParagraph } from "@/data/pspdb"

/** 生成文档完整全文（已套用填写内容），返回纯文本字符串。 */
export function buildFullText(doc: Doc, values: Record<string, string>): string {
  const lines: string[] = []
  for (const section of doc.sections) {
    if (section.title) {
      lines.push(section.title)
    }
    for (const p of section.paragraphs) {
      const resolved = resolveParagraph(p, values)
      if (resolved.trim() === "") continue
      lines.push(resolved)
    }
  }
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n"
}

/** 触发浏览器端（JS 驱动）的文件下载。 */
export function downloadText(filename: string, content: string, mime = "text/plain"): void {
  const blob = new Blob(["\uFEFF" + content], { type: `${mime};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/** 导出文件名：优先取填写的骰娘名/主体名，否则退回文档标题。 */
export function exportFilename(doc: Doc, values: Record<string, string>): string {
  const name =
    doc.id === "privacy"
      ? values.bot_name || doc.title
      : values.operator_name || doc.title
  return name.replace(/[\\/:*?"<>|\s]+/g, "-")
}

export type { Doc }