"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Send, Loader2, MessageCircle, ArrowRight } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const STARTER_PROMPTS = [
  "I don't know what to cook tonight",
  "What can I make with chicken?",
  "I'm craving something spicy",
  "Quick healthy lunch ideas",
];

export function BrainstormChat() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(content: string) {
    const trimmed = content.trim();
    if (!trimmed || isStreaming) return;

    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: trimmed },
    ];
    setMessages(newMessages);
    setInput("");
    setIsStreaming(true);

    // Add placeholder assistant message
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "" },
    ]);

    try {
      const response = await fetch("/api/brainstorm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Failed to connect");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") {
            setIsStreaming(false);
            return;
          }
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last.role === "assistant") {
              updated[updated.length - 1] = {
                ...last,
                content: last.content + data,
              };
            }
            return updated;
          });
        }
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last.role === "assistant" && last.content === "") {
          updated[updated.length - 1] = {
            ...last,
            content: "Sorry, something went wrong. Please try again.",
          };
        }
        return updated;
      });
    } finally {
      setIsStreaming(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  function handleStarterPrompt(prompt: string) {
    sendMessage(prompt);
  }

  function handleUseInGenerator(content: string) {
    router.push(`/generate?prompt=${encodeURIComponent(content)}`);
  }

  return (
    <div className="flex flex-col h-full px-6 lg:px-10 py-8 max-w-3xl mx-auto w-full">
      {/* Header */}
      <div className="mb-6 flex-shrink-0">
        <h1 className="text-2xl font-semibold text-[#2D2D2D]">Brainstorm</h1>
        <p className="text-sm text-[#8A8A8A] mt-1">
          Chat with AI to figure out what you&apos;re craving
        </p>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto min-h-0 mb-4">
        {messages.length === 0 ? (
          /* Welcome / empty state */
          <div className="flex flex-col items-center justify-center h-full gap-6 py-12">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-white border border-[#E8E4DF] shadow-sm">
              <MessageCircle className="w-6 h-6 text-[#7C9082]" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-[#2D2D2D] mb-1">
                Not sure what to eat?
              </p>
              <p className="text-sm text-[#8A8A8A]">
                Tell me what you&apos;re in the mood for and I&apos;ll help you figure it out.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 max-w-md">
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleStarterPrompt(prompt)}
                  className="border border-[#E8E4DF] bg-white rounded-full px-4 py-2 text-sm text-[#5A5A5A] hover:bg-[#F5F3EF] hover:border-[#C4B9A8] transition-colors cursor-pointer"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 py-2">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "user" ? (
                  <div className="max-w-[80%] bg-[#7C9082] text-white rounded-2xl rounded-br-md px-4 py-2.5 text-sm">
                    {message.content}
                  </div>
                ) : (
                  <div className="group max-w-[80%] flex flex-col gap-1.5">
                    <div className="bg-white border border-[#E8E4DF] rounded-2xl rounded-bl-md px-4 py-2.5 text-sm text-[#2D2D2D] shadow-sm">
                      {message.content === "" && isStreaming ? (
                        <Loader2 className="w-4 h-4 animate-spin text-[#8A8A8A]" />
                      ) : (
                        <span className="whitespace-pre-wrap">{message.content}</span>
                      )}
                    </div>
                    {message.content && (
                      <button
                        onClick={() => handleUseInGenerator(message.content)}
                        className="self-start flex items-center gap-1 text-xs text-[#7C9082] hover:text-[#6b7d70] transition-colors opacity-0 group-hover:opacity-100 px-1"
                      >
                        Use this
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="flex-shrink-0">
        <form onSubmit={handleSubmit} className="relative flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything about food..."
              rows={1}
              disabled={isStreaming}
              className="w-full bg-white border border-[#E8E4DF] shadow-sm rounded-2xl px-4 py-3 pr-12 text-sm text-[#2D2D2D] placeholder:text-[#B0AAA0] focus:outline-none focus:ring-2 focus:ring-[#7C9082]/30 focus:border-[#7C9082] transition-colors resize-none disabled:opacity-60"
              style={{ minHeight: "48px", maxHeight: "160px" }}
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = "auto";
                el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
              }}
            />
            <button
              type="submit"
              disabled={isStreaming || !input.trim()}
              className="absolute right-2.5 bottom-2.5 flex items-center justify-center w-8 h-8 bg-[#7C9082] text-white rounded-xl hover:bg-[#6b7d70] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isStreaming ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </form>
        <p className="text-xs text-[#B0AAA0] mt-2 text-center">
          Press Enter to send, Shift+Enter for a new line
        </p>
      </div>
    </div>
  );
}
