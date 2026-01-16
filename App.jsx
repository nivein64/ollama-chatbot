import React, { useState, useRef, useEffect } from 'react';
import { SendHorizontal, Sparkles, User, StopCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

function App() {
    const [messages, setMessages] = useState([
        { role: 'assistant', content: "I'm ready. How can I help?" }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [controller, setController] = useState(null);

    const ENDPOINT = 'https://api.ollama.com/api/chat';
    const API_KEY = 'c7dd4e206a21493286a6ead9018e9014.qUPyd9pTEpw0mresqCosnxYf';
    const MODEL = 'llama3';

    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [input]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        // Abort controller for cancelling requests
        const abortController = new AbortController();
        setController(abortController);

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
                    stream: false // Using false for now as streaming requires more complex handling with this endpoint
                }),
                signal: abortController.signal
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();
            const content = data.message?.content || data.response || "No content returned.";

            setMessages(prev => [...prev, { role: 'assistant', content }]);
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Request aborted');
            } else {
                console.error('Error:', error);
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: `Connection error: ${error.message}`
                }]);
            }
        } finally {
            setIsLoading(false);
            setController(null);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-black text-gray-200">

            {/* Messages */}
            <main className="flex-1 overflow-y-auto w-full max-w-3xl mx-auto px-4 pt-10 pb-32">
                <div className="space-y-6">
                    {messages.map((msg, idx) => (
                        <div
                            key={idx}
                            className={`flex gap-4 animate-fade-in ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            {msg.role === 'assistant' && (
                                <div className="flex-shrink-0 w-8 h-8 rounded-full border border-gray-800 flex items-center justify-center bg-black">
                                    <Sparkles size={14} className="text-gray-500" />
                                </div>
                            )}

                            <div className={`max-w-[80%] leading-7 text-[15px] ${msg.role === 'user'
                                    ? 'bg-[#1a1a1a] text-white px-5 py-3 rounded-3xl rounded-br-md border border-[#333]'
                                    : 'text-gray-300 px-2 py-1' // Assistant looks more like plain text
                                }`}>
                                <div className="prose prose-invert prose-p:my-1 prose-pre:bg-[#111] prose-pre:border prose-pre:border-[#333] max-w-none">
                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                </div>
                            </div>

                            {msg.role === 'user' && (
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white text-black flex items-center justify-center">
                                    <User size={14} strokeWidth={2.5} />
                                </div>
                            )}
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex gap-4 animate-fade-in">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full border border-gray-800 flex items-center justify-center bg-black">
                                <Sparkles size={14} className="text-gray-500" />
                            </div>
                            <div className="flex items-center h-8">
                                <div className="typing-indicator">
                                    <div className="typing-dot"></div>
                                    <div className="typing-dot"></div>
                                    <div className="typing-dot"></div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </main>

            {/* Input Area */}
            <footer className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black to-transparent">
                <div className="max-w-3xl mx-auto relative">
                    <div className="relative flex items-end gap-2 bg-[#0a0a0a] border border-[#222] rounded-3xl p-2 shadow-2xl shadow-black/80 ring-1 ring-white/5 focus-within:ring-white/10 transition-all">
                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Message..."
                            rows={1}
                            className="flex-1 bg-transparent border-none text-white placeholder-gray-500 focus:ring-0 px-4 py-3 resize-none max-h-48 overflow-y-auto outline-none text-[15px]"
                            disabled={isLoading}
                        />
                        <div className="pb-1.5 pr-1.5">
                            {isLoading ? (
                                <button
                                    onClick={() => controller?.abort()}
                                    className="p-2 rounded-full bg-[#222] text-white hover:bg-[#333] transition-colors"
                                >
                                    <StopCircle size={18} />
                                </button>
                            ) : (
                                <button
                                    onClick={handleSubmit}
                                    disabled={!input.trim()}
                                    className="p-2 rounded-full bg-white text-black hover:bg-gray-200 disabled:opacity-30 disabled:hover:bg-white disabled:cursor-not-allowed transition-all"
                                >
                                    <SendHorizontal size={18} />
                                </button>
                            )}
                        </div>
                    </div>
                    <p className="text-center text-[10px] text-[#444] mt-3 font-medium">
                        LLAMA 3 &middot; OLLAMA
                    </p>
                </div>
            </footer>
        </div>
    )
}

export default App
