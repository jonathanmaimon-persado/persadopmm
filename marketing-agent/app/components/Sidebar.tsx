"use client";

import type { Conversation } from "@/lib/types";

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  open,
  onClose,
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
            Conversations
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

        {/* New chat button */}
        <div className="p-3">
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
      </aside>
    </>
  );
}
