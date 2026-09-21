import { OpenAIIcon, ClaudeIcon, GeminiIcon } from "@/components/icons/ai-icons";

/** Enlaces a los asistentes con el prompt ya escrito (en el idioma activo de la web). */
export function buildAiAssistants(prompt: string) {
  const q = encodeURIComponent(prompt);
  return [
    { name: "ChatGPT", url: `https://chatgpt.com/?q=${q}`, icon: OpenAIIcon },
    { name: "Claude", url: `https://claude.ai/new?q=${q}`, icon: ClaudeIcon },
    { name: "Gemini", url: `https://www.google.com/search?q=${q}&udm=50`, icon: GeminiIcon },
  ] as const;
}
