"use client";

import { useState } from "react";
import { Check, Copy, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MessageAttachments } from "@/components/chat/message-attachments";
import { VenusAvatar } from "@/components/chat/venus-avatar";
import { cn, copyToClipboard } from "@/lib/utils";
import type { Message } from "@/types/chat";

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
  onRegenerate?: () => void;
  showRegenerate?: boolean;
}

export function MessageBubble({
  message,
  isStreaming,
  onRegenerate,
  showRegenerate,
}: MessageBubbleProps) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const ok = await copyToClipboard(message.content);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className={cn(
        "group flex w-full gap-3 animate-slide-up",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {!isUser && <VenusAvatar size="sm" className="mt-1" />}

      <div
        className={cn(
          "relative max-w-[min(100%,42rem)] rounded-2xl px-4 py-3 text-[15px] leading-relaxed shadow-sm",
          isUser
            ? "border border-violet-500/25 bg-violet-950/60 text-venus-frost"
            : "glass-panel text-foreground/95"
        )}
      >
        {message.attachments && message.attachments.length > 0 && (
          <MessageAttachments attachments={message.attachments} />
        )}
        <MessageContent content={message.content} isStreaming={isStreaming} />

        {!isUser && message.content && !isStreaming && (
          <div className="mt-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="h-7 w-7 text-venus-muted hover:text-venus-frost"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{copied ? "Copiado" : "Copiar"}</TooltipContent>
            </Tooltip>

            {showRegenerate && onRegenerate && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="h-7 w-7 text-venus-muted hover:text-venus-frost"
                    onClick={onRegenerate}
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Regenerar</TooltipContent>
              </Tooltip>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function MessageContent({
  content,
  isStreaming,
}: {
  content: string;
  isStreaming?: boolean;
}) {
  if (!content && isStreaming) {
    return (
      <div className="flex gap-1 py-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-violet-400/70"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="whitespace-pre-wrap break-words">
      {content}
      {isStreaming && content && (
        <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse-soft bg-violet-400 align-middle" />
      )}
    </div>
  );
}
