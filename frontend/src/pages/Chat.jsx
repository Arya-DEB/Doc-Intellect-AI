import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  FileText,
  History,
  Loader2,
  Menu,
  MessageSquare,
  Plus,
  Search,
  Send,
  Sparkles,
  Trash2,
  User,
  X,
} from "lucide-react";

import { LogoMark } from "../components/logo";
import  useTheme  from "../context/useTheme";
import { getDocuments } from "../services/documentService";
import {
  askQuestion,
  getConversations,
  getConversation,
  deleteConversation,
} from "../services/chatService";

const SUGGESTIONS = [
  "Summarize this document",
  "What are the key points?",
  "Explain the important topics",
];

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function timeAgo(iso) {
  if (!iso) return "";
  const date = new Date(/Z|[+-]\d\d:?\d\d$/.test(iso) ? iso : `${iso}Z`);
  const seconds = Math.max(1, Math.floor((Date.now() - date) / 1000));

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

function cleanCitations(text) {
  return (text ?? "").replace(/【\s*(.*?)\s*】/g, "[$1]");
}

function summarizeSources(sources, nameById) {
  const byDoc = new Map();

  for (const source of sources) {
    const entry = byDoc.get(source.document_id) ?? { pages: new Set() };

    if (source.page_number != null) {
      entry.pages.add(source.page_number);
    }

    byDoc.set(source.document_id, entry);
  }

  return [...byDoc.entries()].map(([id, entry]) => ({
    name: nameById[id] ?? `Document #${id}`,
    pages: [...entry.pages].sort((a, b) => a - b),
  }));
}

function BotAvatar({ thinking = false }) {
  return (
    <div
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#1a1a45] ring-1 ring-violet-400/40 ${
        thinking ? "animate-pulse" : ""
      }`}
    >
      <LogoMark size={26} />
    </div>
  );
}

function Sources({ sources, nameById, isDark }) {
  const summary = summarizeSources(sources, nameById);

  return (
    <div
      className={`mt-4 border-t pt-3 ${
        isDark ? "border-slate-700" : "border-slate-100"
      }`}
    >
      <div className="flex items-start gap-2.5">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
            isDark ? "bg-violet-900/40" : "bg-violet-50"
          }`}
        >
          <FileText size={16} className="text-violet-500" />
        </div>

        <div className="min-w-0 text-xs">
          <p className="font-semibold text-slate-400">Sources</p>

          {summary.map((source) => (
            <p
              key={source.name}
              className={`truncate ${
                isDark ? "text-slate-300" : "text-slate-700"
              }`}
            >
              {source.name}
              {source.pages.length > 0 &&
                ` (Page ${source.pages.join(", ")})`}
            </p>
          ))}
        </div>
      </div>

      <details className="group mt-2">
        <summary className="cursor-pointer text-xs font-medium text-violet-500 hover:text-violet-400">
          View excerpts
        </summary>

        <div className="mt-2 space-y-2">
          {sources.map((source, index) => (
            <div
              key={source.chunk_id ?? index}
              className={`rounded-lg p-3 ${
                isDark ? "bg-slate-800" : "bg-slate-50"
              }`}
            >
              <p className="text-[11px] font-medium text-slate-400">
                {nameById[source.document_id] ??
                  `Document #${source.document_id}`}
                {source.page_number != null &&
                  ` · Page ${source.page_number}`}
              </p>

              <p
                className={`mt-1 whitespace-pre-wrap text-xs leading-5 ${
                  isDark ? "text-slate-300" : "text-slate-500"
                }`}
              >
                {source.content}
              </p>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}

export default function Chat({ onMenuClick }) {
  const { isDark } = useTheme();
  const { documentId } = useParams();
  const navigate = useNavigate();

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const [documents, setDocuments] = useState([]);
  const [docsLoading, setDocsLoading] = useState(true);
  const [docQuery, setDocQuery] = useState("");

  const [conversations, setConversations] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");
  const [deletingConversationId, setDeletingConversationId] = useState(null);
  const [openingConversationId, setOpeningConversationId] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const nameById = useMemo(
    () => Object.fromEntries(documents.map((doc) => [doc.id, doc.filename])),
    [documents],
  );

  const currentDoc = documents.find(
    (doc) => String(doc.id) === String(documentId),
  );

  const visibleDocs = documents.filter((doc) =>
    doc.filename.toLowerCase().includes(docQuery.toLowerCase()),
  );

  const loadConversations = useCallback(async () => {
    try {
      setConversations(await getConversations());
      setHistoryError("");
    } catch (err) {
      setHistoryError(
        err.response?.data?.detail || "Unable to load chat history.",
      );
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const loadDocuments = useCallback(async () => {
    try {
      setDocuments(await getDocuments());
    } catch {
      // Chat can still work if the document list fails to load.
    } finally {
      setDocsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadConversations();
      loadDocuments();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadConversations, loadDocuments]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  useEffect(() => {
    if (!panelOpen) return;

    const onKey = (event) => {
      if (event.key === "Escape") setPanelOpen(false);
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [panelOpen]);

  function resetTextarea() {
    if (inputRef.current) inputRef.current.style.height = "auto";
  }

  async function sendQuestion(raw) {
    const question = raw.trim();
    if (!question || sending) return;

    setError("");
    setSending(true);
    setMessages((prev) => [...prev, { role: "user", content: question }]);

    try {
      const result = await askQuestion({
        question,
        conversationId,
        documentId: documentId ? Number(documentId) : null,
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

      setInput("");
      resetTextarea();
      await loadConversations();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to get an answer. Your question is still in the input—please try again.",
      );
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  function handleSend(event) {
    event.preventDefault();
    sendQuestion(input);
  }

  async function handleSelectConversation(id) {
    if (sending || openingConversationId !== null) return;

    setOpeningConversationId(id);
    setError("");
    setPanelOpen(false);

    try {
      const conversation = await getConversation(id);

      setConversationId(conversation.id);
      setMessages(
        (conversation.messages ?? []).map((message) => ({
          role: message.role,
          content: message.content,
          sources: [],
        })),
      );

      setInput("");
      resetTextarea();
    } catch (err) {
      setError(
        err.response?.data?.detail || "Unable to load this conversation.",
      );
    } finally {
      setOpeningConversationId(null);
    }
  }

  async function handleDeleteConversation(conversation) {
    if (sending || deletingConversationId !== null) return;

    const confirmed = window.confirm(
      `Delete this conversation?\n\n"${conversation.title || "Untitled conversation"}"\n\nThis cannot be undone.`,
    );

    if (!confirmed) return;

    setDeletingConversationId(conversation.id);
    setHistoryError("");

    try {
      await deleteConversation(conversation.id);

      setConversations((prev) =>
        prev.filter((item) => String(item.id) !== String(conversation.id)),
      );

      if (String(conversation.id) === String(conversationId)) {
        setConversationId(null);
        setMessages([]);
        setInput("");
        setError("");
        resetTextarea();
      }
    } catch (err) {
      setHistoryError(
        err.response?.data?.detail ||
          "Unable to delete this conversation. Please try again.",
      );
    } finally {
      setDeletingConversationId(null);
    }
  }

  function handleNewChat() {
    if (sending || openingConversationId !== null) return;

    setConversationId(null);
    setMessages([]);
    setInput("");
    setError("");
    setPanelOpen(false);
    resetTextarea();
  }

  function handleSelectDocument(id) {
    handleNewChat();
    navigate(`/chat/${id}`);
  }

  const surface = isDark ? "bg-slate-900" : "bg-white";
  const pageBg = isDark ? "bg-slate-950" : "bg-slate-50";
  const borderColor = isDark ? "border-slate-700" : "border-slate-200";
  const headingText = isDark ? "text-slate-100" : "text-slate-900";
  const bodyText = isDark ? "text-slate-300" : "text-slate-700";
  const mutedText = isDark ? "text-slate-400" : "text-slate-500";
  const hoverBg = isDark ? "hover:bg-slate-800" : "hover:bg-slate-100";
  const inputBg = isDark ? "bg-slate-800" : "bg-slate-50";

  const markdownClasses =
    `text-sm leading-6 break-words ${
      isDark ? "text-slate-100" : "text-slate-800"
    } ` +
    "[&_p]:my-2 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 " +
    "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 " +
    "[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1 " +
    "[&_strong]:font-semibold [&_a]:text-violet-500 [&_a]:underline " +
    `[&_code]:rounded [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.85em] ${
      isDark ? "[&_code]:bg-slate-800" : "[&_code]:bg-slate-100"
    } ` +
    "[&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-slate-900 [&_pre]:p-3 " +
    "[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-slate-100 " +
    "[&_table]:my-2 [&_table]:block [&_table]:overflow-x-auto " +
    `[&_th]:border [&_th]:px-2 [&_th]:py-1 ${
      isDark ? "[&_th]:border-slate-700" : "[&_th]:border-slate-200"
    } ` +
    `[&_td]:border [&_td]:px-2 [&_td]:py-1 ${
      isDark ? "[&_td]:border-slate-700" : "[&_td]:border-slate-200"
    }`;

  return (
    <main className={`relative flex min-h-0 w-full min-w-0 max-w-full flex-1 overflow-hidden ${pageBg}`}>
      {/* Mobile drawer overlay */}
      <div
        onClick={() => setPanelOpen(false)}
        className={`fixed inset-0 z-30 bg-slate-900/50 backdrop-blur-sm transition-opacity lg:hidden ${
          panelOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Documents and conversations sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[85%] max-w-xs flex-col border-r ${borderColor} ${surface} shadow-2xl transition-transform duration-300 lg:static lg:w-72 lg:max-w-none lg:translate-x-0 lg:shadow-none ${
          panelOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Documents */}
        <div className={`flex max-h-[50%] shrink-0 flex-col border-b ${borderColor} p-4`}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className={`text-sm font-bold ${headingText}`}>Your Documents</h2>
            <button
              onClick={() => setPanelOpen(false)}
              aria-label="Close panel"
              className={`rounded-lg p-1.5 ${mutedText} ${hoverBg} lg:hidden`}
            >
              <X size={18} />
            </button>
          </div>

          <div className="relative mb-3">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={docQuery}
              onChange={(event) => setDocQuery(event.target.value)}
              placeholder="Search documents..."
              className={`w-full rounded-xl border ${borderColor} ${inputBg} py-2 pl-9 pr-3 text-xs ${bodyText} outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20`}
            />
          </div>

          <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
            {docsLoading && (
              <p className={`p-2 text-xs ${mutedText}`}>Loading documents...</p>
            )}

            {!docsLoading && visibleDocs.length === 0 && (
              <p className={`p-2 text-xs ${mutedText}`}>
                {docQuery ? "No matches." : "No documents yet."}
              </p>
            )}

            {visibleDocs.map((doc) => {
              const active = String(doc.id) === String(documentId);

              return (
                <button
                  key={doc.id}
                  onClick={() => handleSelectDocument(doc.id)}
                  className={`flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition ${
                    active
                      ? isDark
                        ? "bg-violet-900/40"
                        : "bg-violet-100"
                      : hoverBg
                  }`}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50">
                    <FileText size={18} className="text-red-500" />
                  </div>

                  <div className="min-w-0">
                    <p
                      className={`truncate text-xs font-semibold ${
                        active
                          ? "text-violet-500"
                          : isDark
                            ? "text-slate-200"
                            : "text-slate-800"
                      }`}
                    >
                      {doc.filename}
                    </p>
                    <p className={`text-[11px] ${mutedText}`}>
                      {formatSize(doc.file_size)}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Conversations */}
        <div className="flex min-h-0 flex-1 flex-col p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className={`text-sm font-bold ${headingText}`}>Conversations</h2>
            <button
              onClick={handleNewChat}
              disabled={sending || openingConversationId !== null}
              className="flex items-center gap-1 rounded-lg bg-violet-600 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus size={14} /> New Chat
            </button>
          </div>

          <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
            {historyLoading && (
              <p className={`p-2 text-xs ${mutedText}`}>Loading history...</p>
            )}

            {historyError && (
              <p className="p-2 text-xs text-red-500">{historyError}</p>
            )}

            {!historyLoading && !historyError && conversations.length === 0 && (
              <p className={`p-2 text-xs ${mutedText}`}>No conversations yet.</p>
            )}

            {conversations.map((conversation) => {
              const isOpening =
                String(openingConversationId) === String(conversation.id);
              const active =
                String(conversation.id) === String(conversationId);
              const isDeleting =
                String(deletingConversationId) === String(conversation.id);

              return (
                <div
                  key={conversation.id}
                  className={`flex min-w-0 items-center gap-1 rounded-xl transition ${
                    active
                      ? isDark
                        ? "bg-violet-900/40"
                        : "bg-violet-100"
                      : hoverBg
                  }`}
                >
                  <button
                    onClick={() => handleSelectConversation(conversation.id)}
                    disabled={
                      sending ||
                      openingConversationId !== null ||
                      deletingConversationId !== null
                    }
                    className="flex min-w-0 flex-1 items-center gap-3 rounded-xl p-2.5 text-left disabled:opacity-50"
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        isDark ? "bg-violet-900/40" : "bg-violet-50"
                      }`}
                    >
                      {isOpening ? (
                        <Loader2
                          size={15}
                          className="animate-spin text-violet-500"
                        />
                      ) : (
                        <MessageSquare size={15} className="text-violet-500" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate text-xs font-medium ${
                          active
                            ? "text-violet-500"
                            : isDark
                              ? "text-slate-200"
                              : "text-slate-700"
                        }`}
                        title={conversation.title}
                      >
                        {conversation.title || "Untitled conversation"}
                      </p>
                      <p className={`text-[11px] ${mutedText}`}>
                        {isOpening
                          ? "Opening..."
                          : timeAgo(conversation.updated_at)}
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => handleDeleteConversation(conversation)}
                    disabled={
                      sending ||
                      openingConversationId !== null ||
                      deletingConversationId !== null
                    }
                    title="Delete conversation"
                    aria-label={`Delete conversation ${conversation.title || ""}`}
                    className={`mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-100 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40`}
                  >
                    {isDeleting ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </aside>

      {/* Chat panel */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className={`flex h-16 shrink-0 min-w-0 items-center gap-1.5 border-b ${borderColor} ${surface} px-2 sm:h-20 sm:gap-3 sm:px-6`}>
          {onMenuClick && (
            <button
              onClick={onMenuClick}
              aria-label="Open menu"
              className={`rounded-lg p-2 ${mutedText} ${hoverBg} lg:hidden`}
            >
              <Menu size={22} />
            </button>
          )}

          <button
            onClick={() => setPanelOpen(true)}
            aria-label="Documents and conversations"
            className={`rounded-lg p-2 ${mutedText} ${hoverBg} lg:hidden`}
          >
            <History size={22} />
          </button>

          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50 sm:h-10 sm:w-10 sm:rounded-xl">
            <FileText size={18} className="text-red-500 sm:size-5" />
          </div>

          <div className="min-w-0 flex-1">
            <h1 className={`truncate text-sm font-semibold ${headingText} sm:text-base`}>
              {currentDoc?.filename ??
                (documentId ? "Document" : "All your documents")}
            </h1>

            <p className={`flex items-center gap-1.5 text-xs ${mutedText}`}>
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="truncate">
                {documentId
                  ? "Ready to chat about this document"
                  : "Searching across all your documents"}
              </span>
            </p>
          </div>

          <button
            onClick={handleNewChat}
            className={`flex shrink-0 items-center gap-1 rounded-lg border ${borderColor} p-2 text-xs font-medium ${mutedText} ${hoverBg} sm:px-3 sm:py-2`}
          >
            <Trash2 size={14} />
            <span className="hidden sm:inline">Clear</span>
          </button>
        </header>

        {/* Messages */}
        <section className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-2 py-4 sm:px-6 sm:py-6">
          <div className="mx-auto flex w-full min-w-0 max-w-3xl flex-col gap-4 sm:gap-5">
            {messages.length === 0 && (
              <div className="mx-auto mt-8 max-w-md text-center sm:mt-14">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1a1a45] ring-1 ring-violet-400/40">
                  <LogoMark size={46} />
                </div>

                <h2 className={`text-lg font-semibold ${headingText} sm:text-xl`}>
                  What would you like to know?
                </h2>

                <p className={`mt-2 text-sm ${mutedText}`}>
                  Ask a question about{" "}
                  {currentDoc ? "this document" : "your uploaded PDFs"}. Answers
                  come with the sources they were found in.
                </p>

                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  {SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => sendQuestion(suggestion)}
                      disabled={sending}
                      className={`flex items-center gap-1.5 rounded-full border ${
                        isDark
                          ? "border-violet-800 bg-slate-900 text-violet-300 hover:bg-slate-800"
                          : "border-violet-200 bg-white text-violet-700 hover:bg-violet-50"
                      } px-3.5 py-2 text-xs font-medium transition disabled:opacity-50`}
                    >
                      <Sparkles size={13} /> {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message, index) => {
              const isUser = message.role === "user";

              return (
                <div
                  key={index}
                  className={`flex items-start gap-3 ${
                    isUser ? "justify-end" : "justify-start"
                  }`}
                >
                  {!isUser && <BotAvatar />}

                  <div
                    className={`min-w-0 max-w-[calc(100%-2.5rem)] overflow-hidden rounded-2xl px-3 py-3 sm:max-w-[78%] sm:px-4 ${
                      isUser
                        ? isDark
                          ? "rounded-tr-md bg-violet-900/50 text-slate-100"
                          : "rounded-tr-md bg-violet-100 text-slate-800"
                        : isDark
                          ? "rounded-tl-md border border-slate-700 bg-slate-900 text-slate-100 shadow-sm"
                          : "rounded-tl-md border border-slate-200 bg-white text-slate-800 shadow-sm"
                    }`}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap wrap-break-word text-sm leading-6">
                        {message.content}
                      </p>
                    ) : (
                      <div className={`${markdownClasses} min-w-0`}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {cleanCitations(message.content)}
                        </ReactMarkdown>
                      </div>
                    )}

                    {message.sources?.length > 0 && (
                      <Sources
                        sources={message.sources}
                        nameById={nameById}
                        isDark={isDark}
                      />
                    )}
                  </div>

                  {isUser && (
                    <div
                      className={`hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                        isDark ? "bg-slate-700" : "bg-slate-200"
                      } sm:flex`}
                    >
                      <User
                        size={18}
                        className={isDark ? "text-slate-300" : "text-slate-600"}
                      />
                    </div>
                  )}
                </div>
              );
            })}

            {sending && (
              <div className="flex items-center gap-3">
                <BotAvatar thinking />
                <div
                  className={`flex items-center gap-2 rounded-2xl rounded-tl-md border ${borderColor} ${surface} px-4 py-3 text-sm ${mutedText}`}
                >
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
          className={`shrink-0 min-w-0 border-t ${borderColor} ${surface} p-2.5 sm:px-6 sm:py-4`}
        >
          <div className="mx-auto w-full min-w-0 max-w-3xl">
            <div
              className={`flex min-w-0 items-end gap-1.5 rounded-2xl border ${borderColor} ${
                isDark ? "bg-slate-800" : "bg-slate-50"
              } p-1.5 focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-500/20 sm:gap-2 sm:p-2`}
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(event) => {
                  setInput(event.target.value);
                  event.target.style.height = "auto";
                  event.target.style.height = `${Math.min(
                    event.target.scrollHeight,
                    128,
                  )}px`;
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    sendQuestion(input);
                  }
                }}
                rows={1}
                maxLength={5000}
                placeholder="Ask a question about this document..."
                className={`max-h-32 min-h-10 flex-1 resize-none bg-transparent px-3 py-2 text-sm ${
                  isDark ? "text-slate-100" : "text-slate-700"
                } outline-none placeholder:text-slate-400`}
              />

              <button
                type="submit"
                disabled={!input.trim() || sending}
                aria-label="Send message"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-300/50 transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
              >
                {sending ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Send size={18} />
                )}
              </button>
            </div>

            <p className={`mt-2 text-center text-[11px] ${mutedText}`}>
              AI responses may be inaccurate. Check the cited source excerpts.
            </p>
          </div>
        </form>
      </div>
    </main>
  );
}