// Netscape Bookmark File Format 解析器
// 参考：https://msdn.microsoft.com/en-us/library/aa753582(v=vs.85).aspx
// Chrome / Firefox / Edge / Safari 导出的书签 HTML 都遵循此格式

export interface ParsedBookmark {
  title: string
  url: string
  addDate?: number // UNIX timestamp（秒）
  icon?: string
  folderPath: string[] // 所属文件夹链路，根到叶，空数组表示顶层
}

interface ParseContext {
  folderStack: string[]
  result: ParsedBookmark[]
}

// 匹配 <DT><H3 ...>FolderName</H3>
const FOLDER_REGEX = /<DT>\s*<H3[^>]*>([^<]+)<\/H3>/i
// 匹配 <DT><A HREF="...">Title</A>
const BOOKMARK_REGEX = /<DT>\s*<A\s+([^>]+)>([^<]*)<\/A>/i
// 属性提取
const ATTR_REGEX = /(\w+)\s*=\s*"([^"]*)"/gi
// 行分割
const LINE_SPLIT_REGEX = /\r?\n/
// 结束文件夹
const CLOSE_DL_REGEX = /<\/DL>/i
// URL 协议白名单
const HTTP_URL_REGEX = /^https?:\/\//i

function parseAttrs(attrString: string): Record<string, string> {
  const attrs: Record<string, string> = {}
  let match: RegExpExecArray | null
  // biome-ignore lint/suspicious/noAssignInExpressions: standard regex loop
  while ((match = ATTR_REGEX.exec(attrString)) !== null) {
    attrs[match[1]!.toLowerCase()] = match[2]!
  }
  return attrs
}

function decodeHtml(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
}

export function parseNetscapeBookmarks(html: string): ParsedBookmark[] {
  const ctx: ParseContext = { folderStack: [], result: [] }

  // 按行处理：Netscape 格式一行一个标签
  const lines = html.split(LINE_SPLIT_REGEX)

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) {
      continue
    }

    // 进入子文件夹
    const folderMatch = line.match(FOLDER_REGEX)
    if (folderMatch) {
      ctx.folderStack.push(decodeHtml(folderMatch[1]!.trim()))
      continue
    }

    // 结束当前文件夹（</DL> 表示一层结束）
    if (CLOSE_DL_REGEX.test(line)) {
      ctx.folderStack.pop()
      continue
    }

    // 收藏项
    const bookmarkMatch = line.match(BOOKMARK_REGEX)
    if (bookmarkMatch) {
      const attrs = parseAttrs(bookmarkMatch[1]!)
      const url = attrs.href
      if (!(url && HTTP_URL_REGEX.test(url))) {
        continue
      }
      const title = decodeHtml(bookmarkMatch[2]!.trim()) || url
      const addDate = attrs.add_date ? Number.parseInt(attrs.add_date, 10) : undefined
      ctx.result.push({
        title,
        url,
        addDate: Number.isFinite(addDate) ? addDate : undefined,
        icon: attrs.icon,
        folderPath: [...ctx.folderStack],
      })
    }
  }

  return ctx.result
}
