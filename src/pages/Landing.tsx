import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Globe, Shield, ArrowRight, Zap, Lock, CreditCard, Users, TrendingUp, ChevronDown, Star, CheckCircle, ArrowUpRight, ArrowRightLeft, ArrowDownLeft, MessageSquare, BarChart3, Play } from "lucide-react";
import type { Page } from "../App";

interface Props { onNavigate: (p: Page) => void; }

const fadeUp = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.7 }
};

export function Landing({ onNavigate }: Props) {
  const [statIndex, setStatIndex] = useState(0);
  const stats = [
    { value: "$2.4B+", label: "Assets Bridged" },
    { value: "180+", label: "Countries Supported" },
    { value: "38,500+", label: "Active Users" },
    { value: "99.9%", label: "Platform Uptime" },
  ];

  useEffect(() => {
    const interval = setInterval(() => setStatIndex(prev => (prev + 1) % stats.length), 3000);
    return () => clearInterval(interval);
  }, [stats.length]);

  return (
    <div className="min-h-screen overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-dark-900" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "3s" }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-emerald-600/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "1.5s" }} />
        <div className="absolute top-3/4 left-1/3 w-48 h-48 bg-cyan-600/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "4s" }} />
        {/* Grid */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px"
        }} />
        {/* Particles */}
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-blue-400/30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.6, 0.2],
            }}
            transition={{
              duration: 3 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Hero Section */}
      <section className="relative z-10 min-h-screen flex items-center justify-center px-4">
        {/* Top Nav */}
        <div className="absolute top-0 left-0 right-0 p-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <motion.div 
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center animate-pulse-glow">
                <Globe size={22} className="text-white" />
              </div>
              <span className="font-display font-bold text-xl bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                AssetBridge
              </span>
            </motion.div>
            <div className="flex items-center gap-3">
              <motion.button
                onClick={() => onNavigate("credit")}
                className="hidden sm:block px-4 py-2 rounded-full text-sm text-gray-400 hover:text-white transition-all cursor-pointer"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                Features
              </motion.button>
              <motion.button
                onClick={() => onNavigate("login")}
                className="px-5 py-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all cursor-pointer"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Launch App →
              </motion.button>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm text-blue-300 mb-8"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <motion.span
              key={statIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {stats[statIndex].value} {stats[statIndex].label}
            </motion.span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-display font-bold leading-tight mb-6"
          >
            <span className="text-white">Your Assets</span>
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent animate-gradient">
              Travel With You
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10"
          >
            Lock your home-country assets. Tokenize them on blockchain. 
            Access instant credit & liquidity anywhere in the world — without selling anything.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <motion.button
              onClick={() => onNavigate("login")}
              className="group px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold text-lg flex items-center gap-2 hover:shadow-2xl hover:shadow-blue-500/25 transition-all cursor-pointer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Get Started Free
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </motion.button>
            <motion.button
              onClick={() => onNavigate("credit")}
              className="group px-8 py-4 rounded-2xl glass text-gray-300 font-semibold text-lg hover:bg-white/10 transition-all cursor-pointer flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Play size={18} className="text-blue-400" />
              Watch Demo
            </motion.button>
          </motion.div>

          {/* Animated Flow Visualization */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="relative max-w-4xl mx-auto"
          >
            <div className="glass rounded-3xl p-8 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-emerald-600/5" />
              <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
                {/* Step 1 */}
                <motion.div className="flex-1 text-center p-4" whileHover={{ scale: 1.05 }}>
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 flex items-center justify-center mx-auto mb-3">
                    <Lock size={28} className="text-blue-400" />
                  </div>
                  <h3 className="font-semibold text-white mb-1">Lock Assets</h3>
                  <p className="text-sm text-gray-500">FD, Stocks, Gold, Property</p>
                </motion.div>

                <motion.div className="hidden md:flex flex-col items-center gap-1" animate={{ x: [0, 10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                  <div className="w-8 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400" />
                  <ArrowRight size={16} className="text-purple-400" />
                </motion.div>

                {/* Step 2 */}
                <motion.div className="flex-1 text-center p-4" whileHover={{ scale: 1.05 }}>
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 flex items-center justify-center mx-auto mb-3">
                    <Shield size={28} className="text-purple-400" />
                  </div>
                  <h3 className="font-semibold text-white mb-1">Tokenize</h3>
                  <p className="text-sm text-gray-500">RWA Token on Blockchain</p>
                </motion.div>

                <motion.div className="hidden md:flex flex-col items-center gap-1" animate={{ x: [0, 10, 0] }} transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}>
                  <div className="w-8 h-0.5 bg-gradient-to-r from-purple-400 to-emerald-400" />
                  <ArrowRight size={16} className="text-emerald-400" />
                </motion.div>

                {/* Step 3 */}
                <motion.div className="flex-1 text-center p-4" whileHover={{ scale: 1.05 }}>
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-3">
                    <Zap size={28} className="text-emerald-400" />
                  </div>
                  <h3 className="font-semibold text-white mb-1">Access Credit</h3>
                  <p className="text-sm text-gray-500">Instant Global Liquidity</p>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Trusted By */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.3 }}
            className="mt-16"
          >
            <p className="text-xs text-gray-600 mb-4 tracking-widest uppercase">Trusted by leading institutions</p>
            <div className="flex items-center justify-center gap-8 flex-wrap opacity-40">
              {["HDFC Bank", "ICICI", "SBI", "Polygon", "Chainlink", "Sumsub"].map((name, i) => (
                <span key={i} className="text-sm font-medium text-gray-500">{name}</span>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ChevronDown size={24} className="text-gray-600" />
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: "$2.4B+", label: "Assets Bridged", icon: <Globe size={20} /> },
              { value: "180+", label: "Countries", icon: <Users size={20} /> },
              { value: "0.5%", label: "Processing Fee", icon: <CreditCard size={20} /> },
              { value: "99.9%", label: "Uptime", icon: <TrendingUp size={20} /> },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass rounded-2xl p-6 text-center hover:bg-white/10 transition-all"
              >
                <div className="text-blue-400 mb-2 flex justify-center">{stat.icon}</div>
                <div className="text-3xl font-display font-bold text-white mb-1">{stat.value}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeUp} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
              Everything You Need for
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"> Global Finance</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              One platform to lock, tokenize, and leverage your assets across borders — powered by AI and blockchain.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: <Shield size={24} />, title: "Global Credit Passport", desc: "AI-generated trust score (0-1000) from bank statements, tax returns, and credit reports across countries.", color: "from-blue-500 to-blue-600", tag: "AI-Powered", page: "credit" as Page },
              { icon: <Lock size={24} />, title: "RWA Tokenization", desc: "Lock real assets (FD, stocks, gold, property) and mint blockchain tokens for global collateral.", color: "from-purple-500 to-purple-600", tag: "Blockchain", page: "assets" as Page },
              { icon: <CreditCard size={24} />, title: "Instant Overdraft Card", desc: "Global virtual/physical debit card. Swipe in London, collateral from Indian FD. Instant GBP.", color: "from-emerald-500 to-emerald-600", tag: "Instant", page: "card" as Page },
              { icon: <Users size={24} />, title: "P2P Lending Market", desc: "Asset-backed lending marketplace connecting global borrowers with investors from Japan, EU, UAE, USA.", color: "from-amber-500 to-amber-600", tag: "Marketplace", page: "marketplace" as Page },
              { icon: <ArrowRightLeft size={24} />, title: "Smart FX Hedging", desc: "AI-driven currency protection with live feeds, auto-hedging, margin calls, and forced rebalance.", color: "from-red-500 to-red-600", tag: "Risk Engine", page: "fx" as Page },
              { icon: <ArrowDownLeft size={24} />, title: "Reverse Remittance", desc: "Foreign income as collateral for domestic credit. Parents get INR credit backed by USD assets.", color: "from-cyan-500 to-cyan-600", tag: "Innovation", page: "remittance" as Page },
              { icon: <MessageSquare size={24} />, title: "Legal & Tax AI", desc: "LLM chatbot for tax implications, compliance guidance, and regulatory warnings per country.", color: "from-pink-500 to-pink-600", tag: "AI Chatbot", page: "chatbot" as Page },
              { icon: <BarChart3 size={24} />, title: "Analytics & Admin", desc: "Full admin panel with user management, compliance tracking, revenue analytics, and system health.", color: "from-indigo-500 to-indigo-600", tag: "Enterprise", page: "admin" as Page },
              { icon: <TrendingUp size={24} />, title: "Monetization Engine", desc: "Loan fees (0.5-1%), FX spread, SaaS for banks, subscription tiers — multiple revenue streams.", color: "from-teal-500 to-teal-600", tag: "Revenue", page: "admin" as Page },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                onClick={() => onNavigate(feature.page)}
                className="group glass rounded-2xl p-6 hover:bg-white/10 transition-all cursor-pointer relative overflow-hidden"
                whileHover={{ y: -5 }}
              >
                <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowUpRight size={20} className="text-gray-500 m-4" />
                </div>
                <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-white/5 text-gray-400 mb-4">
                  {feature.tag}
                </span>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 text-white group-hover:scale-110 transition-transform`}>
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeUp} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
              How AssetBridge Works
            </h2>
            <p className="text-gray-400 text-lg">From asset to global credit in 4 simple steps</p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: "01", title: "Connect Assets", desc: "Link your bank accounts, upload asset documents, connect investment portfolios.", icon: "🏦" },
              { step: "02", title: "AI Analysis", desc: "Our AI analyzes your financial history across countries and generates your Trust Score.", icon: "🤖" },
              { step: "03", title: "Lock & Tokenize", desc: "Assets are securely locked with custodians. RWA tokens are minted on Polygon/Ethereum.", icon: "🔗" },
              { step: "04", title: "Access Credit", desc: "Use tokens as collateral for instant loans, overdraft cards, or P2P lending globally.", icon: "💳" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative text-center"
              >
                <motion.div
                  className="text-4xl mb-4"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                >
                  {item.icon}
                </motion.div>
                <div className="text-xs font-mono text-blue-400 mb-2">{item.step}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
                {i < 3 && (
                  <div className="hidden md:block absolute top-8 right-0 translate-x-1/2 text-gray-700">
                    <ArrowRight size={20} />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Globe Section */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeUp} className="glass rounded-3xl p-8 md:p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-transparent to-purple-600/5" />
            
            <div className="relative grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
                  Global Asset Network
                </h2>
                <p className="text-gray-400 mb-6 leading-relaxed">
                  AssetBridge connects financial systems across 180+ countries, enabling seamless cross-border collateralization.
                </p>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {[
                    { label: "Live Connections", value: "2,847" },
                    { label: "Custodian Banks", value: "156" },
                    { label: "Active Tokens", value: "12,400" },
                    { label: "Avg. Processing", value: "< 2 min" },
                  ].map((s, i) => (
                    <div key={i} className="p-3 rounded-xl bg-white/5">
                      <div className="text-lg font-display font-bold text-white">{s.value}</div>
                      <div className="text-xs text-gray-500">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Animated Globe Representation */}
              <div className="relative flex items-center justify-center min-h-[300px]">
                {/* Globe circles */}
                <motion.div
                  className="absolute w-64 h-64 rounded-full border border-blue-500/20"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                />
                <motion.div
                  className="absolute w-48 h-48 rounded-full border border-purple-500/20"
                  animate={{ rotate: -360 }}
                  transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                />
                <motion.div
                  className="absolute w-32 h-32 rounded-full border border-emerald-500/20"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                />
                
                {/* Center */}
                <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 flex items-center justify-center animate-pulse-glow">
                  <Globe size={32} className="text-blue-400" />
                </div>

                {/* Orbiting dots */}
                {[
                  { flag: "🇮🇳", delay: 0, radius: "w-64 h-64" },
                  { flag: "🇬🇧", delay: 2, radius: "w-64 h-64" },
                  { flag: "🇺🇸", delay: 4, radius: "w-48 h-48" },
                  { flag: "🇦🇪", delay: 1, radius: "w-48 h-48" },
                  { flag: "🇯🇵", delay: 3, radius: "w-32 h-32" },
                  { flag: "🇸🇬", delay: 5, radius: "w-32 h-32" },
                ].map((dot, i) => (
                  <motion.div
                    key={i}
                    className={`absolute ${dot.radius}`}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 12 + i * 3, repeat: Infinity, ease: "linear", delay: dot.delay }}
                    style={{ pointerEvents: "none" }}
                  >
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-lg">
                      {dot.flag}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeUp} className="text-center mb-16">
            <h2 className="text-4xl font-display font-bold text-white mb-4">Trusted by Global Citizens</h2>
            <p className="text-gray-500">See what our users are saying about AssetBridge</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "Priya Sharma", role: "Software Engineer, moved to UK", text: "Used my Indian FD as collateral to get instant GBP credit. No selling, no hassle. Revolutionary!", rating: 5, avatar: "PS" },
              { name: "Ahmed Al-Rahman", role: "Entrepreneur, Dubai → Singapore", text: "My UAE property now backs my Singapore credit line. AssetBridge saved me months of paperwork.", rating: 5, avatar: "AA" },
              { name: "Yuki Tanaka", role: "Investor, Tokyo", text: "Lending on AssetBridge gives me 12% returns with asset-backed security. Best P2P platform.", rating: 5, avatar: "YT" },
            ].map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass rounded-2xl p-6"
                whileHover={{ y: -5 }}
              >
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} size={16} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-gray-300 text-sm mb-4 leading-relaxed">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-white text-sm">{t.name}</div>
                    <div className="text-xs text-gray-500">{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Supported Assets */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeUp} className="glass rounded-3xl p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
                  Supported Assets
                </h2>
                <p className="text-gray-400 mb-6">
                  We support a wide range of real-world assets that can be tokenized and used as global collateral.
                </p>
                <div className="space-y-3">
                  {["Fixed Deposits (FD)", "Mutual Funds & ETFs", "Stocks & Equities", "Physical & Digital Gold", "Real Estate (Document-verified)"].map((asset, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-3"
                    >
                      <CheckCircle size={18} className="text-emerald-400" />
                      <span className="text-gray-300">{asset}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "FD", value: "₹50L", color: "from-blue-500/20 to-blue-600/20", emoji: "🏦" },
                  { label: "Stocks", value: "₹25L", color: "from-purple-500/20 to-purple-600/20", emoji: "📈" },
                  { label: "Gold", value: "₹15L", color: "from-amber-500/20 to-amber-600/20", emoji: "🥇" },
                  { label: "Property", value: "₹2Cr", color: "from-emerald-500/20 to-emerald-600/20", emoji: "🏠" },
                ].map((a, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className={`bg-gradient-to-br ${a.color} rounded-2xl p-6 text-center border border-white/5`}
                    whileHover={{ scale: 1.05 }}
                  >
                    <div className="text-3xl mb-2">{a.emoji}</div>
                    <div className="text-2xl font-display font-bold text-white">{a.value}</div>
                    <div className="text-sm text-gray-400 mt-1">{a.label}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div {...fadeUp}>
            <div className="text-5xl mb-6">🌍</div>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">
              Ready to Bridge Your Assets
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"> Globally?</span>
            </h2>
            <p className="text-gray-400 text-lg mb-8">
              Join thousands of global citizens who never sell their assets to access credit.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.button
                onClick={() => onNavigate("dashboard")}
                className="px-10 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-lg hover:shadow-2xl hover:shadow-blue-500/25 transition-all cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Launch AssetBridge →
              </motion.button>
              <motion.button
                onClick={() => onNavigate("chatbot")}
                className="px-10 py-4 rounded-2xl glass text-gray-300 font-semibold text-lg transition-all cursor-pointer"
                whileHover={{ scale: 1.05 }}
              >
                Talk to AI →
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Globe size={16} className="text-white" />
                </div>
                <span className="font-display font-bold text-white">AssetBridge</span>
              </div>
              <p className="text-sm text-gray-500">Your Assets & Reputation Travel With You</p>
              <div className="flex gap-3 mt-4">
                {["𝕏", "in", "📧"].map((s, i) => (
                  <div key={i} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-xs text-gray-500 cursor-pointer hover:bg-white/10 transition-all">
                    {s}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3 text-sm">Product</h4>
              <div className="space-y-2 text-sm text-gray-500">
                <p className="hover:text-gray-300 cursor-pointer" onClick={() => onNavigate("credit")}>Credit Passport</p>
                <p className="hover:text-gray-300 cursor-pointer" onClick={() => onNavigate("assets")}>Asset Vault</p>
                <p className="hover:text-gray-300 cursor-pointer" onClick={() => onNavigate("card")}>Global Card</p>
                <p className="hover:text-gray-300 cursor-pointer" onClick={() => onNavigate("marketplace")}>Marketplace</p>
                <p className="hover:text-gray-300 cursor-pointer" onClick={() => onNavigate("fx")}>FX Hedging</p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3 text-sm">Features</h4>
              <div className="space-y-2 text-sm text-gray-500">
                <p className="hover:text-gray-300 cursor-pointer" onClick={() => onNavigate("remittance")}>Reverse Remittance</p>
                <p className="hover:text-gray-300 cursor-pointer" onClick={() => onNavigate("chatbot")}>AI Assistant</p>
                <p className="hover:text-gray-300 cursor-pointer">RWA Tokenization</p>
                <p className="hover:text-gray-300 cursor-pointer">Smart Contracts</p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3 text-sm">Company</h4>
              <div className="space-y-2 text-sm text-gray-500">
                <p className="hover:text-gray-300 cursor-pointer">About</p>
                <p className="hover:text-gray-300 cursor-pointer">Careers</p>
                <p className="hover:text-gray-300 cursor-pointer">Blog</p>
                <p className="hover:text-gray-300 cursor-pointer">Contact</p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3 text-sm">Legal</h4>
              <div className="space-y-2 text-sm text-gray-500">
                <p className="hover:text-gray-300 cursor-pointer">Privacy Policy</p>
                <p className="hover:text-gray-300 cursor-pointer">Terms of Service</p>
                <p className="hover:text-gray-300 cursor-pointer">Compliance</p>
                <p className="hover:text-gray-300 cursor-pointer">KYC/AML</p>
                <p className="hover:text-gray-300 cursor-pointer">GDPR</p>
              </div>
            </div>
          </div>
          <div className="border-t border-white/5 mt-8 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-600">
              © 2025 AssetBridge. All rights reserved.
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-600">
              <span className="flex items-center gap-1"><Shield size={12} className="text-emerald-400" /> GDPR Compliant</span>
              <span className="flex items-center gap-1"><CheckCircle size={12} className="text-blue-400" /> SOC2 Certified</span>
              <span className="flex items-center gap-1"><Lock size={12} className="text-purple-400" /> AES-256 Encrypted</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
