import { redirect } from "next/navigation"
import { getDashboardData } from "@/db/queries/dashboard"
import { getServerSession } from "@/lib/auth"
import { DashboardView } from "./dashboard-view"

export const dynamic = "force-dynamic"

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>
}) {
  const session = await getServerSession()
  if (!session?.user) {
    redirect("/login")
  }

  const { days: daysParam } = await searchParams
  const days = Number(daysParam) || 30

  const data = await getDashboardData(session.user.id, days)

  return <DashboardView data={data} days={days} />
}
