import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ArrowLeft,
  Eye,
  FileText,
  Loader2,
  MessageSquare,
  RefreshCw,
  Send,
  Trash2,
  X,
  RotateCcw,
  Menu,
} from "lucide-react";

import { LogoMark } from "../components/logo";

import {
  deleteDocument,
  getDocuments,
  getDocumentPdfBlob,
} from "../services/documentService";

import {
  askQuestion,
  getConversations,
  getConversation,
  deleteConversation,
} from "../services/chatService";

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function Documents({ onMenuClick }) {
  const navigate = useNavigate();

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  const [selectedDoc, setSelectedDoc] = useState(null);
  const [pdfUrl, setPdfUrl] = useState("");
  const [viewLoading, setViewLoading] = useState(false);
  const [pdfError, setPdfError] = useState("");

  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState("");
  const [conversationId, setConversationId] = useState(null);

  const [conversations, setConversations] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");

  const [deletingConversationId, setDeletingConversationId] = useState(null);

  const [pdfPage, setPdfPage] = useState(1);
  const [mobilePanel, setMobilePanel] = useState("chat");

  const pdfUrlRef = useRef("");
  const chatEndRef = useRef(null);
  const pdfFrameRef = useRef(null);
  const requestIdRef = useRef(0);

  const clearPdfUrl = useCallback(() => {
    if (pdfUrlRef.current) {
      URL.revokeObjectURL(pdfUrlRef.current);
      pdfUrlRef.current = "";
    }

    setPdfUrl("");
  }, []);

  useEffect(() => {
    return () => {
      if (pdfUrlRef.current) {
        URL.revokeObjectURL(pdfUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const loadDocuments = useCallback(async () => {
    setLoading(true);

    try {
      const data = await getDocuments();

      setDocuments(
        data.map((doc) => ({
          id: doc.id,
          name: doc.filename,
          size: formatSize(doc.file_size),
          date: formatDate(doc.created_at),
        })),
      );

      setError("");
    } catch {
      setError("Unable to load documents. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timerId = setTimeout(() => {
      loadDocuments();
    }, 0);

    return () => clearTimeout(timerId);
  }, [loadDocuments]);

  const loadHistory = useCallback(async (documentId) => {
    if (!documentId) return;

    setHistoryLoading(true);
    setHistoryError("");

    try {
      const data = await getConversations(documentId);
      setConversations(data);
    } catch {
      setHistoryError("Unable to load chat history.");
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedDoc) return;

    let cancelled = false;

    async function fetchHistory() {
      setHistoryLoading(true);
      setHistoryError("");

      try {
        const data = await getConversations(selectedDoc.id);

        if (!cancelled) {
          setConversations(data);
        }
      } catch {
        if (!cancelled) {
          setHistoryError("Unable to load chat history.");
        }
      } finally {
        if (!cancelled) {
          setHistoryLoading(false);
        }
      }
    }

    fetchHistory();

    return () => {
      cancelled = true;
    };
  }, [selectedDoc]);

  const visibleDocuments = documents.filter((doc) =>
    doc.name.toLowerCase().includes(query.toLowerCase()),
  );

  async function loadPdf(doc) {
    clearPdfUrl();
    setPdfError("");
    setViewLoading(true);

    try {
      const blob = await getDocumentPdfBlob(doc.id);
      const objectUrl = URL.createObjectURL(blob);

      pdfUrlRef.current = objectUrl;
      setPdfUrl(objectUrl);
    } catch {
      setPdfError("Could not open this PDF.");
    } finally {
      setViewLoading(false);
    }
  }

  async function handleView(doc) {
    requestIdRef.current += 1;

    setSelectedDoc(doc);
    setConversations([]);
    setMessages([]);
    setConversationId(null);
    setQuestion("");
    setChatError("");
    setHistoryError("");
    setError("");
    setPdfError("");
    setPdfPage(1);
    setMobilePanel("chat");

    await loadPdf(doc);
  }

  function closeViewer() {
    requestIdRef.current += 1;
    clearPdfUrl();

    setSelectedDoc(null);
    setConversations([]);
    setMessages([]);
    setConversationId(null);
    setQuestion("");
    setChatError("");
    setHistoryError("");
    setPdfError("");
    setSending(false);
    setMobilePanel("chat");
  }

  function startNewChat() {
    if (sending) return;

    setMessages([]);
    setConversationId(null);
    setQuestion("");
    setChatError("");
    setMobilePanel("chat");
  }

  async function handleSelectConversation(id) {
    if (sending) return;

    setChatError("");

    try {
      const conversation = await getConversation(id);

      setConversationId(conversation.id);
      setMessages(
        (conversation.messages || []).map((message) => ({
          role: message.role,
          content: message.content,
          sources: [],
        })),
      );

      setMobilePanel("chat");
    } catch {
      setChatError("Unable to open this conversation.");
    }
  }

  async function handleDeleteConversation(conversation) {
    if (sending || deletingConversationId !== null) return;

    const confirmed = window.confirm(
      `Delete this conversation?\n\n"${conversation.title || "Untitled conversation"}"\n\nThis cannot be undone.`,
    );

    if (!confirmed) return;

    setDeletingConversationId(conversation.id);
    setChatError("");

    try {
      await deleteConversation(conversation.id);

      setConversations((prev) =>
        prev.filter((item) => item.id !== conversation.id),
      );

      if (String(conversation.id) === String(conversationId)) {
        setMessages([]);
        setConversationId(null);
        setQuestion("");
      }
    } catch (err) {
      setChatError(
        err.response?.data?.detail ||
          "Unable to delete this conversation. Please try again.",
      );
    } finally {
      setDeletingConversationId(null);
    }
  }

  async function handleDelete(doc) {
    if (!window.confirm(`Delete "${doc.name}"?`)) return;

    try {
      await deleteDocument(doc.id);
      setDocuments((prev) => prev.filter((item) => item.id !== doc.id));

      if (selectedDoc?.id === doc.id) {
        closeViewer();
      }
    } catch {
      setError("Could not delete the document. Please try again.");
    }
  }

  function jumpToPage(pageNumber) {
    if (!pageNumber) return;
    setPdfPage(pageNumber);
    setMobilePanel("pdf");
  }

  async function handleSend(e) {
    e.preventDefault();

    const text = question.trim();
    if (!text || sending || !selectedDoc) return;

    const currentRequestId = requestIdRef.current;
    const selectedDocumentId = selectedDoc.id;

    setQuestion("");
    setSending(true);
    setChatError("");
    setMobilePanel("chat");

    setMessages((prev) => [...prev, { role: "user", content: text }]);

    try {
      const result = await askQuestion({
        question: text,
        conversationId,
        documentId: selectedDocumentId,
      });

      if (currentRequestId !== requestIdRef.current) return;

      setConversationId(result.conversation_id);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: result.answer || "No answer was returned.",
          sources: result.sources ?? [],
        },
      ]);

      await loadHistory(selectedDocumentId);
    } catch (err) {
      if (currentRequestId !== requestIdRef.current) return;

      setChatError(
        err.response?.data?.detail ||
          "Unable to get an answer. Please try again.",
      );
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setSending(false);
      }
    }
  }

  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      {!selectedDoc ? (
        <>
          <header className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-5 transition-colors dark:border-slate-800 dark:bg-slate-900 sm:px-8">
            <button
              onClick={onMenuClick}
              aria-label="Open menu"
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
            >
              <Menu size={22} />
            </button>

            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                My Documents
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Manage and view your uploaded PDFs
              </p>
            </div>
          </header>

          <section className="flex-1 overflow-y-auto p-4 sm:p-8">
            <div className="mx-auto max-w-6xl">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search documents..."
                  className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-violet-900/40"
                />

                <button
                  onClick={() => navigate("/")}
                  className="rounded-xl bg-violet-600 px-4 py-3 text-sm font-medium text-white hover:bg-violet-700"
                >
                  Upload PDF
                </button>
              </div>

              {error && (
                <div className="mb-4 flex items-center justify-between gap-3 rounded-xl bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-300">
                  <span>{error}</span>
                  <button
                    onClick={loadDocuments}
                    className="font-medium underline"
                  >
                    Retry
                  </button>
                </div>
              )}

              {loading ? (
                <div className="flex items-center gap-2 py-10 text-slate-500 dark:text-slate-400">
                  <Loader2 className="animate-spin" size={18} />
                  Loading documents...
                </div>
              ) : visibleDocuments.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                  {query
                    ? "No documents match your search."
                    : "No documents uploaded yet."}
                </div>
              ) : (
                <div className="space-y-3">
                  {visibleDocuments.map((doc) => (
                    <article
                      key={doc.id}
                      className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 dark:bg-red-950/40">
                          <FileText className="text-red-500" size={24} />
                        </div>

                        <div className="min-w-0">
                          <h2
                            title={doc.name}
                            className="truncate font-semibold text-slate-800 dark:text-slate-100"
                          >
                            {doc.name}
                          </h2>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {doc.size} · {doc.date}
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 gap-2">
                        <button
                          onClick={() => navigate(`/chat/${doc.id}`)}
                          className="flex items-center gap-1.5 rounded-lg bg-violet-50 px-3 py-2 text-sm font-medium text-violet-700 hover:bg-violet-100 dark:bg-violet-950/50 dark:text-violet-300 dark:hover:bg-violet-900/60"
                        >
                          <MessageSquare size={16} />
                          Chat
                        </button>

                        <button
                          onClick={() => handleView(doc)}
                          title="View PDF"
                          aria-label={"View " + doc.name}
                          className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-violet-100 hover:text-violet-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-violet-950/60 dark:hover:text-violet-300"
                        >
                          <Eye size={16} />
                          View
                        </button>

                        <button
                          onClick={() => handleDelete(doc)}
                          title="Delete document"
                          aria-label={"Delete " + doc.name}
                          className="rounded-lg bg-red-50 px-3 py-2 text-red-500 hover:bg-red-500 hover:text-white dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-600 dark:hover:text-white"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        </>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 transition-colors dark:border-slate-800 dark:bg-slate-900">
            <div className="flex min-w-0 items-center gap-3">
              <button
                onClick={closeViewer}
                aria-label="Back to documents"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <ArrowLeft size={18} />
              </button>

              <FileText className="shrink-0 text-red-500" size={20} />
              <h1 className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                {selectedDoc.name}
              </h1>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={startNewChat}
                disabled={sending}
                title="Start a new chat"
                aria-label="Start a new chat"
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-violet-700 hover:bg-violet-50 disabled:opacity-50 dark:text-violet-300 dark:hover:bg-violet-950/50"
              >
                <RotateCcw size={15} />
                New chat
              </button>

              <button
                onClick={closeViewer}
                aria-label="Close viewer"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>
          </header>

          {/* Mobile PDF / Chat switcher */}
          <div className="grid shrink-0 grid-cols-2 gap-2 border-b border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-900 lg:hidden">
            <button
              onClick={() => setMobilePanel("pdf")}
              className={`rounded-lg py-2.5 text-sm font-medium transition ${
                mobilePanel === "pdf"
                  ? "bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-200"
                  : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              }`}
            >
              <FileText size={16} className="mr-2 inline" />
              PDF
            </button>

            <button
              onClick={() => setMobilePanel("chat")}
              className={`rounded-lg py-2.5 text-sm font-medium transition ${
                mobilePanel === "chat"
                  ? "bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-200"
                  : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              }`}
            >
              <MessageSquare size={16} className="mr-2 inline" />
              Chat
            </button>
          </div>

          <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[minmax(0,1.6fr)_minmax(380px,1fr)]">
            {/* PDF panel */}
            <section
              className={`relative h-full min-h-0 bg-slate-200 dark:bg-slate-950 ${
                mobilePanel === "pdf" ? "block" : "hidden"
              } lg:block`}
            >
              {viewLoading ? (
                <div className="flex h-full items-center justify-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <Loader2 className="animate-spin" size={18} />
                  Opening PDF...
                </div>
              ) : pdfUrl ? (
                <iframe
                  ref={pdfFrameRef}
                  src={`${pdfUrl}#page=${pdfPage}`}
                  title={`PDF viewer: ${selectedDoc.name}`}
                  className="h-full min-h-0 w-full border-0"
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                  <p>{pdfError || "PDF preview unavailable."}</p>
                  <button
                    onClick={() => loadPdf(selectedDoc)}
                    disabled={viewLoading}
                    className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 font-medium text-violet-700 hover:bg-violet-50 dark:bg-slate-800 dark:text-violet-300 dark:hover:bg-slate-700"
                  >
                    <RefreshCw size={15} />
                    Retry PDF
                  </button>
                </div>
              )}
            </section>

            {/* Chat panel */}
            <section
              className={`h-full min-h-0 min-w-0 flex-col border-l border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 ${
                mobilePanel === "chat" ? "flex" : "hidden"
              } lg:flex`}
            >
              <div className="flex shrink-0 items-center gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#1a1a45] ring-1 ring-violet-400/40">
                  <LogoMark size={26} />
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    Ask about this document
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Answers are grounded in this PDF
                  </p>
                </div>
              </div>

              {/* Previous conversations */}
              <div className="shrink-0 border-b border-slate-200 px-3 py-3 dark:border-slate-800">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Previous conversations
                  </h3>

                  <button
                    onClick={() => loadHistory(selectedDoc.id)}
                    disabled={historyLoading}
                    title="Refresh history"
                    aria-label="Refresh conversation history"
                    className="rounded-md p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-slate-800"
                  >
                    <RefreshCw
                      size={14}
                      className={historyLoading ? "animate-spin" : ""}
                    />
                  </button>
                </div>

                {historyLoading ? (
                  <div className="flex items-center gap-2 py-1 text-xs text-slate-500 dark:text-slate-400">
                    <Loader2 size={13} className="animate-spin" />
                    Loading history...
                  </div>
                ) : historyError ? (
                  <p className="text-xs text-red-500 dark:text-red-400">
                    {historyError}
                  </p>
                ) : conversations.length === 0 ? (
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    No previous conversations for this PDF.
                  </p>
                ) : (
                  <div className="flex max-h-32 flex-col gap-1 overflow-y-auto">
                    {conversations.map((conversation) => {
                      const isActive = conversation.id === conversationId;
                      const isDeleting =
                        deletingConversationId === conversation.id;

                      return (
                        <div
                          key={conversation.id}
                          className={
                            "flex min-w-0 items-center gap-1 rounded-lg transition " +
                            (isActive
                              ? "bg-violet-100 dark:bg-violet-950/60"
                              : "hover:bg-slate-100 dark:hover:bg-slate-800")
                          }
                        >
                          <button
                            onClick={() =>
                              handleSelectConversation(conversation.id)
                            }
                            disabled={
                              sending || deletingConversationId !== null
                            }
                            className={
                              "min-w-0 flex-1 truncate px-2.5 py-2 text-left text-xs " +
                              (isActive
                                ? "font-medium text-violet-800 dark:text-violet-200"
                                : "text-slate-600 dark:text-slate-300")
                            }
                            title={conversation.title}
                          >
                            {conversation.title || "Untitled conversation"}
                          </button>

                          <button
                            onClick={() =>
                              handleDeleteConversation(conversation)
                            }
                            disabled={
                              sending || deletingConversationId !== null
                            }
                            title="Delete conversation"
                            aria-label={`Delete conversation ${conversation.title || ""}`}
                            className="mr-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-red-100 hover:text-red-600 disabled:opacity-50 dark:text-slate-500 dark:hover:bg-red-950/50 dark:hover:text-red-300"
                          >
                            {isDeleting ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <Trash2 size={13} />
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Scrollable messages */}
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4">
                {messages.length === 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Ask a question about {selectedDoc.name}.
                    </p>

                    {[
                      "Summarize this document",
                      "What are the key points?",
                      "Explain the important topics",
                    ].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => setQuestion(suggestion)}
                        className="block max-w-full rounded-full border border-violet-200 px-3 py-2 text-left text-xs text-violet-700 hover:bg-violet-50 dark:border-violet-800 dark:text-violet-300 dark:hover:bg-violet-950/50"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}

                {messages.map((message, index) => (
                  <div
                    key={index + "-" + message.role}
                    className={
                      "rounded-xl p-3 text-sm " +
                      (message.role === "user"
                        ? "ml-6 bg-violet-100 text-violet-950 dark:bg-violet-950/60 dark:text-violet-100"
                        : "mr-2 bg-slate-50 text-slate-800 dark:bg-slate-800 dark:text-slate-100")
                    }
                  >
                    <div className="chat-markdown">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.content}
                      </ReactMarkdown>
                    </div>

                    {message.sources?.length > 0 && (
                      <div className="mt-3 border-t border-slate-200 pt-2 dark:border-slate-700">
                        <p className="mb-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                          Sources
                        </p>

                        {message.sources.map((source, sourceIndex) => (
                          <div
                            key={source.chunk_id ?? sourceIndex}
                            className="mb-2 rounded-lg bg-white p-2 dark:bg-slate-900"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                                Source {sourceIndex + 1}
                                {source.page_number != null && (
                                  <> · Page {source.page_number}</>
                                )}
                              </p>

                              {source.page_number != null && (
                                <button
                                  onClick={() => jumpToPage(source.page_number)}
                                  className="text-xs font-medium text-violet-700 hover:underline dark:text-violet-300"
                                >
                                  View page
                                </button>
                              )}
                            </div>

                            <p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-slate-500 dark:text-slate-400">
                              {source.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {sending && (
                  <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <Loader2 size={16} className="animate-spin" />
                    Thinking...
                  </div>
                )}

                {chatError && (
                  <div className="rounded-lg bg-red-50 p-3 text-xs text-red-600 dark:bg-red-950/40 dark:text-red-300">
                    <p>{chatError}</p>
                    <button
                      onClick={() => setChatError("")}
                      className="mt-1 font-medium underline"
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              {/* Fixed chat input */}
              <form
                onSubmit={handleSend}
                className="shrink-0 border-t border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-end gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2 focus-within:border-violet-300 dark:border-slate-700 dark:bg-slate-800">
                  <textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend(e);
                      }
                    }}
                    rows={1}
                    placeholder="Ask a question..."
                    disabled={sending}
                    className="max-h-28 min-h-9 flex-1 resize-y bg-transparent px-2 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 disabled:opacity-60 dark:text-slate-100 dark:placeholder:text-slate-500"
                  />

                  <button
                    type="submit"
                    disabled={!question.trim() || sending}
                    aria-label="Send question"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50"
                  >
                    {sending ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Send size={16} />
                    )}
                  </button>
                </div>

                <p className="mt-1 px-2 text-[11px] text-slate-400 dark:text-slate-500">
                  Enter to send · Shift + Enter for a new line
                </p>
              </form>
            </section>
          </div>
        </div>
      )}
    </main>
  );
}