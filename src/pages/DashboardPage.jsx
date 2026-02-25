import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();
  // Wyciągamy imię (lub fallback)
  const firstName = user?.displayName ? user.displayName.split(' ')[0] : 'Użytkowniku';

  // === KOMPONENT POMOCNICZY KAFELKA (Żeby nie kopiować kodu 4 razy) ===
  const Card = ({ to, title, subtitle, icon, colorFrom, colorTo, buttonText }) => (
    <Link to={to} className="group relative h-64 md:h-72 rounded-[2.5rem] overflow-hidden shadow-xl transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-900/20">
      
      {/* TŁO GRADIENTOWE */}
      <div className={`absolute inset-0 bg-gradient-to-br ${colorFrom} ${colorTo} group-hover:scale-110 transition-transform duration-700`}></div>
      
      {/* DEKORACJA (Plama światła) */}
      <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-colors"></div>
      
      {/* TREŚĆ KARTY */}
      <div className="relative h-full flex flex-col items-center justify-center p-6 text-center z-10">
        
        {/* IKONA */}
        <div className="w-14 h-14 md:w-16 md:h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-2xl md:text-3xl mb-4 shadow-inner border border-white/30 group-hover:rotate-12 transition-transform duration-300">
          {icon}
        </div>
        
        {/* TYTUŁY */}
        <h2 className="text-xl md:text-2xl font-black text-white mb-1 tracking-tight leading-tight">{title}</h2>
        <p className="text-white/80 font-bold text-[10px] md:text-xs uppercase tracking-widest mb-6">{subtitle}</p>
        
        {/* PRZYCISK (Pojawia się po najechaniu) */}
        <div className="px-6 py-2 bg-white text-slate-900 rounded-full text-[10px] font-black uppercase tracking-widest opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shadow-xl">
          {buttonText}
        </div>
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-slate-50">
      
      {/* === TŁO (To co miałeś wcześniej) === */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url('/logo.png')`, backgroundRepeat: 'no-repeat', backgroundPosition: 'center', backgroundSize: '80%', filter: 'grayscale(100%)' }}></div>
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-slate-100/50 to-blue-100/30 pointer-events-none z-0"></div>

      <div className="relative z-10 w-full max-w-5xl flex flex-col items-center">
        
        {/* === NAGŁÓWEK === */}
        <header className="text-center mb-10 animate-fadeIn">
          <div className="inline-block px-4 py-1 mb-4 rounded-full border border-blue-200 bg-blue-50/80 backdrop-blur-sm">
            <span className="text-xs font-black tracking-[0.2em] text-blue-600 uppercase">Witaj, {firstName} 👋</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900 leading-none">
            Centralny Rejestr <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-700">Materiałów Promocyjnych</span>
          </h1>
          <p className="mt-4 text-sm md:text-base font-medium text-slate-500 max-w-2xl mx-auto hidden md:block">
            Wybierz moduł poniżej, aby zarządzać zasobami UEW.
          </p>
        </header>

        {/* === SIATKA 4 KAFELKÓW === */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full animate-slideUp">
          
          {/* 1. MAPA (Niebieska) */}
          <Card 
            to="/mapa" 
            icon="🗺️" 
            title="Mapa Kampusu" 
            subtitle="Banery i Plakaty" 
            colorFrom="from-blue-500" 
            colorTo="to-blue-700" 
            buttonText="Otwórz Mapę" 
          />
          
          {/* 2. REJESTR (Fioletowy) */}
          <Card 
            to="/rejestr" 
            icon="📋" 
            title="Rejestr Stoisk" 
            subtitle="Rezerwacje A, B, C, CKU" 
            colorFrom="from-indigo-600" 
            colorTo="to-purple-800" 
            buttonText="Sprawdź Terminy" 
          />

          {/* 3. KALENDARZ (Szmaragdowy/Zielony - nowy kolor!) */}
          <Card 
            to="/kalendarz-wybor" 
            icon="📅" 
            title="Kalendarz Przestrzeni" 
            subtitle="Sale i Aula (28J)" 
            colorFrom="from-emerald-500" 
            colorTo="to-teal-700" 
            buttonText="Wybierz Tryb" 
          />

          {/* 4. DOKUMENTY (Szary/Grafitowy - nowy kolor!) */}
          <Card 
            to="/dokumenty" 
            icon="📂" 
            title="Baza Wiedzy" 
            subtitle="Regulaminy i Zarządzenia" 
            colorFrom="from-slate-600" 
            colorTo="to-slate-800" 
            buttonText="Przeglądaj Pliki" 
          />

        </div>

        {/* === STOPKA === */}
        <footer className="mt-12 opacity-50 flex flex-col items-center gap-2">
            <div className="h-[1px] w-10 bg-slate-300"></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Powered by Samorząd Studentów UEW</p>
        </footer>
      </div>
    </div>
  );
}