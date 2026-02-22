import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Unlock, Shield, Check, Coins, Building, TrendingUp, Gem, Home, ChevronRight, AlertCircle, Plus, X, Wallet, FileText, Download } from "lucide-react";
import { useAccount } from 'wagmi';
import type { Page } from "../App";
import { assetsApi, certificatesApi } from "../services/api";

interface Props { onNavigate: (p: Page) => void; }

interface Asset {
  id: string;
  name: string;
  asset_type: string;
  current_value: number;
  status: string;
  locked_id?: string | null;
  credit_limit?: number | null;
  used_credit?: number | null;
  locked_at?: string | null;
}

interface Certificate {
  id: string;
  certificateNumber: string;
  certificateType: 'LIEN' | 'CUSTODY';
  status: 'ACTIVE' | 'REVOKED';
  issuedAt: string;
  assetId: string;
  assetType: string;
  assetValue: number;
  lienHolder?: string;
  downloadUrl: string;
  verificationHash: string;
  assetStillLocked: boolean;
}

const assetTypeConfig: Record<string, { icon: React.ReactNode; color: string; ltv: number }> = {
  FD: { icon: <Building size={20} />, color: "from-blue-500 to-blue-600", ltv: 90 },
  STOCK: { icon: <TrendingUp size={20} />, color: "from-purple-500 to-purple-600", ltv: 70 },
  GOLD: { icon: <Gem size={20} />, color: "from-amber-500 to-amber-600", ltv: 75 },
  PROPERTY: { icon: <Home size={20} />, color: "from-emerald-500 to-emerald-600", ltv: 60 },
  MUTUAL_FUND: { icon: <Coins size={20} />, color: "from-cyan-500 to-cyan-600", ltv: 65 },
};

