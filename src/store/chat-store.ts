import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Conversation, Message } from "@/types/chat";
import {
  conversationTitleFromMessage,
  generateId,
} from "@/lib/utils";
import { DEFAULT_USER_NAME, MAX_CONVERSATIONS } from "@/lib/constants";

interface ChatState {
  userName: string;
  conversations: Conversation[];
  activeConversationId: string | null;
  sidebarOpen: boolean;
  isStreaming: boolean;

  setUserName: (name: string) => void;
  setSidebarOpen: (open: boolean) => void;
  setIsStreaming: (streaming: boolean) => void;

  createConversation: () => string;
  setActiveConversation: (id: string | null) => void;
  deleteConversation: (id: string) => void;

  getActiveConversation: () => Conversation | undefined;
  getMessages: () => Message[];

  addMessage: (message: Omit<Message, "id" | "createdAt"> & Partial<Pick<Message, "id" | "createdAt">>) => string;
  updateMessage: (id: string, content: string) => void;
  removeLastAssistantMessage: () => void;
  clearActiveChat: () => void;
}

function createEmptyConversation(): Conversation {
  const now = Date.now();
  return {
    id: generateId(),
    title: "Nova conversa",
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      userName: DEFAULT_USER_NAME,
      conversations: [],
      activeConversationId: null,
      sidebarOpen: false,
      isStreaming: false,

      setUserName: (name) => set({ userName: name }),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setIsStreaming: (streaming) => set({ isStreaming: streaming }),

      createConversation: () => {
        const conv = createEmptyConversation();
        set((state) => ({
          conversations: [conv, ...state.conversations].slice(0, MAX_CONVERSATIONS),
          activeConversationId: conv.id,
        }));
        return conv.id;
      },

      setActiveConversation: (id) => set({ activeConversationId: id }),

      deleteConversation: (id) =>
        set((state) => {
          const filtered = state.conversations.filter((c) => c.id !== id);
          const nextActive =
            state.activeConversationId === id
              ? filtered[0]?.id ?? null
              : state.activeConversationId;
          return { conversations: filtered, activeConversationId: nextActive };
        }),

      getActiveConversation: () => {
        const { conversations, activeConversationId } = get();
        return conversations.find((c) => c.id === activeConversationId);
      },

      getMessages: () => get().getActiveConversation()?.messages ?? [],

      addMessage: (message) => {
        const id = message.id ?? generateId();
        const createdAt = message.createdAt ?? Date.now();
        const full: Message = {
          id,
          role: message.role,
          content: message.content,
          createdAt,
          attachments: message.attachments,
        };

        set((state) => {
          let { activeConversationId, conversations } = state;

          if (!activeConversationId) {
            const conv = createEmptyConversation();
            activeConversationId = conv.id;
            conversations = [conv, ...conversations];
          }

          const updated = conversations.map((c) => {
            if (c.id !== activeConversationId) return c;
            const messages = [...c.messages, full];
            const title =
              c.messages.length === 0 && message.role === "user"
                ? conversationTitleFromMessage(message.content)
                : c.title;
            return {
              ...c,
              title,
              messages,
              updatedAt: Date.now(),
            };
          });

          return { conversations: updated, activeConversationId };
        });

        return id;
      },

      updateMessage: (id, content) =>
        set((state) => {
          const activeId = state.activeConversationId;
          if (!activeId) return state;

          return {
            conversations: state.conversations.map((c) =>
              c.id !== activeId
                ? c
                : {
                    ...c,
                    messages: c.messages.map((m) =>
                      m.id === id ? { ...m, content } : m
                    ),
                    updatedAt: Date.now(),
                  }
            ),
          };
        }),

      removeLastAssistantMessage: () =>
        set((state) => {
          const activeId = state.activeConversationId;
          if (!activeId) return state;

          return {
            conversations: state.conversations.map((c) => {
              if (c.id !== activeId) return c;
              const messages = [...c.messages];
              const lastIdx = messages.length - 1;
              if (lastIdx >= 0 && messages[lastIdx].role === "assistant") {
                messages.pop();
              }
              return { ...c, messages, updatedAt: Date.now() };
            }),
          };
        }),

      clearActiveChat: () =>
        set((state) => {
          const activeId = state.activeConversationId;
          if (!activeId) return state;

          return {
            conversations: state.conversations.map((c) =>
              c.id === activeId
                ? { ...c, messages: [], title: "Nova conversa", updatedAt: Date.now() }
                : c
            ),
          };
        }),
    }),
    {
      name: "venus-chat-storage",
      partialize: (state) => ({
        userName: state.userName,
        conversations: state.conversations,
        activeConversationId: state.activeConversationId,
      }),
    }
  )
);
