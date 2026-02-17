"use client";

import type { Conversation } from "@/lib/types";
import type { AppView } from "@/lib/types";

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  open: boolean;
  onClose: () => void;
  appView: AppView;
  onViewChange: (view: AppView) => void;
}

export default function Sidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  open,
  onClose,
  appView,
  onViewChange,
}: SidebarProps) {
  const formatDate = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return "Today";
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed lg:relative z-40 top-0 left-0 h-full w-72 bg-gray-50 border-r border-gray-200 flex flex-col transition-transform duration-200 ease-in-out ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <span className="font-semibold text-sm text-gray-700">
            Persado PMM
          </span>
          <button
            onClick={onClose}
            className="lg:hidden text-gray-400 hover:text-gray-600 cursor-pointer"
            aria-label="Close sidebar"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* View toggle */}
        <div className="p-3">
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            <button
              onClick={() => onViewChange("chat")}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
                appView === "chat"
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
              Chat
            </button>
            <button
              onClick={() => onViewChange("knowledge")}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
                appView === "knowledge"
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
              </svg>
              Knowledge
            </button>
          </div>
        </div>

        {/* Chat-specific controls */}
        {appView === "chat" && (
          <>
            {/* New chat button */}
            <div className="px-3 pb-3">
              <button
                onClick={() => {
                  onNew();
                  onClose();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-white hover:shadow-sm transition-all cursor-pointer"
                aria-label="New chat"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                New Chat
              </button>
            </div>

            {/* Conversation list */}
            <nav
              className="flex-1 overflow-y-auto px-3 pb-3"
              aria-label="Conversations"
            >
              {conversations.length === 0 && (
                <p className="text-xs text-gray-400 text-center mt-8">
                  No conversations yet
                </p>
              )}
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => {
                    onSelect(conv.id);
                    onClose();
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg mb-1 transition-colors text-sm cursor-pointer ${
                    conv.id === activeId
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <div className="truncate font-medium">{conv.title}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    {formatDate(conv.createdAt)}
                  </div>
                </button>
              ))}
            </nav>
          </>
        )}

        {/* Knowledge-specific info */}
        {appView === "knowledge" && (
          <div className="flex-1 overflow-y-auto px-3 pb-3">
            <div className="mt-2 p-3 rounded-lg bg-indigo-50/50 border border-indigo-100">
              <h4 className="text-xs font-semibold text-indigo-800 mb-1">
                Source of Truth
              </h4>
              <p className="text-xs text-indigo-600 leading-relaxed">
                The Knowledge Library contains Persado&apos;s positioning, brand guidelines, audience profiles, and approved assets. All deliverables are built from this foundation.
              </p>
            </div>
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-gray-500">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                  <path d="M3 3h18v18H3z" />
                  <path d="M3 9h18M9 3v18" />
                </svg>
                Positioning &amp; Messaging
              </div>
              <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-gray-500">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
                Brand Voice &amp; Standards
              </div>
              <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-gray-500">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                  <circle cx="9" cy="7" r="4" />
                  <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
                </svg>
                Audiences &amp; ICPs
              </div>
              <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-gray-500">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
                  <polyline points="14,2 14,8 20,8" />
                </svg>
                Approved Assets
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
