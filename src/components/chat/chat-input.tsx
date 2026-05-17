"use client";

import { useCallback, useRef, useState, type KeyboardEvent } from "react";
import { ArrowUp, Paperclip, Square } from "lucide-react";
import { AttachmentPreview } from "@/components/chat/attachment-preview";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ACCEPTED_FILE_INPUT,
  MAX_ATTACHMENTS,
  processFile,
} from "@/lib/attachments";
import { cn } from "@/lib/utils";
import type { OutgoingAttachment } from "@/types/chat";

interface ChatInputProps {
  onSend: (message: string, attachments: OutgoingAttachment[]) => void;
  onStop?: () => void;
  isStreaming?: boolean;
  disabled?: boolean;
}

export function ChatInput({
  onSend,
  onStop,
  isStreaming,
  disabled,
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const [attachments, setAttachments] = useState<OutgoingAttachment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canSend =
    !isStreaming &&
    !disabled &&
    (value.trim().length > 0 || attachments.length > 0);

  const addFiles = useCallback(async (files: FileList | File[]) => {
    setError(null);
    const list = Array.from(files);
    const remaining = MAX_ATTACHMENTS - attachments.length;

    if (remaining <= 0) {
      setError(`Máximo de ${MAX_ATTACHMENTS} anexos por mensagem.`);
      return;
    }

    const toProcess = list.slice(0, remaining);
    const next: OutgoingAttachment[] = [];

    for (const file of toProcess) {
      try {
        next.push(await processFile(file));
      } catch (e) {
        setError((e as Error).message);
      }
    }

    if (next.length) {
      setAttachments((prev) => [...prev, ...next].slice(0, MAX_ATTACHMENTS));
    }
  }, [attachments.length]);

  const submit = () => {
    if (!canSend) return;
    onSend(value, attachments);
    setValue("");
    setAttachments([]);
    setError(null);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length) void addFiles(e.dataTransfer.files);
  };

  return (
    <div className="border-t border-violet-500/10 bg-gradient-to-t from-venus-deep/90 to-venus-deep/40 px-3 py-3 backdrop-blur-xl sm:px-6 sm:py-4">
      <div className="mx-auto max-w-3xl">
        {error && (
          <p className="mb-2 rounded-lg border border-red-500/20 bg-red-950/30 px-3 py-2 text-xs text-red-300">
            {error}
          </p>
        )}

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={cn(
            "chat-input-shell rounded-2xl transition-all duration-200",
            isDragging && "ring-2 ring-violet-400/40 ring-offset-2 ring-offset-venus-deep"
          )}
        >
          <AttachmentPreview
            attachments={attachments}
            onRemove={(id) =>
              setAttachments((prev) => prev.filter((a) => a.id !== id))
            }
          />

          <div className="flex items-end gap-1.5 p-2 sm:gap-2 sm:p-2.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={disabled || isStreaming || attachments.length >= MAX_ATTACHMENTS}
                  onClick={() => fileInputRef.current?.click()}
                  className="h-9 w-9 sm:h-10 sm:w-10 shrink-0 rounded-xl text-venus-muted hover:bg-violet-500/10 hover:text-violet-300 transition-colors"
                  aria-label="Anexar foto ou arquivo"
                >
                  <Paperclip className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Fotos e arquivos (.txt, .md, .json…)</TooltipContent>
            </Tooltip>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ACCEPTED_FILE_INPUT}
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) void addFiles(e.target.files);
                e.target.value = "";
              }}
            />

            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onInput={handleInput}
              rows={1}
              disabled={disabled || isStreaming}
              placeholder="Mensagem… (Enter envia, Shift+Enter nova linha)"
              className={cn(
                "max-h-40 min-h-[44px] flex-1 resize-none bg-transparent py-2.5 text-[15px] leading-relaxed text-venus-frost",
                "placeholder:text-venus-muted/60 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              )}
            />

            {isStreaming ? (
              <Button
                type="button"
                size="icon"
                variant="glass"
                onClick={onStop}
                className="h-9 w-9 sm:h-10 sm:w-10 shrink-0 rounded-xl transition-transform hover:scale-105 active:scale-95"
                aria-label="Parar"
              >
                <Square className="h-4 w-4 fill-current" />
              </Button>
            ) : (
              <Button
                type="button"
                size="icon"
                onClick={submit}
                disabled={!canSend}
                className={cn(
                  "h-9 w-9 sm:h-10 sm:w-10 shrink-0 rounded-xl transition-all duration-300",
                  canSend
                    ? "bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-md shadow-violet-500/20 hover:shadow-violet-500/40 hover:scale-[1.05] active:scale-[0.95]"
                    : "bg-violet-900/20 text-venus-muted border border-violet-500/10"
                )}
                aria-label="Enviar"
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <p className="mt-2 hidden text-center text-[10px] text-venus-muted/70 sm:block">
          Arraste arquivos aqui · Imagens até 8MB · Texto até 512KB
        </p>
      </div>
    </div>
  );
}
