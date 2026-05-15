export type MessageRole = "user" | "assistant" | "system";

export type AttachmentKind = "image" | "file";

/** Anexo exibido no histórico (sem base64 completo no persist). */
export interface MessageAttachment {
  id: string;
  name: string;
  mimeType: string;
  kind: AttachmentKind;
  size: number;
  previewUrl?: string;
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: number;
  attachments?: MessageAttachment[];
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

/** Anexo pronto para envio à API (com dados completos). */
export interface OutgoingAttachment {
  id: string;
  name: string;
  mimeType: string;
  kind: AttachmentKind;
  size: number;
  previewUrl?: string;
  dataUrl?: string;
  textContent?: string;
}

export type ApiContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export type ApiMessageContent = string | ApiContentPart[];

export interface ApiChatMessage {
  role: "user" | "assistant" | "system";
  content: ApiMessageContent;
}

export interface ChatRequestBody {
  messages: ApiChatMessage[];
  hasImages?: boolean;
}
