import { useState, useRef, useEffect } from 'react';

export default function AIBot() {
  // ==========================================
  // TUTAJ WKLEJ SWÓJ KLUCZ API OD GOOGLE
  // ==========================================
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Cześć! Jestem Asystentem AI systemu CRA. Znam na pamięć Regulamin Gospodarowania Sprzętem SSUEW. W czym mogę pomóc?", sender: 'bot' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Ukryty "Mózg" bota - instrukcja systemowa
  const systemInstruction = `
    Jesteś oficjalnym asystentem AI Samorządu Studentów Uniwersytetu Ekonomicznego we Wrocławiu (SSUEW).
    Twoim zadaniem jest odpowiadanie na pytania studentów dotyczące procedur wypożyczania sprzętu.
    Bądź profesjonalny, uprzejmy, ale bardzo stanowczy w kwestiach prawnych. Zawsze opieraj się na poniższych zasadach Regulaminu:
    
    1. ODPOWIEDZIALNOŚĆ: Za sprzęt odpowiada się solidarnie. Osoba, która składa podpis na e-Protokole z ramienia organizacji, odpowiada za naprawienie szkody z własnego majątku osobistego (art. 366 KC).
    2. SZKODY I ZNISZCZENIA (Załącznik nr 8): Każde uszkodzenie musi być niezwłocznie zgłoszone. Sporządza się Protokół Szkody. Student/Organizacja ma obowiązek kupić nowy sprzęt o takich samych lub lepszych parametrach, lub zapłacić za naprawę w autoryzowanym serwisie.
    3. KRADZIEŻ/ZGUBIENIE: Należy natychmiast zgłosić to na Policję i dostarczyć notatkę do Biura SSUEW. W przeciwnym razie traktowane jest to jako przywłaszczenie.
    4. KARY I KARENCJA: Za spóźnienie ze zwrotem nakładana jest blokada na kolejne wypożyczenia (Czarna Lista) na minimum 30 dni.
    5. STAN ZWRACANEGO SPRZĘTU: Namioty i sprzęt muszą być czyste i suche. Brudny namiot to "zwrot nieskuteczny", a koszty pralni chemicznej pokrywa organizacja.
    6. RZECZY ZNALEZIONE (SBRZ): Biuro Rzeczy Znalezionych SSUEW przechowuje rzeczy o wartości poniżej 200 PLN przez równe 30 dni. Po tym terminie przechodzą one na własność Samorządu (utylizacja lub cele charytatywne).
    
    Odpowiadaj zwięźle. Jeśli ktoś zapyta o coś niezwiązanego z SSUEW lub uczelnią, grzecznie odmów odpowiedzi.
  `;

  // Automatyczne scrollowanie do najnowszej wiadomości
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Funkcja komunikacji z prawdziwym AI od Google
  const fetchGeminiResponse = async (userText, currentMessages) => {
    try {
      // Formatowanie historii czatu dla Gemini
      const formattedHistory = currentMessages.map(msg => ({
        role: msg.sender === 'bot' ? 'model' : 'user',
        parts: [{ text: msg.text }]
      }));

      // Dodajemy nową wiadomość użytkownika
      formattedHistory.push({ role: 'user', parts: [{ text: userText }] });

      // Pomijamy pierwszą wiadomość powitalną, żeby nie psuła kontekstu
      const apiContents = formattedHistory.slice(1); 

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents: apiContents
        })
      });

      const data = await response.json();
      
      if (data.error) {
        console.error("Błąd API:", data.error);
        return "Przepraszam, mam chwilowe problemy z połączeniem z głównym serwerem bazy danych SSUEW. Spróbuj za chwilę.";
      }

      // Zwracamy wygenerowany tekst
      return data.candidates[0].content.parts[0].text;
      
    } catch (error) {
      console.error("Błąd sieci:", error);
      return "Brak połączenia z siecią. Sprawdź swoje połączenie internetowe.";
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage = inputValue;
    const newMessages = [...messages, { text: userMessage, sender: 'user' }];
    
    setMessages(newMessages);
    setInputValue('');
    setIsTyping(true);

    // Wywołanie prawdziwego AI
    const aiResponse = await fetchGeminiResponse(userMessage, messages);
    
    setMessages([...newMessages, { text: aiResponse, sender: 'bot' }]);
    setIsTyping(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
      
      {isOpen && (
        <div className="w-[350px] md:w-[400px] h-[500px] bg-white rounded-3xl shadow-2xl border border-slate-200 mb-4 flex flex-col overflow-hidden animate-slideUp">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4 flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-xl backdrop-blur-md border border-white/30">
                🤖
              </div>
              <div>
                <h3 className="font-black text-sm leading-tight">CRA AI-Asystent</h3>
                <p className="text-[10px] text-blue-100 font-bold uppercase tracking-widest">Powered by Google Gemini</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/70 hover:text-white transition-colors text-xl font-black">
              ✕
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto bg-slate-50 flex flex-col gap-3">
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3.5 rounded-2xl text-[13px] leading-relaxed ${
                  msg.sender === 'user' 
                    ? 'bg-blue-600 text-white rounded-br-sm shadow-md' 
                    : 'bg-white border border-slate-200 text-slate-700 rounded-bl-sm shadow-sm'
                }`}>
                  {/* Formatowanie pogrubień z Markdowna */}
                  {msg.text.split('**').map((part, i) => i % 2 === 1 ? <strong key={i}>{part}</strong> : part)}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-bl-sm shadow-sm flex gap-1.5 items-center">
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-100 flex gap-2">
            <input 
              type="text" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Zadaj pytanie (np. o uszkodzenia)..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
            />
            <button 
              type="submit"
              disabled={!inputValue.trim() || isTyping}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white w-12 h-12 rounded-xl flex items-center justify-center transition-colors shadow-lg"
            >
              ➤
            </button>
          </form>
        </div>
      )}

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-full shadow-2xl shadow-blue-900/50 flex items-center justify-center text-3xl hover:scale-110 transition-transform border-4 border-white"
      >
        {isOpen ? '✕' : '✨'}
      </button>
    </div>
  );
}