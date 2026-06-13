import { useEffect, useState, useCallback } from "react";
import API from "../api";
import Navbar from "../components/Navbar";
import {
  LayoutDashboard, Package, FileText, Users,
  CheckCircle, XCircle, Trash2, ShieldCheck, ShieldOff,
  Clock, TrendingUp, AlertCircle, ChevronDown, RefreshCw,
} from "lucide-react";

// ─── Reusable stat card ────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className={`bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center gap-4 backdrop-blur-sm hover:border-${color}-500/30 transition-all`}>
      <div className={`p-3 rounded-xl bg-${color}-500/10 border border-${color}-500/20`}>
        <Icon className={`w-6 h-6 text-${color}-400`} />
      </div>
      <div>
        <p className="text-3xl font-bold text-white">{value ?? "—"}</p>
        <p className="text-xs text-gray-400 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    pending_approval: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    open:             "bg-green-500/20  text-green-300  border-green-500/30",
    resolved:         "bg-blue-500/20   text-blue-300   border-blue-500/30",
    rejected:         "bg-red-500/20    text-red-300    border-red-500/30",
    pending:          "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    accepted:         "bg-green-500/20  text-green-300  border-green-500/30",
    user:             "bg-gray-500/20   text-gray-300   border-gray-500/30",
    admin:            "bg-purple-500/20 text-purple-300 border-purple-500/30",
  };
  return (
    <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border capitalize ${map[status] || "bg-white/10 text-gray-300 border-white/20"}`}>
      {status?.replace("_", " ")}
    </span>
  );
}

// ─── Confirm modal ────────────────────────────────────────────────────────
function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
        <AlertCircle className="w-10 h-10 text-yellow-400 mx-auto mb-4" />
        <p className="text-white text-center mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm border border-white/10 transition-all">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-all">Confirm</button>
        </div>
      </div>
    </div>
  );
}

const TABS = [
  { id: "overview", label: "Overview",  icon: LayoutDashboard },
  { id: "items",    label: "Items",     icon: Package },
  { id: "claims",   label: "Claims",    icon: FileText },
  { id: "users",    label: "Users",     icon: Users },
];

export default function Admin() {
  const [tab, setTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [items, setItems] = useState([]);
  const [claims, setClaims] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState(null); // { message, onConfirm }
  const [itemFilter, setItemFilter] = useState("pending_approval");
  const [claimFilter, setClaimFilter] = useState("");
  const [rejectModal, setRejectModal] = useState(null); // { itemId }
  const [rejectReason, setRejectReason] = useState("");

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const ask = (message, onConfirm) => setConfirm({ message, onConfirm });

  // ── Fetch helpers ─────────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    const res = await API.get("/admin/stats");
    setStats(res.data);
  }, []);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const q = itemFilter ? `?status=${itemFilter}` : "";
      const res = await API.get(`/admin/items${q}`);
      setItems(res.data);
    } finally { setLoading(false); }
  }, [itemFilter]);

  const fetchClaims = useCallback(async () => {
    setLoading(true);
    try {
      const q = claimFilter ? `?status=${claimFilter}` : "";
      const res = await API.get(`/admin/claims${q}`);
      setClaims(res.data);
    } finally { setLoading(false); }
  }, [claimFilter]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get("/admin/users");
      setUsers(res.data);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { if (tab === "items")  fetchItems();  }, [tab, fetchItems]);
  useEffect(() => { if (tab === "claims") fetchClaims(); }, [tab, fetchClaims]);
  useEffect(() => { if (tab === "users")  fetchUsers();  }, [tab, fetchUsers]);

  // ── Item actions ──────────────────────────────────────────────────────
  const approveItem = async (id) => {
    await API.patch(`/admin/items/${id}/approve`);
    showToast("Item approved ✓");
    fetchItems(); fetchStats();
  };

  const rejectItem = async () => {
    await API.patch(`/admin/items/${rejectModal}/reject`, { reason: rejectReason });
    showToast("Item rejected", "warn");
    setRejectModal(null); setRejectReason("");
    fetchItems(); fetchStats();
  };

  const deleteItem = (id) => ask("Delete this item and all its claims?", async () => {
    setConfirm(null);
    await API.delete(`/admin/items/${id}`);
    showToast("Item deleted", "warn");
    fetchItems(); fetchStats();
  });

  // ── Claim actions ─────────────────────────────────────────────────────
  const updateClaim = async (id, status) => {
    await API.patch(`/admin/claims/${id}/status`, { status });
    showToast(`Claim ${status}`);
    fetchClaims(); fetchStats();
  };

  const deleteClaim = (id) => ask("Delete this claim permanently?", async () => {
    setConfirm(null);
    await API.delete(`/admin/claims/${id}`);
    showToast("Claim deleted", "warn");
    fetchClaims(); fetchStats();
  });

  // ── User actions ──────────────────────────────────────────────────────
  const updateRole = async (id, role) => {
    await API.patch(`/admin/users/${id}/role`, { role });
    showToast(`Role updated to ${role}`);
    fetchUsers();
  };

  const deleteUser = (id) => ask("Delete this user account?", async () => {
    setConfirm(null);
    await API.delete(`/admin/users/${id}`);
    showToast("User deleted", "warn");
    fetchUsers(); fetchStats();
  });

  const fmt = (d) => new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="min-h-screen bg-[#0a0a0a] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(234,179,8,0.12),rgba(0,0,0,0))]">
      <Navbar />

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] flex items-center gap-2 px-5 py-3 rounded-xl shadow-xl text-sm font-medium border transition-all animate-in slide-in-from-top-2 ${
          toast.type === "warn"
            ? "bg-yellow-500/10 text-yellow-300 border-yellow-500/30"
            : "bg-green-500/10 text-green-300 border-green-500/30"
        }`}>
          <CheckCircle className="w-4 h-4" />
          {toast.msg}
        </div>
      )}

      {/* Confirm Modal */}
      {confirm && (
        <ConfirmModal
          message={confirm.message}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}

      {/* Reject reason modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-white font-bold text-lg mb-4">Reject Item</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection (optional)..."
              className="w-full p-3 bg-black/40 border border-white/10 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/40 resize-none"
              rows={3}
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setRejectModal(null)} className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm border border-white/10 transition-all">Cancel</button>
              <button onClick={rejectItem} className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-all">Reject</button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
              Admin Dashboard
            </h1>
            <p className="text-gray-400 mt-1">Manage items, claims, and users</p>
          </div>
          <button
            onClick={() => { fetchStats(); if (tab === "items") fetchItems(); if (tab === "claims") fetchClaims(); if (tab === "users") fetchUsers(); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-sm transition-all"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 bg-white/5 p-1 rounded-xl border border-white/10 w-fit">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                tab === id
                  ? "bg-gradient-to-r from-yellow-500/80 to-orange-500/80 text-white shadow-lg"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              {id === "items" && stats?.pendingItems > 0 && (
                <span className="ml-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {stats.pendingItems}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ─────────────────────────────────────────────── */}
        {tab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Total Items"    value={stats?.totalItems}    icon={Package}       color="purple" />
              <StatCard label="Pending Review" value={stats?.pendingItems}  icon={Clock}         color="yellow" />
              <StatCard label="Resolved"       value={stats?.resolvedItems} icon={CheckCircle}   color="green"  />
              <StatCard label="Total Users"    value={stats?.totalUsers}    icon={Users}         color="blue"   />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Open Items"     value={stats?.openItems}     icon={TrendingUp}    color="emerald"/>
              <StatCard label="Rejected Items" value={stats?.rejectedItems} icon={XCircle}       color="red"    />
              <StatCard label="Total Claims"   value={stats?.totalClaims}   icon={FileText}      color="indigo" />
              <StatCard label="Pending Claims" value={stats?.pendingClaims} icon={AlertCircle}   color="orange" />
            </div>

            {stats?.pendingItems > 0 && (
              <div className="flex items-center gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-300 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>
                  <strong>{stats.pendingItems}</strong> item{stats.pendingItems > 1 ? "s" : ""} waiting for approval.
                </span>
                <button onClick={() => setTab("items")} className="ml-auto underline underline-offset-2 hover:text-yellow-200 transition-colors">
                  Review now →
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── ITEMS TAB ────────────────────────────────────────────────── */}
        {tab === "items" && (
          <div className="space-y-4">
            {/* Filter row */}
            <div className="flex flex-wrap gap-2">
              {["", "pending_approval", "open", "resolved", "rejected"].map((f) => (
                <button
                  key={f}
                  onClick={() => setItemFilter(f)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all border ${
                    itemFilter === f
                      ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/40"
                      : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10"
                  }`}
                >
                  {f ? f.replace("_", " ") : "All"}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-yellow-500/20 border-t-yellow-500 rounded-full animate-spin" /></div>
            ) : items.length === 0 ? (
              <p className="text-center text-gray-500 py-20">No items found.</p>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-white/10">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-white/5 text-gray-400 text-left">
                      <th className="px-4 py-3 font-medium">Title</th>
                      <th className="px-4 py-3 font-medium hidden sm:table-cell">Type</th>
                      <th className="px-4 py-3 font-medium hidden md:table-cell">Posted By</th>
                      <th className="px-4 py-3 font-medium hidden lg:table-cell">Date</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {items.map((item) => (
                      <tr key={item._id} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-white font-medium line-clamp-1">{item.title}</p>
                          <p className="text-gray-500 text-xs line-clamp-1">{item.location}</p>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${item.type === "lost" ? "bg-red-500/20 text-red-300" : "bg-green-500/20 text-green-300"}`}>
                            {item.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell text-gray-300">{item.user?.name || "—"}</td>
                        <td className="px-4 py-3 hidden lg:table-cell text-gray-400">{fmt(item.createdAt)}</td>
                        <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {item.status === "pending_approval" && (
                              <>
                                <button onClick={() => approveItem(item._id)} title="Approve" className="p-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 transition-all">
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                                <button onClick={() => { setRejectModal(item._id); setRejectReason(""); }} title="Reject" className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all">
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            {item.status === "rejected" && (
                              <button onClick={() => approveItem(item._id)} title="Re-approve" className="p-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 transition-all">
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                            <button onClick={() => deleteItem(item._id)} title="Delete" className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── CLAIMS TAB ───────────────────────────────────────────────── */}
        {tab === "claims" && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {["", "pending", "accepted", "rejected"].map((f) => (
                <button
                  key={f}
                  onClick={() => setClaimFilter(f)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all border ${
                    claimFilter === f
                      ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/40"
                      : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10"
                  }`}
                >
                  {f || "All"}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-yellow-500/20 border-t-yellow-500 rounded-full animate-spin" /></div>
            ) : claims.length === 0 ? (
              <p className="text-center text-gray-500 py-20">No claims found.</p>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-white/10">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-white/5 text-gray-400 text-left">
                      <th className="px-4 py-3 font-medium">Item</th>
                      <th className="px-4 py-3 font-medium hidden md:table-cell">Claimant</th>
                      <th className="px-4 py-3 font-medium hidden lg:table-cell">Message</th>
                      <th className="px-4 py-3 font-medium hidden sm:table-cell">Date</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {claims.map((claim) => (
                      <tr key={claim._id} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-white font-medium line-clamp-1">{claim.item?.title || "—"}</p>
                          <p className="text-gray-500 text-xs capitalize">{claim.item?.type}</p>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell text-gray-300">{claim.user?.name || "—"}</td>
                        <td className="px-4 py-3 hidden lg:table-cell text-gray-400 max-w-[200px] truncate">{claim.message || "—"}</td>
                        <td className="px-4 py-3 hidden sm:table-cell text-gray-400">{fmt(claim.createdAt)}</td>
                        <td className="px-4 py-3"><StatusBadge status={claim.status} /></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {claim.status !== "accepted" && (
                              <button onClick={() => updateClaim(claim._id, "accepted")} title="Accept" className="p-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 transition-all">
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                            {claim.status !== "rejected" && (
                              <button onClick={() => updateClaim(claim._id, "rejected")} title="Reject" className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all">
                                <XCircle className="w-4 h-4" />
                              </button>
                            )}
                            <button onClick={() => deleteClaim(claim._id)} title="Delete" className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 border border-white/10 transition-all">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── USERS TAB ────────────────────────────────────────────────── */}
        {tab === "users" && (
          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-yellow-500/20 border-t-yellow-500 rounded-full animate-spin" /></div>
            ) : users.length === 0 ? (
              <p className="text-center text-gray-500 py-20">No users found.</p>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-white/10">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-white/5 text-gray-400 text-left">
                      <th className="px-4 py-3 font-medium">Name</th>
                      <th className="px-4 py-3 font-medium hidden sm:table-cell">Email</th>
                      <th className="px-4 py-3 font-medium hidden md:table-cell">Joined</th>
                      <th className="px-4 py-3 font-medium">Role</th>
                      <th className="px-4 py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {users.map((u) => (
                      <tr key={u._id} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3 text-white font-medium">{u.name}</td>
                        <td className="px-4 py-3 hidden sm:table-cell text-gray-400">{u.email}</td>
                        <td className="px-4 py-3 hidden md:table-cell text-gray-400">{fmt(u.createdAt)}</td>
                        <td className="px-4 py-3"><StatusBadge status={u.role} /></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {u.role !== "admin" ? (
                              <button onClick={() => updateRole(u._id, "admin")} title="Promote to Admin" className="p-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 transition-all">
                                <ShieldCheck className="w-4 h-4" />
                              </button>
                            ) : (
                              <button onClick={() => updateRole(u._id, "user")} title="Demote to User" className="p-1.5 rounded-lg bg-gray-500/10 hover:bg-gray-500/20 text-gray-400 border border-gray-500/20 transition-all">
                                <ShieldOff className="w-4 h-4" />
                              </button>
                            )}
                            <button onClick={() => deleteUser(u._id)} title="Delete User" className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}