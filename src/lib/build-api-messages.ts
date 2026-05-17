import type {
  ApiChatMessage,
  ApiMessageContent,
  Message,
  OutgoingAttachment,
} from "@/types/chat";

function buildUserContent(
  text: string,
  attachments?: OutgoingAttachment[]
): ApiMessageContent {
  const parts: ApiMessageContent = [];
  const trimmed = text.trim();

  if (trimmed) {
    parts.push({ type: "text", text: trimmed });
  }

  if (attachments?.length) {
    for (const a of attachments) {
      if (a.kind === "image" && a.dataUrl) {
        parts.push({
          type: "image_url",
          image_url: { url: a.dataUrl },
        });
      }
    }
  }

  if (parts.length === 0) return " ";
  if (parts.length === 1 && parts[0].type === "text") return parts[0].text;
  return parts;
}

/** Converte histórico do store + anexos da mensagem atual para o formato Groq. */
export function buildApiMessages(
  messages: Message[],
  currentAttachments?: OutgoingAttachment[]
): { messages: ApiChatMessage[]; hasImages: boolean } {
  let hasImages = false;
  const apiMessages: ApiChatMessage[] = [];

  const lastUserIdx = [...messages]
    .map((m, i) => ({ m, i }))
    .filter(({ m }) => m.role === "user")
    .pop()?.i;

  messages.forEach((msg, index) => {
    const hasAttachments = !!(msg.attachments?.length || (index === lastUserIdx && currentAttachments?.length));
    if (msg.role === "system" || (!msg.content.trim() && !hasAttachments)) return;

    if (msg.role === "user" && index === lastUserIdx && currentAttachments?.length) {
      const content = buildUserContent(msg.content, currentAttachments);
      if (
        Array.isArray(content) &&
        content.some((p) => p.type === "image_url")
      ) {
        hasImages = true;
      }
      apiMessages.push({ role: "user", content });
    } else {
      apiMessages.push({ role: msg.role, content: msg.content });
    }
  });

  return { messages: apiMessages, hasImages };
}
