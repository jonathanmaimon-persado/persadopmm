"use client";

import { useState, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";

interface KnowledgeFile {
  name: string;
  path: string;
  category: string;
  subcategory?: string;
}

interface Subcategory {
  id: string;
  label: string;
  files: KnowledgeFile[];
}

interface Category {
  id: string;
  label: string;
  description: string;
  files: KnowledgeFile[];
  subcategories: Subcategory[];
}

type View = "grid" | "list" | "read" | "edit";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  positioning: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 3h18v18H3z" />
      <path d="M3 9h18M9 3v18" />
    </svg>
  ),
  brand: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  ),
  audiences: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="9" cy="7" r="4" />
      <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
      <circle cx="19" cy="7" r="3" />
      <path d="M21 21v-2a3 3 0 00-2-2.83" />
    </svg>
  ),
  assets: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
      <polyline points="14,2 14,8 20,8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
};

function defaultIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
      <polyline points="14,2 14,8 20,8" />
    </svg>
  );
}

export default function KnowledgeLibrary() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("grid");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedFile, setSelectedFile] = useState<KnowledgeFile | null>(null);
  const [fileContent, setFileContent] = useState("");
  const [fileLoading, setFileLoading] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [newFileName, setNewFileName] = useState("");
  const [newFileCategory, setNewFileCategory] = useState("");
  const [newFileSubcategory, setNewFileSubcategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/knowledge");
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories);
      }
    } catch {
      // Silently fail — categories stay empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const openFile = async (file: KnowledgeFile) => {
    setSelectedFile(file);
    setView("read");
    setFileLoading(true);
    setSaveMessage(null);
    try {
      const res = await fetch(`/api/knowledge/${file.path}`);
      if (res.ok) {
        const data = await res.json();
        setFileContent(data.content);
      } else {
        setFileContent("*Failed to load file.*");
      }
    } catch {
      setFileContent("*Failed to load file.*");
    } finally {
      setFileLoading(false);
    }
  };

  const startEdit = () => {
    setEditContent(fileContent);
    setView("edit");
    setSaveMessage(null);
  };

  const startNew = () => {
    setNewFileName("");
    setNewFileCategory(categories[0]?.id || "positioning");
    setNewFileSubcategory("");
    setEditContent("");
    setSelectedFile(null);
    setView("edit");
    setSaveMessage(null);
  };

  const saveFile = async () => {
    setSaving(true);
    setSaveMessage(null);

    let filePath: string;
    if (selectedFile) {
      filePath = selectedFile.path;
    } else {
      const slug = newFileName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      if (!slug) {
        setSaveMessage({ type: "error", text: "Please enter a file name." });
        setSaving(false);
        return;
      }
      filePath = newFileSubcategory
        ? `${newFileCategory}/${newFileSubcategory}/${slug}.md`
        : `${newFileCategory}/${slug}.md`;
    }

    try {
      const res = await fetch(`/api/knowledge/${filePath}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent }),
      });
      if (res.ok) {
        const data = await res.json();
        setFileContent(editContent);
        setSaveMessage({
          type: "success",
          text: data.created ? "File created." : "File saved.",
        });
        // If new file, set it as selected
        if (!selectedFile) {
          const name = newFileName || filePath.split("/").pop()?.replace(/\.md$/, "") || "Untitled";
          setSelectedFile({
            name,
            path: filePath,
            category: newFileCategory,
            ...(newFileSubcategory ? { subcategory: newFileSubcategory } : {}),
          });
        }
        setView("read");
        fetchCategories(); // Refresh the list
      } else {
        const data = await res.json().catch(() => ({}));
        setSaveMessage({
          type: "error",
          text: data.error || "Failed to save.",
        });
      }
    } catch {
      setSaveMessage({ type: "error", text: "Network error." });
    } finally {
      setSaving(false);
    }
  };

  const goBack = () => {
    if (view === "edit" && selectedFile) {
      setView("read");
    } else if (view === "read" || (view === "edit" && !selectedFile)) {
      setView(selectedCategory ? "list" : "grid");
      setSelectedFile(null);
      setFileContent("");
    } else if (view === "list") {
      setView("grid");
      setSelectedCategory(null);
    }
    setSaveMessage(null);
  };

  // Count total files across all categories
  const totalFiles = categories.reduce(
    (sum, cat) =>
      sum +
      cat.files.length +
      cat.subcategories.reduce((s, sub) => s + sub.files.length, 0),
    0
  );

  // Search across all files
  const searchResults: KnowledgeFile[] = searchQuery.trim()
    ? categories.flatMap((cat) => [
        ...cat.files,
        ...cat.subcategories.flatMap((sub) => sub.files),
      ]).filter((f) =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.path.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  // --- RENDER ---

  // Breadcrumb
  const renderBreadcrumb = () => {
    const crumbs: { label: string; onClick?: () => void }[] = [
      {
        label: "Knowledge Library",
        onClick:
          view !== "grid"
            ? () => {
                setView("grid");
                setSelectedCategory(null);
                setSelectedFile(null);
                setSaveMessage(null);
              }
            : undefined,
      },
    ];
    if (selectedCategory && view !== "grid") {
      crumbs.push({
        label: selectedCategory.label,
        onClick:
          view !== "list"
            ? () => {
                setView("list");
                setSelectedFile(null);
                setSaveMessage(null);
              }
            : undefined,
      });
    }
    if (selectedFile) {
      crumbs.push({ label: selectedFile.name });
    }
    if (view === "edit" && !selectedFile) {
      crumbs.push({ label: "New Document" });
    }

    return (
      <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-4 flex-wrap">
        {crumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9,18 15,12 9,6" />
              </svg>
            )}
            {crumb.onClick ? (
              <button
                onClick={crumb.onClick}
                className="hover:text-indigo-600 transition-colors cursor-pointer"
              >
                {crumb.label}
              </button>
            ) : (
              <span className="text-gray-900 font-medium">{crumb.label}</span>
            )}
          </span>
        ))}
      </nav>
    );
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-sm text-gray-400">Loading knowledge base...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          {view !== "grid" && (
            <button
              onClick={goBack}
              className="mr-3 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              aria-label="Go back"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15,18 9,12 15,6" />
              </svg>
            </button>
          )}
          <div className="flex-1">
            {view === "grid" && (
              <>
                <h2 className="text-xl font-semibold text-gray-900">
                  Knowledge Library
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {totalFiles} documents across {categories.length} categories — Persado&apos;s source of truth.
                </p>
              </>
            )}
            {view !== "grid" && renderBreadcrumb()}
          </div>
          {view !== "edit" && (
            <button
              onClick={startNew}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer shrink-0"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              New
            </button>
          )}
        </div>

        {/* Search bar (grid view only) */}
        {view === "grid" && (
          <div className="relative mt-4 mb-5">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        )}

        {/* Search results */}
        {view === "grid" && searchQuery.trim() && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              {searchResults.length} result{searchResults.length !== 1 ? "s" : ""}
            </h3>
            {searchResults.length === 0 ? (
              <p className="text-sm text-gray-400">No documents match your search.</p>
            ) : (
              <div className="space-y-1">
                {searchResults.map((file) => (
                  <button
                    key={file.path}
                    onClick={() => openFile(file)}
                    className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200 transition-all flex items-center gap-3 cursor-pointer"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400 shrink-0">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
                      <polyline points="14,2 14,8 20,8" />
                    </svg>
                    <div>
                      <div className="text-sm font-medium text-gray-800">{file.name}</div>
                      <div className="text-xs text-gray-400">{file.path}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Category grid */}
        {view === "grid" && !searchQuery.trim() && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {categories.map((cat) => {
              const fileCount =
                cat.files.length +
                cat.subcategories.reduce((s, sub) => s + sub.files.length, 0);
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setView("list");
                  }}
                  className="text-left p-4 rounded-xl border border-gray-200 bg-white hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100 transition-colors shrink-0">
                      {CATEGORY_ICONS[cat.id] || defaultIcon()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm">
                        {cat.label}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                        {cat.description}
                      </p>
                      <div className="mt-2 text-xs text-gray-400">
                        {fileCount} document{fileCount !== 1 ? "s" : ""}
                        {cat.subcategories.length > 0 && (
                          <span>
                            {" "}· {cat.subcategories.length} sub-section
                            {cat.subcategories.length !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* File list for selected category */}
        {view === "list" && selectedCategory && (
          <div className="space-y-4 animate-fade-in">
            {/* Direct files */}
            {selectedCategory.files.length > 0 && (
              <div className="space-y-1">
                {selectedCategory.files.map((file) => (
                  <button
                    key={file.path}
                    onClick={() => openFile(file)}
                    className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200 transition-all flex items-center gap-3 cursor-pointer"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-indigo-400 shrink-0">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
                      <polyline points="14,2 14,8 20,8" />
                    </svg>
                    <div className="text-sm font-medium text-gray-800">{file.name}</div>
                  </button>
                ))}
              </div>
            )}

            {/* Subcategories */}
            {selectedCategory.subcategories.map((sub) => (
              <div key={sub.id}>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-1">
                  {sub.label}
                </h4>
                <div className="space-y-1">
                  {sub.files.map((file) => (
                    <button
                      key={file.path}
                      onClick={() => openFile(file)}
                      className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200 transition-all flex items-center gap-3 cursor-pointer"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-indigo-400 shrink-0">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
                        <polyline points="14,2 14,8 20,8" />
                      </svg>
                      <div className="text-sm font-medium text-gray-800">{file.name}</div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* File reader */}
        {view === "read" && (
          <div className="animate-fade-in">
            {/* Action bar */}
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={startEdit}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-700 hover:bg-white hover:shadow-sm transition-all cursor-pointer"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Edit
              </button>
            </div>

            {/* Save message */}
            {saveMessage && (
              <div
                className={`mb-4 px-3 py-2 rounded-lg text-sm ${
                  saveMessage.type === "success"
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {saveMessage.text}
              </div>
            )}

            {/* Content */}
            {fileLoading ? (
              <div className="text-sm text-gray-400 py-8 text-center">
                Loading...
              </div>
            ) : (
              <article className="prose prose-sm prose-gray max-w-none bg-white rounded-xl border border-gray-200 p-6">
                <ReactMarkdown>{fileContent}</ReactMarkdown>
              </article>
            )}
          </div>
        )}

        {/* Editor */}
        {view === "edit" && (
          <div className="animate-fade-in">
            {/* New file fields */}
            {!selectedFile && (
              <div className="space-y-3 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Document Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Insurance Vertical"
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Category
                    </label>
                    <select
                      value={newFileCategory}
                      onChange={(e) => {
                        setNewFileCategory(e.target.value);
                        setNewFileSubcategory("");
                      }}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Sub-section (optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., verticals"
                      value={newFileSubcategory}
                      onChange={(e) => setNewFileSubcategory(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Editor toolbar */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">
                Markdown supported
              </span>
              <div className="flex gap-2">
                <button
                  onClick={goBack}
                  className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={saveFile}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>

            {/* Save message in editor */}
            {saveMessage && (
              <div
                className={`mb-3 px-3 py-2 rounded-lg text-sm ${
                  saveMessage.type === "success"
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {saveMessage.text}
              </div>
            )}

            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full h-[60vh] px-4 py-3 border border-gray-200 rounded-xl text-sm font-mono bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              placeholder="Write your knowledge document in Markdown..."
              autoFocus
            />
          </div>
        )}
      </div>
    </div>
  );
}
