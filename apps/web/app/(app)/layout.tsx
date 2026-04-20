import { redirect } from "next/navigation"
import { getServerSession } from "@/lib/auth"
import { AppShell } from "./shell"

export const dynamic = "force-dynamic"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession()

  if (!session?.user) {
    redirect("/login")
  }

  return <AppShell>{children}</AppShell>
}