export function AssetLocking({ onNavigate }: Props) {
  const { address, isConnected } = useAccount();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [lockStep, setLockStep] = useState(0);
  const [filter, setFilter] = useState<"all" | "ACTIVE" | "LOCKED">("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCertificatesModal, setShowCertificatesModal] = useState(false);
  const [newAsset, setNewAsset] = useState({
    assetType: "GOLD",
    name: "",
    currentValue: ""
  });
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadAssets();
    loadCertificates();
  }, []);

  // Handle voice command prefill from sessionStorage
  useEffect(() => {
    const prefillData = sessionStorage.getItem('assetPrefill');
    if (prefillData) {
      try {
        const data = JSON.parse(prefillData);
        console.log('🎤 Voice command prefill:', data);
        setShowAddModal(true);
        setNewAsset({
          assetType: data.assetType.toUpperCase(),
          name: `${data.assetType} Asset`,
          currentValue: data.value.toString()
        });
        // Clear sessionStorage
        sessionStorage.removeItem('assetPrefill');
      } catch (error) {
        console.error('Failed to parse prefill data:', error);
      }
    }
  }, []);

  const loadAssets = async () => {
    try {
      console.log('Loading assets...');
      const response = await assetsApi.getAssets();
      console.log('Assets response:', response);
      
      if (response.status === 'success' && response.data) {
        const data = response.data as any;
        setAssets(data.assets || []);
        console.log('Assets loaded:', data.assets?.length || 0);
      } else {
        console.error('Failed to load assets:', response.error);
        setErrorMessage(response.error?.message || 'Failed to load assets');
        setTimeout(() => setErrorMessage(""), 3000);
      }
    } catch (error) {
      console.error('Failed to load assets:', error);
      setErrorMessage('Failed to connect to server');
      setTimeout(() => setErrorMessage(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  const loadCertificates = async () => {
    try {
      console.log('Loading certificates...');
      const response = await certificatesApi.getMyCertificates();
      console.log('Certificates response:', response);
      
      if (response.status === 'success' && response.data) {
        const data = response.data as any;
        setCertificates(data.certificates || []);
        console.log('Certificates loaded:', data.certificates?.length || 0);
      }
    } catch (error) {
      console.error('Failed to load certificates:', error);
    }
  };

  const handleGenerateCertificate = async (assetId: string) => {
    try {
      console.log('Generating certificate for asset:', assetId);
      const response = await certificatesApi.generateCertificate(assetId);
      
      if (response.status === 'success') {
        setSuccessMessage("Certificate generated successfully! 📄");
        setTimeout(() => setSuccessMessage(""), 3000);
        await loadCertificates();
      } else {
        setErrorMessage(response.error?.message || 'Failed to generate certificate');
        setTimeout(() => setErrorMessage(""), 3000);
      }
    } catch (error) {
      console.error('Failed to generate certificate:', error);
      setErrorMessage('Failed to generate certificate');
      setTimeout(() => setErrorMessage(""), 3000);
    }
  };

  const handleDownloadCertificate = async (certificateId: string) => {
    try {
      console.log('Downloading certificate:', certificateId);
      const response = await certificatesApi.downloadCertificate(certificateId);
      
      if (response.status === 'success') {
        setSuccessMessage("Certificate downloaded! 📥");
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        setErrorMessage(response.error?.message || 'Failed to download certificate');
        setTimeout(() => setErrorMessage(""), 3000);
      }
    } catch (error) {
      console.error('Failed to download certificate:', error);
      setErrorMessage('Failed to download certificate');
      setTimeout(() => setErrorMessage(""), 3000);
    }
  };

  const handleAddAsset = async () => {
    console.log('handleAddAsset called with:', newAsset);
    
    if (!newAsset.name || !newAsset.currentValue) {
      setErrorMessage('Please fill all fields');
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    const value = parseFloat(newAsset.currentValue);
    if (isNaN(value) || value <= 0) {
      setErrorMessage('Please enter a valid amount');
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    try {
      console.log('Calling addAsset API with:', {
        assetType: newAsset.assetType,
        name: newAsset.name,
        currentValue: value
      });

      const response = await assetsApi.addAsset({
        assetType: newAsset.assetType,
        name: newAsset.name,
        currentValue: value
      });

      console.log('Add asset response:', response);

      if (response.status === 'success') {
        setShowAddModal(false);
        setNewAsset({ assetType: "GOLD", name: "", currentValue: "" });
        setSuccessMessage("Asset added successfully! 🎉");
        setTimeout(() => setSuccessMessage(""), 3000);
        await loadAssets();
      } else {
        setErrorMessage(response.error?.message || 'Failed to add asset');
        setTimeout(() => setErrorMessage(""), 3000);
      }
    } catch (error) {
      console.error('Failed to add asset:', error);
      setErrorMessage('Failed to connect to server. Please check if backend is running.');
      setTimeout(() => setErrorMessage(""), 5000);
    }
  };

  const startLocking = async (asset: Asset) => {
    console.log('startLocking called for asset:', asset);
    
    // Check if wallet is connected
    if (!isConnected || !address) {
      console.log('Wallet not connected');
      setErrorMessage("⚠️ Please connect your wallet first!");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    console.log('Wallet connected:', address);
    setSelectedAsset(asset);
    setLockStep(1);
    
    // Simulate locking process
    setTimeout(() => setLockStep(2), 1500);
    setTimeout(() => setLockStep(3), 3000);
    setTimeout(async () => {
      setLockStep(4);
      
      // Actually lock the asset with wallet address
      try {
        console.log('Calling lockAsset API for asset:', asset.id, 'with wallet:', address);
        const response = await assetsApi.lockAsset(asset.id, address);
        console.log('Lock asset response:', response);
        
        if (response.status === 'success') {
          setTimeout(async () => {
            setSelectedAsset(null);
            setLockStep(0);
            setSuccessMessage("Asset locked successfully! Wallet address saved. 🎉");
            setTimeout(() => setSuccessMessage(""), 3000);
            await loadAssets();
            // Refresh dashboard
            window.dispatchEvent(new Event('assetUpdated'));
          }, 1500);
        } else {
          console.error('Lock asset failed:', response.error);
          setErrorMessage(response.error?.message || "Failed to lock asset. Please try again.");
          setTimeout(() => setErrorMessage(""), 3000);
          setSelectedAsset(null);
          setLockStep(0);
        }
      } catch (error) {
        console.error('Failed to lock asset:', error);
        setErrorMessage("Failed to lock asset. Please try again.");
        setTimeout(() => setErrorMessage(""), 3000);
        setSelectedAsset(null);
        setLockStep(0);
      }
    }, 4500);
  };

  const filteredAssets = filter === "all" ? assets : assets.filter(a => a.status === filter);

  const totalValue = assets.reduce((sum, a) => sum + a.current_value, 0);
  const lockedValue = assets.filter(a => a.status === 'LOCKED').reduce((sum, a) => sum + a.current_value, 0);
  const availableValue = assets.filter(a => a.status === 'ACTIVE').reduce((sum, a) => sum + a.current_value, 0);

  const formatCurrency = (value: number) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)} Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    return `₹${value.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Loading assets...</div>
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
        {/* Success Message */}
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
        </AnimatePresence>

        {/* Error Message */}
        <AnimatePresence>
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
              <Lock className="text-purple-400" size={28} />
              <h1 className="text-3xl font-display font-bold text-white">Asset Vault</h1>
            </div>
            <div className="flex gap-2">
              <motion.button
                onClick={() => setShowCertificatesModal(true)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-semibold flex items-center gap-2 cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FileText size={18} />
                Certificates ({certificates.length})
              </motion.button>
              <motion.button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold flex items-center gap-2 cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Plus size={18} />
                Add Asset
              </motion.button>
            </div>
          </div>
          <p className="text-gray-500">Lock assets to unlock global credit</p>
        </motion.div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Assets", value: formatCurrency(totalValue), icon: <Coins size={18} />, color: "text-blue-400" },
            { label: "Locked", value: formatCurrency(lockedValue), icon: <Lock size={18} />, color: "text-amber-400" },
            { label: "Available", value: formatCurrency(availableValue), icon: <Unlock size={18} />, color: "text-emerald-400" },
            { label: "Assets Count", value: assets.length.toString(), icon: <Shield size={18} />, color: "text-purple-400" },
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

        {/* Filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: "all" as const, label: "All Assets" },
            { id: "ACTIVE" as const, label: "Available" },
            { id: "LOCKED" as const, label: "Locked" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium cursor-pointer transition-all whitespace-nowrap ${
                filter === f.id
                  ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                  : "glass text-gray-400 hover:text-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Asset Grid */}
        {filteredAssets.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <Coins size={48} className="text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No assets found</h3>
            <p className="text-gray-500 mb-6">Add your first asset to get started</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold cursor-pointer"
            >
              Add Asset
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {filteredAssets.map((asset, i) => {
              const config = assetTypeConfig[asset.asset_type] || assetTypeConfig.GOLD;
              return (
                <motion.div
                  key={asset.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass rounded-2xl p-5 hover:bg-white/10 transition-all group"
                  whileHover={{ y: -3 }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center text-white`}>
                      {config.icon}
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      asset.status === "ACTIVE" ? "bg-emerald-500/20 text-emerald-400" :
                      "bg-amber-500/20 text-amber-400"
                    }`}>
                      {asset.status === "ACTIVE" ? "Available" : "Locked"}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-1">{asset.name}</h3>
                  <p className="text-sm text-gray-500 mb-4">{asset.asset_type}</p>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-xs text-gray-500">Value</div>
                      <div className="text-xl font-display font-bold text-white">{formatCurrency(asset.current_value)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">LTV Ratio</div>
                      <div className="text-lg font-semibold text-blue-400">{config.ltv}%</div>
                    </div>
                  </div>

                  {asset.status === 'LOCKED' && asset.credit_limit && (
                    <div className="mb-4 p-3 rounded-lg bg-white/5">
                      <div className="text-xs text-gray-500 mb-1">Credit Limit</div>
                      <div className="text-lg font-semibold text-emerald-400">{formatCurrency(asset.credit_limit)}</div>
                    </div>
                  )}

                  {asset.status === "ACTIVE" && (
                    <motion.button
                      onClick={() => startLocking(asset)}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {isConnected ? (
                        <>
                          <Lock size={16} />
                          Lock Asset
                        </>
                      ) : (
                        <>
                          <Wallet size={16} />
                          Connect Wallet to Lock
                        </>
                      )}
                    </motion.button>
                  )}
                  {asset.status === "LOCKED" && (
                    <>
                      <button 
                        onClick={() => onNavigate('marketplace')}
                        className="w-full py-2.5 rounded-xl bg-purple-500/10 text-purple-400 text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer hover:bg-purple-500/20 transition-all mb-2"
                      >
                        <Shield size={16} />
                        Apply for Loan
                        <ChevronRight size={14} />
                      </button>
                      <button 
                        onClick={() => handleGenerateCertificate(asset.id)}
                        className="w-full py-2.5 rounded-xl bg-blue-500/10 text-blue-400 text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer hover:bg-blue-500/20 transition-all"
                      >
                        <FileText size={16} />
                        Generate Certificate
                      </button>
                    </>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Add Asset Modal */}
        <AnimatePresence>
          {showAddModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowAddModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="w-full max-w-md glass-strong rounded-3xl p-8"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-display font-bold text-white">Add New Asset</h3>
                  <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-white">
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Asset Type</label>
                    <select
                      value={newAsset.assetType}
                      onChange={(e) => setNewAsset({ ...newAsset, assetType: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500 [&>option]:bg-gray-800 [&>option]:text-white"
                    >
                      <option value="GOLD" className="bg-gray-800 text-white">Gold</option>
                      <option value="FD" className="bg-gray-800 text-white">Fixed Deposit</option>
                      <option value="STOCK" className="bg-gray-800 text-white">Stocks</option>
                      <option value="PROPERTY" className="bg-gray-800 text-white">Real Estate</option>
                      <option value="MUTUAL_FUND" className="bg-gray-800 text-white">Mutual Fund</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Asset Name</label>
                    <input
                      type="text"
                      value={newAsset.name}
                      onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                      placeholder="e.g., HDFC Fixed Deposit"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Current Value (₹)</label>
                    <input
                      type="number"
                      value={newAsset.currentValue}
                      onChange={(e) => setNewAsset({ ...newAsset, currentValue: e.target.value })}
                      placeholder="e.g., 500000"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <motion.button
                    onClick={handleAddAsset}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold cursor-pointer"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Add Asset
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Locking Flow Modal */}
        <AnimatePresence>
          {selectedAsset && lockStep > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="w-full max-w-lg glass-strong rounded-3xl p-8"
              >
                <h3 className="text-xl font-display font-bold text-white mb-6 text-center">
                  Locking Asset
                </h3>

                <div className="space-y-4">
                  {[
                    { step: 1, label: "Verifying Asset", detail: `Confirming ${selectedAsset.name}` },
                    { step: 2, label: "Connecting to Blockchain", detail: `Wallet: ${address?.slice(0, 6)}...${address?.slice(-4)}` },
                    { step: 3, label: "Creating Lock Record", detail: "Securing asset in vault" },
                    { step: 4, label: "Ready for Credit", detail: "Asset locked successfully!" },
                  ].map((s) => (
                    <motion.div
                      key={s.step}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: lockStep >= s.step ? 1 : 0.3, x: 0 }}
                      className="flex items-center gap-4"
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        lockStep > s.step ? "bg-emerald-500 text-white" :
                        lockStep === s.step ? "bg-blue-500 text-white animate-pulse" :
                        "bg-white/10 text-gray-500"
                      }`}>
                        {lockStep > s.step ? <Check size={18} /> : s.step}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">{s.label}</div>
                        <div className="text-xs text-gray-500">{s.detail}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {lockStep === 4 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center"
                  >
                    <Check size={24} className="text-emerald-400 mx-auto mb-2" />
                    <p className="text-emerald-300 font-semibold">Asset Locked Successfully!</p>
                    <p className="text-xs text-gray-500 mt-1">You can now apply for loans</p>
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Certificates Modal */}
        <AnimatePresence>
          {showCertificatesModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowCertificatesModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="w-full max-w-4xl glass-strong rounded-3xl p-8 max-h-[80vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <FileText className="text-emerald-400" size={24} />
                    <h3 className="text-xl font-display font-bold text-white">My Certificates</h3>
                  </div>
                  <button onClick={() => setShowCertificatesModal(false)} className="text-gray-400 hover:text-white">
                    <X size={24} />
                  </button>
                </div>

                {certificates.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText size={48} className="text-gray-600 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-white mb-2">No certificates yet</h4>
                    <p className="text-gray-500">Generate certificates for your locked assets</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {certificates.map((cert) => (
                      <motion.div
                        key={cert.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass rounded-2xl p-5 hover:bg-white/10 transition-all"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-lg font-semibold text-white">{cert.certificateNumber}</h4>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                cert.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                              }`}>
                                {cert.status}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                cert.certificateType === 'LIEN' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
                              }`}>
                                {cert.certificateType}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500">
                              Issued: {new Date(cert.issuedAt).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                            </p>
                          </div>
                          <motion.button
                            onClick={() => handleDownloadCertificate(cert.id)}
                            className="px-4 py-2 rounded-xl bg-blue-600/20 text-blue-400 text-sm font-semibold flex items-center gap-2 cursor-pointer hover:bg-blue-600/30 transition-all"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Download size={16} />
                            Download PDF
                          </motion.button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Asset Type</div>
                            <div className="text-sm font-semibold text-white">{cert.assetType}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Asset Value</div>
                            <div className="text-sm font-semibold text-white">{formatCurrency(cert.assetValue)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Lien Holder</div>
                            <div className="text-sm font-semibold text-white">{cert.lienHolder || 'None'}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Asset Status</div>
                            <div className={`text-sm font-semibold ${cert.assetStillLocked ? 'text-amber-400' : 'text-emerald-400'}`}>
                              {cert.assetStillLocked ? 'Locked' : 'Unlocked'}
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 p-3 rounded-lg bg-white/5">
                          <div className="text-xs text-gray-500 mb-1">Verification Hash</div>
                          <div className="text-xs font-mono text-gray-400 break-all">{cert.verificationHash}</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-2xl p-6"
        >
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-white mb-1">How Asset Locking Works</h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                Lock your assets to unlock credit without selling them. Each asset type has a different LTV (Loan-to-Value) ratio. 
                For example, Gold has 75% LTV, meaning you can get credit up to 75% of your gold's value. 
                Locked assets remain yours and can be unlocked after loan repayment.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
