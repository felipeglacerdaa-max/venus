"use client";

import { VenusAvatar } from "@/components/chat/venus-avatar";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";

const suggestions = [
  "Resuma este tema em tópicos objetivos.",
  "Ajude-me a estruturar um plano de ação para…",
  "Explique de forma didática como funciona…",
];

interface EmptyStateProps {
  onSuggestionClick: (text: string) => void;
}

export function EmptyState({ onSuggestionClick }: EmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center animate-fade-in">
      <VenusAvatar size="xl" className="mb-6" />

      <h2 className="font-display text-2xl font-semibold tracking-tight text-venus-frost md:text-3xl">
        {APP_NAME}
      </h2>

      <p className="mt-2 text-sm font-medium text-violet-300/80 md:text-base">
        {APP_TAGLINE}
      </p>

      <p className="mt-3 max-w-md text-sm leading-relaxed text-venus-muted">
        Respostas claras, estruturadas e contextualizadas. Como posso ajudar?
      </p>

      <div className="mt-10 flex w-full max-w-lg flex-col gap-2">
        {suggestions.map((text) => (
          <button
            key={text}
            type="button"
            onClick={() => onSuggestionClick(text)}
            className="glass-panel rounded-xl px-4 py-3 text-left text-sm text-venus-frost/90 transition-colors hover:border-violet-400/25 hover:bg-violet-500/8"
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}
