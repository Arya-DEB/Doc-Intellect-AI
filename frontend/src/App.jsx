import { useCallback, useState } from "react";
import {
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

import Sidebar from "./components/Sidebar";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Documents from "./pages/Documents";
import Chat from "./pages/Chat";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/useAuth.jsx";

export default function App() {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const active = location.pathname.startsWith("/documents")
    ? "Documents"
    : location.pathname.startsWith("/chat")
      ? "Chat"
      : "Dashboard";

  function handleNavigate(item) {
    close();

    if (item === "Dashboard") navigate("/dashboard");
    else if (item === "Documents") navigate("/documents");
    else if (item === "Chat") navigate("/chat");
  }

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <Routes>
      {/* Public landing page */}
      <Route
        path="/"
        element={user ? <Navigate to="/dashboard" replace /> : <Home />}
      />

      {/* Authentication routes */}
      <Route
        path="/login"
        element={user ? <Navigate to="/dashboard" replace /> : <Login />}
      />
      <Route
        path="/register"
        element={user ? <Navigate to="/dashboard" replace /> : <Register />}
      />

      {/* Protected application routes */}
      <Route element={<ProtectedRoute />}>
        <Route
          path="/*"
          element={
            <div className="flex h-dvh w-full overflow-hidden bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
              <Sidebar
                open={open}
                onClose={close}
                active={active}
                onNavigate={handleNavigate}
                onLogout={handleLogout}
              />

              <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                <Routes>
                  <Route
                    path="/dashboard"
                    element={<Dashboard onMenuClick={() => setOpen(true)} />}
                  />
                  <Route
                    path="/documents"
                    element={<Documents onMenuClick={() => setOpen(true)} />}
                  />
                  <Route
                    path="/chat"
                    element={<Chat onMenuClick={() => setOpen(true)} />}
                  />
                  <Route
                    path="/chat/:documentId"
                    element={<Chat onMenuClick={() => setOpen(true)} />}
                  />
                  <Route
                    path="*"
                    element={<Navigate to="/dashboard" replace />}
                  />
                </Routes>
              </div>
            </div>
          }
        />
      </Route>
    </Routes>
  );
}