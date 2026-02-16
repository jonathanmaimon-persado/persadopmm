"use client";

interface WelcomeStateProps {
  onSuggestionClick: (text: string) => void;
}

const suggestions = [
  {
    label: "Draft a social media campaign",
    icon: "📱",
  },
  {
    label: "Write email copy for a product launch",
    icon: "✉️",
  },
  {
    label: "Analyze my campaign performance",
    icon: "📊",
  },
  {
    label: "Create a content calendar",
    icon: "📅",
  },
];

export default function WelcomeState({ onSuggestionClick }: WelcomeStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-4 animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center text-2xl mb-6">
        ✦
      </div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">
        Hi! I&apos;m your Marketing Agent.
      </h1>
      <p className="text-gray-500 text-center max-w-md mb-8">
        I can help you create campaigns, write copy, analyze performance, and
        strategize your marketing efforts.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
        {suggestions.map((s) => (
          <button
            key={s.label}
            onClick={() => onSuggestionClick(s.label)}
            className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-sm transition-all text-left text-sm text-gray-700 cursor-pointer"
          >
            <span className="text-lg">{s.icon}</span>
            <span>{s.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
