"use client";

import { MessageSquarePlus, Trash2 } from "lucide-react";
import { VenusAvatar } from "@/components/chat/venus-avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ThemeToggle } from "@/components/theme-toggle";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/store/chat-store";
import type { Conversation } from "@/types/chat";

interface SidebarProps {
  className?: string;
  onConversationSelect?: () => void;
}

export function Sidebar({ className, onConversationSelect }: SidebarProps) {
  const {
    userName,
    conversations,
    activeConversationId,
    createConversation,
    setActiveConversation,
    deleteConversation,
  } = useChatStore();

  const handleNew = () => {
    createConversation();
    onConversationSelect?.();
  };

  const handleSelect = (id: string) => {
    setActiveConversation(id);
    onConversationSelect?.();
  };

  return (
    <aside
      className={cn(
        "flex h-full w-full flex-col border-r border-violet-500/10 bg-venus-deep/95 backdrop-blur-2xl",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 px-5 py-6">
        <div className="flex items-center gap-2.5">
          <VenusAvatar size="sm" />
          <span className="font-display text-xl font-semibold tracking-tight text-venus-frost">
            {APP_NAME}
          </span>
        </div>
        <ThemeToggle />
      </div>

      <div className="mx-4 mb-4 rounded-xl border border-violet-500/10 bg-violet-950/40 px-4 py-3">
        <p className="text-[10px] font-medium uppercase tracking-widest text-venus-muted">
          Conectado como
        </p>
        <p className="mt-0.5 truncate text-sm font-medium text-venus-frost">
          {userName}
        </p>
      </div>

      <div className="px-4 pb-3">
        <Button
          onClick={handleNew}
          className="w-full gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-800 text-white shadow-glow-sm hover:opacity-90"
        >
          <MessageSquarePlus className="h-4 w-4" />
          Nova conversa
        </Button>
      </div>

      <p className="px-5 pb-2 text-[10px] font-medium uppercase tracking-widest text-venus-muted">
        Recentes
      </p>

      <ScrollArea className="flex-1 px-2">
        <div className="space-y-0.5 pb-4">
          {conversations.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-venus-muted">
              Nenhuma conversa ainda
            </p>
          ) : (
            conversations.map((conv) => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                isActive={conv.id === activeConversationId}
                onSelect={() => handleSelect(conv.id)}
                onDelete={() => deleteConversation(conv.id)}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}

function ConversationItem({
  conversation,
  isActive,
  onSelect,
  onDelete,
}: {
  conversation: Conversation;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={cn(
        "group flex items-center gap-1 rounded-lg transition-colors",
        isActive ? "bg-violet-600/20" : "hover:bg-violet-500/10"
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "min-w-0 flex-1 truncate px-3 py-2.5 text-left text-sm",
          isActive ? "text-venus-frost" : "text-venus-muted hover:text-venus-frost"
        )}
      >
        {conversation.title}
      </button>
      <Button
        variant="ghost"
        size="icon-sm"
        className="mr-1 h-7 w-7 shrink-0 opacity-0 text-venus-muted hover:text-venus-rose group-hover:opacity-100"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        aria-label="Excluir conversa"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
