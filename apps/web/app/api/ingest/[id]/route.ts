import { and, eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { db } from "@/db/client"
import { bookmark } from "@/db/schema/bookmark"
import { getServerSession } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const userId = session.user.id

  const { id } = await params
  const result = await db
    .select({
      id: bookmark.id,
      title: bookmark.title,
      type: bookmark.type,
      ingestStatus: bookmark.ingestStatus,
      ingestError: bookmark.ingestError,
      createdAt: bookmark.createdAt,
    })
    .from(bookmark)
    .where(and(eq(bookmark.id, id), eq(bookmark.userId, userId)))

  const item = result[0]
  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json(item)
}
