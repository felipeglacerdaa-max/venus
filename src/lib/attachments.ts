import { generateId } from "@/lib/utils";
import type { AttachmentKind, OutgoingAttachment } from "@/types/chat";

export const MAX_ATTACHMENTS = 5;
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_TEXT_FILE_BYTES = 512 * 1024;

export const ACCEPTED_FILE_INPUT =
  "image/jpeg,image/png,image/gif,image/webp,.txt,.md,.json,.csv,.xml,.html,.css,.js,.ts,.tsx,.jsx,.py,.java,.c,.cpp,.h,.yaml,.yml,.pdf";

const TEXT_MIME_PREFIXES = ["text/", "application/json", "application/xml"];
const TEXT_EXTENSIONS =
  /\.(txt|md|json|csv|xml|html|css|js|ts|tsx|jsx|py|java|c|cpp|h|yaml|yml|log|env)$/i;

function isImage(mime: string) {
  return mime.startsWith("image/");
}

function isTextLike(file: File) {
  if (TEXT_MIME_PREFIXES.some((p) => file.type.startsWith(p))) return true;
  return TEXT_EXTENSIONS.test(file.name);
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Falha ao ler arquivo"));
    reader.readAsDataURL(file);
  });
}

function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Falha ao ler texto"));
    reader.readAsText(file, "utf-8");
  });
}

/** Gera preview JPEG comprimido para persistência e UI. */
export async function createImagePreview(
  dataUrl: string,
  maxWidth = 320
): Promise<string> {
  if (typeof window === "undefined") return dataUrl;

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export async function processFile(file: File): Promise<OutgoingAttachment> {
  const id = generateId();

  if (isImage(file.type)) {
    if (file.size > MAX_IMAGE_BYTES) {
      throw new Error(`Imagem muito grande (máx. ${MAX_IMAGE_BYTES / 1024 / 1024}MB)`);
    }
    const dataUrl = await readAsDataURL(file);
    const previewUrl = await createImagePreview(dataUrl);
    return {
      id,
      name: file.name,
      mimeType: file.type,
      kind: "image",
      size: file.size,
      dataUrl,
      previewUrl,
    };
  }

  if (isTextLike(file)) {
    if (file.size > MAX_TEXT_FILE_BYTES) {
      throw new Error(`Arquivo de texto muito grande (máx. ${MAX_TEXT_FILE_BYTES / 1024}KB)`);
    }
    const textContent = await readAsText(file);
    return {
      id,
      name: file.name,
      mimeType: file.type || "text/plain",
      kind: "file",
      size: file.size,
      textContent,
    };
  }

  if (file.type === "application/pdf") {
    throw new Error(
      "PDF ainda não é suportado. Exporte como .txt ou cole o conteúdo na mensagem."
    );
  }

  throw new Error(`Tipo não suportado: ${file.name}`);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function buildDisplayContent(
  text: string,
  attachments: OutgoingAttachment[]
): string {
  const parts: string[] = [];
  const trimmed = text.trim();
  if (trimmed) parts.push(trimmed);

  for (const a of attachments) {
    if (a.kind === "file" && a.textContent) {
      parts.push(
        `\n\n📄 **${a.name}**\n\`\`\`\n${a.textContent.slice(0, 12000)}${a.textContent.length > 12000 ? "\n…(truncado)" : ""}\n\`\`\``
      );
    } else if (a.kind === "image") {
      parts.push(`\n\n🖼️ *Imagem anexada: ${a.name}*`);
    }
  }

  return parts.join("").trim() || "Analise os anexos enviados.";
}
