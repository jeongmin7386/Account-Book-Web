import { useEffect, useState } from "react";

import { api } from "./api/client";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import type { AuthResponse, User } from "./types";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("budget-token");
    if (!token) {
      setChecking(false);
      return;
    }
    api
      .me()
      .then(setUser)
      .catch(() => localStorage.removeItem("budget-token"))
      .finally(() => setChecking(false));
  }, []);

  const authenticated = (response: AuthResponse) => {
    setUser(response.user);
  };

  const logout = () => {
    localStorage.removeItem("budget-token");
    setUser(null);
  };

  if (checking) {
    return <div className="app-screen flex items-center justify-center bg-slate-100 text-slate-500">확인 중</div>;
  }

  return user ? <DashboardPage user={user} onLogout={logout} /> : <LoginPage onAuthenticated={authenticated} />;
}
