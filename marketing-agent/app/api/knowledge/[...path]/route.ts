import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const KNOWLEDGE_DIR = path.resolve(process.cwd(), "..", "knowledge");

function safePath(segments: string[]): string | null {
  const joined = path.join(...segments);
  const full = path.resolve(KNOWLEDGE_DIR, joined);
  // Prevent path traversal
  if (!full.startsWith(KNOWLEDGE_DIR)) return null;
  return full;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: segments } = await params;
    const filePath = safePath(segments);
    if (!filePath) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const content = fs.readFileSync(filePath, "utf-8");
    const stat = fs.statSync(filePath);

    return NextResponse.json({
      content,
      path: segments.join("/"),
      lastModified: stat.mtime.toISOString(),
    });
  } catch (err) {
    console.error("Knowledge read error:", err);
    return NextResponse.json(
      { error: "Failed to read file" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: segments } = await params;
    const filePath = safePath(segments);
    if (!filePath) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    // Only allow .md files
    if (!filePath.endsWith(".md")) {
      return NextResponse.json(
        { error: "Only markdown files are supported" },
        { status: 400 }
      );
    }

    const { content } = await req.json();
    if (typeof content !== "string") {
      return NextResponse.json(
        { error: "content string is required" },
        { status: 400 }
      );
    }

    // Create directories if needed
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const isNew = !fs.existsSync(filePath);
    fs.writeFileSync(filePath, content, "utf-8");

    return NextResponse.json({
      ok: true,
      path: segments.join("/"),
      created: isNew,
    });
  } catch (err) {
    console.error("Knowledge write error:", err);
    return NextResponse.json(
      { error: "Failed to write file" },
      { status: 500 }
    );
  }
}
