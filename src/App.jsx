import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

function App() {
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Hello. I am ready to assist you.' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Configuration - Hardcoded as requested
    // Note: 'ollama.com' endpoint usually refers to local but user specified this.
    // Using a generic structure that points to what the user likely intends.
    const ENDPOINT = 'https://api.ollama.com/api/chat';
    const API_KEY = 'c7dd4e206a21493286a6ead9018e9014.qUPyd9pTEpw0mresqCosnxYf';
    const MODEL = 'llama3';

    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch(ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_KEY}`
                },
                body: JSON.stringify({
                    model: MODEL,
                    messages: [...messages, userMessage].map(m => ({
                        role: m.role,
                        content: m.content
                    })),
                    stream: false
                }),
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();
            const content = data.message?.content || data.response || "Received empty response.";

            setMessages(prev => [...prev, { role: 'assistant', content }]);
        } catch (error) {
            console.error('Error:', error);
            // Fallback/Mock response if the endpoint doesn't actually exist publicly yet
            // This ensures the UI doesn't just break if the user gave a hypothetical URL
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `I encountered an error connecting to the endpoint (${error.message}).`
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-screen text-gray-100 font-sans selection:bg-blue-500/30">

            {/* Header - Minimalist */}
            <header className="fixed top-0 left-0 right-0 p-6 z-20 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
                <div className="max-w-4xl mx-auto flex items-center justify-between pointer-events-auto">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-md">
                            <Sparkles size={16} className="text-blue-400" />
                        </div>
                        <h1 className="font-medium text-lg tracking-wide text-white/90">Ollama AI</h1>
                    </div>
                    <div className="px-3 py-1 rounded-full bg-white/5 border border-white/5 text-xs text-gray-400 font-mono">
                        {MODEL}
                    </div>
                </div>
            </header>

            {/* Chat Area */}
            <main className="flex-1 overflow-y-auto px-4 pt-24 pb-32">
                <div className="max-w-3xl mx-auto space-y-8">
                    {messages.map((msg, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                            className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            {msg.role !== 'user' && (
                                <div className="w-8 h-8 rounded-full flex-shrink-0 bg-gradient-to-br from-gray-700 to-gray-900 border border-white/10 flex items-center justify-center mt-1">
                                    <Sparkles size={14} className="text-gray-400" />
                                </div>
                            )}

                            <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-6 py-4 shadow-sm ${msg.role === 'user'
                                    ? 'glass-bubble-user text-white rounded-tr-sm'
                                    : 'glass-bubble-bot text-gray-100 rounded-tl-sm'
                                }`}>
                                <div className="prose prose-invert prose-p:leading-relaxed prose-pre:bg-black/30 prose-pre:border prose-pre:border-white/10 max-w-none">
                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                </div>
                            </div>

                            {msg.role === 'user' && (
                                <div className="w-8 h-8 rounded-full flex-shrink-0 bg-blue-600/20 border border-blue-500/30 flex items-center justify-center mt-1">
                                    <User size={14} className="text-blue-400" />
                                </div>
                            )}
                        </motion.div>
                    ))}

                    {isLoading && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex gap-4 justify-start"
                        >
                            <div className="w-8 h-8 rounded-full flex-shrink-0 bg-gradient-to-br from-gray-700 to-gray-900 border border-white/10 flex items-center justify-center mt-1">
                                <Sparkles size={14} className="text-gray-400" />
                            </div>
                            <div className="glass-bubble-bot px-5 py-4 rounded-2xl rounded-tl-sm flex items-center gap-1.5">
                                <div className="typing-dot"></div>
                                <div className="typing-dot"></div>
                                <div className="typing-dot"></div>
                            </div>
                        </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </main>

            {/* Input Area - Floating */}
            <footer className="fixed bottom-0 left-0 right-0 p-4 z-20 bg-gradient-to-t from-black via-black/90 to-transparent pb-6 pt-12">
                <div className="max-w-3xl mx-auto">
                    <form onSubmit={handleSubmit} className="relative group input-glow-container">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl blur-xl transition-opacity opacity-50 group-focus-within:opacity-100"></div>

                        <div className="relative flex items-center glass-panel rounded-2xl p-2 md:p-2.5 border border-white/10 shadow-2xl shadow-black/50 transition-all duration-300 group-focus-within:border-white/20 group-focus-within:bg-black/40">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask anything..."
                                className="flex-1 bg-transparent border-none text-white placeholder-gray-500 focus:ring-0 px-4 py-2 text-base md:text-lg"
                                disabled={isLoading}
                            />
                            <button
                                type="submit"
                                disabled={isLoading || !input.trim()}
                                className="p-2.5 rounded-xl bg-white text-black hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95"
                            >
                                <Send size={18} className="ml-0.5" />
                            </button>
                        </div>
                    </form>
                    <div className="text-center mt-3">
                        <p className="text-[10px] text-gray-600 font-medium tracking-wider">AI MAY PRODUCE INACCURATE INFORMATION</p>
                    </div>
                </div>
            </footer>
        </div>
    )
}

export default App
