import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const KNOWLEDGE_DIR = path.resolve(process.cwd(), "..", "knowledge");

interface FileEntry {
  name: string;
  path: string;
  category: string;
  subcategory?: string;
}

interface SubcategoryEntry {
  id: string;
  label: string;
  files: FileEntry[];
}

interface CategoryEntry {
  id: string;
  label: string;
  description: string;
  files: FileEntry[];
  subcategories: SubcategoryEntry[];
}

const CATEGORY_META: Record<string, { label: string; description: string }> = {
  positioning: {
    label: "Positioning",
    description:
      "Messaging hierarchy, competitive landscape, guardrails, proof points, and vertical-specific positioning.",
  },
  brand: {
    label: "Brand",
    description:
      "Voice and tone guidelines, visual standards, and approved terminology.",
  },
  audiences: {
    label: "Audiences",
    description:
      "ICP profiles, persona pain points, and buyer journey mapping.",
  },
  assets: {
    label: "Assets",
    description:
      "Approved headlines, subject line banks, and proof point usage guides.",
  },
};

function formatName(filename: string): string {
  return filename
    .replace(/\.md$/, "")
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function scanDirectory(
  dirPath: string,
  category: string,
  subcategory?: string
): FileEntry[] {
  if (!fs.existsSync(dirPath)) return [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && e.name.endsWith(".md"))
    .map((e) => ({
      name: formatName(e.name),
      path: subcategory
        ? `${category}/${subcategory}/${e.name}`
        : `${category}/${e.name}`,
      category,
      ...(subcategory ? { subcategory } : {}),
    }));
}

export async function GET() {
  try {
    if (!fs.existsSync(KNOWLEDGE_DIR)) {
      return NextResponse.json({ categories: [] });
    }

    const topDirs = fs.readdirSync(KNOWLEDGE_DIR, { withFileTypes: true });
    const categories: CategoryEntry[] = [];

    for (const dir of topDirs) {
      if (!dir.isDirectory()) continue;
      const catId = dir.name;
      const meta = CATEGORY_META[catId] || {
        label: formatName(catId),
        description: "",
      };

      const catPath = path.join(KNOWLEDGE_DIR, catId);
      const files = scanDirectory(catPath, catId);

      // Scan subdirectories
      const subDirs = fs
        .readdirSync(catPath, { withFileTypes: true })
        .filter((e) => e.isDirectory());

      const subcategories: SubcategoryEntry[] = subDirs.map((sub) => ({
        id: sub.name,
        label: formatName(sub.name),
        files: scanDirectory(path.join(catPath, sub.name), catId, sub.name),
      }));

      categories.push({
        id: catId,
        label: meta.label,
        description: meta.description,
        files,
        subcategories,
      });
    }

    return NextResponse.json({ categories });
  } catch (err) {
    console.error("Knowledge listing error:", err);
    return NextResponse.json(
      { error: "Failed to list knowledge files" },
      { status: 500 }
    );
  }
}
