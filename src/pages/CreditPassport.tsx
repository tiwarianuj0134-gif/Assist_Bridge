import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, FileText, CheckCircle, AlertTriangle, TrendingUp, Globe, Brain, Eye, Lock, Zap, Loader2, Sparkles } from "lucide-react";
import { RadialBarChart, RadialBar, ResponsiveContainer } from "recharts";
import type { Page } from "../App";
import { aiApi } from "../services/api";

interface Props { onNavigate: (p: Page) => void; }

interface AnalysisInsight {
  title: string;
  detail: string;
  impact: number;
  positive: boolean;
}

const riskFactors = [
  { factor: "Income Stability", score: 92, color: "bg-emerald-400" },
  { factor: "Credit History", score: 78, color: "bg-blue-400" },
  { factor: "Asset Coverage", score: 95, color: "bg-purple-400" },
  { factor: "Debt-to-Income", score: 85, color: "bg-amber-400" },
  { factor: "Cross-Border Activity", score: 70, color: "bg-cyan-400" },
  { factor: "Fraud Risk (Inverse)", score: 98, color: "bg-emerald-400" },
];

const documents = [
  { name: "Bank Statement - HDFC", status: "verified", date: "Jan 2025", type: "PDF" },
  { name: "CIBIL Credit Report", status: "verified", date: "Dec 2024", type: "PDF" },
  { name: "Tax Returns (ITR-2)", status: "verified", date: "AY 2024-25", type: "PDF" },
  { name: "Salary Slips (6 months)", status: "verified", date: "Jul-Dec 2024", type: "CSV" },
  { name: "Property Documents", status: "pending", date: "Pending", type: "PDF" },
];

