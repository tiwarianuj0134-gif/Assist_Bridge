import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, CreditCard, Globe, Shield, Lock, ArrowUpRight, DollarSign, BarChart3, Activity, Wallet, Eye, AlertTriangle } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import type { Page } from "../App";
import { userApi, aiApi, fxApi, loansApi } from "../services/api";

interface Props { onNavigate: (p: Page) => void; }

const portfolioData = [
  { month: "Jan", value: 1800000 }, { month: "Feb", value: 1950000 }, { month: "Mar", value: 2100000 },
  { month: "Apr", value: 2050000 }, { month: "May", value: 2300000 }, { month: "Jun", value: 2400000 },
  { month: "Jul", value: 2350000 }, { month: "Aug", value: 2550000 }, { month: "Sep", value: 2700000 },
  { month: "Oct", value: 2650000 }, { month: "Nov", value: 2900000 }, { month: "Dec", value: 3100000 },
];

const assetAllocation = [
  { name: "Fixed Deposits", value: 35, color: "#3b82f6" },
  { name: "Stocks", value: 25, color: "#8b5cf6" },
  { name: "Gold", value: 15, color: "#f59e0b" },
  { name: "Real Estate", value: 20, color: "#10b981" },
  { name: "Mutual Funds", value: 5, color: "#ef4444" },
];

const recentTransactions = [
  { id: 1, type: "Lock", asset: "HDFC Fixed Deposit", amount: "₹15,00,000", status: "Completed", time: "2h ago", icon: <Lock size={16} /> },
  { id: 2, type: "Loan", asset: "GBP Overdraft", amount: "£12,500", status: "Active", time: "5h ago", icon: <CreditCard size={16} /> },
  { id: 3, type: "Token", asset: "RWA-GOLD-042", amount: "₹8,50,000", status: "Minted", time: "1d ago", icon: <Shield size={16} /> },
  { id: 4, type: "P2P", asset: "Lending Pool #7", amount: "$5,000", status: "Earning", time: "3d ago", icon: <TrendingUp size={16} /> },
];

// FX rates will be fetched from API

