import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { aiApi } from '../services/api';
import type { Page } from '../App';

interface VoiceAgentProps {
  onNavigate: (page: Page) => void;
}

type AgentState = 'idle' | 'listening' | 'processing' | 'speaking';

interface AIResponse {
  action: 'NAVIGATE' | 'LOCK_PREFILL' | 'LOAN_PREFILL' | 'CHAT';
  params?: any;
  message?: string;
}

export function VoiceAgent({ onNavigate }: VoiceAgentProps) {
  const [state, setState] = useState<AgentState>('idle');
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Initialize Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.error('❌ Speech Recognition not supported in this browser');
      setError('Speech recognition not supported. Please use Chrome or Edge.');
      return;
    }

    console.log('✅ Initializing Speech Recognition...');
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      console.log('🎤 Speech recognition started');
      setState('listening');
      setTranscript('');
      setError('');
    };

    recognition.onresult = async (event: any) => {
      const text = event.results[0][0].transcript;
      console.log('🗣️ Transcript received:', text);
      setTranscript(text);
      setState('processing');
      
      // Send to backend for processing
      await processCommand(text);
    };

    recognition.onerror = (event: any) => {
      console.error('❌ Speech recognition error:', event.error);
      if (event.error === 'no-speech') {
        setError('No speech detected. Please try again.');
      } else if (event.error === 'not-allowed') {
        setError('Microphone access denied. Please enable it in browser settings.');
      } else if (event.error === 'aborted') {
        // Ignore aborted errors (happens when manually stopped)
        console.log('⚠️ Recognition aborted (normal)');
      } else {
        setError('Error: ' + event.error);
      }
      setState('idle');
    };

    recognition.onend = () => {
      console.log('🛑 Speech recognition ended');
      // Don't change state here - let processCommand handle it
    };

    recognitionRef.current = recognition;
    console.log('✅ Speech Recognition initialized successfully');

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          console.log('Recognition cleanup error (safe to ignore)');
        }
      }
    };
  }, []);

  const processCommand = async (text: string) => {
    try {
      console.log('📤 Sending command to backend:', text);
      const token = getAuthToken();
      console.log('🔐 Auth token:', token ? 'Present ✅' : 'Missing ❌');

      if (!token) {
        console.error('❌ No auth token found - user not logged in');
        setError('Please login first to use voice commands');
        setState('idle');
        return;
      }

      console.log('🌐 Connecting to backend...');
      const response = await aiApi.voiceCommand(text);

      console.log('✅ Backend response:', response);
      
      if (response.status === 'success' && response.data) {
        const aiResponse: AIResponse = response.data as AIResponse;
        console.log('🎯 Executing action:', aiResponse.action);
        console.log('📋 Action params:', aiResponse.params);
        console.log('💬 Action message:', aiResponse.message);
        await executeAction(aiResponse);
      } else {
        console.error('❌ Invalid response format:', response);
        setError(response.error?.message || 'Failed to process command');
        setState('idle');
      }
    } catch (error: any) {
      console.error('❌ Command processing error:', error);
      console.error('Error details:', error.message, error.stack);
      
      // Check if backend is running
      if (error.message?.includes('fetch') || error.message?.includes('Failed to fetch')) {
        setError('Cannot connect to backend. Please ensure backend is running on port 3000.');
      } else {
        setError(`Connection error: ${error.message || 'Failed to connect to AI service'}`);
      }
      setState('idle');
    }
  };

  const executeAction = async (response: AIResponse) => {
    setState('speaking');

    switch (response.action) {
      case 'NAVIGATE':
        const pagePath = response.params?.path || '';
        speak(`Navigating to ${pagePath.replace('/', '')}`);
        setTimeout(() => {
          onNavigate(pagePath.replace('/', '') as any);
          setState('idle');
        }, 1000);
        break;

      case 'LOCK_PREFILL':
        speak(`Preparing to lock ${response.params?.type} worth ${response.params?.value} rupees`);
        setTimeout(() => {
          // Store data in sessionStorage for prefill
          sessionStorage.setItem('assetPrefill', JSON.stringify({
            action: 'lock',
            assetType: response.params?.type,
            value: response.params?.value
          }));
          onNavigate('assets');
          setState('idle');
        }, 1500);
        break;

      case 'LOAN_PREFILL':
        speak(`Preparing loan application for ${response.params?.amount} rupees`);
        setTimeout(() => {
          // Store data in sessionStorage for prefill
          sessionStorage.setItem('loanPrefill', JSON.stringify({
            action: 'apply',
            amount: response.params?.amount,
            purpose: response.params?.purpose
          }));
          onNavigate('marketplace');
          setState('idle');
        }, 1500);
        break;

      case 'CHAT':
        const message = response.message || 'I understand your request';
        speak(message);
        setTimeout(() => {
          setState('idle');
        }, 2000);
        break;

      default:
        speak('I did not understand that command');
        setState('idle');
    }
  };

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.1;
      utterance.pitch = 1;
      utterance.volume = 1;
      window.speechSynthesis.speak(utterance);
    }
  };

  const getAuthToken = () => {
    const user = localStorage.getItem('assetbridge_user');
    if (user) {
      const parsed = JSON.parse(user);
      return parsed.accessToken || '';
    }
    return '';
  };

  const handleClick = () => {
    console.log('🖱️ Voice button clicked, current state:', state);
    
    if (state === 'idle') {
      if (recognitionRef.current) {
        try {
          console.log('🎤 Starting speech recognition...');
          recognitionRef.current.start();
        } catch (error: any) {
          console.error('❌ Failed to start recognition:', error);
          if (error.message?.includes('already started')) {
            console.log('⚠️ Recognition already running, stopping first...');
            recognitionRef.current.stop();
            setTimeout(() => {
              try {
                recognitionRef.current.start();
              } catch (e) {
                console.error('❌ Still failed to start:', e);
                setError('Failed to start voice recognition. Please refresh the page.');
              }
            }, 100);
          } else {
            setError('Failed to start voice recognition: ' + error.message);
          }
        }
      } else {
        console.error('❌ Recognition not initialized');
        setError('Speech recognition not supported in this browser. Please use Chrome or Edge.');
      }
    } else if (state === 'listening') {
      if (recognitionRef.current) {
        console.log('🛑 Stopping speech recognition...');
        try {
          recognitionRef.current.stop();
        } catch (error) {
          console.error('❌ Error stopping recognition:', error);
        }
      }
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        onClick={handleClick}
        className={`fixed bottom-8 right-8 z-50 w-16 h-16 rounded-full flex items-center justify-center cursor-pointer shadow-2xl ${
          state === 'idle' ? 'bg-gradient-to-br from-blue-600 to-purple-600' :
          state === 'listening' ? 'bg-gradient-to-br from-red-500 to-pink-500' :
          state === 'processing' ? 'bg-gradient-to-br from-amber-500 to-orange-500' :
          'bg-gradient-to-br from-emerald-500 to-green-500'
        }`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={state === 'listening' ? {
          scale: [1, 1.2, 1],
          boxShadow: [
            '0 0 0 0 rgba(239, 68, 68, 0.7)',
            '0 0 0 20px rgba(239, 68, 68, 0)',
            '0 0 0 0 rgba(239, 68, 68, 0)',
          ],
        } : {}}
        transition={{
          duration: 1.5,
          repeat: state === 'listening' ? Infinity : 0,
        }}
      >
        {state === 'idle' && <Mic size={28} className="text-white" />}
        {state === 'listening' && <Mic size={28} className="text-white animate-pulse" />}
        {state === 'processing' && <Loader2 size={28} className="text-white animate-spin" />}
        {state === 'speaking' && <MicOff size={28} className="text-white" />}
      </motion.button>

      {/* Status Tooltip */}
      <AnimatePresence>
        {(state !== 'idle' || transcript || error) && (
          <motion.div
            initial={{ opacity: 0, y: 20, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: 20, x: 20 }}
            className="fixed bottom-28 right-8 z-50 max-w-xs"
          >
            <div className="glass-strong rounded-2xl p-4 border border-white/10">
              {state === 'listening' && (
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    {[0, 1, 2, 3].map((i) => (
                      <motion.div
                        key={i}
                        className="w-1 bg-red-500 rounded-full"
                        animate={{
                          height: [8, 24, 8],
                        }}
                        transition={{
                          duration: 0.8,
                          repeat: Infinity,
                          delay: i * 0.1,
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-white font-medium">Listening...</span>
                </div>
              )}
              
              {state === 'processing' && (
                <div className="flex items-center gap-3">
                  <Loader2 size={20} className="text-amber-400 animate-spin" />
                  <div>
                    <div className="text-sm text-white font-medium">Processing...</div>
                    {transcript && (
                      <div className="text-xs text-gray-400 mt-1">"{transcript}"</div>
                    )}
                  </div>
                </div>
              )}
              
              {state === 'speaking' && (
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-sm text-white font-medium">Executing command...</span>
                </div>
              )}
              
              {error && (
                <div className="text-sm text-red-400">{error}</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voice Command Hints */}
      <AnimatePresence>
        {state === 'listening' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bottom-48 right-8 z-40 max-w-sm"
          >
            <div className="glass rounded-xl p-4 border border-blue-500/30">
              <div className="text-xs font-semibold text-blue-400 mb-2">Try saying:</div>
              <div className="space-y-1 text-xs text-gray-400">
                <div>• "Take me to dashboard"</div>
                <div>• "Lock 50000 gold"</div>
                <div>• "I want a loan of 5 lakhs"</div>
                <div>• "Show me marketplace"</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
