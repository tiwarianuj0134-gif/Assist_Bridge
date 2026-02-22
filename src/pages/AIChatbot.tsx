import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Send, Bot, User, Sparkles, Globe, Scale, FileText, Lightbulb } from "lucide-react";
import type { Page } from "../App";
import { aiApi } from "../services/api";

interface Props { onNavigate: (p: Page) => void; }

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

const quickQuestions = [
  { icon: <Scale size={16} />, text: "Tax implications of using Indian gold for Dubai loan?" },
  { icon: <Globe size={16} />, text: "Best asset to collateralize for UK credit?" },
  { icon: <FileText size={16} />, text: "GDPR compliance for cross-border data?" },
  { icon: <Lightbulb size={16} />, text: "How does reverse remittance work?" },
];

export function AIChatbot({ onNavigate }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      role: "assistant",
      content: "Hello! I'm your **Legal & Tax AI Assistant** 🤖\n\nI can help you with:\n- 📋 Tax implications across countries\n- ⚖️ Legal compliance questions\n- 💰 Best asset choices per country\n- ⚠️ Regulatory warnings\n\nWhat would you like to know?",
      timestamp: "Just now"
    }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  void onNavigate;

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = {
      id: messages.length,
      role: "user",
      content: text,
      timestamp: "Just now"
    };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      // Call real OpenAI API through backend
      const response = await aiApi.chat(text);
      
      if (response.status === 'success' && response.data) {
        const botMsg: Message = {
          id: messages.length + 1,
          role: "assistant",
          content: (response.data as any)?.response || JSON.stringify(response.data),
          timestamp: "Just now"
        };
        setMessages(prev => [...prev, botMsg]);
      } else {
        // Error response
        const errorMsg: Message = {
          id: messages.length + 1,
          role: "assistant",
          content: "Sorry, I encountered an error processing your request. Please try again.",
          timestamp: "Just now"
        };
        setMessages(prev => [...prev, errorMsg]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMsg: Message = {
        id: messages.length + 1,
        role: "assistant",
        content: "Sorry, I'm having trouble connecting to the AI service. Please check your connection and try again.",
        timestamp: "Just now"
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const formatContent = (content: string) => {
    return content.split('\n').map((line, i) => {
      if (line.startsWith('## ')) return <h3 key={i} className="text-lg font-bold text-white mt-3 mb-2">{line.slice(3)}</h3>;
      if (line.startsWith('### ')) return <h4 key={i} className="text-sm font-bold text-blue-300 mt-2 mb-1">{line.slice(4)}</h4>;
      if (line.startsWith('- **')) {
        const parts = line.slice(2).split('**');
        return <p key={i} className="text-sm text-gray-300 ml-3">• <strong className="text-white">{parts[1]}</strong>{parts[2]}</p>;
      }
      if (line.startsWith('- ')) return <p key={i} className="text-sm text-gray-300 ml-3">• {line.slice(2)}</p>;
      if (line.startsWith('1. ') || line.startsWith('2. ') || line.startsWith('3. ') || line.startsWith('4. ') || line.startsWith('5. ')) {
        return <p key={i} className="text-sm text-gray-300 ml-3">{line}</p>;
      }
      if (line.startsWith('⚠️') || line.startsWith('💡') || line.startsWith('🔗') || line.startsWith('📊')) {
        return <p key={i} className="text-sm text-gray-300 mt-2">{line}</p>;
      }
      if (line.startsWith('`') && line.endsWith('`')) {
        return <code key={i} className="block text-xs bg-white/5 rounded-lg p-2 my-1 font-mono text-purple-300">{line.slice(1, -1)}</code>;
      }
      if (line.trim() === '') return <br key={i} />;
      return <p key={i} className="text-sm text-gray-300">{line}</p>;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pt-20 pb-8 px-4 min-h-screen flex flex-col"
    >
      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
              <Bot size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-white">Legal & Tax AI Assistant</h1>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-gray-500">Online • Powered by AI</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Questions */}
        <div className="flex flex-wrap gap-2 mb-4">
          {quickQuestions.map((q, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => sendMessage(q.text)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl glass text-xs text-gray-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              whileHover={{ scale: 1.02 }}
            >
              {q.icon}
              <span className="hidden sm:inline">{q.text}</span>
              <span className="sm:hidden">{q.text.split(" ").slice(0, 4).join(" ")}...</span>
            </motion.button>
          ))}
        </div>

        {/* Chat Area */}
        <div
          ref={chatRef}
          className="flex-1 glass rounded-2xl p-4 overflow-y-auto space-y-4 mb-4"
          style={{ maxHeight: "calc(100vh - 340px)", minHeight: "400px" }}
        >
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                msg.role === "user"
                  ? "bg-gradient-to-br from-blue-500 to-purple-600"
                  : "bg-gradient-to-br from-purple-500 to-blue-600"
              }`}>
                {msg.role === "user" ? <User size={16} className="text-white" /> : <Sparkles size={16} className="text-white" />}
              </div>
              <div className={`max-w-[80%] rounded-2xl p-4 ${
                msg.role === "user"
                  ? "bg-blue-600/20 border border-blue-500/20"
                  : "bg-white/5 border border-white/5"
              }`}>
                {msg.role === "user" ? (
                  <p className="text-sm text-white">{msg.content}</p>
                ) : (
                  <div>{formatContent(msg.content)}</div>
                )}
              </div>
            </motion.div>
          ))}

          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                <Sparkles size={16} className="text-white" />
              </div>
              <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Input */}
        <div className="glass rounded-2xl p-3 flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
            placeholder="Ask about tax, legal, compliance, or asset recommendations..."
            className="flex-1 bg-transparent text-white text-sm outline-none placeholder-gray-600 px-2"
          />
          <motion.button
            onClick={() => sendMessage(input)}
            className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white cursor-pointer"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Send size={18} />
          </motion.button>
        </div>

        <p className="text-center text-xs text-gray-600 mt-3">
          <MessageSquare size={12} className="inline mr-1" />
          AI responses are for informational purposes. Always consult a professional for legal/tax decisions.
        </p>
      </div>
    </motion.div>
  );
}
