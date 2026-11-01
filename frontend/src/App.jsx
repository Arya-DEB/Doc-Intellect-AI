import { useCallback, useState } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Chat from "./pages/Chat";

export default function App() {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  const navigate = useNavigate();
  const location = useLocation();

  const active =
    location.pathname === "/"
      ? "Dashboard"
      : location.pathname.startsWith("/documents")
      ? "Documents"
      : location.pathname.startsWith("/chat")
      ? "Chat"
      : "Dashboard";

  function handleNavigate(item) {
    close();

    if (item === "Dashboard") navigate("/");
    else if (item === "Documents") navigate("/documents");
    else if (item === "Chat") navigate("/chat");
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-slate-50">
      <Sidebar
        open={open}
        onClose={close}
        active={active}
        onNavigate={handleNavigate}
      />

      <Routes>
        <Route
          path="/"
          element={<Dashboard onMenuClick={() => setOpen(true)} />}
        />
        <Route
          path="/documents"
          element={<Dashboard onMenuClick={() => setOpen(true)} />}
        />
        <Route
  path="/chat/:documentId"
  element={<Chat />}
/>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}