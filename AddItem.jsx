import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import Navbar from "../components/Navbar";
import { UploadCloud, MapPin, AlignLeft, Type, AlertCircle } from "lucide-react";

export default function AddItem() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState("lost");
  const [image, setImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  // Simple predefined images for demonstration
  const imagePresets = [
    { label: "Keys", url: "/images/keys.png" },
    { label: "Wallet", url: "/images/wallet.png" },
    { label: "Pet", url: "/images/pet.png" },
    { label: "Custom URL", url: "custom" },
  ];
  const [imageType, setImageType] = useState(imagePresets[0].url);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const finalImage = imageType === "custom" ? image : imageType;

    try {
      await API.post("/items/add", {
        title,
        description,
        location,
        type,
        image: finalImage,
      });

      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Error reporting item");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]">
      <Navbar />

      <main className="flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-xl">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
            
            {/* Top Decor */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500"></div>
            
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 mb-2">
                Report an Item
              </h2>
              <p className="text-gray-400">Provide details about what you've lost or found.</p>
            </div>

            {error && (
              <div className="flex items-center space-x-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-4 rounded-xl mb-6">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Type Toggle */}
              <div className="flex p-1 bg-black/50 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setType("lost")}
                  className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                    type === "lost" ? "bg-red-500/20 text-red-400 shadow-sm" : "text-gray-400 hover:text-white"
                  }`}
                >
                  I Lost Something
                </button>
                <button
                  type="button"
                  onClick={() => setType("found")}
                  className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                    type === "found" ? "bg-green-500/20 text-green-400 shadow-sm" : "text-gray-400 hover:text-white"
                  }`}
                >
                  I Found Something
                </button>
              </div>

              {/* Title */}
              <div className="relative group">
                <Type className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
                <input
                  placeholder="What is the item?"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                  required
                />
              </div>

              {/* Description */}
              <div className="relative group">
                <AlignLeft className="absolute left-4 top-4 w-5 h-5 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
                <textarea
                  placeholder="Describe the item in detail (color, brand, identifying marks)..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all resize-none"
                  rows={4}
                  required
                />
              </div>

              {/* Location */}
              <div className="relative group">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
                <input
                  placeholder="Where was it lost/found?"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                  required
                />
              </div>

              {/* Image Selection */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-400">Item Image</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {imagePresets.map((preset) => (
                    <div 
                      key={preset.url}
                      onClick={() => setImageType(preset.url)}
                      className={`cursor-pointer rounded-xl border-2 overflow-hidden transition-all relative ${
                        imageType === preset.url ? "border-purple-500 opacity-100" : "border-white/10 opacity-50 hover:opacity-80"
                      }`}
                    >
                      {preset.url !== "custom" ? (
                        <>
                          <img src={preset.url} alt={preset.label} className="w-full h-16 object-cover" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <span className="text-xs font-semibold text-white drop-shadow-md">{preset.label}</span>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-16 flex flex-col items-center justify-center bg-gray-900">
                          <UploadCloud className="w-5 h-5 text-gray-400 mb-1" />
                          <span className="text-[10px] uppercase font-bold text-gray-400">Custom</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {imageType === "custom" && (
                  <input
                    placeholder="Paste an image URL here..."
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all mt-3"
                  />
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-8 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold py-4 rounded-xl shadow-lg shadow-purple-500/25 transition-all disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  "Post Item"
                )}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}