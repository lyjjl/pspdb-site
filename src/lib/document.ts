import type { Doc } from "@/data/pspdb"

export type TextFormat = "txt" | "md"

/** 首行缩进：两个全角空格（中文排版惯例） */
const INDENT = "\u3000\u3000"
/** 未填写项的占位，保证导出文本语句完整 */
const BLANK = "【待填写】"

/** 列表项开头：1. / 1、/ （1） / ① / a. */
const LIST_RE = /^(?:\d+[.、)）]|[（(]\d+[）)]|[①-⑩]|[a-zA-Z][.)）])\s*/

/** 键值型元信息行，如「版本： 1.0」 */

function isListLine(line: string): boolean {
  return LIST_RE.test(line.trimStart())
}

/** 键值行仅识别「短标签：值」形式，排除句子式的「以下为正文内容：」 */
function isMetaLine(line: string): boolean {
  const t = line.trim()
  if (t.length > 40 || /[。；]$/.test(t)) return false
  const m = /^([^：:]{1,12})[：:](.*)$/.exec(t)
  if (!m) return false
  const [, label, value] = m
  // 标签不含标点与虚词；冒号后为空或短值
  if (/[，。、；！？]/.test(label)) return false
  if (/(内容|说明|如下|以下|上述|下列)$/.test(label)) return false
  return value.trim().length <= 24
}

/** 去掉行内 Markdown 标记，保留可读纯文本 */
function stripInlineMarkdown(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1（$2）")
}

/** 列表标记后补一个空格，保证 Markdown 正确识别为列表 */
function normalizeListMarker(line: string): string {
  return line
    .trimStart()
    .replace(LIST_RE, (m) => (/\s$/.test(m) ? m : `${m.trim()} `))
}

/** 用填写值替换占位符；空值以占位文本补齐，避免出现「范围为：。」这类断句 */
function resolveWithFallback(
  paragraph: string,
  values: Record<string, string>
): string {
  return paragraph.replace(/\{\{([^}]+)\}\}/g, (_, id: string) => {
    const v = values[id]?.trim()
    return v ? v : BLANK
  })
}

interface Block {
  lines: string[]
  /** 紧凑块：行间不空行（列表、元信息） */
  tight: boolean
}

/**
 * 生成文档全文。
 * - txt：中文公文式排版，正文首行缩进两字，块间空行
 * - md ：标准 Markdown，标题分级、列表成块
 */
export function buildFullText(
  doc: Doc,
  values: Record<string, string>,
  format: TextFormat = "txt"
): string {
  const isMd = format === "md"
  const blocks: Block[] = []
  const body = (s: string) => (isMd ? s : stripInlineMarkdown(s))
  const indent = (s: string) => (isMd ? s : `${INDENT}${s}`)
  /** md 中紧凑块需硬换行，否则会被合并成一段 */
  const hardBreak = (s: string) => (isMd ? `${s}  ` : s)

  for (const section of doc.sections) {
    if (section.title) {
      blocks.push({
        tight: false,
        lines: [isMd ? `## ${section.title}` : section.title],
      })
    }

    const paragraphs = section.paragraphs
    let i = 0
    while (i < paragraphs.length) {
      const raw = resolveWithFallback(paragraphs[i], values).trim()
      i++
      if (!raw) continue

      // 文档大标题
      if (raw.startsWith("# ")) {
        blocks.push({
          tight: false,
          lines: [isMd ? `# ${raw.slice(2)}` : raw.slice(2)],
        })
        continue
      }

      // 元信息块：连续的键值行聚合，行间不空行
      if (isMetaLine(raw)) {
        const lines = [isMd ? hardBreak(body(raw)) : indent(body(raw))]
        while (i < paragraphs.length) {
          const next = resolveWithFallback(paragraphs[i], values).trim()
          if (!next || !isMetaLine(next)) break
          lines.push(isMd ? hardBreak(body(next)) : indent(body(next)))
          i++
        }
        blocks.push({ tight: true, lines })
        continue
      }

      // 列表块：连续列表项聚合（列表不首行缩进，与公文排版一致）
      if (isListLine(raw)) {
        const lines: string[] = []
        let cursor = raw
        while (true) {
          lines.push(isMd ? normalizeListMarker(body(cursor)) : indent(body(cursor).trimStart()))
          const next = resolveWithFallback(paragraphs[i] ?? "", values).trim()
          if (!next || !isListLine(next)) break
          cursor = next
          i++
        }
        blocks.push({ tight: true, lines })
        continue
      }

      // 引导句（以冒号结尾）后跟列表时，引导句单独成段、列表另起一块
      if (/[：:]$/.test(raw) && isListLine(resolveWithFallback(paragraphs[i] ?? "", values))) {
        blocks.push({ tight: false, lines: [indent(body(raw))] })
        const items: string[] = []
        while (i < paragraphs.length) {
          const next = resolveWithFallback(paragraphs[i], values).trim()
          if (!next || !isListLine(next)) break
          items.push(isMd ? normalizeListMarker(body(next)) : indent(body(next).trimStart()))
          i++
        }
        blocks.push({ tight: true, lines: items })
        continue
      }

      blocks.push({ tight: false, lines: [indent(body(raw))] })
    }
  }

  const out: string[] = []
  for (const block of blocks) {
    out.push(block.lines.join(block.tight ? "\n" : "\n"))
    // 块之间空一行；紧凑块内部已由 join("\n") 保证无空行
    out.push("")
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n"
}

/** 触发浏览器端（JS 驱动）的文件下载。 */
export function downloadText(
  filename: string,
  content: string,
  mime = "text/plain"
): void {
  // 纯文本加 BOM，兼容 Windows 记事本 / Word 的中文识别
  const bom = mime === "text/plain" ? "\uFEFF" : ""
  const blob = new Blob([bom + content], { type: `${mime};charset=utf-8` })
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