export function CreditPassport({ onNavigate }: Props) {
  const [activeTab, setActiveTab] = useState<"overview" | "documents" | "ai">("overview");
  const [trustScore, setTrustScore] = useState(750);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStage, setAnalysisStage] = useState("");
  const [selectedDocType, setSelectedDocType] = useState("");
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [newInsights, setNewInsights] = useState<AnalysisInsight[]>([]);
  const [showUploadSuccess, setShowUploadSuccess] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  
  void onNavigate;

  // Load trust score and user profile on mount
  useEffect(() => {
    loadTrustScore();
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const saved = localStorage.getItem('assetbridge_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        setUserProfile(parsed);
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
  };

  const loadTrustScore = async () => {
    try {
      const response = await aiApi.getTrustScore();
      if (response.status === 'success' && response.data) {
        const data = response.data as any;
        setTrustScore(data.currentScore);
      }
    } catch (error) {
      console.error('Failed to load trust score:', error);
    }
  };

  // Map short names to display-friendly document types
  const documentTypeMap: Record<string, string> = {
    'bank_statement': 'Bank Statement',
    'itr': 'Tax Returns',
    'salary_slip': 'Salary Slips',
    'credit_report': 'CIBIL Report',
    'property_docs': 'Property Documents'
  };

  const handleDocumentUpload = (docType: string) => {
    setSelectedDocType(docType);
    setShowUploadSuccess(true);
    setTimeout(() => setShowUploadSuccess(false), 2000);
  };

  const handleAnalyze = async () => {
    if (!selectedDocType) {
      alert('Please upload a document first!');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisComplete(false);
    setAnalysisStage("Scanning document with OCR...");

    // Simulate analysis stages
    setTimeout(() => setAnalysisStage("Detecting income patterns..."), 1000);
    setTimeout(() => setAnalysisStage("Checking fraud indicators..."), 2000);
    setTimeout(() => setAnalysisStage("Calculating trust score..."), 3000);

    try {
      // Convert short name to display-friendly format
      const displayName = documentTypeMap[selectedDocType] || selectedDocType;
      
      console.log(`🔍 Analyzing document: ${displayName}`);
      // Call AI API
      const response = await aiApi.analyzeDocument(displayName);
      
      if (response.status === 'success' && response.data) {
        const data = response.data as any;
        console.log('✅ Analysis complete:', data);
        // Update trust score
        setTrustScore(data.newScore);
        setNewInsights(data.insights || []);
        
        setTimeout(() => {
          setIsAnalyzing(false);
          setAnalysisComplete(true);
          setAnalysisStage("");
          
          // Dispatch event to refresh dashboard
          window.dispatchEvent(new Event('assetUpdated'));
          
          // Auto-hide success message after 5 seconds
          setTimeout(() => {
            setAnalysisComplete(false);
            setSelectedDocType("");
          }, 5000);
        }, 1000);
      } else {
        throw new Error(response.error?.message || 'Analysis failed');
      }
    } catch (error: any) {
      console.error('Analysis error:', error);
      setIsAnalyzing(false);
      setAnalysisStage("");
      alert(`Failed to analyze document: ${error.message}`);
    }
  };

  const scoreData = [{ name: "Score", value: trustScore, fill: "#3b82f6" }];

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
          <div className="flex items-center gap-3 mb-2">
            <Shield className="text-blue-400" size={28} />
            <h1 className="text-3xl font-display font-bold text-white">Global Credit Passport</h1>
          </div>
          <p className="text-gray-500">AI-powered trust scoring across borders</p>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {[
            { id: "overview" as const, label: "Trust Score", icon: <Eye size={16} /> },
            { id: "documents" as const, label: "Documents", icon: <FileText size={16} /> },
            { id: "ai" as const, label: "AI Analysis", icon: <Brain size={16} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap cursor-pointer transition-all ${
                activeTab === tab.id
                  ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                  : "glass text-gray-400 hover:text-white"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Score Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass rounded-2xl p-8 text-center"
            >
              <h3 className="text-lg font-semibold text-white mb-2">Global Trust Score</h3>
              <ResponsiveContainer width="100%" height={220}>
                <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={scoreData} startAngle={90} endAngle={-270}>
                  <RadialBar
                    dataKey="value"
                    cornerRadius={10}
                    background={{ fill: "rgba(255,255,255,0.05)" }}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="-mt-32 relative z-10">
                <div className="text-5xl font-display font-bold text-white">{trustScore}</div>
                <div className="text-sm text-gray-500 mt-1">out of 1000</div>
              </div>
              <div className="mt-8 flex items-center justify-center gap-2">
                <div className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-medium">
                  Low Risk
                </div>
                <div className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-sm font-medium">
                  Tier A
                </div>
              </div>
              <div className="mt-4 p-3 rounded-xl bg-white/5">
                <div className="text-sm text-gray-400">Dynamic Credit Limit</div>
                <div className="text-2xl font-display font-bold text-white">₹85,00,000</div>
              </div>
              
              {/* Improve Score Button */}
              <motion.button
                onClick={() => setActiveTab("documents")}
                className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-purple-500/25 transition-all cursor-pointer"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Sparkles size={18} />
                🚀 Improve Score
              </motion.button>
            </motion.div>

            {/* Risk Factors */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-6">Risk Factor Breakdown</h3>
              <div className="space-y-5">
                {riskFactors.map((rf, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">{rf.factor}</span>
                      <span className="text-sm font-semibold text-white">{rf.score}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/5">
                      <motion.div
                        className={`h-full rounded-full ${rf.color}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${rf.score}%` }}
                        transition={{ delay: 0.3 + i * 0.1, duration: 0.8 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Passport Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              {/* Passport Card */}
              <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-blue-900 via-purple-900 to-blue-900 border border-white/10">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-6">
                    <Globe size={24} className="text-blue-300" />
                    <span className="text-xs text-blue-300/60 font-mono">CREDIT PASSPORT</span>
                  </div>
                  <div className="mb-4">
                    <div className="text-xs text-blue-300/50">NAME</div>
                    <div className="text-lg font-semibold text-white">{userProfile?.email?.split('@')[0]?.toUpperCase() || 'USER'}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-xs text-blue-300/50">HOME COUNTRY</div>
                      <div className="text-sm text-white">🇮🇳 India</div>
                    </div>
                    <div>
                      <div className="text-xs text-blue-300/50">PASSPORT ID</div>
                      <div className="text-sm text-white font-mono">AB-2025-04829</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-blue-300/50">TRUST SCORE</div>
                      <div className="text-sm text-emerald-400 font-bold">{trustScore} / 1000</div>
                    </div>
                    <div>
                      <div className="text-xs text-blue-300/50">VALID IN</div>
                      <div className="text-sm text-white">180+ Countries</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Countries Accepted */}
              <div className="glass rounded-2xl p-6">
                <h4 className="text-sm font-semibold text-white mb-4">Accepted Countries</h4>
                <div className="flex flex-wrap gap-2">
                  {["🇬🇧 UK", "🇺🇸 USA", "🇦🇪 UAE", "🇸🇬 Singapore", "🇩🇪 Germany", "🇯🇵 Japan", "🇦🇺 Australia", "🇨🇦 Canada"].map((c, i) => (
                    <span key={i} className="px-3 py-1.5 rounded-lg bg-white/5 text-sm text-gray-300">
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              {/* Default Probability */}
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Zap size={16} className="text-emerald-400" />
                  <h4 className="text-sm font-semibold text-white">AI Prediction</h4>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Default Probability</span>
                  <span className="text-lg font-bold text-emerald-400">0.8%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/5 mt-2">
                  <div className="h-full rounded-full bg-emerald-400" style={{ width: "0.8%" }} />
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {activeTab === "documents" && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Improve Your Score Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-2xl p-8"
            >
              <div className="flex items-center gap-2 mb-6">
                <Sparkles size={20} className="text-purple-400" />
                <h3 className="text-lg font-semibold text-white">Improve Your Score</h3>
              </div>
              
              <p className="text-sm text-gray-400 mb-6">
                Upload financial documents to boost your trust score with AI-powered analysis
              </p>

              {/* Document Type Selection */}
              <div className="space-y-3 mb-6">
                <h4 className="text-sm font-semibold text-gray-400">Select Document Type</h4>
                {[
                  { type: 'bank_statement', label: 'Bank Statement', icon: '🏦' },
                  { type: 'itr', label: 'Income Tax Return (ITR)', icon: '📊' },
                  { type: 'salary_slip', label: 'Salary Slip', icon: '💰' },
                  { type: 'credit_report', label: 'Credit Report', icon: '📈' },
                  { type: 'property_docs', label: 'Property Documents', icon: '🏠' },
                ].map((doc) => (
                  <button
                    key={doc.type}
                    onClick={() => handleDocumentUpload(doc.type)}
                    className={`w-full flex items-center gap-3 p-4 rounded-xl transition-all cursor-pointer ${
                      selectedDocType === doc.type
                        ? 'bg-blue-600/20 border-2 border-blue-500/50'
                        : 'bg-white/5 border-2 border-transparent hover:bg-white/10'
                    }`}
                  >
                    <span className="text-2xl">{doc.icon}</span>
                    <span className="text-sm text-white font-medium">{doc.label}</span>
                    {selectedDocType === doc.type && (
                      <CheckCircle size={16} className="text-emerald-400 ml-auto" />
                    )}
                  </button>
                ))}
              </div>

              {/* Upload Success Message */}
              <AnimatePresence>
                {showUploadSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center gap-2"
                  >
                    <CheckCircle size={16} className="text-emerald-400" />
                    <span className="text-sm text-emerald-300">Document selected! Click Analyze to continue.</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Analyze Button */}
              <button
                onClick={handleAnalyze}
                disabled={!selectedDocType || isAnalyzing}
                className={`w-full py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                  !selectedDocType || isAnalyzing
                    ? 'bg-gray-600/20 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-500 hover:to-purple-500 cursor-pointer'
                }`}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Brain size={20} />
                    Analyze with AI
                  </>
                )}
              </button>

              {/* Analysis Progress */}
              <AnimatePresence>
                {isAnalyzing && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20"
                  >
                    <div className="flex items-center gap-3">
                      <Loader2 size={18} className="text-blue-400 animate-spin" />
                      <span className="text-sm text-blue-300">{analysisStage}</span>
                    </div>
                    <div className="w-full h-1 rounded-full bg-white/10 mt-3 overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                        initial={{ width: '0%' }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 4, ease: 'linear' }}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Analysis Complete */}
              <AnimatePresence>
                {analysisComplete && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="mt-6 p-6 rounded-xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 border border-emerald-500/30"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <CheckCircle size={24} className="text-emerald-400" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-white">Analysis Complete!</h4>
                        <p className="text-sm text-gray-400">Your trust score has been updated</p>
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5">
                      <div className="text-sm text-gray-400 mb-1">New Trust Score</div>
                      <div className="text-3xl font-display font-bold text-emerald-400">{trustScore}</div>
                      <div className="text-xs text-emerald-400 mt-1">
                        +{newInsights.reduce((sum, i) => sum + i.impact, 0)} points
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Document List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-6">Submitted Documents</h3>
              <div className="space-y-3">
                {documents.map((doc, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        doc.status === "verified" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                      }`}>
                        <FileText size={18} />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">{doc.name}</div>
                        <div className="text-xs text-gray-500">{doc.type} • {doc.date}</div>
                      </div>
                    </div>
                    <div className={`flex items-center gap-1 text-xs font-medium ${
                      doc.status === "verified" ? "text-emerald-400" : "text-amber-400"
                    }`}>
                      {doc.status === "verified" ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                      {doc.status === "verified" ? "Verified" : "Pending"}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        )}

        {activeTab === "ai" && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* AI Reasoning */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-2xl p-6"
            >
              <div className="flex items-center gap-2 mb-6">
                <Brain size={20} className="text-purple-400" />
                <h3 className="text-lg font-semibold text-white">Explainable AI Reasoning</h3>
              </div>

              {/* Show new insights if available */}
              {newInsights.length > 0 && (
                <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles size={16} className="text-purple-400" />
                    <span className="text-sm font-semibold text-purple-300">Latest Analysis Results</span>
                  </div>
                  <p className="text-xs text-gray-400">Based on your recently uploaded document</p>
                </div>
              )}

              <div className="space-y-4">
                {/* Show new insights first if available */}
                {newInsights.length > 0 ? (
                  newInsights.map((insight, i) => (
                    <motion.div
                      key={`new-${i}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="p-4 rounded-xl bg-white/5 border-l-2"
                      style={{ borderLeftColor: insight.positive ? "#10b981" : "#f59e0b" }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-semibold text-white">{insight.title}</h4>
                        <span className={`text-xs font-bold ${insight.positive ? "text-emerald-400" : "text-amber-400"}`}>
                          {insight.positive ? '+' : ''}{insight.impact} pts
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed">{insight.detail}</p>
                    </motion.div>
                  ))
                ) : (
                  // Default insights
                  [
                    { title: "Strong Income Consistency", detail: "Monthly salary deposits of ₹2.8L detected consistently for 36 months with 4.2% annual growth.", impact: "+45 pts", positive: true },
                    { title: "Low Debt Utilization", detail: "Credit utilization at 12% across all credit lines. Well below the 30% threshold.", impact: "+38 pts", positive: true },
                    { title: "Diversified Asset Portfolio", detail: "Assets spread across 5 categories with strong correlation to growth indices.", impact: "+52 pts", positive: true },
                    { title: "Limited Cross-Border History", detail: "No prior international credit history detected. First-time cross-border user.", impact: "-15 pts", positive: false },
                    { title: "No Fraud Indicators", detail: "Zero suspicious transactions detected across 24 months of analyzed history.", impact: "+30 pts", positive: true },
                  ].map((r, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="p-4 rounded-xl bg-white/5 border-l-2"
                      style={{ borderLeftColor: r.positive ? "#10b981" : "#f59e0b" }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-semibold text-white">{r.title}</h4>
                        <span className={`text-xs font-bold ${r.positive ? "text-emerald-400" : "text-amber-400"}`}>
                          {r.impact}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed">{r.detail}</p>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>

            {/* Risk Assessment */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-6"
            >
              <div className="glass rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">AI Risk Assessment</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Risk Tier", value: "Low", color: "text-emerald-400" },
                    { label: "Confidence", value: "94.7%", color: "text-blue-400" },
                    { label: "Model Version", value: "v3.2.1", color: "text-purple-400" },
                    { label: "Last Updated", value: "2h ago", color: "text-gray-400" },
                  ].map((item, i) => (
                    <div key={i} className="p-3 rounded-xl bg-white/5">
                      <div className="text-xs text-gray-500">{item.label}</div>
                      <div className={`text-lg font-semibold ${item.color}`}>{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Data Sources Analyzed</h3>
                <div className="space-y-3">
                  {[
                    { source: "Bank Transactions", count: "2,847", icon: <TrendingUp size={16} /> },
                    { source: "Credit Inquiries", count: "12", icon: <Shield size={16} /> },
                    { source: "Tax Filings", count: "3 years", icon: <FileText size={16} /> },
                    { source: "Asset Valuations", count: "8 assets", icon: <Lock size={16} /> },
                  ].map((s, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                      <div className="flex items-center gap-3">
                        <div className="text-blue-400">{s.icon}</div>
                        <span className="text-sm text-gray-300">{s.source}</span>
                      </div>
                      <span className="text-sm font-semibold text-white">{s.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Recommendation</h3>
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <p className="text-sm text-emerald-300 leading-relaxed">
                    ✅ <strong>Approved for Global Credit</strong> — Based on AI analysis, this profile qualifies for cross-border collateralization up to ₹85L with a recommended interest rate of 8.5% APR.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
