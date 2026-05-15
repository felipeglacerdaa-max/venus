import { AI_COMPLETION_PARAMS, VENUS_SYSTEM_PROMPT } from "@/lib/constants";
import { resolveGroqModel } from "@/lib/groq";
import type { ChatRequestBody } from "@/types/chat";

export const runtime = "edge";

export async function POST(req: Request) {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return Response.json(
      { error: "GROQ_API_KEY não configurada." },
      { status: 500 }
    );
  }

  let body: ChatRequestBody;
  try {
    body = (await req.json()) as ChatRequestBody;
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }

  const { messages, hasImages } = body;
  if (!messages?.length) {
    return Response.json({ error: "Nenhuma mensagem enviada" }, { status: 400 });
  }

  const model = resolveGroqModel(Boolean(hasImages));

  const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: VENUS_SYSTEM_PROMPT }, ...messages],
      stream: true,
      ...AI_COMPLETION_PARAMS,
    }),
  });

  if (!groqRes.ok) {
    const errText = await groqRes.text();
    return Response.json(
      { error: `Groq (${model}): ${groqRes.status} — ${errText}` },
      { status: groqRes.status }
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const reader = groqRes.body?.getReader();
      if (!reader) {
        controller.close();
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data: ")) continue;

            const data = trimmed.slice(6);
            if (data === "[DONE]") {
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              continue;
            }

            try {
              const json = JSON.parse(data) as {
                choices?: { delta?: { content?: string } }[];
              };
              const content = json.choices?.[0]?.delta?.content;
              if (content) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
                );
              }
            } catch {
              /* SSE parcial */
            }
          }
        }
      } catch (e) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ content: `\n\nErro no stream: ${(e as Error).message}` })}\n\n`
          )
        );
      } finally {
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
