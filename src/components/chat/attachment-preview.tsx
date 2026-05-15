"use client";

import { FileText, X } from "lucide-react";
import { formatFileSize } from "@/lib/attachments";
import { cn } from "@/lib/utils";
import type { OutgoingAttachment } from "@/types/chat";

interface AttachmentPreviewProps {
  attachments: OutgoingAttachment[];
  onRemove: (id: string) => void;
}

export function AttachmentPreview({
  attachments,
  onRemove,
}: AttachmentPreviewProps) {
  if (!attachments.length) return null;

  return (
    <div className="flex flex-wrap gap-2 px-1 pb-2">
      {attachments.map((file) => (
        <div
          key={file.id}
          className={cn(
            "group relative flex items-center gap-2 rounded-xl border border-violet-500/20",
            "bg-violet-950/50 py-1.5 pl-1.5 pr-8 transition-colors hover:border-violet-400/30"
          )}
        >
          {file.kind === "image" && file.previewUrl ? (
            <img
              src={file.previewUrl}
              alt={file.name}
              className="h-12 w-12 rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-violet-900/50">
              <FileText className="h-5 w-5 text-violet-300" />
            </div>
          )}

          <div className="min-w-0 max-w-[140px]">
            <p className="truncate text-xs font-medium text-venus-frost">
              {file.name}
            </p>
            <p className="text-[10px] text-venus-muted">
              {formatFileSize(file.size)}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onRemove(file.id)}
            className="absolute right-1 top-1 rounded-md p-0.5 text-venus-muted opacity-0 transition-opacity hover:bg-violet-800/60 hover:text-venus-frost group-hover:opacity-100"
            aria-label={`Remover ${file.name}`}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
