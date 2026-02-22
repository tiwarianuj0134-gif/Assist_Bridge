import { motion, AnimatePresence } from "framer-motion";
import { X, Bell, Shield, TrendingUp, CreditCard, Globe, AlertTriangle, CheckCircle, Clock } from "lucide-react";

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const notifications = [
  {
    id: 1,
    type: "success",
    title: "Asset Tokenized Successfully",
    detail: "Your HDFC FD (₹15L) has been tokenized. Token ID: RWA-FD-001",
    time: "2 min ago",
    icon: <Shield size={16} />,
    read: false,
  },
  {
    id: 2,
    type: "info",
    title: "Trust Score Updated",
    detail: "Your Global Trust Score increased by 23 points to 847/1000",
    time: "1h ago",
    icon: <TrendingUp size={16} />,
    read: false,
  },
  {
    id: 3,
    type: "warning",
    title: "GBP Volatility Alert",
    detail: "INR/GBP volatility increased 15%. Auto-hedge trigger at 2.5%",
    time: "3h ago",
    icon: <AlertTriangle size={16} />,
    read: false,
  },
  {
    id: 4,
    type: "success",
    title: "Card Transaction",
    detail: "£45.20 spent at Tesco London. Backed by Indian FD collateral.",
    time: "5h ago",
    icon: <CreditCard size={16} />,
    read: true,
  },
  {
    id: 5,
    type: "info",
    title: "P2P Lending Return",
    detail: "You earned $125 from Lending Pool #7. Total ROI: 10.8%",
    time: "1d ago",
    icon: <Globe size={16} />,
    read: true,
  },
  {
    id: 6,
    type: "success",
    title: "KYC Verified",
    detail: "Your identity verification is complete. All countries unlocked.",
    time: "2d ago",
    icon: <CheckCircle size={16} />,
    read: true,
  },
  {
    id: 7,
    type: "info",
    title: "Reverse Remittance Active",
    detail: "₹40L credit line activated for Rajesh Mehta (Father) in India.",
    time: "3d ago",
    icon: <Globe size={16} />,
    read: true,
  },
];

export function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ type: "spring", damping: 25 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-md glass-strong border-l border-white/5"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <Bell size={20} className="text-blue-400" />
                  <h3 className="text-lg font-semibold text-white">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-blue-600/20 text-blue-400 text-xs font-medium">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-all cursor-pointer">
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              {/* Notifications List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {notifications.map((notif, i) => (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`p-4 rounded-xl transition-all cursor-pointer hover:bg-white/10 ${
                      notif.read ? "bg-white/3" : "bg-white/5 border-l-2 border-blue-500"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        notif.type === "success" ? "bg-emerald-500/20 text-emerald-400" :
                        notif.type === "warning" ? "bg-amber-500/20 text-amber-400" :
                        "bg-blue-500/20 text-blue-400"
                      }`}>
                        {notif.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-sm font-semibold text-white truncate">{notif.title}</h4>
                          {!notif.read && <div className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />}
                        </div>
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">{notif.detail}</p>
                        <div className="flex items-center gap-1 mt-2 text-xs text-gray-600">
                          <Clock size={10} />
                          {notif.time}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-white/5">
                <button className="w-full py-2.5 rounded-xl glass text-sm text-gray-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer">
                  Mark all as read
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
