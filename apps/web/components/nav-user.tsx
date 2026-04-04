"use client"

import { ChevronsUpDown, LogOut, MessageCircleQuestionMark, Settings } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

import { SettingsDialog } from "@/components/settings/settings-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { signOut } from "@/lib/auth-client"
import { useT } from "@/lib/i18n"

export function NavUser({
  user,
  idBase = "nav-user",
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
  idBase?: string
}) {
  const { isMobile } = useSidebar()
  const router = useRouter()
  const t = useT()
  const [settingsOpen, setSettingsOpen] = useState(false)
  // Use stable ids to avoid Radix trigger hydration mismatches on SSR.
  const triggerId = `${idBase}-trigger`
  const contentId = `${idBase}-content`

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                id={triggerId}
                size="lg"
              >
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage alt={user.name} src={user.avatar} />
                  <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              id={contentId}
              side={isMobile ? "bottom" : "right"}
              sideOffset={4}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage alt={user.name} src={user.avatar} />
                    <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user.name}</span>
                    <span className="truncate text-xs">{user.email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onSelect={() => setSettingsOpen(true)}>
                  <Settings />
                  {t.common.settings}
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() =>
                  window.open("https://github.com/jihe520/mindpocket/issues", "_blank")
                }
              >
                <MessageCircleQuestionMark />
                {t.common.feedback}
              </DropdownMenuItem>

              <DropdownMenuItem
                onSelect={async () => {
                  try {
                    await signOut()
                    router.push("/login")
                    router.refresh()
                  } catch {
                    toast.error(t.feedback.logoutFailed)
                  }
                }}
              >
                <LogOut />
                {t.common.logout}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
      <SettingsDialog onOpenChange={setSettingsOpen} open={settingsOpen} user={user} />
    </>
  )
}
