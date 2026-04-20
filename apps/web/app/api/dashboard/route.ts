import { getDashboardData } from "@/db/queries/dashboard"
import { getServerSession } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const session = await getServerSession()
  const userId = session!.user!.id
  const { searchParams } = new URL(request.url)
  const days = Number(searchParams.get("days") || "30")

  const data = await getDashboardData(userId, days)
  return Response.json(data)
}
