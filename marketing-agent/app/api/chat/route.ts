import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const KNOWLEDGE_DIR = path.resolve(process.cwd(), "..", "knowledge");

// ---------------------------------------------------------------------------
// Knowledge file helpers
// ---------------------------------------------------------------------------

function loadAllKnowledge(): string {
  const sections: string[] = [];

  function walk(dir: string, prefix: string) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full, `${prefix}/${entry.name}`);
      } else if (entry.name.endsWith(".md")) {
        const content = fs.readFileSync(full, "utf-8");
        sections.push(
          `\n<knowledge-file path="${prefix}/${entry.name}">\n${content}\n</knowledge-file>`
        );
      }
    }
  }

  walk(KNOWLEDGE_DIR, "knowledge");
  return sections.join("\n");
}

function listKnowledgeFiles(): string {
  const files: string[] = [];
  function walk(dir: string, prefix: string) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full, `${prefix}/${entry.name}`);
      } else if (entry.name.endsWith(".md")) {
        files.push(`${prefix}/${entry.name}`);
      }
    }
  }
  walk(KNOWLEDGE_DIR, "knowledge");
  return files.join("\n");
}

function readKnowledgeFile(
  filePath: string
): { content: string } | { error: string } {
  const relative = filePath.replace(/^knowledge\//, "");
  const full = path.resolve(KNOWLEDGE_DIR, relative);
  if (!full.startsWith(KNOWLEDGE_DIR)) return { error: "Invalid path" };
  if (!fs.existsSync(full)) return { error: "File not found" };
  return { content: fs.readFileSync(full, "utf-8") };
}

function writeKnowledgeFile(
  filePath: string,
  content: string
): { ok: boolean; created: boolean } | { error: string } {
  const relative = filePath.replace(/^knowledge\//, "");
  const full = path.resolve(KNOWLEDGE_DIR, relative);
  if (!full.startsWith(KNOWLEDGE_DIR)) return { error: "Invalid path" };
  if (!full.endsWith(".md")) return { error: "Only .md files are supported" };
  const dir = path.dirname(full);
  const created = !fs.existsSync(full);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(full, content, "utf-8");
  return { ok: true, created };
}

// ---------------------------------------------------------------------------
// Tools definition (Anthropic tool_use format)
// ---------------------------------------------------------------------------

const TOOLS = [
  {
    name: "list_knowledge",
    description:
      "List all files in the Persado knowledge library. Returns file paths.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [] as string[],
    },
  },
  {
    name: "read_knowledge",
    description:
      "Read the full content of a knowledge file. Use the path as shown by list_knowledge (e.g. knowledge/positioning/messaging-hierarchy.md).",
    input_schema: {
      type: "object" as const,
      properties: {
        path: {
          type: "string" as const,
          description:
            "Path to the knowledge file, e.g. knowledge/positioning/guardrails.md",
        },
      },
      required: ["path"],
    },
  },
  {
    name: "write_knowledge",
    description:
      "Create or update a knowledge file in the Persado library. Content should be well-structured Markdown. Use this to add new positioning, proof points, vertical research, competitive intelligence, or any strategic knowledge.",
    input_schema: {
      type: "object" as const,
      properties: {
        path: {
          type: "string" as const,
          description:
            "Path for the file, e.g. knowledge/positioning/verticals/insurance.md",
        },
        content: {
          type: "string" as const,
          description: "Markdown content of the knowledge file",
        },
      },
      required: ["path", "content"],
    },
  },
];

// ---------------------------------------------------------------------------
// Execute a tool call
// ---------------------------------------------------------------------------

function executeTool(
  name: string,
  input: Record<string, string>
): string {
  switch (name) {
    case "list_knowledge":
      return listKnowledgeFiles();
    case "read_knowledge":
      return JSON.stringify(readKnowledgeFile(input.path));
    case "write_knowledge":
      return JSON.stringify(writeKnowledgeFile(input.path, input.content));
    default:
      return JSON.stringify({ error: `Unknown tool: ${name}` });
  }
}

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

function buildSystemPrompt(): string {
  const knowledge = loadAllKnowledge();

  return `You are Persado's Marketing Agent — a senior product marketing strategist and execution engine built for Jonathan Maimon, Director of Product Marketing at Persado.

## YOUR ROLE

You are NOT a generic marketing assistant. You are Persado's PMM agent with deep, internalized knowledge of:
- Persado's messaging hierarchy (Speed > Cost > Compliance > Performance)
- Competitive positioning (the "Baby Carrot Strategy" — we compete on agency budgets, not AI tool budgets)
- Brand voice and terminology standards
- Verified proof points (use ONLY approved stats — never fabricate numbers)
- Audience ICPs and buyer pain points
- Vertical-specific positioning (Cards, Co-Brand, Mortgage, Consumer Banking, Fintech)
- The three plays: CREATE, OPTIMIZE, AUTOMATE
- Messaging guardrails and banned language

## YOUR KNOWLEDGE BASE

The following is the complete Persado knowledge library — your source of truth. Every piece of content you produce must be grounded in this knowledge. Do not deviate from the messaging hierarchy, guardrails, or approved proof points.

${knowledge}

## CRITICAL RULES

1. **Speed first, always.** Every piece of content leads with speed. No exceptions (unless writing specifically for compliance officers).
2. **Follow the hierarchy.** Speed > Cost > Compliance > Performance. This order is mandatory.
3. **Production-ready, not drafts.** Emphasize this as Persado's key differentiator vs. generic AI.
4. **"Compliance during generation, not after."** Use this phrase prominently.
5. **Dissolve the trade-off.** Never say Persado "balances" speed and compliance. It eliminates the tension.
6. **Sell outcomes, not technology.** Nobody buys "NLG." They buy "days instead of weeks."
7. **Use approved proof points only.** If a stat isn't in the knowledge library, don't use it.
8. **Apply the "so what?" test.** Every claim must answer: why should a VP of Marketing at a bank care?
9. **Apply the specificity test.** If you remove "Persado" and it could describe any other AI tool, rewrite it.
10. **Never use banned language.** No "leverage," "empower," "cutting-edge," "state-of-the-art," "next-generation," "synergy," "robust," "seamless," "holistic," "unlock," "harness," "revolutionize," "transform," "AI-powered."

## HOW TO USE YOUR TOOLS

You have access to the knowledge library through tools:

- **list_knowledge**: List all files in the library. Use when you need to check what knowledge exists.
- **read_knowledge**: Read a specific file for the latest version of a document.
- **write_knowledge**: Create or update a knowledge file. Use when:
  - Research produces new competitive intelligence
  - New proof points or case studies need to be documented
  - Vertical-specific positioning needs to be added or refined
  - New approved headlines, subject lines, or messaging are developed
  - Any strategic knowledge needs to be captured for future use

When creating new knowledge files, follow the structure and formatting patterns of existing files. Always use well-structured Markdown with clear headings, tables where appropriate, and actionable guidance.

## WHEN YOU CHALLENGE THE BRIEF

You are not an order-taker. When a request doesn't follow the messaging hierarchy or guardrails:
- Flag it directly: "This leads with performance, but the hierarchy requires leading with speed. Here's why that matters..."
- Propose the corrected version alongside the flagged issue
- Explain the strategic reasoning from the knowledge base

## CONTENT PRODUCTION

When producing content:
- Always ask which vertical and audience if not specified
- Format output clearly with markdown
- Apply the self-check from the messaging hierarchy before delivering
- Use specific numbers, not adjectives
- Name the trade-off being dissolved
- Name the budget being displaced
- Keep copy tight — 80% scope at 100% quality beats 100% scope at 80% quality

## DELIVERABLE TYPES

You produce: pitch decks, one-pagers (per play and per vertical), outreach campaigns (email sequences, LinkedIn, subject lines), website copy, battle cards, case study frameworks, sales enablement (objection handling, discovery questions, talk tracks), and competitive analysis.`;
}

// ---------------------------------------------------------------------------
// Anthropic streaming event types (minimal)
// ---------------------------------------------------------------------------

interface ContentBlock {
  type: string;
  text?: string;
  id?: string;
  name?: string;
  input?: Record<string, string>;
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  if (!ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: "ANTHROPIC_API_KEY is not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "messages array is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = buildSystemPrompt();

    // Format user/assistant messages for the API
    const apiMessages: Array<{ role: string; content: unknown }> = messages.map(
      (m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      })
    );

    // -------------------------------------------------------------------
    // Agentic loop — resolve tool calls server-side before streaming
    // -------------------------------------------------------------------

    const MAX_TOOL_ROUNDS = 8;
    let currentMessages = [...apiMessages];

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      // Call Anthropic API with streaming
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-5-20250929",
          max_tokens: 8192,
          system: systemPrompt,
          messages: currentMessages,
          tools: TOOLS,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Anthropic API error:", response.status, errorText);
        return new Response(
          JSON.stringify({ error: `API error: ${response.status}` }),
          {
            status: response.status,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Parse the streamed response fully to detect tool_use
      const reader = response.body?.getReader();
      if (!reader) {
        return new Response(
          JSON.stringify({ error: "No response stream" }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }

      const decoder = new TextDecoder();
      let buffer = "";
      const contentBlocks: ContentBlock[] = [];
      let curType = "";
      let curId = "";
      let curName = "";
      let curText = "";
      let curInput = "";
      let stopReason = "";
      const textChunks: string[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") continue;

          let parsed: Record<string, unknown>;
          try {
            parsed = JSON.parse(data);
          } catch {
            continue;
          }

          if (parsed.type === "content_block_start") {
            const block = parsed.content_block as Record<string, string>;
            curType = block.type || "";
            curId = block.id || "";
            curName = block.name || "";
            curText = "";
            curInput = "";
          } else if (parsed.type === "content_block_delta") {
            const delta = parsed.delta as Record<string, string>;
            if (delta.type === "text_delta" && delta.text) {
              curText += delta.text;
              textChunks.push(delta.text);
            } else if (delta.type === "input_json_delta" && delta.text) {
              curInput += delta.text;
            }
          } else if (parsed.type === "content_block_stop") {
            if (curType === "text") {
              contentBlocks.push({ type: "text", text: curText });
            } else if (curType === "tool_use") {
              let parsedInput: Record<string, string> = {};
              try {
                parsedInput = JSON.parse(curInput);
              } catch {
                /* skip */
              }
              contentBlocks.push({
                type: "tool_use",
                id: curId,
                name: curName,
                input: parsedInput,
              });
            }
          } else if (parsed.type === "message_delta") {
            const delta = parsed.delta as Record<string, string>;
            stopReason = delta.stop_reason || "";
          }
        }
      }

      // If tool_use, execute tools and loop back
      if (stopReason === "tool_use") {
        const toolBlocks = contentBlocks.filter((b) => b.type === "tool_use");
        const toolResults = toolBlocks.map((block) => ({
          type: "tool_result" as const,
          tool_use_id: block.id!,
          content: executeTool(block.name!, block.input!),
        }));

        currentMessages.push({ role: "assistant", content: contentBlocks });
        currentMessages.push({ role: "user", content: toolResults });

        // Reset text chunks for next round
        textChunks.length = 0;
        continue;
      }

      // No tool calls — stream collected text back to client
      const encoder = new TextEncoder();
      const outStream = new ReadableStream({
        start(controller) {
          for (const chunk of textChunks) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`)
            );
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        },
      });

      return new Response(outStream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // Exhausted tool rounds
    return new Response(
      JSON.stringify({ error: "Max tool rounds reached" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Chat API error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
