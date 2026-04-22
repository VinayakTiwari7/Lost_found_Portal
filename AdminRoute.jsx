import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import API from "../api";

/**
 * AdminRoute — wraps a page that only admins can access.
 * 1. Checks token validity via /auth/me
 * 2. Redirects non-authenticated users → /
 * 3. Redirects authenticated non-admins → /dashboard
 */
export default function AdminRoute({ children }) {
  const token = localStorage.getItem("token");
  const [state, setState] = useState("loading"); // "loading" | "admin" | "user" | "guest"

  useEffect(() => {
    if (!token) {
      setState("guest");
      return;
    }
    API.get("/auth/me")
      .then((res) => {
        // Refresh stored user
        const user = {
          id: res.data._id,
          name: res.data.name,
          email: res.data.email,
          role: res.data.role,
        };
        localStorage.setItem("user", JSON.stringify(user));
        setState(user.role === "admin" ? "admin" : "user");
      })
      .catch(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setState("guest");
      });
  }, [token]);

  if (state === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="w-10 h-10 border-4 border-yellow-500/20 border-t-yellow-500 rounded-full animate-spin" />
      </div>
    );
  }
  if (state === "guest") return <Navigate to="/" replace />;
  if (state === "user") return <Navigate to="/dashboard" replace />;
  return children;
}
