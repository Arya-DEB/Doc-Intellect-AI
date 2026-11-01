import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import {
  ArrowLeft,
  Bot,
  FileText,
  Loader2,
  MessageSquare,
  Send,
  User,
} from "lucide-react";
import { askQuestion } from "../services/chatService";

export default function Chat() {
  const { documentId } = useParams();
  const navigate = useNavigate();

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  async function handleSend(e) {
    e.preventDefault();

    const question = input.trim();
    if (!question || sending) return;

    setInput("");
    setError("");
    setSending(true);

    setMessages((prev) => [...prev, { role: "user", content: question }]);

    try {
      const result = await askQuestion({
        question,
        conversationId,
      });

      setConversationId(result.conversation_id);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: result.answer,
          sources: result.sources ?? [],
        },
      ]);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to get an answer. Please try again.",
      );
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  return (
    <main className="flex min-h-0 flex-1 flex-col bg-slate-50">
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 sm:h-20 sm:px-8">
        <button
          onClick={() => navigate("/documents")}
          aria-label="Back to documents"
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100">
          <FileText className="text-violet-600" size={20} />
        </div>

        <div className="min-w-0">
          <h1 className="truncate font-semibold text-slate-900">
            Chat with your documents
          </h1>
          <p className="text-xs text-slate-500">
            Ask questions and get answers with sources
          </p>
        </div>
      </header>

      {/* Messages */}
      <section className="flex-1 overflow-y-auto px-4 py-6 sm:px-8">
        <div className="mx-auto flex max-w-4xl flex-col gap-5">
          {messages.length === 0 && (
            <div className="mx-auto mt-12 max-w-lg text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100">
                <MessageSquare className="text-violet-600" size={26} />
              </div>
              <h2 className="text-xl font-semibold text-slate-900">
                What would you like to know?
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Ask a question about your uploaded PDFs. Answers are generated
                from the documents available to your account.
              </p>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex items-start gap-3 ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {message.role === "assistant" && (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100">
                  <Bot size={18} className="text-violet-600" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 sm:max-w-[75%] ${
                  message.role === "user"
                    ? "bg-violet-600 text-white"
                    : "border border-slate-200 bg-white text-slate-800 shadow-sm"
                }`}
              >
                <div className="chat-markdown">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {message.content}
                  </ReactMarkdown>
                </div>

                {message.sources?.length > 0 && (
                  <div className="mt-4 border-t border-slate-200 pt-3">
                    <p className="mb-2 text-xs font-semibold text-slate-500">
                      Sources
                    </p>

                    <div className="space-y-2">
                      {message.sources.map((source, sourceIndex) => (
                        <div
                          key={source.chunk_id ?? sourceIndex}
                          className="rounded-lg bg-slate-50 p-3"
                        >
                          <p className="text-xs font-medium text-slate-600">
                            Document #{source.document_id}
                            {source.page_number != null &&
                              ` · Page ${source.page_number}`}
                          </p>
                          <p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-slate-500">
                            {source.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {message.role === "user" && (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-200">
                  <User size={18} className="text-slate-600" />
                </div>
              )}
            </div>
          ))}

          {sending && (
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100">
                <Bot size={18} className="text-violet-600" />
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                <Loader2 size={16} className="animate-spin" />
                Thinking...
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </section>

      {/* Composer */}
      <form
        onSubmit={handleSend}
        className="shrink-0 border-t border-slate-200 bg-white p-4 sm:px-8"
      >
        <div className="mx-auto max-w-4xl">
          <div className="flex items-end gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-2 focus-within:border-violet-300 focus-within:ring-2 focus-within:ring-violet-100">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
              rows={1}
              maxLength={5000}
              placeholder="Ask something about your documents..."
              className="max-h-32 min-h-10 flex-1 resize-y bg-transparent px-3 py-2 text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />

            <button
              type="submit"
              disabled={!input.trim() || sending}
              aria-label="Send message"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sending ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Send size={18} />
              )}
            </button>
          </div>

          <p className="mt-2 text-center text-xs text-slate-400">
            AI responses may be inaccurate. Check the cited source excerpts.
          </p>
        </div>
      </form>
    </main>
  );
}
