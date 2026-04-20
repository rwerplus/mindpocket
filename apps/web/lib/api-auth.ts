import { getServerSession } from "@/lib/auth"

export async function requireApiSession() {
  const session = await getServerSession()
  if (!session?.user?.id) {
    return {
      ok: false as const,
      response: Response.json({ error: "Unauthorized" }, { status: 401 }),
    }
  }

  return {
    ok: true as const,
    session,
  }
}
