"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { FolderRanking } from "@/components/dashboard/folder-ranking"
import { GrowthChart } from "@/components/dashboard/growth-chart"
import { StatCards } from "@/components/dashboard/stat-cards"
import { TypeDistribution } from "@/components/dashboard/type-distribution"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import type { DashboardData } from "@/db/queries/dashboard"
import { useT } from "@/lib/i18n"

interface DashboardViewProps {
  data: DashboardData
  days: number
}

export function DashboardView({ data, days }: DashboardViewProps) {
  const t = useT()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // 切换天数时通过 URL 查询串触发 Server Component 重新取数
  const handleDaysChange = (d: number) => {
    startTransition(() => {
      router.replace(`/dashboard?days=${d}`, { scroll: false })
    })
  }

  return (
    <SidebarInset className="flex min-w-0 flex-col overflow-hidden">
      <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 bg-background">
        <div className="flex flex-1 items-center gap-2 px-3">
          <SidebarTrigger />
          <Separator className="mr-2 data-[orientation=vertical]:h-4" orientation="vertical" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage className="line-clamp-1">{t.dashboard.title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div
        className="flex min-w-0 flex-1 flex-col gap-4 overflow-y-auto p-4 data-[pending=true]:opacity-60"
        data-pending={isPending}
      >
        <StatCards
          embeddingRate={data.embeddingRate}
          totalBookmarks={data.totalBookmarks}
          totalChats={data.totalChats}
          weekBookmarks={data.weekBookmarks}
        />
        <div className="grid gap-4 lg:grid-cols-2">
          <GrowthChart data={data.growthTrend} days={days} onDaysChange={handleDaysChange} />
          <TypeDistribution data={data.typeDistribution} />
        </div>
        <FolderRanking data={data.folderRanking} />
      </div>
    </SidebarInset>
  )
}
