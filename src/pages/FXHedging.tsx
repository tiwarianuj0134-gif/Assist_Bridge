import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Shield, AlertTriangle, Activity, Zap, RefreshCw, BarChart3, ArrowRightLeft, Globe } from "lucide-react";
import { Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import type { Page } from "../App";
import { fxApi } from "../services/api";

interface Props { onNavigate: (p: Page) => void; }

const generatePriceData = () => {
  const data = [];
  let price = 82.45;
  for (let i = 0; i < 48; i++) {
    price += (Math.random() - 0.48) * 0.15;
    data.push({
      time: `${Math.floor(i / 2)}:${i % 2 === 0 ? "00" : "30"}`,
      price: Number(price.toFixed(2)),
      predicted: Number((price + (Math.random() - 0.5) * 0.3).toFixed(2)),
    });
  }
  return data;
};

const hedgePositions = [
  { id: 1, pair: "INR/GBP", type: "Forward", amount: "£25,000", rate: 103.50, current: 104.32, pnl: "+₹20,500", status: "Active", expiry: "Mar 2025" },
  { id: 2, pair: "INR/USD", type: "Option", amount: "$15,000", rate: 83.00, current: 82.45, pnl: "+₹8,250", status: "Active", expiry: "Apr 2025" },
  { id: 3, pair: "INR/EUR", type: "Swap", amount: "€10,000", rate: 88.50, current: 89.67, pnl: "+₹11,700", status: "Active", expiry: "Jun 2025" },
];

export function FXHedging({ onNavigate }: Props) {
  const [selectedPair, setSelectedPair] = useState("INR/USD");
  const [priceData, setPriceData] = useState(generatePriceData());
  const [autoHedge, setAutoHedge] = useState(true);
  const [liveUpdate, setLiveUpdate] = useState(0);
  const [fxPairs, setFxPairs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  void onNavigate;

  useEffect(() => {
    loadFXRates();
    
    const interval = setInterval(() => {
      setLiveUpdate(prev => prev + 1);
      setPriceData(generatePriceData());
      loadFXRates(); // Refresh rates every 5 seconds
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadFXRates = async () => {
    try {
      const response = await fxApi.getFXRates();
      if (response.status === 'success' && response.data) {
        setFxPairs(response.data as any[]);
      }
    } catch (error) {
      console.error('Failed to load FX rates:', error);
    } finally {
      setLoading(false);
    }
  };

  void liveUpdate;

  // Calculate volatility data from real FX rates
  const volatilityData = fxPairs.length > 0 ? fxPairs.map(fx => {
    const changeAbs = Math.abs(fx.change);
    let risk = "Low";
    if (changeAbs > 1.5) risk = "High";
    else if (changeAbs > 0.8) risk = "Medium";
    else if (changeAbs < 0.3) risk = "Very Low";
    
    return {
      currency: fx.pair.split('/')[1],
      vol: (changeAbs * 10).toFixed(1), // Scale for display
      risk
    };
  }) : [
    { currency: "USD", vol: "8.2", risk: "Low" },
    { currency: "GBP", vol: "12.5", risk: "Medium" },
    { currency: "EUR", vol: "10.1", risk: "Low" },
    { currency: "AED", vol: "3.2", risk: "Very Low" },
    { currency: "JPY", vol: "15.8", risk: "Medium" },
    { currency: "SGD", vol: "7.4", risk: "Low" },
  ];

  if (loading && fxPairs.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Loading FX rates...</div>
      </div>
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
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <ArrowRightLeft className="text-cyan-400" size={28} />
            <h1 className="text-3xl font-display font-bold text-white">Smart FX Hedging & Risk Engine</h1>
          </div>
          <p className="text-gray-500">AI-powered currency protection with live feeds & auto-hedging</p>
        </motion.div>

        {/* Live FX Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          {fxPairs.map((fx, i) => (
            <motion.div
              key={fx.pair}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setSelectedPair(fx.pair)}
              className={`rounded-2xl p-4 cursor-pointer transition-all ${
                selectedPair === fx.pair
                  ? "bg-blue-600/20 border border-blue-500/30"
                  : "glass hover:bg-white/10"
              }`}
              whileHover={{ y: -2 }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-gray-400">{fx.pair}</span>
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <div className="text-lg font-display font-bold text-white">{typeof fx.rate === 'number' ? fx.rate.toFixed(4) : fx.rate}</div>
              <div className={`flex items-center gap-1 text-xs font-medium ${fx.change >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {fx.change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {fx.change >= 0 ? "+" : ""}{typeof fx.change === 'number' ? fx.change.toFixed(2) : fx.change}%
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Main Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 glass rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-white">{selectedPair} Live Chart</h3>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs text-gray-500">Live • AI Prediction overlay</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-0.5 bg-blue-400" />
                  <span className="text-xs text-gray-500">Actual</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-0.5 bg-purple-400 opacity-50" />
                  <span className="text-xs text-gray-500">AI Predicted</span>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={priceData}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#4b5563" fontSize={10} interval={5} />
                <YAxis stroke="#4b5563" fontSize={10} domain={["auto", "auto"]} />
                <Tooltip contentStyle={{ background: "#1a2236", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "#fff" }} />
                <Area type="monotone" dataKey="price" stroke="#3b82f6" fill="url(#colorPrice)" strokeWidth={2} />
                <Line type="monotone" dataKey="predicted" stroke="#8b5cf6" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
              </AreaChart>
            </ResponsiveContainer>

            {/* Order Book Mini */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                <div className="text-xs text-gray-500 mb-1">Best Bid</div>
                <div className="text-lg font-bold text-emerald-400">{fxPairs.find(p => p.pair === selectedPair)?.bid}</div>
              </div>
              <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/10">
                <div className="text-xs text-gray-500 mb-1">Best Ask</div>
                <div className="text-lg font-bold text-red-400">{fxPairs.find(p => p.pair === selectedPair)?.ask}</div>
              </div>
            </div>
          </motion.div>

          {/* Right Column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            {/* Auto Hedge Toggle */}
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Shield size={18} className="text-cyan-400" />
                  <h4 className="font-semibold text-white">Auto-Hedging</h4>
                </div>
                <button
                  onClick={() => setAutoHedge(!autoHedge)}
                  className={`relative w-12 h-6 rounded-full transition-all cursor-pointer ${autoHedge ? "bg-emerald-500" : "bg-gray-600"}`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${autoHedge ? "translate-x-6" : "translate-x-0.5"}`} />
                </button>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                AI automatically hedges when currency volatility exceeds thresholds.
              </p>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Trigger Threshold</span>
                  <span className="text-white font-medium">±2.5%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Margin Call Level</span>
                  <span className="text-amber-400 font-medium">70%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Force Rebalance</span>
                  <span className="text-red-400 font-medium">85%</span>
                </div>
              </div>
            </div>

            {/* Volatility Index */}
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Activity size={18} className="text-amber-400" />
                <h4 className="font-semibold text-white">Volatility Index</h4>
              </div>
              <div className="space-y-3">
                {volatilityData.map((v, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">{v.currency}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-20 h-1.5 rounded-full bg-white/5">
                        <div
                          className={`h-full rounded-full ${parseFloat(v.vol) < 8 ? "bg-emerald-400" : parseFloat(v.vol) < 13 ? "bg-amber-400" : "bg-red-400"}`}
                          style={{ width: `${(parseFloat(v.vol) / 20) * 100}%` }}
                        />
                      </div>
                      <span className={`text-xs font-medium w-14 text-right ${
                        v.risk === "Very Low" || v.risk === "Low" ? "text-emerald-400" : "text-amber-400"
                      }`}>{v.vol}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Oracle Status */}
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Globe size={18} className="text-blue-400" />
                <h4 className="font-semibold text-white">Data Oracles</h4>
              </div>
              <div className="space-y-2">
                {[
                  { name: "Chainlink FX", status: "Active", latency: "120ms" },
                  { name: "Band Protocol", status: "Active", latency: "85ms" },
                  { name: "AI FX Model v3", status: "Active", latency: "45ms" },
                ].map((oracle, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span className="text-xs text-gray-300">{oracle.name}</span>
                    </div>
                    <span className="text-xs text-gray-500">{oracle.latency}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Active Hedge Positions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass rounded-2xl p-6 mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <BarChart3 size={20} className="text-purple-400" />
              <h3 className="text-lg font-semibold text-white">Active Hedge Positions</h3>
            </div>
            <motion.button
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-sm font-medium cursor-pointer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Zap size={14} />
              New Hedge
            </motion.button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-white/5">
                  <th className="pb-3 font-medium">Pair</th>
                  <th className="pb-3 font-medium">Type</th>
                  <th className="pb-3 font-medium">Amount</th>
                  <th className="pb-3 font-medium">Entry Rate</th>
                  <th className="pb-3 font-medium">Current</th>
                  <th className="pb-3 font-medium">P&L</th>
                  <th className="pb-3 font-medium">Expiry</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {hedgePositions.map((pos) => (
                  <tr key={pos.id} className="border-b border-white/5 hover:bg-white/5 transition-all">
                    <td className="py-4 text-sm font-medium text-white font-mono">{pos.pair}</td>
                    <td className="py-4">
                      <span className="px-2 py-1 rounded-lg bg-white/5 text-xs text-gray-300">{pos.type}</span>
                    </td>
                    <td className="py-4 text-sm text-white">{pos.amount}</td>
                    <td className="py-4 text-sm text-gray-400">{pos.rate}</td>
                    <td className="py-4 text-sm text-white font-medium">{pos.current}</td>
                    <td className="py-4 text-sm font-semibold text-emerald-400">{pos.pnl}</td>
                    <td className="py-4 text-sm text-gray-400">{pos.expiry}</td>
                    <td className="py-4">
                      <span className="px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium">{pos.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-xs text-gray-500">Total Hedged</span>
                <div className="text-lg font-bold text-white">₹40.45L</div>
              </div>
              <div>
                <span className="text-xs text-gray-500">Unrealized P&L</span>
                <div className="text-lg font-bold text-emerald-400">+₹40,450</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <RefreshCw size={12} className="animate-spin" />
              Auto-refreshing every 5s
            </div>
          </div>
        </motion.div>

        {/* Risk Alerts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass rounded-2xl p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={18} className="text-amber-400" />
            <h3 className="text-lg font-semibold text-white">Risk Alerts</h3>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { title: "GBP Volatility Spike", detail: "GBP/INR volatility increased 15% in last 24h. Auto-hedge trigger approaching.", level: "warning", time: "30m ago" },
              { title: "JPY Safe Haven Flow", detail: "JPY strengthening on global risk-off sentiment. Consider increasing JPY exposure.", level: "info", time: "2h ago" },
              { title: "Margin Level OK", detail: "All positions maintaining healthy margin levels. Lowest: 82% (INR/GBP).", level: "success", time: "Live" },
            ].map((alert, i) => (
              <div key={i} className={`p-4 rounded-xl border-l-2 ${
                alert.level === "warning" ? "bg-amber-500/5 border-amber-500" :
                alert.level === "info" ? "bg-blue-500/5 border-blue-500" :
                "bg-emerald-500/5 border-emerald-500"
              }`}>
                <h4 className="text-sm font-semibold text-white mb-1">{alert.title}</h4>
                <p className="text-xs text-gray-500 mb-2">{alert.detail}</p>
                <span className="text-xs text-gray-600">{alert.time}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
