import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

// Interview insight: a "worker" is just an API call with a role + task.
// The power comes from how you compose them, not the call itself.

export async function runAgent({ role, systemPrompt, userMessage, label }) {
  console.log(`\n🤖 [${label}] starting...`);

  let fullText = "";

  // Streaming — so you see output as it's generated (better DX, same result)
  const stream = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 16000,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
    stream: true,
  });

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      process.stdout.write(event.delta.text);
      fullText += event.delta.text;
    }
  }

  console.log(`\n✅ [${label}] done.`);
  return fullText;
}

// Safe JSON parser — agents sometimes wrap JSON in backticks despite instructions
export function parseAgentJSON(raw) {
  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  try {
    return { data: JSON.parse(cleaned), error: null };
  } catch (e) {
    return { data: null, error: `JSON parse failed: ${e.message}\nRaw:\n${cleaned}` };
  }
}