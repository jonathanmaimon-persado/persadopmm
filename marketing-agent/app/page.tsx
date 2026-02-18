"use client";

import { useState, useCallback, useEffect } from "react";
import type { Message, Conversation, AppView } from "@/lib/types";
import ChatWindow from "./components/ChatWindow";
import InputBar from "./components/InputBar";
import Sidebar from "./components/Sidebar";
import WelcomeState from "./components/WelcomeState";
import KnowledgeLibrary from "./components/KnowledgeLibrary";

function generateId() {
  return Math.random().toString(36).substring(2, 15);
}

function createConversation(firstMessage?: string): Conversation {
  return {
    id: generateId(),
    title: firstMessage
      ? firstMessage.slice(0, 40) + (firstMessage.length > 40 ? "..." : "")
      : "New Chat",
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export default function Home() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [pendingSuggestion, setPendingSuggestion] = useState("");
  const [appView, setAppView] = useState<AppView>("chat");

  // Track online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    setIsOnline(navigator.onLine);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Load conversations from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("marketing-agent-conversations");
      if (saved) {
        const parsed = JSON.parse(saved) as Conversation[];
        setConversations(parsed);
        if (parsed.length > 0) {
          setActiveId(parsed[0].id);
        }
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  // Save conversations to localStorage
  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem(
        "marketing-agent-conversations",
        JSON.stringify(conversations)
      );
    }
  }, [conversations]);

  const activeConversation = conversations.find((c) => c.id === activeId);
  const messages = activeConversation?.messages ?? [];

  const updateConversation = useCallback(
    (id: string, updater: (conv: Conversation) => Conversation) => {
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? updater(c) : c))
      );
    },
    []
  );

  const sendMessage = useCallback(
    async (text: string) => {
      setError(null);

      let convId = activeId;
      const userMsg: Message = {
        id: generateId(),
        role: "user",
        content: text,
        timestamp: Date.now(),
      };

      if (!convId) {
        const conv = createConversation(text);
        conv.messages = [userMsg];
        setConversations((prev) => [conv, ...prev]);
        setActiveId(conv.id);
        convId = conv.id;
      } else {
        updateConversation(convId, (conv) => {
          const title =
            conv.messages.length === 0
              ? text.slice(0, 40) + (text.length > 40 ? "..." : "")
              : conv.title;
          return {
            ...conv,
            title,
            messages: [...conv.messages, userMsg],
            updatedAt: Date.now(),
          };
        });
      }

      setIsLoading(true);

      // Build message history for API
      const currentConv = conversations.find((c) => c.id === convId);
      const history = [
        ...(currentConv?.messages ?? []).map((m) => ({
          role: m.role,
          content: m.content,
        })),
        { role: userMsg.role, content: userMsg.content },
      ];

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000);

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(
            data.error || `Request failed with status ${res.status}`
          );
        }

        // Handle streaming response
        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response stream");

        const assistantMsg: Message = {
          id: generateId(),
          role: "assistant",
          content: "",
          timestamp: Date.now(),
        };

        // Add empty assistant message
        const capturedConvId = convId;
        updateConversation(capturedConvId, (conv) => ({
          ...conv,
          messages: [...conv.messages, assistantMsg],
          updatedAt: Date.now(),
        }));

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") continue;

              try {
                const parsed = JSON.parse(data);
                if (parsed.text) {
                  assistantMsg.content += parsed.text;
                  // Update the message in the conversation
                  updateConversation(capturedConvId, (conv) => ({
                    ...conv,
                    messages: conv.messages.map((m) =>
                      m.id === assistantMsg.id
                        ? { ...m, content: assistantMsg.content }
                        : m
                    ),
                    updatedAt: Date.now(),
                  }));
                }
              } catch {
                // Skip unparseable chunks
              }
            }
          }
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          setError("Request timed out. Please try again.");
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Something went wrong. Please try again.");
        }
      } finally {
        setIsLoading(false);
      }
    },
    [activeId, conversations, updateConversation]
  );

  const handleRetry = () => {
    if (messages.length === 0) return;
    const lastUserMsg = [...messages]
      .reverse()
      .find((m) => m.role === "user");
    if (lastUserMsg) {
      // Remove the last assistant error message if present
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.role === "assistant" && activeId) {
        updateConversation(activeId, (conv) => ({
          ...conv,
          messages: conv.messages.slice(0, -1),
        }));
      }
      sendMessage(lastUserMsg.content);
    }
  };

  const handleNewChat = () => {
    setActiveId(null);
    setError(null);
  };

  const handleSuggestionClick = (text: string) => {
    setPendingSuggestion(text);
    // Send immediately
    sendMessage(text);
    setPendingSuggestion("");
  };

  const showWelcome = !activeId && conversations.every((c) => c.id !== activeId);

  const headerLabel = appView === "chat" ? "Marketing Agent" : "Knowledge Library";

  return (
    <div className="flex h-dvh overflow-hidden bg-[#f9fafb]">
      {/* Sidebar */}
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={(id) => {
          setActiveId(id);
          setError(null);
          setAppView("chat");
        }}
        onNew={handleNewChat}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        appView={appView}
        onViewChange={setAppView}
      />

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <header className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-500 hover:text-gray-700 cursor-pointer"
            aria-label="Open sidebar"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-sm font-bold">
            {appView === "chat" ? "M" : "K"}
          </div>
          <h1 className="font-semibold text-gray-900 text-sm">
            {headerLabel}
          </h1>
        </header>

        {/* Offline banner */}
        {!isOnline && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-700 text-center">
            You&apos;re offline. Messages will be sent when you reconnect.
          </div>
        )}

        {/* CHAT VIEW */}
        {appView === "chat" && (
          <>
            {/* Chat area */}
            {showWelcome && messages.length === 0 ? (
              <div className="flex-1 overflow-y-auto">
                <WelcomeState onSuggestionClick={handleSuggestionClick} />
              </div>
            ) : (
              <ChatWindow messages={messages} isLoading={isLoading} />
            )}

            {/* Error state */}
            {error && (
              <div className="px-4 pb-2">
                <div className="max-w-3xl mx-auto bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center justify-between">
                  <span className="text-sm text-red-700">{error}</span>
                  <button
                    onClick={handleRetry}
                    className="text-sm font-medium text-red-700 hover:text-red-900 underline cursor-pointer"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}

            {/* Input bar */}
            <InputBar
              onSend={sendMessage}
              disabled={isLoading || !isOnline}
              initialValue={pendingSuggestion}
            />
          </>
        )}

        {/* KNOWLEDGE VIEW */}
        {appView === "knowledge" && <KnowledgeLibrary />}
      </div>
    </div>
  );
}
