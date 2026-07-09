// Vendor-neutral language-model adapter.
//
// The extractor depends only on this contract. It calls an
// OpenAI-compatible chat completion endpoint whose base URL, key and model
// are supplied through environment variables, so the deployment chooses its
// own provider and is not tied to any single vendor.

interface CompleteArgs {
  system: string;
  user: string;
  maxTokens?: number;
}

export async function complete({ system, user, maxTokens = 1024 }: CompleteArgs): Promise<string> {
  const baseUrl = process.env.LLM_BASE_URL;
  const apiKey = process.env.LLM_API_KEY;
  const model = process.env.LLM_MODEL;

  if (!baseUrl || !apiKey || !model) {
    throw new Error("LLM provider is not configured. Set LLM_BASE_URL, LLM_API_KEY and LLM_MODEL.");
  }

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`LLM request failed (${res.status}): ${detail}`);
  }

  const data = await res.json();
  return data?.choices?.[0]?.message?.content?.trim() ?? "";
}
