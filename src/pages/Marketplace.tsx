import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, TrendingUp, Shield, DollarSign, Clock, ArrowUpRight, Calculator, Check, X, AlertCircle } from "lucide-react";
import type { Page } from "../App";
import { loansApi, assetsApi } from "../services/api";

interface Props { onNavigate: (p: Page) => void; }

export function Marketplace({ onNavigate }: Props) {
  const [showLoanForm, setShowLoanForm] = useState(false);
  const [loanAmount, setLoanAmount] = useState("");
  const [loanTenure, setLoanTenure] = useState("12");
  const [loanPurpose, setLoanPurpose] = useState("Personal");
  const [emiData, setEmiData] = useState<any>(null);
  const [creditLimit, setCreditLimit] = useState(0);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadCreditLimit();
  }, []);

  // Handle voice command prefill from sessionStorage
  useEffect(() => {
    const prefillData = sessionStorage.getItem('loanPrefill');
    if (prefillData) {
      try {
        const data = JSON.parse(prefillData);
        console.log('🎤 Voice command prefill:', data);
        setShowLoanForm(true);
        setLoanAmount(data.amount.toString());
        if (data.purpose) {
          setLoanPurpose(data.purpose);
        }
        // Clear sessionStorage
        sessionStorage.removeItem('loanPrefill');
      } catch (error) {
        console.error('Failed to parse prefill data:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (loanAmount && loanTenure) {
      calculateEMI();
    }
  }, [loanAmount, loanTenure]);

  const loadCreditLimit = async () => {
    try {
      console.log('Loading credit limit...');
      const response = await assetsApi.getCreditLimit();
      console.log('Credit limit response:', response);
      
      if (response.status === 'success' && response.data) {
        const data = response.data as any;
        const availableCredit = data.availableCredit || 0;
        console.log('Available credit:', availableCredit);
        setCreditLimit(availableCredit);
      } else {
        console.error('Failed to load credit limit:', response.error);
        setCreditLimit(0);
      }
    } catch (error) {
      console.error('Failed to load credit limit:', error);
      setCreditLimit(0);
    }
  };

  const calculateEMI = async () => {
    if (!loanAmount || !loanTenure) return;

    try {
      const response = await loansApi.calculateEMI({
        amount: parseFloat(loanAmount),
        tenure: parseInt(loanTenure)
      });

      if (response.status === 'success' && response.data) {
        setEmiData(response.data);
      }
    } catch (error) {
      console.error('Failed to calculate EMI:', error);
    }
  };

  const handleApplyLoan = async () => {
    if (!loanAmount || !loanTenure) {
      setErrorMessage("Please fill all fields");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    const amount = parseFloat(loanAmount);
    
    // Check if user has any credit limit
    if (creditLimit === 0) {
      setErrorMessage("Please lock assets first to get credit limit!");
      setTimeout(() => {
        setErrorMessage("");
        setShowLoanForm(false);
        onNavigate('assets');
      }, 3000);
      return;
    }
    
    if (amount > creditLimit) {
      setErrorMessage(`Amount exceeds available credit limit of ₹${creditLimit.toLocaleString()}`);
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    if (amount <= 0) {
      setErrorMessage("Please enter a valid loan amount");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    setLoading(true);
    try {
      console.log('Applying for loan:', { amount, tenure: parseInt(loanTenure), purpose: loanPurpose });
      
      const response = await loansApi.applyLoan({
        amount,
        tenure: parseInt(loanTenure),
        purpose: loanPurpose
      });

      console.log('Loan application response:', response);

      if (response.status === 'success') {
        setShowLoanForm(false);
        setLoanAmount("");
        setLoanTenure("12");
        setLoanPurpose("Personal");
        setEmiData(null);
        setSuccessMessage("Loan application submitted successfully! 🎉");
        setTimeout(() => {
          setSuccessMessage("");
          onNavigate('dashboard');
        }, 2000);
      } else {
        setErrorMessage(response.error?.message || "Failed to apply for loan");
        setTimeout(() => setErrorMessage(""), 3000);
      }
    } catch (error) {
      console.error('Failed to apply for loan:', error);
      setErrorMessage("Failed to connect to server. Please check if backend is running.");
      setTimeout(() => setErrorMessage(""), 5000);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)} Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    return `₹${value.toLocaleString()}`;
  };

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
              <Users className="text-emerald-400" size={28} />
              <h1 className="text-3xl font-display font-bold text-white">Get Credit</h1>
            </div>
            <motion.button
              onClick={() => setShowLoanForm(true)}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold flex items-center gap-2 cursor-pointer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <DollarSign size={20} />
              Apply for Loan
            </motion.button>
          </div>
          <p className="text-gray-500">Asset-backed instant credit</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Available Credit", value: formatCurrency(creditLimit), icon: <DollarSign size={18} />, color: "text-blue-400" },
            { label: "Interest Rate", value: "12% p.a.", icon: <TrendingUp size={18} />, color: "text-purple-400" },
            { label: "Max Tenure", value: "36 months", icon: <Clock size={18} />, color: "text-emerald-400" },
            { label: "Processing", value: "Instant", icon: <Shield size={18} />, color: "text-amber-400" },
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

        {/* How It Works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-2xl p-8 mb-8"
        >
          <h2 className="text-2xl font-display font-bold text-white mb-6">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: "1", title: "Lock Assets", desc: "Lock your assets in the vault" },
              { step: "2", title: "Apply for Loan", desc: "Submit loan application with amount & tenure" },
              { step: "3", title: "Admin Review", desc: "Quick verification by our team" },
              { step: "4", title: "Get Credit", desc: "Instant disbursement to your account" },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-xl mx-auto mb-3">
                  {item.step}
                </div>
                <h3 className="text-white font-semibold mb-1">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Benefits */}
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { title: "No Selling Required", desc: "Keep your assets while accessing credit", icon: <Shield size={24} /> },
            { title: "Instant Approval", desc: "Get credit within minutes of application", icon: <Clock size={24} /> },
            { title: "Flexible Repayment", desc: "Choose tenure from 6 to 36 months", icon: <TrendingUp size={24} /> },
          ].map((benefit, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="glass rounded-2xl p-6"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
                {benefit.icon}
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{benefit.title}</h3>
              <p className="text-sm text-gray-500">{benefit.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Loan Application Modal */}
        <AnimatePresence>
          {showLoanForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
              onClick={() => !loading && setShowLoanForm(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="w-full max-w-2xl glass-strong rounded-3xl p-8 max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-display font-bold text-white">Apply for Loan</h3>
                  <button 
                    onClick={() => !loading && setShowLoanForm(false)} 
                    className="text-gray-400 hover:text-white"
                    disabled={loading}
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Available Credit */}
                  <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <div className="text-sm text-gray-400 mb-1">Available Credit Limit</div>
                    <div className="text-2xl font-display font-bold text-blue-400">{formatCurrency(creditLimit)}</div>
                  </div>

                  {/* Loan Amount */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Loan Amount (₹)</label>
                    <input
                      type="number"
                      value={loanAmount}
                      onChange={(e) => setLoanAmount(e.target.value)}
                      placeholder="e.g., 500000"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-lg placeholder-gray-500 focus:outline-none focus:border-blue-500"
                      disabled={loading}
                    />
                  </div>

                  {/* Tenure */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Tenure (Months)</label>
                    <select
                      value={loanTenure}
                      onChange={(e) => setLoanTenure(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500 [&>option]:bg-gray-800 [&>option]:text-white"
                      disabled={loading}
                    >
                      <option value="6" className="bg-gray-800 text-white">6 Months</option>
                      <option value="12" className="bg-gray-800 text-white">12 Months</option>
                      <option value="18" className="bg-gray-800 text-white">18 Months</option>
                      <option value="24" className="bg-gray-800 text-white">24 Months</option>
                      <option value="36" className="bg-gray-800 text-white">36 Months</option>
                    </select>
                  </div>

                  {/* Purpose */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Purpose</label>
                    <select
                      value={loanPurpose}
                      onChange={(e) => setLoanPurpose(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500 [&>option]:bg-gray-800 [&>option]:text-white"
                      disabled={loading}
                    >
                      <option value="Personal" className="bg-gray-800 text-white">Personal</option>
                      <option value="Business" className="bg-gray-800 text-white">Business</option>
                      <option value="Education" className="bg-gray-800 text-white">Education</option>
                      <option value="Medical" className="bg-gray-800 text-white">Medical</option>
                      <option value="Travel" className="bg-gray-800 text-white">Travel</option>
                      <option value="Other" className="bg-gray-800 text-white">Other</option>
                    </select>
                  </div>

                  {/* EMI Calculation */}
                  {emiData && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-6 rounded-xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20"
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <Calculator size={20} className="text-purple-400" />
                        <h4 className="text-lg font-semibold text-white">EMI Breakdown</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-gray-400 mb-1">Monthly EMI</div>
                          <div className="text-2xl font-display font-bold text-white">₹{emiData.emi.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-400 mb-1">Interest Rate</div>
                          <div className="text-xl font-semibold text-purple-400">{emiData.interestRate}% p.a.</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-400 mb-1">Total Interest</div>
                          <div className="text-lg font-semibold text-amber-400">₹{emiData.totalInterest.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-400 mb-1">Total Payment</div>
                          <div className="text-lg font-semibold text-emerald-400">₹{emiData.totalPayment.toLocaleString()}</div>
                        </div>
                      </div>
                      <div className="mt-4 p-3 rounded-lg bg-white/5">
                        <div className="text-xs text-gray-400 mb-2">Payment Formula</div>
                        <div className="text-xs font-mono text-gray-300">
                          EMI = P × r × (1 + r)^n / ((1 + r)^n - 1)
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          P = Principal (₹{emiData.principal.toLocaleString()}), r = Monthly Rate ({(emiData.interestRate/12).toFixed(2)}%), n = Tenure ({emiData.tenure} months)
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Submit Button */}
                  <div className="sticky bottom-0 -mx-8 -mb-8 p-6 bg-gradient-to-t from-dark-900 via-dark-900/95 to-transparent">
                    <motion.button
                      onClick={handleApplyLoan}
                      disabled={loading || !loanAmount || !loanTenure}
                      className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
                      whileHover={!loading ? { scale: 1.02 } : {}}
                      whileTap={!loading ? { scale: 0.98 } : {}}
                    >
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <ArrowUpRight size={20} />
                          Submit Application
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
