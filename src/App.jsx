import React, { useState, useRef, useEffect } from 'react';
import { Send, Settings, User, Bot, Loader2, Key } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

function App() {
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Hello! I am your AI assistant. How can I help you today?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    // Settings
    const [endpoint, setEndpoint] = useState('http://localhost:11434/api/generate');
    const [apiKey, setApiKey] = useState('c7dd4e206a21493286a6ead9018e9014.qUPyd9pTEpw0mresqCosnxYf');
    const [model, setModel] = useState('llama3');

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
            // Prepare headers
            const headers = {
                'Content-Type': 'application/json',
            };
            if (apiKey) {
                headers['Authorization'] = `Bearer ${apiKey}`;
            }

            // Prepare body based on common Ollama API formats
            // If it's pure Ollama, it might expect 'prompt' instead of 'messages' for /api/generate
            // or 'messages' for /api/chat. Let's try to support /api/chat format or /api/generate.

            // We will assume standard Ollama /api/chat format since it's a chatbot
            // But user said "ollama.com api key", might be an external provider.

            const payload = {
                model: model,
                messages: [...messages, userMessage],
                stream: false
            };

            // Adjust payload if using /api/generate (completion) vs /api/chat (chat)
            // Simple heuristic: check if endpoint contains 'chat'
            const isChatEndpoint = endpoint.includes('/chat');
            const requestBody = isChatEndpoint ? payload : {
                model: model,
                prompt: messages.map(m => `${m.role}: ${m.content}`).join('\n') + `\nuser: ${input}\nassistant:`,
                stream: false
            };

            const response = await fetch(endpoint, {
                method: 'POST',
                headers,
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                throw new Error(`Error: ${response.statusText}`);
            }

            const data = await response.json();

            // Handle different response formats
            const content = data.message?.content || data.response || "No response received.";

            setMessages(prev => [...prev, { role: 'assistant', content }]);
        } catch (error) {
            console.error('Error:', error);
            setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${error.message}. Please check your endpoint and API key settings.` }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-screen overflow-hidden text-gray-100 font-sans">
            {/* Header */}
            <header className="glass-panel p-4 flex justify-between items-center z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-900/40">
                        <Bot size={24} className="text-white" />
                    </div>
                    <div>
                        <h1 className="font-bold text-xl tracking-tight gradient-text">Ollama Chat</h1>
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                            <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`}></div>
                            {isLoading ? 'Thinking...' : 'Online'}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                    <Settings size={20} className="text-gray-300" />
                </button>
            </header>

            {/* Settings Modal */}
            <AnimatePresence>
                {showSettings && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="absolute top-20 right-4 w-80 glass-panel p-6 rounded-2xl shadow-2xl z-50 border-gray-700"
                    >
                        <h3 className="font-bold mb-4 text-lg">Configuration</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Ollama URL</label>
                                <input
                                    type="text"
                                    value={endpoint}
                                    onChange={(e) => setEndpoint(e.target.value)}
                                    className="w-full bg-black/40 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none transition-colors"
                                    placeholder="http://localhost:11434/api/chat"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Model</label>
                                <input
                                    type="text"
                                    value={model}
                                    onChange={(e) => setModel(e.target.value)}
                                    className="w-full bg-black/40 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none transition-colors"
                                    placeholder="llama3"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">API Key (Optional)</label>
                                <div className="relative">
                                    <input
                                        type="password"
                                        value={apiKey}
                                        onChange={(e) => setApiKey(e.target.value)}
                                        className="w-full bg-black/40 border border-gray-700 rounded-lg pl-3 pr-8 py-2 text-sm focus:border-blue-500 focus:outline-none transition-colors"
                                        placeholder="sk-..."
                                    />
                                    <Key size={14} className="absolute right-3 top-2.5 text-gray-500" />
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-gray-700 flex justify-end">
                            <button
                                onClick={() => setShowSettings(false)}
                                className="text-sm bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors shadow-lg shadow-blue-900/20"
                            >
                                Done
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Chat Area */}
            <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
                {messages.map((msg, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                        {/* Avatar */}
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${msg.role === 'user'
                            ? 'bg-blue-600'
                            : 'bg-gradient-to-br from-purple-500 to-indigo-600'
                            }`}>
                            {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                        </div>

                        {/* Bubble */}
                        <div className={`max-w-[80%] rounded-2xl px-5 py-3.5 shadow-md ${msg.role === 'user'
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : 'glass-panel text-gray-200 rounded-bl-none border border-white/5'
                            }`}>
                            <div className="prose prose-invert prose-sm max-w-none">
                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                            </div>
                        </div>
                    </motion.div>
                ))}
                {isLoading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex gap-4"
                    >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                            <Bot size={16} />
                        </div>
                        <div className="glass-panel text-gray-400 px-4 py-3 rounded-2xl rounded-bl-none flex items-center gap-2">
                            <Loader2 size={16} className="animate-spin" />
                            <span className="text-sm">Generating response...</span>
                        </div>
                    </motion.div>
                )}
                <div ref={messagesEndRef} />
            </main>

            {/* Input Area */}
            <footer className="p-4 z-10 max-w-4xl mx-auto w-full">
                <form onSubmit={handleSubmit} className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl opacity-30 group-focus-within:opacity-100 transition duration-500 blur"></div>
                    <div className="relative flex items-center glass-panel rounded-xl p-1.5 focus-within:ring-1 ring-white/10">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type your message..."
                            className="flex-1 bg-transparent border-none text-white placeholder-gray-500 focus:ring-0 px-4 py-3"
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            className="p-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/30"
                        >
                            <Send size={20} />
                        </button>
                    </div>
                    <div className="text-center mt-2">
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-medium">Powered by Ollama</p>
                    </div>
                </form>
            </footer>
        </div>
    )
}

export default App
