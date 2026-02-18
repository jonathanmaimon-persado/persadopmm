export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  sources?: string[];
  status?: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export interface KnowledgeFile {
  name: string;
  path: string;
  category: string;
  subcategory?: string;
}

export interface KnowledgeCategory {
  id: string;
  label: string;
  description: string;
  files: KnowledgeFile[];
  subcategories?: { id: string; label: string; files: KnowledgeFile[] }[];
}

export type AppView = "chat" | "knowledge";
