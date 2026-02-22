import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDownLeft, Shield, Zap, Users, DollarSign, TrendingUp, CheckCircle, ArrowRight, Home, CreditCard, Sparkles, Lock } from "lucide-react";
import type { Page } from "../App";

interface Props { onNavigate: (p: Page) => void; }

const beneficiaries = [
  { id: 1, name: "Rajesh Mehta (Father)", relation: "Parent", country: "🇮🇳 India", creditLine: "₹40,00,000", backed: "$50,000 US Stocks", status: "Active", utilization: 35 },
  { id: 2, name: "Sunita Mehta (Mother)", relation: "Parent", country: "🇮🇳 India", creditLine: "₹15,00,000", backed: "$18,750 US FD", status: "Active", utilization: 12 },
  { id: 3, name: "Vikram Mehta (Brother)", relation: "Sibling", country: "🇮🇳 India", creditLine: "₹25,00,000", backed: "£20,000 UK Bonds", status: "Pending", utilization: 0 },
];

const comparisonData = [
  { feature: "Processing Time", traditional: "3-5 Business Days", assetbridge: "Instant (< 2 min)" },
  { feature: "Currency Conversion", traditional: "Required (2-5% loss)", assetbridge: "Not Required" },
  { feature: "Remittance Fees", traditional: "$25-50 per transfer", assetbridge: "0.5% one-time" },
  { feature: "Asset Impact", traditional: "Must sell/convert", assetbridge: "Assets keep growing" },
  { feature: "Credit Building", traditional: "No credit benefit", assetbridge: "Builds global credit" },
  { feature: "Tax Efficiency", traditional: "Capital gains triggered", assetbridge: "Tax neutral" },
];

