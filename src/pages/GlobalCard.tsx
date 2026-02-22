import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CreditCard, Globe, Lock, Eye, EyeOff, Copy, CheckCircle, ArrowUpRight, MapPin, Clock, TrendingUp, Loader2, AlertCircle, DollarSign } from "lucide-react";
import type { Page } from "../App";
import { cardsApi, loansApi } from "../services/api";

interface Props { onNavigate: (p: Page) => void; }

const spendCategories = [
  { name: "Shopping", pct: 38, color: "bg-purple-400", amount: "₹20,582" },
  { name: "Groceries", pct: 22, color: "bg-blue-400", amount: "₹11,908" },
  { name: "Transport", pct: 18, color: "bg-emerald-400", amount: "₹9,744" },
  { name: "Food & Drink", pct: 12, color: "bg-amber-400", amount: "₹6,494" },
  { name: "Others", pct: 10, color: "bg-gray-400", amount: "₹5,412" },
];

interface CardData {
  id: string;
  cardNumber: string;
  cvv: string;
  expiryDate: string;
  cardHolderName: string;
  creditLimit: number;
  availableBalance: number;
  status: string;
}

interface Transaction {
  id: string;
  merchant: string;
  amount: number;
  amountInr: number;
  category: string;
  location: string;
  status: string;
  time: string;
}

