"use client";

import { Menu, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ThemeToggle } from "@/components/theme-toggle";
import { VenusAvatar } from "@/components/chat/venus-avatar";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";

interface ChatHeaderProps {
  title?: string;
  onMenuClick: () => void;
  onClearChat: () => void;
}

export function ChatHeader({ title, onMenuClick, onClearChat }: ChatHeaderProps) {
  return (
    <header className="flex shrink-0 items-center justify-between gap-4 border-b border-violet-500/10 bg-venus-deep/40 px-4 py-3 backdrop-blur-xl md:px-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-venus-muted hover:text-venus-frost lg:hidden"
          onClick={onMenuClick}
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <VenusAvatar size="md" />
        <div className="min-w-0">
          <h1 className="font-display text-lg font-semibold tracking-tight text-venus-frost">
            {APP_NAME}
          </h1>
          <p className="truncate text-xs text-venus-muted">
            {title ?? APP_TAGLINE}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <ThemeToggle />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-venus-muted hover:text-venus-rose"
              onClick={onClearChat}
              aria-label="Limpar conversa"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Limpar chat</TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}
