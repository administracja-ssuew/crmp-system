import { Link } from 'react-router-dom';

// Przykładowa baza dokumentów (tu wkleisz linki do swoich plików na Google Drive)
const DOCUMENTS = [
  {
    category: "Regulaminy",
    icon: "📜",
    items: [
      { name: "Regulamin Rezerwacji Przestrzeni", date: "Aktualizacja: 01.2026", link: "#" },
      { name: "Zasady CRED SSUEW", date: "Aktualizacja: 11.2025", link: "#" },
    ]
  },
  {
    category: "Wnioski do pobrania",
    icon: "📝",
    items: [
      { name: "Wniosek o organizację stoiska (PDF)", date: "Wymaga podpisu Kanclerza", link: "#" },
      { name: "Wniosek o salę 28J (Word)", date: "Dla Organizacji Studenckich", link: "#" },
      { name: "Wniosek o przedłużenie godzin", date: "Zgoda na nockę", link: "#" },
    ]
  },
  {
    category: "Instrukcje i Poradniki",
    icon: "💡",
    items: [
      { name: "Jak załatwić stoisko - Krok po Kroku", date: "Prezentacja", link: "#" },
      { name: "Mapa Kampusu - Kody Budynków", date: "Plik graficzny", link: "#" },
    ]
  }
];

export default function DocumentsPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-6 pb-20 pt-24 relative overflow-hidden">
      {/* Dekoracja w tle */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-slate-200/50 rounded-full blur-[120px] -z-10 translate-x-1/2 -translate-y-1/2"></div>

      <div className="max-w-5xl mx-auto">
        
        {/* NAGŁÓWEK */}
        <div className="mb-10 animate-fadeIn">
          <Link to="/" className="text-xs font-bold text-slate-400 hover:text-slate-600 mb-2 block">← Wróć do Menu</Link>
          <div className="flex items-center gap-4">
            <span className="text-4xl">📂</span>
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">Baza Wiedzy</h1>
              <p className="text-slate-500 font-medium mt-1">Wszystkie dokumenty, wnioski i regulaminy w jednym miejscu.</p>
            </div>
          </div>
        </div>

        {/* KATEGORIE DOKUMENTÓW */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-slideUp">
          {DOCUMENTS.map((section, idx) => (
            <div key={idx} className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6 flex flex-col h-full">
              <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                <span className="text-3xl">{section.icon}</span>
                <h2 className="text-xl font-black text-slate-800">{section.category}</h2>
              </div>
              
              <div className="space-y-3 flex-grow">
                {section.items.map((doc, docIdx) => (
                  <a 
                    key={docIdx} 
                    href={doc.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="group flex flex-col p-4 rounded-2xl border border-slate-100 hover:border-blue-300 hover:bg-blue-50/50 transition-all"
                  >
                    <span className="font-bold text-slate-700 group-hover:text-blue-700 transition-colors">{doc.name}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">{doc.date}</span>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}