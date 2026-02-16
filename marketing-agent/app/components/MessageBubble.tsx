"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import type { Message } from "@/lib/types";

interface MessageBubbleProps {
  message: Message;
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

        {/* Timestamp + copy */}
        <div
          className={`flex items-center gap-2 mt-1 ${
            isUser ? "justify-end" : "justify-start"
          }`}
        >
          <span className="text-[10px] text-gray-400">{time}</span>
          {!isUser && (
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
