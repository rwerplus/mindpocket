import { parseSearchMode } from "@repo/types"
import { searchBookmarks } from "@/db/queries/search"
import { getServerSession } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const session = await getServerSession()
  const userId = session!.user!.id

  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q")?.trim() || ""
  const mode = parseSearchMode(searchParams.get("mode"), "hybrid")
  const folderId = searchParams.get("folderId") || undefined
  const type = searchParams.get("type") || undefined
  const limit = Math.min(Number(searchParams.get("limit") || "20"), 50)

  const result = await searchBookmarks({
    userId,
    q,
    mode,
    scope: "compact",
    folderId,
    type,
    limit,
  })

  return Response.json({
    items: result.items.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      url: item.url,
      type: item.type,
      folderName: item.folderName,
      folderEmoji: item.folderEmoji,
      createdAt: item.createdAt,
      score: item.score,
      matchReasons: item.matchReasons,
    })),
    modeUsed: result.modeUsed,
    fallbackReason: result.fallbackReason,
  })
}
