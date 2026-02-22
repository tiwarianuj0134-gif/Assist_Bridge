import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, DollarSign, Target, Award, ArrowRight, Shield, Clock, Percent } from "lucide-react";
import { loansApi, userApi } from "../services/api";
import type { Page } from "../App";

interface Props {
  onNavigate: (page: Page) => void;
}

interface FundingOpportunity {
  id: string;
  borrower_name: string;
  amount: number;
  tenure_months: number;
  interest_rate: number;
  emi_amount: number;
  purpose: string;
  trust_score: number;
  collateral_value: number;
  collateral_assets: Array<{ type: string; value: number }>;
  created_at: string;
}

interface Investment {
  id: string;
  amount: number;
  tenure_months: number;
  interest_rate: number;
  status: string;
  borrower_name: string;
  expected_returns: number;
  months_passed: number;
  repaid_amount: number;
  remaining_amount: number;
  returns_earned: number;
  completion_pct: number;
  recovery_amount?: number;
  recovery_percentage?: number;
}

interface PortfolioData {
  user_type: string;
  current_balance: number;
  investments: Investment[];
  total_invested: number;
  total_expected_returns: number;
  total_returns_earned: number;
  active_investments: number;
  completed_investments: number;
}

export function InvestorDashboard({ onNavigate: _onNavigate }: Props) {
  const [opportunities, setOpportunities] = useState<FundingOpportunity[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [investorBalance, setInvestorBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [investing, setInvesting] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'opportunities' | 'portfolio'>('opportunities');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Get investor profile
      const profileResponse = await userApi.getProfile();
      if (profileResponse.status === 'success' && profileResponse.data) {
        const profile = profileResponse.data as any;
        setInvestorBalance(profile.investor_balance || 0);
      }

      // Get funding opportunities
      const loansResponse = await loansApi.getFundingOpportunities();
      if (loansResponse.status === 'success' && loansResponse.data) {
        setOpportunities((loansResponse.data as any).loans || []);
      }

      // Get portfolio
      const portfolioResponse = await loansApi.getPortfolio();
      if (portfolioResponse.status === 'success' && portfolioResponse.data) {
        setPortfolio(portfolioResponse.data as PortfolioData);
      }
    } catch (error) {
      console.error('Failed to load investor data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvest = async (loanId: string, amount: number) => {
    if (investing) return;

    if (amount > investorBalance) {
      alert(`Insufficient balance! You have $${investorBalance.toLocaleString()} but need $${amount.toLocaleString()}`);
      return;
    }

    if (!confirm(`Invest $${amount.toLocaleString()} in this loan?`)) {
      return;
    }

    try {
      setInvesting(loanId);
      const response = await loansApi.investInLoan(loanId);

      if (response.status === 'success') {
        const data = response.data as any;
        alert(`✅ Investment Successful!\n\nAmount Invested: $${amount.toLocaleString()}\nNew Balance: $${data.newBalance.toLocaleString()}\nExpected Returns: $${data.expectedReturns.toLocaleString()}`);
        
        // Reload data
        await loadData();
      } else {
        alert(response.error?.message || 'Investment failed');
      }
    } catch (error) {
      console.error('Investment error:', error);
      alert('Failed to process investment');
    } finally {
      setInvesting(null);
    }
  };

  const getTrustScoreColor = (score: number) => {
    if (score >= 850) return 'text-green-400';
    if (score >= 750) return 'text-blue-400';
    if (score >= 650) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getTrustScoreBg = (score: number) => {
    if (score >= 850) return 'bg-green-500/10 border-green-500/20';
    if (score >= 750) return 'bg-blue-500/10 border-blue-500/20';
    if (score >= 650) return 'bg-yellow-500/10 border-yellow-500/20';
    return 'bg-red-500/10 border-red-500/20';
  };

  return (
    <div className="min-h-screen pt-20 px-4 pb-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-display font-bold text-white mb-2">
            Investor Dashboard
          </h1>
          <p className="text-gray-400">Fund loans and earn competitive returns</p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <DollarSign className="text-green-400" size={20} />
              </div>
              <span className="text-gray-400 text-sm">Available Balance</span>
            </div>
            <div className="text-3xl font-bold text-white">
              ${investorBalance.toLocaleString()}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Target className="text-blue-400" size={20} />
              </div>
              <span className="text-gray-400 text-sm">Opportunities</span>
            </div>
            <div className="text-3xl font-bold text-white">
              {opportunities.length}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <TrendingUp className="text-purple-400" size={20} />
              </div>
              <span className="text-gray-400 text-sm">Avg. Returns</span>
            </div>
            <div className="text-3xl font-bold text-white">
              12%
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                <Award className="text-yellow-400" size={20} />
              </div>
              <span className="text-gray-400 text-sm">Active Investments</span>
            </div>
            <div className="text-3xl font-bold text-white">
              {portfolio?.active_investments || 0}
            </div>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('opportunities')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'opportunities'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                : 'glass text-gray-400 hover:text-white'
            }`}
          >
            Funding Opportunities ({opportunities.length})
          </button>
          <button
            onClick={() => setActiveTab('portfolio')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'portfolio'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                : 'glass text-gray-400 hover:text-white'
            }`}
          >
            My Portfolio ({portfolio?.investments?.length || 0})
          </button>
        </div>

        {/* Funding Opportunities Tab */}
        {activeTab === 'opportunities' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h2 className="text-2xl font-display font-bold text-white mb-6">
              Funding Opportunities
            </h2>

          {loading ? (
            <div className="glass rounded-2xl p-12 text-center">
              <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-gray-400">Loading opportunities...</p>
            </div>
          ) : opportunities.length === 0 ? (
            <div className="glass rounded-2xl p-12 text-center">
              <Target className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Opportunities Available</h3>
              <p className="text-gray-400">Check back later for new funding opportunities</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {opportunities.map((opportunity, index) => (
                <motion.div
                  key={opportunity.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="glass rounded-2xl p-6 hover:shadow-xl hover:shadow-blue-500/10 transition-all"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-1">
                        {opportunity.borrower_name}
                      </h3>
                      <p className="text-sm text-gray-400">{opportunity.purpose}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-lg border ${getTrustScoreBg(opportunity.trust_score)}`}>
                      <div className="flex items-center gap-1">
                        <Shield size={14} className={getTrustScoreColor(opportunity.trust_score)} />
                        <span className={`text-sm font-semibold ${getTrustScoreColor(opportunity.trust_score)}`}>
                          {opportunity.trust_score}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Loan Details */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-gray-400 mb-1">Loan Amount</div>
                      <div className="text-2xl font-bold text-white">
                        ${opportunity.amount.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400 mb-1">Interest Rate</div>
                      <div className="text-2xl font-bold text-green-400 flex items-center gap-1">
                        {opportunity.interest_rate}%
                        <Percent size={16} />
                      </div>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock size={16} className="text-gray-500" />
                      <span className="text-gray-400">Tenure:</span>
                      <span className="text-white font-semibold">{opportunity.tenure_months} months</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign size={16} className="text-gray-500" />
                      <span className="text-gray-400">EMI:</span>
                      <span className="text-white font-semibold">${opportunity.emi_amount.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Collateral */}
                  <div className="mb-4 p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className="text-sm text-gray-400 mb-2">Backed by Collateral</div>
                    <div className="flex items-center gap-2">
                      <Shield className="text-blue-400" size={16} />
                      <span className="text-white font-semibold">
                        ${opportunity.collateral_value.toLocaleString()}
                      </span>
                      <span className="text-gray-400 text-sm">
                        ({opportunity.collateral_assets.map(a => a.type).join(', ')})
                      </span>
                    </div>
                  </div>

                  {/* Expected Returns */}
                  <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <div className="text-sm text-green-400 mb-1">Expected Returns</div>
                    <div className="text-xl font-bold text-green-400">
                      ${Math.round(opportunity.amount * (opportunity.interest_rate / 100) * (opportunity.tenure_months / 12)).toLocaleString()}
                    </div>
                  </div>

                  {/* Invest Button */}
                  <motion.button
                    onClick={() => handleInvest(opportunity.id, opportunity.amount)}
                    disabled={investing === opportunity.id || opportunity.amount > investorBalance}
                    className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                      investing === opportunity.id
                        ? 'bg-gray-600 cursor-not-allowed'
                        : opportunity.amount > investorBalance
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-green-600 to-blue-600 text-white hover:shadow-lg hover:shadow-green-500/25'
                    }`}
                    whileHover={opportunity.amount <= investorBalance && !investing ? { scale: 1.02 } : {}}
                    whileTap={opportunity.amount <= investorBalance && !investing ? { scale: 0.98 } : {}}
                  >
                    {investing === opportunity.id ? (
                      <>
                        <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                        Processing...
                      </>
                    ) : opportunity.amount > investorBalance ? (
                      'Insufficient Balance'
                    ) : (
                      <>
                        Invest Now
                        <ArrowRight size={18} />
                      </>
                    )}
                  </motion.button>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
        )}

        {/* Portfolio Tab */}
        {activeTab === 'portfolio' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h2 className="text-2xl font-display font-bold text-white mb-6">
              My Investment Portfolio
            </h2>

            {loading ? (
              <div className="glass rounded-2xl p-12 text-center">
                <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-gray-400">Loading portfolio...</p>
              </div>
            ) : !portfolio || portfolio.investments.length === 0 ? (
              <div className="glass rounded-2xl p-12 text-center">
                <Award className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Investments Yet</h3>
                <p className="text-gray-400 mb-4">Start investing in loans to build your portfolio</p>
                <button
                  onClick={() => setActiveTab('opportunities')}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:shadow-lg transition-all"
                >
                  View Opportunities
                </button>
              </div>
            ) : (
              <>
                {/* Portfolio Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="glass rounded-2xl p-6">
                    <div className="text-sm text-gray-400 mb-2">Total Invested</div>
                    <div className="text-3xl font-bold text-white">
                      ${portfolio.total_invested.toLocaleString()}
                    </div>
                  </div>
                  <div className="glass rounded-2xl p-6">
                    <div className="text-sm text-gray-400 mb-2">Expected Returns</div>
                    <div className="text-3xl font-bold text-green-400">
                      ${portfolio.total_expected_returns.toLocaleString()}
                    </div>
                  </div>
                  <div className="glass rounded-2xl p-6">
                    <div className="text-sm text-gray-400 mb-2">Returns Earned</div>
                    <div className="text-3xl font-bold text-blue-400">
                      ${portfolio.total_returns_earned.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Investment List */}
                <div className="space-y-6">
                  {portfolio.investments.map((investment, index) => (
                    <motion.div
                      key={investment.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="glass rounded-2xl p-6"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-semibold text-white mb-1">
                            {investment.borrower_name}
                          </h3>
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                              investment.status === 'ACTIVE' ? 'bg-green-500/10 text-green-400' :
                              investment.status === 'REPAID' ? 'bg-blue-500/10 text-blue-400' :
                              investment.status === 'DEFAULTED' ? 'bg-red-500/10 text-red-400' :
                              'bg-gray-500/10 text-gray-400'
                            }`}>
                              {investment.status}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-400">Investment Amount</div>
                          <div className="text-2xl font-bold text-white">
                            ${investment.amount.toLocaleString()}
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar (for ACTIVE loans) */}
                      {investment.status === 'ACTIVE' && (
                        <div className="mb-4">
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-gray-400">Repayment Progress</span>
                            <span className="text-white font-semibold">{investment.completion_pct}%</span>
                          </div>
                          <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all"
                              style={{ width: `${investment.completion_pct}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Default Recovery Info */}
                      {investment.status === 'DEFAULTED' && investment.recovery_amount !== undefined && (
                        <div className="mb-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                          <div className="flex items-center gap-2 mb-3">
                            <Shield className="text-red-400" size={20} />
                            <span className="text-red-400 font-semibold">Loan Defaulted - Recovery Information</span>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="text-sm text-gray-400 mb-1">Recovered Amount</div>
                              <div className="text-xl font-bold text-white">
                                ${investment.recovery_amount.toLocaleString()}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-400 mb-1">Recovery Rate</div>
                              <div className="text-xl font-bold text-yellow-400">
                                {investment.recovery_percentage?.toFixed(1)}%
                              </div>
                            </div>
                          </div>
                          <div className="mt-3 text-sm text-gray-400">
                            Collateral liquidated with 8% haircut. Recovered funds will be credited to your account.
                          </div>
                        </div>
                      )}

                      {/* Investment Details */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <div className="text-sm text-gray-400 mb-1">Interest Rate</div>
                          <div className="text-lg font-semibold text-green-400">
                            {investment.interest_rate}%
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-400 mb-1">Tenure</div>
                          <div className="text-lg font-semibold text-white">
                            {investment.tenure_months} months
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-400 mb-1">Expected Returns</div>
                          <div className="text-lg font-semibold text-blue-400">
                            ${investment.expected_returns.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-400 mb-1">Returns Earned</div>
                          <div className="text-lg font-semibold text-purple-400">
                            ${investment.returns_earned.toLocaleString()}
                          </div>
                        </div>
                      </div>

                      {/* Repayment Details (for ACTIVE loans) */}
                      {investment.status === 'ACTIVE' && (
                        <div className="mt-4 pt-4 border-t border-white/10">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="text-sm text-gray-400 mb-1">Repaid Amount</div>
                              <div className="text-lg font-semibold text-white">
                                ${investment.repaid_amount.toLocaleString()}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-400 mb-1">Remaining Amount</div>
                              <div className="text-lg font-semibold text-white">
                                ${investment.remaining_amount.toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
