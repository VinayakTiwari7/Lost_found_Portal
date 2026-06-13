import { useEffect, useState } from "react";
import API from "../api";
import Navbar from "../components/Navbar";
import { Search, MapPin, Clock, Send, X, AlertCircle, UserCircle, Trash2, CheckCircle, XCircle } from "lucide-react";

export default function Dashboard() {
  const [items, setItems] = useState([]);
  const [myItems, setMyItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Claim Modal State
  const [selectedItem, setSelectedItem] = useState(null);
  const [claimMessage, setClaimMessage] = useState("");
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimError, setClaimError] = useState("");
  const [claimSuccess, setClaimSuccess] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "null");

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const [publicRes, mineRes] = await Promise.all([
        API.get("/items"),
        user ? API.get("/items/mine") : Promise.resolve({ data: [] }),
      ]);
      setItems(publicRes.data);
      setMyItems(mineRes.data);
    } catch (err) {
      console.error("Failed to fetch items:", err);
    } finally {
      setLoading(false);
    }
  };

  const submitClaim = async (e) => {
    e.preventDefault();
    setClaimLoading(true);
    setClaimError("");
    setClaimSuccess(false);
    try {
      await API.post(`/claims/${selectedItem._id}`, { message: claimMessage });
      setClaimSuccess(true);
      setTimeout(() => {
        setSelectedItem(null);
        setClaimSuccess(false);
        setClaimMessage("");
      }, 2000);
    } catch (err) {
      setClaimError(err.response?.data?.message || "Failed to submit request.");
    } finally {
      setClaimLoading(false);
    }
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm("Delete this item? This cannot be undone.")) return;
    try {
      await API.delete(`/items/${itemId}`);
      setItems(prev => prev.filter(i => i._id !== itemId));
      setMyItems(prev => prev.filter(i => i._id !== itemId));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete item.");
    }
  };

  const handleSelfResolve = async (itemId) => {
    if (!window.confirm("Mark this item as resolved? This will close any pending claims.")) return;
    try {
      const res = await API.patch(`/items/${itemId}/resolve`);
      // Update item status locally
      setItems(prev => prev.map(i => i._id === itemId ? { ...i, status: res.data.item.status, helper: res.data.item.helper } : i));
      setMyItems(prev => prev.map(i => i._id === itemId ? { ...i, status: res.data.item.status, helper: res.data.item.helper } : i));
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.error || "Failed to resolve item.");
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesFilter = filter === "all" || item.type === filter;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.location || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // User's items that are still pending or rejected (not visible in public feed)
  const myPendingItems = myItems.filter(
    (i) => i.status === "pending_approval" || i.status === "rejected"
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* ── My Pending / Rejected Items Banner ────────────────────── */}
        {myPendingItems.length > 0 && (
          <div className="mb-8 space-y-3">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest">Your Submissions Awaiting Review</h2>
            {myPendingItems.map((item) => (
              <div
                key={item._id}
                className={`flex items-center justify-between gap-4 p-4 rounded-xl border backdrop-blur-sm ${
                  item.status === "pending_approval"
                    ? "bg-yellow-500/5 border-yellow-500/20"
                    : "bg-red-500/5 border-red-500/20"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {item.status === "pending_approval" ? (
                    <Clock className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-white font-medium text-sm truncate">{item.title}</p>
                    {item.status === "rejected" && item.adminNote && (
                      <p className="text-red-400 text-xs mt-0.5">Reason: {item.adminNote}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                    item.status === "pending_approval"
                      ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                      : "bg-red-500/20 text-red-300 border-red-500/30"
                  }`}>
                    {item.status === "pending_approval" ? "Pending Review" : "Rejected"}
                  </span>
                  <button
                    onClick={() => handleDelete(item._id)}
                    className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Header & Controls ────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 mb-2">
              Lost &amp; Found Directory
            </h1>
            <p className="text-gray-400 text-lg">Help reunite items with their owners.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            {/* Search */}
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-purple-400 transition-colors" />
              <input
                type="text"
                placeholder="Search items or locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all backdrop-blur-sm"
              />
            </div>

            {/* Filters */}
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 backdrop-blur-sm">
              {["all", "lost", "found"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-6 py-1.5 rounded-lg text-sm font-medium capitalize transition-all duration-300 ${
                    filter === f
                      ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Item Grid ────────────────────────────────────────────── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
            <p className="text-gray-400 animate-pulse">Loading items...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="bg-white/5 p-6 rounded-full mb-6 border border-white/10">
              <Search className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-semibold text-white mb-2">No items found</h3>
            <p className="text-gray-400 max-w-md">We couldn&apos;t find any items matching your filters. Try adjusting your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredItems.map((item) => (
              <div
                key={item._id}
                className="group relative flex flex-col bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden hover:border-purple-500/50 transition-all duration-500 hover:shadow-[0_0_40px_-10px_rgba(147,51,234,0.3)] hover:-translate-y-1"
              >
                {/* Image */}
                <div className="relative h-56 w-full overflow-hidden bg-gray-900">
                  <img
                    src={item.image || `https://source.unsplash.com/800x600/?${item.category || item.title}`}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80 group-hover:opacity-100"
                    onError={(e) => {
                      e.target.src = "https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?q=80&w=800&auto=format&fit=crop";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Badges */}
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    <span className={`px-3 py-1 text-xs font-bold rounded-full backdrop-blur-md border inline-block w-fit ${
                      item.type === "lost"
                        ? "bg-red-500/20 text-red-300 border-red-500/30"
                        : "bg-green-500/20 text-green-300 border-green-500/30"
                    }`}>
                      {item.type.toUpperCase()}
                    </span>
                    {item.status === "resolved" && (
                      <span className="px-3 py-1 text-xs font-bold rounded-full backdrop-blur-md border bg-blue-500/20 text-blue-300 border-blue-500/30 inline-block w-fit">
                        RESOLVED
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="flex flex-col flex-grow p-6">
                  <h2 className="text-xl font-bold text-white mb-2 line-clamp-1">{item.title}</h2>
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2 flex-grow">{item.description || "No description provided."}</p>

                  <div className="space-y-2 mb-6">
                    <div className="flex items-center text-sm text-gray-300">
                      <MapPin className="w-4 h-4 mr-2 text-purple-400" />
                      <span className="truncate">{item.location}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-300">
                      <Clock className="w-4 h-4 mr-2 text-blue-400" />
                      <span>{new Date(item.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
                    </div>
                    {item.user && (
                      <div className="flex items-center text-sm text-gray-300">
                        <UserCircle className="w-4 h-4 mr-2 text-pink-400" />
                        <span>Posted by {item.user.name}</span>
                      </div>
                    )}
                    {item.helper && item.status === "resolved" && (
                      <div className="flex items-center text-sm font-semibold text-green-400 mt-2 bg-green-500/10 border border-green-500/20 p-2 rounded-lg">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-400" />
                        <span>Resolved with help by {item.helper.name}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {user && (
                    <div className="space-y-2 mt-auto">
                      {/* Claim button — only for open items that aren't yours */}
                      {item.status === "open" && item.user?._id !== (user?.id || user?._id) && (
                        <button
                          onClick={() => setSelectedItem(item)}
                          className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-white/5 border border-white/10 hover:bg-white/10 hover:border-purple-500/30 transition-all flex items-center justify-center space-x-2"
                        >
                          <span>{item.type === "lost" ? "I have this item" : "This is mine"}</span>
                          <Send className="w-4 h-4" />
                        </button>
                      )}

                      {item.status === "resolved" && (
                        <div className="w-full py-2.5 text-center text-sm font-medium text-blue-400 bg-blue-500/10 rounded-xl border border-blue-500/20">
                          ✓ Item Resolved
                        </div>
                      )}

                      {/* Self Resolve — only for open items that ARE yours */}
                      {item.status === "open" && item.user?._id === (user?.id || user?._id) && (
                        <button
                          onClick={() => handleSelfResolve(item._id)}
                          className="w-full py-2.5 rounded-xl text-sm font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-all flex items-center justify-center space-x-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>{item.type === "lost" ? "I Found It" : "Returned to Owner"}</span>
                        </button>
                      )}

                      {item.user?._id === (user?.id || user?._id) && (
                        <div className="w-full py-2 text-center text-xs font-medium text-gray-500 bg-white/5 rounded-xl border border-white/5">
                          Your Post
                        </div>
                      )}

                      {/* Delete — only your own items */}
                      {item.user?._id === (user?.id || user?._id) && (
                        <button
                          onClick={() => handleDelete(item._id)}
                          className="w-full py-2.5 rounded-xl text-sm font-semibold text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all flex items-center justify-center space-x-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ── Claim Modal ──────────────────────────────────────────── */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 border border-white/10 p-6 sm:p-8 rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-blue-500" />

            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-2xl font-bold text-white mb-2">
              {selectedItem.type === "lost" ? "Report Found Item" : "Claim Item"}
            </h3>
            <p className="text-gray-400 text-sm mb-6">
              Contacting the poster about <span className="text-purple-300 font-semibold">&quot;{selectedItem.title}&quot;</span>.
            </p>

            {claimError && (
              <div className="flex items-center space-x-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg mb-4">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{claimError}</span>
              </div>
            )}

            {claimSuccess ? (
              <div className="flex flex-col items-center justify-center py-6 text-green-400">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4 border border-green-500/30">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h4 className="text-xl font-semibold">Request Sent!</h4>
                <p className="text-sm text-center text-green-400/80 mt-2">The poster will review your request.</p>
              </div>
            ) : (
              <form onSubmit={submitClaim} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Message to Poster</label>
                  <textarea
                    value={claimMessage}
                    onChange={(e) => setClaimMessage(e.target.value)}
                    placeholder="E.g., I think this is my wallet, it has my ID inside..."
                    className="w-full p-4 bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none transition-all"
                    rows={4}
                    required
                  />
                </div>
                <div className="flex space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedItem(null)}
                    className="flex-1 px-4 py-3 rounded-xl text-sm font-medium text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={claimLoading}
                    className="flex-1 px-4 py-3 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 transition-all shadow-lg shadow-purple-500/25 disabled:opacity-50 flex justify-center items-center"
                  >
                    {claimLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : "Send Request"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
