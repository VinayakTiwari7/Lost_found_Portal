import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Search, PlusCircle, LayoutDashboard, Inbox, UserCircle, LogOut, ShieldCheck } from "lucide-react";
import API from "../api";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [pendingCount, setPendingCount] = useState(0);

  const user = JSON.parse(localStorage.getItem("user") || "null");

  useEffect(() => {
    if (user?.role === "admin") {
      API.get("/admin/stats")
        .then((res) => setPendingCount(res.data.pendingItems || 0))
        .catch(() => {});
    }
  }, [location.pathname]);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl bg-black/50 border-b border-white/10 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Section */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate("/dashboard")}>
            <div className="bg-gradient-to-tr from-purple-600 to-blue-500 p-2 rounded-xl shadow-lg shadow-purple-500/30">
              <Search className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent hidden sm:block">
              Lost&Found
            </h1>
          </div>

          {/* Nav Links */}
          {user && (
            <div className="hidden md:flex items-center space-x-1">
              <Link
                to="/dashboard"
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                  isActive('/dashboard')
                    ? "bg-white/10 text-white shadow-inner"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>

              <Link
                to="/requests"
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                  isActive('/requests')
                    ? "bg-white/10 text-white shadow-inner"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Inbox className="w-4 h-4" />
                <span>Requests</span>
              </Link>
            </div>
          )}

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            {user && (
              <Link
                to="/add"
                className="hidden sm:flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white px-4 py-2 rounded-xl transition-all duration-300 shadow-lg shadow-purple-500/25 border border-white/10"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Report Item</span>
              </Link>
            )}

            {user?.role === "admin" && (
              <Link
                to="/admin"
                className={`relative flex items-center space-x-2 px-3 py-1.5 rounded-lg border transition-all text-sm font-medium ${
                  isActive('/admin')
                    ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/40"
                    : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20 hover:bg-yellow-500/20"
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Admin</span>
                {pendingCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-lg shadow-red-500/40 animate-pulse">
                    {pendingCount > 9 ? "9+" : pendingCount}
                  </span>
                )}
              </Link>
            )}

            {user ? (
              <div className="flex items-center space-x-4 pl-4 border-l border-white/10">
                <div className="flex items-center space-x-2">
                  <div className="bg-gradient-to-br from-gray-700 to-gray-800 p-1.5 rounded-full border border-gray-600">
                    <UserCircle className="w-5 h-5 text-gray-300" />
                  </div>
                  <span className="text-sm font-medium text-gray-300 hidden sm:block">
                    {user.name}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="space-x-4">
                <Link to="/" className="text-gray-300 hover:text-white transition">Login</Link>
                <Link to="/register" className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl transition shadow-lg shadow-purple-500/30">
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}