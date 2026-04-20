"use client"

import type { ChatStatus, UIMessage } from "ai"
import { useEffect, useRef } from "react"
import { useStickToBottomContext } from "use-stick-to-bottom"
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation"
import { Shimmer } from "@/components/ai-elements/shimmer"
import { ChatMessage } from "@/components/chat-message"
import { useT } from "@/lib/i18n"

// 流式输出时跟随最新内容滚到底部；如果用户中途上滑则尊重其意图，不再强制滚动
function StreamingAutoScroll({
  active,
  contentFingerprint,
}: {
  active: boolean
  contentFingerprint: string
}) {
  const { scrollToBottom, isAtBottom } = useStickToBottomContext()
  const userScrolledUp = useRef(false)

  useEffect(() => {
    if (!active) {
      userScrolledUp.current = false
      return
    }
    if (!isAtBottom) {
      userScrolledUp.current = true
    }
  }, [active, isAtBottom])

  // biome-ignore lint/correctness/useExhaustiveDependencies: contentFingerprint 每次 streaming 更新都会变化，正是驱动 effect 重跑的关键
  useEffect(() => {
    if (!active) {
      return
    }
    if (userScrolledUp.current) {
      return
    }
    scrollToBottom()
  }, [active, contentFingerprint, scrollToBottom])

  return null
}

function getLastMessageText(messages: UIMessage[]): string {
  const last = messages.at(-1)
  if (!last) {
    return ""
  }
  // parts 里可能有 text / reasoning 等片段，只取 text 做指纹即可
  return (
    last.parts
      ?.map((part) => ("text" in part && typeof part.text === "string" ? part.text : ""))
      .join("") ?? ""
  )
}

export function ChatMessages({ messages, status }: { messages: UIMessage[]; status: ChatStatus }) {
  const t = useT()
  const isStreaming = status === "streaming" || status === "submitted"
  // 指纹：消息数 + 末条文本长度，tokens 追加时会持续变化，驱动自动滚底
  const contentFingerprint = `${messages.length}:${getLastMessageText(messages).length}`

  return (
    <Conversation>
      <ConversationContent>
        {messages.map((message, index) => {
          const isLastMessage = index === messages.length - 1
          return (
            <ChatMessage
              isStreaming={isStreaming && isLastMessage}
              key={message.id}
              message={message}
            />
          )
        })}
        {status === "submitted" && messages.at(-1)?.role !== "assistant" && (
          <div className="text-muted-foreground text-sm">
            <Shimmer duration={1}>{t.chatMessages.thinking}</Shimmer>
          </div>
        )}
      </ConversationContent>
      <StreamingAutoScroll active={isStreaming} contentFingerprint={contentFingerprint} />
      <ConversationScrollButton />
    </Conversation>
  )
}
