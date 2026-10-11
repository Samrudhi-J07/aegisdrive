import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, MessageSquare, X, Send, Sparkles, RefreshCw, 
  ChevronRight, ArrowUpRight, BarChart3, HelpCircle, 
  MapPin, ShieldAlert, Cpu, ExternalLink, Minimize2, Maximize2 
} from 'lucide-react';

export default function AegisChatbot({ setActiveTab }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: "👋 Hi! I'm **Aegis AI**, your offline accident analysis assistant. Ask me anything about accident hotspots, statistics, weather impacts, or get risk predictions!",
      suggestions: [
        "How many accidents in Mumbai?",
        "Top 5 cities by fatalities",
        "Compare Delhi vs Bangalore",
        "What causes the most fatal accidents?",
        "Predict risk for fog + highway"
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, isOpen, isMinimized]);

  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query })
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();

      const botMessage = {
        id: Date.now() + 1,
        sender: 'bot',
        text: data.reply,
        chart: data.chart,
        suggestions: data.suggestions || [],
        actions: data.actions || [],
        intent: data.intent,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: `⚠️ **Unable to fetch response.** Please verify that the AegisDrive backend is running at \`http://localhost:8000\`. (${err.message})`,
          suggestions: ["Try again", "Show accident summary"],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: Date.now(),
        sender: 'bot',
        text: "🧹 Conversation history cleared. Ask me anything about our 20,000+ Indian road accident dataset!",
        suggestions: [
          "How many accidents in Mumbai?",
          "Top 5 cities by fatalities",
          "What causes the most fatal accidents?"
        ],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  // Format bold text and newlines into JSX
  const formatText = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, lIdx) => {
      // Parse markdown bold: **text**
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <span key={lIdx} className="block leading-relaxed">
          {parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={pIdx} className="font-semibold text-cyan-300">{part.slice(2, -2)}</strong>;
            }
            if (part.startsWith('`') && part.endsWith('`')) {
              return <code key={pIdx} className="bg-slate-800 text-cyan-400 px-1 py-0.5 rounded text-xs font-mono">{part.slice(1, -1)}</code>;
            }
            return part;
          })}
        </span>
      );
    });
  };

  return (
    <>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white font-medium shadow-[0_8px_30px_rgba(6,182,212,0.4)] hover:shadow-[0_10px_40px_rgba(6,182,212,0.6)] hover:scale-105 active:scale-95 transition-all duration-200 group border border-cyan-300/30"
          title="Open Aegis AI Assistant"
        >
          <div className="relative">
            <Bot className="w-5 h-5 transition-transform group-hover:rotate-12" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#0B1120] animate-pulse" />
          </div>
          <span className="text-sm font-semibold tracking-wide">Ask Aegis AI</span>
          <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-mono uppercase tracking-wider">Offline</span>
        </button>
      )}

      {/* Floating Chat Window */}
      {isOpen && (
        <div 
          className={`fixed right-6 z-50 flex flex-col bg-[#0F172A] border border-cyan-500/30 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.7)] backdrop-blur-xl overflow-hidden transition-all duration-300 ${
            isMinimized 
              ? 'bottom-6 w-80 h-14' 
              : 'bottom-6 w-[390px] sm:w-[430px] h-[600px] max-h-[85vh]'
          }`}
        >
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-[#131A2B] via-[#1A2338] to-[#0F172A] border-b border-[rgba(99,179,237,0.15)] flex items-center justify-between select-none">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.4)]">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white tracking-wide">Aegis AI</h3>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Offline Mode
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Road Safety & Analytics Intelligence</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleClearHistory}
                className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-slate-800/60 rounded-lg transition-colors"
                title="Clear conversation"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors"
                title={isMinimized ? "Expand" : "Minimize"}
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800/60 rounded-lg transition-colors"
                title="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Main Body (when not minimized) */}
          {!isMinimized && (
            <>
              {/* Message List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} space-y-1.5`}
                  >
                    <div className="flex items-center gap-2 px-1 text-[11px] text-slate-500 font-mono">
                      {msg.sender === 'user' ? (
                        <span>You • {msg.timestamp}</span>
                      ) : (
                        <span className="flex items-center gap-1 text-cyan-400/80">
                          <Sparkles className="w-3 h-3 text-cyan-400" /> Aegis AI • {msg.timestamp}
                        </span>
                      )}
                    </div>

                    {/* Bubble */}
                    <div
                      className={`max-w-[90%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md rounded-tr-none'
                          : 'bg-[#151E33] border border-cyan-500/20 text-slate-200 shadow-lg rounded-tl-none'
                      }`}
                    >
                      {formatText(msg.text)}

                      {/* Mini Data Bar Chart (if provided) */}
                      {msg.chart && msg.chart.type === 'bar' && msg.chart.data && (
                        <div className="mt-3 pt-2.5 border-t border-slate-700/60 space-y-2">
                          <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block">
                            Data Breakdown
                          </span>
                          <div className="space-y-1.5">
                            {msg.chart.data.map((item, idx) => {
                              const maxVal = Math.max(...msg.chart.data.map(d => d.value || 1));
                              const pct = Math.round(((item.value || 0) / maxVal) * 100);
                              return (
                                <div key={idx} className="space-y-0.5">
                                  <div className="flex justify-between text-[11px] font-medium text-slate-300">
                                    <span className="truncate pr-2">{item.name}</span>
                                    <span className="font-mono text-cyan-300 font-semibold">{item.value?.toLocaleString()}</span>
                                  </div>
                                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500" 
                                      style={{ width: `${pct}%` }} 
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Deep-link Action Buttons */}
                      {msg.actions && msg.actions.length > 0 && (
                        <div className="mt-3 pt-2 border-t border-slate-700/60 flex flex-wrap gap-1.5">
                          {msg.actions.map((act, aIdx) => (
                            <button
                              key={aIdx}
                              onClick={() => {
                                if (act.route && setActiveTab) {
                                  setActiveTab(act.route);
                                }
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/25 hover:border-cyan-400 text-[11px] font-medium transition-all duration-150 active:scale-95"
                            >
                              <span>{act.label}</span>
                              <ArrowUpRight className="w-3 h-3 text-cyan-400" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Quick suggestion chips attached to bot message */}
                    {msg.suggestions && msg.suggestions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1 max-w-[95%]">
                        {msg.suggestions.map((sug, sIdx) => (
                          <button
                            key={sIdx}
                            onClick={() => handleSendMessage(sug)}
                            className="text-[11px] px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700 hover:border-cyan-500/50 hover:bg-slate-700/80 text-slate-300 hover:text-cyan-300 transition-all text-left truncate max-w-[280px]"
                          >
                            💬 {sug}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex items-center gap-2 text-slate-400 text-xs py-2 px-3 bg-[#151E33] border border-cyan-500/20 rounded-2xl w-fit">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                    <span>Aegis AI is querying local models...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Box Footer */}
              <div className="p-3 bg-[#0C1222] border-t border-[rgba(99,179,237,0.12)]">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Ask about hotspots, stats, causes..."
                      className="w-full bg-[#151E33] text-slate-100 placeholder-slate-500 text-xs rounded-xl px-3.5 py-2.5 border border-slate-700 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="p-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-white font-medium shadow-md transition-all active:scale-95 flex items-center justify-center"
                    title="Send message"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
                <div className="mt-1.5 flex justify-between items-center px-1 text-[10px] text-slate-500">
                  <span>Runs 100% offline via local NLP & XGBoost</span>
                  <span>Press Enter ↵</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
