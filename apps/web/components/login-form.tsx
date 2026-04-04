"use client"

import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { AuthBrandDisplay } from "@/components/auth-brand-display"
import { TwoFactorForm } from "@/components/two-factor-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { signIn } from "@/lib/auth-client"
import { type LoginStep, resolveAuthRedirectTarget } from "@/lib/auth-flow"
import { useT } from "@/lib/i18n"
import { cn } from "@/lib/utils"

interface LoginFormProps extends React.ComponentProps<"div"> {
  initialStep: LoginStep
  nextPath: string
}

export function LoginForm({ className, initialStep, nextPath, ...props }: LoginFormProps) {
  const t = useT()
  const router = useRouter()
  const [step, setStep] = useState<LoginStep>(initialStep)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    await signIn.email({
      email,
      password,
      fetchOptions: {
        onRequest: () => setLoading(true),
        onResponse: () => setLoading(false),
        onError: (ctx) => {
          toast.error(ctx.error.message || t.auth.loginFailed)
        },
        onSuccess: (ctx) => {
          if ((ctx.data as { twoFactorRedirect?: boolean })?.twoFactorRedirect) {
            // Keep 2FA inside the current login flow instead of navigating away.
            setPassword("")
            setStep("two-factor")
            return
          }

          toast.success(t.auth.loginSuccess)
          window.location.href = nextPath
        },
      },
    })
  }

  const handleSignupClick = async () => {
    try {
      const res = await fetch("/api/check-registration")
      const data = await res.json()
      if (data.allowed) {
        router.push(`/signup${nextPath === "/" ? "" : `?redirect=${encodeURIComponent(nextPath)}`}`)
        return
      }

      toast.error(data.message || t.auth.registrationClosed)
    } catch {
      toast.error(t.auth.registrationCheckFailed)
    }
  }

  const handleBackToCredentials = () => {
    setStep("credentials")
  }

  const safeNextPath = resolveAuthRedirectTarget(nextPath)

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <div className="p-6 md:p-8">
            {step === "two-factor" ? (
              <TwoFactorForm nextPath={safeNextPath} onBackToLogin={handleBackToCredentials} />
            ) : (
              <form onSubmit={handleSubmit}>
                <FieldGroup>
                  <div className="flex flex-col items-center gap-2 text-center">
                    <h1 className="font-bold text-2xl">{t.auth.loginTitle}</h1>
                    <p className="text-balance text-muted-foreground">{t.auth.loginSubtitle}</p>
                  </div>
                  <Field>
                    <FieldLabel htmlFor="email">{t.auth.email}</FieldLabel>
                    <Input
                      disabled={loading}
                      id="email"
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="m@example.com"
                      required
                      type="email"
                      value={email}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="password">{t.auth.password}</FieldLabel>
                    <Input
                      disabled={loading}
                      id="password"
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      type="password"
                      value={password}
                    />
                  </Field>
                  <Field>
                    <Button className="w-full" disabled={loading} type="submit">
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t.auth.loginButton}
                    </Button>
                  </Field>
                  <div className="text-center text-sm text-muted-foreground">
                    {t.auth.noAccount}
                    <button
                      className="ml-1 underline underline-offset-4 hover:text-foreground"
                      onClick={async (e) => {
                        e.preventDefault()
                        await handleSignupClick()
                      }}
                      type="button"
                    >
                      {t.auth.goSignup}
                    </button>
                  </div>
                </FieldGroup>
              </form>
            )}
          </div>
          <AuthBrandDisplay />
        </CardContent>
      </Card>
    </div>
  )
}
