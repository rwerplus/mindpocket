import type { UIMessage } from "ai"
import { redirect } from "next/navigation"
import { getChatById, getMessagesByChatId } from "@/db/queries/chat"
import { getServerSession } from "@/lib/auth"
import { ChatClient } from "./chat-client"

export default async function ChatIdPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const session = await getServerSession()
  if (!session?.user) {
    redirect("/login")
  }

  const chat = await getChatById({ id })
  if (!chat || chat.userId !== session.user.id) {
    redirect("/chat")
  }

  const dbMessages = await getMessagesByChatId({ id })

  const initialMessages = dbMessages.map((msg) => ({
    id: msg.id,
    role: msg.role as "user" | "assistant",
    parts: msg.parts as UIMessage["parts"],
    createdAt: msg.createdAt,
  }))

  return <ChatClient chatTitle={chat.title} id={id} initialMessages={initialMessages} />
}
