import { useState, useRef, useEffect } from 'react';

export default function AIBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Cześć! Jestem Asystentem AI systemu CRA. Znam na pamięć Regulamin Gospodarowania Sprzętem SSUEW. W czym mogę pomóc?", sender: 'bot' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Automatyczne scrollowanie do najnowszej wiadomości
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // === BAZA WIEDZY BOTA (Symulacja RAG - Retrieval-Augmented Generation) ===
  const getBotResponse = (input) => {
    const text = input.toLowerCase();
    
    if (text.includes('zniszcz') || text.includes('zepsu') || text.includes('uszkodz')) {
      return "Zgodnie z § 31 Regulaminu, każde uszkodzenie musi zostać udokumentowane Protokołem Szkody sporządzonym niezwłocznie po zdarzeniu. Naprawienie szkody następuje poprzez przywrócenie do stanu poprzedniego, a odpowiedzialność ponosisz solidarnie z organizacją.";
    }
    if (text.includes('zgubi') || text.includes('kradzież') || text.includes('ukrad')) {
      return "W przypadku kradzieży lub zgubienia (§ 31), Korzystający zobowiązany jest do natychmiastowego zawiadomienia Policji i dostarczenia do Biura notatki urzędowej. Brak zgłoszenia traktowany jest jako domniemanie przywłaszczenia mienia.";
    }
    if (text.includes('spóźn') || text.includes('kara') || text.includes('karencja') || text.includes('oddani')) {
      return "Zgodnie z § 32 Regulaminu, w przypadku opóźnienia w zwrocie sprzętu, Dysponent nakłada blokadę na wypożyczenia (karencję) dla danego podmiotu na okres nie krótszy niż 30 dni. Trafiacie wtedy na tzw. Czarną Listę.";
    }
    if (text.includes('podpis') || text.includes('kto')) {
      return "Osoba podpisująca Protokół (Reprezentant) przyjmuje na siebie odpowiedzialność solidarną z organizacją (art. 366 KC). Oznacza to, że SSUEW może dochodzić roszczeń bezpośrednio z majątku osobistego tej osoby (§ 3).";
    }
    if (text.includes('sbrz') || text.includes('znalezion') || text.includes('zgub')) {
      return "Samorządowe Biuro Rzeczy Znalezionych przechowuje rzeczy o wartości poniżej 200 PLN przez 30 dni. Po tym terminie (termin zawity), rzeczy przechodzą na własność SSUEW i są przekazywane na cele charytatywne lub utylizowane (§ 38).";
    }
    if (text.includes('brudn') || text.includes('czyszcz') || text.includes('namiot')) {
      return "Sprzęt PROMOCYJNY (np. namioty) musi zostać zwrócony czysty i suchy. Zgodnie z § 28, zwrot sprzętu zabrudzonego traktowany jest jako zwrot nieskuteczny, a koszty czyszczenia (np. w pralni chemicznej) pokrywa Korzystający.";
    }

    return "Przeszukuję bazę dokumentów... Skontaktuj się z Dysponentem ds. Administracji SSUEW, aby uzyskać dokładną odpowiedź na to nietypowe zapytanie.";
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // Dodanie wiadomości użytkownika
    const newMessages = [...messages, { text: inputValue, sender: 'user' }];
    setMessages(newMessages);
    setInputValue('');
    setIsTyping(true);

    // Symulacja myślenia AI i odpowiedź
    setTimeout(() => {
      const response = getBotResponse(inputValue);
      setMessages([...newMessages, { text: response, sender: 'bot' }]);
      setIsTyping(false);
    }, 1500); // 1.5 sekundy myślenia
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
      
      {/* OKNO CZATU */}
      {isOpen && (
        <div className="w-[350px] h-[500px] bg-white rounded-3xl shadow-2xl border border-slate-200 mb-4 flex flex-col overflow-hidden animate-slideUp">
          
          {/* Nagłówek czatu */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4 flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-xl backdrop-blur-md border border-white/30">
                🤖
              </div>
              <div>
                <h3 className="font-black text-sm leading-tight">CRA AI-Asystent</h3>
                <p className="text-[10px] text-blue-100 font-bold uppercase tracking-widest">Baza Wiedzy SSUEW</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/70 hover:text-white transition-colors">
              ✕
            </button>
          </div>

          {/* Obszar wiadomości */}
          <div className="flex-1 p-4 overflow-y-auto bg-slate-50 flex flex-col gap-3">
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                  msg.sender === 'user' 
                    ? 'bg-blue-600 text-white rounded-br-sm' 
                    : 'bg-white border border-slate-200 text-slate-700 rounded-bl-sm shadow-sm'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            
            {/* Animacja pisania */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-bl-sm shadow-sm flex gap-1">
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Pole wprowadzania */}
          <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-100 flex gap-2">
            <input 
              type="text" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Zadaj pytanie..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
            <button 
              type="submit"
              disabled={!inputValue.trim() || isTyping}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
            >
              ➤
            </button>
          </form>
        </div>
      )}

      {/* PRZYCISK WYWOŁUJĄCY BOTA */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-full shadow-2xl shadow-blue-900/50 flex items-center justify-center text-3xl hover:scale-110 transition-transform border-4 border-white"
      >
        {isOpen ? '✕' : '✨'}
      </button>
    </div>
  );
}