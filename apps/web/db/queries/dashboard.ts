// Dashboard 相关统计查询：供 page 和 API 共用
import { and, count, eq, gte, sql } from "drizzle-orm"
import { db } from "@/db/client"
import { bookmark } from "@/db/schema/bookmark"
import { chat } from "@/db/schema/chat"
import { embedding } from "@/db/schema/embedding"
import { folder } from "@/db/schema/folder"

export interface DashboardData {
  totalBookmarks: number
  weekBookmarks: number
  totalChats: number
  embeddingRate: number
  typeDistribution: Array<{ type: string; count: number }>
  folderRanking: Array<{ name: string; emoji: string; count: number }>
  growthTrend: Array<{ date: string; count: number }>
}

export async function getDashboardData(userId: string, days: number): Promise<DashboardData> {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  const [stats, typeDistribution, folderRanking, growthTrend] = await Promise.all([
    getStats(userId, weekAgo),
    getTypeDistribution(userId),
    getFolderRanking(userId),
    getGrowthTrend(userId, startDate),
  ])

  return { ...stats, typeDistribution, folderRanking, growthTrend }
}

async function getStats(userId: string, weekAgo: Date) {
  const [totalResult] = await db
    .select({ count: count() })
    .from(bookmark)
    .where(eq(bookmark.userId, userId))

  const [weekResult] = await db
    .select({ count: count() })
    .from(bookmark)
    .where(and(eq(bookmark.userId, userId), gte(bookmark.createdAt, weekAgo)))

  const [chatResult] = await db.select({ count: count() }).from(chat).where(eq(chat.userId, userId))

  const [embeddedResult] = await db
    .select({ count: count() })
    .from(embedding)
    .innerJoin(bookmark, eq(embedding.bookmarkId, bookmark.id))
    .where(eq(bookmark.userId, userId))

  const totalBookmarks = totalResult?.count ?? 0
  const weekBookmarks = weekResult?.count ?? 0
  const totalChats = chatResult?.count ?? 0
  const totalEmbeddings = embeddedResult?.count ?? 0
  const embeddingRate =
    totalBookmarks > 0 ? Math.round((totalEmbeddings / totalBookmarks) * 100) : 0

  return { totalBookmarks, weekBookmarks, totalChats, embeddingRate }
}

function getTypeDistribution(userId: string) {
  return db
    .select({
      type: bookmark.type,
      count: count(),
    })
    .from(bookmark)
    .where(eq(bookmark.userId, userId))
    .groupBy(bookmark.type)
}

async function getFolderRanking(userId: string) {
  const rows = await db
    .select({
      name: folder.name,
      emoji: folder.emoji,
      count: count(bookmark.id),
    })
    .from(folder)
    .leftJoin(bookmark, eq(folder.id, bookmark.folderId))
    .where(eq(folder.userId, userId))
    .groupBy(folder.id, folder.name, folder.emoji)
    .orderBy(sql`count(${bookmark.id}) desc`)
    .limit(10)

  // folder.emoji 在 schema 为 notNull，但 leftJoin 下 drizzle 推导为可空，这里收敛为 string
  return rows.map((row) => ({ ...row, emoji: row.emoji ?? "📁" }))
}

async function getGrowthTrend(userId: string, startDate: Date) {
  const result = await db
    .select({
      date: sql<string>`to_char(${bookmark.createdAt}, 'YYYY-MM-DD')`,
      count: count(),
    })
    .from(bookmark)
    .where(and(eq(bookmark.userId, userId), gte(bookmark.createdAt, startDate)))
    .groupBy(sql`to_char(${bookmark.createdAt}, 'YYYY-MM-DD')`)
    .orderBy(sql`to_char(${bookmark.createdAt}, 'YYYY-MM-DD')`)

  const dateMap = new Map(result.map((r) => [r.date, r.count]))
  const trend: Array<{ date: string; count: number }> = []
  const current = new Date(startDate)
  const today = new Date()

  while (current <= today) {
    const dateStr = current.toISOString().split("T")[0]!
    trend.push({ date: dateStr, count: dateMap.get(dateStr) ?? 0 })
    current.setDate(current.getDate() + 1)
  }

  return trend
}