export function GlobalCard({ onNavigate }: Props) {
  const [showNumber, setShowNumber] = useState(false);
  const [copied, setCopied] = useState(false);
  const [cardFrozen, setCardFrozen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cardData, setCardData] = useState<CardData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [hasActiveLoan, setHasActiveLoan] = useState(false);
  const [activeLoanId, setActiveLoanId] = useState<string | null>(null);
  const [issuingCard, setIssuingCard] = useState(false);
  const [processingTransaction, setProcessingTransaction] = useState(false);
  
  void onNavigate;

  useEffect(() => {
    loadCardData();
  }, []);

  const loadCardData = async () => {
    try {
      console.log('Loading card data...');
      setLoading(true);

      // Check for active or pending loans
      console.log('Fetching loans...');
      const loansResponse = await loansApi.getLoans();
      console.log('Loans response:', loansResponse);
      
      if (loansResponse.status === 'success' && loansResponse.data) {
        const loans = loansResponse.data as any;
        const loansList = loans.loans || loans;
        console.log('Loans list:', loansList);
        
        // Check for ACTIVE loans first
        const activeLoan = loansList.find((loan: any) => loan.status === 'ACTIVE');
        console.log('Active loan:', activeLoan);
        
        if (activeLoan) {
          setHasActiveLoan(true);
          setActiveLoanId(activeLoan.id);
          console.log('Found active loan:', activeLoan.id);
        } else {
          // Check for UNDER_REVIEW (pending) loans
          const pendingLoan = loansList.find((loan: any) => loan.status === 'UNDER_REVIEW');
          console.log('Pending loan:', pendingLoan);
          
          if (pendingLoan) {
            setHasActiveLoan(true); // Show that loan exists
            setActiveLoanId(pendingLoan.id);
            console.log('Found pending loan:', pendingLoan.id);
          }
        }
      }

      // Get card data
      console.log('Fetching card data...');
      const cardResponse = await cardsApi.getMyCard();
      console.log('Card response:', cardResponse);
      
      if (cardResponse.status === 'success' && cardResponse.data) {
        const data = cardResponse.data as any;
        console.log('Card data:', data);
        setCardData(data);
        setCardFrozen(data.status === 'frozen');
      }

      // Get transactions
      console.log('Fetching transactions...');
      const txResponse = await cardsApi.getTransactions(10);
      console.log('Transactions response:', txResponse);
      
      if (txResponse.status === 'success' && txResponse.data) {
        const txData = txResponse.data as Transaction[];
        console.log('Transactions:', txData);
        setTransactions(txData);
      }
    } catch (error) {
      console.error('Failed to load card data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleIssueCard = async () => {
    if (!activeLoanId) return;

    try {
      setIssuingCard(true);
      const response = await cardsApi.issueCard(activeLoanId);
      
      if (response.status === 'success' && response.data) {
        setCardData(response.data as any);
        alert('Virtual card issued successfully!');
      } else {
        throw new Error('Failed to issue card');
      }
    } catch (error: any) {
      console.error('Issue card error:', error);
      alert(error.message || 'Failed to issue card');
    } finally {
      setIssuingCard(false);
    }
  };

  const handleTestTransaction = async () => {
    if (!cardData) return;

    const merchants = [
      { name: 'Uber', category: 'Transport', location: 'Mumbai, India', amount: 250 },
      { name: 'Starbucks', category: 'Food & Drink', location: 'Bangalore, India', amount: 450 },
      { name: 'Amazon', category: 'Shopping', location: 'Online', amount: 1299 },
      { name: 'Swiggy', category: 'Food & Drink', location: 'Delhi, India', amount: 380 },
      { name: 'BookMyShow', category: 'Entertainment', location: 'Online', amount: 600 },
    ];

    const randomMerchant = merchants[Math.floor(Math.random() * merchants.length)];

    try {
      setProcessingTransaction(true);
      const response = await cardsApi.processTransaction({
        amount: randomMerchant.amount,
        merchant: randomMerchant.name,
        category: randomMerchant.category,
        location: randomMerchant.location,
        currency: 'INR'
      });

      if (response.status === 'success' && response.data) {
        const data = response.data as any;
        
        if (data.success) {
          // Update card balance
          setCardData(prev => prev ? {
            ...prev,
            availableBalance: data.card.availableBalance
          } : null);

          // Add transaction to list
          setTransactions(prev => [data.transaction, ...prev]);

          alert(`Transaction successful! ₹${randomMerchant.amount} spent at ${randomMerchant.name}`);
        } else {
          alert(`Transaction declined: ${data.reason}`);
        }
      }
    } catch (error: any) {
      console.error('Transaction error:', error);
      alert('Transaction failed');
    } finally {
      setProcessingTransaction(false);
    }
  };

  const handleToggleFreeze = async () => {
    try {
      const newFrozenState = !cardFrozen;
      const response = await cardsApi.toggleCardStatus(newFrozenState);
      
      if (response.status === 'success') {
        setCardFrozen(newFrozenState);
        if (cardData) {
          setCardData({
            ...cardData,
            status: newFrozenState ? 'frozen' : 'active'
          });
        }
      }
    } catch (error) {
      console.error('Toggle freeze error:', error);
      alert('Failed to update card status');
    }
  };

  const copyNumber = () => {
    if (cardData) {
      navigator.clipboard.writeText(cardData.cardNumber);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatCurrency = (value: number) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)} Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)} L`;
    return `₹${value.toLocaleString()}`;
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      'Shopping': '📦',
      'Groceries': '🛒',
      'Transport': '🚗',
      'Food & Drink': '☕',
      'Entertainment': '🎬',
      'Other': '💳'
    };
    return icons[category] || icons['Other'];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="text-blue-400 animate-spin" size={48} />
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
            <CreditCard className="text-blue-400" size={28} />
            <h1 className="text-3xl font-display font-bold text-white">Global Overdraft Card</h1>
          </div>
          <p className="text-gray-500">Swipe anywhere, collateral from home — instant multi-currency access</p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Card Display */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2"
          >
            {!hasActiveLoan ? (
              /* No Active Loan */
              <div className="glass rounded-2xl p-12 text-center">
                <AlertCircle size={64} className="text-amber-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Active Loan</h3>
                <p className="text-gray-400 mb-6">You need an approved loan to issue a virtual card</p>
                <button
                  onClick={() => onNavigate('marketplace')}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:from-blue-500 hover:to-purple-500 transition-all cursor-pointer"
                >
                  Apply for Loan
                </button>
              </div>
            ) : !cardData ? (
              /* Has Loan but No Card */
              <div className="glass rounded-2xl p-12 text-center">
                <CreditCard size={64} className="text-blue-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Issue Your Virtual Card</h3>
                <p className="text-gray-400 mb-6">Get instant access to your approved credit limit</p>
                <button
                  onClick={handleIssueCard}
                  disabled={issuingCard}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:from-blue-500 hover:to-purple-500 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                >
                  {issuingCard ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Issuing Card...
                    </>
                  ) : (
                    <>
                      <CreditCard size={20} />
                      Issue Virtual Card
                    </>
                  )}
                </button>
                <p className="text-xs text-gray-500 mt-4">
                  Note: Card can only be issued after loan is approved by admin
                </p>
              </div>
            ) : (
              /* Card Issued */
              <div className="flex flex-col md:flex-row gap-6">
                {/* Main Card */}
                <motion.div
                  className={`relative flex-1 rounded-3xl p-8 overflow-hidden min-h-[240px] ${cardFrozen ? "opacity-50 grayscale" : ""}`}
                  style={{
                    background: "linear-gradient(135deg, #1e40af 0%, #7c3aed 40%, #3b82f6 70%, #06b6d4 100%)"
                  }}
                  whileHover={{ scale: cardFrozen ? 1 : 1.02, rotateY: cardFrozen ? 0 : 2 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {/* Card Background Effects */}
                  <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />

                  <div className="relative h-full flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Globe size={24} className="text-white/80" />
                        <span className="font-display font-bold text-white/90 text-lg">AssetBridge</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-5 bg-amber-400 rounded-sm" />
                        <span className="text-xs text-white/60 font-mono">GLOBAL</span>
                      </div>
                    </div>

                    <div className="mt-8">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-mono text-white text-xl tracking-[0.2em]">
                          {showNumber ? cardData.cardNumber.match(/.{1,4}/g)?.join(' ') : `•••• •••• •••• ${cardData.cardNumber.slice(-4)}`}
                        </span>
                        <button onClick={() => setShowNumber(!showNumber)} className="cursor-pointer text-white/60 hover:text-white">
                          {showNumber ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                        <button onClick={copyNumber} className="cursor-pointer text-white/60 hover:text-white">
                          {copied ? <CheckCircle size={16} className="text-emerald-400" /> : <Copy size={16} />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-end justify-between mt-6">
                      <div>
                        <div className="text-xs text-white/40 mb-0.5">CARDHOLDER</div>
                        <div className="text-sm font-semibold text-white tracking-wider">{cardData.cardHolderName}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-white/40 mb-0.5">EXPIRES</div>
                        <div className="text-sm font-semibold text-white">{cardData.expiryDate}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-white/40 mb-0.5">CVV</div>
                        <div className="text-sm font-semibold text-white">{showNumber ? cardData.cvv : "•••"}</div>
                      </div>
                    </div>
                  </div>

                  {cardFrozen && (
                    <div className="absolute inset-0 bg-dark-900/50 flex items-center justify-center">
                      <div className="px-6 py-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 font-bold">
                        CARD FROZEN
                      </div>
                    </div>
                  )}
                </motion.div>

                {/* Card Controls */}
                <div className="flex md:flex-col gap-3">
                  <motion.button
                    onClick={handleToggleFreeze}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium cursor-pointer transition-all border border-transparent ${
                      cardFrozen 
                        ? "bg-red-500/20 text-red-400 border-red-500/30" 
                        : "glass text-gray-400 hover:bg-white/10"
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Lock size={18} />
                    <span className="hidden md:inline">{cardFrozen ? "Unfreeze" : "Freeze"}</span>
                  </motion.button>
                </div>
              </div>
            )}

            {/* Card Stats */}
            {cardData && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
                  {[
                    { label: "Available Balance", value: formatCurrency(cardData.availableBalance), sub: `Limit: ${formatCurrency(cardData.creditLimit)}` },
                    { label: "Spent This Month", value: formatCurrency(cardData.creditLimit - cardData.availableBalance), sub: `${Math.round(((cardData.creditLimit - cardData.availableBalance) / cardData.creditLimit) * 100)}% utilized` },
                    { label: "Credit Limit", value: formatCurrency(cardData.creditLimit), sub: "Backed by assets" },
                    { label: "Transactions", value: transactions.length.toString(), sub: "This month" },
                  ].map((stat, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      className="glass rounded-xl p-4"
                    >
                      <div className="text-xs text-gray-500">{stat.label}</div>
                      <div className="text-lg font-display font-bold text-white mt-1">{stat.value}</div>
                      <div className="text-xs text-gray-600 mt-0.5">{stat.sub}</div>
                    </motion.div>
                  ))}
                </div>

                {/* Test Transaction Button */}
                <motion.button
                  onClick={handleTestTransaction}
                  disabled={processingTransaction || cardFrozen}
                  className="w-full mt-6 py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-blue-600 text-white font-semibold hover:from-emerald-500 hover:to-blue-500 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  whileHover={{ scale: processingTransaction || cardFrozen ? 1 : 1.02 }}
                  whileTap={{ scale: processingTransaction || cardFrozen ? 1 : 0.98 }}
                >
                  {processingTransaction ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <DollarSign size={20} />
                      Test Transaction (Random Merchant)
                    </>
                  )}
                </motion.button>
              </>
            )}
          </motion.div>

          {/* Spending Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Spending Breakdown</h3>
            
            {/* Stacked bar */}
            <div className="flex h-4 rounded-full overflow-hidden mb-6">
              {spendCategories.map((cat, i) => (
                <motion.div
                  key={i}
                  className={`${cat.color} first:rounded-l-full last:rounded-r-full`}
                  initial={{ width: 0 }}
                  animate={{ width: `${cat.pct}%` }}
                  transition={{ delay: 0.5 + i * 0.1, duration: 0.8 }}
                />
              ))}
            </div>

            <div className="space-y-4">
              {spendCategories.map((cat, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${cat.color}`} />
                    <span className="text-sm text-gray-400">{cat.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-white">{cat.amount}</span>
                    <span className="text-xs text-gray-500 ml-2">{cat.pct}%</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Collateral Info */}
            <div className="mt-6 pt-4 border-t border-white/5">
              <h4 className="text-sm font-semibold text-white mb-3">Backing Assets</h4>
              <div className="space-y-2">
                {[
                  { asset: "HDFC FD", value: "₹15L", pct: "60%" },
                  { asset: "Reliance Stocks", value: "₹8.5L", pct: "30%" },
                  { asset: "Gold (50g)", value: "₹3.5L", pct: "10%" },
                ].map((a, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                    <span className="text-xs text-gray-400">{a.asset}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white font-medium">{a.value}</span>
                      <span className="text-xs text-blue-400">{a.pct}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Recent Transactions */}
        {cardData && transactions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass rounded-2xl p-6 mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Recent Card Transactions</h3>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Real-time updates
              </div>
            </div>

            <div className="space-y-3">
              {transactions.map((tx, i) => (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.05 }}
                  className="flex items-center justify-between p-4 rounded-xl hover:bg-white/5 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-lg">
                      {getCategoryIcon(tx.category)}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{tx.merchant}</div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <MapPin size={10} />
                        {tx.location}
                        <span>•</span>
                        <Clock size={10} />
                        {tx.time}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-semibold ${tx.status === 'success' ? 'text-white' : 'text-red-400'}`}>
                      ₹{tx.amount.toLocaleString()}
                    </div>
                    <div className={`text-xs ${tx.status === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {tx.status === 'success' ? 'Success' : 'Declined'}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Use Case Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="rounded-2xl p-8 bg-gradient-to-r from-blue-900/50 via-purple-900/50 to-blue-900/50 border border-white/5"
        >
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex-1">
              <h3 className="text-xl font-display font-bold text-white mb-2">How It Works</h3>
              <div className="flex flex-wrap gap-3 items-center">
                {[
                  { step: "You land in London 🛬", color: "text-blue-400" },
                  { step: "→", color: "text-gray-600" },
                  { step: "Swipe AssetBridge card 💳", color: "text-purple-400" },
                  { step: "→", color: "text-gray-600" },
                  { step: "Indian FD backs it 🏦", color: "text-amber-400" },
                  { step: "→", color: "text-gray-600" },
                  { step: "GBP released instantly ⚡", color: "text-emerald-400" },
                ].map((s, i) => (
                  <span key={i} className={`text-sm font-medium ${s.color}`}>{s.step}</span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ArrowUpRight size={16} className="text-emerald-400" />
              <TrendingUp size={16} className="text-emerald-400" />
              <span className="text-sm text-emerald-400 font-semibold">Real-time FX</span>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
