// SERVER-ONLY AI inference. Never import this module into client components.
// GroqCloud is preferred when GROQ_API_KEY exists; otherwise use local Ollama for development.
export type AIProvider = "groq" | "ollama";

type AIRequest = {
  system: string;
  prompt: string;
  schema?: unknown;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
};

type AIResult = { text: string; provider: AIProvider };

export async function generateAI({
  system,
  prompt,
  schema,
  temperature = 0.2,
  maxTokens = 1200,
  timeoutMs = 30_000,
}: AIRequest): Promise<AIResult> {
  const groqKey = process.env.GROQ_API_KEY?.trim();
  if (groqKey) {
    const upstream = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${groqKey}`,
      },
      signal: AbortSignal.timeout(timeoutMs),
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || "openai/gpt-oss-20b",
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
        temperature,
        max_completion_tokens: maxTokens,
        reasoning_effort: "low",
        reasoning_format: "hidden",
        stream: false,
        ...(schema ? { response_format: { type: "json_schema", json_schema: {
          name: "estately_response", strict: true, schema,
        } } } : {}),
      }),
    });
    if (!upstream.ok) {
      // Log only status, never credentials, provider response text, or buyer data.
      throw new Error(`Groq returned HTTP ${upstream.status}`);
    }
    const data: unknown = await upstream.json();
    const result = data as { choices?: Array<{message?: {content?: unknown}} > };
    const content = result.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) {
      throw new Error("Groq returned an empty AI reply");
    }
    return { text: content.trim(), provider: "groq" };
  }

  // Local fallback during development; this URL is not accessible from Vercel.
  const upstream = await fetch("http://127.0.0.1:11434/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(Math.min(timeoutMs, 120_000)),
    body: JSON.stringify({
      model: process.env.OLLAMA_MODEL || "qwen2.5:3b",
      system,
      prompt,
      stream: false,
      ...(schema ? { format: schema } : {}),
      options: { temperature, num_predict: maxTokens },
    }),
  });
  if (!upstream.ok) throw new Error(`Ollama returned HTTP ${upstream.status}`);
  const data: unknown = await upstream.json();
  const result = data as { response?: unknown };
  if (typeof result.response !== "string" || !result.response.trim()) {
    throw new Error("Ollama returned an empty AI reply");
  }
  return { text: result.response.trim(), provider: "ollama" };
}
