import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Globe, Shield, CreditCard, BarChart3, MessageSquare, Home, ArrowRightLeft, ArrowDownLeft, Bell, LogOut } from "lucide-react";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useDisconnect } from 'wagmi';
import type { Page } from "../App";

interface NavbarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onNotificationClick: () => void;
  onLogout?: () => void;
  isInvestor?: boolean;
}

const borrowerNavItems: { page: Page; label: string; icon: React.ReactNode }[] = [
  { page: "dashboard", label: "Dashboard", icon: <Home size={18} /> },
  { page: "credit", label: "Credit Passport", icon: <Shield size={18} /> },
  { page: "assets", label: "Asset Vault", icon: <Globe size={18} /> },
  { page: "card", label: "Global Card", icon: <CreditCard size={18} /> },
  { page: "marketplace", label: "Marketplace", icon: <BarChart3 size={18} /> },
  { page: "fx", label: "FX Hedging", icon: <ArrowRightLeft size={18} /> },
  { page: "remittance", label: "Remittance", icon: <ArrowDownLeft size={18} /> },
  { page: "chatbot", label: "AI Assistant", icon: <MessageSquare size={18} /> },
];

const investorNavItems: { page: Page; label: string; icon: React.ReactNode }[] = [
  { page: "investor-dashboard", label: "Dashboard", icon: <Home size={18} /> },
  { page: "marketplace", label: "Marketplace", icon: <BarChart3 size={18} /> },
  { page: "chatbot", label: "AI Assistant", icon: <MessageSquare size={18} /> },
];

export function Navbar({ currentPage, onNavigate, onNotificationClick, onLogout, isInvestor }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { disconnect } = useDisconnect();
  
  const navItems = isInvestor ? investorNavItems : borrowerNavItems;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-strong">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <motion.button
            onClick={() => onNavigate("landing")}
            className="flex items-center gap-2 cursor-pointer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center animate-pulse-glow">
              <Globe size={18} className="text-white" />
            </div>
            <span className="font-display font-bold text-lg bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              AssetBridge
            </span>
          </motion.button>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-0.5">
            {navItems.map(({ page, label, icon }) => (
              <motion.button
                key={page}
                onClick={() => onNavigate(page)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  currentPage === page
                    ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
              >
                {icon}
                <span className="hidden xl:inline">{label}</span>
              </motion.button>
            ))}
          </div>

          {/* Right Side */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Notification Bell */}
            <motion.button
              onClick={onNotificationClick}
              className="relative p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-all"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Bell size={18} className="text-gray-400" />
              <div className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-dark-900" />
            </motion.button>

            {/* Connect Wallet Button */}
            <div className="scale-90">
              <ConnectButton.Custom>
                {({
                  account,
                  chain,
                  openAccountModal,
                  openChainModal,
                  openConnectModal,
                  mounted,
                }) => {
                  const ready = mounted;
                  const connected = ready && account && chain;

                  return (
                    <div
                      {...(!ready && {
                        'aria-hidden': true,
                        'style': {
                          opacity: 0,
                          pointerEvents: 'none',
                          userSelect: 'none',
                        },
                      })}
                    >
                      {(() => {
                        if (!connected) {
                          return (
                            <button
                              onClick={openConnectModal}
                              type="button"
                              className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold hover:shadow-lg transition-all cursor-pointer"
                            >
                              Connect Wallet
                            </button>
                          );
                        }

                        if (chain.unsupported) {
                          return (
                            <button
                              onClick={openChainModal}
                              type="button"
                              className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold cursor-pointer"
                            >
                              Wrong network
                            </button>
                          );
                        }

                        return (
                          <div className="flex gap-2">
                            <button
                              onClick={openChainModal}
                              type="button"
                              className="px-3 py-2 rounded-xl glass text-sm font-medium cursor-pointer hover:bg-white/10 transition-all flex items-center gap-2"
                            >
                              {chain.hasIcon && (
                                <div
                                  style={{
                                    background: chain.iconBackground,
                                    width: 16,
                                    height: 16,
                                    borderRadius: 999,
                                    overflow: 'hidden',
                                  }}
                                >
                                  {chain.iconUrl && (
                                    <img
                                      alt={chain.name ?? 'Chain icon'}
                                      src={chain.iconUrl}
                                      style={{ width: 16, height: 16 }}
                                    />
                                  )}
                                </div>
                              )}
                              {chain.name}
                            </button>

                            <button
                              onClick={openAccountModal}
                              type="button"
                              className="px-4 py-2 rounded-xl glass text-sm font-medium cursor-pointer hover:bg-white/10 transition-all"
                            >
                              {account.displayName}
                            </button>
                          </div>
                        );
                      })()}
                    </div>
                  );
                }}
              </ConnectButton.Custom>
            </div>

            <motion.button
              className="flex items-center gap-2 px-3 py-1.5 rounded-full glass text-sm cursor-pointer"
              whileHover={{ scale: 1.05 }}
            >
              <CreditCard size={16} className="text-emerald-400" />
              <span className="text-emerald-400 font-semibold">₹2.4M</span>
            </motion.button>
            
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold">
              AB
            </div>

            {/* Logout Button */}
            {onLogout && (
              <motion.button
                onClick={onLogout}
                className="p-2 rounded-lg hover:bg-red-500/10 cursor-pointer transition-all group"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                title="Logout"
              >
                <LogOut size={18} className="text-gray-400 group-hover:text-red-400" />
              </motion.button>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex lg:hidden items-center gap-2">
            <motion.button
              onClick={onNotificationClick}
              className="relative p-2 rounded-lg hover:bg-white/5 cursor-pointer"
              whileHover={{ scale: 1.1 }}
            >
              <Bell size={18} className="text-gray-400" />
              <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-500" />
            </motion.button>
            {onLogout && (
              <motion.button
                onClick={onLogout}
                className="p-2 rounded-lg hover:bg-red-500/10 cursor-pointer"
                whileHover={{ scale: 1.1 }}
              >
                <LogOut size={18} className="text-gray-400" />
              </motion.button>
            )}
            <button className="p-2 cursor-pointer" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden glass-strong border-t border-white/5"
          >
            <div className="px-4 py-3 space-y-1">
              {navItems.map(({ page, label, icon }) => (
                <button
                  key={page}
                  onClick={() => { onNavigate(page); setMobileOpen(false); }}
                  className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer ${
                    currentPage === page
                      ? "bg-blue-600/20 text-blue-400"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {icon}
                  {label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
