import {
  BETTER_AUTH_TWO_FACTOR_COOKIE_NAME,
  getLoginStep,
  isPendingTwoFactorStateError,
  resolveAuthRedirectTarget,
} from "@/lib/auth-flow"

describe("auth flow helpers", () => {
  it("returns the pending 2FA cookie name used by Better Auth", () => {
    expect(BETTER_AUTH_TWO_FACTOR_COOKIE_NAME).toBe("better-auth.two_factor")
  })

  it("maps pending 2FA state to the login two-factor step", () => {
    expect(getLoginStep(true)).toBe("two-factor")
    expect(getLoginStep(false)).toBe("credentials")
  })

  it("accepts only safe in-app redirect targets", () => {
    expect(resolveAuthRedirectTarget("/device?user_code=abc")).toBe("/device?user_code=abc")
    expect(resolveAuthRedirectTarget("https://example.com")).toBe("/")
    expect(resolveAuthRedirectTarget("//example.com")).toBe("/")
    expect(resolveAuthRedirectTarget("relative-path")).toBe("/")
    expect(resolveAuthRedirectTarget(undefined)).toBe("/")
  })

  it("detects when the Better Auth two-factor state is no longer valid", () => {
    expect(isPendingTwoFactorStateError("Invalid two factor cookie")).toBe(true)
    expect(isPendingTwoFactorStateError(" invalid two factor cookie ")).toBe(true)
    expect(isPendingTwoFactorStateError("Invalid code")).toBe(false)
    expect(isPendingTwoFactorStateError(undefined)).toBe(false)
  })
})
