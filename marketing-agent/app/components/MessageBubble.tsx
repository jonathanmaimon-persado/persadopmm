"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import type { Message } from "@/lib/types";

interface MessageBubbleProps {
  message: Message;
}

function formatSourceName(path: string): string {
  return (
    path
      .split("/")
      .pop()
      ?.replace(/\.md$/, "")
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ") || path
  );
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const time = new Date(message.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const hasSources = !isUser && message.sources && message.sources.length > 0;
  const isThinking = !isUser && !message.content && message.status;

  return (
    <div
      className={`flex items-start gap-3 px-4 py-2 animate-fade-in group ${
        isUser ? "flex-row-reverse" : ""
      }`}
    >
      {/* Avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 text-sm">
          ✦
        </div>
      )}

      {/* Bubble */}
      <div className={`max-w-[75%] relative ${isUser ? "items-end" : ""}`}>
        {/* Status indicator (shown while consulting knowledge) */}
        {isThinking && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-2xl rounded-tl-sm bg-white shadow-sm">
            <svg
              className="animate-spin text-indigo-500"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M4 4v5h5" />
              <path d="M20.49 9A9 9 0 005.64 5.64L4 4" />
            </svg>
            <span className="text-sm text-indigo-600 font-medium">
              {message.status}
            </span>
          </div>
        )}

        {/* Message content */}
        {(!isThinking || message.content) && (
          <div
            className={`rounded-2xl px-4 py-3 ${
              isUser
                ? "bg-indigo-600 text-white rounded-tr-sm"
                : "bg-white text-gray-800 rounded-tl-sm shadow-sm"
            }`}
          >
            {isUser ? (
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            ) : (
              <div className="text-sm prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:my-2 prose-pre:bg-gray-100 prose-pre:text-gray-800 prose-code:text-indigo-600 prose-code:before:content-none prose-code:after:content-none">
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>
            )}
          </div>
        )}

        {/* Source citations */}
        {hasSources && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {message.sources!.map((source) => (
              <span
                key={source}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-[11px] text-indigo-600 border border-indigo-100"
              >
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="shrink-0"
                >
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
                  <polyline points="14,2 14,8 20,8" />
                </svg>
                {formatSourceName(source)}
              </span>
            ))}
          </div>
        )}

        {/* Timestamp + copy */}
        <div
          className={`flex items-center gap-2 mt-1 ${
            isUser ? "justify-end" : "justify-start"
          }`}
        >
          <span className="text-[10px] text-gray-400">{time}</span>
          {!isUser && message.content && (
            <button
              onClick={handleCopy}
              className="text-[10px] text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              aria-label="Copy message"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
