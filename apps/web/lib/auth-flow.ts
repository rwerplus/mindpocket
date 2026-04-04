export const BETTER_AUTH_COOKIE_PREFIX = "better-auth"
export const BETTER_AUTH_TWO_FACTOR_COOKIE_NAME = `${BETTER_AUTH_COOKIE_PREFIX}.two_factor`

export type LoginStep = "credentials" | "two-factor"

const INVALID_TWO_FACTOR_COOKIE_MESSAGE = "invalid two factor cookie"

export function getLoginStep(hasPendingTwoFactor: boolean): LoginStep {
  return hasPendingTwoFactor ? "two-factor" : "credentials"
}

export function isPendingTwoFactorStateError(message?: string | null) {
  return message?.trim().toLowerCase().includes(INVALID_TWO_FACTOR_COOKIE_MESSAGE) ?? false
}

export function resolveAuthRedirectTarget(redirectTarget?: string | null) {
  if (!redirectTarget?.startsWith("/") || redirectTarget.startsWith("//")) {
    return "/"
  }

  return redirectTarget
}
