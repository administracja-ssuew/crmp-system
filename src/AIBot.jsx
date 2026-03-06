// Wymuszenie zmiany 

import { useState, useRef, useEffect } from 'react';
import { KNOWLEDGE_BASE } from './knowledge';

export default function AIBot() {
  // Pobieranie klucza z bezpiecznych zmiennych środowiskowych Vite
  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { 
      text: "Dzień dobry! Jestem Twoim inteligentnym asystentem CRA. Znam regulaminy SSUEW i chętnie pomogę Ci w sprawach sprzętowych lub statutowych. O co chcesz zapytać?", 
      sender: 'bot' 
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Podpięcie wiedzy z pliku knowledge.js
  const systemInstruction = KNOWLEDGE_BASE;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const fetchGeminiResponse = async (userText, currentMessages) => {
    try {
      const formattedHistory = currentMessages.map(msg => ({
        role: msg.sender === 'bot' ? 'model' : 'user',
        parts: [{ text: msg.text }]
      }));
      
      formattedHistory.push({ role: 'user', parts: [{ text: userText }] });
      
      // Pomijamy powitanie w kontekście, by nie marnować tokenów
      const apiContents = formattedHistory.slice(1); 

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { 
            parts: [{ text: systemInstruction }] 
          },
          contents: apiContents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
          }
        })
      });

      const data = await response.json();
      
      if (data.error) {
        console.error("Błąd API Gemini:", data.error);
        return "Przepraszam, mam problem z połączeniem z bazą wiedzy. Spróbuj ponownie za moment.";
      }
      
      return data.candidates[0].content.parts[0].text;
      
    } catch (error) {
      console.error("Błąd sieci:", error);
      return "Wystąpił błąd sieciowy. Upewnij się, że masz połączenie z internetem.";
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isTyping) return;

    const userMessage = inputValue;
    const newMessages = [...messages, { text: userMessage, sender: 'user' }];
    
    setMessages(newMessages);
    setInputValue('');
    setIsTyping(true);

    const aiResponse = await fetchGeminiResponse(userMessage, newMessages);
    
    setMessages(prev => [...prev, { text: aiResponse, sender: 'bot' }]);
    setIsTyping(false);
  };

  // Funkcja formatująca tekst (obsługa Markdown i linii)
  const formatMessage = (text) => {
    return text.split('\n').map((line, lineIndex) => (
      <span key={lineIndex} className="block mb-1">
        {line.split('**').map((part, i) => (
          i % 2 === 1 ? <strong key={i} className="font-black text-slate-800">{part}</strong> : part
        ))}
      </span>
    ));
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
      {isOpen && (
        <div className="w-[350px] md:w-[400px] h-[550px] bg-slate-50 rounded-[2.5rem] shadow-2xl border border-slate-200/60 mb-4 flex flex-col overflow-hidden animate-slideUp ring-1 ring-black/5">
          
          {/* Header */}
          <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 p-5 flex items-center justify-between z-10">
            <div className="flex items-center gap-4">
              <div className="relative flex items-center justify-center w-12 h-12 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-2xl shadow-inner shadow-white/20">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div>
                <h3 className="font-black text-slate-800 text-sm tracking-wide">CRA Legal AI</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> System Aktywny
                </p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all hover:rotate-90">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-5 overflow-y-auto bg-slate-50/50 flex flex-col gap-4">
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.sender === 'bot' && (
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mr-2 shrink-0 shadow-sm">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  </div>
                )}
                <div className={`max-w-[85%] p-4 rounded-3xl text-[13px] leading-relaxed shadow-sm transition-all ${
                  msg.sender === 'user' 
                    ? 'bg-indigo-600 text-white rounded-br-sm' 
                    : 'bg-white border border-slate-100 text-slate-600 rounded-bl-sm'
                }`}>
                  {formatMessage(msg.text)}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start items-center">
                <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse mr-2 shrink-0"></div>
                <div className="bg-white border border-slate-100 px-5 py-4 rounded-3xl rounded-bl-sm shadow-sm flex gap-1.5 items-center">
                  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-100 flex gap-2">
            <input 
              type="text" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Jakie masz pytanie?"
              className="flex-1 bg-slate-100/50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
            />
            <button 
              type="submit"
              disabled={!inputValue.trim() || isTyping}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-lg hover:shadow-indigo-500/40"
            >
              <svg className="w-5 h-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
        </div>
      )}
s
      {/* Floating Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative group flex items-center justify-center w-16 h-16 bg-gradient-to-tr from-violet-600 via-indigo-600 to-blue-600 text-white rounded-full transition-all duration-300 hover:scale-110 shadow-xl hover:shadow-indigo-500/50"
      >
        <div className="absolute inset-0 rounded-full border-2 border-white/20 animate-ping opacity-20"></div>
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
        ) : (
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        )}
      </button>
    </div>
  );
}