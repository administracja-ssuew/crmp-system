import { loginWithGoogle } from "../firebase";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { authError } = useAuth();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 relative overflow-hidden">
      
      {/* TŁO */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url('/logo.png')`, backgroundRepeat: 'no-repeat', backgroundPosition: 'center', backgroundSize: '80%', filter: 'grayscale(100%)' }}></div>
      <div className="absolute top-20 left-[15%] w-32 h-32 bg-blue-500/10 rounded-3xl blur-xl animate-bounce [animation-duration:5s]"></div>
      
      <div className="relative z-10 w-full max-w-xl p-6">
        <div className="bg-white/70 backdrop-blur-xl border border-white p-12 rounded-[3rem] shadow-2xl text-center">
          
          <div className="mb-10 inline-flex items-center justify-center w-24 h-24 bg-white rounded-[2rem] shadow-xl border border-slate-50">
            {/* Upewnij się, że masz plik logo.png w folderze public */}
            <img src="/logo.png" alt="UEW" className="w-16 h-16 object-contain" onError={(e) => e.target.style.display = 'none'} />
          </div>

          <div className="space-y-2 mb-8">
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-tight">
              Centralny Rejestr <br/> Materiałów Promocyjnych
            </h1>
            <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px]">System administracyjny UEW</p>
          </div>

          {/* === LOGIKA BŁĘDÓW I DOSTĘPU === */}
          {authError ? (
            <div className="mb-8 animate-shake">
              <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-sm font-bold rounded-2xl mb-4">
                ⛔ {authError}
              </div>
              
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <p className="text-slate-500 text-xs mb-4 font-medium">Nie masz dostępu? Złóż wniosek do administratora.</p>
                
                <a 
                  href="https://forms.google.com/twoj-link-do-wniosku" 
                  target="_blank"
                  rel="noreferrer"
                  className="block w-full bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition shadow-lg mb-3"
                >
                  📝 Złóż wniosek o dostęp
                </a>

                <button 
                  onClick={() => window.location.reload()} 
                  className="text-xs text-blue-600 hover:text-blue-800 font-bold underline"
                >
                  Spróbuj zalogować się ponownie
                </button>
              </div>
            </div>
          ) : (
            <button 
              onClick={loginWithGoogle}
              className="w-full group relative flex items-center justify-center gap-4 bg-slate-900 text-white px-8 py-5 rounded-2xl font-black transition-all hover:bg-blue-600 hover:shadow-2xl hover:shadow-blue-500/30 active:scale-95"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/hf/google.svg" alt="Google" className="w-6 h-6 bg-white rounded-full p-0.5" />
              Zaloguj przez Google UEW
            </button>
          )}

          <footer className="mt-12 pt-8 border-t border-slate-100">
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">Powered by Samorząd Studentów UEW</p>
          </footer>
        </div>
      </div>
    </div>
  );
}