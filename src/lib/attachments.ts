import { generateId } from "@/lib/utils";
import type { OutgoingAttachment } from "@/types/chat";
// Setup removed from top level to avoid SSR issues

export const MAX_ATTACHMENTS = 5;
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_TEXT_FILE_BYTES = 512 * 1024;

export const ACCEPTED_FILE_INPUT =
  "image/jpeg,image/png,image/gif,image/webp,.txt,.md,.json,.csv,.xml,.html,.css,.js,.ts,.tsx,.jsx,.py,.java,.c,.cpp,.h,.yaml,.yml,.pdf,.doc,.docx";

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

async function readPdfText(file: File): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");
  if (typeof window !== "undefined") {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
  }
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((item) => {
      if ("str" in item) {
        return typeof item.str === "string" ? item.str : "";
      }
      return "";
    });
    text += strings.join(" ") + "\n";
  }
  return text;
}

async function readDocxText(file: File): Promise<string> {
  const mammoth = (await import("mammoth")).default;
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
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

  let textContent = "";
  let isSupported = false;

  if (isTextLike(file)) {
    if (file.size > MAX_TEXT_FILE_BYTES) {
      throw new Error(`Arquivo de texto muito grande (máx. ${MAX_TEXT_FILE_BYTES / 1024}KB)`);
    }
    textContent = await readAsText(file);
    isSupported = true;
  } else if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    try {
      textContent = await readPdfText(file);
      isSupported = true;
    } catch (error) {
      console.error("PDF Extraction Error:", error);
      throw new Error("Falha ao extrair texto do PDF. Verifique se o arquivo não está corrompido ou protegido por senha.");
    }
  } else if (
    file.name.toLowerCase().endsWith(".docx") ||
    file.name.toLowerCase().endsWith(".doc") ||
    file.type.includes("wordprocessingml") ||
    file.type === "application/msword"
  ) {
    try {
      textContent = await readDocxText(file);
      isSupported = true;
    } catch (error) {
      console.error("DOCX Extraction Error:", error);
      throw new Error("Falha ao extrair texto do documento Word.");
    }
  }

  if (isSupported) {
    return {
      id,
      name: file.name,
      mimeType: file.type || "text/plain",
      kind: "file",
      size: file.size,
      textContent,
    };
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

  const fileParts: string[] = [];
  for (const a of attachments) {
    if (a.kind === "file" && a.textContent) {
      fileParts.push(
        `<document name="${a.name}">\n${a.textContent.slice(0, 8000)}${a.textContent.length > 8000 ? "\n[TRUNCATED]" : ""}\n</document>`
      );
    } else if (a.kind === "image") {
      fileParts.push(`<image name="${a.name}" />`);
    }
  }

  if (fileParts.length > 0) {
    parts.push(`\n\n<FILE_DATA>\n${fileParts.join("\n\n")}\n</FILE_DATA>`);
  }

  // Se não houver texto do usuário, mas houver arquivo, parts terá apenas a tag FILE_DATA.
  // Isso garante que o bot receba o contexto mas a interface não renderize nada no texto.
  return parts.join("").trim();
}
