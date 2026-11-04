import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import {
  deleteDocument,
  getDocuments,
  getDocumentUrl,
  uploadDocument,
} from "../services/documentService";
import {
  Bell,
  CloudUpload,
  FileText,
  MessageSquare,
  Download,
  Trash2,
  Menu,
  Search,
  Sparkles,
  Loader2,
} from "lucide-react";

const MAX_SIZE = 10 * 1024 * 1024;

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

export default function Dashboard({ onMenuClick }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [query, setQuery] = useState("");
  const [dragging, setDragging] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [listError, setListError] = useState("");
  const inputRef = useRef(null);
  const { user } = useAuth();
  const userName = user?.full_name?.trim() || "there";
  const navigate = useNavigate();

  const loadDocuments = useCallback(async () => {
    try {
      const data = await getDocuments();
      setDocuments(
        data.map((d) => ({
          id: d.id,
          name: d.filename,
          size: formatSize(d.file_size),
          date: formatDate(d.created_at),
        })),
      );
      setListError("");
    } catch {
      setListError("Unable to load documents. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(loadDocuments, 0);
    return () => clearTimeout(timer);
  }, [loadDocuments]);

  const visible = documents.filter((d) =>
    d.name.toLowerCase().includes(query.toLowerCase()),
  );

  async function handleFile(file) {
    setUploadError("");
    if (!file || uploading) return;

    if (file.type !== "application/pdf") {
      return setUploadError("Only PDF files are allowed.");
    }

    if (file.size > MAX_SIZE) {
      return setUploadError("Maximum file size is 10 MB.");
    }

    setUploading(true);
    try {
      await uploadDocument(file);
      await loadDocuments();
    } catch (err) {
      const detail = err.response?.data?.detail;
      setUploadError(
        typeof detail === "string"
          ? detail
          : "Upload failed. Please try again.",
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this document?")) return;

    try {
      await deleteDocument(id);
      setDocuments((docs) => docs.filter((d) => d.id !== id));
    } catch {
      setListError("Could not delete the document. Please try again.");
    }
  }

  async function handleDownload(doc) {
    setListError("");
    setDownloadingId(doc.id);

    try {
      const url = await getDocumentUrl(doc.id);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch {
      setListError("Could not download the document. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <main className="min-h-0 flex-1 overflow-y-auto bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      {/* Top bar */}
      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/80 px-4 backdrop-blur transition-colors dark:border-slate-800 dark:bg-slate-900/80 sm:h-20 sm:px-8">
        <button
          onClick={onMenuClick}
          aria-label="Open menu"
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
        >
          <Menu size={22} />
        </button>

        <div className="relative min-w-0 flex-1 sm:max-w-md">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your documents..."
            className="w-full rounded-xl bg-slate-100 py-2.5 pl-10 pr-3 text-sm text-slate-700 outline-none ring-violet-300 transition placeholder:text-slate-400 focus:bg-white focus:ring-2 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-800"
          />
        </div>

        <div className="ml-auto flex items-center gap-3 sm:gap-5">
          <button
            aria-label="Notifications"
            className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-violet-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-violet-400"
          >
            <Bell size={20} />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-violet-500 ring-2 ring-white dark:ring-slate-900" />
          </button>

          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br from-violet-500 to-indigo-600 font-semibold text-white">
              {userName.charAt(0).toUpperCase()}
            </div>
            <span className="hidden text-sm font-medium text-slate-700 dark:text-slate-200 sm:block">
              {userName}
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-6 p-4 sm:space-y-8 sm:p-8">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl bg-linear-to-r from-violet-100 via-purple-100 to-indigo-100 p-6 dark:from-violet-950 dark:via-purple-950 dark:to-indigo-950 sm:p-10">
          <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-violet-300/40 blur-2xl dark:bg-violet-500/20" />
          <div className="absolute -bottom-12 right-24 h-40 w-40 rounded-full bg-indigo-300/40 blur-2xl dark:bg-indigo-500/20" />

          <div className="relative max-w-xl">
            <p className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-violet-700 dark:bg-slate-900/70 dark:text-violet-300">
              <Sparkles size={14} /> Your AI-powered document assistant
            </p>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 sm:text-4xl">
              Welcome back, {userName}! 👋
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 sm:text-base">
              Upload your PDFs and get answers, with sources, straight from your
              documents.
            </p>
          </div>

          <div className="absolute bottom-6 right-8 hidden items-center gap-3 md:flex">
            <div className="flex h-20 w-16 rotate-6 items-center justify-center rounded-lg bg-white shadow-lg dark:bg-slate-800">
              <FileText className="text-red-400" size={28} />
            </div>
            <div className="flex h-12 w-12 -rotate-6 items-center justify-center rounded-2xl bg-violet-600 shadow-lg shadow-violet-400/50">
              <MessageSquare className="text-white" size={22} />
            </div>
          </div>
        </section>

        {/* Upload */}
        <section
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            handleFile(e.dataTransfer.files[0]);
          }}
          className={`rounded-3xl border-2 border-dashed p-6 text-center transition sm:p-10 ${
            dragging
              ? "scale-[1.01] border-violet-500 bg-violet-50 dark:bg-violet-950/40"
              : "border-violet-200 bg-white hover:border-violet-400 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-violet-500"
          }`}
        >
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 dark:bg-violet-950">
            {uploading ? (
              <Loader2 className="h-7 w-7 animate-spin text-violet-600 dark:text-violet-400" />
            ) : (
              <CloudUpload className="h-7 w-7 text-violet-600 dark:text-violet-400" />
            )}
          </div>

          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            {uploading ? "Processing your PDF..." : "Upload your PDF"}
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {uploading
              ? "Extracting text and preparing it for chat. This takes a few seconds."
              : "Drag and drop here, or click to browse (Max 10 MB)"}
          </p>

          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              handleFile(e.target.files[0]);
              e.target.value = "";
            }}
          />

          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="mt-5 rounded-xl bg-linear-to-r from-violet-600 to-indigo-600 px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-300/50 transition hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
          >
            {uploading ? "Uploading..." : "Choose File"}
          </button>

          {uploadError && (
            <p className="mt-3 text-sm font-medium text-red-500">
              {uploadError}
            </p>
          )}
        </section>

        {/* Documents */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Your Documents
              <span className="ml-2 rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                {visible.length}
              </span>
            </h2>
            <button
              onClick={() => navigate("/documents")}
              className="text-sm font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
            >
              View all →
            </button>
          </div>

          {listError && (
            <div className="mb-4 flex items-center justify-between gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-300">
              <span>{listError}</span>
              <button
                onClick={loadDocuments}
                className="shrink-0 font-medium underline"
              >
                Retry
              </button>
            </div>
          )}

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-36 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                />
              ))}
            </div>
          ) : visible.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
              {query
                ? "No documents match your search."
                : "No documents yet. Upload your first PDF above."}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
              {visible.map((doc) => (
                <article
                  key={doc.id}
                  className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-violet-200 hover:shadow-xl hover:shadow-violet-100 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-violet-800 dark:hover:shadow-black/20"
                >
                  <div className="mb-4 flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 dark:bg-red-950/40">
                      <FileText className="h-6 w-6 text-red-500" />
                    </div>

                    <div className="min-w-0">
                      <h3
                        title={doc.name}
                        className="truncate font-semibold text-slate-800 dark:text-slate-100"
                      >
                        {doc.name}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {doc.size} · {doc.date}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                    <button
                      onClick={() => navigate(`/chat/${doc.id}`)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-violet-50 px-3 py-2 text-sm font-medium text-violet-700 transition hover:bg-violet-600 hover:text-white dark:bg-violet-950/50 dark:text-violet-300 dark:hover:bg-violet-600 dark:hover:text-white"
                    >
                      <MessageSquare size={16} />
                      Chat
                    </button>

                    <button
                      aria-label="Download"
                      title="Download"
                      onClick={() => handleDownload(doc)}
                      disabled={downloadingId === doc.id}
                      className="rounded-lg bg-slate-100 px-3 py-2 text-slate-600 transition hover:bg-slate-200 disabled:opacity-60 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                      {downloadingId === doc.id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Download size={16} />
                      )}
                    </button>

                    <button
                      aria-label="Delete"
                      title="Delete"
                      onClick={() => handleDelete(doc.id)}
                      className="rounded-lg bg-red-50 px-3 py-2 text-red-500 transition hover:bg-red-500 hover:text-white dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-500 dark:hover:text-white"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}