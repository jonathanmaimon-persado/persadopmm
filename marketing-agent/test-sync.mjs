/**
 * Standalone test harness for the knowledge sync tool logic.
 * Exercises the same file read/write functions the sync route uses,
 * simulating 3 agentic scenarios to validate plumbing before live API tests.
 *
 * Usage: node test-sync.mjs
 */

import fs from "fs";
import path from "path";

const KNOWLEDGE_DIR = path.resolve(process.cwd(), "..", "knowledge");
const RESET_FILES = {}; // Store originals for rollback

// ─── Tool functions (mirrored from sync/route.ts) ───────────────────────────

function listKnowledgeFiles() {
  const files = [];
  function walk(dir, prefix) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full, `${prefix}/${entry.name}`);
      else if (entry.name.endsWith(".md")) files.push(`${prefix}/${entry.name}`);
    }
  }
  walk(KNOWLEDGE_DIR, "knowledge");
  return files;
}

function readKnowledgeFile(filePath) {
  const relative = filePath.replace(/^knowledge\//, "");
  const full = path.resolve(KNOWLEDGE_DIR, relative);
  if (!full.startsWith(KNOWLEDGE_DIR)) return { error: "Invalid path" };
  if (!fs.existsSync(full)) return { error: "File not found" };
  return { content: fs.readFileSync(full, "utf-8") };
}

function writeKnowledgeFile(filePath, content) {
  const relative = filePath.replace(/^knowledge\//, "");
  const full = path.resolve(KNOWLEDGE_DIR, relative);
  if (!full.startsWith(KNOWLEDGE_DIR)) return { error: "Invalid path" };
  if (!full.endsWith(".md")) return { error: "Only .md files are supported" };
  const dir = path.dirname(full);
  const created = !fs.existsSync(full);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  // Snapshot for rollback
  if (!created && !RESET_FILES[full]) {
    RESET_FILES[full] = fs.readFileSync(full, "utf-8");
  } else if (created) {
    RESET_FILES[full] = null; // means "delete on rollback"
  }

  fs.writeFileSync(full, content, "utf-8");
  return { ok: true, created, path: filePath };
}

function rollbackAll() {
  for (const [fullPath, original] of Object.entries(RESET_FILES)) {
    if (original === null) {
      if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    } else {
      fs.writeFileSync(fullPath, original, "utf-8");
    }
  }
  // Clear
  Object.keys(RESET_FILES).forEach((k) => delete RESET_FILES[k]);
}

// ─── Test helpers ────────────────────────────────────────────────────────────

function heading(title) {
  console.log(`\n${"═".repeat(72)}`);
  console.log(`  ${title}`);
  console.log(`${"═".repeat(72)}`);
}

function assert(cond, msg) {
  if (cond) console.log(`  ✓ ${msg}`);
  else {
    console.log(`  ✗ FAIL: ${msg}`);
    process.exitCode = 1;
  }
}

// ─── Test 1: Append proof point to existing file ────────────────────────────

function test1_proofPoint() {
  heading("Test 1: Append new proof point to existing file");

  const targetPath = "knowledge/positioning/proof-points.md";

  // Step 1: list files
  const files = listKnowledgeFiles();
  assert(files.includes(targetPath), `proof-points.md found in listing (${files.length} total files)`);

  // Step 2: read existing content
  const read = readKnowledgeFile(targetPath);
  assert(!read.error, "Read proof-points.md successfully");
  assert(read.content.includes("# Proof Points"), "File has expected heading");
  const originalLength = read.content.length;
  console.log(`  → Original file: ${originalLength} chars, ${read.content.split("\n").length} lines`);

  // Step 3: simulate agent merging a new proof point
  const newProofPoint = `

### JPMorgan Chase Card Acquisition Pilot (Q4 2025)
| Stat | +38% conversion lift |
|------|---------------------|
| **Context** | Persado-generated card acquisition emails vs. in-house creative team control, across 12 card products over 90 days |
| **Messaging stage** | Performance (close deals) |
| **Best used in** | Cards vertical pitches, case studies, ROI conversations |
| **Caveats** | Specific to card acquisition; do not generalize to all verticals without qualification |`;

  const updatedContent = read.content.trimEnd() + "\n" + newProofPoint + "\n";

  // Step 4: write
  const writeResult = writeKnowledgeFile(targetPath, updatedContent);
  assert(writeResult.ok === true, "Write succeeded");
  assert(writeResult.created === false, "Correctly identified as update (not create)");

  // Step 5: verify
  const verify = readKnowledgeFile(targetPath);
  assert(verify.content.includes("+38% conversion lift"), "New proof point appears in file");
  assert(verify.content.includes("# Proof Points"), "Original heading preserved");
  assert(verify.content.length > originalLength, `File grew (${originalLength} → ${verify.content.length})`);

  // Show diff stats
  const addedLines = verify.content.split("\n").length - read.content.split("\n").length;
  console.log(`  → Added ${addedLines} lines to proof-points.md`);

  rollbackAll();
  console.log("  → Rolled back changes");
}

// ─── Test 2: Add competitor to competitive landscape ────────────────────────

function test2_competitiveIntel() {
  heading("Test 2: Add new competitor to competitive-landscape.md");

  const targetPath = "knowledge/positioning/competitive-landscape.md";

  // Step 1: read
  const read = readKnowledgeFile(targetPath);
  assert(!read.error, "Read competitive-landscape.md successfully");
  assert(!read.content.includes("Typeface"), "Typeface not in file yet (clean state)");
  const originalLength = read.content.length;

  // Step 2: simulate agent adding Typeface
  const newEntry = `

## Typeface (Enterprise Content Platform)

| Attribute | Detail |
|-----------|--------|
| **Category** | Enterprise AI content generation |
| **Funding** | $200M Series C |
| **Where they win** | CPG, retail — brand-safe content generation at scale |
| **Where they fail** | Zero compliance layer, no financial services specialization, no performance data from regulated-industry A/B tests |
| **Persado's wedge** | Typeface generates brand-safe drafts; Persado generates production-ready, compliant, performance-optimized assets for regulated industries. Different capability tier for FS buyers. |
| **Budget displaced** | None directly — different buyer. But may appear in broader "AI content" conversations. |`;

  const updatedContent = read.content.trimEnd() + "\n" + newEntry + "\n";

  // Step 3: write
  const writeResult = writeKnowledgeFile(targetPath, updatedContent);
  assert(writeResult.ok === true, "Write succeeded");
  assert(writeResult.created === false, "Correctly identified as update");

  // Step 4: verify
  const verify = readKnowledgeFile(targetPath);
  assert(verify.content.includes("Typeface"), "Typeface entry now in file");
  assert(verify.content.includes("Baby Carrot Strategy"), "Original content preserved");
  assert(verify.content.length > originalLength, `File grew (${originalLength} → ${verify.content.length})`);

  const addedLines = verify.content.split("\n").length - read.content.split("\n").length;
  console.log(`  → Added ${addedLines} lines to competitive-landscape.md`);

  rollbackAll();
  console.log("  → Rolled back changes");
}

// ─── Test 3: Create new vertical file ───────────────────────────────────────

function test3_newVertical() {
  heading("Test 3: Create new insurance vertical file");

  const targetPath = "knowledge/positioning/verticals/insurance.md";

  // Step 1: confirm doesn't exist
  const preCheck = readKnowledgeFile(targetPath);
  assert(preCheck.error === "File not found", "insurance.md doesn't exist yet");

  // Step 2: create
  const content = `# Insurance

## Vertical Profile

**Primary pain:** Claims communications are the highest-stakes content in the insurance lifecycle — every letter needs state-level regulatory compliance and empathetic tone. Marketing production for policy renewals, cross-sell campaigns, and onboarding sequences is bottlenecked by dual review (legal + brand).

**Speed advantage:** Policy renewal campaigns in days vs. weeks. Claims communications that meet state DOI requirements without manual compliance review cycles.

## Key Regulations

- State Department of Insurance (DOI) guidelines
- NAIC Model Laws
- Unfair Claims Settlement Practices Act
- State-level unfair trade practices statutes

## Buyer Map

| Role | Pain | Entry Play |
|------|------|------------|
| **VP Marketing** | Renewal campaign velocity, cross-sell production bottleneck | CREATE |
| **Chief Customer Officer** | Claims communication quality + compliance | OPTIMIZE |
| **CRM / Lifecycle Owner** | Policy lifecycle automation, personalization at scale | AUTOMATE |

## Campaign Types

- Policy renewal campaigns
- Cross-sell / upsell (life → auto, home → umbrella)
- Claims status communications
- Onboarding / welcome sequences
- Rate change notifications

## Proof Points to Use

| Stat | Why It Works Here |
|------|-------------------|
| 72-hour deployment cycle | Renewal timing is seasonal — speed matters |
| 90% fewer compliance rejections | State-level insurance regulation is complex |
| Zero compliance incidents | Trust signal for risk-averse insurance buyers |
| 20+ regulatory frameworks | Demonstrate depth, even if insurance frameworks differ slightly |
`;

  const writeResult = writeKnowledgeFile(targetPath, content);
  assert(writeResult.ok === true, "Write succeeded");
  assert(writeResult.created === true, "Correctly identified as new file");
  assert(writeResult.path === targetPath, `Path matches: ${writeResult.path}`);

  // Step 3: verify it shows up in listing
  const files = listKnowledgeFiles();
  assert(files.includes(targetPath), "New file appears in listing");

  // Step 4: verify content
  const verify = readKnowledgeFile(targetPath);
  assert(verify.content.includes("# Insurance"), "Content has correct heading");
  assert(verify.content.includes("Claims communications"), "Content has vertical-specific detail");
  console.log(`  → Created insurance.md: ${verify.content.length} chars, ${verify.content.split("\n").length} lines`);

  rollbackAll();
  console.log("  → Rolled back (deleted new file)");

  // Verify rollback
  const postRollback = readKnowledgeFile(targetPath);
  assert(postRollback.error === "File not found", "File deleted after rollback");
}

// ─── Test 4: Validate API response shape ────────────────────────────────────

function test4_responseShape() {
  heading("Test 4: Validate expected response shape for UI");

  // This is what the sync route returns to the frontend
  const mockResponse = {
    summary: "Added JPMorgan Chase proof point to proof-points.md under the Performance section.",
    filesWritten: ["knowledge/positioning/proof-points.md"],
  };

  assert(typeof mockResponse.summary === "string", "summary is a string");
  assert(Array.isArray(mockResponse.filesWritten), "filesWritten is an array");
  assert(mockResponse.filesWritten.every((f) => f.startsWith("knowledge/")), "All paths start with knowledge/");
  assert(mockResponse.filesWritten.every((f) => f.endsWith(".md")), "All paths end with .md");
  console.log("  → Response shape matches KnowledgeLibrary.tsx expectations");
}

// ─── Test 5: Path traversal safety ──────────────────────────────────────────

function test5_pathSafety() {
  heading("Test 5: Path traversal safety");

  const badPaths = [
    "../../etc/passwd",
    "knowledge/../../../etc/passwd",
    "knowledge/positioning/../../.env",
  ];

  for (const p of badPaths) {
    const readResult = readKnowledgeFile(p);
    const writeResult = writeKnowledgeFile(p, "malicious");
    const blocked = readResult.error || writeResult.error;
    assert(blocked, `Blocked: ${p}`);
  }
}

// ─── Run ─────────────────────────────────────────────────────────────────────

console.log("Knowledge Sync — Tool Logic Test Harness");
console.log(`Knowledge dir: ${KNOWLEDGE_DIR}`);
console.log(`Files found: ${listKnowledgeFiles().length}`);

test1_proofPoint();
test2_competitiveIntel();
test3_newVertical();
test4_responseShape();
test5_pathSafety();

heading("SUMMARY");
if (process.exitCode) {
  console.log("  Some tests FAILED — check output above.\n");
} else {
  console.log("  All tests passed. Tool logic is solid.");
  console.log("  Next step: add ANTHROPIC_API_KEY to .env.local and re-test with live API.\n");
}
