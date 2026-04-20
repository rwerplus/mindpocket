import { createOpenAICompatible } from "@ai-sdk/openai-compatible"
import { embed, generateText } from "ai"
import { getProviderWithDecryptedKey } from "@/db/queries/ai-provider"
import { getServerSession } from "@/lib/auth"

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession()
  const userId = session!.user!.id

  const { id } = await params
  const provider = await getProviderWithDecryptedKey(id, userId)
  if (!provider) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }
  try {
    const client = createOpenAICompatible({
      name: provider.name,
      apiKey: provider.apiKey,
      baseURL: provider.baseUrl,
    })

    if (provider.type === "chat") {
      await generateText({
        model: client.chatModel(provider.modelId),
        prompt: "Hi",
      })
    } else {
      await embed({
        model: client.embeddingModel(provider.modelId),
        value: "test",
      })
    }

    return Response.json({ ok: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error"
    return Response.json({ error: message }, { status: 400 })
  }
}
