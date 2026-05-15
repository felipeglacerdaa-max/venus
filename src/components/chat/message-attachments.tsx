"use client";

import { FileText } from "lucide-react";
import type { MessageAttachment } from "@/types/chat";
import { formatFileSize } from "@/lib/attachments";

interface MessageAttachmentsProps {
  attachments: MessageAttachment[];
}

export function MessageAttachments({ attachments }: MessageAttachmentsProps) {
  if (!attachments.length) return null;

  return (
    <div className="mb-2 flex flex-wrap gap-2">
      {attachments.map((file) =>
        file.kind === "image" && file.previewUrl ? (
          <a
            key={file.id}
            href={file.previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block overflow-hidden rounded-xl border border-violet-500/20 transition-opacity hover:opacity-90"
          >
            <img
              src={file.previewUrl}
              alt={file.name}
              className="max-h-48 max-w-full object-cover"
            />
          </a>
        ) : (
          <div
            key={file.id}
            className="flex items-center gap-2 rounded-xl border border-violet-500/15 bg-violet-950/40 px-3 py-2"
          >
            <FileText className="h-4 w-4 shrink-0 text-violet-400" />
            <div className="min-w-0">
              <p className="truncate text-xs font-medium">{file.name}</p>
              <p className="text-[10px] text-venus-muted">
                {formatFileSize(file.size)}
              </p>
            </div>
          </div>
        )
      )}
    </div>
  );
}
