import { useEffect, useState } from "react";
import API from "../api";
import Navbar from "../components/Navbar";
import { CheckCircle, XCircle, Clock, MapPin, Search } from "lucide-react";

// Resolve image URLs: prefix /uploads paths with the backend base URL in production
const BACKEND_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/api\/?$/, "");
function resolveImageUrl(imagePath) {
  if (!imagePath) return null;
  if (imagePath.startsWith("/uploads")) return `${BACKEND_BASE}${imagePath}`;
  return imagePath;
}

export default function Requests() {
  const [myClaims, setMyClaims] = useState([]);
  const [receivedClaims, setReceivedClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("received"); // 'received' or 'sent'

  useEffect(() => {
    fetchClaims();
  }, []);

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const [sentRes, receivedRes] = await Promise.all([
        API.get("/claims/my"),
        API.get("/claims/received")
      ]);
      setMyClaims(sentRes.data);
      setReceivedClaims(receivedRes.data);
    } catch (err) {
      console.error("Failed to fetch claims:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (claimId, status) => {
    try {
      await API.patch(`/claims/${claimId}/status`, { status });
      // Refresh the lists to show the updated status
      fetchClaims();
    } catch (err) {
      alert(err.response?.data?.message || "Error updating status");
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "accepted":
        return <span className="bg-green-500/20 text-green-400 border border-green-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Accepted</span>;
      case "rejected":
        return <span className="bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Rejected</span>;
      default:
        return <span className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 py-12">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 mb-2">
            Claim Requests
          </h1>
          <p className="text-gray-400 text-lg">Manage inquiries about your items and track your claims.</p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-10">
          <div className="flex p-1 bg-white/5 border border-white/10 rounded-xl backdrop-blur-md">
            <button
              onClick={() => setActiveTab("received")}
              className={`px-8 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === "received" 
                  ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg" 
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              Received Requests ({receivedClaims.length})
            </button>
            <button
              onClick={() => setActiveTab("sent")}
              className={`px-8 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === "sent" 
                  ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg" 
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              My Claims ({myClaims.length})
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
            <p className="text-gray-400">Loading requests...</p>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* RECEIVED TAB */}
            {activeTab === "received" && (
              receivedClaims.length === 0 ? (
                <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10">
                  <InboxEmptyState message="No one has requested your items yet." />
                </div>
              ) : (
                receivedClaims.map(claim => (
                  <ClaimCard 
                    key={claim._id} 
                    claim={claim} 
                    type="received"
                    onUpdate={handleStatusUpdate}
                    statusBadge={getStatusBadge}
                  />
                ))
              )
            )}

            {/* SENT TAB */}
            {activeTab === "sent" && (
              myClaims.length === 0 ? (
                <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10">
                  <InboxEmptyState message="You haven't requested any items yet." />
                </div>
              ) : (
                myClaims.map(claim => (
                  <ClaimCard 
                    key={claim._id} 
                    claim={claim} 
                    type="sent"
                    statusBadge={getStatusBadge}
                  />
                ))
              )
            )}
            
          </div>
        )}
      </main>
    </div>
  );
}

function ClaimCard({ claim, type, onUpdate, statusBadge }) {
  if (!claim.item) return null; // Fallback if item was deleted

  return (
    <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6 flex flex-col md:flex-row gap-6 hover:bg-white/10 transition-colors duration-300">
      
      {/* Item Image Miniature */}
      <div className="w-full md:w-32 h-32 flex-shrink-0 rounded-xl overflow-hidden bg-gray-900 border border-white/10 relative">
        <img 
          src={resolveImageUrl(claim.item.image) || `https://source.unsplash.com/800x600/?${claim.item.type}`}
          alt={claim.item.title}
          className="w-full h-full object-cover"
          onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?q=80&w=200&auto=format&fit=crop"; }}
        />
        <div className="absolute bottom-2 left-2">
           <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md backdrop-blur-md border ${
              claim.item.type === "lost" ? "bg-red-500/40 text-red-100" : "bg-green-500/40 text-green-100"
            }`}>
              {claim.item.type.toUpperCase()}
            </span>
        </div>
      </div>

      {/* Claim Details */}
      <div className="flex-grow flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="text-xl font-bold text-white mb-1">{claim.item.title}</h3>
              <div className="flex items-center text-sm text-gray-400 space-x-4">
                <span className="flex items-center"><MapPin className="w-3.5 h-3.5 mr-1 text-purple-400"/> {claim.item.location}</span>
                <span className="text-gray-600">•</span>
                <span>{new Date(claim.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            <div>{statusBadge(claim.status)}</div>
          </div>
          
          <div className="mt-4 p-4 bg-black/40 rounded-xl border border-white/5 relative">
            <div className="absolute -top-3 left-4 bg-black px-2 text-xs text-gray-500 font-semibold uppercase tracking-widest">
              {type === 'received' ? `Message from ${claim.user.name}` : 'Your Message'}
            </div>
            <p className="text-gray-300 text-sm italic">"{claim.message}"</p>
            {type === 'received' && (
               <p className="text-xs text-gray-500 mt-2">Contact email: {claim.user.email}</p>
            )}
          </div>
        </div>

        {/* Action Buttons (Only for Received and Pending) */}
        {type === "received" && claim.status === "pending" && (
          <div className="flex space-x-3 mt-6">
            <button
              onClick={() => onUpdate(claim._id, "accepted")}
              className="flex items-center px-4 py-2 bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30 rounded-lg text-sm font-semibold transition-colors"
            >
              <CheckCircle className="w-4 h-4 mr-2" /> Accept & Resolve
            </button>
            <button
              onClick={() => onUpdate(claim._id, "rejected")}
              className="flex items-center px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-sm font-semibold transition-colors"
            >
              <XCircle className="w-4 h-4 mr-2" /> Reject
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function InboxEmptyState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="bg-white/5 p-4 rounded-full">
        <Search className="w-10 h-10 text-gray-500" />
      </div>
      <p className="text-gray-400 font-medium">{message}</p>
    </div>
  );
}
