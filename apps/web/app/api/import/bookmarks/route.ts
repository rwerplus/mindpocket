// 浏览器书签批量导入 API：解析 Netscape HTML，创建/复用文件夹，批量插入 bookmark
import { and, eq, inArray } from "drizzle-orm"
import { nanoid } from "nanoid"
import { NextResponse } from "next/server"
import { db } from "@/db/client"
import { bookmark } from "@/db/schema/bookmark"
import { folder } from "@/db/schema/folder"
import { getServerSession } from "@/lib/auth"
import { type ParsedBookmark, parseNetscapeBookmarks } from "@/lib/ingest/netscape-parser"

export const dynamic = "force-dynamic"
export const maxDuration = 60

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const INSERT_CHUNK = 500

// 查询用户已有同名文件夹，返回 name → id 映射
async function loadExistingFolders(userId: string, names: string[]) {
  const map = new Map<string, string>()
  if (names.length === 0) {
    return map
  }
  const rows = await db
    .select({ id: folder.id, name: folder.name })
    .from(folder)
    .where(and(eq(folder.userId, userId), inArray(folder.name, names)))
  for (const row of rows) {
    map.set(row.name, row.id)
  }
  return map
}

// 对缺失的文件夹批量插入；同时更新 name→id 映射
async function createMissingFolders(
  userId: string,
  allNames: Set<string>,
  existing: Map<string, string>
) {
  const toCreate: Array<{ id: string; userId: string; name: string; emoji: string }> = []
  for (const name of allNames) {
    if (!existing.has(name)) {
      const id = nanoid()
      toCreate.push({ id, userId, name, emoji: "📁" })
      existing.set(name, id)
    }
  }
  if (toCreate.length > 0) {
    await db.insert(folder).values(toCreate)
  }
  return toCreate.length
}

// 查询已存在的书签 URL，用于跳过重复项
async function loadExistingUrls(userId: string, urls: string[]) {
  const set = new Set<string>()
  if (urls.length === 0) {
    return set
  }
  const rows = await db
    .select({ url: bookmark.url })
    .from(bookmark)
    .where(and(eq(bookmark.userId, userId), inArray(bookmark.url, urls)))
  for (const row of rows) {
    if (row.url) {
      set.add(row.url)
    }
  }
  return set
}

function buildBookmarkRows(
  userId: string,
  parsed: ParsedBookmark[],
  nameToFolderId: Map<string, string>,
  existingUrls: Set<string>
) {
  return parsed
    .filter((p) => !existingUrls.has(p.url))
    .map((p) => {
      const leaf = p.folderPath.at(-1)
      const folderId = leaf ? (nameToFolderId.get(leaf) ?? null) : null
      const sourceCreatedAt = p.addDate ? new Date(p.addDate * 1000) : null
      return {
        id: nanoid(),
        userId,
        folderId,
        type: "link",
        title: p.title,
        url: p.url,
        sourceType: "url",
        clientSource: "web",
        ingestStatus: "skipped",
        coverImage: p.icon ?? null,
        sourceCreatedAt,
      }
    })
}

async function batchInsertBookmarks(rows: ReturnType<typeof buildBookmarkRows>) {
  for (let i = 0; i < rows.length; i += INSERT_CHUNK) {
    const slice = rows.slice(i, i + INSERT_CHUNK)
    if (slice.length > 0) {
      await db.insert(bookmark).values(slice)
    }
  }
}

export async function POST(request: Request) {
  const session = await getServerSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const userId = session.user.id

  const contentType = request.headers.get("content-type") ?? ""
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 })
  }

  const formData = await request.formData()
  const file = formData.get("file")
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file field" }, { status: 400 })
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 413 })
  }

  const parsed = parseNetscapeBookmarks(await file.text())
  if (parsed.length === 0) {
    return NextResponse.json({ error: "No bookmarks found in file" }, { status: 400 })
  }

  // 文件夹：项目的 folder 是扁平结构，仅使用叶子节点名复用/新建
  const folderNames = new Set<string>()
  for (const item of parsed) {
    const leaf = item.folderPath.at(-1)
    if (leaf) {
      folderNames.add(leaf)
    }
  }

  const nameToFolderId = await loadExistingFolders(userId, Array.from(folderNames))
  const foldersCreated = await createMissingFolders(userId, folderNames, nameToFolderId)

  const existingUrls = await loadExistingUrls(
    userId,
    parsed.map((p) => p.url)
  )
  const rows = buildBookmarkRows(userId, parsed, nameToFolderId, existingUrls)
  await batchInsertBookmarks(rows)

  return NextResponse.json({
    total: parsed.length,
    imported: rows.length,
    duplicates: existingUrls.size,
    foldersCreated,
  })
}
