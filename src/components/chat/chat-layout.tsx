"use client";

import { useEffect, useState } from "react";
import { ChatHeader } from "@/components/chat/chat-header";
import { ChatInput } from "@/components/chat/chat-input";
import { MessageList } from "@/components/chat/message-list";
import { Sidebar } from "@/components/sidebar/sidebar";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useChatStream } from "@/hooks/use-chat-stream";
import { useChatStore } from "@/store/chat-store";

export function ChatLayout() {
  const [mounted, setMounted] = useState(false);
  const sidebarOpen = useChatStore((s) => s.sidebarOpen);
  const setSidebarOpen = useChatStore((s) => s.setSidebarOpen);
  const activeConversation = useChatStore((s) =>
    s.conversations.find((c) => c.id === s.activeConversationId)
  );
  const clearActiveChat = useChatStore((s) => s.clearActiveChat);
  const messages = activeConversation?.messages ?? [];

  const { sendMessage, regenerate, stop, isStreaming } = useChatStream();

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background">
        <div className="h-8 w-8 animate-pulse rounded-full bg-venus-violet/40" />
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="relative flex h-dvh overflow-hidden bg-background">
        {/* Fundo decorativo */}
        <div className="pointer-events-none absolute inset-0 bg-venus-gradient opacity-80" aria-hidden />
        <div
          className="pointer-events-none absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-violet-900/10 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-32 bottom-1/4 h-80 w-80 rounded-full bg-purple-950/15 blur-3xl"
          aria-hidden
        />

        {/* Sidebar desktop */}
        <div className="relative z-10 hidden w-[min(100%,300px)] shrink-0 lg:block">
          <Sidebar className="h-full" />
        </div>

        {/* Sidebar mobile */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="p-0">
            <Sidebar onConversationSelect={() => setSidebarOpen(false)} />
          </SheetContent>
        </Sheet>

        {/* Área principal */}
        <main className="relative z-10 flex min-w-0 flex-1 flex-col">
          <ChatHeader
            title={activeConversation?.title}
            onMenuClick={() => setSidebarOpen(true)}
            onClearChat={clearActiveChat}
          />

          <MessageList
            messages={messages}
            isStreaming={isStreaming}
            onSuggestionClick={(text) => void sendMessage(text, [])}
            onRegenerate={regenerate}
          />

          <ChatInput
            onSend={(text, files) => void sendMessage(text, files)}
            onStop={stop}
            isStreaming={isStreaming}
          />
        </main>
      </div>
    </TooltipProvider>
  );
}
