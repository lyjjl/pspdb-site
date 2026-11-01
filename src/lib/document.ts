import type { Doc } from "@/data/pspdb"
import { resolveParagraph } from "@/data/pspdb"

export type TextFormat = "txt" | "md"

/** 去掉行内 Markdown 标记（用于纯文本导出/复制） */
function stripInlineMarkdown(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1（$2）")
}

/** 生成文档完整全文（已套用填写内容）。md 保留标记，txt 去除标记。 */
export function buildFullText(
  doc: Doc,
  values: Record<string, string>,
  format: TextFormat = "txt"
): string {
  const lines: string[] = []
  const clean = (s: string) => (format === "md" ? s : stripInlineMarkdown(s))

  for (const section of doc.sections) {
    if (section.title) {
      lines.push(format === "md" ? `## ${section.title}` : section.title)
    }
    for (const p of section.paragraphs) {
      const resolved = resolveParagraph(p, values)
      if (resolved.trim() === "") continue
      if (resolved.startsWith("# ")) {
        const heading = resolved.slice(2)
        lines.push(format === "md" ? `# ${heading}` : heading)
      } else {
        lines.push(clean(resolved))
      }
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