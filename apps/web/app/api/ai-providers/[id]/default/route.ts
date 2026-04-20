import {
  clearDefaultProvider,
  getProviderWithDecryptedKey,
  updateProvider,
} from "@/db/queries/ai-provider"
import { getServerSession } from "@/lib/auth"

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession()
  const userId = session!.user!.id

  const { id } = await params
  const provider = await getProviderWithDecryptedKey(id, userId)
  if (!provider) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  await clearDefaultProvider(userId, provider.type)
  await updateProvider(id, userId, { isDefault: true })

  return Response.json({ ok: true })
}
