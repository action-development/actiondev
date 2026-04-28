import { OpenAIIcon, ClaudeIcon, GeminiIcon } from "@/components/icons/ai-icons";

export const AI_PROMPT = encodeURIComponent(
  "I want to understand what Action.dev is and what they do. They are a digital agency specializing in design and development, immersive web experiences with Three.js and React, brand identity, and growth services like SEO and CRO. Summarise their capabilities, notable work, and what makes them different: https://actiondev.es/"
);

export const AI_ASSISTANTS = [
  { name: "ChatGPT", url: `https://chatgpt.com/?q=${AI_PROMPT}`, icon: OpenAIIcon },
  { name: "Claude",  url: `https://claude.ai/new?q=${AI_PROMPT}`, icon: ClaudeIcon },
  { name: "Gemini",  url: `https://www.google.com/search?q=${AI_PROMPT}&udm=50`, icon: GeminiIcon },
] as const;
