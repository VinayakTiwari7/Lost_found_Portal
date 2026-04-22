import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import API from "../api";

export default function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");
  const [valid, setValid] = useState(null); // null = checking

  useEffect(() => {
    if (!token) {
      setValid(false);
      return;
    }
    API.get("/auth/me")
      .then((res) => {
        // Refresh stored user in case role changed
        localStorage.setItem("user", JSON.stringify({
          id: res.data._id,
          name: res.data.name,
          email: res.data.email,
          role: res.data.role,
        }));
        setValid(true);
      })
      .catch(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setValid(false);
      });
  }, [token]);

  if (valid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="w-10 h-10 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  return valid ? children : <Navigate to="/" replace />;
}