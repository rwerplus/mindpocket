"use client"

import { Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { twoFactor, useSession } from "@/lib/auth-client"
import { useT } from "@/lib/i18n"

type Mode = "totp" | "backup"

export function TwoFactorForm() {
  const t = useT()
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const [mode, setMode] = useState<Mode>("totp")
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)

  // 已完成认证的用户不应停留在此页面
  useEffect(() => {
    if (!isPending && session?.user) {
      router.replace("/")
    }
  }, [isPending, session?.user, router])

  // 切换模式时清空输入框
  const switchMode = (next: Mode) => {
    setMode(next)
    setCode("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (mode === "totp") {
      const { error } = await twoFactor.verifyTotp({ code })
      setLoading(false)
      if (error) {
        toast.error(t.twoFactor.verifyFailed)
        setCode("")
        return
      }
    } else {
      // 使用备用码验证
      const { error } = await twoFactor.verifyBackupCode({ code })
      setLoading(false)
      if (error) {
        toast.error(t.twoFactor.backupCodeFailed)
        setCode("")
        return
      }
    }

    // 完整认证周期完成，显示登录成功后跳转
    toast.success(t.auth.loginSuccess)
    window.location.href = "/"
  }

  const isTotp = mode === "totp"
  // TOTP 需恰好 6 位数字，备用码需恰好 11 位
  const isSubmittable = isTotp ? code.length === 6 : code.length === 11

  return (
    <Card className="overflow-hidden p-0">
      <CardContent className="p-8">
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <div className="flex flex-col items-center gap-2 text-center">
              <h1 className="font-bold text-2xl">{t.twoFactor.loginTitle}</h1>
              <p className="text-balance text-muted-foreground text-sm">
                {isTotp ? t.twoFactor.loginDesc : t.twoFactor.useBackupCode}
              </p>
            </div>

            <Field>
              <FieldLabel htmlFor="auth-code">
                {isTotp ? t.twoFactor.enterCode : t.twoFactor.backupCodes}
              </FieldLabel>
              {isTotp ? (
                <Input
                  autoComplete="one-time-code"
                  autoFocus
                  disabled={loading}
                  id="auth-code"
                  inputMode="numeric"
                  maxLength={6}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder={t.twoFactor.codePlaceholder}
                  value={code}
                />
              ) : (
                <Input
                  autoFocus
                  disabled={loading}
                  id="auth-code"
                  maxLength={11}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder={t.twoFactor.backupCodePlaceholder}
                  value={code}
                />
              )}
            </Field>

            <Field>
              <Button className="w-full" disabled={loading || !isSubmittable} type="submit">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t.twoFactor.verify}
              </Button>
            </Field>

            {/* 底部操作区 */}
            <div className="flex flex-col items-center gap-1.5 text-center">
              {isTotp ? (
                <button
                  className="text-muted-foreground text-sm underline underline-offset-4 hover:text-foreground"
                  onClick={() => switchMode("backup")}
                  type="button"
                >
                  {t.twoFactor.cantUseAuthenticator}
                </button>
              ) : (
                <button
                  className="text-muted-foreground text-sm underline underline-offset-4 hover:text-foreground"
                  onClick={() => switchMode("totp")}
                  type="button"
                >
                  {t.twoFactor.backToTotp}
                </button>
              )}
              <Link
                className="text-muted-foreground text-sm underline underline-offset-4 hover:text-foreground"
                href="/login"
              >
                {t.twoFactor.backToLogin}
              </Link>
            </div>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
