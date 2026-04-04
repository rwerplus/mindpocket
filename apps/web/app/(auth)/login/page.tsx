import { cookies } from "next/headers"
import { LoginForm } from "@/components/login-form"
import {
  BETTER_AUTH_TWO_FACTOR_COOKIE_NAME,
  getLoginStep,
  resolveAuthRedirectTarget,
} from "@/lib/auth-flow"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>
}) {
  const [{ redirect }, cookieStore] = await Promise.all([searchParams, cookies()])
  const nextPath = resolveAuthRedirectTarget(redirect)
  const initialStep = getLoginStep(cookieStore.has(BETTER_AUTH_TWO_FACTOR_COOKIE_NAME))

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <LoginForm initialStep={initialStep} nextPath={nextPath} />
      </div>
    </div>
  )
}
