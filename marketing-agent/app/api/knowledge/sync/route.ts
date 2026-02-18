import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const KNOWLEDGE_DIR = path.resolve(process.cwd(), "..", "knowledge");

// ---------------------------------------------------------------------------
// File helpers (shared with chat route)
// ---------------------------------------------------------------------------

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
): { ok: boolean; created: boolean; path: string } | { error: string } {
  const relative = filePath.replace(/^knowledge\//, "");
  const full = path.resolve(KNOWLEDGE_DIR, relative);
  if (!full.startsWith(KNOWLEDGE_DIR)) return { error: "Invalid path" };
  if (!full.endsWith(".md")) return { error: "Only .md files are supported" };
  const dir = path.dirname(full);
  const created = !fs.existsSync(full);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(full, content, "utf-8");
  return { ok: true, created, path: filePath };
}

// ---------------------------------------------------------------------------
// Tools
// ---------------------------------------------------------------------------

const TOOLS = [
  {
    name: "list_knowledge",
    description: "List all files in the knowledge library.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [] as string[],
    },
  },
  {
    name: "read_knowledge",
    description:
      "Read a knowledge file to check its current content before updating.",
    input_schema: {
      type: "object" as const,
      properties: {
        path: {
          type: "string" as const,
          description: "File path, e.g. knowledge/positioning/proof-points.md",
        },
      },
      required: ["path"],
    },
  },
  {
    name: "write_knowledge",
    description:
      "Create or update a knowledge file. Always write well-structured Markdown.",
    input_schema: {
      type: "object" as const,
      properties: {
        path: {
          type: "string" as const,
          description:
            "File path, e.g. knowledge/positioning/verticals/insurance.md",
        },
        content: {
          type: "string" as const,
          description: "Full Markdown content for the file",
        },
      },
      required: ["path", "content"],
    },
  },
];

function executeTool(name: string, input: Record<string, string>): string {
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
// System prompt for the sync agent
// ---------------------------------------------------------------------------

const SYNC_SYSTEM_PROMPT = `You are a knowledge librarian for Persado's marketing operations. Your job is to take raw input — notes, decisions, proof points, competitive intelligence, positioning updates, meeting takeaways, or any unstructured content — and file it correctly into the knowledge library.

## THE KNOWLEDGE LIBRARY STRUCTURE

The library is organized into these categories:

- **knowledge/positioning/** — Messaging hierarchy, guardrails, competitive landscape, proof points
  - **knowledge/positioning/verticals/** — Vertical-specific positioning (retail-banking, co-branded-cards, mortgage, fintech, etc.)
- **knowledge/brand/** — Voice and tone, terminology, visual standards
- **knowledge/audiences/** — ICP profiles, persona pain points
- **knowledge/assets/** — Approved headlines, subject line bank, proof point usage

## YOUR PROCESS

1. Analyze the pasted content to understand what type of knowledge it contains
2. Determine whether it should:
   a. **Update an existing file** — if the content adds to or refines existing knowledge (e.g., new proof points go into proof-points.md, new competitive intel goes into competitive-landscape.md)
   b. **Create a new file** — if the content represents a new topic not covered by existing files (e.g., a new vertical, a new audience segment)
3. If updating an existing file, ALWAYS read the file first with read_knowledge, then write the complete updated version (not just the new content) so nothing is lost
4. Format everything as clean, well-structured Markdown matching the style of existing files
5. After writing, report exactly what you did: which file(s) you updated or created, and a summary of what was added

## FORMATTING RULES

- Use the same heading structure, table formats, and section patterns as existing files
- Include actionable guidance, not just raw data
- For proof points: include the stat, context, and where to use it
- For competitive intel: include the competitor, their weakness, and Persado's wedge
- For positioning: follow the messaging hierarchy (Speed > Cost > Compliance > Performance)
- For verticals: include profile, speed advantage, regulations, buyer map, campaign types

## IMPORTANT

- Never lose existing content when updating a file — always read first, then write the complete updated version
- If the user specifies a target file or category, respect that
- If the content doesn't clearly belong anywhere, suggest the best fit and explain why
- Be decisive — pick the right file and do the work. Don't just describe what you would do.`;

// ---------------------------------------------------------------------------
// Content block types
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
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured" },
      { status: 500 }
    );
  }

  try {
    const { content, targetHint } = await req.json();

    if (!content || typeof content !== "string") {
      return NextResponse.json(
        { error: "content string is required" },
        { status: 400 }
      );
    }

    // Build the user message
    let userMessage = `Here is the content to sync into the knowledge library:\n\n---\n\n${content}\n\n---`;
    if (targetHint) {
      userMessage += `\n\nHint from the user: target category or file is "${targetHint}".`;
    }
    userMessage +=
      "\n\nPlease analyze this content, determine the right file(s), and write it into the knowledge library. Report back what you did.";

    const MAX_TOOL_ROUNDS = 10;
    let currentMessages: Array<{ role: string; content: unknown }> = [
      { role: "user", content: userMessage },
    ];

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
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
          system: SYNC_SYSTEM_PROMPT,
          messages: currentMessages,
          tools: TOOLS,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Sync API error:", response.status, errorText);
        return NextResponse.json(
          { error: `API error: ${response.status}` },
          { status: response.status }
        );
      }

      const result = (await response.json()) as {
        content: ContentBlock[];
        stop_reason: string;
      };

      if (result.stop_reason === "tool_use") {
        const toolBlocks = result.content.filter(
          (b) => b.type === "tool_use"
        );
        const toolResults = toolBlocks.map((block) => ({
          type: "tool_result" as const,
          tool_use_id: block.id!,
          content: executeTool(block.name!, block.input!),
        }));

        currentMessages.push({ role: "assistant", content: result.content });
        currentMessages.push({ role: "user", content: toolResults });
        continue;
      }

      // Final text response — return it
      const summary = result.content
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("");

      // Collect which files were written
      const writtenFiles: string[] = [];
      for (const msg of currentMessages) {
        if (msg.role === "assistant" && Array.isArray(msg.content)) {
          for (const block of msg.content as ContentBlock[]) {
            if (
              block.type === "tool_use" &&
              block.name === "write_knowledge" &&
              block.input?.path
            ) {
              writtenFiles.push(block.input.path);
            }
          }
        }
      }

      return NextResponse.json({
        summary,
        filesWritten: writtenFiles,
      });
    }

    return NextResponse.json(
      { error: "Max processing rounds reached" },
      { status: 500 }
    );
  } catch (err) {
    console.error("Sync error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
