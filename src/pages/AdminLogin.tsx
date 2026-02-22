import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight, Shield, Eye, EyeOff } from "lucide-react";

interface Props {
  onAdminLogin: (email: string, password: string) => void;
  onBack: () => void;
}

export function AdminLogin({ onAdminLogin, onBack }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // CRITICAL: Only allow specific admin credentials
    if (email === "tiwarianuj0134@gmail.com" && password === "Anuj@1234") {
      onAdminLogin(email, password);
    } else {
      setError("Access Denied: Invalid admin credentials");
      // Clear password field
      setPassword("");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-dark-900" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "3s" }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center animate-pulse-glow">
            <Shield size={24} className="text-white" />
          </div>
          <span className="font-display font-bold text-2xl bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
            Admin Access
          </span>
        </div>

        {/* Admin Login Card */}
        <div className="glass rounded-3xl p-8 border-2 border-red-500/20">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield size={20} className="text-red-400" />
            <h2 className="text-2xl font-display font-bold text-white">Restricted Area</h2>
          </div>
          <p className="text-gray-400 mb-8 text-center text-sm">Authorized personnel only</p>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30"
            >
              <p className="text-red-400 text-sm text-center font-medium">{error}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Admin Email</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@assetbridge.com"
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-all"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Admin Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 text-white font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-red-500/25 transition-all"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Access Admin Panel
              <ArrowRight size={18} />
            </motion.button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-sm text-gray-500">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Back Link */}
          <p className="text-center text-gray-400">
            Not an admin?{" "}
            <button
              onClick={onBack}
              className="text-blue-400 hover:text-blue-300 font-semibold"
            >
              Go to User Login
            </button>
          </p>
        </div>

        {/* Security Notice */}
        <div className="mt-8 p-4 rounded-xl bg-red-500/5 border border-red-500/20">
          <p className="text-xs text-red-400 text-center">
            🔒 This area is monitored. Unauthorized access attempts will be logged.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