export function ReverseRemittance({ onNavigate }: Props) {
  const [showFlow, setShowFlow] = useState(false);
  const [flowStep, setFlowStep] = useState(0);
  void onNavigate;

  const startFlow = () => {
    setShowFlow(true);
    setFlowStep(1);
    setTimeout(() => setFlowStep(2), 1500);
    setTimeout(() => setFlowStep(3), 3000);
    setTimeout(() => setFlowStep(4), 4500);
    setTimeout(() => setFlowStep(5), 6000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pt-20 pb-8 px-4 min-h-screen"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <ArrowDownLeft className="text-green-400" size={28} />
            <h1 className="text-3xl font-display font-bold text-white">Reverse Remittance Shield</h1>
          </div>
          <p className="text-gray-500">Foreign assets → Domestic credit. No conversion. No fees. Instant.</p>
        </motion.div>

        {/* Hero Explainer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-3xl p-8 mb-8 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-green-600/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl" />
          
          <div className="relative grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 text-green-400 text-sm mb-4">
                <Sparkles size={14} />
                Revolutionary Feature
              </div>
              <h2 className="text-3xl font-display font-bold text-white mb-4">
                Your Foreign Income Works
                <span className="bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent"> From Abroad</span>
              </h2>
              <p className="text-gray-400 mb-6 leading-relaxed">
                Instead of converting and remitting money (losing 3-5% in fees), lock your foreign assets and give your family instant INR credit at home. Assets keep earning returns while family gets credit.
              </p>
              <motion.button
                onClick={startFlow}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-600 to-cyan-600 text-white font-semibold flex items-center gap-2 cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Zap size={18} />
                See How It Works
              </motion.button>
            </div>

            {/* Visual Flow */}
            <div className="flex flex-col items-center gap-4">
              <motion.div className="glass rounded-2xl p-4 w-full max-w-xs text-center" whileHover={{ scale: 1.02 }}>
                <div className="text-2xl mb-2">🇺🇸</div>
                <div className="font-semibold text-white">Arjun in USA</div>
                <div className="text-sm text-gray-500">$50,000 US Stocks</div>
                <div className="mt-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs inline-block">Assets Locked</div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="flex flex-col items-center gap-1"
              >
                <Lock size={16} className="text-purple-400" />
                <div className="w-0.5 h-6 bg-gradient-to-b from-purple-400 to-green-400" />
                <ArrowRight size={16} className="text-green-400 rotate-90" />
              </motion.div>

              <motion.div className="glass rounded-2xl p-4 w-full max-w-xs text-center" whileHover={{ scale: 1.02 }}>
                <div className="text-2xl mb-2">🇮🇳</div>
                <div className="font-semibold text-white">Parents in India</div>
                <div className="text-sm text-gray-500">₹40L INR Credit Line</div>
                <div className="mt-2 px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs inline-block">Instant Access</div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Fees Saved", value: "₹3.2L", icon: <DollarSign size={18} />, color: "text-green-400" },
            { label: "Active Lines", value: "2", icon: <CreditCard size={18} />, color: "text-blue-400" },
            { label: "Total Backed", value: "$68,750", icon: <Shield size={18} />, color: "text-purple-400" },
            { label: "Family Score", value: "+120 pts", icon: <TrendingUp size={18} />, color: "text-cyan-400" },
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

        {/* Beneficiaries */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-2xl p-6 mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Users size={20} className="text-green-400" />
              <h3 className="text-lg font-semibold text-white">Family Beneficiaries</h3>
            </div>
            <motion.button
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-green-600 to-cyan-600 text-white text-sm font-medium cursor-pointer"
              whileHover={{ scale: 1.05 }}
            >
              + Add Beneficiary
            </motion.button>
          </div>

          <div className="space-y-4">
            {beneficiaries.map((b, i) => (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col md:flex-row md:items-center justify-between p-5 rounded-xl bg-white/5 hover:bg-white/10 transition-all gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-cyan-500/20 flex items-center justify-center">
                    <Home size={20} className="text-green-400" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">{b.name}</div>
                    <div className="text-sm text-gray-500">{b.relation} • {b.country}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1 md:max-w-xl">
                  <div>
                    <div className="text-xs text-gray-500">Credit Line</div>
                    <div className="text-sm font-semibold text-white">{b.creditLine}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Backed By</div>
                    <div className="text-sm font-semibold text-blue-400">{b.backed}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Utilization</div>
                    <div className="w-full h-2 rounded-full bg-white/5 mt-1">
                      <div className={`h-full rounded-full ${b.utilization < 50 ? "bg-green-400" : "bg-amber-400"}`} style={{ width: `${b.utilization}%` }} />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{b.utilization}%</div>
                  </div>
                  <div className="flex items-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      b.status === "Active" ? "bg-green-500/20 text-green-400" : "bg-amber-500/20 text-amber-400"
                    }`}>
                      {b.status}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass rounded-2xl p-6 mb-8"
        >
          <h3 className="text-lg font-semibold text-white mb-6">Traditional Remittance vs AssetBridge</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs border-b border-white/5">
                  <th className="pb-3 font-medium text-gray-500">Feature</th>
                  <th className="pb-3 font-medium text-red-400">Traditional ❌</th>
                  <th className="pb-3 font-medium text-green-400">AssetBridge ✅</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="py-3 text-sm text-white font-medium">{row.feature}</td>
                    <td className="py-3 text-sm text-gray-500">{row.traditional}</td>
                    <td className="py-3 text-sm text-green-400 font-medium">{row.assetbridge}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { icon: <DollarSign size={24} />, title: "Zero Conversion Loss", desc: "No currency exchange needed. Assets stay in original currency while family gets INR credit.", color: "from-green-500 to-green-600" },
            { icon: <TrendingUp size={24} />, title: "Assets Keep Growing", desc: "US stocks or UK bonds continue earning returns. You don't sacrifice growth for family needs.", color: "from-blue-500 to-blue-600" },
            { icon: <Shield size={24} />, title: "Tax Efficient", desc: "No capital gains triggered. No remittance reporting. Clean, compliant, and efficient.", color: "from-purple-500 to-purple-600" },
          ].map((b, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="glass rounded-2xl p-6"
              whileHover={{ y: -3 }}
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${b.color} flex items-center justify-center text-white mb-4`}>
                {b.icon}
              </div>
              <h4 className="font-semibold text-white mb-2">{b.title}</h4>
              <p className="text-sm text-gray-500 leading-relaxed">{b.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Flow Animation Modal */}
      <AnimatePresence>
        {showFlow && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => { setShowFlow(false); setFlowStep(0); }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-lg glass-strong rounded-3xl p-8"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-xl font-display font-bold text-white mb-2 text-center">
                Reverse Remittance Flow
              </h3>
              <p className="text-sm text-gray-500 text-center mb-8">Watch how it works in real-time</p>

              <div className="space-y-4">
                {[
                  { step: 1, label: "Lock Foreign Assets", detail: "$50,000 US Stocks locked with US custodian", emoji: "🔒" },
                  { step: 2, label: "Mint RWA Token", detail: "ERC-721 token minted on Polygon", emoji: "🪙" },
                  { step: 3, label: "Verify Beneficiary", detail: "KYC verification for Rajesh Mehta (Father)", emoji: "✅" },
                  { step: 4, label: "Create INR Credit Line", detail: "₹40,00,000 credit line activated", emoji: "💳" },
                  { step: 5, label: "Ready to Use!", detail: "Family can access INR credit instantly", emoji: "🎉" },
                ].map((s) => (
                  <motion.div
                    key={s.step}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: flowStep >= s.step ? 1 : 0.2, x: 0 }}
                    className="flex items-center gap-4"
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${
                      flowStep > s.step ? "bg-green-500/20" :
                      flowStep === s.step ? "bg-blue-500/20 animate-pulse" :
                      "bg-white/5"
                    }`}>
                      {flowStep > s.step ? <CheckCircle size={20} className="text-green-400" /> : s.emoji}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">{s.label}</div>
                      <div className="text-xs text-gray-500">{s.detail}</div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {flowStep === 5 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-center"
                >
                  <p className="text-green-300 font-semibold">🎉 Reverse Remittance Active!</p>
                  <p className="text-xs text-gray-500 mt-1">Savings vs traditional: ₹1,60,000 in fees</p>
                </motion.div>
              )}

              <button
                onClick={() => { setShowFlow(false); setFlowStep(0); }}
                className="w-full mt-6 py-3 rounded-xl glass text-white text-sm font-medium cursor-pointer hover:bg-white/10 transition-all"
              >
                {flowStep === 5 ? "Close" : "Cancel"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
