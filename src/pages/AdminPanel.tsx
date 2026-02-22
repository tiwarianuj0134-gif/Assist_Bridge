import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Users, Lock, DollarSign, Check, X, AlertCircle, TrendingUp, Clock } from "lucide-react";
import type { Page } from "../App";
import { loansApi, authApi } from "../services/api";

interface Props { onNavigate: (p: Page) => void; }

export function AdminPanel({ onNavigate: _onNavigate }: Props) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [pendingLoans, setPendingLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    // Check if user is logged in and has admin token
    const user = localStorage.getItem('assetbridge_user');
    if (user) {
      try {
        const parsed = JSON.parse(user);
        if (parsed.accessToken) {
          setIsLoggedIn(true);
          loadPendingLoans();
        }
      } catch (error) {
        console.error('Failed to parse user data:', error);
      }
    }
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    setErrorMessage("");
    
    try {
      // Use real admin credentials
      const email = username || 'assistbridge15@gmail.com';
      const pwd = password || 'Anuj@1234';
      
      console.log('🔐 Attempting admin login:', email);
      
      const response = await authApi.login({
        email: email,
        password: pwd
      });

      if (response.status === 'success' && response.data) {
        const data = response.data as any;
        
        // Store user data with token
        localStorage.setItem('assetbridge_user', JSON.stringify({
          accessToken: data.accessToken,
          user: data.user
        }));
        
        setIsLoggedIn(true);
        console.log('✅ Admin logged in successfully');
        await loadPendingLoans();
      } else {
        setErrorMessage(response.error?.message || "Login failed");
        setTimeout(() => setErrorMessage(""), 3000);
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrorMessage("Failed to connect to server");
      setTimeout(() => setErrorMessage(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('assetbridge_user');
    setUsername("");
    setPassword("");
    setPendingLoans([]);
  };

  const loadPendingLoans = async () => {
    try {
      console.log('Loading pending loans...');
      setLoading(true);
      const response = await loansApi.getPendingLoans();
      console.log('Pending loans response:', response);
      
      if (response.status === 'success' && response.data) {
        const data = response.data as any;
        const loans = data.loans || [];
        console.log('Pending loans count:', loans.length);
        console.log('Pending loans data:', loans);
        setPendingLoans(loans);
      } else {
        console.error('Failed to load loans:', response.error);
        setErrorMessage(response.error?.message || 'Failed to load pending loans');
        setTimeout(() => setErrorMessage(""), 3000);
      }
    } catch (error) {
      console.error('Failed to load pending loans:', error);
      setErrorMessage('Failed to connect to server');
      setTimeout(() => setErrorMessage(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveLoan = async (loanId: string) => {
    console.log('Approving loan:', loanId);
    setLoading(true);
    try {
      const response = await loansApi.approveLoan(loanId, 'APPROVE');
      console.log('Approve loan response:', response);
      
      if (response.status === 'success') {
        setSuccessMessage("Loan approved and disbursed! 🎉");
        setTimeout(() => setSuccessMessage(""), 3000);
        await loadPendingLoans();
      } else {
        console.error('Failed to approve loan:', response.error);
        setErrorMessage(response.error?.message || "Failed to approve loan");
        setTimeout(() => setErrorMessage(""), 3000);
      }
    } catch (error) {
      console.error('Failed to approve loan:', error);
      setErrorMessage("Failed to approve loan");
      setTimeout(() => setErrorMessage(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectLoan = async (loanId: string) => {
    const reason = prompt("Enter rejection reason:");
    if (!reason) return;

    setLoading(true);
    try {
      const response = await loansApi.rejectLoan(loanId, reason);
      if (response.status === 'success') {
        setSuccessMessage("Loan rejected");
        setTimeout(() => setSuccessMessage(""), 3000);
        await loadPendingLoans();
      } else {
        setErrorMessage(response.error?.message || "Failed to reject loan");
        setTimeout(() => setErrorMessage(""), 3000);
      }
    } catch (error) {
      console.error('Failed to reject loan:', error);
      setErrorMessage("Failed to reject loan");
      setTimeout(() => setErrorMessage(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)} Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    return `₹${value.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isLoggedIn) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="min-h-screen flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          className="w-full max-w-md glass-strong rounded-3xl p-8"
        >
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
              <Shield size={32} className="text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-display font-bold text-white text-center mb-2">Admin Panel</h2>
          <p className="text-gray-500 text-center mb-8">Login to access admin dashboard</p>

          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              {errorMessage}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="assistbridge15@gmail.com"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Anuj@1234"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <motion.button
              onClick={handleLogin}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
            >
              {loading ? 'Logging in...' : 'Login'}
            </motion.button>
          </div>

          <div className="mt-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <div className="text-xs text-gray-400 mb-2">Admin Credentials:</div>
            <div className="text-sm text-blue-400 font-mono">
              Email: assistbridge15@gmail.com<br />
              Password: Anuj@1234
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pt-20 pb-8 px-4 min-h-screen"
    >
      <div className="max-w-7xl mx-auto">
        {/* Success/Error Messages */}
        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-24 right-4 z-50 glass-strong rounded-xl p-4 border border-emerald-500/30"
            >
              <div className="flex items-center gap-2 text-emerald-400">
                <Check size={20} />
                <span className="font-medium">{successMessage}</span>
              </div>
            </motion.div>
          )}
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-24 right-4 z-50 glass-strong rounded-xl p-4 border border-red-500/30"
            >
              <div className="flex items-center gap-2 text-red-400">
                <AlertCircle size={20} />
                <span className="font-medium">{errorMessage}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Shield className="text-purple-400" size={28} />
              <h1 className="text-3xl font-display font-bold text-white">Admin Dashboard</h1>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-xl glass text-white text-sm font-medium cursor-pointer hover:bg-white/10 transition-all"
            >
              Logout
            </button>
          </div>
          <p className="text-gray-500">Manage loan requests and verifications</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Pending Loans", value: pendingLoans.length.toString(), icon: <Clock size={18} />, color: "text-amber-400" },
            { label: "Total Users", value: "24", icon: <Users size={18} />, color: "text-blue-400" },
            { label: "Locked Assets", value: "₹2.4 Cr", icon: <Lock size={18} />, color: "text-purple-400" },
            { label: "Disbursed", value: "₹1.8 Cr", icon: <DollarSign size={18} />, color: "text-emerald-400" },
          ].map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass rounded-2xl p-4"
            >
              <div className={`mb-2 ${s.color}`}>{s.icon}</div>
              <div className="text-xl font-display font-bold text-white">{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Pending Loan Requests */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-2xl p-6 mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-display font-bold text-white">Pending Loan Requests</h2>
            <button
              onClick={loadPendingLoans}
              className="px-3 py-1 rounded-lg glass text-sm text-gray-400 hover:text-white cursor-pointer"
            >
              Refresh
            </button>
          </div>

          {pendingLoans.length === 0 ? (
            <div className="text-center py-12">
              <Check size={48} className="text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No Pending Requests</h3>
              <p className="text-gray-500">All loan requests have been processed</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingLoans.map((loan, i) => (
                <motion.div
                  key={loan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-5 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center text-blue-400 font-bold flex-shrink-0">
                        {loan.borrower_name?.charAt(0) || 'U'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-white">{loan.borrower_name || 'Unknown User'}</span>
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400">
                            Under Review
                          </span>
                        </div>
                        <div className="text-sm text-gray-500 mb-2">{loan.borrower_email}</div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                          <div>
                            <div className="text-xs text-gray-500">Amount</div>
                            <div className="text-sm font-semibold text-white">{formatCurrency(loan.amount)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Tenure</div>
                            <div className="text-sm font-semibold text-blue-400">{loan.tenure_months} months</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">EMI</div>
                            <div className="text-sm font-semibold text-purple-400">₹{loan.emi_amount.toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Purpose</div>
                            <div className="text-sm font-semibold text-gray-300">{loan.purpose}</div>
                          </div>
                        </div>
                        <div className="text-xs text-gray-600 mt-2">
                          Applied: {formatDate(loan.created_at)}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 flex-shrink-0">
                      <motion.button
                        onClick={() => handleApproveLoan(loan.id)}
                        disabled={loading}
                        className="px-4 py-2 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 text-sm font-medium flex items-center gap-2 cursor-pointer hover:bg-emerald-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        whileHover={!loading ? { scale: 1.05 } : {}}
                        whileTap={!loading ? { scale: 0.95 } : {}}
                      >
                        <Check size={16} />
                        Approve
                      </motion.button>
                      <motion.button
                        onClick={() => handleRejectLoan(loan.id)}
                        disabled={loading}
                        className="px-4 py-2 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30 text-sm font-medium flex items-center gap-2 cursor-pointer hover:bg-red-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        whileHover={!loading ? { scale: 1.05 } : {}}
                        whileTap={!loading ? { scale: 0.95 } : {}}
                      >
                        <X size={16} />
                        Reject
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { title: "View All Users", desc: "Manage user accounts", icon: <Users size={24} />, action: () => alert('Feature coming soon!') },
            { title: "Asset Verification", desc: "Review locked assets", icon: <Lock size={24} />, action: () => alert('Feature coming soon!') },
            { title: "Analytics", desc: "View platform metrics", icon: <TrendingUp size={24} />, action: () => alert('Feature coming soon!') },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              onClick={item.action}
              className="glass rounded-2xl p-6 cursor-pointer hover:bg-white/10 transition-all"
              whileHover={{ y: -3 }}
            >
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
                {item.icon}
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
              <p className="text-sm text-gray-500">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
