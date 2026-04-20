import { redirect } from "next/navigation"
import { getBookmarkById, getBookmarkTags } from "@/db/queries/bookmark"
import { getServerSession } from "@/lib/auth"
import { BookmarkDetailClient } from "./bookmark-detail-client"

export default async function BookmarkDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const session = await getServerSession()
  if (!session?.user) {
    redirect("/login")
  }

  const item = await getBookmarkById({ id, userId: session.user.id })
  if (!item) {
    redirect("/")
  }

  const tags = await getBookmarkTags(id)

  return <BookmarkDetailClient bookmark={{ ...item, tags }} />
}