export function Dashboard({ onNavigate }: Props) {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [fxRates, setFxRates] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    
    // Listen for asset updates
    const handleAssetUpdate = () => {
      loadDashboardData();
    };
    
    window.addEventListener('assetUpdated', handleAssetUpdate);
    
    return () => {
      window.removeEventListener('assetUpdated', handleAssetUpdate);
    };
  }, []);

  const loadDashboardData = async () => {
    try {
      // Fetch dashboard data
      const dashResponse = await userApi.getDashboard();
      if (dashResponse.status === 'success' && dashResponse.data) {
        setDashboardData(dashResponse.data);
      }

      // Fetch user profile
      const profileResponse = await userApi.getProfile();
      if (profileResponse.status === 'success' && profileResponse.data) {
        setUserProfile(profileResponse.data);
      }

      // Fetch loans
      const loansResponse = await loansApi.getLoans();
      if (loansResponse.status === 'success' && loansResponse.data) {
        const loansData = loansResponse.data as any;
        setLoans(loansData.loans || []);
      }

      // Fetch trust score from AI service
      const trustScoreResponse = await aiApi.getTrustScore();
      if (trustScoreResponse.status === 'success' && trustScoreResponse.data) {
        const data = trustScoreResponse.data as any;
        // Update dashboard data with real trust score
        setDashboardData((prev: any) => ({
          ...prev,
          trustScore: data.currentScore
        }));
      }

      // Fetch real-time FX rates
      const fxResponse = await fxApi.getFXRates();
      if (fxResponse.status === 'success' && fxResponse.data) {
        const rates = fxResponse.data as any[];
        // Format for dashboard display (show only first 4)
        const formattedRates = rates.slice(0, 4).map((r: any) => ({
          pair: r.pair,
          rate: r.rate.toFixed(2),
          change: `${r.change >= 0 ? '+' : ''}${r.change.toFixed(2)}%`,
          down: r.change < 0
        }));
        setFxRates(formattedRates);
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (value: number) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)} Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)} L`;
    return `₹${value.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  const userName = dashboardData?.userName || userProfile?.first_name || 'User';
  const totalAssetValue = dashboardData?.totalAssetValue || 0;
  const creditAvailable = dashboardData?.creditAvailable || 0;
  const trustScore = dashboardData?.trustScore || 0;
  const activeLoans = dashboardData?.activeLoans || 0;

  // Use real data from backend or fallback to mock
  const portfolioHistory = dashboardData?.portfolioHistory || portfolioData;
  const assetAllocationData = dashboardData?.assetAllocation || assetAllocation;
  const recentTransactionsData = dashboardData?.recentTransactions || recentTransactions;
  const fxRatesData = fxRates.length > 0 ? fxRates : [
    { pair: "INR/USD", rate: "0.01", change: "-0.12%", down: true },
    { pair: "INR/GBP", rate: "0.01", change: "+0.28%", down: false },
    { pair: "INR/EUR", rate: "0.01", change: "+0.15%", down: false },
    { pair: "INR/AED", rate: "0.04", change: "-0.05%", down: true },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pt-20 pb-8 px-4 min-h-screen"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-display font-bold text-white mb-1">Welcome back, {userName} 👋</h1>
          <p className="text-gray-500">Your global financial overview</p>
        </motion.div>

        {/* Top Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Asset Value", value: formatCurrency(totalAssetValue), change: "+12.4%", up: true, icon: <Wallet size={20} />, color: "from-blue-500 to-blue-600" },
            { label: "Credit Available", value: formatCurrency(creditAvailable), change: "+5.2%", up: true, icon: <CreditCard size={20} />, color: "from-purple-500 to-purple-600" },
            { label: "Trust Score", value: `${trustScore}/1000`, change: "+23 pts", up: true, icon: <Shield size={20} />, color: "from-emerald-500 to-emerald-600" },
            { label: "Active Loans", value: formatCurrency(activeLoans), change: "Active", up: true, icon: <Activity size={20} />, color: "from-amber-500 to-amber-600" },
          ].map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass rounded-2xl p-5 hover:bg-white/10 transition-all cursor-pointer group"
              whileHover={{ y: -3 }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center text-white`}>
                  {card.icon}
                </div>
                <span className={`text-xs font-medium flex items-center gap-1 ${card.up ? "text-emerald-400" : "text-red-400"}`}>
                  {card.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {card.change}
                </span>
              </div>
              <div className="text-2xl font-display font-bold text-white">{card.value}</div>
              <div className="text-sm text-gray-500 mt-1">{card.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Defaulted Loans Alert */}
        {loans.filter(loan => loan.status === 'DEFAULTED').length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            {loans.filter(loan => loan.status === 'DEFAULTED').map((loan, index) => (
              <div
                key={loan.id}
                className="glass rounded-2xl p-6 border-2 border-red-500/30 bg-red-500/5 mb-4"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="text-red-400" size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-red-400 mb-2">
                      Loan Defaulted - Collateral Liquidated
                    </h3>
                    <p className="text-gray-300 mb-4">
                      Your loan of <span className="font-semibold text-white">${loan.amount.toLocaleString()}</span> has been marked as defaulted. 
                      The collateral backing this loan has been liquidated to recover the outstanding amount.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-lg bg-black/20">
                      <div>
                        <div className="text-sm text-gray-400 mb-1">Loan Amount</div>
                        <div className="text-lg font-semibold text-white">
                          ${loan.amount.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400 mb-1">Liquidation Status</div>
                        <div className="text-lg font-semibold text-red-400">
                          Completed
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400 mb-1">Loan Status</div>
                        <div className="text-lg font-semibold text-red-400">
                          DEFAULTED
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                      <p className="text-sm text-yellow-400">
                        <strong>Note:</strong> Your collateral was liquidated with an 8% haircut. The recovered amount has been transferred to the investor. 
                        This default will be reported to credit bureaus and may affect your future borrowing capacity.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Charts Row */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Portfolio Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2 glass rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-white">Portfolio Growth</h3>
                <p className="text-sm text-gray-500">Total asset valuation over time</p>
              </div>
              <div className="flex gap-2">
                {["1M", "3M", "6M", "1Y"].map((p, i) => (
                  <button key={i} className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer ${i === 3 ? "bg-blue-600/20 text-blue-400" : "text-gray-500 hover:text-white"}`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={portfolioHistory}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#4b5563" fontSize={12} />
                <YAxis stroke="#4b5563" fontSize={12} tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
                <Tooltip
                  contentStyle={{ background: "#1a2236", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "#fff" }}
                  formatter={(value: number | undefined) => [`₹${((value ?? 0) / 100000).toFixed(1)}L`, "Value"]}
                />
                <Area type="monotone" dataKey="value" stroke="#3b82f6" fillOpacity={1} fill="url(#colorValue)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Asset Allocation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-2">Asset Allocation</h3>
            <p className="text-sm text-gray-500 mb-4">By asset type</p>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={assetAllocationData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                  {assetAllocationData.map((entry: any, i: number) => (
                    <Cell key={i} fill={entry.color || `hsl(${i * 60}, 70%, 50%)`} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "#1a2236", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "#fff" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-4">
              {assetAllocationData.map((a: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: a.color || `hsl(${i * 60}, 70%, 50%)` }} />
                    <span className="text-gray-400">{a.name}</span>
                  </div>
                  <span className="text-white font-medium">{a.value}%</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Bottom Row */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Transactions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-2 glass rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
              <button className="text-sm text-blue-400 hover:text-blue-300 cursor-pointer">View All →</button>
            </div>
            <div className="space-y-3">
              {recentTransactionsData.map((tx: any) => (
                <motion.div
                  key={tx.id}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-all cursor-pointer"
                  whileHover={{ x: 3 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-blue-400">
                      {tx.icon}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{tx.asset}</div>
                      <div className="text-xs text-gray-500">{tx.type} • {tx.time}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-white">{tx.amount}</div>
                    <div className={`text-xs ${tx.status === "Completed" ? "text-emerald-400" : tx.status === "Active" ? "text-blue-400" : tx.status === "Minted" ? "text-purple-400" : "text-amber-400"}`}>
                      {tx.status}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* FX Rates & Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="space-y-6"
          >
            {/* FX Rates */}
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Live FX Rates</h3>
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <div className="space-y-3">
                {fxRatesData.map((fx, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm text-gray-400 font-mono">{fx.pair}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white font-semibold">{fx.rate}</span>
                      <span className={`text-xs ${fx.down ? "text-red-400" : "text-emerald-400"}`}>
                        {fx.change}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="glass rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Lock Asset", icon: <Lock size={18} />, page: "assets" as Page },
                  { label: "Get Loan", icon: <DollarSign size={18} />, page: "marketplace" as Page },
                  { label: "View Score", icon: <Eye size={18} />, page: "credit" as Page },
                  { label: "FX Hedge", icon: <BarChart3 size={18} />, page: "fx" as Page },
                ].map((action, i) => (
                  <motion.button
                    key={i}
                    onClick={() => onNavigate(action.page)}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all cursor-pointer text-gray-400 hover:text-white"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {action.icon}
                    <span className="text-xs font-medium">{action.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Card Preview */}
            <motion.div
              className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800"
              whileHover={{ scale: 1.02 }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative">
                <div className="flex items-center justify-between mb-8">
                  <Globe size={24} className="text-white/80" />
                  <span className="text-xs text-white/60 font-mono">VIRTUAL CARD</span>
                </div>
                <div className="font-mono text-white text-lg tracking-widest mb-4">
                  •••• •••• •••• 4829
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-white/50">CARDHOLDER</div>
                    <div className="text-sm font-semibold text-white">{userName.toUpperCase()}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <ArrowUpRight size={14} className="text-emerald-300" />
                    <span className="text-xs text-emerald-300">Active</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
