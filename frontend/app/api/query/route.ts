import Anthropic from "@anthropic-ai/sdk";
import briefingFixture from "@/lib/data/briefing_fixture.json";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Build a concise brief from the fixture so Claude has portfolio context
function buildContext() {
  const cards = briefingFixture.cards;
  const lines = cards.map((c) => {
    const accts = c.account_name
      ? c.account_name
      : c.affected_accounts.map((a) => a.name).join(", ");
    return `- ${c.pattern.replace(/_/g, " ")} (${Math.round(c.confidence * 100)}% confidence, ${accts}): ${c.synthesis.slice(0, 200)}`;
  });
  return lines.join("\n");
}

const SYSTEM = `You are Atlas, an executive intelligence assistant for Sarah Simmons, VP & General Manager of a Productivity & Collaboration product line. You help Sarah understand her portfolio of 25 enterprise accounts ($48.6M ARR).

Current portfolio signals (as of today's briefing):
${buildContext()}

Answer questions concisely and factually based on this briefing data. If asked about something not in the data, say so clearly. Use numbers and account names where relevant. Keep responses under 200 words unless the question demands more detail.`;

export async function POST(req: Request) {
  const { message, history = [] } = await req.json();

  const messages = [
    ...(history as Array<{ role: "user" | "assistant"; content: string }>),
    { role: "user" as const, content: message },
  ];

  const stream = await client.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    system: SYSTEM,
    messages,
  });

  const readable = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      for await (const chunk of stream) {
        if (
          chunk.type === "content_block_delta" &&
          chunk.delta.type === "text_delta"
        ) {
          controller.enqueue(enc.encode(chunk.delta.text));
        }
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
