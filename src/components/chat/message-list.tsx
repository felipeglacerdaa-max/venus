"use client";

import { useEffect, useRef } from "react";
import { MessageBubble } from "@/components/chat/message-bubble";
import { EmptyState } from "@/components/chat/empty-state";
import { useChatStore } from "@/store/chat-store";
import type { Message } from "@/types/chat";

interface MessageListProps {
  messages: Message[];
  isStreaming: boolean;
  onSuggestionClick: (text: string) => void;
  onRegenerate: () => void;
}

export function MessageList({
  messages,
  isStreaming,
  onSuggestionClick,
  onRegenerate,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const activeId = useChatStore((s) => s.activeConversationId);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: isStreaming ? "auto" : "smooth",
      block: "end",
    });
  }, [messages, isStreaming, activeId]);

  if (messages.length === 0) {
    return <EmptyState onSuggestionClick={onSuggestionClick} />;
  }

  const lastAssistantIdx = [...messages]
    .map((m, i) => ({ m, i }))
    .filter(({ m }) => m.role === "assistant")
    .pop()?.i;

  return (
    <div className="flex flex-1 flex-col gap-5 overflow-y-auto scroll-smooth px-3 py-5 sm:gap-6 sm:px-6 md:px-8">
      {messages.map((message, index) => {
        const isLastAssistant =
          message.role === "assistant" && index === lastAssistantIdx;
        const streamingThis =
          isStreaming &&
          isLastAssistant &&
          index === messages.length - 1;

        return (
          <MessageBubble
            key={message.id}
            message={message}
            isStreaming={streamingThis}
            showRegenerate={isLastAssistant && !isStreaming}
            onRegenerate={onRegenerate}
          />
        );
      })}
      <div ref={bottomRef} className="h-1 shrink-0" />
    </div>
  );
}
