import { useState, useRef, useEffect } from 'react';
import { KNOWLEDGE_BASE } from './knowledge';

export default function AIBot() {
  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Dzień dobry! Jestem Twoim inteligentnym asystentem CRA. Znam regulaminy SSUEW i chętnie pomogę. O co chcesz zapytać?", sender: 'bot' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const systemInstruction = KNOWLEDGE_BASE;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

const fetchGeminiResponse = async (userText, currentMessages) => {
    if (!API_KEY) return "BŁĄD: Brak klucza API w konfiguracji Vercel.";

    try {
      const formattedHistory = currentMessages.map(msg => ({
        role: msg.sender === 'bot' ? 'model' : 'user',
        parts: [{ text: msg.text }]
      }));
      formattedHistory.push({ role: 'user', parts: [{ text: userText }] });
      const apiContents = formattedHistory.slice(1); 

      // Używamy v1beta, która najlepiej obsługuje instrukcje systemowe
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: apiContents,
          systemInstruction: { 
            parts: [{ text: systemInstruction }] 
          }
        })
      });

      const data = await response.json();
      
      if (data.error) {
        console.error("Szczegóły błędu:", data.error);
        return `Błąd Google AI: ${data.error.message}`;
      }
      
      return data.candidates[0].content.parts[0].text;
      
    } catch (error) {
      return "Błąd połączenia. Sprawdź sieć.";
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

  const formatMessage = (text) => {
    return text.split('\n').map((line, lineIndex) => (
      <span key={lineIndex} className="block mb-1">
        {line.split('**').map((part, i) => i % 2 === 1 ? <strong key={i} className="font-black text-slate-800">{part}</strong> : part)}
      </span>
    ));
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
      {isOpen && (
        <div className="w-[350px] md:w-[400px] h-[550px] bg-slate-50 rounded-[2.5rem] shadow-2xl border border-slate-200/60 mb-4 flex flex-col overflow-hidden animate-slideUp ring-1 ring-black/5">
          <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 p-5 flex items-center justify-between z-10">
            <div className="flex items-center gap-4">
              <div className="relative flex items-center justify-center w-12 h-12 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-2xl shadow-inner">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div>
                <h3 className="font-black text-slate-800 text-sm tracking-wide">CRA Legal AI</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block"></span> Wiedza Prawna
                </p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="flex-1 p-5 overflow-y-auto bg-slate-50 flex flex-col gap-4">
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.sender === 'bot' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center mr-2 shrink-0 shadow-md">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  </div>
                )}
                <div className={`max-w-[80%] p-4 rounded-3xl text-[13px] leading-relaxed shadow-sm ${
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
                <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse flex items-center justify-center mr-2 shrink-0"></div>
                <div className="bg-white border border-slate-100 px-5 py-4 rounded-3xl rounded-bl-sm shadow-sm flex gap-1.5 items-center">
                  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                  <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-100 flex gap-2 z-10">
            <input 
              type="text" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Zapytaj o regulamin..."
              className="flex-1 bg-slate-100/50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:border-indigo-500 transition-all"
            />
            <button 
              type="submit"
              disabled={!inputValue.trim() || isTyping}
              className="bg-indigo-600 text-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
            >
              ➤
            </button>
          </form>
        </div>
      )}

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-gradient-to-tr from-violet-600 to-indigo-600 text-white rounded-full shadow-xl flex items-center justify-center text-3xl hover:scale-110 transition-transform shadow-indigo-500/40"
      >
        {isOpen ? '✕' : '✨'}
      </button>
    </div>
  );
}