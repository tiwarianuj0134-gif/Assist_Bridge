import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, User, Phone, ArrowRight, Globe, Eye, EyeOff, TrendingUp, DollarSign } from "lucide-react";

interface Props {
  onRegister: (email: string, password: string, firstName: string, lastName: string, phone: string, accountType: 'BORROWER' | 'INVESTOR') => void;
  onSwitchToLogin: () => void;
}

export function Register({ onRegister, onSwitchToLogin }: Props) {
  const [accountType, setAccountType] = useState<'BORROWER' | 'INVESTOR'>('BORROWER');
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords don't match!");
      return;
    }
    if (!agreed) {
      alert("Please agree to terms and conditions");
      return;
    }
    onRegister(formData.email, formData.password, formData.firstName, formData.lastName, formData.phone, accountType);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-dark-900" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "3s" }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center animate-pulse-glow">
            <Globe size={24} className="text-white" />
          </div>
          <span className="font-display font-bold text-2xl bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            AssetBridge
          </span>
        </div>

        {/* Register Card */}
        <div className="glass rounded-3xl p-8">
          <h2 className="text-3xl font-display font-bold text-white mb-2">Create Account</h2>
          <p className="text-gray-400 mb-8">Join thousands of users accessing global credit</p>

          {/* Account Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">I want to:</label>
            <div className="grid grid-cols-2 gap-4">
              <motion.button
                type="button"
                onClick={() => setAccountType('BORROWER')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  accountType === 'BORROWER'
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <TrendingUp className={`w-8 h-8 mx-auto mb-2 ${accountType === 'BORROWER' ? 'text-blue-400' : 'text-gray-400'}`} />
                <div className="font-semibold text-white">Borrow</div>
                <div className="text-xs text-gray-400 mt-1">Get loans using my assets</div>
              </motion.button>

              <motion.button
                type="button"
                onClick={() => setAccountType('INVESTOR')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  accountType === 'INVESTOR'
                    ? 'border-green-500 bg-green-500/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <DollarSign className={`w-8 h-8 mx-auto mb-2 ${accountType === 'INVESTOR' ? 'text-green-400' : 'text-gray-400'}`} />
                <div className="font-semibold text-white">Invest</div>
                <div className="text-xs text-gray-400 mt-1">Fund loans & earn returns</div>
              </motion.button>
            </div>
            {accountType === 'INVESTOR' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20"
              >
                <p className="text-sm text-green-400 flex items-center gap-2">
                  <DollarSign size={16} />
                  You'll start with $100,000 demo balance to test investing!
                </p>
              </motion.div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">First Name</label>
                <div className="relative">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="John"
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-all"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Last Name</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Doe"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-all"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="you@example.com"
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-all"
                  required
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Phone Number</label>
              <div className="relative">
                <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-all"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-all"
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

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-all"
                  required
                />
              </div>
            </div>

            {/* Terms */}
            <label className="flex items-start gap-3 text-sm text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 rounded"
              />
              <span>
                I agree to the{" "}
                <span className="text-blue-400 hover:text-blue-300">Terms of Service</span> and{" "}
                <span className="text-blue-400 hover:text-blue-300">Privacy Policy</span>
              </span>
            </label>

            {/* Submit */}
            <motion.button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-blue-500/25 transition-all"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Create Account
              <ArrowRight size={18} />
            </motion.button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-sm text-gray-500">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Login Link */}
          <p className="text-center text-gray-400">
            Already have an account?{" "}
            <button
              onClick={onSwitchToLogin}
              className="text-blue-400 hover:text-blue-300 font-semibold"
            >
              Sign In
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
