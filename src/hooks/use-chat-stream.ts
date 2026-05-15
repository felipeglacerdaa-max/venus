"use client";

import { useCallback, useRef } from "react";
import { buildApiMessages } from "@/lib/build-api-messages";
import { buildDisplayContent } from "@/lib/attachments";
import { useChatStore } from "@/store/chat-store";
import type { MessageAttachment, OutgoingAttachment } from "@/types/chat";

interface StreamOptions {
  regenerate?: boolean;
}

function toStoredAttachments(files: OutgoingAttachment[]): MessageAttachment[] {
  return files.map(({ id, name, mimeType, kind, size, previewUrl }) => ({
    id,
    name,
    mimeType,
    kind,
    size,
    previewUrl,
  }));
}

/**
 * Hook principal: envia mensagens com streaming otimizado (batch via rAF).
 */
export function useChatStream() {
  const abortRef = useRef<AbortController | null>(null);
  const rafRef = useRef<number | null>(null);

  const {
    addMessage,
    updateMessage,
    setIsStreaming,
    createConversation,
  } = useChatStore();

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setIsStreaming(false);
  }, [setIsStreaming]);

  const sendMessage = useCallback(
    async (
      content: string,
      attachments: OutgoingAttachment[] = [],
      options?: StreamOptions
    ) => {
      const trimmed = content.trim();
      const hasAttachments = attachments.length > 0;
      if (!trimmed && !hasAttachments) return;

      const state = useChatStore.getState();
      if (!state.activeConversationId) state.createConversation();

      if (options?.regenerate) {
        state.removeLastAssistantMessage();
      } else {
        const displayContent = buildDisplayContent(trimmed, attachments);
        addMessage({
          role: "user",
          content: displayContent,
          attachments: hasAttachments
            ? toStoredAttachments(attachments)
            : undefined,
        });
      }

      const assistantId = addMessage({ role: "assistant", content: "" });
      setIsStreaming(true);

      const storeMessages = useChatStore.getState().getMessages();
      const { messages: apiMessages, hasImages } = buildApiMessages(
        storeMessages,
        options?.regenerate ? undefined : attachments
      );

      abortRef.current = new AbortController();

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: apiMessages, hasImages }),
          signal: abortRef.current.signal,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Erro desconhecido" }));
          updateMessage(
            assistantId,
            `Desculpe, algo deu errado. ${(err as { error?: string }).error ?? res.statusText}`
          );
          return;
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("Stream indisponível");

        const decoder = new TextDecoder();
        let accumulated = "";

        const scheduleUpdate = (text: string) => {
          accumulated = text;
          if (rafRef.current !== null) return;
          rafRef.current = requestAnimationFrame(() => {
            rafRef.current = null;
            updateMessage(assistantId, accumulated);
          });
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          for (const line of chunk.split("\n")) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data) as { content?: string };
              if (parsed.content) scheduleUpdate(accumulated + parsed.content);
            } catch {
              /* chunk parcial */
            }
          }
        }

        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
        if (!accumulated) {
          updateMessage(assistantId, "Não obtive resposta. Tente novamente.");
        }
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        updateMessage(
          assistantId,
          `Não consegui responder agora. ${(e as Error).message}`
        );
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [addMessage, setIsStreaming, updateMessage]
  );

  const regenerate = useCallback(() => {
    const messages = useChatStore.getState().getMessages();
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUser) return;
    void sendMessage(lastUser.content, [], { regenerate: true });
  }, [sendMessage]);

  return {
    sendMessage,
    regenerate,
    stop,
    isStreaming: useChatStore((s) => s.isStreaming),
  };
}
