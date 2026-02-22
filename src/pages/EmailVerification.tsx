import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Mail, ArrowRight, RefreshCw } from "lucide-react";

interface Props {
  email: string;
  onVerified: () => void;
}

export function EmailVerification({ email, onVerified }: Props) {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }

    // Auto-verify when all filled
    if (newCode.every((c) => c !== "") && newCode.join("").length === 6) {
      setTimeout(() => onVerified(), 500);
    }
  };

  const handleResend = () => {
    setTimer(60);
    setCanResend(false);
    setCode(["", "", "", "", "", ""]);
    // In real app, trigger resend API call
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-dark-900" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "3s" }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Verification Card */}
        <div className="glass rounded-3xl p-8 text-center">
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.6 }}
            className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 flex items-center justify-center mx-auto mb-6"
          >
            <Mail size={32} className="text-blue-400" />
          </motion.div>

          <h2 className="text-3xl font-display font-bold text-white mb-2">Verify Your Email</h2>
          <p className="text-gray-400 mb-8">
            We've sent a 6-digit code to<br />
            <span className="text-blue-400 font-medium">{email}</span>
          </p>

          {/* Code Input */}
          <div className="flex gap-3 justify-center mb-6">
            {code.map((digit, index) => (
              <input
                key={index}
                id={`code-${index}`}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleCodeChange(index, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Backspace" && !digit && index > 0) {
                    const prevInput = document.getElementById(`code-${index - 1}`);
                    prevInput?.focus();
                  }
                }}
                className="w-12 h-14 text-center text-2xl font-bold rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500 transition-all"
              />
            ))}
          </div>

          {/* Timer & Resend */}
          <div className="mb-6">
            {!canResend ? (
              <p className="text-sm text-gray-500">
                Resend code in <span className="text-blue-400 font-semibold">{timer}s</span>
              </p>
            ) : (
              <button
                onClick={handleResend}
                className="text-sm text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-2 mx-auto"
              >
                <RefreshCw size={14} />
                Resend Code
              </button>
            )}
          </div>

          {/* Verify Button */}
          <motion.button
            onClick={() => code.every((c) => c !== "") && onVerified()}
            disabled={!code.every((c) => c !== "")}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={{ scale: code.every((c) => c !== "") ? 1.02 : 1 }}
            whileTap={{ scale: code.every((c) => c !== "") ? 0.98 : 1 }}
          >
            Verify Email
            <ArrowRight size={18} />
          </motion.button>

          {/* Help Text */}
          <p className="text-xs text-gray-600 mt-6">
            Didn't receive the code? Check your spam folder or try resending.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
